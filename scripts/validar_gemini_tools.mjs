#!/usr/bin/env node
/**
 * Smoke test: Gemini tools + fallback local de sugerencias meta
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'seguimiento_comercial_CMD.html');

function serveHtml() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = req.url === '/' ? HTML : path.join(ROOT, req.url.slice(1));
      if (!fs.existsSync(p)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(p));
    });
    srv.listen(0, () => resolve({ srv, port: srv.address().port }));
  });
}

async function main() {
  const { srv, port } = await serveHtml();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => typeof window._scicHerramientasSchema === 'function', { timeout: 60000 });

    const result = await page.evaluate(async () => {
      const out = { ok: true, checks: [] };
      const tools = window._scicHerramientasSchema();
      out.checks.push({ name: 'schema_count', pass: tools.length === 5, value: tools.length });

      const names = tools.map((t) => t.name).sort();
      const expected = [
        'analizar_cumplimiento_meta',
        'generar_sugerencias_meta',
        'listar_sedes_en_riesgo',
        'obtener_contexto_completo',
        'refrescar_datos_sheets'
      ];
      out.checks.push({ name: 'schema_names', pass: JSON.stringify(names) === JSON.stringify(expected), value: names });

      const sug = await window._scicEjecutarHerramienta('generar_sugerencias_meta', { nivel: 'nacional' });
      out.checks.push({
        name: 'generar_sugerencias_meta',
        pass: !!(sug && sug.ok && Array.isArray(sug.sugerencias_base) && sug.sugerencias_base.length > 0),
        value: sug && sug.sugerencias_base ? sug.sugerencias_base.length : 0
      });

      window.SCIC_IA_PROXY_URL = '';
      const html = await window._scicLlamarGeminiConHerramientas('¿Cómo cumplimos la meta S2?', { nivel: 'nacional' });
      out.checks.push({
        name: 'fallback_local',
        pass: typeof html === 'string' && html.includes('Análisis local') && html.includes('Acciones sugeridas'),
        value: (html || '').slice(0, 120)
      });

      out.ok = out.checks.every((c) => c.pass);
      return out;
    });

    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exit(1);
    console.log('\n✓ Gemini tools smoke test OK');
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
