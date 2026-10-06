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

  console.log('2. Waiting for deployment with "Corte Pericial de Métricas: 03/09/2026" to be live on Vercel...');
  let deployed = false;
  for (let attempt = 1; attempt <= 15; attempt++) {
    const content = await page.content();
    if (content.includes('Corte Pericial de Métricas: 03/09/2026')) {
      deployed = true;
      console.log(`Deployment confirmed live on attempt ${attempt}!`);
      break;
    }
    console.log(`Attempt ${attempt}: waiting for Vercel deployment (reloading in 8s)...`);
    await new Promise(r => setTimeout(r, 8000));
    await page.reload({ waitUntil: 'networkidle2' });
  }

  if (!deployed) {
    console.error('Timeout waiting for deployment.');
    await browser.close();
    process.exit(1);
  }

  // 1. Capture Dashboard Header & Provenance
  console.log('3. Capturing Dashboard Header with calculation cutoff badge...');
  const statusBar = await page.$('#dispatch-status-bar');
  if (statusBar) {
    await statusBar.screenshot({ path: 'screenshots/prod_dispatch_status_bar_cutoff.png' });
    console.log('Saved screenshots/prod_dispatch_status_bar_cutoff.png');
  }

  await page.screenshot({ path: 'screenshots/prod_dashboard_full_cutoff.png' });
  console.log('Saved screenshots/prod_dashboard_full_cutoff.png');

  // 2. Navigate to /eventos
  console.log('4. Navigating to /eventos...');
  await page.goto('https://bot-relevamiento.vercel.app/eventos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Inspect page details
  const pageEvaluation = await page.evaluate(() => {
    const textNodes = document.body.innerText;
    const cards = document.querySelectorAll('.group .rounded-xl');
    const firstTitle = cards[0]?.querySelector('.font-bold')?.textContent?.trim();
    const firstDate = cards[0]?.querySelector('.font-mono')?.textContent?.trim();
    const lastCard = cards[cards.length - 1];
    const lastTitle = lastCard?.querySelector('.font-bold')?.textContent?.trim();
    const lastDate = lastCard?.querySelector('.font-mono')?.textContent?.trim();

    return {
      totalCardsRendered: cards.length,
      firstTitle,
      firstDate,
      lastTitle,
      lastDate,
      hasCutoffBadge: textNodes.includes('Corte Pericial al 03/09/2026'),
      hasStatsStrip: textNodes.includes('36') && textNodes.includes('12 / 12'),
    };
  });

  console.log('Eventos Page Evaluation:', JSON.stringify(pageEvaluation, null, 2));

  // Capture full eventos page
  await page.screenshot({ path: 'screenshots/prod_eventos_chronological_desc.png', fullPage: true });
  console.log('Saved screenshots/prod_eventos_chronological_desc.png');

  // 3. Test toggle to "Más antiguos primero"
  console.log('5. Clicking sort toggle to test Ascending order...');
  const sortToggleBtn = await page.$x("//button[contains(., 'Más recientes primero')]");
  if (sortToggleBtn.length > 0) {
    await sortToggleBtn[0].click();
    await new Promise(r => setTimeout(r, 800));

    const ascEvaluation = await page.evaluate(() => {
      const cards = document.querySelectorAll('.group .rounded-xl');
      return {
        firstTitle: cards[0]?.querySelector('.font-bold')?.textContent?.trim(),
        firstDate: cards[0]?.querySelector('.font-mono')?.textContent?.trim(),
      };
    });
    console.log('Ascending Evaluation:', JSON.stringify(ascEvaluation, null, 2));
    await page.screenshot({ path: 'screenshots/prod_eventos_chronological_asc.png' });
    console.log('Saved screenshots/prod_eventos_chronological_asc.png');

    // Toggle back to DESC
    const descToggleBtn = await page.$x("//button[contains(., 'Más antiguos primero')]");
    if (descToggleBtn.length > 0) {
      await descToggleBtn[0].click();
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // 4. Test filter by folder (e.g. C1434)
  console.log('6. Testing filter by folder C1434...');
  const select = await page.$('select[aria-label="Filtrar por carpeta"]');
  if (select) {
    await page.select('select[aria-label="Filtrar por carpeta"]', 'c1434000-0000-0000-0000-000000000002');
    await new Promise(r => setTimeout(r, 800));

    const filterEvaluation = await page.evaluate(() => {
      const cards = document.querySelectorAll('.group .rounded-xl');
      return {
        cardsCount: cards.length,
        titles: Array.from(cards).map(c => c.querySelector('.font-bold')?.textContent?.trim()),
      };
    });
    console.log('Filter C1434 Evaluation:', JSON.stringify(filterEvaluation, null, 2));
    await page.screenshot({ path: 'screenshots/prod_eventos_filtered_c1434.png' });
    console.log('Saved screenshots/prod_eventos_filtered_c1434.png');
  }

  console.log('All tests completed successfully!');
  await browser.close();
})();
