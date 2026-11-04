'use client';

import * as React from 'react';
import type { CarpetaRecord } from '@/lib/mockData';
import { type UserRole, canAuthorizeRateDeviation } from '@/lib/auth';
import { FiscalBadge } from './FiscalBadge';
import { useToast } from '@/components/ui/ToastProvider';
import {
  formatForKipintoch,
  getModalityLabel,
  type KanbanComprobante,
} from '@/lib/kanban-utils';
import {
  Check,
  Copy,
  Eye,
  ArrowRight,
  AlertTriangle,
  FolderPlus,
  CheckCircle2,
  Ship,
  Plane,
  Truck,
  Package,
  Sparkles,
} from 'lucide-react';
import { deduceFolderForInvoice } from '@/lib/folder-deduction';
import { DeviationApprovalModal } from './DeviationApprovalModal';
import { getCategoriaProveedorLabel, getCategoriaProveedorBadgeClasses } from '@/lib/pa03';

export interface KanbanCardProps {
  comp: KanbanComprobante;
  carpeta?: CarpetaRecord | null;
  carpetas?: CarpetaRecord[];
  userRole?: UserRole;
  onCopyKipintoch?: (text: string) => void;
  onSelectPdf?: (comprobanteId: string) => void;
  onAsentar?: (comprobanteId: string) => void;
  onAssignFolder?: (comprobanteId: string, carpetaId: string) => void;
  onAuthorizeDeviation?: (comprobanteId: string, motivo: string, justificacion: string) => void | Promise<void>;
}

function renderModalityIcon(area?: string | null) {
  const normalized = (area || '').toUpperCase();
  switch (normalized) {
    case 'MARITIMO':
      return <Ship className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />;
    case 'AEREO':
      return <Plane className="h-3.5 w-3.5 text-indigo-600 shrink-0" />;
    case 'TERRESTRE':
      return <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
    case 'DESPACHO':
      return <Package className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
    default:
      return <Package className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
  }
}

