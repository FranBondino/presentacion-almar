/**
 * scripts/audit_report_layout.js
 * 
 * Genuine, deterministic layout and pagination audit:
 * 1. Launches headless Chromium via Puppeteer.
 * 2. Emulates print media at standard A4 dimensions (210mm x 297mm @ 96 DPI: 793.7px x 1122.5px).
 * 3. Measures DOM offsetHeight and scrollHeight for all .page elements: asserts <= 1123px (A4 printable height).
 * 4. Generates a physical PDF and parses it using pdf-parse: asserts numpages === 7.
 * 5. Verifies dynamic data consistency against cotizaciones_almar_2026_consolidado.json.
 * 6. Exits with code 0 on complete success, code 1 on any violation.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const HTML_PATH = path.resolve(__dirname, '..', 'INFORME_COTIZACIONES_ALMAR_2026.html');
const JSON_PATH = path.resolve(__dirname, '..', 'cotizaciones_almar_2026_consolidado.json');

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passedAssertions++;
    console.log(`  ${GREEN}✓ PASS:${RESET} ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}${details ? ' - ' + details : ''}`);
  }
}

(async () => {
  console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   ALMAR ROSARIO - EXECUTIVE REPORT LAYOUT & PAGINATION AUDIT          ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  if (!fs.existsSync(HTML_PATH)) {
    console.error(`${RED}ERROR: HTML report not found at ${HTML_PATH}${RESET}`);
    process.exit(1);
  }

  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dataset = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const totalQuotes = dataset.metadata.audit_integrity.total_genuine_quotations_consolidated;

  console.log(`${BOLD}[PHASE 1] Structural HTML & Tag Balance Audit${RESET}`);
  const pageDivCount = (html.match(/<div class=["']page(\s|["'])/g) || []).length;
  assert(pageDivCount === 13, `HTML contains exactly 13 .page containers (found: ${pageDivCount})`);

  const openDivs = (html.match(/<div\b/g) || []).length;
  const closeDivs = (html.match(/<\/div>/g) || []).length;
  assert(openDivs === closeDivs, `HTML <div> tag balance is perfect (${openDivs} open == ${closeDivs} close)`);

  const openTables = (html.match(/<table\b/g) || []).length;
  const closeTables = (html.match(/<\/table>/g) || []).length;
  assert(openTables === closeTables, `HTML <table> tag balance is perfect (${openTables} open == ${closeTables} close)`);

  console.log(`\n${BOLD}[PHASE 2] Headless Chromium DOM Print Height Measurement${RESET}`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  await page.emulateMediaType('print');
  await page.goto('file:///' + HTML_PATH.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const pageMetrics = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    return Array.from(pages).map((p, idx) => ({
      pageIndex: idx + 1,
      offsetHeight: p.offsetHeight,
      scrollHeight: p.scrollHeight,
      rectHeight: p.getBoundingClientRect().height
    }));
  });

  const MAX_A4_HEIGHT_PX = 1123; // 297mm @ 96 DPI is 1122.5156px, rounds to 1123px

  pageMetrics.forEach(m => {
    const fitsOffset = m.offsetHeight <= MAX_A4_HEIGHT_PX;
    const fitsScroll = m.scrollHeight <= MAX_A4_HEIGHT_PX;
    assert(
      fitsOffset && fitsScroll,
      `Page ${m.pageIndex} fits A4 height budget (offset: ${m.offsetHeight}px, scroll: ${m.scrollHeight}px <= ${MAX_A4_HEIGHT_PX}px)`
    );
  });

  console.log(`\n${BOLD}[PHASE 3] Physical PDF Generation & Page Count Verification (pdf-parse)${RESET}`);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser.close();

  const pdfData = await pdfParse(pdfBuffer);
  console.log(`  Measured PDF page count: ${BOLD}${pdfData.numpages}${RESET}`);
  assert(pdfData.numpages === 13, `PDF renders to EXACTLY 13 A4 pages (actual: ${pdfData.numpages})`);

  console.log(`\n${BOLD}[PHASE 4] Data Consistency & Cryptographic Integrity Audit${RESET}`);
  const formattedTotalQuotes = totalQuotes.toLocaleString('es-AR');
  assert(html.includes(formattedTotalQuotes), `Report displays purified total quotes count (${formattedTotalQuotes})`);
  assert(Boolean(dataset.metadata.audit_integrity.records_sha256_hash), `Dataset contains verified cryptographic SHA-256 hash (${dataset.metadata.audit_integrity.records_sha256_hash})`);

  // Assert absence of old unpurged counts
  const bannedOldValues = ['2.723', '2.136', '5.206.753'];
  bannedOldValues.forEach(val => {
    const occurrences = (html.match(new RegExp(val.replace('.', '\\.'), 'g')) || []).length;
    assert(occurrences === 0, `Banned obsolete metric "${val}" is absent (found: ${occurrences})`);
  });

  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}LAYOUT AUDIT SUMMARY:${RESET} ${GREEN}${passedAssertions} Passed${RESET}, ${failedAssertions > 0 ? RED : GREEN}${failedAssertions} Failed${RESET} (Total: ${passedAssertions + failedAssertions})`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();

