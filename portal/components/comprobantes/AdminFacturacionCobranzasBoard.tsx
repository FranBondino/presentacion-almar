'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CarpetaRecord } from '@/lib/mockData';
import type { UserRole } from '@/lib/auth';
import { getCotizacionByCarpeta } from '@/lib/carpetasCotizacionesMap';
import { BANCO_MACRO_ACCOUNTS, getNextReceiptNumber } from '@/lib/kanban-utils';
import { useToast } from '@/components/ui/ToastProvider';
import {
  FileCheck2,
  Send,
  Landmark,
  CheckCircle2,
  GripVertical,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Building2,
  Receipt,
  Sparkles,
} from 'lucide-react';

export type AdminBillingStageId =
  | 'pase_operaciones'
  | 'factura_emitida'
  | 'verificacion_macro'
  | 'cobrada_recibo';

export interface AdminBillingItem {
  id: string;
  carpetaId: string;
  numeroCarpeta: string;
  clienteNombre: string;
  clienteCuit: string;
  area: string;
  tipoOperacion: string;
  ruta: string;
  hblBooking: string;
  operadorNombre: string;
  // Trazabilidad Comercial (Cotización)
  cotizacionCodigo: string;
  vendedorNombre: string;
  incoterm: string;
  ventaPactadaUsd: number;
  // Trazabilidad Operativa (Costos conformados por Operaciones)
  costoConformadoUsd: number;
  sobrecostoTrasladadoUsd: number;
  estadoControlOperativo: string;
  // Facturación de Venta y Cobranza
  margenNetoUsd: number;
  rentabilidadPct: number;
  tcOficialBna: number;
  alicuotaIvaLabel: string;
  reglaBancariaOk: boolean;
  seguroSancorProvisionUsd: number;
  stage: AdminBillingStageId;
  numeroFacturaVenta?: string;
  fechaEmisionVenta?: string;
  fechaVencimientoVenta?: string;
  comprobantePagoRef?: string;
  cuentaBancoMacro: string;
  cbuBancoMacro: string;
  reciboKipintochNumero?: string;
  comisionLiberada?: boolean;
}

const STAGE_META: Array<{
  id: AdminBillingStageId;
  step: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  badgeClass: string;
  headerBorderClass: string;
}> = [
  {
    id: 'pase_operaciones',
    step: '1',
    title: '1. Pase de Operaciones (Para Facturar)',
    shortTitle: '1. Para Facturar',
    subtitle: 'Carpetas con costos auditados por Operaciones y trazabilidad lista para emitir Factura de Venta',
    badgeClass: 'bg-sky-50 text-[#0072BC] border-sky-200',
    headerBorderClass: 'border-t-4 border-t-[#0072BC]',
  },
  {
    id: 'factura_emitida',
    step: '2',
    title: '2. Factura de Venta Emitida (Por Cobrar)',
    shortTitle: '2. Factura Emitida',
    subtitle: 'Factura electrónica AFIP enviada al cliente; en seguimiento de vencimiento y cuenta corriente',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerBorderClass: 'border-t-4 border-t-indigo-600',
  },
  {
    id: 'verificacion_macro',
    step: '3',
    title: '3. Pago Informado (Verificar Banco Macro)',
    shortTitle: '3. Verificar Macro',
    subtitle: 'Cliente envió comprobante de transferencia; requiere validar acreditación real en Home Banking Macro',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    headerBorderClass: 'border-t-4 border-t-amber-500',
  },
  {
    id: 'cobrada_recibo',
    step: '4',
    title: '4. Cobrada & Recibo en Kipintoch',
    shortTitle: '4. Cobrada / Recibo',
    subtitle: 'Fondos acreditados en Banco Macro, Recibo Oficial emitido en Kipintoch y comisión liberada',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    headerBorderClass: 'border-t-4 border-t-emerald-600',
  },
];

