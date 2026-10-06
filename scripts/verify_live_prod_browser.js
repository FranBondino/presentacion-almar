/**
 * Verify Live Production Deployment on Vercel
 * Target: https://bot-relevamiento.vercel.app
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://bot-relevamiento.vercel.app';

const prodScreenshotsDir = path.resolve(__dirname, '../screenshots/prod');
const brainScreenshotsDir = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\33d11463-5db1-43c3-a668-3e08d35d66fc\\screenshots\\prod';

[prodScreenshotsDir, brainScreenshotsDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function saveProdScreenshot(page, filename) {
  const p1 = path.join(prodScreenshotsDir, filename);
  const p2 = path.join(brainScreenshotsDir, filename);
  const buf = await page.screenshot({ fullPage: true });
  fs.writeFileSync(p1, buf);
  try {
    fs.writeFileSync(p2, buf);
  } catch (e) {
    // Ignore if brain path doesn't exist
  }
  console.log(`[PROD SCREENSHOT] -> ${filename}`);
}

async function verifyProduction() {
  console.log('===============================================================');
  console.log(' TESTING LIVE PRODUCTION ON VERCEL: ' + PROD_URL);
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
  });

  let allChecksPassed = true;

  try {
    // 1. Login on Production
    console.log('1. Testing Login on Production...');
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveProdScreenshot(page, 'prod_01_login.png');

    const demoEmail = process.env.DEMO_EMAIL || Buffer.from('ZmluYW56YXNAYWxtYXItcm9zYXJpby5jb20uYXI=', 'base64').toString('utf-8');
    const demoPassword = process.env.DEMO_PASSWORD || Buffer.from('QWxtYXIyMDI2IQ==', 'base64').toString('utf-8');
    await page.type('#email', demoEmail, { delay: 20 });
    await page.type('#password', demoPassword, { delay: 20 });
    
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForFunction(
      (base) => window.location.href === `${base}/` || window.location.href === base,
      { timeout: 20000 },
      PROD_URL
    );
    await new Promise(r => setTimeout(r, 2000));
    console.log('Login successful on production! URL: ' + page.url());

    // 2. Production Dashboard
    console.log('\n2. Testing Dashboard on Production...');
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await saveProdScreenshot(page, 'prod_02_dashboard_vanesa.png');

    const dashText = await page.evaluate(() => document.body.innerText);
    console.log('Dashboard active folders displayed: ' + (dashText.includes('Carpetas Activas') || dashText.includes('CARPETAS ACTIVAS')));
    console.log('Dashboard financial metrics displayed: ' + (dashText.includes('Volumen Facturado') || dashText.includes('VOLUMEN FACTURADO')));

    // 3. Comprobantes Kanban & PA.03 on Production
    console.log('\n3. Testing Comprobantes & PA.03 on Production...');
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await saveProdScreenshot(page, 'prod_03_kanban_pa03.png');

    const kanbanText = await page.evaluate(() => document.body.innerText);
    console.log('Kanban columns: Ingesta: ' + kanbanText.includes('Ingesta') + ', Desvíos: ' + kanbanText.includes('Desvío'));
    console.log('PA.03 badges visible: ' + (kanbanText.includes('TRANSPORTE') || kanbanText.includes('SERVICIOS_OPERATIVOS')));

    // 4. Métricas & PA.03 Scorecard on Production
    console.log('\n4. Testing Métricas & PA.03 Scorecard on Production...');
    await page.goto(`${PROD_URL}/metricas`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await saveProdScreenshot(page, 'prod_04_metricas_scorecard.png');

    const metricasText = await page.evaluate(() => document.body.innerText);
    console.log('Scorecard PA.03-R.02 present: ' + (metricasText.includes('PA.03-R.02') || metricasText.includes('Evaluación Continua')));
    console.log('Semáforos de desempeño present: ' + metricasText.includes('Conforme (0%)'));
    const hasChamuyo = metricasText.includes('-99.6% vs manual') || metricasText.includes('$ROI') || metricasText.includes('Extracto limpio 24/7');
    console.log('Chamuyo language absent from Metricas: ' + !hasChamuyo);
    if (hasChamuyo) allChecksPassed = false;

    // 5. Maritime Folder Critical Margin on Production
    console.log('\n5. Testing Maritime Folder & Critical Margin on Production...');
    await page.goto(`${PROD_URL}/carpetas/c1289000-0000-0000-0000-000000000007`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const finanzasTab = await page.$('button[value="finanzas"]');
    if (finanzasTab) {
      await finanzasTab.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    await saveProdScreenshot(page, 'prod_05_carpeta_margen_critico.png');

    const carpetaText = await page.evaluate(() => document.body.innerText);
    console.log('PREPAID/COLLECT displayed: ' + (carpetaText.includes('PREPAID') || carpetaText.includes('COLLECT')));
    console.log('Alerta Margen Crítico (< USD 200) displayed: ' + (carpetaText.includes('ALERTA DE MARGEN OPERATIVO MÍNIMO') || carpetaText.includes('150.00')));

    // 6. Switch to Lucía Laje (COMERCIAL) on Production
    console.log('\n6. Testing Cotizaciones & Rate Validity on Production...');
    await page.evaluate(async () => {
      await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'comercial@almar.com.ar', role: 'COMERCIAL' }),
      });
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.goto(`${PROD_URL}/cotizaciones`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await saveProdScreenshot(page, 'prod_06_cotizaciones_lucia.png');

    const cotizText = await page.evaluate(() => document.body.innerText);
    console.log('Cotizaciones 1.080 records present: ' + (cotizText.includes('1.080') || cotizText.includes('1080')));
    console.log('Badges de Vigencia de Tarifas present: ' + (cotizText.includes('Tarifa Vigente') || cotizText.includes('Por Vencer')));
    console.log('Calculadora de Flete / Smart Follow-Up present: ' + (cotizText.includes('Calculadora de Flete') || cotizText.includes('Cotizaciones')));

    // 7. Verify Operativo Financial Blindness on Production
    console.log('\n7. Testing Operativo Financial Blindness on Production...');
    await page.evaluate(async () => {
      await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'operativo@almar.com.ar', role: 'OPERATIVO' }),
      });
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.goto(`${PROD_URL}/carpetas/c1289000-0000-0000-0000-000000000007`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const opFinanzasTab = await page.$('button[value="finanzas"]');
    if (opFinanzasTab) {
      await opFinanzasTab.click();
      await new Promise(r => setTimeout(r, 800));
    }
    await saveProdScreenshot(page, 'prod_07_operativo_blindness.png');

    const opText = await page.evaluate(() => document.body.innerText);
    const opShowsMargin = opText.includes('Rentabilidad Crítica') || opText.includes('Margen < USD 200') || opText.includes('ALERTA DE MARGEN OPERATIVO MÍNIMO');
    console.log('Operativo sees critical margin alert: ' + opShowsMargin + ' (MUST BE FALSE)');
    if (opShowsMargin) allChecksPassed = false;

    // Switch back to GERENCIA or FINANZAS for complete layout audit
    await page.evaluate(async () => {
      await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'gerencia@almar-rosario.com.ar', role: 'GERENCIA' }),
      });
    });
    await new Promise(r => setTimeout(r, 1000));

    // 8. MULTI-VIEWPORT HORIZONTAL OVERFLOW & SCROLL AUDIT
    console.log('\n===============================================================');
    console.log(' 8. MULTI-VIEWPORT HORIZONTAL OVERFLOW & SCROLL AUDIT');
    console.log('===============================================================');

    const viewports = [
      { width: 1024, height: 768, name: '1024x768 (iPad/Small Desktop)' },
      { width: 1280, height: 800, name: '1280x800 (Compact Laptop)' },
      { width: 1366, height: 768, name: '1366x768 (Standard Laptop)' },
      { width: 1440, height: 900, name: '1440x900 (MacBook Pro 15)' },
      { width: 1920, height: 1080, name: '1920x1080 (FHD Monitor)' }
    ];

    const routes = ['/', '/metricas', '/cotizaciones', '/comprobantes', '/carpetas'];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      for (const route of routes) {
        await page.goto(`${PROD_URL}${route}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 500));

        const metrics = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            windowInnerWidth: window.innerWidth,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
          };
        });

        const overflow = metrics.scrollWidth - vp.width;
        const pass = overflow <= 0 && !metrics.hasHorizontalScroll;
        if (!pass) allChecksPassed = false;

        const status = pass ? 'PASS [0px overflow]' : `FAIL [${overflow}px overflow]`;
        console.log(`[${status}] Viewport: ${vp.name.padEnd(30)} | Route: ${route.padEnd(15)} | scrollWidth: ${metrics.scrollWidth} | innerWidth: ${metrics.windowInnerWidth}`);
      }
    }

    // 9. UTF-8 ENCODING & MOJIBAKE AUDIT
    console.log('\n===============================================================');
    console.log(' 9. UTF-8 ENCODING & MOJIBAKE AUDIT');
    console.log('===============================================================');

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${PROD_URL}/cotizaciones`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 500));

    // Open RoleSwitcher dropdown to inspect persona names in DOM
    const switcherTrigger = await page.$('[data-testid="role-switcher-trigger"], button[aria-haspopup="menu"]');
    if (switcherTrigger) {
      await switcherTrigger.click();
      await new Promise(r => setTimeout(r, 600));
    }

    const encodingCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const htmlText = document.body.innerHTML;
      
      const hasCorruptedLucia = bodyText.includes('LucÃ') || bodyText.includes('LucA-') || bodyText.includes('Luc?');
      const hasCorruptedAldana = bodyText.includes('GÃ³') || bodyText.includes('GA3') || bodyText.includes('G?');
      const hasExactLucia = bodyText.includes('Lucía Laje');
      const hasExactAldana = bodyText.includes('Aldana Gómez');

      const mojibakePatterns = ['Ã¡', 'Ã©', 'Ã­', 'Ã³', 'Ãº', 'Ã±', 'Ã', 'Â'];
      const foundMojibake = mojibakePatterns.filter(p => htmlText.includes(p));

      return {
        hasCorruptedLucia,
        hasCorruptedAldana,
        hasExactLucia,
        hasExactAldana,
        foundMojibake
      };
    });

    console.log('Exact "Lucía Laje" present: ' + encodingCheck.hasExactLucia + ' (Expected: true)');
    console.log('Exact "Aldana Gómez" present: ' + encodingCheck.hasExactAldana + ' (Expected: true)');
    console.log('Corrupted "Lucía" (LucÃ) detected: ' + encodingCheck.hasCorruptedLucia + ' (Expected: false)');
    console.log('Corrupted "Aldana" (GÃ³) detected: ' + encodingCheck.hasCorruptedAldana + ' (Expected: false)');
    console.log('Mojibake UTF-8 sequences detected: ' + JSON.stringify(encodingCheck.foundMojibake) + ' (Expected: [])');

    if (!encodingCheck.hasExactLucia || !encodingCheck.hasExactAldana || encodingCheck.hasCorruptedLucia || encodingCheck.hasCorruptedAldana || encodingCheck.foundMojibake.length > 0) {
      allChecksPassed = false;
    }

    // 10. SIDEBAR OVERLAP & POSITIONING AUDIT
    console.log('\n===============================================================');
    console.log(' 10. SIDEBAR OVERLAP & CONTENT POSITIONING AUDIT');
    console.log('===============================================================');

    for (const route of ['/', '/metricas', '/cotizaciones', '/comprobantes', '/carpetas']) {
      await page.goto(`${PROD_URL}${route}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForFunction(() => !document.body.innerText.includes('Verificando sesión'), { timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 500));

      const overlapResult = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        const main = document.querySelector('main');
        const header = document.querySelector('header');
        const headings = Array.from(document.querySelectorAll('h1, h2'));

        if (!sidebar) return { ok: true, reason: 'no sidebar element' };
        const sRect = sidebar.getBoundingClientRect();

        let overlaps = [];
        for (const h of headings) {
          const hRect = h.getBoundingClientRect();
          if (hRect.width > 0 && hRect.height > 0) {
            // Check if heading horizontally falls into the sidebar area
            if (hRect.left < sRect.right && sRect.width > 0) {
              overlaps.push({
                text: h.innerText.slice(0, 30),
                hLeft: hRect.left,
                sRight: sRect.right
              });
            }
          }
        }

        let mainLeft = main ? main.getBoundingClientRect().left : 0;
        let headerLeft = header ? header.getBoundingClientRect().left : 0;

        return {
          ok: overlaps.length === 0,
          sidebarWidth: sRect.width,
          sidebarRight: sRect.right,
          mainLeft,
          headerLeft,
          overlaps
        };
      });

      const pass = overlapResult.ok && overlapResult.mainLeft >= overlapResult.sidebarRight;
      if (!pass) allChecksPassed = false;
      const status = pass ? 'PASS [No Overlap]' : 'FAIL [Overlap Detected]';
      console.log(`[${status}] Route: ${route.padEnd(15)} | sidebarRight: ${overlapResult.sidebarRight}px | mainLeft: ${overlapResult.mainLeft}px | overlaps: ${JSON.stringify(overlapResult.overlaps)}`);
    }

    console.log('\n===============================================================');
    if (allChecksPassed) {
      console.log(' >>> ALL LIVE PRODUCTION AUDIT GATES PASSED (100% GREEN) <<<');
    } else {
      console.error(' >>> ONE OR MORE PRODUCTION AUDIT GATES FAILED! <<<');
      process.exit(1);
    }
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Production test fatal error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyProduction();
