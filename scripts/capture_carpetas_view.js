const puppeteer = require('puppeteer');
const path = require('path');

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Go to login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Fill in login credentials (admin@almar.com.ar / Almar2026!)
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Dismiss tutorial in localStorage before or after
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
    localStorage.setItem('almar_tour_step', '999');
  });

  console.log('Current URL after login:', page.url());
  
  // Navigate to /carpetas
  await page.goto('http://localhost:3000/carpetas', { waitUntil: 'networkidle2' });
  console.log('Current URL after goto carpetas:', page.url());
  await new Promise(r => setTimeout(r, 2000));
  console.log('Current URL after 2s:', page.url());

  // If there's any modal with "Omitir", click it
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitirBtn = btns.find(b => b.textContent && b.textContent.includes('Omitir'));
    if (omitirBtn) omitirBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // If still on dashboard, click on the sidebar link "Carpetas de Embarque"
  if (!page.url().includes('/carpetas')) {
    console.log('Clicking Carpetas link from sidebar...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const cLink = links.find(a => a.textContent && a.textContent.includes('Carpetas'));
      if (cLink) cLink.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('URL after sidebar click:', page.url());
  }

  const outPath = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478', 'carpetas_view_legible_fixed.png');
  await page.screenshot({ path: outPath });
  console.log('Saved screenshot to:', outPath);

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
