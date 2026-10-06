const puppeteer = require('puppeteer');

async function debugLivePage() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"], input[name="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"], input[name="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Inspeccionemos C1234
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2' });
  
  const tabsText = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button[role="tab"]')).map(t => t.innerText.trim());
  });
  console.log('Tabs en C1234:', tabsText);

  // Inspeccionemos C367
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c0367000-0000-0000-0000-000000000011', { waitUntil: 'networkidle2' });
  const tabsC367 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button[role="tab"]')).map(t => t.innerText.trim());
  });
  console.log('Tabs en C367:', tabsC367);

  await browser.close();
}

debugLivePage().catch(console.error);
