const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('=== TEST NAVEGACIÓN DIRECTA A COMPROBANTES CON CIERRE DE TOUR ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100'],
    defaultViewport: { width: 1600, height: 1100 },
  });

  const page = await browser.newPage();

  console.log('1. Abriendo login...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

  // Pre-seed localStorage before login
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  console.log('2. Logueando como Gerencia...');
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  console.log('3. Llegó a:', page.url());

  // Click "Omitir tutorial" if visible
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const omitir = btns.find(b => b.innerText.includes('Omitir') || b.innerText.includes('Entendido') || b.innerText.includes('Cerrar'));
    if (omitir) {
      console.log('Clicking omitir...');
      omitir.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('4. Clickeando en sidebar Comprobantes...');
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'));
    const compLink = links.find(l => l.innerText.includes('Comprobantes') || l.href?.includes('/comprobantes'));
    if (compLink) {
      compLink.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.log('No encontró link en sidebar, usando page.goto...');
    await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  } else {
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('5. URL actual tras click:', page.url());

  // Re-seed localStorage just in case
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_completed', 'true');
    localStorage.setItem('almar_guide_dismissed', 'true');
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
  });

  const shotPath = path.resolve('screenshots/prod_comprobantes_real_live.png');
  await page.screenshot({ path: shotPath });
  console.log('Captura guardada en:', shotPath);

  // Analizar contenido de /comprobantes
  const pageHtml = await page.content();
  console.log('\n--- VERIFICACIÓN EN VIVO DE /comprobantes ---');
  console.log('Longitud HTML:', pageHtml.length);
  console.log('¿Contiene "Comprobantes & Control Fiscal de Proveedores"?:', pageHtml.includes('Comprobantes & Control Fiscal de Proveedores'));
  console.log('¿Contiene "Listas Kipintoch"?:', pageHtml.includes('Listas Kipintoch'));
  console.log('¿Contiene "Con Desvío de Tarifa"?:', pageHtml.includes('Con Desvío de Tarifa'));
  console.log('¿Contiene C1289 (Maersk 7555554402)?:', pageHtml.includes('7555554402'));
  console.log('¿Contiene C1471 (AMA Freight 261005130R)?:', pageHtml.includes('261005130R'));
  console.log('¿Contiene IT1486 (LGV Transportes)?:', pageHtml.includes('LGV Transportes') || pageHtml.includes('0004-00000303'));
  console.log('¿Contiene sobrecosto erróneo C1289 (+USD 294.00)?:', pageHtml.includes('+USD 294.00'));
  console.log('¿Contiene sobrecosto erróneo C1471 (+EUR 17982.56)?:', pageHtml.includes('+EUR 17982.56'));
  console.log('¿Contiene sobrecosto demo exacto C1056 (+USD 595,49)?:', pageHtml.includes('+USD 595,49') || pageHtml.includes('+USD 595.49'));
  console.log('¿Contiene bloqueo de supervisor?:', pageHtml.includes('Requiere autorización del supervisor'));
  console.log('¿Contiene pendiente de autorización?:', pageHtml.includes('Pendiente de Autorización'));

  await browser.close();
  console.log('=== FIN ===');
})();
