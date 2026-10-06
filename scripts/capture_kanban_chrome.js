const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://bot-relevamiento.vercel.app';

(async () => {
  console.log('=== CAPTURANDO KANBAN CON CHROME NATIVO EN PRODUCCIÓN ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100'],
    defaultViewport: { width: 1600, height: 1100 },
  });

  const page = await browser.newPage();

  console.log('1. Iniciando sesión como Finanzas (Vanesa Meggiolaro)...');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'finanzas@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Login completado, URL actual:', page.url());

  console.log('2. Descartando tour onboarding...');
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });

  console.log('3. Navegando a /comprobantes...');
  await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('En comprobantes, URL actual:', page.url());

  // Close tour if visible
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitir = btns.find(b => b.innerText.includes('Omitir tutorial') || b.innerText.includes('Cerrar') || b.innerText.includes('Entendido'));
    if (omitir) omitir.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const shotPath = path.resolve('screenshots/prod_kanban_chrome_live.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Screenshot guardado en:', shotPath);

  // Extraer las tarjetas
  const cardsInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));
    return cards.map(c => {
      const col = c.closest('.kanban-column, [data-column-id]');
      const colTitle = col ? col.querySelector('h3, h2, .font-semibold, .font-bold')?.innerText.trim() : 'Columna';
      return {
        colTitle,
        text: c.innerText.trim(),
        testId: c.getAttribute('data-testid') || '',
        carpeta: c.getAttribute('data-carpeta') || '',
      };
    });
  });

  console.log(`\n--- TARJETAS EXTRAÍDAS (${cardsInfo.length} comprobantes) ---`);
  cardsInfo.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] Columna: ${c.colTitle} | Carpeta: ${c.carpeta}`);
    console.log(c.text);
    console.log('--------------------------------------------------');
  });

  await browser.close();
  console.log('\n=== AUDITORÍA CHROME FINALIZADA ===');
})();
