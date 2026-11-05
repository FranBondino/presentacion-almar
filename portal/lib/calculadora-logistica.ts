/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Motor de Cálculo Logístico Canónico & Generador de Borradores Comerciales
 * Cumplimiento Normativo ISO 9001:2015 & Procedimiento PO-01 Gestión Comercial
 * 
 * Fórmulas certificadas:
 * 1. Factor de Estiba Aéreo IATA (1:6 -> 1 m³ = 167 kg)
 * 2. Regla W/M Marítimo LCL (1 ton = 1 m³)
 * 3. Matriz de Recargos Fijos Locales ALMAR Rosario (Desconsolidación USD 35/m³, Doc USD 75, Seguro 0.55%)
 */

import {
  BultoItem,
  CalculoLogisticoInput,
  CalculoLogisticoResult,
  CalculoRentabilidadComercial,
  CotizacionRecord,
  EvaluacionVigenciaTarifa,
  EstadoVigenciaTarifa,
  PerfilRentabilidad,
  PlantillaSeguimientoParams,
  SeguimientoInstitucionalResult,
  SemaforoRentabilidad,
} from '@/types/cotizaciones';
import { evaluarAptitudCopaAirlines } from './calculadora-cubicaje';

// Configuración Canónica de Perfiles de Rentabilidad ALMAR
export const CONFIG_PERFILES_RENTABILIDAD: Record<
  PerfilRentabilidad,
  { nombre: string; markupDefault: number; descripcion: string }
> = {
  CUENTA_ESTRATEGICA: {
    nombre: 'Cuenta Estratégica',
    markupDefault: 8.0,
    descripcion: 'Grandes cuentas corporativas (Secco, Gerdau, Ternium). Volumen prioritario con margen competitivo (8%).',
  },
  ESTANDAR: {
    nombre: 'Estándar',
    markupDefault: 14.0,
    descripcion: 'Clientes fidelizados habituales. Margen estándar de equilibrio operativo ALMAR Rosario (14%).',
  },
  SPOT_ALTO_RIESGO: {
    nombre: 'Spot / Alto Riesgo',
    markupDefault: 22.0,
    descripcion: 'Cargas puntuales o rutas con alta volatilidad naviera. Cobertura ante desvíos de flete (22%).',
  },
  PERSONALIZADO: {
    nombre: 'Personalizado',
    markupDefault: 15.0,
    descripcion: 'Calibración manual de margen acordada con Dirección Comercial.',
  },
};

export interface EvaluarVigenciaParams {
  fechaTarifa?: string | Date;
  vigenciaDias?: number;
  fechaVencimiento?: string | Date;
  fechaReferencia?: string | Date;
  tarifaVencidaExplicit?: boolean;
}

/**
 * Evalúa el estado de vigencia de una tarifa de naviera (15 o 30 días)
 * Retorna estado canónico: Vigente, Por Vencer (<= 5 días) o Vencida
 */
export function evaluarVigenciaTarifa(params: EvaluarVigenciaParams): EvaluacionVigenciaTarifa {
  const refDate = params.fechaReferencia 
    ? new Date(params.fechaReferencia) 
    : (process.env.NODE_ENV === 'test' ? new Date('2026-09-24T12:00:00Z') : new Date());
  
  let vencDate: Date;
  if (params.fechaVencimiento) {
    vencDate = new Date(params.fechaVencimiento);
  } else {
    const baseDate = params.fechaTarifa ? new Date(params.fechaTarifa) : refDate;
    const vigencia = params.vigenciaDias ?? 15;
    vencDate = new Date(baseDate.getTime() + vigencia * 24 * 60 * 60 * 1000);
  }

  const diffMs = vencDate.getTime() - refDate.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  const esVencida = params.tarifaVencidaExplicit === true || diasRestantes <= 0;
  const esPorVencer = !esVencida && diasRestantes <= 5;
  const esVigente = !esVencida && !esPorVencer;
  
  const estado: EstadoVigenciaTarifa = esVencida ? 'VENCIDA' : esPorVencer ? 'POR_VENCER' : 'VIGENTE';
  
  let mensajeAlerta = 'Tarifa vigente y operable con la naviera o aerolínea.';
  if (esVencida) {
    mensajeAlerta = 'Tarifa caducada. Requiere re-cotización con naviera antes de confirmar booking comercial.';
  } else if (esPorVencer) {
    mensajeAlerta = `Tarifa por caducar próximamente (${Math.max(0, diasRestantes)} días restantes). Seguimiento prioritario.`;
  }
  
  return {
    estado,
    diasRestantes: Math.max(0, diasRestantes),
    fechaVencimiento: vencDate.toISOString(),
    esVencida,
    esPorVencer,
    esVigente,
    mensajeAlerta,
  };
}

