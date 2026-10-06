const fs = require('fs');

const content = fs.readFileSync('portal/lib/mockData.ts', 'utf8');
const start = content.indexOf('export const INITIAL_COMPROBANTES:');
const end = content.indexOf('export const INITIAL_DOCUMENTOS:');
const compCode = content.slice(start, end);

const matches = compCode.match(/{\s*id:\s*'f[^']+'[\s\S]*?updated_at:\s*'[^']+',?\s*}/g) || [];
console.log('Total comprobantes encontrados:', matches.length);

// Also extract carpetas
const startCarp = content.indexOf('export const INITIAL_CARPETAS: CarpetaRecord[] = [');
const endCarp = content.indexOf('export const INITIAL_COMPROBANTES:');
const carpCode = content.slice(startCarp, endCarp);
const carpMatches = carpCode.match(/{\s*id:\s*'[^']+'[\s\S]*?updated_at:\s*'[^']+',?\s*}/g) || [];

const carpMap = {};
for (const b of carpMatches) {
  const getF = (f) => {
    const m = b.match(new RegExp(f + ":\\s*['\"]?([^'\",\\n]+)['\"]?"));
    return m ? m[1].trim() : null;
  };
  const id = getF('id');
  if (id) {
    carpMap[id] = {
      numero: getF('numero_carpeta'),
      cliente: getF('cliente_nombre'),
      moneda: getF('moneda'),
      costo_estimado: parseFloat(getF('costo_estimado_total') || '0'),
      venta_estimada: parseFloat(getF('venta_estimada_total') || '0'),
    };
  }
}

for (const b of matches) {
  const getF = (f) => {
    const m = b.match(new RegExp(f + ":\\s*['\"]?([^'\",\\n]+)['\"]?"));
    return m ? m[1].trim() : null;
  };
  const carpId = getF('carpeta_id');
  const carp = carpMap[carpId] || null;
  console.log({
    id: getF('id'),
    numero: getF('numero_comprobante'),
    emisor: getF('emisor_razon_social'),
    monto_total: parseFloat(getF('monto_total') || '0'),
    subtotal: parseFloat(getF('subtotal_neto') || '0'),
    monto_iva: parseFloat(getF('monto_iva') || '0'),
    moneda: getF('moneda'),
    carpeta: carp ? carp.numero : 'SIN_CARPETA',
    carp_costo_est: carp ? carp.costo_estimado : null,
    carp_moneda: carp ? carp.moneda : null,
    desvio_pct: getF('desvio_porcentaje'),
    alerta_activa: getF('alerta_activa'),
    desvio_autorizado: getF('desvio_autorizado'),
    asentado: getF('asentado_en_erp'),
    estado_pago: getF('estado_pago'),
  });
}
