const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'operativo@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await new Promise(r => setTimeout(r, 2000));

  console.log('Current URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('First 500 chars of page:', text.slice(0, 500));
  console.log('Includes USD ***.***:', text.includes('USD ***.***'));
  console.log('Includes Acceso Restringido:', text.includes('Acceso Restringido'));
  console.log('Includes Carpetas Activas:', text.includes('Carpetas Activas'));
  console.log('Includes Métricas Comerciales & Financieras:', text.includes('Métricas Comerciales & Financieras'));

  await page.screenshot({ path: 'test_localhost_aldana.png', fullPage: true });
  console.log('Saved test_localhost_aldana.png');

  await browser.close();
})();