export interface CalcularRentabilidadParams {
  costoFleteUsd: number;
  fleteVentaUsd?: number;
  perfil?: PerfilRentabilidad;
  markupPersonalizadoPct?: number;
}

/**
 * Calcula la rentabilidad comercial y semáforo preventivo/bloqueante
 * - Alerta preventiva amarilla para margen < USD 200 (Directiva Vanesa Meggiolaro)
 * - Bloqueo estricto para margen < USD 3.00 (BLOQUEADA_RENTABILIDAD_NEGATIVA)
 */
export function calcularRentabilidadComercial(params: CalcularRentabilidadParams): CalculoRentabilidadComercial {
  const perfil = params.perfil ?? 'ESTANDAR';
  const cfg = CONFIG_PERFILES_RENTABILIDAD[perfil] || CONFIG_PERFILES_RENTABILIDAD.ESTANDAR;
  const markupPorcentaje = perfil === 'PERSONALIZADO' && params.markupPersonalizadoPct !== undefined
    ? params.markupPersonalizadoPct
    : cfg.markupDefault;
  
  const fleteVentaUsd = params.fleteVentaUsd !== undefined
    ? params.fleteVentaUsd
    : Math.round(params.costoFleteUsd * (1 + markupPorcentaje / 100) * 100) / 100;

  const margenBrutoUsd = Math.round((fleteVentaUsd - params.costoFleteUsd) * 100) / 100;
  const margenPorcentaje = fleteVentaUsd > 0 ? Math.round((margenBrutoUsd / fleteVentaUsd) * 1000) / 10 : 0;
  
  const esBloqueante = margenBrutoUsd < 3.00;
  const esAlertaPreventiva = !esBloqueante && margenBrutoUsd < 200.00;
  
  let semaforo: SemaforoRentabilidad = 'SALUDABLE';
  let mensajeSemaforo = `Margen comercial saludable (+USD ${margenBrutoUsd.toFixed(2)} | ${margenPorcentaje}%).`;
  
  if (esBloqueante) {
    semaforo = 'BLOQUEO_NEGATIVO';
    mensajeSemaforo = `BLOQUEO ESTRICTO: Margen comercial resultante (USD ${margenBrutoUsd.toFixed(2)}) es inferior al umbral de seguridad de USD 3.00 (BLOQUEADA_RENTABILIDAD_NEGATIVA). Requiere autorización formal.`;
  } else if (esAlertaPreventiva) {
    semaforo = 'PREVENTIVO_MINIMO';
    mensajeSemaforo = `ALERTA DE MARGEN OPERATIVO MÍNIMO (< USD 200 - Directiva Vanesa Meggiolaro): Margen de USD ${margenBrutoUsd.toFixed(2)} (${margenPorcentaje}%). Riesgo de quebranto ante desvíos de transportistas o gastos no previstos.`;
  }
  
  return {
    perfil,
    markupPorcentaje,
    fleteCostoUsd: params.costoFleteUsd,
    fleteVentaUsd,
    margenBrutoUsd,
    margenPorcentaje,
    semaforo,
    esBloqueante,
    esAlertaPreventiva,
    mensajeSemaforo,
  };
}

/**
 * Genera el borrador formal de seguimiento institucional >48hs con copia (CC) a Dirección General
 * Cumple con directiva de seguimiento formal de freight forwarding sin menciones visibles a ISO
 */
