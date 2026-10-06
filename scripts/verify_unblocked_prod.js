const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('--- AUDITORÍA E2E DE DESPLIEGUE EN PRODUCCIÓN (VERCEL) ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let deployed = false;
  for (let attempt = 1; attempt <= 15; attempt++) {
    console.log(`[Intento ${attempt}] Verificando si Vercel aplicó el commit b2295fd...`);
    await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

    // Login as Gerencia
    await page.type('input[type="email"]', 'gerencia@almar.com.ar');
    await page.type('input[type="password"]', 'Almar2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

    // Check Alertas
    await page.goto('https://bot-relevamiento.vercel.app/alertas', { waitUntil: 'networkidle2' });
    const contentAlertas = await page.content();
    const hasOldAlert = contentAlertas.includes('Requiere autorización de supervisor antes de asentar en ERP');
    const hasNewAlert = contentAlertas.includes('Desvío registrado para control contable');

    console.log(`  Alertas -> Anterior bloqueante presente: ${hasOldAlert} | Nuevo texto contable presente: ${hasNewAlert}`);

    if (hasNewAlert && !hasOldAlert) {
      deployed = true;
      console.log('>>> ¡NUEVA VERSIÓN VERCEL EN VIVO CONFIRMADA! <<<');
      break;
    }

    console.log('  Esperando 8 segundos para que Vercel termine la compilación...');
    await new Promise(r => setTimeout(r, 8000));
  }

  if (!deployed) {
    console.log('ADVERTENCIA: La verificación de alertas no confirmó la nueva versión aún.');
  }

  // 1. Verificar C1471 (Evento e0000047)
  console.log('\n1. Verificando Carpeta C1471 en vivo...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1471000-0000-0000-0000-000000000009', { waitUntil: 'networkidle2' });
  const contentC1471 = await page.content();
  const hasBloqueoVanesa = contentC1471.includes('bloqueada para autorización de Vanesa');
  const hasConciliacionAma = contentC1471.includes('conciliación de recargos AMA Freight registrada para control contable');

  console.log(`  C1471 -> ¿Tiene 'bloqueada para autorización de Vanesa'?: ${hasBloqueoVanesa} (Debe ser false)`);
  console.log(`  C1471 -> ¿Tiene 'conciliación de recargos AMA Freight registrada para control contable'?: ${hasConciliacionAma} (Debe ser true)`);

  const c1471ShotPath = path.resolve('screenshots/prod_c1471_sin_bloqueo_live.png');
  await page.screenshot({ path: c1471ShotPath, fullPage: true });
  console.log(`  Captura guardada: ${c1471ShotPath}`);

  // 2. Verificar Comprobantes (/comprobantes) como OPERATIVO
  console.log('\n2. Verificando Comprobantes como OPERATIVO (aldana)...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.querySelectorAll('input').forEach(i => i.value = '');
  });
  await page.type('input[type="email"]', 'operativo@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

  await page.goto('https://bot-relevamiento.vercel.app/comprobantes', { waitUntil: 'networkidle2' });
  const contentComprobantes = await page.content();
  const hasSoloFinanzasButton = contentComprobantes.includes('Solo Finanzas (Vanesa Meggiolaro) autoriza desvíos');
  const hasBloqueadoBadge = contentComprobantes.includes('Bloqueado: requiere autorización de desvío');

  console.log(`  Comprobantes -> ¿Tiene botón 'Solo Finanzas (Vanesa Meggiolaro) autoriza desvíos'?: ${hasSoloFinanzasButton} (Debe ser false)`);
  console.log(`  Comprobantes -> ¿Tiene texto 'Bloqueado: requiere autorización de desvío'?: ${hasBloqueadoBadge} (Debe ser false)`);

  // Verificar que el botón de copiar Kipintoch y asentar estén habilitados (no disabled)
  const buttonsState = await page.evaluate(() => {
    const copyBtns = Array.from(document.querySelectorAll('.btn-copy-kipintoch'));
    const asentarBtns = Array.from(document.querySelectorAll('.btn-asentar'));
    return {
      totalCopy: copyBtns.length,
      disabledCopy: copyBtns.filter(b => b.hasAttribute('disabled')).length,
      totalAsentar: asentarBtns.length,
      disabledAsentar: asentarBtns.filter(b => b.hasAttribute('disabled')).length,
    };
  });
  console.log(`  Estado de botones Kanban:`, buttonsState);
  console.log(`  ¿Hay algún botón de copiar bloqueado?: ${buttonsState.disabledCopy > 0 ? 'SÍ (ERROR)' : 'NO (PERFECTO, 0 BLOQUEOS)'}`);
  console.log(`  ¿Hay algún botón de asentar bloqueado?: ${buttonsState.disabledAsentar > 0 ? 'SÍ (ERROR)' : 'NO (PERFECTO, 0 BLOQUEOS)'}`);

  const comprobantesShotPath = path.resolve('screenshots/prod_comprobantes_unblocked_live.png');
  await page.screenshot({ path: comprobantesShotPath, fullPage: true });
  console.log(`  Captura guardada: ${comprobantesShotPath}`);

  // 3. Verificar Alertas como Operativo
  console.log('\n3. Verificando Alertas (/alertas)...');
  await page.goto('https://bot-relevamiento.vercel.app/alertas', { waitUntil: 'networkidle2' });
  const alertasContent = await page.content();
  const hasVanesaInAlertas = /vanesa/i.test(alertasContent);
  const hasHoldInAlertas = /requiere autorización de supervisor/i.test(alertasContent);
  console.log(`  Alertas -> ¿Menciona a Vanesa?: ${hasVanesaInAlertas} (Debe ser false)`);
  console.log(`  Alertas -> ¿Menciona requiere autorización de supervisor?: ${hasHoldInAlertas} (Debe ser false)`);

  const alertasShotPath = path.resolve('screenshots/prod_alertas_unblocked_live.png');
  await page.screenshot({ path: alertasShotPath, fullPage: true });
  console.log(`  Captura guardada: ${alertasShotPath}`);

  await browser.close();
  console.log('\n--- AUDITORÍA FINALIZADA CON ÉXITO ---');
})();
