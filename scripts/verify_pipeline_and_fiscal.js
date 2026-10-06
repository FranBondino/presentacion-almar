const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Import fiscal classifier & gmail parser logic directly
// Let's implement the exact logic from classifier.ts and parser.ts in JS for full verification

const FOLDER_CODE_REGEX = /(?:^|[^a-zA-Z0-9])((?:C|IT|TL|EA|EM|ET|EXP|IMP|L)\d{3,5})(?=[^a-zA-Z0-9]|$)/gi;
const KIPINTOCH_CANONICAL_FOLDER_REGEX = /(?:^|[^a-zA-Z0-9])(OR\/[A-Z]-\d{6}[A-Z]{2}-\d{7})(?=[^a-zA-Z0-9]|$)/gi;
const CONTAINER_NUMBER_REGEX = /\b([A-Z]{4}\d{7})\b/g;
const BL_NUMBER_PREFIXED_REGEX = /(?:MBL|HBL|BL|HAWB|MAWB|B\/L|BILL OF LADING)[:\s/#-]*([A-Z0-9]{6,20})/gi;
const BL_NUMBER_STANDALONE_REGEX = /\b([A-Z]{2,5}\d{6,14})\b/g;
const BOOKING_NUMBER_REGEX = /(?:BK|BKG|BOOKING|RESERVA)[:\s/#-]*([A-Z0-9]{6,16})/gi;

const KNOWN_INTERNATIONAL_CARRIERS = [
  'MAERSK', 'MSC', 'MEDITERRANEAN SHIPPING', 'HAPAG-LLOYD', 'HAPAG LLOYD',
  'CMA CGM', 'COSCO', 'EVERGREEN', 'ONE', 'OCEAN NETWORK EXPRESS',
  'YANG MING', 'ZIM', 'HAMBURG SUD', 'EVERSAIL', 'DSV', 'KUEHNE', 'NAGEL',
  'EXPEDITORS', 'SCHENKER', 'DHL GLOBAL FORWARDING', 'MUNSER', 'ALMAR'
];

const INTERNATIONAL_FREIGHT_KEYWORDS = [
  'OCEAN FREIGHT', 'FLETE MARITIMO', 'FLETE MARÍTIMO', 'AIR FREIGHT', 'FLETE AEREO', 'FLETE AÉREO',
  'BAF', 'CAF', 'BUNKER', 'EMISION DE DOCUMENTOS', 'DOCUMENTACION', 'DOCUMENTACIÓN',
  'DOC FEE', 'BL FEE', 'CONTAINER PROTECT', 'CONTAINER MAINTENANCE', 'THC', 'TERMINAL HANDLING',
  'MANIPULACION EN TERMINAL', 'MANIPULACIÓN EN TERMINAL', 'TASA DE DOCUMENTACION',
  'TASA DE DOCUMENTACIÓN', 'ISPS', 'PORT SECURITY', 'SEAL FEE', 'DEMURRAGE', 'DETENTION',
  'DEMORAS', 'OVERWEIGHT SURCHARGE', 'PEAK SEASON', 'ORIGIN CHARGES', 'DESTINATION CHARGES'
];

const DOMESTIC_TRUCKING_KEYWORDS = [
  'TRASLADO', 'FLETE TERRESTRE', 'FLETE NACIONAL', 'TRANSPORTE LOCAL', 'CAMION', 'CAMIÓN',
  'ACARREO', 'TRAMO NACIONAL', 'CHASIS', 'CARRETON', 'CARRETÓN', 'CARGA SUELTA',
  'REPARTO', 'LOGISTICA NACIONAL', 'LOGÍSTICA NACIONAL', 'LGV', 'TRANSPORTE'
];

function classifyFiscal(description, options = {}) {
  const descUpper = (description || '').toUpperCase();
  const isForeign = options.isForeignIssuer ||
    KNOWN_INTERNATIONAL_CARRIERS.some(c => (options.issuerName || '').toUpperCase().includes(c)) ||
    options.invoiceType === 'INVOICE_EXTERIOR' ||
    (options.currency === 'USD' && KNOWN_INTERNATIONAL_CARRIERS.some(c => (options.issuerName || '').toUpperCase().includes(c)));

  if (descUpper.includes('REINTEGRO') || descUpper.includes('SENASA') || descUpper.includes('NO GRAVADO')) {
    return { ivaRate: 0, fiscalCategory: 'NO_GRAVADO', rationale: 'Concepto no gravado / reintegro oficial AFIP' };
  }

  const hasIntlKeyword = INTERNATIONAL_FREIGHT_KEYWORDS.some(kw => descUpper.includes(kw));
  if (isForeign || (hasIntlKeyword && options.currency !== 'ARS')) {
    return {
      ivaRate: 0,
      fiscalCategory: 'INTERNACIONAL_EXENTO_0',
      rationale: 'Transporte / gastos internacionales exentos de IVA (Ley 23.349 Art. 7h/34)'
    };
  }

  const hasTruckingKeyword = DOMESTIC_TRUCKING_KEYWORDS.some(kw => descUpper.includes(kw));
  if (hasTruckingKeyword || options.invoiceType === 'FACTURA_A' || options.currency === 'ARS') {
    return {
      ivaRate: 21,
      fiscalCategory: 'NACIONAL_GRAVADO_21',
      rationale: 'Transporte terrestre local o comprobante nacional gravado 21% IVA'
    };
  }

  return {
    ivaRate: 0,
    fiscalCategory: 'INTERNACIONAL_EXENTO_0',
    rationale: 'Operación de comercio exterior exenta 0% IVA'
  };
}

function unescapePdfString(str) {
  return str
    .replace(/\\([0-7]{1,3})/g, (match, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\([()\\])/g, '$1');
}

function extractPdfFull(filePath) {
  const buf = fs.readFileSync(filePath);
  const raw = buf.toString('latin1');
  const tokens = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(raw)) !== null) {
    const rawStream = Buffer.from(match[1], 'latin1');
    let decompressed = '';
    try {
      decompressed = zlib.inflateSync(rawStream).toString('latin1');
    } catch (e1) {
      try {
        decompressed = zlib.inflateRawSync(rawStream).toString('latin1');
      } catch (e2) {
        decompressed = match[1];
      }
    }
    if (!decompressed) continue;

    // TJ
    const tjRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const inner = tjMatch[1];
      const strMatches = inner.match(/\(([^()]*)\)/g);
      if (strMatches) {
        const textChunk = strMatches.map(s => unescapePdfString(s.slice(1, -1))).join('');
        if (textChunk.trim().length > 0) tokens.push(textChunk.trim());
      }
      const hexMatches = inner.match(/<([0-9A-Fa-f]+)>/g);
      if (hexMatches) {
        let hexDecoded = '';
        for (const h of hexMatches) {
          const rawHex = h.slice(1, -1);
          for (let i = 0; i < rawHex.length; i += 2) {
            const code = parseInt(rawHex.substr(i, 2), 16);
            if (code >= 32 && code <= 255) hexDecoded += String.fromCharCode(code);
          }
        }
        if (hexDecoded.trim().length > 0) tokens.push(hexDecoded.trim());
      }
    }

    // single Tj
    const singleTjRegex = /\(([^()]*)\)\s*Tj/g;
    let sMatch;
    while ((sMatch = singleTjRegex.exec(decompressed)) !== null) {
      const clean = unescapePdfString(sMatch[1]).trim();
      if (clean.length > 0) tokens.push(clean);
    }

    // hex Tj
    const hexTjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let hMatch;
    while ((hMatch = hexTjRegex.exec(decompressed)) !== null) {
      const rawHex = hMatch[1];
      let decoded = '';
      for (let i = 0; i < rawHex.length; i += 2) {
        const code = parseInt(rawHex.substr(i, 2), 16);
        if (code >= 32 && code <= 255) decoded += String.fromCharCode(code);
      }
      if (decoded.trim().length > 0) tokens.push(decoded.trim());
    }
  }

  const fullText = tokens.join('\n');
  return {
    tokens,
    fullText
  };
}

