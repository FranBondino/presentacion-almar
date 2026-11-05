'use client';

import * as React from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/common/StatCard';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  type CarpetaRecord,
  type ComprobanteRecord,
  type EventoRecord,
  type AlertaRecord,
} from '@/lib/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { DailyDispatchStatusBar } from '@/components/dashboard/DailyDispatchStatusBar';
import { TeamEmailWorkloadCenter } from '@/components/dashboard/TeamEmailWorkloadCenter';
import type { DashboardEmailItem } from '@/app/api/dashboard/stats/route';
import { Skeleton } from '@/components/ui/Skeleton';
import { TablePagination } from '@/components/ui/TablePagination';
import {
  FolderKanban,
  Ship,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  MapPin,
  Database,
} from 'lucide-react';

export interface DashboardPageProps {
  initialCarpetas?: CarpetaRecord[];
  initialComprobantes?: ComprobanteRecord[];
  initialEventos?: EventoRecord[];
  initialAlertas?: AlertaRecord[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardPage(props: any = {}) {
  const {
    initialCarpetas = [],
    initialComprobantes = [],
    initialEventos = [],
    initialAlertas = [],
  }: DashboardPageProps = props ?? {};
  const [carpetas, setCarpetas] = React.useState<CarpetaRecord[]>(initialCarpetas);
  const [comprobantes, setComprobantes] = React.useState<ComprobanteRecord[]>(initialComprobantes);
  const [eventos, setEventos] = React.useState<EventoRecord[]>(initialEventos);
  const [alertas, setAlertas] = React.useState<AlertaRecord[]>(initialAlertas);
  const [dashboardEmails, setDashboardEmails] = React.useState<DashboardEmailItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(
    initialCarpetas.length === 0 && initialComprobantes.length === 0
  );
  const [recentPage, setRecentPage] = React.useState<number>(1);
  const [recentPageSize, setRecentPageSize] = React.useState<number>(6);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    let cancelled = false;
    fetch('/api/dashboard/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.success) {
          setIsLoading(false);
          return;
        }
        if (Array.isArray(data.carpetas)) {
          setCarpetas(data.carpetas);
        }
        if (Array.isArray(data.comprobantes)) {
          setComprobantes(data.comprobantes);
        }
        if (Array.isArray(data.eventos)) {
          setEventos(data.eventos);
        }
        if (Array.isArray(data.alertas)) {
          setAlertas(data.alertas);
        }
        if (Array.isArray(data.dashboardEmails)) {
          setDashboardEmails(data.dashboardEmails);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // Keep initial state on network failure
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCarpetas = carpetas.length;
  const enTransito = carpetas.filter((c) => c.estado === 'EN_TRANSITO').length;
  const comprobantesPendientes = comprobantes.filter(
    (c) => c.estado_pago === 'PENDIENTE'
  ).length;
  const alertasActivas = alertas.filter((a) => !a.resuelta).length;

  const totalVentasUSD = carpetas.filter((c) => c.moneda === 'USD').reduce(
    (sum, c) => sum + (c.venta_estimada_total ?? 0),
    0
  );
  const totalMargenUSD = carpetas.filter((c) => c.moneda === 'USD').reduce(
    (sum, c) => sum + (c.margen_estimado ?? 0),
    0
  );

  const sortedCarpetas = React.useMemo(() => {
    return [...carpetas].sort((a, b) => {
      const score = (x: typeof a) =>
        ((x.venta_estimada_total ?? 0) > 0 ? 4 : 0) +
        ((x.costo_estimado_total ?? 0) > 0 ? 2 : 0) +
        (!x.cliente_nombre.startsWith('Operación Logística ') ? 1 : 0);
      return score(b) - score(a);
    });
  }, [carpetas]);

  const paginatedCarpetas = React.useMemo(() => {
    const start = (recentPage - 1) * recentPageSize;
    return sortedCarpetas.slice(start, start + recentPageSize);
  }, [sortedCarpetas, recentPage, recentPageSize]);

  const recentEventos = React.useMemo(() => {
    return [...eventos]
      .sort((a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime())
      .slice(0, 4);
  }, [eventos]);
  const urgentAlerts = alertas.filter((a) => !a.resuelta);

  return (
    <div className="space-y-5">
      {/* 1. Header Operativo con los 4 contadores principales en vivo */}
      <DailyDispatchStatusBar comprobantes={comprobantes} carpetas={carpetas} isLoading={isLoading} />

      {/* 2. Circuito Operativo en 3 Pasos Claros (Guía visual inmediata) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Link
          href="/cotizaciones"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#0072BC] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#0072BC] border border-sky-200">
                Paso 1 • Comercial &amp; Pricing
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#0072BC] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0072BC] transition-colors">
              Propuestas Comerciales &amp; Cotizaciones
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Propuestas <span className="font-mono font-semibold text-slate-800">PC...</span> y cotizaciones{' '}
              <span className="font-mono font-semibold text-[#0072BC]">Q-...</span> extraídas de Gmail, con su estado en Kipintoch (<span className="text-emerald-700 font-semibold">Confirmada</span>, <span className="text-amber-700 font-semibold">Pendiente</span>, <span className="text-rose-700 font-semibold">Vencida</span>).
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#0072BC]">
            <span>Ir a Cotizaciones</span>
            <span className="font-mono text-slate-500">Preventa</span>
          </div>
        </Link>

        <Link
          href="/carpetas"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#0072BC] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Paso 2 • Tráfico &amp; Operaciones
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#0072BC] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0072BC] transition-colors flex items-center gap-1.5">
              <span>Carpetas de Embarque</span>
              {isLoading ? (
                <Skeleton className="h-4 w-16 inline-block" />
              ) : (
                <span>({totalCarpetas} activas)</span>
              )}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Expedientes <span className="font-mono font-semibold text-emerald-700">House</span> y{' '}
              <span className="font-mono font-semibold text-[#0072BC]">Orden de venta</span> con timeline de mails, tracking de contenedores y checklist según los Manuales de ALMAR.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#0072BC]">
            <span>Ver las carpetas</span>
            <span className="font-mono text-emerald-700">
              {isLoading ? <Skeleton className="h-3 w-16 inline-block" /> : `${enTransito} en tránsito`}
            </span>
          </div>
        </Link>

        <Link
          href="/comprobantes"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#0072BC] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                Paso 3 • Administración &amp; Facturas
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#0072BC] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0072BC] transition-colors">
              Comprobantes PDF &amp; Pase a Kipintoch
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Facturas reales leídas por IA desde Gmail, conciliadas contra el <span className="font-mono font-semibold text-slate-800">INGRESO DE COSTO (FCA/FCE)</span> y listas para copiar a Kipintoch en 1 clic.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#0072BC]">
            <span>Abrir Tablero de Facturas</span>
            <span className="font-mono text-amber-700">
              {isLoading ? <Skeleton className="h-3 w-16 inline-block" /> : `${comprobantesPendientes} pendientes`}
            </span>
          </div>
        </Link>
      </div>

      {/* 2B. Bandeja de Correos del Equipo & Carga Operativa en Tiempo Real (Gmail Metadata: UNREAD, STARRED, Triage) */}
      <TeamEmailWorkloadCenter
        emails={dashboardEmails}
        carpetas={carpetas}
        isLoading={isLoading}
      />

      {/* 3. Main Content Grid: Embarques Recientes (2 cols) + Tracking & Alertas (1 col) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Shipments (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Ship className="h-4 w-4 text-[#0072BC]" />
                  <span>Carpetas Operativas Recientes &amp; En Curso</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hacé clic en cualquier carpeta para ver sus mails, facturas PDF, costos Kipintoch y el checklist del manual operativo.
                </p>
              </div>
              <Link
                href="/carpetas"
                className="text-xs text-[#0072BC] hover:text-sky-700 inline-flex items-center gap-1 font-semibold shrink-0 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200"
              >
                <span>Ver carpetas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2.5">
                {isLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 gap-3 animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-24 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : carpetas.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    No hay operaciones activas registradas. Sincronice las casillas desde el módulo de comprobantes para ingerir correos de Gmail.
                  </div>
                ) : (
                  paginatedCarpetas.map((carp) => {
                    const isOrdenVenta =
                      carp.estado_kipintoch === 'Orden de venta' ||
                      carp.estado_kipintoch === 'ORDEN_DE_VENTA' ||
                      (carp.numero_interno && (carp.numero_interno.startsWith('OR/') || carp.numero_interno.startsWith('O-')));

                    return (
                      <div
                        key={carp.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#0072BC]/50 hover:shadow-xs transition-all gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="rounded-lg bg-sky-50 p-2 text-[#0072BC] border border-sky-200 shrink-0 mt-0.5">
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/carpetas/${carp.id}`}
                                className="font-bold text-slate-900 font-mono text-xs hover:text-[#0072BC] transition-colors"
                              >
                                {carp.numero_interno || carp.numero_carpeta}
                              </Link>
                              {carp.numero_interno && carp.numero_interno !== carp.numero_carpeta && (
                                <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded">
                                  {carp.numero_carpeta}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-bold text-white ${
                                  isOrdenVenta ? 'bg-[#0072BC]' : 'bg-emerald-600'
                                }`}
                              >
                                {isOrdenVenta ? 'Orden de venta' : 'House'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {carp.area} • {carp.sector}
                              </span>
                            </div>
                            <div className="text-xs text-slate-900 font-bold mt-0.5 truncate">
                              {carp.cliente_nombre}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-[#0072BC] shrink-0" />
                                <span>
                                  {carp.origen} → {carp.destino}
                                </span>
                              </span>
                              {carp.usuario_asignado && (
                                <span className="text-[10px] text-slate-400">
                                  • Op: <strong className="text-slate-600">{carp.usuario_asignado}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0 gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-mono border-slate-200 bg-white text-slate-600" title="Fecha de Salida (ETD)">
                              ETD {formatDate(carp.etd)}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50/60 text-sky-800" title="Fecha Estimada de Arribo a Destino (ETA)">
                              ETA {formatDate(carp.eta)}
                            </Badge>
                          </div>
                          <Link href={`/carpetas/${carp.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-[#0072BC] border-sky-200 bg-white hover:bg-sky-50 px-2.5 font-semibold"
                            >
                              Abrir Carpeta
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {!isLoading && sortedCarpetas.length > 0 && (
                <TablePagination
                  currentPage={recentPage}
                  totalItems={sortedCarpetas.length}
                  pageSize={recentPageSize}
                  pageSizeOptions={[6, 12, 25]}
                  itemLabel="carpetas"
                  onPageChange={setRecentPage}
                  onPageSizeChange={setRecentPageSize}
                  variant="inline"
                  compact={true}
                  testId="dashboard-carpetas-pagination"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Urgent Alerts + Real-Time Logistics Feed (1 col) */}
        <div className="space-y-4">
          {urgentAlerts.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">
                      {urgentAlerts.length} Alertas KipinCargo Activas
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 line-clamp-2">
                      {urgentAlerts[0]?.titulo}: {urgentAlerts[0]?.mensaje}
                    </p>
                  </div>
                </div>
                <Link href="/alertas" className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-amber-300 bg-white text-amber-900 hover:bg-amber-100 font-semibold"
                  >
                    Ver ({urgentAlerts.length})
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Tracking &amp; Eventos (KipinCargo)</span>
              </CardTitle>
              <Link
                href="/eventos"
                className="text-xs text-[#0072BC] hover:text-sky-700 inline-flex items-center gap-1 font-medium"
              >
                <span>Ver todos</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {recentEventos.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No hay eventos operativos recientes registrados.
                  </div>
                ) : (
                  recentEventos.map((ev) => (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -left-4 top-1 h-2.5 w-2.5 rounded-full bg-[#0072BC] ring-4 ring-white" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 leading-snug">
                          {ev.titulo}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                          {ev.descripcion}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{formatDateTime(ev.fecha_evento)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial KPIs (Strictly for Directorio: Juan Andrés, Vanesa, Alejandro) */}
          <RoleGuard allowedRoles={['ADMIN', 'GERENCIA', 'FINANZAS']} fallback={null}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Resumen Financiero en Curso
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0072BC]">
                  <Database className="h-3 w-3" />
                  <span>{totalCarpetas} carpetas</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                <StatCard
                  title="Volumen Facturado (USD)"
                  value={formatCurrency(totalVentasUSD, 'USD')}
                  icon={DollarSign}
                  description="Venta estimada de carpetas activas"
                />
                <StatCard
                  title="Margen Operativo Bruto (USD)"
                  value={formatCurrency(totalMargenUSD, 'USD')}
                  icon={TrendingUp}
                  description="Rentabilidad acumulada estimada"
                />
              </div>
            </div>
          </RoleGuard>
        </div>
      </div>
    </div>
  );
}
