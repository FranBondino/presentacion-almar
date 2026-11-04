/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Multi-Mailbox Ingestion & Invoice Synchronization Service (Calibrated Phase 2)
 *
 * Synchronizes incoming logistics invoices, VEPs, and shipping documents across ALL 18
 * authorized operational mailboxes via Google Workspace Domain-Wide Service Account delegation.
 *
 * Key Production Features (Phase 1 + Phase 2):
 * - Persistent `historyId` & `last_synced_at` cursors per mailbox (`mailbox_sync_state`).
 * - Instant cursor short-circuit when `profile.historyId === storedCursor.history_id`.
 * - Pre-extraction Document Classification (`classifyLogisticsDocument`):
 *   - Accounting vouchers (`FACTURA_A`, `FACTURA_B`, `NOTA_CREDITO`, `INVOICE_EXTERIOR`) -> `comprobantes`.
 *   - Operational shipping documents (`BL_AWB_CRT`, `PACKING_LIST`, `PROFORMA_COMERCIAL`,
 *     `DESPACHO_ADUANA_LMAN`, `AVISO_OPERATIVO`) -> `documentos` + folder metadata enrichment.
 * - Smart Folder Deduction (`deduceFolderForInvoice`) by Container (0.95), BL (0.90), Booking (0.85), CUIT (0.70).
 * - Dual cryptographic idempotency (`messageId_attachmentId` + PDF `sha256_hash`).
 * - Deterministic UUID resolution for folder codes (`C1234`, `C1673`, `C1688`, etc.).
 * - Protection against issuer-inversion (`ALMAR ROSARIO` / `30-71514996-8` never assigned as supplier).
 */

import crypto from 'crypto';
import { getGmailClient } from './client';
import {
  detectShipmentReferences,
  parseIngresoCostoEmail,
  parseContainerTrackingEmail,
  parseKipinCargoAlertEmail,
  type ExtractedKipinAlert,
} from './parser';
import { validatePdfBuffer } from '../resilience/pdf-validator';
import { quarantineCorruptDocument } from '../resilience/dlq';
import { extractInvoiceFromContent, extractTextFromPdfBuffer } from '../ai/extractor';
import { classifyFiscalItem, isKnownInternationalCarrier } from '../fiscal/classifier';
import { deduceFolderForInvoice } from '../folder-deduction';
import { logAuditEvent } from '../audit';
import { persistIngestedPdfBinary } from '../pdf-storage';
import {
  AUTHORIZED_ALMAR_MAILBOXES,
  COMMERCIAL_ALMAR_MAILBOXES,
  getMailboxSyncStatesOrdered,
  isInvoiceAlreadyIngested,
  isQuoteAlreadyIngested,
  loadLiveStore,
  saveLiveStore,
  persistAlertaRecord,
  persistComprobanteRecord,
  persistCotizacionRecord,
  persistDocumentoRecord,
  persistEventoRecord,
  persistTrackingEventRecord,
  scheduleSupabaseSync,
  resolveOrEnsureCarpetaUuid,
  attachEmailToFolder,
  updateMailboxCursorState,
  recalculateFolderFinancials,
  classifyMessageDirection,
  matchAndRecordEmailReply,
  recalculateMailboxEmailStats,
  normalizeSubjectForMatching,
  type MailboxSyncStateRecord,
  type CostoEstimadoItem,
  type TrackingEventRecord,
  type EmailInteractionRecord,
  type EmailInteractionDirection,
} from '../persistence/live-store';
import {
  extractQuoteFromEmail,
  mapExtractedQuoteToCotizacionRecord,
  detectFolderCodeFromText,
} from '../ai/quote-extractor';
import type { ComprobanteRecord, DocumentoRecord, MailMessage, AlertaRecord } from '../mockData';
import { extractActorsFromFolder } from '../mockData';
import type { Json } from '../supabase/database.types';

export const ALL_ALMAR_MAILBOXES = AUTHORIZED_ALMAR_MAILBOXES;

/**
 * Universal Operational Sync Query:
 * Catches all logistics attachments (PDF invoices, shipping documents) and key operational terms.
 * Folder codes (C\d+, EA\d+, IT\d+, TL\d+, EM\d+, ET\d+) are resolved dynamically from active store folders.
 */
export const DEFAULT_OPERATIONAL_SYNC_QUERY =
  '(has:attachment filename:pdf OR "Apertura Carpeta" OR "Aviso de Zarpe" OR "Bill of Lading" OR "HBL" OR "Carta de Porte" OR "Despacho" OR "Factura" OR "Booking") -is:draft';

export const DEFAULT_TRACKING_SYNC_QUERY =
  '(from:kipincargo OR from:shipsgo OR "Container Tracking" OR "Evento Asignado" OR "Actualización" OR "Alerta KipinCargo" OR "INGRESO DE COSTO" OR "Tracking Information" OR "ShipsGo" OR "KipinToch" OR has:attachment) -is:draft';

/**
 * Builds an operational sync query including all active folder codes in the store
 * matching pattern (C\d+, EA\d+, IT\d+, TL\d+, EM\d+, ET\d+).
 */
export function buildOperationalSyncQuery(afterDate?: string): string {
  try {
    const store = loadLiveStore();
    const codes = new Set<string>();
    for (const c of store.carpetas || []) {
      const code = (c.numero_carpeta || (c as any).codigo_carpeta || '').toUpperCase().trim();
      if (/^(C|EA|IT|TL|EM|ET)\d+$/i.test(code)) {
        codes.add(code);
      }
    }
    const codePart = codes.size > 0 ? Array.from(codes).slice(0, 30).join(' OR ') : '';
    const base = codePart
      ? `(has:attachment filename:pdf OR ${codePart} OR "Apertura Carpeta" OR "Aviso de Zarpe" OR "Bill of Lading" OR "HBL" OR "Booking") -is:draft`
      : DEFAULT_OPERATIONAL_SYNC_QUERY;
    return afterDate ? `${base} after:${afterDate}` : base;
  } catch {
    return afterDate ? `${DEFAULT_OPERATIONAL_SYNC_QUERY} after:${afterDate}` : DEFAULT_OPERATIONAL_SYNC_QUERY;
  }
}

/**
 * Determines if an incoming email is an automated system notification (bots, alerts, ticketing, tracking)
 * or out-of-office autoreply that should be excluded from human response rate SLAs.
 */
export function isAutomatedNotificationEmail(
  from: string,
  subject?: string,
  headers?: Record<string, string>
): boolean {
  const f = (from || '').toLowerCase();
  const s = (subject || '').toLowerCase();

  // 1. Known bot, tracking, alert, and system addresses
  if (
    f.includes('no-reply') ||
    f.includes('noreply') ||
    f.includes('donotreply') ||
    f.includes('shipsgo') ||
    f.includes('kipincargo') ||
    f.includes('notification') ||
    f.includes('notificaciones') ||
    f.includes('alertas@') ||
    f.includes('automated@') ||
    f.includes('mailer-daemon@') ||
    f.includes('tracking@almarrosario.com') ||
    f.includes('postmaster@') ||
    f.includes('notify@')
  ) {
    return true;
  }

  // 2. Automated subjects and out-of-office notices
  if (
    s.includes('automatic reply') ||
    s.includes('out of office') ||
    s.includes('fuera de oficina') ||
    s.includes('respuesta automática') ||
    s.includes('auto-response') ||
    s.includes('notificación automática') ||
    s.includes('undelivered mail') ||
    s.includes('delivery status notification')
  ) {
    return true;
  }

  // 3. RFC standard auto-generated headers
  if (headers) {
    const autoSubmitted = headers['auto-submitted']?.toLowerCase();
    if (autoSubmitted && autoSubmitted !== 'no') return true;
    const precedence = headers['precedence']?.toLowerCase();
    if (precedence === 'bulk' || precedence === 'junk' || precedence === 'auto_reply') return true;
    const xAutoReply = headers['x-autoreply']?.toLowerCase();
    if (xAutoReply === 'yes' || xAutoReply === 'true') return true;
  }

  return false;
}

/**
 * 5-Minute TTL Stale Sync Lock Recovery (R3)
 */
export const SYNC_LOCK_TTL_MS = 300_000; // 5 minutes TTL
export let syncLockAcquiredAt: number | null = null;
export let isSyncRunning = false;

export function acquireSyncLock(): { acquired: boolean; syncLockAcquiredAt: number; reason?: string } {
  const now = Date.now();
  if (isSyncRunning && syncLockAcquiredAt !== null && now - syncLockAcquiredAt < SYNC_LOCK_TTL_MS) {
    return {
      acquired: false,
      syncLockAcquiredAt,
      reason: 'SYNC_ALREADY_IN_PROGRESS',
    };
  }

  isSyncRunning = true;
  syncLockAcquiredAt = now;
  return {
    acquired: true,
    syncLockAcquiredAt: now,
  };
}

export function releaseSyncLock(): void {
  isSyncRunning = false;
  syncLockAcquiredAt = null;
}

export function setSyncLockForTesting(timestamp: number | null, running: boolean = true): void {
  syncLockAcquiredAt = timestamp;
  isSyncRunning = running;
}

export interface SyncMailboxOptions {
  mailboxes?: string[];
  maxMessagesPerMailbox?: number;
  maxMailboxesPerRun?: number;
  concurrency?: number;
  query?: string;
  saveToDatabase?: boolean;
  forceRescan?: boolean;
  preferEngine?: 'openai' | 'gemini' | 'ollama' | 'deterministic';
  includeCommercialQuotes?: boolean;
  afterDate?: string;
  syncThreads?: boolean;
}

export interface SyncThreadsOptions {
  mailboxes?: string[];
  afterDate?: string; // YYYY/MM/DD, defaults to '2026/09/29'
  beforeDate?: string; // YYYY/MM/DD
  query?: string; // Custom query override
  maxMessagesPerMailbox?: number; // defaults to 150
  concurrency?: number; // defaults to 10
  saveToStore?: boolean; // defaults to true
  onProgress?: (info: {
    mailbox: string;
    index: number;
    total: number;
    messagesFound: number;
    interactionsSaved: number;
  }) => void;
}

export interface MailboxThreadSummary {
  mailbox: string;
  operatorName: string;
  messagesProcessed: number;
  inboundHumanCount: number;
  outboundCount: number;
  botsFilteredCount: number;
  repliedCount: number;
  avgResponseTimeMin: number;
  durationMs: number;
}

export interface SyncThreadsResult {
  success: boolean;
  totalMailboxes: number;
  totalMessagesProcessed: number;
  totalInteractionsSaved: number;
  totalInboundHuman: number;
  totalOutbound: number;
  totalBotsFiltered: number;
  totalReplied: number;
  averageResponseTimeMinutes: number;
  mailboxSummaries: MailboxThreadSummary[];
  durationMs: number;
}

export interface IngestedInvoiceSummary {
  id: string;
  sourceMailbox: string;
  messageId: string;
  emailSubject: string;
  emailDate: string;
  sender: string;
  filename: string;
  carpetaId: string | null;
  carpetaCodigo: string | null;
  tipoComprobante: string;
  numeroComprobante: string;
  emisorNombre: string;
  emisorCuit: string;
  moneda: string;
  total: number;
  estadoAuditoria: string;
  pdfValid: boolean;
  sha256?: string;
  savedToSupabase?: boolean;
  documentCategory?: string;
  deductionMatchType?: string | null;
}

export interface CataloguedOperationalDocSummary {
  id: string;
  sourceMailbox: string;
  messageId: string;
  emailSubject: string;
  filename: string;
  documentCategory: string;
  carpetaId: string | null;
  carpetaCodigo: string | null;
  sha256: string;
}

export interface MailboxSyncResult {
  email: string;
  name: string;
  role: string;
  success: boolean;
  historyId?: string | null;
  cursorUnchanged?: boolean;
  messagesFound: number;
  pdfsProcessed: number;
  invoicesIngested: number;
  operationalDocsCatalogued?: number;
  duplicatesSkipped: number;
  durationMs: number;
  error?: string;
}

