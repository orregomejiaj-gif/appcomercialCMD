# Snapshot CMD — modo manual

Los cortes diarios se guardan **solo de forma manual** desde la app (sin automatización ni Azure AD).

## Flujo

1. Encabezado → icono **archivo** (Corte histórico) → **Guardar corte de hoy**.
2. La app genera y descarga `CMD_snapshot_YYYY-MM-DD.json.gz` con el 100% de datos cargados.
3. **Mueve el archivo manualmente** a la carpeta de SharePoint:

https://coopminutodedios-my.sharepoint.com/:f:/p/juan_orrego/IgAt8-dt3RRVQ5pZNHU8fGWLAZXjmssy_xF1ydJlTwiQFZM?e=fyzMfR

## Consultar un corte pasado

Encabezado → icono **archivo** → **Abrir archivo de corte** → elegir `.json` o `.json.gz` desde la carpeta local o SharePoint.

La app entra en **modo histórico** (solo lectura, sin Sheets).

## Nota

No hay copia interna en el navegador (IndexedDB). Solo archivos descargados en disco/carpeta compartida.

El archivo `CMD_SNAPSHOT_SHAREPOINT.gs` quedó obsoleto (requería Azure AD). No es necesario desplegarlo.
