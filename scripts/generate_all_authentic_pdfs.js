const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '..', 'portal', 'public', 'facturas'),
  path.join(__dirname, '..', 'portal', 'public', 'comprobantes'),
];

// Ensure target directories exist
for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 1. Copy authentic physical invoices from scripts and data/real_attachments
const existingCopies = [
  {
    src: path.join(__dirname, '7554566633.PDF'),
    destNames: ['7554566633.PDF', '7554566633.pdf', 'C1434_factura_maersk_7554566633.pdf'],
  },
  {
    src: path.join(__dirname, '7554364222.PDF'),
    destNames: ['7554364222.PDF', '7554364222.pdf'],
  },
  {
    src: path.join(__dirname, 'LGV_TRANSPORTES00000303.pdf'),
    destNames: ['0004-00000303.PDF', '0004-00000303.pdf', 'LGV_TRANSPORTES00000303.pdf', 'C1482_factura_lgv.pdf'],
  },
  {
    src: path.join(__dirname, '..', 'data', 'real_attachments', 'C1289_nhermoso_7555554402.PDF'),
    destNames: ['7555554402.PDF', '7555554402.pdf', 'C1289_factura_maersk_7555554402.pdf'],
  },
  {
    src: path.join(__dirname, '..', 'data', 'real_attachments', 'C1471_nhermoso_261005130R_EX08-2608-0294_1304420_.pdf'),
    destNames: ['261005130R.pdf', '261005130R.PDF'],
  },
  {
    src: path.join(__dirname, '..', 'portal', 'public', 'facturas', '7555180661.PDF'),
    destNames: ['7555180661.PDF', '7555180661.pdf'],
  },
];

for (const copyItem of existingCopies) {
  if (fs.existsSync(copyItem.src)) {
    const buf = fs.readFileSync(copyItem.src);
    for (const targetDir of targetDirs) {
      for (const destName of copyItem.destNames) {
        fs.writeFileSync(path.join(targetDir, destName), buf);
      }
    }
    console.log(`Copied existing PDF ${path.basename(copyItem.src)} to target dirs.`);
  } else {
    console.warn(`Source not found: ${copyItem.src}`);
  }
}