export interface IngestedQuoteSummary {
  id: string;
  numeroCotizacion: string;
  clienteNombre: string;
  via: string;
  fleteVentaUsd: number;
  margenBrutoUsd: number;
  estado: string;
  sourceMailbox: string;
  carpetaOperativaId?: string | null;
  carpetaCodigo?: string | null;
  gmail_message_id?: string;
  rfc_message_id?: string;
}

export interface MultiMailboxSyncReport {
  timestamp: string;
  completedAt: string;
  durationMs: number;
  totalMailboxesScanned: number;
  totalMessagesFound: number;
  totalPdfsProcessed: number;
  totalInvoicesIngested: number;
  totalOperationalDocsCatalogued: number;
  totalDuplicatesSkipped: number;
  mailboxes: MailboxSyncResult[];
  invoices: IngestedInvoiceSummary[];
  operationalDocuments: CataloguedOperationalDocSummary[];
  alertsCreated: number;
  trackingEventsCount: number;
  quotesCount: number;
  totalAlertsGenerated?: number;
  totalTrackingEventsProcessed?: number;
  totalQuotesIngested?: number;
  quotes?: IngestedQuoteSummary[];
  threadInteractions?: SyncThreadsResult;
}

// Non-invoice noise filename patterns to skip before expensive parsing
const NOISE_FILENAME_REGEX =
  /\b(folleto|brochure|newsletter|catalogo|flyer|firma|logo|banner|instructivo|manual_usuario|terminos_y_condiciones)\b/i;

/**
 * Cleans up sender display name from an email `From` header, e.g. `"Maersk Line <no-reply@maersk.com>"` -> `"Maersk Line"`
 */
