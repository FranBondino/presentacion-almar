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

  // Click Omitir tutorial via $x
  try {
    const omitirBtn = await page.$x("//button[contains(., 'Omitir tutorial')]");
    if (omitirBtn.length > 0) {
      console.log('Dismissing tour via Omitir tutorial...');
      await omitirBtn[0].click();
      await new Promise(r => setTimeout(r, 800));
    }
  } catch (e) {}

  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });

  console.log('Navigating to /metricas...');
  await page.goto('https://bot-relevamiento.vercel.app/metricas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss if appears on /metricas as well
  try {
    const omitirBtn2 = await page.$x("//button[contains(., 'Omitir tutorial')]");
    if (omitirBtn2.length > 0) {
      await omitirBtn2[0].click();
      await new Promise(r => setTimeout(r, 800));
    }
  } catch (e) {}

  // Scroll to leaderboard
  const element = await page.$('#metricas-leaderboard');
  if (element) {
    await element.scrollIntoView();
    await new Promise(r => setTimeout(r, 1000));
    await element.screenshot({ path: 'metricas_prod_leaderboard_clarified.png' });
    console.log('Saved element screenshot metricas_prod_leaderboard_clarified.png');
  }

  await page.screenshot({ path: 'metricas_prod_full_clarified.png', fullPage: true });
  console.log('Saved full page screenshot metricas_prod_full_clarified.png');

  await browser.close();
})();
