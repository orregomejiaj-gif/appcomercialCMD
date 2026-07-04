/**
 * SCIC IA Proxy — Cooperativa Minuto de Dios
 * Proxy solo Google Gemini (gratis) desde la app SCIC en GitHub Pages.
 *
 * PROPIEDAD DEL SCRIPT:
 *   GEMINI_API_KEY = clave de https://aistudio.google.com/apikey
 *
 * IMPLEMENTAR → Aplicación web → Cualquier usuario → URL /exec
 */

function doGet(e) {
  return jsonResponse_({
    ok: true,
    servicio: 'SCIC IA Proxy',
    version: '3.0.0',
    proveedor: 'Google Gemini',
    gemini: !!PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
    uso: 'POST { accion: "ia", system, prompt }'
  });
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    var accion = String(body.accion || 'ia').toLowerCase();

    if (accion === 'ia' || accion === 'ia_gemini' || accion === 'gemini' || accion === 'ia_claude' || accion === 'claude') {
      return jsonFromResult_(callGemini_(body));
    }

    return jsonResponse_({ ok: false, error: 'Acción no reconocida: ' + accion }, 400);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) }, 500);
  }
}

function callGemini_(body) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return {
      ok: false,
      error: 'GEMINI_API_KEY no configurada. Crear en aistudio.google.com/apikey y pegar en Propiedades del script.'
    };
  }

  var system = String(body.system || '');
  var prompt = String(body.prompt || body.user || '');
  if (!prompt) {
    return { ok: false, error: 'Falta prompt' };
  }

  var model = body.gemini_model || body.model || 'gemini-2.0-flash';
  var maxTokens = Number(body.max_tokens) || 1200;

  var payload = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 }
  };

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();

  if (code < 200 || code >= 300) {
    return {
      ok: false,
      error: 'Gemini API ' + code,
      detail: raw.slice(0, 400)
    };
  }

  var data = JSON.parse(raw);
  var text = '';
  try {
    var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    text = parts.map(function(p) { return p.text || ''; }).join('\n');
  } catch (e) {
    text = '';
  }

  if (!text) {
    return { ok: false, error: 'Gemini sin texto en respuesta', detail: raw.slice(0, 300) };
  }

  return {
    ok: true,
    text: text,
    provider: 'Gemini',
    model: model
  };
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return {};
}

function jsonFromResult_(result) {
  if (!result.ok) {
    return jsonResponse_({
      ok: false,
      error: result.error || 'Error IA',
      detail: result.detail || null
    }, 500);
  }
  return jsonResponse_({
    ok: true,
    text: result.text,
    provider: result.provider || 'Gemini',
    model: result.model || ''
  });
}

function jsonResponse_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