function buildInitialAdminBillingItems(carpetas: CarpetaRecord[]): AdminBillingItem[] {
  const validCarpetas = carpetas
    .filter((c) => {
      const m = (c.numero_carpeta || c.id || '').match(/(\d{3,5})/);
      return !m || parseInt(m[1]!, 10) >= 1379;
    })
    .slice(0, 24);

  return validCarpetas.map((carp, idx) => {
    const quote = getCotizacionByCarpeta(carp);
    const ventaPactadaUsd =
      carp.venta_estimada_total && carp.venta_estimada_total > 0
        ? carp.venta_estimada_total
        : quote?.flete_venta_pactado || 3450;
    const costoConformadoUsd =
      carp.costo_estimado_total && carp.costo_estimado_total > 0
        ? carp.costo_estimado_total
        : quote?.flete_costo_estimado || Math.round(ventaPactadaUsd * 0.68 * 100) / 100;
    const sobrecostoTrasladadoUsd = idx % 5 === 2 ? 145.0 : 0;
    const ventaFinalUsd = Math.round((ventaPactadaUsd + sobrecostoTrasladadoUsd) * 100) / 100;
    const margenNetoUsd = Math.round((ventaFinalUsd - costoConformadoUsd) * 100) / 100;
    const rentabilidadPct =
      ventaFinalUsd > 0 ? Math.round((margenNetoUsd / ventaFinalUsd) * 1000) / 10 : 28.5;

    const stages: AdminBillingStageId[] = [
      'pase_operaciones',
      'factura_emitida',
      'verificacion_macro',
      'cobrada_recibo',
    ];
    const stage = stages[idx % 4]!;
    const folderNum = (carp.numero_carpeta || 'C1868').replace(/\D/g, '') || String(1800 + idx);
    const invoiceNum = `FC-A 0002-0001${folderNum.padStart(4, '0')}`;

    return {
      id: `adm-bill-${carp.id || carp.numero_carpeta || idx}`,
      carpetaId: carp.id,
      numeroCarpeta: carp.numero_carpeta || `C${folderNum}`,
      clienteNombre: carp.cliente_nombre || 'Cliente Corporativo ALMAR',
      clienteCuit: carp.cliente_cuit || '30-71084921-5',
      area: carp.area || 'MARITIMO',
      tipoOperacion: carp.tipo_operacion || 'IMPORTACION',
      ruta: `${carp.origen || 'Shanghai, China'} → ${carp.destino || 'Puerto Rosario (ARROS)'}`,
      hblBooking: carp.hbl_hawb || carp.booking || carp.mbl_mawb || `HBL-ALMR-${folderNum}`,
      operadorNombre: carp.operador_nombre || 'Natali Hermoso',
      cotizacionCodigo:
        carp.cotizacion_codigo || quote?.codigo || `PC2026100000${folderNum.padStart(4, '0')}`,
      vendedorNombre: quote?.responsable_nombre || 'Lucía Laje',
      incoterm: quote?.incoterm || 'FOB',
      ventaPactadaUsd: ventaFinalUsd,
      costoConformadoUsd,
      sobrecostoTrasladadoUsd,
      estadoControlOperativo:
        sobrecostoTrasladadoUsd > 0
          ? `Costos conformados por ${carp.operador_nombre || 'Operaciones'} (+US$ ${sobrecostoTrasladadoUsd.toFixed(2)} demora/THC trasladado a Venta)`
          : `Costos 100% conciliados por ${carp.operador_nombre || 'Operaciones'} sin sobrecostos`,
      margenNetoUsd,
      rentabilidadPct,
      tcOficialBna: 1018.5,
      alicuotaIvaLabel: 'Flete Int. 0% Exento + Gastos Locales 21% Gravado',
      reglaBancariaOk: margenNetoUsd >= 200,
      seguroSancorProvisionUsd: idx % 4 === 1 ? 85.0 : 0,
      stage,
      numeroFacturaVenta: stage !== 'pase_operaciones' ? invoiceNum : undefined,
      fechaEmisionVenta: stage !== 'pase_operaciones' ? '2026-11-02' : undefined,
      fechaVencimientoVenta: stage !== 'pase_operaciones' ? '2026-11-17' : undefined,
      comprobantePagoRef:
        stage === 'verificacion_macro' || stage === 'cobrada_recibo'
          ? `TRB-0761-89${folderNum}/001`
          : undefined,
      cuentaBancoMacro: `CA USD ${BANCO_MACRO_ACCOUNTS.CA_USD.numero}`,
      cbuBancoMacro: BANCO_MACRO_ACCOUNTS.CA_USD.cbu,
      reciboKipintochNumero:
        stage === 'cobrada_recibo' ? `REC-2026-${folderNum.padStart(4, '0')}` : undefined,
      comisionLiberada: stage === 'cobrada_recibo',
    };
  });
}

