const puppeteer = require('puppeteer');

async function checkC367Text() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
  });

  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c0367000-0000-0000-0000-000000000011', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- TEXTO C367 ---');
  const lines = text.split('\n').filter(l => l.includes('Comprobantes') || l.includes('Compras facturadas') || l.includes('Margen') || l.includes('COT-2026-00113') || l.includes('MSL'));
  console.log(lines);

  await browser.close();
}

checkC367Text().catch(console.error);
