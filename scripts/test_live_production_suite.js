const puppeteer = require('puppeteer');

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'https://bot-relevamiento.vercel.app';

async function runLiveProductionTests() {
  console.log('================================================================');
  console.log('🚀 SUITE DE VERIFICACIÓN EN PRODUCCIÓN: ALMAR ROSARIO (VERCEL)');
  console.log(`🌐 URL Destino: ${BASE_URL}`);
  console.log('================================================================\n');

  let browser;
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // 1. LOGIN & AUTENTICACIÓN COMO ALDANA GÓMEZ (OPERATIVO)
    // -------------------------------------------------------------
    console.log('📋 ETAPA 1: Login corporativo y verificación de sesión');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    const title = await page.title();
    assert(title.includes('ALMAR Rosario'), `Título correcto de la página: "${title}"`);

    await page.type('input[type="email"]', 'operativo@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    const currentUrl = page.url();
    assert(!currentUrl.includes('/login'), `Redirección post-login exitosa a: ${currentUrl}`);

    // -------------------------------------------------------------
    // 2. VERIFICACIÓN DE ALDANA GÓMEZ (OPERATIVO): OCULTAMIENTO TOTAL DE MÉTRICAS FINANCIERAS
    // -------------------------------------------------------------
    console.log('\n📋 ETAPA 2: Aislamiento estricto de confidencialidad para Aldana Gómez (OPERATIVO)');
    const bodyTextOperativo = await page.evaluate(() => document.body.innerText);

    assert(
      !bodyTextOperativo.includes('Métricas Financieras'),
      'La sección "Métricas Financieras" NO figura en pantalla para Aldana Gómez'
    );
    assert(
      !bodyTextOperativo.includes('USD ***.***'),
      'Las tarjetas con asteriscos "USD ***.***" NO figuran en pantalla (eliminadas por completo)'
    );
    assert(
      !bodyTextOperativo.includes('Acceso Restringido (Confidencialidad Comercial)'),
      'No hay cartel de "Acceso Restringido" que genere ruido en el operador'
    );
    assert(
      bodyTextOperativo.includes('Carpetas Activas') && bodyTextOperativo.includes('En Tránsito'),
      'Las métricas operativas de trabajo diario ("Carpetas Activas", "En Tránsito") SÍ están presentes'
    );

    // -------------------------------------------------------------
    // 3. VERIFICACIÓN DEL BOT / COPILOT DE INCIDENCIAS (FeedbackWidget)
    // -------------------------------------------------------------
    console.log('\n📋 ETAPA 3: Bot / Copilot flotante de incidencias y triage operativo');
    const botAside = await page.$('aside[aria-label="Asistente de Triage Operativo y Copilot"]');
    assert(botAside !== null, 'El componente flotante del Bot existe en la esquina inferior derecha');

    const botButton = await page.$('aside[aria-label="Asistente de Triage Operativo y Copilot"] button');
    assert(botButton !== null, 'El botón disparador del Bot ("Reportar Ajuste & Copilot") está listo para clic');

    if (botButton) {
      await botButton.click();
      await page.waitForTimeout(600);

      const botModalTitle = await page.evaluate(() => {
        const h3 = document.querySelector('aside h3');
        return h3 ? h3.innerText : '';
      });
      assert(
        botModalTitle.includes('ALMAR Copilot & Triage'),
        `Ventana del Bot abierta con título: "${botModalTitle}"`
      );

      // Probar Copilot IA Operativo
      const copilotTab = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('aside button'));
        const btn = buttons.find((b) => b.innerText.includes('Copilot IA'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      assert(copilotTab, 'Pestaña "Copilot IA Operativo" accesible');
      await page.waitForTimeout(500);

      const welcomeMsg = await page.evaluate(() => {
        const text = document.querySelector('aside')?.innerText || '';
        return text.includes('Soy el Copilot de Procesos y Operaciones');
      });
      assert(welcomeMsg, 'Mensaje de bienvenida del Copilot IA renderizado con contexto comex');

      // Probar envío de consulta al Copilot
      const chipBtn = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('aside button'));
        const chip = buttons.find((b) => b.innerText.includes('C1234'));
        if (chip) {
          chip.click();
          return true;
        }
        return false;
      });
      assert(chipBtn, 'Chip de consulta rápida "¿Por qué se bloqueó C1234?" accionado');
      await page.waitForTimeout(1500);

      // Cerrar modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector('aside button[title="Cerrar"]');
        if (closeBtn) closeBtn.click();
      });
    }

    // -------------------------------------------------------------
    // 4. CAMBIO DE ROL A DIRECTORIO: ALEJANDRO NOACCO (GERENCIA)
    // -------------------------------------------------------------
    console.log('\n📋 ETAPA 4: Autorización y visualización para Alejandro Noacco (GERENCIA)');
    // Cambiar a GERENCIA vía API de impersonación
    await page.evaluate(async () => {
      await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'gerencia@almar.com.ar', role: 'GERENCIA' }),
      });
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    const bodyTextGerencia = await page.evaluate(() => document.body.innerText);

    assert(
      bodyTextGerencia.includes('Métricas Comerciales & Financieras'),
      'La sección "Métricas Comerciales & Financieras" SÍ es visible para Alejandro Noacco (GERENCIA)'
    );
    assert(
      bodyTextGerencia.includes('Volumen Facturado (USD)') && bodyTextGerencia.includes('Margen Operativo Bruto (USD)'),
      'Las métricas cuantitativas reales (Volumen y Margen) se muestran sin asteriscos'
    );

    // -------------------------------------------------------------
    // 5. CAMBIO DE ROL A COMERCIAL: LUCÍA LAJE Y MÓDULO DE COTIZACIONES
    // -------------------------------------------------------------
    console.log('\n📋 ETAPA 5: Módulo Comercial de Lucía Laje (Cotizaciones, Calculadora, Smart Follow-up)');
    await page.evaluate(async () => {
      await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'comercial@almar.com.ar', role: 'COMERCIAL' }),
      });
    });

    await page.goto(`${BASE_URL}/cotizaciones`, { waitUntil: 'networkidle2' });
    const cotizacionesText = await page.evaluate(() => document.body.innerText);

    assert(
      cotizacionesText.includes('Cotizaciones & Tarifario'),
      'Página /cotizaciones accesible para Lucía Laje'
    );
    assert(
      cotizacionesText.includes('Smart Follow-up') || cotizacionesText.includes('Pendientes de Cierre'),
      'Panel de Smart Follow-up / Seguimiento activo'
    );
    assert(
      cotizacionesText.includes('Simular Cotización') || cotizacionesText.includes('Calculadora'),
      'Botón de Calculadora Paramétrica multimodal disponible'
    );

    // -------------------------------------------------------------
    // 6. INTEGRIDAD DE DATOS Y APIS EN PRODUCCIÓN
    // -------------------------------------------------------------
    console.log('\n📋 ETAPA 6: Verificación de integridad de datos en APIs de producción');
    
    // Carpetas
    const carpetasRes = await page.evaluate(async () => {
      const res = await fetch('/api/carpetas');
      return { ok: res.ok, status: res.status, data: await res.json() };
    });
    assert(carpetasRes.ok, `/api/carpetas responde HTTP ${carpetasRes.status}`);
    const carpetasCount = Array.isArray(carpetasRes.data?.data) ? carpetasRes.data.data.length : 0;
    assert(carpetasCount >= 4, `Carpetas operativas cargadas en base: ${carpetasCount} registros`);

    // Comprobantes
    const comprobantesRes = await page.evaluate(async () => {
      const res = await fetch('/api/comprobantes');
      return { ok: res.ok, status: res.status, data: await res.json() };
    });
    assert(comprobantesRes.ok, `/api/comprobantes responde HTTP ${comprobantesRes.status}`);

    // Feedback Ticket Submission (Prueba real en vivo)
    const feedbackPost = await page.evaluate(async () => {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'EDGE_CASE',
          severidad: 'BAJA',
          carpetaId: 'C1234',
          mensaje: 'Verificación automática E2E de integridad del sistema post-deploy',
          pathname: '/dashboard',
          userName: 'Auditor QA',
          userRole: 'ADMIN',
        }),
      });
      return { ok: res.ok, status: res.status, data: await res.json() };
    });
    assert(feedbackPost.ok, `/api/feedback responde HTTP ${feedbackPost.status} al registrar ticket`);
    assert(
      feedbackPost.data?.ticket?.codigo?.startsWith('TKT-'),
      `Código de ticket generado en producción: "${feedbackPost.data?.ticket?.codigo}"`
    );

    console.log('\n================================================================');
    console.log(`📊 RESULTADO FINAL: ${passed} PRUEBAS APROBADAS | ${failed} FALLADAS`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error fatal durante la suite de pruebas:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runLiveProductionTests();
