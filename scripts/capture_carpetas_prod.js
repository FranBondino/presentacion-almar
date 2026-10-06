const puppeteer = require('puppeteer');
const path = require('path');

async function captureProd() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to Vercel production login...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
    localStorage.setItem('almar_tour_step', '999');
  });

  console.log('Navigating to /carpetas...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitirBtn = btns.find(b => b.textContent && b.textContent.includes('Omitir'));
    if (omitirBtn) omitirBtn.click();
  });

  if (!page.url().includes('/carpetas')) {
    console.log('Clicking Carpetas link from sidebar...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const cLink = links.find(a => a.textContent && a.textContent.includes('Carpetas'));
      if (cLink) cLink.click();
    });
    await new Promise(r => setTimeout(r, 2000));
  }

  const outArtifactPath = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478', 'carpetas_prod_legible_fixed.png');
  await page.screenshot({ path: outArtifactPath });
  console.log('Saved prod screenshot to:', outArtifactPath);

  await browser.close();
}

captureProd().catch(err => {
  console.error(err);
  process.exit(1);
});
