# Snapshot CMD — modo manual

Los cortes diarios se guardan **solo de forma manual** desde la app (sin automatización ni Azure AD).

## Flujo

1. Menú → **💾 Guardar corte** (o dentro del modal «Corte histórico»).
2. La app genera `CMD_snapshot_YYYY-MM-DD.json.gz` con el 100% de datos cargados.
3. Se guarda en **IndexedDB** del navegador y se **descarga** el archivo.
4. **Opcional:** subir el `.json.gz` manualmente a SharePoint:

https://coopminutodedios-my.sharepoint.com/:f:/p/juan_orrego/IgAt8-dt3RRVQ5pZNHU8fGWLAZXjmssy_xF1ydJlTwiQFZM?e=fyzMfR

## Consultar un corte pasado

Menú → **📦 Corte histórico** → elegir fecha o cargar archivo `.json` / `.json.gz`.

La app entra en **modo histórico** (solo lectura, sin Sheets).

## Nota

El archivo `CMD_SNAPSHOT_SHAREPOINT.gs` quedó obsoleto (requería Azure AD). No es necesario desplegarlo.
