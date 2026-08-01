/**
 * Tests lógica Ejecución Meta Anual (helpers espejo del informe IC).
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}

function icAggregarHistorico2026_1(rows) {
  const map = {};
  (rows || []).forEach((row) => {
    const c = row._cols || [];
    const raw = String(row.Sede || c[13] || '').trim();
    if (!raw || /^TOTAL/i.test(raw)) return;
    const sede = raw;
    const val = icNum(row.Valor || c[17]);
    if (!map[sede]) map[sede] = { n: 0, v: 0 };
    map[sede].n++;
    map[sede].v += val;
  });
  return map;
}

function construirEjecucionSimple(filasColoc, metaMap, hist, mapaSG, diasTrans = 10, diasRest = 20) {
  const rows = [];
  let tot = { metaN: 0, execN: 0, s1N: 0, s2N: 0, projN: 0 };
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
    tot.metaN += metaN;
    tot.s1N += h.n;
    tot.s2N += s2N;
    tot.execN += execN;
    tot.projN += projN;
  });
  return { rows, tot };
}

// hist aggregation
const histRows = [
  { Sede: 'COA Bello', Valor: 1000, _cols: [null, null, null, null, null, null, null, null, null, null, null, null, null, 'COA Bello', null, null, null, 1000] },
  { Sede: 'COA Bello', Valor: 500, _cols: [null, null, null, null, null, null, null, null, null, null, null, null, null, 'COA Bello', null, null, null, 500] },
];
const hist = icAggregarHistorico2026_1(histRows);
assert.equal(hist['COA Bello'].n, 2);
assert.equal(hist['COA Bello'].v, 1500);

const filas = [{ sede: 'COA Bello', acum_v: 2000 }];
const metaMap = { 'COA Bello': { meta_anual_n: 100, meta_anual_v: 1e6 } };
const mapaSG = { 'COA Bello': { sig: 8, glpi: 2 } };
const d = construirEjecucionSimple(filas, metaMap, hist, mapaSG);
assert.equal(d.rows[0].s2N, 10);
assert.equal(d.rows[0].execN, 12);
assert.equal(d.rows[0].s1N, 2);
assert.ok(d.rows[0].projN > d.rows[0].execN);

console.log('test-meta-anual.mjs: OK');
