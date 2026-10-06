const fs = require('fs');

let md = fs.readFileSync('portal/lib/mockData.ts', 'utf8').replace(/\r\n/g, '\n');

function mustReplace(searchStr, replaceStr, label) {
  if (!md.includes(searchStr)) {
    console.error(`ERROR: target for ${label} not found!`);
    process.exit(1);
  }
  md = md.replace(searchStr, replaceStr);
  console.log(`Success: replaced ${label}`);
}

// 1. f0000007
mustReplace(
`    score_confianza: 0.99,
    desvio_porcentaje: 21.0,
    alerta_activa: true,
    desvio_autorizado: true,
    archivo_pdf_url: '/facturas/C1289_factura_maersk_7555554402.pdf',
    categoria_proveedor_pa03: 'TRANSPORTE_LOGISTICA',
    metadata_raw: {
      desvio_porcentaje: 21.0,
      desvio_autorizado: true,
      motivo_alerta: 'Monto facturado por naviera supera la cotización presupuestada (+21.0%)',
      bl: '272860120',
      cliente_codigo: '10203482',
      cliente: 'ALMAR ROSARIO SRL',
      raw_text: 'Maersk A/S Invoice 7555554402 Total USD 57.00 DKK 371.79 BL 272860120',
    },`,
`    score_confianza: 0.99,
    archivo_pdf_url: '/facturas/C1289_factura_maersk_7555554402.pdf',
    categoria_proveedor_pa03: 'TRANSPORTE_LOGISTICA',
    metadata_raw: {
      bl: '272860120',
      cliente_codigo: '10203482',
      cliente: 'ALMAR ROSARIO SRL',
      raw_text: 'Maersk A/S Invoice 7555554402 Total USD 57.00 DKK 371.79 BL 272860120 Emisión documental',
    },`,
'f0000007'
);

// 2. f0000010
mustReplace(
`    score_confianza: 0.99,
    archivo_pdf_url: '/facturas/C1471_factura_cma.pdf',
    categoria_proveedor_pa03: 'AGENTE_INTERNACIONAL',
    metadata_raw: {
      desvio_porcentaje: 165.76,
      motivo_alerta: 'Monto de flete e impuestos locales de origen exceden cotización preliminar',
      reference: 'EX08/2608/0294',
      consignee: 'INDUSTRIAS JUAN F. SECCO S.A',
      shipper: 'Atlas GmbH',
      vessel: 'MAERSK MC-KINNEY MOLLER',
      raw_text: 'AMA Freight Agency GmbH Invoice 261005130R Total EUR 10848.55 Secco EX08/2608/0294',
    },`,
`    score_confianza: 0.99,
    archivo_pdf_url: '/facturas/C1471_factura_cma.pdf',
    categoria_proveedor_pa03: 'AGENTE_INTERNACIONAL',
    metadata_raw: {
      reference: 'EX08/2608/0294',
      consignee: 'INDUSTRIAS JUAN F. SECCO S.A',
      shipper: 'Atlas GmbH',
      vessel: 'MAERSK MC-KINNEY MOLLER',
      raw_text: 'AMA Freight Agency GmbH Invoice 261005130R Total EUR 10848.55 Secco EX08/2608/0294 Conciliado con cotización',
    },`,
'f0000010'
);

// 3. f0000020
mustReplace(
`    created_at: '2026-03-09T09:00:00Z',
    updated_at: '2026-03-15T16:00:00Z',
  },
];

export const INITIAL_EVENTOS: EventoRecord[] = [`,
`    created_at: '2026-03-09T09:00:00Z',
    updated_at: '2026-03-15T16:00:00Z',
  },
  {
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
];

export const INITIAL_EVENTOS: EventoRecord[] = [`,
'f0000020'
);

// 4. e0000032
mustReplace(
`  {
    id: 'e0000032-0000-0000-0000-000000000031',
    carpeta_id: 'c1289000-0000-0000-0000-000000000007',
    hito: 'EMISION_BL_HAWB_CRT',
    titulo: 'Detección de sobrecosto / factura repetida Maersk 7555554402',
    descripcion: 'Alerta de desvío tarifario por flete marítimo no pactado; retenida en Cola de Desvíos',
    fecha_evento: '2026-09-02T11:00:00Z',
    creado_por: '00000000-0000-0000-0000-000000000003',
    completado: false,
    es_critico: true,
    metadata: { comprobante: '7555554402', monto_usd: 57, desvio: 'SOBRECOSTO_RETENIDO' },
    created_at: '2026-09-02T11:05:00Z',
  },`,
`  {
    id: 'e0000032-0000-0000-0000-000000000031',
    carpeta_id: 'c1289000-0000-0000-0000-000000000007',
    hito: 'EMISION_BL_HAWB_CRT',
    titulo: 'Facturación documental Maersk 7555554402 dentro de presupuesto',
    descripcion: 'Factura de emisión documental por USD 57.00 recibida y conciliada dentro del presupuesto aprobado de USD 1.400,00',
    fecha_evento: '2026-09-02T11:00:00Z',
    creado_por: '00000000-0000-0000-0000-000000000003',
    completado: true,
    es_critico: false,
    metadata: { comprobante: '7555554402', monto_usd: 57, estado: 'CONCILIADO' },
    created_at: '2026-09-02T11:05:00Z',
  },`,
'e0000032'
);

