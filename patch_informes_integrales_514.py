#!/usr/bin/env python3
"""Patch 5.4.14: Informes integrales Cumplimiento + Estado Operativo + CMD IA."""
from pathlib import Path

p = Path('/workspace/seguimiento_comercial_CMD.html')
text = p.read_text(encoding='utf-8')
mod = Path('/workspace/informe_integral_module.js').read_text(encoding='utf-8')

# Version
text = text.replace('pyv-comercial-5.4.13', 'pyv-comercial-5.4.14')
if 'Informes integrales 3 niveles' not in text[:5000]:
    text = text.replace(
        '  CHANGELOG\n  pyv-comercial-5.4.14 (2026-07-03)',
        '''  CHANGELOG
  pyv-comercial-5.4.14 (2026-07-03)
    - Cumplimiento y Estado Operativo: informes integrales nacional → rectoría → sede (8 repositorios).
    - SIGEC todos los estados, GLPI, colocación P Actual, cartera, leads, matrículas, malla y asesores.
    - CMD IA robustecido: rectorías, preguntas por estado y precarga de datos.
    - SCIC IA: sincronización con datos en vivo (sin fallback obsoleto).''',
        1
    )
if 'pyv-comercial-5.4.14 (2026-07-03)' not in text[:5000]:
    text = text.replace(
        '  CHANGELOG\n  pyv-comercial-5.4.13 (2026-07-02)',
        '''  CHANGELOG
  pyv-comercial-5.4.14 (2026-07-03)
    - Cumplimiento y Estado Operativo: informes integrales nacional → rectoría → sede (8 repositorios).
    - SIGEC todos los estados, GLPI, colocación P Actual, cartera, leads, matrículas, malla y asesores.
    - CMD IA robustecido: rectorías, preguntas por estado y precarga de datos.
    - SCIC IA: sincronización con datos en vivo (sin fallback obsoleto).
  pyv-comercial-5.4.13 (2026-07-02)''',
        1
    )

# Widen consulta dinamica modal, remove modulo selector
OLD_CD = '''<div id="modal-consulta-dinamica" style="display:none;position:fixed;inset:0;background:#00000088;z-index:3000;overflow-y:auto;padding:16px">
  <div style="max-width:720px;margin:20px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'''
NEW_CD = '''<div id="modal-consulta-dinamica" style="display:none;position:fixed;inset:0;background:#00000088;z-index:3000;overflow-y:auto;padding:16px">
  <div style="max-width:1100px;margin:20px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">'''
text = text.replace(OLD_CD, NEW_CD, 1)

OLD_CD_FILTERS = '''      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        <div>
          <div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">NIVEL</div>
          <select id="cd-nivel" onchange="cdCambiarNivel()" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px">
            <option value="nacional">Nacional</option>
            <option value="rectoria">Por Rectoría</option>
            <option value="sede">Por Sede</option>
          </select>
        </div>
        <div>
          <div id="cd-label-rectoria" style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">RECTORÍA</div>
          <select id="cd-rectoria" onchange="cdActualizar()" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px">
        <option value="">Todas</option>
      </select>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">MÓDULO</div>
          <select id="cd-modulo" onchange="cdActualizar()" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px">
            <option value="resumen">Resumen integral</option>
            <option value="colocacion">Colocación</option>
            <option value="matriculas">Matrículas + Cobertura</option>
            <option value="sigec">SIGEC</option>
            <option value="glpi">GLPI</option>
            <option value="congelados">Congelados</option>
            <option value="susceptibles">Susceptibles</option>
          </select>
        </div>
      </div>
      <div id="cd-contenido" style="min-height:220px;max-height:60vh;overflow-y:auto">'''

NEW_CD_FILTERS = '''      <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:12px;align-items:flex-end">
        <div>
          <div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">NIVEL</div>
          <select id="cd-nivel" onchange="cdCambiarNivel()" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px">
            <option value="nacional">🇨🇴 Nacional</option>
            <option value="rectoria">Por Rectoría</option>
            <option value="sede">Por Sede</option>
          </select>
        </div>
        <div>
          <div id="cd-label-rectoria" style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px">ÁMBITO</div>
          <select id="cd-rectoria" onchange="cdActualizar()" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px">
            <option value="">Todas</option>
          </select>
        </div>
        <button onclick="abrirConsultaDinamica(true)" style="padding:8px 14px;border-radius:8px;border:none;background:#003D45;color:#fff;font-size:11px;font-weight:700;cursor:pointer">↺ Actualizar</button>
      </div>
      <input type="hidden" id="cd-modulo" value="resumen">
      <div id="cd-contenido" style="min-height:280px;max-height:75vh;overflow-y:auto">'''
