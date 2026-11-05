'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Ship,
  ArrowLeft,
  ArrowLeftRight,
  Plus,
  Trash2,
  Calculator,
  Copy,
  Check,
  Save,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Clock,
  SlidersHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Send,
  Layers,
  CheckCircle2,
  Info,
  Mail,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from '@/components/ui/TablePagination';
import { useToast } from '@/components/ui/ToastProvider';
import { MulticotizadorGuard, useAuth } from '@/components/auth/RoleGuard';
import { GLOBAL_OCEAN_PORTS, getPortByUnlocode } from '@/lib/multicotizador/ports';
import { procesarArchivoDocumentoCliente } from '@/lib/calculadora-cubicaje';
import {
  ALL_CARRIER_CODES,
  CARRIER_PROFILES,
  EQUIPMENT_LABELS,
  buildFormalCommercialDraft,
  buildKipintochTsvRow,
  buildSpotRateInquiryDraft,
  suggestSpotAgentsForCorridor,
  type CarrierQuoteEvaluation,
  type ContainerRequestLine,
  type DeliveryLogisticsMode,
  type EquipmentCode,
  type MulticotizadorCalculationInput,
  type MulticotizadorTariffRow,
  type ProfitCalculationMode,
} from '@/lib/multicotizador/pricing-engine';
import type { CarrierCode } from '@/lib/multicotizador/dcsa-schedules';
import type { SpotRfqTicket, SpotRfqStatus } from '@/lib/multicotizador/spot-rfq-store';

const EQUIPMENT_OPTIONS: EquipmentCode[] = ['20GP', '40STD', '40HC', '40NOR', '20RF', '40RH'];

