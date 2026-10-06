const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ALL_12_CARPETAS = [
  { num: 'C1234', id: 'c1234000-0000-0000-0000-000000000001', cliente: 'Dis-Den Odontología', quote: 'COT-2026-00010', asesor: 'Lucía Laje' },
  { num: 'C1434', id: 'c1434000-0000-0000-0000-000000000002', cliente: 'Siderar S.A.I.C.', quote: 'COT-2026-00061', asesor: 'Lucía Laje' },
  { num: 'IT1486', id: 'it148600-0000-0000-0000-000000000003', cliente: 'Paladini S.A.', quote: 'COT-2026-00357', asesor: 'Abril Stampfli' },
  { num: 'C1482', id: 'c1482000-0000-0000-0000-000000000004', cliente: 'Vicentin S.A.I.C.', quote: 'COT-2026-00610', asesor: 'Juan Andrés Arloro' },
  { num: 'C1024', id: 'c1024000-0000-0000-0000-000000000005', cliente: 'Molinos Río de la Plata', quote: 'COT-2026-00226', asesor: 'Lucía Laje' },
  { num: 'TL1436', id: 'tl143600-0000-0000-0000-000000000006', cliente: 'Bunge Argentina', quote: 'COT-2026-00379', asesor: 'Abril Stampfli' },
  { num: 'C1289', id: 'c1289000-0000-0000-0000-000000000007', cliente: 'Albertoni S.A.', quote: 'COT-2026-00105', asesor: 'Lucía Laje' },
  { num: 'EA1561', id: 'ea156100-0000-0000-0000-000000000008', cliente: 'Bertot Metalmecánica', quote: 'COT-2026-00428', asesor: 'Abril Stampfli' },
  { num: 'C1471', id: 'c1471000-0000-0000-0000-000000000009', cliente: 'Industrias Juan F. Secco', quote: 'COT-2026-00067', asesor: 'Lucía Laje' },
  { num: 'C1056', id: 'c1056000-0000-0000-0000-000000000010', cliente: 'Saprograf', quote: 'COT-2026-00457', asesor: 'Lucía Laje' },
  { num: 'C367', id: 'c0367000-0000-0000-0000-000000000011', cliente: 'Juan Cuello', quote: 'COT-2026-00113', asesor: 'Martín Fusco' },
  { num: 'C620', id: 'c0620000-0000-0000-0000-000000000012', cliente: 'CONICET', quote: 'COT-2026-00018', asesor: 'Lucía Laje' },
];

(async () => {
  console.log('=== VERIFICANDO EXHAUSTIVAMENTE LAS 12 CARPETAS EN PRODUCCIÓN ===');
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

  // Login as admin/gerencia so we can view full financial and quote cards
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'gerencia@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  const results = [];

  for (const carp of ALL_12_CARPETAS) {
    const url = `https://bot-relevamiento.vercel.app/carpetas/${carp.id}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Dismiss tour if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const omitir = btns.find(b => b.innerText.trim() === 'Omitir tutorial' || b.innerText.trim() === 'Entendido' || b.innerText.trim() === 'Omitir');
      if (omitir) omitir.click();
    });

    const info = await page.evaluate((c) => {
      const body = document.body.innerText;
      const hasQuoteCard = body.includes(c.quote);
      const hasAsesor = body.includes(c.asesor);
      const hasCliente = body.toLowerCase().includes(c.cliente.toLowerCase());
      
      // Check Venta and Margen in quote card
      const hasVenta = body.includes('VENTA PACTADA') || body.includes('Venta pactada');
      const hasMargen = body.includes('MARGEN PROYECTADO') || body.includes('Margen proyectado');
      
      // Check mails timeline
      const hasMails = body.includes('Historial de Correos') || body.includes('Mails & Actores');

      // Check comprobantes
      const hasComprobantesTab = !!document.querySelector('button[value="comprobantes"]') || body.includes('Comprobantes');

      return {
        hasQuoteCard,
        hasAsesor,
        hasCliente,
        hasVenta,
        hasMargen,
        hasMails,
        hasComprobantesTab
      };
    }, carp);

    console.log(`[${carp.num}] Cliente: ${carp.cliente} | Quote: ${carp.quote} | Asesor: ${carp.asesor}`);
    console.log(`      QuoteCard: ${info.hasQuoteCard ? 'OK' : 'FAIL'} | AsesorMatch: ${info.hasAsesor ? 'OK' : 'FAIL'} | ClienteMatch: ${info.hasCliente ? 'OK' : 'FAIL'} | Finanzas: ${info.hasVenta && info.hasMargen ? 'OK' : 'FAIL'}`);

    results.push({ ...carp, ...info });
  }

  // Save JSON report
  fs.writeFileSync('all_12_carpetas_audit_live.json', JSON.stringify(results, null, 2));
  console.log('\nAudit written to all_12_carpetas_audit_live.json');

  await browser.close();
})();
