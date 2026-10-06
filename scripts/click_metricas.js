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

  // Click Omitir tutorial if visible
  try {
    const omitirBtn = await page.waitForSelector('button:has-text("Omitir tutorial"), button:has-text("Omitir")', { timeout: 3000 });
    if (omitirBtn) await omitirBtn.click();
  } catch (e) {
    // modal might not appear
  }

  // Click on the sidebar link to /metricas
  console.log('Clicking sidebar link /metricas...');
  await page.waitForSelector('a[href="/metricas"]');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('a[href="/metricas"]'),
  ]);

  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL:', page.url());

  const leaderboard = await page.$('#metricas-leaderboard');
  if (leaderboard) {
    await leaderboard.screenshot({ path: 'metricas_prod_leaderboard_section.png' });
    console.log('Saved metricas_prod_leaderboard_section.png');
  } else {
    console.log('Leaderboard element not found!');
  }

  await page.screenshot({ path: 'metricas_prod_page.png', fullPage: true });
  console.log('Saved metricas_prod_page.png');

  await browser.close();
})();
