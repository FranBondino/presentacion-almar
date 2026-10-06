const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);

  try {
    const omitirBtn = await page.$x("//button[contains(., 'Omitir tutorial')]");
    if (omitirBtn.length > 0) await omitirBtn[0].click();
  } catch (e) {}

  await new Promise(r => setTimeout(r, 2000));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('header button')).map(b => ({
      text: b.innerText.trim(),
      title: b.title,
      html: b.innerHTML
    }));
  });
  console.log('Header buttons count:', buttons.length);
  console.log('Header buttons:\n', JSON.stringify(buttons, null, 2));

  // Check RoleWorkspaceBanner text
  const bannerText = await page.evaluate(() => {
    const banner = document.querySelector('main > div:first-child');
    return banner ? banner.innerText : 'No banner found';
  });
  console.log('Banner text snippet:\n', bannerText.substring(0, 300));

  await browser.close();
})();
