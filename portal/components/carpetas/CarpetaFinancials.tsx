'use client';

import * as React from 'react';
import type { CarpetaRecord, ComprobanteRecord } from '@/lib/mockData';
import { useAuth } from '@/components/auth/RoleGuard';
import { canViewFolderFinancials } from '@/lib/auth';
import { getCotizacionByCarpeta } from '@/lib/carpetasCotizacionesMap';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  ShieldAlert,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

export interface CarpetaFinancialsProps {
  carpeta: CarpetaRecord;
  comprobantes?: ComprobanteRecord[];
}

export function CarpetaFinancials({
  carpeta,
  comprobantes = [],
}: CarpetaFinancialsProps) {
  const { role } = useAuth();

  const folderId = carpeta.id;
  const folderCode = carpeta.numero_carpeta?.toUpperCase();
  const folderInternal = carpeta.numero_interno?.toUpperCase();

  const purchaseComprobantes = React.useMemo(() => {
    return comprobantes.filter(
      (c) =>
        c.direccion === 'COMPRA' &&
        (!c.carpeta_id ||
          c.carpeta_id === folderId ||
          c.carpeta_id.toUpperCase() === folderCode ||
          (folderInternal && c.carpeta_id.toUpperCase() === folderInternal))
    );
  }, [comprobantes, folderId, folderCode, folderInternal]);

  const OPERATIONAL_ARS_USD_RATE = 1250.0;
  const isArsFolder = carpeta.moneda === 'ARS';

  const getCompRealMonto = (c: ComprobanteRecord) => {
    const voucherMoneda = (c.moneda || 'USD').toUpperCase();
    if (isArsFolder) {
      return voucherMoneda === 'ARS'
        ? (c.monto_total || c.subtotal_neto || 0)
        : (c.subtotal_neto || c.monto_total || 0) * OPERATIONAL_ARS_USD_RATE;
    } else {
      return voucherMoneda === 'ARS'
        ? (c.monto_total || c.subtotal_neto || 0) / OPERATIONAL_ARS_USD_RATE
        : (c.subtotal_neto || c.monto_total || 0);
    }
  };

  const totalInvoicedPurchases = purchaseComprobantes.reduce((sum, c) => sum + getCompRealMonto(c), 0);

  const cotizacion = getCotizacionByCarpeta(
    carpeta.numero_carpeta,
    carpeta as { cotizacion_vinculada?: ReturnType<typeof getCotizacionByCarpeta> }
  );

  const rawCost = Number(carpeta.costo_estimado_total ?? 0);
  const cost =
    rawCost > 0
      ? rawCost
      : totalInvoicedPurchases > 0
        ? totalInvoicedPurchases
        : cotizacion
          ? cotizacion.flete_costo_estimado > 0
            ? cotizacion.flete_costo_estimado
            : Math.max(0, cotizacion.flete_venta_pactado - cotizacion.margen_proyectado)
          : 0;
  const rawSale = Number(carpeta.venta_estimada_total ?? 0);
  const sale = rawSale > 0 ? rawSale : (cotizacion?.flete_venta_pactado ?? 0);
  const rawMargin = Number(carpeta.margen_estimado ?? 0);
  const margin =
    rawMargin !== 0
      ? rawMargin
      : sale > 0
        ? Number((sale - cost).toFixed(2))
        : (cotizacion?.margen_proyectado ?? 0);
  const marginPercent = sale > 0 ? ((margin / sale) * 100).toFixed(1) : '0';
  const marginPctNum = sale > 0 ? (margin / sale) * 100 : 0;
  const isMaritimo = carpeta.area === 'MARITIMO';
  const hasFinancialAccess = role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
  const minMarginThreshold = isArsFolder ? 200 * OPERATIONAL_ARS_USD_RATE : 200;
  const isCriticalMargin = isMaritimo && (margin < minMarginThreshold || marginPctNum < 5.0) && hasFinancialAccess;

  interface ReconciledRow {
    id: string;
    comprobanteEstimado: string;
    proveedor: string;
    fechaEvento: string;
    moneda: string;
    montoEstimado: number;
    montoRealFacturado: number | null;
    comprobanteRealNumero: string | null;
    desvioUsd: number;
    estado: 'CONCILIADO_EXACTO' | 'CONCILIADO_CON_DESVIO' | 'PENDIENTE_FACTURA';
  }

  const reconciledRows: ReconciledRow[] = React.useMemo(() => {
    // 1. If explicit costos_estimados array exists from LiveStore
    if (carpeta.costos_estimados && carpeta.costos_estimados.length > 0) {
      return carpeta.costos_estimados.map((item, idx) => {
        const provName =
          item.proveedor_nombre ||
          (item as unknown as { proveedor?: string }).proveedor ||
          carpeta.transportista_nombre ||
          'Proveedor Logístico';
        const matchingComp = purchaseComprobantes[idx] || purchaseComprobantes.find(
          (c) =>
            (item.comprobante_real_id && c.id === item.comprobante_real_id) ||
            (c.emisor_razon_social && provName &&
             (c.emisor_razon_social.toLowerCase().includes(provName.toLowerCase()) ||
              provName.toLowerCase().includes(c.emisor_razon_social.toLowerCase())))
        );

        const realMonto = matchingComp ? getCompRealMonto(matchingComp) : (item.monto_real_facturado_usd ?? null);
        const estMonto = Number(item.monto_usd || item.monto || 0);
        let desvio = item.desvio_usd !== undefined ? item.desvio_usd : 0;
        let estado = item.estado_conciliacion;

        if (realMonto !== null) {
          if (item.desvio_usd === undefined) {
            desvio = realMonto - estMonto;
          }
          if (!estado) {
            estado = Math.abs(desvio) < 0.01 ? 'CONCILIADO_EXACTO' : 'CONCILIADO_CON_DESVIO';
          }
        } else {
          estado = estado || 'PENDIENTE_FACTURA';
        }

        const compEstLabel =
          item.comprobante_estimado ||
          (item.tipo_comprobante && item.numero_estimado
            ? `${item.tipo_comprobante} ${item.numero_estimado}`
            : (item as unknown as { concepto?: string }).concepto || `FCE 0001-0000${6050 + idx}`);

        return {
          id: item.id || `cost-est-${idx}`,
          comprobanteEstimado: compEstLabel,
          proveedor: provName,
          fechaEvento: item.fecha_evento || carpeta.etd || carpeta.created_at?.slice(0, 10) || '2026-10-15',
          moneda: item.moneda || carpeta.moneda || 'USD',
          montoEstimado: estMonto,
          montoRealFacturado: realMonto,
          comprobanteRealNumero: matchingComp ? matchingComp.numero_comprobante : null,
          desvioUsd: desvio,
          estado: estado as 'CONCILIADO_EXACTO' | 'CONCILIADO_CON_DESVIO' | 'PENDIENTE_FACTURA',
        };
      });
    }

    // 2. If costos_estimados_kipin exists
    if (carpeta.costos_estimados_kipin && carpeta.costos_estimados_kipin.length > 0) {
      return carpeta.costos_estimados_kipin.map((item, idx) => {
        const matchingComp = purchaseComprobantes[idx] || purchaseComprobantes.find(
          (c) =>
            c.emisor_razon_social && item.proveedor &&
            (c.emisor_razon_social.toLowerCase().includes(item.proveedor.toLowerCase()) ||
             item.proveedor.toLowerCase().includes(c.emisor_razon_social.toLowerCase()))
        );
        const realMonto = matchingComp ? getCompRealMonto(matchingComp) : null;
        const desvio = realMonto !== null ? realMonto - item.total : 0;
        const estado: 'CONCILIADO_EXACTO' | 'CONCILIADO_CON_DESVIO' | 'PENDIENTE_FACTURA' =
          realMonto === null
            ? 'PENDIENTE_FACTURA'
            : Math.abs(desvio) < 0.01
            ? 'CONCILIADO_EXACTO'
            : 'CONCILIADO_CON_DESVIO';

        return {
          id: `kipin-${idx}`,
          comprobanteEstimado: item.comprobante_estimado,
          proveedor: item.proveedor,
          fechaEvento: item.fecha_evento,
          moneda: item.moneda || 'USD',
          montoEstimado: item.total,
          montoRealFacturado: realMonto,
          comprobanteRealNumero: matchingComp ? matchingComp.numero_comprobante : null,
          desvioUsd: desvio,
          estado,
        };
      });
    }

    // 3. Fallback: if there are purchase comprobantes or cost > 0
    if (cost > 0 || purchaseComprobantes.length > 0) {
      const primaryComp = purchaseComprobantes[0];
      const realMonto = primaryComp ? getCompRealMonto(primaryComp) : null;
      const desvio = realMonto !== null ? realMonto - cost : (carpeta.desvio_costo_usd ?? 0);
      const estado: 'CONCILIADO_EXACTO' | 'CONCILIADO_CON_DESVIO' | 'PENDIENTE_FACTURA' =
        realMonto === null
          ? 'PENDIENTE_FACTURA'
          : Math.abs(desvio) < 0.01
          ? 'CONCILIADO_EXACTO'
          : 'CONCILIADO_CON_DESVIO';

      return [
        {
          id: 'est-cost-default',
          comprobanteEstimado: primaryComp ? `FC ${primaryComp.numero_comprobante}` : 'FCE 0001-00006051',
          proveedor: primaryComp ? primaryComp.emisor_razon_social : (carpeta.transportista_nombre || 'Proveedor Logístico Principal'),
          fechaEvento: carpeta.etd || '2026-10-15',
          moneda: carpeta.moneda || 'USD',
          montoEstimado: cost,
          montoRealFacturado: realMonto,
          comprobanteRealNumero: primaryComp ? primaryComp.numero_comprobante : null,
          desvioUsd: desvio,
          estado,
        },
      ];
    }

    return [];
  }, [carpeta, cost, purchaseComprobantes]);

  const totalCostosEstimados = reconciledRows.reduce((sum, r) => sum + r.montoEstimado, 0);
  const totalFacturadoReal = purchaseComprobantes.reduce((sum, c) => sum + getCompRealMonto(c), 0);
  const totalDesvio =
    carpeta.desvio_costo_usd !== undefined
      ? carpeta.desvio_costo_usd
      : (totalFacturadoReal > 0 ? totalFacturadoReal - totalCostosEstimados : 0);

  const purchasesUsd = React.useMemo(() => {
    return purchaseComprobantes
      .filter((c) => (c.moneda || 'USD').toUpperCase() === 'USD')
      .reduce((sum, c) => sum + (c.subtotal_neto || c.monto_total || 0), 0);
  }, [purchaseComprobantes]);

  const purchasesArs = React.useMemo(() => {
    return purchaseComprobantes
      .filter((c) => (c.moneda || 'USD').toUpperCase() === 'ARS')
      .reduce((sum, c) => sum + (c.monto_total || c.subtotal_neto || 0), 0);
  }, [purchaseComprobantes]);

  const renderReconciliationBadge = (estado: ReconciledRow['estado']) => {
    switch (estado) {
      case 'CONCILIADO_EXACTO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>✓ CONCILIADO EXACTO</span>
          </span>
        );
      case 'CONCILIADO_CON_DESVIO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>⚠ CONCILIADO CON DESVÍO</span>
          </span>
        );
      case 'PENDIENTE_FACTURA':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>⏳ PENDIENTE FACTURA</span>
          </span>
        );
    }
  };

  if (!canViewFolderFinancials(role)) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-8 text-center shadow-enterprise">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Información Financiera Restringida
        </h3>
        <p className="mt-2 text-xs text-slate-600 max-w-lg mx-auto">
          Inicie sesión con un rol autorizado para consultar los costos y márgenes de la carpeta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vanesa Meggiolaro Directive: Critical Margin Alert in Maritime (< USD 200 / 5%) */}
      {isCriticalMargin && (
        <div
          className="rounded-xl border border-rose-300 bg-rose-50/90 p-4.5 flex items-start gap-3 shadow-enterprise"
          data-testid="alerta-margen-critico"
        >
          <div className="rounded-lg bg-rose-100 p-2 text-rose-700 shrink-0 border border-rose-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                {isArsFolder
                  ? 'ALERTA DE MARGEN OPERATIVO MÍNIMO (< ARS 250.000)'
                  : 'ALERTA DE MARGEN OPERATIVO MÍNIMO (< USD 200)'}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-900 border border-rose-300">
                {isArsFolder
                  ? 'Margen < ARS 250.000 / 5%'
                  : 'Margen < USD 200 / 5%'}
              </span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              El margen neto estimado de esta operación marítima es de{' '}
              <strong className="font-mono font-bold">{formatCurrency(margin, carpeta.moneda)}</strong> ({marginPercent}%),
              lo cual infringe el umbral mínimo de rentabilidad operativa. Cualquier recargo imprevisto de terminal, estadía
              o demora de libre deuda convertirá la operación en quebranto. <strong>Requiere intervención inmediata de Finanzas y Dirección Comercial.</strong>
            </p>
          </div>
        </div>
      )}

      {/* KPI Financial Cards - C-Level Enterprise */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cost Card */}
        <Card className="border-slate-200 bg-white shadow-enterprise">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-600">Costo Operativo Est.</span>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-1.5 text-rose-700">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(cost, carpeta.moneda)}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Compras facturadas:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(totalInvoicedPurchases, carpeta.moneda)}</span>
            </div>
            {(purchasesUsd > 0 || purchasesArs > 0) && (
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>USD {purchasesUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>•</span>
                <span>ARS {purchasesArs.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sale Card */}
        <Card className="border-slate-200 bg-white shadow-enterprise">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-600">Venta Cotizada</span>
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-1.5 text-[#0072BC]">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(sale, carpeta.moneda)}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Tarifa acordada con cliente</span>
              <span className="font-semibold text-slate-700 font-mono">{carpeta.moneda || 'USD'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Margin Card */}
        <Card className="border-slate-200 bg-white shadow-enterprise">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-600">Margen Bruto</span>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-1.5 text-emerald-700">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {formatCurrency(margin, carpeta.moneda)}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Rentabilidad neta estimada</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {margin > 0 ? `+${formatCurrency(margin, carpeta.moneda)}` : formatCurrency(margin, carpeta.moneda)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Margin % Card */}
        <Card className="border-slate-200 bg-white shadow-enterprise">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-600">Rentabilidad %</span>
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-1.5 text-indigo-700">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-indigo-700 font-mono tracking-tight">
              {marginPercent}%
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Ratio sobre total de venta</span>
              <span className="font-semibold text-indigo-700 font-mono">{marginPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conciliación de Costos Estimados Kipintoch Card */}
      <Card className="border-slate-200 bg-white shadow-enterprise" data-testid="card-conciliacion-costos-kipintoch">
        <CardHeader className="pb-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Receipt className="h-4 w-4 text-[#0072BC]" />
              <span>Conciliación de Costos Estimados Kipintoch (FCA/FCE) vs. Facturas Reales</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                INGRESO DE COSTO FCA/FCE
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Comprobante Estimado</th>
                  <th className="py-2.5 px-3">Proveedor</th>
                  <th className="py-2.5 px-3">Fecha Evento</th>
                  <th className="py-2.5 px-3 text-right">Costo Estimado</th>
                  <th className="py-2.5 px-3 text-right">Factura Real</th>
                  <th className="py-2.5 px-3 text-right">{`Desvío (${carpeta.moneda || 'USD'})`}</th>
                  <th className="py-2.5 px-3 text-center">Estado Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reconciledRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No hay costos estimados registrados para esta carpeta.
                    </td>
                  </tr>
                ) : (
                  reconciledRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {row.comprobanteEstimado}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {row.proveedor}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {formatDate(row.fechaEvento)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(row.montoEstimado, row.moneda)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {row.montoRealFacturado !== null ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(row.montoRealFacturado, row.moneda)}
                            </span>
                            {row.comprobanteRealNumero && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {row.comprobanteRealNumero}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pendiente Factura</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {row.montoRealFacturado === null ? (
                          <span className="text-slate-400">-</span>
                        ) : Math.abs(row.desvioUsd) < 0.01 ? (
                          <span className="text-emerald-700">{formatCurrency(0, row.moneda || carpeta.moneda || 'USD')}</span>
                        ) : row.desvioUsd > 0 ? (
                          <span className="text-amber-700">+{formatCurrency(row.desvioUsd, row.moneda || carpeta.moneda || 'USD')}</span>
                        ) : (
                          <span className="text-emerald-700">-{formatCurrency(Math.abs(row.desvioUsd), row.moneda || carpeta.moneda || 'USD')}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {renderReconciliationBadge(row.estado)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Reconciliation Footprint / Segregated Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div>
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Total Estimado (FCA/FCE):</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {formatCurrency(totalCostosEstimados, carpeta.moneda || 'USD')}
                </span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Total Facturado Proveedores:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {formatCurrency(totalFacturadoReal, carpeta.moneda || 'USD')}
                </span>
              </div>
              {(purchasesUsd > 0 || purchasesArs > 0) && (
                <>
                  <div className="hidden sm:block h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Segregación Moneda:</span>
                    <span className="font-mono text-slate-700 text-xs">
                      USD {purchasesUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })} | ARS {purchasesArs.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-[11px]">Desvío Acumulado:</span>
              <span className={`px-2.5 py-1 rounded-md font-mono font-black text-xs ${
                Math.abs(totalDesvio) < 0.01
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : totalDesvio > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {totalDesvio > 0 ? `+${formatCurrency(totalDesvio, carpeta.moneda || 'USD')}` : formatCurrency(totalDesvio, carpeta.moneda || 'USD')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Summary */}
      <Card className="border-slate-200 bg-white shadow-enterprise">
        <CardHeader className="pb-3 border-b border-slate-200">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
            <CreditCard className="h-4 w-4 text-[#0072BC]" />
            <span>Liquidación Financiera &amp; Conciliación con Kipintoch ERP</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Cierre Operativo:</span>
                <span className="text-slate-500">Validación de todos los tramos logísticos y cumplidos aduaneros.</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                carpeta.cierre_operativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {carpeta.cierre_operativo ? 'Completado' : 'Pendiente'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Cierre Contable Kipintoch:</span>
                <span className="text-slate-500">Asentado de todas las facturas de proveedores y liquidación de impuestos.</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                carpeta.cierre_contable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {carpeta.cierre_contable ? 'Conciliado' : 'En Curso'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
