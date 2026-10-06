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

  // Dismiss modal if open
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitir = btns.find(b => b.innerText.trim() === 'Omitir tutorial' || b.innerText.trim() === 'Entendido' || b.innerText.trim() === 'Omitir');
    if (omitir) omitir.click();
  });

  // Scroll to cotizaciones-table
  const tableEl = await page.$('#cotizaciones-table');
  if (tableEl) {
    await tableEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of the table section
    const outPath = path.join(__dirname, '../screenshots/lucia_cotizaciones_table_scrolled_live.png');
    await page.screenshot({ path: outPath, fullPage: false });
    console.log('Saved scrolled table screenshot to:', outPath);

    // Let's also filter by "Ganadas" tab or search within table
    // In CotizacionesTable, let's see if there is an input or tabs
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#cotizaciones-table button')).map(b => b.innerText);
    });
    console.log('Buttons inside cotizaciones-table:', buttons);

    // Click on tab "Fletes Ganados" or similar if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#cotizaciones-table button'));
      const ganadasBtn = btns.find(b => b.innerText.includes('Ganadas') || b.innerText.includes('Ganados'));
      if (ganadasBtn) ganadasBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const outGanadasPath = path.join(__dirname, '../screenshots/lucia_cotizaciones_table_ganadas_live.png');
    await page.screenshot({ path: outGanadasPath, fullPage: false });
    console.log('Saved ganadas tab screenshot to:', outGanadasPath);
  }

  await browser.close();
})();
