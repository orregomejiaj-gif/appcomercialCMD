#!/usr/bin/env node
/**
 * Validación Gemini + herramientas — 3 sedes (Virtual, Bello, Zipaquirá)
 * 1) Carga Sheets completa
 * 2) Ejecuta herramientas por sede
 * 3) Intenta consulta real vía proxy (si v3.1+) o reporta fallback
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'seguimiento_comercial_CMD.html');
const PROXY_URL = 'https://script.google.com/macros/s/AKfycbwXZlL8EfTRCEEJVDqT-IRNT9xItH3uGTfu1l5LFiCauFZ8offbOcZbdoy2vyM88_ekUg/exec';
const SEDES = ['Virtual y Distancia', 'COA Bello', 'CR Zipaquirá'];

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

async function checkProxy() {
  try {
    const r = await fetch(PROXY_URL);
    return await r.json();
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function main() {
  const proxyInfo = await checkProxy();
  console.log('Proxy:', JSON.stringify(proxyInfo));

  const { srv, port } = await serveHtml();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);

  const report = {
    fecha: new Date().toISOString(),
    proxy: proxyInfo,
    sedes: SEDES,
    herramientas: {},
    gemini: {},
    ok: true
  };

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => typeof window._scicEjecutarHerramienta === 'function', { timeout: 60000 });

    console.log('\nCargando Sheets (forzar=true)...');
    await page.evaluate(async () => {
      if (typeof cargarDesdeSheetsCompleto === 'function') await cargarDesdeSheetsCompleto(true);
    });

    const counts = await page.evaluate(() => ({
      version: window.APP_VERSION,
      sigec: (window._sigecRows || []).length,
      glpi: (window._glpiRows || []).length,
      coloc: (window._coloc_data || []).length,
      listo: typeof window._scicSigecGlpiListos === 'function' ? window._scicSigecGlpiListos() : false
    }));
    report.fuentes = counts;
    console.log('Fuentes:', counts);

    // Herramientas por sede
    for (const sede of SEDES) {
      const data = await page.evaluate(async (s) => {
        const an = await window._scicEjecutarHerramienta('analizar_cumplimiento_meta', { nivel: 'sede', sel: s });
        const sug = await window._scicEjecutarHerramienta('generar_sugerencias_meta', { nivel: 'sede', sel: s });
        return {
          analisis: an.analisis || an,
          sugerencias: (sug.sugerencias_base || []).map((x) => x.accion)
        };
      }, sede);
      report.herramientas[sede] = {
        meta: data.analisis.meta,
        colocado: data.analisis.colocado_sigec_glpi,
        pct_meta: data.analisis.pct_meta,
        brecha: data.analisis.brecha_vs_curva,
        semaforo: data.analisis.semaforo,
        ritmo_nec: data.analisis.ritmo_necesario_dia,
        sugerencias: data.sugerencias
      };
      console.log(`\n--- ${sede} ---`);
      console.log(`  Colocado: ${data.analisis.colocado_sigec_glpi} / Meta ${data.analisis.meta} (${data.analisis.pct_meta}%)`);
      console.log(`  Semáforo: ${data.analisis.semaforo} | Brecha curva: ${data.analisis.brecha_vs_curva}`);
      data.sugerencias.slice(0, 3).forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    }

    // Ranking nacional
    const ranking = await page.evaluate(async () => {
      const r = await window._scicEjecutarHerramienta('listar_sedes_en_riesgo', { limite: 8, umbral_pct: 70 });
      return r.ranking;
    });
    report.ranking_riesgo = ranking;

    // Consulta Gemini multi-sede
    const pregunta = `Analiza el cumplimiento de meta S2 para estas sedes: ${SEDES.join(', ')}. Dame situación, brecha y 3 acciones concretas por sede priorizadas.`;
    console.log('\nConsultando Gemini con herramientas...');
    const gemini = await page.evaluate(async (q, sedes) => {
      const t0 = Date.now();
      const html = await window._scicLlamarGeminiConHerramientas(q, {
        nivel: 'nacional',
        sedes,
        max_turns: 8
      });
      return {
        ms: Date.now() - t0,
        html: html || '',
        esFallback: (html || '').includes('Análisis local'),
        esGemini: (html || '').length > 50 && !(html || '').includes('Análisis local')
      };
    }, pregunta, SEDES);

    report.gemini = {
      pregunta,
      ms: gemini.ms,
      modo: gemini.esGemini ? 'gemini_proxy' : gemini.esFallback ? 'fallback_local' : 'sin_respuesta',
      respuesta_preview: gemini.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600)
    };

    console.log('\n========== GEMINI ==========');
    console.log('Modo:', report.gemini.modo, `(${gemini.ms}ms)`);
    console.log('Preview:', report.gemini.respuesta_preview.slice(0, 400) + '...');

    if (proxyInfo.version !== '3.1.0') {
      report.aviso_proxy = 'Proxy aún en ' + (proxyInfo.version || '?') + ' — redeploy SCIC_IA_PROXY.gs v3.1.0 para Gemini con tools en vivo';
      console.log('\n⚠', report.aviso_proxy);
    }

    if (!counts.listo || counts.sigec < 500) {
      report.ok = false;
      report.error = 'Datos SIGEC/GLPI incompletos';
    }

    const outPath = path.join(ROOT, 'artifacts', 'validacion_gemini_sedes.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log('\nJSON:', outPath);
  } finally {
    await browser.close();
    srv.close();
  }

  if (!report.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
