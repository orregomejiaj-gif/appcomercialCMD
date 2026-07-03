/**
 * SCIC IA Proxy — Cooperativa Minuto de Dios
 * Proxy seguro para Claude API (Anthropic) desde la app SCIC en GitHub Pages.
 *
 * DESPLIEGUE:
 * 1. script.google.com → Nuevo proyecto → pegar este archivo
 * 2. Configuración del proyecto → Propiedades del script → ANTHROPIC_API_KEY = sk-ant-...
 * 3. Implementar → Nueva implementación → Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 4. Copiar URL /exec y pegar en seguimiento_comercial_CMD.html:
 *    var SCIC_IA_PROXY_URL = 'https://script.google.com/macros/s/.../exec';
 */

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function doGet(e) {
  return jsonResponse_({
    ok: true,
    servicio: 'SCIC IA Proxy',
    version: '1.0.0',
    uso: 'POST con { accion: "ia_claude", system, prompt }'
  });
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var accion = body.accion || (e && e.parameter && e.parameter.accion) || '';

    if (accion === 'ia_claude' || accion === 'claude') {
      return handleClaude_(body);
    }

    return jsonResponse_({ ok: false, error: 'Acción no reconocida: ' + accion }, 400);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) }, 500);
  }
}

function handleClaude_(body) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonResponse_({
      ok: false,
      error: 'ANTHROPIC_API_KEY no configurada en Propiedades del script'
    }, 500);
  }

  var system = String(body.system || '');
  var prompt = String(body.prompt || body.user || '');
  if (!prompt) {
    return jsonResponse_({ ok: false, error: 'Falta prompt' }, 400);
  }

  var model = body.model || 'claude-sonnet-4-20250514';
  var maxTokens = Number(body.max_tokens) || 1200;

  var payload = {
    model: model,
    max_tokens: maxTokens,
    system: system,
    messages: [{ role: 'user', content: prompt }]
  };

  var resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();

  if (code < 200 || code >= 300) {
    return jsonResponse_({
      ok: false,
      error: 'Anthropic API ' + code,
      detail: raw.slice(0, 500)
    }, code);
  }

  var data = JSON.parse(raw);
  var text = '';
  if (data.content && data.content.length) {
    text = data.content.map(function(c) { return c.text || ''; }).join('\n');
  }

  return jsonResponse_({
    ok: true,
    text: text || 'Sin respuesta',
    model: data.model || model,
    usage: data.usage || null
  });
}

function jsonResponse_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
