'use client';

import * as React from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Download,
  Users,
  Building2,
  DollarSign,
  FileText,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
  Inbox,
  RefreshCw,
  Mail,
  Send,
  AlertCircle,
  FolderCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { TablePagination } from '@/components/ui/TablePagination';
import { isFunctionalMailbox, isExcludedFromProductivityRanking } from '@/lib/mailboxes';
import type { CategoriaProveedorPA03 } from '@/types/domain';
import { getCategoriaProveedorLabel, getCategoriaProveedorBadgeClasses } from '@/lib/pa03';
import { getGuardiaMetrics } from '@/lib/guardia-metrics';
import type { Guardia1618Metrics } from '@/types/guardia';

// ============================================================================
// Types & API Contracts (Matching GET /api/metricas?periodo=...)
// ============================================================================

export type PeriodoMetricas = 'hoy' | '7d' | '30d' | '90d' | 'all';

export interface MetricasApiResponse {
  success: boolean;
  periodo: PeriodoMetricas;
  updatedAt: string;
  liveSummary?: {
    totalCarpetas: number;
    totalComprobantes: number;
    totalDocumentos: number;
    totalCotizaciones: number;
    comprobantesIngestadosGmail: number;
    documentosOperativosGmail: number;
    mailboxesSynced: number;
    updatedAt: string;
  };
  kpis: {
    // 1. Email Response SLA
    emailsRecibidos: number;
    emailsRespondidos: number;
    emailsPendientesRespuesta: number;
    tasaRespuestaPct: number;
    tiempoRespuestaPromedioMin: number;

    // 2. Ingested Invoices & Vouchers
    totalComprobantes: number;
    vinculadosCarpeta: number;
    huerfanosCola: number;
    totalFacturadoUsd: number;
    totalFacturadoArs: number;

    // 3. Digital Files & Folders
    totalCarpetas: number;
    totalDocumentosLegajo: number;
    totalCotizaciones: number;
    cotizacionesGanadas: number;

    // 4. Financial Reconciliation & Alerts
    margenEstimadoTotalUsd: number;
    sobrecostoPrevenidoUsd?: number;
    alertasActivasCount: number;
    alertasCriticasCount: number;
    carpetasConciliadasCount: number;

    // 5. AI Confidence & Direct Linking
    confianzaPromedioIaPct: number;
    tasaVinculacionDirectaPct: number;
  };
  operadores: Array<{
    email: string;
    nombre: string;
    rol: string;
    emailsRecibidos: number;
    emailsRespondidos: number;
    emailsPendientes: number;
    tasaRespuestaPct: number;
    tiempoRespuestaPromedioMin: number;
    carpetasAsignadas?: { count: number; codes: string[] };
    carpetasCount?: number;
    carpetasCodigos?: string[];
    comprobantesProcesados: number;
    documentosCatalogados: number;
    cotizacionesEmitidas: number;
    status: 'ACTIVE' | 'SYNCING' | 'ERROR' | 'WATCH_EXPIRED';
    lastSyncedAt: string | null;
  }>;
  casillasFuncionales?: Array<{
    email: string;
    nombre: string;
    rol: string;
    emailsRecibidos: number;
    comprobantesProcesados: number;
    documentosCatalogados: number;
    status: 'ACTIVE' | 'SYNCING' | 'ERROR' | 'WATCH_EXPIRED';
    lastSyncedAt: string | null;
  }>;
  proveedores: Array<{
    proveedor: string;
    cuit: string;
    categoria: CategoriaProveedorPA03;
    categoriaLabel?: string;
    facturasCount?: number;
    facturasAnalizadas?: number;
    facturasConCarpeta: number;
    facturasSinCarpeta: number;
    cumplimientoReferenciaPct?: number;
    desviosCount?: number;
    desviosTasa?: number;
    sobrecostoPrevenidoUsd?: number;
    totalFacturadoUsd: number;
    totalFacturadoArs: number;
    desvioCostoUsd?: number;
    estadoPa03: 'CONFORME' | 'OBSERVADO' | 'NO_CONFORME';
  }>;
  conciliacionCarpetas: Array<{
    carpetaId: string;
    carpetaCodigo: string;
    clienteNombre: string;
    operacion: string;
    moneda: string;
    ventaEstimadaTotal: number;
    costoEstimadoTotal: number;
    costoRealTotal: number;
    desvioCostoUsd: number;
    margenEstimadoUsd: number;
    rentabilidadPorcentaje: number;
    estadoConciliacion:
      | 'CONCILIADO_EXACTO'
      | 'CONCILIADO_CON_DESVIO'
      | 'PENDIENTE_FACTURACION'
      | 'BLOQUEADA_RENTABILIDAD_NEGATIVA';
    comprobantesCount: number;
    alertasCount: number;
    cierreContable: boolean;
    cierreOperativo: boolean;
  }>;
  alertasActivas: Array<{
    id: string;
    tipo: string;
    severidad: 'CRITICAL' | 'WARNING' | 'INFO';
    titulo: string;
    mensaje: string;
    carpetaId: string | null;
    carpetaCodigo: string | null;
    comprobanteId: string | null;
    comprobanteNumero: string | null;
    leida: boolean;
    resuelta: boolean;
    createdAt: string;
  }>;
  guardia1618: Guardia1618Metrics & {
    enVivo?: {
      emailsTotal: number;
      emailsRespondidos: number;
      emailsPendientes: number;
      tasaRespuestaPct: number;
      tiempoRespuestaPromedioMin: number;
    };
  };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatDuration(min?: number | null): string {
  if (min == null || isNaN(min) || min <= 0) return '0.0 min';
  if (min < 60) return `${min.toFixed(1)} min`;
  return `${(min / 60).toFixed(1)} hs`;
}

function formatUsd(amount?: number | null): string {
  return `USD ${(amount ?? 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatArs(amount?: number | null): string {
  return `ARS ${(amount ?? 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPct(val?: number | null): string {
  return `${(val ?? 0).toFixed(1)}%`;
}

function getInitials(name?: string): string {
  if (!name) return 'OP';
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const second = parts[1];
  if (parts.length >= 2 && first && second && first.length > 0 && second.length > 0) {
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'OP';
}

function getInitialFallbackMetrics(): MetricasApiResponse {
  const guardia = getGuardiaMetrics();
  return {
    success: true,
    periodo: 'all',
    updatedAt: new Date().toISOString(),
    kpis: {
      emailsRecibidos: 0,
      emailsRespondidos: 0,
      emailsPendientesRespuesta: 0,
      tasaRespuestaPct: 0,
      tiempoRespuestaPromedioMin: 0,
      totalComprobantes: 0,
      vinculadosCarpeta: 0,
      huerfanosCola: 0,
      totalFacturadoUsd: 0,
      totalFacturadoArs: 0,
      totalCarpetas: 0,
      totalDocumentosLegajo: 0,
      totalCotizaciones: 0,
      cotizacionesGanadas: 0,
      margenEstimadoTotalUsd: 0,
      sobrecostoPrevenidoUsd: 0,
      alertasActivasCount: 0,
      alertasCriticasCount: 0,
      carpetasConciliadasCount: 0,
      confianzaPromedioIaPct: 0,
      tasaVinculacionDirectaPct: 0,
    },
    operadores: [],
    proveedores: [],
    conciliacionCarpetas: [],
    alertasActivas: [],
    guardia1618: guardia,
    liveSummary: {
      totalCarpetas: 0,
      totalComprobantes: 0,
      totalDocumentos: 0,
      totalCotizaciones: 0,
      comprobantesIngestadosGmail: 0,
      documentosOperativosGmail: 0,
      mailboxesSynced: 0,
      updatedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Real Client-Side UTF-8 BOM CSV Export (5 Structured Sections)
// ============================================================================

export function exportMetricasAuditoriaCsv(
  data: MetricasApiResponse,
  periodo: PeriodoMetricas
): void {
  const lines: string[] = [];

  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Header Metadata
  lines.push(
    escape('ALMAR ROSARIO COMEX - INFORME CONSOLIDADO DE AUDITORIA OPERATIVA Y METRICAS EN VIVO')
  );
  lines.push([escape('Fecha de Generacion:'), escape(new Date().toISOString())].join(','));
  lines.push([escape('Periodo Seleccionado:'), escape(periodo)].join(','));
  lines.push([escape('Total Casillas Auditadas:'), escape(data.operadores.length)].join(','));
  lines.push(
    [
      escape('Total Carpetas Operativas:'),
      escape(data.liveSummary?.totalCarpetas ?? data.kpis.totalCarpetas),
    ].join(',')
  );
  lines.push(
    [
      escape('Total Comprobantes Ingeridos:'),
      escape(data.liveSummary?.totalComprobantes ?? data.kpis.totalComprobantes),
    ].join(',')
  );
  lines.push('');

  // SECCION 1: RESUMEN EJECUTIVO DE KPIS EN VIVO
  lines.push(escape('=== SECCION 1: RESUMEN EJECUTIVO DE KPIS EN VIVO ==='));
  lines.push([escape('Metrica'), escape('Valor'), escape('Detalle')].join(','));
  lines.push(
    [
      escape('Tasa de Respuesta Global'),
      escape(`${data.kpis.tasaRespuestaPct.toFixed(1)}%`),
      escape('Porcentaje de emails externos con respuesta emitida'),
    ].join(',')
  );
  lines.push(
    [
      escape('Emails Recibidos Totales'),
      escape(data.kpis.emailsRecibidos),
      escape('Trafico total ingerido en casillas autorizadas'),
    ].join(',')
  );
  lines.push(
    [
      escape('Emails Respondidos'),
      escape(data.kpis.emailsRespondidos),
      escape('Emails contestados por el equipo de ALMAR'),
    ].join(',')
  );
  lines.push(
    [
      escape('Emails Pendientes de Respuesta'),
      escape(data.kpis.emailsPendientesRespuesta),
      escape('Consultas activas sin responder'),
    ].join(',')
  );
  lines.push(
    [
      escape('Tiempo Promedio de Respuesta (SLA)'),
      escape(`${data.kpis.tiempoRespuestaPromedioMin.toFixed(1)} min`),
      escape('SLA objetivo < 15 minutos'),
    ].join(',')
  );
  lines.push(
    [
      escape('Comprobantes Totales Ingeridos'),
      escape(data.kpis.totalComprobantes),
      escape('Facturas cargadas e indexadas en el portal'),
    ].join(',')
  );
  lines.push(
    [
      escape('Comprobantes Vinculados a Carpeta'),
      escape(data.kpis.vinculadosCarpeta),
      escape('Asociados a expedientes de embarque'),
    ].join(',')
  );
  lines.push(
    [
      escape('Comprobantes Huerfanos en Cola'),
      escape(data.kpis.huerfanosCola),
      escape('Pendientes de asignacion de carpeta'),
    ].join(',')
  );
  lines.push(
    [
      escape('Monto Total Facturado (USD)'),
      escape(data.kpis.totalFacturadoUsd.toFixed(2)),
      escape('Total en moneda extranjera'),
    ].join(',')
  );
  lines.push(
    [
      escape('Monto Total Facturado (ARS)'),
      escape(data.kpis.totalFacturadoArs.toFixed(2)),
      escape('Total en moneda nacional'),
    ].join(',')
  );
  const sobrecostoCalculado =
    data.kpis.sobrecostoPrevenidoUsd ??
    data.proveedores.reduce((acc, p) => acc + (p.desvioCostoUsd || 0), 0);
  lines.push(
    [
      escape('Sobrecostos Prevenidos (USD)'),
      escape(sobrecostoCalculado.toFixed(2)),
      escape('Desvios retenidos por supervision antes del pago'),
    ].join(',')
  );
  lines.push(
    [
      escape('Margen Operativo Estimado (USD)'),
      escape(data.kpis.margenEstimadoTotalUsd.toFixed(2)),
      escape('Resultado financiero proyectado'),
    ].join(',')
  );
  lines.push(
    [
      escape('Alertas Activas Totales'),
      escape(data.kpis.alertasActivasCount),
      escape('Alertas abiertas en monitoreo'),
    ].join(',')
  );
  lines.push(
    [
      escape('Alertas Criticas de Rentabilidad'),
      escape(data.kpis.alertasCriticasCount),
      escape('Expedientes con margen negativo'),
    ].join(',')
  );
  lines.push(
    [
      escape('Precision Fiscal AFIP (Modulo 11)'),
      escape(`${data.kpis.confianzaPromedioIaPct.toFixed(1)}%`),
      escape('Verificacion de CUITs y consistencia tributaria'),
    ].join(',')
  );
  lines.push('');

  // SECCION 2: RENDIMIENTO Y PRODUCTIVIDAD POR COLABORADOR (12 COLABORADORES ACTIVOS)
  const humanOpsCsv = data.operadores.filter(
    (op) =>
      !isExcludedFromProductivityRanking(op.email, op.rol) &&
      !isFunctionalMailbox(op.email, op.nombre)
  );
  lines.push(
    escape('=== SECCION 2: RENDIMIENTO Y PRODUCTIVIDAD POR COLABORADOR (12 PERSONAS ACTIVAS) ===')
  );
  lines.push(
    [
      escape('Email'),
      escape('Nombre'),
      escape('Rol / Area'),
      escape('Emails Recibidos'),
      escape('Emails Respondidos'),
      escape('Emails Pendientes'),
      escape('Tasa Respuesta %'),
      escape('Tiempo Medio (min)'),
      escape('Carpetas Asignadas'),
      escape('Comprobantes Procesados'),
      escape('Documentos Catalogados'),
      escape('Estado Casilla'),
      escape('Ultimo Sync'),
    ].join(',')
  );

  for (const op of humanOpsCsv) {
    lines.push(
      [
        escape(op.email),
        escape(op.nombre),
        escape(op.rol),
        escape(op.emailsRecibidos),
        escape(op.emailsRespondidos),
        escape(op.emailsPendientes),
        escape(`${op.tasaRespuestaPct.toFixed(1)}%`),
        escape(op.tiempoRespuestaPromedioMin.toFixed(1)),
        escape(op.carpetasAsignadas?.count ?? op.carpetasCount ?? 0),
        escape(op.comprobantesProcesados),
        escape(op.documentosCatalogados),
        escape(op.status),
        escape(op.lastSyncedAt || 'N/A'),
      ].join(',')
    );
  }
  lines.push('');

  // SECCION 3: EVALUACION CONTINUA DE PROVEEDORES (PROCEDIMIENTO PA.03-R.02)
  lines.push(
    escape('=== SECCION 3: EVALUACION CONTINUA DE PROVEEDORES (PROCEDIMIENTO PA.03-R.02) ===')
  );
  lines.push(
    [
      escape('Proveedor / Razon Social'),
      escape('CUIT'),
      escape('Categoria PA.03'),
      escape('Facturas Analizadas'),
      escape('Facturas Con Carpeta'),
      escape('Facturas Sin Carpeta'),
      escape('Desvios Detectados'),
      escape('Tasa Desvio %'),
      escape('Sobrecosto Prevenido (USD)'),
      escape('Total Facturado (USD)'),
      escape('Total Facturado (ARS)'),
      escape('Calificacion Calidad'),
    ].join(',')
  );

  for (const sup of data.proveedores) {
    const totalFacturas = sup.facturasCount ?? sup.facturasAnalizadas ?? 0;
    const desvios = sup.desviosCount ?? 0;
    const tasa =
      sup.desviosTasa ?? (totalFacturas > 0 ? (desvios / totalFacturas) * 100 : 0);
    const sobrecosto = sup.desvioCostoUsd ?? sup.sobrecostoPrevenidoUsd ?? 0;
    lines.push(
      [
        escape(sup.proveedor),
        escape(sup.cuit),
        escape(sup.categoriaLabel || getCategoriaProveedorLabel(sup.categoria)),
        escape(totalFacturas),
        escape(sup.facturasConCarpeta),
        escape(sup.facturasSinCarpeta),
        escape(desvios),
        escape(`${tasa.toFixed(1)}%`),
        escape(sobrecosto.toFixed(2)),
        escape(sup.totalFacturadoUsd.toFixed(2)),
        escape(sup.totalFacturadoArs.toFixed(2)),
        escape(sup.estadoPa03),
      ].join(',')
    );
  }
  lines.push('');

  // SECCION 4: CONCILIACION FINANCIERA DE CARPETAS Y ALERTAS ACTIVAS
  lines.push(escape('=== SECCION 4: CONCILIACION FINANCIERA DE CARPETAS Y ALERTAS ACTIVAS ==='));
  lines.push(
    [
      escape('Carpeta Codigo'),
      escape('Cliente'),
      escape('Modalidad'),
      escape('Costo Estimado (USD)'),
      escape('Costo Real (USD)'),
      escape('Desvio (USD)'),
      escape('Margen Estimado (USD)'),
      escape('Estado Operativo'),
      escape('Alertas Activas'),
      escape('Alerta Critica'),
    ].join(',')
  );

  for (const carp of data.conciliacionCarpetas) {
    lines.push(
      [
        escape(carp.carpetaCodigo),
        escape(carp.clienteNombre),
        escape(carp.operacion),
        escape(carp.costoEstimadoTotal.toFixed(2)),
        escape(carp.costoRealTotal.toFixed(2)),
        escape(carp.desvioCostoUsd.toFixed(2)),
        escape(carp.margenEstimadoUsd.toFixed(2)),
        escape(carp.estadoConciliacion),
        escape(carp.alertasCount),
        escape(carp.estadoConciliacion === 'BLOQUEADA_RENTABILIDAD_NEGATIVA' ? 'SI' : 'NO'),
      ].join(',')
    );
  }
  lines.push('');

  // SECCION 5: ANALISIS DE GUARDIA OPERATIVA (16:00 A 18:00 HS)
  lines.push(escape('=== SECCION 5: ANALISIS DE GUARDIA OPERATIVA (16:00 A 18:00 HS) ==='));
  lines.push([escape('Parametro'), escape('Valor'), escape('Descripcion')].join(','));
  const g = data.guardia1618.analisisFranjaGuardia_16_18;
  lines.push(
    [
      escape('Volumen Total en Franja Guardia'),
      escape(g.volumenTotal),
      escape('Correos auditados entre 16:00 y 18:00 hs'),
    ].join(',')
  );
  lines.push(
    [
      escape('Promedio Diario en Guardia'),
      escape(g.promedioDiarioTotal),
      escape('Correos promedio por dia habil'),
    ].join(',')
  );
  lines.push(
    [
      escape('Porcentaje del Trafico Diario'),
      escape(`${g.porcentajeDelDia}%`),
      escape('Representacion sobre las 24 horas del dia'),
    ].join(',')
  );
  lines.push(
    [
      escape('Porcentaje Correos Humanos Activos'),
      escape(`${g.clasificacionTipoCorreo.humanosOperativos.porcentaje}%`),
      escape('Correos que requieren decision y gestion operativa'),
    ].join(',')
  );
  lines.push(
    [
      escape('Porcentaje Notificaciones Automaticas'),
      escape(`${g.clasificacionTipoCorreo.notificacionesAutomaticas.porcentaje}%`),
      escape('Avisos de navieras y tracking automatico'),
    ].join(',')
  );
  lines.push(
    [
      escape('Porcentaje Facturacion y Pagos'),
      escape(`${g.clasificacionTipoCorreo.administrativosFacturacion.porcentaje}%`),
      escape('Comprobantes y transferencias de liberacion'),
    ].join(',')
  );
  lines.push(
    [
      escape('Operaciones y Trafico (correos)'),
      escape(g.desglosePorArea.operaciones_trafico.total),
      escape(`${g.desglosePorArea.operaciones_trafico.porcentaje}% del trafico de guardia`),
    ].join(',')
  );
  lines.push(
    [
      escape('Comercial y Pricing (correos)'),
      escape(g.desglosePorArea.comercial_pricing.total),
      escape(`${g.desglosePorArea.comercial_pricing.porcentaje}% del trafico de guardia`),
    ].join(',')
  );
  lines.push(
    [
      escape('Administracion y Finanzas (correos)'),
      escape(g.desglosePorArea.administracion_finanzas.total),
      escape(`${g.desglosePorArea.administracion_finanzas.porcentaje}% del trafico de guardia`),
    ].join(',')
  );
  lines.push(
    [
      escape('Dictamen Pericial Directivo'),
      escape('JUSTIFICADA'),
      escape(
        'Guardia de 1 persona 100% justificada para evitar demoras navieras (USD 150-300/dia)'
      ),
    ].join(',')
  );

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `auditoria_metricas_almar_${periodo}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Main MetricasView Component
// ============================================================================

export function MetricasView() {
  const [periodo, setPeriodo] = React.useState<PeriodoMetricas>('all');
  const [metrics, setMetrics] = React.useState<MetricasApiResponse>(() =>
    getInitialFallbackMetrics()
  );
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [syncingMailboxes, setSyncingMailboxes] = React.useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = React.useState<boolean>(false);
  const [timeAgo, setTimeAgo] = React.useState<string>('hace instantes');

  // Pagination state for all 3 multi-row sections
  const [opsPage, setOpsPage] = React.useState<number>(1);
  const [opsPageSize, setOpsPageSize] = React.useState<number>(12);
  const [supPage, setSupPage] = React.useState<number>(1);
  const [supPageSize, setSupPageSize] = React.useState<number>(10);
  const [concPage, setConcPage] = React.useState<number>(1);
  const [concPageSize, setConcPageSize] = React.useState<number>(6);

  React.useEffect(() => {
    setOpsPage(1);
    setSupPage(1);
    setConcPage(1);
  }, [periodo]);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const { toast } = useToast();

  // 1. Fetch Metrics Handler
  const fetchMetricas = React.useCallback(
    async (targetPeriodo: PeriodoMetricas, isBackground = false) => {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;

      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(`/api/metricas?periodo=${targetPeriodo}`, {
          signal: ac.signal,
          headers: { credentials: 'omit', Accept: 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: MetricasApiResponse = await res.json();
        if (json && json.success) {
          setMetrics(json);
          setLastRefreshedAt(new Date());
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('[MetricasView] Error fetching metrics:', err);
        }
      } finally {
        if (isBackground) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  // 2. Lifecycle: Initial Fetch, 30s Polling, and Event Listener
  React.useEffect(() => {
    fetchMetricas(periodo, false);

    // Auto-polling interval every 30 seconds
    const intervalId = setInterval(() => {
      fetchMetricas(periodo, true);
    }, 30000);

    // Cross-component listener
    const handleSyncComplete = () => {
      fetchMetricas(periodo, true);
    };
    window.addEventListener('almar:sync-complete', handleSyncComplete);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('almar:sync-complete', handleSyncComplete);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [periodo, fetchMetricas]);

  // 3. Relative TimeAgo Ticker
  React.useEffect(() => {
    const updateAgo = () => {
      if (!lastRefreshedAt) {
        setTimeAgo('hace instantes');
        return;
      }
      const diffSec = Math.floor((Date.now() - lastRefreshedAt.getTime()) / 1000);
      if (diffSec < 10) setTimeAgo('hace instantes');
      else if (diffSec < 60) setTimeAgo(`hace ${diffSec}s`);
      else {
        const diffMin = Math.floor(diffSec / 60);
        setTimeAgo(`hace ${diffMin}m`);
      }
    };
    updateAgo();
    const tId = setInterval(updateAgo, 5000);
    return () => clearInterval(tId);
  }, [lastRefreshedAt]);

  // 4. Manual "Sincronizar Casillas en Vivo"
  const handleSyncMailboxes = async () => {
    if (syncingMailboxes) return;
    setSyncingMailboxes(true);
    toast.info(
      'Sincronización en curso',
      'Consultando las 18 casillas autorizadas de ALMAR Rosario...'
    );

    try {
      const res = await fetch('/api/ingestion/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxMessagesPerMailbox: 25,
          syncThreads: true,
          includeCommercialQuotes: true,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success(
          'Sincronización Completada',
          'Las 18 casillas fueron sincronizadas y las métricas han sido actualizadas.'
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('almar:sync-complete'));
        }
        await fetchMetricas(periodo, false);
      } else {
        toast.error('Error de Sincronización', json?.error || 'No se pudo sincronizar');
      }
    } catch (err: unknown) {
      toast.error(
        'Error de Red',
        err instanceof Error ? err.message : 'Error al conectar con la API de sincronización'
      );
    } finally {
      setSyncingMailboxes(false);
    }
  };

  // 5. CSV Export Handler
  const handleExportCsv = () => {
    exportMetricasAuditoriaCsv(metrics, periodo);
    toast.success(
      'Exportación Generada',
      'El reporte consolidado de Rendimiento & Auditoría Operativa fue descargado exitosamente en CSV (UTF-8 BOM).'
    );
  };

  // 6. WhatsApp Copy Handler
  const guardiaMetrics = metrics.guardia1618;
  const handleCopyWhatsapp = () => {
    const text =
      guardiaMetrics?.dictamenGuardia?.mensajeWhatsappGisel ||
      guardiaMetrics?.dictamenGuardia?.mensaje_whatsapp_gisel ||
      '';
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedWhatsapp(true);
      toast.success(
        'Mensaje Copiado',
        'Mensaje para Gisel Cabana Diaz copiado al portapapeles listo para enviar por WhatsApp.'
      );
      setTimeout(() => setCopiedWhatsapp(false), 3000);
    }
  };

  const kpis = metrics.kpis;
  const totalSobrecostoPrevenido =
    kpis.sobrecostoPrevenidoUsd ??
    metrics.proveedores.reduce((acc, p) => acc + (p.desvioCostoUsd || 0), 0);

  // Strictly active operational collaborators (exclude shared functional mailboxes, Directorio & inactive accounts)
  const humanOperadores = React.useMemo(
    () =>
      metrics.operadores.filter(
        (op) =>
          !isExcludedFromProductivityRanking(op.email, op.rol) &&
          !isFunctionalMailbox(op.email, op.nombre)
      ),
    [metrics.operadores]
  );

  const paginatedOperadores = React.useMemo(() => {
    const start = (opsPage - 1) * opsPageSize;
    return humanOperadores.slice(start, start + opsPageSize);
  }, [humanOperadores, opsPage, opsPageSize]);

  const paginatedProveedores = React.useMemo(() => {
    const start = (supPage - 1) * supPageSize;
    return metrics.proveedores.slice(start, start + supPageSize);
  }, [metrics.proveedores, supPage, supPageSize]);

  const paginatedConciliacion = React.useMemo(() => {
    const start = (concPage - 1) * concPageSize;
    return metrics.conciliacionCarpetas.slice(start, start + concPageSize);
  }, [metrics.conciliacionCarpetas, concPage, concPageSize]);

  // Dynamic SLA Distribution based strictly on human collaborators' average response time
  const totalOps = humanOperadores.length;
  const opsUnder15 = humanOperadores.filter((o) => o.tiempoRespuestaPromedioMin <= 15).length;
  const ops15to60 = humanOperadores.filter(
    (o) => o.tiempoRespuestaPromedioMin > 15 && o.tiempoRespuestaPromedioMin <= 60
  ).length;
  const ops1to4h = humanOperadores.filter(
    (o) => o.tiempoRespuestaPromedioMin > 60 && o.tiempoRespuestaPromedioMin <= 240
  ).length;
  const opsOver4h = humanOperadores.filter((o) => o.tiempoRespuestaPromedioMin > 240).length;

  const pctUnder15 = totalOps > 0 ? (opsUnder15 / totalOps) * 100 : 0;
  const pct15to60 = totalOps > 0 ? (ops15to60 / totalOps) * 100 : 0;
  const pct1to4h = totalOps > 0 ? (ops1to4h / totalOps) * 100 : 0;
  const pctOver4h = totalOps > 0 ? (opsOver4h / totalOps) * 100 : 0;

  // Dynamic PEF Profitability & Client Concentration Benchmark (Informe Laura Berti)
  const pefBenchmark = React.useMemo(() => {
    const folders = metrics.conciliacionCarpetas;
    const impoMarAir = folders.filter(
      (f) =>
        f.operacion.toUpperCase().includes('IMPORTACION') &&
        !f.operacion.toUpperCase().includes('TERRESTRE')
    );
    const impoTerr = folders.filter(
      (f) =>
        f.operacion.toUpperCase().includes('IMPORTACION') &&
        f.operacion.toUpperCase().includes('TERRESTRE')
    );
    const expoAll = folders.filter((f) => f.operacion.toUpperCase().includes('EXPORTACION'));

    const calcWeightedMarginPct = (list: typeof folders, fallbackPct: number) => {
      const totalVenta = list.reduce((s, f) => s + (f.ventaEstimadaTotal || 0), 0);
      const totalMargen = list.reduce((s, f) => s + (f.margenEstimadoUsd || 0), 0);
      if (totalVenta <= 0) return fallbackPct;
      return Number(((totalMargen / totalVenta) * 100).toFixed(1));
    };

    const seccoFolders = folders.filter((f) =>
      f.clienteNombre.toUpperCase().includes('SECCO')
    );
    const seccoCount = seccoFolders.length;
    const totalCount = Math.max(1, folders.length);
    const seccoSharePct = Number(((seccoCount / totalCount) * 100).toFixed(1));

    return {
      impoMarAirCount: impoMarAir.length,
      impoMarAirMarginPct: calcWeightedMarginPct(impoMarAir, 33.0),
      impoTerrCount: impoTerr.length,
      impoTerrMarginPct: calcWeightedMarginPct(impoTerr, 27.0),
      expoCount: expoAll.length,
      expoMarginPct: calcWeightedMarginPct(expoAll, 19.0),
      seccoCount,
      seccoSharePct,
    };
  }, [metrics.conciliacionCarpetas]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div
        id="metricas-header"
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-lg bg-sky-50 text-[#0072BC] border border-sky-200">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tablero de Rendimiento &amp; Productividad Operativa
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                En Vivo:{' '}
                {metrics.liveSummary?.totalCarpetas ?? kpis.totalCarpetas} carpetas •{' '}
                {metrics.liveSummary?.totalComprobantes ?? kpis.totalComprobantes} comprobantes •{' '}
                {humanOperadores.length} colaboradores ({timeAgo})
              </span>
              {refreshing && <RefreshCw className="h-3 w-3 text-emerald-600 animate-spin ml-1" />}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Métricas en tiempo real de tiempos de respuesta, volumen por operador, control de costos y desempeño de proveedores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPeriodo('hoy')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                periodo === 'hoy'
                  ? 'bg-white text-[#0072BC] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('7d')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                periodo === '7d'
                  ? 'bg-white text-[#0072BC] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('30d')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                periodo === '30d'
                  ? 'bg-white text-[#0072BC] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('90d')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                periodo === '90d'
                  ? 'bg-white text-[#0072BC] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                periodo === 'all'
                  ? 'bg-white text-[#0072BC] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico Total
            </button>
          </div>

          {/* Sincronizar Casillas en Vivo */}
          <button
            type="button"
            onClick={handleSyncMailboxes}
            disabled={syncingMailboxes}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              syncingMailboxes
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
            title="Sincronizar las 18 casillas autorizadas de ALMAR Rosario vía Gmail API"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingMailboxes ? 'animate-spin text-[#0072BC]' : 'text-slate-600'}`} />
            <span>{syncingMailboxes ? 'Sincronizando 18 Casillas...' : 'Sincronizar Casillas en Vivo'}</span>
          </button>

          {/* Exportar Informe de Auditoría */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-[#0072BC] hover:bg-[#005a96] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Informe de Auditoría</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Highlight Cards */}
      <div id="metricas-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Emails Respondidos & SLA de Respuesta */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center" />
          )}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Emails Respondidos &amp; SLA</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0072BC] border border-sky-200">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatPct(kpis.tasaRespuestaPct)}
            </span>
            <span className="text-xs font-bold text-emerald-700 flex items-center">
              <Check className="h-3.5 w-3.5 mr-0.5" />
              {kpis.emailsRespondidos} de {kpis.emailsRecibidos}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              SLA: <strong className="text-slate-800 font-mono">{formatDuration(kpis.tiempoRespuestaPromedioMin)}</strong> (Meta: &lt; 15 min)
            </span>
            {kpis.emailsPendientesRespuesta > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {kpis.emailsPendientesRespuesta} pendientes
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Al día
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Total Volume Processed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center" />
          )}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Comprobantes Procesados</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0072BC] border border-sky-200">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpis.totalComprobantes}
            </span>
            <span className="text-xs font-bold text-[#0072BC] flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-0.5" />
              {kpis.vinculadosCarpeta} con carpeta
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 truncate" title={`${formatUsd(kpis.totalFacturadoUsd)} • ${formatArs(kpis.totalFacturadoArs)}`}>
            {formatUsd(kpis.totalFacturadoUsd)} • {formatArs(kpis.totalFacturadoArs)} ({kpis.huerfanosCola} en cola)
          </div>
        </div>

        {/* KPI 3: Prevented Cost Overruns */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center" />
          )}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Sobrecostos Prevenidos</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {formatUsd(totalSobrecostoPrevenido)}
            </span>
            <span className="text-xs font-bold text-amber-800">
              {kpis.alertasActivasCount} Alertas
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500">
            {kpis.carpetasConciliadasCount} carpetas conciliadas • Margen: {formatUsd(kpis.margenEstimadoTotalUsd)}
          </div>
        </div>

        {/* KPI 4: Tax Accuracy Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center" />
          )}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Precisión Fiscal AFIP</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700 font-mono">
              {formatPct(kpis.confianzaPromedioIaPct)}
            </span>
            <span className="text-xs font-bold text-indigo-700">
              Módulo 11
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 truncate">
            {kpis.totalDocumentosLegajo} docs legajo • {formatPct(kpis.tasaVinculacionDirectaPct)} vinculación directa
          </div>
        </div>
      </div>

      {/* Section: Guardia Operativa 16:00 a 18:00 hs Analysis */}
      <div id="metricas-guardia-16-18" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Análisis de Carga Horaria &amp; Guardia Operativa (16:00 a 18:00 hs)
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Franja Crítica
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  UTC-3 (Argentina)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Auditoría empírica sobre 18 casillas autorizadas de ALMAR Rosario ({guardiaMetrics.metadata.totalCorreosAnalizados.toLocaleString('es-AR')} correos analizados en {guardiaMetrics.metadata.totalDiasHabiles} días hábiles en modo solo lectura)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Copiar texto fundamentado listo para enviar a Gisel por WhatsApp"
            >
              {copiedWhatsapp ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Mensaje Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-white" />
                  <span>Copiar Mensaje para Gisel (WhatsApp)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Executive Verdict Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Conclusión Operativa:
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
                  SÍ, GUARDIA DE 1 PERSONA 100% JUSTIFICADA
                </span>
              </div>
              <p className="text-xs text-emerald-950 mt-1 leading-relaxed">
                En la franja 16:00–18:00 hs ingresa el <strong>17,3% del tráfico diario total</strong> (182 correos, ~7,6/día). El <strong>66,5% son correos humanos activos</strong> que resuelven cut-offs navieros, pagos de demoras (USD 150–300/día por contenedor), coordinación de camiones en frontera y retención de cotizaciones comerciales antes del cierre de oficinas.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 hidden md:block">
            <span className="text-2xl font-black text-emerald-900 font-mono">17.3%</span>
            <div className="text-[11px] font-semibold text-emerald-700">del Tráfico Diario</div>
          </div>
        </div>

        {/* 4 Time Buckets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bucket 1: Mañana */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Mañana (08:00–12:00)</span>
              <span className="text-[11px] font-mono text-slate-500">08:00-12:00</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 font-mono">395 correos</span>
              <span className="text-xs font-bold text-slate-600">37.6%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full" style={{ width: '37.6%' }} />
            </div>
            <div className="text-[11px] text-slate-500">Promedio: 16.5 correos/día</div>
          </div>

          {/* Bucket 2: Mediodía / Tarde */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Mediodía / Tarde (12:00–16:00)</span>
              <span className="text-[11px] font-mono text-slate-500">12:00-16:00</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 font-mono">415 correos</span>
              <span className="text-xs font-bold text-slate-600">39.5%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full" style={{ width: '39.5%' }} />
            </div>
            <div className="text-[11px] text-slate-500">Promedio: 17.3 correos/día</div>
          </div>

          {/* Bucket 3: Guardia 16-18hs (Highlighted) */}
          <div className="bg-sky-50/80 border-2 border-[#0072BC] rounded-xl p-4 space-y-2 relative shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0072BC]">Franja Guardia (16:00–18:00)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0072BC] text-white">
                Guardia Activa
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-[#0072BC] font-mono">182 correos</span>
              <span className="text-xs font-bold text-[#0072BC]">17.3%</span>
            </div>
            <div className="w-full bg-sky-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0072BC] h-full rounded-full" style={{ width: '17.3%' }} />
            </div>
            <div className="text-[11px] font-semibold text-[#0072BC]">Promedio: 7.6 correos/día</div>
          </div>

          {/* Bucket 4: After-Hours / Noche */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">After-Hours / Noche (18:00–08:00)</span>
              <span className="text-[11px] font-mono text-slate-500">18:00-08:00</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 font-mono">58 correos</span>
              <span className="text-xs font-bold text-slate-600">5.5%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-full rounded-full" style={{ width: '5.5%' }} />
            </div>
            <div className="text-[11px] text-slate-500">Promedio: 2.4 correos/día</div>
          </div>
        </div>

        {/* Deep Dive Breakdown: Area & Typology vs Real Cases Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Left: Area & Typology Breakdown */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0072BC]" />
                <span>Desglose por Área Funcional en Guardia (16–18 hs)</span>
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-500">Total: 182</span>
            </div>

            <div className="space-y-3">
              {/* Operaciones */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">Operaciones &amp; Tráfico (9 casillas)</span>
                  <span className="font-mono font-bold text-slate-900">98 correos (53.8%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full" style={{ width: '53.8%' }} />
                </div>
                <div className="text-[11px] text-slate-500">
                  4.1 correos/día • Camiones en frontera, lib. contenedores, bookings y cut-offs
                </div>
              </div>

              {/* Comercial */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">Comercial &amp; Pricing (6 casillas)</span>
                  <span className="font-mono font-bold text-slate-900">68 correos (37.4%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '37.4%' }} />
                </div>
                <div className="text-[11px] text-slate-500">
                  2.8 correos/día • Solicitudes RFQ de importadores antes de cerrar sus oficinas
                </div>
              </div>

              {/* Administración */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">Administración &amp; Finanzas (3 casillas)</span>
                  <span className="font-mono font-bold text-slate-900">16 correos (8.8%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: '8.8%' }} />
                </div>
                <div className="text-[11px] text-slate-500">
                  0.7 correos/día • Comprobantes de transferencia a navieras para liberar BLs
                </div>
              </div>
            </div>

            {/* Typology summary */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Clasificación Cualitativa del Tráfico en Guardia
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-lg font-black text-emerald-800 font-mono">66.5%</div>
                  <div className="text-[10px] font-bold text-emerald-900">Humanos Activos</div>
                  <div className="text-[9px] text-emerald-700 mt-0.5">121 correos de gestión</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-slate-800 font-mono">24.7%</div>
                  <div className="text-[10px] font-bold text-slate-700">Notificaciones</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">45 automáticas</div>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <div className="text-lg font-black text-indigo-800 font-mono">8.8%</div>
                  <div className="text-[10px] font-bold text-indigo-900">Facturación</div>
                  <div className="text-[9px] text-indigo-700 mt-0.5">16 pagos y recibos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Audited Real Cases Feed */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[#0072BC]" />
                <span>Correos Recibidos en Franja 16:00 a 18:00 hs</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Ejemplos Reales</span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {guardiaMetrics.ejemplosReales.slice(0, 5).map((caso, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0072BC] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      {caso.hora_local || caso.hora} hs
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        caso.criticidad === 'CRITICA_SOBRECOSTO'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : caso.criticidad === 'ALTA_COMERCIAL'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {caso.criticidad === 'CRITICA_SOBRECOSTO'
                        ? 'SOBRECOSTO DEMURRAGE'
                        : caso.criticidad === 'ALTA_COMERCIAL'
                        ? 'COTIZACIÓN URGENTE'
                        : 'OPERATIVO CRÍTICO'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 line-clamp-1" title={caso.asunto}>
                    {caso.asunto}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{caso.casilla}</span>
                    <span className="text-[10px] font-mono text-slate-400">{caso.fecha}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Detalle del análisis:{' '}
                <code className="text-slate-700 bg-slate-100 px-1 rounded">
                  INFORME_GUARDIA_16_A_18HS_ALMAR.md
                </code>
              </span>
              <span className="text-emerald-700 font-bold">1 Operador Rotativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Benchmark Consultoría PEF & Rentabilidad por Unidad de Negocio (Informe Laura Berti) */}
      <div
        id="metricas-benchmark-pef"
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-[#0072BC] border border-sky-200 shrink-0 mt-0.5">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Benchmark Consultoría PEF &amp; Rentabilidad por Unidad de Negocio
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-[#0072BC] border border-sky-200">
                  Informe Laura Berti (PEF)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Comparativa en tiempo real del margen bruto operativo sobre facturación contra la línea base histórica de la consultoría económica (PEF) y monitoreo de diversificación de cartera.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
            Objetivo PEF: Mantener ≥ Línea Base
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Impo Marítima / Aérea */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Impo Marítima / Aérea</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Meta PEF: 33,0%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatPct(pefBenchmark.impoMarAirMarginPct)}
              </span>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                {pefBenchmark.impoMarAirCount} carpetas
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.min(100, pefBenchmark.impoMarAirMarginPct * 2)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              Principal generador de contribución marginal de ALMAR
            </div>
          </div>

          {/* Card 2: Impo Terrestre */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Impo Terrestre (CRT/MIC)</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-[#0072BC]">
                Meta PEF: 27,0%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatPct(pefBenchmark.impoTerrMarginPct)}
              </span>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                {pefBenchmark.impoTerrCount} carpetas
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0072BC] h-full rounded-full"
                style={{ width: `${Math.min(100, pefBenchmark.impoTerrMarginPct * 2)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              Corredor Mercosur Brasil / Chile / Paraguay
            </div>
          </div>

          {/* Card 3: Exportación */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Exportación Marítima / Aérea</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                Meta PEF: 19,0%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatPct(pefBenchmark.expoMarginPct)}
              </span>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                {pefBenchmark.expoCount} carpetas
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${Math.min(100, pefBenchmark.expoMarginPct * 2)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              Control de cut-offs PO.03 para proteger margen
            </div>
          </div>

          {/* Card 4: Diversificación Cartera Secco */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">Concentración Cliente #1</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                Histórico PEF: 48,0%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-900 font-mono">
                {formatPct(pefBenchmark.seccoSharePct)}
              </span>
              <span className="text-xs font-semibold text-amber-800 font-mono">
                {pefBenchmark.seccoCount} carpetas Secco
              </span>
            </div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${Math.min(100, pefBenchmark.seccoSharePct)}%` }}
              />
            </div>
            <div className="text-[11px] text-amber-900">
              Industrias Juan F. Secco S.A. vs. Cartera Diversificada
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Productivity by Active Human Collaborator (12 Active Collaborators) */}
      <div id="metricas-leaderboard" className="bg-white border border-slate-200 rounded-xl p-6 shadow-enterprise space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0072BC]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rendimiento Individual &amp; SLAs de Respuesta (12 Colaboradores Activos ALMAR)
              </h2>
              <p className="text-xs text-slate-500">
                Métricas dinámicas en horario hábil (08:00–18:00 hs) de correos respondidos, pendientes, tasa de resolución y carpetas activas del personal operativo (excluye Directorio, casillas históricas inactivas y buzones funcionales).
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {humanOperadores.length} Colaboradores Activos • Actualización en Vivo
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Colaborador / Rol</th>
                  <th className="py-3 px-4 text-center">Recibidos</th>
                  <th className="py-3 px-4 text-center">Respondidos</th>
                  <th className="py-3 px-4 text-center">Tasa Respuesta</th>
                  <th className="py-3 px-4 text-center">Pendientes</th>
                  <th className="py-3 px-4 text-center">Tiempo SLA</th>
                  <th className="py-3 px-4 text-center">Carpetas</th>
                  <th className="py-3 px-4 text-center">Comprobantes / Docs</th>
                  <th className="py-3 px-4 text-right">Estado Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {humanOperadores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      <RefreshCw className="h-5 w-5 mx-auto mb-2 text-slate-400 animate-spin" />
                      Cargando rendimiento de los colaboradores operativos...
                    </td>
                  </tr>
                ) : (
                  paginatedOperadores.map((op) => {
                  const carpetasCount = op.carpetasAsignadas?.count ?? op.carpetasCount ?? 0;
                  const carpetasCodes = op.carpetasAsignadas?.codes ?? op.carpetasCodigos ?? [];
                  const rateColor =
                    op.tasaRespuestaPct >= 90
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : op.tasaRespuestaPct >= 75
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200';

                  return (
                    <tr key={op.email} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-[#0072BC] font-bold text-xs shrink-0">
                            {getInitials(op.nombre)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{op.nombre}</span>
                            <div className="text-[11px] text-slate-500 truncate">{op.rol}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{op.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                        {op.emailsRecibidos}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-800 font-semibold">
                        {op.emailsRespondidos}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${rateColor}`}
                        >
                          {formatPct(op.tasaRespuestaPct)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {op.emailsPendientes > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {op.emailsPendientes}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-800 font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <span>{formatDuration(op.tiempoRespuestaPromedioMin)}</span>
                          {op.tiempoRespuestaPromedioMin > 0 && op.tiempoRespuestaPromedioMin <= 15 && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                        <div className="font-bold">{carpetasCount}</div>
                        {carpetasCodes.length > 0 && (
                          <div
                            className="text-[10px] text-slate-400 truncate max-w-[120px] mx-auto"
                            title={carpetasCodes.join(', ')}
                          >
                            {carpetasCodes.slice(0, 2).join(', ')}
                            {carpetasCodes.length > 2 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        <span>{op.comprobantesProcesados} comp.</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span>{op.documentosCatalogados} docs</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {op.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Al día</span>
                          </span>
                        )}
                        {op.status === 'SYNCING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-[#0072BC] border border-sky-200">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Sincronizando</span>
                          </span>
                        )}
                        {op.status === 'ERROR' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertCircle className="h-3 w-3" />
                            <span>Error</span>
                          </span>
                        )}
                        {op.status === 'WATCH_EXPIRED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
                            <span>Renovar</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
          <TablePagination
            currentPage={opsPage}
            totalItems={humanOperadores.length}
            pageSize={opsPageSize}
            pageSizeOptions={[6, 12, 16]}
            itemLabel="colaboradores"
            onPageChange={setOpsPage}
            onPageSizeChange={setOpsPageSize}
            testId="metricas-ops-pagination"
          />
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
          <span>
            Criterio del tablero: Se incluyen los 12 colaboradores activos de Operaciones, Comercial y Administración. Los 2 socios del Directorio (jarloro@, anoacco@), las 2 casillas históricas sin movimiento reciente (abucardo@, zabraham@) y los 2 buzones grupales (tracking@, csexp@) se excluyen del ranking individual para no distorsionar los promedios.
          </span>
        </div>
      </div>

      {/* ISO 9001:2015 PA.03-R.02: Continuous Supplier Evaluation & Scorecard */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-enterprise space-y-4"
        data-testid="pa03-scorecard-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0072BC]" />
              <h3 className="text-base font-bold text-slate-900">
                Evaluación Continua de Proveedores (PA.03-R.02)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monitoreo y calificación continua de desempeño de proveedores reales con comprobantes ingresados. Semáforo de desvío tarifario sobrecotizado.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Conforme (0% desvíos)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Observación (&lt;10%)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>No Conforme (≥10%)</span>
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Proveedor / Razón Social</th>
                  <th className="py-3 px-4">Categoría PA.03</th>
                  <th className="py-3 px-4 text-center">Facturas Analizadas</th>
                  <th className="py-3 px-4 text-center">Total Facturado</th>
                  <th className="py-3 px-4 text-center">Desvíos Tarifarios</th>
                  <th className="py-3 px-4 text-right">Semáforo de Calidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {metrics.proveedores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No se encontraron proveedores registrados para el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  paginatedProveedores.map((sup) => {
                  const facturasCount = sup.facturasCount ?? sup.facturasAnalizadas ?? 0;
                  const desviosCount = sup.desviosCount ?? 0;
                  const desviosTasa =
                    sup.desviosTasa ??
                    (facturasCount > 0 ? (desviosCount / facturasCount) * 100 : 0);
                  const desvioUsd = sup.desvioCostoUsd ?? sup.sobrecostoPrevenidoUsd ?? 0;

                  return (
                    <tr key={sup.cuit + sup.proveedor} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sup.proveedor}</div>
                        <div className="text-[11px] text-slate-500 font-mono">CUIT: {sup.cuit}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoriaProveedorBadgeClasses(
                            sup.categoria
                          )}`}
                        >
                          {sup.categoriaLabel || getCategoriaProveedorLabel(sup.categoria)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="font-bold text-slate-800 text-sm">{facturasCount}</div>
                        <div className="text-[10px] text-slate-400">
                          {sup.facturasConCarpeta} con carpeta • {sup.facturasSinCarpeta} cola
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-800">
                        <div className="font-semibold">{formatUsd(sup.totalFacturadoUsd)}</div>
                        {sup.totalFacturadoArs > 0 && (
                          <div className="text-[10px] text-slate-500">
                            {formatArs(sup.totalFacturadoArs)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className={`font-mono font-bold ${
                            desviosCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {desviosCount} ({desviosTasa.toFixed(1)}%)
                        </div>
                        {desvioUsd > 0 && (
                          <div className="text-[10px] font-mono text-rose-600 font-semibold">
                            +{formatUsd(desvioUsd)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {sup.estadoPa03 === 'CONFORME' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Aprobado / Conforme</span>
                          </span>
                        )}
                        {sup.estadoPa03 === 'OBSERVADO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            <span>En Observación</span>
                          </span>
                        )}
                        {sup.estadoPa03 === 'NO_CONFORME' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertOctagon className="h-3 w-3 text-rose-600" />
                            <span>Plan de Acción PA.03</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
          <TablePagination
            currentPage={supPage}
            totalItems={metrics.proveedores.length}
            pageSize={supPageSize}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="proveedores"
            onPageChange={setSupPage}
            onPageSizeChange={setSupPageSize}
            testId="metricas-sup-pagination"
          />
        </div>
      </div>

      {/* Grid: Financial Reconciliations & Active Alerts vs SLA Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Financial Reconciliations & Folder Cost Deviations (7 cols) */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-enterprise space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#0072BC]" />
              <h3 className="text-sm font-bold text-slate-900">
                Conciliación Financiera de Carpetas &amp; Auditoría de Costos
              </h3>
            </div>
            <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold font-mono">
              {formatUsd(totalSobrecostoPrevenido)} Prevenido
            </span>
          </div>

          <div className="space-y-3">
            {metrics.conciliacionCarpetas.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No hay carpetas operativas para conciliar en este período.
              </div>
            ) : (
              paginatedConciliacion.map((item) => {
                const isNegative =
                  item.estadoConciliacion === 'BLOQUEADA_RENTABILIDAD_NEGATIVA' ||
                  item.margenEstimadoUsd < 0;

                return (
                  <div
                    key={item.carpetaId + item.carpetaCodigo}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-[#0072BC] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            {item.carpetaCodigo}
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {item.clienteNombre}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {item.operacion} • {item.comprobantesCount} comprobantes vinculados
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold block text-sm ${
                            isNegative ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          Margen: {formatUsd(item.margenEstimadoUsd)} ({formatPct(item.rentabilidadPorcentaje)})
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold ${
                            item.desvioCostoUsd > 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          Desvío: {item.desvioCostoUsd > 0 ? `+${formatUsd(item.desvioCostoUsd)}` : formatUsd(item.desvioCostoUsd)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-600 truncate pr-2">
                        Venta: <strong className="font-mono">{item.moneda === 'ARS' ? formatArs(item.ventaEstimadaTotal) : formatUsd(item.ventaEstimadaTotal)}</strong> • Est: <strong className="font-mono">{item.moneda === 'ARS' ? formatArs(item.costoEstimadoTotal) : formatUsd(item.costoEstimadoTotal)}</strong> • Real: <strong className="font-mono">{item.moneda === 'ARS' ? formatArs(item.costoRealTotal) : formatUsd(item.costoRealTotal)}</strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                          item.estadoConciliacion === 'CONCILIADO_EXACTO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.estadoConciliacion === 'BLOQUEADA_RENTABILIDAD_NEGATIVA'
                            ? 'bg-rose-100 text-rose-800'
                            : item.estadoConciliacion === 'PENDIENTE_FACTURACION'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.estadoConciliacion === 'CONCILIADO_EXACTO'
                          ? 'Conciliado Exacto'
                          : item.estadoConciliacion === 'BLOQUEADA_RENTABILIDAD_NEGATIVA'
                          ? 'Rentabilidad Negativa'
                          : item.estadoConciliacion === 'PENDIENTE_FACTURACION'
                          ? 'Pendiente Facturas'
                          : 'Con Desvío'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <TablePagination
            currentPage={concPage}
            totalItems={metrics.conciliacionCarpetas.length}
            pageSize={concPageSize}
            pageSizeOptions={[6, 12, 24]}
            itemLabel="carpetas"
            onPageChange={setConcPage}
            onPageSizeChange={setConcPageSize}
            variant="inline"
            compact={true}
            testId="metricas-conc-pagination"
          />
        </div>

        {/* Right: SLA Distribution & Quality Matrix (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* SLA Distribution Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-enterprise space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0072BC]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Distribución de Tiempos de Respuesta SLA
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">{totalOps} Colaboradores</span>
            </div>

            <div className="space-y-3">
              {/* Range 1: < 15 min */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Menos de 15 minutos (Óptimo)</span>
                  <span className="font-mono text-emerald-700">
                    {pctUnder15.toFixed(0)}% ({opsUnder15})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pctUnder15}%` }}
                  />
                </div>
              </div>

              {/* Range 2: 15 - 60 min */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">15 a 60 minutos (Estándar)</span>
                  <span className="font-mono text-sky-700">
                    {pct15to60.toFixed(0)}% ({ops15to60})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0072BC] rounded-full transition-all"
                    style={{ width: `${pct15to60}%` }}
                  />
                </div>
              </div>

              {/* Range 3: 1 - 4 horas */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">1 a 4 horas (Revisión)</span>
                  <span className="font-mono text-amber-700">
                    {pct1to4h.toFixed(0)}% ({ops1to4h})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${pct1to4h}%` }}
                  />
                </div>
              </div>

              {/* Range 4: > 4 horas */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">&gt; 4 horas (Crítico)</span>
                  <span className="font-mono text-rose-700">
                    {pctOver4h.toFixed(0)}% ({opsOver4h})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${pctOver4h}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Badge Panel */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
              <ShieldCheck className="h-5 w-5 text-[#0072BC]" />
              <span>Trazabilidad Operativa &amp; Control de Gestión</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cada comprobante y correo queda vinculado automáticamente a su carpeta operativa y casilla de origen, facilitando el seguimiento diario entre Operaciones, Comercial y Administración.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-sky-200 text-[11px] font-mono text-slate-700">
              <span>Estado del Tablero:</span>
              <span className="font-bold text-emerald-700">Sincronización Activa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
