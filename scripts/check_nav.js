const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'finanzas@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim(),
      className: b.className
    }));
  });
  console.log('BUTTONS ON /comprobantes:', JSON.stringify(buttons, null, 2));

  const kanbanColumns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid^="kanban-"]')).map(el => el.getAttribute('data-testid'));
  });
  console.log('KANBAN ELEMENTS:', kanbanColumns);

  await browser.close();
})();
