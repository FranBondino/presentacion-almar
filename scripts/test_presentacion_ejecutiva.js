/**
 * Test Suite Automatizado para `presentacion-ejecutiva-almar.html` (Master 18 Diapositivas)
 * 
 * Valida:
 * 1. Integridad estructural, diseño corporativo de Clave Consultora y componentes CSS.
 * 2. Las 18 diapositivas completas con sus tokens de casos reales: C367, C620, Sancor, C1234, Macro,
 *    módulo comercial con vigencias y perfiles dinámicos, objeciones directivas y steppers de trazabilidad.
 * 3. Renderizado físico en Puppeteer: verificación estricta de que TODAS las imágenes están cargadas
 *    en memoria (`complete === true` y `naturalWidth > 0`).
 * 4. Control de navegación interactiva por teclado (ArrowRight, ArrowLeft, Space, Home, End, KeyO, KeyM, Escape)
 *    con pruebas de límites en los extremos (slides 1 y 18).
 * 5. Drawer de Visión General (Overview Modal) con exactamente 18 tarjetas interactivas vinculadas.
 * 6. Escalabilidad en resolución estándar de laptop (1366x768).
 * 7. Generación de capturas de verificación visual para las 18 diapositivas.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const TARGET_HTML = path.join(__dirname, '..', 'presentacion-ejecutiva-almar.html');

async function runTestSuite() {
  console.log('================================================================');
  console.log('INICIANDO TEST SUITE: presentacion-ejecutiva-almar.html (18 SLIDES)');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failedTests++;
    }
  }

  // ==========================================================================
  // FASE 1: INTEGRIDAD ESTRUCTURAL Y TOKENS DE DISEÑO EDITORIAL
  // ==========================================================================
  console.log('--- Fase 1: Integridad Estructural y Tokens de Diseño Clave Consultora ---');
  assert(fs.existsSync(TARGET_HTML), 'El archivo presentacion-ejecutiva-almar.html existe en la raíz.');
  const htmlContent = fs.readFileSync(TARGET_HTML, 'utf-8');
  assert(htmlContent.length > 50000, `Tamaño del archivo adecuado (${htmlContent.length} bytes > 50 KB).`);

  // Tokens de Color Institucionales de Clave Consultora
  assert(htmlContent.includes('--clave-green:          #1e3d2f'), 'Token CSS institucional --clave-green (#1e3d2f) definido.');
  assert(htmlContent.includes('--clave-green-dark:     #13271e'), 'Token CSS institucional --clave-green-dark (#13271e) definido.');
  assert(htmlContent.includes('--clave-gold:           #c29320'), 'Token CSS institucional --clave-gold (#c29320) definido.');
  assert(htmlContent.includes('--clave-gold-light:     #fefcf5'), 'Token CSS institucional --clave-gold-light (#fefcf5) definido.');
  assert(htmlContent.includes('--clave-navy:           #081433'), 'Token CSS institucional --clave-navy (#081433) definido.');

  // Tipografías Corporativas
  assert(htmlContent.includes('Montserrat'), 'Tipografía Montserrat para títulos y badges configurada.');
  assert(htmlContent.includes('Open Sans'), 'Tipografía Open Sans para cuerpo y tablas configurada.');
  assert(htmlContent.includes('Fira Code'), 'Tipografía monoespaciada Fira Code configurada para tokens técnicos.');
  assert(htmlContent.includes('logo_clave.png'), 'Logotipo corporativo de Clave Consultora integrado.');

  // ==========================================================================
  // FASE 2: VERIFICACIÓN DE ESTRUCTURA Y DIAPOSITIVAS (18 SLIDES)
  // ==========================================================================
  console.log('\n--- Fase 2: Estructura DOM de las 18 Diapositivas y 18 Tarjetas Overview ---');
  const TOTAL_SLIDES = 18;
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    assert(htmlContent.includes(`data-slide="${i}"`), `Diapositiva ${i} definida en el DOM con data-slide="${i}".`);
    assert(htmlContent.includes(`data-target="${i}"`), `Tarjeta Overview ${i} definida en el DOM con data-target="${i}".`);
  }
  assert(htmlContent.includes('const totalSlides = 18;'), 'Constante totalSlides = 18 configurada en script de navegación.');

  // Componentes CSS Clave
  assert(htmlContent.includes('.traceability-stepper'), 'Componente CSS .traceability-stepper definido.');
  assert(htmlContent.includes('.step-item'), 'Componente CSS .step-item definido.');
  assert(htmlContent.includes('.step-circle'), 'Componente CSS .step-circle definido.');
  assert(htmlContent.includes('.step-label'), 'Componente CSS .step-label definido.');
  assert(htmlContent.includes('.objection-card'), 'Componente CSS .objection-card definido.');
  assert(htmlContent.includes('.browser-mockup'), 'Componente CSS .browser-mockup definido.');

  // ==========================================================================
  // FASE 3: VERIFICACIÓN DE CONTENIDO, CASOS REALES Y SOLUCIONES COMERCIALES
  // ==========================================================================
  console.log('\n--- Fase 3: Contenidos de Casos Reales, Solución Comercial y Arquitectura ---');

  // Slide 1: Portada Ejecutiva
  assert(htmlContent.includes('AUTOMATIZACIÓN INTELIGENTE DE FACTURACIÓN'), 'S1: Portada oficial de Solución Tecnológica.');
  assert(htmlContent.includes('Directorio Ejecutivo') && htmlContent.includes('ALMAR Rosario'), 'S1: Destinatarios directivos especificados.');

  // Slide 2: Diagnóstico Operativo & Comercial
  assert(htmlContent.includes('DIAGNÓSTICO OPERATIVO &amp; COMERCIAL: FACTURACIÓN Y PROCESOS') && htmlContent.includes('FRAGMENTADO') && htmlContent.includes('MANUAL') && htmlContent.includes('DISCONTINUO'), 'S2: Diagnóstico operativo y comercial cualitativo sin cifras.');
  assert(htmlContent.includes('Maersk') && htmlContent.includes('MSC'), 'S2: Mención a las principales navieras.');

  // Slide 3: Centro Operativo
  assert(htmlContent.includes('PORTAL CENTRALIZADO DE FACTURACIÓN ASISTIDO POR IA'), 'S3: Visión general del portal de facturación.');
  assert(htmlContent.includes('screenshots/dashboard_corporate_light.png'), 'S3: Mockup de Centro Operativo referenciado.');

  // Slide 4: Arquitectura del Pipeline y Stepper de Trazabilidad E2E
  assert(htmlContent.includes('1. ORIGEN') && htmlContent.includes('2. EXTRACCIÓN IA') && htmlContent.includes('3. REGLAS') && htmlContent.includes('4. KIPINTOCH') && htmlContent.includes('5. BANCO MACRO'), 'S4: Pipeline de 5 etapas E2E (Origen -> Extracción IA -> Reglas -> Kipintoch -> Banco Macro).');

  // Slide 5: Tablero Comercial y Control de Vigencia de Tarifas
  assert(htmlContent.includes('TABLERO COMERCIAL Y CONTROL DE VIGENCIA DE TARIFAS'), 'S5: Título de Tablero Comercial y Vigencias.');
  assert((htmlContent.includes('15/30 días') || htmlContent.includes('15 / 30 DÍAS')) && htmlContent.includes('Vigente') && htmlContent.includes('Por Vencer') && htmlContent.includes('Vencida'), 'S5: Semáforo de vigencias (15/30 días) documentado.');
  assert(htmlContent.includes('CONTROL DE COSTOS Y VIGENCIAS'), 'S5: Badge institucional de control de costos y vigencias.');
  assert(htmlContent.includes('screenshots/cotizaciones_vigencia_tarifas_light.png'), 'S5: Mockup de tablero de vigencias referenciado.');

  // Slide 6: Calculadora Paramétrica y Perfiles Dinámicos de Margen
  assert(htmlContent.includes('CUENTA_ESTRATEGICA') && htmlContent.includes('ESTANDAR') && htmlContent.includes('SPOT_ALTO_RIESGO'), 'S6: Perfiles dinámicos de margen por cliente.');
  assert(htmlContent.includes('USD 200') && (htmlContent.includes('USD 3') || htmlContent.includes('USD 3.00')), 'S6: Alerta preventiva < USD 200 y bloqueo estricto < USD 3.00.');
  assert(htmlContent.includes('FLEXIBILIDAD Y AGILIDAD EN PRICING'), 'S6: Badge institucional de agilidad y flexibilidad comercial.');
  assert(htmlContent.includes('screenshots/modulo_comercial_calculadora_perfiles_light.png'), 'S6: Mockup de calculadora con perfiles referenciado.');

  // Slide 7: Registro de Feedback Cualitativo y Smart Follow-Up a 48 hs
  assert((htmlContent.includes('SMART FOLLOW-UP') || htmlContent.includes('Smart Follow-Up')) && (htmlContent.includes('48 HORAS') || htmlContent.includes('48 horas') || htmlContent.includes('48 hs') || htmlContent.includes('48hs')), 'S7: Smart Follow-Up a 48 hs documentado.');
  assert(htmlContent.includes('Competencia cotizó USD 150 menos'), 'S7: Registro cualitativo de feedback de pérdidas documentado.');
  assert(htmlContent.includes('screenshots/03_smart_follow_up_modal_desktop.png'), 'S7: Mockup de Smart Follow-Up referenciado.');

  // Slide 8: Tablero Kanban & Visor Side-by-Side
  assert(htmlContent.includes('TABLERO KANBAN') && (htmlContent.includes('SIDE-BY-SIDE') || htmlContent.includes('Side-by-Side')), 'S8: Tablero Kanban y visor dual Side-by-Side documentados.');
  assert(htmlContent.includes('screenshots/kanban_corporate_light.png') && htmlContent.includes('screenshots/modal_comprobante_detalle_light.png'), 'S8: Mockups de Kanban y Visor Detalle referenciados.');

  // Slide 9: Caso C367: Normalización Semántica BUFF
  assert(htmlContent.includes('C367') && htmlContent.includes('BUFF') && htmlContent.includes('BAF'), 'S9: Caso C367 y normalización BUFF/BAF documentada.');
  assert(/bunker/i.test(htmlContent), 'S9: Nomenclatura Bunker documentada.');
  assert(htmlContent.includes('Visor Dual'), 'S9: Visor Dual referenciado en caso C367.');
  assert(htmlContent.includes('screenshots/caso_c367_dual_buff_light.png'), 'S9: Mockup C367 BUFF referenciado.');

  // Slide 10: Caso C620: Módulo Multimoneda BNA Oficial para GBP
  assert(htmlContent.includes('C620') && htmlContent.includes('GBP') && htmlContent.includes('BNA'), 'S10: Caso C620 Libras GBP con tipo de cambio oficial BNA.');
  assert(htmlContent.includes('1.3628') && htmlContent.includes('USD 740'), 'S10: Liquidación exacta £543 @ 1.3628 = USD 740.00 documentada.');
  assert(htmlContent.includes('screenshots/caso_c620_multimoneda_bna_light.png'), 'S10: Mockup C620 Multimoneda referenciado.');

  // Slide 11: Caso Sancor Seguros: Provisión Diferida 150 Días
  assert(htmlContent.includes('Sancor Seguros') && htmlContent.includes('0,55%') && htmlContent.includes('FOB') && htmlContent.includes('150 días'), 'S11: Provisión diferida 0,55% FOB a 150 días.');
  assert(htmlContent.includes('Holdback') || htmlContent.includes('HOLDBACK') || htmlContent.includes('RETENIDA_COSTOS_PENDIENTES'), 'S11: Mecanismo de holdback sobre comisiones comerciales documentado.');
  assert(htmlContent.includes('screenshots/caso_sancor_seguros_provision_light.png'), 'S11: Mockup Sancor Seguros referenciado.');

  // Slide 12: Caso C1234: Alerta Preventiva y Autorización Biométrica WebAuthn
  assert(htmlContent.includes('C1234') && htmlContent.includes('WebAuthn') && htmlContent.includes('SHA-256'), 'S12: Autorización WebAuthn con hash SHA-256 para caso C1234.');
  assert(htmlContent.includes('Windows Hello') || htmlContent.includes('Touch ID'), 'S12: Biometría con Windows Hello / Touch ID documentada.');
  assert(htmlContent.includes('screenshots/caso_c1234_webauthn_sha256_light.png'), 'S12: Mockup C1234 WebAuthn referenciado.');

  // Slide 13: Caso Triangulación (Net Trade Miami) & Conciliación Banco Macro
  assert(htmlContent.includes('Net Trade') && htmlContent.includes('Banco Macro') && htmlContent.includes('Conciliación'), 'S13: Triangulación Net Trade Miami y conciliación Banco Macro.');
  assert(htmlContent.includes('EMITIDA_PENDIENTE_COBRO') && htmlContent.includes('COBRADA_CONCILIADA'), 'S13: Ciclo de vida bancario auditado.');
  assert(htmlContent.includes('screenshots/banco_macro_conciliacion_extracto_light.png'), 'S13: Mockup Banco Macro referenciado.');

  // Slide 14: Demostración en Vivo
  assert(htmlContent.includes('DEMOSTRACIÓN EN VIVO') || htmlContent.includes('Demostración en Vivo'), 'S14: Transición a demostración interactiva en vivo.');

  // Slide 15: Chatbot Copilot Conversacional & Widget Flotante (#TKT-XXX)
  assert(htmlContent.includes('#TKT-XXX') || htmlContent.includes('FeedbackWidget'), 'S15: Widget de triage operativo con tickets inmutables #TKT-XXX.');
  assert(htmlContent.includes('CHATBOT COPILOT') && (htmlContent.includes('Copilot IA') || htmlContent.includes('Copilot')), 'S15: Chatbot Copilot conversacional de IA documentado e ilustrado.');
  assert(htmlContent.includes('screenshots/triage_reporte_incidencia_light.png'), 'S15: Mockup Triage y Reporte de Incidencias referenciado.');

  // Slide 16: Matriz de Resolución de Desafíos Operativos y Estratégicos
  assert(htmlContent.includes('GESTIÓN COMERCIAL') && htmlContent.includes('CONTROL FINANCIERO') && htmlContent.includes('GOBERNANZA Y LEGAL'), 'S16: Matriz de resolución para Gestión Comercial, Control Financiero y Gobernanza/Legal.');

  // Slide 17: Arquitectura de Producción, Diagrama e Integración en Intranet Firebase
  assert(htmlContent.includes('arch-flow-diagram'), 'S17: Diagrama visual de arquitectura de producción implementado.');
  assert(htmlContent.includes('Firebase') && (htmlContent.includes('Single Sign-On') || htmlContent.includes('SSO')), 'S17: Especificación de integración y embebido en Intranet Firebase con SSO.');
  assert(htmlContent.includes('Zero Data Retention') || htmlContent.includes('ZDR'), 'S17: OpenAI con Zero Data Retention (§ 3.2).');
  assert(htmlContent.includes('store: false') || htmlContent.includes('store:false'), 'S17: Parámetro store: false para cero persistencia.');
  assert(htmlContent.includes('Vercel') && htmlContent.includes('Supabase'), 'S17: Infraestructura Vercel Serverless y Supabase Postgres.');

  // Slide 18: Hoja de Ruta de 4 Semanas
  assert(htmlContent.includes('4 Semanas') || htmlContent.includes('SEMANA 4'), 'S18: Cronograma de despliegue en 4 semanas.');

  // ==========================================================================
  // FASE 4: VERIFICACIÓN INTERACTIVA EN NAVEGADOR REAL (PUPPETEER)
  // ==========================================================================
  console.log('\n--- Fase 4: Pruebas de Interacción y Renderizado Físico (Puppeteer) ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const fileUrl = 'file:///' + TARGET_HTML.replace(/\\/g, '/');
    const response = await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    assert(response !== null, 'Página cargada exitosamente en Chromium sin errores de red.');

    // 4.1 Validación FÍSICA de Imágenes Renderizadas en el DOM
    console.log('\n--- 4.1: Validación de Carga Física de Imágenes en el DOM ---');
    const imageValidation = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || 'sin alt',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        isLoaded: img.complete && img.naturalWidth > 0
      }));
    });

    assert(imageValidation.length >= 14, `Total de etiquetas <img> detectadas en el DOM (${imageValidation.length} >= 14).`);
    for (const img of imageValidation) {
      assert(img.isLoaded, `Imagen renderizada físicamente: ${img.src} (${img.naturalWidth}x${img.naturalHeight}px) [${img.alt}]`);
    }

    // 4.2 Estado Inicial de Navegación
    console.log('\n--- 4.2: Estado Inicial y Navegación por Teclado ---');
    const initialSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(initialSlideNum === '1', 'Diapositiva inicial activa es la número 1.');

    const initialCounter = await page.$eval('#slideCounter', el => el.textContent.trim());
    assert(initialCounter === `01 / ${String(TOTAL_SLIDES).padStart(2, '0')}`, `Contador inicial marca correctamente "${initialCounter}".`);

    // Prueba de Límite Izquierdo (ArrowLeft en slide 1 no debe desbordar)
    await page.keyboard.press('ArrowLeft');
    await new Promise(r => setTimeout(r, 150));
    const boundLeftSlide = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(boundLeftSlide === '1', 'Límite izquierdo: Presionar ArrowLeft en Slide 1 mantiene activa la Slide 1.');

    // Navegación Siguiente (ArrowRight)
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 200));
    const nextSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(nextSlideNum === '2', 'Presionar ArrowRight avanza a la Diapositiva 2.');

    // Barra de Progreso Dinámica
    const progressWidth = await page.$eval('#progressBar', el => el.style.width);
    assert(progressWidth.includes('%'), `Barra de progreso dinámica actualizada a ${progressWidth}.`);

    // Navegación Anterior (ArrowLeft)
    await page.keyboard.press('ArrowLeft');
    await new Promise(r => setTimeout(r, 200));
    const backSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(backSlideNum === '1', 'Presionar ArrowLeft regresa a la Diapositiva 1.');

    // Atajo Barra Espaciadora
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 200));
    const spaceSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(spaceSlideNum === '2', 'Presionar Barra Espaciadora avanza a Diapositiva 2.');

    // Atajo End (Salto al final: Slide 18)
    await page.keyboard.press('End');
    await new Promise(r => setTimeout(r, 200));
    const endSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(endSlideNum === String(TOTAL_SLIDES), `Presionar tecla End salta a la Diapositiva ${TOTAL_SLIDES} (Hoja de Ruta y Decisión).`);

    // Prueba de Límite Derecho (ArrowRight en última slide no debe desbordar)
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 150));
    const boundRightSlide = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(boundRightSlide === String(TOTAL_SLIDES), `Límite derecho: Presionar ArrowRight en Slide ${TOTAL_SLIDES} mantiene activa la Slide ${TOTAL_SLIDES}.`);

    // Atajo Home (Regreso al inicio: Slide 1)
    await page.keyboard.press('Home');
    await new Promise(r => setTimeout(r, 200));
    const homeSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(homeSlideNum === '1', 'Presionar tecla Home regresa a la Diapositiva 1.');

    // 4.3 Pruebas de Drawer de Visión General (Overview Modal)
    console.log('\n--- 4.3: Pruebas del Modal de Visión General (Overview Modal) ---');
    // Apertura con tecla O
    await page.keyboard.press('KeyO');
    await new Promise(r => setTimeout(r, 250));
    let isModalOpen = await page.$eval('#overviewModal', el => el.classList.contains('open'));
    assert(isModalOpen === true, 'Presionar tecla O abre el Drawer de Visión General (Overview Modal).');

    // Cierre con Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    let isModalClosed = await page.$eval('#overviewModal', el => !el.classList.contains('open'));
    assert(isModalClosed === true, 'Presionar tecla Escape cierra el Overview Modal.');

    // Apertura alternativa con tecla M
    await page.keyboard.press('KeyM');
    await new Promise(r => setTimeout(r, 250));
    const isModalOpenM = await page.$eval('#overviewModal', el => el.classList.contains('open'));
    assert(isModalOpenM === true, 'Presionar tecla M abre el Overview Modal.');

    // Conteo de tarjetas en el Modal (debe ser exactamente 18)
    const overviewCardsCount = await page.$$eval('.overview-card', cards => cards.length);
    assert(overviewCardsCount === TOTAL_SLIDES, `El Overview Modal renderiza exactamente ${TOTAL_SLIDES} tarjetas de diapositivas (encontradas: ${overviewCardsCount}).`);

    // Salto interactivo a Diapositiva 6 (Calculadora con Perfiles)
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.overview-card');
      if (cards[5]) cards[5].click(); // Slide 6
    });
    await new Promise(r => setTimeout(r, 250));
    let jumpedSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(jumpedSlideNum === '6', 'Hacer clic en tarjeta 6 del Overview salta directamente a Diapositiva 6 (Calculadora).');
    let isModalClosedAfterClick = await page.$eval('#overviewModal', el => !el.classList.contains('open'));
    assert(isModalClosedAfterClick === true, 'El Overview Modal se cierra automáticamente tras seleccionar la diapositiva.');

    // Salto interactivo a Diapositiva 13 (Caso Triangulación Net Trade & Banco Macro)
    await page.keyboard.press('KeyO');
    await new Promise(r => setTimeout(r, 250));
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.overview-card');
      if (cards[12]) cards[12].click(); // Slide 13
    });
    await new Promise(r => setTimeout(r, 250));
    jumpedSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(jumpedSlideNum === '13', 'Hacer clic en tarjeta 13 del Overview salta directamente a Diapositiva 13 (Net Trade & Banco Macro).');

    // Salto interactivo a Diapositiva 16 (Matriz de Objeciones Directivas)
    await page.keyboard.press('KeyO');
    await new Promise(r => setTimeout(r, 250));
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.overview-card');
      if (cards[15]) cards[15].click(); // Slide 16
    });
    await new Promise(r => setTimeout(r, 250));
    jumpedSlideNum = await page.$eval('.slide-item.active', el => el.getAttribute('data-slide'));
    assert(jumpedSlideNum === '16', 'Hacer clic en tarjeta 16 del Overview salta directamente a Diapositiva 16 (Matriz de Objeciones).');

    // 4.4 Escalabilidad y Responsividad en Laptop (1366x768)
    console.log('\n--- 4.4: Escalabilidad en Resolución Estándar Laptop (1366x768) ---');
    await page.setViewport({ width: 1366, height: 768 });
    await new Promise(r => setTimeout(r, 250));
    const canvasBox = await page.$eval('#slideCanvas', el => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, ratio: r.width / r.height };
    });
    assert(canvasBox.width > 0 && canvasBox.height > 0, `Canvas escala adecuadamente en resolución 1366x768 (${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)}px).`);

    // 4.5 Generación de Capturas de Verificación Visual para las 18 Diapositivas
    console.log('\n--- 4.5: Captura Visual Automatizada de las 18 Diapositivas ---');
    await page.setViewport({ width: 1920, height: 1080 });
    const screenshotDir = path.join(__dirname, '..', 'screenshots', 'slide_checks');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    for (let i = 1; i <= TOTAL_SLIDES; i++) {
      await page.evaluate((n) => window.goToSlide(n), i);
      await new Promise(r => setTimeout(r, 150));
      const sPath = path.join(screenshotDir, `slide_${String(i).padStart(2, '0')}.png`);
      await page.screenshot({ path: sPath });
      assert(fs.existsSync(sPath) && fs.statSync(sPath).size > 15000, `Captura Slide ${String(i).padStart(2, '0')} generada correctamente (>15 KB).`);
    }

    // Capturar modal overview abierto
    await page.keyboard.press('KeyO');
    await new Promise(r => setTimeout(r, 250));
    const modalPath = path.join(screenshotDir, 'slide_overview_modal.png');
    await page.screenshot({ path: modalPath });
    assert(fs.existsSync(modalPath) && fs.statSync(modalPath).size > 15000, 'Captura Overview Modal generada correctamente (>15 KB).');
    await page.keyboard.press('Escape');

  } catch (err) {
    console.error('Error durante la verificación interactiva con Puppeteer:', err);
    failedTests++;
  } finally {
    if (browser) await browser.close();
  }

  // ==========================================================================
  // RESUMEN FINAL
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`RESUMEN DE PRUEBAS: ${passedTests} PASADAS, ${failedTests} FALLIDAS`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\n❌ LA SUITE HA FINALIZADO CON ${failedTests} FALLAS.`);
    process.exit(1);
  } else {
    console.log('\n✅ TODAS LAS PRUEBAS DE LA PRESENTACIÓN EJECUTIVA PASARON EXITOSAMENTE.');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Error fatal no controlado en la ejecución del test suite:', err);
  process.exit(1);
});
