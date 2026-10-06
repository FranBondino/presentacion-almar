const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('hasCompletedTour', 'true');
      localStorage.setItem('almar_tour_dismissed', 'true');
    } catch (e) {}
  });

  // Login
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'comercial@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  await page.goto('https://bot-relevamiento.vercel.app/cotizaciones', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitir = btns.find(b => b.innerText.trim() === 'Omitir tutorial' || b.innerText.trim() === 'Entendido' || b.innerText.trim() === 'Omitir');
    if (omitir) omitir.click();
  });

  // Find row containing C1234
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr'));
    const c1234Row = rows.find(r => r.innerText.includes('C1234'));
    if (c1234Row) {
      c1234Row.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const outPath = path.join(__dirname, '../screenshots/lucia_cotizaciones_c1234_disden_perfect.png');
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Saved centered C1234 row screenshot to:', outPath);

  await browser.close();
})();
