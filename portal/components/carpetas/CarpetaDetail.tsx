'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CarpetaRecord, EventoRecord, ComprobanteRecord, DocumentoRecord } from '@/lib/mockData';
import { CarpetaFinancials } from './CarpetaFinancials';
import { CarpetaMailTimeline } from './CarpetaMailTimeline';
import { CarpetaFlujoOperativo } from './CarpetaFlujoOperativo';
import { ComprobanteList } from '@/components/comprobantes/ComprobanteList';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatDate, formatDateTime, formatFileSize, formatCurrency } from '@/lib/utils';
import { getComprobantePdfUrl } from '@/lib/kanban-utils';
import { useAuth } from '@/components/auth/RoleGuard';
import { useToast } from '@/components/ui/ToastProvider';
import { canViewFolderFinancials } from '@/lib/auth';
import { getCotizacionByCarpeta } from '@/lib/carpetasCotizacionesMap';
import {
  Ship,
  Plane,
  Truck,
  ArrowLeft,
  Calendar,
  MapPin,
  Box,
  Weight,
  Layers,
  Clock,
  FileText,
  DollarSign,
  Activity,
  Container as ContainerIcon,
  ExternalLink,
  Mail,
  BookOpen,
  Users,
  Edit3,
  Check,
  X,
} from 'lucide-react';

export interface CarpetaDetailProps {
  carpeta: CarpetaRecord;
  eventos?: EventoRecord[];
  comprobantes?: ComprobanteRecord[];
  documentos?: DocumentoRecord[];
}

