import { CARPETAS_COTIZACIONES_MAP } from '../portal/lib/carpetasCotizacionesMap';

console.log('Verificando mapa de cotizaciones actual...');
for (const [k, v] of Object.entries(CARPETAS_COTIZACIONES_MAP)) {
  console.log(`${k}: Venta=${v.flete_venta_pactado}, Costo=${v.flete_costo_estimado}, Margen=${v.margen_proyectado}, Moneda=${v.moneda}`);
}