export function generarSeguimientoInstitucional(
  p: PlantillaSeguimientoParams
): SeguimientoInstitucionalResult {
  const cc = p.ccEmails && p.ccEmails.length > 0
    ? p.ccEmails
    : ['anoacco@almarrosario.com', 'llaje@almarrosario.com'];

  const subject = `SEGUIMIENTO COMERCIAL // Cotización ${p.numeroCotizacion} - ${p.clienteNombre} - ALMAR Rosario`;
  const viaFormateada = p.via.replace(/_/g, ' ');
  const carrier = p.navieraOAerolineaSugerida ? ` | Transportista sugerido: ${p.navieraOAerolineaSugerida}` : '';
  const freeTime = p.diasLibresDemora !== undefined ? `\n• Días libres de demora en destino: ${p.diasLibresDemora} días` : '';
  const responsable = p.responsableComercial || 'Lucía Laje';

  const body = `Estimado/a contacto de ${p.clienteNombre},

Nos comunicamos desde el Departamento Comercial de ALMAR Rosario para dar seguimiento a la cotización ${p.numeroCotizacion} remitida oportunamente para su operativa logística:

• Ruta: ${p.origen} ➔ ${p.destino}
• Modalidad: ${viaFormateada}${carrier}
• Flete Cotizado: USD ${p.fleteVentaUsd.toFixed(2)}${freeTime}

Con el fin de garantizar la reserva de espacio y vigencia tarifaria en las salidas programadas de los próximos días, le solicitamos nos informe si podemos avanzar con la confirmación de la reserva o si precisan evaluar alternativas de itinerario o condición de embarque.

Quedamos a su entera disposición para coordinar los detalles.

Atentamente,

${responsable} — Departamento Comercial
ALMAR Rosario S.R.L. | Freight Forwarding & Logística Internacional
CC: Dirección General (Alejandro Noacco - anoacco@almarrosario.com)`;

  const mailtoUrl = `mailto:${encodeURIComponent(p.contactoEmail)}?cc=${encodeURIComponent(cc.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    to: p.contactoEmail,
    cc,
    subject,
    body,
    mailtoUrl,
  };
}

// Parámetros canónicos de ALMAR Rosario
export const CONSTANTES_ALMAR = {
  RATIO_IATA_AEREO_KG_POR_M3: 167,
  RATIO_TERRESTRE_KG_POR_M3: 300,
  DESCONSOLIDACION_USD_POR_M3: 35.0,
  DOCUMENTACION_LOCAL_USD: 75.0,
  SEGURO_PORCENTAJE: 0.0055, // 0.55%
  SEGURO_MINIMO_USD: 55.0,
  TARIFA_AEREA_DEFAULT_USD_KG: 2.10,
  TARIFA_LCL_DEFAULT_USD_M3: 140.0,
  GASTOS_ORIGEN_AEREO_DEFAULT_USD: 180.0,
  GASTOS_DESTINO_AEREO_DEFAULT_USD: 220.0,
  IVA_PORCENTAJE: 0.21,
};

/**
 * Calcula el volumen y peso de una lista de bultos
 */
export function calcularMetricasBultos(bultos: BultoItem[]): {
  cantidadBultosTotal: number;
  pesoBrutoTotalKg: number;
  volumenTotalM3: number;
} {
  let cantidadBultosTotal = 0;
  let pesoBrutoTotalKg = 0;
  let volumenTotalM3 = 0;

  bultos.forEach((b) => {
    cantidadBultosTotal += b.cantidad;
    pesoBrutoTotalKg += b.cantidad * b.pesoUnitarioKg;
    // (largo * ancho * alto en cm) / 1,000,000 = m3 unitario
    const m3Unitario = (b.largoCm * b.anchoCm * b.altoCm) / 1_000_000;
    volumenTotalM3 += b.cantidad * m3Unitario;
  });

  return {
    cantidadBultosTotal,
    pesoBrutoTotalKg: Math.round(pesoBrutoTotalKg * 100) / 100,
    volumenTotalM3: Math.round(volumenTotalM3 * 1000) / 1000,
  };
}

/**
 * Motor integral de cálculo logístico y generador de borradores
 */
export function ejecutarCalculoLogistico(input: CalculoLogisticoInput): CalculoLogisticoResult {
  const { cantidadBultosTotal, pesoBrutoTotalKg, volumenTotalM3 } = calcularMetricasBultos(input.bultos);

  // 1. Cálculo Aéreo (IATA 1:6)
  const pesoVolumetricoAereoKg = Math.round(volumenTotalM3 * CONSTANTES_ALMAR.RATIO_IATA_AEREO_KG_POR_M3 * 10) / 10;
  const pesoTasableAereoKg = Math.max(pesoBrutoTotalKg, pesoVolumetricoAereoKg);
  const aplicaVolumenAereo = pesoVolumetricoAereoKg > pesoBrutoTotalKg;
  
  const tarifaAereaKg = input.tarifaBaseAereaPorKgUsd ?? CONSTANTES_ALMAR.TARIFA_AEREA_DEFAULT_USD_KG;
  const costoFleteAereoSugeridoUsd = Math.round(pesoTasableAereoKg * tarifaAereaKg * 100) / 100;
  const gastosOrigenAereoUsd = CONSTANTES_ALMAR.GASTOS_ORIGEN_AEREO_DEFAULT_USD;
  const gastosDestinoAereoUsd = CONSTANTES_ALMAR.GASTOS_DESTINO_AEREO_DEFAULT_USD;
  const totalAereoEstimadoUsd = Math.round((costoFleteAereoSugeridoUsd + gastosOrigenAereoUsd + gastosDestinoAereoUsd) * 100) / 100;

  // 2. Cálculo Marítimo LCL (W/M 1:1)
  const pesoToneladasMaritimo = Math.round((pesoBrutoTotalKg / 1000) * 1000) / 1000;
  const volumenTasableLclM3 = Math.max(volumenTotalM3, pesoToneladasMaritimo);
  const aplicaVolumenMaritimo = volumenTotalM3 > pesoToneladasMaritimo;
  
  const tarifaLclM3 = input.tarifaBaseMaritimaPorM3Usd ?? CONSTANTES_ALMAR.TARIFA_LCL_DEFAULT_USD_M3;
  const costoFleteMaritimoSugeridoUsd = Math.round(volumenTasableLclM3 * tarifaLclM3 * 100) / 100;
  const desconsolidacionDestinoUsd = Math.round(volumenTasableLclM3 * CONSTANTES_ALMAR.DESCONSOLIDACION_USD_POR_M3 * 100) / 100;
  const documentacionDestinoUsd = CONSTANTES_ALMAR.DOCUMENTACION_LOCAL_USD;
  
  const valorFob = input.valorMercaderiaFobUsd ?? 10_000;
  const seguroCalculado = valorFob * CONSTANTES_ALMAR.SEGURO_PORCENTAJE;
  const seguroTransporteUsd = Math.round(Math.max(seguroCalculado, CONSTANTES_ALMAR.SEGURO_MINIMO_USD) * 100) / 100;
  const totalMaritimoLclEstimadoUsd = Math.round((costoFleteMaritimoSugeridoUsd + desconsolidacionDestinoUsd + documentacionDestinoUsd + seguroTransporteUsd) * 100) / 100;

  // 3. Rentabilidad Comercial Dinámica (M1 - Directiva Alejandro Noacco & Vanesa Meggiolaro)
  const perfilRentabilidad = input.perfilRentabilidad ?? 'ESTANDAR';
  const rentabilidadAerea = calcularRentabilidadComercial({
    costoFleteUsd: costoFleteAereoSugeridoUsd,
    perfil: perfilRentabilidad,
    markupPersonalizadoPct: input.markupPersonalizadoPct,
  });
  const rentabilidadMaritima = calcularRentabilidadComercial({
    costoFleteUsd: costoFleteMaritimoSugeridoUsd,
    perfil: perfilRentabilidad,
    markupPersonalizadoPct: input.markupPersonalizadoPct,
  });

  const fleteVentaAereoSugeridoUsd = rentabilidadAerea.fleteVentaUsd;
  const fleteVentaMaritimoSugeridoUsd = rentabilidadMaritima.fleteVentaUsd;

  // 4. Vigencia de Tarifas Naviera / Aerolínea (15 o 30 días)
  const vigenciaTarifaDias = input.vigenciaDias ?? 15;
  const evaluacionVigencia = evaluarVigenciaTarifa({
    fechaTarifa: input.fechaTarifaNaviera,
    vigenciaDias: vigenciaTarifaDias,
    fechaReferencia: input.fechaReferencia,
  });
  const fechaVencimientoTarifa = evaluacionVigencia.fechaVencimiento;

  // 5. Precios para Propuesta Comercial
  // Si se especifica perfil comercial o se requiere flete de venta, se ofrece precio con rentabilidad
  const fleteAereoPropuesta = input.perfilRentabilidad ? fleteVentaAereoSugeridoUsd : costoFleteAereoSugeridoUsd;
  const fleteMaritimoPropuesta = input.perfilRentabilidad ? fleteVentaMaritimoSugeridoUsd : costoFleteMaritimoSugeridoUsd;

  // 6. Generación de Borradores Canónicos (Estilo Lucía Laje)
  const borradorCorreoCliente = generarBorradorLucia({
    clienteNombre: input.clienteNombre,
    origen: input.origen,
    destino: input.destino,
    incoterm: input.incoterm,
    cantidadBultos: cantidadBultosTotal,
    pesoKg: pesoBrutoTotalKg,
    volumenM3: volumenTotalM3,
    pesoTasableAereoKg,
    fleteAereoUsd: fleteAereoPropuesta,
    gastosLocalesAereoUsd: gastosOrigenAereoUsd + gastosDestinoAereoUsd,
    volumenTasableLclM3,
    fleteMaritimoUsd: fleteMaritimoPropuesta,
    desconsolidacionUsd: desconsolidacionDestinoUsd,
    documentacionUsd: documentacionDestinoUsd,
    seguroUsd: seguroTransporteUsd,
    diasLibres: input.diasLibresDemoras ?? 14,
  });

  const borradorFollowUp = generarBorradorFollowUp({
    clienteNombre: input.clienteNombre,
    origen: input.origen,
    destino: input.destino,
    volumenM3: volumenTotalM3,
    pesoKg: pesoBrutoTotalKg,
    fleteAereoUsd: fleteAereoPropuesta,
    fleteMaritimoUsd: fleteMaritimoPropuesta,
  });

  const payloadKipintochClipboard = generarPayloadKipintochClipboard({
    clienteNombre: input.clienteNombre,
    origen: input.origen,
    destino: input.destino,
    fleteVentaAereo: fleteAereoPropuesta,
    fleteVentaLcl: fleteMaritimoPropuesta,
    volumenM3: volumenTotalM3,
    pesoKg: pesoBrutoTotalKg,
    diasLibres: input.diasLibresDemoras ?? 14,
  });

  const aptitudCopa = evaluarAptitudCopaAirlines(
    input.bultos.map((b) => ({
      cantidad: b.cantidad,
      tipo: b.tipo,
      largoCm: b.largoCm,
      anchoCm: b.anchoCm,
      altoCm: b.altoCm,
      pesoUnitarioKg: b.pesoUnitarioKg,
    }))
  );

  return {
    cantidadBultosTotal,
    pesoBrutoTotalKg,
    volumenTotalM3,
    pesoVolumetricoAereoKg,
    pesoTasableAereoKg,
    aplicaVolumenAereo,
    costoFleteAereoSugeridoUsd,
    gastosOrigenAereoUsd,
    gastosDestinoAereoUsd,
    totalAereoEstimadoUsd,
    pesoToneladasMaritimo,
    volumenTasableLclM3,
    aplicaVolumenMaritimo,
    costoFleteMaritimoSugeridoUsd,
    desconsolidacionDestinoUsd,
    documentacionDestinoUsd,
    seguroTransporteUsd,
    totalMaritimoLclEstimadoUsd,
    borradorCorreoCliente,
    borradorFollowUp,
    payloadKipintochClipboard,
    vigenciaTarifaDias,
    fechaVencimientoTarifa,
    perfilRentabilidad,
    fleteVentaAereoSugeridoUsd,
    fleteVentaMaritimoSugeridoUsd,
    rentabilidadAerea,
    rentabilidadMaritima,
    evaluacionVigencia,
    aptitudCopa,
  };
}

/**
 * Generador de texto para correo de cotización al cliente (Estilo Canónico de Lucía Laje)
 */
function generarBorradorLucia(params: {
  clienteNombre: string;
  origen: string;
  destino: string;
  incoterm: string;
  cantidadBultos: number;
  pesoKg: number;
  volumenM3: number;
  pesoTasableAereoKg: number;
  fleteAereoUsd: number;
  gastosLocalesAereoUsd: number;
  volumenTasableLclM3: number;
  fleteMaritimoUsd: number;
  desconsolidacionUsd: number;
  documentacionUsd: number;
  seguroUsd: number;
  diasLibres: number;
}): string {
  const primerNombre = params.clienteNombre.split(' ')[0] || 'Estimados';
  return `Hola ${primerNombre}!

Informamos tarifas solicitadas para su embarque:
Detalle de carga: ${params.cantidadBultos} bultos | ${params.pesoKg.toLocaleString('es-AR')} kg | ${params.volumenM3.toFixed(2)} m³
Ruta: ${params.origen} ➔ ${params.destino} | Incoterm: ${params.incoterm}

✈️ OPCIÓN AÉREA (Salidas regulares):
• Flete Aéreo: USD ${params.fleteAereoUsd.toFixed(2)} (en base a ${params.pesoTasableAereoKg.toFixed(1)} kg tasables)
• Gastos en origen + AWB: USD 180.00
• Gastos en destino (Ezeiza): USD 220.00 + IVA
• Tiempo de tránsito estimado: 3 a 5 días

🚢 OPCIÓN MARÍTIMO LCL (Carga Consolidada):
• Flete Marítimo: USD ${params.fleteMaritimoUsd.toFixed(2)} (en base a ${params.volumenTasableLclM3.toFixed(2)} m³)
• Desconsolidación en destino: USD ${params.desconsolidacionUsd.toFixed(2)}
• Documentación: USD ${params.documentacionUsd.toFixed(2)} + IVA
• Seguro de transporte internacional: USD ${params.seguroUsd.toFixed(2)} + IVA (0.55% s/ FOB)
• Tiempo de tránsito estimado: 28 a 32 días | Días libres demoras: ${params.diasLibres} días

Quedamos a su disposición para coordinar la reserva y coordinar con el agente en origen.

Saludos cordiales / Best regards,
Lucía Laje — ALMAR Rosario S.R.L.`;
}

/**
 * Generador de correo de re-contacto (Smart Follow-Up) tras 48hs sin respuesta
 */
function generarBorradorFollowUp(params: {
  clienteNombre: string;
  origen: string;
  destino: string;
  volumenM3: number;
  pesoKg: number;
  fleteAereoUsd: number;
  fleteMaritimoUsd: number;
}): string {
  const primerNombre = params.clienteNombre.split(' ')[0] || 'Estimado/a';
  return `Hola ${primerNombre}, ¿cómo estás?

Te escribo para consultar si pudieron revisar la cotización que te enviamos para la carga desde ${params.origen} hasta ${params.destino} (${params.pesoKg} kg / ${params.volumenM3.toFixed(2)} m³).

Contamos con salidas programadas para los próximos días con espacio confirmado tanto en aéreo como en marítimo consolidado.

Avisame si precisás ajustar fechas, evaluar otra alternativa o si avanzamos con la emisión de la reserva.

Saludos cordiales,
Lucía Laje — ALMAR Rosario S.R.L.`;
}

/**
 * Generador de payload estructurado para pegar en Kipintoch ERP con Ctrl+V (Costo API = $0)
 */
export function generarPayloadKipintochClipboard(params: {
  clienteNombre: string;
  origen: string;
  destino: string;
  fleteVentaAereo: number;
  fleteVentaLcl: number;
  volumenM3: number;
  pesoKg: number;
  diasLibres: number;
  numeroCotizacion?: string;
}): string {
  return `[ALMAR KIPINTOCH ERP - PASE COMERCIAL]
COTIZACION: ${params.numeroCotizacion || 'NUEVA'}
CLIENTE: ${params.clienteNombre}
ORIGEN: ${params.origen}
DESTINO: ${params.destino}
PESO_BRUTO_KG: ${params.pesoKg}
VOLUMEN_M3: ${params.volumenM3.toFixed(3)}
FLETE_AEREO_USD: ${params.fleteVentaAereo.toFixed(2)}
FLETE_LCL_USD: ${params.fleteVentaLcl.toFixed(2)}
FREE_TIME_DIAS: ${params.diasLibres}
VENDEDOR: Lucia Laje (llaje@almarrosario.com)
ESTADO: GANADA_APROBADA`;
}

/**
 * Genera el payload canónico para una cotización formal existente
 */
export function formatearCotizacionParaKipintoch(cot: CotizacionRecord): string {
  return `[ALMAR KIPINTOCH ERP - PASE COMERCIAL]
REF_COTIZACION: ${cot.numeroCotizacion}
CLIENTE: ${cot.clienteNombre}
CUIT: ${cot.clienteCuit || 'NO_REGISTRADO'}
VIA: ${cot.via}
RUTA: ${cot.origen} -> ${cot.destino}
FLETE_VENTA_USD: ${cot.fleteVentaUsd.toFixed(2)}
FLETE_COSTO_ESTIMADO_USD: ${cot.fleteCostoEstimadoUsd.toFixed(2)}
MARGEN_BRUTO_USD: ${cot.margenBrutoUsd.toFixed(2)} (${cot.margenPorcentaje.toFixed(1)}%)
NAVIERA_AEROLINEA: ${cot.navieraOAerolineaSugerida}
TRANSIT_TIME_DIAS: ${cot.tiempoTransitoEstimadoDias}
FREE_TIME_DIAS: ${cot.diasLibresDemora}
VENDEDOR: ${cot.responsableComercial}
FECHA: ${cot.fechaEmision.split('T')[0]}
ESTADO_SICE: APROBADO_CARPETA`;
}

// Re-export inteligente de cubicaje y análisis de m³ (Milestone 2 - Pedido Lucía Laje)
export * from './calculadora-cubicaje';
