/**
 * compile_report_pdf.js
 * Compiles INFORME_COTIZACIONES_ALMAR_2026.html into an official 13-page A4 PDF
 * using Puppeteer headless print emulation and writes it directly to Downloads.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function compileReportPdf() {
  const HTML_PATH = path.resolve(__dirname, '..', 'INFORME_COTIZACIONES_ALMAR_2026.html');
  const PDF_DEST = 'C:\\Users\\franc\\Downloads\\INFORME_COTIZACIONES_ALMAR_2026.pdf';

  console.log(`Loading HTML from: ${HTML_PATH}`);
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`HTML source file not found: ${HTML_PATH}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  await page.emulateMediaType('print');
  await page.goto('file:///' + HTML_PATH.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  console.log('Generating A4 print PDF in memory...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();

  console.log('Validating physical PDF page count...');
  const pdfData = await pdfParse(pdfBuffer);
  console.log(`Measured PDF page count: ${pdfData.numpages}`);

  if (pdfData.numpages !== 13) {
    throw new Error(`PDF page count mismatch: got ${pdfData.numpages}, expected exactly 13!`);
  }

  fs.writeFileSync(PDF_DEST, pdfBuffer);
  console.log(`✅ Successfully compiled 13-page PDF to ${PDF_DEST} (${pdfBuffer.length} bytes)`);
}

compileReportPdf().catch(err => {
  console.error('❌ Failed to compile PDF:', err);
  process.exit(1);
});
