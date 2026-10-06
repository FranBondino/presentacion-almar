const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  console.log('Navigating to login on production...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to /metricas...');
  await page.goto('https://bot-relevamiento.vercel.app/metricas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page has Alcance Metodológico:', text.includes('Alcance Metodológico'));
  console.log('Page has 16 Colaboradores:', text.includes('16 Colaboradores'));

  await page.screenshot({ path: 'metricas_prod_verified.png', fullPage: true });
  console.log('Saved metricas_prod_verified.png');

  await browser.close();
})();
