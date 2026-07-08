/**
 * SCIC IA Proxy — Cooperativa Minuto de Dios
 * Proxy Google Gemini (gratis) desde la app SCIC en GitHub Pages.
 *
 * PROPIEDAD DEL SCRIPT:
 *   GEMINI_API_KEY = clave de https://aistudio.google.com/apikey
 *
 * IMPLEMENTAR → Aplicación web → Cualquier usuario → URL /exec
 *
 * Acciones POST:
 *   ia | ia_gemini | gemini  — turno simple (system + prompt)
 *   ia_gemini_chat            — multi-turno + function calling (contents + tools)
 */

function doGet(e) {
  return jsonResponse_({
    ok: true,
    servicio: 'SCIC IA Proxy',
    version: '3.1.0',
    proveedor: 'Google Gemini',
    gemini: !!PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
    uso: 'POST { accion: "ia_gemini_chat", system, contents, tools }'
  });
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    var accion = String(body.accion || 'ia').toLowerCase();

    if (accion === 'ia_gemini_chat' || accion === 'gemini_chat' || accion === 'ia_tools') {
      return jsonFromResult_(callGeminiChat_(body));
    }

    if (accion === 'ia' || accion === 'ia_gemini' || accion === 'gemini' || accion === 'ia_claude' || accion === 'claude') {
      return jsonFromResult_(callGemini_(body));
    }

    return jsonResponse_({ ok: false, error: 'Acción no reconocida: ' + accion }, 400);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) }, 500);
  }
}

function getApiKey_() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

function geminiFetch_(model, payload) {
  var apiKey = getApiKey_();
  if (!apiKey) {
    return {
      ok: false,
      error: 'GEMINI_API_KEY no configurada. Crear en aistudio.google.com/apikey y pegar en Propiedades del script.'
    };
  }

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
      detail: raw.slice(0, 500)
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw), model: model };
  } catch (e) {
    return { ok: false, error: 'Respuesta Gemini inválida', detail: raw.slice(0, 300) };
  }
}

function parseGeminiParts_(data) {
  var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  var text = '';
  var functionCall = null;

  parts.forEach(function(p) {
    if (p.text) text += p.text;
    if (p.functionCall) functionCall = p.functionCall;
  });

  return { text: text || null, functionCall: functionCall };
}

function callGemini_(body) {
  var system = String(body.system || '');
  var prompt = String(body.prompt || body.user || '');
  if (!prompt) {
    return { ok: false, error: 'Falta prompt' };
  }

  var model = body.gemini_model || body.model || 'gemini-2.0-flash';
  var maxTokens = Number(body.max_tokens) || 1800;

  var payload = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.35 }
  };

  var fetched = geminiFetch_(model, payload);
  if (!fetched.ok) return fetched;

  var parsed = parseGeminiParts_(fetched.data);
  if (!parsed.text) {
    return { ok: false, error: 'Gemini sin texto en respuesta', detail: JSON.stringify(fetched.data).slice(0, 300) };
  }

  return {
    ok: true,
    text: parsed.text,
    provider: 'Gemini',
    model: model
  };
}

function callGeminiChat_(body) {
  var contents = body.contents;
  if (!contents || !contents.length) {
    return { ok: false, error: 'Falta contents (array multi-turno)' };
  }

  var model = body.gemini_model || body.model || 'gemini-2.0-flash';
  var maxTokens = Number(body.max_tokens) || 2200;
  var system = String(body.system || '');

  var payload = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.35 }
  };

  if (body.tools && body.tools.length) {
    payload.tools = [{ functionDeclarations: body.tools }];
  }

  var fetched = geminiFetch_(model, payload);
  if (!fetched.ok) return fetched;

  var parsed = parseGeminiParts_(fetched.data);

  if (parsed.functionCall) {
    return {
      ok: true,
      provider: 'Gemini',
      model: model,
      function_call: {
        name: parsed.functionCall.name || '',
        args: parsed.functionCall.args || {}
      }
    };
  }

  if (!parsed.text) {
    return { ok: false, error: 'Gemini sin texto ni functionCall', detail: JSON.stringify(fetched.data).slice(0, 300) };
  }

  return {
    ok: true,
    text: parsed.text,
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
  var out = {
    ok: true,
    provider: result.provider || 'Gemini',
    model: result.model || ''
  };
  if (result.text) out.text = result.text;
  if (result.function_call) out.function_call = result.function_call;
  return jsonResponse_(out);
}

function jsonResponse_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