export function CarpetaDetail({
  carpeta,
  eventos = [],
  comprobantes = [],
  documentos = [],
}: CarpetaDetailProps) {
  const { role } = useAuth();
  const { toast } = useToast();
  const showFinancials = canViewFolderFinancials(role);
  const [carpetaState, setCarpetaState] = React.useState<CarpetaRecord>(carpeta);
  const [isEditingKipin, setIsEditingKipin] = React.useState(false);
  const [kipinStatusInput, setKipinStatusInput] = React.useState<'House' | 'Orden de venta'>(
    carpeta.estado_kipintoch === 'HOUSE' || carpeta.estado_kipintoch === 'House'
      ? 'House'
      : 'Orden de venta'
  );
  const [hblInput, setHblInput] = React.useState(carpeta.hbl_hawb || '');
  const [isSavingKipin, setIsSavingKipin] = React.useState(false);
  const [eventosPage, setEventosPage] = React.useState(1);
  const [eventosPageSize, setEventosPageSize] = React.useState(10);
  const [docsPage, setDocsPage] = React.useState(1);
  const [docsPageSize, setDocsPageSize] = React.useState(10);

  React.useEffect(() => {
    setEventosPage(1);
    setDocsPage(1);
  }, [carpeta.id]);

  React.useEffect(() => {
    setCarpetaState(carpeta);
    setKipinStatusInput(
      carpeta.estado_kipintoch === 'HOUSE' || carpeta.estado_kipintoch === 'House'
        ? 'House'
        : 'Orden de venta'
    );
    setHblInput(carpeta.hbl_hawb || '');
  }, [carpeta]);

  const handleSaveKipintoch = async () => {
    setIsSavingKipin(true);
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`/api/carpetas/${encodeURIComponent(carpetaState.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado_kipintoch: kipinStatusInput,
            hbl_hawb: hblInput.trim() || null,
          }),
        });
        if (res.ok) {
          setCarpetaState((prev) => ({
            ...prev,
            estado_kipintoch: kipinStatusInput,
            hbl_hawb: hblInput.trim() || null,
          }));
          setIsEditingKipin(false);
          toast.success('Estado Kipintoch actualizado', `Carpeta actualizada a ${kipinStatusInput}${hblInput ? ` con HBL ${hblInput}` : ''}.`);
        } else {
          toast.error('Error al actualizar', 'No se pudo guardar la transición de estado Kipintoch.');
        }
      }
    } catch {
      // offline fallback
      setCarpetaState((prev) => ({
        ...prev,
        estado_kipintoch: kipinStatusInput,
        hbl_hawb: hblInput.trim() || null,
      }));
      setIsEditingKipin(false);
    } finally {
      setIsSavingKipin(false);
    }
  };

  const cotizacion = getCotizacionByCarpeta(
    carpetaState.numero_carpeta,
    carpetaState as { cotizacion_vinculada?: ReturnType<typeof getCotizacionByCarpeta> }
  );

  const resolvedEventos = React.useMemo(() => {
    const list = eventos ?? [];
    return [...list].sort(
      (a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
    );
  }, [eventos]);

  const paginatedEventos = React.useMemo(() => {
    const start = (eventosPage - 1) * eventosPageSize;
    return resolvedEventos.slice(start, start + eventosPageSize);
  }, [resolvedEventos, eventosPage, eventosPageSize]);

  const paginatedDocumentos = React.useMemo(() => {
    const start = (docsPage - 1) * docsPageSize;
    return documentos.slice(start, start + docsPageSize);
  }, [documentos, docsPage, docsPageSize]);

  const actoresCount = React.useMemo(() => {
    return [
      carpetaState.cliente_nombre,
      carpetaState.shipper_nombre,
      carpetaState.consignee_nombre,
      carpetaState.transportista_nombre,
      carpetaState.customer_nombre || carpetaState.usuario_asignado,
    ].filter(Boolean).length;
  }, [carpetaState]);

  const getAreaIcon = (area: CarpetaRecord['area']) => {
    switch (area) {
      case 'MARITIMO':
        return <Ship className="h-5 w-5 text-[#0072BC]" />;
      case 'AEREO':
        return <Plane className="h-5 w-5 text-indigo-600" />;
      case 'TERRESTRE':
      default:
        return <Truck className="h-5 w-5 text-emerald-600" />;
    }
  };

  const getStatusBadge = (estado: CarpetaRecord['estado']) => {
    switch (estado) {
      case 'EN_TRANSITO':
        return <Badge variant="info">En Tránsito</Badge>;
      case 'EN_ADUANA':
        return <Badge variant="warning">En Aduana</Badge>;
      case 'ARRIBADO':
        return <Badge variant="purple">Arribado</Badge>;
      case 'ENTREGADO':
      case 'CERRADO_OPERATIVO':
      case 'CERRADO_CONTABLE':
        return <Badge variant="success">Cerrado / Entregado</Badge>;
      case 'BOOKING_CONFIRMADO':
        return <Badge variant="default">Booking Confirmado</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const renderKipintochBadge = () => {
    const isHouse =
      carpetaState.estado_kipintoch === 'HOUSE' ||
      carpetaState.estado_kipintoch === 'House' ||
      (!carpetaState.estado_kipintoch && !!carpetaState.hbl_hawb);

    if (isEditingKipin) {
      return (
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-300 rounded-lg shadow-xs">
          <select
            value={kipinStatusInput}
            onChange={(e) => setKipinStatusInput(e.target.value as 'House' | 'Orden de venta')}
            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:border-[#0072BC]"
            aria-label="Estado Kipintoch"
          >
            <option value="Orden de venta">Orden de venta</option>
            <option value="House">House</option>
          </select>
          <input
            type="text"
            placeholder="HBL / HAWB..."
            value={hblInput}
            onChange={(e) => setHblInput(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-800 focus:outline-none focus:border-[#0072BC] w-28 sm:w-36"
            aria-label="HBL / HAWB"
          />
          <button
            type="button"
            disabled={isSavingKipin}
            onClick={handleSaveKipintoch}
            className="p-1 bg-[#1e3d2f] hover:bg-[#152b21] text-white rounded cursor-pointer transition-colors"
            title="Guardar estado Kipintoch"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isSavingKipin}
            onClick={() => setIsEditingKipin(false)}
            className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer transition-colors"
            title="Cancelar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <Badge
          className={`font-semibold text-xs px-2.5 py-0.5 shadow-2xs ${
            isHouse
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-sky-600 hover:bg-sky-700 text-white'
          }`}
        >
          {isHouse ? 'House' : 'Orden de venta'}
        </Badge>
        {carpetaState.hbl_hawb && (
          <Badge variant="outline" className="text-emerald-800 bg-emerald-50 border-emerald-300 text-xs font-mono font-bold">
            HBL: {carpetaState.hbl_hawb}
          </Badge>
        )}
        {carpetaState.modalidad_embarque && isHouse && (
          <Badge variant="outline" className="text-emerald-800 bg-emerald-50 border-emerald-300 text-xs font-mono font-bold">
            {carpetaState.modalidad_embarque}
          </Badge>
        )}
        {carpetaState.tipo_operacion && !isHouse && (
          <Badge variant="outline" className="text-sky-800 bg-sky-50 border-sky-300 text-xs font-mono font-bold">
            {carpetaState.tipo_operacion}
          </Badge>
        )}
        <button
          type="button"
          onClick={() => setIsEditingKipin(true)}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors ml-0.5"
          title="Editar estado Kipintoch / HBL"
          aria-label="Editar estado Kipintoch"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/carpetas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0072BC] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Carpetas de Embarque</span>
        </Link>
        <div className="flex items-center gap-2">
          {getStatusBadge(carpeta.estado)}
          <Badge variant="outline" className="font-mono text-xs border-slate-200 text-slate-700 bg-white">
            {carpeta.area} • {carpeta.sector}
          </Badge>
          {carpeta.condicion_flete && (
            <Badge
              variant="outline"
              className={`font-mono text-xs font-semibold ${
                carpeta.condicion_flete === 'PREPAID'
                  ? 'border-emerald-300 text-emerald-800 bg-emerald-50'
                  : 'border-amber-300 text-amber-800 bg-amber-50'
              }`}
            >
              Flete {carpeta.condicion_flete}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Header Banner - Compact Corporate Light */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-[#0072BC] shrink-0 shadow-2xs">
              {getAreaIcon(carpeta.area)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {carpeta.numero_interno || carpeta.numero_carpeta}
                </h1>
                {carpeta.numero_interno && carpeta.numero_interno !== carpeta.numero_carpeta && (
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {`Ref: ${carpeta.numero_carpeta}`}
                  </span>
                )}
                {renderKipintochBadge()}
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                {carpeta.cliente_nombre}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                {carpeta.usuario_asignado && (
                  <span>
                    Usuario:{' '}
                    <strong className="text-slate-800 font-semibold">{carpeta.usuario_asignado}</strong>
                  </span>
                )}
                {(carpeta.cotizacion_codigo || cotizacion?.codigo) && (
                  <span>
                    Cotización:{' '}
                    <Link
                      href={`/cotizaciones?search=${encodeURIComponent(
                        carpeta.cotizacion_codigo || cotizacion?.codigo || ''
                      )}`}
                      className="text-[#0072BC] font-semibold hover:underline"
                      title="Ver cotización comercial vinculada en Preventa"
                    >
                      {carpeta.cotizacion_codigo || cotizacion?.codigo}
                    </Link>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-sans text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
                  <span>{carpeta.origen}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-900 font-semibold">{carpeta.destino}</span>
                </span>
                {carpeta.buque_vuelo && (
                  <span className="text-slate-700">
                    <span className="text-slate-400">Unidad:</span>{' '}
                    <strong className="font-semibold">{carpeta.buque_vuelo}</strong>
                    {carpeta.viaje && <span className="text-slate-500"> ({carpeta.viaje})</span>}
                  </span>
                )}
                {carpeta.tipo_unidad_terrestre && (
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {carpeta.tipo_unidad_terrestre}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-200 shrink-0">
            <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Calendar className="h-3 w-3 text-[#0072BC]" />
                <span>ETD (Salida)</span>
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                {formatDate(carpeta.etd)}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Clock className="h-3 w-3 text-emerald-600" />
                <span>ETA (Arribo)</span>
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-emerald-700">
                {formatDate(carpeta.eta)}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Weight className="h-3 w-3 text-indigo-600" />
                <span>Peso Bruto</span>
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                {carpeta.peso_kg.toLocaleString('es-AR')} kg
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Box className="h-3 w-3 text-amber-600" />
                <span>Volumen</span>
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                {carpeta.volumen_m3} m³
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation — Positioned immediately below the compact header so every tab opens above the fold */}
      <Tabs defaultValue="mails" className="w-full">
        <TabsList
          className={`flex flex-wrap xl:grid w-full ${
            showFinancials ? 'xl:grid-cols-7' : 'xl:grid-cols-6'
          } h-auto p-1.5 gap-1 bg-slate-100 border border-slate-200 rounded-xl shadow-2xs`}
        >
          <TabsTrigger value="mails" className="flex-1 min-w-[130px] py-2 gap-1.5 font-semibold text-xs text-[#0072BC]">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>Mails &amp; Actores</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-sky-100 text-[#0072BC] border border-sky-200">{actoresCount}</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 min-w-[140px] py-2 gap-1.5 font-semibold text-xs text-[#1e3d2f]">
            <BookOpen className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Manual &amp; Checklist</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">PO.03</span>
          </TabsTrigger>
          <TabsTrigger value="logistica" className="flex-1 min-w-[125px] py-2 gap-1.5 text-xs font-medium">
            <Activity className="h-3.5 w-3.5 shrink-0" />
            <span>Tracking &amp; Hitos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-slate-200 text-slate-700 border border-slate-300">{resolvedEventos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="carga" className="flex-1 min-w-[135px] py-2 gap-1.5 text-xs font-medium">
            <ContainerIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Carga &amp; Manifiesto</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-slate-200 text-slate-700 border border-slate-300">{carpetaState.tipo_carga || 'FCL'}</span>
          </TabsTrigger>
          <TabsTrigger value="comprobantes" className="flex-1 min-w-[135px] py-2 gap-1.5 text-xs font-medium">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>Comprobantes</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-slate-200 text-slate-700 border border-slate-300">{comprobantes.length}</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex-1 min-w-[125px] py-2 gap-1.5 text-xs font-medium">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>Documentos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-slate-200 text-slate-700 border border-slate-300">{documentos.length}</span>
          </TabsTrigger>
          {showFinancials && (
            <TabsTrigger value="finanzas" className="flex-1 min-w-[135px] py-2 gap-1.5 text-xs font-semibold text-emerald-700">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <span>Finanzas &amp; Costos</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">{carpetaState.moneda || 'USD'}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Actores Kipintoch + Cotización Asociada + Email Threads */}
        <TabsContent value="mails" className="space-y-4 pt-2">
          {/* Actores Kipintoch Card */}
          <Card className="border-slate-200 bg-white shadow-xs" data-testid="card-actores-kipintoch">
            <CardHeader className="pb-3 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <Users className="h-4 w-4 text-[#0072BC]" />
                  <span>Actores del Expediente (Kipintoch)</span>
                </CardTitle>
                {(carpeta.cotizacion_codigo || cotizacion?.codigo) && (
                  <div className="text-xs font-mono font-medium text-slate-600">
                    Cotización Vinculada:{' '}
                    <span className="text-[#0072BC] font-bold">
                      {carpeta.cotizacion_codigo || cotizacion?.codigo}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Cliente */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cliente
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                    {carpeta.cliente_nombre}
                  </div>
                  {carpeta.cliente_cuit && (
                    <div className="mt-1 text-[11px] font-mono text-slate-500">
                      {`CUIT: ${carpeta.cliente_cuit}`}
                    </div>
                  )}
                </div>

                {/* Shipper */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Shipper / Proveedor
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                    {carpeta.shipper_nombre || '-'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Embarcador en Origen
                  </div>
                </div>

                {/* Consignee */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Consignee / Importador
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                    {carpeta.consignee_nombre || '-'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Destinatario Final
                  </div>
                </div>

                {/* Transportista */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Transportista / Agente
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                    {carpeta.transportista_nombre || '-'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Línea / Transportista
                  </div>
                </div>

                {/* Customer Service / Operador */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Customer Service / Operador
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                    {carpeta.customer_nombre || (carpeta as { customer_operador?: string | null }).customer_operador || carpeta.usuario_asignado || '-'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Responsable Interno
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cotización Comercial Asociada Banner */}
          {cotizacion && (
            <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 p-4 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100/90 border border-amber-300 text-amber-950 font-mono text-xs font-bold shadow-2xs">
                      <FileText className="h-3.5 w-3.5 text-amber-700" />
                      {cotizacion.codigo}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ Cotización Ganada &amp; Concretada
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Emisión: <strong className="text-slate-700">{formatDate(cotizacion.fecha_emision)}</strong> (Vigencia: {cotizacion.vigencia_dias} días)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Responsable Comercial:</span>{' '}
                      <strong className="text-slate-900 font-semibold">{cotizacion.responsable_nombre}</strong>{' '}
                      <span className="text-slate-500 font-mono text-[11px]">({cotizacion.responsable_email})</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Incoterm:</span>{' '}
                      <strong className="text-slate-800">{cotizacion.incoterm}</strong>
                    </div>
                    {cotizacion.dias_libres_demora > 0 && (
                      <div>
                        <span className="text-slate-400">Días Libres Demoras:</span>{' '}
                        <strong className="text-slate-800">{cotizacion.dias_libres_demora} días</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Naviera / Proveedor Cotizado:</span>{' '}
                      <strong className="text-slate-800">{cotizacion.naviera_aerolinea_cotizada}</strong>
                    </div>
                  </div>
                </div>

                {/* Financials pill & direct quote link */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {showFinancials && (
                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-amber-200 shadow-2xs">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Costo Preventivo</div>
                        <div className="text-sm font-mono font-bold text-slate-700">
                          {formatCurrency(cotizacion.flete_costo_estimado, cotizacion.moneda)}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venta Pactada</div>
                        <div className="text-sm font-mono font-black text-slate-900">
                          {formatCurrency(cotizacion.flete_venta_pactado, cotizacion.moneda)}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Margen Proyectado</div>
                        <div className="text-sm font-mono font-black text-emerald-700">
                          +{formatCurrency(cotizacion.margen_proyectado, cotizacion.moneda)}
                        </div>
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/cotizaciones?search=${encodeURIComponent(cotizacion.codigo)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Ver Cotización Asociada</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <CarpetaMailTimeline carpeta={carpeta} />
        </TabsContent>

        {/* Tab 2: COMEX Operational Manual Stages, Checklists & PO.03 Gate */}
        <TabsContent value="manual" className="space-y-4 pt-2">
          <CarpetaFlujoOperativo
            carpeta={carpetaState}
            documentos={documentos}
            comprobantes={comprobantes}
          />
        </TabsContent>

        {/* Tab 2: Logistics Tracking & Milestones */}
        <TabsContent value="logistica" className="space-y-4 pt-2">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-200">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Activity className="h-4 w-4 text-[#0072BC]" />
                <span>Línea de Tiempo Operativa &amp; Trazabilidad Documental</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {resolvedEventos.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No hay eventos registrados para esta carpeta.
                </div>
              ) : (
                <>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {paginatedEventos.map((evento) => (
                    <div key={evento.id} className="relative group">
                      <div
                        className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          evento.completado ? 'bg-[#0072BC]' : 'bg-amber-500'
                        }`}
                      />
                      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 hover:border-slate-300 hover:bg-white transition-all shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {evento.titulo}
                            </span>
                            {evento.es_critico && (
                              <Badge variant="destructive" className="text-[10px] py-0">
                                Crítico
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            {formatDateTime(evento.fecha_evento)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {evento.descripcion}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>Hito:</span>
                          <span className="text-[#0072BC] font-semibold">{evento.hito}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                  <TablePagination
                    currentPage={eventosPage}
                    totalItems={resolvedEventos.length}
                    pageSize={eventosPageSize}
                    pageSizeOptions={[10, 25, 50]}
                    itemLabel="hitos"
                    onPageChange={setEventosPage}
                    onPageSizeChange={setEventosPageSize}
                    variant="inline"
                    compact={true}
                    testId="carpeta-eventos-pagination"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Cargo & Container Details */}
        <TabsContent value="carga" className="space-y-4 pt-2">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-200">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <ContainerIcon className="h-4 w-4 text-[#0072BC]" />
                <span>Detalle de Unidades y Manifiesto de Carga</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0072BC]">
                    Equipamiento &amp; Identificación
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Contenedor / Matrícula:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {carpeta.contenedor ?? 'No asignado / Carga Suelta'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Tipo de Modalidad:</span>
                      <span className="font-semibold text-slate-800">{carpeta.tipo_carga}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Booking Naviero / Aéreo:</span>
                      <span className="font-mono font-semibold text-[#0072BC]">
                        {carpeta.booking ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Condición de Flete:</span>
                      <span className="font-semibold text-slate-800">
                        {carpeta.condicion_flete ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                              carpeta.condicion_flete === 'PREPAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {carpeta.condicion_flete} ({carpeta.condicion_flete === 'PREPAID' ? 'Origen' : 'Destino'})
                          </span>
                        ) : (
                          'No especificado'
                        )}
                      </span>
                    </div>
                    {carpeta.tipo_unidad_terrestre && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Unidad Terrestre (Comex):</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {carpeta.tipo_unidad_terrestre}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Bultos / Pallets:</span>
                      <span className="font-mono text-slate-800 font-semibold">{carpeta.bultos} bultos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Documentos de Embarque (BL / CRT)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">House BL / HAWB / CRT:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {carpeta.hbl_hawb ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Master BL / MAWB:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {carpeta.mbl_mawb ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Cliente CUIT:</span>
                      <span className="font-mono text-slate-800">{carpeta.cliente_cuit ?? '-'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Email Notificaciones:</span>
                      <span className="text-slate-800 font-mono text-[11px]">{carpeta.cliente_email ?? '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Associated Comprobantes */}
        <TabsContent value="comprobantes" className="space-y-4 pt-2">
          <ComprobanteList carpetaIdFilter={carpeta.id} initialComprobantes={comprobantes} carpetas={[carpeta]} />
        </TabsContent>

        {/* Tab 5: Documents repository with direct PDF preview */}
        <TabsContent value="documentos" className="space-y-4 pt-2">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Layers className="h-4 w-4 text-[#0072BC]" />
                <span>Expediente Digital del Embarque &amp; Comprobantes PDF ({documentos.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {documentos.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No hay documentos adjuntos en esta carpeta.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-200">
                    {paginatedDocumentos.map((doc) => {
                    const storagePath = doc.ruta_storage ?? '';
                    const sizeBytes = doc.tamanio_bytes ?? 0;
                    const docOrigin = doc.origen ?? 'GMAIL_INGESTION';
                    const pdfUrl = getComprobantePdfUrl({
                      id: doc.id,
                      carpeta_id: carpeta.id,
                      numero_comprobante: doc.nombre_archivo,
                      nombre_archivo: doc.nombre_archivo,
                      ruta_storage: storagePath,
                      emisor_razon_social: typeof doc.metadata_extraida === 'object' && doc.metadata_extraida && 'emisor' in doc.metadata_extraida ? String(doc.metadata_extraida.emisor) : undefined,
                    });
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between py-3.5 hover:bg-slate-50 px-3 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-sky-50 border border-sky-200 p-2.5 text-[#0072BC]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 font-mono">
                              {doc.nombre_archivo}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{formatFileSize(sizeBytes)}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{docOrigin}</span>
                              <span>•</span>
                              <span>{formatDate(doc.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0072BC] border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Ver PDF Original</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  <TablePagination
                    currentPage={docsPage}
                    totalItems={documentos.length}
                    pageSize={docsPageSize}
                    pageSizeOptions={[10, 25, 50]}
                    itemLabel="documentos"
                    onPageChange={setDocsPage}
                    onPageSizeChange={setDocsPageSize}
                    variant="inline"
                    compact={true}
                    testId="carpeta-docs-pagination"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Financials & Profitability (Directorio & Authorized roles only) */}
        {showFinancials && (
          <TabsContent value="finanzas" className="space-y-4 pt-2">
            <CarpetaFinancials carpeta={carpeta} comprobantes={comprobantes} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
