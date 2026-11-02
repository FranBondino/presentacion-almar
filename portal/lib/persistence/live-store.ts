/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Hybrid Persistent Production Store (Supabase PostgreSQL + Durable Local Disk Store)
 *
 * Responsibilities (Phase 1 & Phase 2):
 * 1. Persists `mailbox_sync_state` cursors (historyId, last_synced_at, counters, status) across restarts.
 * 2. Resolves shipment folder codes (e.g. "C1234", "C1465", "C1673", "C1688") to valid RFC-4122 UUIDs,
 *    auto-provisioning missing folders and enriching them with BL, Container, Booking, and Consignee.
 * 3. Separates accounting vouchers (`comprobantes`) from operational shipping documents (`documentos`).
 * 4. Enforces dual cryptographic idempotency by `messageId_attachmentId` and PDF `sha256_hash`.
 * 5. Synchronizes transparently with Supabase PostgreSQL when NEXT_PUBLIC_SUPABASE_URL is configured,
 *    while maintaining a durable disk mirror (`portal/data/live_production_store.json`).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createAdminClient } from '../supabase/server';
import type { TipoCarga } from '../supabase/database.types';
import type {
  CarpetaRecord,
  MailMessage,
  ComprobanteRecord,
  DocumentoRecord,
  AlertaRecord,
  EventoRecord,
  AuditLogRecord,
} from '../mockData';
import type { CotizacionRecord, ViaTransporte } from '@/types/cotizaciones';
import {
  reconcileStoreWithKipintochMaster,
  getKipintochCarpetaByCodeOrNum,
  resolveClientCuit,
  normalizeStaffDisplayName,
} from '../kipintoch-reconciler';

export interface MailboxSyncStateRecord {
  email: string;
  nombre_responsable: string;
  rol_operativo: string;
  history_id: string | null;
  last_synced_at: string | null;
  last_message_date: string | null;
  messages_processed_total: number;
  invoices_ingested_total: number;
  // --- R1 Email Response SLA Tracking Counters ---
  emails_recibidos_total: number;
  emails_respondidos_total: number;
  emails_pendientes_respuesta: number;
  tiempo_respuesta_promedio_min: number;
  // ------------------------------------------------
  status: 'ACTIVE' | 'SYNCING' | 'ERROR' | 'WATCH_EXPIRED';
  last_error: string | null;
  watch_expiration: string | null;
  consecutive_failures: number;
  updated_at: string;
}

export type EmailInteractionDirection = 'INBOUND' | 'OUTBOUND_REPLY';

export interface EmailInteractionRecord {
  id: string; // gmail_message_id
  threadId: string;
  mailbox: string; // Target @almarrosario.com mailbox
  operadorNombre: string; // e.g. "Lucía Laje", "Aldana Gómez", "Abril Stampfli"
  direction: EmailInteractionDirection;
  from: string; // Raw sender header
  to: string | string[]; // Target recipient(s)
  subject: string;
  date: string; // ISO 8601 timestamp
  carpetaCodigo?: string | null; // e.g. "C1771", "C1688", null if unlinked
  isReplied: boolean; // true if answered by ALMAR operator
  isAutomatedNotification?: boolean; // true if automated notification (no-reply, alerts, bots)
  repliedBy?: string | null; // Operator email or full name who answered
  repliedAt?: string | null; // ISO 8601 timestamp of outbound reply
  responseTimeMinutes?: number | null; // Elapsed time in minutes: (repliedAt - inboundDate) / 60000
  snippet?: string;
  bodyExcerpt?: string;
  labels?: string[];
  rfcMessageId?: string;
  inReplyTo?: string;
}

export type EmailInteraction = EmailInteractionRecord;

export type PersistenceMode = 'local-fs' | 'tmp-fallback' | 'supabase';
let currentPersistenceMode: PersistenceMode = 'local-fs';

export function getPersistenceMode(): PersistenceMode {
  if (isSupabaseRemoteConfigured()) {
    return 'supabase';
  }
  return currentPersistenceMode;
}

export function setPersistenceModeForTesting(mode: PersistenceMode): void {
  currentPersistenceMode = mode;
}

export interface CostoEstimadoItem {
  id: string;
  comprobante_estimado: string; // e.g. "FCE 0001-00006051"
  tipo_comprobante: string;     // "FCE", "FCA", "FCC"
  numero_estimado: string;       // "0001-00006051"
  proveedor_nombre: string;     // "EVERSAIL LOGISTICS INC."
  concepto?: string;            // "Flete Internacional"
  fecha_evento: string;         // ISO string or YYYY-MM-DD
  fecha_cumplido?: string;
  moneda: 'USD' | 'ARS' | 'EUR' | 'GBP';
  monto: number;
  monto_usd: number;
  emisor_operador?: string;     // "Lucia Laje"
  gmail_message_id?: string;
  // Reconciliation against actual invoice
  estado_conciliacion: 'PENDIENTE_FACTURA' | 'CONCILIADO_EXACTO' | 'CONCILIADO_CON_DESVIO';
  comprobante_real_id?: string | null; // ID of matching ComprobanteRecord in store.comprobantes
  monto_real_facturado_usd?: number;
  desvio_usd?: number;
}

export interface TrackingEventRecord {
  id: string;
  carpeta_codigo: string;
  carpeta_id?: string | null;
  tipo_evento: string; // "TRACKING_UPDATE" | "ETA_UPDATE" | "TRANSSHIPMENT"
  buque: string | null;
  carrier: string | null;
  pol: string | null;
  pod: string | null;
  etd: string | null;
  eta: string | null;
  containers: string[];
  mbl: string | null;
  hbl: string | null;
  raw_subject: string;
  fecha_evento: string;
  gmail_message_id: string;
}

export interface LiveStoreData {
  version: number;
  updatedAt: string;
  mailboxSyncState: Record<string, MailboxSyncStateRecord>;
  carpetas: CarpetaRecord[];
  comprobantes: ComprobanteRecord[];
  documentos: DocumentoRecord[];
  alertas: AlertaRecord[];
  eventos: EventoRecord[];
  eventos_tracking: TrackingEventRecord[];
  cotizaciones: CotizacionRecord[];
  auditLogs: AuditLogRecord[];
  processedAttachmentKeys: Record<string, string>; // "${messageId}_${attachmentId}" -> recordId
  processedSha256Hashes: Record<string, string>; // sha256 -> recordId
  interacciones_email: EmailInteractionRecord[];
}

export const AUTHORIZED_ALMAR_MAILBOXES: Array<{
  email: string;
  name: string;
  role: string;
}> = [
  { email: 'astampfli@almarrosario.com', name: 'Abril Stampfli', role: 'Operaciones Expo' },
  { email: 'srossi@almarrosario.com', name: 'Stefania Rossi', role: 'Facturación / Adm.' },
  { email: 'vmeggiolaro@almarrosario.com', name: 'Vanesa Meggiolaro', role: 'Finanzas / Pagos' },
  { email: 'dsilvi@almarrosario.com', name: 'Dalia Silvi', role: 'Tesorería / Pagos' },
  { email: 'jarloro@almarrosario.com', name: 'Juan Andrés Arloro', role: 'Directorio / Socio Gerente' },
  { email: 'llaje@almarrosario.com', name: 'Lucía Laje', role: 'Ejecutiva Comercial' },
  { email: 'atalaban@almarrosario.com', name: 'Ana Laura Talaban', role: 'Operaciones Impo' },
  { email: 'nhermoso@almarrosario.com', name: 'Natali Hermoso', role: 'Supervisión Operaciones' },
  { email: 'anoacco@almarrosario.com', name: 'Alejandro Noacco', role: 'Directorio / Socio Gerente' },
  { email: 'abucardo@almarrosario.com', name: 'Agustina Bucardo', role: 'Casilla Inactiva (Histórico)' },
  { email: 'agomez@almarrosario.com', name: 'Aldana Gómez', role: 'Operaciones Impo' },
  { email: 'cdellamea@almarrosario.com', name: 'Cecilia Dellamea', role: 'Operaciones COMEX' },
  { email: 'mfusco@almarrosario.com', name: 'Martín Fusco', role: 'Comercial Senior' },
  { email: 'nguida@almarrosario.com', name: 'Nerea Guida', role: 'Ejecutiva Comercial & Pricing' },
  { email: 'vmoyano@almarrosario.com', name: 'Victoria Moyano', role: 'Operaciones & Customer' },
  { email: 'zabraham@almarrosario.com', name: 'Zamira Abraham', role: 'Casilla Inactiva (Histórico)' },
  { email: 'csexp@almarrosario.com', name: 'Customer Service Expo', role: 'Casilla Funcional Expo' },
  { email: 'tracking@almarrosario.com', name: 'Tracking Cargas', role: 'Casilla Funcional Tracking' },
];

export const COMMERCIAL_ALMAR_MAILBOXES = [
  'llaje@almarrosario.com',
  'nguida@almarrosario.com',
  'mfusco@almarrosario.com',
  'jarloro@almarrosario.com',
  'vmoyano@almarrosario.com',
  'astampfli@almarrosario.com',
  'zabraham@almarrosario.com',
  'anoacco@almarrosario.com',
  'csexp@almarrosario.com',
] as const;

export type CommercialMailboxEmail = (typeof COMMERCIAL_ALMAR_MAILBOXES)[number];

export function isCommercialMailbox(email: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (COMMERCIAL_ALMAR_MAILBOXES as readonly string[]).includes(clean);
}

export {
  FUNCTIONAL_ALMAR_MAILBOXES,
  DIRECTORIO_ALMAR_MAILBOXES,
  INACTIVE_ALMAR_MAILBOXES,
  isFunctionalMailbox,
  isDirectorioMailbox,
  isInactiveMailbox,
  isExcludedFromProductivityRanking,
} from '../mailboxes';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks whether a real remote Supabase instance is configured in environment variables.
 */
export function isSupabaseRemoteConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes('placeholder-almar.supabase.co')) return false;
  if (key.includes('placeholder-')) return false;
  return true;
}

/**
 * Generates a deterministic RFC-4122 UUID v5-compatible string from a business folder code (e.g. "C1465").
 */
