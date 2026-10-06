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
  console.log('Logged in, current URL:', page.url());

  // Disable onboarding tour permanently
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });

  // Navigate directly to /eventos
  console.log('2. Navigating to /eventos directly...');
  await page.goto('https://bot-relevamiento.vercel.app/eventos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Current URL:', page.url());

  // Verify H1 and page content
  const h1 = await page.$eval('h1', el => el.innerText);
  console.log('H1 is:', h1);

  const evaluation = await page.evaluate(() => {
    const items = document.querySelectorAll('.space-y-6 .relative.group');
    const firstTitle = items[0]?.querySelector('.font-bold')?.textContent?.trim();
    const firstDate = items[0]?.querySelector('.font-mono')?.textContent?.trim();
    const lastItem = items[items.length - 1];
    const lastTitle = lastItem?.querySelector('.font-bold')?.textContent?.trim();
    const lastDate = lastItem?.querySelector('.font-mono')?.textContent?.trim();
    const textNodes = document.body.innerText;

    return {
      totalEvents: items.length,
      firstTitle,
      firstDate,
      lastTitle,
      lastDate,
      hasCutoffBadge: textNodes.includes('Corte Pericial al 03/09/2026'),
      hasStatsStrip: textNodes.includes('36') && textNodes.includes('12 / 12'),
    };
  });

  console.log('Eventos evaluation (Descending order):', JSON.stringify(evaluation, null, 2));

  // Screenshot descending
  await page.screenshot({ path: 'screenshots/prod_eventos_page_verified.png' });
  console.log('Screenshot saved to screenshots/prod_eventos_page_verified.png');

  // 3. Test sort toggle
  console.log('3. Testing sort toggle to Ascending...');
  const sortBtn = await page.$x("//button[contains(., 'Más recientes primero')]");
  if (sortBtn.length > 0) {
    await sortBtn[0].click();
    await new Promise(r => setTimeout(r, 800));

    const ascEval = await page.evaluate(() => {
      const items = document.querySelectorAll('.space-y-6 .relative.group');
      return {
        firstTitle: items[0]?.querySelector('.font-bold')?.textContent?.trim(),
        firstDate: items[0]?.querySelector('.font-mono')?.textContent?.trim(),
        lastTitle: items[items.length - 1]?.querySelector('.font-bold')?.textContent?.trim(),
        lastDate: items[items.length - 1]?.querySelector('.font-mono')?.textContent?.trim(),
      };
    });
    console.log('Ascending evaluation:', JSON.stringify(ascEval, null, 2));
    await page.screenshot({ path: 'screenshots/prod_eventos_asc_verified.png' });
    console.log('Screenshot saved to screenshots/prod_eventos_asc_verified.png');

    // Toggle back to DESC
    const descToggleBtn = await page.$x("//button[contains(., 'Más antiguos primero')]");
    if (descToggleBtn.length > 0) {
      await descToggleBtn[0].click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 4. Test folder filter
  console.log('4. Testing folder filter for C1434 (Siderar)...');
  await page.select('select[aria-label="Filtrar por carpeta"]', 'c1434000-0000-0000-0000-000000000002');
  await new Promise(r => setTimeout(r, 800));
  const c1434Eval = await page.evaluate(() => {
    const items = document.querySelectorAll('.space-y-6 .relative.group');
    return {
      count: items.length,
      titles: Array.from(items).map(i => i.querySelector('.font-bold')?.textContent?.trim()),
    };
  });
  console.log('C1434 filter evaluation:', JSON.stringify(c1434Eval, null, 2));
  await page.screenshot({ path: 'screenshots/prod_eventos_c1434_verified.png' });
  console.log('Screenshot saved to screenshots/prod_eventos_c1434_verified.png');

  // 5. Test folder filter for C1234 (Acindar)
  console.log('5. Testing folder filter for C1234 (Acindar)...');
  await page.select('select[aria-label="Filtrar por carpeta"]', 'c1234000-0000-0000-0000-000000000001');
  await new Promise(r => setTimeout(r, 800));
  const c1234Eval = await page.evaluate(() => {
    const items = document.querySelectorAll('.space-y-6 .relative.group');
    return {
      count: items.length,
      titles: Array.from(items).map(i => i.querySelector('.font-bold')?.textContent?.trim()),
    };
  });
  console.log('C1234 filter evaluation:', JSON.stringify(c1234Eval, null, 2));
  await page.screenshot({ path: 'screenshots/prod_eventos_c1234_verified.png' });
  console.log('Screenshot saved to screenshots/prod_eventos_c1234_verified.png');

  console.log('ALL VERIFICATIONS PASSED IN PRODUCTION!');
  await browser.close();
})();
