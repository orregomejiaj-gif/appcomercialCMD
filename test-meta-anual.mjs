/**
 * Tests lógica Ejecución Meta Anual (helpers espejo del informe IC).
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}

function icLeerMetaAnualFila(t) {
  t = t || [];
  let n = Math.round(icNum(t[1]));
  let v = Math.round(icNum(t[2]));
  const nFg = Math.round(icNum(t[5]));
  const vFg = Math.round(icNum(t[6]));
  if (nFg || vFg) return { n: nFg, v: vFg };
  if (n || v) return { n, v };
  return { n: 0, v: 0 };
}

assert.deepEqual(icLeerMetaAnualFila([null, 10, 100, 99, 99, 500, 6000]), { n: 500, v: 6000 });
assert.deepEqual(icLeerMetaAnualFila([null, 78789, 1e6]), { n: 78789, v: 1e6 });

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

function construirEjecucionSimple(filasColoc, metaMap, hist, diasTrans = 10, diasRest = 20) {
  const rows = [];
  filasColoc.forEach((r) => {
    const sede = r.sede;
    const s2N = Math.round(r.acum_n || 0);
    const s2V = Math.round(r.acum_v || 0);
    const h = hist[sede] || { n: 0, v: 0 };
    const metaN = (metaMap[sede] || {}).meta_anual_n || 0;
    const execN = h.n + s2N;
    const rateN = diasTrans > 0 ? s2N / diasTrans : 0;
    const projN = h.n + Math.round(s2N + rateN * diasRest);
    rows.push({ sede, metaN, s1N: h.n, s2N, execN, projN });
  });
  return { rows };
}

const informeRows = [
  { SEDE: 'COA Bello', PERIODO: '20261', _cols: ['COA Bello', '', '20261', 40, 500000] },
];
const histInf = icAggregarHistoricoColocPeriodo(informeRows);
assert.equal(histInf['COA Bello'].n, 40);

const filas = [{ sede: 'COA Bello', acum_n: 25, acum_v: 2000 }];
const metaMap = { 'COA Bello': { meta_anual_n: 100, meta_anual_v: 1e6 } };
const d = construirEjecucionSimple(filas, metaMap, histInf);
assert.equal(d.rows[0].s2N, 25);
assert.equal(d.rows[0].execN, 65);
assert.equal(d.rows[0].s1N, 40);
assert.ok(d.rows[0].projN > d.rows[0].execN);

console.log('test-meta-anual.mjs: OK');
