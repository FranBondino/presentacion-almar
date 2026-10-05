'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CarpetaRecord } from '@/lib/mockData';
import { INITIAL_CARPETAS } from '@/lib/mockData';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/auth/RoleGuard';
import { canAccessFinancials } from '@/lib/auth';
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
} from 'lucide-react';

export interface CarpetaListProps {
  initialCarpetas?: CarpetaRecord[];
}

export function CarpetaList({
  initialCarpetas = INITIAL_CARPETAS,
}: CarpetaListProps) {
  const { role } = useAuth();
  const [carpetas] = React.useState<CarpetaRecord[]>(initialCarpetas);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedArea, setSelectedArea] = React.useState<string>('ALL');
  const [selectedEstado, setSelectedEstado] = React.useState<string>('ALL');

  const showFinancials = canAccessFinancials(role);

  const filteredCarpetas = React.useMemo(() => {
    return carpetas.filter((c) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const numMatch = c.numero_carpeta.toLowerCase().includes(query);
        const internalMatch = c.numero_interno?.toLowerCase().includes(query) ?? false;
        const clientMatch = c.cliente_nombre.toLowerCase().includes(query);
        const containerMatch = c.contenedor?.toLowerCase().includes(query) ?? false;
        const blMatch = c.hbl_hawb?.toLowerCase().includes(query) ?? false;
        const bookingMatch = c.booking?.toLowerCase().includes(query) ?? false;

        if (!numMatch && !internalMatch && !clientMatch && !containerMatch && !blMatch && !bookingMatch) {
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

      return true;
    });
  }, [carpetas, searchTerm, selectedArea, selectedEstado]);

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

      {/* Carpetas Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <Table className="bg-white">
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Carpeta / Referencia</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Cliente</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Ruta / Tráfico</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Equipo / Manifiesto</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Estado</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">ETA</TableHead>
              {showFinancials && (
                <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Venta / Margen</TableHead>
              )}
              <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCarpetas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showFinancials ? 8 : 7} className="h-24 text-center text-slate-500 font-medium">
                  No se encontraron carpetas con los criterios de búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              filteredCarpetas.map((carp) => {
                const cotizacion = getCotizacionByCarpeta(carp.numero_carpeta);
                return (
                <TableRow key={carp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  {/* Folder ID and mode */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-sky-50 border border-sky-100 p-2 text-[#0072BC] shrink-0">
                        {getAreaIcon(carp.area)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/carpetas/${carp.id}`}
                            className="font-bold text-slate-900 font-mono text-sm hover:text-[#0072BC] transition-colors block"
                          >
                            {carp.numero_carpeta}
                          </Link>
                          {cotizacion && (
                            <span
                              title={`Cotización ${cotizacion.codigo} emitida por ${cotizacion.responsable_nombre} (${cotizacion.responsable_email})`}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs"
                            >
                              <FileText className="h-2.5 w-2.5 text-amber-600" />
                              {cotizacion.codigo}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
                          {carp.tipo_carga} • {carp.sector}
                          {cotizacion && (
                            <span className="text-slate-400 ml-1.5 font-normal">
                              • Asesor: <span className="text-slate-700 font-semibold">{cotizacion.responsable_nombre}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Client info */}
                  <TableCell className="py-3.5">
                    <div className="font-bold text-slate-900 text-xs leading-snug">
                      {carp.cliente_nombre}
                    </div>
                    {carp.cliente_cuit && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        CUIT: {carp.cliente_cuit}
                      </div>
                    )}
                  </TableCell>

                  {/* Route */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-900 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
                      <span className="break-words leading-tight">{carp.origen}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium break-words leading-tight pl-5 mt-0.5">
                      → {carp.destino}
                    </div>
                  </TableCell>

                  {/* Container / BL */}
                  <TableCell className="py-3.5">
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {carp.contenedor ?? carp.hbl_hawb ?? 'Carga Suelta'}
                    </div>
                    {carp.buque_vuelo && (
                      <div className="text-[11px] text-slate-500 font-medium truncate max-w-[160px] mt-0.5">
                        {carp.buque_vuelo}
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5">{getStatusBadge(carp.estado)}</TableCell>

                  {/* ETA */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-mono font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(carp.eta)}</span>
                    </div>
                  </TableCell>

                  {/* Financials (RBAC Protected: Directorio and authorized roles only) */}
                  {showFinancials && (
                    <TableCell className="text-right py-3.5">
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {formatCurrency(carp.venta_estimada_total, carp.moneda)}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          +{formatCurrency(carp.margen_estimado, carp.moneda)}
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {/* Action button */}
                  <TableCell className="text-right py-3.5">
                    <Link href={`/carpetas/${carp.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 gap-1 text-[#0072BC] hover:text-[#005a96] hover:bg-sky-50 font-semibold text-xs">
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
    </div>
  );
}

