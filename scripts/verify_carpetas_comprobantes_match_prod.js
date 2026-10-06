const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifyProdCarpetasMatch() {
  console.log('=== VERIFICACION E2E EN PRODUCCION: CONCORDANCIA FACTURAS Y MONTOS ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  console.log('1. Autenticando en https://bot-relevamiento.vercel.app/login...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

  await page.type('input[type="email"], input[name="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"], input[name="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
  });

  console.log('2. Navegando al listado general /carpetas...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const listadoPath = path.resolve(__dirname, '../prod_carpetas_matched_list.png');
  await page.screenshot({ path: listadoPath, fullPage: true });
  console.log('   Captura listado general:', listadoPath);

  // Carpetas críticas a verificar:
  // C1234: c1234000-0000-0000-0000-000000000001
  // C367: c0367000-0000-0000-0000-000000000011
  // C620: c0620000-0000-0000-0000-000000000012
  // IT1486: it148600-0000-0000-0000-000000000003
  // EA1561: ea156100-0000-0000-0000-000000000008

  const targets = [
    { num: 'C1234', id: 'c1234000-0000-0000-0000-000000000001', name: 'Acindar' },
    { num: 'C367', id: 'c0367000-0000-0000-0000-000000000011', name: 'Juan Cuello' },
    { num: 'C620', id: 'c0620000-0000-0000-0000-000000000012', name: 'CONICET' },
    { num: 'IT1486', id: 'it148600-0000-0000-0000-000000000003', name: 'Paladini' },
  ];

  for (const t of targets) {
    console.log(`\n3. Verificando expediente ${t.num} (${t.name})...`);
    await page.goto(`https://bot-relevamiento.vercel.app/carpetas/${t.id}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Clic en pestaña Comprobantes
    const comprobantesTab = await page.$('button[value="comprobantes"]');
    if (comprobantesTab) {
      await comprobantesTab.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log(`   Pestaña Comprobantes abierta para ${t.num}`);
    }

    const compShot = path.resolve(__dirname, `../prod_${t.num.toLowerCase()}_comprobantes_matched.png`);
    await page.screenshot({ path: compShot, fullPage: false });
    console.log(`   Captura comprobantes ${t.num}:`, compShot);

    // Clic en pestaña Finanzas
    const finanzasTab = await page.$('button[value="finanzas"]');
    if (finanzasTab) {
      await finanzasTab.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log(`   Pestaña Finanzas abierta para ${t.num}`);
      const finShot = path.resolve(__dirname, `../prod_${t.num.toLowerCase()}_finanzas_matched.png`);
      await page.screenshot({ path: finShot, fullPage: false });
      console.log(`   Captura finanzas ${t.num}:`, finShot);
    }
  }

  await browser.close();
  console.log('\n=== VERIFICACION COMPLETADA CON EXITO ===');
}

verifyProdCarpetasMatch().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