text = text.replace(OLD_CD_FILTERS, NEW_CD_FILTERS, 1)

# Metas diarias modal - add nivel filters
OLD_MD_FILTERS = '''    <div style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div>
        <div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">SEDE</div>
        <select id="md-sede" onchange="renderMetasDiarias()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;min-width:200px">
          <option value="">Todas las sedes (nacional)</option>
        </select>
      </div>
      <div>
        <div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">MES</div>
        <input type="month" id="md-mes" onchange="renderMetasDiarias()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px">
      </div>
      <button onclick="abrirMetasDiarias(true)" style="padding:8px 14px;border-radius:8px;border:none;background:#003D45;color:#fff;font-size:11px;font-weight:700;cursor:pointer">↺ Actualizar</button>
    </div>'''

NEW_MD_FILTERS = '''    <div style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div>
        <div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">NIVEL</div>
        <select id="md-nivel" onchange="mdCambiarNivel()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;min-width:140px">
          <option value="nacional">🇨🇴 Nacional</option>
          <option value="rectoria">Por Rectoría</option>
          <option value="sede">Por Sede</option>
        </select>
      </div>
      <div>
        <div id="md-label-rectoria" style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">ÁMBITO</div>
        <select id="md-rectoria" onchange="renderMetasDiarias()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;min-width:200px">
          <option value="">Todas</option>
        </select>
      </div>
      <div>
        <div style="font-size:9px;font-weight:700;color:#64748b;margin-bottom:4px">MES</div>
        <input type="month" id="md-mes" onchange="renderMetasDiarias()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px">
      </div>
      <button onclick="abrirMetasDiarias(true)" style="padding:8px 14px;border-radius:8px;border:none;background:#003D45;color:#fff;font-size:11px;font-weight:700;cursor:pointer">↺ Actualizar</button>
    </div>
    <input type="hidden" id="md-sede" value="">'''
text = text.replace(OLD_MD_FILTERS, NEW_MD_FILTERS, 1)

OLD_MD_WIDTH = '<div style="max-width:980px;margin:0 auto;background:#fff;border-radius:20px;'
NEW_MD_WIDTH = '<div style="max-width:1100px;margin:0 auto;background:#fff;border-radius:20px;'
text = text.replace(OLD_MD_WIDTH, NEW_MD_WIDTH, 1)

# Insert module before metas diarias log
MARKER = "  console.log('[SCIC v4.13.1] Metas diarias: colocado = SIGEC facturadas + GLPI aprobadas');"
if '_ioConstruirContexto' not in text:
    text = text.replace(MARKER, mod + '\n' + MARKER, 1)

# Replace _cdRenderPanel
OLD_CD_RENDER = '''  function _cdRenderPanel(){
    var modulo = (document.getElementById('cd-modulo')||{}).value || 'resumen';
    if(['matriculas','congelados','susceptibles'].indexOf(modulo)>=0 && typeof _cdActualizarLegacy==='function'){
      return _cdActualizarLegacy();
    }
    var nivel = (document.getElementById('cd-nivel')||{}).value || 'nacional';
    var sel = (document.getElementById('cd-rectoria')||{}).value || '';
    var el = document.getElementById('cd-contenido');
    if(!el) return;'''

NEW_CD_RENDER = '''  function _cdRenderPanel(){
    var nivel = (document.getElementById('cd-nivel')||{}).value || 'nacional';
    var sel = (document.getElementById('cd-rectoria')||{}).value || '';
    var el = document.getElementById('cd-contenido');
    if(!el) return;
    if(typeof _ioRenderInforme==='function'){
      var ctx = _ioConstruirContexto(nivel, sel);
      el.innerHTML = _ioRenderInforme(ctx, {modo:'operativo', prefix:'cd', incluirHistorial:false});
      var fu = document.getElementById('cd-fuente');
      if(fu) fu.textContent = 'Informe integral · '+ctx.coloc.length+' sedes · SIGEC '+ctx.sig.total+' · GLPI '+ctx.glpi.total;
      return;
    }'''

