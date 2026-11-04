/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Mesa Spot / Solicitudes RFQ por Corredor (Persistencia Durable + Activación 1-Clic)
 *
 * Persiste tickets Spot RFQ en /data/multicotizador_spot_rfqs.json y permite que cuando
 * Pricing (Nerea Guida / Martín Fusco), un ejecutivo comercial o el listener Gmail 24/7
 * reciba la tarifa Spot de un agente o portal web, el ticket quede cerrado como RESPONDIDA
 * y la tarifa quede inmediatamente activa como SPOT_CACHE compartida para todo el equipo.
 */

import fs from 'fs';
import path from 'path';
import type { CarrierCode } from './dcsa-schedules';
import {
  buildSpotRateInquiryDraft,
  CARRIER_PROFILES,
  suggestSpotAgentsForCorridor,
  type ContainerRequestLine,
  type EquipmentCode,
  type MulticotizadorCalculationInput,
  type MulticotizadorTariffRow,
} from './pricing-engine';
import {
  resolveMulticotizadorDataDir,
  upsertAutoIngestedTariffOrSpotRow,
} from './tariff-store';

export type SpotRfqStatus =
  | 'PENDIENTE_PRICING'
  | 'EN_GESTION_AGENTE'
  | 'RESPONDIDA'
  | 'DESCARTADA';

export interface SpotRfqTicket {
  id: string;
  ticketNumber: string; // e.g. SPOT-2026-0001
  status: SpotRfqStatus;
  operationType: 'IMPORTACION' | 'EXPORTACION';
  incoterm: 'FOB' | 'FCA' | 'EXW' | 'CFR' | 'CIF' | 'DAP';
  polUnlocode: string;
  podUnlocode: string;
  containerLines: ContainerRequestLine[];
  carriersRequested: CarrierCode[];
  clienteNombre: string;
  targetRateUsd?: number;
  isImoDg: boolean;
  imoClassUn?: string;
  isReeferOrOog: boolean;
  cargoNotes?: string;
  corridorCode: string;
  corridorLabel: string;
  recommendedAgents: string[];
  recommendedEmails: string[];
  recommendedPortalUrl?: string;
  inquiryDraftText: string;
  requestedBy: string;
  requestedByEmail: string;
  assignedTo: string;
  createdAt: string;
  slaDueAt: string;
  updatedAt: string;

  // Resolution fields
  respondedAt?: string;
  respondedBy?: string;
  resolvedCarrier?: CarrierCode;
  resolvedAgentOrSource?: string;
  resolvedRatesByEquipmentUsd?: Partial<Record<EquipmentCode, number>>;
  resolvedFreeDays?: number;
  resolvedValidTo?: string;
  resolvedSpotRef?: string;
  linkedTariffRowId?: string;
}

interface PersistedSpotRfqEnvelope {
  updatedAt: string;
  nextSequence: number;
  tickets: SpotRfqTicket[];
}

function getSpotRfqFilePath(): string {
  if (process.env.ALMAR_MULTICOTIZADOR_SPOT_RFQS_PATH) {
    return process.env.ALMAR_MULTICOTIZADOR_SPOT_RFQS_PATH;
  }
  const dir = resolveMulticotizadorDataDir();
  const isTest = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
  return path.join(
    dir,
    isTest ? 'test_multicotizador_spot_rfqs.json' : 'multicotizador_spot_rfqs.json'
  );
}

function readSpotRfqEnvelope(): PersistedSpotRfqEnvelope {
  const filePath = getSpotRfqFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedSpotRfqEnvelope>;
      if (Array.isArray(parsed?.tickets)) {
        return {
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          nextSequence:
            typeof parsed.nextSequence === 'number' && parsed.nextSequence >= 1
              ? parsed.nextSequence
              : parsed.tickets.length + 1,
          tickets: parsed.tickets,
        };
      }
    }
  } catch (err) {
    console.warn('[SpotRfqStore] Error reading spot RFQ file, starting clean:', err);
  }
  return {
    updatedAt: new Date().toISOString(),
    nextSequence: 1,
    tickets: [],
  };
}

