const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== AUDITORÍA FORENSE EN VIVO DE KANBAN EN PRODUCCIÓN ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('1. Iniciando sesión como Gerencia...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

  console.log('2. Navegando a /comprobantes...');
  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot general de la vista Kanban
  const kanbanShot = path.resolve('screenshots/kanban_prod_verified_live.png');
  await page.screenshot({ path: kanbanShot, fullPage: true });
  console.log('Captura completa guardada en:', kanbanShot);

  // Extraer las tarjetas de cada columna
  const columnsData = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.kanban-column, [data-column-id]'));
    const results = {};

    cols.forEach(col => {
      const titleEl = col.querySelector('h3, .font-semibold');
      const title = titleEl ? titleEl.innerText.trim() : 'Unknown';
      const cards = Array.from(col.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));

      results[title] = cards.map(c => {
        return {
          text: c.innerText,
          dataset: { ...c.dataset }
        };
      });
    });

    return results;
  });

  console.log('\n--- RESUMEN DE COLUMNAS DEL KANBAN ---');
  for (const [colTitle, cards] of Object.entries(columnsData)) {
    console.log(`\n📌 COLUMNA: "${colTitle}" (${cards.length} tarjetas)`);
    cards.forEach((card, idx) => {
      const firstLines = card.text.split('\n').slice(0, 5).join(' | ');
      console.log(`  [${idx + 1}] ${firstLines}`);
    });
  }

  // Comprobar casos específicos
  const pageHtml = await page.content();

  // Test C1289
  const c1289OldAbsurdity = pageHtml.includes('+USD 294.00') || pageHtml.includes('supera la cotización presupuestada (+21.0%)');
  const c1289Correct = pageHtml.includes('7555554402') && pageHtml.includes('USD 57');
  console.log('\n--- VERIFICACIÓN CASO C1289 (Maersk 7555554402) ---');
  console.log(`  ¿Desvío absurdo (+USD 294) presente?: ${c1289OldAbsurdity} (Debe ser FALSE)`);
  console.log(`  ¿Comprobante USD 57.00 presente?: ${c1289Correct} (Debe ser TRUE)`);

  // Test C1471
  const c1471OldAbsurdity = pageHtml.includes('+EUR 17982.56') || pageHtml.includes('+165.8% Desvío');
  const c1471Correct = pageHtml.includes('261005130R') && pageHtml.includes('EUR 10.848,55');
  console.log('\n--- VERIFICACIÓN CASO C1471 (AMA Freight 261005130R) ---');
  console.log(`  ¿Desvío absurdo (+EUR 17.982) presente?: ${c1471OldAbsurdity} (Debe ser FALSE)`);
  console.log(`  ¿Comprobante EUR 10.848,55 conciliado presente?: ${c1471Correct} (Debe ser TRUE)`);

  // Test IT1486
  const it1486Neto = pageHtml.includes('Neto:') && pageHtml.includes('800.000,00');
  const it1486Iva = pageHtml.includes('IVA (21%):') && pageHtml.includes('168.000,00');
  const it1486OldDesvio = pageHtml.includes('+ARS 168000.00 (+21.0%)');
  console.log('\n--- VERIFICACIÓN CASO IT1486 (LGV Transportes) ---');
  console.log(`  ¿Neto $800.000 discriminado?: ${it1486Neto} (Debe ser TRUE)`);
  console.log(`  ¿IVA $168.000 discriminado como crédito fiscal?: ${it1486Iva} (Debe ser TRUE)`);
  console.log(`  ¿Desvío erróneo por IVA presente?: ${it1486OldDesvio} (Debe ser FALSE)`);

  // Test C1056 (Demo de Desvío Exacto)
  const c1056Demo = pageHtml.includes('HL-BUE-260912') && pageHtml.includes('USD 3.431,16') && pageHtml.includes('+USD 595,49');
  console.log('\n--- VERIFICACIÓN CASO C1056 (Demo Hapag-Lloyd con desvío exacto) ---');
  console.log(`  ¿Tarjeta demo Hapag-Lloyd presente con números exactos (+USD 595,49 / +21.0%)?: ${c1056Demo}`);

  // Test Textos de Bloqueo
  const hasBlockingSupervisor = pageHtml.includes('Requiere autorización del supervisor antes de cargar en Kipintoch');
  const hasPendingBadge = pageHtml.includes('⏳ Pendiente de Autorización');
  console.log('\n--- VERIFICACIÓN DE POLÍTICA DE NO BLOQUEO ---');
  console.log(`  ¿Texto "Requiere autorización del supervisor..." presente?: ${hasBlockingSupervisor} (Debe ser FALSE)`);
  console.log(`  ¿Badge "⏳ Pendiente de Autorización" presente?: ${hasPendingBadge} (Debe ser FALSE)`);

  await browser.close();
  console.log('\n=== AUDITORÍA FINALIZADA ===');
})();
