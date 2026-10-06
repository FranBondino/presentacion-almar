const fs = require('fs');

// 1. Update ComprobanteList.tsx
let cl = fs.readFileSync('portal/components/comprobantes/ComprobanteList.tsx', 'utf8');
cl = cl.replace(
  "title={\n                                isAuthorized\n                                  ? 'Desvío tarifario autorizado'\n                                  : 'Sobrecosto detectado: requiere autorización'\n                              }",
  "title={\n                                isAuthorized\n                                  ? 'Desvío tarifario registrado'\n                                  : 'Diferencia tarifaria registrada para control contable'\n                              }"
);
fs.writeFileSync('portal/components/comprobantes/ComprobanteList.tsx', cl, 'utf8');
console.log('ComprobanteList updated');

// 2. Update mockData.ts
let md = fs.readFileSync('portal/lib/mockData.ts', 'utf8');

// Insert f0000020 before INITIAL_EVENTOS
const f20 = `  {
    id: 'f0000020-0000-0000-0000-000000000020',
    carpeta_id: 'c1056000-0000-0000-0000-000000000010',
    tipo_comprobante: 'INVOICE_EXTERIOR',
    direccion: 'COMPRA',
    numero_comprobante: 'HL-BUE-260912',
    emisor_razon_social: 'Hapag-Lloyd AG (Hapag-Lloyd Argentina S.A.)',
    emisor_cuit: '30-50361280-9',
    proveedor_exterior: true,
    concepto_gasto: 'Flete Marítimo y recargo por sobreestadía Contecar Cartagena BL HLCUBU105678',
    clasificacion_gasto: 'FMA',
    tipo_iva: 'IVA_0_EXENTO',
    categoria_fiscal: 'INTERNACIONAL_EXENTO_0',
    moneda: 'USD',
    tipo_cambio: 1.0,
    subtotal_neto: 3431.16,
    alicuota_iva: 0.0,
    monto_iva: 0.0,
    monto_total: 3431.16,
    estado_pago: 'PENDIENTE',
    fecha_emision: '2026-08-28',
    fecha_vencimiento: '2026-09-30',
    documento_id: 'd0000018-0000-0000-0000-000000000018',
    score_confianza: 0.99,
    archivo_pdf_url: '/facturas/C1471_factura_cma.pdf',
    categoria_proveedor_pa03: 'TRANSPORTE_LOGISTICA',
    metadata_raw: {
      bl: 'HLCUBU105678',
      contenedor: 'HLXU1234567',
      motivo_alerta: 'Recargo por 3 días de sobreestadía de contenedor en Terminal Contecar Cartagena no incluidos en la cotización inicial',
      raw_text: 'Hapag-Lloyd AG Invoice HL-BUE-260912 Total USD 3431.16 Demurrage Contecar Cartagena Saprograf C1056',
    },
    creado_por: '00000000-0000-0000-0000-000000000003',
    created_at: '2026-08-28T14:00:00Z',
    updated_at: '2026-08-28T14:00:00Z',
  },
`;

if (!md.includes('f0000020-0000-0000-0000-000000000020')) {
  md = md.replace('export const INITIAL_EVENTOS:', f20 + '];\n\nexport const INITIAL_EVENTOS:');
  md = md.replace(/\};\n\n  \{\n    id: 'f0000020/, '},\n  {\n    id: \'f0000020');
}

// Update e0000032
md = md.replace(
  /titulo: 'Detección de sobrecosto \/ factura repetida Maersk 7555554402'[\s\S]*?descripcion: 'Alerta de desvío tarifario por flete marítimo no pactado; retenida en Cola de Desvíos'[\s\S]*?fecha_evento: '2026-09-02T11:00:00Z'[\s\S]*?creado_por: '00000000-0000-0000-0000-000000000003'[\s\S]*?completado: false[\s\S]*?es_critico: true[\s\S]*?metadata: \{ comprobante: '7555554402', monto_usd: 57, desvio: 'SOBRECOSTO_RETENIDO' \}/,
  "titulo: 'Facturación documental Maersk 7555554402 dentro de presupuesto',\n    descripcion: 'Factura de emisión documental por USD 57.00 recibida y conciliada dentro del presupuesto aprobado de USD 1.400,00',\n    fecha_evento: '2026-09-02T11:00:00Z',\n    creado_por: '00000000-0000-0000-0000-000000000003',\n    completado: true,\n    es_critico: false,\n    metadata: { comprobante: '7555554402', monto_usd: 57, estado: 'CONCILIADO' }"
);

// Update d0000004
md = md.replace("      carpeta_detectada: 'C1289',\n      desvio_porcentaje: 21.0,", "      carpeta_detectada: 'C1289',");

// Update a0000002
md = md.replace(
  /titulo: 'Desvío detectado en flete marítimo Secco C1471'[\s\S]*?mensaje: 'El costo facturado por AMA Freight Invoice 261005130R por EUR 10\.848,55 superó la estimación inicial en \+165\.7%\. Requiere validación de Gerencia\.'/,
  "titulo: 'Conciliación completada flete marítimo Secco C1471',\n    mensaje: 'Factura AMA Freight 261005130R por EUR 10.848,55 conciliada exactamente con la cotización aprobada de EUR 10.848,55 (0% desvío).'"
);

// Update a0000004
md = md.replace(
  /carpeta_id: 'c1289000-0000-0000-0000-000000000007'[\s\S]*?comprobante_id: 'f0000007-0000-0000-0000-000000000007'[\s\S]*?titulo: 'Control de recargos en flete marítimo C1289'[\s\S]*?mensaje: 'La factura Maersk 7555554402 por USD 57\.00 superó el costo presupuestado \(\+21\.0%\)\. Desvío registrado para control contable\.'/,
  "carpeta_id: 'c1056000-0000-0000-0000-000000000010',\n    comprobante_id: 'f0000020-0000-0000-0000-000000000020',\n    tipo: 'DESVIO_COSTO',\n    severidad: 'WARNING',\n    titulo: 'Control de recargos en flete marítimo C1056',\n    mensaje: 'La factura Hapag-Lloyd HL-BUE-260912 por USD 3.431,16 superó la cotización presupuestada de USD 2.835,67 (+21.0% / +USD 595,49) por sobreestadía en Contecar Cartagena.'"
);

fs.writeFileSync('portal/lib/mockData.ts', md, 'utf8');
console.log('mockData updated successfully');
