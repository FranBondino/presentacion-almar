const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('hasCompletedTour', 'true');
      localStorage.setItem('almar_tour_dismissed', 'true');
    } catch(e) {}
  });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('button[type="submit"]')]);

  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Includes COT-2026-00010?:', text.includes('COT-2026-00010'));
  console.log('Includes Dis-Den?:', text.includes('Dis-Den'));
  console.log('Includes Lucía Laje?:', text.includes('Lucía Laje'));
  console.log('Includes VENTA PACTADA?:', text.includes('VENTA PACTADA'));
  console.log('Includes MARGEN PROYECTADO?:', text.includes('MARGEN PROYECTADO'));
  console.log('Current URL:', page.url());
  
  await browser.close();
})();
