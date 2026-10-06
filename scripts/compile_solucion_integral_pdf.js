/**
 * compile_solucion_integral_pdf.js
 * Automated Headless PDF Compilation for ALMAR Rosario Executive Solution Summary
 * Generates vector print-ready A4 PDF: ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.pdf
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');

async function compileSolucionIntegralPdf() {
  const rootDir = path.resolve(__dirname, '..');
  const htmlPath = path.join(rootDir, 'ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.html');
  const destPdf = path.join(rootDir, 'ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.pdf');
  const downloadsPdf = 'C:\\Users\\franc\\Downloads\\ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.pdf';

  console.log('=== Compilador Automatizado de PDF Clave Consultora ===');
  console.log('Archivo HTML origen:', htmlPath);

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`El archivo HTML fuente no existe: ${htmlPath}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // 794 x 1123 px corresponds to 210mm x 297mm at 96 DPI
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  await page.emulateMediaType('print');

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  console.log('Navegando a URL:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Optional: check DOM page count
  const domPageCount = await page.evaluate(() => document.querySelectorAll('.page').length);
  console.log(`Páginas detectadas en el DOM: ${domPageCount}`);

  console.log('Generando PDF vectorial en formato A4...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true
  });

  await browser.close();

  // Validate PDF with pdf-parse
  console.log('Validando integridad del PDF generado...');
  const pdfData = await pdfParse(pdfBuffer);
  console.log(`Conteo físico de páginas en el PDF: ${pdfData.numpages}`);

  if (pdfData.numpages !== domPageCount) {
    console.warn(`Advertencia: Páginas en PDF (${pdfData.numpages}) difiere de páginas en DOM (${domPageCount}).`);
  }

  // Write to destination
  fs.writeFileSync(destPdf, pdfBuffer);
  console.log(`✅ PDF guardado con éxito en: ${destPdf} (${pdfBuffer.length} bytes)`);

  // Copy to Downloads folder if accessible
  try {
    const downloadsDir = path.dirname(downloadsPdf);
    if (fs.existsSync(downloadsDir)) {
      fs.writeFileSync(downloadsPdf, pdfBuffer);
      console.log(`✅ Copia respaldada en Descargas: ${downloadsPdf}`);
    }
  } catch (err) {
    console.warn('No se pudo copiar a Descargas:', err.message);
  }

  // Final assertions
  const stats = fs.statSync(destPdf);
  if (stats.size === 0) {
    throw new Error('Error crítico: El archivo PDF resultante tiene 0 bytes.');
  }

  console.log(`=== Proceso completado exitosamente: ${stats.size} bytes, ${pdfData.numpages} páginas ===`);
  return {
    path: destPdf,
    size: stats.size,
    pages: pdfData.numpages
  };
}

if (require.main === module) {
  compileSolucionIntegralPdf().catch(err => {
    console.error('❌ Error fatal en la compilación del PDF:', err);
    process.exit(1);
  });
}

module.exports = { compileSolucionIntegralPdf };
