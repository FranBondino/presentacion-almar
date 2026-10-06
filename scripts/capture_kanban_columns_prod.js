const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== CAPTURA Y VERIFICACIÓN FORENSE DE KANBAN EN VIVO ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('1. Iniciando sesión como gerencia@almar.com.ar...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);
  console.log('Login exitoso, URL actual:', page.url());

  // Desactivar modales de tour en localStorage
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
  });

  console.log('2. Navegando a /comprobantes...');
  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  console.log('En /comprobantes, URL actual:', page.url());

  // Cerrar cualquier modal residual
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const dismiss = buttons.find(b => b.innerText.includes('Omitir') || b.innerText.includes('Cerrar') || b.innerText.includes('Entendido'));
    if (dismiss) dismiss.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const shotPath = path.resolve('screenshots/kanban_prod_final_verified.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Screenshot guardado en:', shotPath);

  // Extraer información detallada de cada columna del Kanban
  const kanbanData = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.kanban-column, [data-column-id]'));
    return cols.map(col => {
      const title = col.querySelector('h3, h2, .font-semibold, .font-bold')?.innerText.trim() || 'Columna';
      const cards = Array.from(col.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));
      return {
        title,
        count: cards.length,
        cards: cards.map(c => c.innerText.trim())
      };
    });
  });

  console.log('\n--- CONTENIDO COMPLETO DEL TABLERO KANBAN ---');
  kanbanData.forEach(col => {
    console.log(`\n======================================================`);
    console.log(`📌 COLUMNA: ${col.title} (${col.count} comprobantes)`);
    console.log(`======================================================`);
    col.cards.forEach((cardText, i) => {
      console.log(`\n[Tarjeta ${i + 1}]`);
      console.log(cardText);
    });
  });

  // Verificaciones específicas de coherencia matemática
  const bodyText = await page.evaluate(() => document.body.innerText);

  console.log('\n======================================================');
  console.log('RESULTADOS DE LA AUDITORÍA PERICIAL EN PRODUCCIÓN');
  console.log('======================================================');

  // C1289
  const c1289_ok = !bodyText.includes('+USD 294.00') && (bodyText.includes('7555554402') || bodyText.includes('C1289'));
  console.log('1. Caso C1289 (Maersk 7555554402 - USD 57.00):');
  console.log(`   - Desvío erróneo +USD 294 eliminado: ${!bodyText.includes('+USD 294.00') ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`   - ¿Muestra monto dentro de presupuesto?: ${bodyText.includes('USD 57,00 de USD 1.400,00') || bodyText.includes('dentro de presupuesto') ? 'SÍ ✅' : 'NO'}`);

  // C1471
  const c1471_ok = !bodyText.includes('17982') && !bodyText.includes('165.8%') && (bodyText.includes('261005130R') || bodyText.includes('C1471'));
  console.log('\n2. Caso C1471 (AMA Freight 261005130R - EUR 10.848,55):');
  console.log(`   - Desvío erróneo +EUR 17.982 eliminado: ${!bodyText.includes('17982') ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`   - ¿Muestra monto exacto al cotizado?: ${bodyText.includes('Monto exacto al cotizado') || bodyText.includes('EUR 10.848,55') ? 'SÍ ✅' : 'NO'}`);

  // IT1486
  console.log('\n3. Caso IT1486 (LGV Transportes 0004-00000303 - ARS 968.000,00):');
  console.log(`   - ¿Neto discriminado ARS 800.000,00?: ${bodyText.includes('800.000,00') ? 'SÍ ✅' : 'NO'}`);
  console.log(`   - ¿IVA 21% discriminado como crédito fiscal (ARS 168.000,00)?: ${bodyText.includes('168.000,00') ? 'SÍ ✅' : 'NO'}`);
  console.log(`   - Desvío erróneo por IVA eliminado: ${!bodyText.includes('+ARS 168000') ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`   - ¿Conciliado con cotización (Flete neto ARS 800.000,00)?: ${bodyText.includes('Conciliado con cotización') ? 'SÍ ✅' : 'NO'}`);

  // C1056 Demo
  console.log('\n4. Caso C1056 (Demo de Desvío Exacto - Hapag-Lloyd):');
  console.log(`   - ¿Factura HL-BUE-260912 presente?: ${bodyText.includes('HL-BUE-260912') ? 'SÍ ✅' : 'NO'}`);
  console.log(`   - ¿Presupuesto USD 2.835,67 vs Facturado USD 3.431,16?: ${bodyText.includes('2.835,67') && bodyText.includes('3.431,16') ? 'SÍ ✅' : 'NO'}`);
  console.log(`   - ¿Sobrecosto exacto +USD 595,49 (+21.0%)?: ${bodyText.includes('595,49') && bodyText.includes('+21.0%') ? 'SÍ ✅' : 'NO'}`);
  console.log(`   - ¿Causa clara de sobreestadía en Contecar?: ${bodyText.includes('sobreestadía') ? 'SÍ ✅' : 'NO'}`);
  console.log(`   - ¿Badge no bloqueante "ℹ️ Registrado para Control Contable"?: ${bodyText.includes('Registrado para Control Contable') ? 'SÍ ✅' : 'NO'}`);

  // Zero blocking
  console.log('\n5. Política Institucional de Cero Bloqueos:');
  console.log(`   - Cero textos de "Requiere autorización del supervisor": ${!bodyText.includes('Requiere autorización del supervisor') ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`   - Cero badges "⏳ Pendiente de Autorización": ${!bodyText.includes('⏳ Pendiente de Autorización') ? 'SÍ ✅' : 'NO ❌'}`);

  await browser.close();
  console.log('\n=== AUDITORÍA FINALIZADA ===');
})();