function writeSpotRfqEnvelope(envelope: PersistedSpotRfqEnvelope): void {
  const filePath = getSpotRfqFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(envelope, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.warn('[SpotRfqStore] Could not persist spot RFQ file:', err);
  }
}

export function loadSpotRfqTickets(): SpotRfqTicket[] {
  return readSpotRfqEnvelope().tickets;
}

export function countOpenSpotRfqTickets(): number {
  return readSpotRfqEnvelope().tickets.filter(
    (t) => t.status === 'PENDIENTE_PRICING' || t.status === 'EN_GESTION_AGENTE'
  ).length;
}

export interface CreateSpotRfqTicketInput {
  operationType: 'IMPORTACION' | 'EXPORTACION';
  incoterm: 'FOB' | 'FCA' | 'EXW' | 'CFR' | 'CIF' | 'DAP';
  polUnlocode: string;
  podUnlocode: string;
  containerLines: ContainerRequestLine[];
  carriersRequested: CarrierCode[];
  clienteNombre?: string;
  targetRateUsd?: number;
  isImoDg?: boolean;
  imoClassUn?: string;
  isReeferOrOog?: boolean;
  cargoNotes?: string;
  freeTimeExtraDays?: 0 | 7 | 14;
  requestedBy: string;
  requestedByEmail: string;
}

export function createSpotRfqTicket(input: CreateSpotRfqTicketInput): SpotRfqTicket {
  const env = readSpotRfqEnvelope();
  const now = new Date();
  const nowIso = now.toISOString();
  const year = now.getUTCFullYear();
  const seq = env.nextSequence;
  const ticketNumber = `SPOT-${year}-${String(seq).padStart(4, '0')}`;

  const pol = input.polUnlocode.trim().toUpperCase();
  const pod = input.podUnlocode.trim().toUpperCase();
  const corridor = suggestSpotAgentsForCorridor(pol, pod, {
    isImoDg: input.isImoDg,
    isReeferOrOog: input.isReeferOrOog,
  });

  const slaDueIso = new Date(now.getTime() + corridor.slaMinutes * 60_000).toISOString();
  const recommendedEmails = Array.from(
    new Set([
      ...corridor.primaryChannels.flatMap((c) => c.suggestedEmails),
      ...corridor.internalPricingEmails,
    ])
  );
  const portalChannel = corridor.primaryChannels.find((c) => Boolean(c.portalUrl));

  const syntheticCalcInput: MulticotizadorCalculationInput = {
    operationType: input.operationType,
    incoterm: input.incoterm,
    polUnlocode: pol,
    podUnlocode: pod,
    containerLines: input.containerLines,
    profitMode: 'USD_PER_CONTAINER',
    profitUsdPerContainer: 250,
    profitMarkupPct: 12,
    freeTimeExtraDays: input.freeTimeExtraDays ?? 0,
    applyHws20Gp: true,
    thcDestinationPerContainerUsd: 220,
    hidroviaTollPerContainerUsd: 175,
    internationalAgencyPerBlUsd: 380,
    localDocAndBlFeePerBlUsd: 75,
    deliveryMode: 'PORT_DIRECT',
    inlandTruckingPerContainerUsd: 0,
    custodyPerContainerUsd: 0,
    includeInsurance: false,
    cargoFobValueUsd: 0,
    insuranceRatePct: 0.35,
    clienteNombre: input.clienteNombre?.trim() || undefined,
  };

  const inquiryDraftText = buildSpotRateInquiryDraft({
    carriers: input.carriersRequested,
    input: syntheticCalcInput,
    asesorNombre: input.requestedBy,
    ticketNumber,
    targetRateUsd: input.targetRateUsd,
    isImoDg: input.isImoDg,
    imoClassUn: input.imoClassUn,
    isReeferOrOog: input.isReeferOrOog,
    cargoNotes: input.cargoNotes,
  });

  const ticket: SpotRfqTicket = {
    id: `rfq-${pol.toLowerCase()}-${pod.toLowerCase()}-${Date.now()}-${seq}`,
    ticketNumber,
    status: 'PENDIENTE_PRICING',
    operationType: input.operationType,
    incoterm: input.incoterm,
    polUnlocode: pol,
    podUnlocode: pod,
    containerLines: input.containerLines,
    carriersRequested: input.carriersRequested,
    clienteNombre: input.clienteNombre?.trim() || 'CLIENTE COMERCIAL EN NEGOCIACIÓN',
    targetRateUsd: input.targetRateUsd && input.targetRateUsd > 0 ? input.targetRateUsd : undefined,
    isImoDg: Boolean(input.isImoDg),
    imoClassUn: input.imoClassUn?.trim() || undefined,
    isReeferOrOog: Boolean(input.isReeferOrOog),
    cargoNotes: input.cargoNotes?.trim() || undefined,
    corridorCode: corridor.corridorCode,
    corridorLabel: corridor.corridorLabel,
    recommendedAgents: corridor.primaryChannels.map((c) => c.agentName),
    recommendedEmails,
    recommendedPortalUrl: portalChannel?.portalUrl,
    inquiryDraftText,
    requestedBy: input.requestedBy,
    requestedByEmail: input.requestedByEmail,
    assignedTo: corridor.internalPricingDesk,
    createdAt: nowIso,
    slaDueAt: slaDueIso,
    updatedAt: nowIso,
  };

  writeSpotRfqEnvelope({
    updatedAt: nowIso,
    nextSequence: seq + 1,
    tickets: [ticket, ...env.tickets],
  });

  return ticket;
}

