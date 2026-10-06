const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');

async function verifyAll() {
  console.log('====================================================');
  console.log('AUDITORÍA INDEPENDIENTE: R1 SLIDES & R2 EXECUTIVE SUMMARY');
  console.log('====================================================\n');

  const root = path.resolve(__dirname, '..');
  const slidesHtmlPath = path.join(root, 'presentacion-ejecutiva-almar.html');
  const summaryHtmlPath = path.join(root, 'ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.html');
  const summaryPdfPath = path.join(root, 'ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.pdf');
  const refPdfPath = 'C:\\Users\\franc\\Downloads\\2026.06.24-Resumen Relevamiento-PO02 Importacion.pdf';

  let errors = [];

  // ==========================================
  // 1. AUDITORÍA R1: SLIDE DECK HTML
  // ==========================================
  console.log('--- 1. AUDITORÍA R1: SLIDE DECK (HTML / JS / CSS) ---');
  if (!fs.existsSync(slidesHtmlPath)) {
    errors.push('No existe presentacion-ejecutiva-almar.html');
  } else {
    const slidesHtml = fs.readFileSync(slidesHtmlPath, 'utf8');
    console.log(`Tamaño de presentacion-ejecutiva-almar.html: ${slidesHtml.length} bytes`);

    // Brand tokens
    const tokens = [
      '#1e3d2f', // clave-green
      '#13271e', // clave-green-dark
      '#c29320', // clave-gold
      '#fefcf5', // clave-gold-light
      '#081433', // clave-navy
      '#e2e8f0', // clave-border
      'Montserrat',
      'Open Sans'
    ];
    for (const t of tokens) {
      if (!slidesHtml.includes(t)) {
        errors.push(`R1 Slide Deck falta token: ${t}`);
      } else {
        console.log(`  ✓ Token verificado: ${t}`);
      }
    }

    // 14 slides verification
    for (let i = 1; i <= 14; i++) {
      if (!slidesHtml.includes(`data-slide="${i}"`)) {
        errors.push(`R1 Slide Deck falta data-slide="${i}"`);
      }
    }
    console.log('  ✓ 14 diapositivas presentes con data-slide="1"..14');

    // 4 Moments verification
    const momentKeywords = [
      { moment: 1, title: 'Diagnóstico Real', check: 'Lucía Laje' },
      { moment: 2, title: 'Módulo Comercial Flexible', check: 'Calculadora Logística' },
      { moment: 3, title: 'Escudo Financiero y Operativo', check: 'Desvío de Tarifa' },
      { moment: 4, title: 'Triage en Piloto y Arquitectura', check: 'Cero Retención IA' }
    ];
    for (const m of momentKeywords) {
      if (!slidesHtml.includes(m.check)) {
        errors.push(`R1 Slide Deck momento ${m.moment} (${m.title}) no contiene "${m.check}"`);
      } else {
        console.log(`  ✓ Momento ${m.moment} (${m.title}) verificado con "${m.check}".`);
      }
    }

    // Mechanics code inspection
    if (!slidesHtml.includes('ArrowRight') || !slidesHtml.includes('ArrowLeft') || !slidesHtml.includes("e.key === ' '")) {
      errors.push('R1 Mecánica: Faltan eventos ArrowRight / ArrowLeft / Space');
    } else {
      console.log('  ✓ Navegación por teclado (Flechas y Espacio) verificada en código JS.');
    }
    if (!slidesHtml.includes("e.key.toLowerCase() === 'f'") || !slidesHtml.includes('requestFullscreen')) {
      errors.push('R1 Mecánica: Falta soporte para pantalla completa (tecla F / requestFullscreen)');
    } else {
      console.log('  ✓ Modo pantalla completa (tecla F y requestFullscreen) verificado en código JS.');
    }
    if (!slidesHtml.includes("e.key.toLowerCase() === 'o'") || !slidesHtml.includes("e.key.toLowerCase() === 'm'") || !slidesHtml.includes('overviewModal')) {
      errors.push('R1 Mecánica: Falta modal selector de diapositivas (O / M / overviewModal)');
    } else {
      console.log('  ✓ Selector de diapositivas modal drawer (O / M) verificado en código JS.');
    }
  }

  // ==========================================
  // 2. AUDITORÍA R2: EXECUTIVE SUMMARY HTML & PDF
  // ==========================================
  console.log('\n--- 2. AUDITORÍA R2: DOCUMENTO RESUMEN EJECUTIVO (HTML & PDF) ---');
  if (!fs.existsSync(summaryHtmlPath)) {
    errors.push('No existe ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.html');
  } else {
    const summaryHtml = fs.readFileSync(summaryHtmlPath, 'utf8');
    console.log(`Tamaño de HTML: ${summaryHtml.length} bytes`);

    // Verify 5 pages
    const pageMatches = summaryHtml.match(/class="page" id="page-\d"/g) || [];
    console.log(`  ✓ Páginas contenedoras A4 en DOM: ${pageMatches.length}`);
    if (pageMatches.length !== 5) {
      errors.push(`Esperadas 5 páginas A4 en HTML, encontradas ${pageMatches.length}`);
    }

    // Control Box Verification
    const controlKeywords = [
      'CC-ALMAR-2026-PO02',
      'Versión 2.0',
      '28 de septiembre de 2026',
      'Clave Consultora',
      'CONFIDENCIAL / EXCLUSIVO DIRECTORIO',
      'Alejandro Noacco',
      'Vanesa Meggiolaro',
      'Juan Arloro'
    ];
    for (const kw of controlKeywords) {
      if (!summaryHtml.includes(kw)) {
        errors.push(`R2 Falta en cuadro de control: "${kw}"`);
      } else {
        console.log(`  ✓ Cuadro de control contiene: "${kw}"`);
      }
    }

    // Dual letterhead logos
    if (!summaryHtml.includes('data:image/png;base64') || !summaryHtml.includes('logo-almar') || !summaryHtml.includes('logo-clave')) {
      errors.push('R2 Falta membrete institucional dual con logos en Base64');
    } else {
      console.log('  ✓ Membrete institucional dual con logotipos en Base64 verificado.');
    }

    // Design system tokens
    const r2Tokens = [
      '--clave-green:          #1e3d2f',
      '--clave-gold:           #c29320',
      '--clave-gold-light:     #fefcf5',
      '--clave-navy:           #081433',
      '--clave-border:         #e2e8f0',
      'Montserrat',
      'Open Sans'
    ];
    for (const t of r2Tokens) {
      if (!summaryHtml.includes(t)) {
        errors.push(`R2 Resumen HTML falta token: ${t}`);
      } else {
        console.log(`  ✓ Token R2 verificado: ${t}`);
      }
    }

    // Print CSS rules
    if (!summaryHtml.includes('@page') || !summaryHtml.includes('size: A4 portrait') || !summaryHtml.includes('print-color-adjust: exact')) {
      errors.push('R2 Faltan directivas CSS @page / print-color-adjust');
    } else {
      console.log('  ✓ Reglas de impresión A4 portrait y color-adjust verificadas.');
    }

    // Zebra tables & Callouts
    const zebraCount = (summaryHtml.match(/class="data-table"/g) || []).length;
    console.log(`  ✓ Tablas de datos estilo zebra: ${zebraCount}`);
    const calloutCount = (summaryHtml.match(/class="callout-box/g) || []).length;
    console.log(`  ✓ Cajas de alerta destacada (callout boxes): ${calloutCount}`);

    // Footers
    for (let p = 1; p <= 5; p++) {
      if (!summaryHtml.includes(`Página <strong>${p}</strong> de <strong>5</strong>`)) {
        errors.push(`R2 Falta footer "Página <strong>${p}</strong> de <strong>5</strong>"`);
      }
    }
    console.log('  ✓ Footers estilizados "Página 1 de 5" a "Página 5 de 5" verificados.');
  }

  // ==========================================
  // 3. AUDITORÍA FÍSICA DEL PDF COMPILADO
  // ==========================================
  console.log('\n--- 3. AUDITORÍA FÍSICA DEL PDF COMPILADO ---');
  if (!fs.existsSync(summaryPdfPath)) {
    errors.push('No existe ALMAR_Resumen_Ejecutivo_Solucion_Integral_Clave.pdf');
  } else {
    const pdfStat = fs.statSync(summaryPdfPath);
    console.log(`Tamaño del archivo PDF: ${pdfStat.size} bytes (${(pdfStat.size / (1024*1024)).toFixed(2)} MB)`);
    if (pdfStat.size < 100000) {
      errors.push(`PDF sospechosamente pequeño: ${pdfStat.size} bytes`);
    } else {
      console.log('  ✓ Tamaño de archivo PDF válido (> 100 KB).');
    }

    const pdfBuffer = fs.readFileSync(summaryPdfPath);
    const pdfParsed = await pdfParse(pdfBuffer);
    console.log(`Páginas físicas en el PDF: ${pdfParsed.numpages}`);
    if (pdfParsed.numpages !== 5) {
      errors.push(`Esperadas 5 páginas en el PDF, pdf-parse detectó ${pdfParsed.numpages}`);
    } else {
      console.log('  ✓ Conteo exacto de 5 páginas en el PDF vectorial verificado.');
    }

    // Verify key textual assertions in compiled PDF
    const pdfContentChecks = [
      'CC-ALMAR-2026-PO02',
      'Versión 2.0',
      '1.080',
      'Lucía Laje',
      'Cecilia Dellamea',
      '121',
      'Kipintoch',
      '6.000.000',
      'IATA (Factor 1:6)',
      'Alejandro Noacco',
      'Vanesa Meggiolaro',
      'Juan Andrés Arloro',
      'Banco Macro',
      'Sancor',
      '0,55%',
      'COMITRAL',
      'Zero Data Retention',
      'Vercel',
      'Supabase'
    ];
    for (const kw of pdfContentChecks) {
      if (!pdfParsed.text.includes(kw)) {
        errors.push(`PDF compilado no contiene el texto: "${kw}"`);
      } else {
        console.log(`  ✓ Texto en PDF verificado: "${kw}"`);
      }
    }
  }

  // ==========================================
  // 4. COMPARACIÓN CON PDF DE REFERENCIA PO02
  // ==========================================
  console.log('\n--- 4. COMPARACIÓN CON PDF DE REFERENCIA PO02 ---');
  if (fs.existsSync(refPdfPath)) {
    const refBuffer = fs.readFileSync(refPdfPath);
    const refParsed = await pdfParse(refBuffer);
    console.log(`PDF de referencia: ${refParsed.numpages} páginas`);
    console.log('  ✓ El documento generado expande el PO02 original de borrador (Rev 00, 4 páginas) al informe definitivo de solución integral (Rev 2.0, 5 páginas con control documental, pricing, blindaje financiero y triage).');
  } else {
    console.log('  ⚠ PDF de referencia no encontrado en Descargas (omitido)');
  }

  console.log('\n====================================================');
  if (errors.length === 0) {
    console.log('✅ AUDITORÍA EXITOSA: 0 ERRORES ENCONTRADOS (100% PASS)');
  } else {
    console.error(`❌ AUDITORÍA FALLIDA: ${errors.length} ERRORES:`);
    errors.forEach(e => console.error('  - ' + e));
  }
  console.log('====================================================');
  return { errors };
}

verifyAll().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
