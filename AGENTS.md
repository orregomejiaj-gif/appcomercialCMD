# AppcomercialCMD

## Cursor Cloud specific instructions

### What this is
- The whole product is a **single static file**: `seguimiento_comercial_CMD.html` (SCIC — "Sistema Cognitivo de Inteligencia Comercial", Cooperativa Minuto de Dios). It is plain HTML/CSS/JS with all logic inline.
- There is **no build system, package manager, lockfile, backend, tests, or lint config**. Nothing to install.
- Third‑party libs (jsPDF, Chart.js, SheetJS, Tabler icons, Ubuntu font) load from CDNs at runtime, and master/directory data loads from **Google Sheets / Apps Script via JSONP**. So the page needs outbound internet to be fully functional.

### Run it (development)
- Serve the folder over HTTP and open the file in a browser, e.g.:
  - `python3 -m http.server 8080` then open `http://localhost:8080/seguimiento_comercial_CMD.html`.
- Do **not** open it via `file://` — the Google Sheets JSONP directory load and some features misbehave without an HTTP origin.

### Login / "hello world"
- The login (`loginIngresar`) requires a username that exists in the employee directory, which is fetched live from Google Sheets (`_cargarEmpleados`). Type only the part **before** `@` (e.g. `yara.diaz`); the app appends `@coopminutodedios.com`.
- A valid sample user observed in the directory: **`yara.diaz`** ("Diaz Julio Yara Liney"). The directory changes over time; if a username fails, open the in‑app "Directorio" to find a current one.
- After login the app immediately shows a "Marca tu turno para continuar" (GPS shift clock‑in) overlay before the main modules are usable — this is expected, not a bug.

### Login dashboard (v4.6+)
- The welcome modal (`#modal-top-sedes`) is **fused into the login screen**: it is no longer shown as a popup. `window.mostrarTopSedes` is overridden at the end of `<body>` to keep that modal hidden and instead render the login dashboard.
- The login dashboard lives in `#login-dashboard` (right column of `#etapa-login`) and uses **`lgi-*` ids** rendered by `renderLoginDashboard()`. Do **not** reintroduce the old duplicate `mts-*` ids in the login column — the modal already owns those, and duplicate ids silently break updates.
- Data sources reused: `window._mtsMetaN/_mtsEjecN/_mtsPctN/_mtsDiasTotal/_mtsDiasTrans/_mtsDebemos` (set by `_mtsCargarMeta`), `EMPLEADOS_BD` (asesores del turno), `EMPLEADOS_CUM` (cumpleaños).
- **gviz label gotcha**: the EMPLEADOS sheet returns **corrupted column labels** (header + sample values concatenated), so the employee/cumpleaños parsers match by **column index** (CORREO=0, NOMBRE=1, CARGO=2, SEDE=3, CEDULA=4, CELULAR=5, F.NACIMIENTO=6, ESTADO=7), not by label. Cumpleaños are loaded independently by `_lgiCargarCumple()` and parsed to `MM-DD` via `_parseCumpleMMDD()`.

### Gotchas
- The file contains **multiple/duplicated and minified definitions** of core functions (`loginIngresar`, `buscarEmpleado`, `_cargarEmpleados`, `EMPLEADOS_BD`, `navState`, `state`). The **last** definition wins via JS hoisting — the active `loginIngresar` is the minified one in the large script blob, not the readable copies earlier in the file. Check all copies when editing login logic.
- A single uncaught error during top‑level execution of the big inline `<script>` aborts the rest of that block (including `var EMPLEADOS_BD={}` / `navState` / `state` initialization), which silently breaks login. Keep best‑effort init blocks defensive.
- There is a known, **non‑fatal** console error `MCM is not defined` and several 404s (`manifest.json`, `favicon.ico`); these do not block login or core functionality.
- To debug console errors reliably without a GUI, you can drive headless Chrome via the DevTools Protocol: `google-chrome --headless=new --no-sandbox --remote-debugging-port=9222 --remote-allow-origins=*` and attach over the `webSocketDebuggerUrl`.
