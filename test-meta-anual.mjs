/**
 * Tests Ejecución Meta Anual v5.4.114 — deuda S1 + Deuda+Meta S2
 */
import assert from 'node:assert/strict';

function deudaS1(meta, ejec) {
  return Math.max(0, Math.round(meta - ejec));
}
function retoS2(deuda, metaS2) {
  return deuda + metaS2;
}

assert.equal(deudaS1(43911, 28790), 15121);
assert.equal(deudaS1(100, 120), 0); // sobrante → deuda 0
assert.equal(retoS2(30, 80), 110);
assert.equal(retoS2(0, 80), 80);

console.log('test-meta-anual.mjs: OK');