export function KanbanCard({
  comp,
  carpeta,
  carpetas = [],
  userRole = 'OPERATIVO',
  onCopyKipintoch,
  onSelectPdf,
  onAsentar,
  onAssignFolder,
  onAuthorizeDeviation,
}: KanbanCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = React.useState(false);
  const [manualFolderCode, setManualFolderCode] = React.useState('');
  const { toast } = useToast();
  const canAuthorize = canAuthorizeRateDeviation(userRole);
  const carpetaCodigo = carpeta?.numero_carpeta || (comp.carpeta_id ? 'C1434' : 'SIN_CARPETA');
  const kipintochString = formatForKipintoch(comp, carpetaCodigo);

  // Modality Area
  const area =
    carpeta?.area ||
    (comp.clasificacion_gasto === 'FIA'
      ? 'AEREO'
      : comp.clasificacion_gasto === 'FTE'
      ? 'TERRESTRE'
      : 'MARITIMO');
  const modalityLabel = getModalityLabel(area);

  // Cost Variance calculation
  // For domestic invoices (e.g. FACTURA_A with 21% IVA), quotes are NET of taxes.
  // Operational cost to compare is subtotal_neto. IVA is a fiscal pass-through / crédito fiscal.
  const operationalCost =
    typeof comp.subtotal_neto === 'number' && comp.subtotal_neto > 0 && comp.monto_iva && comp.monto_iva > 0
      ? comp.subtotal_neto
      : comp.monto_total;

  const estimatedCost = carpeta?.costo_estimado_total || 0;
  const carpMoneda = carpeta?.moneda || (carpeta?.costo_estimado_total !== undefined ? 'USD' : undefined);
  const compMoneda = comp.moneda;
  const sameCurrency = !carpMoneda || !compMoneda || carpMoneda === compMoneda;

  // An overage exists if explicit deviation is set, active alert exists, or operational cost exceeds estimated budget
  const hasVariance = Boolean(
    (typeof comp.desvio_porcentaje === 'number' && comp.desvio_porcentaje > 0) ||
    (typeof (comp as Record<string, unknown>).desviacionPorcentaje === 'number' &&
      ((comp as Record<string, unknown>).desviacionPorcentaje as number) > 0) ||
    comp.alerta_activa === true ||
    (sameCurrency && estimatedCost > 0 && operationalCost > estimatedCost + 1.0)
  );

  const explicitPct =
    typeof comp.desvio_porcentaje === 'number' && comp.desvio_porcentaje > 0
      ? comp.desvio_porcentaje
      : typeof (comp as Record<string, unknown>).desviacionPorcentaje === 'number' &&
        ((comp as Record<string, unknown>).desviacionPorcentaje as number) > 0
      ? ((comp as Record<string, unknown>).desviacionPorcentaje as number)
      : 0;

  const effectiveEstimatedCost =
    sameCurrency && estimatedCost > 0 && estimatedCost < operationalCost
      ? estimatedCost
      : explicitPct > 0
      ? Math.round((operationalCost / (1 + explicitPct / 100)) * 100) / 100
      : estimatedCost;

  const varianceAmount = hasVariance
    ? effectiveEstimatedCost > 0 && operationalCost > effectiveEstimatedCost
      ? operationalCost - effectiveEstimatedCost
      : explicitPct > 0 && effectiveEstimatedCost > 0
      ? (effectiveEstimatedCost * explicitPct) / 100
      : 0
    : 0;

  const variancePct =
    explicitPct > 0
      ? explicitPct.toFixed(1)
      : hasVariance && effectiveEstimatedCost > 0
      ? ((varianceAmount / effectiveEstimatedCost) * 100).toFixed(1)
      : '0.0';

  const isSettled = comp.asentado_en_erp === true || comp.estado_pago === 'PAGADO';

  const isAuthorized =
    (comp as Record<string, unknown>).desvio_autorizado === true ||
    ((comp as Record<string, unknown>).metadata_raw as Record<string, unknown> | undefined)?.desvio_autorizado === true ||
    ((comp as Record<string, unknown>).metadata_extraida as Record<string, unknown> | undefined)?.desvio_autorizado === true;

  const isDeviationLocked = hasVariance && !isAuthorized;

  const smartDeduction = React.useMemo(() => {
    if (comp.carpeta_id) return null;
    return deduceFolderForInvoice(comp, carpetas);
  }, [comp, carpetas]);

  const handleCopy = () => {
    if (isDeviationLocked) {
      toast.error(
        'Desvío no autorizado',
        'Este comprobante requiere autorización del supervisor antes de copiar a Kipintoch.'
      );
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(kipintochString).catch(() => {});
    }
    setCopied(true);
    onCopyKipintoch?.(kipintochString);
    toast.success(
      '¡Datos copiados para Kipintoch!',
      'Cadena formateada lista para pegar en el ERP con Ctrl+V.'
    );
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      className="kanban-card h-auto overflow-visible bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all text-left"
      data-testid={`kanban-card-${comp.id}`}
      data-carpeta={carpetaCodigo}
    >
      {/* Top Header: Folder Tag & Modality Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="px-2 py-0.5 text-xs font-bold rounded font-mono bg-sky-50 text-[#0072BC] border border-sky-200">
          {carpetaCodigo}
        </span>
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          {renderModalityIcon(area)}
          <span>{modalityLabel}</span>
        </span>
      </div>

      {/* Provider & Invoice Number */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-slate-900 leading-snug break-words" title={comp.emisor_razon_social}>
          {comp.emisor_razon_social}
        </h4>
        <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>CUIT: <strong className="font-mono text-slate-800">{comp.emisor_cuit || 'Sin CUIT'}</strong></span>
          <span>•</span>
          <span>N° <strong className="font-mono text-slate-800">{comp.numero_comprobante}</strong></span>
          {carpeta?.booking ? (
            <>
              <span>•</span>
              <span>BL: <strong className="font-mono text-slate-800">{carpeta.booking}</strong></span>
            </>
          ) : null}
        </div>
        <p className="text-xs text-slate-600 italic mt-1.5 leading-snug break-words" title={comp.concepto_gasto}>
          {comp.concepto_gasto}
        </p>
        {comp.categoria_proveedor_pa03 && (
          <div className="mt-1.5">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getCategoriaProveedorBadgeClasses(
                comp.categoria_proveedor_pa03
              )}`}
              data-testid={`pa03-badge-${comp.id}`}
              title="Categoría de Proveedor (Procedimiento PA.03)"
            >
              {getCategoriaProveedorLabel(comp.categoria_proveedor_pa03)}
            </span>
          </div>
        )}
      </div>

      {/* Folder Assignment Quick-Picker for Unassigned / Ingesta Cards */}
      {!comp.carpeta_id && carpetas.length > 0 && (
        <div className="mb-3 space-y-2">
          {smartDeduction && (
            <div
              className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-md space-y-1.5 shadow-2xs"
              data-testid="smart-folder-suggestion"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-950">
                <span className="flex items-center gap-1 text-[#0072BC]">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>{`Sugerencia IA: Carpeta ${smartDeduction.suggestedCarpeta.numero_carpeta}`}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {`${smartDeduction.matchType}: ${smartDeduction.matchedValue}`}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate font-medium">
                {smartDeduction.suggestedCarpeta.cliente_nombre}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignFolder?.(comp.id, smartDeduction.suggestedCarpeta.id);
                  toast.success(
                    'Carpeta vinculada exitosamente',
                    `Comprobante asignado a la carpeta ${smartDeduction.suggestedCarpeta.numero_carpeta} (${smartDeduction.suggestedCarpeta.cliente_nombre}).`
                  );
                }}
                className="btn-vincular-carpeta w-full py-1.5 px-2 bg-[#0072BC] hover:bg-[#005a96] text-white rounded text-[11px] font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                title={`Vincular a carpeta ${smartDeduction.suggestedCarpeta.numero_carpeta}`}
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>Vincular Carpeta</span>
              </button>
            </div>
          )}

          <div className="p-2 bg-sky-50/50 rounded-md border border-sky-200">
            <label className="text-[10px] text-sky-900 font-semibold mb-1 flex items-center gap-1">
              <FolderPlus className="h-3 w-3 text-[#0072BC]" />
              <span>Asignar a Carpeta Operativa:</span>
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onAssignFolder?.(comp.id, e.target.value);
                }
              }}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#0072BC] cursor-pointer"
              aria-label="Asignar carpeta a comprobante"
            >
              <option value="" disabled>
                -- Seleccionar Carpeta --
              </option>
              {carpetas.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.numero_carpeta} - ${c.cliente_nombre} (${c.area})`}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 mt-1.5">
              <input
                type="text"
                placeholder="O ingresar código ej. C1735..."
                value={manualFolderCode}
                onChange={(e) => setManualFolderCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualFolderCode.trim()) {
                    onAssignFolder?.(comp.id, manualFolderCode.trim());
                    setManualFolderCode('');
                  }
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-[#0072BC]"
              />
              <button
                type="button"
                disabled={!manualFolderCode.trim()}
                onClick={() => {
                  if (manualFolderCode.trim()) {
                    onAssignFolder?.(comp.id, manualFolderCode.trim());
                    setManualFolderCode('');
                  }
                }}
                className="px-2 py-0.5 bg-[#0072BC] disabled:opacity-40 text-white rounded text-[11px] font-semibold hover:bg-[#005a96] cursor-pointer"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amount & Fiscal Badge */}
      <div className="pt-2 border-t border-slate-200 mb-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-slate-500 font-medium">Total Comprobante</span>
          <span className="text-base font-bold text-emerald-700 font-mono tracking-tight whitespace-nowrap">
            {comp.moneda} {comp.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {comp.monto_iva && comp.monto_iva > 0 ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <span>Neto: <strong className="text-slate-900">{comp.moneda} {(comp.subtotal_neto ?? comp.monto_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
            <span>•</span>
            <span>IVA ({comp.alicuota_iva}%): <strong className="text-slate-900">{comp.moneda} {comp.monto_iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        ) : null}
        <div className="flex items-center justify-end">
          <FiscalBadge
            categoriaFiscal={comp.categoria_fiscal}
            tipoIva={comp.tipo_iva}
            alicuotaIva={comp.alicuota_iva}
          />
        </div>
      </div>

      {/* Status Alerts & Micro-indicators */}
      {isSettled ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 mb-3 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Asentado y cerrado en Kipintoch</span>
        </div>
      ) : hasVariance ? (
        <div className="bg-amber-50/90 border border-amber-300 rounded-md p-3 mb-3 text-xs text-amber-950 space-y-2.5 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Diferencia de Tarifa Detectada</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-200/90 text-amber-900 border border-amber-300 font-mono whitespace-nowrap shrink-0">
              {`+${variancePct}% Desvío`}
            </span>
          </div>

          {/* Detailed Comparative Breakdown */}
          <div className="space-y-1.5 text-xs bg-white/90 p-2.5 rounded border border-amber-200 font-sans">
            <div className="flex items-center justify-between text-slate-600 gap-2">
              <span>Presupuesto Estimado:</span>
              <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">
                {`${comp.moneda} ${effectiveEstimatedCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 gap-2">
              <span>Facturado por Naviera:</span>
              <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                {`${comp.moneda} ${operationalCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200 font-bold text-rose-700 gap-2">
              <span>Sobrecosto:</span>
              <span className="font-mono font-bold whitespace-nowrap">
                {`+${comp.moneda} ${varianceAmount.toFixed(2)} (+${variancePct}%)`}
              </span>
            </div>
            {comp.metadata_raw && typeof comp.metadata_raw === 'object' && 'motivo_alerta' in comp.metadata_raw && (
              <div className="pt-1.5 text-[11px] text-amber-900 font-medium italic border-t border-amber-100">
                <span>Causa: {String(comp.metadata_raw.motivo_alerta)}</span>
              </div>
            )}
          </div>

          <p className="leading-snug text-slate-700 text-[11px]">
            El monto facturado supera lo presupuestado en la cotización. Requiere autorización del supervisor antes de cargar en Kipintoch.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-amber-200">
            {isAuthorized ? (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                <span>✅ Desvío Autorizado</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-300">
                <span>⏳ Pendiente de Autorización</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {canAuthorize && !isAuthorized && (
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(true)}
                  className="btn-autorizar-carga py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold text-center transition-colors cursor-pointer shadow-xs"
                  title="Autorizar carga a Kipintoch"
                >
                  Autorizar Carga a Kipintoch
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info(
                    'Reclamo registrado',
                    'Reclamo registrado contra naviera / proveedor para conciliación.'
                  );
                }}
                className="btn-reclamar-naviera py-1 px-2 bg-white hover:bg-slate-50 text-rose-700 border border-rose-300 rounded text-[11px] font-semibold text-center transition-colors cursor-pointer"
                title="Reclamar a naviera"
              >
                Reclamar a Naviera
              </button>
            </div>
          </div>
        </div>
      ) : !comp.carpeta_id ? (
        <div className="bg-amber-50 border border-amber-200 rounded px-2.5 py-1 mb-3 text-xs text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Falta asignar carpeta operativa</span>
        </div>
      ) : comp.monto_iva && comp.monto_iva > 0 ? (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded px-2.5 py-1 mb-3 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Conciliado con cotización (Flete neto {comp.moneda} {operationalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
        </div>
      ) : (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded px-2.5 py-1 mb-3 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Monto exacto al cotizado ({comp.moneda} {comp.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
        </div>
      )}

      {/* Botonera de Acciones para Operadores */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        {/* Botón Primario: Copiar para Kipintoch */}
        <button
          type="button"
          disabled={isDeviationLocked}
          className={`btn-copy-kipintoch w-full py-2.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 shadow-xs ${
            isDeviationLocked
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
              : copied
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50 cursor-pointer'
              : 'bg-[#0072BC] hover:bg-[#005a96] text-white hover:shadow-sky-500/20 active:scale-[0.99] cursor-pointer'
          }`}
          onClick={handleCopy}
          data-clipboard={kipintochString}
          title={
            isDeviationLocked
              ? 'Bloqueado: requiere autorización de desvío presupuestario'
              : 'Copiar datos estructurados para Kipintoch ERP'
          }
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-white" />
              <span className="tracking-wide">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-white" />
              <span className="tracking-wide">Copiar para Kipintoch</span>
            </>
          )}
        </button>

        {/* Botones Secundarios: Ver Comprobante & Asentar Costo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-view-pdf py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            onClick={() => onSelectPdf?.(comp.id)}
            title="Inspeccionar comprobante PDF y metadatos"
          >
            <Eye className="h-3.5 w-3.5 text-[#0072BC]" />
            <span>Ver Comprobante</span>
          </button>

          {!isSettled ? (
            <button
              type="button"
              disabled={isDeviationLocked}
              className={`btn-asentar py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border ${
                isDeviationLocked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 cursor-pointer'
              }`}
              onClick={() => {
                if (isDeviationLocked) {
                  toast.error(
                    'Desvío no autorizado',
                    'Este comprobante requiere autorización del supervisor antes de asentar el costo.'
                  );
                  return;
                }
                onAsentar?.(comp.id);
                toast.success(
                  'Comprobante marcado como asentado',
                  `N° ${comp.numero_comprobante} asentado en Kipintoch ERP.`
                );
              }}
              title={
                isDeviationLocked
                  ? 'Bloqueado: requiere autorización de desvío presupuestario antes de asentar el costo'
                  : 'Asentar costo en Kipintoch ERP'
              }
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Asentar Costo</span>
            </button>
          ) : (
            <span className="py-1.5 px-2 bg-slate-100 text-slate-500 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Asentado en ERP</span>
            </span>
          )}
        </div>
      </div>

      {/* ISO 9001 Deviation Approval Modal */}
      <DeviationApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        comprobante={comp}
        carpeta={carpeta}
        onConfirm={async (motivo, justificacion) => {
          await onAuthorizeDeviation?.(comp.id, motivo, justificacion);
          toast.success(
            'Desvío autorizado',
            `Desvío autorizado para carga en Kipintoch ERP (${motivo}).`
          );
          setIsApprovalModalOpen(false);
        }}
      />
    </div>
  );
}
