const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'finanzas@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Dismiss onboarding tour if present
  console.log('Checking for "Omitir tutorial"...');
  const omitirBtn = await page.$x("//button[contains(., 'Omitir tutorial')]");
  if (omitirBtn.length > 0) {
    console.log(' -> Found "Omitir tutorial". Clicking...');
    await omitirBtn[0].click();
    await new Promise(r => setTimeout(r, 600));
  }

  // Also dismiss via localStorage just in case
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });

  // Now go to /comprobantes
  console.log('Navigating to /comprobantes...');
  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
  });
  console.log('Buttons on /comprobantes after dismissing tour:\n', buttons);

  const viewPdfButtons = await page.$$('.btn-view-pdf');
  console.log('.btn-view-pdf count:', viewPdfButtons.length);

  await browser.close();
})();
