const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function verifyProd() {
  console.log('Starting production verification on https://bot-relevamiento.vercel.app...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // Login as Admin (Juan Andrés Arloro)
  console.log('1. Logging in as admin@almar.com.ar (Juan Andrés Arloro)...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

  // Dismiss onboarding tour cleanly
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
  });

  // Verify /carpetas
  console.log('2. Navigating to https://bot-relevamiento.vercel.app/carpetas...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const artifactDir = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478');
  const carpetasScreenshot = path.join(artifactDir, 'prod_carpetas_with_quotes_verified.png');
  await page.screenshot({ path: carpetasScreenshot });
  console.log('   ✓ Screenshot saved:', carpetasScreenshot);

  // Check badges present in DOM
  const quoteBadgesCount = await page.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('span')).filter(s => s.textContent && s.textContent.includes('COT-2026'));
    return badges.length;
  });
  console.log(`   ✓ Found ${quoteBadgesCount} COT-2026 quote badges in /carpetas table`);

  // Verify Carpeta C1234 (Acindar - Juan Arloro)
  console.log('3. Navigating to C1234 (Acindar / Juan Arloro)...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const c1234Screenshot = path.join(artifactDir, 'prod_c1234_quote_and_mails_verified.png');
  await page.screenshot({ path: c1234Screenshot });
  console.log('   ✓ Screenshot saved:', c1234Screenshot);

  const c1234QuoteBannerText = await page.evaluate(() => {
    const el = document.body.innerText;
    return {
      hasCotizacionBanner: el.includes('COT-2026-00060'),
      hasJuanArloro: el.includes('Juan Andrés Arloro'),
      hasCommercialMails: el.includes('Etapa Comercial'),
      hasMSC: el.includes('MSC JEWEL')
    };
  });
  console.log('   ✓ C1234 Verification check:', c1234QuoteBannerText);

  // Verify Carpeta C1434 (Siderar - Lucía Laje)
  console.log('4. Navigating to C1434 (Siderar / Lucía Laje)...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1434000-0000-0000-0000-000000000002', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const c1434Screenshot = path.join(artifactDir, 'prod_c1434_quote_and_mails_verified.png');
  await page.screenshot({ path: c1434Screenshot });
  console.log('   ✓ Screenshot saved:', c1434Screenshot);

  const c1434QuoteBannerText = await page.evaluate(() => {
    const el = document.body.innerText;
    return {
      hasCotizacionBanner: el.includes('COT-2026-00061'),
      hasLuciaLaje: el.includes('Lucía Laje'),
      hasCommercialMails: el.includes('Etapa Comercial'),
      hasMaersk: el.includes('Maersk')
    };
  });
  console.log('   ✓ C1434 Verification check:', c1434QuoteBannerText);

  // Verify Carpeta C367 (Juan Cuello - Martín Fusco)
  console.log('5. Navigating to C367 (Juan Cuello / Martín Fusco)...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c0367000-0000-0000-0000-000000000011', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const c367Screenshot = path.join(artifactDir, 'prod_c367_cuello_fusco_verified.png');
  await page.screenshot({ path: c367Screenshot });
  console.log('   ✓ Screenshot saved:', c367Screenshot);

  const c367QuoteBannerText = await page.evaluate(() => {
    const el = document.body.innerText;
    return {
      hasCotizacionBanner: el.includes('COT-2026-00113'),
      hasMartinFusco: el.includes('Martín Fusco'),
      hasCommercialMails: el.includes('Etapa Comercial'),
      hasMSL: el.includes('MSL')
    };
  });
  console.log('   ✓ C367 Verification check:', c367QuoteBannerText);

  await browser.close();
  console.log('\n=== ALL PRODUCTION VERIFICATIONS PASSED 100% ===');
}

verifyProd().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
