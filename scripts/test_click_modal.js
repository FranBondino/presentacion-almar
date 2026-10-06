const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'finanzas@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Look for "Ver Detalle" buttons on dashboard
  const verDetalleBtns = await page.$$('button');
  for (const b of verDetalleBtns) {
    const txt = await page.evaluate(el => el.textContent.trim(), b);
    if (txt === 'Ver Detalle' || txt === 'Ver Comprobante') {
      console.log('Testing button with text:', txt);
      await b.click();
      await new Promise(r => setTimeout(r, 1000));
      const modal = await page.$('[role="dialog"]');
      if (modal) {
        console.log(' -> Found modal with role="dialog"!');
        const modalText = await page.evaluate(el => el.innerText, modal);
        console.log('Modal text preview:\n', modalText.slice(0, 300));
        break;
      } else {
        console.log(' -> No modal opened, current URL:', page.url());
      }
    }
  }

  await browser.close();
})();
