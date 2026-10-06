const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Canonical HTML is Administracion, Facturacion y Finanzas
    const targetHtml = path.resolve(__dirname, '../2026.09.25-Resumen Relevamiento-PO03 Administracion, Facturacion y Finanzas.html');
    const legacyHtml = path.resolve(__dirname, '../2026.09.25-Resumen Relevamiento-PO03 Facturacion y Finanzas.html');
    
    // Sync canonical HTML to legacy HTML
    fs.copyFileSync(targetHtml, legacyHtml);
    
    const fileUrl = 'file:///' + targetHtml.replace(/\\/g, '/');
    console.log('Cargando HTML canónico:', fileUrl);
    
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    const pdfPath = path.resolve(__dirname, '../2026.09.25-Resumen Relevamiento-PO03 Administracion, Facturacion y Finanzas.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm'
      }
    });
    
    console.log('PDF generado en workspace:', pdfPath);
    console.log('Tamaño PDF:', fs.statSync(pdfPath).size, 'bytes');

    // Also copy to Downloads folder with both names for maximum convenience
    const downloadsPath1 = 'C:/Users/franc/Downloads/2026.09.25-Resumen Relevamiento-PO03 Administracion, Facturacion y Finanzas.pdf';
    const downloadsPath2 = 'C:/Users/franc/Downloads/2026.09.25-Resumen Relevamiento-PO03 Facturacion y Finanzas.pdf';
    
    fs.copyFileSync(pdfPath, downloadsPath1);
    fs.copyFileSync(pdfPath, downloadsPath2);
    
    console.log('Copia 1 guardada en Downloads:', downloadsPath1);
    console.log('Copia 2 guardada en Downloads:', downloadsPath2);
    
    await browser.close();
    console.log('Compilación finalizada con éxito.');
  } catch (err) {
    console.error('Error generando PDF:', err);
    process.exit(1);
  }
})();