export function updateSpotRfqTicketStatus(params: {
  ticketId: string;
  status: SpotRfqStatus;
  updatedBy: string;
}): SpotRfqTicket | null {
  const env = readSpotRfqEnvelope();
  const idx = env.tickets.findIndex((t) => t.id === params.ticketId);
  if (idx < 0) return null;
  const nowIso = new Date().toISOString();
  const next: SpotRfqTicket = {
    ...env.tickets[idx]!,
    status: params.status,
    updatedAt: nowIso,
    respondedBy: params.status === 'DESCARTADA' ? params.updatedBy : env.tickets[idx]!.respondedBy,
  };
  const tickets = [...env.tickets];
  tickets[idx] = next;
  writeSpotRfqEnvelope({
    ...env,
    updatedAt: nowIso,
    tickets,
  });
  return next;
}

export interface ResolveSpotRfqWithRateInput {
  ticketId: string;
  carrier: CarrierCode;
  agentOrSource: string;
  ratesByEquipmentUsd: Partial<Record<EquipmentCode, number>>;
  freeDaysIncluded?: number;
  validDays?: number; // default 7
  validToYmd?: string;
  spotQuoteRef?: string;
  allowsRiverExtensionToArros?: boolean;
  sourceGmailMessageId?: string;
  sourceMailbox?: string;
  respondedBy: string;
}

