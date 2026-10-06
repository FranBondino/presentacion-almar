const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');

async function generatePdf() {
  const htmlPath = path.resolve('scratch/relevamiento_pa02_facturacion.html');
  const destPdf = 'C:\\Users\\franc\\Downloads\\2026.09.25-Resumen Relevamiento-PA02 Facturacion y Cobranzas ALMAR.pdf';

  console.log('Reading HTML from:', htmlPath);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 816, height: 1056 }); // 612x792 pt at 96 dpi = 816x1056 px
  await page.emulateMediaType('print');
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();

  const pdfData = await pdfParse(pdfBuffer);
  console.log('PDF Page count:', pdfData.numpages);

  fs.writeFileSync(destPdf, pdfBuffer);
  console.log('Successfully written PDF to:', destPdf);

  // Render screenshots of the pages
  const browser2 = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page2 = await browser2.newPage();
  await page2.setViewport({ width: 1200, height: 1600 });
  await page2.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const pagesCount = await page2.evaluate(() => document.querySelectorAll('.page').length);
  console.log('DOM Pages count:', pagesCount);

  for (let i = 0; i < pagesCount; i++) {
    const pageEl = (await page2.$$('.page'))[i];
    await pageEl.screenshot({ path: `scratch/pa02_gen_page_${i + 1}.png` });
    console.log(`Saved screenshot scratch/pa02_gen_page_${i + 1}.png`);
  }

  await browser2.close();
}

generatePdf().catch(console.error);
