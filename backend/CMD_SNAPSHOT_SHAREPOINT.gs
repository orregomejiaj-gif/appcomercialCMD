/**
 * CMD Snapshot → SharePoint — Cooperativa Minuto de Dios
 * Sube CMD_snapshot_YYYY-MM-DD.json.gz a carpeta OneDrive/SharePoint vía Microsoft Graph.
 *
 * PROPIEDADES DEL SCRIPT (Configuración → Propiedades del script):
 *   MS_TENANT_ID          = coopminutodedios.onmicrosoft.com  (o GUID del tenant)
 *   MS_CLIENT_ID          = Application (client) ID de Azure AD
 *   MS_CLIENT_SECRET      = Client secret
 *   SNAPSHOT_FOLDER_URL   = URL de carpeta compartida SharePoint/OneDrive
 *
 * Azure AD (una vez, admin TI):
 *   1. Registrar app → Permisos de aplicación Microsoft Graph → Files.ReadWrite.All
 *   2. Otorgar consentimiento de administrador
 *   3. Crear client secret
 *
 * IMPLEMENTAR → Aplicación web → Cualquier usuario → URL /exec
 * Pegar URL en seguimiento_comercial_CMD.html → SNAPSHOT_SHAREPOINT.proxyUrl
 */

var SNAPSHOT_FOLDER_DEFAULT =
  'https://coopminutodedios-my.sharepoint.com/:f:/p/juan_orrego/IgAt8-dt3RRVQ5pZNHU8fGWLAZXjmssy_xF1ydJlTwiQFZM?e=fyzMfR';

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  return jsonResponse_({
    ok: true,
    servicio: 'CMD Snapshot SharePoint',
    version: '1.0.0',
    graph_configurado: !!(props.getProperty('MS_CLIENT_ID') && props.getProperty('MS_CLIENT_SECRET')),
    carpeta: props.getProperty('SNAPSHOT_FOLDER_URL') || SNAPSHOT_FOLDER_DEFAULT,
    uso: 'POST { accion:"snapshot", fecha_corte, filename, payload_b64, checksum, generado_en, app_version }'
  });
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    var accion = String(body.accion || '').toLowerCase();

    if (accion === 'snapshot' || accion === 'snapshot_sharepoint' || accion === 'upload') {
      return jsonFromResult_(uploadSnapshot_(body));
    }

    if (accion === 'listar' || accion === 'list') {
      return jsonFromResult_(listarSnapshots_(body));
    }

    return jsonResponse_({ ok: false, error: 'Acción no reconocida: ' + accion }, 400);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) }, 500);
  }
}

function uploadSnapshot_(body) {
  var fecha = String(body.fecha_corte || '').trim();
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: 'fecha_corte inválida (YYYY-MM-DD)' };
  }

  var b64 = String(body.payload_b64 || '');
  if (!b64) {
    return { ok: false, error: 'Falta payload_b64' };
  }

  var filename = String(body.filename || ('CMD_snapshot_' + fecha + '.json.gz'));
  if (filename.indexOf('CMD_snapshot_') !== 0) {
    filename = 'CMD_snapshot_' + fecha + '.json.gz';
  }

  var bytes = Utilities.base64Decode(b64);
  var token = getGraphToken_();
  var folderUrl = PropertiesService.getScriptProperties().getProperty('SNAPSHOT_FOLDER_URL') || SNAPSHOT_FOLDER_DEFAULT;
  var folder = resolveShareFolder_(token, folderUrl);

  var uploadUrl = 'https://graph.microsoft.com/v1.0/drives/' +
    encodeURIComponent(folder.driveId) + '/items/' +
    encodeURIComponent(folder.itemId) + ':/' +
    encodeURIComponent(filename) + ':/content';

  var resp = UrlFetchApp.fetch(uploadUrl, {
    method: 'put',
    contentType: 'application/gzip',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
    payload: bytes
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();

  if (code < 200 || code >= 300) {
    return {
      ok: false,
      error: 'Graph upload ' + code,
      detail: raw.slice(0, 500)
    };
  }

  var item = JSON.parse(raw);
  return {
    ok: true,
    fecha_corte: fecha,
    filename: filename,
    webUrl: item.webUrl || null,
    id: item.id || null,
    size: bytes.length,
    checksum: body.checksum || null
  };
}

function listarSnapshots_(body) {
  var token = getGraphToken_();
  var folderUrl = PropertiesService.getScriptProperties().getProperty('SNAPSHOT_FOLDER_URL') || SNAPSHOT_FOLDER_DEFAULT;
  var folder = resolveShareFolder_(token, folderUrl);

  var listUrl = 'https://graph.microsoft.com/v1.0/drives/' +
    encodeURIComponent(folder.driveId) + '/items/' +
    encodeURIComponent(folder.itemId) + '/children?$filter=startswith(name,\'CMD_snapshot_\')&$orderby=name desc&$top=' +
    (Number(body.limit) || 60);

  var resp = UrlFetchApp.fetch(listUrl, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();
  if (code < 200 || code >= 300) {
    return { ok: false, error: 'Graph list ' + code, detail: raw.slice(0, 400) };
  }

  var data = JSON.parse(raw);
  var items = (data.value || []).map(function(it) {
    return {
      name: it.name,
      fecha_corte: (it.name || '').replace('CMD_snapshot_', '').replace('.json.gz', '').replace('.json', ''),
      modified: it.lastModifiedDateTime,
      size: it.size,
      webUrl: it.webUrl,
      id: it.id
    };
  });

  return { ok: true, items: items };
}

function resolveShareFolder_(token, sharingUrl) {
  var shareId = encodeShareUrl_(sharingUrl);
  var url = 'https://graph.microsoft.com/v1.0/shares/' + encodeURIComponent(shareId) + '/driveItem';

  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('No se pudo resolver carpeta SharePoint (' + code + '): ' + raw.slice(0, 300));
  }

  var item = JSON.parse(raw);
  var driveId = item.parentReference && item.parentReference.driveId;
  var itemId = item.id;
  if (!driveId || !itemId) {
    throw new Error('Respuesta Graph sin driveId/itemId');
  }
  return { driveId: driveId, itemId: itemId, name: item.name };
}

function encodeShareUrl_(sharingUrl) {
  var base64 = Utilities.base64EncodeWebSafe(Utilities.newBlob(String(sharingUrl)).getBytes());
  return 'u!' + base64.replace(/=+$/, '');
}

function getGraphToken_() {
  var props = PropertiesService.getScriptProperties();
  var tenant = props.getProperty('MS_TENANT_ID') || 'coopminutodedios.onmicrosoft.com';
  var clientId = props.getProperty('MS_CLIENT_ID');
  var clientSecret = props.getProperty('MS_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Configura MS_CLIENT_ID y MS_CLIENT_SECRET en Propiedades del script');
  }

  var tokenUrl = 'https://login.microsoftonline.com/' + encodeURIComponent(tenant) + '/oauth2/v2.0/token';
  var resp = UrlFetchApp.fetch(tokenUrl, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    muteHttpExceptions: true,
    payload: {
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }
  });

  var code = resp.getResponseCode();
  var raw = resp.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Token Microsoft ' + code + ': ' + raw.slice(0, 400));
  }

  var data = JSON.parse(raw);
  if (!data.access_token) {
    throw new Error('Token sin access_token');
  }
  return data.access_token;
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
      error: result.error || 'Error',
      detail: result.detail || null
    }, 500);
  }
  return jsonResponse_(result);
}

function jsonResponse_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
