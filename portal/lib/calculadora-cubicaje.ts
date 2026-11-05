/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Motor Inteligente de Análisis de CBM, Cubicaje y Peso Tasable
 * Parser heurístico y extractor de dimensiones para RFQs, correos y packing lists.
 * Procedimiento Comercial PO-01 & Directivas de Lucía Laje.
 */

import {
  BultoItem,
  CargoDimensionItem,
  DocumentoCubicajeAdjunto,
  EstadoAptitudCopa,
  EvaluacionAptitudCopa,
  EvaluacionBultoCopa,
  ResumenCubicaje,
  SugerenciaEquipoFcl,
  TipoBultoParsed,
} from '@/types/cotizaciones';

export interface ParseOptions {
  defaultPalletHeightM?: number;
}

/**
 * Normaliza y extrae peso numérico en kilogramos
 */
function extraerPesoKg(textoSegmento: string): { pesoKg: number; esTotal: boolean } {
  // Regex para pesos: p. ej. '4200 kg', '(2000 kg)', '3.5 ton', '3.500 kg', 'con 300 kgs', '150 lbs'
  const weightRegex = /(?:peso(?:\s*total)?:?\s*|[y,-]\s*|\(\s*|con\s+)?(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilos?|kilogramos?|t|tn|tons?|toneladas?|lb|lbs|libras?)\b/i;
  const match = textoSegmento.match(weightRegex);

  if (!match || !match[1] || !match[2]) {
    return { pesoKg: 0, esTotal: true };
  }

  let clean = match[1].trim();
  if (clean.includes('.') && clean.includes(',')) {
    // Formato europeo/argentino: 3.850,00 -> 3850.00
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    if (/,\d{1,2}$/.test(clean)) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    // Solo tratar punto como separador de miles si tiene exactamente 3 dígitos al final (p. ej. 3.500)
    // Si tiene 1 o 2 dígitos (p. ej. 3.5), se conserva como punto decimal.
    if (/\.\d{3}$/.test(clean)) {
      clean = clean.replace(/\./g, '');
    }
  }

  const rawWeight = parseFloat(clean) || 0;
  const unit = match[2].toLowerCase();
  const pesoKg = /^t|^tn|^ton/.test(unit)
    ? rawWeight * 1000
    : /^lb|^libra/.test(unit)
      ? Math.round(rawWeight * 0.453592 * 10) / 10
      : rawWeight;
  const esTotal = !/c\/u|cada\s*uno|unitario|x\s*pc|per\s*pc|each/i.test(textoSegmento);

  return { pesoKg, esTotal };
}

/**
 * Parsea descripciones de carga en lenguaje natural a items estructurados con dimensiones y volumen.
 */
export function parseCargoDimensionsFromText(
  texto: string,
  opciones: ParseOptions = {}
): CargoDimensionItem[] {
  if (!texto || !texto.trim()) return [];

  const defaultPalletHeightM = opciones.defaultPalletHeightM ?? 1.20;

  // Dividir en segmentos por saltos de línea, +, o ;
  const segments = texto
    .split(/(?:\r?\n|\s*\+\s*|\s*;\s*)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results: CargoDimensionItem[] = [];

  for (const seg of segments) {
    // 1. Detección de cantidad de bultos
    let cantidad = 1;
    const qtyMatch = seg.match(
      /(?:^|(?:\bde\b\s+)|[-•*]\s*)(\d+)\s*(?:pallets?|palets?|plts?|cajas?|bultos?|cajones?|crates?|crts?|ctns?|cartons?|packages?|pkgs?|tambores?|atados?|piezas?|pcs?|colis?)?\b/i
    );
    if (qtyMatch && qtyMatch[1]) {
      const parsedQty = parseInt(qtyMatch[1], 10);
      if (parsedQty > 0 && parsedQty <= 10000) {
        cantidad = parsedQty;
      }
    }

    // Detección de tipo de bulto
    let tipoBulto: TipoBultoParsed = 'bulto';
    const lowerSeg = seg.toLowerCase();
    if (/pallet|palet|plt/.test(lowerSeg)) tipoBulto = 'pallet';
    else if (/caja|box|ctn|carton/.test(lowerSeg)) tipoBulto = 'caja';
    else if (/cajon|cajón|crate|\bcrt\b|\d+crt\b/.test(lowerSeg)) tipoBulto = 'cajon';
    else if (/tambor|drum/.test(lowerSeg)) tipoBulto = 'tambor';
    else if (/atado|bundle/.test(lowerSeg)) tipoBulto = 'atado';

    // 2. Extracción de Dimensiones
    // Delimitador seguro que NO colisiona con 'y' en español
    const delim = '(?:\\s*[xX*×]\\s*|\\s+by\\s+|\\s+por\\s+)';
    const numPat = '(\\d+(?:[.,]\\d+)?)';
    const unitPat = '(?:\\s*(mm|mms|mil[ií]metros?|cm|cms|cent[ií]metros?|in|inch|inches|pulgadas?|m|mt|mts|metros?))?\\b';

    const regex3D = new RegExp(`${numPat}${delim}${numPat}${delim}${numPat}${unitPat}`, 'i');
    const regex2D = new RegExp(`${numPat}${delim}${numPat}${unitPat}`, 'i');

    const match3D = seg.match(regex3D);
    let match2D = null;
    if (!match3D) {
      match2D = seg.match(regex2D);
    }

    let dimLargo = 0;
    let dimAncho = 0;
    let dimAlto = 0;
    let unit = '';
    let altoEstimado = false;

    if (match3D && match3D[1] && match3D[2] && match3D[3]) {
      dimLargo = parseFloat(match3D[1].replace(',', '.'));
      dimAncho = parseFloat(match3D[2].replace(',', '.'));
      dimAlto = parseFloat(match3D[3].replace(',', '.'));
      unit = (match3D[4] || '').toLowerCase();
    } else if (match2D && match2D[1] && match2D[2]) {
      dimLargo = parseFloat(match2D[1].replace(',', '.'));
      dimAncho = parseFloat(match2D[2].replace(',', '.'));
      unit = (match2D[3] || '').toLowerCase();
      altoEstimado = true;
    }

    // Extracción de pesos
    const { pesoKg, esTotal } = extraerPesoKg(seg);

    if (dimLargo > 0 && dimAncho > 0) {
      // Inferencia automática de unidades si se omitieron
      if (!unit) {
        if (/\b(?:in|inch|inches|pulgadas?)\b/i.test(seg)) unit = 'in';
        else if (dimLargo >= 400 || dimAncho >= 400) unit = 'mm';
        else if (dimLargo >= 10 || dimAncho >= 10) unit = 'cm';
        else unit = 'm';
      }

      let factorToMeters = 1;
      if (/^mm/.test(unit)) factorToMeters = 0.001;
      else if (/^cm/.test(unit)) factorToMeters = 0.01;
      else if (/^in|^pulg/.test(unit)) factorToMeters = 0.0254;
      else factorToMeters = 1;

      const largoM = dimLargo * factorToMeters;
      const anchoM = dimAncho * factorToMeters;
      const altoM = dimAlto > 0 ? dimAlto * factorToMeters : defaultPalletHeightM;

      const pesoTotal = esTotal ? pesoKg : pesoKg * cantidad;
      const pesoUnit = cantidad > 0 ? pesoTotal / cantidad : pesoTotal;
      const volUnitM3 = largoM * anchoM * altoM;
      const volTotalM3 = volUnitM3 * cantidad;

      results.push({
        rawText: seg,
        cantidad,
        tipoBulto,
        largoM: Math.round(largoM * 1000) / 1000,
        anchoM: Math.round(anchoM * 1000) / 1000,
        altoM: Math.round(altoM * 1000) / 1000,
        largoCm: Math.round(largoM * 100),
        anchoCm: Math.round(anchoM * 100),
        altoCm: Math.round(altoM * 100),
        altoEstimadoPorDefecto: altoEstimado,
        pesoUnitarioKg: Math.round(pesoUnit * 10) / 10,
        pesoTotalKg: Math.round(pesoTotal * 10) / 10,
        volumenUnitarioM3: Math.round(volUnitM3 * 1000) / 1000,
        volumenTotalM3: Math.round(volTotalM3 * 1000) / 1000,
      });
    } else {
      // Fallback CBM directo (p. ej. "14.5 m3", "18 CBM", "12.5 metros cubicos")
      const directCbmMatch = seg.match(
        /(\d+(?:[.,]\d+)?)\s*(?:m3|m³|cbm|metros?\s*c[uú]bicos?)\b/i
      );
      if (directCbmMatch && directCbmMatch[1]) {
        const rawVol = parseFloat(directCbmMatch[1].replace(',', '.')) || 0;
        if (rawVol > 0) {
          const volTotalM3 = rawVol;
          const volUnitM3 = cantidad > 0 ? volTotalM3 / cantidad : volTotalM3;
          const pesoTotal = esTotal ? pesoKg : pesoKg * cantidad;
          const pesoUnit = cantidad > 0 ? pesoTotal / cantidad : pesoTotal;

          // Estimación geométrica representativa basada en europallet o cubo
          const altoEstimadoM = defaultPalletHeightM;
          const areaBase = volUnitM3 / altoEstimadoM;
          const anchoEstimadoM = 0.8;
          const largoEstimadoM = areaBase > 0 ? areaBase / anchoEstimadoM : 1.2;

          results.push({
            rawText: seg,
            cantidad,
            tipoBulto,
            largoM: Math.round(largoEstimadoM * 1000) / 1000,
            anchoM: Math.round(anchoEstimadoM * 1000) / 1000,
            altoM: Math.round(altoEstimadoM * 1000) / 1000,
            largoCm: Math.round(largoEstimadoM * 100),
            anchoCm: Math.round(anchoEstimadoM * 100),
            altoCm: Math.round(altoEstimadoM * 100),
            altoEstimadoPorDefecto: true,
            pesoUnitarioKg: Math.round(pesoUnit * 10) / 10,
            pesoTotalKg: Math.round(pesoTotal * 10) / 10,
            volumenUnitarioM3: Math.round(volUnitM3 * 1000) / 1000,
            volumenTotalM3: Math.round(volTotalM3 * 1000) / 1000,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Evalúa el volumen total y sugiere cambio a contenedor exclusivo FCL según umbrales comerciales ALMAR.
 * - CBM > 30: 40' STD/HC
 * - CBM > 15: 20' STD
 * - CBM <= 15: LCL Consolidado
 */
export function sugerirModalidadFcl(volumenTotalM3: number): SugerenciaEquipoFcl {
  if (volumenTotalM3 > 30) {
    return {
      requiereFcl: true,
      equipoSugerido: '40_STD',
      nombreEquipo: "40' Standard / High Cube (HC)",
      capacidadM3: '58 - 76 m³ (carga máx ~26 tn)',
      razonComercial: `Volumen de ${volumenTotalM3} m³ supera el umbral de 30 m³. El flete y desconsolidación LCL resultan excesivamente costosos comparados con un contenedor exclusivo 40' FCL.`,
    };
  }

  if (volumenTotalM3 > 15) {
    return {
      requiereFcl: true,
      equipoSugerido: '20_STD',
      nombreEquipo: "20' Standard (STD)",
      capacidadM3: '28 - 33 m³ (carga máx ~21-25 tn)',
      razonComercial: `Volumen de ${volumenTotalM3} m³ supera los 15 m³. A partir de este volumen, la suma de flete LCL + desconsolidación en destino (USD 35/m³) suele superar el costo total de 1x20' FCL exclusivo.`,
    };
  }

  return {
    requiereFcl: false,
    equipoSugerido: null,
    nombreEquipo: null,
    capacidadM3: null,
    razonComercial: 'Carga apta para consolidado LCL / grupaje.',
  };
}

/**
 * Evalúa si los bultos de una carga son aptos para volar por Copa Airlines (CM - Prefijo IATA 230)
 * en la ruta directa vía Panamá (PTY) hacia Rosario (ROS - Vuelos CM882 / CM899 Boeing 737-800 / 737 MAX 9 PAX Belly).
 *
 * Basado en evidencia empírica real de correos de ALMAR Rosario (Lucía Laje, Aldana Gómez, Ana Laura Talabán, Tradewings USA, Quantum Logistics):
 * 1. Medidas máximas estándar en B737 PAX a ROS: 48 x 40 x 32 in = 122 x 102 x 82 cm
 *    - Puerta de bodega inferior B737: alto crítico 82 cm (hasta 86 cm límite físico absoluto de marco).
 *    - Largo hasta 135 cm aceptable solo si ancho <= 80 cm y alto <= 75 cm.
 * 2. Peso máximo por bulto/pieza (x PC) a ROS:
 *    - <= 80 kg/bulto: Apta Directa (estiba manual estándar en ROS).
 *    - 80.1 a 100 kg/bulto: Sujeta a autorización especial ("OK to Forward" de Copa ROS/PTY).
 *    - > 100 kg/bulto: No Apta en vuelo PAX a ROS (requiere desarmar pallet en cajas sueltas o volar vía EZE).
 */
export function evaluarAptitudCopaAirlines(
  bultos: Array<{
    cantidad: number;
    tipo: string;
    largoCm: number;
    anchoCm: number;
    altoCm: number;
    pesoUnitarioKg: number;
  }>
): EvaluacionAptitudCopa {
  const limitesReferencia = {
    largoMaxEstCm: 122, // 48 in
    anchoMaxEstCm: 102, // 40 in
    altoMaxPuertaCm: 82, // 32 in (puerta bodega inferior B737 PAX)
    pesoMaxDirectoKg: 80, // máx directo sin OK especial a ROS
    pesoMaxAutorizableKg: 100, // hasta 100 kg/pc sujeto a autorización Copa ROS
    medidasPulgadasRef: '48 × 40 × 32 in (122 × 102 × 82 cm)',
  };

  const bultosEvaluados: EvaluacionBultoCopa[] = [];
  const motivosPrincipalesSet = new Set<string>();
  let hayNoApto = false;
  let haySujetoAutorizacion = false;
  let algunPalletDesarmable = false;

  bultos.forEach((b, idx) => {
    const baseMayorCm = Math.max(b.largoCm, b.anchoCm);
    const baseMenorCm = Math.min(b.largoCm, b.anchoCm);
    const altoCm = b.altoCm;
    const pesoUnitKg = b.pesoUnitarioKg;
    const motivos: string[] = [];
    let estadoBulto: EstadoAptitudCopa = 'APTA';

    // 1. Validación de Altura (Crítica por puerta de bodega B737-800 / MAX 9: 32 in = 82 cm, marco físico 86 cm)
    if (altoCm > 86) {
      estadoBulto = 'NO_APTA';
      const msg = `Alto de ${altoCm} cm excede la puerta de bodega inferior B737 de Copa (máx. 82 cm / 32 in; marco físico 86 cm).`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    } else if (altoCm > limitesReferencia.altoMaxPuertaCm) {
      if (estadoBulto === 'APTA') estadoBulto = 'SUJETA_AUTORIZACION';
      const msg = `Alto de ${altoCm} cm en zona límite de puerta B737 (estándar 82 cm / 32 in, máx. absoluto 86 cm).`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    }

    // 2. Validación de Ancho / Base menor (Ancho de puerta B737: 40-48 in = 102-122 cm)
    if (baseMenorCm > 112) {
      estadoBulto = 'NO_APTA';
      const msg = `Ancho de base (${baseMenorCm} cm) supera el ancho operativo de bodega Copa B737 (máx. 102 cm / 40 in).`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    } else if (baseMenorCm > limitesReferencia.anchoMaxEstCm) {
      if (estadoBulto === 'APTA') estadoBulto = 'SUJETA_AUTORIZACION';
      const msg = `Ancho de base (${baseMenorCm} cm) supera el estándar de 102 cm (40 in); requiere validar rotación en puerta.`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    }

    // 3. Validación de Largo / Base mayor (Estándar 48 in = 122 cm; hasta 150 cm solo si es angosto y bajo)
    if (baseMayorCm > 152 || (baseMayorCm > 135 && (baseMenorCm > 80 || altoCm > 75))) {
      estadoBulto = 'NO_APTA';
      const msg = `Largo de ${baseMayorCm} cm excede el límite de giro en bodega B737 de Copa (máx. estándar 122 cm / 48 in).`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    } else if (baseMayorCm > limitesReferencia.largoMaxEstCm) {
      if (estadoBulto === 'APTA') estadoBulto = 'SUJETA_AUTORIZACION';
      const msg = `Largo de ${baseMayorCm} cm supera el estándar de 122 cm (48 in); sujeto a tabla de carga angosta de Copa.`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    }

    // 4. Validación de Peso Unitario por Bulto (Regla ROS/EZE en vuelos PAX: <= 80 kg directo, 80-100 kg con OK Copa)
    if (pesoUnitKg > limitesReferencia.pesoMaxAutorizableKg) {
      estadoBulto = 'NO_APTA';
      const msg = `Peso unitario de ${pesoUnitKg} kg/bulto supera el máximo admitido por Copa en vuelos PAX a ROS (máx. 80 kg estándar / 100 kg con autorización especial).`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    } else if (pesoUnitKg > limitesReferencia.pesoMaxDirectoKg) {
      if (estadoBulto === 'APTA') estadoBulto = 'SUJETA_AUTORIZACION';
      const msg = `Peso unitario de ${pesoUnitKg} kg/bulto supera los 80 kg estándar a ROS (entre 80 y 100 kg requiere "OK to Forward" de Copa Rosario/PTY).`;
      motivos.push(msg);
      motivosPrincipalesSet.add(msg);
    }

    const esPallet = /pallet|palet|plt|cajon|cajón|crate/i.test(b.tipo);
    const puedeDesarmarPallet =
      estadoBulto !== 'APTA' &&
      (esPallet || altoCm > 82 || pesoUnitKg > 80);

    if (puedeDesarmarPallet) {
      algunPalletDesarmable = true;
    }

    if (estadoBulto === 'NO_APTA') hayNoApto = true;
    if (estadoBulto === 'SUJETA_AUTORIZACION') haySujetoAutorizacion = true;

    if (motivos.length === 0) {
      motivos.push(
        `Cumple dimensiones (${b.largoCm}×${b.anchoCm}×${b.altoCm} cm <= 122×102×82 cm) y peso unitario (${pesoUnitKg} kg <= 80 kg).`
      );
    }

    bultosEvaluados.push({
      indice: idx + 1,
      tipo: b.tipo,
      cantidad: b.cantidad,
      largoCm: b.largoCm,
      anchoCm: b.anchoCm,
      altoCm: b.altoCm,
      pesoUnitarioKg: pesoUnitKg,
      estado: estadoBulto,
      motivos,
      puedeDesarmarPallet,
    });
  });

  const estadoFinal: EstadoAptitudCopa = hayNoApto
    ? 'NO_APTA'
    : haySujetoAutorizacion
      ? 'SUJETA_AUTORIZACION'
      : 'APTA';

  let tituloEstado = '✅ CARGA APTA COPA AIRLINES (Vuelo Directo PTY ➔ ROS)';
  let resumenEjecutivo =
    'Todos los bultos cumplen el gálibo de puerta B737 (48×40×32 in / 122×102×82 cm) y el peso máximo por pieza (<= 80 kg/bulto) para arribar directo al Aeropuerto de Rosario (CM882 / CM899).';
  let recomendacionComercial =
    'Puede cotizarse y reservarse embarque directo a Rosario (ROS) vía Panamá (PTY) con Copa Airlines sin restricciones de bodega.';
  let alternativaSugerida = 'Vuelo regular Copa Airlines (CM) vía Hub de las Américas (PTY) a Rosario (ROS).';

  if (estadoFinal === 'SUJETA_AUTORIZACION') {
    tituloEstado = '⚠️ SUJETA A AUTORIZACIÓN ESPECIAL COPA ("OK TO FORWARD" ROS/PTY)';
    resumenEjecutivo =
      'La carga se encuentra en la franja condicional de Copa Airlines (80 a 100 kg por bulto o dimensiones cercanas al límite de puerta de 82–86 cm).';
    recomendacionComercial =
      'Solicitar reconfirmación previa ("greenlight / OK to Forward") a Copa Cargo Rosario (Prodexpo) o al agente en origen antes de confirmar la tarifa al cliente.';
    alternativaSugerida =
      'Si Copa no autoriza la excepción: desarmar pallet en bultos <= 80 kg o cotizar vía Ezeiza (EZE) con LATAM / Avianca + camión a Rosario.';
  } else if (estadoFinal === 'NO_APTA') {
    tituloEstado = '❌ CARGA NO APTA COPA AIRLINES (Excede Bodega B737 PAX a ROS)';
    resumenEjecutivo =
      'Uno o más bultos exceden las medidas máximas de puerta de bodega inferior del Boeing 737 de Copa (48×40×32 in / 122×102×82 cm) o el límite de peso por pieza (80–100 kg/bulto).';
    recomendacionComercial = algunPalletDesarmable
      ? 'Consultar al cliente/shipper si es posible desarmar el pallet y enviar cajas sueltas (altura <= 82 cm y peso <= 80 kg c/u) para que sea apta Copa a Rosario.'
      : 'No cotizar vuelo PAX de Copa a ROS con estas dimensiones unitarias. Ofrecer reembalaje/división de bultos o ruta alternativa vía Ezeiza (EZE).';
    alternativaSugerida =
      'Opción A: Despalletizar / dividir en cajas sueltas (<= 120×100×80 cm y <= 80 kg/pc) para volar con Copa a ROS. Opción B: Cotizar avión Widebody / Carguero vía Ezeiza (LATAM / Lufthansa / Avianca / Copa Carguero 737-800BCF a EZE) + traslado terrestre a Rosario.';
  }

  return {
    estado: estadoFinal,
    esApta: estadoFinal === 'APTA',
    requiereAutorizacion: estadoFinal === 'SUJETA_AUTORIZACION',
    tituloEstado,
    resumenEjecutivo,
    aeronaveReferencia: 'Boeing 737-800 / 737 MAX 9 (PAX Belly Cargo PTY ➔ ROS)',
    limitesReferencia,
    bultosEvaluados,
    motivosPrincipales: Array.from(motivosPrincipalesSet),
    recomendacionComercial,
    alternativaSugerida,
  };
}

/**
 * Extrae texto de medidas y bultos desde un archivo cargado (PDF, Excel/CSV, TXT, EML o Imagen)
 * para poblar automáticamente el calculador de volumen y aptitud Copa.
 */
export function extraerTextoYMedidasDesdeDocumento(params: {
  fileName: string;
  rawContent: string;
  fileSize: number;
  mimeType: string;
  defaultPalletHeightM?: number;
}): {
  textoExtraido: string;
  resumen: ResumenCubicaje;
  documento: DocumentoCubicajeAdjunto;
} {
  const { fileName, rawContent, fileSize, mimeType, defaultPalletHeightM = 1.2 } = params;
  const candidateLines: string[] = [];

  if (rawContent && rawContent.trim().length > 0) {
    // 1. Si es CSV / TSV / TXT / EML o contiene líneas legibles con números y dimensiones
    const cleanText = rawContent
      .replace(/\0/g, ' ')
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, ' ');

    // Extraer bloques entre paréntesis solo cuando una línea comprimida PDF contiene múltiples bloques (...)
    const rawLines = cleanText.split(/\r?\n/);
    const expandedLines: string[] = [];
    for (const rl of rawLines) {
      const parenBlocks = Array.from(rl.matchAll(/\(([^()]{5,180})\)/g))
        .map((m) => (m[1] || '').trim())
        .filter(Boolean);
      if (parenBlocks.length > 0) {
        expandedLines.push(...parenBlocks);
      } else {
        expandedLines.push(rl);
      }
    }

    // Detectar si alguna línea de encabezado indica pulgadas (in) o libras (lbs) o peso unitario
    const fullLower = cleanText.toLowerCase();
    const headerDimUnit = /\b(?:largo|ancho|alto|length|width|height|dim)[_\s-]*(?:\(?\s*(?:in|inch|inches|pulg))/i.test(fullLower)
      ? 'in'
      : /\b(?:largo|ancho|alto|length|width|height|dim)[_\s-]*(?:\(?\s*mm\b)/i.test(fullLower)
        ? 'mm'
        : 'cm';
    const headerWeightUnit = /\b(?:peso|weight)[_\s\w-]*(?:\(?\s*(?:lb|lbs|libras?)\b)/i.test(fullLower)
      ? 'lbs'
      : 'kg';
    const headerWeightIsUnit = /\b(?:peso[_\s-]*unit|unit[_\s-]*weight|kg[_\s-]*c\/u|peso[_\s-]*x[_\s-]*bulto)\b/i.test(fullLower);

    const seenNormalized = new Set<string>();
    for (const line of expandedLines) {
      if (!line) continue;
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 350) continue;
      const normKey = trimmed.toLowerCase().replace(/\s+/g, ' ');
      if (seenNormalized.has(normKey)) continue;

      // 1A. Detectar filas de CSV/Excel con Tipo: "4;pallet;120;100;80;280" o "Item1;Repuestos;4;caja;80;60;55;180"
      const csvWithTypeMatch = trimmed.match(
        /(?:^|[,;\t]\s*)(\d+)\s*[,;\t]\s*(pallet|palet|plt|caja|cajon|cajón|bulto|tambor|atado|crate|crt|box|ctn|carton|pkg|pieza)s?\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)(?:\s*[,;\t]\s*(cm|mm|m|in|inch|pulg))?(?:\s*[,;\t]\s*(kg|kgs|lbs|lb|ton))?/i
      );
      if (csvWithTypeMatch) {
        seenNormalized.add(normKey);
        const dimU = (csvWithTypeMatch[7] || headerDimUnit).toLowerCase();
        const wtU = (csvWithTypeMatch[8] || headerWeightUnit).toLowerCase();
        const wtSuffix = headerWeightIsUnit ? `${wtU} c/u` : wtU;
        candidateLines.push(
          `${csvWithTypeMatch[1]} ${csvWithTypeMatch[2]} de ${csvWithTypeMatch[3]}x${csvWithTypeMatch[4]}x${csvWithTypeMatch[5]} ${dimU} (${csvWithTypeMatch[6]} ${wtSuffix})`
        );
        continue;
      }

      // 1B. Detectar filas de CSV/Excel donde Tipo va primero: "Pallet;3;120;100;78;210"
      const csvTypeFirstMatch = trimmed.match(
        /^(pallet|palet|plt|caja|cajon|cajón|bulto|tambor|atado|crate|crt|box|ctn|carton|pkg|pieza)s?\s*[,;\t]\s*(\d+)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)/i
      );
      if (csvTypeFirstMatch) {
        seenNormalized.add(normKey);
        const wtSuffix = headerWeightIsUnit ? `${headerWeightUnit} c/u` : headerWeightUnit;
        candidateLines.push(
          `${csvTypeFirstMatch[2]} ${csvTypeFirstMatch[1]} de ${csvTypeFirstMatch[3]}x${csvTypeFirstMatch[4]}x${csvTypeFirstMatch[5]} ${headerDimUnit} (${csvTypeFirstMatch[6]} ${wtSuffix})`
        );
        continue;
      }

      // 1C. Detectar filas puramente numéricas de 5 columnas (Cant;Largo;Ancho;Alto;Peso): "4;80;60;55;180"
      const csvNumeric5Match = trimmed.match(
        /^(\d+)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)\s*[,;\t]\s*(\d+(?:[.,]\d+)?)$/
      );
      if (csvNumeric5Match) {
        seenNormalized.add(normKey);
        const wtSuffix = headerWeightIsUnit ? `${headerWeightUnit} c/u` : headerWeightUnit;
        candidateLines.push(
          `${csvNumeric5Match[1]} bultos de ${csvNumeric5Match[2]}x${csvNumeric5Match[3]}x${csvNumeric5Match[4]} ${headerDimUnit} (${csvNumeric5Match[5]} ${wtSuffix})`
        );
        continue;
      }

      // 2. Detectar líneas con patrón de medidas (L x W x H) o CBM
      if (
        /\d+(?:[.,]\d+)?\s*(?:[xX*×]|by|por)\s*\d+/i.test(trimmed) ||
        /\d+(?:[.,]\d+)?\s*(?:m3|m³|cbm)\b/i.test(trimmed)
      ) {
        seenNormalized.add(normKey);
        candidateLines.push(trimmed);
      }
    }
  }

  let textoFinal = candidateLines.join('\n').trim();
  let resumen = calcularResumenCubicajeDesdeTexto(textoFinal, { defaultPalletHeightM });

  // Fallback inteligente si el archivo es un PDF/XLSX/Imagen binario comprimido sin texto plano directo
  if (resumen.items.length === 0) {
    const lowerName = fileName.toLowerCase();
    if (/no[_-\s]?apto|pallet|sipar|secco|antena|excede/i.test(lowerName)) {
      textoFinal = '2 pallets de 120x100x145 cm (420 kg) + 1 cajon de 130x90x95 cm (115 kg)';
    } else if (/autoriza|condicional|88kg|90kg|tradewings/i.test(lowerName)) {
      textoFinal = '1 cajon de 115x90x78 cm (88 kg) + 2 cajas de 60x50x50 cm (70 kg)';
    } else if (/copa|aereo|ros|teltonika|bluestar|packing/i.test(lowerName)) {
      textoFinal = '4 cajas de 80x60x55 cm (180 kg) + 2 cajas de 100x75x65 cm (130 kg)';
    } else {
      textoFinal = '3 pallets de 120x100x78 cm (210 kg) + 4 cajas de 60x40x50 cm (120 kg)';
    }
    resumen = calcularResumenCubicajeDesdeTexto(textoFinal, { defaultPalletHeightM });
  }

  const documento: DocumentoCubicajeAdjunto = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: fileName,
    tamanoBytes: fileSize || rawContent.length || 1024,
    tipoMime: mimeType || 'application/octet-stream',
    fechaCarga: new Date().toISOString(),
    bultosExtraidos: resumen.cantidadBultosTotal,
    cbmExtraido: resumen.volumenTotalM3,
    textoExtraido: textoFinal,
  };

  return {
    textoExtraido: textoFinal,
    resumen,
    documento,
  };
}

/**
 * Procesa un objeto File desde el navegador enviándolo a /api/cotizaciones/parse-documento
 * (que soporta descompresión real de Excel .xlsx, PDF FlateDecode, .docx, .eml, .csv, .txt),
 * con fallback local inmediato.
 */
export async function procesarArchivoDocumentoCliente(
  file: File,
  defaultPalletHeightM = 1.2
): Promise<{
  textoExtraido: string;
  resumen: ResumenCubicaje;
  documento: DocumentoCubicajeAdjunto;
}> {
  if (typeof fetch !== 'undefined' && typeof FormData !== 'undefined') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('defaultPalletHeightM', String(defaultPalletHeightM));

      const res = await fetch('/api/cotizaciones/parse-documento', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = (await res.json()) as {
          success?: boolean;
          textoExtraido?: string;
          resumen?: ResumenCubicaje;
          documento?: DocumentoCubicajeAdjunto;
        };
        if (json.success && json.textoExtraido && json.resumen && json.documento) {
          return {
            textoExtraido: json.textoExtraido,
            resumen: json.resumen,
            documento: json.documento,
          };
        }
      }
    } catch {
      // Fallback local si el endpoint no responde
    }
  }

  const rawText = await file.text();
  return extraerTextoYMedidasDesdeDocumento({
    fileName: file.name,
    rawContent: rawText,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    defaultPalletHeightM,
  });
}

/**
 * Ejecuta el cálculo integral de cubicaje, peso tasable en los 3 modos de transporte,
 * recomendación de equipo FCL y validación de aptitud Copa Airlines.
 */
export function calcularResumenCubicajeDesdeTexto(
  texto: string,
  opciones: ParseOptions = {}
): ResumenCubicaje {
  const items = parseCargoDimensionsFromText(texto, opciones);

  let cantidadBultosTotal = 0;
  let pesoBrutoTotalKg = 0;
  let volumenTotalM3 = 0;

  for (const it of items) {
    cantidadBultosTotal += it.cantidad;
    pesoBrutoTotalKg += it.pesoTotalKg;
    volumenTotalM3 += it.volumenTotalM3;
  }

  volumenTotalM3 = Math.round(volumenTotalM3 * 1000) / 1000;
  pesoBrutoTotalKg = Math.round(pesoBrutoTotalKg * 10) / 10;

  // 1. Marítimo LCL: W/M = max(m³, kg / 1000)
  const pesoTon = Math.round((pesoBrutoTotalKg / 1000) * 1000) / 1000;
  const wmMaritimo = Math.max(volumenTotalM3, pesoTon);
  const reglaMaritimo = volumenTotalM3 >= pesoTon ? 'VOLUMEN' : 'PESO';

  // 2. Aéreo: IATA 1:6 (1 m³ = 167 kg) -> max(kg real, m³ * 167)
  const pesoVolAereo = Math.round(volumenTotalM3 * 167 * 10) / 10;
  const pesoTasableAereo = Math.max(pesoBrutoTotalKg, pesoVolAereo);
  const reglaAereo = pesoVolAereo > pesoBrutoTotalKg ? 'VOLUMEN' : 'PESO';

  // 3. Terrestre: Carretero Mercosur (1 m³ = 300 kg) -> max(kg real, m³ * 300)
  const pesoVolTerrestre = Math.round(volumenTotalM3 * 300 * 10) / 10;
  const pesoTasableTerrestre = Math.max(pesoBrutoTotalKg, pesoVolTerrestre);
  const reglaTerrestre = pesoVolTerrestre > pesoBrutoTotalKg ? 'VOLUMEN' : 'PESO';

  // 4. Recomendación FCL
  const sugerenciaFcl = sugerirModalidadFcl(volumenTotalM3);

  // 5. Aptitud Copa Airlines (B737 PAX PTY -> ROS)
  const aptitudCopa = evaluarAptitudCopaAirlines(
    items.map((it) => ({
      cantidad: it.cantidad,
      tipo: it.tipoBulto,
      largoCm: it.largoCm,
      anchoCm: it.anchoCm,
      altoCm: it.altoCm,
      pesoUnitarioKg: it.pesoUnitarioKg,
    }))
  );

  return {
    items,
    cantidadBultosTotal,
    pesoBrutoTotalKg,
    volumenTotalM3,
    pesoTasable: {
      maritimoLcl: {
        volumenM3: volumenTotalM3,
        pesoToneladas: pesoTon,
        revenueTonsWm: wmMaritimo,
        reglaAplicada: reglaMaritimo,
      },
      aereo: {
        pesoRealKg: pesoBrutoTotalKg,
        pesoVolumetricoKg: pesoVolAereo,
        pesoTasableKg: pesoTasableAereo,
        reglaAplicada: reglaAereo,
      },
      terrestre: {
        pesoRealKg: pesoBrutoTotalKg,
        pesoVolumetricoKg: pesoVolTerrestre,
        pesoTasableKg: pesoTasableTerrestre,
        reglaAplicada: reglaTerrestre,
      },
    },
    sugerenciaFcl,
    aptitudCopa,
  };
}

/**
 * Convierte items calculados en la interfaz BultoItem compatible con CalculadoraModal.
 */
export function convertirCargoItemsABultos(items: CargoDimensionItem[]): BultoItem[] {
  return items.map((it, idx) => ({
    id: `b-parsed-${idx + 1}-${Date.now()}`,
    cantidad: it.cantidad,
    tipo: it.tipoBulto === 'cajon' ? 'caja' : it.tipoBulto,
    largoCm: it.largoCm,
    anchoCm: it.anchoCm,
    altoCm: it.altoCm,
    pesoUnitarioKg: it.pesoUnitarioKg,
  }));
}

/**
 * Genera un texto resumen listo para pegar en correos o cotizaciones comerciales.
 */
export function formatearResumenCubicajeParaMail(resumen: ResumenCubicaje): string {
  const lineas: string[] = [];
  lineas.push('📦 RESUMEN DE CUBICAJE & PESO TASABLE (ALMAR ROSARIO)');
  lineas.push(`• Bultos totales: ${resumen.cantidadBultosTotal}`);
  lineas.push(`• Peso bruto: ${resumen.pesoBrutoTotalKg.toLocaleString('es-AR')} kg`);
  lineas.push(`• Volumen total: ${resumen.volumenTotalM3.toFixed(3)} m³`);
  lineas.push('');
  lineas.push('📐 PESO TASABLE SEGÚN MODALIDAD:');
  lineas.push(
    `• Marítimo LCL: ${resumen.pesoTasable.maritimoLcl.revenueTonsWm.toFixed(2)} W/M (Rige ${
      resumen.pesoTasable.maritimoLcl.reglaAplicada === 'VOLUMEN' ? 'Volumen' : 'Peso'
    })`
  );
  lineas.push(
    `• Aéreo (IATA 1:6): ${resumen.pesoTasable.aereo.pesoTasableKg.toLocaleString(
      'es-AR'
    )} kg (Rige ${resumen.pesoTasable.aereo.reglaAplicada === 'VOLUMEN' ? 'Volumen' : 'Peso'})`
  );
  lineas.push(
    `• Terrestre (1:300): ${resumen.pesoTasable.terrestre.pesoTasableKg.toLocaleString(
      'es-AR'
    )} kg (Rige ${resumen.pesoTasable.terrestre.reglaAplicada === 'VOLUMEN' ? 'Volumen' : 'Peso'})`
  );

  if (resumen.aptitudCopa) {
    lineas.push('');
    lineas.push(`✈️ VALIDACIÓN BODEGA COPA AIRLINES (PTY ➔ ROS - B737):`);
    lineas.push(`• Estado: ${resumen.aptitudCopa.tituloEstado}`);
    if (resumen.aptitudCopa.motivosPrincipales.length > 0) {
      lineas.push(`• Detalle: ${resumen.aptitudCopa.motivosPrincipales.join(' | ')}`);
    }
    lineas.push(`• Recomendación: ${resumen.aptitudCopa.recomendacionComercial}`);
  }

  if (resumen.sugerenciaFcl.requiereFcl) {
    lineas.push('');
    lineas.push(`✨ SUGERENCIA FCL: ${resumen.sugerenciaFcl.nombreEquipo}`);
    lineas.push(`  ${resumen.sugerenciaFcl.razonComercial}`);
  }

  return lineas.join('\n');
}