function extractSenderDisplayName(fromHeader: string, subject?: string): string {
  // Check if subject has "// SUPPLIER NAME" (common ALMAR convention, e.g. "RE: FACT A 2-12410 // MARITIME SERVICES LINE SA")
  if (subject) {
    const slashMatch = subject.match(/\/\/\s*([A-Za-z0-9\s.&-]{4,45})(?:\/\/|$)/);
    if (slashMatch?.[1] && !/almar\s*rosario/i.test(slashMatch[1])) {
      return slashMatch[1].trim();
    }
  }

  const cleaned = fromHeader.split('<')[0]?.replace(/["']/g, '').trim();
  if (cleaned && cleaned.length > 2 && !/almar\s*rosario/i.test(cleaned)) {
    return cleaned;
  }
  const emailMatch = fromHeader.match(/@([a-zA-Z0-9.-]+)/);
  if (emailMatch && emailMatch[1] && !/almarrosario/i.test(emailMatch[1])) {
    const domainPart = emailMatch[1].split('.')[0] ?? 'Proveedor';
    return `Proveedor (${domainPart.toUpperCase()})`;
  }
  return 'Proveedor Logístico COMEX';
}

/**
 * Formats a clean human-readable sender name for email timelines.
 */
function formatMailSenderName(fromHeader: string, _subject?: string): string {
  if (!fromHeader) return 'Remitente';
  const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*<.*>$/);
  if (nameMatch && nameMatch[1] && nameMatch[1].trim()) {
    return nameMatch[1].trim();
  }
  const cleanEmail = (fromHeader.match(/<([^>]+)>/)?.[1] || fromHeader).trim().toLowerCase();
  if (cleanEmail.includes('nhermoso@')) return 'Natali Hermoso (ALMAR Rosario)';
  if (cleanEmail.includes('agomez@')) return 'Aldana Gómez (ALMAR Rosario)';
  if (cleanEmail.includes('atalaban@')) return 'Ana Laura Talaban (ALMAR Rosario)';
  if (cleanEmail.includes('astampfli@')) return 'Abril Stampfli (ALMAR Rosario)';
  if (cleanEmail.includes('vmoyano@')) return 'Victoria Moyano (ALMAR Rosario)';
  if (cleanEmail.includes('llaje@')) return 'Lucía Laje (ALMAR Rosario)';
  if (cleanEmail.includes('anoacco@')) return 'Alejandro Noacco (ALMAR Rosario)';
  if (cleanEmail.includes('vmeggiolaro@')) return 'Vanesa Meggiolaro (ALMAR Rosario)';
  if (cleanEmail.includes('srossi@')) return 'Stefania Rossi (ALMAR Rosario)';
  if (cleanEmail.includes('operaciones@')) return 'Operaciones ALMAR';
  if (cleanEmail.includes('babita') || cleanEmail.includes('forin')) return 'Babita Sharma (Forin Container Line)';
  if (cleanEmail.includes('amafreight') || cleanEmail.includes('hoppenberg')) return 'Andreas Hoppenberg (AMA Freight)';
  if (cleanEmail.includes('oriana') || cleanEmail.includes('ctl')) return 'Oriana Maero (CTL Latam Cba)';
  if (cleanEmail.includes('eversail')) return 'Susan Lee (Eversail Shanghai)';
  const userPart = cleanEmail.split('@')[0];
  if (userPart) {
    return userPart
      .split(/[._-]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }
  return fromHeader;
}

/**
 * Ensures ALMAR Rosario (the receiver/client) is never mistakenly recorded as the supplier/issuer.
 * Strictly assigns canonical foreign CDI 50-00000000-0 for foreign suppliers without Argentine CUIT.
 */
const INTERNAL_ALMAR_EMPLOYEE_NAMES_RE =
  /\b(?:almar\s*rosario|abril\s*st[aä]mpfli|stefania\s*rossi|vanesa\s*meggiolaro|daniela\s*silvi|juan\s*(?:andr[eé]s\s*)?arloro|luc[ií]a\s*laje|ana\s*(?:laura\s*)?talaban|natali\s*hermoso|alejandro\s*noacco|agust[ií]n\s*bucardo|aldana\s*g[oó]mez|camila\s*dellamea|marcos\s*fusco|nerea\s*guida|victoria\s*moyano|zamira\s*abraham|customer\s*service)\b/i;

function sanitizeIssuerIdentity(
  extractedName: string | undefined,
  extractedTaxId: string | undefined,
  fromHeader: string,
  subject?: string,
  currency?: string
): { emisorNombre: string; emisorCuit: string; proveedorExterior: boolean } {
  const isAlmarOrGenericName =
    !extractedName ||
    INTERNAL_ALMAR_EMPLOYEE_NAMES_RE.test(extractedName) ||
    extractedName === 'PROVEEDOR GENERAL';

  const cleanTax = (extractedTaxId ?? '').replace(/\D/g, '');
  const isAlmarCuit =
    cleanTax === '30715149968' ||
    cleanTax === '30000000000' ||
    cleanTax === '00000000000' ||
    extractedTaxId === '30-00000000-0';

  const senderIsInternalAlmar =
    /@almarrosario\.com/i.test(fromHeader) || INTERNAL_ALMAR_EMPLOYEE_NAMES_RE.test(fromHeader);

  let emisorNombre = isAlmarOrGenericName
    ? senderIsInternalAlmar
      ? 'Proveedor Logístico (Reenvío Interno)'
      : extractSenderDisplayName(fromHeader, subject)
    : extractedName.trim();

  if (INTERNAL_ALMAR_EMPLOYEE_NAMES_RE.test(emisorNombre)) {
    emisorNombre = 'Proveedor Logístico (Reenvío Interno)';
  }

  let emisorCuit = extractedTaxId ? extractedTaxId.trim() : '';
  const isForeignCarrier =
    isKnownInternationalCarrier(emisorNombre) ||
    /maersk|msc|hapag|cma\s*cgm|cosco|evergreen|one\s*line|dhl|lufthansa|saco|saa\s*logistics|llc\b|ltd\b|gmbh\b|inc\b|pvt\b/i.test(emisorNombre);

  const isDomesticArs = (currency || '').toUpperCase() === 'ARS' && !isForeignCarrier;

  if (isAlmarCuit || !emisorCuit || !/^(20|23|24|27|30|33|34)/.test(cleanTax)) {
    emisorCuit = isDomesticArs ? 'CUIT pendiente OCR' : '50-00000000-0';
  } else if (cleanTax.length === 11) {
    emisorCuit = `${cleanTax.slice(0, 2)}-${cleanTax.slice(2, 10)}-${cleanTax.slice(10)}`;
  }

  const proveedorExterior = emisorCuit.startsWith('50-') || isForeignCarrier;

  return { emisorNombre, emisorCuit, proveedorExterior };
}

/**
 * Returns the list of recently ingested invoices persisted in the LiveStore.
 */
export function getRecentIngestedInvoices(limit = 100): IngestedInvoiceSummary[] {
  const store = loadLiveStore();
  const ingested = store.comprobantes.filter((c) => {
    const raw = (c.metadata_raw ?? {}) as Record<string, unknown>;
    return Boolean(c.source_mailbox || raw.source_mailbox || c.gmail_message_id || raw.message_id);
  });

  return ingested.slice(0, limit).map((c) => {
    const raw = (c.metadata_raw ?? {}) as Record<string, unknown>;
    return {
      id: c.id,
      sourceMailbox: String(
        c.source_mailbox ?? raw.source_mailbox ?? 'operaciones@almarrosario.com'
      ),
      messageId: String(c.gmail_message_id ?? raw.message_id ?? ''),
      emailSubject: String(raw.email_subject ?? c.concepto_gasto),
      emailDate: c.fecha_emision,
      sender: String(raw.sender ?? c.emisor_razon_social),
      filename: String(raw.filename ?? 'factura.pdf'),
      carpetaId: c.carpeta_id,
      carpetaCodigo: c.carpeta_codigo ?? (raw.carpeta_codigo as string | null) ?? null,
      tipoComprobante: c.tipo_comprobante,
      numeroComprobante: c.numero_comprobante,
      emisorNombre: c.emisor_razon_social,
      emisorCuit: c.emisor_cuit ?? '30-00000000-0',
      moneda: c.moneda,
      total: c.monto_total,
      estadoAuditoria: c.estado_pago,
      pdfValid: true,
      sha256: c.sha256_hash ?? (raw.sha256 as string | undefined),
      documentCategory: (raw.document_category as string | undefined) ?? 'FACTURA',
      deductionMatchType: (raw.deduction_match_type as string | null | undefined) ?? null,
    };
  });
}

/**
 * Returns the persistent cursor state of all 18 authorized ALMAR mailboxes.
 */
export function getAllMailboxSyncStates(): MailboxSyncStateRecord[] {
  return getMailboxSyncStatesOrdered();
}

/**
 * Synchronizes incoming logistics invoices across ALMAR mailboxes with persistent cursors,
 * pre-extraction document classification, smart folder deduction, and parallel batching.
 */
function resolveDefaultPreferEngine(): 'openai' | 'gemini' | 'deterministic' {
  if (process.env.VITEST) return 'deterministic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY) return 'gemini';
  return 'deterministic';
}

export async function syncAllAlmarMailboxes(
  options?: SyncMailboxOptions
): Promise<MultiMailboxSyncReport> {
  const startMs = Date.now();
  const startTime = new Date(startMs).toISOString();
  const maxPerMailbox = options?.maxMessagesPerMailbox ?? 5;
  const searchQuery = options?.query
    ? (options?.afterDate && !options.query.includes('after:')
        ? `${options.query} after:${options.afterDate}`
        : options.query)
    : buildOperationalSyncQuery(options?.afterDate);
  const saveToDb = options?.saveToDatabase ?? true;
  const forceRescan = options?.forceRescan ?? false;
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 3, 6));
  const preferEngine = options?.preferEngine ?? resolveDefaultPreferEngine();

  // Order mailboxes by least-recently synced first so batch runs cover all 18 mailboxes fairly
  const orderedStates = getMailboxSyncStatesOrdered();
  let targetMailboxes = AUTHORIZED_ALMAR_MAILBOXES;

  if (options?.mailboxes && options.mailboxes.length > 0) {
    targetMailboxes = AUTHORIZED_ALMAR_MAILBOXES.filter((m) =>
      options.mailboxes!.includes(m.email)
    );
  } else if (options?.maxMailboxesPerRun && options.maxMailboxesPerRun > 0) {
    const selectedEmails = new Set(
      orderedStates.slice(0, options.maxMailboxesPerRun).map((s) => s.email)
    );
    targetMailboxes = AUTHORIZED_ALMAR_MAILBOXES.filter((m) => selectedEmails.has(m.email));
  }

  const client = getGmailClient();
  if (!client.isConfigured()) {
    throw new Error('Google Service Account no está configurado en las variables de entorno.');
  }

  const mailboxResults: MailboxSyncResult[] = [];
  const newInvoices: IngestedInvoiceSummary[] = [];
  const newOperationalDocs: CataloguedOperationalDocSummary[] = [];

  let totalMessagesFound = 0;
  let totalPdfsProcessed = 0;
  let totalDuplicatesSkipped = 0;
  let alertsCreatedCount = 0;
  let trackingEventsCount = 0;

  const processSingleMailbox = async (mb: {
    email: string;
    name: string;
    role: string;
  }): Promise<MailboxSyncResult> => {
    const mbStartMs = Date.now();
    let mbMessagesFound = 0;
    let mbPdfsProcessed = 0;
    let mbInvoicesIngested = 0;
    let mbOperationalDocsCatalogued = 0;
    let mbDuplicatesSkipped = 0;
    let mbError: string | undefined;
    let currentHistoryId: string | null = null;
    let cursorUnchanged = false;

    const prevState = loadLiveStore().mailboxSyncState[mb.email];

    try {
      // 1. Check mailbox profile & historyId cursor first (~150ms)
      const profile = await client.getProfile(mb.email);
      currentHistoryId = profile.historyId;

      if (
        !forceRescan &&
        !options?.afterDate &&
        prevState?.history_id &&
        prevState.history_id === currentHistoryId &&
        prevState.last_synced_at
      ) {
        cursorUnchanged = true;
        await updateMailboxCursorState(mb.email, {
          history_id: currentHistoryId,
          last_synced_at: new Date().toISOString(),
          status: 'ACTIVE',
          last_error: null,
          consecutive_failures: 0,
        });

        return {
          email: mb.email,
          name: mb.name,
          role: mb.role,
          success: true,
          historyId: currentHistoryId,
          cursorUnchanged: true,
          messagesFound: 0,
          pdfsProcessed: 0,
          invoicesIngested: 0,
          operationalDocsCatalogued: 0,
          duplicatesSkipped: 0,
          durationMs: Date.now() - mbStartMs,
        };
      }

      // 2. Fetch messages matching query
      const mailboxQuery =
        mb.email === 'tracking@almarrosario.com'
          ? (!options?.query || options.query === DEFAULT_OPERATIONAL_SYNC_QUERY
              ? DEFAULT_TRACKING_SYNC_QUERY
              : options.query)
          : searchQuery;

      const messages = await client.listMessages({
        impersonateEmail: mb.email,
        query: mailboxQuery,
        maxResults: maxPerMailbox,
      });

      mbMessagesFound = messages.length;
      totalMessagesFound += mbMessagesFound;

      let latestMsgDate: string | null = prevState?.last_message_date ?? null;

      for (const msg of messages) {
        if (msg.date) {
          const parsedDate = new Date(msg.date);
          if (!isNaN(parsedDate.getTime())) {
            const isoMsgDate = parsedDate.toISOString();
            if (!latestMsgDate || isoMsgDate > latestMsgDate) {
              latestMsgDate = isoMsgDate;
            }
          }
        }

        // --- R1 Live Email Interaction & Response SLA Tracking ---
        try {
          const store = loadLiveStore();
          const direction = classifyMessageDirection(
            { from: msg.from, to: msg.to, labels: (msg as any).labels },
            mb.email
          );

          // Detect folder reference from subject or snippet
          const detectedFolder =
            detectFolderCodeFromText(msg.subject) ||
            detectFolderCodeFromText(msg.snippet || '') ||
            null;

          const operatorName =
            AUTHORIZED_ALMAR_MAILBOXES.find((m) => m.email.toLowerCase() === mb.email.toLowerCase())?.name ||
            mb.name ||
            mb.email;

          const msgDateIso =
            msg.date && !isNaN(new Date(msg.date).getTime())
              ? new Date(msg.date).toISOString()
              : new Date().toISOString();

          if (direction === 'OUTBOUND_REPLY') {
            // Attempt to match against earlier inbound interaction
            const matchedInbound = matchAndRecordEmailReply(store, {
              id: msg.id,
              threadId: msg.threadId,
              from: msg.from,
              date: msgDateIso,
              subject: msg.subject,
              rawHeaders: msg.rawHeaders,
              carpetaCodigo: detectedFolder,
            });

            if (!Array.isArray(store.interacciones_email)) {
              store.interacciones_email = [];
            }
            const existingOutIdx = store.interacciones_email.findIndex((i) => i.id === msg.id);
            const isAutomated = isAutomatedNotificationEmail(msg.from, msg.subject, msg.rawHeaders);
            const outRecord: EmailInteractionRecord = {
              id: msg.id,
              threadId: msg.threadId,
              mailbox: mb.email,
              operadorNombre: operatorName,
              direction: 'OUTBOUND_REPLY',
              from: msg.from,
              to: msg.to,
              subject: msg.subject,
              date: msgDateIso,
              carpetaCodigo: detectedFolder,
              isReplied: true,
              repliedBy: msg.from,
              repliedAt: msgDateIso,
              responseTimeMinutes: matchedInbound ? matchedInbound.responseTimeMinutes : null,
              snippet: msg.snippet,
              bodyExcerpt: msg.bodyText?.slice(0, 300),
              rfcMessageId: msg.rawHeaders?.['message-id']?.replace(/[<>]/g, '').trim(),
              inReplyTo: msg.rawHeaders?.['in-reply-to']?.replace(/[<>]/g, '').trim(),
              references: msg.rawHeaders?.['references']?.replace(/[<>]/g, '').trim(),
              isAutomatedNotification: isAutomated,
            } as EmailInteractionRecord;

            if (existingOutIdx >= 0) {
              store.interacciones_email[existingOutIdx] = {
                ...store.interacciones_email[existingOutIdx]!,
                ...outRecord,
              };
            } else {
              store.interacciones_email.push(outRecord);
            }
          } else {
            // INBOUND message
            if (!Array.isArray(store.interacciones_email)) {
              store.interacciones_email = [];
            }
            const existingInIdx = store.interacciones_email.findIndex((i) => i.id === msg.id);

            // Check if there was already an outbound reply (out-of-order ingestion)
            const replyCandidate = store.interacciones_email.find(
              (i) =>
                i.direction === 'OUTBOUND_REPLY' &&
                (i.threadId === msg.threadId ||
                  (detectedFolder && i.carpetaCodigo?.toUpperCase() === detectedFolder.toUpperCase()) ||
                  (normalizeSubjectForMatching(i.subject) === normalizeSubjectForMatching(msg.subject) &&
                    normalizeSubjectForMatching(msg.subject).length > 5)) &&
                new Date(i.date).getTime() >= new Date(msgDateIso).getTime()
            );

            let isReplied = false;
            let repliedBy: string | null = null;
            let repliedAt: string | null = null;
            let responseTimeMinutes: number | null = null;

            if (replyCandidate) {
              isReplied = true;
              repliedBy = replyCandidate.from || operatorName;
              repliedAt = replyCandidate.date;
              const diffMs = new Date(replyCandidate.date).getTime() - new Date(msgDateIso).getTime();
              responseTimeMinutes = Math.max(1, Math.round(diffMs / 60000));
            }

            const isAutomated = isAutomatedNotificationEmail(msg.from, msg.subject, msg.rawHeaders);
            const inRecord: EmailInteractionRecord = {
              id: msg.id,
              threadId: msg.threadId,
              mailbox: mb.email,
              operadorNombre: operatorName,
              direction: 'INBOUND',
              from: msg.from,
              to: msg.to,
              subject: msg.subject,
              date: msgDateIso,
              carpetaCodigo: detectedFolder,
              isReplied,
              repliedBy,
              repliedAt,
              responseTimeMinutes,
              snippet: msg.snippet,
              bodyExcerpt: msg.bodyText?.slice(0, 300),
              rfcMessageId: msg.rawHeaders?.['message-id']?.replace(/[<>]/g, '').trim(),
              inReplyTo: msg.rawHeaders?.['in-reply-to']?.replace(/[<>]/g, '').trim(),
              references: msg.rawHeaders?.['references']?.replace(/[<>]/g, '').trim(),
              isAutomatedNotification: isAutomated,
            } as EmailInteractionRecord;

            if (existingInIdx >= 0) {
              const prev = store.interacciones_email[existingInIdx]!;
              store.interacciones_email[existingInIdx] = {
                ...prev,
                ...inRecord,
                isReplied: prev.isReplied || isReplied,
                repliedBy: prev.repliedBy || repliedBy,
                repliedAt: prev.repliedAt || repliedAt,
                responseTimeMinutes: prev.responseTimeMinutes ?? responseTimeMinutes,
              };
            } else {
              store.interacciones_email.push(inRecord);
            }
          }
        } catch (emailErr) {
          console.warn(`[Sync Mailboxes] Error tracking interaction for msg ${msg.id} in ${mb.email}:`, emailErr);
        }

        // Handle tracking@almarrosario.com and Kipintoch / ShipsGo notifications
        if (
          mb.email === 'tracking@almarrosario.com' ||
          msg.from.includes('tracking@almarrosario.com') ||
          msg.from.includes('kipincargo') ||
          msg.from.includes('shipsgo') ||
          msg.subject.includes('INGRESO DE COSTO') ||
          msg.subject.includes('Container Tracking') ||
          msg.subject.includes('Actualización en ETA') ||
          msg.subject.includes('Actualización Fecha Llegada') ||
          msg.subject.includes('Alerta KipinCargo') ||
          /Alerta\s+KipinCargo/i.test(msg.subject)
        ) {
          // A. Check Alerta KipinCargo
          const kipinAlert = parseKipinCargoAlertEmail(msg.subject, msg.bodyText);
          if (kipinAlert) {
            const store = loadLiveStore();
            let linkedFolderId: string | null = null;
            if (kipinAlert.carpetaCodigo) {
              const folder = store.carpetas.find(
                (c) => c.numero_carpeta.toUpperCase() === kipinAlert.carpetaCodigo!.toUpperCase()
              );
              if (folder) {
                linkedFolderId = folder.id;
                if (kipinAlert.tipoAlerta === 'ARRIBADA_PENDIENTE_FACTURAR' && folder.estado === 'EN_TRANSITO') {
                  folder.estado = 'ARRIBADO';
                  folder.updated_at = new Date().toISOString();
                  saveLiveStore(store);
                }
              }
            }

            const alertId = `alerta-kipin-${msg.id}`;
            const alertRecord: AlertaRecord = {
              id: alertId,
              carpeta_id: linkedFolderId,
              comprobante_id: null,
              tipo:
                kipinAlert.tipoAlerta === 'COTIZACION_VENCIDA'
                  ? 'VENCIMIENTO_PROXIMO'
                  : 'FACTURA_SIN_CARPETA',
              severidad: kipinAlert.severidad,
              titulo: `Alerta KipinCargo: ${kipinAlert.motivo}`,
              mensaje: `Aviso automático de KipinCargo recibido en ${mb.email} — Asunto: "${msg.subject}". ${msg.snippet || ''}`,
              leida: false,
              resuelta: false,
              resolucion_accion: null,
              resuelta_por: null,
              resuelta_at: null,
              created_at: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            persistAlertaRecord(alertRecord);
            alertsCreatedCount++;
            continue;
          }

          // B. Check INGRESO DE COSTO
          const ingresoCosto = parseIngresoCostoEmail(msg.bodyHtml || msg.bodyText || '', msg.subject);
          if (ingresoCosto && ingresoCosto.carpetaCodigo) {
            const { carpetaCodigo } = await resolveOrEnsureCarpetaUuid(ingresoCosto.carpetaCodigo, {
              emailSubject: msg.subject,
              sender: msg.from,
              mailbox: mb.email,
              emailDate: msg.date,
              clientName: ingresoCosto.clienteNombre,
              consigneeName: ingresoCosto.clienteNombre,
              blNumber: ingresoCosto.documentoTransporte,
            });

            if (carpetaCodigo) {
              const store = loadLiveStore();
              const folder = store.carpetas.find(
                (c) => c.numero_carpeta.toUpperCase() === carpetaCodigo.toUpperCase()
              );
              if (folder) {
                if (!Array.isArray(folder.costos_estimados)) {
                  folder.costos_estimados = [];
                }
                const existingCostIdx = folder.costos_estimados.findIndex(
                  (ce) => ce.comprobante_estimado === ingresoCosto.comprobanteEstimado
                );
                const costItem: CostoEstimadoItem = {
                  id:
                    existingCostIdx >= 0 && folder.costos_estimados[existingCostIdx]
                      ? folder.costos_estimados[existingCostIdx].id
                      : crypto.randomUUID(),
                  comprobante_estimado: ingresoCosto.comprobanteEstimado,
                  tipo_comprobante: ingresoCosto.tipoComprobante,
                  numero_estimado: ingresoCosto.numeroComprobante,
                  proveedor_nombre: ingresoCosto.proveedorNombre,
                  fecha_evento: ingresoCosto.fechaEvento,
                  fecha_cumplido: ingresoCosto.fechaCumplido,
                  moneda: ingresoCosto.moneda,
                  monto: ingresoCosto.monto,
                  monto_usd: ingresoCosto.montoUsd,
                  emisor_operador: ingresoCosto.emisorOperador,
                  gmail_message_id: msg.id,
                  estado_conciliacion: 'PENDIENTE_FACTURA',
                };

                if (existingCostIdx >= 0) {
                  folder.costos_estimados[existingCostIdx] = costItem;
                } else {
                  folder.costos_estimados.push(costItem);
                }

                saveLiveStore(store);
                recalculateFolderFinancials(folder.id);
              }
            }
            continue;
          }

          // C. Check Container Tracking
          const trackingData = parseContainerTrackingEmail(msg.subject, msg.bodyText);
          if (trackingData && trackingData.carpetaCodigo) {
            const { carpetaUuid, carpetaCodigo: resolvedCode } = await resolveOrEnsureCarpetaUuid(trackingData.carpetaCodigo, {
              emailSubject: msg.subject,
              sender: msg.from,
              mailbox: mb.email,
              emailDate: msg.date,
              clientName: trackingData.consignee,
              consigneeName: trackingData.consignee,
              blNumber: trackingData.hbl,
              containerNumber: trackingData.containers[0] ?? null,
              originPort: trackingData.pol,
              destinationPort: trackingData.pod,
              shippingLine: trackingData.carrier || trackingData.buque || undefined,
            });

            const store = loadLiveStore();
            if (!Array.isArray(store.eventos_tracking)) {
              store.eventos_tracking = [];
            }
            const trackingRecord: TrackingEventRecord = {
              id: `trk-${msg.id}`,
              carpeta_codigo: trackingData.carpetaCodigo,
              tipo_evento: msg.subject.includes('Actualización') ? 'ETA_UPDATE' : 'TRACKING_UPDATE',
              buque: trackingData.buque ?? null,
              carrier: trackingData.carrier ?? null,
              pol: trackingData.pol ?? null,
              pod: trackingData.pod ?? null,
              etd: trackingData.etd ?? null,
              eta: trackingData.eta ?? null,
              containers: trackingData.containers,
              mbl: trackingData.mbl ?? null,
              hbl: trackingData.hbl ?? null,
              raw_subject: msg.subject,
              fecha_evento: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
              gmail_message_id: msg.id,
            };

            persistTrackingEventRecord(trackingRecord);

            // Actualizar store.carpetas (eta, etd, buque_vuelo, transportista, cliente, etc.) y registrar hito
            const targetFolder = store.carpetas.find(
              (c) =>
                (carpetaUuid && c.id === carpetaUuid) ||
                c.numero_carpeta.toUpperCase() === trackingData.carpetaCodigo!.toUpperCase() ||
                (resolvedCode && c.numero_carpeta.toUpperCase() === resolvedCode.toUpperCase())
            );

            if (targetFolder) {
              if (trackingData.eta) targetFolder.eta = trackingData.eta;
              if (trackingData.etd) targetFolder.etd = trackingData.etd;
              if (
                trackingData.buque &&
                (!targetFolder.buque_vuelo ||
                  targetFolder.buque_vuelo.includes('Por Confirmar') ||
                  targetFolder.buque_vuelo === '')
              ) {
                targetFolder.buque_vuelo = trackingData.buque;
              }
              if (trackingData.carrier && !targetFolder.transportista_nombre) {
                targetFolder.transportista_nombre = trackingData.carrier;
              }
              if (
                trackingData.consignee &&
                (!targetFolder.cliente_nombre ||
                  targetFolder.cliente_nombre.includes('Operación Logística'))
              ) {
                targetFolder.cliente_nombre = trackingData.consignee;
              }
              if (trackingData.shipper && !targetFolder.shipper_nombre) {
                targetFolder.shipper_nombre = trackingData.shipper;
              }
              if (trackingData.mbl && !targetFolder.mbl_mawb) {
                targetFolder.mbl_mawb = trackingData.mbl;
              }
              if (trackingData.hbl && !targetFolder.hbl_hawb) {
                targetFolder.hbl_hawb = trackingData.hbl;
              }
              if (trackingData.containers && trackingData.containers.length > 0 && !targetFolder.contenedor) {
                targetFolder.contenedor = trackingData.containers.join(', ');
              }
              targetFolder.updated_at = new Date().toISOString();

              persistEventoRecord({
                id: `ev-trk-${msg.id}`,
                carpeta_id: targetFolder.id,
                hito: msg.subject.includes('Actualización') ? 'ARRIBO_ETA' : 'ZARPE_ETD',
                titulo: `Actualización de Tracking: ${trackingData.buque || trackingData.carrier || 'Naviera'}`,
                descripcion: `ETA: ${trackingData.eta ?? 'S/D'} | ETD: ${trackingData.etd ?? 'S/D'} | Buque: ${trackingData.buque ?? 'S/D'} | Contenedores: ${trackingData.containers.join(', ')}`,
                fecha_evento: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
                creado_por: null,
                completado: true,
                es_critico: false,
                metadata: {
                  source_mailbox: mb.email,
                  message_id: msg.id,
                  buque: trackingData.buque,
                  carrier: trackingData.carrier,
                  eta: trackingData.eta,
                  etd: trackingData.etd,
                  containers: trackingData.containers,
                },
                created_at: new Date().toISOString(),
              });
              if (targetFolder) {
                scheduleSupabaseSync('carpetas', targetFolder);
              }
            }

            saveLiveStore(store);
            trackingEventsCount++;
            continue;
          }
        }

        const refs = detectShipmentReferences({
          subject: msg.subject,
          snippet: msg.snippet,
          body: msg.bodyText,
          attachmentNames: msg.attachments.map((a) => a.filename),
        });

        let rawFolderCode =
          refs.primaryFolder || (refs.folderCodes.length > 0 ? refs.folderCodes[0] : null);

        // If no explicit Cxxxx code in subject/body, also match against manually or automatically created folders by Container / BL / Booking
        if (
          !rawFolderCode &&
          (refs.containerNumbers.length > 0 || refs.blNumbers.length > 0 || refs.bookingNumbers.length > 0)
        ) {
          const emailDeduction = deduceFolderForInvoice(
            {
              concepto_gasto: `${msg.subject} ${msg.snippet || ''}`,
              metadata_raw: {
                email_subject: msg.subject,
                detected_containers: refs.containerNumbers,
                detected_bl: refs.blNumbers,
                detected_bookings: refs.bookingNumbers,
              },
            },
            loadLiveStore().carpetas
          );
          if (emailDeduction) {
            rawFolderCode = emailDeduction.suggestedCarpeta.numero_carpeta;
          }
        }

        // Process message for operational folder detection & timeline attachment even without PDF
        if (rawFolderCode) {
          const { carpetaCodigo } = await resolveOrEnsureCarpetaUuid(
            rawFolderCode,
            {
              emailSubject: msg.subject,
              sender: msg.from,
              mailbox: mb.email,
              emailDate: msg.date,
              consigneeName: refs.consigneeName,
              blNumber: refs.blNumbers[0] ?? null,
              containerNumber: refs.containerNumbers[0] ?? null,
              bookingNumber: refs.bookingNumbers[0] ?? null,
            }
          );

          if (carpetaCodigo) {
            const formattedMail: MailMessage = {
              id: msg.id,
              threadId: msg.threadId,
              from: msg.from,
              fromName: formatMailSenderName(msg.from, msg.subject),
              to: Array.isArray(msg.to) ? msg.to : [msg.to],
              date: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
              subject: msg.subject,
              bodyExcerpt: msg.bodyText
                ? msg.bodyText.slice(0, 300).trim()
                : (msg.snippet || '').slice(0, 300).trim(),
              attachments: msg.attachments.map((a) => ({
                name: a.filename,
                size: `${(a.size / 1024).toFixed(1)} KB`,
                url: `/api/documentos/preview?id=${encodeURIComponent(msg.id)}&file=${encodeURIComponent(a.filename)}`,
                tipo: a.filename.toLowerCase().includes('bl') ? 'Bill of Lading' : 'Documento Adjunto',
              })),
            };

            const updatedFolder = attachEmailToFolder(carpetaCodigo, formattedMail);
            if (updatedFolder) {
              const dynamicActors = extractActorsFromFolder(updatedFolder, updatedFolder.evidencia_gmail || []);
              if (dynamicActors.length > 0) {
                const store = loadLiveStore();
                const folderInStore = store.carpetas.find(
                  (c) => c.numero_carpeta.toUpperCase() === carpetaCodigo.toUpperCase()
                );
                if (folderInStore) {
                  folderInStore.actores_expediente = dynamicActors;
                  saveLiveStore(store);
                }
              }
            }
          }
        }

        const pdfAttachments = msg.attachments.filter(
          (att) =>
            (att.filename.toLowerCase().endsWith('.pdf') || att.mimeType === 'application/pdf') &&
            !NOISE_FILENAME_REGEX.test(att.filename)
        );

        for (const att of pdfAttachments) {
          mbPdfsProcessed++;
          totalPdfsProcessed++;

          const dedupeKey = `${msg.id}_${att.attachmentId}`;
          if (!forceRescan && isInvoiceAlreadyIngested({ dedupeKey })) {
            mbDuplicatesSkipped++;
            totalDuplicatesSkipped++;
            continue;
          }

          try {
            // Download PDF attachment in-memory (zero-disk)
            const downloaded = await client.getAttachment(msg.id, att.attachmentId, {
              impersonateEmail: mb.email,
              filename: att.filename,
              mimeType: att.mimeType,
            });

            const fileSha256 = crypto.createHash('sha256').update(downloaded.data).digest('hex');

            // Check SHA-256 idempotency (prevents re-ingesting same PDF forwarded across mailboxes)
            if (!forceRescan && isInvoiceAlreadyIngested({ dedupeKey, sha256: fileSha256 })) {
              mbDuplicatesSkipped++;
              totalDuplicatesSkipped++;
              continue;
            }

            // Validate PDF binary integrity
            const validation = validatePdfBuffer(downloaded.data);
            if (!validation.valid) {
              await quarantineCorruptDocument({
                filename: att.filename,
                buffer: downloaded.data,
                error: validation.error || 'PDF corrupto o ilegible en ingesta Gmail',
                source: `GMAIL:${mb.email}`,
                metadata: {
                  messageId: msg.id,
                  subject: msg.subject,
                  sender: msg.from,
                },
              });
              continue;
            }

            // Run Phase 2 Calibrated Extractor + Pre-Extraction Document Classifier
            const extraction = await extractInvoiceFromContent({
              pdfBuffer: downloaded.data,
              filename: att.filename,
              emailContext: {
                subject: msg.subject,
                sender: msg.from,
                snippet: msg.snippet,
              },
              preferEngine,
            });

            const extData = extraction.data;
            const docClass = extraction.documentClassification;

            // Resolve explicit folder code (from email subject/filename or PDF text)
            const detectedFolderCode =
              rawFolderCode ||
              (extData.carpetasDetected && extData.carpetasDetected.length > 0
                ? extData.carpetasDetected[0]
                : null) ||
              null;

            let { carpetaUuid, carpetaCodigo } = await resolveOrEnsureCarpetaUuid(
              detectedFolderCode,
              {
                emailSubject: msg.subject,
                sender: msg.from,
                mailbox: mb.email,
                emailDate: msg.date,
                consigneeName: refs.consigneeName,
                blNumber: refs.blNumbers[0] ?? extData.logisticsMetadata?.blNumber ?? null,
                containerNumber:
                  refs.containerNumbers[0] ??
                  extData.logisticsMetadata?.containerNumbers?.[0] ??
                  null,
                bookingNumber:
                  refs.bookingNumbers[0] ?? extData.logisticsMetadata?.bookingNumber ?? null,
              }
            );

            let deductionMatchType: string | null = null;
            if (carpetaUuid && detectedFolderCode) {
              if (refs.primaryFolder && refs.primaryFolder.toUpperCase() === detectedFolderCode.toUpperCase()) {
                if (refs.sourceConfidence === 'HIGH') {
                  deductionMatchType = `SUBJECT_MATCH:${refs.primaryFolder}`;
                } else if (refs.sourceConfidence === 'MEDIUM') {
                  deductionMatchType = `ATTACHMENT_MATCH:${refs.primaryFolder}`;
                } else {
                  deductionMatchType = `BODY_MATCH:${refs.primaryFolder}`;
                }
              } else if (
                extData.carpetasDetected &&
                extData.carpetasDetected.length > 0 &&
                extData.carpetasDetected[0] &&
                extData.carpetasDetected[0].toUpperCase() === detectedFolderCode.toUpperCase()
              ) {
                deductionMatchType = `PDF_MATCH:${extData.carpetasDetected[0]}`;
              } else {
                deductionMatchType = `EXPLICIT_FOLDER_CODE:${detectedFolderCode}`;
              }
            }

            // If no explicit folder code was found, run Smart Folder Deduction (Container > BL > Booking > CUIT)
            if (!carpetaUuid) {
              const deduction = deduceFolderForInvoice(
                {
                  concepto_gasto: `${msg.subject} ${att.filename}`,
                  metadata_raw: {
                    email_subject: msg.subject,
                    detected_containers: [
                      ...refs.containerNumbers,
                      ...(extData.logisticsMetadata?.containerNumbers ?? []),
                    ],
                    detected_bl: [
                      ...refs.blNumbers,
                      ...(extData.logisticsMetadata?.blNumber
                        ? [extData.logisticsMetadata.blNumber]
                        : []),
                    ],
                    detected_bookings: [
                      ...refs.bookingNumbers,
                      ...(extData.logisticsMetadata?.bookingNumber
                        ? [extData.logisticsMetadata.bookingNumber]
                        : []),
                    ],
                  },
                },
                loadLiveStore().carpetas
              );

              if (deduction) {
                carpetaUuid = deduction.suggestedCarpeta.id;
                carpetaCodigo = deduction.suggestedCarpeta.numero_carpeta;
                deductionMatchType = `${deduction.matchType}:${deduction.matchedValue}`;
              }
            }

            // Persist PDF binary (dual-mode: disk + Supabase Storage if configured)
            const pdfPersist = await persistIngestedPdfBinary({
              buffer: downloaded.data,
              filename: att.filename,
              sha256: fileSha256,
              carpetaCodigo,
            });

            // =========================================================================
            // BRANCH A: OPERATIONAL SHIPPING DOCUMENT (BL, PACKING LIST, LMAN, PROFORMA)
            // Route to `documentos` (never pollute `comprobantes` with non-invoice PDFs)
            // =========================================================================
            const isPackingList =
              /^PL(?:\s*\(\d+\)|\s*[-_].*)?\.PDF$/i.test(att.filename) ||
              /\b(?:PACKING[\s_-]*LIST|LISTA[\s_-]*DE[\s_-]*EMPAQUE|PL_|PL\s)/i.test(att.filename) ||
              /\b(?:PACKING[\s_-]*LIST|LISTA[\s_-]*DE[\s_-]*EMPAQUE)\b/i.test(msg.subject);

            const isPrefactura =
              /\b(?:PRE[\s_-]*FACTURA|PREFACTURA)\b/i.test(att.filename) ||
              /\b(?:PRE[\s_-]*FACTURA|PREFACTURA)\b/i.test(msg.subject);

            const isRemito =
              /\b(?:REMITO|RTO|ENV[IÍ]O\s+MERCADER[IÍ]A)\b/i.test(att.filename) ||
              /^RE_\d{4,5}[_-]\d{5,8}/i.test(att.filename) ||
              /\b(?:REMITO|RTO|ENV[IÍ]O\s+MERCADER[IÍ]A)\b/i.test(msg.subject) ||
              docClass?.category === 'REMITO_CARGA';

            const isZeroOrNegative = (extData.totalAmount || 0) <= 0 && (extData.subtotal || 0) <= 0;

            const isFallbackUnresolvedInvoice =
              /manos\s*publicidad|tucci@tucciweb|anna\s*zimmermann|biercomp/i.test(
                `${msg.from} ${extData.issuerName}`
              ) ||
              ((extData.issuerName === 'PROVEEDOR GENERAL' ||
                !extData.issuerTaxId ||
                extData.issuerTaxId === '20-12345678-9') &&
                [100, 121, 1210, 12100, 7.26].includes(Number(extData.totalAmount || 0)));

            const shouldRouteToDocumentos =
              (docClass && !docClass.isAccountingVoucher) ||
              isPackingList ||
              isPrefactura ||
              isRemito ||
              isZeroOrNegative ||
              isFallbackUnresolvedInvoice;

            if (shouldRouteToDocumentos) {
              const docId = crypto.randomUUID();
              const category = isRemito
                ? 'REMITO_CARGA'
                : isPackingList
                ? 'PACKING_LIST'
                : isPrefactura
                ? 'PROFORMA_COMERCIAL'
                : docClass?.category ?? 'OTRO_OPERATIVO';

              const docRecord: DocumentoRecord = {
                id: docId,
                carpeta_id: carpetaUuid,
                nombre_archivo: att.filename,
                ruta_storage:
                  pdfPersist.publicUrl ||
                  `legajo/${carpetaCodigo ?? 'general'}/${fileSha256.slice(0, 10)}_${att.filename}`,
                tipo_mime: att.mimeType || 'application/pdf',
                tamanio_bytes: downloaded.data.length,
                sha256_hash: fileSha256,
                origen: 'GMAIL_INGESTION',
                gmail_message_id: msg.id,
                gmail_attachment_id: att.attachmentId,
                estado_procesamiento: 'PROCESADO',
                metadata_extraida: {
                  document_category: category,
                  rationale: isRemito
                    ? 'Remito de Carga / Envío de Mercadería del cliente para legajo operativo'
                    : isPackingList
                    ? 'Packing List operativo'
                    : isPrefactura
                    ? 'Prefactura / Proforma comercial'
                    : (docClass?.rationale ?? 'Documento operativo no contable'),
                  confidence: 0.98,
                  source_mailbox: mb.email,
                  email_subject: msg.subject,
                  sender: msg.from,
                  message_id: msg.id,
                  attachment_id: att.attachmentId,
                  carpeta_codigo: carpetaCodigo,
                  detected_bl: refs.blNumbers,
                  detected_containers: refs.containerNumbers,
                  consignee_name: refs.consigneeName ?? null,
                } as unknown as Json,
                error_mensaje: null,
                subido_por: null,
                created_at: new Date().toISOString(),
              };

              if (saveToDb) {
                await persistDocumentoRecord(docRecord, dedupeKey);
                if (carpetaUuid) {
                  persistEventoRecord({
                    id: `ev-doc-${fileSha256.slice(0, 12)}`,
                    carpeta_id: carpetaUuid,
                    hito:
                      docClass?.category === 'AVISO_OPERATIVO'
                        ? 'ZARPE_ETD'
                        : docClass?.category === 'BL_AWB_CRT'
                          ? 'EMISION_BL_HAWB_CRT'
                          : 'DOCUMENTACION_VALIDADA',
                    titulo: `Ingesta Gmail (${category}): ${att.filename}`,
                    descripcion: `Documento operativo recibido en ${mb.email} — Asunto: "${msg.subject}". Clasificación: ${docClass?.rationale ?? category}`,
                    fecha_evento: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
                    creado_por: null,
                    completado: true,
                    es_critico: docClass?.category === 'AVISO_OPERATIVO',
                    metadata: {
                      source_mailbox: mb.email,
                      message_id: msg.id,
                      filename: att.filename,
                      category,
                    },
                    created_at: new Date().toISOString(),
                  });
                }
              }

              mbOperationalDocsCatalogued++;
              newOperationalDocs.push({
                id: docId,
                sourceMailbox: mb.email,
                messageId: msg.id,
                emailSubject: msg.subject,
                filename: att.filename,
                documentCategory: category,
                carpetaId: carpetaUuid,
                carpetaCodigo,
                sha256: fileSha256,
              });
              continue;
            }

            // =========================================================================
            // BRANCH B: ACCOUNTING VOUCHER (`FACTURA_A`, `FACTURA_B`, `INVOICE_EXTERIOR`)
            // Route to `comprobantes` with calibrated fiscal classification
            // =========================================================================
            const invoiceId = crypto.randomUUID();

            const rawCurrency = ((extData.currency as string) || 'USD').toUpperCase();
            const normalizedCurrency = (
              ['USD', 'ARS', 'EUR', 'GBP', 'BRL', 'CNY'].includes(rawCurrency)
                ? rawCurrency
                : 'USD'
            ) as 'USD' | 'ARS' | 'EUR' | 'GBP' | 'BRL' | 'CNY';

            // Prevent ALMAR self-inversion on issuer name & CUIT
            const { emisorNombre, emisorCuit, proveedorExterior } = sanitizeIssuerIdentity(
              extData.issuerName,
              extData.issuerTaxId,
              msg.from,
              msg.subject,
              normalizedCurrency
            );

            const cleanTax = emisorCuit.replace(/\D/g, '');
            const isArgentineCuit = /^(20|23|24|27|30|33|34)/.test(cleanTax);
            const isDomesticArs = normalizedCurrency === 'ARS';

            const voucherType: ComprobanteRecord['tipo_comprobante'] =
              docClass?.voucherType === 'FACTURA_A' || docClass?.voucherType === 'FACTURA_B'
                ? docClass.voucherType
                : docClass?.voucherType === 'NOTA_CREDITO'
                  ? 'CREDIT_NOTE'
                  : docClass?.voucherType === 'NOTA_DEBITO'
                    ? 'DEBIT_NOTE'
                    : (isDomesticArs || isArgentineCuit)
                      ? 'FACTURA_A'
                      : 'INVOICE_EXTERIOR';

            const isForeignSupplier =
              !isArgentineCuit &&
              !isDomesticArs &&
              (proveedorExterior ||
                voucherType === 'INVOICE_EXTERIOR' ||
                emisorCuit.startsWith('50-') ||
                isKnownInternationalCarrier(emisorNombre));

            const fiscalClass = classifyFiscalItem(
              `${extData.lineItems[0]?.description ?? ''} ${msg.subject} ${att.filename}`,
              {
                issuerName: emisorNombre,
                issuerTaxId: emisorCuit,
                isForeignIssuer: isForeignSupplier,
                invoiceType: voucherType,
                currency: normalizedCurrency,
              }
            );

            const fechaEmision = msg.date
              ? new Date(msg.date).toISOString().split('T')[0] ??
                new Date().toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10);

            const fechaVencimiento = new Date(Date.now() + 30 * 86400000)
              .toISOString()
              .split('T')[0]!;

            const totalAmount = extData.totalAmount || extData.subtotal || 0;
            const subtotalNeto = extData.subtotal || totalAmount;
            const montoIva = extData.ivaAmount ?? Math.max(0, totalAmount - subtotalNeto);
            const effectiveIvaRate =
              montoIva > 0 && extData.ivaRate > 0 ? extData.ivaRate : fiscalClass.ivaRate;

            const comprobanteRecord: ComprobanteRecord & {
              carpeta_codigo?: string | null;
              gmail_message_id?: string | null;
              gmail_attachment_id?: string | null;
              sha256_hash?: string | null;
              source_mailbox?: string | null;
              archivo_url?: string | null;
            } = {
              id: invoiceId,
              carpeta_id: carpetaUuid,
              carpeta_codigo: carpetaCodigo,
              tipo_comprobante: voucherType,
              direccion: 'COMPRA',
              numero_comprobante:
                extData.invoiceNumber || `GM-${msg.id.slice(0, 8).toUpperCase()}`,
              emisor_cuit: emisorCuit,
              emisor_razon_social: emisorNombre,
              proveedor_exterior: isForeignSupplier,
              concepto_gasto: `${msg.subject.slice(0, 100)} (${att.filename})`,
              clasificacion_gasto: fiscalClass.suggestedExpenseCategory,
              tipo_iva:
                effectiveIvaRate === 21
                  ? 'IVA_21_GENERAL'
                  : effectiveIvaRate === 10.5
                    ? 'IVA_10_5_REDUCIDO'
                    : fiscalClass.ivaCategory,
              categoria_fiscal:
                effectiveIvaRate === 21 ? 'NACIONAL_GRAVADO_21' : fiscalClass.fiscalCategory,
              moneda: normalizedCurrency,
              tipo_cambio: 1.0,
              subtotal_neto: subtotalNeto,
              alicuota_iva: effectiveIvaRate,
              monto_iva: montoIva,
              monto_total: totalAmount,
              estado_pago: 'PENDIENTE',
              fecha_emision: fechaEmision,
              fecha_vencimiento: fechaVencimiento,
              archivo_url: pdfPersist.publicUrl,
              archivo_pdf_url: pdfPersist.publicUrl,
              documento_id: null,
              score_confianza: extraction.confidenceScore ?? 0.95,
              gmail_message_id: msg.id,
              gmail_attachment_id: att.attachmentId,
              sha256_hash: fileSha256,
              source_mailbox: mb.email,
              metadata_raw: {
                source_mailbox: mb.email,
                email_subject: msg.subject,
                sender: msg.from,
                filename: att.filename,
                sha256: fileSha256,
                message_id: msg.id,
                attachment_id: att.attachmentId,
                carpeta_codigo: carpetaCodigo,
                document_category: docClass?.category ?? 'FACTURA_LOCAL',
                deduction_match_type: deductionMatchType,
                detected_containers: refs.containerNumbers,
                detected_bl: refs.blNumbers,
              },
              creado_por: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            let savedToSupabase = false;
            if (saveToDb) {
              const persistRes = await persistComprobanteRecord(comprobanteRecord, dedupeKey);
              savedToSupabase = persistRes.savedToSupabase;
              if (carpetaUuid || carpetaCodigo) {
                try {
                  recalculateFolderFinancials(carpetaUuid || carpetaCodigo!);
                } catch (recalcErr) {
                  console.warn(`[MultiSync] Error recalculating financials for ${carpetaUuid || carpetaCodigo}:`, recalcErr);
                }
              }
              if (carpetaUuid) {
                persistEventoRecord({
                  id: `ev-inv-${fileSha256.slice(0, 12)}`,
                  carpeta_id: carpetaUuid,
                  hito: 'PAGO_FLETE_PROVEEDOR',
                  titulo: `Comprobante Recibido (${comprobanteRecord.numero_comprobante}): ${emisorNombre}`,
                  descripcion: `Factura ${comprobanteRecord.tipo_comprobante} por ${normalizedCurrency} ${totalAmount.toLocaleString('es-AR')} ingresada vía ${mb.email}.`,
                  fecha_evento: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
                  creado_por: null,
                  completado: true,
                  es_critico: false,
                  metadata: {
                    source_mailbox: mb.email,
                    comprobante_id: invoiceId,
                    numero_comprobante: comprobanteRecord.numero_comprobante,
                  },
                  created_at: new Date().toISOString(),
                });
              }
            }

            const invoiceSummary: IngestedInvoiceSummary = {
              id: invoiceId,
              sourceMailbox: mb.email,
              messageId: msg.id,
              emailSubject: msg.subject,
              emailDate: msg.date,
              sender: msg.from,
              filename: att.filename,
              carpetaId: carpetaUuid,
              carpetaCodigo: carpetaCodigo,
              tipoComprobante: comprobanteRecord.tipo_comprobante,
              numeroComprobante: comprobanteRecord.numero_comprobante,
              emisorNombre,
              emisorCuit,
              moneda: normalizedCurrency,
              total: totalAmount,
              estadoAuditoria: 'PENDIENTE_AUDITORIA',
              pdfValid: true,
              sha256: fileSha256,
              savedToSupabase,
              documentCategory: docClass?.category ?? 'FACTURA_LOCAL',
              deductionMatchType,
            };

            await logAuditEvent({
              userId: null,
              userEmail: mb.email,
              userRole: 'SYSTEM_WORKER',
              action: 'INGESTAR_FACTURA',
              entity: 'comprobantes',
              entityId: invoiceId,
              ipAddress: '127.0.0.1',
              userAgent: 'Almar Gmail Multi-Mailbox Synchronizer',
              details: {
                mailbox: mb.email,
                messageId: msg.id,
                filename: att.filename,
                carpetaCodigo,
                carpetaUuid,
                deductionMatchType,
                total: invoiceSummary.total,
                moneda: invoiceSummary.moneda,
                sha256: fileSha256,
              },
            });

            newInvoices.push(invoiceSummary);
            mbInvoicesIngested++;
          } catch (attErr: unknown) {
            const m = attErr instanceof Error ? attErr.message : String(attErr);
            console.error(
              `[Sync Mailboxes] Error procesando adjunto ${att.filename} en ${mb.email}: ${m}`
            );
          }
        }
      }

      // 3. Persist updated cursor state for this mailbox
      const currentStore = loadLiveStore();
      recalculateMailboxEmailStats(currentStore, mb.email);
      saveLiveStore(currentStore);
      const updatedMbState = currentStore.mailboxSyncState[mb.email];

      await updateMailboxCursorState(mb.email, {
        history_id: currentHistoryId,
        last_synced_at: new Date().toISOString(),
        last_message_date: latestMsgDate,
        messages_processed_total: (prevState?.messages_processed_total ?? 0) + mbMessagesFound,
        invoices_ingested_total: (prevState?.invoices_ingested_total ?? 0) + mbInvoicesIngested,
        emails_recibidos_total: updatedMbState?.emails_recibidos_total ?? 0,
        emails_respondidos_total: updatedMbState?.emails_respondidos_total ?? 0,
        emails_pendientes_respuesta: updatedMbState?.emails_pendientes_respuesta ?? 0,
        tiempo_respuesta_promedio_min: updatedMbState?.tiempo_respuesta_promedio_min ?? 0,
        status: 'ACTIVE',
        last_error: null,
        consecutive_failures: 0,
      });
    } catch (mbErr: unknown) {
      const m = mbErr instanceof Error ? mbErr.message : String(mbErr);
      mbError = m;
      console.warn(`[Sync Mailboxes] Error consultando casilla ${mb.email}: ${m}`);

      await updateMailboxCursorState(mb.email, {
        last_synced_at: new Date().toISOString(),
        status: 'ERROR',
        last_error: m,
        consecutive_failures: (prevState?.consecutive_failures ?? 0) + 1,
      });
    }

    return {
      email: mb.email,
      name: mb.name,
      role: mb.role,
      success: !mbError,
      historyId: currentHistoryId,
      cursorUnchanged,
      messagesFound: mbMessagesFound,
      pdfsProcessed: mbPdfsProcessed,
      invoicesIngested: mbInvoicesIngested,
      operationalDocsCatalogued: mbOperationalDocsCatalogued,
      duplicatesSkipped: mbDuplicatesSkipped,
      durationMs: Date.now() - mbStartMs,
      error: mbError,
    };
  };

  // Process mailboxes in parallel batches of `concurrency`
  for (let i = 0; i < targetMailboxes.length; i += concurrency) {
    const batch = targetMailboxes.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((mb) => processSingleMailbox(mb)));
    mailboxResults.push(...batchResults);
  }

  let quotesCount = 0;
  let ingestedQuotesList: IngestedQuoteSummary[] = [];

  if (options?.includeCommercialQuotes) {
    try {
      const commReport = await syncCommercialQuotations({
        concurrency,
        maxMessagesPerMailbox: options.maxMessagesPerMailbox,
        preferEngine:
          options.preferEngine === 'ollama' ? 'deterministic' : options.preferEngine,
      });
      quotesCount = commReport.totalQuotesIngested;
      ingestedQuotesList = commReport.quotes;
    } catch (commErr) {
      console.warn('[Sync Mailboxes] Error en sincronización comercial secundaria:', commErr);
    }
  }

  let threadSyncResult: SyncThreadsResult | undefined;
  if (options?.syncThreads !== false) {
    try {
      threadSyncResult = await syncMailboxThreadsAndInteractions({
        mailboxes: targetMailboxes.map((m) => m.email),
        maxMessagesPerMailbox: options?.maxMessagesPerMailbox ? Math.max(options.maxMessagesPerMailbox, 15) : 25,
        afterDate: options?.afterDate,
        saveToStore: saveToDb,
      });
    } catch (threadErr) {
      console.warn('[Sync Mailboxes] Error en sincronización de hilos e interacciones:', threadErr);
    }
  }

  const endMs = Date.now();
  return {
    timestamp: startTime,
    completedAt: new Date(endMs).toISOString(),
    durationMs: endMs - startMs,
    totalMailboxesScanned: targetMailboxes.length,
    totalMessagesFound,
    totalPdfsProcessed,
    totalInvoicesIngested: newInvoices.length,
    totalOperationalDocsCatalogued: newOperationalDocs.length,
    totalDuplicatesSkipped,
    mailboxes: mailboxResults,
    invoices: newInvoices,
    operationalDocuments: newOperationalDocs,
    alertsCreated: alertsCreatedCount,
    trackingEventsCount,
    quotesCount,
    totalAlertsGenerated: alertsCreatedCount,
    totalTrackingEventsProcessed: trackingEventsCount,
    totalQuotesIngested: quotesCount,
    quotes: ingestedQuotesList,
    threadInteractions: threadSyncResult,
  };
}

