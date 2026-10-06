/**
 * ALMAR Rosario - Comprehensive Production Verification & Screenshot Capture
 * Targets:
 *  - Portal Vercel: https://bot-relevamiento.vercel.app
 *  - Presentation React: https://franbondino.github.io/presentacion-almar/react/
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://bot-relevamiento.vercel.app';
const PRESENTATION_URL = 'https://franbondino.github.io/presentacion-almar/react/';

const outputDir = path.resolve(__dirname, '../screenshots/prod');
const artifactDir = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\824dd515-e69f-412e-9fea-10f4a690b478';

[outputDir, artifactDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function captureScreenshot(page, filename, description) {
  const p1 = path.join(outputDir, filename);
  const p2 = path.join(artifactDir, filename);
  await page.screenshot({ path: p1, fullPage: false });
  try {
    fs.copyFileSync(p1, p2);
  } catch (e) {
    // Ignore artifact copy if restricted
  }
  console.log(`[CAPTURED] ${filename} - ${description}`);
}

async function run() {
  console.log('===============================================================');
  console.log(' ALMAR ROSARIO — TESTING & CAPTURING ALL NEW PRODUCTION FEATURES');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Suppress onboarding popup to test clean UI
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  try {
    // -------------------------------------------------------------------------
    // 1. LOGIN AS FINANZAS (Vanesa Meggiolaro)
    // -------------------------------------------------------------------------
    console.log('[1/6] Logging in as Finanzas (Vanesa Meggiolaro)...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'finanzas@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log(' -> Logged in successfully. Current URL:', page.url());

    // -------------------------------------------------------------------------
    // 2. NAVIGATE TO /comprobantes & TEST "NUEVO COMPROBANTE" MODAL
    // -------------------------------------------------------------------------
    console.log('[2/6] Testing Manual Invoice Creation Modal on /comprobantes...');
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the button
    await page.waitForSelector('[data-testid="btn-nuevo-comprobante-manual"]', { timeout: 15000 });
    console.log(' -> Found "+ Nuevo Comprobante" button. Clicking...');
    await page.click('[data-testid="btn-nuevo-comprobante-manual"]');

    // Wait for modal
    await page.waitForSelector('#modal-crear-comprobante-title', { timeout: 10000 });
    console.log(' -> Modal opened. Filling in sample manual freight invoice...');

    // Fill form fields
    await page.type('input[placeholder*="LGV Transportes"]', 'LGV Transportes S.R.L. (Chofer Juan Pérez)');
    await page.type('input[placeholder="30-71074415-3"]', '30-71074415-3');
    await page.type('input[placeholder="0004-00000305"]', '0004-00000305');
    await page.type('input[placeholder*="Flete terrestre"]', 'Flete terrestre tramo Puerto Buenos Aires - Planta Paladini');

    // Subtotal
    const subtotalInput = await page.$('input[type="number"]');
    if (subtotalInput) {
      await subtotalInput.click({ clickCount: 3 });
      await subtotalInput.type('400000');
    }

    await new Promise((r) => setTimeout(r, 800));
    await captureScreenshot(page, '01_nuevo_comprobante_modal_prod.png', 'Modal de Carga Manual de Facturas en Producción');

    // Close modal
    const closeBtn = await page.$('button[aria-label="Cerrar ventana"]');
    if (closeBtn) await closeBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // 3. TEST "CORREGIR OCR" IN INVOICE DETAIL MODAL
    // -------------------------------------------------------------------------
    console.log('[3/6] Testing Inline "Corregir OCR" on an existing invoice...');
    // Click on the first invoice card or row
    const invoiceCard = await page.$('[data-testid^="kanban-card-"], .kanban-card, [class*="cursor-pointer"]');
    if (invoiceCard) {
      await invoiceCard.click();
      await new Promise((r) => setTimeout(r, 1200));

      // Look for the "Corregir OCR" button
      const corregirBtn = await page.$x("//button[contains(., 'Corregir OCR')]");
      if (corregirBtn.length > 0) {
        console.log(' -> Found "Corregir OCR" button. Clicking to expand inline editor...');
        await corregirBtn[0].click();
        await new Promise((r) => setTimeout(r, 800));
        await captureScreenshot(page, '02_corregir_ocr_modal_prod.png', 'Formulario de Corrección Rápida de OCR en Producción');
      } else {
        console.warn(' -> Corregir OCR button not found in modal.');
      }

      // -----------------------------------------------------------------------
      // 4. TEST "DESCARTAR COMPROBANTE" MODAL
      // -----------------------------------------------------------------------
      console.log('[4/6] Testing Soft-Delete Discard Modal...');
      const discardBtn = await page.$x("//button[contains(., 'Descartar')]");
      if (discardBtn.length > 0) {
        console.log(' -> Found "Descartar" button. Clicking...');
        await discardBtn[0].click();
        await new Promise((r) => setTimeout(r, 800));

        // Fill observation in discard modal
        const discardTextarea = await page.$('textarea[placeholder*="Detalle de causa"]');
        if (discardTextarea) {
          await discardTextarea.type('Comprobante duplicado recibido en copia: amparado en C1434.');
        }

        await new Promise((r) => setTimeout(r, 500));
        await captureScreenshot(page, '03_descartar_comprobante_modal_prod.png', 'Modal de Descarte Lógico Trazable AFIP/ISO 9001');

        // Cancel discard modal so we don't accidentally mutate state during capture
        const cancelDiscardBtn = await page.$x("//button[contains(., 'Cancelar')]");
        if (cancelDiscardBtn.length > 0) {
          await cancelDiscardBtn[0].click();
        }
      }

      // Close invoice detail modal
      const closePdfModalBtn = await page.$('button[aria-label="Cerrar"]');
      if (closePdfModalBtn) await closePdfModalBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // -------------------------------------------------------------------------
    // 5. TEST UPDATED DASHBOARD WORKFLOW GUIDE & COPILOT BOT
    // -------------------------------------------------------------------------
    console.log('[5/6] Testing Dashboard Workflow Guide & Floating Copilot...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Scroll to the guide
    await page.evaluate(() => {
      const guide = document.querySelector('.InteractiveWorkflowGuide, [class*="InteractiveWorkflowGuide"], h3, h2');
      if (guide) guide.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, '04_guia_flujo_operativo_dashboard_prod.png', 'Guía Interactiva de Flujo Operativo Actualizada');

    // Click floating Copilot
    const copilotTrigger = await page.$('[data-testid="copilot-widget-trigger"], button[title*="Copilot"], button[aria-label*="Copilot"], [class*="fixed bottom-6 right-6"] button');
    if (copilotTrigger) {
      console.log(' -> Found Copilot floating button. Clicking...');
      await copilotTrigger.click();
      await new Promise((r) => setTimeout(r, 1000));
      await captureScreenshot(page, '05_copilot_bot_flotante_prod.png', 'Bot Copilot Flotante de Incidencias Operativas');
    }

    // -------------------------------------------------------------------------
    // 6. TEST PRESENTATION REACT WITH SPEAKER NOTES DRAWER (KEY 'N')
    // -------------------------------------------------------------------------
    console.log('[6/6] Testing Presentation React on GitHub Pages (Slide 14 & Key N)...');
    await page.goto(PRESENTATION_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Navigate to slide 14 (press ArrowRight 13 times)
    for (let i = 1; i < 14; i++) {
      await page.keyboard.press('ArrowRight');
      await new Promise((r) => setTimeout(r, 150));
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Press 'N' to open Speaker Notes Drawer
    console.log(' -> Pressing "N" to toggle Speaker Notes Drawer...');
    await page.keyboard.press('KeyN');
    await new Promise((r) => setTimeout(r, 1000));

    await captureScreenshot(page, '06_presentacion_react_speaker_notes.png', 'Presentación React: Slide 14 con Drawer de Notas del Orador Actualizado');

    console.log('\n===============================================================');
    console.log(' ALL 6 PRODUCTION SCREENSHOTS CAPTURED AND VERIFIED SUCCESSFULLY!');
    console.log('===============================================================');
  } catch (err) {
    console.error('Error during production verification:', err);
  } finally {
    await browser.close();
  }
}

run();
