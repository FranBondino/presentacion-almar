'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CarpetaRecord, EventoRecord, ComprobanteRecord, DocumentoRecord } from '@/lib/mockData';
import { INITIAL_EVENTOS, INITIAL_COMPROBANTES, INITIAL_DOCUMENTOS } from '@/lib/mockData';
import { CarpetaFinancials } from './CarpetaFinancials';
import { CarpetaMailTimeline } from './CarpetaMailTimeline';
import { ComprobanteList } from '@/components/comprobantes/ComprobanteList';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, formatDateTime, formatFileSize, formatCurrency } from '@/lib/utils';
import { getComprobantePdfUrl } from '@/lib/kanban-utils';
import { useAuth } from '@/components/auth/RoleGuard';
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
} from 'lucide-react';

export interface CarpetaDetailProps {
  carpeta: CarpetaRecord;
  eventos?: EventoRecord[];
  comprobantes?: ComprobanteRecord[];
  documentos?: DocumentoRecord[];
}

export function CarpetaDetail({
  carpeta,
  eventos,
  comprobantes = INITIAL_COMPROBANTES.filter((c) => c.carpeta_id === carpeta.id),
  documentos = INITIAL_DOCUMENTOS.filter((d) => d.carpeta_id === carpeta.id),
}: CarpetaDetailProps) {
  const { role } = useAuth();
  const showFinancials = canViewFolderFinancials(role);
  const cotizacion = getCotizacionByCarpeta(carpeta.numero_carpeta);

  const resolvedEventos = React.useMemo(() => {
    const list = eventos ?? INITIAL_EVENTOS.filter((e) => e.carpeta_id === carpeta.id);
    return [...list].sort(
      (a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
    );
  }, [eventos, carpeta.id]);
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

      {/* Main Header Banner - Clean Corporate Light */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-[#0072BC] shrink-0 shadow-2xs">
              {getAreaIcon(carpeta.area)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {carpeta.numero_carpeta}
                </h1>
                {carpeta.numero_interno && (
                  <span className="text-xs text-slate-500 font-mono">
                    ({carpeta.numero_interno})
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {carpeta.cliente_nombre}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
                  <span>{carpeta.origen}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-900 font-medium">{carpeta.destino}</span>
                </div>
                {carpeta.buque_vuelo && (
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <span className="text-slate-400">Unidad:</span>
                    <span className="font-semibold">{carpeta.buque_vuelo}</span>
                    {carpeta.viaje && <span className="text-slate-500">({carpeta.viaje})</span>}
                  </div>
                )}
                {carpeta.tipo_unidad_terrestre && (
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <span className="text-slate-400">Tipo Unidad:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                      {carpeta.tipo_unidad_terrestre}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Calendar className="h-3.5 w-3.5 text-[#0072BC]" />
                <span>ETD (Salida)</span>
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-slate-900">
                {formatDate(carpeta.etd)}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>ETA (Arribo)</span>
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-emerald-700">
                {formatDate(carpeta.eta)}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Weight className="h-3.5 w-3.5 text-indigo-600" />
                <span>Peso Bruto</span>
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-slate-900">
                {carpeta.peso_kg.toLocaleString('es-AR')} kg
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Box className="h-3.5 w-3.5 text-amber-600" />
                <span>Volumen</span>
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-slate-900">
                {carpeta.volumen_m3} m³
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cotización Comercial Asociada Banner */}
      {cotizacion && (
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 border border-amber-300 text-amber-950 font-mono text-xs font-bold shadow-2xs">
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

              <p className="text-xs text-slate-600 italic bg-amber-100/30 border-l-2 border-amber-400 pl-2.5 py-0.5 rounded-r">
                &ldquo;{cotizacion.notas}&rdquo;
              </p>
            </div>

            {/* Financials pill if authorized */}
            {showFinancials && (
              <div className="flex items-center gap-3 shrink-0 bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
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
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs defaultValue="mails" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 gap-1 bg-slate-100 border border-slate-200 rounded-lg">
          <TabsTrigger value="mails" className="py-2 gap-1.5 font-semibold text-xs text-[#0072BC]">
            <Mail className="h-3.5 w-3.5" />
            <span>Mails &amp; Actores</span>
          </TabsTrigger>
          <TabsTrigger value="logistica" className="py-2 gap-1.5 text-xs font-medium">
            <Activity className="h-3.5 w-3.5" />
            <span>Tracking &amp; Hitos</span>
          </TabsTrigger>
          <TabsTrigger value="carga" className="py-2 gap-1.5 text-xs font-medium">
            <ContainerIcon className="h-3.5 w-3.5" />
            <span>Carga &amp; Manifiesto</span>
          </TabsTrigger>
          <TabsTrigger value="comprobantes" className="py-2 gap-1.5 text-xs font-medium">
            <FileText className="h-3.5 w-3.5" />
            <span>Comprobantes ({comprobantes.length})</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="py-2 gap-1.5 text-xs font-medium">
            <Layers className="h-3.5 w-3.5" />
            <span>Documentos ({documentos.length})</span>
          </TabsTrigger>
          {showFinancials && (
            <TabsTrigger value="finanzas" className="py-2 gap-1.5 text-xs font-semibold text-emerald-700">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Finanzas &amp; Costos</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Email Threads & Communication History */}
        <TabsContent value="mails" className="space-y-4 pt-2">
          <CarpetaMailTimeline carpeta={carpeta} />
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
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {resolvedEventos.map((evento) => (
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
          <ComprobanteList carpetaIdFilter={carpeta.id} />
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
                <div className="divide-y divide-slate-200">
                  {documentos.map((doc) => {
                    const pdfUrl = getComprobantePdfUrl({
                      id: doc.id,
                      carpeta_id: carpeta.id,
                      numero_comprobante: doc.nombre_archivo,
                      nombre_archivo: doc.nombre_archivo,
                      ruta_storage: doc.ruta_storage,
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
                              <span>{formatFileSize(doc.tamanio_bytes)}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{doc.origen}</span>
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
