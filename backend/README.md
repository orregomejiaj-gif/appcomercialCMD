# Backend SCIC IA Proxy (Claude)

La app SCIC en GitHub Pages **no puede** llamar a `api.anthropic.com` directamente (CORS + API key). Este proxy en **Google Apps Script** actúa como intermediario seguro.

## Pasos de despliegue

1. Abrir [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Crear archivo `SCIC_IA_PROXY.gs` y pegar el contenido de `backend/SCIC_IA_PROXY.gs`.
3. **Configuración del proyecto** (engranaje) → **Propiedades del script** → Añadir:
   - `ANTHROPIC_API_KEY` = tu clave de Anthropic (`sk-ant-api03-...`)
4. **Implementar** → **Nueva implementación** → Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
5. Copiar la URL que termina en `/exec`.
6. En `seguimiento_comercial_CMD.html`, asignar:

```javascript
var SCIC_IA_PROXY_URL = 'https://script.google.com/macros/s/TU_ID/exec';
```

7. Commit y push a `main` para que GitHub Pages use la URL.

## Probar

```bash
curl -X POST 'https://script.google.com/macros/s/TU_ID/exec' \
  -H 'Content-Type: text/plain' \
  -d '{"accion":"ia_claude","system":"Eres SCIC","prompt":"Resume el cumplimiento nacional"}'
```

Respuesta esperada:

```json
{"ok":true,"text":"...","model":"claude-sonnet-4-20250514"}
```

## Sin proxy

Si `SCIC_IA_PROXY_URL` está vacío, la app usa **análisis local MCM** (paneles MCM, Decisiones, motor `_scicAnalisisLocalIA`).

## Seguridad

- La API key **nunca** va en el HTML público; solo en Propiedades del script.
- Opcional: restringir por dominio o token en `handleClaude_` si se requiere más control.
