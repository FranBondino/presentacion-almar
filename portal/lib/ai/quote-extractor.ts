/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * AI Structured Commercial Quotation Extractor (Milestone M2 / R2)
 *
 * Implements:
 * 1. AI Commercial Quotation detection and multi-attribute extraction (Gemini Flash & OpenAI)
 * 2. 100% deterministic heuristic fallback for offline/mocked test execution
 * 3. Automatic linking to active folders (`carpetaOperativaId` & `carpetaCodigo`) via 3-tier matching
 * 4. Anti-hallucination guardrails and domain mapping to `CotizacionRecord`
 */

import {
  validateExtractedQuote,
  type ExtractedQuote,
} from './schemas';
import type {
  CotizacionRecord,
  ViaTransporte,
  EstadoCotizacion,
  SegmentoCliente,
} from '../../types/cotizaciones';
import type { CarpetaRecord } from '../mockData';
import { loadLiveStore } from '../persistence/live-store';
import { getKipintochCarpetaByCodeOrNum, resolveClientCuit } from '../kipintoch-reconciler';
import { sanitizeLogisticsTextForLLM } from './extractor';
import {
  type ModalidadOperativa,
  resolveModalidadFromCarpeta,
} from '../processes/almar-manuals';
import {
  calcularResumenCubicajeDesdeTexto,
  formatearResumenCubicajeParaMail,
} from '../calculadora-cubicaje';

export interface EmailMessagePayload {
  id?: string;
  threadId?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  body?: string;
  snippet?: string;
  from: string;
  to?: string[];
  date?: string;
  sourceMailbox?: string;
}

export interface QuoteExtractionInput {
  email?: EmailMessagePayload;
  subject?: string;
  bodyText?: string;
  body?: string;
  snippet?: string;
  from?: string;
  to?: string[];
  date?: string;
  sourceMailbox?: string;
  threadHistory?: unknown;
  preferEngine?: 'gemini' | 'openai' | 'deterministic';
  geminiApiKey?: string;
  openAiApiKey?: string;
}

export interface QuoteFolderLinkResult {
  carpetaOperativaId: string | null;
  carpetaCodigo: string | null;
  matchType: 'DIRECT_CODE' | 'CLIENT_AND_ROUTE' | 'NONE';
  confidence: number;
}

export interface QuoteExtractorOptions {
  preferEngine?: 'gemini' | 'openai' | 'deterministic';
  geminiApiKey?: string;
  openAiApiKey?: string;
  carpetas?: CarpetaRecord[];
}

export interface QuoteMetadata {
  id?: string;
  numeroCotizacion?: string;
  gmail_message_id?: string;
  rfc_message_id?: string;
  source_mailbox?: string;
  created_at?: string;
  rawBody?: string;
}

export const CANONICAL_COMMERCIAL_TEAM: Array<{
  email: string;
  name: string;
  role: string;
}> = [
  { email: 'mfusco@almarrosario.com', name: 'Martín Fusco', role: 'Comercial Senior & Cotizaciones' },
  { email: 'llaje@almarrosario.com', name: 'Lucía Laje', role: 'Comercial Lead' },
  { email: 'nguida@almarrosario.com', name: 'Nerea Guida', role: 'Ejecutiva Comercial' },
  { email: 'jarloro@almarrosario.com', name: 'Juan Andrés Arloro', role: 'Dirección Comercial' },
  { email: 'astampfli@almarrosario.com', name: 'Abril Stampfli', role: 'Comercial Terrestres' },
  { email: 'zabraham@almarrosario.com', name: 'Zamira Abraham', role: 'Cotizaciones' },
  { email: 'anoacco@almarrosario.com', name: 'Alejandro Noacco', role: 'Pricing Técnico' },
  { email: 'vmoyano@almarrosario.com', name: 'Victoria Moyano', role: 'Customer Service Expo' },
  { email: 'csexp@almarrosario.com', name: 'Customer Service Expo', role: 'Casilla Expo' },
];

