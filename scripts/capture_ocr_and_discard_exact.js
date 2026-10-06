const fs = require('fs');
const path = require('path');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const PROD_URL = 'https://bot-relevamiento.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\824dd515-e69f-412e-9fea-10f4a690b478';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots/prod');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshot(page, filename, label) {
  const filePathLocal = path.join(SCREENSHOTS_DIR, filename);
  const filePathArtifact = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: filePathLocal, fullPage: false });
  fs.copyFileSync(filePathLocal, filePathArtifact);
  console.log(`[CAPTURED] ${filename} - ${label}`);
}

(async () => {
  console.log('--- CAPTURING OCR CORRECTION & SOFT-DELETE MODALS IN PROD ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });

  const page = await browser.newPage();

  try {
    console.log('1. Logging in as Finanzas (Vanesa Meggiolaro)...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'finanzas@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    console.log('2. Navigating to /comprobantes...');
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('3. Waiting for invoice cards and ".btn-view-pdf"...');
    await page.waitForSelector('.btn-view-pdf', { timeout: 15000 });

    // Click on the first .btn-view-pdf
    console.log(' -> Clicking ".btn-view-pdf"...');
    await page.click('.btn-view-pdf');

    // Wait for the modal to be visible
    console.log(' -> Waiting for [data-testid="comprobante-pdf-modal"]...');
    await page.waitForSelector('[data-testid="comprobante-pdf-modal"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Look for button containing "Corregir OCR"
    console.log(' -> Looking for "Corregir OCR" button...');
    const buttons = await page.$$('button');
    let editBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Corregir OCR')) {
        editBtn = btn;
        break;
      }
    }

    if (editBtn) {
      console.log(' -> Found "Corregir OCR" button! Clicking...');
      await editBtn.click();
      await page.waitForSelector('[data-testid="edit-comprobante-form"]', { timeout: 8000 });
      await new Promise((r) => setTimeout(r, 800));
      await captureScreenshot(page, '02_corregir_ocr_modal_prod.png', 'Formulario de Corrección Rápida de OCR en Producción');

      // Now close edit mode or click Descartar directly
      console.log(' -> Looking for "Descartar" button in modal footer...');
      const discardBtn = await page.$('.btn-descartar');
      if (discardBtn) {
        console.log(' -> Found ".btn-descartar"! Clicking...');
        await discardBtn.click();
        await new Promise((r) => setTimeout(r, 800));
        await captureScreenshot(page, '03_descartar_comprobante_modal_prod.png', 'Modal de Descarte Lógico y Auditoría ISO 9001 en Producción');
      } else {
        console.warn(' -> .btn-descartar not found');
      }
    } else {
      console.warn(' -> Corregir OCR button not found');
    }

    console.log('--- ALL CAPTURES FINISHED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
})();
