/**
 * Tests Ejecución Meta Anual v5.4.112
 * Meta: META TOTAL AÑO  · S1: histórico · S2: SIGEC+GLPI · sedes canónicas
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}
function icStr(v){ return v==null?'':String(v).trim(); }

const EQ = {
  'SEDE PRINCIPAL BOGOTÁ':'COA Engativa Pres',
  'SEDE PRINCIPAL BOGOTA':'COA Engativa Pres',
  'CT CI COPROGRESO':'COA Usaquen',
  'CO RAFAEL URIBE - SABIDURIA':'COA Santafe',
  'APARTADÓ':'Urabá',
  'APARTADO':'Urabá',
  'CO BOSA':'COA Bosa',
};

function normalizarSedeColocacion(nombreCrudo) {
  var n = (nombreCrudo || '').toString().trim();
  if(!n) return '';
  if(EQ[n.toUpperCase()]) return EQ[n.toUpperCase()];
  var sin = n.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(EQ[sin]) return EQ[sin];
  return n;
}

const CATALOG = ['COA Engativa Pres','COA Usaquen','COA Santafe','COA Bosa','Urabá','COA Bello'];

function icNormSedeKey(s){
  return icStr(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/^(coa|co|cr|ct|cu|cs|cp)\s+/i,'')
    .replace(/[^a-z0-9]/g,'');
}
function icMatchSede(a,b){
  if(!a||!b) return false;
  var x=icStr(a).toLowerCase(), y=icStr(b).toLowerCase();
  return x===y||x.indexOf(y)>=0||y.indexOf(x)>=0;
}
function icResolverSedeColoc(raw, lista){
  var norm=normalizarSedeColocacion(raw);
  for(const c of lista){ if(icMatchSede(norm,c)) return c; }
  const kn=icNormSedeKey(norm);
  for(const c of lista){
    const kc=icNormSedeKey(c);
    if(kn&&kc&&(kn===kc||(kn.length>=4&&kc.length>=4&&(kn.indexOf(kc)>=0||kc.indexOf(kn)>=0)))) return c;
  }
  return '';
}
function icCanonSedeInforme(raw){
  const resolved=icResolverSedeColoc(raw, CATALOG);
  return resolved || normalizarSedeColocacion(raw) || icStr(raw);
}

// Equivalencias meta → catálogo
assert.equal(icCanonSedeInforme('Sede Principal Bogotá'), 'COA Engativa Pres');
assert.equal(icCanonSedeInforme('CT CI Coprogreso'), 'COA Usaquen');
assert.equal(icCanonSedeInforme('CO Rafael Uribe - Sabiduria'), 'COA Santafe');
assert.equal(icCanonSedeInforme('Apartadó'), 'Urabá');
assert.equal(icCanonSedeInforme('COA Engativa Pres'), 'COA Engativa Pres');

// Dedup: meta name + coloc name → una sola sede
function mergeSedes(names){
  const by={};
  names.forEach(n=>{ const c=icCanonSedeInforme(n); by[c]=1; });
  return Object.keys(by);
}
const merged=mergeSedes(['Sede Principal Bogotá','COA Engativa Pres','CT CI Coprogreso','COA Usaquen']);
assert.equal(merged.length, 2);
assert.ok(merged.includes('COA Engativa Pres'));
assert.ok(merged.includes('COA Usaquen'));

// S2 = SIGEC + GLPI (no ACUM P Actual)
function s2FromSigecGlpi(sig, glpi){ return Math.round((sig||0)+(glpi||0)); }
assert.equal(s2FromSigecGlpi(12000, 3058), 15058);
const exec = 28790 + s2FromSigecGlpi(12000, 3058);
assert.equal(exec, 43848);

console.log('test-meta-anual.mjs: OK');
