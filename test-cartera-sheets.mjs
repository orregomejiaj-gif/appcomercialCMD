#!/usr/bin/env node
/**
 * Tests cartera sede normalization + informe gestión acumulación (datos reales Sheets).
 */
import assert from 'node:assert/strict';

const REPO = '101-_Ru7mW8vGoDOyVH9THGOyCAjv5_D_LfMiqI-z-gQ';

const SEDE_EQUIVALENCIAS_COLOCACION = {
  'BELLO':'COA Bello','COA BELLO':'COA Bello','IBAGUE':'CR Ibague','CU IBAGUE':'CR Ibague',
  'ENGATIVA PRESENCIAL':'COA Engativa Pres','COA ENGATIVA PRES':'COA Engativa Pres',
  'REC. UNIMINUTO VIRTUAL':'Virtual y Distancia','COA VIRTUAL':'Virtual y Distancia',
  'SOACHA':'CR Soacha','CU SOACHA':'CR Soacha','GIRARDOT':'COA Girardot',
  'BARRANQUILLA':'CR Barranquilla','COA BARRANQUILLA':'CR Barranquilla',
  'NEIVA':'CR Neiva','CU NEIVA':'CR Neiva','VILLAVICENCIO':'COA Villavicencio',
  'CU VILLAVICENCIO':'COA Villavicencio','CUCUTA':'CR Cucuta','CU CUCUTA':'CR Cucuta',
};

