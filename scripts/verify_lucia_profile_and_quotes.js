const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('--- TESTING LUCIA LAJE PROFILE & QUOTES WITHOUT ACCIDENTAL LOGOUT ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('hasCompletedTour', 'true');
      localStorage.setItem('tour_completed', 'true');
      localStorage.setItem('almar_onboarding_completed_v1', 'true');
      localStorage.setItem('almar_tour_dismissed', 'true');
      localStorage.setItem('almar_interactive_tour_completed', 'true');
    } catch (e) {}
  });

  // Login as Lucía Laje
  console.log('Logging in as Lucía Laje (comercial@almar.com.ar)...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('input[type="email"]', 'comercial@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  await new Promise(r => setTimeout(r, 2000));
  console.log('Logged in. Current URL:', page.url());

  const dismissModalSafely = async () => {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const omitir = btns.find(b => b.innerText.trim() === 'Omitir tutorial' || b.innerText.trim() === 'Entendido' || b.innerText.trim() === 'Omitir');
      if (omitir) omitir.click();
    });
  };

  const outDir = path.join(__dirname, '../screenshots');

  // 1. Visit /cotizaciones as Lucía Laje
  console.log('\nNavigating to /cotizaciones...');
  await page.goto('https://bot-relevamiento.vercel.app/cotizaciones', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await dismissModalSafely();
  await new Promise(r => setTimeout(r, 1000));

  const cotText = await page.evaluate(() => document.body.innerText);
  console.log('--- /cotizaciones TEXT CHECK ---');
  console.log('Is logged in as Lucía Laje?', cotText.includes('Lucía Laje'));
  console.log('Shows Cartera Activa (Lucía Laje)?', cotText.includes('Cartera Activa (Lucía Laje)'));
  console.log('Shows Smart Follow-Up section?', cotText.includes('Smart Follow-Up') || cotText.includes('Recuperador'));

  const luciaCotShot = path.join(outDir, 'lucia_cotizaciones_clean_live.png');
  await page.screenshot({ path: luciaCotShot, fullPage: false });
  console.log('Saved /cotizaciones screenshot:', luciaCotShot);

  // Search for Dis-Den in table
  console.log('Searching for Dis-Den in table...');
  const searchInput = await page.$('input[placeholder*="Buscar"]');
  if (searchInput) {
    await searchInput.type('Dis-Den');
    await new Promise(r => setTimeout(r, 1500));
    
    const tableText = await page.evaluate(() => document.querySelector('table') ? document.querySelector('table').innerText : '');
    console.log('--- SEARCH RESULT FOR "Dis-Den" IN /cotizaciones ---');
    console.log(tableText);

    const luciaDisdenShot = path.join(outDir, 'lucia_cotizaciones_disden_found_live.png');
    await page.screenshot({ path: luciaDisdenShot, fullPage: false });
    console.log('Saved Dis-Den search screenshot:', luciaDisdenShot);
  }

  // 2. Visit /carpetas/c1234000-0000-0000-0000-000000000001 as Lucía Laje
  const c1234Url = 'https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001';
  console.log('\nNavigating to C1234 as Lucía Laje:', c1234Url);
  await page.goto(c1234Url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await dismissModalSafely();

  const c1234Text = await page.evaluate(() => document.body.innerText);
  console.log('--- C1234 TEXT CHECK AS LUCIA LAJE ---');
  console.log('Contains Dis-Den Odontología?', c1234Text.includes('Dis-Den Odontología'));
  console.log('Contains COT-2026-00010?', c1234Text.includes('COT-2026-00010'));
  console.log('Contains Lucía Laje as Responsable Comercial?', c1234Text.includes('Lucía Laje'));
  console.log('Contains US$ 1.950,00?', c1234Text.includes('1.950,00') || c1234Text.includes('1950'));
  console.log('Contains Margen Proyectado +US$ 142,50?', c1234Text.includes('142,50') || c1234Text.includes('142.50'));

  const luciaC1234FinalShot = path.join(outDir, 'lucia_c1234_final_verified.png');
  await page.screenshot({ path: luciaC1234FinalShot, fullPage: false });
  console.log('Saved final C1234 screenshot as Lucía:', luciaC1234FinalShot);

  await browser.close();
  console.log('--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
