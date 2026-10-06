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

    // Dismiss tour
    await page.evaluate(() => {
      localStorage.setItem('almar_tour_completed', 'true');
      localStorage.setItem('almar_guide_dismissed', 'true');
    });
    const omitirBtn = await page.$x("//button[contains(., 'Omitir tutorial')]");
    if (omitirBtn.length > 0) {
      await omitirBtn[0].click();
      await new Promise(r => setTimeout(r, 600));
    }

    console.log('2. Navigating to /comprobantes...');
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="comprobantes-help-banner"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    // Capture the entire page showing the Guide Banner, Filter Bar with "+ Nuevo Comprobante", and Kanban Board
    await captureScreenshot(page, '04_guia_flujo_operativo_dashboard_prod.png', 'Guía Operativa y Tablero de Comprobantes Actualizado en Producción');
    console.log('DONE!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
