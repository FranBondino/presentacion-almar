const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  console.log('1. Logging in as Gerencia...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);

  console.log('2. Dismissing tour...');
  try {
    const omitir = await page.waitForSelector('button:has-text("Omitir tutorial"), button:has-text("Omitir")', { timeout: 2500 });
    if (omitir) await omitir.click();
  } catch (e) {}

  console.log('3. Navigating to /metricas...');
  await page.goto('https://bot-relevamiento.vercel.app/metricas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const omitir2 = await page.waitForSelector('button:has-text("Omitir tutorial"), button:has-text("Omitir")', { timeout: 2000 });
    if (omitir2) await omitir2.click();
  } catch (e) {}

  console.log('Current URL:', page.url());

  const section = await page.$('#metricas-leaderboard');
  if (section) {
    await section.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await section.screenshot({ path: 'metricas_prod_leaderboard_clarified.png' });
    console.log('Saved metricas_prod_leaderboard_clarified.png');
  } else {
    console.log('Leaderboard element not found!');
  }

  await page.screenshot({ path: 'metricas_prod_full_page.png', fullPage: true });
  console.log('Saved metricas_prod_full_page.png');

  await browser.close();
})();
