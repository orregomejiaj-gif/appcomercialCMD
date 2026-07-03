
  /* ── pyv-comercial-5.4.14: Informe Integral Nacional · Rectoría · Sede ── */
  function _ioFmtN(n){ return Number(n||0).toLocaleString('es-CO'); }
  function _ioFmtM(n){
    n=Number(n||0);
    if(n>=1e9) return '$'+(n/1e9).toFixed(2)+'B';
    if(n>=1e6) return '$'+Math.round(n/1e6)+'M';
    return '$'+_ioFmtN(n);
  }
  function _ioSec(t, sub){
    return '<div style="margin:16px 0 8px;padding-bottom:4px;border-bottom:2px solid #e2e8f0">'
      +'<div style="font-size:12px;font-weight:800;color:#003D45">'+t+'</div>'
      +(sub?'<div style="font-size:9px;color:#64748b;margin-top:2px">'+sub+'</div>':'')+'</div>';
  }
  function _ioKpi(lbl,val,col,sub){
    return '<div style="background:#fff;border-radius:10px;padding:10px;border-top:3px solid '+col+';box-shadow:0 1px 3px rgba(0,0,0,.06)">'
      +'<div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase">'+lbl+'</div>'
      +'<div style="font-size:17px;font-weight:900;color:'+col+'">'+val+'</div>'
      +(sub?'<div style="font-size:8px;color:#94a3b8;margin-top:2px">'+sub+'</div>':'')+'</div>';
  }
  function _ioMatchSedeList(sedeRaw, sedesFiltro){
    if(!sedesFiltro||!sedesFiltro.length) return true;
    if(!sedeRaw) return false;
    return sedesFiltro.some(function(sf){ return _cdMatchSede(sedeRaw, sf); });
  }
  function _ioSedesFiltro(nivel, sel){
    if(nivel==='sede'&&sel) return [sel];
    if(nivel==='rectoria'&&sel) return (typeof _mapaListaSedes==='function')?_mapaListaSedes(sel):[];
    return null;
  }
  function _ioTitulo(nivel, sel){
    if(nivel==='nacional') return '🇨🇴 Nacional';
    if(nivel==='rectoria') return sel||'Todas las rectorías';
    return sel||'Todas las sedes';
  }
  function _ioAgregarSigec(sedesFiltro){
    var sig={facturada:0,cerrada_fac:0,cerrada:0,abierta:0,rechazada:0,pendiente_doc:0,pendiente:0,otro:0,total:0,radicadas:0};
    (window._sigecRows||[]).forEach(function(row){
      var cols=row._cols||row._c||[];
      var s=String(row.Sede||cols[30]||'').trim();
      if(!_ioMatchSedeList(s, sedesFiltro)) return;
      sig.total++; sig.radicadas++;
      var est=(typeof leerEstadoSigec==='function')?leerEstadoSigec(row):String(cols[15]||'');
      var cls=(typeof clasificarEstadoSigec==='function')?clasificarEstadoSigec(est):'otro';
      if(sig[cls]!=null) sig[cls]++; else sig.otro++;
    });
    return sig;
  }
  function _ioAgregarGlpi(sedesFiltro){
    var g={aprobada:0,abierta:0,negada:0,total:0};
    (window._glpiRows||[]).forEach(function(row){
      var cols=row._cols||[];
      var s=String(row.Sede||row.sede||cols[30]||cols[8]||'').trim();
      if(s&&!_ioMatchSedeList(s, sedesFiltro)) return;
      if(!s&&!sedesFiltro) g.total++;
      else if(s){ g.total++;
        var est=String(row.estado||row.Estado||cols[3]||'').toLowerCase();
        if(est.indexOf('aprob')>=0) g.aprobada++;
        else if(est.indexOf('negad')>=0) g.negada++;
        else if(est.indexOf('abiert')>=0) g.abierta++;
      }
    });
    return g;
  }
  function _ioColocFilas(nivel, sel){
    var coloc=window._coloc_data||[];
    return coloc.filter(function(r){
      if(nivel==='rectoria'&&sel) return (r.rectoria||'')===sel;
      if(nivel==='sede'&&sel) return _cdMatchSede(r.sede, sel);
      return true;
    });
  }
  function _ioEmpleados(sedesFiltro){
    var asesores=0, coords=0, total=0, lista=[];
    Object.values(EMPLEADOS_BD||{}).forEach(function(e){
      if(!e||!e.sede) return;
      if(sedesFiltro&&!sedesFiltro.some(function(s){ return _cdMatchSede(e.sede,s); })) return;
      var st=String(e.estado||'').toLowerCase();
      if(st.indexOf('inactiv')>=0||st.indexOf('retir')>=0) return;
      total++;
      var c=String(e.cargo||'').toLowerCase();
      if(c.indexOf('asesor')>=0) asesores++;
      if(c.indexOf('coordin')>=0) coords++;
      lista.push(e);
    });
    return {asesores:asesores, coords:coords, total:total, lista:lista};
  }
  function _ioMalla(sedesFiltro){
    var enTurno=0, cerraron=0, filas=window._malla_data||window._mallaTurnosRows||[];
    var hoy=new Date(); hoy.setHours(0,0,0,0);
    filas.forEach(function(row){
      var cols=row._cols||row._c||[];
      var sede=String(row.Sede||cols[4]||cols[3]||'').trim();
      if(sedesFiltro&&!_ioMatchSedeList(sede, sedesFiltro)) return;
      var correo=String(row.Correo||cols[1]||'').toLowerCase();
      if((window._mallaEnTurnoApp||[]).indexOf(correo)>=0) enTurno++;
      if((window._mallaCerroApp||[]).indexOf(correo)>=0) cerraron++;
    });
    return {enTurno:enTurno, cerraron:cerraron, filas:filas.length};
  }
  function _ioLeads(sedesFiltro){
    var n=0;
    var ld=window._leads_data||{};
    if(ld.total_nuevos!=null&&!sedesFiltro) return {total:ld.total_nuevos||0, detalle:'Call + Admitidos'};
    (ld.por_sede||ld.sedes||[]).forEach?null:0;
    if(Array.isArray(ld)) ld.forEach(function(r){ if(_ioMatchSedeList(r.sede, sedesFiltro)) n++; });
    else if(typeof ld==='object'){
      Object.keys(ld).forEach(function(k){
        if(k==='total_nuevos'||k==='por_tipo') return;
        if(!sedesFiltro||sedesFiltro.some(function(s){ return _cdMatchSede(k,s); })) n+=Number(ld[k])||0;
      });
    }
    if(!n&&ld.total_nuevos&&!sedesFiltro) n=ld.total_nuevos;
    return {total:n, detalle:'Repositorio leads'};
  }
  function _ioMatriculas(sedesFiltro){
    var n=0, cap=0;
    (window._matriculasData||[]).forEach(function(r){
      var s=String(r.sede||r.Sede||(r._cols&&r._cols[0])||'').trim();
      if(!_ioMatchSedeList(s, sedesFiltro)) return;
      n+=Number(r.total||r.TOTAL||r.matriculas||1)||0;
      cap+=Number(r.capacidad||r.CAPACIDAD||0)||0;
    });
    if(!n&&window._matriculas_total&&!sedesFiltro) n=window._matriculas_total;
    return {total:n, capacidad:cap};
  }
  function _ioSeguimientos(sedesFiltro){
    var total=0, atrasadas=0, alDia=0;
    var map=window._seguimientosPorSede||{};
    Object.keys(map).forEach(function(sk){
      if(!_ioMatchSedeList(sk, sedesFiltro)) return;
      var seg=map[sk];
      total+=seg.total||0;
      if((seg.dias_sin||0)>30) atrasadas++; else alDia++;
    });
    return {total:total, atrasadas:atrasadas, alDia:alDia};
  }
  function _ioCartera(sedesFiltro){
    try{
      if(!window._cartData) return null;
      if(typeof _cartIndicadoresPortafolio!=='function') return null;
      var ind=_cartIndicadoresPortafolio(window._cartData,'total');
      return ind;
    }catch(e){ return null; }
  }
  function _ioConstruirContexto(nivel, sel){
    var sedesFiltro=_ioSedesFiltro(nivel, sel);
    var coloc=_ioColocFilas(nivel, sel);
    if(!coloc.length) coloc=window._coloc_data||[];
    var meta=0, acum=0, ant=0, metaV=0, acumV=0;
    coloc.forEach(function(r){ meta+=r.meta_n||0; acum+=r.acum_n||0; ant+=r.ant_n||0; metaV+=r.meta_v||0; acumV+=r.acum_v||0; });
    var hoy=new Date(), y=hoy.getFullYear(), m=hoy.getMonth();
    var diasHab=(typeof _mdDiasHabilesMes==='function')?_mdDiasHabilesMes(y,m):22;
    var metaDiaria=diasHab>0?meta/diasHab:0;
    var metaMes=meta;
    var rad=(typeof _mdConstruirRadicaciones==='function')?_mdConstruirRadicaciones(window._sigecRows||[],y,m):{porDia:{},porSedeMes:{}};
    var colM=(typeof _mdConstruirColocado==='function')?_mdConstruirColocado(window._sigecRows||[],window._glpiRows||[],y,m):{porDia:{},sigMes:0,glpiMes:0};
    var sedeUnica=(nivel==='sede'&&sel)?sel:'';
    var hoyKey=(typeof _mdDateKey==='function')?_mdDateKey(hoy):'';
    var colHoy=sedeUnica?(typeof _mdColSedeEnDia==='function'?_mdColSedeEnDia(colM,sedeUnica,hoyKey):0):(colM.porDia[hoyKey]||0);
    var colMes=sedeUnica?(typeof _mdColMesSede==='function'?_mdColMesSede(colM,sedeUnica):0):((colM.sigMes||0)+(colM.glpiMes||0));
    var radMes=sedeUnica?(typeof _mdRadMesSede==='function'?_mdRadMesSede(rad,sedeUnica):0):Object.values(rad.porSedeMes||{}).reduce(function(a,b){return a+b;},0);
    return {
      nivel:nivel, sel:sel, sedesFiltro:sedesFiltro, titulo:_ioTitulo(nivel,sel),
      coloc:coloc, meta:meta, acum:acum, ant:ant, metaV:metaV, acumV:acumV,
      pct:meta>0?Math.round(acum/meta*100):0,
      metaDiaria:metaDiaria, metaMes:metaMes, colHoy:colHoy, colMes:colMes, radMes:radMes,
      sig:_ioAgregarSigec(sedesFiltro), glpi:_ioAgregarGlpi(sedesFiltro),
      colocadoCombinado:(colM.sigMes||0)+(colM.glpiMes||0),
      sigMes:colM.sigMes||0, glpiMes:colM.glpiMes||0,
      empleados:_ioEmpleados(sedesFiltro), malla:_ioMalla(sedesFiltro),
      leads:_ioLeads(sedesFiltro), matriculas:_ioMatriculas(sedesFiltro),
      seguimientos:_ioSeguimientos(sedesFiltro), cartera:_ioCartera(sedesFiltro)
    };
  }
  function _ioRenderBloqueSigec(sig){
    var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(95px,1fr));gap:6px">';
    [['Radicadas',sig.radicadas,'#6366f1'],['Facturadas',sig.facturada,'#16a34a'],['Cerr. fac.',sig.cerrada_fac,'#a78bfa'],
     ['Cerradas',sig.cerrada,'#fbbf24'],['Abiertas',sig.abierta,'#60a5fa'],['Rechaz. Motor',sig.rechazada,'#f87171'],
     ['Pend. doc.',sig.pendiente_doc,'#fb923c'],['Pendientes',sig.pendiente,'#f97316'],['Otros',sig.otro,'#94a3b8'],
     ['Total tickets',sig.total,'#7c3aed']].forEach(function(x){
      html+='<div style="background:#faf5ff;border-radius:8px;padding:8px;text-align:center;border:1px solid #e9d5ff">'
        +'<div style="font-size:7px;color:#7c3aed;font-weight:700;text-transform:uppercase">'+x[0]+'</div>'
        +'<div style="font-size:14px;font-weight:900;color:'+x[2]+'">'+_ioFmtN(x[1]||0)+'</div></div>';
    });
    return html+'</div>';
  }
  function _ioRenderDrillTable(ctx, prefix, modo){
    var html='', nivel=ctx.nivel;
    if(nivel==='nacional'){
      html+=_ioSec('📊 Desglose por Rectoría','Clic en una fila para ver sedes de la rectoría');
      var byRect={};
      ctx.coloc.forEach(function(r){
        var rect=r.rectoria||'Sin rectoría';
        if(!byRect[rect]) byRect[rect]={meta:0,acum:0,ant:0,n:0};
        byRect[rect].meta+=r.meta_n||0; byRect[rect].acum+=r.acum_n||0; byRect[rect].ant+=r.ant_n||0; byRect[rect].n++;
      });
      html+='<div style="overflow-x:auto;max-height:300px;border:1px solid #e5e7eb;border-radius:10px"><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#f1f5f9;position:sticky;top:0">'
        +'<th style="padding:6px 8px;text-align:left">Rectoría</th><th style="padding:6px 8px;text-align:right">Sedes</th><th style="padding:6px 8px;text-align:right">Meta S2</th><th style="padding:6px 8px;text-align:right">Colocado</th><th style="padding:6px 8px;text-align:right">%</th></tr></thead><tbody>';
      Object.keys(byRect).sort().forEach(function(rect){
        var o=byRect[rect], p=o.meta>0?Math.round(o.acum/o.meta*100):0;
        var esc=String(rect).replace(/'/g,"\\'");
        html+='<tr style="border-bottom:1px solid #f1f5f9;cursor:pointer" onclick="_ioDrill(\''+prefix+'\',\'rectoria\',\''+esc+'\')">';
        html+='<td style="padding:5px 8px;font-weight:600">'+rect+'</td><td style="padding:5px 8px;text-align:right">'+o.n+'</td>';
        html+='<td style="padding:5px 8px;text-align:right">'+_ioFmtN(Math.round(o.meta))+'</td>';
        html+='<td style="padding:5px 8px;text-align:right;font-weight:700">'+_ioFmtN(o.acum)+'</td>';
        html+='<td style="padding:5px 8px;text-align:right">'+p+'%</td></tr>';
      });
      html+='</tbody></table></div>';
    } else if(nivel==='rectoria'){
      html+=_ioSec('📊 Desglose por Sede','Clic en sede para detalle individual');
      html+='<div style="overflow-x:auto;max-height:320px;border:1px solid #e5e7eb;border-radius:10px"><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#f1f5f9;position:sticky;top:0">'
        +'<th style="padding:6px 8px;text-align:left">Sede</th><th style="padding:6px 8px;text-align:right">Meta</th><th style="padding:6px 8px;text-align:right">Colocado</th><th style="padding:6px 8px;text-align:right">SIGEC fact.</th><th style="padding:6px 8px;text-align:right">%</th><th style="padding:6px 8px;text-align:center">Sem</th></tr></thead><tbody>';
      ctx.coloc.sort(function(a,b){return(b.acum_n||0)-(a.acum_n||0);}).forEach(function(r){
        var p=r.meta_n>0?Math.round(r.acum_n/r.meta_n*100):0;
        var sem=typeof _getSemaforoColoc==='function'?_getSemaforoColoc(r):(r.semaforo||'—');
        var sigS=_ioAgregarSigec([r.sede]);
        var esc=String(r.sede||'').replace(/'/g,"\\'");
        html+='<tr style="border-bottom:1px solid #f1f5f9;cursor:pointer" onclick="_ioDrill(\''+prefix+'\',\'sede\',\''+esc+'\')">';
        html+='<td style="padding:5px 8px;font-weight:600">'+r.sede+'</td>';
        html+='<td style="padding:5px 8px;text-align:right;color:#64748b">'+_ioFmtN(Math.round(r.meta_n||0))+'</td>';
        html+='<td style="padding:5px 8px;text-align:right;font-weight:700">'+_ioFmtN(r.acum_n||0)+'</td>';
        html+='<td style="padding:5px 8px;text-align:right;color:#7c3aed">'+_ioFmtN(sigS.facturada)+'</td>';
        html+='<td style="padding:5px 8px;text-align:right">'+p+'%</td>';
        html+='<td style="padding:5px 8px;text-align:center;font-size:9px">'+sem+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    return html;
  }
  window._ioDrill=function(prefix, nivel, val){
    var niv=document.getElementById(prefix+'-nivel');
    var sel=document.getElementById(prefix+'-rectoria');
    if(niv) niv.value=nivel;
    if(typeof _ioCambiarNivel==='function') _ioCambiarNivel(prefix);
    if(sel) sel.value=val;
    if(prefix==='cd'&&typeof cdActualizar==='function') cdActualizar();
    if(prefix==='md'&&typeof renderMetasDiarias==='function') renderMetasDiarias();
  };
  window._ioCambiarNivel=function(prefix){
    var nivel=(document.getElementById(prefix+'-nivel')||{}).value||'nacional';
    var sel=document.getElementById(prefix+'-rectoria');
    var lbl=document.getElementById(prefix+'-label-rectoria');
    if(!sel) return;
    var prev=sel.value;
    sel.innerHTML='';
    var o0=document.createElement('option'); o0.value='';
    o0.textContent=nivel==='sede'?'Todas las sedes':'Todas';
    sel.appendChild(o0);
    if(nivel==='rectoria'){
      if(lbl) lbl.textContent='RECTORÍA';
      (typeof _mapaListaRectorias==='function'?_mapaListaRectorias():[]).forEach(function(r){
        var o=document.createElement('option'); o.value=r; o.textContent=r; sel.appendChild(o);
      });
    } else if(nivel==='sede'){
      if(lbl) lbl.textContent='SEDE';
      var rect=(document.getElementById(prefix+'-nivel')||{}).value;
      var lista=(typeof _mapaListaSedes==='function')?_mapaListaSedes(''):[];
      lista.forEach(function(s){ var o=document.createElement('option'); o.value=s; o.textContent=s; sel.appendChild(o); });
    } else { if(lbl) lbl.textContent='ÁMBITO'; }
    if(prev) sel.value=prev;
  };
  function _ioRenderInforme(ctx, opts){
    opts=opts||{};
    var modo=opts.modo||'cumplimiento';
    var html='<div style="margin-bottom:10px"><div style="font-size:15px;font-weight:800;color:#003D45">'+ctx.titulo+'</div>';
    html+='<div style="font-size:10px;color:#64748b">'+ctx.coloc.length+' sede(s) · Fuentes: 8 repositorios Google Sheets · Actualizado en vivo</div></div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:8px;margin-bottom:14px">';
    html+=_ioKpi('Meta S2 total',_ioFmtN(Math.round(ctx.meta)),'#003D45','Período actual');
    html+=_ioKpi('Meta mes en curso',_ioFmtN(Math.round(ctx.metaMes)),'#1e40af','Meta # del informe P Actual');
    html+=_ioKpi('Meta HOY',ctx.metaDiaria.toFixed(1),'#C8971E','meta ÷ días hábiles mes');
    html+=_ioKpi('Colocado S2',_ioFmtN(ctx.acum),ctx.pct>=90?'#16a34a':ctx.pct>=70?'#ca8a04':'#dc2626',ctx.pct+'% cumplimiento');
    html+=_ioKpi('Colocado MES',_ioFmtN(ctx.colMes),'#1d4ed8','SIGEC '+_ioFmtN(ctx.sigMes)+' + GLPI '+_ioFmtN(ctx.glpiMes));
    html+=_ioKpi('Colocado HOY',_ioFmtN(ctx.colHoy),ctx.colHoy>=ctx.metaDiaria?'#16a34a':'#dc2626','fact. + aprob. hoy');
    html+=_ioKpi('Radicadas mes',_ioFmtN(ctx.radMes),'#6366f1','COLOCACION SIGEC');
    html+=_ioKpi('Combinado mes',_ioFmtN(ctx.colocadoCombinado),'#7c3aed','SIGEC fact. + GLPI apr.');
    html+='</div>';
    html+=_ioSec('📋 INFORME COLOCACIÓN P ACTUAL','Meta, acumulado S2, variación vs año anterior');
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;margin-bottom:8px">';
    html+=_ioKpi('Meta #',_ioFmtN(Math.round(ctx.meta)),'#003D45');
    html+=_ioKpi('Acum #',_ioFmtN(ctx.acum),'#1d4ed8');
    html+=_ioKpi('Meta $',_ioFmtM(ctx.metaV),'#003D45');
    html+=_ioKpi('Acum $',_ioFmtM(ctx.acumV),'#1d4ed8');
    html+=_ioKpi('Año ant.',_ioFmtN(ctx.ant),'#64748b');
    html+=_ioKpi('VAR #',_ioFmtN(ctx.acum-ctx.ant),ctx.acum>=ctx.ant?'#16a34a':'#dc2626');
    html+='</div>';
    html+=_ioSec('📋 COLOCACION SIGEC — todos los estados','Radicaciones y tickets por estado del repositorio colocación');
    html+=_ioRenderBloqueSigec(ctx.sig);
    html+=_ioSec('🎫 COLOCACION GLPI','Aprobadas, abiertas y negadas');
    html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
    html+=_ioKpi('Aprobadas',_ioFmtN(ctx.glpi.aprobada),'#16a34a');
    html+=_ioKpi('Abiertas',_ioFmtN(ctx.glpi.abierta),'#ca8a04');
    html+=_ioKpi('Negadas',_ioFmtN(ctx.glpi.negada),'#dc2626');
    html+=_ioKpi('Total',_ioFmtN(ctx.glpi.total),'#0891b2');
    html+='</div>';
    html+=_ioSec('✅ Colocado combinado (SIGEC facturadas + GLPI aprobadas)','Suma del mes en curso — criterio de cumplimiento diario');
    html+='<div style="padding:12px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:10px;border:1px solid #86efac;font-size:11px">'
      +'<b>Total mes:</b> '+_ioFmtN(ctx.colocadoCombinado)+' créditos = <span style="color:#16a34a">SIGEC '+_ioFmtN(ctx.sigMes)+'</span> + <span style="color:#0891b2">GLPI '+_ioFmtN(ctx.glpiMes)+'</span>'
      +' · <b>Hoy:</b> '+_ioFmtN(ctx.colHoy)+' vs meta día '+ctx.metaDiaria.toFixed(1)+'</div>';
  if(ctx.cartera){
      html+=_ioSec('💰 Estado de Cartera','Cygnus + SAP — recaudo y rodada');
      var cyg=ctx.cartera.cyg||{}, sap=ctx.cartera.sap||{};
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px">';
      html+=_ioKpi('Rec. Cygnus',(cyg.recPct||0)+'%','#1d4ed8');
      html+=_ioKpi('Rod. Cygnus',(cyg.rodPct||0)+'%','#dc2626');
      html+=_ioKpi('Rec. SAP',(sap.recPct||0)+'%','#059669');
      html+=_ioKpi('Rod. SAP',(sap.rodPct||0)+'%','#dc2626');
      html+='</div>';
    } else {
      html+=_ioSec('💰 Estado de Cartera','<span style="color:#94a3b8">Abre Cartera o espera carga del Sheet</span>');
    }
    html+=_ioSec('📞 Leads y Matrículas','Repositorios leads y matrículas');
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px">';
    html+=_ioKpi('Leads',_ioFmtN(ctx.leads.total),'#0891b2',ctx.leads.detalle);
    html+=_ioKpi('Matrículas',_ioFmtN(ctx.matriculas.total),'#6366f1');
    html+=_ioKpi('Capacidad',_ioFmtN(ctx.matriculas.capacidad),'#64748b');
    html+='</div>';
    html+=_ioSec('📋 Seguimientos comerciales','Cobertura de visitas por sede');
    html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
    html+=_ioKpi('Registros',_ioFmtN(ctx.seguimientos.total),'#003D45');
    html+=_ioKpi('Al día',_ioFmtN(ctx.seguimientos.alDia),'#16a34a');
    html+=_ioKpi('Atrasados',_ioFmtN(ctx.seguimientos.atrasadas),'#dc2626');
    html+='</div>';
    if(modo==='operativo'){
      html+=_ioSec('👥 Estado de Asesores','Directorio empleados — repositorio interno');
      html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px">';
      html+=_ioKpi('Asesores activos',_ioFmtN(ctx.empleados.asesores),'#16a34a');
      html+=_ioKpi('Coordinadores',_ioFmtN(ctx.empleados.coords),'#1d4ed8');
      html+=_ioKpi('Total activos',_ioFmtN(ctx.empleados.total),'#003D45');
      html+='</div>';
      if(ctx.empleados.lista.length&&ctx.empleados.lista.length<=25){
        html+='<div style="font-size:9px;color:#64748b;max-height:120px;overflow-y:auto">';
        ctx.empleados.lista.slice(0,25).forEach(function(e){
          html+='<div style="padding:3px 0;border-bottom:1px solid #f1f5f9"><b>'+e.nombre+'</b> · '+e.cargo+' · '+e.sede+'</div>';
        });
        html+='</div>';
      }
      html+=_ioSec('📅 Malla de Turnos','Estado operativo del día — repositorio malla');
      html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
      html+=_ioKpi('En turno app',_ioFmtN(ctx.malla.enTurno),'#16a34a');
      html+=_ioKpi('Cerraron turno',_ioFmtN(ctx.malla.cerraron),'#1d4ed8');
      html+=_ioKpi('Filas malla',_ioFmtN(ctx.malla.filas),'#64748b');
      html+='</div>';
    }
    if(opts.incluirHistorial&&typeof _mdListaDiasHabiles==='function'){
      var hoy=new Date(), y=hoy.getFullYear(), mo=hoy.getMonth();
      var dias=_mdListaDiasHabiles(y,mo,hoy.getDate());
      var sedeSel=(ctx.nivel==='sede'&&ctx.sel)?ctx.sel:'';
      var colM=(typeof _mdConstruirColocado==='function')?_mdConstruirColocado(window._sigecRows||[],window._glpiRows||[],y,mo):{};
      var rad=(typeof _mdConstruirRadicaciones==='function')?_mdConstruirRadicaciones(window._sigecRows||[],y,mo):{};
      html+=_ioSec('📅 Historial diario del mes','Cumplimiento meta de colocación por día hábil');
      html+='<div style="overflow-x:auto;max-height:280px;border:1px solid #e2e8f0;border-radius:10px"><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#003D45;color:#fff;position:sticky;top:0">'
        +'<th style="padding:6px 8px">Fecha</th><th style="padding:6px 8px;text-align:right">Meta</th><th style="padding:6px 8px;text-align:right">Colocado</th><th style="padding:6px 8px;text-align:right">Radic.</th><th style="padding:6px 8px;text-align:center">Estado</th></tr></thead><tbody>';
      dias.slice().reverse().forEach(function(d,i){
        var dk=(typeof _mdDateKey==='function')?_mdDateKey(d):'';
        var colD=(typeof _mdColSedeEnDia==='function')?_mdColSedeEnDia(colM,sedeSel,dk):0;
        var radD=(typeof _mdRadSedeEnDia==='function')?_mdRadSedeEnDia(rad,sedeSel,dk):0;
        var cumple=colD>=ctx.metaDiaria;
        html+='<tr style="background:'+(i%2?'#fff':'#f8fafc')+'"><td style="padding:5px 8px">'+d.toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'})+'</td>'
          +'<td style="padding:5px 8px;text-align:right">'+ctx.metaDiaria.toFixed(1)+'</td>'
          +'<td style="padding:5px 8px;text-align:right;font-weight:700;color:'+(cumple?'#16a34a':'#dc2626')+'">'+_ioFmtN(colD)+'</td>'
          +'<td style="padding:5px 8px;text-align:right;color:#6366f1">'+_ioFmtN(radD)+'</td>'
          +'<td style="padding:5px 8px;text-align:center">'+(typeof _mdSemHtml==='function'?_mdSemHtml(cumple):(cumple?'✅':'❌'))+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    html+=_ioRenderDrillTable(ctx, opts.prefix||'cd', modo);
    html+='<div style="font-size:9px;color:#94a3b8;margin-top:12px;text-align:center;padding-top:8px;border-top:1px solid #e5e7eb">'
      +'Fuentes: Colocación P Actual · SIGEC · GLPI · Cartera · Leads · Matrículas · Seguimientos · Empleados · Malla</div>';
    return html;
  }
  window._ioConstruirContexto=_ioConstruirContexto;
  window._ioRenderInforme=_ioRenderInforme;
