'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CarpetaRecord } from '@/lib/mockData';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/auth/RoleGuard';
import { canViewFolderFinancials } from '@/lib/auth';
import { getCotizacionByCarpeta } from '@/lib/carpetasCotizacionesMap';
import {
  Search,
  Ship,
  Plane,
  Truck,
  ArrowRight,
  MapPin,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';

export interface CarpetaListProps {
  initialCarpetas?: CarpetaRecord[];
  carpetas?: CarpetaRecord[];
  newlyCreated?: CarpetaRecord[];
}

const EMPTY_CARPETAS: CarpetaRecord[] = [];

export function CarpetaList({
  initialCarpetas,
  carpetas: propCarpetas,
  newlyCreated,
}: CarpetaListProps) {
  const effectiveInitial = propCarpetas ?? initialCarpetas ?? EMPTY_CARPETAS;
  const { user, role } = useAuth();
  const [carpetas, setCarpetas] = React.useState<CarpetaRecord[]>(effectiveInitial);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (!newlyCreated || newlyCreated.length === 0) return;
    setCarpetas((prev) => {
      const seen = new Set(prev.map((c) => c.numero_carpeta.toUpperCase()));
      const fresh = newlyCreated.filter((n) => !seen.has(n.numero_carpeta.toUpperCase()));
      return fresh.length > 0 ? [...fresh, ...prev] : prev;
    });
  }, [newlyCreated]);
  const [selectedArea, setSelectedArea] = React.useState<string>('ALL');
  const [selectedEstado, setSelectedEstado] = React.useState<string>('ALL');
  const [selectedResponsable, setSelectedResponsable] = React.useState<string>('ALL');

  const responsablesCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of carpetas) {
      const resp = (c.usuario_asignado || c.usuario_responsable || 'Abril Stampfli').trim();
      if (resp) {
        counts.set(resp, (counts.get(resp) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [carpetas]);

  React.useEffect(() => {
    if (effectiveInitial && effectiveInitial.length > 0) {
      setCarpetas(effectiveInitial);
      return;
    }
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    let cancelled = false;
    Promise.all([
      fetch('/api/carpetas?limit=100&offset=0').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/carpetas?limit=100&offset=100').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p1, p2]) => {
        if (cancelled) return;
        const rows1 = Array.isArray(p1?.data) ? (p1.data as CarpetaRecord[]) : [];
        const rows2 = Array.isArray(p2?.data) ? (p2.data as CarpetaRecord[]) : [];
        const merged = [...rows1, ...rows2];
        setCarpetas(merged);
      })
      .catch(() => {
        // Keep initial state on offline/test mode
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveInitial]);

  const showFinancials = canViewFolderFinancials(role);

  const filteredCarpetas = React.useMemo(() => {
    return carpetas.filter((c) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const numMatch = c.numero_carpeta.toLowerCase().includes(query);
        const internalMatch = c.numero_interno?.toLowerCase().includes(query) ?? false;
        const clientMatch = c.cliente_nombre.toLowerCase().includes(query);
        const shipperMatch = c.shipper_nombre?.toLowerCase().includes(query) ?? false;
        const consigneeMatch = c.consignee_nombre?.toLowerCase().includes(query) ?? false;
        const transportistaMatch = c.transportista_nombre?.toLowerCase().includes(query) ?? false;
        const customerMatch = c.customer_nombre?.toLowerCase().includes(query) ?? false;
        const usuarioMatch = c.usuario_asignado?.toLowerCase().includes(query) ?? false;
        const cotizacionMatch = c.cotizacion_codigo?.toLowerCase().includes(query) ?? false;
        const containerMatch = c.contenedor?.toLowerCase().includes(query) ?? false;
        const blMatch = c.hbl_hawb?.toLowerCase().includes(query) ?? false;
        const bookingMatch = c.booking?.toLowerCase().includes(query) ?? false;

        if (
          !numMatch &&
          !internalMatch &&
          !clientMatch &&
          !shipperMatch &&
          !consigneeMatch &&
          !transportistaMatch &&
          !customerMatch &&
          !usuarioMatch &&
          !cotizacionMatch &&
          !containerMatch &&
          !blMatch &&
          !bookingMatch
        ) {
          return false;
        }
      }

      // Area filter
      if (selectedArea !== 'ALL') {
        if (c.area !== selectedArea) return false;
      }

      // Estado filter
      if (selectedEstado !== 'ALL') {
        if (c.estado !== selectedEstado) return false;
      }

      // Responsable / Operativa filter
      if (selectedResponsable !== 'ALL') {
        const resp = (c.usuario_asignado || c.usuario_responsable || 'Abril Stampfli').trim();
        if (selectedResponsable === 'MIS_CARPETAS') {
          const myName = (user?.nombre || '').toLowerCase().trim();
          if (myName && !resp.toLowerCase().includes(myName.split(' ')[0]!)) {
            return false;
          }
        } else if (resp.toLowerCase() !== selectedResponsable.toLowerCase()) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const score = (x: CarpetaRecord) =>
        ((x.venta_estimada_total ?? 0) > 0 ? 4 : 0) +
        ((x.costo_estimado_total ?? 0) > 0 ? 2 : 0) +
        (!x.cliente_nombre.startsWith('Operación Logística ') ? 1 : 0);
      return score(b) - score(a);
    });
  }, [carpetas, searchTerm, selectedArea, selectedEstado, selectedResponsable, user?.nombre]);

  // Unified Pagination (15 / 25 / 50 / 100, default 25)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedArea, selectedEstado, selectedResponsable, pageSize]);

  const totalPages = Math.ceil(filteredCarpetas.length / pageSize) || 1;
  const paginatedCarpetas = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCarpetas.slice(start, start + pageSize);
  }, [filteredCarpetas, currentPage, pageSize]);

  const getAreaIcon = (area: CarpetaRecord['area']) => {
    switch (area) {
      case 'MARITIMO':
        return <Ship className="h-4 w-4 text-[#0072BC]" />;
      case 'AEREO':
        return <Plane className="h-4 w-4 text-indigo-600" />;
      case 'TERRESTRE':
      default:
        return <Truck className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getStatusBadge = (estado: CarpetaRecord['estado']) => {
    switch (estado) {
      case 'EN_TRANSITO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200/80 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
            <span>En Tránsito</span>
          </span>
        );
      case 'EN_ADUANA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>En Aduana</span>
          </span>
        );
      case 'ARRIBADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200/80 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>Arribado</span>
          </span>
        );
      case 'ENTREGADO':
      case 'CERRADO_OPERATIVO':
      case 'CERRADO_CONTABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Cerrado / Entregado</span>
          </span>
        );
      case 'BOOKING_CONFIRMADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
            <span>Booking Confirmado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            <span>{estado}</span>
          </span>
        );
    }
  };

  const renderKipintochBadge = (carp: CarpetaRecord) => {
    const isHouse =
      carp.estado_kipintoch?.toUpperCase() === 'HOUSE' ||
      carp.estado_kipintoch === 'House' ||
      (carp.numero_interno && !carp.numero_interno.startsWith('OR/') && !carp.numero_interno.startsWith('O-'));

    const isOrdenDeVenta =
      carp.estado_kipintoch?.toUpperCase() === 'ORDEN_DE_VENTA' ||
      carp.estado_kipintoch === 'Orden de venta' ||
      (carp.numero_interno && (carp.numero_interno.startsWith('OR/') || carp.numero_interno.startsWith('O-')));

    if (isHouse && !isOrdenDeVenta) {
      const modalidad = carp.modalidad_embarque || carp.modalidad_consolidado || 'Directa';
      return (
        <div className="space-y-1">
          <span
            data-testid={`badge-kipintoch-${carp.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs whitespace-nowrap"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>House</span>
          </span>
          <span className="block text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full w-fit font-medium">
            {modalidad}
          </span>
        </div>
      );
    }

    if (isOrdenDeVenta) {
      const tipoOp =
        carp.tipo_operacion ||
        carp.tipo_operacion_kipin ||
        (carp.tipo_carga === 'FCL' ? 'FCL - FCL' : carp.tipo_carga === 'LCL' ? 'LCL - LCL' : carp.tipo_carga);
      return (
        <div className="space-y-1">
          <span
            data-testid={`badge-kipintoch-${carp.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs whitespace-nowrap"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#0072BC] shrink-0" />
            <span>Orden de venta</span>
          </span>
          {tipoOp && (
            <span className="block text-[10px] text-slate-600 font-medium whitespace-nowrap">
              {tipoOp}
            </span>
          )}
        </div>
      );
    }

    return getStatusBadge(carp.estado);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por Carpeta (C1234, IT1486), Cliente, Contenedor, BL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Responsable / Operativa Filter */}
          <select
            value={selectedResponsable}
            onChange={(e) => setSelectedResponsable(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0072BC] focus:border-[#0072BC] cursor-pointer shadow-2xs"
            aria-label="Filtrar por responsable u operativa"
          >
            <option value="ALL">Todos los Responsables ({carpetas.length})</option>
            {user?.nombre && (
              <option value="MIS_CARPETAS">Mis Carpetas ({user.nombre.split(' ')[0]})</option>
            )}
            {responsablesCounts.map(([nombre, count]) => (
              <option key={nombre} value={nombre}>
                {nombre} ({count})
              </option>
            ))}
          </select>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0072BC] focus:border-[#0072BC] cursor-pointer shadow-2xs"
            aria-label="Filtrar por modo de transporte"
          >
            <option value="ALL">Todos los Modos</option>
            <option value="MARITIMO">Marítimo</option>
            <option value="AEREO">Aéreo</option>
            <option value="TERRESTRE">Terrestre</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0072BC] focus:border-[#0072BC] cursor-pointer shadow-2xs"
            aria-label="Filtrar por estado operativo"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="EN_TRANSITO">En Tránsito</option>
            <option value="EN_ADUANA">En Aduana</option>
            <option value="ARRIBADO">Arribado</option>
            <option value="BOOKING_CONFIRMADO">Booking Confirmado</option>
            <option value="CERRADO_CONTABLE">Cerrado Contable</option>
          </select>
        </div>
      </div>

      {/* Mobile & Small Tablet Cards (< 768px) */}
      <div className="md:hidden space-y-3">
        {paginatedCarpetas.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No se encontraron carpetas con los criterios de búsqueda.
          </div>
        ) : (
          paginatedCarpetas.map((carp) => {
            const cotizacion = getCotizacionByCarpeta(
              carp.numero_carpeta,
              carp as { cotizacion_vinculada?: ReturnType<typeof getCotizacionByCarpeta> }
            );
            return (
              <div
                key={`mobile-${carp.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-sky-50 border border-sky-100 p-2 text-[#0072BC] shrink-0">
                      {getAreaIcon(carp.area)}
                    </div>
                    <div>
                      <Link
                        href={`/carpetas/${carp.id}`}
                        className="font-bold text-slate-900 font-mono text-xs hover:text-[#0072BC]"
                      >
                        {carp.numero_interno || carp.numero_carpeta}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {carp.numero_carpeta} • Op: {carp.usuario_asignado || 'Abril Stampfli'}
                      </div>
                    </div>
                  </div>
                  {renderKipintochBadge(carp)}
                </div>

                <div className="text-xs space-y-1 border-t border-slate-100 pt-2.5">
                  <div className="font-bold text-slate-900">{carp.cliente_nombre}</div>
                  {carp.shipper_nombre && (
                    <div className="text-[11px] text-slate-600">
                      <span className="text-slate-400">Shipper:</span> {carp.shipper_nombre}
                    </div>
                  )}
                  {carp.transportista_nombre && (
                    <div className="text-[11px] text-slate-600">
                      <span className="text-slate-400">Transportista:</span> {carp.transportista_nombre}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-slate-700 pt-0.5">
                    <MapPin className="h-3 w-3 text-[#0072BC] shrink-0" />
                    <span>
                      {carp.origen} → {carp.destino}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    {(carp.cotizacion_codigo || cotizacion?.codigo) && (
                      <Link
                        href={`/cotizaciones?search=${encodeURIComponent(
                          carp.cotizacion_codigo || cotizacion?.codigo || ''
                        )}`}
                        className="text-[10px] font-mono font-bold text-[#0072BC] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 hover:underline"
                      >
                        {carp.cotizacion_codigo || cotizacion?.codigo}
                      </Link>
                    )}
                    {showFinancials ? (
                      (() => {
                        const effMargen =
                          (carp.margen_estimado ?? 0) !== 0
                            ? carp.margen_estimado!
                            : (cotizacion?.margen_proyectado ?? 0);
                        return (
                          <span
                            className={`text-xs font-mono font-bold ${
                              effMargen > 0
                                ? 'text-emerald-700'
                                : effMargen < 0
                                  ? 'text-rose-700'
                                  : 'text-slate-600'
                            }`}
                          >
                            {effMargen > 0
                              ? `+${formatCurrency(effMargen, carp.moneda)}`
                              : formatCurrency(effMargen, carp.moneda)}
                          </span>
                        );
                      })()
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                        title="Información de costos y rentabilidad restringida bajo norma de confidencialidad ISO 9001 (Requiere rol Finanzas o Dirección)"
                      >
                        🔒 Confidencial
                      </span>
                    )}
                  </div>
                  <Link href={`/carpetas/${carp.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-[#0072BC] border-sky-200">
                      <span>Abrir Carpeta</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Carpetas Table (Desktop & Laptop >= 768px) */}
      <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <Table className="bg-white">
            <TableHeader className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5"># Interno / Ref. Interna</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Carpeta / Master / Cotización</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Cliente</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Ruta / Tráfico</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Estado Kipintoch</TableHead>
                {showFinancials ? (
                  <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Venta / Margen</TableHead>
                ) : (
                  <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Finanzas</TableHead>
                )}
                <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider py-2.5">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCarpetas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500 font-medium">
                    No se encontraron carpetas con los criterios de búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCarpetas.map((carp) => {
                  const cotizacion = getCotizacionByCarpeta(
                    carp.numero_carpeta,
                    carp as { cotizacion_vinculada?: ReturnType<typeof getCotizacionByCarpeta> }
                  );
                  return (
                    <TableRow key={carp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      {/* Col 1: # Interno / Ref. Interna */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-sky-50 border border-sky-100 p-2 text-[#0072BC] shrink-0" title={`Área: ${carp.area}`}>
                            {getAreaIcon(carp.area)}
                          </div>
                          <div>
                            <Link
                              href={`/carpetas/${carp.id}`}
                              className="font-bold text-slate-900 font-mono text-xs hover:text-[#0072BC] transition-colors block"
                            >
                              {carp.numero_interno || carp.numero_carpeta}
                            </Link>
                            <div className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
                              Usuario: <span className="text-slate-700 font-semibold">{carp.usuario_asignado || 'Abril Stampfli'}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Col 2: Carpeta / Master / Cotización */}
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {carp.numero_carpeta}
                            </span>
                            {carp.tipo_carga && (
                              <span className="text-[10px] text-slate-500">
                                • {carp.tipo_carga}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600">
                            <span className="text-slate-400">Master:</span> {carp.mbl_mawb || carp.hbl_hawb || '-'}
                          </div>
                          {(carp.cotizacion_codigo || cotizacion?.codigo) && (
                            <div className="pt-0.5">
                              <Link
                                href={`/cotizaciones?search=${encodeURIComponent(
                                  carp.cotizacion_codigo || cotizacion?.codigo || ''
                                )}`}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#0072BC] hover:underline bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200"
                                title="Ver cotización comercial vinculada"
                              >
                                <FileText className="h-2.5 w-2.5" />
                                <span>{carp.cotizacion_codigo || cotizacion?.codigo}</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Col 3: Cliente (Compact ~2 lines with popover/tooltip for secondary actors) */}
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5 text-xs max-w-[240px]">
                          {/* Line 1: Company name */}
                          <div className="font-bold text-slate-900 leading-snug truncate" title={carp.cliente_nombre}>
                            {carp.cliente_nombre}
                          </div>

                          {/* Line 2: Principal shipper or carrier + secondary actors indicator */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 leading-tight">
                            {carp.shipper_nombre || carp.transportista_nombre ? (
                              <span className="truncate" title={`${carp.shipper_nombre ? `Shipper: ${carp.shipper_nombre}` : ''}${carp.transportista_nombre ? ` • Transp: ${carp.transportista_nombre}` : ''}`}>
                                <span className="text-slate-400 font-medium">
                                  {carp.shipper_nombre ? 'Shipper:' : 'Transp:'}
                                </span>{' '}
                                <span className="text-slate-600 font-medium">
                                  {carp.shipper_nombre || carp.transportista_nombre}
                                </span>
                              </span>
                            ) : carp.cliente_cuit ? (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {/cuit/i.test(carp.cliente_cuit) ? carp.cliente_cuit : `CUIT: ${carp.cliente_cuit}`}
                              </span>
                            ) : null}

                            {/* Secondary Actors Tooltip/Popover Trigger */}
                            {(carp.consignee_nombre || carp.customer_nombre || (carp.shipper_nombre && carp.transportista_nombre)) && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0 cursor-help"
                                title={[
                                  carp.shipper_nombre ? `Shipper: ${carp.shipper_nombre}` : null,
                                  carp.consignee_nombre ? `Consignee: ${carp.consignee_nombre}` : null,
                                  carp.transportista_nombre ? `Transportista: ${carp.transportista_nombre}` : null,
                                  carp.customer_nombre ? `Customer: ${carp.customer_nombre}` : null,
                                ].filter(Boolean).join('\n')}
                              >
                                <Users className="h-2.5 w-2.5 text-slate-400" />
                                <span>+</span>
                              </span>
                            )}
                          </div>

                          {/* Semantic Accessible Block for Kipintoch alignment & screen readers */}
                          <div className="sr-only">
                            {carp.shipper_nombre && <span>Shipper: {carp.shipper_nombre}</span>}
                            {carp.consignee_nombre && <span>Consignee: {carp.consignee_nombre}</span>}
                            {carp.transportista_nombre && <span>Transportista: {carp.transportista_nombre}</span>}
                            {carp.customer_nombre && <span>Customer: {carp.customer_nombre}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Col 4: Ruta / Tráfico */}
                      <TableCell className="py-2.5">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-900 font-medium leading-tight">
                            <MapPin className="h-3 w-3 text-[#0072BC] shrink-0" />
                            <span className="font-semibold">{carp.origen}</span>
                            {carp.etd && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                (ETD: {formatDate(carp.etd)})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 leading-tight pl-4">
                            <span>→ {carp.destino}</span>
                            {carp.eta && (
                              <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                                (ETA: {formatDate(carp.eta)})
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Col 5: Estado Kipintoch */}
                      <TableCell className="py-2.5">
                        {renderKipintochBadge(carp)}
                      </TableCell>

                      {/* Financials (RBAC Protected: Folder-level visibility) */}
                      {showFinancials ? (
                        <TableCell className="text-right py-2.5">
                          {(() => {
                            const effVenta =
                              (carp.venta_estimada_total ?? 0) > 0
                                ? carp.venta_estimada_total!
                                : (cotizacion?.flete_venta_pactado ?? 0);
                            const effCosto =
                              (carp.costo_estimado_total ?? 0) > 0
                                ? carp.costo_estimado_total!
                                : (cotizacion?.flete_costo_estimado ?? 0);
                            const effMargen =
                              (carp.margen_estimado ?? 0) !== 0
                                ? carp.margen_estimado!
                                : (cotizacion?.margen_proyectado ?? Number((effVenta - effCosto).toFixed(2)));
                            return (
                              <div className="tabular-nums font-mono text-right">
                                <div className="font-bold text-xs text-slate-900">
                                  {formatCurrency(effVenta, carp.moneda)}
                                </div>
                                <div
                                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 border ${
                                    effMargen > 0
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : effMargen < 0
                                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                                        : 'text-slate-600 bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  {effMargen > 0
                                    ? `+${formatCurrency(effMargen, carp.moneda)}`
                                    : formatCurrency(effMargen, carp.moneda)}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                            title="Información de costos y rentabilidad restringida bajo norma de confidencialidad ISO 9001 (Requiere rol Finanzas o Dirección)"
                          >
                            🔒 Confidencial
                          </span>
                        </TableCell>
                      )}

                      {/* Action button */}
                      <TableCell className="text-right py-2.5">
                        <Link href={`/carpetas/${carp.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-[#0072BC] hover:text-[#005a96] hover:bg-sky-50 font-semibold text-xs cursor-pointer">
                            <span>Ver</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Info & Paginación */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-600 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>
              Mostrando <strong>{paginatedCarpetas.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong>–
              <strong>{Math.min(currentPage * pageSize, filteredCarpetas.length)}</strong> de{' '}
              <strong>{filteredCarpetas.length}</strong> carpetas ({carpetas.length} totales en sistema).
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 border-l border-slate-300 pl-2">
              <span>Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-slate-800 text-[11px]"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Controles de Paginación */}
          <div className="flex items-center gap-1 self-end sm:self-center" data-testid="carpetas-pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs border-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </Button>

            <span className="px-2 text-xs font-semibold text-slate-700 tabular-nums">
              Página {currentPage} de {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= Math.max(1, totalPages)}
              onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
              className="h-7 px-2 text-xs border-slate-300 disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

