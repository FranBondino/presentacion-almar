/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * In-Memory + Persistent Feedback, UAT Suggestions & Directorate Daily Approval Store
 *
 * Governance Circuit:
 * 1. Team members submit suggestions / UAT adjustments via FeedbackWidget.
 * 2. Each proposal is routed to the corresponding Directorate member's profile by area:
 *    - Juan Andrés Arloro (jarloro@almarrosario.com) -> Operaciones (Impo, Expo, Aéreo/Terrestre) & Sistemas
 *    - Alejandro Noacco (anoacco@almarrosario.com)   -> Comercial, Pricing & Multicotizador
 *    - Vanesa Meggiolaro (vmeggiolaro@almarrosario.com) -> Administración, Facturación & Finanzas
 * 3. Once a day, the Directorate reviews, modifies if needed, approves or rejects each item,
 *    and confirms the daily batch of approved improvements to Francisco (Fran).
 */

import fs from 'fs';
import path from 'path';

export interface FeedbackScreenshotRecord {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export type DirectorioArea =
  | 'OPERACIONES_SISTEMAS'
  | 'COMERCIAL_PRICING'
  | 'ADMINISTRACION_FINANZAS';

export type EstadoAprobacionDirectorio =
  | 'PENDIENTE_DIRECTORIO'
  | 'APROBADA_PARA_FRAN'
  | 'MODIFICADA_Y_APROBADA'
  | 'RECHAZADA_DESCARTADA'
  | 'IMPLEMENTADA';

export interface FeedbackTicketRecord {
  id: string;
  ticket_code: string;
  tipo: string;
  severidad: string;
  mensaje: string;
  pantalla: string;
  carpeta_id: string | null;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  contexto_adicional: Record<string, unknown>;
  screenshots?: FeedbackScreenshotRecord[];
  created_at: string;
  estado: 'ABIERTO' | 'EN_REVISION' | 'RESUELTO';
  // Directorate Governance Fields (Juan, Ale, Vane -> Daily Batch for Fran)
  area_directorio?: DirectorioArea;
  director_asignado_email?: string;
  director_asignado_nombre?: string;
  estado_aprobacion?: EstadoAprobacionDirectorio;
  mensaje_modificado_directorio?: string | null;
  nota_directorio_para_fran?: string | null;
  resuelto_por_nombre?: string | null;
  resuelto_por_email?: string | null;
  fecha_resolucion_directorio?: string | null;
  lote_diario_fecha?: string | null;
}

export function resolveDirectorateRouting(params: {
  pantalla?: string;
  usuario_rol?: string;
  usuario_email?: string;
  area_directorio?: DirectorioArea;
}): {
  area_directorio: DirectorioArea;
  director_asignado_email: string;
  director_asignado_nombre: string;
} {
  if (params.area_directorio === 'COMERCIAL_PRICING') {
    return {
      area_directorio: 'COMERCIAL_PRICING',
      director_asignado_email: 'anoacco@almarrosario.com',
      director_asignado_nombre: 'Alejandro Noacco',
    };
  }
  if (params.area_directorio === 'ADMINISTRACION_FINANZAS') {
    return {
      area_directorio: 'ADMINISTRACION_FINANZAS',
      director_asignado_email: 'vmeggiolaro@almarrosario.com',
      director_asignado_nombre: 'Vanesa Meggiolaro',
    };
  }
  if (params.area_directorio === 'OPERACIONES_SISTEMAS') {
    return {
      area_directorio: 'OPERACIONES_SISTEMAS',
      director_asignado_email: 'jarloro@almarrosario.com',
      director_asignado_nombre: 'Juan Andrés Arloro',
    };
  }

  const pantalla = (params.pantalla || '').toLowerCase();
  const rol = (params.usuario_rol || '').toUpperCase();
  const email = (params.usuario_email || '').toLowerCase();

  if (
    pantalla.includes('cotizaciones') ||
    pantalla.includes('multicotizador') ||
    rol === 'COMERCIAL' ||
    email.includes('llaje') ||
    email.includes('mfusco') ||
    email.includes('nguida')
  ) {
    return {
      area_directorio: 'COMERCIAL_PRICING',
      director_asignado_email: 'anoacco@almarrosario.com',
      director_asignado_nombre: 'Alejandro Noacco',
    };
  }

  if (
    pantalla.includes('gastos') ||
    pantalla.includes('rentabilidad') ||
    rol === 'FINANZAS' ||
    rol === 'ADMINISTRACION' ||
    email.includes('srossi') ||
    email.includes('dsilvi') ||
    email.includes('vmeggiolaro')
  ) {
    return {
      area_directorio: 'ADMINISTRACION_FINANZAS',
      director_asignado_email: 'vmeggiolaro@almarrosario.com',
      director_asignado_nombre: 'Vanesa Meggiolaro',
    };
  }

  return {
    area_directorio: 'OPERACIONES_SISTEMAS',
    director_asignado_email: 'jarloro@almarrosario.com',
    director_asignado_nombre: 'Juan Andrés Arloro',
  };
}

export const IN_MEMORY_FEEDBACK_STORE: FeedbackTicketRecord[] = [
  {
    id: 'fb-seed-impo-01',
    ticket_code: 'TKT-SUG-904',
    tipo: 'SUGERENCIA',
    severidad: 'ALTA',
    mensaje:
      'En el Dashboard principal necesitamos ver los mails urgentes sin respuesta separados de los que ya fueron leídos pero pueden esperar, y que tome la banderita roja de Gmail.',
    pantalla: '/',
    carpeta_id: 'C1868',
    usuario_nombre: 'Natali Hermoso',
    usuario_email: 'nhermoso@almarrosario.com',
    usuario_rol: 'LEAD_OPERACIONES',
    contexto_adicional: { modulo: 'Dashboard & Casillas Gmail', sector: 'Importación' },
    screenshots: [],
    created_at: '2026-11-05T09:10:00Z',
    estado: 'EN_REVISION',
    area_directorio: 'OPERACIONES_SISTEMAS',
    director_asignado_email: 'jarloro@almarrosario.com',
    director_asignado_nombre: 'Juan Andrés Arloro',
    estado_aprobacion: 'MODIFICADA_Y_APROBADA',
    mensaje_modificado_directorio:
      'Mostrar en el Dashboard los mails del equipo diferenciando Urgentes sin respuesta vs. Abiertos que pueden esperar + filtro por Banderita Roja (STARRED) y No Leído (UNREAD). Habilitar vista de Importación para Natali y vista de Todo el Equipo para Victoria y Directorio.',
    nota_directorio_para_fran:
      'Aprobado en reunión diaria. Verificar también que sincronice las cuentas que usan Outlook sobre el servidor de Gmail (como Lucía).',
    resuelto_por_nombre: 'Juan Andrés Arloro',
    resuelto_por_email: 'jarloro@almarrosario.com',
    fecha_resolucion_directorio: '2026-11-05T10:00:00Z',
    lote_diario_fecha: '2026-11-05',
  },
  {
    id: 'fb-seed-ops-02',
    ticket_code: 'TKT-SUG-882',
    tipo: 'SUGERENCIA',
    severidad: 'ALTA',
    mensaje:
      'En las carpetas de Importación (ej. C1862 y C1868), gustaría poder tildar un aviso automático cuando la naviera emite el Libre Deuda para que avise directamente a Administración que ya se puede facturar el recupero de gastos locales.',
    pantalla: '/carpetas/C1868',
    carpeta_id: 'C1868',
    usuario_nombre: 'Aldana Gómez',
    usuario_email: 'agomez@almarrosario.com',
    usuario_rol: 'OPERATIVO',
    contexto_adicional: { modulo: 'Carpetas Operativas Impo', hito: 'Libre Deuda PO.02' },
    screenshots: [],
    created_at: '2026-11-05T09:35:00Z',
    estado: 'ABIERTO',
    area_directorio: 'OPERACIONES_SISTEMAS',
    director_asignado_email: 'jarloro@almarrosario.com',
    director_asignado_nombre: 'Juan Andrés Arloro',
    estado_aprobacion: 'PENDIENTE_DIRECTORIO',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran: null,
    resuelto_por_nombre: null,
    resuelto_por_email: null,
    fecha_resolucion_directorio: null,
    lote_diario_fecha: null,
  },
  {
    id: 'fb-seed-expo-03',
    ticket_code: 'TKT-EDG-875',
    tipo: 'EDGE_CASE',
    severidad: 'MEDIA',
    mensaje:
      'Para las carpetas de Exportación Aérea (EA1853) y Terrestre (ET1792), sumar en la alerta de Cut-Off Documental el horario límite de ingreso a bodega TCA / frontera para que quede visible en el resumen.',
    pantalla: '/carpetas/EA1853',
    carpeta_id: 'EA1853',
    usuario_nombre: 'Victoria Moyano',
    usuario_email: 'vmoyano@almarrosario.com',
    usuario_rol: 'OPERATIVO',
    contexto_adicional: { modulo: 'Coordinación & Exportación', procedimiento: 'PO.03' },
    screenshots: [],
    created_at: '2026-11-05T08:50:00Z',
    estado: 'ABIERTO',
    area_directorio: 'OPERACIONES_SISTEMAS',
    director_asignado_email: 'jarloro@almarrosario.com',
    director_asignado_nombre: 'Juan Andrés Arloro',
    estado_aprobacion: 'PENDIENTE_DIRECTORIO',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran: null,
    resuelto_por_nombre: null,
    resuelto_por_email: null,
    fecha_resolucion_directorio: null,
    lote_diario_fecha: null,
  },
  {
    id: 'fb-seed-com-01',
    ticket_code: 'TKT-PRC-861',
    tipo: 'SUGERENCIA',
    severidad: 'ALTA',
    mensaje:
      'Cuando enviamos seguimiento de cotización vencida (>48 hs) desde Comercial, sería ideal que el texto pre-armado incluya el desglose separado entre Flete Internacional (Exento) y Gastos Locales en destino (+IVA) para que el cliente lo compare más rápido.',
    pantalla: '/cotizaciones',
    carpeta_id: 'C1805',
    usuario_nombre: 'Lucía Laje',
    usuario_email: 'llaje@almarrosario.com',
    usuario_rol: 'COMERCIAL',
    contexto_adicional: { modulo: 'Cotizaciones & Preventa', procedimiento: 'PO.01' },
    screenshots: [],
    created_at: '2026-11-05T09:20:00Z',
    estado: 'ABIERTO',
    area_directorio: 'COMERCIAL_PRICING',
    director_asignado_email: 'anoacco@almarrosario.com',
    director_asignado_nombre: 'Alejandro Noacco',
    estado_aprobacion: 'PENDIENTE_DIRECTORIO',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran: null,
    resuelto_por_nombre: null,
    resuelto_por_email: null,
    fecha_resolucion_directorio: null,
    lote_diario_fecha: null,
  },
  {
    id: 'fb-seed-com-02',
    ticket_code: 'TKT-PRC-849',
    tipo: 'CORRECCION_DATO',
    severidad: 'MEDIA',
    mensaje:
      'En el Multicotizador FCL ruta Ningbo / Shanghai -> Buenos Aires, pre-cargar por defecto 14 días libres de demora (Free Time) cuando la naviera seleccionada es MSC o Hapag-Lloyd.',
    pantalla: '/cotizaciones/multicotizador',
    carpeta_id: null,
    usuario_nombre: 'Martín Fusco',
    usuario_email: 'mfusco@almarrosario.com',
    usuario_rol: 'COMERCIAL',
    contexto_adicional: { modulo: 'Multicotizador Navieras', ruta: 'Far East -> BUE' },
    screenshots: [],
    created_at: '2026-11-04T17:40:00Z',
    estado: 'EN_REVISION',
    area_directorio: 'COMERCIAL_PRICING',
    director_asignado_email: 'anoacco@almarrosario.com',
    director_asignado_nombre: 'Alejandro Noacco',
    estado_aprobacion: 'APROBADA_PARA_FRAN',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran:
      'Aprobado por Ale Noacco: parametrizar 14 días de Free Time estándar en contratos Far East.',
    resuelto_por_nombre: 'Alejandro Noacco',
    resuelto_por_email: 'anoacco@almarrosario.com',
    fecha_resolucion_directorio: '2026-11-05T08:30:00Z',
    lote_diario_fecha: '2026-11-05',
  },
  {
    id: 'fb-seed-adm-01',
    ticket_code: 'TKT-ADM-890',
    tipo: 'SUGERENCIA',
    severidad: 'ALTA',
    mensaje:
      'Separar en la pantalla de Comprobantes el control operativo de sobrecostos de proveedores (que lo hace Operaciones) de nuestra bandeja de Administración, donde necesitamos emitir la Factura de Venta con toda la trazabilidad y controlar las cobranzas en Banco Macro.',
    pantalla: '/comprobantes',
    carpeta_id: 'C1868',
    usuario_nombre: 'Stefanía Rossi',
    usuario_email: 'srossi@almarrosario.com',
    usuario_rol: 'FINANZAS',
    contexto_adicional: { modulo: 'Facturación & Cobranzas', procedimiento: 'PO.03' },
    screenshots: [],
    created_at: '2026-11-05T08:15:00Z',
    estado: 'EN_REVISION',
    area_directorio: 'ADMINISTRACION_FINANZAS',
    director_asignado_email: 'vmeggiolaro@almarrosario.com',
    director_asignado_nombre: 'Vanesa Meggiolaro',
    estado_aprobacion: 'APROBADA_PARA_FRAN',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran:
      'Aprobado por Vanesa: Operaciones conforma los sobrecostos en el Kanban y Administración opera en la bandeja de Facturación de Venta y Cobranzas.',
    resuelto_por_nombre: 'Vanesa Meggiolaro',
    resuelto_por_email: 'vmeggiolaro@almarrosario.com',
    fecha_resolucion_directorio: '2026-11-05T09:05:00Z',
    lote_diario_fecha: '2026-11-05',
  },
  {
    id: 'fb-seed-adm-02',
    ticket_code: 'TKT-ADM-871',
    tipo: 'SUGERENCIA',
    severidad: 'MEDIA',
    mensaje:
      'Al conciliar cobranzas en pesos contra la cuenta CC ARS 376100000930617 de Banco Macro, agregar un campo para anotar el número de retención de IIBB / Ganancias sufrida en el pago para copiarlo directo al recibo de Kipintoch.',
    pantalla: '/comprobantes',
    carpeta_id: 'C1470',
    usuario_nombre: 'Dalia Silvi',
    usuario_email: 'dsilvi@almarrosario.com',
    usuario_rol: 'FINANZAS',
    contexto_adicional: { modulo: 'Cobranzas Banco Macro', cuenta: 'CC ARS 376100000930617' },
    screenshots: [],
    created_at: '2026-11-05T09:50:00Z',
    estado: 'ABIERTO',
    area_directorio: 'ADMINISTRACION_FINANZAS',
    director_asignado_email: 'vmeggiolaro@almarrosario.com',
    director_asignado_nombre: 'Vanesa Meggiolaro',
    estado_aprobacion: 'PENDIENTE_DIRECTORIO',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran: null,
    resuelto_por_nombre: null,
    resuelto_por_email: null,
    fecha_resolucion_directorio: null,
    lote_diario_fecha: null,
  },
];

function resolveFeedbackStorePath(): string {
  const candidates = [
    path.join(process.cwd(), 'data', 'uat_feedback_store.json'),
    path.join(process.cwd(), 'portal', 'data', 'uat_feedback_store.json'),
    '/tmp/uat_feedback_store.json',
  ];
  for (const p of candidates) {
    try {
      const dir = path.dirname(p);
      if (fs.existsSync(dir)) return p;
    } catch {
      // ignore
    }
  }
  return '/tmp/uat_feedback_store.json';
}

export function normalizeTicketDirectorateFields(item: FeedbackTicketRecord): FeedbackTicketRecord {
  const routing = resolveDirectorateRouting({
    pantalla: item.pantalla,
    usuario_rol: item.usuario_rol,
    usuario_email: item.usuario_email,
    area_directorio: item.area_directorio,
  });
  return {
    ...item,
    area_directorio: item.area_directorio || routing.area_directorio,
    director_asignado_email: item.director_asignado_email || routing.director_asignado_email,
    director_asignado_nombre: item.director_asignado_nombre || routing.director_asignado_nombre,
    estado_aprobacion: item.estado_aprobacion || 'PENDIENTE_DIRECTORIO',
    mensaje_modificado_directorio: item.mensaje_modificado_directorio ?? null,
    nota_directorio_para_fran: item.nota_directorio_para_fran ?? null,
    resuelto_por_nombre: item.resuelto_por_nombre ?? null,
    resuelto_por_email: item.resuelto_por_email ?? null,
    fecha_resolucion_directorio: item.fecha_resolucion_directorio ?? null,
    lote_diario_fecha: item.lote_diario_fecha ?? null,
  };
}

export function loadPersistedFeedbackStore(): FeedbackTicketRecord[] {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return IN_MEMORY_FEEDBACK_STORE.map(normalizeTicketDirectorateFields);
  }
  try {
    const storePath = resolveFeedbackStorePath();
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf-8');
      const parsed = JSON.parse(raw) as FeedbackTicketRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const byId = new Map<string, FeedbackTicketRecord>();
        for (const item of parsed) {
          if (item && item.id) {
            byId.set(item.id, normalizeTicketDirectorateFields(item));
          }
        }
        for (const seed of IN_MEMORY_FEEDBACK_STORE) {
          if (!byId.has(seed.id)) {
            byId.set(seed.id, normalizeTicketDirectorateFields(seed));
          }
        }
        IN_MEMORY_FEEDBACK_STORE.length = 0;
        IN_MEMORY_FEEDBACK_STORE.push(...Array.from(byId.values()));
      }
    }
  } catch {
    // ignore read error
  }
  for (let i = 0; i < IN_MEMORY_FEEDBACK_STORE.length; i++) {
    IN_MEMORY_FEEDBACK_STORE[i] = normalizeTicketDirectorateFields(IN_MEMORY_FEEDBACK_STORE[i]!);
  }
  return IN_MEMORY_FEEDBACK_STORE;
}

export function savePersistedFeedbackStore(records: FeedbackTicketRecord[]): void {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    const storePath = resolveFeedbackStorePath();
    fs.writeFileSync(storePath, JSON.stringify(records.slice(0, 100), null, 2), 'utf-8');
  } catch {
    try {
      fs.writeFileSync('/tmp/uat_feedback_store.json', JSON.stringify(records.slice(0, 100), null, 2), 'utf-8');
    } catch {
      // ignore write error in read-only test envs
    }
  }
}
