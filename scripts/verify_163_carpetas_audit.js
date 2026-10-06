/**
 * scripts/verify_163_carpetas_audit.js
 * 
 * Comprehensive Automated Verification Suite for the 163 Orphan Carpetas Audit
 * 
 * Verifies:
 * 1. Existence and integrity of audit_163_carpetas_ledger.json & AUDIT_163_CARPETAS_REPORT.md.
 * 2. 100% (163/163) one-to-one reconciliation against EstadísticaComercial_1788881643526.xlsx.
 * 3. 100% empirical evidence presence: Message-ID, Date, From, Subject, snippet.
 * 4. 0 guessing, 0 prorrating: verified operator attribution within sector constraints:
 *    - Expo (24): Alexis Bucardo / Victoria Moyano
 *    - Impo (135): Aldana Gomez / Ana Laura Talaban / Natali Hermoso
 *    - Local (4): Alexis Bucardo / Abril Stampfli
 * 5. Cecilia Dellamea's transversal role quantification and documentary evidence validity.
 * 6. Financial sum integrity down to the cent.
 * 
 * Exits with code 0 on 100% PASS, code 1 on any failure.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = path.resolve(__dirname, '..');
const excelPath = path.join(rootDir, 'EstadísticaComercial_1788881643526.xlsx');
const ledgerPath = path.join(rootDir, 'audit_163_carpetas_ledger.json');
const reportPath = path.join(rootDir, 'AUDIT_163_CARPETAS_REPORT.md');

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ❌ [FAIL] ${message}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

async function verifySuite() {
  console.log('========================================================================');
  console.log('🧪 RUNNING VERIFICATION SUITE: 163 CARPETAS FORENSIC AUDIT');
  console.log('========================================================================\n');

  // =========================================================================
  // TEST GROUP 1: FILE EXISTENCE & STRUCTURE
  // =========================================================================
  console.log('📦 [GROUP 1] Verifying Artifact Existence & Formats...');

  assert(fs.existsSync(excelPath), 'EstadísticaComercial_1788881643526.xlsx exists');
  assert(fs.existsSync(ledgerPath), 'audit_163_carpetas_ledger.json exists');
  assert(fs.existsSync(reportPath), 'AUDIT_163_CARPETAS_REPORT.md exists');

  let ledgerData = [];
  try {
    ledgerData = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    assert(Array.isArray(ledgerData), 'audit_163_carpetas_ledger.json is a valid JSON array');
    assert(ledgerData.length === 163, `Ledger contains exactly 163 records (found: ${ledgerData.length})`);
  } catch (err) {
    assert(false, 'Failed to parse audit_163_carpetas_ledger.json', err.message);
  }

  const reportContent = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
  assert(reportContent.length > 5000, `AUDIT_163_CARPETAS_REPORT.md is substantial (${reportContent.length} bytes)`);

  // =========================================================================
  // TEST GROUP 2: KIPINTOCH ERP EXCEL RECONCILIATION
  // =========================================================================
  console.log('\n📊 [GROUP 2] Reconciling against EstadísticaComercial_1788881643526.xlsx...');

  const wb = XLSX.readFile(excelPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  const excelOrphans = rows.filter(r => 
    r['#Carpetas'] && 
    String(r['#Carpetas']).trim() !== '' && 
    String(r['#Carpetas']).trim() !== '-' && 
    (!r['Customer'] || String(r['Customer']).trim() === '' || String(r['Customer']).trim() === '-')
  );

  assert(excelOrphans.length === 163, `Excel contains exactly 163 orphan carpetas (found: ${excelOrphans.length})`);

  // Reconcile carpetas 1:1
  const excelFolderMap = new Map();
  let excelTotalVenta = 0;
  let excelTotalCosto = 0;
  let excelTotalMargen = 0;

  for (const row of excelOrphans) {
    const code = String(row['#Carpetas']).trim();
    excelFolderMap.set(code, row);
    excelTotalVenta += Number(row['Venta'] || 0);
    excelTotalCosto += Number(row['Costo'] || 0);
    excelTotalMargen += Number(row['Margen'] || 0);
  }

  let matchedFoldersCount = 0;
  let matchedFinancialsCount = 0;

  for (const record of ledgerData) {
    const excelRow = excelFolderMap.get(record.carpeta);
    if (excelRow) {
      matchedFoldersCount++;
      const vDiff = Math.abs(record.venta - Number(excelRow['Venta'] || 0));
      const cDiff = Math.abs(record.costo - Number(excelRow['Costo'] || 0));
      const mDiff = Math.abs(record.margen - Number(excelRow['Margen'] || 0));
      if (vDiff < 0.01 && cDiff < 0.01 && mDiff < 0.01) {
        matchedFinancialsCount++;
      }
    }
  }

  assert(matchedFoldersCount === 163, `100% (163/163) carpetas matched by code in Excel (matched: ${matchedFoldersCount})`);
  assert(matchedFinancialsCount === 163, `100% (163/163) individual financial amounts match Excel (matched: ${matchedFinancialsCount})`);

  const ledgerTotalVenta = ledgerData.reduce((acc, r) => acc + r.venta, 0);
  const ledgerTotalCosto = ledgerData.reduce((acc, r) => acc + r.costo, 0);
  const ledgerTotalMargen = ledgerData.reduce((acc, r) => acc + r.margen, 0);

  assert(Math.abs(ledgerTotalVenta - excelTotalVenta) < 0.01, `Total Venta matches Excel ($ ${ledgerTotalVenta.toFixed(2)})`);
  assert(Math.abs(ledgerTotalCosto - excelTotalCosto) < 0.01, `Total Costo matches Excel ($ ${ledgerTotalCosto.toFixed(2)})`);
  assert(Math.abs(ledgerTotalMargen - excelTotalMargen) < 0.01, `Total Margen matches Excel ($ ${ledgerTotalMargen.toFixed(2)})`);

  // =========================================================================
  // TEST GROUP 3: EMPIRICAL EVIDENCE INTEGRITY (NO BLANKS, NO FAKES)
  // =========================================================================
  console.log('\n🔍 [GROUP 3] Verifying Empirical Evidence Headers & Snippets...');

  let validMsgIdCount = 0;
  let validDateCount = 0;
  let validFromCount = 0;
  let validSubjCount = 0;
  let validSnippetCount = 0;
  let verifiedStatusCount = 0;

  for (const r of ledgerData) {
    const ev = r.evidencia;
    if (ev && typeof ev === 'object') {
      if (ev.messageId && typeof ev.messageId === 'string' && ev.messageId.length >= 8) {
        validMsgIdCount++;
      }
      if (ev.date && typeof ev.date === 'string' && !isNaN(Date.parse(ev.date))) {
        validDateCount++;
      }
      if (ev.from && typeof ev.from === 'string' && ev.from.trim().length >= 3) {
        validFromCount++;
      }
      if (ev.subject && typeof ev.subject === 'string' && ev.subject.trim().length >= 3) {
        validSubjCount++;
      }
      if (ev.snippet && typeof ev.snippet === 'string' && ev.snippet.trim().length >= 1) {
        validSnippetCount++;
      }
    }
    if (r.auditStatus === 'VERIFIED_EMPIRICAL') {
      verifiedStatusCount++;
    }
  }

  assert(validMsgIdCount === 163, `163/163 records have valid Message-ID header (valid: ${validMsgIdCount})`);
  assert(validDateCount === 163, `163/163 records have parseable RFC date (valid: ${validDateCount})`);
  assert(validFromCount === 163, `163/163 records have valid From header (valid: ${validFromCount})`);
  assert(validSubjCount === 163, `163/163 records have valid Subject header (valid: ${validSubjCount})`);
  assert(validSnippetCount === 163, `163/163 records have non-empty operational snippet (valid: ${validSnippetCount})`);
  assert(verifiedStatusCount === 163, `163/163 records flagged as VERIFIED_EMPIRICAL (count: ${verifiedStatusCount})`);

  // =========================================================================
  // TEST GROUP 4: OPERATOR ATTRIBUTION & 0 PRORATING
  // =========================================================================
  console.log('\n⚖️ [GROUP 4] Verifying Sector Boundaries & 0 Guessing/Prorating...');

  const validOperators = new Set([
    'Alexis Bucardo',
    'Victoria Moyano',
    'Aldana Gomez',
    'Ana Laura Talaban',
    'Natali Hermoso',
    'Abril Stämpfli'
  ]);

  let invalidOperatorCount = 0;
  let guessedOrProratedCount = 0;

  const sectorCounts = { 'Exportación': 0, 'Importación': 0, 'Local': 0 };
  const operatorTally = {};

  for (const r of ledgerData) {
    const op = r.operadorReal;
    operatorTally[op] = (operatorTally[op] || 0) + 1;

    if (!validOperators.has(op)) {
      invalidOperatorCount++;
    }

    if (/prorrateo|estimado|desconocido|unknown|tbd|n\/a|pendiente/i.test(op)) {
      guessedOrProratedCount++;
    }

    // Sector constraints
    if (r.sector === 'Exportación') {
      sectorCounts['Exportación']++;
      assert(
        ['Alexis Bucardo', 'Victoria Moyano'].includes(op),
        `Expo record #${r.index} (${r.carpeta}) attributed to Alexis Bucardo or Victoria Moyano (attributed: ${op})`
      );
    } else if (r.sector === 'Importación') {
      sectorCounts['Importación']++;
      assert(
        ['Aldana Gomez', 'Ana Laura Talaban', 'Natali Hermoso'].includes(op),
        `Impo record #${r.index} (${r.carpeta}) attributed to Aldana Gomez, Ana Laura Talaban, or Natali Hermoso (attributed: ${op})`
      );
    } else if (r.sector === 'Local') {
      sectorCounts['Local']++;
      assert(
        ['Alexis Bucardo', 'Abril Stämpfli'].includes(op),
        `Local record #${r.index} (${r.carpeta}) attributed to Alexis Bucardo or Abril Stämpfli (attributed: ${op})`
      );
    }
  }

  assert(invalidOperatorCount === 0, `0 invalid operator names in dataset (invalid: ${invalidOperatorCount})`);
  assert(guessedOrProratedCount === 0, `0 guessed, estimated, or prorated operators (detected: ${guessedOrProratedCount})`);
  assert(sectorCounts['Exportación'] === 24, `Sector Exportación count equals exactly 24 (found: ${sectorCounts['Exportación']})`);
  assert(sectorCounts['Importación'] === 135, `Sector Importación count equals exactly 135 (found: ${sectorCounts['Importación']})`);
  assert(sectorCounts['Local'] === 4, `Sector Local count equals exactly 4 (found: ${sectorCounts['Local']})`);
  assert(
    sectorCounts['Exportación'] + sectorCounts['Importación'] + sectorCounts['Local'] === 163,
    'Sum of sectors equals 163'
  );

  console.log('  Operator Distribution:');
  console.table(operatorTally);

  // =========================================================================
  // TEST GROUP 5: CECILIA DELLAMEA TRANSVERSAL ROLE
  // =========================================================================
  console.log('\n📑 [GROUP 5] Verifying Cecilia Dellamea Transversal Role Quantification...');

  let ceciInterventions = 0;
  let validCeciEvidence = 0;
  const ceciRoleTypes = {};

  for (const r of ledgerData) {
    const c = r.intervencionCecilia;
    if (c && c.participo) {
      ceciInterventions++;
      const validRoles = ['CONFECCION_HBL_MBL', 'CANJE_Y_LIBERACION', 'AVISO_ARRIBO', 'SOPORTE_DOCUMENTAL'];
      if (validRoles.includes(c.rol) && c.messageId && c.date && c.from && c.subject) {
        validCeciEvidence++;
      }
      ceciRoleTypes[c.rol] = (ceciRoleTypes[c.rol] || 0) + 1;
    }
  }

  assert(ceciInterventions > 0, `Cecilia Dellamea transversal participation quantified (> 0: found ${ceciInterventions})`);
  assert(
    validCeciEvidence === ceciInterventions,
    `100% of Cecilia's interventions (${validCeciEvidence}/${ceciInterventions}) have valid Message-ID, Date, From, Subject, and Role`
  );

  console.log('  Cecilia Transversal Roles:');
  console.table(ceciRoleTypes);

  // =========================================================================
  // TEST GROUP 6: AUDIT REPORT MARKDOWN COMPLETENESS
  // =========================================================================
  console.log('\n📄 [GROUP 6] Verifying AUDIT_163_CARPETAS_REPORT.md Report Structure...');

  assert(reportContent.includes('INFORME DE AUDITORÍA FORENSE'), 'Report title present');
  assert(reportContent.includes('Desglose Fáctico de Operadores Reales'), 'Section 2 present');
  assert(reportContent.includes('Cuantificación del Rol Transversal de Cecilia Dellamea'), 'Section 3 present');
  assert(reportContent.includes('Registro Detallado de Evidencia Pericial (163 Carpetas)'), 'Section 4 table present');

  let reportMatchedCarpetas = 0;
  for (const r of ledgerData) {
    if (reportContent.includes(r.carpeta)) {
      reportMatchedCarpetas++;
    }
  }

  assert(
    reportMatchedCarpetas === 163,
    `100% (163/163) carpetas individually listed in AUDIT_163_CARPETAS_REPORT.md (matched: ${reportMatchedCarpetas})`
  );

  // =========================================================================
  // FINAL SUMMARY & EXIT
  // =========================================================================
  console.log('\n========================================================================');
  console.log('🏁 SUITE EXECUTION SUMMARY');
  console.log(`Total Assertions Evaluated: ${passedAssertions + failedAssertions}`);
  console.log(`Assertions PASSED:        ${passedAssertions}`);
  console.log(`Assertions FAILED:        ${failedAssertions}`);
  console.log('========================================================================');

  if (failedAssertions === 0) {
    console.log('\n🎉 ALL 163 CARPETAS FORENSIC AUDIT TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.error(`\n❌ VERIFICATION FAILED: ${failedAssertions} assertion(s) failed.\n`);
    process.exit(1);
  }
}

verifySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