// ============================================================================
// Milestone 2 (R2): Commercial Quotations Synchronization & Intent Analysis
// ============================================================================

export const DEFAULT_COMMERCIAL_QUOTE_QUERY =
  '(cotizacion OR cotización OR tarifa OR quote OR quotation OR flete OR FCL OR LCL OR aereo OR aérea OR validez OR oferta) -is:draft';

export interface QuoteIntentAnalysis {
  isQuote: boolean;
  confidence: number;
  matchedKeywords: string[];
  detectedMode?: 'MARITIMO_FCL' | 'MARITIMO_LCL' | 'AEREO' | 'TERRESTRE';
  detectedFolderCode?: string | null;
}

export function analyzeCommercialQuoteIntent(msg: {
  subject: string;
  snippet?: string;
  bodyText?: string;
}): QuoteIntentAnalysis {
  const text = `${msg.subject} ${msg.snippet ?? ''} ${msg.bodyText?.slice(0, 1000) ?? ''}`.toLowerCase();

  // Strong negative filters (invoice receipts, banking notices, auto replies, promotional spam)
  if (
    (/^(?:factura\s+[ab]|nota\s+de\s+cr[eé]dito|recibo\s+oficial|orden\s+de\s+pago)\b/i.test(msg.subject) &&
      !/cotiz/i.test(msg.subject)) ||
    /cupones\s+incre[ií]bles/i.test(text)
  ) {
    return { isQuote: false, confidence: 0, matchedKeywords: [] };
  }

  const keywords: string[] = [];
  let score = 0;

  // Primary quote markers (+40 each)
  if (/\b(?:cotizaci[oó]n|cotizar|coti|presupuesto|quote|quotation|qt\s*\d+|offer|oferta|roi\s*\d+)\b/i.test(text)) {
    keywords.push('cotizacion');
    score += 40;
  }
  if (/\b(?:tarifa|tarifas|rate|pricing)\b/i.test(text)) {
    keywords.push('tarifa');
    score += 30;
  }
  if (/\b(?:flete|freight|ocean\s*freight|air\s*freight|importaci[oó]n\s+ftl)\b/i.test(text)) {
    keywords.push('flete');
    score += 25;
  }

  // Modality markers (+20 each)
  let detectedMode: QuoteIntentAnalysis['detectedMode'];
  if (/\b(?:fcl|40hc|40\s*hq|20\s*ft|contenedor|cntr)\b/i.test(text)) {
    keywords.push('fcl');
    score += 20;
    detectedMode = 'MARITIMO_FCL';
  } else if (/\b(?:lcl|carga\s*suelta|cbm|cbms|m3|metro\s*cubico|w\/m)\b/i.test(text)) {
    keywords.push('lcl');
    score += 20;
    detectedMode = 'MARITIMO_LCL';
  } else if (/\b(?:a[eé]reo|air\s*cargo|awb|kg|kilos|tasable)\b/i.test(text)) {
    keywords.push('aereo');
    score += 20;
    detectedMode = 'AEREO';
  } else if (/\b(?:terrestre|ftl|camion|crt|drayage|tramo\s*local)\b/i.test(text)) {
    keywords.push('terrestre');
    score += 20;
    detectedMode = 'TERRESTRE';
  }

  // Currency & pricing terms (+20)
  if (/\b(?:usd|u\$s|\$|eur|€|fob|cif|exw|fca|cfr|gastos\s*locales)\b/i.test(text)) {
    keywords.push('pricing_terms');
    score += 20;
  }

  // Extract folder code if present
  const detectedFolderCode = detectFolderCodeFromText(text);

  const isQuote = score >= 40;
  const confidence = Math.min(1.0, score / 100);

  return {
    isQuote,
    confidence,
    matchedKeywords: keywords,
    detectedMode,
    detectedFolderCode,
  };
}

