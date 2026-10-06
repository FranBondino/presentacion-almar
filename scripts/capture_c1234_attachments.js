const puppeteer = require('puppeteer');
const path = require('path');

async function captureScroll() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  // Login
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Dismiss onboarding
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
  });

  // Navigate to C1234
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to email attachments
  await page.evaluate(() => {
    window.scrollBy(0, 750);
  });
  await new Promise(r => setTimeout(r, 1000));

  const artifactDir = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478');
  const shotPath = path.join(artifactDir, 'prod_c1234_attachments_cards_live.png');
  await page.screenshot({ path: shotPath });
  console.log(`Scrolled screenshot saved to: ${shotPath}`);

  await browser.close();
}

captureScroll().catch(e => {
  console.error(e);
  process.exit(1);
});
