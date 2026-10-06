const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  
  console.log('1. Accediendo a login en produccion...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="email"]', 'comercial@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('2. Sesion iniciada como Lucía Laje. URL:', page.url());
  
  console.log('3. Navegando al modulo /cotizaciones...');
  await page.goto('https://bot-relevamiento.vercel.app/cotizaciones', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('table', { timeout: 20000 });
  
  const rowCount = await page.$$eval('tbody tr', trs => trs.length);
  console.log('4. Cantidad de filas visibles en tabla:', rowCount);
  
  const textContent = await page.evaluate(() => document.body.innerText);
  console.log('- Filtro Lucía Laje (1.080):', textContent.includes('Lucía Laje (1.080)'));
  console.log('- Filtro Nerea Guida (399):', textContent.includes('Nerea Guida (399)'));
  console.log('- Filtro Martín Fusco (233):', textContent.includes('Martín Fusco (233)'));
  console.log('- Filtro Juan Andrés Arloro (138):', textContent.includes('Juan Andrés Arloro (138)'));
  console.log('- Fechas de Vencimiento de Tarifas:', textContent.includes('Vence:') || textContent.includes('Caducó:'));
  console.log('- Navieras visibles:', textContent.includes('Maersk Line') || textContent.includes('MSC'));
  console.log('- Días libres visibles:', textContent.includes('d libres'));
  console.log('- Total cotizaciones registradas:', textContent.includes('Total') || textContent.includes('cotizaciones'));
  
  await page.screenshot({ path: 'prod_cotizaciones_live_verified.png', fullPage: false });
  console.log('5. Captura guardada en prod_cotizaciones_live_verified.png');
  
  await browser.close();
}

run().catch(err => {
  console.error('Error durante verificacion en vivo:', err);
  process.exit(1);
});
