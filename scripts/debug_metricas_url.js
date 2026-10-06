const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('https://bot-relevamiento.vercel.app/metricas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // scroll down to leaderboard
  await page.evaluate(() => {
    const el = document.getElementById('metricas-leaderboard');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'metricas_prod_leaderboard_verified.png' });
  console.log('Saved metricas_prod_leaderboard_verified.png');

  await browser.close();
})();
