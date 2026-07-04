# Backend SCIC IA Proxy (Gemini + Claude)

La app SCIC en GitHub Pages no puede llamar APIs de IA directamente (CORS + claves). Este proxy en **Google Apps Script** las conecta de forma segura.

## Orden de respuesta (recomendado)

Con `accion: "ia"` el proxy intenta:

1. **Google Gemini** (plan gratis en AI Studio)
2. Si falla → **Claude** (Anthropic, de pago/créditos)
3. Si ambos fallan → la app usa **análisis local MCM**

---

## Paso 1 — Clave Gemini (gratis)

1. Entra a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Create API key**
3. Copia la clave (empieza por `AIza...`)

## Paso 2 — Clave Claude (opcional, ya la tienes)

Solo si quieres respaldo cuando Gemini falle o se agote el cupo.

---

## Paso 3 — Pegar claves en Apps Script

1. [script.google.com](https://script.google.com) → tu proyecto `SCIC_IA_PROXY`
2. **Reemplaza todo el código** con `backend/SCIC_IA_PROXY.gs` (versión 2.0)
3. Engranaje → **Configuración del proyecto** → **Propiedades del script**:

| Propiedad | Valor | Obligatorio |
|-----------|--------|-------------|
| `GEMINI_API_KEY` | `AIza...` de AI Studio | **Sí** (gratis) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | No (respaldo) |

4. Guardar

## Paso 4 — Nueva implementación (importante)

Cada vez que cambies el código del script:

1. **Implementar** → **Administrar implementaciones**
2. **Nueva versión** (o Nueva implementación)
3. Tipo: **Aplicación web**
4. Ejecutar como: **Yo**
5. Acceso: **Cualquier usuario**
6. La URL `/exec` puede ser la misma que ya tienes

## Paso 5 — App SCIC

La URL ya está en el HTML:

```javascript
var SCIC_IA_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwA2EReltq108f9Hf--Pj1aaEPN5pZJcKQjtsu9m6rFVKzUPEAbpIxBe8lHqwV7O6KMIw/exec';
```

No pongas las API keys en el HTML.

---

## Probar el proxy

Abre en el navegador (debe responder JSON con `gemini: true`):

```
https://script.google.com/macros/s/TU_ID/exec
```

---

## Seguridad

- Las claves **solo** en Propiedades del script de Google.
- No compartir claves en chats, GitHub ni correo.
