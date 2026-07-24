/** Pruebas lógica embudo v5.4.93 */
import fs from 'fs';
const html = fs.readFileSync('seguimiento_comercial_CMD.html', 'utf8');
const start = html.indexOf('var IC_EMBUDO_BOTTLENECK_TIPS');
const end = html.indexOf('  var IC_DESCS={', start);
const semBlock = html.slice(html.indexOf('function icEmbudoCalcSemaforo'), html.indexOf('function icRenderEmbudoLeadsResumen'));

const fn = new Function('window', `
function icStr(v){ return v==null?'':String(v).trim(); }
function icFmt(n){ return (Number(n)||0).toLocaleString('es-CO'); }
function icNormCed(c){ return String(c||'').replace(/\\D/g,'').replace(/^0+/,''); }
function icCongeladosSet(){ return {}; }
function icBaseCedulas(){ return {}; }
function icFilasSigec(){ return []; }
function icFilasGlpi(){ return []; }
function icCedulaSigec(){ return ''; }
function icCedulaGlpi(){ return ''; }
function icClasifSigec(){ return ''; }
function icGlpiAprobada(){ return false; }
function icGlpiLeerSede(){ return ''; }
function icNormTicket(t){ return String(t||'').trim(); }
function icMatchSede(a,b){ var x=icStr(a).toLowerCase(), y=icStr(b).toLowerCase(); return x===y||x.indexOf(y)>=0||y.indexOf(x)>=0; }
function icSedesFiltro(f){ f=f||{}; if(f.sedes&&f.sedes.length) return f.sedes.slice(); return null; }
var IC_EMBUDO_BOTTLENECK_TIPS = { contactando:'tip', conectado:'tip', interes:'tip', radicado:'tip', congelada:'tip', aprobado:'tip' };
${html.slice(start, end)}
function icFiltrarEmbudoLeads(f){
  f=f||{};
  var rows=(window._embudoLeadsRows||[]).map(function(r){ return Object.assign({},r,{etapa:icMatchEmbudoEtapa(r.etapaRaw||r.etapa)}); });
  var sf=icSedesFiltro(f);
  if(!sf||!sf.length) return rows;
  return rows.filter(function(r){ return sf.some(function(s){ return icMatchSede(r.sede,s); }); });
}
function icConstruirCruceEmbudoCedulas(){ return {}; }
function icEmbudoEtapaEsperadaOps(){ return -1; }
${semBlock}
return { icConstruirEmbudoLeads, icEmbudoCalcSemaforo, icEmbudoResumenCardHtml, IC_EMBUDO_STAGES };
`);

const window = { _embudoLeadsRows: [
  { nombre:'Lead A', cedula:'1234567890', sede:'COA Bello', etapaRaw:'Nuevo', fuente:'HubSpot', propietario:'A', fecha: new Date(Date.now()-8*86400000) },
  { nombre:'Lead B', cedula:'9876543210', sede:'COA Bello', etapaRaw:'Intentando contactar', fuente:'HubSpot', propietario:'A', fecha: new Date(Date.now()-6*86400000) },
  { nombre:'Lead C', cedula:'1111222233', sede:'CR Cali', etapaRaw:'Manifiesta interés', fuente:'Web', propietario:'B', fecha: new Date(Date.now()-2*86400000) },
  { nombre:'Lead D', cedula:'4444555566', sede:'CR Cali', etapaRaw:'Crédito aprobado', fuente:'Call', propietario:'B', fecha: new Date(Date.now()-1*86400000) },
  { nombre:'Lead E', cedula:'7777888899', sede:'COA Bello', etapaRaw:'Descalificado', fuente:'HubSpot', propietario:'A', fecha: new Date(Date.now()-3*86400000) },
]};
const api = fn(window);
let ok=0, fail=0;
const a=(c,m)=>{ if(c){console.log('✓',m);ok++;}else{console.log('✗',m);fail++;} };

const dNat = api.icConstruirEmbudoLeads({});
a(dNat.total===5, 'Nacional: 5 leads');
a(dNat.transiciones.length===api.IC_EMBUDO_STAGES.length-1, 'Transiciones completas');
a(dNat.estancados.length>=1, 'Estancados detectados');
a(dNat.diag.length>=1, 'Diagnóstico generado');
a(api.icConstruirEmbudoLeads({sedes:['COA Bello']}).total===3, 'Filtro sede Bello');
const sem = api.icEmbudoCalcSemaforo(dNat);
a(['VERDE','AMARILLO','ROJO'].includes(sem.sem), 'Semáforo: '+sem.sem);
const card = api.icEmbudoResumenCardHtml(dNat,{dark:true});
a(card.includes(sem.sem)&&card.includes('Leads'), 'Card HTML render');
console.log(ok+' OK, '+fail+' fallos');
process.exit(fail?1:0);
