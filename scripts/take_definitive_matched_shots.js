const puppeteer = require('puppeteer');
const path = require('path');

async function takeDefinitiveMatchedShots() {
  console.log('=== CAPTURAS DEFINITIVAS DE CONCORDANCIA EN PRODUCCION ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. Login Admin
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
  });

  const targets = [
    { num: 'C367', id: 'c0367000-0000-0000-0000-000000000011', name: 'Juan Cuello / Metalúrgica Rosarina' },
    { num: 'C1234', id: 'c1234000-0000-0000-0000-000000000001', name: 'Acindar / Juan Arloro' },
    { num: 'C620', id: 'c0620000-0000-0000-0000-000000000012', name: 'CONICET / SAA Logistics UK' },
    { num: 'IT1486', id: 'it148600-0000-0000-0000-000000000003', name: 'Paladini / LGV Transportes' },
  ];

  for (const t of targets) {
    console.log(`\nProcesando ${t.num} (${t.name})...`);
    await page.goto(`https://bot-relevamiento.vercel.app/carpetas/${t.id}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Clic en tab Comprobantes
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Comprobantes'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const compFile = `prod_${t.num.toLowerCase()}_comprobantes_matched_live.png`;
    await page.screenshot({ path: compFile, fullPage: false });
    console.log(`  -> Guardada captura comprobantes: ${compFile}`);

    // Clic en tab Finanzas & Costos
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Finanzas & Costos'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const finFile = `prod_${t.num.toLowerCase()}_finanzas_matched_live.png`;
    await page.screenshot({ path: finFile, fullPage: false });
    console.log(`  -> Guardada captura finanzas: ${finFile}`);
  }

  // Captura listado general /carpetas
  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'prod_carpetas_matched_live.png', fullPage: true });
  console.log('  -> Guardada captura listado general: prod_carpetas_matched_live.png');

  await browser.close();
  console.log('=== PROCESO COMPLETADO EXITOSAMENTE ===');
}

takeDefinitiveMatchedShots().catch(console.error);
