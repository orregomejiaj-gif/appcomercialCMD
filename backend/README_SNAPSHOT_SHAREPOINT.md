# Snapshot diario → SharePoint

Los JSON de corte diario (`CMD_snapshot_YYYY-MM-DD.json.gz`) se guardan automáticamente a las **23:00** en:

**Carpeta:** [SharePoint juan_orrego](https://coopminutodedios-my.sharepoint.com/:f:/p/juan_orrego/IgAt8-dt3RRVQ5pZNHU8fGWLAZXjmssy_xF1ydJlTwiQFZM?e=fyzMfR)

Además quedan en **IndexedDB** del navegador (modo histórico local).

## Opción A — Proxy Apps Script (recomendada para 23:00 sin popup)

Subida **desatendida** con permisos de aplicación Microsoft Graph.

### 1. Azure AD (admin TI — una vez)

1. [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **Registros de aplicaciones** → **Nueva**.
2. Nombre: `CMD Snapshot SharePoint`.
3. Tipo: **Cuentas solo en este directorio organizativo**.
4. **Certificados y secretos** → Nuevo secreto de cliente → copiar valor.
5. **Permisos de API** → Microsoft Graph → **Permisos de aplicación**:
   - `Files.ReadWrite.All`
6. **Conceder consentimiento de administrador** para la cooperativa.

Anotar: **Id. de aplicación (cliente)** y **Id. de directorio (inquilino)**.

### 2. Apps Script

1. [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Pegar código de `backend/CMD_SNAPSHOT_SHAREPOINT.gs`.
3. **Configuración del proyecto** → **Propiedades del script**:

| Propiedad | Valor |
|-----------|--------|
| `MS_TENANT_ID` | `coopminutodedios.onmicrosoft.com` (o GUID del tenant) |
| `MS_CLIENT_ID` | Id. de aplicación Azure |
| `MS_CLIENT_SECRET` | Secreto del cliente |
| `SNAPSHOT_FOLDER_URL` | URL de la carpeta SharePoint (ya viene por defecto la de juan_orrego) |

4. **Implementar** → **Nueva implementación** → Tipo: **Aplicación web** → Ejecutar como: **Yo** → Acceso: **Cualquier usuario**.
5. Copiar URL que termina en `/exec`.

### 3. App HTML

En `seguimiento_comercial_CMD.html`, asignar la URL:

```javascript
SNAPSHOT_SHAREPOINT.proxyUrl = 'https://script.google.com/macros/s/TU_ID/exec';
```

### Probar

Abrir la URL `/exec` en el navegador:

```json
{"ok":true,"servicio":"CMD Snapshot SharePoint","graph_configurado":true,...}
```

Prueba manual desde consola del navegador (con la app abierta y datos cargados):

```javascript
cmdGuardarSnapshotDiario('2026-07-06', { forzar: true })
```

Verificar que aparece `CMD_snapshot_2026-07-06.json.gz` en la carpeta SharePoint.

---

## Opción B — MSAL en el navegador (alternativa)

Si no hay proxy, configurar en el HTML:

```javascript
SNAPSHOT_SHAREPOINT.msClientId = 'TU_SPA_CLIENT_ID';
```

Registrar en Azure AD una app **SPA** con URI de redirección = URL de GitHub Pages de la app, permisos delegados `Files.ReadWrite.All`.

A las 23:00 el navegador intentará token silencioso; si el usuario inició sesión Microsoft ese día funcionará sin popup.

---

## Archivos generados

| Archivo | Contenido |
|---------|-----------|
| `CMD_snapshot_2026-07-06.json.gz` | Snapshot completo gzip del día |
| Schema | `cmd-snapshot` v1 + checksum SHA-256 |
