const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'finanzas@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT PREVIEW:\n', text.slice(0, 1000));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText,
      className: b.className
    }));
  });
  console.log('ALL BUTTONS COUNT:', buttons.length);
  console.log('BUTTONS:', JSON.stringify(buttons.slice(0, 15), null, 2));

  await browser.close();
})();