function formatUsd(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return `USD ${val.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function MulticotizadorInnerWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'COMPARADOR' | 'MESA_SPOT' | 'TARIFARIOS'>('COMPARADOR');

  // --- Form State ---
  const [operationType, setOperationType] = React.useState<'IMPORTACION' | 'EXPORTACION'>('IMPORTACION');
  const [incoterm, setIncoterm] = React.useState<'FOB' | 'FCA' | 'EXW' | 'CFR' | 'CIF' | 'DAP'>('FOB');
  const [polUnlocode, setPolUnlocode] = React.useState<string>('CNSHA');
  const [podUnlocode, setPodUnlocode] = React.useState<string>('ARROS');
  const [containerLines, setContainerLines] = React.useState<ContainerRequestLine[]>([
    { equipment: '40HC', qty: 1, grossWeightTonsPerUnit: 18 },
  ]);

  const [profitMode, setProfitMode] = React.useState<ProfitCalculationMode>('USD_PER_CONTAINER');
  const [profitUsdPerContainer, setProfitUsdPerContainer] = React.useState<number>(250);
  const [profitMarkupPct, setProfitMarkupPct] = React.useState<number>(12);
  const [freeTimeExtraDays, setFreeTimeExtraDays] = React.useState<0 | 7 | 14>(0);
  const [applyHws20Gp, setApplyHws20Gp] = React.useState<boolean>(true);

  const [deliveryMode, setDeliveryMode] = React.useState<DeliveryLogisticsMode>('PORT_DIRECT');
  const [thcDestinationPerContainerUsd, setThcDestinationPerContainerUsd] = React.useState<number>(220);
  const [hidroviaTollPerContainerUsd, setHidroviaTollPerContainerUsd] = React.useState<number>(175);
  const [internationalAgencyPerBlUsd, setInternationalAgencyPerBlUsd] = React.useState<number>(380);
  const [localDocAndBlFeePerBlUsd, setLocalDocAndBlFeePerBlUsd] = React.useState<number>(75);
  const [inlandTruckingPerContainerUsd, setInlandTruckingPerContainerUsd] = React.useState<number>(0);
  const [custodyPerContainerUsd, setCustodyPerContainerUsd] = React.useState<number>(0);

  const [includeInsurance, setIncludeInsurance] = React.useState<boolean>(false);
  const [cargoFobValueUsd, setCargoFobValueUsd] = React.useState<number>(45000);
  const [insuranceRatePct, setInsuranceRatePct] = React.useState<number>(0.35);

  const [clienteNombre, setClienteNombre] = React.useState<string>('');
  const [contactoEmail, setContactoEmail] = React.useState<string>('');
  const [showAdvancedCharges, setShowAdvancedCharges] = React.useState<boolean>(false);
  const [cubicajePrefillBanner, setCubicajePrefillBanner] = React.useState<string | null>(null);
  const multiDocInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUploadMulticotizadorDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { resumen } = await procesarArchivoDocumentoCliente(file);
      const cbm = resumen.volumenTotalM3;
      const weightKg = resumen.pesoBrutoTotalKg;
      const equip: EquipmentCode = cbm > 28 ? '40HC' : '20GP';
      const qty = cbm > 68 ? Math.max(1, Math.ceil(cbm / 65)) : 1;
      const tonsPerUnit =
        weightKg > 0 ? Math.max(0.5, Number((weightKg / 1000 / qty).toFixed(2))) : 18;

      setContainerLines([
        {
          equipment: equip,
          qty,
          grossWeightTonsPerUnit: tonsPerUnit,
        },
      ]);
      setCubicajePrefillBanner(
        `Documento "${file.name}" procesado: ${resumen.cantidadBultosTotal} bultos · ${cbm.toFixed(2)} m³ · ${(weightKg / 1000).toFixed(2)} tn ➔ Sugerido: ${qty}× ${EQUIPMENT_LABELS[equip]}`
      );
      toast.success(
        'Packing List Procesado en Multicotizador',
        `Se extrajeron ${resumen.cantidadBultosTotal} bultos (${cbm.toFixed(2)} m³) de "${file.name}" y se configuró ${qty}× ${EQUIPMENT_LABELS[equip]}.`
      );
    } catch {
      toast.error('Error al procesar documento', `No se pudo leer "${file.name}".`);
    } finally {
      e.target.value = '';
    }
  };

  // Spot overrides entered on the fly per carrier
  const [spotOverrides, setSpotOverrides] = React.useState<
    Partial<Record<CarrierCode, Partial<Record<EquipmentCode, number>>>>
  >({});
  const [spotInputDrafts, setSpotInputDrafts] = React.useState<Record<string, string>>({});
  const [spotRefDrafts, setSpotRefDrafts] = React.useState<Record<string, string>>({});
  const [spotValidDaysDraft, setSpotValidDaysDraft] = React.useState<7 | 14>(7);

  // 24/7 Gmail Tariff/Spot Sync & Mesa Spot RFQ Desk State
  const [lastGmailTariffSyncAt, setLastGmailTariffSyncAt] = React.useState<string | null>(null);
  const [isSyncingGmailTariffs, setIsSyncingGmailTariffs] = React.useState<boolean>(false);
  const [spotRfqTickets, setSpotRfqTickets] = React.useState<SpotRfqTicket[]>([]);
  const [openSpotRfqsCount, setOpenSpotRfqsCount] = React.useState<number>(0);
  const [rfqCarriers, setRfqCarriers] = React.useState<CarrierCode[]>(['MSC', 'HAPAG_LLOYD', 'ONE']);
  const [rfqTargetRateUsd, setRfqTargetRateUsd] = React.useState<string>('');
  const [rfqIsImoDg, setRfqIsImoDg] = React.useState<boolean>(false);
  const [rfqImoClassUn, setRfqImoClassUn] = React.useState<string>('');
  const [rfqIsReeferOrOog, setRfqIsReeferOrOog] = React.useState<boolean>(false);
  const [rfqCargoNotes, setRfqCargoNotes] = React.useState<string>('');
  const [isCreatingRfq, setIsCreatingRfq] = React.useState<boolean>(false);
  const [rfqPage, setRfqPage] = React.useState<number>(1);
  const [rfqPageSize, setRfqPageSize] = React.useState<number>(10);

  // Inline Spot RFQ Resolution State
  const [resolvingTicketId, setResolvingTicketId] = React.useState<string | null>(null);
  const [resolveCarrier, setResolveCarrier] = React.useState<CarrierCode>('MSC');
  const [resolveAgent, setResolveAgent] = React.useState<string>('');
  const [resolveRates, setResolveRates] = React.useState<Record<string, string>>({});
  const [resolveFreeDays, setResolveFreeDays] = React.useState<number>(21);
  const [resolveValidDays, setResolveValidDays] = React.useState<7 | 14>(7);
  const [resolveSpotRef, setResolveSpotRef] = React.useState<string>('');
  const [isResolvingRfq, setIsResolvingRfq] = React.useState<boolean>(false);

  // Evaluation results & UI state
  const [evaluations, setEvaluations] = React.useState<CarrierQuoteEvaluation[]>([]);
  const [selectedCarrier, setSelectedCarrier] = React.useState<CarrierCode | null>(null);
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const [isSavingQuote, setIsSavingQuote] = React.useState<boolean>(false);
  const [copiedAction, setCopiedAction] = React.useState<string | null>(null);

  // Pagination on carrier comparison list
  const [compPage, setCompPage] = React.useState<number>(1);
  const [compPageSize, setCompPageSize] = React.useState<number>(10);

  // --- Tariff Matrix Management State ---
  const [tariffRows, setTariffRows] = React.useState<MulticotizadorTariffRow[]>([]);
  const [gmailFclCount, setGmailFclCount] = React.useState<number>(0);
  const [dcsaConfiguredCarriers, setDcsaConfiguredCarriers] = React.useState<string[]>([]);
  const [tariffSearch, setTariffSearch] = React.useState<string>('');
  const [tariffPage, setTariffPage] = React.useState<number>(1);
  const [tariffPageSize, setTariffPageSize] = React.useState<number>(10);
  const [isSavingTariff, setIsSavingTariff] = React.useState<boolean>(false);

  // New / Edit Tariff Form
  const todayYmd = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultValidToYmd = React.useMemo(
    () => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
    []
  );
  const [newTariffCarrier, setNewTariffCarrier] = React.useState<CarrierCode>('MSC');
  const [newTariffAgent, setNewTariffAgent] = React.useState<string>('Eversail Logistics');
  const [newTariffPol, setNewTariffPol] = React.useState<string>('CNSHA');
  const [newTariffPod, setNewTariffPod] = React.useState<string>('ARBUE');
  const [newTariffRiverExt, setNewTariffRiverExt] = React.useState<boolean>(true);
  const [newTariff20Gp, setNewTariff20Gp] = React.useState<string>('3150');
  const [newTariff40Hc, setNewTariff40Hc] = React.useState<string>('3650');
  const [newTariff40Std, setNewTariff40Std] = React.useState<string>('3550');
  const [newTariffFreeDays, setNewTariffFreeDays] = React.useState<number>(21);
  const [newTariffValidFrom, setNewTariffValidFrom] = React.useState<string>(todayYmd);
  const [newTariffValidTo, setNewTariffValidTo] = React.useState<string>(defaultValidToYmd);
  const [newTariffRef, setNewTariffRef] = React.useState<string>('W44-SHEET');

  // Pre-fill from Cubicaje Inteligente query params (?equip=40HC&qty=1&weightTons=9.5&cbm=43.2)
  React.useEffect(() => {
    const equipParam = searchParams?.get('equip')?.toUpperCase() as EquipmentCode | undefined;
    const qtyParam = Number(searchParams?.get('qty') || '0');
    const weightKgParam = Number(searchParams?.get('weightKg') || '0');
    const cbmParam = Number(searchParams?.get('cbm') || '0');

    if (equipParam && EQUIPMENT_OPTIONS.includes(equipParam)) {
      const safeQty = qtyParam >= 1 ? Math.min(50, Math.round(qtyParam)) : 1;
      const tonsPerUnit =
        weightKgParam > 0
          ? Math.max(1, Number((weightKgParam / 1000 / safeQty).toFixed(2)))
          : 18;
      setContainerLines([
        {
          equipment: equipParam,
          qty: safeQty,
          grossWeightTonsPerUnit: tonsPerUnit,
        },
      ]);
      setCubicajePrefillBanner(
        `Pre-cargado desde Cubicaje Inteligente (PO-01): ${safeQty}× ${EQUIPMENT_LABELS[equipParam]}${
          cbmParam > 0 ? ` · ${cbmParam.toFixed(2)} m³ totales` : ''
        }${weightKgParam > 0 ? ` · ${(weightKgParam / 1000).toFixed(2)} tn brutas` : ''}`
      );
    }
  }, [searchParams]);

  const handleDeliveryModeChange = (mode: DeliveryLogisticsMode) => {
    setDeliveryMode(mode);
    if (mode === 'PORT_DIRECT') {
      setInlandTruckingPerContainerUsd(0);
    } else if (mode === 'BUE_TO_ROSARIO_PLANT') {
      setPodUnlocode('ARBUE');
      setInlandTruckingPerContainerUsd(700);
    } else if (mode === 'ROSARIO_PORT_TO_PLANT') {
      setPodUnlocode('ARROS');
      setInlandTruckingPerContainerUsd(290);
    }
  };

  const fetchTariffMetadata = React.useCallback(async () => {
    try {
      const [resTariffs, resRfqs] = await Promise.all([
        fetch('/api/multicotizador/tarifarios'),
        fetch('/api/multicotizador/spot-rfq'),
      ]);
      if (resTariffs.ok) {
        const json = (await resTariffs.json()) as {
          success: boolean;
          data?: {
            rows: MulticotizadorTariffRow[];
            gmailFclActiveQuotesCount: number;
            dcsaConfiguredCarriers: string[];
            openSpotRfqsCount?: number;
            tariffSyncMeta?: {
              lastGmailTariffSyncAt: string | null;
            };
          };
        };
        if (json.success && json.data) {
          setTariffRows(json.data.rows);
          setGmailFclCount(json.data.gmailFclActiveQuotesCount);
          setDcsaConfiguredCarriers(json.data.dcsaConfiguredCarriers);
          if (typeof json.data.openSpotRfqsCount === 'number') {
            setOpenSpotRfqsCount(json.data.openSpotRfqsCount);
          }
          if (json.data.tariffSyncMeta?.lastGmailTariffSyncAt) {
            setLastGmailTariffSyncAt(json.data.tariffSyncMeta.lastGmailTariffSyncAt);
          }
        }
      }
      if (resRfqs.ok) {
        const rfqJson = (await resRfqs.json()) as {
          success: boolean;
          data?: {
            tickets: SpotRfqTicket[];
            openCount: number;
          };
        };
        if (rfqJson.success && rfqJson.data) {
          setSpotRfqTickets(rfqJson.data.tickets);
          setOpenSpotRfqsCount(rfqJson.data.openCount);
        }
      }
    } catch {
      // ignore offline
    }
  }, []);

  const currentCalcInput = React.useMemo<MulticotizadorCalculationInput>(
    () => ({
      operationType,
      incoterm,
      polUnlocode,
      podUnlocode,
      containerLines,
      profitMode,
      profitUsdPerContainer,
      profitMarkupPct,
      freeTimeExtraDays,
      applyHws20Gp,
      thcDestinationPerContainerUsd,
      hidroviaTollPerContainerUsd,
      internationalAgencyPerBlUsd,
      localDocAndBlFeePerBlUsd,
      deliveryMode,
      inlandTruckingPerContainerUsd,
      custodyPerContainerUsd,
      includeInsurance,
      cargoFobValueUsd,
      insuranceRatePct,
      spotOverridesByCarrier: spotOverrides,
      clienteNombre: clienteNombre.trim() || undefined,
      contactoEmail: contactoEmail.trim() || undefined,
    }),
    [
      operationType,
      incoterm,
      polUnlocode,
      podUnlocode,
      containerLines,
      profitMode,
      profitUsdPerContainer,
      profitMarkupPct,
      freeTimeExtraDays,
      applyHws20Gp,
      thcDestinationPerContainerUsd,
      hidroviaTollPerContainerUsd,
      internationalAgencyPerBlUsd,
      localDocAndBlFeePerBlUsd,
      deliveryMode,
      inlandTruckingPerContainerUsd,
      custodyPerContainerUsd,
      includeInsurance,
      cargoFobValueUsd,
      insuranceRatePct,
      spotOverrides,
      clienteNombre,
      contactoEmail,
    ]
  );

  const runEvaluation = React.useCallback(async (payload: MulticotizadorCalculationInput) => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/multicotizador/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { evaluations: CarrierQuoteEvaluation[] };
      };
      if (!res.ok || !json.success || !json.data) {
        return;
      }
      setEvaluations(json.data.evaluations);
      const firstQuotable = json.data.evaluations.find((e) => e.isQuotable);
      setSelectedCarrier((prev) => {
        if (prev && json.data?.evaluations.some((e) => e.carrier === prev && e.isQuotable)) {
          return prev;
        }
        return firstQuotable?.carrier ?? json.data?.evaluations[0]?.carrier ?? null;
      });
    } catch {
      // ignore transient abort
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchTariffMetadata();
  }, [fetchTariffMetadata]);

  // Debounced auto-evaluation on input changes so pricing updates smoothly
  React.useEffect(() => {
    const timer = setTimeout(() => {
      void runEvaluation(currentCalcInput);
    }, 220);
    return () => clearTimeout(timer);
  }, [currentCalcInput, runEvaluation]);

  const selectedEvaluation = React.useMemo(
    () =>
      evaluations.find((e) => e.carrier === selectedCarrier) ??
      evaluations.find((e) => e.isQuotable) ??
      null,
    [evaluations, selectedCarrier]
  );

  const quotableEvaluations = React.useMemo(
    () => evaluations.filter((e) => e.isQuotable),
    [evaluations]
  );

  const spotNeededCarriers = React.useMemo(
    () => evaluations.filter((e) => !e.isQuotable).map((e) => e.carrier),
    [evaluations]
  );

  const pagedEvaluations = React.useMemo(() => {
    const start = (compPage - 1) * compPageSize;
    return evaluations.slice(start, start + compPageSize);
  }, [evaluations, compPage, compPageSize]);

  const filteredTariffRows = React.useMemo(() => {
    const q = tariffSearch.trim().toLowerCase();
    if (!q) return tariffRows;
    return tariffRows.filter(
      (r) =>
        r.carrier.toLowerCase().includes(q) ||
        r.agentOrSource.toLowerCase().includes(q) ||
        r.polUnlocode.toLowerCase().includes(q) ||
        r.podUnlocode.toLowerCase().includes(q) ||
        (r.contractOrSheetRef ?? '').toLowerCase().includes(q)
    );
  }, [tariffRows, tariffSearch]);

  const pagedTariffRows = React.useMemo(() => {
    const start = (tariffPage - 1) * tariffPageSize;
    return filteredTariffRows.slice(start, start + tariffPageSize);
  }, [filteredTariffRows, tariffPage, tariffPageSize]);

  const handleSwapPorts = () => {
    setPolUnlocode(podUnlocode);
    setPodUnlocode(polUnlocode);
    setOperationType((prev) => (prev === 'IMPORTACION' ? 'EXPORTACION' : 'IMPORTACION'));
    setCompPage(1);
  };

  const handleAddContainerLine = () => {
    const used = new Set(containerLines.map((l) => l.equipment));
    const nextEq = EQUIPMENT_OPTIONS.find((eq) => !used.has(eq)) ?? '20GP';
    setContainerLines((prev) => [
      ...prev,
      { equipment: nextEq, qty: 1, grossWeightTonsPerUnit: 18 },
    ]);
  };

  const handleUpdateContainerLine = (
    idx: number,
    patch: Partial<ContainerRequestLine>
  ) => {
    setContainerLines((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveContainerLine = (idx: number) => {
    if (containerLines.length <= 1) return;
    setContainerLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const corridorRecommendation = React.useMemo(
    () =>
      suggestSpotAgentsForCorridor(polUnlocode, podUnlocode, {
        isImoDg: rfqIsImoDg,
        isReeferOrOog: rfqIsReeferOrOog,
      }),
    [polUnlocode, podUnlocode, rfqIsImoDg, rfqIsReeferOrOog]
  );

  const pagedRfqTickets = React.useMemo(() => {
    const start = (rfqPage - 1) * rfqPageSize;
    return spotRfqTickets.slice(start, start + rfqPageSize);
  }, [spotRfqTickets, rfqPage, rfqPageSize]);

  const liveRfqDraftPreview = React.useMemo(
    () =>
      buildSpotRateInquiryDraft({
        carriers: rfqCarriers.length > 0 ? rfqCarriers : spotNeededCarriers.length > 0 ? spotNeededCarriers : ['MSC', 'MAERSK', 'HAPAG_LLOYD'],
        input: currentCalcInput,
        asesorNombre: user?.nombre ?? 'Pricing Comercial ALMAR',
        targetRateUsd: Number(rfqTargetRateUsd) > 0 ? Number(rfqTargetRateUsd) : undefined,
        isImoDg: rfqIsImoDg,
        imoClassUn: rfqImoClassUn.trim() || undefined,
        isReeferOrOog: rfqIsReeferOrOog,
        cargoNotes: rfqCargoNotes.trim() || undefined,
      }),
    [
      rfqCarriers,
      spotNeededCarriers,
      currentCalcInput,
      user?.nombre,
      rfqTargetRateUsd,
      rfqIsImoDg,
      rfqImoClassUn,
      rfqIsReeferOrOog,
      rfqCargoNotes,
    ]
  );

  const handleSyncGmailTariffsNow = async () => {
    setIsSyncingGmailTariffs(true);
    try {
      const res = await fetch('/api/multicotizador/sync-gmail', { method: 'POST' });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: {
          syncedAt: string;
          allRows: MulticotizadorTariffRow[];
          spotRfqTickets: SpotRfqTicket[];
          openSpotRfqsCount: number;
          summary: {
            scannedMailboxes: number;
            scannedMessages: number;
            newMessagesIngested: number;
            weeklyTariffsUpserted: number;
            spotRatesUpserted: number;
            spotRfqsAutoResolved: number;
          };
        };
      };
      if (!res.ok || !json.success || !json.data) {
        toast.warning(
          'Escaneo Gmail no disponible',
          json.error ?? 'No se pudo completar el escaneo en este momento.'
        );
        return;
      }
      setLastGmailTariffSyncAt(json.data.syncedAt);
      setTariffRows(json.data.allRows);
      setSpotRfqTickets(json.data.spotRfqTickets);
      setOpenSpotRfqsCount(json.data.openSpotRfqsCount);
      const s = json.data.summary;
      toast.success(
        'Sincronización Gmail 24/7 Completada',
        `${s.scannedMailboxes} casillas auditadas · ${s.weeklyTariffsUpserted} tarifas semanales y ${s.spotRatesUpserted} spots actualizados.`
      );
      void runEvaluation(currentCalcInput);
    } catch {
      toast.error('Error de red', 'No se pudo conectar con /api/multicotizador/sync-gmail.');
    } finally {
      setIsSyncingGmailTariffs(false);
    }
  };

  const handleDirectSaveInlineSpot = async (carrier: CarrierCode) => {
    const nextCarrierSpot: Partial<Record<EquipmentCode, number>> = {};
    for (const line of containerLines) {
      const key = `${carrier}_${line.equipment}`;
      const rawVal = Number(spotInputDrafts[key] ?? spotOverrides[carrier]?.[line.equipment] ?? 0);
      if (!Number.isFinite(rawVal) || rawVal <= 0) {
        toast.warning(
          'Tarifa Spot Incompleta',
          `Ingrese un flete neto válido en USD para ${EQUIPMENT_LABELS[line.equipment]}.`
        );
        return;
      }
      nextCarrierSpot[line.equipment] = rawVal;
    }

    const validToYmd = new Date(Date.now() + spotValidDaysDraft * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const spotRef = (spotRefDrafts[carrier] ?? '').trim() || undefined;
    const primaryAgent = corridorRecommendation.primaryChannels[0]?.agentName ?? 'Spot Comercial Validado';

    setIsSavingTariff(true);
    try {
      const res = await fetch('/api/multicotizador/tarifarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          agentOrSource: `Spot · ${primaryAgent}`,
          polUnlocode,
          podUnlocode,
          allowsRiverExtensionToArros: podUnlocode === 'ARBUE',
          ratesByEquipmentUsd: nextCarrierSpot,
          freeDaysIncluded: CARRIER_PROFILES[carrier].defaultFreeDays,
          validFrom: todayYmd,
          validTo: validToYmd,
          entryKind: 'SPOT_CACHE',
          spotQuoteRef: spotRef,
          contractOrSheetRef: spotRef || `SPOT-${spotValidDaysDraft}D`,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        allRows?: MulticotizadorTariffRow[];
        error?: string;
      };
      if (res.ok && json.success) {
        if (json.allRows) setTariffRows(json.allRows);
        handleClearSpotOverride(carrier);
        setSelectedCarrier(carrier);
        toast.success(
          `Spot Compartido Guardado (${spotValidDaysDraft} días)`,
          `${CARRIER_PROFILES[carrier].displayName} (${polUnlocode} → ${podUnlocode}) quedó activo para todo Comercial y Gerencia.`
        );
        void runEvaluation(currentCalcInput);
      } else {
        toast.error('No se pudo guardar el Spot', json.error ?? 'Verifique los valores ingresados');
      }
    } finally {
      setIsSavingTariff(false);
    }
  };

  const handleOpenSpotRfqForCarrier = (carrier?: CarrierCode) => {
    if (carrier) {
      setRfqCarriers([carrier]);
    } else if (spotNeededCarriers.length > 0) {
      setRfqCarriers(spotNeededCarriers.slice(0, 5));
    }
    setActiveTab('MESA_SPOT');
  };

  const handleToggleRfqCarrier = (carrier: CarrierCode) => {
    setRfqCarriers((prev) =>
      prev.includes(carrier)
        ? prev.length > 1
          ? prev.filter((c) => c !== carrier)
          : prev
        : [...prev, carrier]
    );
  };

  const buildGmailWebComposeUrl = (params: {
    toEmails: string[];
    draftWithSubject: string;
  }): string => {
    const lines = params.draftWithSubject.split('\n');
    let subject = `FCL Spot Rate Request: ${polUnlocode} -> ${podUnlocode} (${incoterm})`;
    let bodyStartIdx = 0;
    if (lines[0]?.toLowerCase().startsWith('subject:')) {
      subject = lines[0].slice(8).trim();
      bodyStartIdx = lines[1]?.trim() === '' ? 2 : 1;
    }
    const body = lines.slice(bodyStartIdx).join('\n');
    const to = params.toEmails.slice(0, 3).join(',');
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCreateSpotRfqTicket = async () => {
    const targetCarriers =
      rfqCarriers.length > 0
        ? rfqCarriers
        : spotNeededCarriers.length > 0
          ? spotNeededCarriers
          : (['MSC', 'MAERSK', 'HAPAG_LLOYD'] as CarrierCode[]);
    setIsCreatingRfq(true);
    try {
      const res = await fetch('/api/multicotizador/spot-rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationType,
          incoterm,
          polUnlocode,
          podUnlocode,
          containerLines,
          carriersRequested: targetCarriers,
          clienteNombre: clienteNombre.trim() || undefined,
          targetRateUsd: Number(rfqTargetRateUsd) > 0 ? Number(rfqTargetRateUsd) : undefined,
          isImoDg: rfqIsImoDg,
          imoClassUn: rfqImoClassUn.trim() || undefined,
          isReeferOrOog: rfqIsReeferOrOog,
          cargoNotes: rfqCargoNotes.trim() || undefined,
          freeTimeExtraDays,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: {
          ticket: SpotRfqTicket;
          tickets: SpotRfqTicket[];
          openCount: number;
        };
      };
      if (!res.ok || !json.success || !json.data) {
        toast.error('Error al crear Ticket Spot', json.error ?? 'Verifique los datos');
        return;
      }
      setSpotRfqTickets(json.data.tickets);
      setOpenSpotRfqsCount(json.data.openCount);
      toast.success(
        `Ticket ${json.data.ticket.ticketNumber} Registrado (SLA 45 min)`,
        `Canal sugerido: ${json.data.ticket.recommendedAgents[0] ?? json.data.ticket.corridorLabel}. Cuando llegue la respuesta por Gmail 24/7 o se cargue aquí, quedará activo.`
      );
    } finally {
      setIsCreatingRfq(false);
    }
  };

  const handleStartResolveTicket = (ticket: SpotRfqTicket) => {
    setResolvingTicketId(ticket.id);
    const firstCarrier = ticket.carriersRequested[0] ?? 'MSC';
    setResolveCarrier(firstCarrier);
    setResolveAgent(ticket.recommendedAgents[0] ?? 'Spot Confirmado Agente');
    setResolveFreeDays(CARRIER_PROFILES[firstCarrier]?.defaultFreeDays ?? 21);
    setResolveValidDays(7);
    setResolveSpotRef(ticket.ticketNumber);
    const initialRates: Record<string, string> = {};
    for (const l of ticket.containerLines) {
      initialRates[l.equipment] = ticket.targetRateUsd ? String(ticket.targetRateUsd) : '';
    }
    setResolveRates(initialRates);
  };

  const handleSubmitResolveTicket = async (ticket: SpotRfqTicket) => {
    const ratesMap: Partial<Record<EquipmentCode, number>> = {};
    for (const line of ticket.containerLines) {
      const val = Number(resolveRates[line.equipment] ?? 0);
      if (!Number.isFinite(val) || val <= 0) {
        toast.warning(
          'Tarifa requerida',
          `Ingrese el flete neto confirmado en USD para ${EQUIPMENT_LABELS[line.equipment]}.`
        );
        return;
      }
      ratesMap[line.equipment] = val;
    }

    setIsResolvingRfq(true);
    try {
      const res = await fetch('/api/multicotizador/spot-rfq', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_WITH_RATE',
          ticketId: ticket.id,
          carrier: resolveCarrier,
          agentOrSource: resolveAgent.trim() || 'Spot Confirmado Pricing',
          ratesByEquipmentUsd: ratesMap,
          freeDaysIncluded: resolveFreeDays,
          validDays: resolveValidDays,
          spotQuoteRef: resolveSpotRef.trim() || ticket.ticketNumber,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: {
          tickets: SpotRfqTicket[];
          openCount: number;
          allTariffRows: MulticotizadorTariffRow[];
        };
      };
      if (!res.ok || !json.success || !json.data) {
        toast.error('No se pudo activar el Spot', json.error ?? 'Verifique los datos');
        return;
      }
      setSpotRfqTickets(json.data.tickets);
      setOpenSpotRfqsCount(json.data.openCount);
      setTariffRows(json.data.allTariffRows);
      setResolvingTicketId(null);
      setPolUnlocode(ticket.polUnlocode);
      setPodUnlocode(ticket.podUnlocode);
      setContainerLines(ticket.containerLines);
      setSelectedCarrier(resolveCarrier);
      toast.success(
        `${ticket.ticketNumber} Respondido & Tarifa Spot Activa`,
        `${CARRIER_PROFILES[resolveCarrier].displayName} (${ticket.polUnlocode} → ${ticket.podUnlocode}) ya está disponible en el Comparador.`
      );
      setActiveTab('COMPARADOR');
    } finally {
      setIsResolvingRfq(false);
    }
  };

  const handleUpdateRfqStatus = async (ticketId: string, status: SpotRfqStatus) => {
    const res = await fetch('/api/multicotizador/spot-rfq', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_STATUS',
        ticketId,
        status,
      }),
    });
    const json = (await res.json()) as {
      success: boolean;
      data?: { tickets: SpotRfqTicket[]; openCount: number };
    };
    if (res.ok && json.success && json.data) {
      setSpotRfqTickets(json.data.tickets);
      setOpenSpotRfqsCount(json.data.openCount);
    }
  };

  const handleApplyInlineSpot = (carrier: CarrierCode) => {
    const nextCarrierSpot: Partial<Record<EquipmentCode, number>> = {};
    for (const line of containerLines) {
      const key = `${carrier}_${line.equipment}`;
      const rawVal = Number(spotInputDrafts[key] ?? spotOverrides[carrier]?.[line.equipment] ?? 0);
      if (!Number.isFinite(rawVal) || rawVal <= 0) {
        toast.warning(
          'Tarifa Spot Incompleta',
          `Ingrese un flete neto válido en USD para ${EQUIPMENT_LABELS[line.equipment]}.`
        );
        return;
      }
      nextCarrierSpot[line.equipment] = rawVal;
    }
    setSpotOverrides((prev) => ({
      ...prev,
      [carrier]: nextCarrierSpot,
    }));
    setSelectedCarrier(carrier);
    toast.success(
      'Tarifa Spot Aplicada',
      `Se recalculó ${CARRIER_PROFILES[carrier].displayName} con el neto Spot ingresado.`
    );
  };

  const handleClearSpotOverride = (carrier: CarrierCode) => {
    setSpotOverrides((prev) => {
      const copy = { ...prev };
      delete copy[carrier];
      return copy;
    });
  };

  const handleSaveSpotIntoTariffMatrix = async (ev: CarrierQuoteEvaluation) => {
    const spotMap = spotOverrides[ev.carrier];
    if (!spotMap) return;
    setIsSavingTariff(true);
    try {
      const res = await fetch('/api/multicotizador/tarifarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: ev.carrier,
          agentOrSource: 'Spot Comercial Validado',
          polUnlocode,
          podUnlocode,
          allowsRiverExtensionToArros: podUnlocode === 'ARBUE',
          ratesByEquipmentUsd: spotMap,
          freeDaysIncluded: ev.freeDaysBase,
          validFrom: todayYmd,
          validTo: defaultValidToYmd,
          entryKind: 'SPOT_CACHE',
          spotQuoteRef: (spotRefDrafts[ev.carrier] ?? '').trim() || undefined,
          contractOrSheetRef: (spotRefDrafts[ev.carrier] ?? '').trim() || 'SPOT-GUARDADO',
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        allRows?: MulticotizadorTariffRow[];
        error?: string;
      };
      if (res.ok && json.success) {
        if (json.allRows) setTariffRows(json.allRows);
        handleClearSpotOverride(ev.carrier);
        toast.success(
          'Guardado en Tarifario Semanal',
          `La tarifa de ${ev.carrierDisplayName} (${polUnlocode} → ${podUnlocode}) quedó vigente por 14 días.`
        );
        void runEvaluation(currentCalcInput);
      } else {
        toast.error('No se pudo guardar', json.error ?? 'Verifique los datos');
      }
    } finally {
      setIsSavingTariff(false);
    }
  };

  const copyToClipboard = async (key: string, text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAction(key);
      toast.success(title, 'Contenido copiado al portapapeles.');
      setTimeout(() => setCopiedAction((prev) => (prev === key ? null : prev)), 2500);
    } catch {
      toast.error('Error al copiar', 'No se pudo acceder al portapapeles del navegador.');
    }
  };

  const handleEmitAndSaveCotizacion = async (abrirCarpeta = false) => {
    if (!selectedEvaluation || !selectedEvaluation.isQuotable) return;
    const targetClient = clienteNombre.trim() || 'CLIENTE COMERCIAL A CONFIRMAR';
    const targetEmail =
      contactoEmail.trim() && contactoEmail.includes('@')
        ? contactoEmail.trim()
        : 'comercial@cliente.com';
    const asesor = user?.nombre ?? 'Lucía Laje';

    const polInfo = getPortByUnlocode(polUnlocode);
    const podInfo = getPortByUnlocode(podUnlocode);
    const equipSummary = selectedEvaluation.containerBreakdown
      .map((b) => `${b.qty}x ${b.equipmentLabel}`)
      .join(' + ');

    setIsSavingQuote(true);
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: targetClient,
          contactoEmail: targetEmail,
          responsableComercial: asesor,
          via: 'MARITIMO_FCL',
          origen: polInfo ? `${polInfo.name} (${polInfo.unlocode})` : polUnlocode,
          destino: podInfo ? `${podInfo.name} (${podInfo.unlocode})` : podUnlocode,
          incoterm,
          fleteCostoEstimadoUsd: selectedEvaluation.totalNetCostAlmarUsd ?? 0,
          fleteVentaUsd: selectedEvaluation.totalPreVatClientUsd ?? 0,
          navieraOAerolineaSugerida: selectedEvaluation.carrierDisplayName,
          tiempoTransitoEstimadoDias: Math.max(1, selectedEvaluation.effectiveTransitDays),
          diasLibresDemora: selectedEvaluation.freeDaysTotal,
          tipoServicio: 'FCL - FCL',
          usuarioPricing: asesor,
          vendedor: asesor,
          agenteTransportista:
            selectedEvaluation.sourceAgentOrContract ?? selectedEvaluation.carrierDisplayName,
          fechaDesde: selectedEvaluation.validFrom ?? todayYmd,
          fechaHasta: selectedEvaluation.validTo ?? defaultValidToYmd,
          sugerenciaEquipo: equipSummary,
          estado: abrirCarpeta ? 'GANADA' : 'COTIZADA',
          abrirCarpeta,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { numeroCotizacion?: string };
        carpeta?: { numero_carpeta?: string } | null;
      };
      if (!res.ok || !json.success) {
        toast.error('Error al emitir cotización', json.error ?? 'Verifique los campos ingresados');
        return;
      }

      const numCot = json.data?.numeroCotizacion ?? 'NUEVA';
      if (abrirCarpeta && json.carpeta?.numero_carpeta) {
        toast.success(
          `Cotización ${numCot} + Carpeta ${json.carpeta.numero_carpeta} Creadas`,
          'La oferta quedó registrada como GANADA y vinculada a su Carpeta Operativa.'
        );
        router.push('/carpetas');
      } else {
        toast.success(
          `Cotización ${numCot} Registrada en Cartera`,
          `Guardada con costo base auditado (${formatUsd(selectedEvaluation.totalNetCostAlmarUsd)}) y seguimiento 48hs activo.`
        );
      }
    } catch {
      toast.error('Error de red', 'No se pudo conectar con /api/cotizaciones.');
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleSaveNewTariffRow = async (e: React.FormEvent) => {
    e.preventDefault();
    const rates: Partial<Record<EquipmentCode, number>> = {};
    if (Number(newTariff20Gp) > 0) rates['20GP'] = Number(newTariff20Gp);
    if (Number(newTariff40Std) > 0) rates['40STD'] = Number(newTariff40Std);
    if (Number(newTariff40Hc) > 0) rates['40HC'] = Number(newTariff40Hc);

    if (Object.keys(rates).length === 0) {
      toast.warning('Tarifas vacías', 'Ingrese al menos un valor positivo en USD (20GP, 40STD o 40HC).');
      return;
    }

    setIsSavingTariff(true);
    try {
      const res = await fetch('/api/multicotizador/tarifarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: newTariffCarrier,
          agentOrSource: newTariffAgent,
          polUnlocode: newTariffPol,
          podUnlocode: newTariffPod,
          allowsRiverExtensionToArros: newTariffRiverExt,
          ratesByEquipmentUsd: rates,
          freeDaysIncluded: newTariffFreeDays,
          validFrom: newTariffValidFrom,
          validTo: newTariffValidTo,
          contractOrSheetRef: newTariffRef.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        allRows?: MulticotizadorTariffRow[];
      };
      if (res.ok && json.success) {
        if (json.allRows) setTariffRows(json.allRows);
        toast.success(
          'Tarifa Actualizada',
          `${CARRIER_PROFILES[newTariffCarrier].displayName} (${newTariffPol} → ${newTariffPod}) guardada en la matriz.`
        );
        void runEvaluation(currentCalcInput);
      } else {
        toast.error('Error de validación', json.error ?? 'Revise las fechas de vigencia.');
      }
    } finally {
      setIsSavingTariff(false);
    }
  };

  const handleRenewTariff14Days = async (row: MulticotizadorTariffRow) => {
    setIsSavingTariff(true);
    try {
      const res = await fetch('/api/multicotizador/tarifarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...row,
          validFrom: todayYmd,
          validTo: defaultValidToYmd,
        }),
      });
      const json = (await res.json()) as { success: boolean; allRows?: MulticotizadorTariffRow[] };
      if (res.ok && json.success && json.allRows) {
        setTariffRows(json.allRows);
        toast.success('Vigencia Renovada +14 días', `${row.polUnlocode} → ${row.podUnlocode} (${row.carrier}) activa.`);
        void runEvaluation(currentCalcInput);
      }
    } finally {
      setIsSavingTariff(false);
    }
  };

  const handleDeleteTariffRow = async (id: string) => {
    const res = await fetch(`/api/multicotizador/tarifarios?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = (await res.json()) as { success: boolean; allRows?: MulticotizadorTariffRow[] };
    if (res.ok && json.success && json.allRows) {
      setTariffRows(json.allRows);
      toast.info('Tarifa Eliminada', 'Se quitó la fila de la matriz semanal.');
      void runEvaluation(currentCalcInput);
    }
  };

  const renderRateSourceBadge = (ev: CarrierQuoteEvaluation) => {
    switch (ev.rateSource) {
      case 'TARIFF_ACTIVE':
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
            Tarifario Vigente ({ev.daysUntilExpiry ?? 0}d)
          </Badge>
        );
      case 'SPOT_SAVED_ACTIVE':
        return (
          <Badge className="bg-teal-50 text-teal-900 border-teal-400 text-[10px] font-semibold">
            Spot Vigente ({ev.daysUntilExpiry ?? 0}d{ev.spotQuoteRef ? ` · ${ev.spotQuoteRef}` : ''})
          </Badge>
        );
      case 'GMAIL_24_7_ACTIVE':
        return (
          <Badge className="bg-indigo-50 text-indigo-800 border-indigo-300 text-[10px] font-semibold">
            Cotización Correo ({ev.gmailQuoteRef?.numeroCotizacion})
          </Badge>
        );
      case 'SPOT_MANUAL':
        return (
          <Badge className="bg-sky-50 text-sky-800 border-sky-300 text-[10px] font-semibold">
            Spot Sesión Activo
          </Badge>
        );
      case 'TARIFF_EXPIRED':
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] font-bold">
            Tarifa Vencida ({ev.validTo})
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50 text-[10px]">
            Requiere Spot
          </Badge>
        );
    }
  };

  const renderScheduleBadge = (ev: CarrierQuoteEvaluation) => {
    const st = ev.schedule.status;
    const first = ev.schedule.sailings[0];
    if ((st === 'LIVE_DCSA' || st === 'LIVE_DCSA_VIA_HUB') && first) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <Ship className="h-3 w-3 shrink-0" />
          <span>
            Buque: {first.vesselName} ({first.transitDays}d · ETD {first.etdIso.slice(5, 10)})
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
        <Clock className="h-3 w-3 shrink-0 text-slate-400" />
        <span>
          Tránsito estimado: {ev.schedule.corridorEstimateDays.minDays}–
          {ev.schedule.corridorEstimateDays.maxDays} días
        </span>
      </span>
    );
  };

  return (
    <MulticotizadorGuard>
      <div className="space-y-5 min-w-0 max-w-full">
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link
                href="/cotizaciones"
                className="inline-flex items-center gap-1 text-[#0072BC] hover:underline font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver a Cartera de Cotizaciones</span>
              </Link>
              <span>•</span>
              <span>Pricing Comercial &amp; Dirección ({role})</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Ship className="h-6 w-6 text-[#0072BC] shrink-0" />
                <span>Multicotizador Marítimo FCL Multi-Naviera</span>
              </h1>
              <Badge className="bg-[#081433] text-sky-300 border-[#081433] text-[10px] font-mono">
                Tarifarios FCL · Desglose IVA
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Comparador de tarifas marítimas FCL por ruta: integra tarifarios vigentes, cotizaciones recibidas por correo, itinerarios de navieras y desglose de IVA (0% internacional vs. 21% gastos locales).
            </p>
          </div>

          {/* Mode Tabs & 24/7 Gmail Sync */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncingGmailTariffs}
              onClick={() => void handleSyncGmailTariffsNow()}
              className="h-9 text-xs border-indigo-300 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 font-semibold gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncingGmailTariffs ? 'animate-spin' : ''}`} />
              <span>Sincronizar Tarifas</span>
            </Button>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('COMPARADOR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'COMPARADOR'
                    ? 'bg-[#081433] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Comparador &amp; Emisión</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MESA_SPOT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MESA_SPOT'
                    ? 'bg-[#081433] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Mesa Spot / RFQ ({openSpotRfqsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TARIFARIOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'TARIFARIOS'
                    ? 'bg-[#081433] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Matriz Tarifarios ({tariffRows.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Navieras con Tarifa Vigente en Ruta</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold text-emerald-700 tabular-nums">
                {quotableEvaluations.length} / {evaluations.length || ALL_CARRIER_CODES.length}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">Vigencia activa</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Mejor Total Cliente (c/IVA)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {quotableEvaluations[0]
                  ? formatUsd(quotableEvaluations[0].grandTotalClientWithVatUsd)
                  : 'Requiere Spot'}
              </span>
              {quotableEvaluations[0] && (
                <span className="text-[10px] font-bold text-[#0072BC] truncate ml-1">
                  {quotableEvaluations[0].scac}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">
              Tarifarios &amp; Correo{lastGmailTariffSyncAt ? ` (${lastGmailTariffSyncAt.slice(11, 16)} hs)` : ''}
            </span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {tariffRows.length} rutas
              </span>
              <span className="text-[10px] font-semibold text-indigo-700">
                + {gmailFclCount} FCL · {openSpotRfqsCount} RFQ
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Itinerarios Navieras</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-sm font-bold text-slate-800">
                {dcsaConfiguredCarriers.length > 0
                  ? `${dcsaConfiguredCarriers.length} APIs Conectadas`
                  : 'Tránsito Estimado'}
              </span>
              <span className="text-[10px] text-slate-500">Consulta directa</span>
            </div>
          </div>
        </div>

        {cubicajePrefillBanner && (
          <div className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-xs text-sky-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0072BC] shrink-0" />
              <span className="font-medium">{cubicajePrefillBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setCubicajePrefillBanner(null)}
              className="text-[11px] text-sky-700 hover:underline cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        )}

        {activeTab === 'COMPARADOR' ? (
          <div className="space-y-5">
            {/* Configuration Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Operación & Incoterm */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Operación / Incoterm
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={operationType}
                      onChange={(e) => setOperationType(e.target.value as 'IMPORTACION' | 'EXPORTACION')}
                      className="h-9 w-1/2 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900 focus:border-[#0072BC] focus:outline-none"
                    >
                      <option value="IMPORTACION">IMPO</option>
                      <option value="EXPORTACION">EXPO</option>
                    </select>
                    <select
                      value={incoterm}
                      onChange={(e) => setIncoterm(e.target.value as typeof incoterm)}
                      className="h-9 w-1/2 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900 focus:border-[#0072BC] focus:outline-none"
                    >
                      <option value="FOB">FOB</option>
                      <option value="FCA">FCA</option>
                      <option value="EXW">EXW</option>
                      <option value="CFR">CFR</option>
                      <option value="CIF">CIF</option>
                      <option value="DAP">DAP</option>
                    </select>
                  </div>
                </div>

                {/* POL */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Puerto de Origen (POL — UN/LOCODE)
                  </label>
                  <select
                    aria-label="Puerto de Origen POL"
                    value={polUnlocode}
                    onChange={(e) => {
                      setPolUnlocode(e.target.value);
                      setCompPage(1);
                    }}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:border-[#0072BC] focus:outline-none"
                  >
                    {GLOBAL_OCEAN_PORTS.map((p) => (
                      <option key={`pol-${p.unlocode}`} value={p.unlocode}>
                        {p.unlocode} — {p.name} ({p.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap */}
                <div className="md:col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSwapPorts}
                    title="Invertir Origen / Destino (IMPO ↔ EXPO)"
                    className="h-9 w-full md:w-9 p-0 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* POD */}
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Puerto de Descarga (POD — Directo o Hidrovía Fluvial)
                  </label>
                  <select
                    aria-label="Puerto de Destino POD"
                    value={podUnlocode}
                    onChange={(e) => {
                      const nextPod = e.target.value;
                      setPodUnlocode(nextPod);
                      if (nextPod === 'ARROS' && deliveryMode === 'BUE_TO_ROSARIO_PLANT') {
                        setDeliveryMode('PORT_DIRECT');
                        setInlandTruckingPerContainerUsd(0);
                      }
                      setCompPage(1);
                    }}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:border-[#0072BC] focus:outline-none"
                  >
                    {GLOBAL_OCEAN_PORTS.map((p) => (
                      <option key={`pod-${p.unlocode}`} value={p.unlocode}>
                        {p.unlocode} — {p.name} ({p.country})
                        {p.isRiverPort ? ' · Hidrovía Fluvial' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Equipment Lines */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#0072BC]" />
                    <span>Composición de Contenedores &amp; Peso Bruto por Unidad</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      ref={multiDocInputRef}
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv,.txt,.eml,.doc,.docx"
                      onChange={handleUploadMulticotizadorDoc}
                      className="hidden"
                      data-testid="input-file-multicotizador"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="btn-upload-doc-multicotizador"
                      onClick={() => multiDocInputRef.current?.click()}
                      className="h-7 px-2.5 text-[11px] border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-semibold gap-1 cursor-pointer"
                    >
                      <Upload className="h-3 w-3 text-emerald-700" />
                      <span>Subir Packing List / Doc (PDF / Excel / CSV)</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddContainerLine}
                      className="h-7 px-2.5 text-[11px] border-sky-300 bg-white text-[#0072BC] hover:bg-sky-50 font-semibold gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Agregar otro equipo (Multi-Equipo)</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {containerLines.map((line, idx) => {
                    const isHeavy20 = line.equipment === '20GP' && line.grossWeightTonsPerUnit > 20;
                    return (
                      <div
                        key={`cntr-line-${idx}`}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200"
                      >
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">Cantidad</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={line.qty}
                            onChange={(e) =>
                              handleUpdateContainerLine(idx, {
                                qty: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="h-8 w-full rounded border border-slate-300 px-2 text-xs font-bold tabular-nums text-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <label className="text-[10px] text-slate-500 block">Tipo de Contenedor</label>
                          <select
                            value={line.equipment}
                            onChange={(e) =>
                              handleUpdateContainerLine(idx, {
                                equipment: e.target.value as EquipmentCode,
                              })
                            }
                            className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900"
                          >
                            {EQUIPMENT_OPTIONS.map((eq) => (
                              <option key={eq} value={eq}>
                                {EQUIPMENT_LABELS[eq]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] text-slate-500 block">
                            Peso Bruto Promedio (tn / contenedor)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              min={1}
                              max={34}
                              value={line.grossWeightTonsPerUnit}
                              onChange={(e) =>
                                handleUpdateContainerLine(idx, {
                                  grossWeightTonsPerUnit: Math.max(0.5, Number(e.target.value) || 1),
                                })
                              }
                              className="h-8 w-full rounded border border-slate-300 px-2 text-xs font-semibold tabular-nums text-slate-900"
                            />
                            {isHeavy20 && applyHws20Gp && (
                              <Badge variant="warning" className="text-[10px] shrink-0">
                                HWS 20&apos;
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                          {containerLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContainerLine(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              aria-label="Quitar línea de contenedor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Commercial Profit, Free Time, Delivery Leg & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Profit Mode */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Margen Comercial ALMAR (s/Flete)
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={profitMode}
                      onChange={(e) => setProfitMode(e.target.value as ProfitCalculationMode)}
                      className="h-9 w-[54%] rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900"
                    >
                      <option value="USD_PER_CONTAINER">USD / Cntr</option>
                      <option value="PERCENT_ON_FREIGHT">% s/Flete Neto</option>
                    </select>
                    {profitMode === 'USD_PER_CONTAINER' ? (
                      <input
                        type="number"
                        min={0}
                        step={25}
                        value={profitUsdPerContainer}
                        onChange={(e) => setProfitUsdPerContainer(Math.max(0, Number(e.target.value) || 0))}
                        className="h-9 w-[46%] rounded-lg border border-slate-300 px-2 text-xs font-bold tabular-nums text-slate-900"
                        aria-label="Profit en USD por contenedor"
                      />
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={profitMarkupPct}
                        onChange={(e) => setProfitMarkupPct(Math.max(0, Number(e.target.value) || 0))}
                        className="h-9 w-[46%] rounded-lg border border-slate-300 px-2 text-xs font-bold tabular-nums text-slate-900"
                        aria-label="Porcentaje de margen sobre flete neto"
                      />
                    )}
                  </div>
                </div>

                {/* Free Time */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Días Libres Demora (Free Time)
                  </label>
                  <select
                    value={freeTimeExtraDays}
                    onChange={(e) => setFreeTimeExtraDays(Number(e.target.value) as 0 | 7 | 14)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900"
                  >
                    <option value={0}>Estándar incluido por naviera (14–21d)</option>
                    <option value={7}>Extender +7 días libres (Buy D&amp;D)</option>
                    <option value={14}>Extender +14 días libres (Buy D&amp;D)</option>
                  </select>
                </div>

                {/* Tramo Terrestre Nacional */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tramo Nacional / Entrega Planta
                  </label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => handleDeliveryModeChange(e.target.value as DeliveryLogisticsMode)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900"
                  >
                    <option value="PORT_DIRECT">Hasta Puerto (CY Directo — sin camión)</option>
                    <option value="BUE_TO_ROSARIO_PLANT">Puerto BUE + Camión a Planta Rosario (+IVA 21%)</option>
                    <option value="ROSARIO_PORT_TO_PLANT">TPR Rosario + Camión Urbano a Planta (+IVA 21%)</option>
                  </select>
                </div>

                {/* Cliente Destinatario */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cliente / Razón Social (para Emisión)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Industrias Juan F. Secco S.A."
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Advanced Local Charges & Insurance Toggle */}
              <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedCharges((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0072BC] hover:underline cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>
                    {showAdvancedCharges
                      ? 'Ocultar parámetros portuarios, acarreo, BL y seguro'
                      : 'Ajustar gastos locales (THC, Peaje Hidrovía, Agencia, Camión, BL Fee y Seguro)'}
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {spotNeededCarriers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSpotRfqForCarrier()}
                      className="h-8 text-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 gap-1.5 cursor-pointer font-semibold"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        Mesa Spot Corredor ({corridorRecommendation.primaryChannels[0]?.agentName.split(' (')[0] ?? 'RFQ'})
                      </span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void runEvaluation(currentCalcInput)}
                    disabled={isEvaluating}
                    className="h-8 text-xs bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                    <span>Recalcular Ahora</span>
                  </Button>
                </div>
              </div>

              {showAdvancedCharges && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">
                      THC Destino (USD/cntr · 0%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={thcDestinationPerContainerUsd}
                      onChange={(e) => setThcDestinationPerContainerUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">
                      Peaje Hidrovía (USD/cntr · 0%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hidroviaTollPerContainerUsd}
                      onChange={(e) => setHidroviaTollPerContainerUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">
                      Agencia Intl. (USD/BL · 0%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={internationalAgencyPerBlUsd}
                      onChange={(e) => setInternationalAgencyPerBlUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">
                      BL / Doc Local (USD/BL +21%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={localDocAndBlFeePerBlUsd}
                      onChange={(e) => setLocalDocAndBlFeePerBlUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">
                      Camión Nac. (USD/cntr +21%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={deliveryMode === 'PORT_DIRECT'}
                      value={inlandTruckingPerContainerUsd}
                      onChange={(e) => setInlandTruckingPerContainerUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">
                      Custodia Nac. (USD/cntr +21%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={deliveryMode === 'PORT_DIRECT'}
                      value={custodyPerContainerUsd}
                      onChange={(e) => setCustodyPerContainerUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={includeInsurance}
                        onChange={(e) => setIncludeInsurance(e.target.checked)}
                      />
                      <span>Seguro ({insuranceRatePct}% s/FOB)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={!includeInsurance}
                      placeholder="Valor FOB USD"
                      value={cargoFobValueUsd}
                      onChange={(e) => setCargoFobValueUsd(Number(e.target.value) || 0)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums disabled:bg-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Main Workspace Grid: Left Comparison Table (7 cols) + Right Audited Breakdown & Emission (5 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Carrier Ranking Table */}
              <div className="xl:col-span-7 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Comparativa por Línea Marítima ({polUnlocode} → {podUnlocode})
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Seleccione una naviera con tarifa vigente para ver su desglose de costos o cargue una tarifa Spot.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white border-slate-300 text-slate-700">
                    {containerLines.reduce((a, b) => a + b.qty, 0)} contenedor(es)
                  </Badge>
                </div>

                <div className="divide-y divide-slate-200">
                  {pagedEvaluations.map((ev, index) => {
                    const isSelected = selectedEvaluation?.carrier === ev.carrier;
                    const isBestPrice =
                      ev.isQuotable && quotableEvaluations[0]?.carrier === ev.carrier;

                    return (
                      <div
                        key={ev.carrier}
                        onClick={() => {
                          if (ev.isQuotable) setSelectedCarrier(ev.carrier);
                        }}
                        className={`p-3.5 transition-colors ${
                          ev.isQuotable ? 'cursor-pointer' : ''
                        } ${
                          isSelected
                            ? 'bg-sky-50/70 border-l-4 border-l-[#0072BC]'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                                {ev.scac}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {ev.carrierDisplayName}
                              </span>
                              {isBestPrice && (
                                <Badge className="bg-emerald-600 text-white border-emerald-600 text-[10px]">
                                  #1 Mejor Total
                                </Badge>
                              )}
                              {renderRateSourceBadge(ev)}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                              {renderScheduleBadge(ev)}
                              <span>•</span>
                              <span>{ev.freeDaysTotal} días libres</span>
                              {ev.sourceAgentOrContract && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-slate-700">
                                    Fuente: {ev.sourceAgentOrContract}
                                  </span>
                                </>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500">{ev.diagnosticMessage}</p>
                          </div>

                          {/* Right Price or Inline Spot Input */}
                          <div className="shrink-0 sm:text-right">
                            {ev.isQuotable ? (
                              <div className="space-y-0.5">
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                                  Total Cliente c/IVA
                                </div>
                                <div className="text-base font-bold text-slate-900 tabular-nums">
                                  {formatUsd(ev.grandTotalClientWithVatUsd)}
                                </div>
                                <div className="text-[11px] text-slate-500 tabular-nums">
                                  Pre-IVA: {formatUsd(ev.totalPreVatClientUsd)} · Profit:{' '}
                                  <strong className="text-emerald-700">
                                    {formatUsd(ev.almarProfitUsd)}
                                  </strong>
                                </div>
                                {ev.rateSource === 'SPOT_MANUAL' && (
                                  <div
                                    className="pt-1 flex sm:justify-end gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      disabled={isSavingTariff}
                                      onClick={() => void handleSaveSpotIntoTariffMatrix(ev)}
                                      className="text-[10px] font-semibold text-[#0072BC] hover:underline cursor-pointer"
                                    >
                                      Guardar en Tarifario
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                      type="button"
                                      onClick={() => handleClearSpotOverride(ev.carrier)}
                                      className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                                    >
                                      Quitar Spot
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold text-slate-600">
                                    Cargar Neto Spot (USD/u):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSpotRfqForCarrier(ev.carrier)}
                                    className="text-[10px] font-semibold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Send className="h-2.5 w-2.5" />
                                    <span>Pedir Spot (RFQ)</span>
                                  </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {containerLines.map((line) => {
                                    const draftKey = `${ev.carrier}_${line.equipment}`;
                                    const expiredHint = ev.containerBreakdown.find(
                                      (b) => b.equipment === line.equipment
                                    )?.unitOceanFreightUsd;
                                    return (
                                      <input
                                        key={draftKey}
                                        type="number"
                                        min={1}
                                        placeholder={`${line.equipment}${
                                          expiredHint ? ` (${expiredHint})` : ''
                                        }`}
                                        value={spotInputDrafts[draftKey] ?? ''}
                                        onChange={(e) =>
                                          setSpotInputDrafts((prev) => ({
                                            ...prev,
                                            [draftKey]: e.target.value,
                                          }))
                                        }
                                        className="h-7 w-22 rounded border border-slate-300 bg-white px-2 text-xs tabular-nums"
                                      />
                                    );
                                  })}
                                  <input
                                    type="text"
                                    placeholder="Ref. QQ / Spot"
                                    value={spotRefDrafts[ev.carrier] ?? ''}
                                    onChange={(e) =>
                                      setSpotRefDrafts((prev) => ({
                                        ...prev,
                                        [ev.carrier]: e.target.value,
                                      }))
                                    }
                                    className="h-7 w-24 rounded border border-slate-300 bg-white px-2 text-[11px]"
                                  />
                                  <select
                                    aria-label="Vigencia Spot"
                                    value={spotValidDaysDraft}
                                    onChange={(e) =>
                                      setSpotValidDaysDraft(Number(e.target.value) === 14 ? 14 : 7)
                                    }
                                    className="h-7 rounded border border-slate-300 bg-white px-1.5 text-[11px] font-medium"
                                  >
                                    <option value={7}>7d</option>
                                    <option value={14}>14d</option>
                                  </select>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApplyInlineSpot(ev.carrier)}
                                    className="h-7 px-2 text-[11px] border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer"
                                  >
                                    Simular
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isSavingTariff}
                                    onClick={() => void handleDirectSaveInlineSpot(ev.carrier)}
                                    className="h-7 px-2.5 text-[11px] bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold cursor-pointer"
                                  >
                                    Guardar Spot
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <TablePagination
                  currentPage={compPage}
                  totalItems={evaluations.length}
                  pageSize={compPageSize}
                  pageSizeOptions={[6, 10, 15]}
                  itemLabel="navieras"
                  onPageChange={setCompPage}
                  onPageSizeChange={setCompPageSize}
                  testId="multicotizador-carriers-pagination"
                />
              </div>

              {/* Right Panel: Itemized Fiscal & Commercial Breakdown + 1-Click Emission */}
              <div className="xl:col-span-5 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden sticky top-20">
                {selectedEvaluation && selectedEvaluation.isQuotable ? (
                  <div className="divide-y divide-slate-200">
                    {/* Selected Header */}
                    <div className="p-4 bg-[#081433] text-white space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300">
                          Detalle de Cotización · {incoterm} {polUnlocode} → {podUnlocode}
                        </span>
                        <Badge className="bg-white/10 text-white border-white/20 text-[10px]">
                          {selectedEvaluation.freeDaysTotal}d libres
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-base font-bold truncate">
                          {selectedEvaluation.carrierDisplayName}
                        </h3>
                        <span className="text-lg font-bold text-emerald-300 tabular-nums shrink-0">
                          {formatUsd(selectedEvaluation.grandTotalClientWithVatUsd)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Total Final Cliente c/IVA · Vigencia hasta{' '}
                        <strong>{selectedEvaluation.validTo ?? 'confirmación'}</strong>
                      </p>
                    </div>

                    {/* 1. International Exempt (IVA 0%) */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          1. Flete Internacional &amp; Portuarios (Exentos IVA 0%)
                        </span>
                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50">
                          IVA 0% Exento
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {selectedEvaluation.exemptItems.map((item) => (
                          <div key={item.code} className="flex items-start justify-between gap-2 text-slate-600">
                            <span className="leading-snug">{item.label}</span>
                            <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                              {formatUsd(item.totalUsd)}
                            </span>
                          </div>
                        ))}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                          <span>Subtotal Internacional Exento</span>
                          <span className="tabular-nums">
                            {formatUsd(selectedEvaluation.exemptInternationalSubtotalUsd)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. National Taxable (IVA 21%) */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          2. Gastos Locales &amp; Tramo Nacional (Gravados IVA 21%)
                        </span>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-900 bg-amber-50">
                          IVA 21% AFIP
                        </Badge>
                      </div>
                      {selectedEvaluation.taxableItems.length > 0 ? (
                        <div className="space-y-1.5 text-xs">
                          {selectedEvaluation.taxableItems.map((item) => (
                            <div key={item.code} className="flex items-start justify-between gap-2 text-slate-600">
                              <span className="leading-snug">{item.label}</span>
                              <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                                {formatUsd(item.totalUsd)}
                              </span>
                            </div>
                          ))}
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-slate-700">
                            <span>Base Imponible Nacional</span>
                            <span className="font-semibold tabular-nums">
                              {formatUsd(selectedEvaluation.taxableLocalSubtotalUsd)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-bold text-amber-900">
                            <span>IVA Nacional (21% exacto incl. acarreo)</span>
                            <span className="tabular-nums">
                              {formatUsd(selectedEvaluation.iva21LocalUsd)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Sin cargos locales gravados configurados en esta cotización.
                        </p>
                      )}
                    </div>

                    {/* 3. Internal ALMAR Margin Audit Box */}
                    <div className="p-4 bg-slate-50/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-[#0072BC]" />
                          <span>Control Interno de Rentabilidad ALMAR</span>
                        </span>
                        <Badge
                          className={
                            selectedEvaluation.semaforoRentabilidad === 'SALUDABLE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                              : selectedEvaluation.semaforoRentabilidad === 'PREVENTIVO_MINIMO'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 text-[10px]'
                                : 'bg-rose-100 text-rose-800 border-rose-300 text-[10px]'
                          }
                        >
                          {selectedEvaluation.semaforoRentabilidad === 'SALUDABLE'
                            ? 'Rentabilidad Saludable'
                            : selectedEvaluation.semaforoRentabilidad === 'PREVENTIVO_MINIMO'
                              ? 'Margen Preventivo (<USD 200)'
                              : 'Margen Crítico (<USD 3)'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-white border border-slate-200 p-2">
                          <span className="text-[10px] text-slate-500 block">Costo Neto Total</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatUsd(selectedEvaluation.totalNetCostAlmarUsd)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white border border-slate-200 p-2">
                          <span className="text-[10px] text-slate-500 block">Venta Pre-IVA</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatUsd(selectedEvaluation.totalPreVatClientUsd)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                          <span className="text-[10px] text-emerald-800 block">Profit Neto ALMAR</span>
                          <span className="font-bold text-emerald-800 tabular-nums">
                            {formatUsd(selectedEvaluation.almarProfitUsd)} ({selectedEvaluation.effectiveMarginPctOnSale}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Actions: Save to /cotizaciones, Open Carpeta, Copy Drafts */}
                    <div className="p-4 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          disabled={isSavingQuote}
                          onClick={() => void handleEmitAndSaveCotizacion(false)}
                          className="w-full text-xs bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold gap-1.5 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Emitir &amp; Guardar en Cartera</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSavingQuote}
                          onClick={() => void handleEmitAndSaveCotizacion(true)}
                          className="w-full text-xs border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-semibold gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Confirmada → Abrir Carpeta</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              'formal-draft',
                              buildFormalCommercialDraft({
                                evaluation: selectedEvaluation,
                                input: currentCalcInput,
                                asesorNombre: user?.nombre ?? 'Lucía Laje',
                              }),
                              'Propuesta Comercial Copiada'
                            )
                          }
                          className="w-full text-xs border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                        >
                          {copiedAction === 'formal-draft' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>Copiar Mail / WhatsApp</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              'kipintoch-tsv',
                              buildKipintochTsvRow({
                                evaluation: selectedEvaluation,
                                input: currentCalcInput,
                                asesorNombre: user?.nombre ?? 'Lucía Laje',
                              }),
                              'Fila TSV Kipintoch Copiada'
                            )
                          }
                          className="w-full text-xs border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                        >
                          {copiedAction === 'kipintoch-tsv' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          )}
                          <span>Copiar Fila TSV Kipintoch</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-2.5 text-slate-500">
                    <AlertTriangle className="h-9 w-9 mx-auto text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Ruta sin tarifa vigente cargada ({polUnlocode} → {podUnlocode})
                    </h3>
                    <p className="text-xs leading-relaxed">
                      No hay tarifas de contrato vigentes para este corredor en este momento.
                      Ingrese un neto Spot en cualquier naviera de la izquierda o copie el pedido Spot para enviar a sus agentes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'MESA_SPOT' ? (
          /* TAB 2: MESA SPOT / SOLICITUDES RFQ POR CORREDOR */
          <div className="space-y-5">
            {/* Corridor Intelligence & 1-Click RFQ Builder */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              <div className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Solicitud de Tarifas Spot ({polUnlocode} → {podUnlocode})
                      </h2>
                      <Badge className="bg-[#081433] text-sky-300 border-[#081433] text-[10px]">
                        {corridorRecommendation.corridorLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sugiere los canales habituales de ALMAR por ruta y registra la solicitud con un tiempo estimado de {corridorRecommendation.slaMinutes} min. Al recibir respuesta por correo, la tarifa se actualiza automáticamente.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-900">
                    SLA Objetivo: {corridorRecommendation.slaMinutes} min
                  </Badge>
                </div>

                {/* Recommended Channels Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {corridorRecommendation.primaryChannels.map((ch, idx) => (
                    <div
                      key={ch.agentName}
                      className={`rounded-lg border p-3 space-y-1.5 ${
                        idx === 0
                          ? 'border-sky-300 bg-sky-50/60'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{ch.agentName}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-white border-slate-300 text-slate-700"
                        >
                          {idx === 0 ? 'Canal #1 Sugerido' : ch.channelType === 'PORTAL_WEB_NAVIERA' ? 'Portal Instantáneo' : 'Alternativa'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{ch.specialtyNote}</p>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                        {ch.suggestedEmails.length > 0 ? (
                          <span className="text-[10px] font-mono text-slate-700 truncate">
                            {ch.suggestedEmails.join(', ')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Cotización web c/confirmación Gmail</span>
                        )}
                        {ch.portalUrl && (
                          <a
                            href={ch.portalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0072BC] hover:underline"
                          >
                            <span>Abrir Portal</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Route & Cargo Special Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">POL Origen</label>
                    <select
                      value={polUnlocode}
                      onChange={(e) => setPolUnlocode(e.target.value)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                    >
                      {GLOBAL_OCEAN_PORTS.map((p) => (
                        <option key={`spol-${p.unlocode}`} value={p.unlocode}>
                          {p.unlocode} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">POD Destino</label>
                    <select
                      value={podUnlocode}
                      onChange={(e) => setPodUnlocode(e.target.value)}
                      className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                    >
                      {GLOBAL_OCEAN_PORTS.map((p) => (
                        <option key={`spod-${p.unlocode}`} value={p.unlocode}>
                          {p.unlocode} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">
                      Cliente / Cuenta
                    </label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Ej. Secco / Liliana / Crucianelli"
                      className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">
                      Target Rate (USD/cntr opc.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={rfqTargetRateUsd}
                      onChange={(e) => setRfqTargetRateUsd(e.target.value)}
                      placeholder="Ej. 3200"
                      className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs tabular-nums"
                    />
                  </div>
                </div>

                {/* Checkboxes IMO / Reefer + Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-5 flex flex-wrap items-center gap-3">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rfqIsImoDg}
                        onChange={(e) => setRfqIsImoDg(e.target.checked)}
                      />
                      <span>Carga IMO / Peligrosa</span>
                    </label>
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rfqIsReeferOrOog}
                        onChange={(e) => setRfqIsReeferOrOog(e.target.checked)}
                      />
                      <span>Reefer / OOG</span>
                    </label>
                  </div>
                  {rfqIsImoDg && (
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Clase IMO / UN (ej. Class 3 UN1263)"
                        value={rfqImoClassUn}
                        onChange={(e) => setRfqImoClassUn(e.target.value)}
                        className="h-8 w-full rounded border border-amber-300 bg-amber-50/40 px-2 text-xs"
                      />
                    </div>
                  )}
                  <div className={rfqIsImoDg ? 'sm:col-span-4' : 'sm:col-span-7'}>
                    <input
                      type="text"
                      placeholder="Notas de mercadería, readiness date o free time requerido..."
                      value={rfqCargoNotes}
                      onChange={(e) => setRfqCargoNotes(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 px-2 text-xs"
                    />
                  </div>
                </div>

                {/* Target Carriers Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-700 uppercase">
                      Navieras Solicitadas en el Pedido Spot
                    </span>
                    {spotNeededCarriers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setRfqCarriers(spotNeededCarriers)}
                        className="text-[10px] font-semibold text-[#0072BC] hover:underline cursor-pointer"
                      >
                        Seleccionar todas las sin tarifa ({spotNeededCarriers.length})
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CARRIER_CODES.map((code) => {
                      const active = rfqCarriers.includes(code);
                      return (
                        <button
                          key={`rfqc-${code}`}
                          type="button"
                          onClick={() => handleToggleRfqCarrier(code)}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#081433] text-white border-[#081433]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {CARRIER_PROFILES[code].scac} · {code.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Live RFQ Email Preview & 1-Click Dispatch */}
              <div className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Borrador RFQ Listo para Agente / Pricing
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-800">
                    Formato Listo para Enviar
                  </Badge>
                </div>
                <pre className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto leading-relaxed">
                  {liveRfqDraftPreview}
                </pre>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    disabled={isCreatingRfq}
                    onClick={() => void handleCreateSpotRfqTicket()}
                    className="w-full text-xs bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Registrar Ticket Spot RFQ</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard('rfq-preview', liveRfqDraftPreview, 'Pedido Spot Copiado')
                    }
                    className="w-full text-xs border-slate-300 text-slate-800 hover:bg-slate-50 gap-1.5 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Borrador RFQ</span>
                  </Button>
                </div>
                <a
                  href={buildGmailWebComposeUrl({
                    toEmails:
                      corridorRecommendation.primaryChannels[0]?.suggestedEmails.length
                        ? corridorRecommendation.primaryChannels[0].suggestedEmails
                        : corridorRecommendation.internalPricingEmails,
                    draftWithSubject: liveRfqDraftPreview,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Abrir Redacción Pre-Cargada en Gmail Web</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Active & Historical Spot RFQ Tickets Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bandeja de Solicitudes Spot &amp; Activación 1-Clic ({spotRfqTickets.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Al cargar una respuesta Spot aquí (o cuando ingresa por Gmail con el código SPOT-YYYY-XXXX), la tarifa queda activa inmediatamente para todo el equipo.
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                  {openSpotRfqsCount} abierta(s)
                </Badge>
              </div>

              {spotRfqTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No hay solicitudes Spot registradas todavía. Cree un ticket arriba o desde cualquier naviera sin tarifa en el Comparador.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {pagedRfqTickets.map((t) => {
                    const isOpen =
                      t.status === 'PENDIENTE_PRICING' || t.status === 'EN_GESTION_AGENTE';
                    const isResolvingThis = resolvingTicketId === t.id;
                    const equipStr = t.containerLines
                      .map((l) => `${l.qty}× ${l.equipment}`)
                      .join(' + ');

                    return (
                      <div key={t.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#081433] text-sky-300">
                                {t.ticketNumber}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {t.polUnlocode} → {t.podUnlocode} ({t.incoterm})
                              </span>
                              <Badge variant="outline" className="text-[10px] border-slate-300">
                                {equipStr}
                              </Badge>
                              {t.isImoDg && (
                                <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-[10px]">
                                  IMO / DG {t.imoClassUn ?? ''}
                                </Badge>
                              )}
                              <Badge
                                className={
                                  t.status === 'RESPONDIDA'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                                    : t.status === 'EN_GESTION_AGENTE'
                                      ? 'bg-sky-100 text-sky-900 border-sky-300 text-[10px]'
                                      : t.status === 'DESCARTADA'
                                        ? 'bg-slate-100 text-slate-600 border-slate-300 text-[10px]'
                                        : 'bg-amber-100 text-amber-900 border-amber-300 text-[10px]'
                                }
                              >
                                {t.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>

                            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span>
                                Cliente: <strong>{t.clienteNombre}</strong>
                              </span>
                              <span>•</span>
                              <span>Canal: {t.recommendedAgents[0] ?? t.corridorLabel}</span>
                              <span>•</span>
                              <span>Solicitó: {t.requestedBy}</span>
                              {t.targetRateUsd && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-800 font-semibold">
                                    Target: USD {t.targetRateUsd.toLocaleString('es-AR')}
                                  </span>
                                </>
                              )}
                            </div>

                            {t.status === 'RESPONDIDA' && t.resolvedCarrier && (
                              <div className="text-[11px] font-semibold text-emerald-800">
                                Confirmado: {CARRIER_PROFILES[t.resolvedCarrier]?.displayName} (
                                {t.resolvedAgentOrSource}) · Vigente hasta {t.resolvedValidTo} · Ref.{' '}
                                {t.resolvedSpotRef}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  `rfq-${t.id}`,
                                  t.inquiryDraftText,
                                  `Mail ${t.ticketNumber} Copiado`
                                )
                              }
                              className="h-7 px-2.5 text-[11px] border-slate-300 cursor-pointer"
                            >
                              Copiar Mail
                            </Button>

                            {isOpen ? (
                              <>
                                {t.status === 'PENDIENTE_PRICING' && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      void handleUpdateRfqStatus(t.id, 'EN_GESTION_AGENTE')
                                    }
                                    className="h-7 px-2.5 text-[11px] border-sky-300 text-sky-900 bg-sky-50 hover:bg-sky-100 cursor-pointer"
                                  >
                                    Marcar Enviado
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    isResolvingThis
                                      ? setResolvingTicketId(null)
                                      : handleStartResolveTicket(t)
                                  }
                                  className="h-7 px-2.5 text-[11px] bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold cursor-pointer"
                                >
                                  {isResolvingThis ? 'Cancelar' : 'Cargar Respuesta Spot'}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdateRfqStatus(t.id, 'DESCARTADA')}
                                  className="text-[11px] text-slate-400 hover:text-rose-600 px-1.5 cursor-pointer"
                                >
                                  Descartar
                                </button>
                              </>
                            ) : (
                              t.status === 'RESPONDIDA' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    setPolUnlocode(t.polUnlocode);
                                    setPodUnlocode(t.podUnlocode);
                                    setContainerLines(t.containerLines);
                                    if (t.resolvedCarrier) setSelectedCarrier(t.resolvedCarrier);
                                    setActiveTab('COMPARADOR');
                                  }}
                                  className="h-7 px-2.5 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                                >
                                  Abrir en Comparador
                                </Button>
                              )
                            )}
                          </div>
                        </div>

                        {isResolvingThis && (
                          <div className="rounded-lg border border-sky-300 bg-sky-50/70 p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-700 block">
                                Naviera Confirmada
                              </label>
                              <select
                                value={resolveCarrier}
                                onChange={(e) => setResolveCarrier(e.target.value as CarrierCode)}
                                className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                              >
                                {ALL_CARRIER_CODES.map((c) => (
                                  <option key={`rc-${c}`} value={c}>
                                    {CARRIER_PROFILES[c].displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-700 block">
                                Agente / Portal
                              </label>
                              <input
                                type="text"
                                value={resolveAgent}
                                onChange={(e) => setResolveAgent(e.target.value)}
                                className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                              />
                            </div>
                            {t.containerLines.map((line) => (
                              <div key={`req-${t.id}-${line.equipment}`}>
                                <label className="text-[10px] font-semibold text-slate-700 block">
                                  Neto {line.equipment} (USD)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  placeholder="USD"
                                  value={resolveRates[line.equipment] ?? ''}
                                  onChange={(e) =>
                                    setResolveRates((prev) => ({
                                      ...prev,
                                      [line.equipment]: e.target.value,
                                    }))
                                  }
                                  className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs tabular-nums"
                                />
                              </div>
                            ))}
                            <div>
                              <label className="text-[10px] font-semibold text-slate-700 block">
                                Vigencia / Ref.
                              </label>
                              <div className="mt-1 flex gap-1">
                                <select
                                  value={resolveValidDays}
                                  onChange={(e) =>
                                    setResolveValidDays(Number(e.target.value) === 14 ? 14 : 7)
                                  }
                                  className="h-8 w-16 rounded border border-slate-300 bg-white px-1 text-xs"
                                >
                                  <option value={7}>7d</option>
                                  <option value={14}>14d</option>
                                </select>
                                <input
                                  type="text"
                                  value={resolveSpotRef}
                                  onChange={(e) => setResolveSpotRef(e.target.value)}
                                  placeholder="QQ-..."
                                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isResolvingRfq}
                                onClick={() => void handleSubmitResolveTicket(t)}
                                className="h-8 w-full text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                              >
                                Activar Spot
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <TablePagination
                currentPage={rfqPage}
                totalItems={spotRfqTickets.length}
                pageSize={rfqPageSize}
                pageSizeOptions={[5, 10, 25]}
                itemLabel="solicitudes Spot"
                onPageChange={setRfqPage}
                onPageSizeChange={setRfqPageSize}
                testId="multicotizador-spot-rfq-pagination"
              />
            </div>
          </div>
        ) : (
          /* TAB 3: MATRIZ DE TARIFARIOS SEMANALES & SPOTS COMPARTIDOS (CRUD) */
          <div className="space-y-5">
            {/* Quick Add / Update Form */}
            <form
              onSubmit={handleSaveNewTariffRow}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Cargar / Actualizar Ruta en Tarifario Semanal FCL
                  </h2>
                  <p className="text-xs text-slate-500">
                    Toda tarifa requiere vigencia explícita (Desde / Hasta). Al vencer, el motor bloquea su emisión automática hasta renovarla.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-sky-300 text-sky-900 bg-sky-50">
                  Control de Vigencias
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Naviera</label>
                  <select
                    value={newTariffCarrier}
                    onChange={(e) => setNewTariffCarrier(e.target.value as CarrierCode)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                  >
                    {ALL_CARRIER_CODES.map((c) => (
                      <option key={c} value={c}>
                        {CARRIER_PROFILES[c].displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Agente / Contrato</label>
                  <input
                    type="text"
                    required
                    value={newTariffAgent}
                    onChange={(e) => setNewTariffAgent(e.target.value)}
                    placeholder="Eversail / Newage / Directo"
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">POL (Origen)</label>
                  <select
                    value={newTariffPol}
                    onChange={(e) => setNewTariffPol(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                  >
                    {GLOBAL_OCEAN_PORTS.map((p) => (
                      <option key={`tpol-${p.unlocode}`} value={p.unlocode}>
                        {p.unlocode} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">POD (Base)</label>
                  <select
                    value={newTariffPod}
                    onChange={(e) => setNewTariffPod(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                  >
                    {GLOBAL_OCEAN_PORTS.map((p) => (
                      <option key={`tpod-${p.unlocode}`} value={p.unlocode}>
                        {p.unlocode} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Vigencia Desde</label>
                  <input
                    type="date"
                    required
                    value={newTariffValidFrom}
                    onChange={(e) => setNewTariffValidFrom(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Vigencia Hasta</label>
                  <input
                    type="date"
                    required
                    value={newTariffValidTo}
                    onChange={(e) => setNewTariffValidTo(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Neto 20&apos;GP (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={newTariff20Gp}
                    onChange={(e) => setNewTariff20Gp(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Neto 40&apos;STD (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={newTariff40Std}
                    onChange={(e) => setNewTariff40Std(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Neto 40&apos;HC (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={newTariff40Hc}
                    onChange={(e) => setNewTariff40Hc(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Free Time (días)</label>
                  <input
                    type="number"
                    min={3}
                    max={45}
                    value={newTariffFreeDays}
                    onChange={(e) => setNewTariffFreeDays(Number(e.target.value) || 18)}
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block">Ref. Planilla</label>
                  <input
                    type="text"
                    value={newTariffRef}
                    onChange={(e) => setNewTariffRef(e.target.value)}
                    placeholder="W44-EVERSAIL"
                    className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] text-slate-700 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTariffRiverExt}
                      onChange={(e) => setNewTariffRiverExt(e.target.checked)}
                    />
                    <span>Ext. TPR</span>
                  </label>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingTariff}
                    className="h-8 text-xs bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Guardar</span>
                  </Button>
                </div>
              </div>
            </form>

            {/* Tariff Matrix Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Info className="h-4 w-4 text-[#0072BC]" />
                  <span>
                    Rutas cargadas: <strong>{tariffRows.length}</strong> · Además el motor consulta automáticamente las{' '}
                    <strong>{gmailFclCount}</strong> cotizaciones FCL activas de Gmail 24/7.
                  </span>
                </div>
                <input
                  type="search"
                  placeholder="Filtrar por puerto, naviera o agente..."
                  value={tariffSearch}
                  onChange={(e) => {
                    setTariffSearch(e.target.value);
                    setTariffPage(1);
                  }}
                  className="h-8 w-full sm:w-64 rounded-lg border border-slate-300 px-2.5 text-xs"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5">Naviera / Fuente</th>
                      <th className="px-3.5 py-2.5">Ruta</th>
                      <th className="px-3.5 py-2.5 text-right">20&apos;GP</th>
                      <th className="px-3.5 py-2.5 text-right">40&apos;STD</th>
                      <th className="px-3.5 py-2.5 text-right">40&apos;HC</th>
                      <th className="px-3.5 py-2.5 text-center">Free Time</th>
                      <th className="px-3.5 py-2.5">Vigencia</th>
                      <th className="px-3.5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pagedTariffRows.map((row) => {
                      const isExpired = row.validTo < todayYmd;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80">
                          <td className="px-3.5 py-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-900">
                                {CARRIER_PROFILES[row.carrier]?.displayName ?? row.carrier}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  row.entryKind === 'SPOT_CACHE'
                                    ? 'text-[9px] border-teal-400 bg-teal-50 text-teal-900'
                                    : 'text-[9px] border-slate-300 bg-slate-50 text-slate-600'
                                }
                              >
                                {row.entryKind === 'SPOT_CACHE' ? 'SPOT' : 'SEMANAL'}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {row.agentOrSource}
                              {row.contractOrSheetRef ? ` · ${row.contractOrSheetRef}` : ''}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800">
                            {row.polUnlocode} → {row.podUnlocode}
                            {row.allowsRiverExtensionToArros && row.podUnlocode === 'ARBUE' && (
                              <span className="block text-[10px] font-sans font-normal text-sky-700">
                                + Feeder ARROS habilitado
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right tabular-nums font-medium">
                            {row.ratesByEquipmentUsd['20GP']
                              ? `USD ${row.ratesByEquipmentUsd['20GP'].toLocaleString('es-AR')}`
                              : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right tabular-nums font-medium">
                            {row.ratesByEquipmentUsd['40STD']
                              ? `USD ${row.ratesByEquipmentUsd['40STD'].toLocaleString('es-AR')}`
                              : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right tabular-nums font-bold text-slate-900">
                            {row.ratesByEquipmentUsd['40HC']
                              ? `USD ${row.ratesByEquipmentUsd['40HC'].toLocaleString('es-AR')}`
                              : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center tabular-nums">
                            {row.freeDaysIncluded}d
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                className={
                                  isExpired
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 text-[10px]'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                                }
                              >
                                {isExpired ? 'VENCIDA' : 'VIGENTE'}
                              </Badge>
                              <span className="text-[11px] text-slate-600 tabular-nums">
                                hasta {row.validTo}
                              </span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleRenewTariff14Days(row)}
                                className="text-[11px] font-semibold text-[#0072BC] hover:underline cursor-pointer"
                              >
                                Renovar +14d
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteTariffRow(row.id)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                aria-label="Eliminar tarifa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={tariffPage}
                totalItems={filteredTariffRows.length}
                totalUnfilteredCount={tariffRows.length}
                pageSize={tariffPageSize}
                pageSizeOptions={[10, 25, 50]}
                itemLabel="tarifas"
                onPageChange={setTariffPage}
                onPageSizeChange={setTariffPageSize}
                testId="multicotizador-tarifarios-pagination"
              />
            </div>
          </div>
        )}
      </div>
    </MulticotizadorGuard>
  );
}

export default function MulticotizadorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Cargando Multicotizador Marítimo FCL...
        </div>
      }
    >
      <MulticotizadorInnerWorkspace />
    </React.Suspense>
  );
}