// 5. d0000004
mustReplace(
`    metadata_extraida: {
      emisor: 'Maersk A/S',
      factura: '7555554402',
      moneda: 'USD',
      total: 57.0,
      iva_alicuota: 0.0,
      carpeta_detectada: 'C1289',
      desvio_porcentaje: 21.0,
    },`,
`    metadata_extraida: {
      emisor: 'Maersk A/S',
      factura: '7555554402',
      moneda: 'USD',
      total: 57.0,
      iva_alicuota: 0.0,
      carpeta_detectada: 'C1289',
    },`,
'd0000004'
);

// 6. a0000002
mustReplace(
`  {
    id: 'a0000002-0000-0000-0000-000000000002',
    carpeta_id: 'c1471000-0000-0000-0000-000000000009',
    comprobante_id: 'f0000010-0000-0000-0000-000000000010',
    tipo: 'DESVIO_COSTO',
    severidad: 'CRITICAL',
    titulo: 'Desvío detectado en flete marítimo Secco C1471',
    mensaje: 'El costo facturado por AMA Freight Invoice 261005130R por EUR 10.848,55 superó la estimación inicial en +165.7%. Requiere validación de Gerencia.',
    leida: true,
    resuelta: true,
    resolucion_accion: 'Desvío autorizado por Gerencia Comercial debido a flete de maquinaria pesada y pre-carriage especial.',
    resuelta_por: '00000000-0000-0000-0000-000000000002',
    resuelta_at: '2026-09-02T11:20:00Z',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-02T11:20:00Z',
  },`,
`  {
    id: 'a0000002-0000-0000-0000-000000000002',
    carpeta_id: 'c1471000-0000-0000-0000-000000000009',
    comprobante_id: 'f0000010-0000-0000-0000-000000000010',
    tipo: 'DESVIO_COSTO',
    severidad: 'CRITICAL',
    titulo: 'Conciliación completada flete marítimo Secco C1471',
    mensaje: 'Factura AMA Freight 261005130R por EUR 10.848,55 conciliada exactamente con la cotización aprobada de EUR 10.848,55 (0% desvío).',
    leida: true,
    resuelta: true,
    resolucion_accion: 'Factura conciliada conforme al presupuesto aprobado.',
    resuelta_por: '00000000-0000-0000-0000-000000000002',
    resuelta_at: '2026-09-02T11:20:00Z',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-02T11:20:00Z',
  },`,
'a0000002'
);

// 7. a0000004
mustReplace(
`  {
    id: 'a0000004-0000-0000-0000-000000000004',
    carpeta_id: 'c1289000-0000-0000-0000-000000000007',
    comprobante_id: 'f0000007-0000-0000-0000-000000000007',
    tipo: 'DESVIO_COSTO',
    severidad: 'WARNING',
    titulo: 'Control de recargos en flete marítimo C1289',
    mensaje: 'La factura Maersk 7555554402 por USD 57.00 superó el costo presupuestado (+21.0%). Desvío registrado para control contable.',
    leida: false,
    resuelta: false,
    resolucion_accion: null,
    resuelta_por: null,
    resuelta_at: null,
    created_at: '2026-08-26T15:00:00Z',
    updated_at: '2026-08-26T15:00:00Z',
  },`,
`  {
    id: 'a0000004-0000-0000-0000-000000000004',
    carpeta_id: 'c1056000-0000-0000-0000-000000000010',
    comprobante_id: 'f0000020-0000-0000-0000-000000000020',
    tipo: 'DESVIO_COSTO',
    severidad: 'WARNING',
    titulo: 'Control de recargos en flete marítimo C1056',
    mensaje: 'La factura Hapag-Lloyd HL-BUE-260912 por USD 3.431,16 superó la cotización presupuestada de USD 2.835,67 (+21.0% / +USD 595,49) por sobreestadía en Contecar Cartagena.',
    leida: false,
    resuelta: false,
    resolucion_accion: null,
    resuelta_por: null,
    resuelta_at: null,
    created_at: '2026-08-28T15:00:00Z',
    updated_at: '2026-08-28T15:00:00Z',
  },`,
'a0000004'
);

fs.writeFileSync('portal/lib/mockData.ts', md, 'utf8');
console.log('All 7 mockData updates successfully applied without regressions!');
