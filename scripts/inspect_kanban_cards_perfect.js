const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== INSPECCIÓN PERICIAL DEL KANBAN EN VIVO (PRODUCCIÓN) ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('1. Autenticando en Vercel...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  console.log('2. Navegando a /comprobantes...');
  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss onboarding tour if any overlay is visible
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    const buttons = Array.from(document.querySelectorAll('button'));
    const dismissBtn = buttons.find(b => b.innerText.includes('Omitir') || b.innerText.includes('Cerrar') || b.innerText.includes('Entendido'));
    if (dismissBtn) dismissBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Captura general en alta definición
  const shotPath = path.resolve('screenshots/prod_kanban_mathematics_verified.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Captura guardada en:', shotPath);

  // Extraer todas las columnas y sus tarjetas
  const kanbanState = await page.evaluate(() => {
    const columns = Array.from(document.querySelectorAll('.kanban-column, [data-column-id]'));
    return columns.map(col => {
      const header = col.querySelector('h3, h2, .font-bold, .font-semibold');
      const title = header ? header.innerText.trim() : 'Columna';
      const cards = Array.from(col.querySelectorAll('.kanban-card, [data-testid^="kanban-card-"]'));
      return {
        title,
        cardsCount: cards.length,
        cards: cards.map(c => ({
          text: c.innerText.trim(),
          testId: c.getAttribute('data-testid') || '',
          carpeta: c.getAttribute('data-carpeta') || '',
        }))
      };
    });
  });

  console.log('\n--- ESTRUCTURA DE COLUMNAS Y CONTENIDO KANBAN ---');
  kanbanState.forEach((col, idx) => {
    console.log(`\n======================================================`);
    console.log(`COLUMNA ${idx + 1}: ${col.title} (${col.cardsCount} tarjetas)`);
    console.log(`======================================================`);
    col.cards.forEach((c, cIdx) => {
      console.log(`\n[Tarj ${cIdx + 1}] Carpeta: ${c.carpeta} | TestId: ${c.testId}`);
      console.log(c.text);
    });
  });

  // Extraer el texto completo de la página para verificaciones de seguridad
  const fullText = await page.evaluate(() => document.body.innerText);

  console.log('\n======================================================');
  console.log('AUDITORÍA MATEMÁTICA Y DE COHERENCIA EN VIVO');
  console.log('======================================================');

  // 1. C1289 (Maersk USD 57.00)
  const c1289Absurdo = fullText.includes('+USD 294.00') || fullText.includes('supera la cotización presupuestada (+21.0%)');
  console.log('1. Caso C1289 (Maersk 7555554402 - USD 57.00):');
  console.log(`   - ¿Desvío absurdo (+USD 294) presente?: ${c1289Absurdo ? 'SÍ (ERROR)' : 'NO (CORRECTO)'}`);
  console.log(`   - ¿Monto dentro de presupuesto verificado?: ${fullText.includes('USD 57,00 de USD 1.400,00') || fullText.includes('Monto dentro de presupuesto') ? 'SÍ' : 'NO'}`);

  // 2. C1471 (AMA Freight EUR 10.848,55)
  const c1471Absurdo = fullText.includes('+EUR 17982.56') || fullText.includes('17982') || fullText.includes('165.8%');
  console.log('\n2. Caso C1471 (AMA Freight 261005130R - EUR 10.848,55):');
  console.log(`   - ¿Desvío absurdo (+EUR 17.982) presente?: ${c1471Absurdo ? 'SÍ (ERROR)' : 'NO (CORRECTO)'}`);
  console.log(`   - ¿Monto exacto al cotizado verificado?: ${fullText.includes('Monto exacto al cotizado (EUR 10.848,55)') ? 'SÍ' : 'NO'}`);

  // 3. IT1486 (LGV Transportes ARS 968.000,00)
  const it1486DesvioErroneo = fullText.includes('+ARS 168000') || fullText.includes('+21.0% Desvío\nPresupuesto Estimado:\nARS 800000');
  console.log('\n3. Caso IT1486 (LGV Transportes - Flete Terrestre):');
  console.log(`   - ¿Neto discriminado (ARS 800.000,00)?: ${fullText.includes('800.000,00') ? 'SÍ' : 'NO'}`);
  console.log(`   - ¿IVA 21% discriminado como crédito fiscal (ARS 168.000,00)?: ${fullText.includes('168.000,00') ? 'SÍ' : 'NO'}`);
  console.log(`   - ¿Desvío erróneo por IVA presente?: ${it1486DesvioErroneo ? 'SÍ (ERROR)' : 'NO (CORRECTO)'}`);
  console.log(`   - ¿Conciliado con cotización (Flete neto ARS 800.000,00)?: ${fullText.includes('Conciliado con cotización (Flete neto ARS 800.000,00)') ? 'SÍ' : 'NO'}`);

  // 4. C1056 (Demo de Desvío Exacto - Hapag-Lloyd)
  const c1056Presente = fullText.includes('HL-BUE-260912');
  console.log('\n4. Caso C1056 (Demo Hapag-Lloyd en Columna Desvíos):');
  console.log(`   - ¿Tarjeta HL-BUE-260912 presente?: ${c1056Presente ? 'SÍ' : 'NO'}`);
  if (c1056Presente) {
    console.log(`   - ¿Presupuesto Cotizado USD 2.835,67?: ${fullText.includes('2.835,67') ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Facturado Naviera USD 3.431,16?: ${fullText.includes('3.431,16') ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Sobrecosto exacto +USD 595,49 (+21.0%)?: ${fullText.includes('595,49') ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Causa de estadía Contecar Cartagena?: ${fullText.includes('sobreestadía') ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Badge "ℹ️ Registrado para Control Contable"?: ${fullText.includes('Registrado para Control Contable') ? 'SÍ' : 'NO'}`);
  }

  // 5. Cero Bloqueos Operativos
  console.log('\n5. Política Institucional de Cero Bloqueos:');
  console.log(`   - ¿Aparece "Requiere autorización del supervisor"?: ${fullText.includes('Requiere autorización del supervisor') ? 'SÍ (ERROR)' : 'NO (LIMPIO)'}`);
  console.log(`   - ¿Aparece "⏳ Pendiente de Autorización"?: ${fullText.includes('⏳ Pendiente de Autorización') ? 'SÍ (ERROR)' : 'NO (LIMPIO)'}`);

  await browser.close();
  console.log('\n=== AUDITORÍA FINALIZADA CON ÉXITO ===');
})();
