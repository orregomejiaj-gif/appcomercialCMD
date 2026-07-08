# Backend SCIC IA Proxy (solo Gemini)

Proxy en **Google Apps Script** para conectar SCIC con **Google Gemini** (plan gratis).

## Configuración (una sola vez)

### 1. Clave Gemini (gratis)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key**
2. Copiar clave `AIza...` (no compartir en chats)

### 2. Apps Script

1. [script.google.com](https://script.google.com) → tu proyecto
2. Pegar código de `backend/SCIC_IA_PROXY.gs` (versión 3.1.0)
3. Engranaje → **Propiedades del script**:

| Propiedad | Valor |
|-----------|--------|
| `GEMINI_API_KEY` | `AIza...` |

4. **Implementar** → **Nueva versión** → Aplicación web → **Cualquier usuario**

### 3. App SCIC

La URL ya está en el HTML (`SCIC_IA_PROXY_URL`). No pegar claves en GitHub.

## Probar

Abrir la URL `/exec` en el navegador:

```json
{"ok":true,"proveedor":"Google Gemini","gemini":true,"version":"3.1.0"}
```

## Sin Gemini configurado

La app usa **análisis local MCM** (datos de Sheets).