function parseLogisticsIdentifiers(text) {
  const folderCodes = new Set();
  let fMatch;
  const fRegex = new RegExp(FOLDER_CODE_REGEX.source, 'gi');
  while ((fMatch = fRegex.exec(text)) !== null) {
    if (fMatch[1]) folderCodes.add(fMatch[1].toUpperCase());
  }

  const containerNumbers = new Set();
  const cMatches = text.match(CONTAINER_NUMBER_REGEX);
  if (cMatches) {
    cMatches.forEach(c => containerNumbers.add(c.trim().toUpperCase()));
  }

  const blNumbers = new Set();
  let blMatch;
  const blRegex = new RegExp(BL_NUMBER_PREFIXED_REGEX.source, 'gi');
  while ((blMatch = blRegex.exec(text)) !== null) {
    if (blMatch[1] && blMatch[1].length >= 6) blNumbers.add(blMatch[1].toUpperCase());
  }

  return {
    folderCodes: Array.from(folderCodes),
    containerNumbers: Array.from(containerNumbers),
    blNumbers: Array.from(blNumbers)
  };
}

async function analyzeAll() {
  const dir = 'data/real_attachments';
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`\n======================================================================`);
  console.log(`📋 AUDITORÍA INTEGRAL DE TEXTO Y CLASIFICACIÓN FISCAL DE ${files.length} PDFs REALES`);
  console.log(`======================================================================\n`);

  const reportItems = [];

  for (const filename of files) {
    const fullPath = path.join(dir, filename);
    const stats = fs.statSync(fullPath);
    const { tokens, fullText } = extractPdfFull(fullPath);
    const logistics = parseLogisticsIdentifiers(fullText + ' ' + filename);

    // Heuristic document classification
    let docType = 'DOCUMENTO_LOGISTICO';
    let issuer = 'DESCONOCIDO';
    let currency = 'USD';
    let totalAmount = null;

    if (filename.includes('Maersk') || filename.includes('7555') || filename.includes('7554')) {
      issuer = 'MAERSK LINE';
      if (filename.includes('Comprob_de_pago')) {
        docType = 'COMPROBANTE_TRANSFERENCIA_BANCARIA';
        currency = 'USD';
      } else {
        docType = 'FACTURA_MARITIMA_EXTERIOR';
        currency = 'USD';
      }
    } else if (filename.includes('LGV_TRANSPORTES')) {
      docType = 'FACTURA_A_TRANSPORTE_NACIONAL';
      issuer = 'LGV TRANSPORTES';
      currency = 'ARS';
    } else if (filename.includes('Factura_A') || filename.includes('FCA_A')) {
      docType = 'FACTURA_A_VENTA_SERVICIOS';
      issuer = 'ALMAR ROSARIO S.R.L.';
      currency = 'ARS';
    } else if (filename.includes('Pre_Factura')) {
      docType = 'PRE_FACTURA_INTERNA';
      issuer = 'ALMAR ROSARIO S.R.L.';
    } else if (filename.includes('House_Bill') || filename.includes('BL') || filename.includes('AWB') || filename.includes('draft')) {
      docType = 'CONOCIMIENTO_EMBARQUE_BL_AWB';
      issuer = 'CARRIER / FORWARDER';
    } else if (filename.includes('Munser') || filename.includes('FC_67102')) {
      docType = 'FACTURA_PROVEEDOR_LOGISTICO';
      issuer = 'MUNSER';
    } else if (filename.includes('declaracionJurada') || filename.includes('26052EC')) {
      docType = 'DESPACHO_AFIP_ADUANA';
      issuer = 'AFIP / DGA';
    }

    // Run fiscal classifier
    const fiscal = classifyFiscal(fullText.substring(0, 500) || filename, {
      issuerName: issuer,
      invoiceType: docType,
      currency
    });

    const item = {
      filename,
      sizeBytes: stats.size,
      textTokensCount: tokens.length,
      detectedDocType: docType,
      detectedIssuer: issuer,
      detectedCurrency: currency,
      fiscalCategory: fiscal.fiscalCategory,
      ivaRate: fiscal.ivaRate,
      fiscalRationale: fiscal.rationale,
      logisticsFound: logistics,
      sampleTokens: tokens.slice(0, 10),
      readable: tokens.length > 0
    };

    reportItems.push(item);

    console.log(`📄 [${docType}] ${filename}`);
    console.log(`   Tamaño: ${stats.size} bytes | Tokens texto: ${tokens.length} | Legible: ${tokens.length > 0 ? '✅ SI' : '⚠️ Scan / Raw'}`);
    console.log(`   Emisor: ${issuer} | Moneda: ${currency} | Fiscal: ${fiscal.fiscalCategory} (${fiscal.ivaRate}% IVA)`);
    console.log(`   Logística detectada: ${JSON.stringify(logistics)}`);
    if (tokens.length > 0) {
      console.log(`   Muestra: ${tokens.slice(0, 6).join(' | ')}`);
    }
    console.log('');
  }

  fs.writeFileSync('data/verified_pdf_pipeline_audit.json', JSON.stringify(reportItems, null, 2));
  console.log(`💾 Reporte de auditoría guardado en data/verified_pdf_pipeline_audit.json`);
}

analyzeAll().catch(console.error);
