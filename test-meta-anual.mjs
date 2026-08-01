/**
 * Tests lógica Ejecución Meta Anual (helpers espejo del informe IC).
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}

function icMatchPeriodoColocHistorico(per) {
  const p = String(per || '').toUpperCase().replace(/\s/g, '');
  return p === '20261' || p === '202561' || p === '26S1' || p === 'S1-2026';
}

function icEsInformeColocHistorico(row) {
  if (!row) return false;
  if (row.Radicado != null && row.Radicado !== '') return false;
  const c = row._cols || [];
  const sede = String(row.SEDE || row.Sede || c[0] || '').trim();
  const per = String(row.PERIODO || c[2] || '').trim();
  return sede.length > 2 && per.length > 0 && !/^TOTAL/i.test(sede);
}

function icAggregarHistoricoColocPeriodo(rows, periodo) {
  const map = {};
  let trans = false;
  (rows || []).forEach((row) => {
    if (row && row.Radicado != null && row.Radicado !== '') trans = true;
  });
  (rows || []).forEach((row) => {
    const c = row._cols || [];
    if (icEsInformeColocHistorico(row)) {
      const per = row.PERIODO || c[2];
      if (!icMatchPeriodoColocHistorico(per)) return;
      const sede = String(row.SEDE || c[0]).trim();
      const n = Math.round(icNum(row['ACUM CRED #'] || c[3]));
      const v = Math.round(icNum(row['ACUM VALOR $'] || c[4]));
      map[sede] = { n, v };
      return;
    }
    if (!trans) return;
    const p1 = String(row.Periodo1 || c[10] || '');
    if (periodo === '20261' && p1 !== '202561') return;
    const rawT = String(row.Sede || c[13] || '').trim();
    if (!rawT) return;
    const val = icNum(row.Valor || c[17]);
    if (!map[rawT]) map[rawT] = { n: 0, v: 0 };
    map[rawT].n++;
    map[rawT].v += val;
  });
  return map;
}

function construirEjecucionSimple(filasColoc, metaMap, hist, mapaSG, diasTrans = 10, diasRest = 20) {
  const rows = [];
  filasColoc.forEach((r) => {
    const sede = r.sede;
    const sg = mapaSG[sede] || { sig: 0, glpi: 0 };
    const s2N = (sg.sig || 0) + (sg.glpi || 0);
    const h = hist[sede] || { n: 0, v: 0 };
    const metaN = (metaMap[sede] || {}).meta_anual_n || 0;
    const execN = h.n + s2N;
    const rateN = diasTrans > 0 ? s2N / diasTrans : 0;
    const projN = h.n + Math.round(s2N + rateN * diasRest);
    rows.push({ sede, metaN, s1N: h.n, s2N, execN, projN });
  });
  return { rows };
}

// informe histórico período 20261
const informeRows = [
  { SEDE: 'COA Bello', PERIODO: '20261', _cols: ['COA Bello', '', '20261', 40, 500000, 50, 600000] },
];
const histInf = icAggregarHistoricoColocPeriodo(informeRows, '20261');
assert.equal(histInf['COA Bello'].n, 40);
assert.equal(histInf['COA Bello'].v, 500000);

// transaccional Periodo1 202561
const transRows = [
  { Radicado: '1', Sede: 'COA Bello', Valor: 1000, Periodo1: '202561', _cols: [null, null, null, null, null, null, null, null, null, null, '202561', null, null, 'COA Bello', null, null, null, 1000] },
  { Radicado: '2', Sede: 'COA Bello', Valor: 500, Periodo1: '202561', _cols: [null, null, null, null, null, null, null, null, null, null, '202561', null, null, 'COA Bello', null, null, null, 500] },
  { Radicado: '3', Sede: 'COA Bello', Valor: 999, Periodo1: '202560', _cols: [null, null, null, null, null, null, null, null, null, null, '202560', null, null, 'COA Bello', null, null, null, 999] },
];
const histTr = icAggregarHistoricoColocPeriodo(transRows, '20261');
assert.equal(histTr['COA Bello'].n, 2);
assert.equal(histTr['COA Bello'].v, 1500);

const filas = [{ sede: 'COA Bello', acum_v: 2000 }];
const metaMap = { 'COA Bello': { meta_anual_n: 100, meta_anual_v: 1e6 } };
const mapaSG = { 'COA Bello': { sig: 8, glpi: 2 } };
const d = construirEjecucionSimple(filas, metaMap, histTr, mapaSG);
assert.equal(d.rows[0].s2N, 10);
assert.equal(d.rows[0].execN, 12);
assert.equal(d.rows[0].s1N, 2);
assert.ok(d.rows[0].projN > d.rows[0].execN);

console.log('test-meta-anual.mjs: OK');
