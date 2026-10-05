import { INITIAL_CARPETAS, INITIAL_COMPROBANTES } from '../portal/lib/mockData';
import { CARPETAS_COTIZACIONES_MAP } from '../portal/lib/carpetasCotizacionesMap';

console.log('=== AUDITORIA COMPLETA DE CARPETAS Y COMPROBANTES ===');
console.log('Total carpetas:', INITIAL_CARPETAS.length);
console.log('Total comprobantes:', INITIAL_COMPROBANTES.length);

const carpetaById = new Map(INITIAL_CARPETAS.map((c) => [c.id, c]));

// 1. Analizar comprobantes por carpeta
const comprobantesByCarpeta = new Map<string, typeof INITIAL_COMPROBANTES>();
const comprobantesHuerfanos: typeof INITIAL_COMPROBANTES = [];

for (const comp of INITIAL_COMPROBANTES) {
  if (!comp.carpeta_id) {
    comprobantesHuerfanos.push(comp);
  } else {
    const carp = carpetaById.get(comp.carpeta_id);
    if (!carp) {
      console.warn('Comprobante con carpeta_id inexistente:', comp.id, comp.carpeta_id, comp.numero_comprobante);
      comprobantesHuerfanos.push(comp);
    } else {
      if (!comprobantesByCarpeta.has(comp.carpeta_id)) {
        comprobantesByCarpeta.set(comp.carpeta_id, []);
      }
      comprobantesByCarpeta.get(comp.carpeta_id)!.push(comp);
    }
  }
}

console.log('\n--- COMPROBANTES SIN CARPETA ASIGNADA (BANDEJA DE INGESTA) ---');
console.log('Total huérfanos/ingesta:', comprobantesHuerfanos.length);
for (const h of comprobantesHuerfanos) {
  console.log(`  -> Factura Nº ${h.numero_comprobante} | ${h.emisor_razon_social} | ${h.moneda} ${h.monto_total} | Concepto: ${h.clasificacion_gasto} (${h.concepto_gasto})`);
}

console.log('\n--- DETALLE DE CADA CARPETA: MONTOS, COTIZACION Y FACTURAS ASOCIADAS ---');
for (const carp of INITIAL_CARPETAS) {
  const comps = comprobantesByCarpeta.get(carp.id) || [];
  const cot = CARPETAS_COTIZACIONES_MAP[carp.numero_carpeta];

  console.log(`\n========================================================================`);
  console.log(`CARPETA: ${carp.numero_carpeta} | ID: ${carp.id}`);
  console.log(`Cliente: ${carp.cliente_nombre} (CUIT: ${carp.cliente_cuit})`);
  console.log(`Ruta: ${carp.origen} -> ${carp.destino} | ${carp.area} ${carp.sector}`);
  console.log(`Estado: ${carp.estado} | Cierre Operativo: ${carp.cierre_operativo} | Cierre Contable: ${carp.cierre_contable}`);
  console.log(`DATOS FINANCIEROS EN CARPETA:`);
  console.log(`  Moneda: ${carp.moneda}`);
  console.log(`  Venta Estimada / Cotizada: ${carp.venta_estimada_total}`);
  console.log(`  Costo Estimado Armador/Transporte: ${carp.costo_estimado_total}`);
  console.log(`  Margen Estimado: ${carp.margen_estimado} (${carp.venta_estimada_total > 0 ? ((carp.margen_estimado / carp.venta_estimada_total) * 100).toFixed(1) : 0}%)`);

  if (cot) {
    console.log(`COTIZACION VINCULADA: ${cot.codigo} | Comercial: ${cot.responsable_nombre} (${cot.responsable_email})`);
    console.log(`  Venta Pactada: ${cot.flete_venta_pactado} ${cot.moneda}`);
    console.log(`  Costo Estimado Armador: ${cot.flete_costo_estimado} ${cot.moneda}`);
    console.log(`  Margen Proyectado: ${cot.margen_proyectado} ${cot.moneda}`);
    const vMatch = carp.venta_estimada_total === cot.flete_venta_pactado;
    const cMatch = carp.costo_estimado_total === cot.flete_costo_estimado;
    const mMatch = carp.margen_estimado === cot.margen_proyectado;
    const monMatch = carp.moneda === cot.moneda;
    console.log(`  COINCIDENCIA CARPETA vs COTIZACION: Moneda: ${monMatch ? 'OK' : 'DIFF!'} | Venta: ${vMatch ? 'OK' : 'DIFF!'} | Costo: ${cMatch ? 'OK' : 'DIFF!'} | Margen: ${mMatch ? 'OK' : 'DIFF!'}`);
  } else {
    console.log(`COTIZACION VINCULADA: [NINGUNA!]`);
  }

  console.log(`FACTURAS / COMPROBANTES ASOCIADOS (${comps.length}):`);
  if (comps.length === 0) {
    console.log(`  [ALERTA: Sin comprobantes asociados directamente en INITIAL_COMPROBANTES]`);
  } else {
    let sumNetoMismaMoneda = 0;
    let sumTotalMismaMoneda = 0;
    for (const c of comps) {
      console.log(`  * Nº ${c.numero_comprobante} | ${c.emisor_razon_social} | CUIT: ${c.emisor_cuit}`);
      console.log(`    Gasto: ${c.clasificacion_gasto} - ${c.concepto_gasto}`);
      console.log(`    Importe: ${c.moneda} ${c.monto_total} (Neto: ${c.subtotal_neto}, IVA: ${c.monto_iva} [${c.alicuota_iva}%])`);
      console.log(`    Direccion: ${c.direccion} | Estado Pago: ${c.estado_pago} | Desvio: ${c.desvio_porcentaje ? c.desvio_porcentaje + '%' : '0%'}`);
      if (c.moneda === carp.moneda) {
        sumNetoMismaMoneda += c.subtotal_neto;
        sumTotalMismaMoneda += c.monto_total;
      } else {
        console.log(`    [DIFERENCIA MONEDA: Factura en ${c.moneda}, Carpeta en ${carp.moneda}, TC: ${c.tipo_cambio}]`);
      }
    }
    console.log(`  TOTAL FACTURAS ASOCIADAS (misma moneda ${carp.moneda}):`);
    console.log(`    Subtotal Neto: ${sumNetoMismaMoneda}`);
    console.log(`    Monto Total con IVA: ${sumTotalMismaMoneda}`);
    console.log(`    Comparación Costo Estimado Carpeta (${carp.costo_estimado_total}) vs Total Facturas Neto (${sumNetoMismaMoneda}): Dif = ${(sumNetoMismaMoneda - carp.costo_estimado_total).toFixed(2)}`);
  }
}
