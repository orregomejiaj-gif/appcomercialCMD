/**
 * Tests lógica Ejecución Meta Anual (helpers espejo del informe IC).
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}

function icStr(v) {
  return v == null ? '' : String(v).trim();
}

function icEsHdrMetaMensual(hdr) {
  const s = (hdr || []).map(icStr).join('|').toUpperCase();
  return /MAYO\s+NRO|JUNIO\s+NRO|TOTAL META S2/.test(s);
}

function icEsColMetaValorHdr(u) {
  u = icStr(u).toUpperCase();
  return u.indexOf('VALOR') >= 0 || u.indexOf('K$') >= 0 || u.indexOf('$') >= 0;
}
function icEsColMetaNumHdr(u) {
  u = icStr(u).toUpperCase();
  return (/#|NRO|CRED|CRÉD/.test(u)) && !icEsColMetaValorHdr(u);
}

function icIndicesMetaAnualDesdeHdr(hdr) {
  let n = -1;
  let v = -1;
  hdr = hdr || [];
  for (let i = 0; i < hdr.length; i++) {
    const u = icStr(hdr[i]).toUpperCase();
    if (!u) continue;
    if ((/AÑO|ANUAL/.test(u) || /TOTAL.*AÑO/.test(u)) && icEsColMetaNumHdr(u)) n = i;
    if ((/AÑO|ANUAL/.test(u) || /TOTAL.*AÑO/.test(u)) && icEsColMetaValorHdr(u)) v = i;
  }
  if (n >= 0) return { n, v: v >= 0 ? v : n + 1, mode: 'anual' };
  if (!icEsHdrMetaMensual(hdr) && hdr.length >= 3) return { n: 1, v: 2, mode: 'bc' };
  if (icEsHdrMetaMensual(hdr)) {
    for (let i = 0; i < hdr.length; i++) {
      const l = icStr(hdr[i]).toUpperCase();
      if (l.indexOf('TOTAL') >= 0 && l.indexOf('S2') >= 0 && icEsColMetaNumHdr(l)) n = i;
      if (l.indexOf('TOTAL') >= 0 && l.indexOf('S2') >= 0 && icEsColMetaValorHdr(l)) v = i;
    }
    if (n >= 0) return { n, v: v >= 0 ? v : n + 1, mode: 's2total' };
  }
  return { n: 1, v: 2, mode: 'bc' };
}

function icLeerMetaAnualFila(t, idx) {
  t = t || [];
  idx = idx || { n: 1, v: 2 };
  const n = Math.round(icNum(t[idx.n]));
  const v = Math.round(icNum(t[idx.v]));
  return { n, v };
}

const hdrAnual = ['Sedes ', 'Meta # Año', 'Meta $ Año'];
const idxAnual = icIndicesMetaAnualDesdeHdr(hdrAnual);
assert.equal(idxAnual.mode, 'anual');
assert.deepEqual(icLeerMetaAnualFila([null, 78789, 1e9], idxAnual), { n: 78789, v: 1e9 });

const hdrMensual = ['Sedes ', 'MAYO Nro. Créd.', 'Valor k$', 'JUNIO Nro. Créd.', 'Valor k$', 'JULIO Nro. Créd.', 'Valor k$'];
const idxM = icIndicesMetaAnualDesdeHdr(hdrMensual);
assert.equal(idxM.mode, 'bc');
assert.deepEqual(icLeerMetaAnualFila([null, 10, 100, 99, 99, 500, 6000], idxM), { n: 10, v: 100 });

function icMatchPeriodoColocHistorico(per) {
  const p = String(per || '').toUpperCase().replace(/\s/g, '');
  return p === '20261' || p === '202561' || p === '26S1' || p === 'S1-2026' || p === 'S1';
}

function icEsInformeColocHistorico(row) {
  if (!row) return false;
  const c = row._cols || [];
  const sede = String(row.SEDE || row.Sede || c[0] || '').trim();
  const per = String(row.PERIODO || c[2] || '').trim();
  const acum = icNum(row['ACUM CRED #'] || c[3]);
  if (sede.length > 2 && per.length > 0 && !/^TOTAL/i.test(sede)) return true;
  if (sede.length > 2 && acum > 0 && per.length > 0) return true;
  if (row.Radicado != null && row.Radicado !== '') return false;
  return false;
}

function icAggregarHistoricoColocPeriodo(rows) {
  const map = {};
  (rows || []).forEach((row) => {
    const c = row._cols || [];
    if (!icEsInformeColocHistorico(row)) return;
    const per = row.PERIODO || c[2];
    if (!icMatchPeriodoColocHistorico(per)) return;
    const sede = String(row.SEDE || c[0]).trim();
    const n = Math.round(icNum(row['ACUM CRED #'] || c[3]));
    const v = Math.round(icNum(row['ACUM VALOR $'] || c[4]));
    map[sede] = { n, v };
  });
  return map;
}

const informeRows = [
  { SEDE: 'COA Bello', PERIODO: '20261', _cols: ['COA Bello', '', '20261', 40, 500000] },
];
const histInf = icAggregarHistoricoColocPeriodo(informeRows);
assert.equal(histInf['COA Bello'].n, 40);

console.log('test-meta-anual.mjs: OK');
