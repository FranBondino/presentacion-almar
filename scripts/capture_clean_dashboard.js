const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const bar = await page.$('#dispatch-status-bar');
  if (bar) await bar.screenshot({ path: 'screenshots/prod_status_bar_clean.png' });

  await page.screenshot({ path: 'screenshots/prod_dashboard_clean.png' });
  console.log('Clean screenshots captured!');
  await browser.close();
})();