if '_ioRenderInforme(ctx' not in text:
    text = text.replace(OLD_CD_RENDER, NEW_CD_RENDER, 1)
    # Remove old _cdRenderPanel body - find and truncate from old code to window.cdActualizar
    import re
    # If double body exists, clean up by removing between NEW end and window.cdActualizar first occurrence after _cdRenderPanel
    pattern = r"(if\(typeof _ioRenderInforme==='function'\)\{[\s\S]*?return;\s*\})\s*var coloc = window\._coloc_data"
    if re.search(pattern, text):
        text = re.sub(r"return;\s*\}\s*var coloc = window\._coloc_data[\s\S]*?if\(fu\) fu\.textContent = 'Actualizado[\s\S]*?;\s*\}", r"return;\n    }", text, count=1)

# Replace renderMetasDiarias
OLD_MD_RENDER_START = '''  window.renderMetasDiarias = function(){
    var el = document.getElementById('md-contenido');
    if(!el) return;
    var mesInp = document.getElementById('md-mes');'''

NEW_MD_RENDER = '''  window.mdCambiarNivel = function(){ _ioCambiarNivel('md'); if(typeof renderMetasDiarias==='function') renderMetasDiarias(); };
  window.renderMetasDiarias = function(){
    var el = document.getElementById('md-contenido');
    if(!el) return;
    var nivel = (document.getElementById('md-nivel')||{}).value || 'nacional';
    var sel = (document.getElementById('md-rectoria')||{}).value || '';
    var sedeInp = document.getElementById('md-sede');
    if(sedeInp) sedeInp.value = (nivel==='sede'&&sel)?sel:'';
    if(typeof _ioRenderInforme==='function'){
      var ctx = _ioConstruirContexto(nivel, sel);
      el.innerHTML = _ioRenderInforme(ctx, {modo:'cumplimiento', prefix:'md', incluirHistorial:true});
      return;
    }
    var mesInp = document.getElementById('md-mes');'''

if "incluirHistorial:true" not in text:
    text = text.replace(OLD_MD_RENDER_START, NEW_MD_RENDER, 1)
    # Remove old renderMetasDiarias body until window.abrirMetasDiarias
    import re
    pat = r"incluirHistorial:true\}\);\s*return;\s*\}\s*var mesInp[\s\S]*?el\.innerHTML = html;\s*\};"
    if re.search(pat, text):
        text = re.sub(pat, "incluirHistorial:true});\n      return;\n    }\n  };", text, count=1)

# Update cdCambiarNivel to use _ioCambiarNivel
OLD_CD_CAMBIAR = '''  window.cdCambiarNivel = function(){
    var nivel = (document.getElementById('cd-nivel')||{}).value;
    var sel = document.getElementById('cd-rectoria');
    var lbl = document.getElementById('cd-label-rectoria');
    if(!sel) return;
    var prev = sel.value;
    sel.innerHTML = '';
    var coloc = window._coloc_data || [];
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = nivel==='sede' ? 'Todas las sedes' : 'Todas';
    sel.appendChild(opt0);
    if(nivel==='rectoria'){
      if(lbl) lbl.textContent = 'RECTORÍA';
      var rects = [];
      coloc.forEach(function(r){ if(r.rectoria && rects.indexOf(r.rectoria)<0) rects.push(r.rectoria); });
      rects.sort().forEach(function(r){ var o=document.createElement('option'); o.value=r; o.textContent=r; sel.appendChild(o); });
    } else if(nivel==='sede'){
      if(lbl) lbl.textContent = 'SEDE';
      var sedes = [];
      coloc.forEach(function(r){ if(r.sede && sedes.indexOf(r.sede)<0) sedes.push(r.sede); });
      sedes.sort(function(a,b){ return a.localeCompare(b,'es'); }).forEach(function(s){
        var o=document.createElement('option'); o.value=s; o.textContent=s; sel.appendChild(o);
      });
    } else {
      if(lbl) lbl.textContent = 'ÁMBITO';
    }
    if(prev) sel.value = prev;
    cdActualizar();
  };'''

NEW_CD_CAMBIAR = '''  window.cdCambiarNivel = function(){
    if(typeof _ioCambiarNivel==='function') _ioCambiarNivel('cd');
    cdActualizar();
  };'''

text = text.replace(OLD_CD_CAMBIAR, NEW_CD_CAMBIAR, 1)

