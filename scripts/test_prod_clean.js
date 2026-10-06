const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('=== TEST EN PRODUCCIÓN VERCEL (https://bot-relevamiento.vercel.app) ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Iniciar sesión como ADMIN (Juan Andrés Arloro)
  console.log('1. Iniciando sesión como admin@almar.com.ar...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

  // Descartar tour interactivo
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
  });

  // 2. Verificar Alertas como Admin/Finanzas
  console.log('2. Verificando /alertas en producción...');
  await page.goto('https://bot-relevamiento.vercel.app/alertas', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const alertasText = await page.evaluate(() => document.body.innerText);
  console.log('  ¿Aparece "Requiere autorización de supervisor antes de asentar en ERP"?:', alertasText.includes('Requiere autorización de supervisor antes de asentar en ERP'));
  console.log('  ¿Aparece "Desvío registrado para control contable"?:', alertasText.includes('Desvío registrado para control contable'));
  console.log('  ¿Menciona a Vanesa en alertas?:', /vanesa/i.test(alertasText));

  const shotAlertas = path.resolve('screenshots/prod_alertas_verified_live.png');
  await page.screenshot({ path: shotAlertas, fullPage: true });
  console.log('  ✓ Screenshot guardada:', shotAlertas);

  // 3. Verificar Carpeta C1471 (Evento e0000047)
  console.log('3. Verificando Carpeta C1471 (Saprograf / AMA Freight)...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1471000-0000-0000-0000-000000000009', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const c1471Text = await page.evaluate(() => document.body.innerText);
  console.log('  ¿Aparece "bloqueada para autorización de Vanesa"?:', c1471Text.includes('bloqueada para autorización de Vanesa'));
  console.log('  ¿Aparece "conciliación de recargos AMA Freight registrada para control contable"?:', c1471Text.includes('conciliación de recargos AMA Freight registrada para control contable'));

  const shotC1471 = path.resolve('screenshots/prod_c1471_verified_live.png');
  await page.screenshot({ path: shotC1471, fullPage: true });
  console.log('  ✓ Screenshot guardada:', shotC1471);

  // 4. Cambiar a Operativo (Aldana Gómez) y verificar /comprobantes
  console.log('4. Cambiando de rol a Operativo (operativo@almar.com.ar)...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    document.querySelectorAll('input').forEach(i => i.value = '');
  });
  await page.type('input[type="email"]', 'operativo@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
  });

  console.log('5. Verificando /comprobantes como Operativo...');
  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const comprobantesText = await page.evaluate(() => document.body.innerText);
  console.log('  ¿Aparece "Solo Finanzas (Vanesa Meggiolaro) autoriza desvíos"?:', comprobantesText.includes('Solo Finanzas (Vanesa Meggiolaro) autoriza desvíos'));
  console.log('  ¿Aparece "Bloqueado: requiere autorización"?:', comprobantesText.includes('Bloqueado: requiere autorización'));

  // Verificar estado de botones
  const btnStats = await page.evaluate(() => {
    const copyBtns = Array.from(document.querySelectorAll('.btn-copy-kipintoch'));
    const asentarBtns = Array.from(document.querySelectorAll('.btn-asentar'));
    return {
      totalCopy: copyBtns.length,
      disabledCopy: copyBtns.filter(b => b.hasAttribute('disabled') || b.disabled).length,
      totalAsentar: asentarBtns.length,
      disabledAsentar: asentarBtns.filter(b => b.hasAttribute('disabled') || b.disabled).length,
    };
  });
  console.log('  Botones Copiar Kipintoch:', btnStats.totalCopy, '| Deshabilitados:', btnStats.disabledCopy);
  console.log('  Botones Asentar Costo:', btnStats.totalAsentar, '| Deshabilitados:', btnStats.disabledAsentar);

  const shotComprobantes = path.resolve('screenshots/prod_comprobantes_unblocked_live.png');
  await page.screenshot({ path: shotComprobantes, fullPage: true });
  console.log('  ✓ Screenshot guardada:', shotComprobantes);

  // Copiar a artifact directory
  const artifactDir = path.resolve('C:/Users/franc/.gemini/antigravity/brain/824dd515-e69f-412e-9fea-10f4a690b478');
  fs.copyFileSync(shotAlertas, path.join(artifactDir, 'prod_alertas_verified_live.png'));
  fs.copyFileSync(shotC1471, path.join(artifactDir, 'prod_c1471_verified_live.png'));
  fs.copyFileSync(shotComprobantes, path.join(artifactDir, 'prod_comprobantes_unblocked_live.png'));
  console.log('  ✓ Todas las capturas sincronizadas al directorio de artefactos.');

  await browser.close();
  console.log('=== TEST FINALIZADO CON ÉXITO ===');
}

main().catch(err => {
  console.error('Error durante el test:', err);
  process.exit(1);
});
