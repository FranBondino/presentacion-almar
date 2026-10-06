const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'operativo@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'test_aldana_live_prod.png', fullPage: true });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Has "USD ***.***":', bodyText.includes('USD ***.***'));
  console.log('Has "Métricas Financieras":', bodyText.includes('Métricas Financieras'));
  console.log('Has "Confidencial":', bodyText.includes('Confidencial'));

  const bot = await page.$('aside[aria-label="Asistente de Triage Operativo y Copilot"]');
  console.log('Has Bot widget:', bot !== null);

  await browser.close();
})();