# Full data load on open
OLD_ABRIR_CD = '''    if(!(window._coloc_data||[]).length && typeof cargarDesdeSheetsCompleto==='function'){
      cargarDesdeSheetsCompleto(true).then(cargar);
    } else {
      cargar();
    }'''

NEW_ABRIR_CD = '''    var cargarFull = function(){
      if(typeof _cartAsegurarMapaRectorias==='function') _cartAsegurarMapaRectorias();
      cdCambiarNivel();
      var ps = [];
      if(typeof cargarSigecContadoresMenu==='function') ps.push(cargarSigecContadoresMenu().catch(function(){}));
      if(typeof _cargarGLPI==='function') ps.push(_cargarGLPI().catch(function(){}));
      if(typeof _cargarMallaTurnos==='function') ps.push(_cargarMallaTurnos().catch(function(){}));
      if(typeof _cargarCartera==='function') ps.push(_cargarCartera().catch(function(){}));
      Promise.all(ps).then(cdActualizar).catch(cdActualizar);
    };
    if(typeof cargarDesdeSheetsCompleto==='function'){
      var el=document.getElementById('cd-contenido');
      if(el) el.innerHTML='<div style="text-align:center;padding:40px;color:#94a3b8">⏳ Cargando 8 repositorios desde Sheets…</div>';
      cargarDesdeSheetsCompleto(true).then(cargarFull).catch(cargarFull);
    } else { cargarFull(); }'''

text = text.replace(OLD_ABRIR_CD, NEW_ABRIR_CD, 1)

# abrirMetasDiarias full load
OLD_ABRIR_MD_END = '''    if(refresh || !(window._sigecRows||[]).length || !(window._glpiRows||[]).length){
      var el = document.getElementById('md-contenido');
      if(el) el.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">Cargando SIGEC + GLPI…</div>';
      var promSig = (typeof cargarSigecContadoresMenu==='function') ? cargarSigecContadoresMenu() : (typeof _leerHojaSigecColocacion==='function' ? _leerHojaSigecColocacion() : Promise.resolve());
      var promGlpi = (typeof _cargarGLPI==='function') ? _cargarGLPI() : Promise.resolve();
      Promise.all([promSig, promGlpi]).then(cargar).catch(function(e){
        if(el) el.innerHTML = '<div style="padding:20px;color:#dc2626;font-size:12px">Error cargando datos: '+(e&&e.message||e)+'</div>';
      });
    } else {
      cargar();
    }'''

NEW_ABRIR_MD_END = '''    var cargarFull = function(){
      if(typeof mdCambiarNivel==='function') mdCambiarNivel();
      else if(typeof _ioCambiarNivel==='function') _ioCambiarNivel('md');
      cargar();
    };
    if(refresh || !(window._sigecRows||[]).length || !(window._coloc_data||[]).length){
      var el = document.getElementById('md-contenido');
      if(el) el.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">⏳ Cargando repositorios desde Sheets…</div>';
      var prom = (typeof cargarDesdeSheetsCompleto==='function') ? cargarDesdeSheetsCompleto(true) : Promise.resolve();
      prom.then(cargarFull).catch(function(e){
        if(el) el.innerHTML = '<div style="padding:20px;color:#dc2626;font-size:12px">Error: '+(e&&e.message||e)+'</div>';
      });
    } else { cargarFull(); }'''

text = text.replace(OLD_ABRIR_MD_END, NEW_ABRIR_MD_END, 1)

# Fix SCIC IA - remove fallback injection
text = text.replace(
    "if((!window._coloc_data||!window._coloc_data.length) && typeof _COLOC_FALLBACK!=='undefined')\n          window._coloc_data = _COLOC_FALLBACK;",
    "if(typeof cargarDesdeSheetsCompleto==='function' && (!window._coloc_data||!window._coloc_data.length)) cargarDesdeSheetsCompleto(false).catch(function(){});",
    1
)

# Enhance CMD IA chips
OLD_CHIPS = '''    <div class="cmd-ia-chips">
      <button type="button" onclick="cmdIAPreguntaRapida('¿Cómo está Bello?')">Bello</button>
      <button type="button" onclick="cmdIAPreguntaRapida('¿Cómo está Engativá?')">Engativá</button>
      <button type="button" onclick="cmdIAPreguntaRapida('Estado nacional S2')">Nacional</button>
      <button type="button" onclick="cmdIAPreguntaRapida('¿Cuáles son los riesgos en cartera?')">Riesgos</button>
    </div>'''

