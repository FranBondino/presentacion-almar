const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);
  await page.goto('https://bot-relevamiento.vercel.app/metricas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Includes Alcance Metodologico:', text.includes('Alcance Metodológico'));
  console.log('Includes 16 Colaboradores:', text.includes('16 Colaboradores'));
  const lines = text.split('\n').filter(l => l.includes('Operador') || l.includes('Rendimiento') || l.includes('Alcance'));
  console.log('Matching lines:', lines);
  await page.screenshot({ path: 'metricas_prod_final.png', fullPage: true });
  console.log('Saved metricas_prod_final.png');
  await browser.close();
})();
