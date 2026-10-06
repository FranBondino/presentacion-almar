const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== CAPTURANDO /comprobantes VIA RETURNURL ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100'],
    defaultViewport: { width: 1600, height: 1100 },
  });

  const page = await browser.newPage();

  console.log('1. Abriendo login con returnUrl=/comprobantes...');
  await page.goto('https://bot-relevamiento.vercel.app/login?returnUrl=%2Fcomprobantes', { waitUntil: 'networkidle2' });

  // Pre-seed localStorage so onboarding tour never triggers
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  console.log('2. Ingresando credenciales de Gerencia...');
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');

  console.log('3. Haciendo click en Ingresar al Sistema...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  console.log('4. Navegación completada a:', page.url());
  await new Promise(r => setTimeout(r, 3000));

  // Dismiss any modal if still present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.includes('Omitir') || x.innerText.includes('Cerrar') || x.innerText.includes('Entendido'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const shotPath = path.resolve('screenshots/prod_kanban_returnurl_live.png');
  try {
    await page.screenshot({ path: shotPath });
    console.log('Screenshot guardado en:', shotPath);
  } catch (err) {
    console.log('Screenshot warning:', err.message);
  }

  // Extract cards
  const cards = await page.evaluate(() => {
    const cardEls = Array.from(document.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));
    return cardEls.map(el => {
      const col = el.closest('.kanban-column, [data-column-id]');
      const colTitle = col ? col.querySelector('h3, h2, .font-semibold, .font-bold')?.innerText.trim() : 'Columna';
      return {
        colTitle,
        text: el.innerText.trim(),
        carpeta: el.getAttribute('data-carpeta') || '',
        testId: el.getAttribute('data-testid') || ''
      };
    });
  });

  console.log(`\n=== TOTAL TARJETAS EXTRAÍDAS: ${cards.length} ===`);
  cards.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] Columna: ${c.colTitle} | Carpeta: ${c.carpeta}`);
    console.log(c.text);
    console.log('--------------------------------------------------');
  });

  await browser.close();
  console.log('=== FIN DEL TEST ===');
})();