NEW_CHIPS = '''    <div class="cmd-ia-chips">
      <button type="button" onclick="cmdIAPreguntaRapida('¿Cómo está Bello?')">Bello</button>
      <button type="button" onclick="cmdIAPreguntaRapida('¿Cómo está Cali?')">Cali</button>
      <button type="button" onclick="cmdIAPreguntaRapida('Estado rectoría Bogotá')">Rectoría</button>
      <button type="button" onclick="cmdIAPreguntaRapida('Estado nacional S2')">Nacional</button>
      <button type="button" onclick="cmdIAPreguntaRapida('SIGEC y GLPI nacional')">SIGEC+GLPI</button>
      <button type="button" onclick="cmdIAPreguntaRapida('¿Cuáles son los riesgos en cartera?')">Cartera</button>
      <button type="button" onclick="cmdIAPreguntaRapida('Estado malla y asesores')">Malla</button>
    </div>'''
text = text.replace(OLD_CHIPS, NEW_CHIPS, 1)

# Enhance procesarConsultaCmdIA - insert before function if not enhanced
OLD_PROC = '''  function procesarConsultaCmdIA(pregunta){
    var q = String(pregunta||'').trim();
    if(!q) return 'Escribe una pregunta, por ejemplo: <b>¿Cómo está Bello?</b>';
    var ql = q.toLowerCase();
    if(ql.indexOf('riesg')>=0 && ql.indexOf('cartera')>=0) return _cmdIARiesgosCartera();
    if(ql.indexOf('nacional')>=0 || ql.indexOf('país')>=0 || ql.indexOf('pais')>=0 || ql.indexOf('s2')>=0 && ql.indexOf('estado')>=0)
      return _cmdIAGenerarInformeNacional();
    var sede = _cmdIAResolverSede(q);
    if(sede) return _cmdIAGenerarInformeSede(sede);
    if(ql.indexOf('hola')>=0 || ql.indexOf('ayuda')>=0)
      return 'Puedo responder sobre <b>sedes</b> (ej. Bello, Cali, Engativá), <b>estado nacional</b> o <b>riesgos de cartera</b>.';
    return 'No identifiqué la sede en tu pregunta. Prueba: <b>¿Cómo está Bello?</b> o <b>Estado nacional S2</b>.';
  }'''

NEW_PROC = '''  function _cmdIAResolverRectoria(q){
    var ql=_cmdIANorm(q);
    var rects=(typeof _mapaListaRectorias==='function')?_mapaListaRectorias():[];
    for(var i=0;i<rects.length;i++){
      var r=rects[i], nr=_cmdIANorm(r);
      if(ql.indexOf(nr)>=0||ql.indexOf('rectoria')>=0&&ql.indexOf(nr.replace('rectoria',''))>=0) return r;
    }
    if(ql.indexOf('bogota')>=0||ql.indexOf('bogotá')>=0) return rects.find(function(r){return r.indexOf('Bogotá')>=0;})||null;
    if(ql.indexOf('antioquia')>=0) return rects.find(function(r){return r.indexOf('Antioquia')>=0;})||null;
    if(ql.indexOf('caribe')>=0) return rects.find(function(r){return r.indexOf('Caribe')>=0;})||null;
    return null;
  }
  function _cmdIAGenerarInformeRectoria(rect){
    if(typeof _ioRenderInforme!=='function') return '<b>'+rect+'</b>: informe integral no disponible.';
    var ctx=_ioConstruirContexto('rectoria', rect);
    return _ioRenderInforme(ctx, {modo:'operativo', prefix:'cd', incluirHistorial:false});
  }
  function _cmdIAGenerarInformeIntegral(nivel, sel){
    if(typeof _ioRenderInforme!=='function') return 'Cargando motor de informes…';
    var ctx=_ioConstruirContexto(nivel, sel||'');
    var modo=nivel==='nacional'?'operativo':'cumplimiento';
    return _ioRenderInforme(ctx, {modo:modo, prefix:'cd', incluirHistorial:nivel!=='nacional'});
  }
  function procesarConsultaCmdIA(pregunta){
    var q = String(pregunta||'').trim();
    if(!q) return 'Escribe una pregunta, por ejemplo: <b>¿Cómo está Bello?</b>';
    var ql = q.toLowerCase();
    if(ql.indexOf('ayuda')>=0||ql.indexOf('hola')>=0)
      return 'Puedo informar sobre <b>sedes</b>, <b>rectorías</b>, <b>estado nacional</b>, <b>SIGEC/GLPI</b>, <b>cartera</b>, <b>malla</b> y <b>asesores</b>. Ej: «¿Cómo está Bello?», «Estado rectoría Bogotá», «SIGEC nacional».';
    if(ql.indexOf('riesg')>=0 && ql.indexOf('cartera')>=0) return _cmdIARiesgosCartera();
    if((ql.indexOf('malla')>=0||ql.indexOf('asesor')>=0||ql.indexOf('turno')>=0)&&typeof _ioRenderInforme==='function'){
      var ctxN=_ioConstruirContexto('nacional','');
      return _ioRenderInforme(ctxN,{modo:'operativo',prefix:'cd',incluirHistorial:false});
    }
    if(ql.indexOf('sigec')>=0||ql.indexOf('glpi')>=0||ql.indexOf('radicad')>=0){
      if(typeof _ioRenderInforme==='function') return _cmdIAGenerarInformeIntegral('nacional','');
      return _cmdIAGenerarInformeNacional();
    }
    if(ql.indexOf('rector')>=0){
      var rect=_cmdIAResolverRectoria(q);
      if(rect) return _cmdIAGenerarInformeRectoria(rect);
    }
    if(ql.indexOf('nacional')>=0 || ql.indexOf('país')>=0 || ql.indexOf('pais')>=0 || (ql.indexOf('s2')>=0 && ql.indexOf('estado')>=0)){
      if(typeof _ioRenderInforme==='function') return _cmdIAGenerarInformeIntegral('nacional','');
      return _cmdIAGenerarInformeNacional();
    }
    var sede = _cmdIAResolverSede(q);
    if(sede){
      if(typeof _ioRenderInforme==='function') return _cmdIAGenerarInformeIntegral('sede', sede);
      return _cmdIAGenerarInformeSede(sede);
    }
    return 'No identifiqué sede o rectoría. Prueba: <b>¿Cómo está Bello?</b>, <b>Estado rectoría Bogotá</b> o <b>Estado nacional S2</b>.';
  }'''

