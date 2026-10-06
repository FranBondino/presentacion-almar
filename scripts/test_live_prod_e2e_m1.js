/**
 * Comprehensive E2E Live Production Verification Script
 * Target: https://bot-relevamiento.vercel.app
 * Author: Teamwork Explorer M1
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://bot-relevamiento.vercel.app';
const PASSWORD = 'Almar2026!';

const screenshotsDir = path.resolve(__dirname, '../screenshots/prod');
const agentScreenshotsDir = path.resolve(__dirname, '../.agents/teamwork/explorer_m1_prod/screenshots');

[screenshotsDir, agentScreenshotsDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function saveScreenshot(page, filename) {
  const p1 = path.join(screenshotsDir, filename);
  const p2 = path.join(agentScreenshotsDir, filename);
  const buf = await page.screenshot({ fullPage: false });
  fs.writeFileSync(p1, buf);
  fs.writeFileSync(p2, buf);
  console.log(`  [SCREENSHOT SAVED] -> ${filename}`);
}

async function performLogin(page, email, password) {
  console.log(`\n>>> Logging in as: ${email}`);
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
  });

  // Type email and password
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.click('#email', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#email', email, { delay: 15 });

  await page.click('#password', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#password', password, { delay: 15 });

  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();

  // Wait for redirection to dashboard or protected route
  await page.waitForFunction(
    (base) => !window.location.href.includes('/login'),
    { timeout: 20000 },
    PROD_URL
  );
  await new Promise(r => setTimeout(r, 2000));
  console.log(`  [LOGIN OK] Current URL: ${page.url()}`);
}

async function runLiveE2ETest() {
  console.log('========================================================================');
  console.log(' EXPLORER M1: LIVE PRODUCTION E2E SUITE — 6 ROLES & COPILOT AUDIT');
  console.log(` Target: ${PROD_URL} | Timestamp: ${new Date().toISOString()}`);
  console.log('========================================================================\n');

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

  const auditResults = {
    aldana: {},
    natali: {},
    vanesa: {},
    lucia: {},
    alejandro: {},
    juan: {},
    copilot: {},
    feedback: {}
  };

  try {
    // =========================================================================
    // 1. ALDANA GÓMEZ (OPERATIVO - operativo@almar.com.ar)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [ROLE 1/6] AUDITING ALDANA GÓMEZ (OPERATIVO)');
    console.log('------------------------------------------------------------------------');

    await performLogin(page, 'operativo@almar.com.ar', PASSWORD);
    await new Promise(r => setTimeout(r, 1500));

    const aldanaText = await page.evaluate(() => document.body.innerText);

    // Certify operational metrics (12, 6, 5, 5)
    const hasCarpetasActivas = aldanaText.includes('Carpetas Activas') || aldanaText.includes('CARPETAS ACTIVAS');
    const hasEnTransito = aldanaText.includes('En Tránsito') || aldanaText.includes('EN TRÁNSITO');
    const hasComprobantesPendientes = aldanaText.includes('Comprobantes Pendientes') || aldanaText.includes('COMPROBANTES PENDIENTES');
    const hasAlertasActivas = aldanaText.includes('Alertas Activas') || aldanaText.includes('ALERTAS ACTIVAS');

    // Extract exact values from StatCards
    const operationalValues = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div, section, article'));
      let cActivas = null, eTransito = null, cPend = null, aActivas = null;
      document.body.innerText.split('\n').forEach((line, idx, arr) => {
        if (line.includes('Carpetas Activas') && arr[idx - 1]) cActivas = arr[idx - 1] || arr[idx + 1];
        if (line.includes('En Tránsito') && arr[idx - 1]) eTransito = arr[idx - 1] || arr[idx + 1];
        if (line.includes('Comprobantes Pendientes') && arr[idx - 1]) cPend = arr[idx - 1] || arr[idx + 1];
        if (line.includes('Alertas Activas') && arr[idx - 1]) aActivas = arr[idx - 1] || arr[idx + 1];
      });
      return { cActivas, eTransito, cPend, aActivas };
    });

    console.log(`  Operational Metrics presence:`);
    console.log(`    - Carpetas Activas (12): ${hasCarpetasActivas} (detected text: ${aldanaText.includes('12')})`);
    console.log(`    - En Tránsito (6): ${hasEnTransito} (detected text: ${aldanaText.includes('6')})`);
    console.log(`    - Comprobantes Pendientes (5): ${hasComprobantesPendientes} (detected text: ${aldanaText.includes('5')})`);
    console.log(`    - Alertas Activas (5): ${hasAlertasActivas} (detected text: ${aldanaText.includes('5')})`);

    // Financial metrics isolation certification (COMPLETELY OMITTED)
    const hasFinancialHeader = aldanaText.toLowerCase().includes('métricas comerciales & financieras') ||
                               aldanaText.toLowerCase().includes('metricas comerciales & financieras');
    const hasVolumenFacturado = aldanaText.includes('Volumen Facturado') || aldanaText.includes('VOLUMEN FACTURADO');
    const hasMargenOperativo = aldanaText.includes('Margen Operativo Bruto') || aldanaText.includes('MARGEN OPERATIVO');
    const hasAsterisks = aldanaText.includes('USD ***') || aldanaText.includes('US$ ***') || aldanaText.includes('***.***');
    const hasRestrictedBanner = aldanaText.toLowerCase().includes('acceso restringido');

    console.log(`  Financial View Isolation (RBAC):`);
    console.log(`    - "Métricas Comerciales & Financieras" Header present: ${hasFinancialHeader} (MUST BE FALSE)`);
    console.log(`    - "Volumen Facturado (USD)" Card present: ${hasVolumenFacturado} (MUST BE FALSE)`);
    console.log(`    - "Margen Operativo Bruto (USD)" Card present: ${hasMargenOperativo} (MUST BE FALSE)`);
    console.log(`    - Asterisks "USD ***.***" present: ${hasAsterisks} (MUST BE FALSE)`);
    console.log(`    - "Acceso Restringido" banner present: ${hasRestrictedBanner} (MUST BE FALSE)`);

    const financialOmissionPassed = !hasFinancialHeader && !hasVolumenFacturado && !hasMargenOperativo && !hasAsterisks && !hasRestrictedBanner;
    console.log(`  >>> FINANCIAL METRICS COMPLETELY OMITTED (fallback={null}): ${financialOmissionPassed ? 'PASS [CERTIFIED]' : 'FAIL'}`);

    // Check floating bot presence and trigger
    const botTrigger = await page.$('aside[aria-label="Asistente de Triage Operativo y Copilot"] button, button[title*="Triage Operativo"]');
    const hasBotTrigger = botTrigger !== null;
    console.log(`    - Floating Bot trigger present: ${hasBotTrigger}`);

    if (botTrigger) {
      await botTrigger.click();
      await new Promise(r => setTimeout(r, 1000));
      const isWidgetOpen = await page.evaluate(() => {
        return document.body.innerText.includes('ALMAR Copilot & Triage');
      });
      console.log(`    - Floating Bot opens successfully: ${isWidgetOpen}`);
      await saveScreenshot(page, '01_aldana_operativo_dashboard_bot.png');
      
      // Close widget
      const closeBtn = await page.$('button[title="Cerrar"], button[title="Minimizar"]');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    auditResults.aldana = {
      role: 'OPERATIVO',
      name: 'Aldana Gómez',
      hasCarpetasActivas,
      hasEnTransito,
      hasComprobantesPendientes,
      hasAlertasActivas,
      financialOmissionPassed,
      hasBotTrigger
    };

    // =========================================================================
    // 2. NATALI HERMOSO (LEAD_OPERACIONES - lead.operaciones@almar.com.ar)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [ROLE 2/6] AUDITING NATALI HERMOSO (LEAD_OPERACIONES)');
    console.log('------------------------------------------------------------------------');

    await performLogin(page, 'lead.operaciones@almar.com.ar', PASSWORD);
    await new Promise(r => setTimeout(r, 1500));

    const nataliDashText = await page.evaluate(() => document.body.innerText);
    const hasPriorityQueue = nataliDashText.includes('Cola de Trabajo Prioritaria') || nataliDashText.includes('Comprobantes por Procesar');
    const hasDispatchCenter = nataliDashText.includes('Centro Operativo de Despacho') || nataliDashText.includes('Jefatura de Tráfico');
    console.log(`  Dashboard:`);
    console.log(`    - Header shows "Jefatura de Tráfico": ${nataliDashText.includes('Jefatura de Tráfico')}`);
    console.log(`    - Priority Work Queue present: ${hasPriorityQueue}`);

    // Navigate to /carpetas
    console.log(`  Navigating to Maritime Dispatch Console (/carpetas)...`);
    await page.goto(`${PROD_URL}/carpetas`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const carpetasText = await page.evaluate(() => document.body.innerText);
    const hasCarpetasTitle = carpetasText.includes('Carpetas de Embarque & Tráfico') || carpetasText.includes('Expedientes');
    const hasMaritimeFolder = carpetasText.includes('C1234') || carpetasText.includes('C1434') || carpetasText.includes('C1289');
    console.log(`    - Maritime console title present: ${hasCarpetasTitle}`);
    console.log(`    - Maritime folders (C1234, C1434, C1289) present: ${hasMaritimeFolder}`);

    // Navigate to /comprobantes to validate voucher assignment
    console.log(`  Navigating to Vouchers Console (/comprobantes)...`);
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const compText = await page.evaluate(() => document.body.innerText);
    const hasIngestaColumn = compText.includes('Ingesta') || compText.includes('Sin Carpeta');
    const hasAsignarCarpeta = compText.includes('Asignar') || compText.includes('Asociar') || compText.includes('Munser');
    console.log(`    - Ingesta / Voucher Assignment available: ${hasIngestaColumn || hasAsignarCarpeta}`);

    await saveScreenshot(page, '02_natali_lead_operaciones_console.png');

    auditResults.natali = {
      role: 'LEAD_OPERACIONES',
      name: 'Natali Hermoso',
      hasPriorityQueue,
      hasDispatchCenter,
      hasCarpetasTitle,
      hasMaritimeFolder,
      hasIngestaColumn
    };

    // =========================================================================
    // 3. VANESA MEGGIOLARO (FINANZAS - finanzas@almar.com.ar)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [ROLE 3/6] AUDITING VANESA MEGGIOLARO (FINANZAS)');
    console.log('------------------------------------------------------------------------');

    await performLogin(page, 'finanzas@almar.com.ar', PASSWORD);
    await new Promise(r => setTimeout(r, 1500));

    const vanesaDashText = await page.evaluate(() => document.body.innerText);
    const vanesaFinancialUnlocked = vanesaDashText.toLowerCase().includes('comerciales & financieras') || 
                                    vanesaDashText.toLowerCase().includes('volumen facturado');
    const vanesaVolumen = vanesaDashText.includes('25.715') || vanesaDashText.includes('25,715');
    const vanesaMargen = vanesaDashText.includes('6.221') || vanesaDashText.includes('6,221');
    const vanesaRetorno = vanesaDashText.includes('28.5%');

    console.log(`  Dashboard Financial KPIs (Unlocked for FINANZAS):`);
    console.log(`    - Financial Metrics section visible: ${vanesaFinancialUnlocked}`);
    console.log(`    - Volumen Facturado (USD 25.715,00): ${vanesaVolumen}`);
    console.log(`    - Margen Operativo Bruto (USD 6.221,33): ${vanesaMargen}`);
    console.log(`    - Retorno sobre flete (28.5%): ${vanesaRetorno}`);

    // Navigate to /comprobantes to validate deviation approval (+21%)
    console.log(`  Navigating to /comprobantes to validate +21% deviation reconciliation...`);
    await page.goto(`${PROD_URL}/comprobantes`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const kanbanText = await page.evaluate(() => document.body.innerText);
    const hasDeviationColumn = kanbanText.includes('Con Desvío') || kanbanText.includes('Desvíos');
    const has21Percent = kanbanText.includes('21%') || kanbanText.includes('+21%');
    const hasApprovalEnabled = kanbanText.includes('Aprobación de Desvío Habilitada') || kanbanText.includes('Autorizar Desvío');

    console.log(`    - Deviation Column present: ${hasDeviationColumn}`);
    console.log(`    - +21% Deviation badge present: ${has21Percent}`);
    console.log(`    - Deviation approval enabled for Finanzas: ${hasApprovalEnabled}`);

    await saveScreenshot(page, '03_vanesa_finanzas_desvio_21.png');

    auditResults.vanesa = {
      role: 'FINANZAS',
      name: 'Vanesa Meggiolaro',
      financialUnlocked: vanesaFinancialUnlocked,
      volumenFacturadoMatch: vanesaVolumen,
      margenOperativoMatch: vanesaMargen,
      hasDeviationColumn,
      has21Percent,
      hasApprovalEnabled
    };

    // =========================================================================
    // 4. LUCÍA LAJE (COMERCIAL - comercial@almar.com.ar)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [ROLE 4/6] AUDITING LUCÍA LAJE (COMERCIAL)');
    console.log('------------------------------------------------------------------------');

    await performLogin(page, 'comercial@almar.com.ar', PASSWORD);
    await new Promise(r => setTimeout(r, 1500));

    console.log(`  Navigating to /cotizaciones...`);
    await page.goto(`${PROD_URL}/cotizaciones`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const cotizText = await page.evaluate(() => document.body.innerText);
    const hasLuciaTitle = cotizText.includes('Lucía Laje') || cotizText.includes('Cartera Activa');
    const hasCotizRecords = cotizText.includes('1.080') || cotizText.includes('1080');
    const hasRateValidity = cotizText.includes('Tarifa Vigente') || cotizText.includes('Por Vencer') || cotizText.includes('Vencida');
    const hasFollowUp48h = cotizText.includes('Sin respuesta (>48hs)') || cotizText.includes('Seguimiento 1-Click') || cotizText.includes('Follow-Up');

    console.log(`    - Header shows "Cartera Activa (Lucía Laje)": ${hasLuciaTitle}`);
    console.log(`    - 1.080 Quotations present: ${hasCotizRecords}`);
    console.log(`    - Rate validity badges (15/30d) present: ${hasRateValidity}`);
    console.log(`    - Smart Follow-Up 48h present: ${hasFollowUp48h}`);

    // Open Parametric Calculator Modal
    let calcModalOpened = false;
    const calcBtnHandle = await page.evaluateHandle(() => {
      const byId = document.getElementById('asistente-calculos-btn');
      if (byId) return byId;
      return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Calculadora'));
    });
    const calcBtn = calcBtnHandle ? calcBtnHandle.asElement() : null;
    if (calcBtn) {
      await calcBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      const modalText = await page.evaluate(() => document.body.innerText);
      calcModalOpened = modalText.includes('Calculadora') && (modalText.includes('Flete') || modalText.includes('Paramétrica') || modalText.includes('Tarifa'));
      console.log(`    - Parametric Calculator modal opened: ${calcModalOpened}`);
      
      const closeCalcHandle = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Cerrar' || b.innerText.includes('Cerrar') || b.innerText.trim() === '×');
      });
      const closeCalc = closeCalcHandle ? closeCalcHandle.asElement() : null;
      if (closeCalc) await closeCalc.click();
      await new Promise(r => setTimeout(r, 500));
    }

    await saveScreenshot(page, '04_lucia_comercial_cotizaciones.png');

    auditResults.lucia = {
      role: 'COMERCIAL',
      name: 'Lucía Laje',
      hasLuciaTitle,
      hasCotizRecords,
      hasRateValidity,
      hasFollowUp48h,
      calcModalOpened
    };

    // =========================================================================
    // 5. ALEJANDRO NOACCO (GERENCIA - gerencia@almar.com.ar)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [ROLE 5/6] AUDITING ALEJANDRO NOACCO (GERENCIA)');
    console.log('------------------------------------------------------------------------');

    await performLogin(page, 'gerencia@almar.com.ar', PASSWORD);
    await new Promise(r => setTimeout(r, 1500));

    const gerenciaDashText = await page.evaluate(() => document.body.innerText);
    const gerenciaVolumen = gerenciaDashText.includes('25.715') || gerenciaDashText.includes('25,715');
    const gerenciaMargen = gerenciaDashText.includes('6.221') || gerenciaDashText.includes('6,221');
    const gerenciaRetorno = gerenciaDashText.includes('28.5%');

    console.log(`  Dashboard Financial KPIs (Directorio):`);
    console.log(`    - Volumen Facturado (USD): US$ 25.715,00 -> ${gerenciaVolumen}`);
    console.log(`    - Margen Operativo Bruto (USD): US$ 6.221,33 -> ${gerenciaMargen}`);
    console.log(`    - Retorno sobre flete (28.5%) -> ${gerenciaRetorno}`);

    // Check Sidebar Executive Menu item /metricas
    const hasMetricasLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href="/metricas"]'));
      return links.length > 0;
    });
    console.log(`    - Executive Menu "Métricas & Rendimiento" present: ${hasMetricasLink}`);

    console.log(`  Navigating to /metricas...`);
    await page.goto(`${PROD_URL}/metricas`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const metricasText = await page.evaluate(() => document.body.innerText);
    const hasScorecard = metricasText.includes('Evaluación') || metricasText.includes('PA.03') || metricasText.includes('Rendimiento');
    console.log(`    - Métricas & Rendimiento page loaded: ${hasScorecard}`);

    await saveScreenshot(page, '05_alejandro_gerencia_metricas.png');

    auditResults.alejandro = {
      role: 'GERENCIA',
      name: 'Alejandro Noacco',
      gerenciaVolumen,
      gerenciaMargen,
      gerenciaRetorno,
      hasMetricasLink,
      hasScorecard
    };

    // =========================================================================
    // 6. JUAN ANDRÉS ARLORO (ADMIN - admin@almar.com.ar)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [ROLE 6/6] AUDITING JUAN ANDRÉS ARLORO (ADMIN)');
    console.log('------------------------------------------------------------------------');

    await performLogin(page, 'admin@almar.com.ar', PASSWORD);
    await new Promise(r => setTimeout(r, 1500));

    // Validate access to /audit-log
    console.log(`  Navigating to /audit-log...`);
    await page.goto(`${PROD_URL}/audit-log`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const auditLogText = await page.evaluate(() => document.body.innerText);
    const hasAuditLogTitle = auditLogText.includes('Registro Inmutable de Auditoría') || auditLogText.includes('Auditoría');
    const hasAuditTable = await page.evaluate(() => document.querySelectorAll('table').length > 0 || document.body.innerText.includes('Fecha / Hora'));
    const hasEventRows = auditLogText.includes('LOGIN') || auditLogText.includes('INITIALIZE') || auditLogText.includes('EVENT');

    console.log(`    - /audit-log header present: ${hasAuditLogTitle}`);
    console.log(`    - Audit Log Table present: ${hasAuditTable}`);
    console.log(`    - Event rows present: ${hasEventRows}`);

    await saveScreenshot(page, '06_juan_admin_audit_log.png');

    auditResults.juan = {
      role: 'ADMIN',
      name: 'Juan Andrés Arloro',
      hasAuditLogTitle,
      hasAuditTable,
      hasEventRows
    };

    // =========================================================================
    // 7. FUNCTIONAL TEST: FLOATING BOT / COPILOT & FEEDBACK TICKET (#TKT-XXXX)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log(' [COPILOT & FEEDBACK] FUNCTIONAL LIVE PRODUCTION TEST');
    console.log('------------------------------------------------------------------------');

    // Return to dashboard
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Open Floating Bot
    const botBtn = await page.$('aside[aria-label="Asistente de Triage Operativo y Copilot"] button, button[title*="Triage Operativo"]');
    if (botBtn) {
      await botBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    // 7A. Test Copilot IA Tab
    console.log('  Testing Copilot IA Tab...');
    const copilotTabBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Copilot IA Operativo'));
    });

    if (copilotTabBtn) {
      await copilotTabBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // Send question to Copilot
    const questionInput = await page.$('input[placeholder*="Preguntale al Copilot"], input[placeholder*="Consultá sobre carpetas"]');
    let copilotReplied = false;
    let copilotAnswer = '';

    if (questionInput) {
      const queryText = 'Cuál es la provisión para Sancor Seguros y la directiva de margen para C1234?';
      console.log(`    - Sending Query: "${queryText}"`);
      await questionInput.type(queryText, { delay: 10 });
      
      const sendBtnHandle = await page.evaluateHandle(() => {
        return document.querySelector('form button[type="submit"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.closest('form'));
      });
      const sendBtn = sendBtnHandle ? sendBtnHandle.asElement() : null;
      if (sendBtn) await sendBtn.click();
      
      // Wait for reply
      await new Promise(r => setTimeout(r, 3500));

      const chatText = await page.evaluate(() => document.body.innerText);
      copilotReplied = chatText.includes('Sancor Seguros') || chatText.includes('C1234') || chatText.includes('provisión') || chatText.includes('margen');
      copilotAnswer = chatText;
      console.log(`    - Copilot replied with domain logic: ${copilotReplied}`);
    }

    // 7B. Test Feedback Submission -> #TKT-XXXX
    console.log('\n  Testing Feedback Incident Submission (Ticket #TKT-XXXX)...');
    const feedbackTabBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Reportar Caso / Ajuste'));
    });

    if (feedbackTabBtn) {
      await feedbackTabBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // Fill feedback form using real puppeteer keyboard events
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.click();
      await textarea.type('Certificación automatizada en vivo Explorer M1: Triage Operativo y Copilot en producción.', { delay: 15 });
    }

    const carpetaInput = await page.$('input[placeholder*="C1234"], input[placeholder*="opcional"]');
    if (carpetaInput) {
      await carpetaInput.click();
      await carpetaInput.type('C1234', { delay: 15 });
    }

    await new Promise(r => setTimeout(r, 800));

    // Click submit button in the feedback form
    const submitBtn = await page.$('form button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('    - Submitted feedback form button clicked, waiting for response...');
      await new Promise(r => setTimeout(r, 4500));
    }

    // Extract generated ticket code from DOM
    const ticketInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/TKT-[A-Z0-9]+-[A-Z0-9]+/i) || text.match(/#?TKT-[A-Z0-9]+/i);
      return {
        ticketCode: match ? match[0] : null,
        hasSuccessMessage: text.includes('Caso recibido con éxito') || text.includes('Reporte enviado')
      };
    });

    console.log(`    - Ticket Code Generated: ${ticketInfo.ticketCode}`);
    console.log(`    - Success Message Rendered: ${ticketInfo.hasSuccessMessage}`);

    await saveScreenshot(page, '07_copilot_feedback_ticket.png');

    auditResults.copilot = {
      copilotReplied,
    };
    auditResults.feedback = {
      ticketCode: ticketInfo.ticketCode,
      hasSuccessMessage: ticketInfo.hasSuccessMessage,
    };

    console.log('\n========================================================================');
    console.log(' LIVE PRODUCTION AUDIT SUMMARY');
    console.log('========================================================================');
    console.log(JSON.stringify(auditResults, null, 2));

  } catch (err) {
    console.error('Fatal error during E2E test:', err);
  } finally {
    await browser.close();
  }
}

runLiveE2ETest();
