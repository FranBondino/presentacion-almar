const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  console.log('1. Logging in as Gerencia...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);

  // Dismiss onboarding tour if present
  try {
    const omitirBtn = await page.$x("//button[contains(., 'Omitir tutorial')]");
    if (omitirBtn.length > 0) {
      await omitirBtn[0].click();
      await new Promise(r => setTimeout(r, 600));
    }
  } catch (e) {}

  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Waiting for deployment with "Auditoría Ene–Sep 2026" to be live...');
  let found = false;
  for (let attempt = 1; attempt <= 12; attempt++) {
    const auditBtn = await page.$x("//button[contains(., 'Auditoría Ene–Sep 2026')]");
    if (auditBtn.length > 0) {
      found = true;
      console.log(`Found Audit button on attempt ${attempt}!`);
      break;
    }
    console.log(`Attempt ${attempt}: not found yet, reloading in 10s...`);
    await new Promise(r => setTimeout(r, 10000));
    await page.reload({ waitUntil: 'networkidle2' });
  }

  if (found) {
    console.log('Capturing dashboard with Header audit badge...');
    await page.screenshot({ path: 'header_audit_badge_prod.png' });
    console.log('Saved header_audit_badge_prod.png');

    console.log('Clicking "Auditoría Ene–Sep 2026" button...');
    const auditBtn = await page.$x("//button[contains(., 'Auditoría Ene–Sep 2026')]");
    await auditBtn[0].click();
    await new Promise(r => setTimeout(r, 1200));
    console.log('Modal opened!');
    await page.screenshot({ path: 'audit_provenance_modal_prod.png' });
    console.log('Saved audit_provenance_modal_prod.png');
  } else {
    console.log('Timeout waiting for deployment.');
  }

  await browser.close();
})();