if '_cmdIAResolverRectoria' not in text:
    text = text.replace(OLD_PROC, NEW_PROC, 1)

# Widen CMD IA panel
text = text.replace(
    '.cmd-ia-panel{position:fixed;bottom:88px;right:22px;width:min(400px,calc(100vw - 32px));max-height:min(520px,70vh);',
    '.cmd-ia-panel{position:fixed;bottom:88px;right:22px;width:min(480px,calc(100vw - 32px));max-height:min(620px,78vh);',
    1
)
text = text.replace(
    '.cmd-ia-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:320px}',
    '.cmd-ia-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:420px}',
    1
)

# MCM stubs enhancement for SCIC panels
OLD_MCM = '''  cumplimiento: function(){ try{ return MCM_CUMPLIMIENTO.nacional(); }catch(e){ return null; } },'''
NEW_MCM = '''  cumplimiento: function(){
    try{ return MCM_CUMPLIMIENTO.nacional(); }catch(e){}
    try{
      if(typeof _ioConstruirContexto==='function'){
        var c=_ioConstruirContexto('nacional','');
        return {meta:c.meta, ejec:c.acum, pct:c.pct, sigec:c.sig, glpi:c.glpi, colMes:c.colMes};
      }
    }catch(e2){}
    return null;
  },'''
if 'colMes:c.colMes' not in text:
    text = text.replace(OLD_MCM, NEW_MCM, 1)

# abrirConsultaDinamica signature with refresh param
OLD_ABRIR_CD_FN = '  window.abrirConsultaDinamica = function(){'
NEW_ABRIR_CD_FN = '  window.abrirConsultaDinamica = function(refresh){'
text = text.replace(OLD_ABRIR_CD_FN, NEW_ABRIR_CD_FN, 1)

# Update menu card descriptions
text = text.replace(
    'Consulta dinámica SIGEC, GLPI y colocación por sede o rectoría.',
    'Informe integral: nacional, rectoría y sede · 8 repositorios · asesores y malla.',
    1
)
text = text.replace(
    'Metas diarias: SIGEC facturadas + GLPI aprobadas vs meta por sede.',
    'Cumplimiento integral: metas, SIGEC, GLPI, cartera y desglose por sede.',
    1
)

p.write_text(text, encoding='utf-8')
print('Patch applied. Lines:', text.count(chr(10))+1)
