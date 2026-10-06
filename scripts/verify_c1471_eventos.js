const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1471000-0000-0000-0000-000000000009', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Click on Tracking & Hitos tab
  const clicked = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const tab = tabs.find(t => t.textContent && (t.textContent.includes('Tracking') || t.textContent.includes('Hitos')));
    if (tab) {
      tab.click();
      return true;
    }
    return false;
  });
  console.log('Tab Eventos clickeada:', clicked);
  await new Promise(r => setTimeout(r, 1500));

  const text = await page.evaluate(() => document.body.innerText);
  const hasOldBlock = text.includes('bloqueada para autorización de Vanesa');
  const hasNewReconciliation = text.includes('conciliación de recargos AMA Freight');
  console.log('Tiene "bloqueada para autorización de Vanesa":', hasOldBlock);
  console.log('Tiene "conciliación de recargos AMA Freight":', hasNewReconciliation);

  const shotPath = path.resolve('screenshots/prod_c1471_eventos_tab_live.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Captura guardada:', shotPath);

  const artifactDir = path.resolve('C:/Users/franc/.gemini/antigravity/brain/824dd515-e69f-412e-9fea-10f4a690b478');
  fs.copyFileSync(shotPath, path.join(artifactDir, 'prod_c1471_eventos_tab_live.png'));

  await browser.close();
})();
