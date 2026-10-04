/**
 * Test Suite Automatizado End-to-End para ALMAR Rosario — Presentación Ejecutiva React
 * Target: `presentacion-react/dist/index.html` (Vite + React + Tailwind + Framer Motion)
 *
 * Valida:
 * 1. Integridad de artefactos de producción compilados (dist/index.html, JS, CSS, assets, screenshots).
 * 2. Carga en servidor local HTTP a 1920x1080 y 1366x768 SIN scroll horizontal ni vertical
 *    (document.documentElement.scrollWidth <= window.innerWidth y scrollHeight <= window.innerHeight).
 * 3. Elementos canónicos de la Portada (Slide 01): SVG vectors, logo Clave, badge dorado, metadatos directivos.
 * 4. Navegación secuencial por teclado (ArrowRight) y controles de pantalla a través de las 18 diapositivas.
 * 5. Drawer de Notas del Orador con atajo 'N' (guion verbatim, visual cues, cierre con Escape y botón).
 * 6. Modal de Índice / Mosaico de Miniaturas con atajos 'O' y 'M' con salto directo a diapositiva.
 * 7. Visor Lightbox HD con apertura por clic en captura y cierre con 'Escape'.
 * 8. Micro-simulador de Pipeline de Facturación en Diapositiva 04 (avance de etapas e inspección de payload).
 * 9. Micro-simulador de Calculadora Paramétrica en Diapositiva 06 (slider de margen, alerta < 200, bloqueo < 3 y WebAuthn).
 * 10. Monitoreo de telemetría sin errores de consola ni red no controlados.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REACT_DIR = path.join(PROJECT_ROOT, 'presentacion-react');
const DIST_DIR = path.join(REACT_DIR, 'dist');
const TARGET_INDEX = path.join(DIST_DIR, 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') {
      reqUrl = '/index.html';
    }

    const filePath = path.join(DIST_DIR, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Fallback a index.html para comportamiento SPA
      if (fs.existsSync(TARGET_INDEX)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(TARGET_INDEX).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
  });
}

async function runReactPresentationTestSuite() {
  console.log('================================================================');
  console.log('TEST SUITE E2E: PRESENTACIÓN EJECUTIVA REACT (ALMAR ROSARIO)');
  console.log('Target Build: presentacion-react/dist/index.html');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;
  const loggedErrors = [];

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
  // FASE 1: INTEGRIDAD DE ARTEFACTOS DE PRODUCCIÓN
  // ==========================================================================
  console.log('--- Fase 1: Integridad Física de Archivos Compilados en dist/ ---');
  assert(fs.existsSync(DIST_DIR), 'Directorio de distribución presentacion-react/dist/ existe.');
  assert(fs.existsSync(TARGET_INDEX), 'Archivo compilado presentacion-react/dist/index.html existe.');

  const indexContent = fs.readFileSync(TARGET_INDEX, 'utf-8');
  assert(indexContent.includes('<div id="root"></div>'), 'index.html contiene el contenedor raíz react #root.');
  assert(indexContent.includes('assets/index-'), 'index.html referencia los bundles compilados en assets/.');
  assert(fs.existsSync(path.join(DIST_DIR, 'logo_clave.png')), 'Logotipo oficial dist/logo_clave.png presente.');
  assert(fs.existsSync(path.join(DIST_DIR, 'screenshots')), 'Directorio dist/screenshots presente.');

  // ==========================================================================
  // FASE 2: INICIALIZACIÓN DE SERVIDOR LOCAL Y PUPPETEER
  // ==========================================================================
  console.log('\n--- Fase 2: Inicialización de Servidor Local y Navegador Headless ---');
  const server = createStaticServer();

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  assert(serverPort > 0, `Servidor HTTP local escuchando en puerto dinámico ${serverPort}.`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    assert(!!browser, 'Instancia de Chromium Puppeteer lanzada exitosamente.');

    const page = await browser.newPage();

    // Capturar errores en consola del navegador
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        loggedErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      loggedErrors.push(err.message);
    });

    // ==========================================================================
    // FASE 3: RESPONSIVIDAD Y AUSENCIA DE SCROLL (1920x1080 Y 1366x768)
    // ==========================================================================
    console.log('\n--- Fase 3: Pruebas de Desborde y Scroll en Viewports Estándar ---');

    // 3.1 Resolución Full HD (1920x1080)
    await page.setViewport({ width: 1920, height: 1080 });
    const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 20000 });
    assert(response && response.status() === 200, 'Página cargada con status HTTP 200 a 1920x1080.');

    // Esperar a que React monte el contenido
    await page.waitForSelector('#root > div', { timeout: 5000 });

    const scroll1920 = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    }));

    assert(
      scroll1920.scrollWidth <= scroll1920.clientWidth,
      `1920x1080: Sin scroll horizontal (scrollWidth: ${scroll1920.scrollWidth} <= clientWidth: ${scroll1920.clientWidth}).`
    );
    assert(
      scroll1920.scrollHeight <= scroll1920.clientHeight,
      `1920x1080: Sin scroll vertical (scrollHeight: ${scroll1920.scrollHeight} <= clientHeight: ${scroll1920.clientHeight}).`
    );

    // 3.2 Resolución Laptop HD (1366x768)
    await page.setViewport({ width: 1366, height: 768 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await new Promise((r) => setTimeout(r, 300));

    const scroll1366 = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
    }));

    assert(
      scroll1366.scrollWidth <= scroll1366.clientWidth,
      `1366x768: Sin scroll horizontal (scrollWidth: ${scroll1366.scrollWidth} <= clientWidth: ${scroll1366.clientWidth}).`
    );
    assert(
      scroll1366.scrollHeight <= scroll1366.clientHeight,
      `1366x768: Sin scroll vertical (scrollHeight: ${scroll1366.scrollHeight} <= clientHeight: ${scroll1366.clientHeight}).`
    );

    // Restaurar a 1920x1080 para la interacción detallada
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await new Promise((r) => setTimeout(r, 200));

    // ==========================================================================
    // FASE 4: PORTADA (SLIDE 01) - ELEMENTOS DE IDENTIDAD EDITORIAL
    // ==========================================================================
    console.log('\n--- Fase 4: Verificación de Portada Ejecutiva (Slide 01) ---');

    const coverDetails = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg')).map((s) => s.getAttribute('viewBox'));
      const hasTopLeftSvg = svgs.includes('0 0 320 240');
      const hasBottomRightSvg = svgs.includes('0 0 360 280');

      const logo = document.querySelector('img[alt="Clave Consultora"]');
      const logoLoaded = !!logo && logo.complete && logo.naturalWidth > 0;

      const bodyText = document.body.innerText;
      const upperText = bodyText.toUpperCase();

      const hasBadge = upperText.includes('DEMO OFICIAL DE LA SOLUCIÓN TECNOLÓGICA · 2026');
      const hasTitle = upperText.includes('AUTOMATIZACIÓN INTELIGENTE DE FACTURACIÓN');
      const hasSubtitle =
        bodyText.includes('Plataforma de Extracción') ||
        bodyText.includes('Extracción automática de comprobantes') ||
        bodyText.includes('ALMAR Rosario S.R.L.');
      const hasOrg = bodyText.includes('ALMAR Rosario S.R.L.');
      const hasDev = bodyText.includes('Clave Consultora');
      const hasPresenter = bodyText.includes('Ing. Fran Bondino');
      const hasDirectorio = bodyText.includes('Directorio Ejecutivo — ALMAR');

      return {
        hasTopLeftSvg,
        hasBottomRightSvg,
        logoLoaded,
        hasBadge,
        hasTitle,
        hasSubtitle,
        hasOrg,
        hasDev,
        hasPresenter,
        hasDirectorio,
      };
    });

    assert(coverDetails.hasTopLeftSvg, 'S1: Acento SVG geométrico superior izquierdo presente (viewBox="0 0 320 240").');
    assert(coverDetails.hasBottomRightSvg, 'S1: Acento SVG geométrico inferior derecho presente (viewBox="0 0 360 280").');
    assert(coverDetails.logoLoaded, 'S1: Logotipo corporativo Clave Consultora cargado físicamente con naturalWidth > 0.');
    assert(coverDetails.hasBadge, 'S1: Píldora dorada "DEMO OFICIAL DE LA SOLUCIÓN TECNOLÓGICA · 2026" visible.');
    assert(coverDetails.hasTitle, 'S1: Título ejecutivo principal renderizado correctamente.');
    assert(coverDetails.hasSubtitle, 'S1: Subtítulo con alcance de plataforma visible.');
    assert(coverDetails.hasOrg, 'S1: Metadatos: Organización "ALMAR Rosario S.R.L." presente.');
    assert(coverDetails.hasDev, 'S1: Metadatos: Consultoría "Clave Consultora" presente.');
    assert(coverDetails.hasPresenter, 'S1: Metadatos: Presentador "Ing. Fran Bondino" presente.');
    assert(coverDetails.hasDirectorio, 'S1: Metadatos: Destinatarios "Directorio Ejecutivo — ALMAR" presente.');

    // ==========================================================================
    // FASE 5: NAVEGACIÓN SECUENCIAL (18 SLIDES) CON TECLADO Y CONTROLES
    // ==========================================================================
    console.log('\n--- Fase 5: Navegación Secuencial Completa (18 Diapositivas) ---');

    for (let slideNum = 1; slideNum <= 18; slideNum++) {
      const slideFormatted = String(slideNum).padStart(2, '0');

      // Comprobar contador en pantalla
      const currentIndicator = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/(\d{2})\s*\/\s*18/);
        return match ? match[1] : null;
      });

      assert(
        currentIndicator === slideFormatted,
        `Navegación Slide ${slideFormatted}: Indicador de slide en pantalla es "${slideFormatted} / 18".`
      );

      // Si no es el último, avanzar con teclado ArrowRight
      if (slideNum < 18) {
        await page.keyboard.press('ArrowRight');
        await new Promise((r) => setTimeout(r, 320)); // Esperar transición de Framer Motion
      }
    }

    // Probar límites en extremo final (Slide 18)
    const indicatorAtEnd = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match ? match[1] : null;
    });
    assert(indicatorAtEnd === '18', 'Slide 18: Límite superior alcanzado en diapositiva 18.');

    // Probar que presionar ArrowRight en slide 18 no desborda
    await page.keyboard.press('ArrowRight');
    await new Promise((r) => setTimeout(r, 200));
    const indicatorAfterOverflow = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match ? match[1] : null;
    });
    assert(indicatorAfterOverflow === '18', 'Slide 18: Presionar ArrowRight no avanza más allá de 18.');

    // Probar botón de pantalla "Anterior"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const prevBtn = buttons.find((b) => b.getAttribute('title')?.includes('anterior') || b.innerText.includes('Anterior'));
      if (prevBtn) prevBtn.click();
    });
    await new Promise((r) => setTimeout(r, 320));
    const indicatorAfterPrevBtn = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match ? match[1] : null;
    });
    assert(indicatorAfterPrevBtn === '17', 'Controles de pantalla: Botón "Anterior" retrocede a slide 17.');

    // Probar tecla 'Home' para volver a la slide 1
    await page.keyboard.press('Home');
    await new Promise((r) => setTimeout(r, 320));
    const indicatorAfterHome = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match ? match[1] : null;
    });
    assert(indicatorAfterHome === '01', 'Atajo Home: Retorna instantáneamente a Slide 01.');

    // ==========================================================================
    // FASE 6: DRAWER DE NOTAS DEL ORADOR (ATAJO 'N' Y CONTENIDO)
    // ==========================================================================
    console.log('\n--- Fase 6: Drawer de Notas del Orador (Atajo N & Contenido) ---');

    // Abrir con tecla 'N'
    await page.keyboard.press('KeyN');
    await new Promise((r) => setTimeout(r, 400));

    const notesStateOpen = await page.evaluate(() => {
      const text = document.body.innerText;
      const upper = text.toUpperCase();
      const hasTitle = text.includes('Notas del Orador');
      const hasSlideBadge = text.includes('Slide 01');
      const hasVerbatimTab = text.includes('Guion Verbatim');
      const hasCuesTab = text.includes('Visual Cues');
      const hasVerbatimText = text.includes('Buenos días Alejandro, Vanesa, Juan') || upper.includes('ENCUADRE NARRATIVO');
      return { hasTitle, hasSlideBadge, hasVerbatimTab, hasCuesTab, hasVerbatimText };
    });

    assert(notesStateOpen.hasTitle, 'Notas: Panel lateral abierto con título "Notas del Orador".');
    assert(notesStateOpen.hasSlideBadge, 'Notas: Badge "Slide 01" correspondiente a la diapositiva actual.');
    assert(notesStateOpen.hasVerbatimTab, 'Notas: Pestaña "🎙️ Guion Verbatim" disponible.');
    assert(notesStateOpen.hasCuesTab, 'Notas: Pestaña "🎯 Visual Cues" disponible.');
    assert(notesStateOpen.hasVerbatimText, 'Notas: Texto del guion verbatim de orador presente en el drawer.');

    // Interactuar con la pestaña de Visual Cues
    const cuesTabClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const cuesTab = tabs.find((b) => b.textContent && b.textContent.includes('Visual Cues'));
      if (cuesTab) {
        cuesTab.click();
        return true;
      }
      return false;
    });
    assert(cuesTabClicked, 'Notas: Clic en pestaña "Visual Cues".');
    await new Promise((r) => setTimeout(r, 300));

    const cuesContent = await page.evaluate(() => {
      const text = document.body.innerText;
      const upper = text.toUpperCase();
      return upper.includes('QUÉ SEÑALAR EN PANTALLA') || text.includes('Señalar el logotipo');
    });
    assert(cuesContent, 'Notas: Pestaña Visual Cues muestra puntos clave a señalar en pantalla.');

    // Cerrar drawer con Escape y verificar desmontaje
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('aside'), { timeout: 3000 });
    const notesClosed = await page.evaluate(() => !document.querySelector('aside'));
    assert(notesClosed, 'Notas: Atajo Escape cierra y desmonta el drawer de notas correctamente.');

    // Probar apertura con botón de pantalla y cierre con tecla N
    await page.evaluate(() => {
      const notesBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Notas (N)'));
      if (notesBtn) notesBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    assert(await page.evaluate(() => !!document.querySelector('aside')), 'Notas: Apertura exitosa mediante botón de barra inferior "Notas (N)".');

    await page.keyboard.press('KeyN');
    await page.waitForFunction(() => !document.querySelector('aside'), { timeout: 3000 });
    assert(await page.evaluate(() => !document.querySelector('aside')), 'Notas: Alternancia de cierre con tecla "N" verificada.');

    // ==========================================================================
    // FASE 7: MODAL DE ÍNDICE / MOSAICO DE MINIATURAS (ATAJOS 'O' / 'M' Y SALTO)
    // ==========================================================================
    console.log('\n--- Fase 7: Modal de Índice de Diapositivas (Atajos O / M y Salto Directo) ---');

    // Abrir con tecla 'O'
    await page.keyboard.press('KeyO');
    await new Promise((r) => setTimeout(r, 400));

    const gridInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasModalTitle = text.includes('Índice de Diapositivas (18 Secciones)');
      const modal = document.querySelector('.max-w-6xl');
      const cards = modal ? Array.from(modal.querySelectorAll('button')).filter((b) => b.querySelector('img')) : [];
      return {
        hasModalTitle,
        cardCount: cards.length,
      };
    });

    assert(gridInfo.hasModalTitle, 'Índice: Modal desplegado con título "Índice de Diapositivas (18 Secciones)".');
    assert(gridInfo.cardCount === 18, `Índice: Exactamente 18 tarjetas de diapositivas renderizadas (${gridInfo.cardCount}/18).`);

    // Probar salto directo a Slide 04 (Pipeline de Facturación)
    await page.evaluate(() => {
      const modal = document.querySelector('.max-w-6xl');
      const cards = modal ? Array.from(modal.querySelectorAll('button')).filter((b) => b.querySelector('img')) : [];
      if (cards[3]) {
        // Slide 4 está en el índice 3
        cards[3].click();
      }
    });
    await page.waitForFunction(() => !document.querySelector('.max-w-6xl'), { timeout: 3000 });

    const currentAfterJump = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match ? match[1] : null;
    });
    assert(currentAfterJump === '04', 'Índice: Clic en miniatura 04 saltó exitosamente a Slide 04 y cerró el modal.');

    // Probar tecla 'M' para abrir el modal nuevamente y cerrar con Escape
    await page.keyboard.press('KeyM');
    await new Promise((r) => setTimeout(r, 400));
    const modalReopened = await page.evaluate(() => !!document.querySelector('.max-w-6xl'));
    assert(modalReopened, 'Índice: Atajo "M" abre también el modal de índice.');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.max-w-6xl'), { timeout: 3000 });
    const modalReclosed = await page.evaluate(() => !document.querySelector('.max-w-6xl'));
    assert(modalReclosed, 'Índice: Atajo Escape cierra y desmonta el modal de miniaturas.');

    // ==========================================================================
    // FASE 8: SIMULADOR DE PIPELINE DE FACTURACIÓN (SLIDE 04)
    // ==========================================================================
    console.log('\n--- Fase 8: Micro-simulador de Pipeline de Facturación (Slide 04) ---');

    // Verificar presencia del simulador y etapa inicial
    const pipelineInitial = await page.evaluate(() => {
      const text = document.body.innerText;
      const upper = text.toUpperCase();
      const hasPipeline = upper.includes('CIRCUITO') || upper.includes('FACTURACIÓN') || upper.includes('PIPELINE');
      const isStage1 = text.includes('Recepción de Facturas') && text.includes('Email o PDF');
      return { hasPipeline, isStage1 };
    });
    assert(pipelineInitial.hasPipeline, 'Pipeline: Componente de circuito de facturación montado.');
    assert(pipelineInitial.isStage1, 'Pipeline: Etapa 1 activa por defecto (Recepción de Facturas).');

    // Avanzar a Etapa 2 con el botón de siguiente etapa
    await page.evaluate(() => {
      const nextBtn = document.querySelector('button[title="Siguiente etapa"]');
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    const pipelineStage2 = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Lectura y Desglose') && text.includes('BUFF');
    });
    assert(pipelineStage2, 'Pipeline: Clic en siguiente etapa avanza a Etapa 2 (Lectura y Desglose BUFF).');

    // Clic directo en botón Etapa 5 (Conciliación Banco Macro)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const stage5Btn = buttons.find((b) => b.innerText.includes('5') && b.innerText.toUpperCase().includes('MACRO'));
      if (stage5Btn) stage5Btn.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    const pipelineStage5 = await page.evaluate(() => {
      const text = document.body.innerText;
      return (text.includes('Conciliación Bancaria') || text.includes('Banco Macro')) && text.includes('376100000930617');
    });
    assert(pipelineStage5, 'Pipeline: Clic directo en Etapa 5 muestra conciliación bancaria Macro.');

    // ==========================================================================
    // FASE 9: CALCULADORA PARAMÉTRICA DE MARGEN Y ALERTAS (SLIDE 06)
    // ==========================================================================
    console.log('\n--- Fase 9: Calculadora Paramétrica de Margen y WebAuthn (Slide 06) ---');

    // Navegar a Slide 06 usando teclado
    await page.keyboard.press('ArrowRight'); // Slide 05
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.press('ArrowRight'); // Slide 06
    await new Promise((r) => setTimeout(r, 300));

    const isSlide6 = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match && match[1] === '06';
    });
    assert(isSlide6, 'Navegación: Posicionado en Slide 06 (Calculadora Paramétrica).');

    // Verificar estado inicial (margen seguro)
    const calcInitial = await page.evaluate(() => {
      const text = document.body.innerText;
      const upper = text.toUpperCase();
      const hasCalc = upper.includes('CALCULADORA PARAMÉTRICA EN TIEMPO REAL');
      const isSafe = text.includes('Margen Seguro:') && text.includes('USD 350');
      return { hasCalc, isSafe };
    });
    assert(calcInitial.hasCalc, 'Calculadora: Interfaz de cálculo paramétrico renderizada.');
    assert(calcInitial.isSafe, 'Calculadora: Estado inicial seguro con margen comercial de USD 350.');

    // Cambiar el slider de Margen Comercial a 150 (< USD 200) para disparar la alerta
    const warningTriggered = await page.evaluate(() => {
      const sliders = Array.from(document.querySelectorAll('input[type="range"]'));
      // El slider de margen comercial tiene min="0" max="1200"
      const marginSlider = sliders.find((s) => s.getAttribute('max') === '1200');
      if (marginSlider) {
        // Disparar input event en React con prototype setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(marginSlider, 150);
        marginSlider.dispatchEvent(new Event('input', { bubbles: true }));
        marginSlider.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    assert(warningTriggered, 'Calculadora: Slider de margen comercial actualizado a USD 150.');
    await new Promise((r) => setTimeout(r, 300));

    const warningCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasWarning = text.includes('ALERTA: Margen < USD 200 (Riesgo Descalce)');
      const hasWebAuthnBtn = text.includes('Firmar Override con WebAuthn');
      return { hasWarning, hasWebAuthnBtn };
    });
    assert(warningCheck.hasWarning, 'Calculadora: Disparo exitoso de "ALERTA: Margen < USD 200 (Riesgo Descalce)".');
    assert(warningCheck.hasWebAuthnBtn, 'Calculadora: Botón de contingencia "Firmar Override con WebAuthn" visible.');

    // Probar apertura y simulación del modal WebAuthn
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const webAuthnBtn = buttons.find((b) => b.textContent && b.textContent.includes('WebAuthn'));
      if (webAuthnBtn) webAuthnBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const webAuthnModalOpen = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Autorización Biométrica WebAuthn') && text.includes('C1234');
    });
    assert(webAuthnModalOpen, 'WebAuthn: Modal de autorización biométrica FIDO2 abierto para carpeta C1234.');

    // Disparar autenticación simulada (botón con sensor biométrico)
    const scanTriggered = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.className.includes('rounded-full') && (b.className.includes('bg-clave-green') || b.className.includes('animate-pulse'))
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(scanTriggered, 'WebAuthn: Clic en sensor biométrico iniciado.');
    await new Promise((r) => setTimeout(r, 1600)); // Esperar resolución biométrica animada (1200ms)

    const webAuthnAuthorized = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Firma Criptográfica SHA-256 Aprobada') || text.includes('Autorizado con firma SHA-256');
    });
    assert(webAuthnAuthorized, 'WebAuthn: Firma biométrica validada con hash criptográfico SHA-256.');

    // Cerrar modal WebAuthn con Escape
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 600));

    // Cambiar slider a margen < 3 (USD 0) para probar bloqueo estricto
    await page.evaluate(() => {
      const sliders = Array.from(document.querySelectorAll('input[type="range"]'));
      const marginSlider = sliders.find((s) => s.getAttribute('max') === '1200');
      if (marginSlider) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(marginSlider, 0);
        marginSlider.dispatchEvent(new Event('input', { bubbles: true }));
        marginSlider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 300));

    const blockingCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('BLOQUEO ESTRICTO: Margen < USD 3.00');
    });
    assert(blockingCheck, 'Calculadora: Disparo exitoso de "BLOQUEO ESTRICTO: Margen < USD 3.00".');

    // Restaurar a perfil Estratégico (USD 220) con botón de perfil
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const stratBtn = buttons.find((b) => b.innerText === 'Estratégico');
      if (stratBtn) stratBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    const restoredSafe = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Margen Seguro:') && text.includes('USD 220');
    });
    assert(restoredSafe, 'Calculadora: Selección de perfil "Estratégico" restablece margen seguro a USD 220.');

    // ==========================================================================
    // FASE 10: VISOR LIGHTBOX HD EN SLIDE 08 (KANBAN & VISOR SIDE-BY-SIDE)
    // ==========================================================================
    console.log('\n--- Fase 10: Visor Lightbox HD en Diapositiva 08 ---');

    // Navegar a Slide 08 con teclado
    await page.keyboard.press('ArrowRight'); // Slide 07
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.press('ArrowRight'); // Slide 08
    await new Promise((r) => setTimeout(r, 300));

    const isSlide8 = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d{2})\s*\/\s*18/);
      return match && match[1] === '08';
    });
    assert(isSlide8, 'Navegación: Posicionado en Slide 08 (Tablero Kanban & Side-by-Side).');

    // Abrir Lightbox haciendo clic en la primera tarjeta de captura
    await page.evaluate(() => {
      const mockup = document.querySelector('.cursor-pointer');
      if (mockup) mockup.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const lightboxOpen = await page.evaluate(() => {
      const text = document.body.innerText;
      const upper = text.toUpperCase();
      const hasBadge = upper.includes('CAPTURA HD');
      const hasZoomBtn = text.includes('Zoom 140%') || text.includes('Zoom 100%');
      const imgInLightbox = document.querySelector('.max-h-\\[82vh\\] img');
      const imgLoaded = !!imgInLightbox && imgInLightbox.complete && imgInLightbox.naturalWidth > 0;
      return { hasBadge, hasZoomBtn, imgLoaded };
    });

    assert(lightboxOpen.hasBadge, 'Lightbox: Modal abierto con badge "Captura HD".');
    assert(lightboxOpen.hasZoomBtn, 'Lightbox: Control interactivo de zoom disponible.');
    assert(lightboxOpen.imgLoaded, 'Lightbox: Imagen en alta resolución renderizada físicamente.');

    // Probar zoom toggle
    await page.evaluate(() => {
      const zoomBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Zoom'));
      if (zoomBtn) zoomBtn.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    const zoomToggled = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Zoom 100%');
    });
    assert(zoomToggled, 'Lightbox: Clic en zoom alterna a escala ampliada (140% -> 100%).');

    // Cerrar Lightbox con Escape y verificar desmontaje
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.max-h-\\[82vh\\]'), { timeout: 3000 });

    const lightboxClosed = await page.evaluate(() => !document.querySelector('.max-h-\\[82vh\\]'));
    assert(lightboxClosed, 'Lightbox: Atajo Escape cierra el visor Lightbox HD.');

    // ==========================================================================
    // FASE 11: TELEMETRÍA DE ERRORES EN TIEMPO DE EJECUCIÓN
    // ==========================================================================
    console.log('\n--- Fase 11: Monitoreo de Errores de Consola y Red ---');
    assert(
      loggedErrors.length === 0,
      `Cero errores no controlados en consola del navegador durante la sesión (${loggedErrors.length} errores detectados).`
    );
    if (loggedErrors.length > 0) {
      console.error('  Detalle de errores capturados:', loggedErrors);
    }

  } finally {
    if (browser) {
      await browser.close();
    }
    server.close();
  }

  // ==========================================================================
  // RESUMEN FINAL
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`RESUMEN DE PRUEBAS E2E (REACT PRESENTATION):`);
  console.log(`  PASADAS:  ${passedTests}`);
  console.log(`  FALLIDAS: ${failedTests}`);
  console.log(`  TOTAL:    ${passedTests + failedTests}`);
  console.log('================================================================\n');

  if (failedTests === 0) {
    console.log('>>> RESULTADO: 100% DE LAS PRUEBAS PASARON EXITOSAMENTE. <<<\n');
    return true;
  } else {
    console.error(`>>> RESULTADO: ${failedTests} PRUEBA(S) FALLARON. <<< \n`);
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  runReactPresentationTestSuite().catch((err) => {
    console.error('Error fatal durante la ejecución de la suite de pruebas:', err);
    process.exit(1);
  });
}

module.exports = { runReactPresentationTestSuite };