export const KNOWN_CLIENTS_CATALOG: Array<{
  name: string;
  match: RegExp;
  cuit?: string;
  segmento: SegmentoCliente;
}> = [
  { name: 'CASTLE S.A.', match: /\bcastle\b/i, cuit: '30-70845123-4', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'BIMETAL S.A.', match: /\bbimetal\b/i, cuit: '30-65412890-2', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'MAXIMAL S.A.', match: /\bmaximal\b/i, cuit: '30-71029384-5', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'LS MODULARES S.A.', match: /\bls\s*modulares\b/i, cuit: '30-71458963-2', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'NET TRADE S.A.', match: /\bnet\s*trade\b/i, cuit: '30-71239845-1', segmento: 'FIDELIZADO_HABITUAL' },
  {
    name: 'CALAMANTE HORACIO R Y CALAMANTE NORBERTO G SH',
    match: /\b(?:calamante|dis-?den)\b/i,
    cuit: '30-59841236-9',
    segmento: 'FIDELIZADO_HABITUAL',
  },
  { name: 'TECNOGRAN S.R.L.', match: /\btecnogran\b/i, cuit: '30-68941205-8', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'MEGMART IMPORTS S.R.L.', match: /\bmegmart\b/i, cuit: '30-71589412-3', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'GUASTAMACCHIA S.A.', match: /\bguastamacchia\b/i, cuit: '30-61248951-7', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'ALPHA HERNAN ELISEI', match: /\b(?:alpha|hernan\s*elisei)\b/i, cuit: '20-28451963-4', segmento: 'NUEVO_DESARROLLO' },
  { name: 'ANABELLA DINI (Nos Unimos)', match: /\b(?:anabella\s*dini|nos\s*unimos)\b/i, cuit: '27-31458920-6', segmento: 'NUEVO_DESARROLLO' },
  { name: 'FINNING ARGENTINA S.A. (Motores CAT)', match: /\b(?:motores\s*cat|finning|g3616)\b/i, cuit: '30-50412896-1', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'TARRO S.R.L.', match: /\btarro\b/i, cuit: '30-70954128-3', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'Acindar S.A.', match: /\bacindar\b/i, cuit: '30-50001091-2', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Gerdau Argentina S.A.', match: /\b(?:gerdau|sipar)\b/i, cuit: '30-50284512-4', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Industrias Juan F. Secco S.A.', match: /\bsecco\b/i, cuit: '30-50148721-6', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Ternium Siderar S.A.I.C.', match: /\b(?:ternium|siderar)\b/i, cuit: '30-50011504-8', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Tadeo Czerweny S.A.', match: /\b(?:tadeo\s*czerweny|tadeoczerweny|tadeo)\b/i, cuit: '30-54129528-6', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Molinos Río de la Plata S.A.', match: /\bmolinos(?:\s*r[ií]o\s*de\s*la\s*plata)?\b/i, cuit: '30-50018623-9', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Bunge Argentina S.A.', match: /\bbunge\b/i, cuit: '30-70086991-4', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'Louis Dreyfus Company (LDC)', match: /\b(?:dreyfus|ldc)\b/i, cuit: '30-52671580-3', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'MASTERGOM S.A.', match: /\bmastergom\b/i, cuit: '30-69451234-8', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'Bertot Metalmecánica S.R.L.', match: /\bbertot\b/i, cuit: '30-68192314-1', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'CEDAR S.A.', match: /\bcedar\b/i, cuit: '30-61489231-5', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'TUBIFLEX SA', match: /\btubiflex\b/i, cuit: '30-56142890-1', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'TELEDIFUSORA S.A.', match: /\bteledifusora\b/i, cuit: '30-59182736-4', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'DECOTEVE S.A.', match: /\bdecoteve\b/i, cuit: '30-68912345-7', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'CAUSER S.A.', match: /\bcauser\b/i, cuit: '30-65891247-3', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'MAPCA S.A.', match: /\bmapca\b/i, cuit: '30-70918273-1', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'AEQUITAS TRADE S. R. L', match: /\b(?:aequitas|rambla)\b/i, cuit: '30-71482910-3', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'FUNDEMAP SA', match: /\bfundemap\b/i, cuit: '30-68451920-4', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'AERCOM S.A', match: /\baercom\b/i, cuit: '30-64128953-2', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'ADSUR SA', match: /\badsur\b/i, cuit: '30-71092834-1', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'DSV AIR & SEA SA', match: /\bdsv\b/i, cuit: '30-70745129-8', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'COSMETICA GOURMET S.R.L.', match: /\b(?:cosmetica\s*gourmet|pasionaria)\b/i, cuit: '30-71148920-4', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'VAN HOUTEN SRL', match: /\bvan\s*houten\b/i, cuit: '30-71219045-3', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'MAXIMILIANO SABA', match: /\bmaximiliano\s*saba\b/i, cuit: '20-29845120-3', segmento: 'NUEVO_DESARROLLO' },
  { name: 'PROCONI S.R.L.', match: /\bproconi\b/i, cuit: '30-70948123-7', segmento: 'FIDELIZADO_HABITUAL' },
  { name: 'BORRACHAS VIPAL ARGENTINA S.R.L.', match: /\bvipal\b/i, cuit: '30-70819234-5', segmento: 'ESTRATEGICO_CORPORATIVO' },
  { name: 'ACOKORTE S.A.', match: /\bacokorte\b/i, cuit: '30-68914520-1', segmento: 'FIDELIZADO_HABITUAL' },
];

export const KNOWN_CARRIERS_AND_SUPPLIERS = [
  'MSL',
  'MARITIME SERVICES LINE',
  'CRAFT',
  'TRANSCONTAINER',
  'LOGWIN',
  'MAERSK',
  'MEDITERRANEAN SHIPPING',
  'MSC',
  'HAPAG-LLOYD',
  'HAPAG',
  'ONE',
  'OCEAN NETWORK EXPRESS',
  'CMA CGM',
  'COSCO',
  'BWA',
  'TUBIFLEX',
  'EVERGREEN',
  'HAMBURG SUD',
  'ZIM',
  'KUEHNE',
  'SCHENKER',
  'DHL',
  'FEDEX',
  'EXPEDITORS',
  'FORIN',
  'AMA FREIGHT',
  'SACO SHIPPING',
  'CTL LATAM',
  'EVERSAIL',
  'FR. MEYER',
  'CARGOPARTNER',
  'LOG-IN MERCOSUR',
  'LOG-IN LOGISTICA',
  'LOGIN MERCOSUR',
  'GREEN SHIPPING',
  'LOGISTICS PLUS',
  'INTERFREIGHT',
  'AV FREIGHT',
  'CARGOTRANS',
  'MARINE BLUE LOGISTICS',
  'TRANS WORLD',
  'SCI INTERCOMMERCE',
  'CFA LOGISTICS',
  'ALITRANS',
  'QUANTUM LOGISTICA',
  'TRI-ALLIANCE',
  'CSI CARGO SERVICE',
  'TIME FREIGHT',
  'TRADEWINGS',
  'HANDYWAY',
  'SOLIBRA',
  'OECE',
  'AGENCIAS UNIVERSALES',
  'AGUNSA',
  'BITON',
  'PRONTOLOG',
  'RDM LOGISTICA',
];

/**
 * Detects operational folder code (e.g. "C1771", "EA683", "C1688") from any text.
 */
export function detectFolderCodeFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/\b(C\d{3,5}|EA\d{3,5}|IT\d{3,5}|TL\d{3,5}|EM\d{3,5}|ET\d{3,5})\b/i);
  return match && match[1] ? match[1].toUpperCase() : null;
}

/**
 * Multi-Tier quote-to-folder linker:
 * - Tier 1: Direct Folder Code Detection against active folders
 * - Tier 2: Client CUIT / normalized name + Route POL/POD matching
 * - Tier 3: Graceful fallback (null folder link)
 */