export function extractQuotedThreadTurns(bodyText?: string): string | undefined {
  if (!bodyText) return undefined;
  const splitPattern = /(?:(?:-----Mensaje original-----|De:\s+[^\n]+Enviado el:\s+|On\s+.+wrote:))/i;
  const match = bodyText.search(splitPattern);
  if (match > 0) {
    return bodyText.slice(match).trim();
  }
  return undefined;
}

export interface SyncCommercialQuotesOptions {
  mailboxes?: string[];
  maxMessagesPerMailbox?: number;
  concurrency?: number;
  query?: string;
  preferEngine?: 'gemini' | 'openai' | 'deterministic';
}

export interface CommercialQuotesSyncReport {
  timestamp: string;
  completedAt: string;
  durationMs: number;
  totalMailboxesScanned: number;
  totalMessagesFound: number;
  totalQuotesIngested: number;
  totalDuplicatesSkipped: number;
  mailboxes: Array<{
    email: string;
    success: boolean;
    messagesFound: number;
    quotesIngested: number;
    duplicatesSkipped: number;
    error?: string;
  }>;
  quotes: IngestedQuoteSummary[];
}

export async function syncCommercialQuotations(
  options?: SyncCommercialQuotesOptions
): Promise<CommercialQuotesSyncReport> {
  const startMs = Date.now();
  const startTime = new Date(startMs).toISOString();
  const maxPerMailbox = options?.maxMessagesPerMailbox ?? 5;
  const searchQuery = options?.query ?? DEFAULT_COMMERCIAL_QUOTE_QUERY;
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 3, 6));
  const preferEngine = options?.preferEngine ?? resolveDefaultPreferEngine();

  const targetMailboxEmails =
    options?.mailboxes && options.mailboxes.length > 0
      ? options.mailboxes
      : [...COMMERCIAL_ALMAR_MAILBOXES];

  const client = getGmailClient();
  if (!client.isConfigured()) {
    throw new Error('Google Service Account no está configurado en las variables de entorno.');
  }

  const mailboxReports: CommercialQuotesSyncReport['mailboxes'] = [];
  const ingestedSummaries: IngestedQuoteSummary[] = [];
  let totalMessagesFound = 0;
  let totalDuplicatesSkipped = 0;

  const processMailbox = async (email: string) => {
    let mbMessagesFound = 0;
    let mbQuotesIngested = 0;
    let mbDuplicatesSkipped = 0;
    let mbError: string | undefined;

    try {
      const messages = await client.listMessages({
        impersonateEmail: email,
        query: searchQuery,
        maxResults: maxPerMailbox,
      });

      mbMessagesFound = messages.length;
      totalMessagesFound += mbMessagesFound;

      for (const msg of messages) {
        // Pre-filter with analyzeCommercialQuoteIntent
        const intent = analyzeCommercialQuoteIntent({
          subject: msg.subject,
          snippet: msg.snippet,
        });

        if (!intent.isQuote && !msg.subject.toLowerCase().includes('cotiz')) {
          continue;
        }

        // Get full message detail to read bodyText and rawHeaders
        const detail = await client.getMessage(msg.id, {
          impersonateEmail: email,
          format: 'full',
        });

        const rfcMessageId = detail.rawHeaders?.['message-id'] || undefined;

        // Multi-mailbox cross-copy idempotency check
        if (
          isQuoteAlreadyIngested({
            messageId: msg.id,
            rfcMessageId,
            subject: detail.subject,
            date: detail.date,
          })
        ) {
          mbDuplicatesSkipped++;
          totalDuplicatesSkipped++;
          continue;
        }

        const threadHistory = extractQuotedThreadTurns(detail.bodyText);
        let enrichedQuoteBody = detail.bodyText || '';
        const quotePdfAtt = detail.attachments?.find((a) =>
          a.filename.toLowerCase().endsWith('.pdf')
        );
        if (quotePdfAtt?.attachmentId) {
          try {
            const dlPdf = await client.getAttachment(msg.id, quotePdfAtt.attachmentId, {
              impersonateEmail: email,
              filename: quotePdfAtt.filename,
              mimeType: quotePdfAtt.mimeType,
            });
            const decodedPdfText = extractTextFromPdfBuffer(dlPdf.data);
            if (decodedPdfText) {
              enrichedQuoteBody = `[PDF Cotización Adjunto: ${quotePdfAtt.filename}]\n${decodedPdfText}\n\n[Cuerpo del Correo]:\n${enrichedQuoteBody}`;
            }
          } catch {
            // Ignore PDF download error in quote sync
          }
        }

        const extracted = await extractQuoteFromEmail(
          {
            subject: detail.subject,
            bodyText: enrichedQuoteBody,
            from: detail.from,
            date: detail.date,
            sourceMailbox: email,
            threadHistory,
            preferEngine,
          },
          { preferEngine }
        );

        if (extracted) {
          const record = mapExtractedQuoteToCotizacionRecord(extracted, {
            gmail_message_id: msg.id,
            rfc_message_id: rfcMessageId,
            source_mailbox: email,
            created_at: detail.date ? new Date(detail.date).toISOString() : new Date().toISOString(),
            rawBody: enrichedQuoteBody || detail.bodyText || detail.snippet,
          });

          persistCotizacionRecord(record);
          mbQuotesIngested++;

          ingestedSummaries.push({
            id: record.id,
            numeroCotizacion: record.numeroCotizacion,
            clienteNombre: record.clienteNombre,
            via: record.via,
            fleteVentaUsd: record.fleteVentaUsd,
            margenBrutoUsd: record.margenBrutoUsd,
            estado: record.estado,
            sourceMailbox: email,
            carpetaOperativaId: record.carpetaOperativaId,
            carpetaCodigo: record.carpetaCodigo,
            gmail_message_id: record.gmail_message_id,
            rfc_message_id: record.rfc_message_id,
          });

          logAuditEvent({
            userEmail: email,
            userRole: 'COMMERCIAL_AGENT',
            action: 'INGESTAR_COTIZACION',
            entity: 'cotizaciones',
            entityId: record.id,
            ipAddress: '127.0.0.1',
            userAgent: 'Almar Gmail Commercial Synchronizer',
            details: {
              mailbox: email,
              messageId: msg.id,
              numeroCotizacion: record.numeroCotizacion,
              cliente: record.clienteNombre,
              carpetaCodigo: record.carpetaCodigo,
              fleteVentaUsd: record.fleteVentaUsd,
            },
          });
        }
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err);
      mbError = m;
      console.warn(`[Sync Commercial Quotes] Error en casilla ${email}: ${m}`);
    }

    mailboxReports.push({
      email,
      success: !mbError,
      messagesFound: mbMessagesFound,
      quotesIngested: mbQuotesIngested,
      duplicatesSkipped: mbDuplicatesSkipped,
      error: mbError,
    });
  };

  // Parallel batches
  for (let i = 0; i < targetMailboxEmails.length; i += concurrency) {
    const batch = targetMailboxEmails.slice(i, i + concurrency);
    await Promise.all(batch.map((em) => processMailbox(em)));
  }

  const endMs = Date.now();
  return {
    timestamp: startTime,
    completedAt: new Date(endMs).toISOString(),
    durationMs: endMs - startMs,
    totalMailboxesScanned: targetMailboxEmails.length,
    totalMessagesFound,
    totalQuotesIngested: ingestedSummaries.length,
    totalDuplicatesSkipped,
    mailboxes: mailboxReports,
    quotes: ingestedSummaries,
  };
}

