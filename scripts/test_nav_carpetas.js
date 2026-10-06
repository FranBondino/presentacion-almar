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
  console.log('After login URL:', page.url());

  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2' });
  console.log('After goto /carpetas URL:', page.url());

  const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
  console.log('H1 on page:', h1);

  const carpetas = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(r => {
      const a = r.querySelector('a');
      const text = r.innerText.replace(/\n+/g, ' | ');
      return {
        href: a?.getAttribute('href'),
        text
      };
    });
  });

  console.log(`Found ${carpetas.length} items in /carpetas:`);
  carpetas.forEach(c => console.log('  ', c.href, '-->', c.text.slice(0, 120)));

  await browser.close();
})();
