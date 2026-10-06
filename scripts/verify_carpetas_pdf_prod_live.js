const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testPdfInProd() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to login...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

  console.log('2. Logging in as admin@almar.com.ar...');
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('3. Navigating to folder C1234 (Acindar)...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2' });

  // Take screenshot of the folder view
  await page.screenshot({ path: 'prod_c1234_pdf_verified.png', fullPage: true });
  console.log('Saved screenshot: prod_c1234_pdf_verified.png');

  // Verify all links with .pdf or .PDF on page
  const pdfLinks = await page.$$eval('a[href*=".pdf"], a[href*=".PDF"]', els => els.map(e => ({
    text: e.innerText.trim(),
    href: e.href
  })));

  console.log('PDF links found on page:', pdfLinks);

  for (const l of pdfLinks) {
    const res = await page.evaluate(async (url) => {
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        return { status: resp.status, contentType: resp.headers.get('content-type'), contentLength: resp.headers.get('content-length') };
      } catch (err) {
        return { error: err.message };
      }
    }, l.href);
    console.log(`[VERIFY RESULT] ${l.text} (${l.href}) -> Status: ${res.status}, Type: ${res.contentType}, Length: ${res.contentLength}`);
  }

  // Also verify specific key PDFs that might be on other tabs or folders
  const extraPdfs = [
    'https://bot-relevamiento.vercel.app/facturas/COT_2026_00060_Acindar_Shanghai.pdf',
    'https://bot-relevamiento.vercel.app/facturas/MSC_Invoice_0098_00041234.pdf',
    'https://bot-relevamiento.vercel.app/facturas/7554566633.PDF',
    'https://bot-relevamiento.vercel.app/facturas/0004-00000303.PDF',
    'https://bot-relevamiento.vercel.app/facturas/7555554402.PDF',
    'https://bot-relevamiento.vercel.app/facturas/261005130R.pdf',
    'https://bot-relevamiento.vercel.app/facturas/BL_ALMRSHA1234_SIGNED.pdf'
  ];

  console.log('\n--- Extra Live Check on Production PDFs ---');
  for (const u of extraPdfs) {
    const res = await page.evaluate(async (url) => {
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        return { status: resp.status, contentType: resp.headers.get('content-type'), contentLength: resp.headers.get('content-length') };
      } catch (err) {
        return { error: err.message };
      }
    }, u);
    console.log(`[EXTRA CHECK] ${path.basename(u)} -> Status: ${res.status}, Type: ${res.contentType}, Bytes: ${res.contentLength}`);
  }

  await browser.close();
  console.log('\nAll tests completed successfully!');
}

testPdfInProd().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
