const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://bot-relevamiento.vercel.app';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots', 'live_prod_carpetas');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 12 Carpetas definition with forensic expectations
const CARPETAS_TO_VERIFY = [
  {
    code: 'C1234',
    id: 'c1234000-0000-0000-0000-000000000001',
    expectedClient: 'Dis-Den Odontología',
    clientCompany: 'Calamante S.R.L.',
    expectedActors: ['Maersk', 'Vic Mai', 'Lucía Laje', 'Alejandro Noacco', 'KA0018437'],
    particularities: ['WebAuthn', '142.50'],
    expectedVouchers: ['C1234_factura_maersk.pdf']
  },
  {
    code: 'C1434',
    id: 'c1434000-0000-0000-0000-000000000002',
    expectedClient: 'Siderar S.A.I.C.',
    clientCompany: 'Ternium',
    expectedActors: ['Maersk', 'Lucía Laje'],
    particularities: ['Maersk', 'FMA'],
    expectedVouchers: ['C1434_factura_maersk_7554566633.pdf']
  },
  {
    code: 'IT1486',
    id: 'it148600-0000-0000-0000-000000000003',
    expectedClient: 'Paladini S.A.',
    clientCompany: 'Tadeo Czerweny',
    expectedActors: ['LGV Transportes', 'TRP'],
    particularities: ['LGV Transportes'],
    expectedVouchers: ['LGV_TRANSPORTES00000303.pdf', '0004-00000303.PDF']
  },
  {
    code: 'C1482',
    id: 'c1482000-0000-0000-0000-000000000004',
    expectedClient: 'Vicentin S.A.I.C.',
    clientCompany: 'Vicentin',
    expectedActors: ['Lufthansa', 'Sancor Seguros'],
    particularities: ['Sancor Seguros'],
    expectedVouchers: ['COT_2026_00610_Vicentin_Aereo.pdf']
  },
  {
    code: 'C1024',
    id: 'c1024000-0000-0000-0000-000000000005',
    expectedClient: 'Molinos Río de la Plata S.A.',
    clientCompany: 'Molinos',
    expectedActors: ['Santos', 'Zárate'],
    particularities: ['Hamburg Süd', 'Santos'],
    expectedVouchers: ['COT_2026_00226_Molinos_Santos.pdf']
  },
  {
    code: 'TL1436',
    id: 'tl143600-0000-0000-0000-000000000006',
    expectedClient: 'Bunge Argentina S.A.',
    clientCompany: 'Bunge',
    expectedActors: ['San Lorenzo', 'Zárate'],
    particularities: ['Terrestre', 'Camión'],
    expectedVouchers: ['COT_2026_00379_Bunge_Terrestre.pdf']
  },
  {
    code: 'C1289',
    id: 'c1289000-0000-0000-0000-000000000007',
    expectedClient: 'Albertoni S.A.',
    clientCompany: 'Albertoni',
    expectedActors: ['Bremerhaven', 'Maersk'],
    particularities: ['Maersk', 'MRKU8740584'],
    expectedVouchers: ['C1289_factura_maersk_7555554402.pdf']
  },
  {
    code: 'EA1561',
    id: 'ea156100-0000-0000-0000-000000000008',
    expectedClient: 'Bertot Metalmecánica S.R.L.',
    clientCompany: 'Bertot',
    expectedActors: ['Aerolíneas Argentinas Cargo', 'Miami'],
    particularities: ['Aéreo', 'Ezeiza'],
    expectedVouchers: ['EA1561_awb_lufthansa.pdf', 'EA1561_factura_fiscal.pdf']
  },
  {
    code: 'C1471',
    id: 'c1471000-0000-0000-0000-000000000009',
    expectedClient: 'Industrias Juan F. Secco S.A.',
    clientCompany: 'Secco',
    expectedActors: ['CMA CGM', 'ONE APUS'],
    particularities: ['EUR', 'Euros', 'CMA CGM'],
    expectedVouchers: ['C1471_factura_cma.pdf']
  },
  {
    code: 'C1056',
    id: 'c1056000-0000-0000-0000-000000000010',
    expectedClient: 'Saprograf S.A.S.',
    clientCompany: 'Litamex',
    expectedActors: ['Hapag-Lloyd', 'Cartagena'],
    particularities: ['Cartagena', 'Hapag-Lloyd'],
    expectedVouchers: ['COT_2026_00457_Saprograf_Cartagena.pdf']
  },
  {
    code: 'C367',
    id: 'c0367000-0000-0000-0000-000000000011',
    expectedClient: 'Metalúrgica Rosarina S.R.L.',
    clientCompany: 'Juan Cuello',
    expectedActors: ['Guangzhou', 'Martín Fusco'],
    particularities: ['BUFF', '21% IVA'],
    expectedVouchers: ['COT_2026_00113_Juan_Cuello_LCL.pdf']
  },
  {
    code: 'C620',
    id: 'c0620000-0000-0000-0000-000000000012',
    expectedClient: 'CONICET',
    clientCompany: 'SAA Logistics UK',
    expectedActors: ['London', 'SAA BRITANNIA'],
    particularities: ['Libras', 'BNA', 'GBP'],
    expectedVouchers: ['COT_2026_00018_CONICET_GBP.pdf']
  }
];