/**
 * Concurrency runner helper that executes tasks with a strict concurrency limit.
 */
async function runWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => task(item)).then((res) => {
      results.push(res);
    });
    const e: Promise<void> = p.then(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    });
    executing.push(e);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

/**
 * Phase 2 & 3: Real Gmail Thread and Reply Synchronizer.
 * Scans INBOX + SENT across authorized ALMAR mailboxes in lightweight `format: 'metadata'` mode,
 * correlates inbound inquiries with employee replies using RFC Message-ID headers and Gmail threadIds,
 * filters bot/automated notifications from the human response denominator, and records exact SLA response times.
 */
export async function syncMailboxThreadsAndInteractions(
  options?: SyncThreadsOptions
): Promise<SyncThreadsResult> {
  const startMs = Date.now();
  const client = getGmailClient();
  if (!client.isConfigured()) {
    throw new Error('Google Service Account no está configurado en las variables de entorno.');
  }

  const afterDate = options?.afterDate || '2026/09/29';
  const maxPerMailbox = options?.maxMessagesPerMailbox ?? 150;
  const concurrency = Math.max(2, Math.min(options?.concurrency ?? 10, 15));
  const saveToStore = options?.saveToStore ?? true;

  const targetMailboxes =
    options?.mailboxes && options.mailboxes.length > 0
      ? AUTHORIZED_ALMAR_MAILBOXES.filter((m) => options.mailboxes!.includes(m.email))
      : AUTHORIZED_ALMAR_MAILBOXES;

  const mailboxSummaries: MailboxThreadSummary[] = [];
  const newInteractionsBatch: EmailInteractionRecord[] = [];

  let totalMessagesProcessed = 0;
  let totalBotsFiltered = 0;
  let totalInboundHuman = 0;
  let totalOutbound = 0;

  const headersToFetch = [
    'Message-ID',
    'In-Reply-To',
    'References',
    'From',
    'To',
    'Cc',
    'Subject',
    'Date',
    'Auto-Submitted',
    'Precedence',
    'X-AutoReply',
  ];

  for (let mbIdx = 0; mbIdx < targetMailboxes.length; mbIdx++) {
    const mb = targetMailboxes[mbIdx]!;
    const mbStartMs = Date.now();
    let mbMessagesProcessed = 0;
    let mbInboundHuman = 0;
    let mbOutbound = 0;
    let mbBotsFiltered = 0;

    try {
      const token = await client.getAccessToken(mb.email);
      const botQueryExclusion = '-from:tracking@almarrosario.com -from:shipsgo -from:kipincargo -from:no-reply -from:noreply';
      const beforeClause = options?.beforeDate ? ` before:${options.beforeDate}` : '';
      const query =
        options?.query ||
        `-is:draft -category:promotions -category:social ${botQueryExclusion} after:${afterDate}${beforeClause}`;

      // 1. List message IDs with pagination up to maxPerMailbox
      const messageIds: string[] = [];
      let pageToken: string | undefined = undefined;

      while (messageIds.length < maxPerMailbox) {
        const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
        url.searchParams.set('q', query);
        url.searchParams.set('maxResults', String(Math.min(maxPerMailbox - messageIds.length, 100)));
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const listRes = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!listRes.ok) break;
        const listData = (await listRes.json()) as {
          messages?: Array<{ id: string; threadId: string }>;
          nextPageToken?: string;
        };

        const foundMsgs = listData.messages || [];
        if (foundMsgs.length === 0) break;

        for (const m of foundMsgs) {
          messageIds.push(m.id);
        }

        pageToken = listData.nextPageToken;
        if (!pageToken) break;
      }

      mbMessagesProcessed = messageIds.length;
      totalMessagesProcessed += mbMessagesProcessed;

      // 2. Fetch metadata concurrently
      const fetchedItems = await runWithConcurrencyLimit(
        messageIds,
        concurrency,
        async (id: string) => {
          try {
            const metaUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
            metaUrl.searchParams.set('format', 'metadata');
            headersToFetch.forEach((h) => metaUrl.searchParams.append('metadataHeaders', h));

            const res = await fetch(metaUrl.toString(), {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return null;
            return (await res.json()) as {
              id: string;
              threadId: string;
              labelIds?: string[];
              snippet?: string;
              payload?: {
                headers?: Array<{ name: string; value: string }>;
              };
            };
          } catch {
            return null;
          }
        }
      );

      // 3. Normalize into EmailInteractionRecord
      for (const item of fetchedItems) {
        if (!item || !item.id) continue;

        const headersMap: Record<string, string> = {};
        for (const h of item.payload?.headers || []) {
          headersMap[h.name.toLowerCase()] = h.value;
        }

        const from = headersMap['from'] || '';
        const to = headersMap['to'] || '';
        const subject = headersMap['subject'] || '(Sin asunto)';
        const dateRaw = headersMap['date'];
        const dateIso =
          dateRaw && !isNaN(new Date(dateRaw).getTime())
            ? new Date(dateRaw).toISOString()
            : new Date().toISOString();

        const rfcMessageId = headersMap['message-id']?.replace(/[<>]/g, '').trim();
        const inReplyTo = headersMap['in-reply-to']?.replace(/[<>]/g, '').trim();
        const references = headersMap['references']?.replace(/[<>]/g, '').trim();

        const fromLower = from.toLowerCase();
        const isGoogleGroupVia = /\bvia\s+[^<]*<[^>]+@almarrosario\.com>/i.test(from);
        const isOutbound =
          !isGoogleGroupVia &&
          (fromLower.includes('@almarrosario.com') || (item.labelIds || []).includes('SENT'));
        const direction: EmailInteractionDirection = isOutbound ? 'OUTBOUND_REPLY' : 'INBOUND';

        const isAutomated = isAutomatedNotificationEmail(from, subject, headersMap);
        if (isAutomated) {
          mbBotsFiltered++;
          totalBotsFiltered++;
        } else if (direction === 'OUTBOUND_REPLY') {
          mbOutbound++;
          totalOutbound++;
        } else {
          mbInboundHuman++;
          totalInboundHuman++;
        }

        const detectedFolder =
          detectFolderCodeFromText(subject) ||
          detectFolderCodeFromText(item.snippet || '') ||
          null;

        const interactionRecord = {
          id: item.id,
          threadId: item.threadId || item.id,
          mailbox: mb.email,
          operadorNombre: mb.name,
          direction,
          from,
          to,
          subject,
          date: dateIso,
          carpetaCodigo: detectedFolder,
          isReplied: false,
          repliedBy: null,
          repliedAt: null,
          responseTimeMinutes: null,
          snippet: item.snippet,
          bodyExcerpt: item.snippet?.slice(0, 300),
          labels: item.labelIds,
          rfcMessageId,
          inReplyTo,
          references,
          isAutomatedNotification: isAutomated,
        } as EmailInteractionRecord;

        newInteractionsBatch.push(interactionRecord);
      }

      if (options?.onProgress) {
        options.onProgress({
          mailbox: mb.email,
          index: mbIdx + 1,
          total: targetMailboxes.length,
          messagesFound: mbMessagesProcessed,
          interactionsSaved: newInteractionsBatch.length,
        });
      }

      mailboxSummaries.push({
        mailbox: mb.email,
        operatorName: mb.name,
        messagesProcessed: mbMessagesProcessed,
        inboundHumanCount: mbInboundHuman,
        outboundCount: mbOutbound,
        botsFilteredCount: mbBotsFiltered,
        repliedCount: 0, // Calculated after cross-thread correlation
        avgResponseTimeMin: 0,
        durationMs: Date.now() - mbStartMs,
      });
    } catch (mbErr) {
      console.warn(`[Sync Threads] Error syncing mailbox ${mb.email}:`, mbErr);
      mailboxSummaries.push({
        mailbox: mb.email,
        operatorName: mb.name,
        messagesProcessed: 0,
        inboundHumanCount: 0,
        outboundCount: 0,
        botsFilteredCount: 0,
        repliedCount: 0,
        avgResponseTimeMin: 0,
        durationMs: Date.now() - mbStartMs,
      });
    }
  }

  // 4. Ingest into LiveStore and Perform Global Thread Reply Correlation
  const store = loadLiveStore();
  if (!Array.isArray(store.interacciones_email)) {
    store.interacciones_email = [];
  }

  // Deduplicate against existing records by composite (mailbox + message ID) key
  const storeMap = new Map<string, EmailInteractionRecord>();
  for (const existing of store.interacciones_email) {
    const k = `${(existing.mailbox || '').toLowerCase().trim()}_${existing.id}`;
    storeMap.set(k, existing);
  }
  for (const newRec of newInteractionsBatch) {
    const k = `${(newRec.mailbox || '').toLowerCase().trim()}_${newRec.id}`;
    const prev = storeMap.get(k);
    if (prev) {
      storeMap.set(k, {
        ...prev,
        ...newRec,
        // preserve previously confirmed reply status if present
        isReplied: prev.isReplied || newRec.isReplied,
        repliedBy: prev.repliedBy || newRec.repliedBy,
        repliedAt: prev.repliedAt || newRec.repliedAt,
        responseTimeMinutes: prev.responseTimeMinutes ?? newRec.responseTimeMinutes,
      });
    } else {
      storeMap.set(k, newRec);
    }
  }

  const allInteractions = Array.from(storeMap.values());

  // 5. Group by threadId and correlate chronologically
  const threadGroups = new Map<string, EmailInteractionRecord[]>();
  for (const rec of allInteractions) {
    const tId = rec.threadId || rec.id;
    if (!threadGroups.has(tId)) {
      threadGroups.set(tId, []);
    }
    threadGroups.get(tId)!.push(rec);
  }

  let totalReplied = 0;
  let totalResponseTimeMinutesSum = 0;

  for (const [_tId, messagesInThread] of threadGroups.entries()) {
    // Sort chronologically ascending
    messagesInThread.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const pendingInbounds: EmailInteractionRecord[] = [];

    for (const msg of messagesInThread) {
      if (msg.direction === 'INBOUND') {
        if (!(msg as any).isAutomatedNotification) {
          pendingInbounds.push(msg);
        }
      } else if (msg.direction === 'OUTBOUND_REPLY') {
        if (pendingInbounds.length === 0) continue;

        const outTime = new Date(msg.date).getTime();

        // 1. Try RFC message-id match (In-Reply-To or References)
        const rfcMatches = pendingInbounds.filter((inb) => {
          if (!inb.rfcMessageId) return false;
          return (
            (msg.inReplyTo && msg.inReplyTo.includes(inb.rfcMessageId)) ||
            (Boolean((msg as any).references) && (msg as any).references.includes(inb.rfcMessageId))
          );
        });

        if (rfcMatches.length > 0) {
          for (const inb of rfcMatches) {
            const inTime = new Date(inb.date).getTime();
            const diffMs = Math.max(0, outTime - inTime);
            const responseMinutes = Math.max(1, Math.round(diffMs / 60000));

            inb.isReplied = true;
            inb.repliedBy = msg.from || msg.operadorNombre;
            inb.repliedAt = msg.date;
            inb.responseTimeMinutes = responseMinutes;

            const pIdx = pendingInbounds.indexOf(inb);
            if (pIdx >= 0) pendingInbounds.splice(pIdx, 1);
          }

          msg.isReplied = true;
          msg.repliedBy = msg.from || msg.operadorNombre;
          msg.repliedAt = msg.date;
          msg.responseTimeMinutes = rfcMatches[0]!.responseTimeMinutes;
        } else {
          // 2. Thread-level fallback: latest pending inbound before this reply
          let matchedIdx = -1;
          for (let i = pendingInbounds.length - 1; i >= 0; i--) {
            if (new Date(pendingInbounds[i]!.date).getTime() <= outTime) {
              matchedIdx = i;
              break;
            }
          }

          if (matchedIdx >= 0) {
            const inb = pendingInbounds[matchedIdx]!;
            const inTime = new Date(inb.date).getTime();
            const diffMs = Math.max(0, outTime - inTime);
            const responseMinutes = Math.max(1, Math.round(diffMs / 60000));

            inb.isReplied = true;
            inb.repliedBy = msg.from || msg.operadorNombre;
            inb.repliedAt = msg.date;
            inb.responseTimeMinutes = responseMinutes;

            msg.isReplied = true;
            msg.repliedBy = msg.from || msg.operadorNombre;
            msg.repliedAt = msg.date;
            msg.responseTimeMinutes = responseMinutes;

            pendingInbounds.splice(matchedIdx, 1);
          }
        }
      }
    }
  }

  // Calculate global summary counters
  for (const rec of allInteractions) {
    if (rec.direction === 'INBOUND' && !(rec as any).isAutomatedNotification && rec.isReplied) {
      totalReplied++;
      totalResponseTimeMinutesSum += rec.responseTimeMinutes ?? 0;
    }
  }

  const averageResponseTimeMinutes =
    totalReplied > 0 ? Number((totalResponseTimeMinutesSum / totalReplied).toFixed(1)) : 0;

  // 6. Recalculate stats for each mailbox in store.mailboxSyncState
  if (!store.mailboxSyncState) {
    store.mailboxSyncState = {};
  }

  for (const summary of mailboxSummaries) {
    const mbEmail = summary.mailbox.toLowerCase();
    const mbInbounds = allInteractions.filter(
      (i) => i.mailbox.toLowerCase() === mbEmail && i.direction === 'INBOUND' && !(i as any).isAutomatedNotification
    );
    const replied = mbInbounds.filter((i) => i.isReplied);
    const pending = mbInbounds.filter((i) => !i.isReplied);

    let avgMin = 0;
    if (replied.length > 0) {
      const sum = replied.reduce((acc, i) => acc + (i.responseTimeMinutes ?? 0), 0);
      avgMin = Number((sum / replied.length).toFixed(1));
    }

    summary.repliedCount = replied.length;
    summary.avgResponseTimeMin = avgMin;

    if (!store.mailboxSyncState[summary.mailbox]) {
      const mbInfo = AUTHORIZED_ALMAR_MAILBOXES.find(
        (m) => m.email.toLowerCase() === mbEmail
      );
      store.mailboxSyncState[summary.mailbox] = {
        email: summary.mailbox,
        nombre_responsable: mbInfo?.name || summary.operatorName,
        rol_operativo: mbInfo?.role || 'Operativo',
        history_id: null,
        last_synced_at: new Date().toISOString(),
        last_message_date: null,
        messages_processed_total: summary.messagesProcessed,
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

    const state = store.mailboxSyncState[summary.mailbox]!;
    state.emails_recibidos_total = mbInbounds.length;
    state.emails_respondidos_total = replied.length;
    state.emails_pendientes_respuesta = pending.length;
    state.tiempo_respuesta_promedio_min = avgMin;
    state.last_synced_at = new Date().toISOString();
    state.updated_at = new Date().toISOString();
  }

  // Update store.interacciones_email with the full correlated dataset
  store.interacciones_email = allInteractions;

  if (saveToStore) {
    saveLiveStore(store);
    try {
      scheduleSupabaseSync('mailbox_sync_state', store.mailboxSyncState);
    } catch {
      // Supabase is optional in local development
    }
  }

  return {
    success: true,
    totalMailboxes: targetMailboxes.length,
    totalMessagesProcessed,
    totalInteractionsSaved: allInteractions.length,
    totalInboundHuman,
    totalOutbound,
    totalBotsFiltered,
    totalReplied,
    averageResponseTimeMinutes,
    mailboxSummaries,
    durationMs: Date.now() - startMs,
  };
}

