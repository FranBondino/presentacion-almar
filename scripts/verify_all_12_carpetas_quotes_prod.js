const puppeteer = require('puppeteer');

(async () => {
  console.log('--- AUDITING ALL 12 CARPETAS & LINKED QUOTES IN PRODUCTION ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('hasCompletedTour', 'true');
      localStorage.setItem('almar_tour_dismissed', 'true');
    } catch(e) {}
  });

  // Login as Gerencia (Alejandro Noacco) or Comercial (Lucía Laje)
  console.log('Logging in as Lucía Laje (comercial@almar.com.ar)...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'comercial@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  // Navigate to /carpetas
  await page.goto('https://bot-relevamiento.vercel.app/carpetas', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Extract all rows from /carpetas
  const carpetasSummary = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(r => {
      const text = r.innerText;
      const link = r.querySelector('a');
      return {
        text: text.replace(/\n+/g, ' | '),
        href: link ? link.getAttribute('href') : null
      };
    });
  });

  console.log(`\nFound ${carpetasSummary.length} folders in /carpetas:`);
  carpetasSummary.forEach((c, idx) => {
    console.log(`[${idx + 1}] ${c.href} --> ${c.text.slice(0, 100)}...`);
  });

  // Audit each of the 12 folders individually
  const expectedFolders = [
    'C1234', 'C1434', 'IT1486', 'C1482', 'C1024', 'TL1436',
    'C1289', 'EA1561', 'C1471', 'C1056', 'C367', 'C620'
  ];

  console.log('\n--- DETAILED AUDIT PER CARPETA ---');
  for (const item of carpetasSummary) {
    if (!item.href) continue;
    const url = 'https://bot-relevamiento.vercel.app' + item.href;
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const auditResult = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const quoteBadge = bodyText.match(/COT-2026-\d{5}/);
      const quoteCode = quoteBadge ? quoteBadge[0] : null;
      const hasQuoteCard = bodyText.includes('Cotización Ganada & Concretada') || bodyText.includes('Cotización Comercial Vinculada') || !!quoteCode;
      
      // Look for asesor
      const asesorMatch = bodyText.match(/Responsable Comercial:\s*([^\n\r(]+)/i);
      const asesor = asesorMatch ? asesorMatch[1].trim() : (bodyText.includes('Lucía Laje') ? 'Lucía Laje' : (bodyText.includes('Abril Stampfli') ? 'Abril Stampfli' : (bodyText.includes('Martín Fusco') ? 'Martín Fusco' : (bodyText.includes('Juan Andrés Arloro') ? 'Juan Andrés Arloro' : 'No encontrado'))));

      // Client name
      const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : '';
      const clientEl = document.querySelector('.text-slate-900.font-bold') || document.querySelector('h2');
      
      return {
        quoteCode,
        hasQuoteCard,
        asesor,
        hasVenta: bodyText.includes('VENTA PACTADA') || bodyText.includes('Venta pactada'),
        hasMargen: bodyText.includes('MARGEN PROYECTADO') || bodyText.includes('Margen proyectado'),
        snippet: bodyText.slice(0, 300).replace(/\n+/g, ' ')
      };
    });

    console.log(`Folder: ${item.href}`);
    console.log(`  Quote Code: ${auditResult.quoteCode || 'MISSING'}`);
    console.log(`  Has Quote Card: ${auditResult.hasQuoteCard}`);
    console.log(`  Asesor Comercial: ${auditResult.asesor}`);
    console.log(`  Has Venta & Margen: ${auditResult.hasVenta && auditResult.hasMargen}`);
  }

  await browser.close();
  console.log('\n--- AUDIT COMPLETE ---');
})();
