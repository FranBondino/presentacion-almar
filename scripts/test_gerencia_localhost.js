const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await new Promise(r => setTimeout(r, 2000));

  console.log('Current URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Includes Métricas Comerciales & Financieras:', text.includes('Métricas Comerciales & Financieras'));
  console.log('Includes Volumen Facturado:', text.includes('Volumen Facturado'));
  console.log('Includes Margen Operativo Bruto:', text.includes('Margen Operativo Bruto'));
  console.log('Includes USD ***.***:', text.includes('USD ***.***'));

  await page.screenshot({ path: 'test_localhost_gerencia.png', fullPage: true });
  console.log('Saved test_localhost_gerencia.png');

  await browser.close();
})();
