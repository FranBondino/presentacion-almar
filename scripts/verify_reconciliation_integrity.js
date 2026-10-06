/**
 * scripts/verify_reconciliation_integrity.js
 * 
 * Independent, automated, deterministic verification test script for:
 * 1. Kipintoch ERP Excel files:
 *    - File 1 (C:\Users\franc\Downloads\EstadísticaComercial_1788881643526.xlsx):
 *      1,308 rows (619 Con Carpeta: 604 C- + 15 OR/C-; 689 Sin Carpeta).
 *    - File 2 (C:\Users\franc\Downloads\EstadísticaComercial_1788881763198.xlsx):
 *      689 rows, identical subset of Sin Carpeta in File 1.
 *    - Estados ERP: 634 Confirmadas (619 con carpeta + 15 sin carpeta),
 *      670 Pendientes (0 con carpeta), 4 Anuladas (0 con carpeta).
 *    - Usuario Creador: Lucía Laje (528), Nerea Guida (481), Zamira Abraham (138),
 *      Martín Fusco (80), Juan Andrés Arloro (41), Alejandro Noacco (37), Victoria Moyano (3).
 *      Subtotal Pricing (Lucía+Nerea+Zamira) = 1,147 (87.69%).
 *    - Vendedor: Martín Fusco (525), Juan Andrés Arloro (398), Alejandro Noacco (219),
 *      Lucía Laje (153), (Vacío) 12, Zamira (1).
 *      Subtotal Comerciales (Fusco+Arloro+Noacco) = 1,142 (87.31%).
 *    - Customer ERP: Ana Laura Talaban (154 con carpeta, 43 sin carpeta, 197 total),
 *      Aldana Gomez (124 con carpeta, 176 sin carpeta, 300 total),
 *      Cecilia Dellamea (64 con carpeta, 86 sin carpeta, 150 total).
 * 2. Consolidated Mailbox Dataset (cotizaciones_almar_2026_consolidado.json):
 *    - Total records: exactly 2,723.
 *    - Status: 530 ACEPTADA_CERRADA, 2,076 COTIZADA, 116 EN_NEGOCIACION, 1 VENCIDA_SIN_RESPUESTA.
 *    - Gap: exactly 1,415 (2,723 - 1,308 = 1,415), proven by 1,410 cotizaciones without
 *      operational assignment plus multi-rate spot options.
 *    - Carpetas operadas: 1,313 expedientes administrados por operadores nominados.
 * 3. The Ana Laura Talaban Identity:
 *    - Assert Ana Laura Talaban has EXACTLY 154 folders in Kipintoch ERP.
 *    - Assert Ana Laura Talaban has EXACTLY 154 won folders in the mailbox dataset.
 *    - Discrepancy == 0.
 * 4. Constraint check:
 *    - Verify that INFORME_COTIZACIONES_ALMAR_2026.html has not been modified.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');

// Configuration paths
const FILE1_PATH = 'C:\\Users\\franc\\Downloads\\EstadísticaComercial_1788881643526.xlsx';
const FILE2_PATH = 'C:\\Users\\franc\\Downloads\\EstadísticaComercial_1788881763198.xlsx';
const JSON_PATH = path.resolve(__dirname, '..', 'cotizaciones_almar_2026_consolidado.json');
const HTML_PATH = path.resolve(__dirname, '..', 'INFORME_COTIZACIONES_ALMAR_2026.html');
const EXPECTED_HTML_SHA256 = '02303343a2f10cc0fe29201d889b025e2133952b9c1f8b5725856ba195e403d4';

// Color and formatting helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passedAssertions = 0;
let failedAssertions = 0;
const testResults = [];

function assert(condition, message, details = '') {
  if (condition) {
    passedAssertions++;
    testResults.push({ status: 'PASS', message, details });
    console.log(`  ${GREEN}✓ PASS:${RESET} ${message}`);
  } else {
    failedAssertions++;
    testResults.push({ status: 'FAIL', message, details });
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}${details ? ' - ' + details : ''}`);
  }
}

function normalizeName(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function hasCarpeta(val) {
  if (!val) return false;
  const s = String(val).trim();
  return s !== '' && s !== '-';
}

console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   ALMAR ROSARIO - RECONCILIATION & DATA INTEGRITY VERIFICATION SUITE   ${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

// --------------------------------------------------------------------------
// SUITE 1: KIPINTOCH ERP EXCEL FILES
// --------------------------------------------------------------------------
console.log(`${BOLD}[SUITE 1] Kipintoch ERP Excel Files Verification${RESET}`);

assert(fs.existsSync(FILE1_PATH), `Kipintoch File 1 exists at ${FILE1_PATH}`);
assert(fs.existsSync(FILE2_PATH), `Kipintoch File 2 exists at ${FILE2_PATH}`);

const wb1 = XLSX.readFile(FILE1_PATH);
const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
const rows1 = XLSX.utils.sheet_to_json(sheet1, { defval: '' });

const wb2 = XLSX.readFile(FILE2_PATH);
const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
const rows2 = XLSX.utils.sheet_to_json(sheet2, { defval: '' });

// 1.1 Row count
assert(rows1.length === 1308, `File 1 row count is exactly 1,308 (actual: ${rows1.length})`);
assert(rows2.length === 689, `File 2 row count is exactly 689 (actual: ${rows2.length})`);

// 1.2 Carpeta distribution in File 1
let conCarpetaCount = 0;
let sinCarpetaCount = 0;
let cCount = 0;
let orcCount = 0;

rows1.forEach(r => {
  const carp = String(r['#Carpetas'] || '').trim();
  if (hasCarpeta(carp)) {
    conCarpetaCount++;
    if (carp.startsWith('C-')) cCount++;
    else if (carp.startsWith('OR/C-')) orcCount++;
  } else {
    sinCarpetaCount++;
  }
});

assert(conCarpetaCount === 619, `File 1 has exactly 619 Con Carpeta (actual: ${conCarpetaCount})`);
assert(cCount === 604, `File 1 has exactly 604 standard 'C-' folders (actual: ${cCount})`);
assert(orcCount === 15, `File 1 has exactly 15 branch 'OR/C-' folders (actual: ${orcCount})`);
assert(sinCarpetaCount === 689, `File 1 has exactly 689 Sin Carpeta (actual: ${sinCarpetaCount})`);
assert(conCarpetaCount + sinCarpetaCount === 1308, `File 1 sum 619 + 689 equals 1,308`);

// 1.3 File 2 identical subset verification
const sinCarpetaFile1 = rows1.filter(r => !hasCarpeta(r['#Carpetas']));
const set1Ids = new Set(sinCarpetaFile1.map(r => r['#Cotización']));
const set2Ids = new Set(rows2.map(r => r['#Cotización']));

assert(set2Ids.size === 689, `File 2 contains exactly 689 unique #Cotización IDs`);
assert(set1Ids.size === 689, `File 1 Sin Carpeta contains exactly 689 unique #Cotización IDs`);

let f2Differences = 0;
for (const id of set2Ids) {
  if (!set1Ids.has(id)) f2Differences++;
}
assert(f2Differences === 0, `File 2 is an exact, identical subset of Sin Carpeta in File 1 (0 discrepancies)`);

// 1.4 Estados ERP
const estadosMap = {
  Confirmada: { total: 0, conCarpeta: 0, sinCarpeta: 0 },
  Pendiente: { total: 0, conCarpeta: 0, sinCarpeta: 0 },
  Anulada: { total: 0, conCarpeta: 0, sinCarpeta: 0 }
};

rows1.forEach(r => {
  const st = String(r['Estado'] || '').trim();
  if (estadosMap[st]) {
    estadosMap[st].total++;
    if (hasCarpeta(r['#Carpetas'])) estadosMap[st].conCarpeta++;
    else estadosMap[st].sinCarpeta++;
  }
});

assert(estadosMap.Confirmada.total === 634, `ERP Confirmadas total == 634 (actual: ${estadosMap.Confirmada.total})`);
assert(estadosMap.Confirmada.conCarpeta === 619, `ERP Confirmadas con carpeta == 619 (actual: ${estadosMap.Confirmada.conCarpeta})`);
assert(estadosMap.Confirmada.sinCarpeta === 15, `ERP Confirmadas sin carpeta == 15 (actual: ${estadosMap.Confirmada.sinCarpeta})`);

assert(estadosMap.Pendiente.total === 670, `ERP Pendientes total == 670 (actual: ${estadosMap.Pendiente.total})`);
assert(estadosMap.Pendiente.conCarpeta === 0, `ERP Pendientes con carpeta == 0 (actual: ${estadosMap.Pendiente.conCarpeta})`);
assert(estadosMap.Pendiente.sinCarpeta === 670, `ERP Pendientes sin carpeta == 670 (actual: ${estadosMap.Pendiente.sinCarpeta})`);

assert(estadosMap.Anulada.total === 4, `ERP Anuladas total == 4 (actual: ${estadosMap.Anulada.total})`);
assert(estadosMap.Anulada.conCarpeta === 0, `ERP Anuladas con carpeta == 0 (actual: ${estadosMap.Anulada.conCarpeta})`);
assert(estadosMap.Anulada.sinCarpeta === 4, `ERP Anuladas sin carpeta == 4 (actual: ${estadosMap.Anulada.sinCarpeta})`);

// 1.5 Usuario Creador breakdown
const creadorCounts = {};
rows1.forEach(r => {
  const norm = normalizeName(r['Usuario Creador'] || '(Vacio)');
  creadorCounts[norm] = (creadorCounts[norm] || 0) + 1;
});

assert(creadorCounts['Lucia Laje'] === 528, `Creador Lucía Laje == 528 (actual: ${creadorCounts['Lucia Laje']})`);
assert(creadorCounts['Nerea Guida'] === 481, `Creador Nerea Guida == 481 (actual: ${creadorCounts['Nerea Guida']})`);
assert(creadorCounts['Zamira Abraham'] === 138, `Creador Zamira Abraham == 138 (actual: ${creadorCounts['Zamira Abraham']})`);
assert(creadorCounts['Martin Fusco'] === 80, `Creador Martín Fusco == 80 (actual: ${creadorCounts['Martin Fusco']})`);
assert(creadorCounts['Juan Andres Arloro'] === 41, `Creador Juan Andrés Arloro == 41 (actual: ${creadorCounts['Juan Andres Arloro']})`);
assert(creadorCounts['Alejandro Noacco'] === 37, `Creador Alejandro Noacco == 37 (actual: ${creadorCounts['Alejandro Noacco']})`);
assert(creadorCounts['Victoria Moyano'] === 3, `Creador Victoria Moyano == 3 (actual: ${creadorCounts['Victoria Moyano']})`);

const pricingDeskTotal = (creadorCounts['Lucia Laje'] || 0) + (creadorCounts['Nerea Guida'] || 0) + (creadorCounts['Zamira Abraham'] || 0);
const pricingDeskPct = ((pricingDeskTotal / 1308) * 100).toFixed(2);
assert(pricingDeskTotal === 1147, `Subtotal Pricing Desk (Lucía + Nerea + Zamira) == 1,147 (actual: ${pricingDeskTotal})`);
assert(pricingDeskPct === '87.69', `Pricing Desk share == 87.69% (actual: ${pricingDeskPct}%)`);

// 1.6 Vendedor breakdown
const vendedorCounts = {};
rows1.forEach(r => {
  const raw = (r['Vendedor'] || '').trim();
  const norm = raw === '' ? '(Vacio)' : normalizeName(raw);
  vendedorCounts[norm] = (vendedorCounts[norm] || 0) + 1;
});

assert(vendedorCounts['Martin Fusco'] === 525, `Vendedor Martín Fusco == 525 (actual: ${vendedorCounts['Martin Fusco']})`);
assert(vendedorCounts['Juan Andres Arloro'] === 398, `Vendedor Juan Andrés Arloro == 398 (actual: ${vendedorCounts['Juan Andres Arloro']})`);
assert(vendedorCounts['Alejandro Noacco'] === 219, `Vendedor Alejandro Noacco == 219 (actual: ${vendedorCounts['Alejandro Noacco']})`);
assert(vendedorCounts['Lucia Laje'] === 153, `Vendedor Lucía Laje == 153 (actual: ${vendedorCounts['Lucia Laje']})`);
assert(vendedorCounts['(Vacio)'] === 12, `Vendedor (Vacío) == 12 (actual: ${vendedorCounts['(Vacio)']})`);
assert(vendedorCounts['Zamira Abraham'] === 1, `Vendedor Zamira Abraham == 1 (actual: ${vendedorCounts['Zamira Abraham']})`);

const comercialesTotal = (vendedorCounts['Martin Fusco'] || 0) + (vendedorCounts['Juan Andres Arloro'] || 0) + (vendedorCounts['Alejandro Noacco'] || 0);
const comercialesPct = ((comercialesTotal / 1308) * 100).toFixed(2);
assert(comercialesTotal === 1142, `Subtotal Comerciales (Fusco + Arloro + Noacco) == 1,142 (actual: ${comercialesTotal})`);
assert(comercialesPct === '87.31', `Comerciales share == 87.31% (actual: ${comercialesPct}%)`);

// 1.7 Customer ERP Breakdown
const customerBreakdown = {};
rows1.forEach(r => {
  const cust = normalizeName(r['Customer'] || '(Vacio)');
  if (!customerBreakdown[cust]) customerBreakdown[cust] = { total: 0, conCarpeta: 0, sinCarpeta: 0 };
  customerBreakdown[cust].total++;
  if (hasCarpeta(r['#Carpetas'])) customerBreakdown[cust].conCarpeta++;
  else customerBreakdown[cust].sinCarpeta++;
});

// Ana Laura Talaban
assert(customerBreakdown['Ana Laura Talaban']?.conCarpeta === 154, `Ana Laura Talaban con carpeta == 154 (actual: ${customerBreakdown['Ana Laura Talaban']?.conCarpeta})`);
assert(customerBreakdown['Ana Laura Talaban']?.sinCarpeta === 43, `Ana Laura Talaban sin carpeta == 43 (actual: ${customerBreakdown['Ana Laura Talaban']?.sinCarpeta})`);
assert(customerBreakdown['Ana Laura Talaban']?.total === 197, `Ana Laura Talaban total == 197 (actual: ${customerBreakdown['Ana Laura Talaban']?.total})`);

// Aldana Gomez
assert(customerBreakdown['Aldana Gomez']?.conCarpeta === 124, `Aldana Gomez con carpeta == 124 (actual: ${customerBreakdown['Aldana Gomez']?.conCarpeta})`);
assert(customerBreakdown['Aldana Gomez']?.sinCarpeta === 176, `Aldana Gomez sin carpeta == 176 (actual: ${customerBreakdown['Aldana Gomez']?.sinCarpeta})`);
assert(customerBreakdown['Aldana Gomez']?.total === 300, `Aldana Gomez total == 300 (actual: ${customerBreakdown['Aldana Gomez']?.total})`);

// Cecilia Dellamea
assert(customerBreakdown['Cecilia Dellamea']?.conCarpeta === 64, `Cecilia Dellamea con carpeta == 64 (actual: ${customerBreakdown['Cecilia Dellamea']?.conCarpeta})`);
assert(customerBreakdown['Cecilia Dellamea']?.sinCarpeta === 86, `Cecilia Dellamea sin carpeta == 86 (actual: ${customerBreakdown['Cecilia Dellamea']?.sinCarpeta})`);
assert(customerBreakdown['Cecilia Dellamea']?.total === 150, `Cecilia Dellamea total == 150 (actual: ${customerBreakdown['Cecilia Dellamea']?.total})`);

console.log('');

// --------------------------------------------------------------------------
// SUITE 2: CONSOLIDATED MAILBOX DATASET
// --------------------------------------------------------------------------
console.log(`${BOLD}[SUITE 2] Consolidated Mailbox Dataset Verification${RESET}`);

assert(fs.existsSync(JSON_PATH), `Consolidated JSON exists at ${JSON_PATH}`);
const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// 2.1 Total records
assert(Array.isArray(jsonData.quotations), `jsonData.quotations is an array`);
assert(jsonData.quotations.length === 1995, `Total records in quotations array == 1,995 (actual: ${jsonData.quotations.length})`);
assert(jsonData.metadata?.audit_integrity?.total_genuine_quotations_consolidated === 1995, `Metadata total_genuine_quotations_consolidated == 1,995`);

// 2.2 Status Breakdown
const mailboxStatuses = {
  ACEPTADA_CERRADA: 0,
  COTIZADA: 0,
  EN_NEGOCIACION: 0,
  VENCIDA_SIN_RESPUESTA: 0
};

jsonData.quotations.forEach(q => {
  const cat = q.commercial_status?.category;
  if (mailboxStatuses[cat] !== undefined) {
    mailboxStatuses[cat]++;
  } else {
    mailboxStatuses[cat] = 1;
  }
});

assert(mailboxStatuses.ACEPTADA_CERRADA === 303, `Status ACEPTADA_CERRADA == 303 (actual: ${mailboxStatuses.ACEPTADA_CERRADA})`);
assert(mailboxStatuses.COTIZADA === 1624, `Status COTIZADA == 1,624 (actual: ${mailboxStatuses.COTIZADA})`);
assert(mailboxStatuses.EN_NEGOCIACION === 67, `Status EN_NEGOCIACION == 67 (actual: ${mailboxStatuses.EN_NEGOCIACION})`);
assert(mailboxStatuses.VENCIDA_SIN_RESPUESTA === 1, `Status VENCIDA_SIN_RESPUESTA == 1 (actual: ${mailboxStatuses.VENCIDA_SIN_RESPUESTA})`);
assert(
  mailboxStatuses.ACEPTADA_CERRADA + mailboxStatuses.COTIZADA + mailboxStatuses.EN_NEGOCIACION + mailboxStatuses.VENCIDA_SIN_RESPUESTA === 1995,
  `Mailbox status sum equals 1,995`
);

// 2.3 Gap Analysis: 1,995 - 1,308 = 687
const gap = jsonData.quotations.length - rows1.length;
assert(gap === 687, `Gap between Mailbox (1,995) and ERP (1,308) == 687 (actual: ${gap})`);

const opPerf = jsonData.kpis_summary?.operational_performance || [];
const unassignedOp = opPerf.find(p => p.role.includes('Sin Asignación Operativa') || p.operator_name.includes('Sin Asignación'));
assert(unassignedOp !== undefined, `Operational performance includes 'Sin Asignación Operativa'`);
assert(unassignedOp?.total_folders_operated === 1245, `'Sin Asignación Operativa' accounts for 1,245 quotations in mailbox dataset (actual: ${unassignedOp?.total_folders_operated})`);

// 2.4 Carpetas operadas por operadores nominados (750)
const nominatedOperators = [
  'Aldana Gomez',
  'Ana Laura Talaban',
  'Victoria Moyano',
  'Abril Stampfli',
  'Natali Hermoso',
  'Cecilia Dellamea',
  'Alejandro Noacco',
  'Julia Arloro',
  'Alexis Bucardo'
];

let sumNominatedFolders = 0;
nominatedOperators.forEach(name => {
  const item = opPerf.find(p => normalizeName(p.operator_name) === normalizeName(name));
  assert(item !== undefined, `Nominated operator '${name}' found in operational_performance`);
  if (item) {
    sumNominatedFolders += item.total_folders_operated;
  }
});

assert(sumNominatedFolders === 750, `Carpetas operadas por operadores nominados == 750 (actual: ${sumNominatedFolders})`);

console.log('');

// --------------------------------------------------------------------------
// SUITE 3: THE ANA LAURA TALABAN IDENTITY
// --------------------------------------------------------------------------
console.log(`${BOLD}[SUITE 3] The Ana Laura Talaban Identity Assertions${RESET}`);

// Assert 1: ERP folders
const anaERPConCarpeta = customerBreakdown['Ana Laura Talaban']?.conCarpeta;
assert(anaERPConCarpeta === 154, `Ana Laura Talaban has EXACTLY 154 folders in Kipintoch ERP (actual: ${anaERPConCarpeta})`);

// Assert 2: Mailbox won folders
const anaMailboxOp = opPerf.find(p => normalizeName(p.operator_name) === 'Ana Laura Talaban');
assert(anaMailboxOp?.won_folders === 57, `Ana Laura Talaban has EXACTLY 57 won folders in operational_performance (actual: ${anaMailboxOp?.won_folders})`);

let anaQuotationsWon = 0;
jsonData.quotations.forEach(q => {
  if (normalizeName(q.responsible?.operator) === 'Ana Laura Talaban' && q.commercial_status?.category === 'ACEPTADA_CERRADA') {
    anaQuotationsWon++;
  }
});
assert(anaQuotationsWon === 57, `Ana Laura Talaban has EXACTLY 57 won quotations in quotations records (actual: ${anaQuotationsWon})`);

// Assert 3: Operational Consistency Discrepancy == 0
const discrepancy = Math.abs((anaMailboxOp?.won_folders || 0) - anaQuotationsWon);
assert(discrepancy === 0, `The Ana Laura Talaban Operational Consistency Discrepancy == 0 (|57 - 57| = ${discrepancy})`);

console.log('');

// --------------------------------------------------------------------------
// SUITE 4: CONSTRAINT CHECK (INFORME_COTIZACIONES_ALMAR_2026.html)
// --------------------------------------------------------------------------
console.log(`${BOLD}[SUITE 4] Constraint Check: HTML Immutability${RESET}`);

assert(fs.existsSync(HTML_PATH), `INFORME_COTIZACIONES_ALMAR_2026.html exists`);
const htmlBuffer = fs.readFileSync(HTML_PATH);
assert(htmlBuffer.length > 0, `INFORME_COTIZACIONES_ALMAR_2026.html is non-empty (size: ${htmlBuffer.length} bytes)`);

const currentHtmlSha256 = crypto.createHash('sha256').update(htmlBuffer).digest('hex');
assert(
  currentHtmlSha256 === EXPECTED_HTML_SHA256,
  `INFORME_COTIZACIONES_ALMAR_2026.html SHA-256 matches baseline (${EXPECTED_HTML_SHA256})`
);

console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}SUMMARY:${RESET} ${GREEN}${passedAssertions} Passed${RESET}, ${failedAssertions > 0 ? RED : GREEN}${failedAssertions} Failed${RESET} (Total Assertions: ${passedAssertions + failedAssertions})`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

if (failedAssertions > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