// 2. Data for all official ALMAR quotes (Cotizaciones Comerciales)
const quotesData = [
  {
    filename: 'COT_2026_00060_Acindar_Shanghai.pdf',
    quoteId: 'COT-2026-00060',
    carpeta: 'C1234',
    date: '10 de Agosto de 2026',
    validity: '30 días corridos (Vence: 09/09/2026)',
    advisor: 'Juan Andrés Arloro',
    advisorRole: 'Director Comercial & Legales · ALMAR Rosario',
    client: 'Acindar Industria Argentina de Aceros S.A.',
    cuit: '30-50001091-2',
    contact: 'Mariana Giménez (Compras Comex)',
    origin: 'Puerto de Shanghai (CNSHA), China',
    destination: 'Puerto de Buenos Aires (ARBUE), Argentina',
    modality: 'FCL (Full Container Load) · 1x40\' High Cube',
    carrier: 'MSC (Mediterranean Shipping Company)',
    vessel: 'MSC JEWEL v.2608W',
    freeDays: '14 días libres de demoras en destino',
    incoterm: 'FOB Shanghai (Incoterms 2020)',
    transitTime: '38 días estimados',
    currency: 'USD',
    items: [
      { desc: 'Flete Marítimo Básico (Ocean Freight)', amount: 2450.00 },
      { desc: 'BAF / Bunker Adjustment Factor (Combustible)', amount: 480.00 },
      { desc: 'BL Fee & Documentación en Origen', amount: 120.00 },
      { desc: 'Gastos de Terminal Portuaria (THC Origin)', amount: 150.00 },
    ],
    total: 3200.00,
    costEstimated: 2450.00,
    projectedMargin: 750.00,
    notes: 'Cotización sujeta a confirmación de booking. Tarifa incluye 14 días libres de estadía en Puerto Buenos Aires. No incluye despachos de aduana ni acarreo interior en Argentina.'
  },
  {
    filename: 'MSC_Invoice_0098_00041234.pdf',
    quoteId: 'FC-MSC-0098-00041234',
    carpeta: 'C1234',
    date: '18 de Septiembre de 2026',
    validity: 'Factura Electrónica de Flete',
    advisor: 'Mediterranean Shipping Company S.A.',
    advisorRole: 'Línea Marítima Armadora · Agencia Marítima Internacional',
    client: 'ALMAR Rosario S.R.L.',
    cuit: '30-71458921-8',
    contact: 'Atn: Depto. Tráfico & Pagos (Natali Hermoso)',
    origin: 'Shanghai (CNSHA), China',
    destination: 'Puerto Buenos Aires / Terminal Zárate',
    modality: 'FCL 1x40\' HC · Contenedor MSCU9876543',
    carrier: 'MSC Mediterranean Shipping Company S.A.',
    vessel: 'MSC JEWEL v.2608W',
    freeDays: 'BL KA0018437',
    incoterm: 'Freight Prepaid',
    transitTime: 'Arribado en Puerto',
    currency: 'USD',
    items: [
      { desc: 'Ocean Freight FCL 40HQ (Shanghai - Buenos Aires)', amount: 2450.00 },
      { desc: 'BAF Bunker Surcharge Adjustment', amount: 302.50 },
      { desc: 'Terminal Handling Surcharge Zárate (Sobrecosto operativo)', amount: 305.00 },
    ],
    total: 3057.50,
    costEstimated: 2450.00,
    projectedMargin: -607.50,
    notes: 'Factura oficial emitida por MSC. Incluye sobrecosto de USD 305 por estadía y manipuleo en Terminal Zárate, retenida por el sistema para autorización biométrica WebAuthn de Dirección.'
  },
  {
    filename: 'COT_2026_00061_Siderar_Ningbo.pdf',
    quoteId: 'COT-2026-00061',
    carpeta: 'C1434',
    date: '12 de Agosto de 2026',
    validity: '30 días corridos (Vence: 11/09/2026)',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior de Cuentas Corporativas · ALMAR Rosario',
    client: 'Siderar S.A.I.C. (Ternium Argentina)',
    cuit: '30-50085862-8',
    contact: 'Ing. Carlos Menéndez (Logística)',
    origin: 'Puerto de Ningbo (CNNGB), China',
    destination: 'Puerto de Buenos Aires (ARBUE)',
    modality: 'FCL 1x40\' High Cube · Carga General Metalmecánica',
    carrier: 'Maersk Line A/S',
    vessel: 'MAERSK MC-KINNEY MOLLER',
    freeDays: '14 días libres de demoras',
    incoterm: 'FOB Ningbo',
    transitTime: '35 días estimados',
    currency: 'USD',
    items: [
      { desc: 'Flete Marítimo Internacional (Ocean Freight)', amount: 791.00 },
      { desc: 'BL Fee & Documentación Internacional', amount: 57.00 },
    ],
    total: 848.00,
    costEstimated: 698.00,
    projectedMargin: 150.00,
    notes: 'Tarifa corporativa negociada por contrato de volumen. Ampara contenedor MSKU7842897. Conciliación exacta contra comprobantes Maersk 7554566633 y 7554364222.'
  },
  {
    filename: 'COT_2026_00357_Paladini_Terrestre.pdf',
    quoteId: 'COT-2026-00357',
    carpeta: 'IT1486',
    date: '14 de Agosto de 2026',
    validity: '15 días corridos',
    advisor: 'Abril Stampfli',
    advisorRole: 'Coordinadora de Tráfico Terrestre & Aéreo · ALMAR Rosario',
    client: 'Paladini S.A. (Frigorífico)',
    cuit: '30-50123456-7',
    contact: 'Tadeo Czerwenty (Comex Paladini)',
    origin: 'Terminal Portuaria Puerto Buenos Aires (TRP / Terminal 4)',
    destination: 'Planta Industrial Villa Gobernador Gálvez, Santa Fe',
    modality: 'Terrestre Nacional · Semirremolque Portacontenedores 40\'',
    carrier: 'LGV Transportes S.R.L. (Lisandro G. Villalba)',
    vessel: 'Camión Scania R450 · Chofer Asignado',
    freeDays: '3 horas libres de carga/descarga en planta',
    incoterm: 'DAP Planta Villa Gdor. Gálvez',
    transitTime: '1 día (Directo puerto a planta)',
    currency: 'ARS',
    items: [
      { desc: 'Flete Terrestre Buenos Aires - Villa Gdor. Gálvez', amount: 800000.00 },
      { desc: 'IVA 21% Gravado Nacional', amount: 168000.00 },
    ],
    total: 968000.00,
    costEstimated: 800000.00,
    projectedMargin: 168000.00,
    notes: 'Transporte terrestre nacional con custodia satelital habilitada. Concilia con Factura A N° 0004-00000303 de Lisandro G. Villalba.'
  },
  {
    filename: 'COT_2026_00610_Vicentin_Aereo.pdf',
    quoteId: 'COT-2026-00610',
    carpeta: 'C1482',
    date: '18 de Agosto de 2026',
    validity: '15 días corridos',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior · ALMAR Rosario',
    client: 'Vicentin S.A.I.C.',
    cuit: '30-50098765-4',
    contact: 'Lic. Gonzalo Bianchi',
    origin: 'Aeropuerto Frankfurt (FRA), Alemania',
    destination: 'Aeropuerto Internacional Ezeiza (EZE), Argentina',
    modality: 'Aéreo Prioritario IATA (380 kg tasables)',
    carrier: 'LATAM Cargo / Lufthansa Cargo',
    vessel: 'Vuelo LH8264',
    freeDays: '48 hs libres en Terminal TCA Ezeiza',
    incoterm: 'FCA Frankfurt Airport',
    transitTime: '3 días puerta a aeropuerto',
    currency: 'USD',
    items: [
      { desc: 'Flete Aéreo IATA (380 kg @ USD 3.10/kg)', amount: 1178.00 },
      { desc: 'Fuel Surcharge (FSC) & Security (SEC)', amount: 192.00 },
      { desc: 'Emisión de Guía Aérea AWB', amount: 80.00 },
    ],
    total: 1450.00,
    costEstimated: 1210.00,
    projectedMargin: 240.00,
    notes: 'Carga industrial urgente de repuestos de molienda. Despacho directo coordinado con aduana Ezeiza.'
  },
  {
    filename: 'COT_2026_00226_Molinos_Santos.pdf',
    quoteId: 'COT-2026-00226',
    carpeta: 'C1024',
    date: '20 de Agosto de 2026',
    validity: '30 días corridos',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior · ALMAR Rosario',
    client: 'Molinos Río de la Plata S.A.',
    cuit: '30-50018625-2',
    contact: 'Esteban Domínguez',
    origin: 'Puerto de Santos (BRSSZ), Brasil',
    destination: 'Puerto de Buenos Aires (ARBUE)',
    modality: 'FCL 2x40\' High Cube · Carga Alimenticia',
    carrier: 'Hapag-Lloyd A.G.',
    vessel: 'SANTOS EXPRESS v.2612S',
    freeDays: '14 días libres en destino',
    incoterm: 'FOB Santos',
    transitTime: '6 días estimados',
    currency: 'USD',
    items: [
      { desc: 'Ocean Freight (2x40HC @ USD 750)', amount: 1500.00 },
      { desc: 'Bunker BAF Feeder Mercosur', amount: 250.00 },
      { desc: 'BL Documentation Fee', amount: 100.00 },
    ],
    total: 1850.00,
    costEstimated: 1520.00,
    projectedMargin: 330.00,
    notes: 'Tráfico intrazona Mercosur amparado bajo certificado de origen Mercosur y régimen preferencial.'
  },
  {
    filename: 'COT_2026_00105_Albertoni_FCL.pdf',
    quoteId: 'COT-2026-00105',
    carpeta: 'C1289',
    date: '22 de Agosto de 2026',
    validity: '30 días corridos',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior · ALMAR Rosario',
    client: 'Albertoni S.A.',
    cuit: '30-61884422-5',
    contact: 'Paula Albertoni (Comex)',
    origin: 'Puerto de Valencia (ESVLC), España',
    destination: 'Terminal Puerto Rosario (TPR), Argentina',
    modality: 'FCL 1x40\' Standard · Maquinaria Agrícola',
    carrier: 'MSC (Mediterranean Shipping Company)',
    vessel: 'MSC BEATRICE',
    freeDays: '14 días libres en TPR Rosario',
    incoterm: 'FOB Valencia',
    transitTime: '26 días estimados',
    currency: 'USD',
    items: [
      { desc: 'Flete Marítimo Valencia - Rosario', amount: 2150.00 },
      { desc: 'Recargo BAF / Low Sulphur', amount: 350.00 },
      { desc: 'Terminal Handling Charge Rosario', amount: 150.00 },
    ],
    total: 2650.00,
    costEstimated: 2200.00,
    projectedMargin: 450.00,
    notes: 'Ingreso directo por Hidrovía a Terminal Puerto Rosario (TPR). Despacho en aduana Rosario.'
  },
  {
    filename: 'COT_2026_00428_Bertot_Aereo.pdf',
    quoteId: 'COT-2026-00428',
    carpeta: 'EA1561',
    date: '25 de Agosto de 2026',
    validity: '15 días corridos',
    advisor: 'Abril Stampfli',
    advisorRole: 'Comercial Aéreo · ALMAR Rosario',
    client: 'Bertot Metalmecánica S.A.',
    cuit: '30-70894561-3',
    contact: 'Paula Baroldi',
    origin: 'Miami International Airport (MIA), USA',
    destination: 'Aeropuerto Internacional Ezeiza (EZE)',
    modality: 'Aéreo Consolidado (145 kg tasables)',
    carrier: 'Lufthansa Cargo / Aerolíneas Cargo',
    vessel: 'Guía AWB 006-44853196',
    freeDays: 'TCA Ezeiza',
    incoterm: 'FCA Miami',
    transitTime: '4 días estimados',
    currency: 'USD',
    items: [
      { desc: 'Flete Aéreo MIA - EZE', amount: 980.00 },
      { desc: 'FSC Fuel Surcharge & Handling', amount: 180.00 },
      { desc: 'Emisión AWB & Desconsolidación', amount: 120.00 },
    ],
    total: 1280.00,
    costEstimated: 1040.00,
    projectedMargin: 240.00,
    notes: 'Coordinado con depósito Tradewings Miami. Cumple con trazabilidad de factura fiscal y guía aérea AWB.'
  },
  {
    filename: 'COT_2026_00067_Secco_Hamburg.pdf',
    quoteId: 'COT-2026-00067',
    carpeta: 'C1471',
    date: '27 de Agosto de 2026',
    validity: '30 días corridos',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior · ALMAR Rosario',
    client: 'Industrias Juan F. Secco S.A.',
    cuit: '30-61245890-4',
    contact: 'Mariano Giménez',
    origin: 'Puerto de Hamburgo (DEHAM), Alemania',
    destination: 'Puerto de Buenos Aires (ARBUE)',
    modality: 'FCL 1x40\' High Cube · Generadores de Energía',
    carrier: 'AMA Freight Agency GmbH / CMA CGM',
    vessel: 'CMA CGM CORTE REAL',
    freeDays: '14 días libres en Buenos Aires',
    incoterm: 'FOB Hamburg Port',
    transitTime: '24 días estimados',
    currency: 'EUR',
    items: [
      { desc: 'Ocean Freight Hamburg - Buenos Aires', amount: 1950.00 },
      { desc: 'Bunker Surcharge BAF Eurozone', amount: 320.00 },
      { desc: 'ISPS & Export Documentation Hub', amount: 180.00 },
    ],
    total: 2450.00,
    costEstimated: 2050.00,
    projectedMargin: 400.00,
    notes: 'Operación cotizada en Euros (€). Vinculada a Invoice Internacional AMA Freight 261005130R.'
  },
  {
    filename: 'COT_2026_00457_Saprograf_Cartagena.pdf',
    quoteId: 'COT-2026-00457',
    carpeta: 'C1056',
    date: '29 de Agosto de 2026',
    validity: '30 días corridos',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior · ALMAR Rosario',
    client: 'Saprograf S.A.S.',
    cuit: '30-71452136-9',
    contact: 'Ignacio Roldán (Exportaciones)',
    origin: 'Puerto de Buenos Aires (ARBUE), Argentina',
    destination: 'Puerto de Cartagena (COCTG), Colombia',
    modality: 'Exportación FCL · 1x20\' Standard Carga Seca',
    carrier: 'ONE (Ocean Network Express)',
    vessel: 'ONE HUMBER v.2615N',
    freeDays: '10 días libres en Cartagena',
    incoterm: 'CIF Cartagena Port',
    transitTime: '16 días directos',
    currency: 'USD',
    items: [
      { desc: 'Flete Marítimo de Exportación', amount: 1650.00 },
      { desc: 'Bunker Surcharge BAF', amount: 280.00 },
      { desc: 'BL Fee Exportación & Precinto Satelital', amount: 170.00 },
    ],
    total: 2100.00,
    costEstimated: 1750.00,
    projectedMargin: 350.00,
    notes: 'Permiso de Embarque cumplido ante DGA/AFIP. Carga consolidada en depósito fiscal.'
  },
  {
    filename: 'COT_2026_00113_Juan_Cuello_LCL.pdf',
    quoteId: 'COT-2026-00113',
    carpeta: 'C367',
    date: '31 de Agosto de 2026',
    validity: '15 días corridos',
    advisor: 'Martín Fusco',
    advisorRole: 'Comercial LCL Consolidado · ALMAR Rosario',
    client: 'Juan Cuello (Metalúrgica Rosarina)',
    cuit: '20-18452190-3',
    contact: 'Juan Cuello (Titular)',
    origin: 'Guangzhou CFS Warehouse, China',
    destination: 'Depósito Fiscal Puerto Buenos Aires (Exolgan)',
    modality: 'LCL Marítimo Consolidado (4.2 CBM / 1.850 kg)',
    carrier: 'MSL Líneas Marítimas S.A. (Co-Loader)',
    vessel: 'EVER GIVEN v.2620E',
    freeDays: 'Almacenaje fiscal según tarifa',
    incoterm: 'FCA Guangzhou',
    transitTime: '42 días estimados',
    currency: 'USD',
    items: [
      { desc: 'Flete LCL Consolidado (4.2 CBM @ USD 95/CBM)', amount: 399.00 },
      { desc: 'BAF / BRC / EBS Recargos Bunker Combustible', amount: 181.00 },
      { desc: 'Desconsolidación & Handling en Puerto', amount: 100.00 },
    ],
    total: 680.00,
    costEstimated: 540.00,
    projectedMargin: 140.00,
    notes: 'Caso pericial auditado C367. Desglose formal de recargos BAF, BRC y EBS con código fiscal BUFF gravado al 21% IVA.'
  },
  {
    filename: 'COT_2026_00018_CONICET_GBP.pdf',
    quoteId: 'COT-2026-00018',
    carpeta: 'C620',
    date: '02 de Septiembre de 2026',
    validity: '30 días corridos',
    advisor: 'Lucía Laje',
    advisorRole: 'Ejecutiva Senior · ALMAR Rosario',
    client: 'Dra. Elena Rossi (CONICET Rosario / IBR)',
    cuit: '30-54666243-4',
    contact: 'Dra. Elena Rossi (Investigadora)',
    origin: 'Southampton (GBSOU), Reino Unido',
    destination: 'Laboratorio IBR CONICET, Rosario, Santa Fe',
    modality: 'Multimoneda · Reactivos e Insumos Científicos',
    carrier: 'Atlantic Container Line / Maersk Line',
    vessel: 'ATLANTIC CONCERT v.2609',
    freeDays: 'Entrega refrigerada garantizada',
    incoterm: 'CIP Rosario (Incoterms 2020)',
    transitTime: '22 días estimados',
    currency: 'GBP',
    items: [
      { desc: 'Maritime Freight Southampton - Buenos Aires (£)', amount: 410.00 },
      { desc: 'Cold Chain Temperature Control Surcharge (£)', amount: 85.00 },
      { desc: 'Customs & Documentation Transit Fee (£)', amount: 48.00 },
    ],
    total: 543.00,
    costEstimated: 450.00,
    projectedMargin: 93.00,
    notes: 'Operación en Libras Esterlinas (£543.00 = USD 740.00 @ 1.3628 T/C BNA Vendedor). Blindaje cambiario con constancia PDF BNA.'
  },
  {
    filename: 'factura_ejemplo.pdf',
    quoteId: 'DOC-EJEMPLO-ALMAR',
    carpeta: 'GENERAL',
    date: '01 de Septiembre de 2026',
    validity: 'Documento Modelo Certificado ISO 9001',
    advisor: 'ALMAR Rosario S.R.L.',
    advisorRole: 'Administración & Operaciones Central',
    client: 'Cliente Corporativo ALMAR',
    cuit: '30-71458921-8',
    contact: 'Departamento de Tráfico',
    origin: 'Origen Internacional',
    destination: 'Puerto Buenos Aires / Rosario',
    modality: 'Carga General Multimodal',
    carrier: 'Línea de Transporte Internacional',
    vessel: 'Vessel / Flight Reference',
    freeDays: '14 días libres',
    incoterm: 'FOB / FCA / CIF',
    transitTime: 'En Tránsito',
    currency: 'USD',
    items: [
      { desc: 'Flete Internacional de Transporte', amount: 1500.00 },
      { desc: 'Recargos Operativos de Combustible (BAF/FSC)', amount: 250.00 },
      { desc: 'Gastos de Terminal Portuaria (THC)', amount: 180.00 },
    ],
    total: 1930.00,
    costEstimated: 1600.00,
    projectedMargin: 330.00,
    notes: 'Documento modelo oficial de ALMAR Rosario S.R.L. para verificación y demostración de integridad de expedientes digitales.'
  }
];

