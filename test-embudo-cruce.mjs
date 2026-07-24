/** Pruebas cruce embudo v5.4.96 — SIGEC/GLPI/COLOC/CONGELADOS */
import fs from 'fs';
const html = fs.readFileSync('seguimiento_comercial_CMD.html', 'utf8');
const start = html.indexOf('var IC_EMBUDO_BOTTLENECK_TIPS');
const end = html.indexOf('  var IC_DESCS={', start);
const semBlock = html.slice(html.indexOf('function icEmbudoCalcSemaforo'), html.indexOf('function icRenderEmbudoLeadsResumen'));

const fn = new Function('window', `
var IC_SIG = {TICKET:0,FC:1,CED:2,EST:15,TIPO:12,NR:20,FF:13,FA:34,SED:30,VAL:7};
var IC_GLP = {TICKET:0,FC:1,CED:2,EST:3,CAT:4,FA:9,SED:7,TIPO:5};
function icStr(v){ return v==null?'':String(v).trim(); }
function icFmt(n){ return (Number(n)||0).toLocaleString('es-CO'); }
function icNormCed(c){ return String(c||'').replace(/\\D/g,'').replace(/^0+/,''); }
function icNormTicket(t){ return icStr(t).replace(/\\.0+$/,'').replace(/\\s+/g,''); }
function icMatchSede(a,b){ var x=icStr(a).toLowerCase(), y=icStr(b).toLowerCase(); return x===y||x.indexOf(y)>=0||y.indexOf(x)>=0; }
function icNormSedeKey(s){ return icStr(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/^(coa|co|cr|ct|cu|cs|cp)\\s+/i,'').replace(/\\s+/g,'').replace(/[^a-z0-9]/g,''); }
function icResolverSedeColoc(raw, sedesLista){
  if(!raw) return '';
  var lista=sedesLista||[];
  for(var i=0;i<lista.length;i++){ if(icMatchSede(raw,lista[i])) return lista[i]; }
  return '';
}
function icSedesFiltro(f){ f=f||{}; if(f.sedes&&f.sedes.length) return f.sedes.slice(); return null; }
function icFiltroPermiteSede(sede,filtro){
  filtro=filtro||{};
  if(filtro.sedes&&filtro.sedes.length) return filtro.sedes.some(function(s){ return icMatchSede(sede,s); });
  return true;
}
function icCongeladosMap(){
  var map={};
  (window._congeladosRaw||[]).forEach(function(r){
    var tk=icNormTicket(r.ticket);
    if(tk) map[tk]={ticket:tk,dias:r.dias||0,pendiente:r.pendiente||''};
  });
  return map;
}
function icCongeladosSet(){ var m=icCongeladosMap(), s={}; Object.keys(m).forEach(function(k){ s[k]=true; }); return s; }
function icInfoCongelado(tk){ return icCongeladosMap()[icNormTicket(tk)]||null; }
function icBaseCedulas(filtro){
  filtro=filtro||{};
  var set={};
  (window._baseColocFilas||[]).forEach(function(r){
    var n=icNormCed(r.cedula); if(!n||n.length<5) return;
    if(!icFiltroPermiteSede(r.sede,filtro)) return;
    set[n]=true;
  });
  return set;
}
function icFilasSigec(f){ return (window._sigecRows||[]).filter(function(r){
  var sf=icSedesFiltro(f); if(!sf||!sf.length) return true;
  return !!icResolverSedeColoc(r.Sede, sf);
}); }
function icFilasGlpi(f){ return (window._glpiRows||[]).filter(function(r){
  var sf=icSedesFiltro(f); if(!sf||!sf.length) return true;
  return !!icResolverSedeColoc(r.sede, sf);
}); }
function icCedulaSigec(row){ return icNormCed(row['Cedula asociado']||row.cedula); }
function icCedulaGlpi(row){ return icNormCed(row['Cedula asociado']||row.cedula); }
function icClasifSigec(row){ var x=icStr(row.Estado).toLowerCase(); if(x.indexOf('factur')>=0) return 'facturada'; if(x.indexOf('cerrada fac')>=0) return 'cerrada_fac'; if(x==='abierta') return 'abierta'; return 'otro'; }
function icGlpiAprobada(row){ return icStr(row.estado).toLowerCase().indexOf('aprob')>=0; }
function icGlpiLeerSede(row){ return row.sede||''; }
function icFiltroResumen(f){ return (f.sedes&&f.sedes.length)?f.sedes.join(', '):'Nacional'; }
function icEmbudoCalcSemaforo(d){
  if(!d || !d.total) return {sem:'—', color:'#94a3b8', score:0};
  var score = 0;
  if((d.descPct||0) >= 22) score += 2; else if((d.descPct||0) >= 12) score += 1;
  if((d.estancados||[]).length >= 6) score += 2; else if((d.estancados||[]).length >= 2) score += 1;
  if((d.desfase||[]).length >= 4) score += 2; else if((d.desfase||[]).length >= 1) score += 1;
  if(d.peorBottleneck && d.peorBottleneck.idx > 0 && d.peorBottleneck.conv < 0.32) score += 2;
  else if(d.peorBottleneck && d.peorBottleneck.idx > 0 && d.peorBottleneck.conv < 0.52) score += 1;
  if((d.congSinFact||[]).length >= 3) score += 1;
  var sem, color;
  if(score >= 4){ sem = 'ROJO'; color = '#dc2626'; }
  else if(score >= 2){ sem = 'AMARILLO'; color = '#ca8a04'; }
  else { sem = 'VERDE'; color = '#16a34a'; }
  return {sem:sem, color:color, score:score};
}
var IC_EMBUDO_BOTTLENECK_TIPS = { contactando:'tip', conectado:'tip', interes:'tip', radicado:'tip', congelada:'tip', aprobado:'tip' };
${html.slice(start, end)}
return {
  icConstruirEmbudoLeads, icConstruirCruceEmbudoCedulas, icEmbudoResumenCruce,
  icEmbudoMapaAtencion, icEmbudoSerializarParaIA, IC_EMBUDO_STAGES
};
`);

