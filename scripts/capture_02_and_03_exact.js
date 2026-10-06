const fs = require('fs');
const path = require('path');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const PROD_URL = 'https://bot-relevamiento.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\824dd515-e69f-412e-9fea-10f4a690b478';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots/prod');

async function captureScreenshot(page, filename, label) {
  const filePathLocal = path.join(SCREENSHOTS_DIR, filename);
  const filePathArtifact = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: filePathLocal, fullPage: false });
  fs.copyFileSync(filePathLocal, filePathArtifact);
  console.log(`[CAPTURED] ${filename} - ${label}`);
}

(async () => {
  console.log('--- CAPTURING 02 & 03 IN PRODUCTION VIA "Ver Comprobante" BUTTON ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });

  const page = await browser.newPage();

  try {
    console.log('1. Login as Finanzas...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'finanzas@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('2. Finding and clicking "Ver Comprobante" button...');
    const buttons = await page.$$('button');
    let verCompBtn = null;
    for (const b of buttons) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.trim() === 'Ver Comprobante') {
        verCompBtn = b;
        break;
      }
    }

    if (!verCompBtn) {
      throw new Error('Ver Comprobante button not found!');
    }

    await verCompBtn.click();
    console.log(' -> Clicked "Ver Comprobante". Waiting for modal...');
    await page.waitForSelector('[data-testid="comprobante-pdf-modal"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    // Find "Corregir OCR" button
    console.log('3. Finding "Corregir OCR" button...');
    const modalButtons = await page.$$('button');
    let editBtn = null;
    for (const b of modalButtons) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('Corregir OCR')) {
        editBtn = b;
        break;
      }
    }

    if (!editBtn) {
      throw new Error('Corregir OCR button not found in modal!');
    }

    console.log(' -> Clicking "Corregir OCR"...');
    await editBtn.click();
    await page.waitForSelector('[data-testid="edit-comprobante-form"]', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 800));

    // Capture 02_corregir_ocr_modal_prod.png
    await captureScreenshot(page, '02_corregir_ocr_modal_prod.png', 'Formulario de Corrección Rápida de OCR en Producción');

    // Find and click "Descartar"
    console.log('4. Finding "Descartar" button in modal footer...');
    const discardBtn = await page.$('.btn-descartar');
    if (!discardBtn) {
      throw new Error('.btn-descartar button not found in modal footer!');
    }

    console.log(' -> Clicking "Descartar"...');
    await discardBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    // Capture 03_descartar_comprobante_modal_prod.png
    await captureScreenshot(page, '03_descartar_comprobante_modal_prod.png', 'Modal de Descarte Lógico y Auditoría ISO 9001 en Producción');

    console.log('SUCCESS! Both 02 and 03 captured and saved.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
