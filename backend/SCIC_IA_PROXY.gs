/**
 * SCIC IA Proxy — Cooperativa Minuto de Dios
 * Proxy para IA desde la app SCIC (GitHub Pages).
 *
 * Orden por defecto (accion "ia"): Gemini (gratis) → Claude (si falla o sin Gemini).
 *
 * PROPIEDADES DEL SCRIPT (Configuración del proyecto):
 *   GEMINI_API_KEY     = clave de https://aistudio.google.com/apikey  (gratis)
 *   ANTHROPIC_API_KEY  = clave de console.anthropic.com (opcional, respaldo)
 *
 * IMPLEMENTAR → Aplicación web → Cualquier usuario → copiar URL /exec
 */

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  return jsonResponse_({
    ok: true,
    servicio: 'SCIC IA Proxy',
    version: '2.0.0',
    gemini: !!props.getProperty('GEMINI_API_KEY'),
    claude: !!props.getProperty('ANTHROPIC_API_KEY'),
    uso: 'POST { accion: "ia", system, prompt } — prueba Gemini y luego Claude'
  });
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    var accion = String(body.accion || '').toLowerCase();

    if (accion === 'ia_gemini' || accion === 'gemini') {
      return jsonFromResult_(callGemini_(body));
    }
    if (accion === 'ia_claude' || accion === 'claude') {
      return jsonFromResult_(callClaude_(body));
    }
    if (accion === 'ia' || accion === 'ia_chat' || accion === '') {
      return jsonFromResult_(callIAWithFallback_(body));
    }

    return jsonResponse_({ ok: false, error: 'Acción no reconocida: ' + accion }, 400);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) }, 500);
  }
}

/** Gemini primero (gratis), luego Claude. */
function callIAWithFallback_(body) {
  var errors = [];
  var geminiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (geminiKey) {
    var g = callGemini_(body);
    if (g.ok) return g;
    errors.push('Gemini: ' + (g.error || 'error'));
  } else {
    errors.push('Gemini: GEMINI_API_KEY no configurada');
  }

  var claudeKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (claudeKey) {
    var c = callClaude_(body);
    if (c.ok) return c;
    errors.push('Claude: ' + (c.error || 'error'));
  } else {
    errors.push('Claude: ANTHROPIC_API_KEY no configurada');
  }

  return {
    ok: false,
    error: 'Ningún proveedor IA disponible. ' + errors.join(' · ')
  };
}

function callGemini_(body) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY no configurada' };
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

function callClaude_(body) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return { ok: false, error: 'ANTHROPIC_API_KEY no configurada' };
  }

  var system = String(body.system || '');
  var prompt = String(body.prompt || body.user || '');
  if (!prompt) {
    return { ok: false, error: 'Falta prompt' };
  }

  var model = body.claude_model || body.model || 'claude-sonnet-4-20250514';
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
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload)
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();

  if (code < 200 || code >= 300) {
    return {
      ok: false,
      error: 'Anthropic API ' + code,
      detail: raw.slice(0, 400)
    };
  }

  var data = JSON.parse(raw);
  var text = '';
  if (data.content && data.content.length) {
    text = data.content.map(function(c) { return c.text || ''; }).join('\n');
  }

  return {
    ok: true,
    text: text || 'Sin respuesta',
    provider: 'Claude',
    model: data.model || model,
    usage: data.usage || null
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
    provider: result.provider || 'IA',
    model: result.model || ''
  });
}

function jsonResponse_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