const window = {
  _embudoLeadsRows: [
    { nombre:'Lead SIGEC', cedula:'001234567890', sede:'COA Bello', etapaRaw:'Nuevo', fuente:'HubSpot', propietario:'A', fecha: new Date(Date.now()-8*86400000) },
    { nombre:'Lead GLPI', cedula:'9876543210', sede:'COA Bello', etapaRaw:'Intentando contactar', fuente:'HubSpot', propietario:'A', fecha: new Date(Date.now()-3*86400000) },
    { nombre:'Lead COLOC', cedula:'1111222233', sede:'COA Bello', etapaRaw:'Manifiesta interés', fuente:'Web', propietario:'B', fecha: new Date(Date.now()-2*86400000) },
    { nombre:'Lead Cong', cedula:'4444555566', sede:'COA Bello', etapaRaw:'Crédito radicado', fuente:'Call', propietario:'B', fecha: new Date(Date.now()-1*86400000) },
    { nombre:'Lead OK', cedula:'7777888899', sede:'COA Bello', etapaRaw:'Crédito aprobado', fuente:'HubSpot', propietario:'A', fecha: new Date(Date.now()-1*86400000) },
  ],
  _sigecRows: [
    { Ticket:'TK001', Sede:'COA Bello', Estado:'Facturada', cedula:'1234567890', _cols:['TK001','','1234567890'] },
    { Ticket:'TK004', Sede:'COA Bello', Estado:'Abierta', cedula:'4444555566', _cols:['TK004','','4444555566'] },
  ],
  _glpiRows: [
    { Ticket:'TK002', sede:'COA Bello', estado:'Aprobada', cedula:'9876543210', _cols:['TK002','','9876543210'] },
  ],
  _baseColocFilas: [
    { cedula:'1111222233', sede:'COA Bello' },
  ],
  _congeladosRaw: [
    { ticket:'TK004', dias:12, pendiente:'Documentación' },
  ],
};
const api = fn(window);
let ok=0, fail=0;
const a=(c,m)=>{ if(c){console.log('✓',m);ok++;}else{console.log('✗',m);fail++;} };

const cruce = api.icConstruirCruceEmbudoCedulas({sedes:['COA Bello']});
a(!!cruce['1234567890'] && cruce['1234567890'].facturada===1, 'Cruce SIGEC facturada por cédula');
a(!!cruce['9876543210'] && cruce['9876543210'].glpi_aprob===1, 'Cruce GLPI aprobada por cédula');
a(!!cruce['1111222233'] && cruce['1111222233'].tiene_credito, 'Cruce BASE COLOC por cédula');
a(!!cruce['4444555566'] && cruce['4444555566'].es_congelado, 'Cruce CONGELADOS por ticket SIGEC');
a(cruce['4444555566'].cong_dias_max===12, 'Congelado captura días');

const d = api.icConstruirEmbudoLeads({sedes:['COA Bello']});
a(d.total===5, 'Filtro sede: 5 leads');
a(d.desfase.length>=2, 'Desfase detectado (ops > CRM)');
a(d.congSinFact.length>=1, 'Congelado sin facturar detectado');
a(d.creditoSinAvance.length>=1, 'Crédito sin avance etapa detectado');
a(d.estancados.length>=1, 'Estancado detectado');

const stats = api.icEmbudoResumenCruce(d);
a(stats.conSigec>=2, 'Stats cruce SIGEC');
a(stats.conGlpi>=1, 'Stats cruce GLPI');
a(stats.conColoc>=1, 'Stats cruce COLOC');
a(stats.conCongelado>=1, 'Stats congelados');

const mapa = api.icEmbudoMapaAtencion(d);
a(mapa.length>=3, 'Mapa atención con bloques');

const ser = api.icEmbudoSerializarParaIA(d, {sedes:['COA Bello']});
a(ser.semaforo && ser.cruce, 'Serialización IA completa');

const leadSigec = d.leads.find(l=>l.nombre==='Lead SIGEC');
a(leadSigec && leadSigec.estado_ops.indexOf('SIGEC facturada')>=0, 'estado_ops SIGEC');
a(leadSigec && leadSigec.desfase, 'Lead SIGEC en desfase');

window._embudoFiltro = { etapa: '', alerta: 'desfase' };
const filDesfase = (function(leads){
  var fl = window._embudoFiltro || {};
  return (leads||[]).filter(function(r){
    if(fl.alerta === 'desfase' && !r.desfase) return false;
    if(fl.etapa && r.etapa !== fl.etapa) return false;
    return true;
  });
})(d.leads);
a(filDesfase.length >= 1 && filDesfase.every(l => l.desfase), 'Filtro alerta desfase');
window._embudoFiltro = { etapa: 'nuevo', alerta: '' };
const filNuevo = d.leads.filter(l => l.etapa === 'nuevo');
a(filNuevo.length >= 1 && filNuevo.every(l => l.etapa === 'nuevo'), 'Filtro etapa nuevo');
window._embudoFiltro = { etapa: '', alerta: '' };

console.log(ok+' OK, '+fail+' fallos');
process.exit(fail?1:0);
