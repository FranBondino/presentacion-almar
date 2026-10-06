const fs = require('fs');

const content = fs.readFileSync('portal/lib/mockData.ts', 'utf8');
const start = content.indexOf('export const INITIAL_CARPETAS: CarpetaRecord[] = [');
const end = content.indexOf('export const INITIAL_COMPROBANTES:');
const carpetasCode = content.slice(start, end);

// Extraer bloques de objetos
const carpetasMatches = carpetasCode.match(/{\s*id:\s*'[^']+'[\s\S]*?updated_at:\s*'[^']+',?\s*}/g) || [];
console.log('Total bloques carpetas encontrados:', carpetasMatches.length);

for (const b of carpetasMatches) {
  const getField = (f) => {
    const m = b.match(new RegExp(`${f}:\\s*['"]?([^'",\\n]+)['"]?`));
    return m ? m[1].trim() : null;
  };
  console.log({
    id: getField('id'),
    numero: getField('numero_carpeta'),
    cliente: getField('cliente_nombre'),
    area: getField('area'),
    moneda: getField('moneda'),
    venta: getField('venta_estimada_total'),
    costo: getField('costo_estimado_total'),
    margen: getField('margen_estimado'),
  });
}
