'use client';

import * as React from 'react';
import type { CarpetaRecord } from '@/lib/mockData';
import { formatDateTime } from '@/lib/utils';
import {
  Mail,
  Users,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  BadgePercent,
} from 'lucide-react';

export interface MailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  date: string;
  subject: string;
  bodyExcerpt: string;
  esEtapaComercial?: boolean;
  codigoCotizacion?: string;
  attachments?: Array<{
    name: string;
    size: string;
    url: string;
    tipo: string;
  }>;
  aiClassification?: {
    tipoGasto?: string;
    desvioDetectado?: boolean;
    montoExtraido?: string;
    moneda?: string;
    cuitValido?: boolean;
  };
}

export interface ActorProfile {
  rol: string;
  nombre: string;
  email: string;
  entidad: string;
  tipo: 'PROVEEDOR' | 'OPERADOR' | 'SUPERVISOR' | 'FINANZAS' | 'CLIENTE' | 'COMERCIAL' | 'ADMIN';
}

export const CARPETA_ACTORS_MAP: Record<string, ActorProfile[]> = {
  C1234: [
    {
      rol: 'Cliente Directivo & Importador',
      nombre: 'Horacio Calamante / Gustavo Weedon',
      email: 'comex@disdendental.com.ar',
      entidad: 'Dis-Den Odontología / Calamante S.R.L.',
      tipo: 'CLIENTE',
    },
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Agente Internacional Shenzhen',
      nombre: 'Vic Mai',
      email: 'vic.mai@eversail-sz.com',
      entidad: 'Eversail Shenzhen Logistics',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Operador Principal',
      nombre: 'Natali Hermoso',
      email: 'nhermoso@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Dirección Comercial & Aprobador WebAuthn',
      nombre: 'Alejandro Noacco',
      email: 'anoacco@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'ADMIN',
    },
    {
      rol: 'Línea Marítima',
      nombre: 'Maersk Line Operations',
      email: 'ar.import@maersk.com',
      entidad: 'Maersk Line A/S',
      tipo: 'PROVEEDOR',
    },
  ],
  C1434: [
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Principal',
      nombre: 'Aldana Gómez',
      email: 'agomez@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Lead de Operaciones',
      nombre: 'Natali Hermoso',
      email: 'nhermoso@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'SUPERVISOR',
    },
    {
      rol: 'Directorio & Finanzas',
      nombre: 'Vanesa Meggiolaro',
      email: 'vmeggiolaro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Línea Marítima',
      nombre: 'Maersk Customer Support',
      email: 'facturas.argentina@maersk.com',
      entidad: 'Maersk Line A/S',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente',
      nombre: 'Logística Ternium Siderar',
      email: 'logistica@terniumsiderar.com',
      entidad: 'Siderar S.A.I.C.',
      tipo: 'CLIENTE',
    },
  ],
  IT1486: [
    {
      rol: 'Comercial Terrestre & Aéreo',
      nombre: 'Abril Stampfli',
      email: 'astampfli@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operaciones Tráfico Terrestre',
      nombre: 'Alexis Bucardo',
      email: 'abucardo@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Directorio & Finanzas',
      nombre: 'Vanesa Meggiolaro',
      email: 'vmeggiolaro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Transportista Terrestre',
      nombre: 'Despacho & Tráfico LGV',
      email: 'operaciones@lgvtransportes.com.ar',
      entidad: 'LGV Transportes S.R.L. / Lisandro G. Villalba',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Receptor',
      nombre: 'Logística Paladini',
      email: 'abastecimiento@paladini.com.ar',
      entidad: 'Paladini S.A. / Tadeo Czerweny SA',
      tipo: 'CLIENTE',
    },
  ],
  C1482: [
    {
      rol: 'Director Comercial & Aéreo',
      nombre: 'Juan Andrés Arloro',
      email: 'jarloro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'ADMIN',
    },
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Tráfico Aéreo',
      nombre: 'Abril Stampfli',
      email: 'astampfli@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Aerolínea Internacional',
      nombre: 'Lufthansa Cargo Operations',
      email: 'fra-cargo@lufthansa.com',
      entidad: 'Deutsche Lufthansa AG',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Exportador',
      nombre: 'Vicentin Comercio Exterior',
      email: 'comex@vicentin.com.ar',
      entidad: 'Vicentin S.A.I.C.',
      tipo: 'CLIENTE',
    },
  ],
  C1024: [
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Principal',
      nombre: 'Natali Hermoso',
      email: 'nhermoso@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Directorio & Finanzas',
      nombre: 'Vanesa Meggiolaro',
      email: 'vmeggiolaro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Agente en Origen Brasil',
      nombre: 'Santos Port Forwarding',
      email: 'ops@santosforwarding.com.br',
      entidad: 'Santos Logistics Brasil',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Importador',
      nombre: 'Molinos Abastecimiento Comex',
      email: 'comex@molinos.com.ar',
      entidad: 'Molinos Río de la Plata S.A.',
      tipo: 'CLIENTE',
    },
  ],
  TL1436: [
    {
      rol: 'Comercial Tráfico Terrestre',
      nombre: 'Abril Stampfli',
      email: 'astampfli@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Terrestre',
      nombre: 'Alexis Bucardo',
      email: 'abucardo@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Transportista Carga Seca',
      nombre: 'Logística Terrestre Biton',
      email: 'trafico@bitontransportes.com.ar',
      entidad: 'Biton Transportes S.A.',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Agroexportador',
      nombre: 'Bunge Logística Portuaria',
      email: 'logistica.puerto@bunge.com',
      entidad: 'Bunge Argentina S.A.',
      tipo: 'CLIENTE',
    },
  ],
  C1289: [
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Ejecutivo Comercial Senior',
      nombre: 'Martín Fusco',
      email: 'mfusco@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Principal',
      nombre: 'Natali Hermoso',
      email: 'nhermoso@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Directorio & Finanzas',
      nombre: 'Vanesa Meggiolaro',
      email: 'vmeggiolaro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Finanzas & Facturación',
      nombre: 'Stefania Rossi',
      email: 'srossi@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Línea Marítima',
      nombre: 'Maersk Customer Support',
      email: 'facturas.argentina@maersk.com',
      entidad: 'Maersk Line A/S',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Importador',
      nombre: 'Albertoni S.A. Comex',
      email: 'comex@albertoni.com.ar',
      entidad: 'Albertoni S.A.',
      tipo: 'CLIENTE',
    },
  ],
  EA1561: [
    {
      rol: 'Comercial Tráfico Aéreo',
      nombre: 'Abril Stampfli',
      email: 'astampfli@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Comercial Exportación',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Aerolínea de Carga',
      nombre: 'Aerolíneas Cargo Ezeiza',
      email: 'cargo@aerolineas.com.ar',
      entidad: 'Aerolíneas Argentinas Cargo',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Exportador',
      nombre: 'Bertot Comercio Exterior',
      email: 'comercioexterior@bertot.com.ar',
      entidad: 'Bertot Metalmecánica S.R.L.',
      tipo: 'CLIENTE',
    },
  ],
  C1471: [
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Principal',
      nombre: 'Natali Hermoso',
      email: 'nhermoso@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Directorio & Finanzas',
      nombre: 'Vanesa Meggiolaro',
      email: 'vmeggiolaro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Agente en Origen Alemania',
      nombre: 'Andreas Hoppenberg (AMA Freight)',
      email: 'operations@amafreight.de',
      entidad: 'AMA Freight Agency GmbH',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Corporativo',
      nombre: 'Industrias Secco Comex',
      email: 'magimenez@secco.com.ar',
      entidad: 'Industrias Juan F. Secco S.A.',
      tipo: 'CLIENTE',
    },
  ],
  C1056: [
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Customer Service Exportación',
      nombre: 'Victoria Moyano',
      email: 'vmoyano@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Línea Marítima',
      nombre: 'Hapag-Lloyd Argentina',
      email: 'buenosaires@hlag.com',
      entidad: 'Hapag-Lloyd A.G.',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Exportador',
      nombre: 'Saprograf Exportaciones',
      email: 'export@saprograf.com.ar',
      entidad: 'Saprograf S.A.S. / Litamex',
      tipo: 'CLIENTE',
    },
  ],
  C367: [
    {
      rol: 'Ejecutivo Comercial Asignado',
      nombre: 'Martín Fusco',
      email: 'mfusco@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operaciones Impo & Corporativas',
      nombre: 'Ana Laura Talaban',
      email: 'atalaban@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Co-Loader Marítimo',
      nombre: 'MSL Consolidaciones',
      email: 'ops@msl.com.ar',
      entidad: 'MSL Líneas Marítimas S.A.',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Cliente Importador',
      nombre: 'Juan Cuello / Metalúrgica Rosarina',
      email: 'cuellojr@metalurgicarosarina.com.ar',
      entidad: 'Metalúrgica Rosarina S.R.L.',
      tipo: 'CLIENTE',
    },
  ],
  C620: [
    {
      rol: 'Ejecutiva Comercial',
      nombre: 'Lucía Laje',
      email: 'llaje@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'COMERCIAL',
    },
    {
      rol: 'Operador Principal',
      nombre: 'Natali Hermoso',
      email: 'nhermoso@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'OPERADOR',
    },
    {
      rol: 'Directorio & Finanzas',
      nombre: 'Vanesa Meggiolaro',
      email: 'vmeggiolaro@almarrosario.com',
      entidad: 'ALMAR Rosario',
      tipo: 'FINANZAS',
    },
    {
      rol: 'Agente en Reino Unido',
      nombre: 'Suzie Tran (SAA Logistics UK)',
      email: 'suzie@saalogistics.co.uk',
      entidad: 'SAA Logistics UK Ltd.',
      tipo: 'PROVEEDOR',
    },
    {
      rol: 'Institución Cliente',
      nombre: 'CONICET Rosario / IBR',
      email: 'compras@rosario-conicet.gov.ar',
      entidad: 'CONICET Instituto de Biología Molecular',
      tipo: 'CLIENTE',
    },
  ],
};

