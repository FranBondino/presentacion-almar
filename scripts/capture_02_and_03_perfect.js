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
  console.log('--- CAPTURING 02 & 03 IN PRODUCTION (CLEAN DISMISS OF TOUR) ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });

  const page = await browser.newPage();

  try {
    console.log('1. Logging in as Finanzas (Vanesa Meggiolaro)...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'finanzas@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Dismiss tour
    console.log('2. Dismissing tour...');
    await page.evaluate(() => {
      localStorage.setItem('almar_tour_completed', 'true');
      localStorage.setItem('almar_guide_dismissed', 'true');
    });
    const omitirBtn = await page.$x("//button[contains(., 'Omitir tutorial')]");
    if (omitirBtn.length > 0) {
      await omitirBtn[0].click();
      await new Promise(r => setTimeout(r, 600));
    }

    console.log('3. Navigating to /comprobantes...');
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.btn-view-pdf', { timeout: 10000 });

    console.log('4. Clicking .btn-view-pdf on first invoice...');
    await page.click('.btn-view-pdf');

    console.log('5. Waiting for [data-testid="comprobante-pdf-modal"]...');
    await page.waitForSelector('[data-testid="comprobante-pdf-modal"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    console.log('6. Looking for "Corregir OCR" button...');
    const corregirBtns = await page.$x("//button[contains(., 'Corregir OCR')]");
    if (corregirBtns.length === 0) {
      throw new Error('Corregir OCR button not found in modal');
    }

    console.log(' -> Found "Corregir OCR"! Clicking to expand inline editor...');
    await corregirBtns[0].click();
    await page.waitForSelector('[data-testid="edit-comprobante-form"]', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1000));

    // Capture 02_corregir_ocr_modal_prod.png
    await captureScreenshot(page, '02_corregir_ocr_modal_prod.png', 'Formulario de Corrección Rápida de OCR en Producción');

    // Soft delete / discard modal
    console.log('7. Looking for ".btn-descartar" in modal footer...');
    const discardBtn = await page.$('.btn-descartar');
    if (!discardBtn) {
      throw new Error('.btn-descartar not found');
    }

    console.log(' -> Clicking ".btn-descartar"...');
    await discardBtn.click();
    await page.waitForSelector('select', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1000));

    // Capture 03_descartar_comprobante_modal_prod.png
    await captureScreenshot(page, '03_descartar_comprobante_modal_prod.png', 'Modal de Descarte Lógico y Auditoría ISO 9001 en Producción');

    console.log('\n===============================================================');
    console.log('SUCCESS: BOTH MODALS CAPTURED AND COPIED TO ARTIFACTS!');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
})();
