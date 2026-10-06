const fs = require('fs');
const path = require('path');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://bot-relevamiento.vercel.app';

const outputDir = path.resolve(__dirname, '../screenshots/prod');
const artifactDir = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\824dd515-e69f-412e-9fea-10f4a690b478';

async function run() {
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

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  try {
    // 1. Login as Finanzas (Vanesa)
    console.log('Logging in as Finanzas...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'finanzas@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 2. Go to /comprobantes
    console.log('Navigating to /comprobantes...');
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2' });

    // 3. Click the first "Ver Comprobante" button (.btn-view-pdf)
    await page.waitForSelector('.btn-view-pdf', { timeout: 15000 });
    console.log('Found .btn-view-pdf button. Clicking to open invoice modal...');
    await page.click('.btn-view-pdf');

    // Wait for the modal content
    await page.waitForSelector('#modal-comprobante-title', { timeout: 10000 });
    console.log('Invoice PDF modal opened!');

    await new Promise((r) => setTimeout(r, 1000));

    // 4. Click "Corregir OCR"
    const corregirBtn = await page.waitForSelector('button:has-text("Corregir OCR"), [data-testid="btn-corregir-ocr"], button[title*="Corregir"]', { timeout: 5000 }).catch(() => null);
    
    // In case pseudo-selector isn't supported in this puppeteer version, search by XPath
    if (!corregirBtn) {
      const buttons = await page.$$('button');
      for (const b of buttons) {
        const text = await page.evaluate(el => el.textContent, b);
        if (text && text.includes('Corregir OCR')) {
          console.log('Found "Corregir OCR" via text search. Clicking...');
          await b.click();
          break;
        }
      }
    } else {
      await corregirBtn.click();
    }

    await new Promise((r) => setTimeout(r, 1000));

    // Save screenshot 02_corregir_ocr_modal_prod.png
    const p1 = path.join(outputDir, '02_corregir_ocr_modal_prod.png');
    const p1_art = path.join(artifactDir, '02_corregir_ocr_modal_prod.png');
    await page.screenshot({ path: p1 });
    try { fs.copyFileSync(p1, p1_art); } catch (e) {}
    console.log('[CAPTURED] 02_corregir_ocr_modal_prod.png');

    // 5. Look for "Descartar Comprobante" button in modal footer
    console.log('Looking for "Descartar Comprobante" button...');
    const buttonsAfter = await page.$$('button');
    let discardOpened = false;
    for (const b of buttonsAfter) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Descartar')) {
        console.log('Found "Descartar Comprobante" button. Clicking...');
        await b.click();
        discardOpened = true;
        break;
      }
    }

    if (discardOpened) {
      await new Promise((r) => setTimeout(r, 1000));
      // Type observation
      const textarea = await page.$('textarea[placeholder*="Detalle de causa"]');
      if (textarea) {
        await textarea.type('Comprobante duplicado recibido en copia: amparado en C1434.');
      }

      const p2 = path.join(outputDir, '03_descartar_comprobante_modal_prod.png');
      const p2_art = path.join(artifactDir, '03_descartar_comprobante_modal_prod.png');
      await page.screenshot({ path: p2 });
      try { fs.copyFileSync(p2, p2_art); } catch (e) {}
      console.log('[CAPTURED] 03_descartar_comprobante_modal_prod.png');
    }

    console.log('Done capturing OCR and discard screenshots!');
  } catch (err) {
    console.error('Error in capture_ocr_and_discard_prod:', err);
  } finally {
    await browser.close();
  }
}

run();