export const CARPETA_MAILS_MAP: Record<string, MailMessage[]> = {
  C1234: [
    {
      id: 'm-c1234-cot-01',
      from: 'comex@disdendental.com.ar',
      fromName: 'Gustavo Weedon / Horacio Calamante (Dis-Den Odontología)',
      to: ['llaje@almarrosario.com'],
      date: '2026-08-08T09:15:00Z',
      subject: 'Solicitud Flete Marítimo Instrumental Guilin Woodpecker // Shenzhen a Bs As // C1234',
      bodyExcerpt:
        'Estimada Lucía: Solicitamos cotización de flete marítimo para importación de instrumental odontológico Guilin Woodpecker (1x40HQ) desde Shenzhen (agente Eversail / Vic Mai) con destino Buenos Aires / Rosario. Requerimos servicio con Maersk Line y 14 días libres de estadía.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00010',
    },
    {
      id: 'm-c1234-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['comex@disdendental.com.ar', 'anoacco@almarrosario.com'],
      date: '2026-08-10T14:00:00Z',
      subject: 'Cotización Oficial COT-2026-00010 // Dis-Den Odontología (Calamante S.R.L.) // Maersk C1234',
      bodyExcerpt:
        'Estimado Horacio, Gustavo: Adjuntamos cotización pactada por flete marítimo: Venta USD 1.950,00 All-In con Maersk Line (BL KA0018437). Costo estimado base naviera: USD 1.807,50. Margen proyectado resultante: USD 142.50. Debido a la competencia spot y al tratarse de cuenta estratégica, el margen de USD 142.50 activa semáforo preventivo (< USD 200) y cuenta con aprobación de Dirección.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00010',
      attachments: [
        {
          name: 'C1234_factura_maersk.pdf',
          size: '4.7 KB',
          url: '/facturas/C1234_factura_maersk.pdf',
          tipo: 'Cotización / Factura Maersk',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '1950.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1234-cot-03',
      from: 'comex@disdendental.com.ar',
      fromName: 'Horacio Calamante (Dis-Den Odontología / Calamante S.R.L.)',
      to: ['llaje@almarrosario.com', 'nhermoso@almarrosario.com'],
      date: '2026-08-11T11:20:00Z',
      subject: 'Aprobación Cotización COT-2026-00010 // Orden de Embarque Dis-Den Calamante // C1234',
      bodyExcerpt:
        'Lucía: Aprobamos la tarifa de flete marítimo de USD 1.950,00. Adjuntamos confirmación de orden para Guilin Woodpecker Medical Instrument. Por favor coordinar con el shipper en Shenzhen y con Vic Mai de Eversail. Copiamos a Natali Hermoso para el seguimiento operativo.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00010',
    },
    {
      id: 'm-c1234-ops-04',
      from: 'vic.mai@eversail-sz.com',
      fromName: 'Vic Mai (Eversail Shenzhen Logistics)',
      to: ['nhermoso@almarrosario.com', 'llaje@almarrosario.com'],
      date: '2026-08-12T04:30:00Z',
      subject: 'Booking & Pre-Alert: Guilin Woodpecker -> Calamante S.R.L. // HBL ESZFL26060067 // C1234',
      bodyExcerpt:
        'Dear Natali: Booking confirmed with Maersk Line. Shipper: Guilin Woodpecker Medical Instrument Co., Ltd. Consignee: Calamante S.R.L. (Dis-Den). Container: MSKU7842897. HBL: ESZFL26060067. MBL: KA0018437. Vessel scheduled to depart Shenzhen/Hong Kong to Buenos Aires.',
    },
    {
      id: 'm-c1234-ops-05',
      from: 'nhermoso@almarrosario.com',
      fromName: 'Natali Hermoso (Operaciones ALMAR)',
      to: ['anoacco@almarrosario.com', 'vmeggiolaro@almarrosario.com'],
      date: '2026-08-20T10:15:00Z',
      subject: 'Alerta Preventiva Margen USD 142.50 (< USD 200) // Carpeta C1234 Dis-Den // Requiere WebAuthn',
      bodyExcerpt:
        'Alejandro: El costo de flete Maersk Line cierra en USD 1.807,50 y la venta pactada en USD 1.950,00, dejando un margen de USD 142.50. El sistema encendió el semáforo preventivo amarillo (< USD 200) por descalce con gastos locales en pesos. Se requiere tu autorización biométrica WebAuthn para liberar la prefactura a Calamante S.R.L.',
    },
    {
      id: 'm-c1234-ops-06',
      from: 'anoacco@almarrosario.com',
      fromName: 'Alejandro Noacco (Dirección Comercial ALMAR)',
      to: ['nhermoso@almarrosario.com', 'vmeggiolaro@almarrosario.com', 'llaje@almarrosario.com'],
      date: '2026-08-20T10:18:22Z',
      subject: 'AUTORIZACIÓN WEBAUTHN CONCEDIDA (SHA-256) // Carpeta C1234 Dis-Den Odontología',
      bodyExcerpt:
        'Autorización biométrica confirmada en 3 segundos vía WebAuthn FIDO2 (Touch ID). Hash de firma SHA-256: d8a4f91b72e045c83210bc6a98711e4f9b8c347d0182ec35ab120984de63f512. Motivo: Cuenta estratégica fidelizada Dis-Den Odontología / Calamante S.R.L. Operación destrabada y prefactura liberada.',
      attachments: [
        {
          name: 'C1234_factura_maersk.pdf',
          size: '4.7 KB',
          url: '/facturas/C1234_factura_maersk.pdf',
          tipo: 'Factura FMA Naviera',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '1807.50',
        moneda: 'USD',
        cuitValido: true,
      },
    },
  ],

  C1434: [
    {
      id: 'm-c1434-cot-01',
      from: 'logistica@terniumsiderar.com',
      fromName: 'César Cusit (Siderar Comex)',
      to: ['llaje@almarrosario.com'],
      date: '2026-07-19T10:00:00Z',
      subject: 'SOLICITUD COTIZACION ATLAS PO 071 - Siderar // Ningbo-Bs As // C1434',
      bodyExcerpt:
        'Hola Lucía: Necesitamos cotización de flete marítimo para 1x20ST repuestos de laminación desde Ningbo hacia Buenos Aires. Embarque previsto fin de julio. Por favor incluir condición de 14 días libres de demoras.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00061',
    },
    {
      id: 'm-c1434-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['logistica@terniumsiderar.com'],
      date: '2026-07-21T17:15:25Z',
      subject: 'RE: SOLICITUD COTIZACION ATLAS PO 071 - Siderar // COT-2026-00061',
      bodyExcerpt:
        'Estimado César: Cotizamos flete marítimo Ningbo a Buenos Aires con Maersk Line: Flete venta USD 1.350,00 All-In con 14 días libres en Terminal 4. Costo base naviera estimado USD 848,00. Margen comercial: USD 502,00. Vigencia de tarifa: 15 días. Saludos cordiales.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00061',
      attachments: [
        {
          name: 'COT_2026_00061_Siderar_Ningbo.pdf',
          size: '76.8 KB',
          url: '/facturas/COT_2026_00061_Siderar_Ningbo.pdf',
          tipo: 'Cotización Comercial PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '1350.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1434-cot-03',
      from: 'logistica@terniumsiderar.com',
      fromName: 'César Cusit (Siderar Comex)',
      to: ['llaje@almarrosario.com', 'agomez@almarrosario.com'],
      date: '2026-07-22T09:30:00Z',
      subject: 'Confirmación Cotización COT-2026-00061 // PO 7001434 Siderar',
      bodyExcerpt:
        'Lucía: Confirmamos la tarifa de USD 1.350,00 bajo cotización COT-2026-00061. Se abre expediente interno C1434. Queda a cargo de Aldana Gómez la coordinación con el armador Maersk Line.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00061',
    },
    {
      id: 'm-c1434-01',
      from: 'donotreply@maersk.com',
      fromName: 'Maersk Customer Service Argentina',
      to: ['agomez@almarrosario.com', 'vmeggiolaro@almarrosario.com'],
      date: '2026-08-25T11:15:00Z',
      subject: 'Arrival Notice & Local Charges - BL MAEU123456789 - Siderar C1434',
      bodyExcerpt:
        'Vessel MAERSK MC-KINNEY MOLLER / Voyage 2608W has arrived at Terminal 4 Puerto Buenos Aires. Container MRKU1122334 ready for discharge. Local charges invoice 7554566633 for USD 57.00 due date 2026-09-15. Free days expiring 2026-09-08.',
      attachments: [
        {
          name: '7554566633.PDF',
          size: '14.8 KB',
          url: '/facturas/7554566633.PDF',
          tipo: 'Factura Local Charges',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '57.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
  ],

  IT1486: [
    {
      id: 'm-it1486-cot-01',
      from: 'abastecimiento@paladini.com.ar',
      fromName: 'Logística Paladini / Tadeo Czerweny',
      to: ['astampfli@almarrosario.com'],
      date: '2026-08-10T09:15:00Z',
      subject: 'IMPO- OS 16676 // Solicitud Cotización Flete Terrestre TRP a Villa Gdor Gálvez // IT1486',
      bodyExcerpt:
        'Abril: Solicitamos tarifa de flete terrestre para traslado de 1 semirremolque con insumos refrigerados descargados en Terminal TRP Buenos Aires con destino a planta Paladini Villa Gobernador Gálvez. Carga con remito de aduana.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00357',
    },
    {
      id: 'm-it1486-cot-02',
      from: 'astampfli@almarrosario.com',
      fromName: 'Abril Stampfli (Comercial Terrestre ALMAR)',
      to: ['abastecimiento@paladini.com.ar'],
      date: '2026-08-11T13:42:00Z',
      subject: 'Cotización Aprobada COT-2026-00357 // Tramo Puerto BUE a V.G. Gálvez Paladini',
      bodyExcerpt:
        'Estimados: Enviamos cotización oficial COT-2026-00357 para el tramo TRP Buenos Aires a Villa Gobernador Gálvez con chofer asignado de LGV Transportes. Tarifa pactada: $968.000,00 ARS + IVA 21%. Costo estimado chofer: $720.000,00 ARS. Margen: $248.000,00 ARS. Vigencia: 15 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00357',
      attachments: [
        {
          name: 'COT_2026_00357_Paladini_Terrestre.pdf',
          size: '68.4 KB',
          url: '/facturas/COT_2026_00357_Paladini_Terrestre.pdf',
          tipo: 'Cotización Terrestre PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FTE',
        desvioDetectado: false,
        montoExtraido: '968000.00',
        moneda: 'ARS',
        cuitValido: true,
      },
    },
    {
      id: 'm-it1486-cot-03',
      from: 'abastecimiento@paladini.com.ar',
      fromName: 'Logística Paladini',
      to: ['astampfli@almarrosario.com', 'abucardo@almarrosario.com'],
      date: '2026-08-12T11:00:00Z',
      subject: 'Aceptación Cotización COT-2026-00357 - Orden de Traslado // IT1486',
      bodyExcerpt:
        'Abril: Aprobada la cotización COT-2026-00357 por $968.000,00. Queda coordinado el ingreso del chofer de LGV Transportes a Terminal TRP para retiro del contenedor.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00357',
    },
    {
      id: 'm-it1486-01',
      from: 'operaciones@lgvtransportes.com.ar',
      fromName: 'LGV Transportes S.R.L. / Lisandro G. Villalba',
      to: ['astampfli@almarrosario.com', 'srossi@almarrosario.com'],
      date: '2026-08-20T17:40:00Z',
      subject: 'Envío Factura Electrónica 0004-00000303 - Paladini IT1486',
      bodyExcerpt:
        'Adjuntamos factura A 0004-00000303 por el viaje de Puerto Buenos Aires a Villa Gobernador Gálvez. Importe neto gravado: $800.000,00, IVA 21%: $168.000,00, Total a pagar: $968.000,00. Se acompaña remito de entrega con firma de recepción conforme.',
      attachments: [
        {
          name: '0004-00000303.PDF',
          size: '18.2 KB',
          url: '/facturas/0004-00000303.PDF',
          tipo: 'Factura A Terrestre',
        },
      ],
      aiClassification: {
        tipoGasto: 'FTE',
        desvioDetectado: false,
        montoExtraido: '968000.00',
        moneda: 'ARS',
        cuitValido: true,
      },
    },
  ],

  C1482: [
    {
      id: 'm-c1482-cot-01',
      from: 'comex@vicentin.com.ar',
      fromName: 'Vicentin S.A.I.C. Comercio Exterior',
      to: ['jarloro@almarrosario.com', 'llaje@almarrosario.com'],
      date: '2026-08-16T14:10:00Z',
      subject: 'SOLICITUD COTIZACION AEREA EZE-FRA // Vicentin // Muestras Industriales C1482',
      bodyExcerpt:
        'Juan: Necesitamos cotizar flete aéreo urgente desde Ezeiza a Frankfurt para muestras de subproductos de soja. Peso tasable: 620 kg. Requerimos vuelo directo o escala corta.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00610',
    },
    {
      id: 'm-c1482-cot-02',
      from: 'jarloro@almarrosario.com',
      fromName: 'Juan Andrés Arloro (Director Comercial ALMAR)',
      to: ['comex@vicentin.com.ar'],
      date: '2026-08-19T19:38:36Z',
      subject: 'Cotización Oficial COT-2026-00610 // Aéreo EZE-FRA Vicentin C1482',
      bodyExcerpt:
        'Estimados: Cotizamos flete aéreo exportación vía Lufthansa Cargo vuelo LH8265 directo EZE-FRA. Flete venta acordado: USD 5.200,00 All-In con gastos de emisión AWB. Costo provisión aerolínea: USD 4.150,00. Margen comercial: USD 1.050,00. Vigencia: 15 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00610',
      attachments: [
        {
          name: 'COT_2026_00610_Vicentin_Aereo.pdf',
          size: '91.2 KB',
          url: '/facturas/COT_2026_00610_Vicentin_Aereo.pdf',
          tipo: 'Cotización Aérea PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FIA',
        desvioDetectado: false,
        montoExtraido: '5200.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1482-cot-03',
      from: 'comex@vicentin.com.ar',
      fromName: 'Vicentin S.A.I.C.',
      to: ['jarloro@almarrosario.com', 'astampfli@almarrosario.com'],
      date: '2026-08-20T10:30:00Z',
      subject: 'Aprobación Tarifa Aérea COT-2026-00610 // C1482',
      bodyExcerpt:
        'Aprobamos la tarifa de USD 5.200,00 bajo cotización COT-2026-00610. La carga ingresará al depósito fiscal de TCA Ezeiza el 24/08. Coordinar con Abril Stampfli.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00610',
    },
  ],

  C1024: [
    {
      id: 'm-c1024-cot-01',
      from: 'comex@molinos.com.ar',
      fromName: 'Molinos Río de la Plata Abastecimiento',
      to: ['llaje@almarrosario.com'],
      date: '2026-04-08T09:40:00Z',
      subject: 'SOLICITUD COTIZACION BOLEX PO 068 // Santos a Zárate // C1024',
      bodyExcerpt:
        'Lucía: Solicitamos tarifa marítima FCL para insumos agroalimentarios desde Santos a Terminal Zárate con escala para transbordo fluvial a Rosario. Carga de 40HC.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00226',
    },
    {
      id: 'm-c1024-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['comex@molinos.com.ar'],
      date: '2026-04-10T11:20:00Z',
      subject: 'RE: SOLICITUD COTIZACION BOLEX PO 068 - Molinos // COT-2026-00226 // C1024',
      bodyExcerpt:
        'Estimados Molinos Abastecimiento: Cotizamos con Hamburg Süd / Maersk servicio feeder Santos a Zárate: Flete venta USD 1.800,00 All-In con 14 días libres de demoras. Provisión de costo estimada: USD 1.200,00. Margen comercial: USD 600,00. Validez: 30 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00226',
      attachments: [
        {
          name: 'COT_2026_00226_Molinos_Santos.pdf',
          size: '81.5 KB',
          url: '/facturas/COT_2026_00226_Molinos_Santos.pdf',
          tipo: 'Cotización FCL PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '1800.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1024-cot-03',
      from: 'comex@molinos.com.ar',
      fromName: 'Molinos Río de la Plata',
      to: ['llaje@almarrosario.com', 'nhermoso@almarrosario.com'],
      date: '2026-04-11T15:00:00Z',
      subject: 'Confirmación Cotización COT-2026-00226 // PO 068 Molinos C1024',
      bodyExcerpt:
        'Lucía: Confirmamos cotización COT-2026-00226. Natali Hermoso queda a cargo del tracking y la recepción de aviso de arribo en Terminal Zárate.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00226',
    },
  ],

  TL1436: [
    {
      id: 'm-tl1436-cot-01',
      from: 'logistica.puerto@bunge.com',
      fromName: 'Bunge Argentina Logística',
      to: ['astampfli@almarrosario.com'],
      date: '2026-07-28T10:15:00Z',
      subject: 'Pedido de Tarifa Flete Terrestre San Lorenzo a Terminal Zárate // TL1436',
      bodyExcerpt:
        'Abril: Buen día. Solicitamos tarifa de flete para traslado de 12 pallets de carga seca consolidada desde depósito San Lorenzo hasta Terminal Zárate.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00379',
    },
    {
      id: 'm-tl1436-cot-02',
      from: 'astampfli@almarrosario.com',
      fromName: 'Abril Stampfli (Comercial Terrestre ALMAR)',
      to: ['logistica.puerto@bunge.com'],
      date: '2026-07-29T13:14:09Z',
      subject: 'TARIFA TRAMO PORTUARIO SAN LORENZO - ZARATE - COT-2026-00379 // TL1436',
      bodyExcerpt:
        'Estimados, buen día! Cotizamos el retiro de 12 pallets (12.646 kg) tramo San Lorenzo a Zárate: Tarifa pactada $540.000,00 ARS + IVA. Provisión chofer LGV/Biton: $410.000,00 ARS. Margen: $130.000,00 ARS. Vigencia: 15 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00379',
      aiClassification: {
        tipoGasto: 'FTE',
        desvioDetectado: false,
        montoExtraido: '540000.00',
        moneda: 'ARS',
        cuitValido: true,
      },
    },
    {
      id: 'm-tl1436-cot-03',
      from: 'logistica.puerto@bunge.com',
      fromName: 'Bunge Argentina',
      to: ['astampfli@almarrosario.com', 'abucardo@almarrosario.com'],
      date: '2026-07-30T11:20:00Z',
      subject: 'Aprobación Tarifa Terrestre COT-2026-00379 // TL1436 Bunge',
      bodyExcerpt:
        'Aprobado. Alexis Bucardo coordinará la orden de carga y los datos del camión y chofer para el ingreso a planta San Lorenzo.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00379',
    },
  ],

  C1289: [
    {
      id: 'm-c1289-cot-01',
      from: 'comex@albertoni.com.ar',
      fromName: 'Albertoni S.A. Comex',
      to: ['llaje@almarrosario.com', 'mfusco@almarrosario.com'],
      date: '2026-06-01T10:15:00Z',
      subject: 'NUEVA CARGA LISTA EN BREMERHAVEN / NINGBO // Solicitud Tarifa C1289',
      bodyExcerpt:
        'Lucía, Martín: Les informamos que tenemos carga de repuestos industriales lista en origen. Requerimos flete marítimo hasta Buenos Aires con desconsolidación y despacho hacia Rosario.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00105',
    },
    {
      id: 'm-c1289-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['comex@albertoni.com.ar'],
      date: '2026-06-03T18:46:43Z',
      subject: 'Cotización Oficial COT-2026-00105 // Albertoni S.A. FCL C1289',
      bodyExcerpt:
        'Buenas tardes Mariela: Cotizamos flete marítimo Maersk Line con 14 días libres de demoras. Flete venta acordado: $1.617.000,00 ARS (FTE) + USD 791,00 (THC terminal). Provisión de costo estimada: $1.220.000,00 ARS. Margen comercial: $397.000,00 ARS. Validez: 20 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00105',
      attachments: [
        {
          name: 'COT_2026_00105_Albertoni_FCL.pdf',
          size: '88.1 KB',
          url: '/facturas/COT_2026_00105_Albertoni_FCL.pdf',
          tipo: 'Cotización Comercial PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '1617000.00',
        moneda: 'ARS',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1289-01',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['comex@albertoni.com.ar', 'nhermoso@almarrosario.com'],
      date: '2026-08-05T09:30:00Z',
      subject: 'Cotización Aprobada FCL Ningbo-Rosario / Albertoni S.A. - Carpeta C1289',
      bodyExcerpt:
        'Estimados, confirmamos la aceptación de la tarifa marítima FCL 1x40HQ Shanghai/Ningbo a Rosario vía Buenos Aires bajo cotización COT-2026-00105. Operador asignado: Natali Hermoso.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00105',
    },
    {
      id: 'm-c1289-02',
      from: 'donotreply@maersk.com',
      fromName: 'Maersk Customer Service',
      to: ['vmeggiolaro@almarrosario.com', 'srossi@almarrosario.com'],
      date: '2026-08-26T14:25:00Z',
      subject: 'Maersk Line - Invoice & Payment Advice BL 272860120 / Ref: C1289',
      bodyExcerpt:
        'Attached please find the freight invoice 7555554402 and official payment receipt for Bill of Lading 272860120 (Container MRKU8740584). Ocean Freight total amount: USD 57.00 local charges.',
      attachments: [
        {
          name: '7555554402.PDF',
          size: '13.4 KB',
          url: '/facturas/7555554402.PDF',
          tipo: 'Factura Maersk',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: true,
        montoExtraido: '57.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
  ],

  EA1561: [
    {
      id: 'm-ea1561-cot-01',
      from: 'comercioexterior@bertot.com.ar',
      fromName: 'Paula Baroldi (Bertot Metalmecánica)',
      to: ['astampfli@almarrosario.com', 'comercial@almar.com.ar'],
      date: '2026-05-28T11:20:00Z',
      subject: 'Solicitud Cotización Aérea Exportación Miami // 2 Cajones Maquinaria // EA1561',
      bodyExcerpt:
        'Abril: Solicitamos cotización para exportación aérea desde Rosario/Ezeiza a Miami International Airport (MIA). 2 cajones con repuestos agroindustriales, peso bruto 1.030 kg.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00428',
    },
    {
      id: 'm-ea1561-cot-02',
      from: 'astampfli@almarrosario.com',
      fromName: 'Abril Stampfli (Comercial ALMAR)',
      to: ['comercioexterior@bertot.com.ar'],
      date: '2026-06-01T15:42:57Z',
      subject: 'RE: LCL BERTOT MKE - USA // 2 CAJONES 1030 KG / Cotización COT-2026-00428',
      bodyExcerpt:
        'Paula, buenas tardes! Cotizamos la exportación aérea vía LATAM Cargo / Aerolíneas Cargo Ezeiza-Miami: Tarifa venta All-In pactada: USD 11.004,04. Costo estimado provisión: USD 9.200,00. Margen comercial: USD 1.804,04. Validez: 15 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00428',
      attachments: [
        {
          name: 'COT_2026_00428_Bertot_Aereo.pdf',
          size: '79.2 KB',
          url: '/facturas/COT_2026_00428_Bertot_Aereo.pdf',
          tipo: 'Cotización Aérea PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FIA',
        desvioDetectado: false,
        montoExtraido: '11004.04',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-ea1561-01',
      from: 'cargo@aerolineas.com.ar',
      fromName: 'Aerolíneas Argentinas Cargo Ezeiza',
      to: ['comercioexterior@bertot.com.ar', 'astampfli@almarrosario.com'],
      date: '2026-08-28T16:00:00Z',
      subject: 'Pre-Alerta Guía Aérea AWB 044-88992211 - Vuelo AR1302 EZE-MIA / Ref: EA1561',
      bodyExcerpt:
        'Confirmamos recepción y pesaje en terminal TCA Ezeiza de 2 cajones maquinaria pesada (1030 kg tasables). Vuelo programado AR1302 con salida 2026-09-02.',
    },
  ],

  C1471: [
    {
      id: 'm-c1471-cot-01',
      from: 'magimenez@secco.com.ar',
      fromName: 'Industrias Juan F. Secco Comex',
      to: ['llaje@almarrosario.com'],
      date: '2026-08-01T10:00:00Z',
      subject: 'Atlas - 200MH / OC 75000669 - Legajo # 202613589 // Solicitud Tarifa C1471',
      bodyExcerpt:
        'Lucía: Requerimos cotización de flete marítimo para generador eléctrico Hotstart desde Hamburgo (DEHAM) hasta Buenos Aires. Carga especial sobredimensionada.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00067',
    },
    {
      id: 'm-c1471-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['magimenez@secco.com.ar'],
      date: '2026-08-04T15:31:15Z',
      subject: 'RE: Atlas - 200MH / OC 75000669 // Cotización Oficial COT-2026-00067 // C1471',
      bodyExcerpt:
        'Dear Nicola, Mariana: Our agent AMA Freight will contact you in order to proceed with shipment. Flete venta acordado: EUR 10.848,55 con 21 días libres de demoras. Provisión estimada: EUR 8.850,00. Margen proyectado: EUR 1.998,55. Validez de tarifa: 20 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00067',
      attachments: [
        {
          name: 'COT_2026_00067_Secco_Hamburg.pdf',
          size: '95.6 KB',
          url: '/facturas/COT_2026_00067_Secco_Hamburg.pdf',
          tipo: 'Cotización Marítima EUR PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '10848.55',
        moneda: 'EUR',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1471-01',
      from: 'operations@amafreight.de',
      fromName: 'AMA Freight Agency GmbH (Hamburg Hub)',
      to: ['nhermoso@almarrosario.com', 'vmeggiolaro@almarrosario.com'],
      date: '2026-08-22T08:50:00Z',
      subject: 'Shipping Advice & Departure Notice - MBL HAM2608441 / Ref: C1471',
      bodyExcerpt:
        'Dear ALMAR Team: Container TCKU4499112 loaded on board vessel CMA CGM PUGET voyage 09W. ETD Hamburg 2026-08-20, ETA Buenos Aires 2026-09-25. Attached ocean bill of lading draft and commercial invoice 261005130R for EUR 10,848.55.',
      attachments: [
        {
          name: '261005130R.pdf',
          size: '22.4 KB',
          url: '/facturas/261005130R.pdf',
          tipo: 'Invoice Internacional EUR',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: true,
        montoExtraido: '10848.55',
        moneda: 'EUR',
        cuitValido: false,
      },
    },
  ],

  C1056: [
    {
      id: 'm-c1056-cot-01',
      from: 'export@saprograf.com.ar',
      fromName: 'Saprograf S.A.S. Exportaciones',
      to: ['llaje@almarrosario.com'],
      date: '2026-04-18T14:10:00Z',
      subject: 'Solicitud Tarifa Exportación 1x40HC Indigo 6K a Cartagena // C1056',
      bodyExcerpt:
        'Lucía: Por favor cotizar flete marítimo para exportación de equipo gráfico industrial Indigo 6K desde Buenos Aires hasta puerto de Cartagena, Colombia.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00457',
    },
    {
      id: 'm-c1056-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['export@saprograf.com.ar'],
      date: '2026-04-21T09:22:00Z',
      subject: 'Cotización Oficial COT-2026-00457 // Saprograf 1x40HC Buenos Aires-Cartagena',
      bodyExcerpt:
        'Buenos días: Dando continuidad a los requerimientos técnicos, cotizamos con Hapag-Lloyd / MSC: Flete venta acordado USD 2.800,00 All-In con 10 días libres de demoras. Provisión estimada: USD 2.240,00. Margen proyectado: USD 560,00. Validez: 30 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00457',
      attachments: [
        {
          name: 'COT_2026_00457_Saprograf_Cartagena.pdf',
          size: '83.0 KB',
          url: '/facturas/COT_2026_00457_Saprograf_Cartagena.pdf',
          tipo: 'Cotización Exportación PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '2800.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c1056-cot-03',
      from: 'export@saprograf.com.ar',
      fromName: 'Saprograf S.A.S.',
      to: ['llaje@almarrosario.com', 'vmoyano@almarrosario.com'],
      date: '2026-04-22T11:00:00Z',
      subject: 'Confirmación y Apertura Carpeta C1056 // COT-2026-00457',
      bodyExcerpt:
        'Confirmamos cotización COT-2026-00457. Victoria Moyano asume la coordinación del booking y despacho aduanero de exportación.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00457',
    },
  ],

  C367: [
    {
      id: 'm-c367-cot-01',
      from: 'cuellojr@metalurgicarosarina.com.ar',
      fromName: 'Juan Cuello (Metalúrgica Rosarina)',
      to: ['mfusco@almarrosario.com'],
      date: '2026-06-29T10:30:00Z',
      subject: 'LCL LBS INTELLIGENT - JUAN CUELLO - CAFETERAS - GUANGZHOU / Solicitud Tarifa C367',
      bodyExcerpt:
        'Martín: Tenemos lista la carga consolidada de cafeteras industriales en Guangzhou. Requerimos flete marítimo LCL consolidado hasta Rosario vía Buenos Aires.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00113',
    },
    {
      id: 'm-c367-cot-02',
      from: 'mfusco@almarrosario.com',
      fromName: 'Martín Fusco (Comercial ALMAR)',
      to: ['cuellojr@metalurgicarosarina.com.ar'],
      date: '2026-07-02T15:58:58Z',
      subject: 'RV: LCL LBS INTELLIGENT - JUAN CUELLO - CAFETERAS // Cotización COT-2026-00113',
      bodyExcerpt:
        'Hola Juan, Ceci: Adjunto cotización oficial COT-2026-00113 confirmada en Kipintoch. Flete marítimo LCL acordado: USD 680,00 All-In con co-loader MSL Líneas Marítimas. Costo base estimado: USD 500,00. Margen: USD 180,00. Nota: Incluye provisión fiscal para recargo BUFF al 21% IVA. Validez: 15 días.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00113',
      attachments: [
        {
          name: 'COT_2026_00113_Juan_Cuello_LCL.pdf',
          size: '74.5 KB',
          url: '/facturas/COT_2026_00113_Juan_Cuello_LCL.pdf',
          tipo: 'Cotización LCL PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FMA',
        desvioDetectado: false,
        montoExtraido: '680.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c367-cot-03',
      from: 'cuellojr@metalurgicarosarina.com.ar',
      fromName: 'Juan Cuello',
      to: ['mfusco@almarrosario.com', 'atalaban@almarrosario.com'],
      date: '2026-07-03T11:45:00Z',
      subject: 'Aprobación Cotización COT-2026-00113 // Carpeta C367 Juan Cuello',
      bodyExcerpt:
        'Martín: Aprobamos la tarifa de USD 680,00. Ana Laura Talaban puede avanzar con la coordinación del co-loader MSL y la emisión de BL.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00113',
    },
  ],

  C620: [
    {
      id: 'm-c620-cot-01',
      from: 'compras@rosario-conicet.gov.ar',
      fromName: 'Dra. Elena Rossi (CONICET Rosario / IBR)',
      to: ['llaje@almarrosario.com'],
      date: '2026-02-28T09:15:00Z',
      subject: 'URGENT AIR FREIGHT EXW UK TO ROS // CONICET C 266 16/10/25 // Solicitud C620',
      bodyExcerpt:
        'Lucía: Requerimos cotización aérea urgente para reactivos biológicos refrigerados desde Londres hasta Rosario. Facturación de flete pactada con agente británico en Libras Esterlinas (£543 GBP).',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00018',
    },
    {
      id: 'm-c620-cot-02',
      from: 'llaje@almarrosario.com',
      fromName: 'Lucía Laje (Comercial ALMAR)',
      to: ['compras@rosario-conicet.gov.ar'],
      date: '2026-03-02T16:38:05Z',
      subject: 'RV: URGENT AIR FREIGHT EXW UK TO ROS // CONICET C 266 // Cotización COT-2026-00018',
      bodyExcerpt:
        'Estimada Elena: Enviamos cotización oficial COT-2026-00018 para transporte aéreo urgente vía British Airways / SAA Logistics UK. Tarifa flete: £543 GBP (equivalente oficial BNA USD 740,00 al tipo vendedor 1.3628 a fecha de embarque). Costo provisión: USD 550,00. Margen comercial: USD 190,00. Blindaje cambiario con constancia BNA adjunta.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00018',
      attachments: [
        {
          name: 'COT_2026_00018_CONICET_GBP.pdf',
          size: '86.4 KB',
          url: '/facturas/COT_2026_00018_CONICET_GBP.pdf',
          tipo: 'Cotización Multimoneda GBP PDF',
        },
      ],
      aiClassification: {
        tipoGasto: 'FIA',
        desvioDetectado: false,
        montoExtraido: '740.00',
        moneda: 'USD',
        cuitValido: true,
      },
    },
    {
      id: 'm-c620-cot-03',
      from: 'compras@rosario-conicet.gov.ar',
      fromName: 'CONICET Rosario',
      to: ['llaje@almarrosario.com', 'nhermoso@almarrosario.com'],
      date: '2026-03-03T14:00:00Z',
      subject: 'Aprobación Orden de Embarque COT-2026-00018 // Expediente C620 CONICET',
      bodyExcerpt:
        'Lucía: Aprobamos los términos y la cotización multimoneda. Natali Hermoso asume la custodia del embarque refrigerado y el despacho aduanero en Ezeiza.',
      esEtapaComercial: true,
      codigoCotizacion: 'COT-2026-00018',
    },
  ],
};

export interface CarpetaMailTimelineProps {
  carpeta: CarpetaRecord;
  onOpenPdfModal?: (url: string, filename: string) => void;
}

export function CarpetaMailTimeline({
  carpeta,
}: CarpetaMailTimelineProps) {
  const code = carpeta.numero_carpeta.toUpperCase();
  const actors = CARPETA_ACTORS_MAP[code] || CARPETA_ACTORS_MAP['C1289'] || [];
  const mails = CARPETA_MAILS_MAP[code] || CARPETA_MAILS_MAP['C1289'] || [];

  return (
    <div className="space-y-6">
      {/* 1. Map of Active Actors Involved in this Folder */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0072BC]" />
            <h3 className="text-sm font-bold text-slate-900">
              Actores &amp; Intervinientes en el Expediente ({actors.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Trazabilidad Comercial y Operativa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actors.map((actor, idx) => {
            const isOperator = actor.tipo === 'OPERADOR';
            const isCarrier = actor.tipo === 'PROVEEDOR';
            const isFinance = actor.tipo === 'FINANZAS';
            const isComercial = actor.tipo === 'COMERCIAL';
            const isAdmin = actor.tipo === 'ADMIN';

            return (
              <div
                key={`${actor.email}-${idx}`}
                className={`p-3.5 rounded-lg border transition-all ${
                  isAdmin
                    ? 'bg-purple-50/70 border-purple-200 shadow-2xs'
                    : isComercial
                    ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                    : isOperator
                    ? 'bg-sky-50/60 border-sky-200'
                    : isCarrier
                    ? 'bg-slate-50 border-slate-200'
                    : isFinance
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-purple-700 text-white'
                          : isComercial
                          ? 'bg-amber-600 text-white'
                          : isOperator
                          ? 'bg-[#0072BC] text-white'
                          : isCarrier
                          ? 'bg-slate-700 text-white'
                          : isFinance
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {actor.rol}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {actor.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {actor.entidad}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate" title={actor.email}>
                      {actor.email}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Timeline of Gmail Email Chains & AI Extracted Proofs */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#0072BC]" />
            <h3 className="text-sm font-bold text-slate-900">
              Historial de Correos Electrónicos &amp; Documentos Recibidos ({mails.length})
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Escucha 24/7 Google Workspace</span>
          </div>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {mails.map((mail) => (
            <div key={mail.id} className="relative group">
              {/* Timeline marker bullet */}
              <div
                className={`absolute -left-6 top-2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                  mail.esEtapaComercial ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-[#0072BC]'
                }`}
              />

              <div
                className={`rounded-lg border p-4 transition-all space-y-3 ${
                  mail.esEtapaComercial
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/20 hover:border-amber-300'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {/* Email Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {mail.fromName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {`<${mail.from}>`}
                      </span>
                      {mail.esEtapaComercial && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300">
                          <BadgePercent className="h-3 w-3 text-amber-700" />
                          <span>Etapa Comercial {mail.codigoCotizacion ? `[${mail.codigoCotizacion}]` : ''}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span>Para: </span>
                      <span className="font-mono text-slate-700">
                        {mail.to.join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                    {formatDateTime(mail.date)}
                  </span>
                </div>

                {/* Email Subject & Excerpt */}
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${mail.esEtapaComercial ? 'text-amber-900' : 'text-[#0072BC]'}`}>
                    {mail.subject}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-md border border-slate-200">
                    {mail.bodyExcerpt}
                  </p>
                </div>

                {/* AI Detection Summary Pill */}
                {mail.aiClassification && (
                  <div className="p-2.5 rounded-md bg-sky-50/70 border border-sky-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0072BC] flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Extracción IA:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {mail.aiClassification.moneda} {mail.aiClassification.montoExtraido}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white text-[#0072BC] border border-sky-200 font-mono">
                        Gasto [{mail.aiClassification.tipoGasto}]
                      </span>
                    </div>

                    {mail.aiClassification.desvioDetectado ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Desvío de Tarifa Flagged</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Dentro del Presupuesto</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Attached Real PDFs */}
                {mail.attachments && mail.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                      <span>Comprobantes Adjuntos ({mail.attachments.length}):</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mail.attachments.map((att, attIdx) => (
                        <div
                          key={`${att.name}-${attIdx}`}
                          className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 hover:border-sky-300 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <FileText className="h-4 w-4 text-[#0072BC] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate font-mono" title={att.name}>
                                {att.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {att.tipo} • {att.size}
                              </p>
                            </div>
                          </div>

                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-[#0072BC] rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer border border-sky-200"
                            title="Ver archivo PDF original"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Ver PDF</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
