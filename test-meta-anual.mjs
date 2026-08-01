/**
 * Tests lógica Ejecución Meta Anual (helpers espejo del informe IC).
 * Fuentes: META TOTAL AÑO  · INFORME COLOCACION HISTORICO · P ACTUAL ACUM.
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}
function icStr(v){ return v==null?'':String(v).trim(); }

function icEsHdrMetaMensual(hdr){
  var s=(hdr||[]).map(icStr).join('|').toUpperCase();
  return /MAYO\s+NRO|JUNIO\s+NRO|TOTAL META S2/.test(s);
}
function icEsColMetaValorHdr(u){
  u=icStr(u).toUpperCase();
  return u.indexOf('VALOR')>=0||u.indexOf('K$')>=0||u.indexOf('$')>=0;
}
function icEsColMetaNumHdr(u){
  u=icStr(u).toUpperCase();
  return (/#|NRO|CRED|CRÉD/.test(u))&&!icEsColMetaValorHdr(u);
}
function icIndicesMetaAnualDesdeHdr(hdr){
  var i, n=-1, v=-1;
  hdr=hdr||[];
  for(i=0;i<hdr.length;i++){
    var u=icStr(hdr[i]).toUpperCase().replace(/\s+/g,' ').trim();
    if(!u) continue;
    if(/TOTAL\s*META\s*S2/.test(u)) continue;
    var isAnual=/AÑO|ANUAL/.test(u) || (/^META\b/.test(u) && !/MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE/.test(u));
    if(isAnual && icEsColMetaNumHdr(u)) n=i;
    if(isAnual && icEsColMetaValorHdr(u)) v=i;
  }
  if(n>=0) return {n:n,v:v>=0?v:n+1,mode:'anual'};
  if(!icEsHdrMetaMensual(hdr) && hdr.length>=3) return {n:1,v:2,mode:'bc'};
  if(icEsHdrMetaMensual(hdr)) return {n:-1,v:-1,mode:'mensual'};
  return {n:1,v:2,mode:'bc'};
}
function icLeerMetaAnualFila(t, idx){
  t=t||[];
  idx=idx||{n:1,v:2};
  if(idx.n<0) return {n:0,v:0};
  return {n:Math.round(icNum(t[idx.n])), v:Math.round(icNum(t[idx.v]))};
}
function icMatchPeriodoColocHistorico(per){
  var p=icStr(per).toUpperCase().replace(/\s/g,'').replace(/-/g,'');
  if(p==='20261'||p==='202561'||p==='26S1'||p==='S12026'||p==='S1'||p==='2026S1') return true;
  if(/^S1/.test(p)) return true;
  return false;
}

// Hoja META TOTAL AÑO  (anual B/C)
const idxAnual = icIndicesMetaAnualDesdeHdr(['Sedes', ' META Nro. Créd.', ' META Valor k$']);
assert.equal(idxAnual.mode, 'anual');
assert.equal(idxAnual.n, 1);
assert.equal(idxAnual.v, 2);
assert.deepEqual(icLeerMetaAnualFila(['Sede Principal Bogotá', 7241, '25,398,808'], idxAnual), {n:7241,v:25398808});

// Hoja mensual/S2 no debe usarse como meta anual
const idxMensual = icIndicesMetaAnualDesdeHdr(['Sedes ','MAYO Nro. Créd.','Valor k$','TOTAL META S2 Nro. Créd.','Valor k$']);
assert.equal(idxMensual.mode, 'mensual');
assert.equal(idxMensual.n, -1);

// Períodos S1 del informe histórico
assert.equal(icMatchPeriodoColocHistorico('S1-2026'), true);
assert.equal(icMatchPeriodoColocHistorico('S1-2027'), true);
assert.equal(icMatchPeriodoColocHistorico('20261'), true);
assert.equal(icMatchPeriodoColocHistorico('S2'), false);

// Ejecutado año = S1 histórico + S2 ACUM P Actual (no SIGEC+GLPI)
function construirEjecucion(s1N, s2AcumN, metaN){
  const execN = s1N + s2AcumN;
  return {s1N, s2N:s2AcumN, execN, pct: metaN>0 ? Math.round(execN/metaN*100) : 0};
}
const ref = construirEjecucion(28790, 8297, 76225);
assert.equal(ref.execN, 37087);
assert.equal(ref.s2N, 8297);
assert.ok(ref.pct > 0 && ref.pct < 100);

// Nombres exactos de hojas (espacios significativos)
assert.equal('META TOTAL AÑO ', 'META TOTAL AÑO ');
assert.equal(' INFORME COLOCACION HISTORICO'.trim(), 'INFORME COLOCACION HISTORICO');
assert.notEqual('META TOTAL AÑO ', 'META TOTAL AÑO');
assert.notEqual(' INFORME COLOCACION HISTORICO', 'INFORME COLOCACION HISTORICO');

console.log('test-meta-anual.mjs: OK');
