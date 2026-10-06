const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== TEST DIRECTO DE KANBAN VÍA IMPERSONATE EN PRODUCCIÓN ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('1. Cargando /login para inicializar contexto...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

  console.log('2. Invocando /api/auth/impersonate con rol GERENCIA...');
  const impersonateRes = await page.evaluate(async () => {
    const res = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'GERENCIA' }),
    });
    return res.json();
  });
  console.log('Respuesta de impersonate:', impersonateRes);

  // Set dismiss flags
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  console.log('3. Navegando a /comprobantes...');
  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  console.log('URL actual en comprobantes:', page.url());

  // Close any overlay
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.includes('Omitir') || x.innerText.includes('Cerrar') || x.innerText.includes('Entendido'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const shotPath = path.resolve('screenshots/prod_kanban_direct_verified.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Screenshot guardado en:', shotPath);

  // Extraer las 4 columnas
  const columnsData = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.kanban-column, [data-column-id]'));
    return cols.map(c => {
      const title = c.querySelector('h3, h2, .font-semibold, .font-bold')?.innerText.trim() || 'Columna';
      const cards = Array.from(c.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));
      return {
        title,
        count: cards.length,
        cards: cards.map(card => card.innerText.trim())
      };
    });
  });

  console.log('\n--- DETALLE DE COLUMNAS DEL KANBAN ---');
  columnsData.forEach(col => {
    console.log(`\n📌 COLUMNA: ${col.title} (${col.count} comprobantes)`);
    col.cards.forEach((text, i) => {
      console.log(`\n  [Tarj ${i + 1}]:\n${text.split('\n').map(l => '    ' + l).join('\n')}`);
    });
  });

  await browser.close();
  console.log('\n=== TEST FINALIZADO ===');
})();