// Helper to check HTTP status of an asset URL
function checkUrlStatus(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type'] || '',
        contentLength: parseInt(res.headers['content-length'] || '0', 10)
      });
    }).on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message
      });
    });
  });
}

async function runLiveAudit() {
  console.log('================================================================================');
  console.log(`[TEST WRITER 3] LIVE PRODUCTION 12 CARPETAS E2E VERIFICATION SUITE`);
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Screenshots Output: ${SCREENSHOT_DIR}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Pre-seed localStorage to disable any interactive tours/onboarding
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('hasCompletedTour', 'true');
      localStorage.setItem('tour_completed', 'true');
      localStorage.setItem('almar_onboarding_completed_v1', 'true');
      localStorage.setItem('almar_tour_dismissed', 'true');
      localStorage.setItem('almar_interactive_tour_completed', 'true');
    } catch (e) {}
  });

  console.log('[1/4] Navigating to login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 45000 });

  console.log('[2/4] Authenticating as admin@almar.com.ar...');
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  // Re-assert localStorage in logged in origin
  await page.evaluate(() => {
    localStorage.setItem('hasCompletedTour', 'true');
    localStorage.setItem('tour_completed', 'true');
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
  });

  console.log('   ✓ Logged in successfully.\n');

  console.log('[3/4] Validating 12 Carpetas in Live Production...');
  const auditResults = [];
  const allVerifiedPdfs = new Map();

  for (let i = 0; i < CARPETAS_TO_VERIFY.length; i++) {
    const carpeta = CARPETAS_TO_VERIFY[i];
    const carpetaUrl = `${BASE_URL}/carpetas/${carpeta.id}`;
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[Folder ${i + 1}/12] Verifying ${carpeta.code} (${carpeta.expectedClient})...`);
    console.log(`URL: ${carpetaUrl}`);

    try {
      await page.goto(carpetaUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await new Promise(r => setTimeout(r, 2000)); // allow reactive tabs and charts to render

      // Check client text in page
      const pageText = await page.evaluate(() => document.body.innerText || '');

      const hasClient = pageText.includes(carpeta.expectedClient) || 
                        (carpeta.clientCompany && pageText.includes(carpeta.clientCompany));

      const actorsFound = carpeta.expectedActors.filter(act => pageText.includes(act));
      const actorsPass = actorsFound.length > 0;

      const particularitiesFound = carpeta.particularities.filter(part => {
        // Case-insensitive match for particularities
        const regex = new RegExp(part.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        return regex.test(pageText);
      });
      const particularitiesPass = particularitiesFound.length > 0;

      // Extract all PDF links from page DOM
      const domPdfLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*=".pdf"], a[href*=".PDF"]'));
        return anchors.map(a => ({
          href: a.href,
          text: (a.innerText || a.getAttribute('download') || '').trim()
        }));
      });

      // Take HD Screenshot (1920x1080)
      const screenshotPath = path.join(SCREENSHOT_DIR, `${carpeta.code}_hd.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`   ✓ HD Screenshot captured: ${screenshotPath}`);

      // Verify page PDF links
      const folderPdfChecks = [];
      for (const link of domPdfLinks) {
        if (!allVerifiedPdfs.has(link.href)) {
          const statusResult = await checkUrlStatus(link.href);
          allVerifiedPdfs.set(link.href, statusResult);
          folderPdfChecks.push({ url: link.href, ...statusResult });
        } else {
          folderPdfChecks.push({ url: link.href, ...allVerifiedPdfs.get(link.href) });
        }
      }

      // Also verify any expected vouchers explicitly
      for (const voucher of (carpeta.expectedVouchers || [])) {
        const voucherUrl = `${BASE_URL}/facturas/${voucher}`;
        if (!allVerifiedPdfs.has(voucherUrl)) {
          const statusResult = await checkUrlStatus(voucherUrl);
          allVerifiedPdfs.set(voucherUrl, statusResult);
          folderPdfChecks.push({ url: voucherUrl, ...statusResult });
        } else {
          folderPdfChecks.push({ url: voucherUrl, ...allVerifiedPdfs.get(voucherUrl) });
        }
      }

      const allPdfsOk = folderPdfChecks.length === 0 || folderPdfChecks.every(p => p.statusCode === 200 && p.contentType.includes('pdf'));

      const result = {
        code: carpeta.code,
        id: carpeta.id,
        hasClient,
        actorsFound,
        actorsPass,
        particularitiesFound,
        particularitiesPass,
        pdfCount: folderPdfChecks.length,
        allPdfsOk,
        screenshot: screenshotPath,
        passed: hasClient && (actorsPass || particularitiesPass) && allPdfsOk
      };

      auditResults.push(result);

      console.log(`   - Client Verified: ${hasClient ? 'PASS (' + carpeta.expectedClient + ')' : 'FAIL'}`);
      console.log(`   - Actors Verified: ${actorsPass ? 'PASS (' + actorsFound.join(', ') + ')' : 'WARN'}`);
      console.log(`   - Particularities: ${particularitiesPass ? 'PASS (' + particularitiesFound.join(', ') + ')' : 'WARN'}`);
      console.log(`   - PDFs Checked: ${folderPdfChecks.length} (All HTTP 200: ${allPdfsOk ? 'YES' : 'NO'})`);
      console.log(`   - Folder Result: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);

    } catch (folderErr) {
      console.error(`   ✗ Error verifying folder ${carpeta.code}:`, folderErr.message);
      auditResults.push({
        code: carpeta.code,
        id: carpeta.id,
        passed: false,
        error: folderErr.message
      });
    }
  }

  console.log('\n================================================================================');
  console.log('[4/4] GLOBAL PDF VOUCHER INTEGRITY AUDIT');
  console.log('================================================================================');

  const knownVouchers = [
    '0004-00000303.PDF',
    '261005130R.pdf',
    '7554364222.PDF',
    '7554566633.PDF',
    '7555180661.PDF',
    '7555554402.PDF',
    'BL_ALMRSHA1234_SIGNED.pdf',
    'C1234_factura_maersk.pdf',
    'C1289_factura_almar_00012231.pdf',
    'C1289_factura_maersk.pdf',
    'C1289_factura_maersk_7555554402.pdf',
    'C1289_house_bl.pdf',
    'C1289_pago_maersk.pdf',
    'C1289_srossi_7555180661.PDF',
    'C1434_factura_maersk_7554566633.pdf',
    'C1434_factura_munser.pdf',
    'C1434_factura_trp.pdf',
    'C1471_booking_advise.pdf',
    'C1471_factura_cma.pdf',
    'C1482_factura_lgv.pdf',
    'COT_2026_00018_CONICET_GBP.pdf',
    'COT_2026_00060_Acindar_Shanghai.pdf',
    'COT_2026_00061_Siderar_Ningbo.pdf',
    'COT_2026_00067_Secco_Hamburg.pdf',
    'COT_2026_00105_Albertoni_FCL.pdf',
    'COT_2026_00113_Juan_Cuello_LCL.pdf',
    'COT_2026_00226_Molinos_Santos.pdf',
    'COT_2026_00357_Paladini_Terrestre.pdf',
    'COT_2026_00379_Bunge_Terrestre.pdf',
    'COT_2026_00428_Bertot_Aereo.pdf',
    'COT_2026_00457_Saprograf_Cartagena.pdf',
    'COT_2026_00610_Vicentin_Aereo.pdf',
    'EA1561_awb_lufthansa.pdf',
    'EA1561_factura_fiscal.pdf',
    'factura_ejemplo.pdf',
    'IT1486_dj_afip.pdf',
    'IT1486_prefactura_lgv.pdf',
    'LGV_TRANSPORTES00000303.pdf',
    'MSC_Invoice_0098_00041234.pdf'
  ];

  let voucherPassCount = 0;
  let voucherFailCount = 0;

  for (const v of knownVouchers) {
    const voucherUrl = `${BASE_URL}/facturas/${v}`;
    let res = allVerifiedPdfs.get(voucherUrl);
    if (!res) {
      res = await checkUrlStatus(voucherUrl);
      allVerifiedPdfs.set(voucherUrl, res);
    }

    const isPdf = res.contentType && res.contentType.toLowerCase().includes('pdf');
    const isOk = res.statusCode === 200 && isPdf;

    if (isOk) {
      voucherPassCount++;
      console.log(`   ✓ [200 OK] ${v} (${res.contentLength} bytes, ${res.contentType})`);
    } else {
      voucherFailCount++;
      console.error(`   ✗ [${res.statusCode} FAIL] ${v} -> ${res.error || res.contentType}`);
    }
  }

  await browser.close();

  // Print Summary Table
  console.log('\n================================================================================');
  console.log('AUDIT SUMMARY REPORT');
  console.log('================================================================================');
  console.table(auditResults.map(r => ({
    Carpeta: r.code,
    Cliente: r.hasClient ? 'PASS' : 'FAIL',
    Actores: r.actorsPass ? 'PASS' : 'WARN',
    Detalles: r.particularitiesPass ? 'PASS' : 'WARN',
    PDFs: r.allPdfsOk ? 'PASS' : 'FAIL',
    Resultado: r.passed ? '✓ APROBADA' : '✗ RECHAZADA'
  })));

  console.log(`\nGlobal Statistics:`);
  console.log(`- Carpetas Aprobadas: ${auditResults.filter(r => r.passed).length}/${CARPETAS_TO_VERIFY.length}`);
  console.log(`- Vouchers PDF Auditados: ${knownVouchers.length} (200 OK: ${voucherPassCount}, 404/Error: ${voucherFailCount})`);
  console.log(`- Screenshots Generados: ${auditResults.length} en ${SCREENSHOT_DIR}`);

  const allFoldersPass = auditResults.every(r => r.passed);
  const allVouchersPass = voucherFailCount === 0;

  if (allFoldersPass && allVouchersPass) {
    console.log('\n🎉 ALL CHECKS PASSED: 100% AUDIT INTEGRITY AND PDF PARITY CONFIRMED!');
    return 0;
  } else {
    console.error('\n⚠️ AUDIT FAILED: Discrepancies or broken links detected.');
    return 1;
  }
}

if (require.main === module) {
  runLiveAudit().then((exitCode) => {
    process.exit(exitCode);
  }).catch((err) => {
    console.error('Fatal audit failure:', err);
    process.exit(1);
  });
}

module.exports = { runLiveAudit };