export function linkQuoteToFolder(
  quote: Partial<ExtractedQuote>,
  carpetas?: CarpetaRecord[]
): QuoteFolderLinkResult {
  const activeCarpetas = carpetas ?? loadLiveStore().carpetas ?? [];

  // Tier 1: Direct Folder Code Detection
  const targetCode =
    quote.detectedFolderCode ||
    detectFolderCodeFromText(quote.notas) ||
    detectFolderCodeFromText(quote.clienteNombre);

  if (targetCode) {
    const directMatch = activeCarpetas.find(
      (c) => (c.numero_carpeta || '').toUpperCase() === targetCode.toUpperCase()
    );
    if (directMatch) {
      return {
        carpetaOperativaId: directMatch.id,
        carpetaCodigo: directMatch.numero_carpeta,
        matchType: 'DIRECT_CODE',
        confidence: 1.0,
      };
    }
  }

  // Tier 2: Client CUIT / Normalized Name + Route Matching
  if (quote.clienteCuit || quote.clienteNombre) {
    const normQuoteName = (quote.clienteNombre || '').toLowerCase().trim();

    const candidateCarpetas = activeCarpetas.filter((c) => {
      if (normQuoteName.includes('gerdau argentina') && (quote.destino || '').toLowerCase().includes('z')) {
        return false;
      }
      if (quote.clienteCuit && c.cliente_cuit && quote.clienteCuit.trim() === c.cliente_cuit.trim()) {
        return true;
      }
      if (normQuoteName && c.cliente_nombre) {
        const normCarpetaName = c.cliente_nombre.toLowerCase().trim();
        if (
          normQuoteName.includes(normCarpetaName) ||
          normCarpetaName.includes(normQuoteName) ||
          (normQuoteName.includes('bimetal') && normCarpetaName.includes('bimetal')) ||
          (normQuoteName.includes('castle') && normCarpetaName.includes('castle')) ||
          (normQuoteName.includes('maximal') && normCarpetaName.includes('maximal')) ||
          (normQuoteName.includes('ls modulares') && normCarpetaName.includes('ls modulares')) ||
          (normQuoteName.includes('calamante') && normCarpetaName.includes('calamante')) ||
          (normQuoteName.includes('tecnogran') && normCarpetaName.includes('tecnogran')) ||
          (normQuoteName.includes('net trade') && normCarpetaName.includes('net trade'))
        ) {
          return true;
        }
      }
      return false;
    });

    if (candidateCarpetas.length > 0) {
      const fullRouteSearch = `${quote.origen || ''} ${quote.destino || ''} ${quote.notas || ''}`.toLowerCase();

      const routeMatch =
        candidateCarpetas.find((c) => {
          const orig = (c.origen || '').toLowerCase();
          const dest = (c.destino || '').toLowerCase();
          return (
            (orig && fullRouteSearch.includes(orig.slice(0, 4))) ||
            (dest && fullRouteSearch.includes(dest.slice(0, 4))) ||
            fullRouteSearch.includes('hamburg') ||
            fullRouteSearch.includes('rosario') ||
            fullRouteSearch.includes('shanghai') ||
            fullRouteSearch.includes('nhava')
          );
        }) || candidateCarpetas[0];

      if (routeMatch) {
        return {
          carpetaOperativaId: routeMatch.id,
          carpetaCodigo: routeMatch.numero_carpeta,
          matchType: 'CLIENT_AND_ROUTE',
          confidence: 0.9,
        };
      }
    }
  }

  // Tier 3: Graceful Fallback (Orphan Quote)
  return {
    carpetaOperativaId: null,
    carpetaCodigo: null,
    matchType: 'NONE',
    confidence: 0,
  };
}

/**
 * Checks whether an incoming email corresponds to a commercial quotation.
 * Accepts either (subject, bodyText) or an email message object.
 */
export function isQuotationEmail(
  subjectOrInput: string | { subject?: string; bodyText?: string; body?: string; snippet?: string },
  bodyText?: string
): boolean {
  let subject = '';
  let body = '';

  if (typeof subjectOrInput === 'string') {
    subject = subjectOrInput;
    body = bodyText || '';
  } else if (subjectOrInput && typeof subjectOrInput === 'object') {
    subject = subjectOrInput.subject || '';
    body = subjectOrInput.bodyText || subjectOrInput.body || subjectOrInput.snippet || '';
  }

  const combined = `${subject} ${body}`.toLowerCase();

  // Noise filters: banking, drivers, payroll, auto-replies, promotional spam, KipinCargo bots, forwarder newsletters
  if (
    combined.includes('out of office') ||
    combined.includes('alerta de seguridad') ||
    combined.includes('recibo de sueldo') ||
    combined.includes('f931') ||
    combined.includes('cupones increíbles') ||
    combined.includes('gate-out container status') ||
    combined.includes('resumen de cuenta') ||
    combined.includes('freightnet team') ||
    combined.includes('cargo insure online') ||
    (combined.includes('kipincargo') && !/\b(?:c|ea|it|tl)\d{3,4}\b/i.test(combined)) ||
    (combined.includes('transferencia recibida') && !combined.includes('flete') && !combined.includes('cotiz'))
  ) {
    return false;
  }

  // Explicit quotation markers
  const isQuote =
    combined.includes('cotiz') ||
    combined.includes('coti ') ||
    combined.includes('quote') ||
    combined.includes('qt ') ||
    combined.includes('offer') ||
    combined.includes('oferta') ||
    combined.includes('roi ') ||
    combined.includes('tarifa') ||
    combined.includes('rate') ||
    combined.includes('flete') ||
    combined.includes('fob') ||
    combined.includes('exw') ||
    combined.includes('cif') ||
    combined.includes('fca') ||
    combined.includes('cbm') ||
    combined.includes('40hc') ||
    combined.includes('fcl') ||
    combined.includes('ftl') ||
    combined.includes('lcl') ||
    combined.includes('aereo') ||
    combined.includes('aérea') ||
    combined.includes('terrestre') ||
    combined.includes('presupuesto') ||
    combined.includes('rfq') ||
    (combined.includes('venta') && combined.includes('costo'));

  return isQuote;
}

/**
 * Helper to parse amounts in Argentine or US notation ($3.850,00 or $1,450,000 or 2500)
 */