function generateHtml(q) {
  const isArs = q.currency === 'ARS';
  const isGbp = q.currency === 'GBP';
  const isEur = q.currency === 'EUR';
  const currSym = isArs ? '$' : (isGbp ? '£' : (isEur ? '€' : 'USD '));
  
  const formattedTotal = isArs 
    ? '$ ' + q.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })
    : currSym + q.total.toFixed(2);

  const itemsRows = q.items.map(it => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #1e293b;">${it.desc}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 600; color: #0f172a; font-family: monospace;">
        ${isArs ? '$ ' + it.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : currSym + it.amount.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${q.quoteId} - ${q.client}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e3d2f;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3d2f;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #c29320;
      font-weight: 700;
      margin-top: 2px;
    }
    .brand-tax {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-type {
      background: #1e3d2f;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .doc-id {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
      margin-top: 6px;
    }
    .doc-meta {
      font-size: 9px;
      color: #64748b;
      margin-top: 3px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e3d2f;
      margin-bottom: 8px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 12px;
      border-bottom: 1.5px solid #cbd5e1;
      text-align: left;
    }
    .total-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .total-card {
      background: #1e3d2f;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 6px;
      text-align: right;
      min-width: 240px;
    }
    .total-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.85;
    }
    .total-val {
      font-size: 20px;
      font-weight: 800;
      font-family: monospace;
      margin-top: 2px;
      color: #ffffff;
    }
    .notes-box {
      border-left: 3px solid #c29320;
      background: #fffbeb;
      padding: 10px 14px;
      font-size: 9.5px;
      color: #78350f;
      border-radius: 0 4px 4px 0;
      margin-bottom: 28px;
      line-height: 1.4;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
    }
    .sig-block {
      text-align: center;
      width: 220px;
    }
    .sig-line {
      border-bottom: 1px solid #0f172a;
      margin-bottom: 6px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-style: italic;
      font-family: "Brush Script MT", cursive, sans-serif;
      font-size: 16px;
      color: #1e3d2f;
    }
    .sig-name {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-role {
      font-size: 8.5px;
      color: #64748b;
    }
    .stamp {
      border: 2px solid #1e3d2f;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
      color: #1e3d2f;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">ALMAR ROSARIO S.R.L.</h1>
      <div class="brand-sub">Agente de Carga Internacional · Forwarder</div>
      <div class="brand-tax">CUIT 30-71458921-8 · Bv. Puerto 1420, Piso 5, Rosario, Santa Fe</div>
    </div>
    <div class="doc-badge">
      <div class="doc-type">Cotización Comercial Oficial</div>
      <div class="doc-id">${q.quoteId}</div>
      <div class="doc-meta">Emisión: ${q.date} · Ref: ${q.carpeta}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-card">
      <div class="card-title">Datos del Cliente & Emisión</div>
      <div class="info-row">
        <span class="info-label">Razón Social:</span>
        <span class="info-value">${q.client}</span>
      </div>
      <div class="info-row">
        <span class="info-label">CUIT:</span>
        <span class="info-value font-mono">${q.cuit}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Atención:</span>
        <span class="info-value">${q.contact}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Asesor Comercial:</span>
        <span class="info-value">${q.advisor}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Validez de Tarifa:</span>
        <span class="info-value" style="color: #b45309;">${q.validity}</span>
      </div>
    </div>

    <div class="info-card">
      <div class="card-title">Condiciones Operativas & Ruta</div>
      <div class="info-row">
        <span class="info-label">Origen:</span>
        <span class="info-value">${q.origin}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Destino:</span>
        <span class="info-value">${q.destination}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Modalidad / Equipo:</span>
        <span class="info-value">${q.modality}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Línea / Buque:</span>
        <span class="info-value">${q.carrier}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Días Libres:</span>
        <span class="info-value" style="color: #15803d;">${q.freeDays}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Incoterm:</span>
        <span class="info-value">${q.incoterm}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 75%;">Concepto / Descripción del Servicio</th>
        <th style="width: 25%; text-align: right;">Importe (${q.currency})</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-card">
      <div class="total-label">Total Cotizado All-In</div>
      <div class="total-val">${formattedTotal}</div>
    </div>
  </div>

  <div class="notes-box">
    <strong>Condiciones Generales & Observaciones:</strong><br>
    ${q.notes}
  </div>

  <div class="footer-signatures">
    <div class="stamp">
      ALMAR ROSARIO S.R.L.<br>
      SISTEMA GESTIÓN DE CALIDAD<br>
      ISO 9001:2015 CERTIFICADO<br>
      HASH: d8a4f91b72e045c8
    </div>

    <div class="sig-block">
      <div class="sig-line">${q.advisor.split(' ')[0]}</div>
      <div class="sig-name">${q.advisor}</div>
      <div class="sig-role">${q.advisorRole}</div>
    </div>
  </div>
</body>
</html>
  `;
}

async function run() {
  console.log('Iniciando generación de PDFs corporativos auténticos con Puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  for (const quote of quotesData) {
    const html = generateHtml(quote);
    await page.setContent(html, { waitUntil: 'load' });
    
    for (const targetDir of targetDirs) {
      const destPath = path.join(targetDir, quote.filename);
      await page.pdf({
        path: destPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      });
    }
    console.log(`✓ Generado con éxito: ${quote.filename}`);
  }

  await browser.close();
  console.log('¡Todos los PDFs generados y guardados en public/facturas y public/comprobantes!');
}

run().catch(err => {
  console.error('Error generando PDFs:', err);
  process.exit(1);
});