function normalizarSedeColocacion(n) {
  const x = String(n || '').trim();
  return SEDE_EQUIVALENCIAS_COLOCACION[x.toUpperCase()] || SEDE_EQUIVALENCIAS_COLOCACION[x] || x;
}
function _cartNormSede(s) { return normalizarSedeColocacion(s); }
function _cartStripAccents(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function _cartResolverSedeCartera(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const u = _cartStripAccents(s).toUpperCase();
  if (SEDE_EQUIVALENCIAS_COLOCACION[u]) return SEDE_EQUIVALENCIAS_COLOCACION[u];
  return _cartNormSede(s) || s;
}
function _cartInformeNormKey(s) {
  return String(_cartNormSede(s) || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function _cartInformeSedeMatch(src, mapKey) {
  const ns = _cartInformeNormKey(src), nk = _cartInformeNormKey(mapKey);
  if (!ns || !nk) return false;
  return ns === nk || nk.indexOf(ns) >= 0 || ns.indexOf(nk) >= 0;
}

async function leerHoja(name) {
  const url = `https://docs.google.com/spreadsheets/d/${REPO}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(name)}&tq=${encodeURIComponent('limit 20000')}`;
  const txt = await (await fetch(url)).text();
  const json = txt.replace(/^\/\*[\s\S]*?\*\/\s*/, '').replace(/^[^\{]*/, '').replace(/\);\s*$/, '');
  const o = JSON.parse(json);
  const cols = (o.table.cols || []).map(c => (c.label || '').trim());
  return (o.table.rows || []).map(r => {
    const row = {}, c = [];
    (r.c || []).forEach((cell, i) => {
      const v = cell ? (cell.v != null ? cell.v : cell.f || '') : '';
      c.push(v);
      row[cols[i] || 'c' + i] = v;
    });
    row._c = c;
    return row;
  }).filter(r => r._c.some(v => v !== '' && v != null));
}

function clasifCyg(e) {
  const a = String(e || '').trim().toLowerCase();
  if (!a || a === '0' || a === 'vigente') return 'Vigente';
  if (a === '1 - 30' || a === '1-30') return '1-30';
  if (a === '31 - 60' || a === '31-60') return '31-60';
  if (a === '61 - 90' || a === '61-90') return '61-90';
  return '+90';
}
function clasifSAP(e) {
  const a = String(e || '').trim().toLowerCase();
  if (a.indexOf('vigente') >= 0 || !a) return 'Vigente';
  if (a === '1 - 30' || a === '1-30') return '1-30';
  if (a === '31 - 60' || a === '31-60') return '31-60';
  if (a === '61 - 90' || a === '61-90') return '61-90';
  return '+90';
}

function indexCyg(rows) {
  const o = {};
  rows.forEach(e => {
    const a = e._c || [];
    const t = String(e.IDENTIFICACION || a[8] || '').trim().replace(/\.0$/, '');
    if (!t || t.length < 4) return;
    const saldo = parseFloat(e.SALDO_CAPITAL || a[28] || 0) || parseFloat(a[61] || 0) || 0;
    o[t] = {
      sede: _cartResolverSedeCartera(String(e.SEDE || a[0] || '').trim()),
      oficina: String(e.OFICINA || e['OFICINA '] || a[3] || '').trim(),
      saldo,
      estado: clasifCyg(String(e.DIAS_MORA || a[25] || ''))
    };
  });
  return o;
}

function indexSAP(rows) {
  const o = {};
  rows.forEach(e => {
    const a = e._c || [];
    const t = String(e.Identificación || e.Identificacion || a[3] || '').trim().replace(/\.0$/, '');
    if (!t || t.length < 4) return;
    const mora = e['Edad Mora'] != null && e['Edad Mora'] !== '' ? e['Edad Mora'] : (a[11] != null ? a[11] : a[14]);
    const saldo = parseFloat(e['Saldo total'] != null && e['Saldo total'] !== '' ? e['Saldo total'] : (a[13] > 0 ? a[13] : a[10])) || 0;
    o[t] = {
      sede: _cartResolverSedeCartera(String(e.Sede || a[5] || '').trim()),
      rectoria: String(e.Rectoria || a[7] || '').trim(),
      saldo,
      estado: clasifSAP(String(mora || ''))
    };
  });
  return o;
}

function metricasPorSede(apIdx, ciIdx) {
  const mapa = {};
  const esMora = e => e === '1-30' || e === '31-60' || e === '61-90' || e === '+90';
  function get(s) {
    const k = _cartInformeNormKey(s) || 'sin sede';
    if (!mapa[k]) mapa[k] = { _sede: _cartNormSede(s), asigCant: 0, asigCap: 0 };
    return mapa[k];
  }
  Object.keys(apIdx || {}).forEach(id => {
    const r = apIdx[id];
    const m = get(r.sede);
    m.asigCant++;
    m.asigCap += r.saldo || 0;
    const c = ciIdx[id];
    if (c && c.estado === 'Vigente') { m.recCant = (m.recCant || 0) + 1; }
  });
  return mapa;
}

function acumular(sources, mapa) {
  const acc = { asigCant: 0, asigCap: 0 };
  const tomados = {};
  const keys = Object.keys(mapa || {});
  function tomar(rec) {
    if (!rec || tomados[rec._sede]) return;
    tomados[rec._sede] = 1;
    acc.asigCant += rec.asigCant || 0;
    acc.asigCap += rec.asigCap || 0;
  }
  (sources || []).forEach(src => {
    keys.forEach(k => {
      const rec = mapa[k];
      if (_cartInformeSedeMatch(src, (rec && rec._sede) || k)) tomar(rec);
    });
  });
  return acc;
}

// Unit tests
assert.equal(_cartResolverSedeCartera('BELLO'), 'COA Bello');
assert.equal(_cartResolverSedeCartera('ENGATIVA PRESENCIAL'), 'COA Engativa Pres');
assert.equal(_cartResolverSedeCartera('CU IBAGUE'), 'CR Ibague');
assert.equal(_cartResolverSedeCartera('REC. UNIMINUTO VIRTUAL'), 'Virtual y Distancia');
assert.ok(_cartInformeSedeMatch('COA Bello', 'BELLO'));

const [cygAp, cygCi, sapAp, sapCi] = await Promise.all([
  leerHoja('Cartera Cygnus apertura'),
  leerHoja('Cartera Cygnus cierre'),
  leerHoja('Cartera Sap apertura '),
  leerHoja('Cartera Sap cierre')
]);

assert.ok(cygAp.length > 5000, 'Cygnus apertura debe traer miles de filas');
assert.ok(sapCi.length > 5000, 'SAP cierre debe traer miles de filas');

const apCyg = indexCyg(cygAp), ciCyg = indexCyg(cygCi);
const apSap = indexSAP(sapAp), ciSap = indexSAP(sapCi);

assert.ok(Object.keys(apCyg).length > 5000, 'índice Cygnus apertura poblado');
assert.ok(Object.keys(apSap).length > 3000, 'índice SAP apertura poblado');

const cygMap = metricasPorSede(apCyg, ciCyg);
const sapMap = metricasPorSede(apSap, ciSap);

const filasInforme = [
  { name: 'COA Bello', sources: ['COA Bello'] },
  { name: 'COA Engativa Pres', sources: ['COA Engativa Pres'] },
  { name: 'CR Ibague', sources: ['CR Ibague'] },
  { name: 'Virtual', sources: ['Virtual'] },
  { name: 'CR Barranquilla', sources: ['CR Barranquilla'] },
];

for (const f of filasInforme) {
  const cyg = acumular(f.sources, cygMap);
  const sap = acumular(f.sources, sapMap);
  assert.ok(cyg.asigCant > 0 || sap.asigCant > 0, `${f.name} debe tener asignada Cygnus o SAP > 0 (cyg=${cyg.asigCant}, sap=${sap.asigCant})`);
}

console.log('test-cartera-sheets.mjs: OK (' + filasInforme.length + ' filas informe con datos reales)');
