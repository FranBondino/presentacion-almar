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

  console.log('Logging in as admin@almar.com.ar...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to /carpetas...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss any tour
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitir = btns.find(b => b.innerText.trim() === 'Omitir tutorial' || b.innerText.trim() === 'Entendido' || b.innerText.trim() === 'Omitir');
    if (omitir) omitir.click();
  });

  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tbody tr'));
    return trs.map(tr => tr.innerText.replace(/\n+/g, ' | '));
  });

  console.log(`Found ${rows.length} rows in /carpetas:`);
  rows.forEach((r, idx) => console.log(`[${idx + 1}] ${r}`));

  const outPath = path.join(__dirname, '../screenshots/carpetas_list_definitive_live.png');
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved screenshot to:', outPath);

  await browser.close();
})();