export function resolveSpotRfqTicketAndPersistTariff(
  input: ResolveSpotRfqWithRateInput
): { ticket: SpotRfqTicket; tariffRow: MulticotizadorTariffRow } | null {
  const env = readSpotRfqEnvelope();
  const idx = env.tickets.findIndex((t) => t.id === input.ticketId);
  if (idx < 0) return null;

  const existing = env.tickets[idx]!;
  const now = new Date();
  const nowIso = now.toISOString();
  // Use -7d lookback on validFrom so start-of-week/month reference dates or timezone offsets never mark an active Spot as future-dated before its validTo expiration
  const todayYmd = new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const validDays = Math.max(1, Math.min(45, input.validDays ?? 7));
  const validTo =
    input.validToYmd && /^\d{4}-\d{2}-\d{2}$/.test(input.validToYmd)
      ? input.validToYmd
      : new Date(now.getTime() + validDays * 86_400_000).toISOString().slice(0, 10);

  const freeDays =
    input.freeDaysIncluded && input.freeDaysIncluded >= 3
      ? input.freeDaysIncluded
      : CARRIER_PROFILES[input.carrier]?.defaultFreeDays ?? 18;

  const spotRef = input.spotQuoteRef?.trim() || existing.ticketNumber;

  const { row: tariffRow } = upsertAutoIngestedTariffOrSpotRow({
    carrier: input.carrier,
    agentOrSource: input.agentOrSource.trim() || 'Spot Confirmado Mesa Pricing',
    polUnlocode: existing.polUnlocode,
    podUnlocode: existing.podUnlocode,
    allowsRiverExtensionToArros:
      input.allowsRiverExtensionToArros ?? existing.podUnlocode === 'ARBUE',
    ratesByEquipmentUsd: input.ratesByEquipmentUsd,
    freeDaysIncluded: freeDays,
    validFrom: todayYmd,
    validTo,
    entryKind: 'SPOT_CACHE',
    spotQuoteRef: spotRef,
    contractOrSheetRef: spotRef,
    sourceGmailMessageId: input.sourceGmailMessageId,
    sourceMailbox: input.sourceMailbox,
    notes: `Spot confirmado sobre ticket ${existing.ticketNumber} (${existing.clienteNombre}).`,
    updatedBy: input.respondedBy,
  });

  const updatedTicket: SpotRfqTicket = {
    ...existing,
    status: 'RESPONDIDA',
    updatedAt: nowIso,
    respondedAt: nowIso,
    respondedBy: input.respondedBy,
    resolvedCarrier: input.carrier,
    resolvedAgentOrSource: input.agentOrSource,
    resolvedRatesByEquipmentUsd: input.ratesByEquipmentUsd,
    resolvedFreeDays: freeDays,
    resolvedValidTo: validTo,
    resolvedSpotRef: spotRef,
    linkedTariffRowId: tariffRow.id,
  };

  const tickets = [...env.tickets];
  tickets[idx] = updatedTicket;
  writeSpotRfqEnvelope({
    ...env,
    updatedAt: nowIso,
    tickets,
  });

  return { ticket: updatedTicket, tariffRow };
}

/**
 * Matches an incoming Gmail Spot confirmation against open Spot RFQ tickets
 * (by explicit [SPOT-YYYY-XXXX] reference in subject/body, or exact POL+POD+Carrier match).
 */
export function tryAutoMatchAndResolveOpenSpotRfq(params: {
  subject: string;
  bodyText: string;
  polUnlocode: string;
  podUnlocode: string;
  carrier: CarrierCode;
  agentOrSource: string;
  ratesByEquipmentUsd: Partial<Record<EquipmentCode, number>>;
  freeDaysIncluded: number;
  validToYmd: string;
  spotQuoteRef?: string;
  sourceGmailMessageId: string;
  sourceMailbox: string;
}): SpotRfqTicket | null {
  const env = readSpotRfqEnvelope();
  const openTickets = env.tickets.filter(
    (t) => t.status === 'PENDIENTE_PRICING' || t.status === 'EN_GESTION_AGENTE'
  );
  if (openTickets.length === 0) return null;

  const combinedText = `${params.subject}\n${params.bodyText}`.toUpperCase();
  const explicitMatch = openTickets.find((t) =>
    combinedText.includes(t.ticketNumber.toUpperCase())
  );

  const routeCarrierMatch =
    explicitMatch ??
    openTickets.find((t) => {
      if (t.polUnlocode !== params.polUnlocode || t.podUnlocode !== params.podUnlocode) {
        return false;
      }
      if (!t.carriersRequested.includes(params.carrier)) return false;
      const requestedEqs = t.containerLines.map((l) => l.equipment);
      return requestedEqs.every((eq) => (params.ratesByEquipmentUsd[eq] ?? 0) > 0);
    });

  if (!routeCarrierMatch) return null;

  const resolved = resolveSpotRfqTicketAndPersistTariff({
    ticketId: routeCarrierMatch.id,
    carrier: params.carrier,
    agentOrSource: params.agentOrSource,
    ratesByEquipmentUsd: params.ratesByEquipmentUsd,
    freeDaysIncluded: params.freeDaysIncluded,
    validToYmd: params.validToYmd,
    spotQuoteRef: params.spotQuoteRef,
    sourceGmailMessageId: params.sourceGmailMessageId,
    sourceMailbox: params.sourceMailbox,
    respondedBy: `Gmail 24/7 Auto-Match (${params.sourceMailbox})`,
  });

  return resolved?.ticket ?? null;
}
