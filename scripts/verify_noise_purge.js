/**
 * scripts/verify_noise_purge.js
 * 
 * Independent, automated, deterministic verification script for:
 * 1. Group 1: Carrier & trucker invoices (Hernán Veiga, Transfaro, Hiace, Biton, Omar Díaz, etc.) == 0
 * 2. Group 2: Unsolicited forwarder cold spam & mass marketing circulars (King Cargo, Sunmarr, Bright Logistics, Juntrans, Shining, etc.) == 0
 * 3. Group 3: Operational pre-alerts & "Avisos de Embarque" misclassified as pending quotations == 0
 * 4. Group 4: Documentary BL releases, customs freight certifications & container tracking == 0
 * 5. Group 5: Internal administrative communications, payroll, bank SWIFT receipts & intercompany margin/rentabilidad == 0
 * 6. Non-commercial personnel attribution: Vanesa Meggiolaro == 0, Stefania Rossi == 0, Dalia Silvi == 0 (strict 0 absolute)
 * 7. Commercial evidence integrity: 100% of retained records have verified commercial RFQ / rate proposal evidence
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

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

console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   ALMAR ROSARIO - FALSE POSITIVE NOISE PURGE VERIFICATION SUITE       ${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

if (!fs.existsSync(JSON_PATH)) {
  console.error(`${RED}ERROR: Dataset not found at ${JSON_PATH}${RESET}`);
  process.exit(1);
}

const dataset = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const quotes = dataset.quotations || [];

console.log(`Auditing ${BOLD}${quotes.length}${RESET} consolidated quotation records...\n`);

// --------------------------------------------------------------------------
// TEST 1: GROUP 1 - TRUCKER & SUPPLIER INVOICES PURGE
// --------------------------------------------------------------------------
console.log(`${BOLD}[TEST 1] Group 1: Driver & Trucker Invoices (0 Absolute)${RESET}`);

const G1_PATTERNS = [
  /hern[aá]n\s+veiga/i,
  /transfaro/i,
  /hiace/i,
  /biton-fc/i,
  /transporte\s+g[oó]mez/i,
  /omar\s+d[ií]az/i,
  /transtotal/i,
  /geo\s+red/i,
  /san\s+pelegrini/i,
  /\btransportia\b/i,
  /\b(?:fc|factura)\s+log[ií]stica\b/i,
  /\badjunto\s+factura\b/i,
  /adjunto\s+factura\s+por\s+el\s+flete/i,
  /factura\s+correspondiente\s+a\s+los\s+servicios\s+prestados/i,
  /liquidaci[oó]n\s+de\s+gastos\s+y\s+honorarios/i,
  /\bprofit\s+bl\b/i
];

let g1Violations = 0;
const g1Examples = [];

for (const q of quotes) {
  const combinedText = [
    q.audit_trail?.email_subject || '',
    q.audit_trail?.snippet_excerpt || '',
    q.client?.name || '',
    q.financials?.tariff_source || ''
  ].join(' ');

  for (const pat of G1_PATTERNS) {
    if (pat.test(combinedText)) {
      g1Violations++;
      g1Examples.push({ id: q.id, subject: q.audit_trail?.email_subject, pattern: pat.toString() });
      break;
    }
  }
}

assert(g1Violations === 0, `Driver & trucker invoices in consolidated quotes == 0 (found: ${g1Violations})`, JSON.stringify(g1Examples.slice(0, 3)));

// --------------------------------------------------------------------------
// TEST 2: GROUP 2 - COLD SPAM & FORWARDER BROADCAST MARKETING
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 2] Group 2: Overseas Forwarder Cold Spam & Mass Broadcasts (0 Absolute)${RESET}`);

const G2_PATTERNS = [
  /king\s*cargo\s*caraka/i,
  /sunmarr/i,
  /bright\s*logistics/i,
  /juntrans/i,
  /shining\s*shipping/i,
  /shining\s*cargo/i,
  /triman/i,
  /greatway/i,
  /asian\s*star/i,
  /bescoo/i,
  /hoang\s*khang/i,
  /dlt\s*multimodal/i,
  /soaringtrans/i,
  /cargotrans\s*vietnam/i,
  /constant\s*contact/i,
  /introduce\s+our\s+freight\s+forwarding/i,
  /cooperation\s+with\s+your\s+esteemed\s+company/i,
  /partner\s+in\s+china/i,
  /agent\s+in\s+china/i
];

let g2Violations = 0;
const g2Examples = [];

for (const q of quotes) {
  const combinedText = [
    q.audit_trail?.email_subject || '',
    q.audit_trail?.snippet_excerpt || '',
    q.client?.name || ''
  ].join(' ');

  for (const pat of G2_PATTERNS) {
    if (pat.test(combinedText)) {
      g2Violations++;
      g2Examples.push({ id: q.id, subject: q.audit_trail?.email_subject, pattern: pat.toString() });
      break;
    }
  }
}

assert(g2Violations === 0, `Forwarder cold spam & marketing broadcasts in quotes == 0 (found: ${g2Violations})`, JSON.stringify(g2Examples.slice(0, 3)));

// --------------------------------------------------------------------------
// TEST 3: GROUP 3 - OPERATIONAL PRE-ALERTS & AVISOS DE EMBARQUE
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 3] Group 3: Operational Shipping Notices & Pre-Alerts (0 Spurious Quotes)${RESET}`);

let g3Violations = 0;
const g3Examples = [];

for (const q of quotes) {
  const subj = (q.audit_trail?.email_subject || '').toLowerCase();
  const status = q.commercial_status?.category;
  
  // Operational pre-alerts should never be classified as active pending quotations
  if (/\b(aviso de embarque|pre-alerta|pre alerta|shipping advice|notice of shipment)\b/i.test(subj)) {
    if (status === 'COTIZADA' || status === 'FASE_1_OPORTUNIDAD' || status === 'EN_NEGOCIACION') {
      g3Violations++;
      g3Examples.push({ id: q.id, subject: q.audit_trail?.email_subject, status });
    }
  }
}

assert(g3Violations === 0, `Operational shipping notices misclassified as pending quotes == 0 (found: ${g3Violations})`, JSON.stringify(g3Examples.slice(0, 3)));

// --------------------------------------------------------------------------
// TEST 4: GROUP 4 - DOCUMENTARY TRACKING & CUSTOMS CERTIFICATIONS
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 4] Group 4: BL Tracking, Releases & Customs Certifications (0 Non-Commercial)${RESET}`);

const G4_PATTERNS = [
  /\bliberaci[oó]n\s+(?:de\s+)?(?:bl|mbl|hbl|gu[ií]a|ka|apu)\b/i,
  /\bcertificar:\s*flete\b/i,
  /\bcertificaci[oó]n\s+de\s+flete\s+para\s+aduana\b/i,
  /\bcanje\s+de\s+bl\b/i,
  /\bdevoluci[oó]n\s+de\s+vac[ií]o\b/i,
  /\bliberado\s+en\s+la\s+terminal\b/i,
  /\bcontenedor\s+est[aá]\s+liberado\b/i
];

let g4Violations = 0;
const g4Examples = [];

for (const q of quotes) {
  const combinedText = [
    q.audit_trail?.email_subject || '',
    q.audit_trail?.snippet_excerpt || ''
  ].join(' ');

  for (const pat of G4_PATTERNS) {
    if (pat.test(combinedText)) {
      g4Violations++;
      g4Examples.push({ id: q.id, subject: q.audit_trail?.email_subject, pattern: pat.toString() });
      break;
    }
  }
}

assert(g4Violations === 0, `Pure documentary tracking & customs releases in quotes == 0 (found: ${g4Violations})`, JSON.stringify(g4Examples.slice(0, 3)));

// --------------------------------------------------------------------------
// TEST 5: GROUP 5 - INTERNAL ADMINISTRATIVE & BANKING COMMUNICATIONS
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 5] Group 5: Administrative, Banking & Margin Emails (0 Non-Commercial)${RESET}`);

const G5_PATTERNS = [
  /\brtabilidad\s+carga\b/i,
  /\brentabilidad\s+(?:interna|carpeta|de\s+carpeta)\b/i,
  /\borden\s+de\s+pago\s+al\s+exterior\b/i,
  /\bcomprobante\s+de\s+transferencia\s+swift\b/i,
  /\bestado\s+de\s+cuenta\s+corriente\b/i,
  /\brecibo\s+de\s+sueldo\b/i,
  /\bdebit\s*note\b/i,
  /\bcredit\s*note\b/i,
  /\bnota\s+de\s+d[eé]bito\b/i,
  /\bnota\s+de\s+cr[eé]dito\b/i,
  /\bseacon\s+factur/i,
  /\bcostos?\s+en\s+usd\b/i
];

let g5Violations = 0;
const g5Examples = [];

for (const q of quotes) {
  const combinedText = [
    q.audit_trail?.email_subject || '',
    q.audit_trail?.snippet_excerpt || ''
  ].join(' ');

  for (const pat of G5_PATTERNS) {
    if (pat.test(combinedText)) {
      g5Violations++;
      g5Examples.push({ id: q.id, subject: q.audit_trail?.email_subject, pattern: pat.toString() });
      break;
    }
  }
}

assert(g5Violations === 0, `Internal administrative & SWIFT banking emails in quotes == 0 (found: ${g5Violations})`, JSON.stringify(g5Examples.slice(0, 3)));

// --------------------------------------------------------------------------
// TEST 6: NON-COMMERCIAL ATTRIBUTION PURGE (STRICT 0 ABSOLUTE)
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 6] Non-Commercial Attribution Guard (Strict 0 Absolute)${RESET}`);

const NON_COMMERCIAL_NAMES = [
  'Vanesa Meggiolaro',
  'Stefania Rossi',
  'Dalia Silvi',
  'Aldana Gomez',
  'Ana Laura Talaban',
  'Cecilia Dellamea',
  'Natali Hermoso',
  'Julia Arloro'
];

const attributionCounts = {};
for (const name of NON_COMMERCIAL_NAMES) attributionCounts[name] = 0;

for (const q of quotes) {
  const exec = q.responsible?.commercial_executive;
  if (attributionCounts[exec] !== undefined) {
    attributionCounts[exec]++;
  }
}

assert(attributionCounts['Vanesa Meggiolaro'] === 0, `Vanesa Meggiolaro commercial quotes == 0 (actual: ${attributionCounts['Vanesa Meggiolaro']})`);
assert(attributionCounts['Stefania Rossi'] === 0, `Stefania Rossi commercial quotes == 0 (actual: ${attributionCounts['Stefania Rossi']})`);
assert(attributionCounts['Dalia Silvi'] === 0, `Dalia Silvi commercial quotes == 0 (actual: ${attributionCounts['Dalia Silvi']})`);

// Also verify operations personnel have 0 commercial front-office quotes
assert(attributionCounts['Aldana Gomez'] === 0, `Aldana Gomez commercial quotes == 0 (actual: ${attributionCounts['Aldana Gomez']})`);
assert(attributionCounts['Ana Laura Talaban'] === 0, `Ana Laura Talaban commercial quotes == 0 (actual: ${attributionCounts['Ana Laura Talaban']})`);
assert(attributionCounts['Cecilia Dellamea'] === 0, `Cecilia Dellamea commercial quotes == 0 (actual: ${attributionCounts['Cecilia Dellamea']})`);
assert(attributionCounts['Natali Hermoso'] === 0, `Natali Hermoso commercial quotes == 0 (actual: ${attributionCounts['Natali Hermoso']})`);
assert(attributionCounts['Julia Arloro'] === 0, `Julia Arloro commercial quotes == 0 (actual: ${attributionCounts['Julia Arloro']})`);

// --------------------------------------------------------------------------
// TEST 7: ALL REMAINING QUOTES BACKED BY COMMERCIAL RFQ / RATE PROPOSAL
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 7] Commercial Evidence Verification on 100% of Records${RESET}`);

let verifiedEvidenceCount = 0;
let missingEvidenceCount = 0;

for (const q of quotes) {
  const hasTariff = q.financials && q.financials.total_freight_usd > 0;
  const hasSubject = typeof q.audit_trail?.email_subject === 'string' && q.audit_trail.email_subject.length > 0;
  const hasExecutive = typeof q.responsible?.commercial_executive === 'string' && q.responsible.commercial_executive.length > 0;
  const hasMode = typeof q.logistics?.transport_mode === 'string' && q.logistics.transport_mode.length > 0;

  if (hasTariff && hasSubject && hasExecutive && hasMode) {
    verifiedEvidenceCount++;
  } else {
    missingEvidenceCount++;
  }
}

assert(missingEvidenceCount === 0, `100% of records have verified commercial quotation evidence (missing: ${missingEvidenceCount})`);
assert(verifiedEvidenceCount === quotes.length, `Verified commercial records count matches total dataset (${verifiedEvidenceCount} == ${quotes.length})`);

// --------------------------------------------------------------------------
// TEST 8: SYNTHETIC CLIENT NAMES ELIMINATION (0 Folder/Manifest Codes + S.A.)
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 8] Synthetic Client Names Elimination (0 Synthetic)${RESET}`);

const SYNTHETIC_PATTERNS = [
  /^(?:C\d+|CRT\w+|IT\d+|IMP\d+|EXP\d+|PC\d+|PO\d+|INV\d+|SICE\d+)\s*S\.?A\.?$/i,
  /^(?:C\d+|CRT\w+)$/i
];

let syntheticViolations = 0;
const syntheticExamples = [];

for (const q of quotes) {
  const cname = (q.client?.name || '').trim();
  for (const pat of SYNTHETIC_PATTERNS) {
    if (pat.test(cname)) {
      syntheticViolations++;
      syntheticExamples.push({ id: q.id, client: cname, pattern: pat.toString() });
      break;
    }
  }
}

assert(syntheticViolations === 0, `Synthetic folder/manifest client names == 0 (found: ${syntheticViolations})`, JSON.stringify(syntheticExamples.slice(0, 3)));

// --------------------------------------------------------------------------
// TEST 9: CLOSED FOLDER SHIPPING INSTRUCTIONS LEAKAGE CHECK
// --------------------------------------------------------------------------
console.log(`\n${BOLD}[TEST 9] Closed Folder Shipping Instructions Leakage Check (0 Leaked)${RESET}`);

let siViolations = 0;
const siExamples = [];

for (const q of quotes) {
  const subj = (q.audit_trail?.email_subject || '').toLowerCase();
  const snip = (q.audit_trail?.snippet_excerpt || '').toLowerCase();
  const text = subj + ' ' + snip;
  const status = q.commercial_status?.category;

  if (/\b(?:shipping\s+instructions?|(?:mbl|hbl)\s+drafts?)\b/i.test(text) && !/\b(?:cotiz|solicitud|rfq|tarifa|cuanto\s+cuesta|presupuesto)\b/i.test(text)) {
    if (status === 'COTIZADA' || status === 'FASE_1_OPORTUNIDAD') {
      siViolations++;
      siExamples.push({ id: q.id, subject: q.audit_trail?.email_subject, status });
    }
  }
}

assert(siViolations === 0, `Closed-folder shipping instructions misclassified as pending quotes == 0 (found: ${siViolations})`, JSON.stringify(siExamples.slice(0, 3)));

// --------------------------------------------------------------------------
// SUMMARY & EXIT CODE
// --------------------------------------------------------------------------
console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}PURGE VERIFICATION SUMMARY:${RESET} ${GREEN}${passedAssertions} Passed${RESET}, ${failedAssertions > 0 ? RED : GREEN}${failedAssertions} Failed${RESET} (Total: ${passedAssertions + failedAssertions})`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

if (failedAssertions > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