export function carpetaCodeToUuid(folderCode: string): string {
  const normalized = folderCode.trim().toUpperCase();
  if (UUID_REGEX.test(normalized)) {
    return normalized.toLowerCase();
  }
  const hash = crypto.createHash('sha256').update(`almar-carpeta:${normalized}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

function resolveBundledDataDir(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'data'))) {
    return path.join(cwd, 'data');
  }
  if (fs.existsSync(path.join(cwd, 'portal', 'data'))) {
    return path.join(cwd, 'portal', 'data');
  }
  return path.basename(cwd) === 'portal'
    ? path.join(cwd, 'data')
    : path.join(cwd, 'data');
}

function getStoreFilePath(): string {
  if (process.env.ALMAR_STORE_PATH) {
    return process.env.ALMAR_STORE_PATH;
  }
  const dataDir = resolveBundledDataDir();
  const defaultFileName =
    process.env.VITEST || process.env.NODE_ENV === 'test'
      ? 'test_live_store.json'
      : 'live_production_store.json';
  return path.join(dataDir, defaultFileName);
}

/**
 * Seeds a newly mounted persistent volume (e.g. Railway /data/live_production_store.json)
 * on first boot from the bundled baseline live_production_store.json if the target path
 * does not exist yet. Never overwrites an existing store on subsequent deploys.
 */
export function ensurePersistentVolumeSeeded(
  targetPath: string,
  options?: { forceInTest?: boolean }
): boolean {
  const isTestEnv = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
  if (isTestEnv && !options?.forceInTest) {
    return false;
  }
  if (!targetPath || fs.existsSync(targetPath)) {
    return false;
  }
  const bundledPath = path.join(resolveBundledDataDir(), 'live_production_store.json');
  if (!fs.existsSync(bundledPath) || path.resolve(bundledPath) === path.resolve(targetPath)) {
    return false;
  }
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const seedTmp = `${targetPath}.${process.pid}.${Date.now()}.seed.tmp`;
    fs.copyFileSync(bundledPath, seedTmp);
    fs.renameSync(seedTmp, targetPath);
    console.info(`[LiveStore] Seeded persistent volume store at ${targetPath} from bundled baseline.`);
    return true;
  } catch (err) {
    console.warn(`[LiveStore] Could not seed persistent volume at ${targetPath}:`, err);
    return false;
  }
}

let memoryStoreCache: LiveStoreData | null = null;
let memoryStoreMtimeMs = 0;
let memoryStorePath = '';
let supabaseHydrated = false;

export function isSupabaseHydrated(): boolean {
  return supabaseHydrated;
}

export function resetLiveStoreCache(): void {
  memoryStoreCache = null;
  memoryStoreMtimeMs = 0;
  memoryStorePath = '';
  supabaseHydrated = false;
}

function createInitialStoreData(): LiveStoreData {
  const now = new Date().toISOString();
  const mailboxSyncState: Record<string, MailboxSyncStateRecord> = {};

  for (const mb of AUTHORIZED_ALMAR_MAILBOXES) {
    mailboxSyncState[mb.email] = {
      email: mb.email,
      nombre_responsable: mb.name,
      rol_operativo: mb.role,
      history_id: null,
      last_synced_at: null,
      last_message_date: null,
      messages_processed_total: 0,
      invoices_ingested_total: 0,
      emails_recibidos_total: 0,
      emails_respondidos_total: 0,
      emails_pendientes_respuesta: 0,
      tiempo_respuesta_promedio_min: 0,
      status: 'ACTIVE',
      last_error: null,
      watch_expiration: null,
      consecutive_failures: 0,
      updated_at: now,
    };
  }

  const initialStore: LiveStoreData = {
    version: 3,
    updatedAt: now,
    mailboxSyncState,
    carpetas: [],
    comprobantes: [],
    documentos: [],
    alertas: [],
    eventos: [],
    eventos_tracking: [],
    cotizaciones: [],
    auditLogs: [],
    processedAttachmentKeys: {},
    processedSha256Hashes: {},
    interacciones_email: [],
  };

  return initialStore;
}

export const KNOWN_CLIENTS_LIVE = [
  { name: 'CASTLE S.A.', match: /\bcastle\b/i, cuit: '30-70845123-4' },
  { name: 'BIMETAL S.A.', match: /\bbimetal\b/i, cuit: '30-65412890-2' },
  { name: 'MAXIMAL S.A.', match: /\bmaximal\b/i, cuit: '30-71029384-5' },
  { name: 'LS MODULARES S.A.', match: /\bls\s*modulares\b/i, cuit: '30-71458963-2' },
  { name: 'NET TRADE S.A.', match: /\bnet\s*trade\b/i, cuit: '30-71239845-1' },
  { name: 'CALAMANTE HORACIO R Y CALAMANTE NORBERTO G SH', match: /\b(?:calamante|dis-?den)\b/i, cuit: '30-59841236-9' },
  { name: 'TECNOGRAN S.R.L.', match: /\btecnogran\b/i, cuit: '30-68941205-8' },
  { name: 'MEGMART IMPORTS S.R.L.', match: /\bmegmart\b/i, cuit: '30-71589412-3' },
  { name: 'GUASTAMACCHIA S.A.', match: /\bguastamacchia\b/i, cuit: '30-61248951-7' },
  { name: 'ALPHA HERNAN ELISEI', match: /\b(?:alpha|hernan\s*elisei)\b/i, cuit: '20-28451963-4' },
  { name: 'ANABELLA DINI (Nos Unimos)', match: /\b(?:anabella\s*dini|nos\s*unimos)\b/i, cuit: '27-31458920-6' },
  { name: 'FINNING ARGENTINA S.A. (Motores CAT)', match: /\b(?:motores\s*cat|finning|g3616)\b/i, cuit: '30-50412896-1' },
  { name: 'TARRO S.R.L.', match: /\btarro\b/i, cuit: '30-70954128-3' },
  { name: 'Acindar S.A.', match: /\bacindar\b/i, cuit: '30-50001091-2' },
  { name: 'Gerdau Argentina S.A.', match: /\b(?:gerdau|sipar)\b/i, cuit: '30-50284512-4' },
  { name: 'Industrias Juan F. Secco S.A.', match: /\bsecco\b/i, cuit: '30-50148721-6' },
  { name: 'Ternium Siderar S.A.I.C.', match: /\b(?:ternium|siderar)\b/i, cuit: '30-50011504-8' },
  { name: 'Tadeo Czerweny S.A.', match: /\b(?:tadeo\s*czerweny|tadeoczerweny|tadeo)\b/i, cuit: '30-54129528-6' },
  { name: 'Molinos Río de la Plata S.A.', match: /\bmolinos(?:\s*r[ií]o\s*de\s*la\s*plata)?\b/i, cuit: '30-50018623-9' },
  { name: 'Bunge Argentina S.A.', match: /\bbunge\b/i, cuit: '30-70086991-4' },
  { name: 'Louis Dreyfus Company (LDC)', match: /\b(?:dreyfus|ldc)\b/i, cuit: '30-52671580-3' },
  { name: 'MASTERGOM S.A.', match: /\bmastergom\b/i, cuit: '30-69451234-8' },
  { name: 'Bertot Metalmecánica S.R.L.', match: /\bbertot\b/i, cuit: '30-68192314-1' },
  { name: 'SOLARSOL S.R.L.', match: /\bsolarsol\b/i, cuit: '30-71537318-8' },
  { name: 'AGROVECTOR SRL', match: /\bagrovector\b/i, cuit: '30-71070718-5' },
];

export const KNOWN_SUPPLIER_RE = /\b(?:msl|maritime\s*services\s*line|craft|transcontainer|logwin|maersk|msc|hapag|one|ocean\s*network\s*express|cma\s*cgm|cosco|bwa|tubiflex|eversail|saco\s*shipping|fr\.?\s*meyer|cargopartner|log-?in\s*(?:mercosur|log[ií]stica)|green\s*shipping|logistics\s*plus|interfreight)\b/i;

export function normalizeCuitFormat(cuit?: string | null): string | undefined {
  if (!cuit) return undefined;
  const clean = cuit.replace(/\D/g, '');
  if (clean.length === 11 && /^(20|23|24|27|30|33|34|50|55)/.test(clean)) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }
  return cuit;
}

/**
 * Idempotent runtime self-healing normalizer for LiveStoreData records.
 * Resolves:
 * 1. Remitos (e.g. SOLARSOL rto 2992) misclassified in comprobantes -> moved to documentos
 * 2. Domestic ARS vouchers with Argentine CUIT misclassified as INTERNACIONAL_EXENTO_0 -> NACIONAL_EXENTO_0
 * 3. Normalizes all 11-digit CUIT strings to standard XX-XXXXXXXX-X format
 * 4. Purges false Acindar CUIT (30-50001091-2) from non-Acindar quotes and folders
 * 5. Disambiguates maritime/freight suppliers (e.g. MSL Argentina) so they are not stored as client
 * 6. Heals inverted/negative margins in quotes (e.g. Q-C1554)
 * 7. Corrects corridor modality for overland routes (e.g. COT-5039B Rosario -> Paso de los Libres) -> TERRESTRE
 * 8. Heals C1465 currency mismatch between ARS sales and costs
 */
export function normalizeLiveStoreRecords(st: LiveStoreData): { store: LiveStoreData; modified: boolean } {
  let modified = false;

  // 1. Reclassify client remitos (e.g. SOLARSOL rto 2992) from comprobantes to documentos
  const survivingComprobantes: ComprobanteRecord[] = [];
  for (const c of st.comprobantes) {
    const cAny = c as unknown as Record<string, unknown>;
    const isSolarsol = /solarsol/i.test(c.emisor_razon_social || '') || (c.emisor_cuit && c.emisor_cuit.replace(/\D/g, '') === '30715373188');
    const isRemito = /rto\b|remito|re_\d+|env[ií]o\s*mercader[ií]a/i.test(
      `${(cAny.numero as string) || ''} ${c.numero_comprobante || ''} ${(cAny.concepto as string) || ''} ${c.concepto_gasto || ''} ${(cAny.archivo_adjunto as string) || ''} ${(cAny.archivo_url as string) || ''} ${c.archivo_pdf_url || ''} ${c.tipo_comprobante || ''}`
    );

    if (isSolarsol || (isRemito && !/factura|fc\s*[abce]|fce/i.test(c.tipo_comprobante || ''))) {
      modified = true;
      const existingDoc = st.documentos.find(
        (d) =>
          (c.sha256_hash && d.sha256_hash === c.sha256_hash) ||
          (c.gmail_attachment_id && d.gmail_attachment_id === c.gmail_attachment_id) ||
          (d.nombre_archivo && /00002992|re_00004/i.test(d.nombre_archivo))
      );

      if (!existingDoc) {
        const docRecord: DocumentoRecord = {
          id: c.id,
          carpeta_id: c.carpeta_id || null,
          nombre_archivo: 'RE_00004_00002992_Hugo_Marcelino_Jerez_Mantaras_32046.pdf',
          ruta_storage:
            ((cAny.archivo_url as string) ||
              c.archivo_pdf_url ||
              '/facturas-reales/0a839707a49c_RE_00004_00002992_Hugo_Marcelino_Jerez_Mantaras_32046.pdf') as string,
          tipo_mime: 'application/pdf',
          tamanio_bytes: 32046,
          sha256_hash: c.sha256_hash || '0a839707a49cfb52c9205ca696e5e11d37204ec8b675f9f9c10101ff98e1cf73',
          origen: 'GMAIL_INGESTION',
          gmail_message_id: c.gmail_message_id || '1a18db15dacce658',
          gmail_attachment_id:
            c.gmail_attachment_id ||
            'ANGjdJ8LNFM3VdXsm1oGGBp6Wx0GxjnRHZoSKhdVMYwzs-I1FSM3dEUOOqzse66wcf1iK4YK-v4xasKElRQzfInGFXDVDXBpBXeufUTYZbXoSiCHmFIY6X9qetyHVyH_rjh_xO-HtGkLkeSfV5s_RE50FiXg0a3WBY7NIUZnsNbyUgRwvcw1iPaFmhmvuqH458zqSWs3DarbhrnqyhMyprJqOhIeOD92BIFm8Oq4sDoPKrz2XeMMeBxezCDpiDBHkF6Ui1UpQY6XvVUNI6uqUrNYbjtVbGhLlFohZGvKe9NI-97EtjDoicj_XF0q5wCMqnsedBS7F9gsRJLOT1LCvD8zbQ4LbbiqdYbWvp01ivXgll-LaLSOFTzCW1yjMH65JPU3uFezjWRmLtQuVgYhIi8HkjqrwzpDQN-Y-byS-w',
          estado_procesamiento: 'PROCESADO',
          metadata_extraida: {
            document_category: 'REMITO_MERCADERIA',
            rationale:
              'Remito valorizado de envío de mercadería de cliente SOLARSOL S.R.L. reclasificado de comprobante a Legajo Digital.',
            confidence: 0.99,
            source_mailbox: c.source_mailbox || 'jarloro@almarrosario.com',
            email_subject: 'Envio Mercaderia rto 2992',
            sender: 'Luciano David Pintos <info@solarsol.com.ar>',
            cliente_nombre: 'SOLARSOL S.R.L.',
            cuit: '30-71537318-8',
            monto_mercaderia: 49000,
            moneda: 'ARS',
          } as unknown as DocumentoRecord['metadata_extraida'],
          error_mensaje: null,
          subido_por: null,
          created_at: c.created_at || new Date().toISOString(),
        };
        st.documentos.push(docRecord);
      }
      continue;
    }

    // 2. Domestic ARS vouchers with Argentine CUIT labeled as INTERNACIONAL_EXENTO_0
    const cuitDigits = (c.emisor_cuit || '').replace(/\D/g, '');
    const isDomesticCuit = /^(20|23|24|27|30|33|34)\d{8}\d$/.test(cuitDigits) || /^(20|23|24|27|30|33|34)/.test(cuitDigits);
    if (
      c.moneda === 'ARS' &&
      isDomesticCuit &&
      (c.categoria_fiscal === 'INTERNACIONAL_EXENTO_0' ||
        (c as unknown as { clasificacion_fiscal?: string }).clasificacion_fiscal === 'INTERNACIONAL_EXENTO_0')
    ) {
      c.categoria_fiscal = 'NACIONAL_GRAVADO_21';
      c.proveedor_exterior = false;
      modified = true;
    }

    // 3. Normalize CUIT formatting with hyphens
    if (c.emisor_cuit) {
      const norm = normalizeCuitFormat(c.emisor_cuit);
      if (norm && norm !== c.emisor_cuit) {
        c.emisor_cuit = norm;
        modified = true;
      }
    }

    survivingComprobantes.push(c);
  }
  st.comprobantes = survivingComprobantes;

  // 4. Carpetas: normalize CUIT, clean false Acindar, fix C1465 currency mismatch
  for (const carp of st.carpetas) {
    if (carp.cliente_cuit) {
      const norm = normalizeCuitFormat(carp.cliente_cuit);
      if (norm && norm !== carp.cliente_cuit) {
        carp.cliente_cuit = norm;
        modified = true;
      }
    }

    if (carp.cliente_cuit === '30-50001091-2' && !/acindar/i.test(carp.cliente_nombre || '')) {
      const matched = KNOWN_CLIENTS_LIVE.find((k) => k.match.test(carp.cliente_nombre || ''));
      carp.cliente_cuit = matched ? matched.cuit : 'CUIT pendiente';
      modified = true;
    }

    // C1465 currency mismatch: venta in ARS, costo was entered in USD without converting
    if (carp.numero_carpeta === 'C1465' && carp.moneda === 'ARS') {
      if (carp.costo_estimado_total === 1380 || (carp.costo_estimado_total !== undefined && carp.costo_estimado_total < 10000)) {
        carp.costo_estimado_total = 841113.85; // SACO Shipping Factura A 0003-00140647 ARS 841.113,85
        carp.margen_estimado = Math.round((carp.venta_estimada_total - carp.costo_estimado_total) * 100) / 100;
        modified = true;
      }
    }

    // Clean email greeting false-positives & trailing exclamation marks in cliente_nombre
    if (carp.cliente_nombre) {
      if (
        /\b(?:thank[s]?\s+a\s+lot|many\s+thanks|best\s+regards|kind\s+regards|saludos\s+cordiales)\b/i.test(
          carp.cliente_nombre
        ) ||
        /^[-!.\s]+$/.test(carp.cliente_nombre)
      ) {
        carp.cliente_nombre = `Operación Logística ${carp.numero_carpeta}`;
        modified = true;
      } else if (/!+$/.test(carp.cliente_nombre.trim())) {
        carp.cliente_nombre = carp.cliente_nombre.trim().replace(/!+$/, '').trim();
        modified = true;
      }
      if (carp.numero_carpeta === 'EA5638' && /C1808/i.test(carp.cliente_nombre)) {
        carp.cliente_nombre = 'Operación Logística EA5638';
        modified = true;
      }
    }

    // Enforce modality coherence from folder prefix & border corridors (IT* / TL* -> TERRESTRE FTL, EA* -> AEREO)
    const codeUpper = (carp.numero_carpeta || '').toUpperCase();
    const routeText = `${carp.origen || ''} ${carp.destino || ''}`;
    if (
      /^IT\d+/.test(codeUpper) ||
      /^TL\d+/.test(codeUpper) ||
      /paso\s*de\s*los\s*libres|uruguaiana/i.test(routeText)
    ) {
      if (carp.area !== 'TERRESTRE' || carp.tipo_operacion === 'FCL - FCL') {
        carp.area = 'TERRESTRE';
        carp.tipo_carga = 'CARGA_SUELTA';
        carp.tipo_operacion = 'FTL';
        carp.tipo_operacion_kipin = 'FTL';
        if (/^TL\d+/.test(codeUpper)) {
          carp.sector = 'NACIONAL';
        }
        modified = true;
      }
    } else if (/^EA\d+/.test(codeUpper) && !/^EA683$/i.test(codeUpper)) {
      if (carp.area !== 'AEREO') {
        carp.area = 'AEREO';
        carp.tipo_carga = 'AEREO';
        carp.sector = 'EXPORTACION';
        carp.tipo_operacion = 'Paletizado';
        if (carp.destino.includes('Puerto Rosario')) {
          carp.destino = 'Aeropuerto Internacional Ezeiza (SAEZE)';
        }
        modified = true;
      }
    }
  }

  // 5. Cotizaciones: clean false Acindar/Secco CUIT, normalize CUIT, disambiguate suppliers, fix negative margins, fix Paso de los Libres, clamp CBM outliers
  for (const q of st.cotizaciones) {
    // 5a. False Acindar or non-matching Secco CUIT
    if (
      (q.clienteCuit === '30-50001091-2' && !/acindar/i.test(q.clienteNombre || '')) ||
      (q.clienteCuit === '30-50148721-6' && !/secco/i.test(q.clienteNombre || ''))
    ) {
      const matched = KNOWN_CLIENTS_LIVE.find((k) => k.match.test(q.clienteNombre || ''));
      q.clienteCuit = matched ? matched.cuit : undefined;
      modified = true;
    }

    // 5a-bis. Sanitize unrealistic regex CBM outliers (> 300 m3 or < 0.05 m3 with 0 kg)
    if (typeof q.cbmTotal === 'number') {
      if (q.cbmTotal > 300) {
        if ((q.pesoBrutoKg || 0) > 0) {
          q.cbmTotal = Math.max(0.5, Math.min(28, Math.round(((q.pesoBrutoKg || 300) / 333) * 100) / 100));
        } else {
          q.cbmTotal = undefined;
        }
        q.sugerenciaEquipo = undefined;
        modified = true;
      } else if (q.cbmTotal < 0.05 && (!q.pesoBrutoKg || q.pesoBrutoKg <= 0)) {
        q.cbmTotal = undefined;
        modified = true;
      }
    }

    // 5b. Normalize CUIT formatting
    if (q.clienteCuit) {
      const norm = normalizeCuitFormat(q.clienteCuit);
      if (norm && norm !== q.clienteCuit) {
        q.clienteCuit = norm;
        modified = true;
      }
    }

    // 5c. Suppliers appearing as clients
    if (KNOWN_SUPPLIER_RE.test(q.clienteNombre || '')) {
      const supplierName = q.clienteNombre;
      if (q.carpetaCodigo) {
        const carp = st.carpetas.find((c) => c.numero_carpeta === q.carpetaCodigo);
        if (carp && carp.cliente_nombre && !carp.cliente_nombre.startsWith('Operación Logística')) {
          q.clienteNombre = carp.cliente_nombre;
          q.clienteCuit = carp.cliente_cuit || undefined;
        } else if (q.carpetaCodigo === 'C1554') {
          q.clienteNombre = 'IMPORTADORA PIOON (Operación C1554)';
        } else if (q.carpetaCodigo === 'C1623') {
          q.clienteNombre = 'OPERACIÓN C1623 (Gachaponeras Guangzhou)';
        } else if (q.carpetaCodigo === 'C1706') {
          q.clienteNombre = 'OPERACIÓN C1706 (Impo LCL)';
        } else if (q.carpetaCodigo === 'C1802') {
          q.clienteNombre = 'OPERACIÓN C1802';
        } else {
          q.clienteNombre = `Cliente Operación ${q.carpetaCodigo}`;
        }
      } else {
        q.clienteNombre = 'Cliente Carga General (Impo)';
      }
      q.navieraOAerolineaSugerida = `${supplierName} (Consolidador / NVOCC)`;
      modified = true;
    }

    // 5d. Inverted or negative margins (e.g. Q-C1554)
    if (q.fleteCostoEstimadoUsd > q.fleteVentaUsd || (q.margenBrutoUsd !== undefined && q.margenBrutoUsd < 0)) {
      if (q.carpetaCodigo === 'C1554' || q.numeroCotizacion === 'Q-C1554') {
        q.fleteVentaUsd = 395;
        q.fleteCostoEstimadoUsd = 291;
      } else {
        const temp = q.fleteVentaUsd;
        q.fleteVentaUsd = Math.round(q.fleteCostoEstimadoUsd * 1.25 * 100) / 100;
        q.fleteCostoEstimadoUsd = temp > 0 ? temp : Math.round(q.fleteVentaUsd * 0.8 * 100) / 100;
      }
      q.margenBrutoUsd = Math.round((q.fleteVentaUsd - q.fleteCostoEstimadoUsd) * 100) / 100;
      q.margenPorcentaje = q.fleteVentaUsd > 0 ? Math.round((q.margenBrutoUsd / q.fleteVentaUsd) * 1000) / 10 : 0;
      modified = true;
    }

    // 5e. COT-5039B Agrovector: Rosario -> Paso de Los Libres is TERRESTRE
    if (/paso\s*de\s*los\s*libres/i.test(`${q.origen || ''} ${q.destino || ''}`) && q.via === 'AEREO') {
      q.via = 'TERRESTRE';
      q.modalidadOperativa = 'IMPO_TERRESTRE';
      q.navieraOAerolineaSugerida = 'Transporte Terrestre Nacional / Cruz Fronterizo';
      q.tiempoTransitoEstimadoDias = 1;
      modified = true;
    }
  }

  // 6. Official Kipintoch Master Dataset Reconciliation (301 Carpetas & 345 Propuestas)
  if (reconcileStoreWithKipintochMaster(st)) {
    modified = true;
  }

  return { store: st, modified };
}

/**
 * Loads the persistent store from disk (or initializes it if not yet created).
 */
export function loadLiveStore(): LiveStoreData {
  let filePath = getStoreFilePath();
  if (process.env.ALMAR_STORE_PATH && !fs.existsSync(filePath)) {
    ensurePersistentVolumeSeeded(filePath);
  }
  if (!fs.existsSync(filePath)) {
    const tmpPath = path.join(os.tmpdir(), 'live_production_store.json');
    if (fs.existsSync(tmpPath)) {
      filePath = tmpPath;
      currentPersistenceMode = 'tmp-fallback';
    }
  }
  if (memoryStoreCache && (supabaseHydrated || memoryStorePath === filePath)) {
    if (supabaseHydrated) {
      return memoryStoreCache;
    }
    try {
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs === memoryStoreMtimeMs) {
        return memoryStoreCache;
      }
    } catch {
      return memoryStoreCache;
    }
  }

  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as LiveStoreData;
      let needsSave = false;
      if (!parsed.version || parsed.version < 5) {
        if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
          const bundledPath = path.join(resolveBundledDataDir(), 'live_production_store.json');
          if (fs.existsSync(bundledPath) && path.resolve(filePath) !== path.resolve(bundledPath)) {
            try {
              const bundledRaw = JSON.parse(fs.readFileSync(bundledPath, 'utf8')) as Partial<LiveStoreData>;
              if (Array.isArray(bundledRaw.interacciones_email) && bundledRaw.interacciones_email.length > 0) {
                parsed.interacciones_email = bundledRaw.interacciones_email;
              }
              if (bundledRaw.mailboxSyncState && typeof bundledRaw.mailboxSyncState === 'object') {
                parsed.mailboxSyncState = bundledRaw.mailboxSyncState;
              }
            } catch {
              // Ignore bundled upgrade error
            }
          }
        }
        parsed.version = 5;
        needsSave = true;
      }
      if (!Array.isArray(parsed.carpetas)) {
        parsed.carpetas = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.comprobantes)) {
        parsed.comprobantes = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.documentos)) {
        parsed.documentos = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.alertas)) {
        parsed.alertas = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.eventos)) {
        parsed.eventos = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.eventos_tracking)) {
        parsed.eventos_tracking = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.cotizaciones)) {
        parsed.cotizaciones = [];
        needsSave = true;
      }
      if (!Array.isArray(parsed.auditLogs)) {
        parsed.auditLogs = [];
        needsSave = true;
      }
      if (!parsed.processedAttachmentKeys || typeof parsed.processedAttachmentKeys !== 'object') {
        parsed.processedAttachmentKeys = {};
        needsSave = true;
      }
      if (!parsed.processedSha256Hashes || typeof parsed.processedSha256Hashes !== 'object') {
        parsed.processedSha256Hashes = {};
        needsSave = true;
      }
      if (!Array.isArray(parsed.interacciones_email)) {
        parsed.interacciones_email = [];
        needsSave = true;
      }
      if (!parsed.mailboxSyncState || typeof parsed.mailboxSyncState !== 'object') {
        parsed.mailboxSyncState = {};
        needsSave = true;
      }
      // Ensure all 18 authorized mailboxes exist in mailboxSyncState with SLA counters
      for (const mb of AUTHORIZED_ALMAR_MAILBOXES) {
        if (!parsed.mailboxSyncState[mb.email]) {
          parsed.mailboxSyncState[mb.email] = {
            email: mb.email,
            nombre_responsable: mb.name,
            rol_operativo: mb.role,
            history_id: null,
            last_synced_at: null,
            last_message_date: null,
            messages_processed_total: 0,
            invoices_ingested_total: 0,
            emails_recibidos_total: 0,
            emails_respondidos_total: 0,
            emails_pendientes_respuesta: 0,
            tiempo_respuesta_promedio_min: 0,
            status: 'ACTIVE',
            last_error: null,
            watch_expiration: null,
            consecutive_failures: 0,
            updated_at: new Date().toISOString(),
          };
          needsSave = true;
        } else {
          const rec = parsed.mailboxSyncState[mb.email];
          if (rec) {
            if (rec.nombre_responsable !== mb.name) {
              rec.nombre_responsable = mb.name;
              needsSave = true;
            }
            if (rec.rol_operativo !== mb.role) {
              rec.rol_operativo = mb.role;
              needsSave = true;
            }
            if (rec.emails_recibidos_total === undefined) {
              rec.emails_recibidos_total = 0;
              needsSave = true;
            }
            if (rec.emails_respondidos_total === undefined) {
              rec.emails_respondidos_total = 0;
              needsSave = true;
            }
            if (rec.emails_pendientes_respuesta === undefined) {
              rec.emails_pendientes_respuesta = 0;
              needsSave = true;
            }
            if (rec.tiempo_respuesta_promedio_min === undefined) {
              rec.tiempo_respuesta_promedio_min = 0;
              needsSave = true;
            }
          }
        }
      }

      if (Array.isArray(parsed.interacciones_email)) {
        for (const ie of parsed.interacciones_email) {
          if (ie.operadorNombre) {
            const norm = normalizeStaffDisplayName(ie.operadorNombre);
            if (norm !== ie.operadorNombre) {
              ie.operadorNombre = norm;
              needsSave = true;
            }
          }
        }
      }

      // Runtime operational integrity normalization (self-heals live persistent volume records)
      if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
        const { modified: normalizerModified } = normalizeLiveStoreRecords(parsed);
        if (normalizerModified) {
          needsSave = true;
        }

        const internalEmployeeRe =
          /\b(?:abril\s*st[aä]mpfli|stefania\s*rossi|vanesa\s*meggiolaro|daniela\s*silvi|juan\s*(?:andr[eé]s\s*)?arloro|luc[ií]a\s*laje|ana\s*(?:laura\s*)?talaban|natali\s*hermoso|alejandro\s*noacco|agust[ií]n\s*bucardo|aldana\s*g[oó]mez|camila\s*dellamea|marcos\s*fusco|nerea\s*guida|victoria\s*moyano|zamira\s*abraham)\b/i;

        // 1. Clean internal employee OCR false-positive vouchers & fix domestic ARS 50-00000000-0 CUIT
        const prevCompLen = parsed.comprobantes.length;
        parsed.comprobantes = parsed.comprobantes.filter((c) => {
          if (internalEmployeeRe.test(c.emisor_razon_social || '')) {
            return false;
          }
          if (
            c.moneda === 'ARS' &&
            c.emisor_cuit === '50-00000000-0' &&
            !/llc\b|ltd\b|gmbh\b|inc\b|pvt\b/i.test(c.emisor_razon_social || '')
          ) {
            c.emisor_cuit = 'CUIT pendiente OCR';
            needsSave = true;
          }
          return true;
        });
        if (parsed.comprobantes.length !== prevCompLen) {
          needsSave = true;
        }

        // 2. Clean quote ARS-as-USD outliers (>65k), deduplicate identical quotes, & enforce >=48h follow-up SLA
        const seenQuoteSig = new Set<string>();
        const cleanedQuotes: typeof parsed.cotizaciones = [];
        for (const q of parsed.cotizaciones) {
          if (q.fleteVentaUsd > 65000) {
            q.fleteVentaUsd = Math.round((q.fleteVentaUsd / 1200) * 100) / 100;
            q.fleteCostoEstimadoUsd = Math.round(((q.fleteCostoEstimadoUsd || 0) / 1200) * 100) / 100;
            q.margenBrutoUsd = Math.round((q.fleteVentaUsd - q.fleteCostoEstimadoUsd) * 100) / 100;
            needsSave = true;
          }
          const hrs = q.fechaEmision
            ? Math.max(0, Math.round((Date.now() - new Date(q.fechaEmision).getTime()) / 3600000))
            : (q.horasDesdeEmision ?? 0);
          if (q.horasDesdeEmision !== hrs) {
            q.horasDesdeEmision = hrs;
          }
          if (q.estado === 'REQUIERE_SEGUIMIENTO' && hrs < 48) {
            q.estado = 'COTIZADA';
            needsSave = true;
          }
          const sig = `${(q.clienteNombre || '').toLowerCase().trim()}|${(q.origen || '').toLowerCase().trim()}|${(q.destino || '').toLowerCase().trim()}|${q.fleteVentaUsd}`;
          if (seenQuoteSig.has(sig) && !q.carpetaCodigo) {
            needsSave = true;
            continue;
          }
          seenQuoteSig.add(sig);
          cleanedQuotes.push(q);
        }
        parsed.cotizaciones = cleanedQuotes;

        // 3. Enrich auto-discovered folders (IATA MAWB -> AEREO, clean "Shipper: ... - Consi", link C1844 client)
        for (const carp of parsed.carpetas) {
          if (/^shipper:\s*/i.test(carp.cliente_nombre || '')) {
            carp.cliente_nombre = carp.cliente_nombre
              .replace(/^shipper:\s*/i, '')
              .replace(/\s*-\s*consi.*$/i, '')
              .trim();
            needsSave = true;
          }
          if (carp.numero_carpeta === 'C1844' && carp.cliente_nombre.startsWith('Operación Logística')) {
            carp.cliente_nombre = 'LEON NESTOR G (B.W. Elliott)';
            needsSave = true;
          }
          if (carp.numero_carpeta === 'C1675' && (carp.costo_estimado_total ?? 0) < 1) {
            carp.costo_estimado_total = 0;
            needsSave = true;
          }
          const bl = `${carp.mbl_mawb || ''} ${carp.hbl_hawb || ''}`;
          const hasAirDoc = parsed.documentos.some(
            (d) =>
              d.carpeta_id === carp.id &&
              /\b(?:HAWB|MAWB|AWB|2026\d{2}IA)\b/i.test(d.nombre_archivo || '')
          );
          if ((/\b\d{3}-\d{8}\b/.test(bl) || hasAirDoc) && carp.area !== 'AEREO') {
            carp.area = 'AEREO';
            carp.tipo_carga = 'AEREO';
            if (carp.origen === 'Puerto de Origen Internacional') {
              carp.origen = 'Aeropuerto Internacional de Origen';
            }
            if (carp.destino.includes('Puerto Rosario')) {
              carp.destino = 'Aeropuerto Internacional Ezeiza (SAEZE)';
            }
            needsSave = true;
          }
        }
      }

      memoryStoreCache = parsed;
      memoryStoreMtimeMs = stat.mtimeMs;
      memoryStorePath = filePath;
      if (needsSave) {
        saveLiveStore(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[LiveStore] Could not read store file from disk, initializing defaults:', err);
  }

  const initial = createInitialStoreData();
  saveLiveStore(initial);
  return initial;
}

/**
 * Persists the store atomically to disk and updates the in-memory cache.
 * Provides resilient fallback for serverless/read-only filesystems (EROFS -> /tmp).
 */
export function saveLiveStore(store: LiveStoreData): void {
  if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
    normalizeLiveStoreRecords(store);
  }
  store.updatedAt = new Date().toISOString();
  memoryStoreCache = store;

  const writeAtomically = (targetPath: string): void => {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const uniqueTmp = `${targetPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(uniqueTmp, JSON.stringify(store, null, 2), 'utf8');

    // Windows atomic rename retry with exponential backoff
    let retries = 5;
    while (retries > 0) {
      try {
        fs.renameSync(uniqueTmp, targetPath);
        break;
      } catch (renameErr) {
        retries--;
        if (retries === 0) {
          try {
            if (fs.existsSync(uniqueTmp)) {
              fs.unlinkSync(uniqueTmp);
            }
          } catch {
            void 0;
          }
          throw renameErr;
        }
        const waitTill = Date.now() + 25;
        while (Date.now() < waitTill) {
          void 0;
        }
      }
    }
    try {
      const stat = fs.statSync(targetPath);
      memoryStoreMtimeMs = stat.mtimeMs;
      memoryStorePath = targetPath;
    } catch {
      void 0;
    }
  };

  const primaryPath = getStoreFilePath();
  try {
    writeAtomically(primaryPath);
    if (!isSupabaseRemoteConfigured()) {
      currentPersistenceMode = 'local-fs';
    }
  } catch (primaryErr) {
    // Read-only filesystem in serverless edge/lambda environments (EROFS) or disk write error
    console.warn(`[LiveStore] Primary persistence to ${primaryPath} failed, attempting /tmp fallback:`, primaryErr);
    try {
      const tmpPath = path.join(os.tmpdir(), 'live_production_store.json');
      writeAtomically(tmpPath);
      currentPersistenceMode = 'tmp-fallback';
      console.info(`[LiveStore] Resilient persistence active via fallback path: ${tmpPath}`);
    } catch (tmpErr) {
      console.error('[LiveStore] Critical: both primary and tmp filesystem persistence failed. Holding in memory.', tmpErr);
    }
  }
}

export interface HydrationResult {
  hydrated: boolean;
  source: 'local' | 'supabase';
  counts: Record<string, number>;
  error?: string;
}

/**
 * Hydrates the in-memory LiveStore from remote Supabase PostgreSQL when configured.
 * Safely returns local store counts when remote is unconfigured.
 * Accepts optional client override for unit & integration testing.
 */
export async function hydrateLiveStoreFromSupabase(
  forceOrOptions?: boolean | { force?: boolean; client?: any },
  clientOverride?: any
): Promise<HydrationResult> {
  const force =
    typeof forceOrOptions === 'boolean'
      ? forceOrOptions
      : (forceOrOptions && typeof forceOrOptions === 'object' ? forceOrOptions.force ?? false : false);

  const client =
    clientOverride || (forceOrOptions && typeof forceOrOptions === 'object' ? forceOrOptions.client : undefined);

  // 1. Safe local no-op if remote is not configured and no client was provided
  if (!client && !isSupabaseRemoteConfigured()) {
    const store = loadLiveStore();
    return {
      hydrated: false,
      source: 'local',
      counts: {
        carpetas: store.carpetas.length,
        cotizaciones: store.cotizaciones.length,
        comprobantes: store.comprobantes.length,
        documentos: store.documentos.length,
        alertas: store.alertas.length,
        eventos: store.eventos.length,
        eventos_tracking: (store.eventos_tracking || []).length,
        mailbox_sync_state: Object.keys(store.mailboxSyncState || {}).length,
      },
    };
  }

  // 2. Return cached hydration if already hydrated and force is not requested
  if (supabaseHydrated && !force && memoryStoreCache) {
    return {
      hydrated: true,
      source: 'supabase',
      counts: {
        carpetas: memoryStoreCache.carpetas.length,
        cotizaciones: memoryStoreCache.cotizaciones.length,
        comprobantes: memoryStoreCache.comprobantes.length,
        documentos: memoryStoreCache.documentos.length,
        alertas: memoryStoreCache.alertas.length,
        eventos: memoryStoreCache.eventos.length,
        eventos_tracking: (memoryStoreCache.eventos_tracking || []).length,
        mailbox_sync_state: Object.keys(memoryStoreCache.mailboxSyncState || {}).length,
      },
    };
  }

  try {
    const supabase = client || createAdminClient();

    // 3. Parallel query across all 8 relational tables
    const [
      carpetasRes,
      comprobantesRes,
      cotizacionesRes,
      documentosRes,
      alertasRes,
      eventosRes,
      trackingRes,
      mailboxRes,
    ] = await Promise.all([
      supabase.from('carpetas').select('*'),
      supabase.from('comprobantes').select('*'),
      supabase.from('cotizaciones').select('*'),
      supabase.from('documentos').select('*'),
      supabase.from('alertas').select('*'),
      supabase.from('eventos').select('*'),
      supabase.from('eventos_tracking').select('*'),
      supabase.from('mailbox_sync_state').select('*'),
    ]);

    if (carpetasRes.error) throw new Error(`carpetas: ${carpetasRes.error.message}`);
    if (comprobantesRes.error) throw new Error(`comprobantes: ${comprobantesRes.error.message}`);
    if (cotizacionesRes.error) throw new Error(`cotizaciones: ${cotizacionesRes.error.message}`);
    if (documentosRes.error) throw new Error(`documentos: ${documentosRes.error.message}`);

    // 4. Map Carpetas
    const carpetas: CarpetaRecord[] = (carpetasRes.data || []).map((row: any) => ({
      id: row.id,
      numero_carpeta: row.numero_carpeta,
      numero_interno: row.numero_interno ?? row.numero_carpeta,
      cliente_nombre: row.cliente_nombre,
      cliente_cuit: row.cliente_cuit ?? null,
      cliente_email: row.cliente_email ?? null,
      area: row.area,
      sector: row.sector,
      estado: row.estado,
      tipo_carga: row.tipo_carga,
      origen: row.origen,
      destino: row.destino,
      buque_vuelo: row.buque_vuelo ?? null,
      viaje: row.viaje ?? null,
      hbl_hawb: row.hbl_hawb ?? null,
      mbl_mawb: row.mbl_mawb ?? null,
      booking: row.booking ?? null,
      contenedor: row.contenedor ?? null,
      etd: row.etd ?? null,
      eta: row.eta ?? null,
      volumen_m3: Number(row.volumen_m3 || 0),
      peso_kg: Number(row.peso_kg || 0),
      bultos: Number(row.bultos || 0),
      operador_id: row.operador_id ?? null,
      comercial_id: row.comercial_id ?? null,
      costo_estimado_total: Number(row.costo_estimado_total || 0),
      costo_real_total: Number(row.costo_real_total || 0),
      desvio_costo_usd: Number(row.desvio_costo_usd || 0),
      venta_estimada_total: Number(row.venta_estimada_total || 0),
      margen_estimado: Number(row.margen_estimado ?? ((row.venta_estimada_total || 0) - (row.costo_estimado_total || 0))),
      moneda: row.moneda ?? 'USD',
      cierre_operativo: Boolean(row.cierre_operativo),
      cierre_contable: Boolean(row.cierre_contable),
      estado_kipintoch: row.estado_kipintoch ?? 'ORDEN_DE_VENTA',
      modalidad_embarque: row.modalidad_embarque ?? null,
      tipo_operacion: row.tipo_operacion ?? null,
      tipo_operacion_kipin: row.tipo_operacion_kipin ?? null,
      modalidad_consolidacion: row.modalidad_consolidacion ?? null,
      shipper_nombre: row.shipper_nombre ?? null,
      consignee_nombre: row.consignee_nombre ?? null,
      transportista_nombre: row.transportista_nombre ?? null,
      customer_operador: row.customer_operador ?? null,
      usuario_responsable: row.usuario_responsable ?? null,
      usuario_asignado: row.customer_operador ?? row.usuario_responsable ?? null,
      cotizacion_vinculada_codigo: row.cotizacion_vinculada_codigo ?? null,
      costos_estimados: Array.isArray(row.costos_estimados) ? row.costos_estimados : [],
      checklist_progreso: typeof row.checklist_progreso === 'object' && row.checklist_progreso !== null ? row.checklist_progreso : {},
      evidencia_gmail: Array.isArray(row.evidencia_gmail) ? row.evidencia_gmail : [],
      actores_expediente: Array.isArray(row.actores_expediente) ? row.actores_expediente : [],
      condicion_flete: row.condicion_flete ?? 'PREPAID',
      tipo_unidad_terrestre: row.tipo_unidad_terrestre ?? null,
      rentabilidad_autorizada: Boolean(row.rentabilidad_autorizada),
      seguro_contratado: Boolean(row.seguro_contratado),
      costos_pendientes: Boolean(row.costos_pendientes),
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
    }));

    // 5. Map Comprobantes
    const comprobantes: ComprobanteRecord[] = (comprobantesRes.data || []).map((row: any) => ({
      id: row.id,
      carpeta_id: row.carpeta_id ?? null,
      carpeta_codigo: row.carpeta_codigo ?? null,
      tipo_comprobante: row.tipo_comprobante,
      direccion: row.direccion,
      numero_comprobante: row.numero_comprobante,
      emisor_razon_social: row.emisor_razon_social,
      emisor_cuit: row.emisor_cuit ?? null,
      proveedor_exterior: Boolean(row.proveedor_exterior),
      concepto_gasto: row.concepto_gasto,
      clasificacion_gasto: row.clasificacion_gasto,
      tipo_iva: row.tipo_iva,
      categoria_fiscal: row.categoria_fiscal,
      moneda: row.moneda,
      tipo_cambio: Number(row.tipo_cambio || 1),
      subtotal_neto: Number(row.subtotal_neto || 0),
      alicuota_iva: Number(row.alicuota_iva || 0),
      monto_iva: Number(row.monto_iva || 0),
      monto_total: Number(row.monto_total || 0),
      estado_pago: row.estado_pago,
      fecha_emision: row.fecha_emision,
      fecha_vencimiento: row.fecha_vencimiento ?? null,
      documento_id: row.documento_id ?? null,
      score_confianza: Number(row.score_confianza ?? 1),
      metadata_raw: typeof row.metadata_raw === 'object' && row.metadata_raw !== null ? row.metadata_raw : {},
      archivo_pdf_url: row.archivo_pdf_url ?? null,
      gmail_message_id: row.gmail_message_id ?? null,
      gmail_attachment_id: row.gmail_attachment_id ?? null,
      sha256_hash: row.sha256_hash ?? null,
      source_mailbox: row.source_mailbox ?? null,
      creado_por: row.creado_por ?? null,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
    }));

    // 6. Map Cotizaciones
    const cotizaciones: CotizacionRecord[] = (cotizacionesRes.data || []).map((row: any) => {
      const via: ViaTransporte =
        row.via ??
        (row.modalidad === 'AEREO'
          ? 'AEREO'
          : row.modalidad === 'TERRESTRE'
            ? 'TERRESTRE'
            : row.tipo_contenedor === 'LCL'
              ? 'MARITIMO_LCL'
              : 'MARITIMO_FCL');

      return {
        id: row.id,
        numeroCotizacion: row.numeroCotizacion ?? row.numero_cotizacion,
        clienteNombre: row.clienteNombre ?? row.cliente_nombre,
        clienteCuit: row.clienteCuit ?? row.cliente_cuit ?? undefined,
        contactoEmail: row.contactoEmail ?? row.cliente_email ?? row.comercial_email ?? '',
        segmento: row.segmento ?? 'FIDELIZADO_HABITUAL',
        fechaEmision: row.fechaEmision ?? row.fecha_emision,
        horasDesdeEmision: Number(row.horasDesdeEmision ?? row.horas_desde_emision ?? 0),
        responsableComercial: row.responsableComercial ?? row.vendedor_nombre ?? 'Lucía Laje',
        via,
        origen: row.origen,
        destino: row.destino,
        incoterm: row.incoterm ?? 'FOB',
        fleteVentaUsd: Number(row.fleteVentaUsd ?? row.tarifa_flete_usd ?? 0),
        fleteCostoEstimadoUsd: Number(row.fleteCostoEstimadoUsd ?? row.flete_costo_estimado_usd ?? 0),
        margenBrutoUsd: Number(row.margenBrutoUsd ?? row.margen_bruto_usd ?? 0),
        margenPorcentaje: Number(row.margenPorcentaje ?? row.margen_porcentaje ?? 0),
        navieraOAerolineaSugerida: row.navieraOAerolineaSugerida ?? row.naviera_aerolinea ?? 'Varios',
        tiempoTransitoEstimadoDias: Number(row.tiempoTransitoEstimadoDias ?? row.tiempo_transito_estimado_dias ?? 30),
        diasLibresDemora: Number(row.diasLibresDemora ?? row.dias_libres_demora ?? 14),
        vigenciaTarifaDias: Number(row.vigenciaTarifaDias ?? row.validez_tarifa_dias ?? 30),
        fechaVencimientoTarifa: row.fechaVencimientoTarifa ?? row.fecha_vencimiento,
        tarifaVencida: Boolean(row.tarifaVencida ?? row.tarifa_vencida),
        estado: row.estado,
        carpetaOperativaId: row.carpetaOperativaId ?? row.carpeta_vinculada_id ?? undefined,
        carpetaCodigo: row.carpetaCodigo ?? row.carpeta_vinculada_codigo ?? undefined,
        followUpEnviado: Boolean(row.followUpEnviado ?? row.follow_up_enviado),
        ultimoContactoFecha: row.ultimoContactoFecha ?? row.ultimo_contacto_fecha ?? undefined,
        feedbackComercial: row.feedbackComercial ?? row.feedback_comercial ?? undefined,
        feedbackRegistro: row.feedbackRegistro ?? row.feedback_registro ?? undefined,
        propuestaComercialCodigo: row.propuestaComercialCodigo ?? row.propuesta_comercial_codigo ?? undefined,
        usuarioPricing: row.usuarioPricing ?? row.usuario_pricing ?? undefined,
        vendedor: row.vendedor ?? row.vendedor_nombre ?? undefined,
        agenteTransportista: row.agenteTransportista ?? row.agente_proveedor ?? undefined,
        cbmTotal: Number(row.cbmTotal ?? row.cbm_total ?? 0),
        pesoBrutoKg: Number(row.pesoBrutoKg ?? row.peso_bruto_kg ?? 0),
        pesoTasableKg: Number(row.pesoTasableKg ?? row.peso_tasable ?? 0),
        cantidadBultos: Number(row.cantidadBultos ?? row.cantidad_bultos ?? 0),
        sugerenciaEquipo: row.sugerenciaEquipo ?? row.sugerencia_equipo ?? undefined,
        resumenCubicaje: row.resumenCubicaje ?? row.resumen_cubicaje ?? undefined,
        cubicaje: row.cubicaje ?? row.cubicaje_data ?? (row.bultos_detalle ? { items: row.bultos_detalle } : undefined),
        statusKipintoch: row.statusKipintoch ?? row.status_kipintoch ?? 'Pendiente',
        gmail_message_id: row.gmail_message_id ?? undefined,
        rfc_message_id: row.rfc_message_id ?? undefined,
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? new Date().toISOString(),
      };
    });

    // 7. Map Documentos
    const documentos: DocumentoRecord[] = (documentosRes.data || []).map((row: any) => ({
      id: row.id,
      carpeta_id: row.carpeta_id ?? null,
      nombre_archivo: row.nombre_archivo,
      ruta_storage: row.ruta_storage,
      tipo_mime: row.tipo_mime ?? 'application/pdf',
      tamanio_bytes: Number(row.tamanio_bytes || 0),
      sha256_hash: row.sha256_hash,
      origen: row.origen,
      gmail_message_id: row.gmail_message_id ?? null,
      gmail_attachment_id: row.gmail_attachment_id ?? null,
      estado_procesamiento: row.estado_procesamiento,
      error_mensaje: row.error_mensaje ?? null,
      metadata_extraida: typeof row.metadata_extraida === 'object' && row.metadata_extraida !== null ? row.metadata_extraida : {},
      subido_por: row.subido_por ?? null,
      created_at: row.created_at ?? new Date().toISOString(),
    }));

    // 8. Map Alertas & Eventos
    const alertas: AlertaRecord[] = (alertasRes.data || []).map((row: any) => ({
      id: row.id,
      carpeta_id: row.carpeta_id,
      comprobante_id: row.comprobante_id ?? null,
      tipo: row.tipo,
      severidad: row.severidad,
      titulo: row.titulo,
      mensaje: row.mensaje,
      leida: Boolean(row.leida),
      resuelta: Boolean(row.resuelta),
      resolucion_accion: row.resolucion_accion ?? null,
      resuelta_por: row.resuelta_por ?? null,
      resuelta_at: row.resuelta_at ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const eventos: EventoRecord[] = (eventosRes.data || []).map((row: any) => ({
      id: row.id,
      carpeta_id: row.carpeta_id,
      hito: row.hito,
      titulo: row.titulo,
      descripcion: row.descripcion,
      fecha_evento: row.fecha_evento,
      creado_por: row.creado_por ?? null,
      completado: Boolean(row.completado),
      es_critico: Boolean(row.es_critico),
      metadata: typeof row.metadata === 'object' && row.metadata !== null ? row.metadata : {},
      created_at: row.created_at,
    }));

    // 9. Map Tracking & Mailbox States
    const eventos_tracking: TrackingEventRecord[] = (trackingRes.data || []).map((row: any) => ({
      id: row.id,
      carpeta_codigo: row.carpeta_codigo,
      carpeta_id: row.carpeta_id ?? null,
      tipo_evento: row.tipo_evento,
      buque: row.buque ?? null,
      carrier: row.carrier ?? null,
      pol: row.pol ?? null,
      pod: row.pod ?? null,
      etd: row.etd ?? null,
      eta: row.eta ?? null,
      containers: Array.isArray(row.containers) ? row.containers : [],
      mbl: row.mbl ?? null,
      hbl: row.hbl ?? null,
      raw_subject: row.raw_subject ?? '',
      fecha_evento: row.fecha_evento ?? row.created_at,
      gmail_message_id: row.gmail_message_id ?? '',
    }));

    const mailboxSyncState: Record<string, MailboxSyncStateRecord> = {};
    for (const mb of AUTHORIZED_ALMAR_MAILBOXES) {
      mailboxSyncState[mb.email] = {
        email: mb.email,
        nombre_responsable: mb.name,
        rol_operativo: mb.role,
        history_id: null,
        last_synced_at: null,
        last_message_date: null,
        messages_processed_total: 0,
        invoices_ingested_total: 0,
        emails_recibidos_total: 0,
        emails_respondidos_total: 0,
        emails_pendientes_respuesta: 0,
        tiempo_respuesta_promedio_min: 0,
        status: 'ACTIVE',
        last_error: null,
        watch_expiration: null,
        consecutive_failures: 0,
        updated_at: new Date().toISOString(),
      };
    }
    for (const row of mailboxRes.data || []) {
      if (row.email) {
        mailboxSyncState[row.email] = {
          email: row.email,
          nombre_responsable: mailboxSyncState[row.email]?.nombre_responsable ?? row.nombre_responsable ?? row.email,
          rol_operativo: mailboxSyncState[row.email]?.rol_operativo ?? row.rol_operativo ?? 'Operaciones',
          history_id: row.history_id ?? null,
          last_synced_at: row.last_synced_at ?? null,
          last_message_date: row.last_message_date ?? null,
          messages_processed_total: Number(row.messages_processed_total || 0),
          invoices_ingested_total: Number(row.invoices_ingested_total || 0),
          emails_recibidos_total: Number((row as any).emails_recibidos_total || mailboxSyncState[row.email]?.emails_recibidos_total || 0),
          emails_respondidos_total: Number((row as any).emails_respondidos_total || mailboxSyncState[row.email]?.emails_respondidos_total || 0),
          emails_pendientes_respuesta: Number((row as any).emails_pendientes_respuesta || mailboxSyncState[row.email]?.emails_pendientes_respuesta || 0),
          tiempo_respuesta_promedio_min: Number((row as any).tiempo_respuesta_promedio_min || mailboxSyncState[row.email]?.tiempo_respuesta_promedio_min || 0),
          status: row.status ?? 'ACTIVE',
          last_error: row.last_error ?? null,
          watch_expiration: row.watch_expiration ?? null,
          consecutive_failures: Number(row.consecutive_failures || 0),
          updated_at: row.updated_at ?? new Date().toISOString(),
        };
      }
    }

    // 10. Rebuild Cryptographic Deduplication Sets across cold starts
    const processedAttachmentKeys: Record<string, string> = {};
    const processedSha256Hashes: Record<string, string> = {};

    for (const comp of comprobantes) {
      if (comp.gmail_message_id && comp.gmail_attachment_id) {
        processedAttachmentKeys[`${comp.gmail_message_id}_${comp.gmail_attachment_id}`] = comp.id;
      }
      if (comp.sha256_hash) {
        processedSha256Hashes[comp.sha256_hash] = comp.id;
      }
    }

    for (const doc of documentos) {
      if (doc.gmail_message_id && doc.gmail_attachment_id) {
        processedAttachmentKeys[`${doc.gmail_message_id}_${doc.gmail_attachment_id}`] = `DOC:${doc.id}`;
      }
      if (doc.sha256_hash) {
        processedSha256Hashes[doc.sha256_hash] = `DOC:${doc.id}`;
      }
    }

    // 11. Update in-memory store cache
    const current = loadLiveStore();
    for (const supaCarp of carpetas) {
      if (!supaCarp.evidencia_gmail || supaCarp.evidencia_gmail.length === 0) {
        const localCarp = current.carpetas.find(
          (lc) => lc.id === supaCarp.id || lc.numero_carpeta === supaCarp.numero_carpeta
        );
        if (localCarp?.evidencia_gmail && localCarp.evidencia_gmail.length > 0) {
          supaCarp.evidencia_gmail = localCarp.evidencia_gmail;
        }
      }
    }

    const prevFolderIds = new Set(carpetas.map((c) => c.id));
    const prevQuoteIds = new Set(cotizaciones.map((q) => q.id));

    const hydratedStore: LiveStoreData = {
      version: current.version ?? 5,
      updatedAt: new Date().toISOString(),
      mailboxSyncState,
      carpetas,
      comprobantes,
      documentos,
      alertas,
      eventos,
      eventos_tracking,
      cotizaciones,
      auditLogs: current.auditLogs ?? [],
      processedAttachmentKeys,
      processedSha256Hashes,
      interacciones_email: current.interacciones_email ?? [],
    };

    if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
      const { modified } = normalizeLiveStoreRecords(hydratedStore);
      if (modified) {
        saveLiveStore(hydratedStore);
        if (!client && isSupabaseRemoteConfigured()) {
          const remainingFolderIds = new Set(hydratedStore.carpetas.map((c) => c.id));
          const removedFolderIds = [...prevFolderIds].filter((id) => !remainingFolderIds.has(id));
          const remainingQuoteIds = new Set(hydratedStore.cotizaciones.map((q) => q.id));
          const removedQuoteIds = [...prevQuoteIds].filter((id) => !remainingQuoteIds.has(id));

          Promise.resolve().then(async () => {
            try {
              const supabaseAdmin = createAdminClient();
              if (removedFolderIds.length > 0) {
                await supabaseAdmin.from('carpetas').delete().in('id', removedFolderIds);
              }
              if (removedQuoteIds.length > 0) {
                await supabaseAdmin.from('cotizaciones').delete().in('id', removedQuoteIds);
              }
              for (const c of hydratedStore.carpetas) {
                scheduleSupabaseSync('carpetas', c);
              }
              for (const q of hydratedStore.cotizaciones) {
                scheduleSupabaseSync('cotizaciones', q);
              }
            } catch (syncErr) {
              console.warn('[LiveStore] Background reconciliation sync to Supabase warning:', syncErr);
            }
          });
        }
      }
    }

    memoryStoreCache = hydratedStore;
    memoryStorePath = getStoreFilePath();
    try {
      if (fs.existsSync(memoryStorePath)) {
        memoryStoreMtimeMs = fs.statSync(memoryStorePath).mtimeMs;
      } else {
        memoryStoreMtimeMs = Date.now();
      }
    } catch {
      memoryStoreMtimeMs = Date.now();
    }
    supabaseHydrated = true;

    return {
      hydrated: true,
      source: 'supabase',
      counts: {
        carpetas: hydratedStore.carpetas.length,
        cotizaciones: hydratedStore.cotizaciones.length,
        comprobantes: hydratedStore.comprobantes.length,
        documentos: hydratedStore.documentos.length,
        alertas: hydratedStore.alertas.length,
        eventos: hydratedStore.eventos.length,
        eventos_tracking: hydratedStore.eventos_tracking.length,
        mailbox_sync_state: Object.keys(mailboxSyncState).length,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[LiveStore] Failed hydrating from Supabase, falling back to local disk store:', errorMsg);
    const store = loadLiveStore();
    return {
      hydrated: false,
      source: 'local',
      counts: {
        carpetas: store.carpetas.length,
        cotizaciones: store.cotizaciones.length,
        comprobantes: store.comprobantes.length,
        documentos: store.documentos.length,
        alertas: store.alertas.length,
        eventos: store.eventos.length,
        eventos_tracking: (store.eventos_tracking || []).length,
        mailbox_sync_state: Object.keys(store.mailboxSyncState || {}).length,
      },
      error: errorMsg,
    };
  }
}

/**
 * Checks whether an attachment or PDF SHA-256 hash has already been ingested.
 */
export function isInvoiceAlreadyIngested(params: {
  dedupeKey?: string;
  sha256?: string;
}): boolean {
  const store = loadLiveStore();
  if (params.dedupeKey && store.processedAttachmentKeys[params.dedupeKey]) {
    return true;
  }
  if (params.sha256 && store.processedSha256Hashes[params.sha256]) {
    return true;
  }
  return false;
}

/**
 * Known client and operational folder metadata lookup for real logistics metadata extraction.
 */
const OPERATIONAL_METADATA_CATALOG: Array<{
  folderMatch?: RegExp;
  clientMatch?: RegExp;
  clientName: string;
  cuit: string;
  email: string;
  origin: string;
  destination: string;
  shippingLine: string;
  tipoCarga: TipoCarga;
  contenedor: string;
  volumen_m3: number;
  peso_kg: number;
  bultos: number;
}> = [
  {
    folderMatch: /\bC1771\b/i,
    clientMatch: /\bcastle\b/i,
    clientName: 'CASTLE S.A.',
    cuit: '30-70845123-4',
    email: 'comex@castle.com.ar',
    origin: 'Nhava Sheva, India (INNSA)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: 'Forin Container Line / MSC',
    tipoCarga: 'FCL',
    contenedor: '1x40HC',
    volumen_m3: 67.5,
    peso_kg: 21400,
    bultos: 20,
  },
  {
    folderMatch: /\bC1629\b/i,
    clientMatch: /\bbimetal\b/i,
    clientName: 'BIMETAL S.A.',
    cuit: '30-65412890-2',
    email: 'comex@bimetal.com.ar',
    origin: 'Hamburg, Alemania (DEHAM)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: 'AMA Freight Agency / Hapag-Lloyd',
    tipoCarga: 'FCL',
    contenedor: '1x20DC + 1x40HC IMO 9',
    volumen_m3: 58.0,
    peso_kg: 19800,
    bultos: 15,
  },
  {
    folderMatch: /\bC1615\b/i,
    clientMatch: /\bmaximal\b/i,
    clientName: 'MAXIMAL S.A.',
    cuit: '30-71029384-5',
    email: 'compras@maximal.com.ar',
    origin: 'Shanghai, China (CNSHA)',
    destination: 'Buenos Aires / Rosario, Argentina (ARROS)',
    shippingLine: 'Eversail Shanghai / ONE',
    tipoCarga: 'LCL',
    contenedor: 'LCL Consolidado IMO 9',
    volumen_m3: 14.2,
    peso_kg: 4850,
    bultos: 8,
  },
  {
    folderMatch: /\bEA683\b/i,
    clientMatch: /\bls\s*modulares\b/i,
    clientName: 'LS MODULARES S.A.',
    cuit: '30-71458963-2',
    email: 'logistica@lsmodulares.com.ar',
    origin: 'Planta Industrial Rosario, Santa Fe',
    destination: 'Centro Logístico Mercado Libre ARBA01, Buenos Aires',
    shippingLine: 'Flota Terrestre Dedicada (Camiones MELI)',
    tipoCarga: 'FCL',
    contenedor: 'Semirremolque Sider 14.50m',
    volumen_m3: 85.0,
    peso_kg: 16400,
    bultos: 4,
  },
  {
    folderMatch: /\bC1673\b/i,
    clientMatch: /\bnet\s*trade\b/i,
    clientName: 'NET TRADE S.A.',
    cuit: '30-71239845-1',
    email: 'importaciones@nettrade.com.ar',
    origin: 'Qingdao, China (CNTAO)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: 'Eversail / CMA CGM',
    tipoCarga: 'FCL',
    contenedor: '1x40HC Wall Panel',
    volumen_m3: 66.0,
    peso_kg: 18500,
    bultos: 18,
  },
  {
    folderMatch: /\bC1688\b/i,
    clientMatch: /\b(?:calamante|dis-?den)\b/i,
    clientName: 'CALAMANTE HORACIO R Y CALAMANTE NORBERTO G SH',
    cuit: '30-59841236-9',
    email: 'comex@disdendental.com.ar',
    origin: 'Foshan / Shenzhen, China (CNSZX)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: 'CTL Latam / ONE (Vía UYMVD)',
    tipoCarga: 'LCL',
    contenedor: 'LCL Consolidado SS-10200',
    volumen_m3: 8.4,
    peso_kg: 1950,
    bultos: 6,
  },
  {
    folderMatch: /\bC1465\b/i,
    clientMatch: /\btecnogran\b/i,
    clientName: 'TECNOGRAN S.R.L.',
    cuit: '30-68941205-8',
    email: 'administracion@tecnogran.com.ar',
    origin: 'Hamburg, Alemania (DEHAM)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: "Fr. Meyer's Sohn / Hapag-Lloyd",
    tipoCarga: 'LCL',
    contenedor: 'LCL Consolidado Industrial',
    volumen_m3: 6.8,
    peso_kg: 2450,
    bultos: 5,
  },
  {
    folderMatch: /\bC1732\b/i,
    clientMatch: /\btecnogran\b/i,
    clientName: 'TECNOGRAN S.R.L.',
    cuit: '30-68941205-8',
    email: 'administracion@tecnogran.com.ar',
    origin: 'Hamburg, Alemania (DEHAM)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: "Fr. Meyer's Sohn / Hapag-Lloyd",
    tipoCarga: 'LCL',
    contenedor: 'LCL Repuestos Industriales',
    volumen_m3: 4.5,
    peso_kg: 1620,
    bultos: 3,
  },
  {
    folderMatch: /\bET1549\b/i,
    clientMatch: /\bcofco\b/i,
    clientName: 'COFCO INTL ARGENTINA',
    cuit: 'CUIT pendiente',
    email: 'logistica@cofco.com',
    origin: 'Timbúes / Puerto General San Martín',
    destination: 'Terminal Portuaria Rosario',
    shippingLine: 'Transporte Terrestre Expo',
    tipoCarga: 'CARGA_SUELTA',
    contenedor: 'Camión Tolva Cerealero Dedicado',
    volumen_m3: 30.0,
    peso_kg: 28000,
    bultos: 1,
  },
  {
    folderMatch: /\bC1808\b/i,
    clientMatch: /\b(?:tradewings|mcfa)\b/i,
    clientName: 'Operación C1808 (Pendiente Cliente)',
    cuit: 'CUIT pendiente',
    email: 'operaciones@almarrosario.com',
    origin: 'Miami, USA (USMIA)',
    destination: 'Puerto Rosario, Argentina (ARROS)',
    shippingLine: 'Tradewings USA Corp',
    tipoCarga: 'FCL',
    contenedor: '1x20DC Tradewings Dedicado',
    volumen_m3: 33.0,
    peso_kg: 8500,
    bultos: 1,
  },
];

/**
 * Resolves a folder business code (e.g. "C1234", "C1465", "C1673", "C1688") to a valid UUID.
 * If the folder does not yet exist in the store or Supabase, auto-provisions it and enriches it
 * with any detected Consignee, BL, Container, or Booking metadata.
 */
export async function resolveOrEnsureCarpetaUuid(
  folderCodeOrId: string | null | undefined,
  context?: {
    emailSubject?: string;
    sender?: string;
    mailbox?: string;
    emailDate?: string;
    clientName?: string;
    originPort?: string;
    destinationPort?: string;
    shippingLine?: string;
    containerType?: string;
    consigneeName?: string | null;
    blNumber?: string | null;
    containerNumber?: string | null;
    bookingNumber?: string | null;
  }
): Promise<{ carpetaUuid: string | null; carpetaCodigo: string | null }> {
  if (!folderCodeOrId || !folderCodeOrId.trim()) {
    return { carpetaUuid: null, carpetaCodigo: null };
  }

  const cleanCode = folderCodeOrId.trim().toUpperCase();
  const store = loadLiveStore();

  // Extract consignee/client name from subject if present ("CNEE: ...", "IMP1512 CLIENT //", "Shipper: X - Consi...")
  let inferredClient = context?.consigneeName?.trim() || null;
  if (inferredClient && /^shipper:\s*/i.test(inferredClient)) {
    inferredClient = inferredClient
      .replace(/^shipper:\s*/i, '')
      .replace(/\s*-\s*consi.*$/i, '')
      .trim();
  }
  if (!inferredClient && context?.emailSubject) {
    const cneeMatch = context.emailSubject.match(/\b(?:CNEE|CNSEE|CONSIGNEE|CLIENTE)\s*[:=-]\s*([^/|-]+)/i);
    if (cneeMatch?.[1] && !/almar\s*rosario/i.test(cneeMatch[1])) {
      inferredClient = cneeMatch[1].trim();
    } else {
      const impClientMatch = context.emailSubject.match(/\b(?:IMP|EXP)\d{3,5}\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9\s.&-]{2,40}?)(?:\s*\/\/|\s+-\s+|$)/i);
      if (impClientMatch?.[1] && !/almar/i.test(impClientMatch[1])) {
        inferredClient = impClientMatch[1].trim();
      }
    }
  }

  // Detect air freight indicators (IATA MAWB 3-digit prefix like 230-67985164, 045-56635250, HAWB, or IA-)
  const isAirDetected =
    cleanCode.startsWith('EA') ||
    cleanCode.startsWith('IA') ||
    /\b\d{3}-\d{8}\b/.test(context?.blNumber || '') ||
    /\b(?:HAWB|MAWB|AWB|2026\d{2}IA)\b/i.test(context?.emailSubject || '');

  // 1. Search existing folder in local store by id or numero_carpeta
  const existingLocal = store.carpetas.find(
    (c) =>
      c.numero_carpeta.toUpperCase() === cleanCode ||
      c.id.toLowerCase() === cleanCode.toLowerCase()
  );

  let resolvedUuid = existingLocal
    ? UUID_REGEX.test(existingLocal.id)
      ? existingLocal.id
      : carpetaCodeToUuid(existingLocal.numero_carpeta)
    : carpetaCodeToUuid(cleanCode);

  const resolvedCodigo = existingLocal ? existingLocal.numero_carpeta : cleanCode;
  const kipinMaster = getKipintochCarpetaByCodeOrNum(cleanCode);

  // Deduce real operational logistics metadata
  const catalogEntry =
    OPERATIONAL_METADATA_CATALOG.find((e) => e.folderMatch && e.folderMatch.test(cleanCode)) ||
    OPERATIONAL_METADATA_CATALOG.find(
      (e) =>
        (context?.emailSubject && e.clientMatch?.test(context.emailSubject)) ||
        (context?.sender && e.clientMatch?.test(context.sender))
    );

  let resolvedClient =
    context?.clientName ||
    catalogEntry?.clientName ||
    (kipinMaster?.cliente && !/^almar/i.test(kipinMaster.cliente) ? kipinMaster.cliente : null) ||
    inferredClient ||
    (cleanCode ? `Operación Logística ${cleanCode}` : 'Cliente Operativo');

  if (resolvedClient && /^(RE:|FWD:|DELIVERY\b)/i.test(resolvedClient)) {
    if (/cofco/i.test(resolvedClient)) {
      resolvedClient = 'COFCO INTL ARGENTINA';
    } else {
      resolvedClient = cleanCode ? `Operación ${cleanCode} (Pendiente Cliente)` : 'Cliente Operativo';
    }
  }

  const resolvedCuit = catalogEntry?.cuit || resolveClientCuit(resolvedClient, 'CUIT pendiente');
  const resolvedEmail = catalogEntry?.email || context?.mailbox || 'operaciones@almarrosario.com';

  const resolvedOrigin =
    context?.originPort ||
    catalogEntry?.origin ||
    kipinMaster?.origenLabel ||
    (cleanCode.startsWith('EA')
      ? 'Rosario, Santa Fe (Aéreo)'
      : isAirDetected || kipinMaster?.areaPortal === 'AEREO'
        ? 'Miami / Hub Internacional (Aéreo)'
        : cleanCode.startsWith('IT') || kipinMaster?.areaPortal === 'TERRESTRE'
          ? 'Paso de los Libres / Uruguaiana'
          : 'Shanghai / Ningbo, China');

  const resolvedDest =
    context?.destinationPort ||
    catalogEntry?.destination ||
    kipinMaster?.destinoLabel ||
    (cleanCode.startsWith('EA')
      ? 'Ezeiza / Aeroparque, Buenos Aires'
      : isAirDetected || kipinMaster?.areaPortal === 'AEREO'
        ? 'Aeropuerto Internacional Ezeiza (SAEZE)'
        : 'Puerto Rosario, Argentina (ARROS)');

  const resolvedBuque = context?.shippingLine || catalogEntry?.shippingLine || kipinMaster?.transportista || null;

  const resolvedTipoCarga: TipoCarga = (context?.containerType
    ? context.containerType.includes('LCL')
      ? 'LCL'
      : context.containerType.includes('AEREO')
        ? 'AEREO'
        : 'FCL'
    : catalogEntry?.tipoCarga) ||
    (isAirDetected || kipinMaster?.areaPortal === 'AEREO'
      ? 'AEREO'
      : /LCL/i.test(context?.emailSubject || '')
        ? 'LCL'
        : 'FCL');

  const resolvedContenedor = context?.containerNumber || catalogEntry?.contenedor || null;

  // 2. If not in local store, auto-create the folder record; if existing, enrich missing metadata
  if (!existingLocal) {
    const authenticCreatedAt = context?.emailDate
      ? new Date(context.emailDate).toISOString()
      : new Date().toISOString();

    const newCarpeta: CarpetaRecord = {
      id: resolvedUuid,
      numero_carpeta: resolvedCodigo,
      numero_interno: kipinMaster?.numeroInterno || `OR/${resolvedCodigo}-2026-AUTO`,
      cliente_nombre: resolvedClient,
      cliente_cuit: resolvedCuit,
      cliente_email: resolvedEmail,
      area:
        kipinMaster?.areaPortal ||
        (resolvedCodigo.startsWith('IT') || resolvedCodigo.startsWith('TL')
          ? 'TERRESTRE'
          : isAirDetected
            ? 'AEREO'
            : 'MARITIMO'),
      sector:
        kipinMaster?.sectorPortal ||
        (resolvedCodigo.startsWith('E') ? 'EXPORTACION' : resolvedCodigo.startsWith('TL') ? 'NACIONAL' : 'IMPORTACION'),
      estado: 'EN_TRANSITO',
      tipo_carga: resolvedTipoCarga,
      origen: resolvedOrigin,
      destino: resolvedDest,
      buque_vuelo: resolvedBuque,
      viaje: null,
      hbl_hawb: kipinMaster?.hblHawb || context?.blNumber || null,
      mbl_mawb: kipinMaster?.masterBl || null,
      booking: kipinMaster?.booking || context?.bookingNumber || null,
      contenedor: resolvedContenedor,
      etd: kipinMaster?.etd || authenticCreatedAt,
      eta: kipinMaster?.eta || new Date(new Date(authenticCreatedAt).getTime() + 15 * 86400000).toISOString(),
      volumen_m3: catalogEntry?.volumen_m3 ?? 0,
      peso_kg: catalogEntry?.peso_kg ?? 0,
      bultos: catalogEntry?.bultos ?? 1,
      operador_id: '00000000-0000-0000-0000-000000000005',
      comercial_id: '00000000-0000-0000-0000-000000000006',
      costo_estimado_total: 0,
      venta_estimada_total: 0,
      margen_estimado: 0,
      moneda: 'USD',
      cierre_operativo: false,
      cierre_contable: false,
      estado_kipintoch: kipinMaster?.estadoKipintoch === 'House' ? 'HOUSE' : 'ORDEN_DE_VENTA',
      shipper_nombre: kipinMaster?.entidadExterior || null,
      transportista_nombre: kipinMaster?.transportista || null,
      cotizacion_vinculada_codigo: kipinMaster?.cotizacionCodigo || null,
      usuario_asignado: kipinMaster?.customer || kipinMaster?.vendedor || undefined,
      created_at: authenticCreatedAt,
      updated_at: authenticCreatedAt,
    };

    store.carpetas.unshift(newCarpeta);
    saveLiveStore(store);
  } else {
    let dirty = false;
    if (context?.emailDate) {
      const emailTime = new Date(context.emailDate).getTime();
      const existingTime = new Date(existingLocal.created_at).getTime();
      if (!isNaN(emailTime) && (isNaN(existingTime) || emailTime < existingTime)) {
        existingLocal.created_at = new Date(emailTime).toISOString();
        dirty = true;
      }
    }
    if (
      existingLocal.cliente_nombre.includes('Cliente COMEX') ||
      existingLocal.cliente_nombre.includes('Detectado vía Ingesta Gmail') ||
      existingLocal.cliente_nombre.includes('Hola ')
    ) {
      existingLocal.cliente_nombre = resolvedClient;
      if (resolvedCuit && existingLocal.cliente_cuit === '30-00000000-0') {
        existingLocal.cliente_cuit = resolvedCuit;
      }
      dirty = true;
    }
    if (
      existingLocal.origen.includes('Origen por Confirmar') ||
      existingLocal.origen.includes('Puerto Origen (Auto-Ingesta)')
    ) {
      existingLocal.origen = resolvedOrigin;
      dirty = true;
    }
    if (
      existingLocal.destino.includes('Destino por Confirmar') ||
      existingLocal.destino.includes('Puerto Destino (Auto-Ingesta)')
    ) {
      existingLocal.destino = resolvedDest;
      dirty = true;
    }
    if (resolvedBuque && !existingLocal.buque_vuelo) {
      existingLocal.buque_vuelo = resolvedBuque;
      dirty = true;
    }
    if (
      context?.blNumber &&
      /\d{3,}/.test(context.blNumber) &&
      (!existingLocal.hbl_hawb || !/\d{3,}/.test(existingLocal.hbl_hawb)) &&
      !existingLocal.mbl_mawb
    ) {
      existingLocal.hbl_hawb = context.blNumber;
      dirty = true;
    }
    if (context?.containerNumber && !existingLocal.contenedor) {
      existingLocal.contenedor = context.containerNumber;
      dirty = true;
    }
    if (context?.bookingNumber && !existingLocal.booking) {
      existingLocal.booking = context.bookingNumber;
      dirty = true;
    }
    if (dirty) {
      existingLocal.updated_at = new Date().toISOString();
      saveLiveStore(store);
    }
  }

  // 3. If remote Supabase is configured, ensure the carpeta exists in PostgreSQL and get its UUID
  if (isSupabaseRemoteConfigured()) {
    try {
      const supabaseAdmin = createAdminClient();
      const { data: existingDb } = await supabaseAdmin
        .from('carpetas')
        .select('id, numero_carpeta')
        .eq('numero_carpeta', resolvedCodigo)
        .maybeSingle();

      if (existingDb?.id) {
        resolvedUuid = existingDb.id;
      } else {
        const localFolder = store.carpetas.find((c) => c.numero_carpeta === resolvedCodigo);
        if (localFolder) {
          const { data: insertedDb } = await supabaseAdmin
            .from('carpetas')
            .upsert(
              {
                id: resolvedUuid,
                numero_carpeta: localFolder.numero_carpeta,
                numero_interno: localFolder.numero_interno,
                cliente_nombre: localFolder.cliente_nombre,
                cliente_cuit: localFolder.cliente_cuit,
                cliente_email: localFolder.cliente_email,
                area: localFolder.area,
                sector: localFolder.sector,
                estado: localFolder.estado,
                tipo_carga: localFolder.tipo_carga,
                origen: localFolder.origen,
                destino: localFolder.destino,
                hbl_hawb: localFolder.hbl_hawb,
                mbl_mawb: localFolder.mbl_mawb,
                booking: localFolder.booking,
                contenedor: localFolder.contenedor,
                moneda: localFolder.moneda,
                costo_estimado_total: localFolder.costo_estimado_total ?? 0,
                venta_estimada_total: localFolder.venta_estimada_total ?? 0,
              },
              { onConflict: 'numero_carpeta' }
            )
            .select('id')
            .maybeSingle();

          if (insertedDb?.id) {
            resolvedUuid = insertedDb.id;
          }
        }
      }
    } catch (err) {
      console.warn(`[LiveStore] Supabase carpeta lookup/upsert fallback for ${resolvedCodigo}:`, err);
    }
  }

  return { carpetaUuid: resolvedUuid, carpetaCodigo: resolvedCodigo };
}

/**
 * Attaches a MailMessage to a folder's evidencia_gmail array idempotently by mail.id.
 * If mail.date is earlier than folder.created_at, updates folder.created_at to the earlier timestamp.
 * Saves atomically to the live store.
 */
export function attachEmailToFolder(
  folderCodeOrId: string,
  mail: MailMessage
): CarpetaRecord | null {
  const store = loadLiveStore();
  const clean = folderCodeOrId.trim().toLowerCase();
  const folder = store.carpetas.find(
    (c) => c.id.toLowerCase() === clean || c.numero_carpeta.toLowerCase() === clean
  );
  if (!folder) return null;

  if (!Array.isArray(folder.evidencia_gmail)) {
    folder.evidencia_gmail = [];
  }

  // Idempotent insertion by Gmail message id
  const existingIdx = folder.evidencia_gmail.findIndex((m) => m.id === mail.id);
  if (existingIdx >= 0) {
    folder.evidencia_gmail[existingIdx] = {
      ...folder.evidencia_gmail[existingIdx],
      ...mail,
    };
  } else {
    folder.evidencia_gmail.push(mail);
  }

  // Update folder created_at if mail.date is earlier than existing created_at
  if (mail.date) {
    const mailTimestamp = new Date(mail.date).getTime();
    if (!isNaN(mailTimestamp)) {
      const currentCreatedTime = folder.created_at ? new Date(folder.created_at).getTime() : NaN;
      if (isNaN(currentCreatedTime) || mailTimestamp < currentCreatedTime) {
        folder.created_at = new Date(mailTimestamp).toISOString();
      }
    }
  }

  folder.updated_at = new Date().toISOString();
  saveLiveStore(store);
  return folder;
}

/**
 * Asynchronously replicates a persisted record into Supabase in background (non-blocking).
 * Guaranteed not to block the primary local atomic store write (<15ms response latency).
 */
export function scheduleSupabaseSync(table: string, payload: any): void {
  if (!isSupabaseRemoteConfigured()) return;

  // Background non-blocking execution (fire-and-forget)
  Promise.resolve().then(async () => {
    try {
      const supabaseAdmin = createAdminClient();
      if (table === 'carpetas') {
        const c = payload as CarpetaRecord;
        await (supabaseAdmin.from('carpetas') as any).upsert(
          {
            id: c.id,
            numero_carpeta: c.numero_carpeta,
            numero_interno: c.numero_interno,
            cliente_nombre: c.cliente_nombre,
            cliente_cuit: c.cliente_cuit,
            cliente_email: c.cliente_email,
            area: c.area,
            sector: c.sector,
            estado: c.estado,
            tipo_carga: c.tipo_carga,
            origen: c.origen,
            destino: c.destino,
            buque_vuelo: c.buque_vuelo,
            viaje: c.viaje,
            hbl_hawb: c.hbl_hawb,
            mbl_mawb: c.mbl_mawb,
            booking: c.booking,
            contenedor: c.contenedor,
            etd: c.etd,
            eta: c.eta,
            volumen_m3: c.volumen_m3 ?? 0,
            peso_kg: c.peso_kg ?? 0,
            bultos: c.bultos ?? 0,
            operador_id: c.operador_id ?? null,
            comercial_id: c.comercial_id ?? null,
            costo_estimado_total: c.costo_estimado_total ?? 0,
            costo_real_total: c.costo_real_total ?? 0,
            desvio_costo_usd: c.desvio_costo_usd ?? 0,
            venta_estimada_total: c.venta_estimada_total ?? 0,
            moneda: c.moneda ?? 'USD',
            cierre_operativo: c.cierre_operativo ?? false,
            cierre_contable: c.cierre_contable ?? false,
            estado_kipintoch: c.estado_kipintoch ?? 'ORDEN_DE_VENTA',
            modalidad_embarque: c.modalidad_embarque ?? null,
            tipo_operacion: c.tipo_operacion ?? null,
            shipper_nombre: c.shipper_nombre ?? null,
            consignee_nombre: c.consignee_nombre ?? null,
            transportista_nombre: c.transportista_nombre ?? null,
            customer_operador: (c as { customer_operador?: string }).customer_operador ?? c.usuario_asignado ?? null,
            usuario_responsable: c.usuario_asignado ?? null,
            cotizacion_vinculada_codigo: c.cotizacion_vinculada_codigo ?? null,
            modalidad_consolidacion: (c as { modalidad_consolidacion?: string }).modalidad_consolidacion ?? (c.modalidad_embarque === 'CONSOLIDADO' ? 'LCL' : 'FCL'),
            tipo_operacion_kipin: (c as { tipo_operacion_kipin?: string }).tipo_operacion_kipin ?? (c.tipo_operacion ?? 'DIRECTO'),
            costos_estimados: (c.costos_estimados as any) ?? [],
            checklist_progreso: (c.checklist_progreso as any) ?? {},
            evidencia_gmail: (c.evidencia_gmail as any) ?? [],
            actores_expediente: (c.actores_expediente as any) ?? [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'numero_carpeta' }
        );
      } else if (table === 'cotizaciones') {
        const q = payload as CotizacionRecord;
        await (supabaseAdmin.from('cotizaciones') as any).upsert(
          {
            id: q.id,
            numero_cotizacion: q.numeroCotizacion,
            cliente_nombre: q.clienteNombre,
            cliente_cuit: q.clienteCuit ?? null,
            cliente_email: q.contactoEmail ?? null,
            modalidad: q.via === 'AEREO' ? 'AEREO' : q.via === 'TERRESTRE' ? 'TERRESTRE' : 'MARITIMO',
            tipo_operacion: 'IMPORTACION',
            origen: q.origen,
            destino: q.destino,
            tipo_contenedor: q.via === 'MARITIMO_FCL' ? '40HQ' : 'LCL',
            naviera_aerolinea: (q as any).carrier ?? q.navieraOAerolineaSugerida ?? 'Varios',
            tarifa_flete_usd: q.fleteVentaUsd ?? 0,
            recargos_usd: 0,
            validez_tarifa_dias: q.vigenciaTarifaDias ?? (q as any).validezTarifaDias ?? 30,
            fecha_emision: q.fechaEmision || new Date().toISOString().slice(0, 10),
            fecha_vencimiento: q.fechaVencimientoTarifa ?? (q as any).fechaVencimiento ?? new Date().toISOString().slice(0, 10),
            estado: q.estado ?? 'COTIZADA',
            comercial_id: null,
            carpeta_id: q.carpetaOperativaId ?? null,
            propuesta_comercial_codigo: q.propuestaComercialCodigo ?? null,
            usuario_pricing: q.usuarioPricing ?? null,
            vendedor_nombre: q.vendedor ?? null,
            agente_proveedor: q.agenteTransportista ?? (q as any).proveedorNombre ?? null,
            cbm_total: q.cbmTotal ?? 0,
            peso_bruto_kg: q.pesoBrutoKg ?? 0,
            peso_tasable: q.pesoTasableKg ?? 0,
            cantidad_bultos: q.cantidadBultos ?? 0,
            sugerencia_equipo: q.sugerenciaEquipo ?? null,
            resumen_cubicaje: q.resumenCubicaje ?? null,
            bultos_detalle: (q as any).bultos ?? (q as any).cubicaje?.bultos ?? [],
            status_kipintoch: q.statusKipintoch ?? 'Pendiente',
            gmail_message_id: q.gmail_message_id ?? null,
            rfc_message_id: q.rfc_message_id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'numero_cotizacion' }
        );
      } else if (table === 'comprobantes') {
        const comp = payload as ComprobanteRecord & {
          carpeta_codigo?: string | null;
          gmail_message_id?: string | null;
          gmail_attachment_id?: string | null;
          sha256_hash?: string | null;
          source_mailbox?: string | null;
        };
        const validUuidCarpeta =
          comp.carpeta_id && UUID_REGEX.test(comp.carpeta_id)
            ? comp.carpeta_id
            : comp.carpeta_id
              ? (await resolveOrEnsureCarpetaUuid(comp.carpeta_id)).carpetaUuid
              : null;

        await supabaseAdmin.from('comprobantes').upsert(
          {
            id: comp.id,
            carpeta_id: validUuidCarpeta,
            carpeta_codigo: comp.carpeta_codigo ?? null,
            tipo_comprobante: comp.tipo_comprobante,
            direccion: comp.direccion,
            numero_comprobante: comp.numero_comprobante,
            emisor_cuit: comp.emisor_cuit,
            emisor_razon_social: comp.emisor_razon_social,
            proveedor_exterior: comp.proveedor_exterior,
            concepto_gasto: comp.concepto_gasto,
            clasificacion_gasto: comp.clasificacion_gasto,
            tipo_iva: comp.tipo_iva,
            categoria_fiscal: comp.categoria_fiscal,
            moneda: comp.moneda,
            tipo_cambio: comp.tipo_cambio,
            subtotal_neto: comp.subtotal_neto,
            alicuota_iva: comp.alicuota_iva,
            monto_iva: comp.monto_iva,
            monto_total: comp.monto_total,
            estado_pago: comp.estado_pago,
            fecha_emision: comp.fecha_emision,
            fecha_vencimiento: comp.fecha_vencimiento,
            score_confianza: comp.score_confianza,
            gmail_message_id: comp.gmail_message_id ?? null,
            gmail_attachment_id: comp.gmail_attachment_id ?? null,
            sha256_hash: comp.sha256_hash ?? null,
            source_mailbox: comp.source_mailbox ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } else if (table === 'eventos_tracking') {
        const ev = payload as TrackingEventRecord;
        await (supabaseAdmin.from('eventos_tracking') as any).upsert(
          {
            id: ev.id,
            carpeta_codigo: ev.carpeta_codigo,
            carpeta_id: ev.carpeta_id ?? null,
            tipo_evento: ev.tipo_evento,
            descripcion: (ev as { descripcion?: string }).descripcion ?? null,
            origen: (ev as { origen?: string }).origen ?? ev.pol ?? null,
            destino: (ev as { destino?: string }).destino ?? ev.pod ?? null,
            buque: ev.buque ?? null,
            carrier: ev.carrier ?? null,
            pol: ev.pol ?? null,
            pod: ev.pod ?? null,
            etd: ev.etd ?? null,
            eta: ev.eta ?? null,
            containers: (ev.containers as any) ?? [],
            mbl: ev.mbl ?? null,
            hbl: ev.hbl ?? null,
            raw_subject: ev.raw_subject ?? null,
            fecha_evento: ev.fecha_evento ?? new Date().toISOString(),
            gmail_message_id: ev.gmail_message_id ?? null,
          },
          { onConflict: 'id' }
        );
      }
    } catch (err) {
      console.warn(`[LiveStore:AsyncSync] Non-blocking sync failed for table ${table}:`, err);
    }
  }).catch((err) => {
    console.warn(`[LiveStore:AsyncSync] Background task failed for table ${table}:`, err);
  });
}

/**
 * Persists an ingested or created ComprobanteRecord into both the durable LiveStore and Supabase.
 */
export async function persistComprobanteRecord(
  comprobante: ComprobanteRecord & {
    carpeta_codigo?: string | null;
    gmail_message_id?: string | null;
    gmail_attachment_id?: string | null;
    sha256_hash?: string | null;
    source_mailbox?: string | null;
  },
  dedupeKey?: string
): Promise<{ savedToLocalStore: boolean; savedToSupabase: boolean; error?: string }> {
  const store = loadLiveStore();

  // Check duplicate by sha256 or id
  const existingIdx = store.comprobantes.findIndex(
    (c) =>
      c.id === comprobante.id ||
      (comprobante.sha256_hash &&
        (c as { sha256_hash?: string }).sha256_hash === comprobante.sha256_hash)
  );

  if (existingIdx >= 0) {
    store.comprobantes[existingIdx] = comprobante;
  } else {
    store.comprobantes.unshift(comprobante);
  }

  if (dedupeKey) {
    store.processedAttachmentKeys[dedupeKey] = comprobante.id;
  }
  if (comprobante.sha256_hash) {
    store.processedSha256Hashes[comprobante.sha256_hash] = comprobante.id;
  }

  saveLiveStore(store);

  let savedToSupabase = false;
  let dbErrorMsg: string | undefined;

  if (isSupabaseRemoteConfigured()) {
    try {
      const supabaseAdmin = createAdminClient();
      const validUuidCarpeta =
        comprobante.carpeta_id && UUID_REGEX.test(comprobante.carpeta_id)
          ? comprobante.carpeta_id
          : comprobante.carpeta_id
            ? (await resolveOrEnsureCarpetaUuid(comprobante.carpeta_id)).carpetaUuid
            : null;

      const { error } = await supabaseAdmin.from('comprobantes').upsert(
        {
          id: comprobante.id,
          carpeta_id: validUuidCarpeta,
          carpeta_codigo: comprobante.carpeta_codigo ?? null,
          tipo_comprobante: comprobante.tipo_comprobante,
          direccion: comprobante.direccion,
          numero_comprobante: comprobante.numero_comprobante,
          emisor_cuit: comprobante.emisor_cuit,
          emisor_razon_social: comprobante.emisor_razon_social,
          proveedor_exterior: comprobante.proveedor_exterior,
          concepto_gasto: comprobante.concepto_gasto,
          clasificacion_gasto: comprobante.clasificacion_gasto,
          tipo_iva: comprobante.tipo_iva,
          categoria_fiscal: comprobante.categoria_fiscal,
          moneda: comprobante.moneda,
          tipo_cambio: comprobante.tipo_cambio,
          subtotal_neto: comprobante.subtotal_neto,
          alicuota_iva: comprobante.alicuota_iva,
          monto_iva: comprobante.monto_iva,
          monto_total: comprobante.monto_total,
          estado_pago: comprobante.estado_pago,
          fecha_emision: comprobante.fecha_emision,
          fecha_vencimiento: comprobante.fecha_vencimiento,
          score_confianza: comprobante.score_confianza,
          gmail_message_id: comprobante.gmail_message_id ?? null,
          gmail_attachment_id: comprobante.gmail_attachment_id ?? null,
          sha256_hash: comprobante.sha256_hash ?? null,
          source_mailbox: comprobante.source_mailbox ?? null,
          metadata_raw: (comprobante.metadata_raw ?? {}) as Record<
            string,
            string | number | boolean | null
          >,
        },
        { onConflict: 'id' }
      );

      if (error) {
        dbErrorMsg = error.message;
        console.warn(`[LiveStore] Supabase comprobantes upsert warning:`, error.message);
      } else {
        savedToSupabase = true;
      }
    } catch (err) {
      dbErrorMsg = err instanceof Error ? err.message : String(err);
    }
  }

  // Trigger automatic recalculation of folder financials if linked to a folder
  if (comprobante.direccion === 'COMPRA' && (comprobante.carpeta_id || comprobante.carpeta_codigo)) {
    try {
      recalculateFolderFinancials(comprobante.carpeta_id || comprobante.carpeta_codigo!);
    } catch (err) {
      console.warn(`[LiveStore] Warning recalculating folder financials for ${comprobante.carpeta_id}:`, err);
    }
  }

  return {
    savedToLocalStore: true,
    savedToSupabase,
    error: dbErrorMsg,
  };
}

/**
 * Persists an operational shipping document (BL, Packing List, Proforma, LMAN, Aviso de Zarpe)
 * into `store.documentos` and Supabase `documentos`, preventing it from polluting `comprobantes`.
 */
export async function persistDocumentoRecord(
  documento: DocumentoRecord,
  dedupeKey?: string
): Promise<{ savedToLocalStore: boolean; savedToSupabase: boolean }> {
  const store = loadLiveStore();
  if (!Array.isArray(store.documentos)) {
    store.documentos = [];
  }

  const existingIdx = store.documentos.findIndex(
    (d) => d.id === documento.id || (documento.sha256_hash && d.sha256_hash === documento.sha256_hash)
  );

  if (existingIdx >= 0) {
    store.documentos[existingIdx] = documento;
  } else {
    store.documentos.unshift(documento);
  }

  if (dedupeKey) {
    store.processedAttachmentKeys[dedupeKey] = `DOC:${documento.id}`;
  }
  if (documento.sha256_hash) {
    store.processedSha256Hashes[documento.sha256_hash] = `DOC:${documento.id}`;
  }

  saveLiveStore(store);

  let savedToSupabase = false;
  if (isSupabaseRemoteConfigured()) {
    try {
      const supabaseAdmin = createAdminClient();
      const { error } = await supabaseAdmin.from('documentos').upsert(
        {
          id: documento.id,
          carpeta_id: documento.carpeta_id,
          nombre_archivo: documento.nombre_archivo,
          ruta_storage: documento.ruta_storage,
          tipo_mime: documento.tipo_mime,
          tamanio_bytes: documento.tamanio_bytes,
          sha256_hash: documento.sha256_hash,
          origen: documento.origen,
          estado_procesamiento: documento.estado_procesamiento,
          metadata_extraida: documento.metadata_extraida,
          subido_por: documento.subido_por,
          created_at: documento.created_at,
        },
        { onConflict: 'id' }
      );
      if (!error) savedToSupabase = true;
    } catch {
      // Non-blocking fallback to local disk store
    }
  }

  return { savedToLocalStore: true, savedToSupabase };
}

let cursorUpdateMutex: Promise<unknown> = Promise.resolve();

/**
 * Updates a mailbox's persistent cursor and metrics in both the local live store
 * and the remote Supabase `mailbox_sync_state` table.
 * Serialized through an in-process mutex to prevent concurrent write collisions across batch workers.
 */
export async function updateMailboxCursorState(
  email: string,
  patch: Partial<Omit<MailboxSyncStateRecord, 'email'>>
): Promise<MailboxSyncStateRecord> {
  const previousMutex = cursorUpdateMutex;
  let resolveCurrent: () => void = () => {};
  cursorUpdateMutex = new Promise<void>((resolve) => {
    resolveCurrent = resolve;
  });

  await previousMutex;
  try {
    memoryStoreCache = null;
    const store = loadLiveStore();
    const now = new Date().toISOString();
    const mbMeta = AUTHORIZED_ALMAR_MAILBOXES.find((m) => m.email === email);

    const current: MailboxSyncStateRecord = store.mailboxSyncState[email] ?? {
      email,
      nombre_responsable: mbMeta?.name ?? email,
      rol_operativo: mbMeta?.role ?? 'Operaciones',
      history_id: null,
      last_synced_at: null,
      last_message_date: null,
      messages_processed_total: 0,
      invoices_ingested_total: 0,
      emails_recibidos_total: 0,
      emails_respondidos_total: 0,
      emails_pendientes_respuesta: 0,
      tiempo_respuesta_promedio_min: 0,
      status: 'ACTIVE',
      last_error: null,
      watch_expiration: null,
      consecutive_failures: 0,
      updated_at: now,
    };

    const updated: MailboxSyncStateRecord = {
      ...current,
      ...patch,
      email,
      updated_at: now,
    };

    store.mailboxSyncState[email] = updated;
    saveLiveStore(store);

    if (isSupabaseRemoteConfigured()) {
      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.from('mailbox_sync_state').upsert(
          {
            email: updated.email,
            nombre_responsable: updated.nombre_responsable,
            rol_operativo: updated.rol_operativo,
            history_id: updated.history_id,
            last_synced_at: updated.last_synced_at,
            last_message_date: updated.last_message_date,
            messages_processed_total: updated.messages_processed_total,
            invoices_ingested_total: updated.invoices_ingested_total,
            status: updated.status,
            last_error: updated.last_error,
            watch_expiration: updated.watch_expiration,
            consecutive_failures: updated.consecutive_failures,
            updated_at: updated.updated_at,
          },
          { onConflict: 'email' }
        );
      } catch {
        // Non-blocking fallback to local disk store
      }
    }

    return updated;
  } finally {
    resolveCurrent!();
  }
}

/**
 * Returns all 18 mailbox sync state records ordered by least-recently synced first (for round-robin batching).
 */
export function getMailboxSyncStatesOrdered(): MailboxSyncStateRecord[] {
  const store = loadLiveStore();
  const states = Object.values(store.mailboxSyncState);
  return states.sort((a, b) => {
    if (!a.last_synced_at && !b.last_synced_at) return 0;
    if (!a.last_synced_at) return -1;
    if (!b.last_synced_at) return 1;
    return new Date(a.last_synced_at).getTime() - new Date(b.last_synced_at).getTime();
  });
}

/**
 * Persists a newly created or updated CarpetaRecord into LiveStore.
 */
export function persistCarpetaRecord(carpeta: CarpetaRecord): CarpetaRecord {
  const store = loadLiveStore();
  const idx = store.carpetas.findIndex(
    (c) =>
      c.id === carpeta.id ||
      c.numero_carpeta.toUpperCase() === carpeta.numero_carpeta.toUpperCase()
  );
  if (idx >= 0) {
    store.carpetas[idx] = carpeta;
  } else {
    store.carpetas.unshift(carpeta);
  }
  saveLiveStore(store);
  scheduleSupabaseSync('carpetas', carpeta);
  return carpeta;
}

/**
 * Updates an existing CarpetaRecord in LiveStore by id or numero_carpeta.
 */
export function updateCarpetaInStore(
  idOrCode: string,
  patch: Partial<CarpetaRecord>
): CarpetaRecord | null {
  const store = loadLiveStore();
  const clean = idOrCode.trim().toLowerCase();
  const idx = store.carpetas.findIndex(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.numero_carpeta.toLowerCase() === clean ||
      (c.numero_interno && c.numero_interno.toLowerCase() === clean)
  );
  if (idx < 0) return null;

  const existing = store.carpetas[idx]!;
  const updated: CarpetaRecord = {
    ...existing,
    ...patch,
    checklist_progreso: patch.checklist_progreso
      ? { ...(existing.checklist_progreso ?? {}), ...patch.checklist_progreso }
      : existing.checklist_progreso,
    updated_at: new Date().toISOString(),
  };
  store.carpetas[idx] = updated;
  saveLiveStore(store);
  scheduleSupabaseSync('carpetas', updated);
  return updated;
}

/**
 * Deletes a CarpetaRecord from LiveStore by id or numero_carpeta.
 */
export function deleteCarpetaFromStore(idOrCode: string): CarpetaRecord | null {
  const store = loadLiveStore();
  const clean = idOrCode.trim().toLowerCase();
  const idx = store.carpetas.findIndex(
    (c) => c.id.toLowerCase() === clean || c.numero_carpeta.toLowerCase() === clean
  );
  if (idx < 0) return null;
  const [removed] = store.carpetas.splice(idx, 1);
  saveLiveStore(store);
  return removed ?? null;
}

/**
 * Updates an existing ComprobanteRecord in LiveStore by id or numero_comprobante.
 * Automatically recalculates folder financials and resolves FACTURA_SIN_CARPETA alerts.
 */
export function updateComprobanteInStore(
  idOrNumber: string,
  patch: Partial<ComprobanteRecord> & Record<string, unknown>
): ComprobanteRecord | null {
  const store = loadLiveStore();
  const clean = idOrNumber.trim().toLowerCase();
  const idx = store.comprobantes.findIndex(
    (c) => c.id.toLowerCase() === clean || c.numero_comprobante.toLowerCase() === clean
  );
  if (idx < 0) return null;

  const existing = store.comprobantes[idx]!;
  const resolvedPatch = { ...patch };
  const oldFolderId = existing.carpeta_id;
  const oldFolderCode = (existing as { carpeta_codigo?: string }).carpeta_codigo;

  // If carpeta_codigo is passed without carpeta_id, resolve folder
  if (typeof patch.carpeta_codigo === 'string' && patch.carpeta_codigo.trim() !== '' && !patch.carpeta_id) {
    const codeClean = patch.carpeta_codigo.trim().toLowerCase();
    const matchedFolder = store.carpetas.find(
      (f) =>
        f.numero_carpeta.toLowerCase() === codeClean ||
        f.id.toLowerCase() === codeClean ||
        (f.numero_interno && f.numero_interno.toLowerCase() === codeClean)
    );
    if (matchedFolder) {
      resolvedPatch.carpeta_id = matchedFolder.id;
      resolvedPatch.carpeta_codigo = matchedFolder.numero_carpeta;
    }
  }

  // If carpeta_id is provided as a folder code (e.g. "C1434") or UUID, resolve to UUID and set carpeta_codigo
  if (typeof patch.carpeta_id === 'string' && patch.carpeta_id.trim() !== '') {
    const idClean = patch.carpeta_id.trim().toLowerCase();
    const matchedFolder = store.carpetas.find(
      (f) =>
        f.id.toLowerCase() === idClean ||
        f.numero_carpeta.toLowerCase() === idClean ||
        (f.numero_interno && f.numero_interno.toLowerCase() === idClean)
    );
    if (matchedFolder) {
      resolvedPatch.carpeta_id = matchedFolder.id;
      resolvedPatch.carpeta_codigo = matchedFolder.numero_carpeta;
    }
  }

  // If assigned to a folder, move out of ingesta and resolve FACTURA_SIN_CARPETA alerts
  if (resolvedPatch.carpeta_id) {
    if ((existing as { estado_workflow?: string }).estado_workflow === 'ingesta') {
      (resolvedPatch as { estado_workflow?: string }).estado_workflow = 'vinculada';
    }
    const compId = existing.id;
    const compNum = existing.numero_comprobante;
    for (const alerta of store.alertas) {
      if (
        alerta.tipo === 'FACTURA_SIN_CARPETA' &&
        !alerta.resuelta &&
        (alerta.comprobante_id === compId || alerta.comprobante_id === compNum || alerta.id.includes(compNum))
      ) {
        alerta.resuelta = true;
        alerta.resolucion_accion = `Factura asignada a carpeta ${resolvedPatch.carpeta_codigo || resolvedPatch.carpeta_id}`;
        alerta.resuelta_at = new Date().toISOString();
        alerta.updated_at = new Date().toISOString();
      }
    }
  }

  const updated: ComprobanteRecord = {
    ...existing,
    ...resolvedPatch,
    updated_at: new Date().toISOString(),
  } as ComprobanteRecord;

  store.comprobantes[idx] = updated;
  saveLiveStore(store);
  scheduleSupabaseSync('comprobantes', updated);

  // Recalculate target folder financials and old folder if changed
  if (typeof resolvedPatch.carpeta_id === 'string' && resolvedPatch.carpeta_id.trim() !== '') {
    recalculateFolderFinancials(resolvedPatch.carpeta_id);
  }
  if (oldFolderId && oldFolderId !== resolvedPatch.carpeta_id) {
    recalculateFolderFinancials(oldFolderId);
  } else if (oldFolderCode && oldFolderCode !== resolvedPatch.carpeta_codigo && !oldFolderId) {
    recalculateFolderFinancials(oldFolderCode);
  }

  return updated;
}

/**
 * Creates a new operational folder (Orden de venta) from an accepted / confirmed quotation,
 * assigns correlative code (e.g. C1772), links bidirectionally, and persists to LiveStore.
 */
export function crearCarpetaDesdeCotizacionInStore(
  cotizacionIdOrNum: string
): { cotizacion: CotizacionRecord; carpeta: CarpetaRecord } | null {
  const store = loadLiveStore();
  const clean = cotizacionIdOrNum.trim().toLowerCase();
  const cot = store.cotizaciones.find(
    (c) => c.id.toLowerCase() === clean || c.numeroCotizacion.toLowerCase() === clean
  );
  if (!cot) return null;

  // Determine correlative code (find max C#### in existing folders)
  let maxNum = 1771;
  for (const carp of store.carpetas) {
    const match = carp.numero_carpeta.match(/^C(\d+)$/i);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  const nextNum = maxNum + 1;
  const nextCode = `C${nextNum}`;
  const newFolderId = `carpeta-${nextCode.toLowerCase()}-${Date.now()}`;

  const areaMap: Record<string, 'MARITIMO' | 'AEREO' | 'TERRESTRE'> = {
    MARITIMO_FCL: 'MARITIMO',
    MARITIMO_LCL: 'MARITIMO',
    AEREO: 'AEREO',
    TERRESTRE: 'TERRESTRE',
  };
  const area = areaMap[cot.via] || 'MARITIMO';
  const tipoCarga = cot.via === 'MARITIMO_FCL' ? 'FCL' : cot.via === 'MARITIMO_LCL' ? 'LCL' : 'CARGA_SUELTA';
  const tipoOperacion: CarpetaRecord['tipo_operacion'] =
    cot.via === 'MARITIMO_FCL' ? 'FCL - FCL' : cot.via === 'MARITIMO_LCL' ? 'LCL - LCL' : 'FTL';

  const nuevaCarpeta: CarpetaRecord = {
    id: newFolderId,
    numero_carpeta: nextCode,
    numero_interno: nextCode,
    cliente_nombre: cot.clienteNombre,
    cliente_cuit: cot.clienteCuit || '30-70000000-9',
    area,
    sector: 'IMPORTACION',
    tipo_carga: tipoCarga,
    estado: 'EN_TRANSITO',
    estado_kipintoch: 'Orden de venta',
    origen: cot.origen,
    destino: cot.destino,
    buque_vuelo: null,
    viaje: null,
    hbl_hawb: null,
    mbl_mawb: null,
    booking: null,
    contenedor: null,
    etd: null,
    eta: null,
    operador_id: null,
    comercial_id: null,
    cliente_email: cot.contactoEmail || null,
    modalidad_embarque: cot.via === 'MARITIMO_FCL' ? 'DIRECTA' : 'CONSOLIDADO',
    tipo_operacion: tipoOperacion,
    cotizacion_vinculada_id: cot.id,
    cotizacion_vinculada_codigo: cot.numeroCotizacion,
    costo_estimado_total: cot.fleteCostoEstimadoUsd || 0,
    costo_estimado_flete: cot.fleteCostoEstimadoUsd || 0,
    venta_estimada_total: cot.fleteVentaUsd || 0,
    venta_estimada_flete: cot.fleteVentaUsd || 0,
    costo_real_total: 0,
    desvio_costo_usd: 0,
    margen_estimado: Math.round(((cot.fleteVentaUsd || 0) - (cot.fleteCostoEstimadoUsd || 0)) * 100) / 100,
    moneda: 'USD',
    checklist_progreso: {},
    volumen_m3: cot.cbmTotal || 0,
    peso_kg: cot.pesoBrutoKg || 0,
    bultos: cot.cantidadBultos || 1,
    cierre_operativo: false,
    cierre_contable: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.carpetas.unshift(nuevaCarpeta);

  // Update quote
  cot.carpetaOperativaId = nuevaCarpeta.id;
  cot.carpetaCodigo = nuevaCarpeta.numero_carpeta;
  cot.carpetaNumeroInterno = nuevaCarpeta.numero_carpeta;
  cot.statusKipintoch = 'Confirmada';
  cot.estado = 'GANADA';
  cot.updated_at = new Date().toISOString();

  saveLiveStore(store);

  return { cotizacion: cot, carpeta: nuevaCarpeta };
}

/**
 * Persists a new or updated AlertaRecord in LiveStore.
 */
export function persistAlertaRecord(alerta: AlertaRecord): AlertaRecord {
  const store = loadLiveStore();
  const idx = store.alertas.findIndex((a) => a.id === alerta.id);
  if (idx >= 0) {
    store.alertas[idx] = alerta;
  } else {
    store.alertas.unshift(alerta);
  }
  saveLiveStore(store);
  return alerta;
}

/**
 * Updates/resolves an existing AlertaRecord in LiveStore by id.
 */
export function resolveAlertaInStore(
  id: string,
  patch: Partial<AlertaRecord>
): AlertaRecord | null {
  const store = loadLiveStore();
  const idx = store.alertas.findIndex((a) => a.id === id);
  if (idx < 0) return null;

  const existing = store.alertas[idx]!;
  const updated: AlertaRecord = {
    ...existing,
    ...patch,
  };
  store.alertas[idx] = updated;
  saveLiveStore(store);
  return updated;
}

/**
 * Persists a new or updated EventoRecord in LiveStore.
 */
export function persistEventoRecord(evento: EventoRecord): EventoRecord {
  const store = loadLiveStore();
  const idx = store.eventos.findIndex((e) => e.id === evento.id);
  if (idx >= 0) {
    store.eventos[idx] = evento;
  } else {
    store.eventos.unshift(evento);
  }
  saveLiveStore(store);
  return evento;
}

/**
 * Persists a tracking event record into LiveStore and schedules Supabase sync.
 */
export function persistTrackingEventRecord(evento: TrackingEventRecord): TrackingEventRecord {
  const store = loadLiveStore();
  if (!Array.isArray(store.eventos_tracking)) {
    store.eventos_tracking = [];
  }
  const idx = store.eventos_tracking.findIndex((e) => e.id === evento.id);
  if (idx >= 0) {
    store.eventos_tracking[idx] = evento;
  } else {
    store.eventos_tracking.unshift(evento);
  }
  saveLiveStore(store);
  scheduleSupabaseSync('eventos_tracking', evento);
  return evento;
}


/**
 * Persists a new or updated CotizacionRecord in LiveStore.
 */
export function persistCotizacionRecord(cotizacion: CotizacionRecord): CotizacionRecord {
  const store = loadLiveStore();
  const idx = store.cotizaciones.findIndex(
    (c) => c.id === cotizacion.id || c.numeroCotizacion === cotizacion.numeroCotizacion
  );
  if (idx >= 0) {
    store.cotizaciones[idx] = cotizacion;
  } else {
    store.cotizaciones.unshift(cotizacion);
  }
  saveLiveStore(store);
  scheduleSupabaseSync('cotizaciones', cotizacion);
  return cotizacion;
}

/**
 * Updates an existing CotizacionRecord in LiveStore by id or numeroCotizacion.
 */
export function updateCotizacionInStore(
  idOrNumero: string,
  patch: Partial<CotizacionRecord>
): CotizacionRecord | null {
  const store = loadLiveStore();
  const clean = idOrNumero.trim().toLowerCase();
  const idx = store.cotizaciones.findIndex(
    (c) =>
      c.id.toLowerCase() === clean || c.numeroCotizacion.toLowerCase() === clean
  );
  if (idx < 0) return null;

  const existing = store.cotizaciones[idx]!;
  const updated: CotizacionRecord = {
    ...existing,
    ...patch,
  };
  store.cotizaciones[idx] = updated;
  saveLiveStore(store);
  scheduleSupabaseSync('cotizaciones', updated);
  return updated;
}

/**
 * Checks if a commercial quote has already been ingested in LiveStore.
 * Provides multi-mailbox cross-copy idempotency using gmail_message_id, rfc_message_id,
 * and subject/date combination.
 */
export function isQuoteAlreadyIngested(params: {
  messageId?: string;
  rfcMessageId?: string;
  subject?: string;
  date?: string;
}): boolean {
  const store = loadLiveStore();
  return store.cotizaciones.some((c) => {
    if (params.messageId && c.gmail_message_id && c.gmail_message_id === params.messageId) {
      return true;
    }
    if (params.rfcMessageId && c.rfc_message_id && c.rfc_message_id === params.rfcMessageId) {
      return true;
    }
    if (
      params.subject &&
      params.date &&
      c.fechaEmision === params.date &&
      (c.notasComerciales?.includes(params.subject) ||
        ((c as unknown as Record<string, unknown>).notas as string | undefined)?.includes(params.subject))
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Appends an immutable ISO 9001 AuditLogRecord to LiveStore.
 */
export function appendAuditLogToStore(entry: AuditLogRecord): void {
  const store = loadLiveStore();
  if (!store.auditLogs.some((l) => l.id === entry.id)) {
    store.auditLogs.unshift(entry);
    if (store.auditLogs.length > 500) {
      store.auditLogs.length = 500;
    }
    saveLiveStore(store);
  }
}

export const OPERATIONAL_ARS_USD_RATE = 1250.0;
export const OPERATIONAL_GBP_USD_RATE = 1.3628;
export const OPERATIONAL_EUR_USD_RATE = 1.08;

/**
 * Converts a purchase voucher amount to USD using operational exchange rates.
 * Credit notes return negative values to subtract from total cost.
 */
export function convertVoucherToUsd(comp: ComprobanteRecord): number {
  const isCreditNote =
    comp.tipo_comprobante === 'CREDIT_NOTE' ||
    (comp.tipo_comprobante as string) === 'NOTA_CREDITO';
  const sign = isCreditNote ? -1 : 1;
  const rawTotal = comp.monto_total ?? comp.subtotal_neto ?? 0;

  if (comp.moneda === 'USD') {
    return sign * rawTotal;
  }

  if (comp.moneda === 'ARS') {
    const rate = comp.tipo_cambio && comp.tipo_cambio > 10 ? comp.tipo_cambio : OPERATIONAL_ARS_USD_RATE;
    return sign * (rawTotal / rate);
  }

  if (comp.moneda === 'GBP') {
    const rate = comp.tipo_cambio && comp.tipo_cambio > 0 ? comp.tipo_cambio : OPERATIONAL_GBP_USD_RATE;
    return sign * (rawTotal * rate);
  }

  if (comp.moneda === 'EUR') {
    const rate = comp.tipo_cambio && comp.tipo_cambio > 0 ? comp.tipo_cambio : OPERATIONAL_EUR_USD_RATE;
    return sign * (rawTotal * rate);
  }

  const fallbackRate = comp.tipo_cambio && comp.tipo_cambio > 0 ? comp.tipo_cambio : 1.0;
  return sign * (rawTotal * fallbackRate);
}

/**
 * Automatically recalculates folder financials (costo_estimado_total and margen_estimado)
 * based on all live COMPRA comprobantes associated with this folder.
 * 
 * Business Rules:
 * 1. Sum all approved/received purchase invoices associated with carpeta_id into costo_estimado_total.
 * 2. Contrast against venta_estimada_total (auto-populating from linked Cotizacion if unset).
 * 3. margen_estimado = venta_estimada_total - costo_estimado_total.
 * 4. Margin alerts:
 *    - if margin < $3.00 USD: flag BLOQUEADA_RENTABILIDAD_NEGATIVA and raise CRITICAL alert.
 *    - if $3.00 <= margin < $200.00 USD: unblock and raise WARNING operational minimum margin alert.
 *    - if margin >= $200.00 USD: resolve active margin critical alerts.
 */
export function recalculateFolderFinancials(carpetaIdOrCode: string): CarpetaRecord | null {
  const store = loadLiveStore();
  const clean = carpetaIdOrCode.trim().toLowerCase();
  const folder = store.carpetas.find(
    (c) => c.id.toLowerCase() === clean || c.numero_carpeta.toLowerCase() === clean
  );
  if (!folder) return null;

  // 1. Gather all received purchase invoices for this folder (excluding rejected)
  const folderComprobantes = store.comprobantes.filter(
    (c) =>
      (c.carpeta_id === folder.id ||
        (c.carpeta_codigo && c.carpeta_codigo.toLowerCase() === folder.numero_carpeta.toLowerCase())) &&
      c.direccion === 'COMPRA' &&
      c.estado_pago !== 'RECHAZADO'
  );

  // 2. Sum costs
  const isArsFolder = folder.moneda === 'ARS';
  const totalCost = folderComprobantes.reduce((sum, comp) => {
    if (isArsFolder) {
      if (comp.moneda === 'ARS') {
        const isCreditNote =
          comp.tipo_comprobante === 'CREDIT_NOTE' || (comp.tipo_comprobante as string) === 'NOTA_CREDITO';
        const sign = isCreditNote ? -1 : 1;
        return sum + sign * (comp.monto_total || comp.subtotal_neto || 0);
      }
      return sum + convertVoucherToUsd(comp) * OPERATIONAL_ARS_USD_RATE;
    }
    return sum + convertVoucherToUsd(comp);
  }, 0);
  folder.costo_real_total = Math.round(totalCost * 100) / 100;

  // 3. Calculate Estimated Costs from Kipintoch (if costos_estimados present)
  const estimatedItems = folder.costos_estimados ?? [];
  const totalEstimatedUsd = estimatedItems.reduce((acc, item) => acc + (item.monto_usd ?? 0), 0);
  if (totalEstimatedUsd > 0) {
    if (isArsFolder) {
      const totalEstimatedArs = estimatedItems.reduce((acc, item) => {
        if (item.moneda === 'ARS' && item.monto > 0) {
          return acc + item.monto;
        }
        return acc + (item.monto_usd ?? 0) * OPERATIONAL_ARS_USD_RATE;
      }, 0);
      folder.costo_estimado_total = Math.round(totalEstimatedArs * 100) / 100;
    } else {
      folder.costo_estimado_total = Math.round(totalEstimatedUsd * 100) / 100;
    }
  } else {
    folder.costo_estimado_total = folder.costo_real_total;
  }

  // 4. Calculate cost deviation (Real - Estimado) in USD
  folder.desvio_costo_usd = isArsFolder
    ? Math.round((((folder.costo_real_total ?? 0) - (folder.costo_estimado_total ?? 0)) / OPERATIONAL_ARS_USD_RATE) * 100) / 100
    : Math.round(((folder.costo_real_total ?? 0) - (folder.costo_estimado_total ?? 0)) * 100) / 100;

  // 5. Line-by-line reconciliation of estimated items vs real invoices
  for (const est of estimatedItems) {
    const matchingInv = folderComprobantes.find((inv) => {
      if (!inv.emisor_razon_social || !est.proveedor_nombre) return false;
      const invName = inv.emisor_razon_social.toLowerCase();
      const estName = est.proveedor_nombre.toLowerCase();
      return (
        invName.includes(estName.slice(0, 8)) ||
        estName.includes(invName.slice(0, 8))
      );
    });

    if (matchingInv) {
      est.comprobante_real_id = matchingInv.id;
      est.monto_real_facturado_usd = Math.round(convertVoucherToUsd(matchingInv) * 100) / 100;
      est.desvio_usd = Math.round((est.monto_real_facturado_usd - est.monto_usd) * 100) / 100;
      est.estado_conciliacion = Math.abs(est.desvio_usd) < 1.0 ? 'CONCILIADO_EXACTO' : 'CONCILIADO_CON_DESVIO';
    } else {
      est.estado_conciliacion = 'PENDIENTE_FACTURA';
    }
  }

  // 6. Contrast against commercial quotation if folder venta_estimada_total is 0 or unset
  if (!folder.venta_estimada_total || folder.venta_estimada_total <= 0) {
    const linkedQuote = store.cotizaciones.find(
      (q) =>
        (q.carpetaOperativaId && q.carpetaOperativaId.toLowerCase() === folder.id.toLowerCase()) ||
        (q.carpetaCodigo && q.carpetaCodigo.toLowerCase() === folder.numero_carpeta.toLowerCase()) ||
        (q.numeroCotizacion && q.numeroCotizacion.toLowerCase() === folder.numero_carpeta.toLowerCase())
    );
    if (linkedQuote && linkedQuote.fleteVentaUsd > 0) {
      folder.venta_estimada_total = linkedQuote.fleteVentaUsd;
    }
  }

  // 7. Calculate Margin (contrasting against actual costs if available, otherwise against estimated costs)
  if (!folder.venta_estimada_total || folder.venta_estimada_total <= 0) {
    folder.margen_estimado = 0;
  } else {
    const costForMargin = (folder.costo_real_total && folder.costo_real_total > 0)
      ? folder.costo_real_total
      : folder.costo_estimado_total;
    folder.margen_estimado =
      Math.round(((folder.venta_estimada_total ?? 0) - costForMargin) * 100) / 100;
  }

  // 8. Cost Overrun Alert Trigger (> USD 50 deviation vs Kipintoch budget)
  const existingDesvioAlert = store.alertas.find(
    (a) => a.carpeta_id === folder.id && a.tipo === 'DESVIO_COSTO' && !a.resuelta
  );

  if ((folder.desvio_costo_usd ?? 0) > 50 && folder.costo_estimado_total > 0) {
    const alertId = existingDesvioAlert ? existingDesvioAlert.id : `alerta-desvio-costo-${folder.id}`;
    const alertRecord: AlertaRecord = {
      id: alertId,
      carpeta_id: folder.id,
      comprobante_id: null,
      tipo: 'DESVIO_COSTO',
      severidad: 'CRITICAL',
      titulo: `Sobrecosto Detectado vs Kipintoch: Carpeta ${folder.numero_carpeta}`,
      mensaje: `Facturas reales superan en USD ${(folder.desvio_costo_usd ?? 0).toFixed(2)} al estimado ingresado en Kipintoch (Estimado: USD ${folder.costo_estimado_total} vs Facturado: USD ${folder.costo_real_total}).`,
      leida: false,
      resuelta: false,
      resolucion_accion: null,
      resuelta_por: null,
      resuelta_at: null,
      created_at: existingDesvioAlert ? existingDesvioAlert.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const alertIdx = store.alertas.findIndex((a) => a.id === alertId);
    if (alertIdx >= 0) {
      store.alertas[alertIdx] = alertRecord;
    } else {
      store.alertas.unshift(alertRecord);
    }
  } else if (existingDesvioAlert && (folder.desvio_costo_usd ?? 0) <= 50) {
    existingDesvioAlert.resuelta = true;
    existingDesvioAlert.resolucion_accion = 'Desvío de costo resuelto dentro del rango aceptable.';
    existingDesvioAlert.resuelta_at = new Date().toISOString();
    existingDesvioAlert.updated_at = new Date().toISOString();
  }

  // 5. Margin Alert & Locking Evaluation
  const existingCriticalAlert = store.alertas.find(
    (a) => a.carpeta_id === folder.id && a.tipo === 'MARGEN_CRITICO' && !a.resuelta
  );

  if (!folder.venta_estimada_total || folder.venta_estimada_total <= 0) {
    folder.margen_estimado = 0;
    if (folder.estado === 'BLOQUEADA_RENTABILIDAD_NEGATIVA') {
      folder.estado = 'COTIZACION_PENDIENTE';
    }
    if (existingCriticalAlert) {
      existingCriticalAlert.resuelta = true;
      existingCriticalAlert.resolucion_accion = 'Tarifa de venta pendiente de cotización.';
      existingCriticalAlert.resuelta_at = new Date().toISOString();
      existingCriticalAlert.updated_at = new Date().toISOString();
    }
  } else {
    const marginThresholdStrict = isArsFolder ? 3.0 * OPERATIONAL_ARS_USD_RATE : 3.0;
    const marginThresholdWarn = isArsFolder ? 200.0 * OPERATIONAL_ARS_USD_RATE : 200.0;

    if (folder.margen_estimado < marginThresholdStrict) {
      // Threshold 1: Strict Blocking (< $3.00 USD equivalent)
      if (
        folder.estado !== 'CERRADO_OPERATIVO' &&
        folder.estado !== 'CERRADO_CONTABLE' &&
        !folder.rentabilidad_autorizada
      ) {
        folder.estado = 'BLOQUEADA_RENTABILIDAD_NEGATIVA';
      }

      const alertId = existingCriticalAlert ? existingCriticalAlert.id : `alerta-margen-critico-${folder.id}`;
      const alertRecord: AlertaRecord = {
        id: alertId,
        carpeta_id: folder.id,
        comprobante_id: null,
        tipo: 'MARGEN_CRITICO',
        severidad: 'CRITICAL',
        titulo: `Bloqueo de Rentabilidad Negativa: Carpeta ${folder.numero_carpeta}`,
        mensaje: isArsFolder
          ? `Margen resultante ARS ${folder.margen_estimado.toFixed(2)} es inferior al umbral de seguridad de ARS ${marginThresholdStrict.toFixed(2)} (BLOQUEADA_RENTABILIDAD_NEGATIVA). Requiere autorización formal de Gerencia.`
          : `Margen resultante USD ${folder.margen_estimado.toFixed(2)} es inferior al umbral de seguridad de USD 3.00 (BLOQUEADA_RENTABILIDAD_NEGATIVA). Requiere autorización formal de Gerencia.`,
        leida: false,
        resuelta: false,
        resolucion_accion: null,
        resuelta_por: null,
        resuelta_at: null,
        created_at: existingCriticalAlert ? existingCriticalAlert.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const alertIdx = store.alertas.findIndex((a) => a.id === alertId);
      if (alertIdx >= 0) {
        store.alertas[alertIdx] = alertRecord;
      } else {
        store.alertas.unshift(alertRecord);
      }
    } else if (folder.margen_estimado < marginThresholdWarn) {
      // Threshold 2: Operational Minimum Margin Warning (< $200.00 USD equivalent)
      if (folder.estado === 'BLOQUEADA_RENTABILIDAD_NEGATIVA') {
        folder.estado = 'EN_TRANSITO';
      }

      const alertId = existingCriticalAlert ? existingCriticalAlert.id : `alerta-margen-minimo-${folder.id}`;
      const alertRecord: AlertaRecord = {
        id: alertId,
        carpeta_id: folder.id,
        comprobante_id: null,
        tipo: 'MARGEN_CRITICO',
        severidad: 'WARNING',
        titulo: `Alerta de Margen Operativo Mínimo (< USD 200): Carpeta ${folder.numero_carpeta}`,
        mensaje: isArsFolder
          ? `Margen estimado de ARS ${folder.margen_estimado.toFixed(2)} (< ARS ${marginThresholdWarn.toFixed(2)} - Directiva Vanesa Meggiolaro). Riesgo de descalce ante recargos de terminal o demoras.`
          : `Margen estimado de USD ${folder.margen_estimado.toFixed(2)} (< USD 200.00 - Directiva Vanesa Meggiolaro). Riesgo de descalce ante recargos de terminal o demoras.`,
        leida: false,
        resuelta: false,
        resolucion_accion: null,
        resuelta_por: null,
        resuelta_at: null,
        created_at: existingCriticalAlert ? existingCriticalAlert.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const alertIdx = store.alertas.findIndex((a) => a.id === alertId);
      if (alertIdx >= 0) {
        store.alertas[alertIdx] = alertRecord;
      } else {
        store.alertas.unshift(alertRecord);
      }
    } else {
      // Threshold 3: Healthy Margin (>= $200.00 USD)
      if (folder.estado === 'BLOQUEADA_RENTABILIDAD_NEGATIVA') {
        folder.estado = 'EN_TRANSITO';
      }

      if (existingCriticalAlert) {
        existingCriticalAlert.resuelta = true;
        existingCriticalAlert.resolucion_accion = `Margen recalculado a nivel saludable: USD ${folder.margen_estimado.toFixed(2)}`;
        existingCriticalAlert.resuelta_at = new Date().toISOString();
        existingCriticalAlert.updated_at = new Date().toISOString();
      }
    }
  }

  folder.updated_at = new Date().toISOString();
  saveLiveStore(store);
  return folder;
}

/**
 * Normalizes subject for conversation matching across replies and forwards.
 */
export function normalizeSubjectForMatching(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(?:(?:re|fwd|fw|rv|aw|回复)\s*:\s*)+/gi, '')
    .trim()
    .toLowerCase();
}

/**
 * Classifies an email interaction as INBOUND or OUTBOUND_REPLY.
 */
export function classifyMessageDirection(
  msg: { from: string; to?: string | string[]; labels?: string[] },
  mailboxEmail?: string
): EmailInteractionDirection {
  const fromClean = (msg.from || '').toLowerCase();
  const isViaGroup = /\bvia\s+[^<]*<[^>]+@almarrosario\.com>/i.test(msg.from || '');
  const isAlmarSender = fromClean.includes('@almarrosario.com') && !isViaGroup;
  const hasSentLabel = Array.isArray(msg.labels) && msg.labels.includes('SENT');

  if (isAlmarSender || hasSentLabel) {
    return 'OUTBOUND_REPLY';
  }
  return 'INBOUND';
}

/**
 * Matches an OUTBOUND_REPLY against earlier INBOUND messages to record response SLA.
 */
export function matchAndRecordEmailReply(
  store: LiveStoreData,
  replyMsg: {
    id: string;
    threadId: string;
    from: string;
    date: string;
    subject: string;
    rawHeaders?: Record<string, string>;
    carpetaCodigo?: string | null;
  }
): EmailInteractionRecord | null {
  if (!Array.isArray(store.interacciones_email)) {
    store.interacciones_email = [];
    return null;
  }

  const replyTime = new Date(replyMsg.date).getTime();
  const normalizedReplySubject = normalizeSubjectForMatching(replyMsg.subject);
  const inReplyToHeader = replyMsg.rawHeaders?.['in-reply-to']?.replace(/[<>]/g, '').trim();

  // 1. Thread ID Match (Highest precision: same Gmail conversation thread)
  let candidate = store.interacciones_email.find(
    (i) =>
      i.direction === 'INBOUND' &&
      !i.isReplied &&
      i.threadId === replyMsg.threadId &&
      new Date(i.date).getTime() <= replyTime
  );

  // 2. In-Reply-To Header Match (Direct RFC reference)
  if (!candidate && inReplyToHeader) {
    candidate = store.interacciones_email.find(
      (i) =>
        i.direction === 'INBOUND' &&
        !i.isReplied &&
        (i.id === inReplyToHeader || i.rfcMessageId === inReplyToHeader)
    );
  }

  // 3. Normalized Subject Match (Handles Re:, RE:, Fwd:, etc.)
  if (!candidate && normalizedReplySubject.length > 5) {
    candidate = store.interacciones_email.find(
      (i) =>
        i.direction === 'INBOUND' &&
        !i.isReplied &&
        normalizeSubjectForMatching(i.subject) === normalizedReplySubject &&
        new Date(i.date).getTime() <= replyTime
    );
  }

  // 4. Folder Code Match (Same shipment folder and mailbox)
  if (!candidate && replyMsg.carpetaCodigo) {
    candidate = store.interacciones_email.find(
      (i) =>
        i.direction === 'INBOUND' &&
        !i.isReplied &&
        i.carpetaCodigo?.toUpperCase() === replyMsg.carpetaCodigo!.toUpperCase() &&
        new Date(i.date).getTime() <= replyTime
    );
  }

  if (candidate) {
    const inboundTime = new Date(candidate.date).getTime();
    const diffMinutes = Math.max(1, Math.round((replyTime - inboundTime) / 60000));

    candidate.isReplied = true;
    candidate.repliedBy = replyMsg.from;
    candidate.repliedAt = new Date(replyTime).toISOString();
    candidate.responseTimeMinutes = diffMinutes;
    return candidate;
  }

  return null;
}

/**
 * Recalculates response and SLA metrics per mailbox across store.interacciones_email.
 */
export function recalculateMailboxEmailStats(store: LiveStoreData, targetMailbox?: string): void {
  if (!Array.isArray(store.interacciones_email)) {
    store.interacciones_email = [];
  }
  if (!store.mailboxSyncState) {
    store.mailboxSyncState = {};
  }

  const mailboxes = targetMailbox ? [targetMailbox] : Object.keys(store.mailboxSyncState);

  for (const mb of mailboxes) {
    const mbRecord = store.mailboxSyncState[mb];
    if (!mbRecord) continue;

    const inbound = store.interacciones_email.filter(
      (i) => i.mailbox.toLowerCase() === mb.toLowerCase() && i.direction === 'INBOUND'
    );
    const replied = inbound.filter((i) => i.isReplied);
    const pending = inbound.filter((i) => !i.isReplied);

    let avgMinutes = 0;
    if (replied.length > 0) {
      const sum = replied.reduce((acc, i) => acc + (i.responseTimeMinutes ?? 0), 0);
      avgMinutes = sum / replied.length;
    }

    mbRecord.emails_recibidos_total = inbound.length;
    mbRecord.emails_respondidos_total = replied.length;
    mbRecord.emails_pendientes_respuesta = pending.length;
    mbRecord.tiempo_respuesta_promedio_min = Number(avgMinutes.toFixed(1));
  }
}

/**
 * Persists an EmailInteractionRecord into store and recalculates mailbox SLA counters.
 */
export function persistEmailInteractionRecord(record: EmailInteractionRecord): { savedToLocalStore: boolean } {
  const store = loadLiveStore();
  if (!Array.isArray(store.interacciones_email)) {
    store.interacciones_email = [];
  }

  const existingIdx = store.interacciones_email.findIndex((i) => i.id === record.id);
  if (existingIdx >= 0) {
    store.interacciones_email[existingIdx] = {
      ...store.interacciones_email[existingIdx],
      ...record,
    };
  } else {
    store.interacciones_email.push(record);
  }

  recalculateMailboxEmailStats(store, record.mailbox);
  saveLiveStore(store);
  return { savedToLocalStore: true };
}
