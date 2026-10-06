const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100'],
    defaultViewport: { width: 1600, height: 1100 },
  });

  const page = await browser.newPage();
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const allColumns = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.kanban-column, [data-column-id], .grid > div'));
    return cols.map(c => {
      const header = c.querySelector('h3, h2, .font-semibold, .font-bold')?.innerText.trim() || 'Columna';
      const cards = Array.from(c.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));
      return {
        header,
        count: cards.length,
        cards: cards.map(k => k.innerText.trim())
      };
    }).filter(c => c.count > 0);
  });

  console.log('=== DESGLOSE COMPLETO DE TARJETAS EN CADA COLUMNA ===');
  allColumns.forEach(col => {
    console.log(`\n======================================================`);
    console.log(`📌 ${col.header} (${col.count} tarjetas)`);
    console.log(`======================================================`);
    col.cards.forEach((cardText, i) => {
      console.log(`\n--- [Tarjeta ${i + 1}] ---`);
      console.log(cardText);
    });
  });

  await browser.close();
})();