export interface AdminFacturacionCobranzasBoardProps {
  carpetas: CarpetaRecord[];
  userRole?: UserRole;
  searchQuery?: string;
}

export function AdminFacturacionCobranzasBoard({
  carpetas,
  searchQuery = '',
}: AdminFacturacionCobranzasBoardProps) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<AdminBillingItem[]>(() =>
    buildInitialAdminBillingItems(carpetas)
  );
  const [mobileStage, setMobileStage] = React.useState<AdminBillingStageId>('pase_operaciones');
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<AdminBillingStageId | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (carpetas.length > 0) {
      setItems(buildInitialAdminBillingItems(carpetas));
    }
  }, [carpetas]);

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.numeroCarpeta.toLowerCase().includes(q) ||
        it.clienteNombre.toLowerCase().includes(q) ||
        it.clienteCuit.toLowerCase().includes(q) ||
        it.cotizacionCodigo.toLowerCase().includes(q) ||
        (it.numeroFacturaVenta && it.numeroFacturaVenta.toLowerCase().includes(q)) ||
        (it.reciboKipintochNumero && it.reciboKipintochNumero.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const moveItemToStage = React.useCallback(
    (itemId: string, targetStage: AdminBillingStageId) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const folderDigits = it.numeroCarpeta.replace(/\D/g, '') || '1868';
          const nextInvoice =
            it.numeroFacturaVenta || `FC-A 0002-0001${folderDigits.padStart(4, '0')}`;
          const nextTransferRef =
            it.comprobantePagoRef || `TRB-0761-89${folderDigits}/001`;
          const nextReceipt =
            targetStage === 'cobrada_recibo'
              ? it.reciboKipintochNumero || getNextReceiptNumber()
              : it.reciboKipintochNumero;

          return {
            ...it,
            stage: targetStage,
            numeroFacturaVenta: targetStage !== 'pase_operaciones' ? nextInvoice : it.numeroFacturaVenta,
            fechaEmisionVenta: targetStage !== 'pase_operaciones' ? '2026-11-04' : it.fechaEmisionVenta,
            fechaVencimientoVenta:
              targetStage !== 'pase_operaciones' ? '2026-11-19' : it.fechaVencimientoVenta,
            comprobantePagoRef:
              targetStage === 'verificacion_macro' || targetStage === 'cobrada_recibo'
                ? nextTransferRef
                : it.comprobantePagoRef,
            reciboKipintochNumero: nextReceipt,
            comisionLiberada: targetStage === 'cobrada_recibo',
          };
        })
      );

      const stageInfo = STAGE_META.find((s) => s.id === targetStage);
      if (targetStage === 'factura_emitida') {
        toast.success(
          'Factura de Venta Emitida',
          'Se generó la Factura de Venta AFIP con toda la trazabilidad de la carpeta y pasó a Gestión de Cobro.'
        );
      } else if (targetStage === 'verificacion_macro') {
        toast.info(
          'Comprobante de Pago Registrado',
          'Pendiente de constatación efectiva de fondos en Home Banking de Banco Macro.'
        );
      } else if (targetStage === 'cobrada_recibo') {
        toast.success(
          'Acreditación Banco Macro Confirmada & Recibo Emitido',
          'Se emitió el Recibo Oficial en Kipintoch y se liberó el cierre contable de la carpeta.'
        );
      } else if (stageInfo) {
        toast.info('Etapa actualizada', `Movido a ${stageInfo.title}`);
      }
    },
    [toast]
  );

  const handleCopyKipintochVenta = (it: AdminBillingItem) => {
    const line = `VTA ${it.clienteCuit} ${it.ventaPactadaUsd.toFixed(2)} USD ${it.numeroCarpeta} ${it.numeroFacturaVenta || 'PREFACTURA'} ${it.reciboKipintochNumero || ''}`.trim();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(line).catch(() => {});
    }
    setCopiedId(it.id);
    toast.success(
      'Ficha de Venta / Cobranza copiada para Kipintoch',
      `Copiado al portapapeles: ${line}`
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const counts = React.useMemo(() => {
    const map: Record<AdminBillingStageId, number> = {
      pase_operaciones: 0,
      factura_emitida: 0,
      verificacion_macro: 0,
      cobrada_recibo: 0,
    };
    filteredItems.forEach((it) => {
      map[it.stage] += 1;
    });
    return map;
  }, [filteredItems]);

  return (
    <div className="space-y-4" data-testid="admin-facturacion-cobranzas-board">
      {/* Banner Explicativo del Circuito PO.03 Administración, Facturación y Cobranzas */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0b2545] to-[#0072BC] text-white rounded-xl p-4 shadow-sm border border-sky-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Proceso Oficial PO.03 · Administración y Finanzas
              </span>
              <span className="text-xs text-sky-200 font-medium">
                Stefanía Rossi (Facturación &amp; Cobranzas) · Vanesa Meggiolaro (Dirección Financiera)
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold">
              Emisión de Factura de Venta con Trazabilidad Completa &amp; Conciliación de Cobranzas (Banco Macro)
            </h3>
            <p className="text-xs text-sky-100/90 leading-relaxed max-w-4xl">
              Operaciones controla los sobrecostos de proveedores y entrega la carpeta lista. Desde aquí,{' '}
              <strong>Administración y Finanzas</strong> verifica toda la trazabilidad (Cotización Comercial + Costos Conformados + TC Oficial BNA),{' '}
              <strong>emite la Factura de Venta al cliente</strong> y realiza el seguimiento de <strong>Cobranzas</strong> hasta constatar la acreditación en{' '}
              <strong>Banco Macro</strong> y emitir el <strong>Recibo Oficial en Kipintoch</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px] bg-white/10 px-3 py-2 rounded-lg border border-white/15">
            <Building2 className="h-4 w-4 text-emerald-300 shrink-0" />
            <div>
              <div className="font-semibold text-white">Cuentas Oficiales Banco Macro</div>
              <div className="font-mono text-[10px] text-sky-200">
                CC ARS: {BANCO_MACRO_ACCOUNTS.CC_PESOS.numero} · CA USD: {BANCO_MACRO_ACCOUNTS.CA_USD.numero}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Columnas en Mobile (< 768px) */}
      <div className="grid grid-cols-2 gap-1.5 md:hidden bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
        {STAGE_META.map((stage) => {
          const active = mobileStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setMobileStage(stage.id)}
              className={`px-2.5 py-2 rounded-md text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer border ${
                active
                  ? 'bg-[#0072BC] text-white border-[#0072BC] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{stage.shortTitle}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {counts[stage.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grilla Kanban de 4 Columnas (2x2 en Notebook 1366px, 4 cols en Monitor Grande >=1536px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start">
        {STAGE_META.map((stage) => {
          const stageItems = filteredItems.filter((it) => it.stage === stage.id);
          const isDropTarget = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStage !== stage.id) {
                  setDragOverStage(stage.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverStage === stage.id) {
                  setDragOverStage(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain') || draggedId;
                setDragOverStage(null);
                setDraggedId(null);
                if (id) {
                  moveItemToStage(id, stage.id);
                }
              }}
              className={`${
                mobileStage === stage.id ? 'flex' : 'hidden md:flex'
              } flex-col min-w-0 bg-slate-50/90 rounded-xl border transition-all ${
                stage.headerBorderClass
              } ${
                isDropTarget
                  ? 'border-[#0072BC] ring-2 ring-[#0072BC]/30 bg-sky-50/40'
                  : 'border-slate-200/90'
              }`}
              data-testid={`admin-col-${stage.id}`}
            >
              {/* Encabezado de Columna */}
              <div className="p-3.5 bg-white rounded-t-lg border-b border-slate-200/80">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                    {stage.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full border shrink-0 ${stage.badgeClass}`}
                  >
                    {stageItems.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{stage.subtitle}</p>
              </div>

              {/* Cuerpo de Tarjetas */}
              <div className="p-3 space-y-3 max-h-[680px] overflow-y-auto min-w-0">
                {isDropTarget && (
                  <div className="p-2.5 rounded-lg border-2 border-dashed border-[#0072BC] bg-sky-50/80 text-center text-[11px] font-semibold text-[#0072BC]">
                    Soltar aquí para mover a: {stage.shortTitle}
                  </div>
                )}

                {stageItems.map((it) => (
                  <div
                    key={it.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', it.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedId(it.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverStage(null);
                    }}
                    className={`bg-white rounded-lg border p-3.5 shadow-xs transition-all cursor-grab active:cursor-grabbing min-w-0 space-y-2.5 ${
                      draggedId === it.id
                        ? 'opacity-50 ring-2 ring-[#0072BC] border-[#0072BC]'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                    data-testid={`admin-card-${it.numeroCarpeta}`}
                  >
                    {/* Header: Carpeta, Cotización y Factura Venta */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <Link
                          href={`/carpetas/${encodeURIComponent(it.numeroCarpeta)}`}
                          className="px-2 py-0.5 text-[11px] font-bold font-mono rounded bg-sky-50 text-[#0072BC] border border-sky-200 hover:bg-sky-100 flex items-center gap-1"
                          title="Abrir carpeta operativa y ver toda la trazabilidad"
                        >
                          <span>{it.numeroCarpeta}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                        <Link
                          href={`/cotizaciones?search=${encodeURIComponent(it.cotizacionCodigo)}`}
                          className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 truncate"
                          title="Ver Cotización Comercial Asociada"
                        >
                          {it.cotizacionCodigo}
                        </Link>
                      </div>

                      {it.numeroFacturaVenta ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {it.numeroFacturaVenta}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ Costos Conformados
                        </span>
                      )}
                    </div>

                    {/* Cliente & Operación */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                        {it.clienteNombre}
                      </h4>
                      <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>
                          CUIT: <strong className="font-mono text-slate-800">{it.clienteCuit}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Doc: <strong className="font-mono text-slate-800">{it.hblBooking}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{it.ruta}</div>
                    </div>

                    {/* Caja de Trazabilidad Completa para Facturación (Comercial -> Operativa -> Finanzas) */}
                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200/90 space-y-1.5 text-[11px]">
                      <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="flex items-center gap-1 text-[#0072BC]">
                          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                          <span>Trazabilidad para Factura de Venta</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          TC BNA: ${it.tcOficialBna.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>1. Cotización ({it.vendedorNombre} · {it.incoterm}):</span>
                        <span className="font-mono font-bold text-slate-900">
                          US$ {it.ventaPactadaUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>2. Costos Proveedores ({it.operadorNombre}):</span>
                        <span className="font-mono font-semibold text-slate-800">
                          US$ {it.costoConformadoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {it.sobrecostoTrasladadoUsd > 0 && (
                        <div className="flex items-center justify-between text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10.5px]">
                          <span>+ Sobrecosto trasladado por Operaciones:</span>
                          <span className="font-mono font-bold">
                            +US$ {it.sobrecostoTrasladadoUsd.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-emerald-800">
                        <span>3. Margen Neto Carpeta ({it.rentabilidadPct}%):</span>
                        <span className="font-mono">
                          +US$ {it.margenNetoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-600 pt-0.5 flex flex-wrap items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                          {it.alicuotaIvaLabel}
                        </span>
                        {it.reglaBancariaOk && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                            ✓ Regla 1,2% Bancario OK
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estado de Cobranza / Banco Macro según etapa */}
                    {it.stage === 'factura_emitida' && (
                      <div className="p-2 rounded bg-indigo-50/80 border border-indigo-200 text-[11px] text-indigo-950 space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Factura Emitida: {it.numeroFacturaVenta}</span>
                          <span className="font-mono text-[10px]">Vence: {it.fechaVencimientoVenta}</span>
                        </div>
                        <div className="text-[10.5px] text-indigo-800">
                          Enviada al cliente · Aguardando comprobante de transferencia a Banco Macro.
                        </div>
                      </div>
                    )}

                    {it.stage === 'verificacion_macro' && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-300 text-[11px] text-amber-950 space-y-1">
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span className="flex items-center gap-1">
                            <Landmark className="h-3.5 w-3.5 text-amber-700" />
                            <span>Verificar en Home Banking Macro</span>
                          </span>
                          <span className="font-mono text-[10px]">{it.comprobantePagoRef}</span>
                        </div>
                        <div className="text-[10.5px] text-amber-900">
                          Cuenta destino: <strong className="font-mono">{it.cuentaBancoMacro}</strong>
                        </div>
                      </div>
                    )}

                    {it.stage === 'cobrada_recibo' && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Recibo Kipintoch: {it.reciboKipintochNumero}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950 text-[10px] font-bold">
                            Comisión Liberada
                          </span>
                        </div>
                        <div className="text-[10.5px] text-emerald-800">
                          Acreditado en Banco Macro ({it.comprobantePagoRef}) · Cuenta corriente cerrada.
                        </div>
                      </div>
                    )}

                    {/* Botonera de Acción según etapa */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      {it.stage === 'pase_operaciones' && (
                        <button
                          type="button"
                          onClick={() => moveItemToStage(it.id, 'factura_emitida')}
                          className="w-full py-2 px-2.5 rounded-md bg-[#0072BC] hover:bg-[#005a96] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Emitir Factura de Venta AFIP</span>
                        </button>
                      )}

                      {it.stage === 'factura_emitida' && (
                        <button
                          type="button"
                          onClick={() => moveItemToStage(it.id, 'verificacion_macro')}
                          className="w-full py-2 px-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5 shrink-0" />
                          <span>Registrar Pago Informado por Cliente</span>
                        </button>
                      )}

                      {it.stage === 'verificacion_macro' && (
                        <button
                          type="button"
                          onClick={() => moveItemToStage(it.id, 'cobrada_recibo')}
                          className="w-full py-2 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>Confirmar en Banco Macro &amp; Emitir Recibo</span>
                        </button>
                      )}

                      {it.stage === 'cobrada_recibo' && (
                        <div className="w-full py-1.5 px-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Facturada, Cobrada y Cerrada en Kipintoch</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyKipintochVenta(it)}
                          className="py-1.5 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copiedId === it.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
                              <span className="truncate">Copiar Kipintoch</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/carpetas/${encodeURIComponent(it.numeroCarpeta)}`}
                          className="py-1.5 px-2 rounded-md bg-white hover:bg-slate-50 text-[#0072BC] border border-sky-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <span className="truncate">Ver Carpeta</span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                        </Link>
                      </div>

                      {/* Selector rápido para mover de etapa */}
                      <div className="pt-1 flex items-center justify-between gap-1.5 text-[10.5px] text-slate-500">
                        <span className="font-medium shrink-0">Mover a etapa:</span>
                        <select
                          value={it.stage}
                          onChange={(e) =>
                            moveItemToStage(it.id, e.target.value as AdminBillingStageId)
                          }
                          className="min-w-0 flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-[#0072BC]"
                        >
                          <option value="pase_operaciones">1. Pase de Operaciones (Para Facturar)</option>
                          <option value="factura_emitida">2. Factura de Venta Emitida</option>
                          <option value="verificacion_macro">3. Verificar en Banco Macro</option>
                          <option value="cobrada_recibo">4. Cobrada &amp; Recibo Kipintoch</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
