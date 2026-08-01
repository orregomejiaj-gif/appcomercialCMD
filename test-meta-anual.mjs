/**
 * Tests lógica Ejecución Meta Anual (helpers espejo del informe IC).
 */
import assert from 'node:assert/strict';

function icNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace('%', '').replace(/,/g, '').replace('+', '')) || 0;
}

function icIndicesMetaAnualDesdeHdr() {
  return { n: 1, v: 2, mode: 'bc' };
}

function icLeerMetaAnualFila(t, idx) {
  t = t || [];
  idx = idx || { n: 1, v: 2 };
  return { n: Math.round(icNum(t[idx.n])), v: Math.round(icNum(t[idx.v])) };
}

const idx = icIndicesMetaAnualDesdeHdr();
assert.equal(idx.n, 1);
assert.equal(idx.v, 2);
assert.deepEqual(icLeerMetaAnualFila([null, 78789, 1e9], idx), { n: 78789, v: 1e9 });

function construirEjecucionSimple(s1N, sig, glpi, metaN) {
  const s2N = sig + glpi;
  const execN = s1N + s2N;
  return { s1N, s2N, execN, pct: metaN > 0 ? Math.round((execN / metaN) * 100) : 0 };
}

const ref = construirEjecucionSimple(28790, 12000, 3058, 78789);
assert.equal(ref.s2N, 15058);
assert.equal(ref.execN, 43848);

console.log('test-meta-anual.mjs: OK');
