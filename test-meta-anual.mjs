/**
 * Tests Ejecución Meta Anual v5.4.113 — meta S1 + % cumplimiento
 */
import assert from 'node:assert/strict';

function pctS1(ejec, meta){
  return meta>0 ? Math.round(ejec/meta*100) : 0;
}
assert.equal(pctS1(28790, 43911), 66);
assert.equal(pctS1(3860, 3860), 100);
assert.equal(pctS1(0, 100), 0);

function semS1(pct){
  return pct>=100?'VERDE':pct>=85?'AMARILLO':pct>=70?'NARANJA':'ROJO';
}
assert.equal(semS1(66), 'ROJO');
assert.equal(semS1(100), 'VERDE');

console.log('test-meta-anual.mjs: OK');