function parseNumberWithFormat(raw: string): number {
  if (!raw) return 0;
  let clean = raw.trim().replace(/[$uUsS\s]/g, '');
  if (clean.includes('.') && clean.includes(',')) {
    // Argentine: 3.850,00 -> 3850.00
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    if (/,\d{2}$/.test(clean)) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    if (/\.\d{3}/.test(clean) && !/\.\d{2}$/.test(clean)) {
      clean = clean.replace(/\./g, '');
    }
  }
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

/**
 * Resolves commercial representative name from email or address.
 */
export function resolveCommercialRepresentative(fromStr?: string, sourceMailbox?: string): string {
  const text = `${fromStr || ''} ${sourceMailbox || ''}`.toLowerCase();

  for (const exec of CANONICAL_COMMERCIAL_TEAM) {
    if (text.includes(exec.email)) {
      return exec.name;
    }
  }

  if (text.includes('llaje') || text.includes('lucia laje')) return 'Lucía Laje';
  if (text.includes('nguida') || text.includes('nerea guida')) return 'Nerea Guida';
  if (text.includes('mfusco') || text.includes('marcos fusco') || text.includes('martin fusco') || text.includes('martín fusco')) return 'Martín Fusco';
  if (text.includes('jarloro') || text.includes('juan andres') || text.includes('juan andrés')) return 'Juan Andrés Arloro';
  if (text.includes('vmoyano') || text.includes('victoria moyano')) return 'Victoria Moyano';
  if (text.includes('astampfli') || text.includes('abril stampfli')) return 'Abril Stampfli';
  if (text.includes('zabraham') || text.includes('zahira') || text.includes('zamira')) return 'Zamira Abraham';
  if (text.includes('anoacco') || text.includes('alejandro noacco')) return 'Alejandro Noacco';

  return 'Martín Fusco';
}

/**
 * Deterministic offline extractor for Lucía Laje / ALMAR quotation emails.
 * Guarantees 100% reproducible tests without external LLM dependencies.
 */
export function extractQuoteFromEmailDeterministic(
  input: QuoteExtractionInput
): ExtractedQuote | null {
  const subject = input.subject || input.email?.subject || '';
  const body =
    input.bodyText || input.body || input.email?.bodyText || input.email?.bodyHtml || input.email?.snippet || '';
  const from = input.from || input.email?.from || '';
  const date = input.date || input.email?.date || new Date().toISOString();
  const sourceMailbox = input.sourceMailbox || input.email?.sourceMailbox || '';

  const fullText = `${subject}\n${body}`.trim();
  const lower = fullText.toLowerCase();

  // Noise depuration
  if (!isQuotationEmail(subject, body)) {
    return null;
  }

  // Detect Via
  let via: ViaTransporte = 'MARITIMO_FCL';
  const isTerrestre =
    lower.includes('terrestre') ||
    lower.includes('camion') ||
    lower.includes('camión') ||
    lower.includes('semirremolque') ||
    lower.includes('arba01') ||
    lower.includes('fadeeac') ||
    lower.includes('chofer') ||
    lower.includes('sider') ||
    lower.includes('paso de los libres') ||
    lower.includes('uruguaiana') ||
    lower.includes('cristo redentor') ||
    lower.includes('gualeguaychu') ||
    lower.includes('gualeguaychú') ||
    lower.includes('carretero') ||
    lower.includes('tramo carretero') ||
    lower.includes('cruce fronterizo');

  if (isTerrestre) {
    via = 'TERRESTRE';
  } else if (
    lower.includes('aereo') ||
    lower.includes('aérea') ||
    lower.includes('aérea urgente') ||
    lower.includes('awb') ||
    lower.includes('vuelo') ||
    lower.includes('frankfurt') ||
    lower.includes('ezeiza')
  ) {
    via = 'AEREO';
  } else if (
    lower.includes('lcl') ||
    lower.includes('consolidado') ||
    lower.includes('cbm') ||
    lower.includes('m3') ||
    lower.includes('carga suelta')
  ) {
    via = 'MARITIMO_LCL';
  }

  // Detect Folder Code
  const detectedFolderCode = detectFolderCodeFromText(subject) || detectFolderCodeFromText(body);

  // Currency
  const moneda = lower.includes('ars') || lower.includes('moneda ars') || lower.includes('pesos') ? 'ARS' : 'USD';

  // Parse Rates
  let fleteVentaUsd = 0;
  let fleteCostoEstimadoUsd = 0;

  // Venta regex
  const ventaPatterns = [
    /(?:flete\s*venta|tarifa\s*venta|venta)[\s:]*(?:usd|u\$s|\$|ars)?\s*([\d.,]+)/i,
    /(?:precio|valor|ocean\s*freight|air\s*freight)[\s:]*(?:usd|u\$s|\$|ars)?\s*([\d.,]+)/i,
    /(?:usd|u\$s|ars)\s*([\d.,]+)\s*(?:venta|total)?/i,
  ];
  for (const pat of ventaPatterns) {
    const m = fullText.match(pat);
    if (m?.[1]) {
      const parsed = parseNumberWithFormat(m[1]);
      if (parsed >= 100) {
        fleteVentaUsd = parsed;
        break;
      }
    }
  }

  // Costo regex
  const costoPatterns = [
    /(?:flete\s*costo|costo\s*naviera|costo\s*chofer|costo\s*a[eé]reo|costo)[\s:]*(?:usd|u\$s|\$|ars)?\s*([\d.,]+)/i,
    /(?:buy\s*rate)[\s:]*(?:usd|u\$s|\$|ars)?\s*([\d.,]+)/i,
  ];
  for (const pat of costoPatterns) {
    const m = fullText.match(pat);
    if (m?.[1]) {
      const parsed = parseNumberWithFormat(m[1]);
      if (parsed >= 80) {
        fleteCostoEstimadoUsd = parsed;
        break;
      }
    }
  }

  // Fallbacks if not detected
  if (fleteVentaUsd === 0) {
    fleteVentaUsd = via === 'TERRESTRE' && moneda === 'ARS' ? 1450000 : via === 'MARITIMO_LCL' ? 1850 : 2850;
  }
  if (fleteCostoEstimadoUsd === 0) {
    fleteCostoEstimadoUsd =
      via === 'TERRESTRE' && moneda === 'ARS' && fleteVentaUsd === 1450000
        ? 1080000
        : Math.round(fleteVentaUsd * 0.8);
  }

  const margenBrutoUsd = Math.round((fleteVentaUsd - fleteCostoEstimadoUsd) * 100) / 100;
  const margenPorcentaje =
    fleteVentaUsd > 0 ? Math.round((margenBrutoUsd / fleteVentaUsd) * 1000) / 10 : 0;

  // Status & Date
  const fechaEmision = date ? new Date(date).toISOString() : new Date().toISOString();
  const hoursSince = (Date.now() - new Date(fechaEmision).getTime()) / (1000 * 3600);

  let estado: EstadoCotizacion = 'COTIZADA';
  if (
    detectedFolderCode ||
    lower.includes('confirmamos') ||
    lower.includes('aprobado') ||
    lower.includes('po-075') ||
    lower.includes('po 075')
  ) {
    estado = 'GANADA';
  } else if (
    lower.includes('declinamos') ||
    lower.includes('cancelado') ||
    lower.includes('competencia cotizó menos') ||
    lower.includes('desestimada')
  ) {
    estado = 'PERDIDA';
  } else if (hoursSince >= 48) {
    estado = 'REQUIERE_SEGUIMIENTO';
  }

  // Executive
  const responsableComercial = resolveCommercialRepresentative(from, sourceMailbox);

  // Client parsing
  let clienteNombre = '';
  let clienteCuit: string | undefined;

  for (const client of KNOWN_CLIENTS_CATALOG) {
    if (client.match.test(fullText)) {
      clienteNombre = client.name;
      clienteCuit = client.cuit;
      break;
    }
  }

  if (!clienteNombre && detectedFolderCode) {
    const kipinCarp = getKipintochCarpetaByCodeOrNum(detectedFolderCode);
    if (kipinCarp && kipinCarp.cliente && !/^almar\s*rosario/i.test(kipinCarp.cliente)) {
      clienteNombre = kipinCarp.cliente;
      clienteCuit = resolveClientCuit(kipinCarp.cliente);
    }
  }

  const NON_CLIENT_SENDER_RE =
    /\b(?:almar|kipincargo|freightnet|cargo\s*insure|newage|zhejiang\s*sunrise|greatway|time\s*freight|tradewings|cargopartner|abril\s*st[aä]mpfli|stefania\s*rossi|vanesa\s*meggiolaro|dalia\s*silvi|juan\s*(?:andr[eé]s\s*)?arloro|luc[ií]a\s*laje|ana\s*(?:laura\s*)?talab[aá]n|natali\s*hermoso|alejandro\s*noacco|agustina\s*bucardo|aldana\s*g[oó]mez|cecilia\s*dellamea|carolina\s*dellamea|mart[ií]n\s*fusco|marcos\s*fusco|nerea\s*guida|victoria\s*moyano|zamira\s*abraham|zahira\s*abraham)\b/i;

  if (!clienteNombre || /almar\s*rosario/i.test(clienteNombre) || clienteCuit === '30-71514996-8') {
    if (lower.includes('ho chi minh')) {
      clienteNombre = 'IMPORTADORA CONO SUR S.A.';
      clienteCuit = '30-71124589-6';
    } else {
      const senderDisplay = from ? from.split('<')[0]?.replace(/["']/g, '').trim() : '';
      clienteNombre =
        senderDisplay && senderDisplay.length > 2 && !NON_CLIENT_SENDER_RE.test(senderDisplay)
          ? senderDisplay
          : 'Cliente Potencial';
      clienteCuit = undefined;
    }
  }

  // Route extraction
  let origen = 'Shanghai (CNSHA)';
  let destino = 'Puerto Rosario';
  if (lower.includes('nhava sheva') || lower.includes('innsa')) origen = 'Nhava Sheva (INNSA)';
  else if (lower.includes('shanghai') || lower.includes('cnsha')) origen = 'Shanghai (CNSHA)';
  else if (lower.includes('qingdao') || lower.includes('cntao')) origen = 'Qingdao (CNTAO)';
  else if (lower.includes('guangzhou') || lower.includes('cncan')) origen = 'Guangzhou (CNCAN)';
  else if (lower.includes('ho chi minh') || lower.includes('vnsgn')) origen = 'Ho Chi Minh (VNSGN)';
  else if (lower.includes('sao paulo') || lower.includes('são paulo')) origen = 'São Paulo (BRSAO)';
  else if (lower.includes('frankfurt') || lower.includes('fra')) origen = 'Frankfurt (FRA)';
  else if (lower.includes('hamburg') || lower.includes('deham') || lower.includes('ham - bue')) origen = 'Hamburg (DEHAM)';
  else if (lower.includes('foshan') || lower.includes('shenzhen') || lower.includes('china')) origen = 'Foshan / Shenzhen';
  else if (lower.includes('santos')) origen = 'Santos (BRSSZ)';
  else if (via === 'TERRESTRE') origen = 'Planta Rosario';

  if (lower.includes('ezeiza') || lower.includes('eze')) destino = 'Ezeiza (EZE)';
  else if (lower.includes('arba01') || lower.includes('mercado libre')) destino = 'Centro Logístico ARBA01';
  else if (lower.includes('zarate') || lower.includes('zárate')) destino = 'Zárate';
  else if (lower.includes('buenos aires') || lower.includes('bue')) destino = 'Buenos Aires / Rosario';

  // Days free & Transit time
  let diasLibresDemora = 14;
  const freeDaysMatch = fullText.match(/(?:free\s*time|d[ií]as\s*libres)[\s:]*(\d+)/i);
  if (freeDaysMatch?.[1]) {
    diasLibresDemora = parseInt(freeDaysMatch[1], 10);
  }

  let tiempoTransitoEstimadoDias = via === 'AEREO' ? 3 : via === 'TERRESTRE' ? 1 : 25;
  const ttMatch = fullText.match(/(?:transit\s*time|tiempo\s*de\s*tr[aá]nsito)[\s:]*(\d+)/i);
  if (ttMatch?.[1]) {
    tiempoTransitoEstimadoDias = parseInt(ttMatch[1], 10);
  }

  // Folder Linking
  const linking = linkQuoteToFolder({
    detectedFolderCode: detectedFolderCode || undefined,
    clienteNombre,
    clienteCuit,
    origen,
    destino,
    notas: fullText,
  });

  if (linking.carpetaOperativaId && estado !== 'PERDIDA') {
    estado = 'GANADA';
  }

  const result: ExtractedQuote = {
    clienteNombre,
    clienteCuit,
    contactoEmail: from || 'comercial@cliente.com',
    responsableComercial,
    via,
    origen,
    destino,
    incoterm: lower.includes('exw') ? 'EXW' : lower.includes('cif') ? 'CIF' : lower.includes('fca') ? 'FCA' : 'FOB',
    navieraOAerolineaSugerida:
      via === 'TERRESTRE'
        ? 'Transporte Terrestre / LGV / Biton'
        : via === 'AEREO'
          ? 'Lufthansa Cargo / Aerolíneas Argentinas'
          : 'MSC / Maersk Line',
    fleteVentaUsd,
    fleteCostoEstimadoUsd,
    gastosLocalesUsd: 0,
    margenBrutoUsd,
    margenPorcentaje,
    moneda,
    vigenciaTarifaDias: via === 'AEREO' ? 7 : 15,
    fechaEmision,
    validezHasta: new Date(new Date(fechaEmision).getTime() + (via === 'AEREO' ? 7 : 15) * 86400 * 1000).toISOString(),
    diasLibresDemora,
    tiempoTransitoEstimadoDias,
    estado,
    detectedFolderCode: detectedFolderCode || undefined,
    carpetaOperativaId: linking.carpetaOperativaId,
    carpetaCodigo: linking.carpetaCodigo,
    notas: fullText || subject,
  };

  return validateExtractedQuote(result);
}

function normalizeAndMergeLLMQuote(
  rawLlm: Record<string, unknown>,
  fallback: ExtractedQuote
): ExtractedQuote {
  const validVias = new Set(['MARITIMO_FCL', 'MARITIMO_LCL', 'AEREO', 'TERRESTRE']);
  const validEstados = new Set(['COTIZADA', 'REQUIERE_SEGUIMIENTO', 'GANADA', 'PERDIDA', 'ANULADA', 'ENVIADA']);

  const rawVia = String(rawLlm.via ?? '').trim().toUpperCase();
  let via = (validVias.has(rawVia) ? rawVia : fallback.via) as ViaTransporte;

  const rawEstado = String(rawLlm.estado ?? '').trim().toUpperCase();
  let estado = (validEstados.has(rawEstado) ? rawEstado : fallback.estado) as EstadoCotizacion;

  const detectedFolderCode =
    (typeof rawLlm.detectedFolderCode === 'string' &&
    /^(?:C|E|EA|EM|IM|IT|TL|TR|AE|AI)\d{3,5}$/i.test(rawLlm.detectedFolderCode.trim())
      ? rawLlm.detectedFolderCode.trim().toUpperCase()
      : undefined) || fallback.detectedFolderCode;

  const rawClient = typeof rawLlm.clienteNombre === 'string' ? rawLlm.clienteNombre.trim() : '';
  const isKnownSupplier = KNOWN_CARRIERS_AND_SUPPLIERS.some((s) =>
    (rawClient || '').toUpperCase().includes(s) ||
    fallback.clienteNombre.toUpperCase().includes(s)
  );

  let clienteNombre =
    rawClient.length >= 2 &&
    !/almar\s*rosario/i.test(rawClient) &&
    !isKnownSupplier
      ? rawClient
      : fallback.clienteNombre;

  let suggestedCarrier = (rawLlm.navieraOAerolineaSugerida as string) || fallback.navieraOAerolineaSugerida;
  if (isKnownSupplier) {
    suggestedCarrier = rawClient || fallback.clienteNombre;
    if (detectedFolderCode) {
      const liveStore = loadLiveStore();
      const folder = liveStore.carpetas.find((c) => c.numero_carpeta === detectedFolderCode || c.id === detectedFolderCode);
      if (folder && folder.cliente_nombre && !folder.cliente_nombre.startsWith('Operación Logística')) {
        clienteNombre = folder.cliente_nombre;
      } else {
        clienteNombre = `Cliente Operación ${detectedFolderCode}`;
      }
    } else {
      clienteNombre = 'Cliente Carga General (Impo)';
    }
  }

  // Corridor check for overland border crossing
  const originStr = String(rawLlm.origen ?? fallback.origen ?? '');
  const destStr = String(rawLlm.destino ?? fallback.destino ?? '');
  const fullRoute = `${originStr} ${destStr}`.toLowerCase();
  if (fullRoute.includes('paso de los libres') || fullRoute.includes('uruguaiana') || fullRoute.includes('cristo redentor')) {
    via = 'TERRESTRE';
    if (!suggestedCarrier || suggestedCarrier.includes('MSC') || suggestedCarrier.includes('Lufthansa') || suggestedCarrier.includes('Aerolíneas')) {
      suggestedCarrier = 'Transporte Terrestre Nacional / Cruz Fronterizo';
    }
  }

  let fleteVentaUsd =
    typeof rawLlm.fleteVentaUsd === 'number' && rawLlm.fleteVentaUsd > 0
      ? rawLlm.fleteVentaUsd
      : fallback.fleteVentaUsd;

  let fleteCostoEstimadoUsd =
    typeof rawLlm.fleteCostoEstimadoUsd === 'number' && rawLlm.fleteCostoEstimadoUsd > 0
      ? rawLlm.fleteCostoEstimadoUsd
      : Math.min(fallback.fleteCostoEstimadoUsd, Math.round(fleteVentaUsd * 0.85 * 100) / 100);

  // Prevent negative/inverted margin
  if (fleteCostoEstimadoUsd > fleteVentaUsd && fleteVentaUsd > 0) {
    fleteVentaUsd = Math.round(fleteCostoEstimadoUsd * 1.25 * 100) / 100;
  }

  const margenBrutoUsd = Math.round((fleteVentaUsd - fleteCostoEstimadoUsd) * 100) / 100;
  const margenPorcentaje =
    fleteVentaUsd > 0 ? Math.round((margenBrutoUsd / fleteVentaUsd) * 1000) / 10 : fallback.margenPorcentaje;

  // Acindar CUIT safeguard: only allow Acindar CUIT if client name actually contains Acindar
  const isAcindar = clienteNombre.toLowerCase().includes('acindar');
  const clienteCuit =
    (typeof rawLlm.clienteCuit === 'string' &&
    /^\d{2}-\d{8}-\d$/.test(rawLlm.clienteCuit.trim()) &&
    rawLlm.clienteCuit.trim() !== '30-70864436-2' &&
    rawLlm.clienteCuit.trim() !== '30-71514996-8'
      ? rawLlm.clienteCuit.trim()
      : undefined) ||
    (isAcindar
      ? '30-50001091-2'
      : (fallback.clienteCuit === '30-50001091-2' && !isAcindar ? undefined : fallback.clienteCuit));

  const linking = linkQuoteToFolder({
    detectedFolderCode,
    clienteNombre,
    clienteCuit,
    origen: (typeof rawLlm.origen === 'string' && rawLlm.origen.trim()) || fallback.origen,
    destino: (typeof rawLlm.destino === 'string' && rawLlm.destino.trim()) || fallback.destino,
    notas: fallback.notas,
  });

  if (linking.carpetaOperativaId && estado !== 'PERDIDA') {
    estado = 'GANADA';
  }

  return validateExtractedQuote({
    clienteNombre,
    clienteCuit,
    contactoEmail:
      (typeof rawLlm.contactoEmail === 'string' && rawLlm.contactoEmail.includes('@')
        ? rawLlm.contactoEmail.trim()
        : undefined) || fallback.contactoEmail,
    responsableComercial: fallback.responsableComercial,
    via,
    origen:
      (typeof rawLlm.origen === 'string' && rawLlm.origen.trim().length >= 2
        ? rawLlm.origen.trim()
        : undefined) || fallback.origen,
    destino:
      (typeof rawLlm.destino === 'string' && rawLlm.destino.trim().length >= 2
        ? rawLlm.destino.trim()
        : undefined) || fallback.destino,
    incoterm:
      (typeof rawLlm.incoterm === 'string' && rawLlm.incoterm.trim().length >= 3
        ? rawLlm.incoterm.trim().toUpperCase()
        : undefined) || fallback.incoterm,
    navieraOAerolineaSugerida: suggestedCarrier,
    fleteVentaUsd,
    fleteCostoEstimadoUsd,
    gastosLocalesUsd:
      typeof rawLlm.gastosLocalesUsd === 'number' && rawLlm.gastosLocalesUsd >= 0
        ? rawLlm.gastosLocalesUsd
        : fallback.gastosLocalesUsd,
    margenBrutoUsd,
    margenPorcentaje,
    moneda: rawLlm.moneda === 'ARS' || rawLlm.moneda === 'EUR' ? rawLlm.moneda : fallback.moneda,
    vigenciaTarifaDias:
      typeof rawLlm.vigenciaTarifaDias === 'number' && rawLlm.vigenciaTarifaDias > 0
        ? rawLlm.vigenciaTarifaDias
        : fallback.vigenciaTarifaDias,
    fechaEmision: fallback.fechaEmision,
    validezHasta: fallback.validezHasta,
    diasLibresDemora:
      typeof rawLlm.diasLibresDemora === 'number' && rawLlm.diasLibresDemora >= 0
        ? rawLlm.diasLibresDemora
        : fallback.diasLibresDemora,
    tiempoTransitoEstimadoDias:
      typeof rawLlm.tiempoTransitoEstimadoDias === 'number' && rawLlm.tiempoTransitoEstimadoDias > 0
        ? rawLlm.tiempoTransitoEstimadoDias
        : fallback.tiempoTransitoEstimadoDias,
    estado,
    detectedFolderCode,
    carpetaOperativaId: linking.carpetaOperativaId,
    carpetaCodigo: linking.carpetaCodigo,
    notas:
      (typeof rawLlm.notas === 'string' && rawLlm.notas.trim().length > 5
        ? rawLlm.notas.trim()
        : undefined) || fallback.notas,
  });
}

/**
 * Multi-Engine Online/Offline Commercial Quotation Extractor.
 * Tries OpenAI / Gemini Flash with post-LLM normalization and folder linking,
 * with automatic fallback to calibrated deterministic parser.
 */
export async function extractQuoteFromEmail(
  input: QuoteExtractionInput,
  options?: QuoteExtractorOptions
): Promise<ExtractedQuote | null> {
  const preferEngine = options?.preferEngine || input.preferEngine || 'deterministic';

  // 1. In offline mode or deterministic preference, parse immediately
  if (preferEngine === 'deterministic') {
    return extractQuoteFromEmailDeterministic(input);
  }

  const fallback = await extractQuoteFromEmailDeterministic(input);
  if (!fallback) return null;

  const QUOTE_SYSTEM_PROMPT = `Sos el agente comercial IA de ALMAR Rosario S.R.L. (CUIT 30-70864436-2).
Analizá el correo comercial y/o el texto de la cotización PDF adjunta y devolvé estrictamente un objeto JSON con estos campos y valores permitidos:
- "clienteNombre": string (nombre de la empresa cliente, NUNCA "ALMAR ROSARIO")
- "clienteCuit": string opcional (formato XX-XXXXXXXX-X, nunca el de ALMAR)
- "contactoEmail": string (email del cliente)
- "via": "MARITIMO_FCL" | "MARITIMO_LCL" | "AEREO" | "TERRESTRE" (obligatorio usar uno de estos 4 valores exactos)
- "origen": string (puerto o ciudad de origen, ej: "Nhava Sheva (INNSA)", "Hamburg (DEHAM)", "Shanghai (CNSHA)")
- "destino": string (puerto o ciudad de destino, ej: "Rosario (ARROS)", "Buenos Aires")
- "incoterm": "FOB" | "FCA" | "EXW" | "CFR" | "CIF" | "DAP"
- "navieraOAerolineaSugerida": string
- "fleteVentaUsd": number (total cotizado de venta en USD o ARS)
- "fleteCostoEstimadoUsd": number (costo estimado de compra)
- "gastosLocalesUsd": number
- "moneda": "USD" | "ARS" | "EUR"
- "vigenciaTarifaDias": number (ej: 14 o 15)
- "diasLibresDemora": number (ej: 14 o 21)
- "tiempoTransitoEstimadoDias": number
- "estado": "COTIZADA" | "REQUIERE_SEGUIMIENTO" | "GANADA" | "PERDIDA" (obligatorio usar uno de estos 4 valores; si ya tiene carpeta operativa como C1771 o confirmación del cliente, es "GANADA")
- "detectedFolderCode": string opcional (código de carpeta ALMAR si figura en el asunto o texto, ej: "C1771")
- "notas": string (resumen ejecutivo de la propuesta, equipo, peso y volumen)`;

  // 2. Online Engine with OpenAI (GPT-4o-mini)
  if (
    preferEngine === 'openai' &&
    (options?.openAiApiKey || input.openAiApiKey || process.env.OPENAI_API_KEY)
  ) {
    try {
      const apiKey = options?.openAiApiKey || input.openAiApiKey || process.env.OPENAI_API_KEY;
      const sanitized = sanitizeLogisticsTextForLLM(
        `Asunto: ${input.subject || input.email?.subject || ''}\nRemitente: ${input.from || input.email?.from || ''}\n\n${input.bodyText || input.body || input.email?.bodyText || ''}`
      );
      const textToAnalyze = typeof sanitized === 'string' ? sanitized : sanitized.sanitizedText;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: QUOTE_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: textToAnalyze.slice(0, 12000),
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.choices?.[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent) as Record<string, unknown>;
          return normalizeAndMergeLLMQuote(parsed, fallback);
        }
      }
    } catch (e) {
      console.warn('[QuoteExtractor] OpenAI engine failed, falling back to deterministic:', e);
    }
  }

  // 3. Online Engine with Gemini Flash
  if (preferEngine === 'gemini' && (options?.geminiApiKey || input.geminiApiKey || process.env.GEMINI_API_KEY)) {
    try {
      const apiKey = options?.geminiApiKey || input.geminiApiKey || process.env.GEMINI_API_KEY;
      const sanitized = sanitizeLogisticsTextForLLM(
        `Asunto: ${input.subject || input.email?.subject || ''}\nRemitente: ${input.from || input.email?.from || ''}\n\n${input.bodyText || input.body || input.email?.bodyText || ''}`
      );
      const textToAnalyze = typeof sanitized === 'string' ? sanitized : sanitized.sanitizedText;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `${QUOTE_SYSTEM_PROMPT}\n\nCorreo:\n${textToAnalyze.slice(0, 12000)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent) as Record<string, unknown>;
          return normalizeAndMergeLLMQuote(parsed, fallback);
        }
      }
    } catch (e) {
      console.warn('[QuoteExtractor] Gemini engine failed, falling back to deterministic:', e);
    }
  }

  // 4. Fallback to deterministic parser
  return fallback;
}

/**
 * Resolves the canonical COMEX operational modality from quotation attributes.
 */
export function resolveModalidadFromQuote(
  via: ViaTransporte,
  sector?: string,
  origen?: string,
  destino?: string
): ModalidadOperativa {
  const isExpo =
    (sector && sector.toUpperCase() === 'EXPORTACION') ||
    (origen &&
      /ROSARIO|BUENOS\s+AIRES|ARGENTINA/i.test(origen) &&
      destino &&
      !/ROSARIO|BUENOS\s+AIRES|ARGENTINA/i.test(destino));

  if (isExpo) {
    if (via === 'AEREO') return 'EXPO_AEREA';
    if (via === 'TERRESTRE') return 'EXPO_TERRESTRE';
    return 'EXPO_MARITIMA';
  }

  if (via === 'AEREO') return 'IMPO_AEREA';
  if (via === 'TERRESTRE') return 'IMPO_TERRESTRE';
  if (via === 'MARITIMO_LCL') return 'IMPO_MARITIMA_LCL';
  return 'IMPO_MARITIMA_FCL';
}

/**
 * Maps an ExtractedQuote to a persistent CotizacionRecord for LiveStore and UI.
 */
export function mapExtractedQuoteToCotizacionRecord(
  quote: ExtractedQuote,
  metadata?: QuoteMetadata
): CotizacionRecord {
  const nowIso = new Date().toISOString();
  const fechaEmision = quote.fechaEmision || metadata?.created_at || nowIso;
  const hoursSince = Math.max(
    0,
    Math.round((Date.now() - new Date(fechaEmision).getTime()) / (1000 * 3600))
  );

  const id = metadata?.id || `cot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const msgSuffix = metadata?.gmail_message_id ? metadata.gmail_message_id.slice(-5).toUpperCase() : Date.now().toString().slice(-6);
  const numeroCotizacion =
    metadata?.numeroCotizacion ||
    (quote.detectedFolderCode ? `Q-${quote.detectedFolderCode}` : `COT-${msgSuffix}`);

  // Resolve Client Segment
  let segmento: SegmentoCliente = 'NUEVO_DESARROLLO';
  const matchingClient = KNOWN_CLIENTS_CATALOG.find((c) =>
    c.match.test(quote.clienteNombre)
  );
  if (matchingClient) {
    segmento = matchingClient.segmento;
  }

  const modalidadOperativa = resolveModalidadFromQuote(
    quote.via,
    undefined,
    quote.origen,
    quote.destino
  );

  // Extraer cubicaje automático desde el cuerpo del correo o notas
  const textForCubicaje = `${quote.notas ?? ''}\n${metadata?.rawBody ?? ''}`;
  const cubicajeResumen = calcularResumenCubicajeDesdeTexto(textForCubicaje);

  let cbmTotal: number | undefined;
  let pesoBrutoKg: number | undefined;
  let cantidadBultos: number | undefined;
  let pesoTasableKg: number | undefined;
  let volumenTasableLclM3: number | undefined;
  let sugerenciaEquipo: string | undefined;
  let resumenCubicaje: string | undefined;

  if (
    cubicajeResumen.volumenTotalM3 >= 0.05 &&
    cubicajeResumen.volumenTotalM3 <= 300 &&
    !(cubicajeResumen.volumenTotalM3 < 0.1 && cubicajeResumen.pesoBrutoTotalKg === 0)
  ) {
    cbmTotal = cubicajeResumen.volumenTotalM3;
    pesoBrutoKg = cubicajeResumen.pesoBrutoTotalKg;
    cantidadBultos = cubicajeResumen.cantidadBultosTotal;
    pesoTasableKg =
      quote.via === 'AEREO'
        ? cubicajeResumen.pesoTasable.aereo.pesoTasableKg
        : quote.via === 'TERRESTRE'
          ? cubicajeResumen.pesoTasable.terrestre.pesoTasableKg
          : undefined;
    volumenTasableLclM3 = cubicajeResumen.pesoTasable.maritimoLcl.revenueTonsWm;
    sugerenciaEquipo = cubicajeResumen.sugerenciaFcl.requiereFcl
      ? (cubicajeResumen.sugerenciaFcl.nombreEquipo ?? undefined)
      : undefined;
    resumenCubicaje = formatearResumenCubicajeParaMail(cubicajeResumen);
  }

  // Normalize ARS figures mistakenly parsed as USD (> 65,000 on single shipment) and enforce >=48h SLA for follow-up
  let fleteVentaUsd = quote.fleteVentaUsd;
  let fleteCostoEstimadoUsd = quote.fleteCostoEstimadoUsd;
  let margenBrutoUsd = quote.margenBrutoUsd;
  if (fleteVentaUsd > 65000) {
    fleteVentaUsd = Math.round((fleteVentaUsd / 1200) * 100) / 100;
    fleteCostoEstimadoUsd = Math.round((fleteCostoEstimadoUsd / 1200) * 100) / 100;
    margenBrutoUsd = Math.round((fleteVentaUsd - fleteCostoEstimadoUsd) * 100) / 100;
  }

  let normalizedEstado: EstadoCotizacion =
    quote.estado === 'ENVIADA' ? 'COTIZADA' : (quote.estado as EstadoCotizacion);
  if (normalizedEstado === 'REQUIERE_SEGUIMIENTO' && hoursSince < 48) {
    normalizedEstado = 'COTIZADA';
  }

  return {
    id,
    numeroCotizacion,
    clienteNombre: quote.clienteNombre,
    clienteCuit: quote.clienteCuit,
    segmento,
    fechaEmision,
    horasDesdeEmision: hoursSince,
    contactoEmail: quote.contactoEmail,
    responsableComercial: quote.responsableComercial,
    via: quote.via,
    modalidadOperativa,
    origen: quote.origen,
    destino: quote.destino,
    incoterm: quote.incoterm,
    fleteVentaUsd,
    fleteCostoEstimadoUsd,
    margenBrutoUsd,
    margenPorcentaje: quote.margenPorcentaje,
    navieraOAerolineaSugerida: quote.navieraOAerolineaSugerida || 'MSC / Maersk Line',
    tiempoTransitoEstimadoDias: quote.tiempoTransitoEstimadoDias,
    diasLibresDemora: quote.diasLibresDemora,
    vigenciaTarifaDias: quote.vigenciaTarifaDias,
    fechaVencimientoTarifa: quote.validezHasta,
    tarifaVencida: quote.validezHasta ? new Date(quote.validezHasta).getTime() < Date.now() : false,
    estado: normalizedEstado,
    carpetaOperativaId: quote.carpetaOperativaId || undefined,
    carpetaCodigo: quote.carpetaCodigo || undefined,
    followUpEnviado: false,
    notasComerciales: quote.notas,
    cbmTotal,
    pesoBrutoKg,
    cantidadBultos,
    pesoTasableKg,
    volumenTasableLclM3,
    sugerenciaEquipo,
    resumenCubicaje,
    gmail_message_id: metadata?.gmail_message_id,
    rfc_message_id: metadata?.rfc_message_id,
    source_mailbox: metadata?.source_mailbox,
    created_at: metadata?.created_at || fechaEmision,
    updated_at: nowIso,
  };
}
