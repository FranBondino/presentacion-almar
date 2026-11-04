'use client';

import * as React from 'react';
import type { CarpetaRecord } from '@/lib/mockData';
import { canApproveDeviation, type UserRole } from '@/lib/auth';
import { KanbanColumn } from './KanbanColumn';
import {
  classifyKanbanColumn,
  hasSignificantDeviation,
  isDeviationAuthorized,
  type KanbanColumnId,
  type KanbanComprobante,
} from '@/lib/kanban-utils';
import {
  Inbox,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  ArrowRightLeft,
  FolderOpen,
  X,
} from 'lucide-react';

export interface KanbanBoardProps {
  comprobantes: KanbanComprobante[];
  carpetas: CarpetaRecord[];
  onCopyKipintoch?: (text: string) => void;
  onSelectPdf?: (comprobanteId: string) => void;
  onAsentar?: (comprobanteId: string) => void;
  onAssignFolder?: (comprobanteId: string, carpetaId: string) => void;
  onAuthorizeDeviation?: (comprobanteId: string, motivo: string, justificacion: string) => void | Promise<void>;
  onUpdateComprobante?: (comprobanteId: string, updates: Partial<KanbanComprobante>) => void | Promise<void>;
  userRole?: UserRole;
}

export function KanbanBoard({
  comprobantes,
  carpetas,
  onCopyKipintoch,
  onSelectPdf,
  onAsentar,
  onAssignFolder,
  onAuthorizeDeviation,
  onUpdateComprobante,
  userRole = 'OPERATIVO',
}: KanbanBoardProps) {
  const [draggingCardId, setDraggingCardId] = React.useState<string | null>(null);
  const [approvalModalCardId, setApprovalModalCardId] = React.useState<string | null>(null);
  const [mobileColumnFilter, setMobileColumnFilter] = React.useState<KanbanColumnId | 'ALL'>('ALL');
  const [pendingFolderAssign, setPendingFolderAssign] = React.useState<{
    comprobanteId: string;
    targetColumn: KanbanColumnId;
  } | null>(null);
  const [modalSelectedCarpeta, setModalSelectedCarpeta] = React.useState<string>('');
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

  const showFeedback = React.useCallback((msg: string) => {
    setStatusFeedback(msg);
    const timer = setTimeout(() => {
      setStatusFeedback((prev) => (prev === msg ? null : prev));
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Index folders by both ID and numero_carpeta so all references resolve cleanly
  const carpetasMap = React.useMemo(() => {
    const map = new Map<string, CarpetaRecord>();
    carpetas.forEach((c) => {
      map.set(c.id, c);
      if (c.numero_carpeta) {
        map.set(c.numero_carpeta, c);
        map.set(c.numero_carpeta.toUpperCase(), c);
      }
    });
    return map;
  }, [carpetas]);

  // Group comprobantes deterministically by classified column
  const columns = React.useMemo<Record<KanbanColumnId, KanbanComprobante[]>>(() => {
    const buckets: Record<KanbanColumnId, KanbanComprobante[]> = {
      ingesta: [],
      listas: [],
      desvios: [],
      asentadas: [],
    };

    comprobantes.forEach((comp) => {
      const rawCode = (comp as Record<string, unknown>).carpeta_codigo as string | undefined;
      const carpeta =
        (comp.carpeta_id ? carpetasMap.get(comp.carpeta_id) : null) ||
        (rawCode ? carpetasMap.get(rawCode) : null) ||
        null;
      const colId: KanbanColumnId = classifyKanbanColumn(comp, carpeta);
      buckets[colId].push(comp);
    });

    return buckets;
  }, [comprobantes, carpetasMap]);

  const handleDragStartCard = React.useCallback((comprobanteId: string) => {
    setDraggingCardId(comprobanteId);
  }, []);

  const handleDragEndCard = React.useCallback(() => {
    setDraggingCardId(null);
  }, []);

  const handleMoveCardToColumn = React.useCallback(
    (comprobanteId: string, targetColumn: KanbanColumnId) => {
      setDraggingCardId(null);
      const comp = comprobantes.find((c) => c.id === comprobanteId);
      if (!comp) return;

      const rawCode = (comp as Record<string, unknown>).carpeta_codigo as string | undefined;
      const carpeta =
        (comp.carpeta_id ? carpetasMap.get(comp.carpeta_id) : null) ||
        (rawCode ? carpetasMap.get(rawCode) : null) ||
        null;
      const currentColumn = classifyKanbanColumn(comp, carpeta);
      if (currentColumn === targetColumn) return;

      // 1. Target: INGESTA (Unassign folder & reopen)
      if (targetColumn === 'ingesta') {
        if (onUpdateComprobante) {
          onUpdateComprobante(comp.id, {
            carpeta_id: null,
            asentado_en_erp: false,
            estado_pago: 'PENDIENTE',
          });
          showFeedback(`Comprobante ${comp.numero_comprobante} devuelto a 1. Ingesta (Mails).`);
        }
        return;
      }

      // If card has no folder yet and user drags it to Listas / Desvíos / Asentadas, open quick folder selector modal
      if (!comp.carpeta_id || comp.carpeta_id.trim() === '') {
        setModalSelectedCarpeta(carpetas[0]?.id || '');
        setPendingFolderAssign({ comprobanteId: comp.id, targetColumn });
        return;
      }

      // 2. Target: LISTAS KIPINTOCH
      if (targetColumn === 'listas') {
        if (currentColumn === 'desvios' && hasSignificantDeviation(comp) && !isDeviationAuthorized(comp)) {
          if (canApproveDeviation(userRole)) {
            setApprovalModalCardId(comp.id);
            showFeedback(`Autorizá el desvío de tarifa de ${comp.emisor_razon_social} para pasar a Listas Kipintoch.`);
          } else if (onUpdateComprobante) {
            onUpdateComprobante(comp.id, {
              desvio_autorizado: true,
              asentado_en_erp: false,
              estado_pago: 'APROBADO',
            });
            showFeedback(`Comprobante ${comp.numero_comprobante} movido a 2. Listas Kipintoch.`);
          }
          return;
        }

        if (onUpdateComprobante) {
          onUpdateComprobante(comp.id, {
            asentado_en_erp: false,
            estado_pago: 'APROBADO',
            desvio_autorizado: hasSignificantDeviation(comp) ? true : comp.desvio_autorizado,
          });
          showFeedback(`Comprobante ${comp.numero_comprobante} listo en 2. Listas Kipintoch.`);
        }
        return;
      }

      // 3. Target: CON DESVÍO DE TARIFA
      if (targetColumn === 'desvios') {
        if (onUpdateComprobante) {
          const currentDev = typeof comp.desvio_porcentaje === 'number' ? Math.abs(comp.desvio_porcentaje) : 0;
          onUpdateComprobante(comp.id, {
            asentado_en_erp: false,
            estado_pago: 'OBSERVADO',
            desvio_autorizado: false,
            desvio_porcentaje: currentDev > 5 ? comp.desvio_porcentaje : 10,
          });
          showFeedback(`Comprobante ${comp.numero_comprobante} marcado en 3. Con Desvío de Tarifa para revisión.`);
        }
        return;
      }

      // 4. Target: ASENTADAS EN ERP
      if (targetColumn === 'asentadas') {
        if (currentColumn === 'desvios' && hasSignificantDeviation(comp) && !isDeviationAuthorized(comp)) {
          if (canApproveDeviation(userRole)) {
            setApprovalModalCardId(comp.id);
            showFeedback(`El comprobante tiene un desvío sin autorizar. Aprobalo primero antes de asentar en ERP.`);
            return;
          }
        }
        if (onAsentar) {
          onAsentar(comp.id);
          showFeedback(`Comprobante ${comp.numero_comprobante} asentado en 4. Asentadas en ERP.`);
        } else if (onUpdateComprobante) {
          onUpdateComprobante(comp.id, {
            asentado_en_erp: true,
            estado_pago: 'PAGADO',
          });
          showFeedback(`Comprobante ${comp.numero_comprobante} asentado en 4. Asentadas en ERP.`);
        }
      }
    },
    [comprobantes, carpetasMap, carpetas, onUpdateComprobante, onAsentar, userRole, showFeedback]
  );

  const handleConfirmPendingFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFolderAssign || !modalSelectedCarpeta.trim()) return;
    const { comprobanteId, targetColumn } = pendingFolderAssign;
    const folderId = modalSelectedCarpeta.trim();

    if (onAssignFolder) {
      onAssignFolder(comprobanteId, folderId);
    }
    if (targetColumn === 'asentadas' && onAsentar) {
      onAsentar(comprobanteId);
    } else if (targetColumn === 'desvios' && onUpdateComprobante) {
      onUpdateComprobante(comprobanteId, {
        carpeta_id: folderId,
        estado_pago: 'OBSERVADO',
        desvio_autorizado: false,
        desvio_porcentaje: 10,
      });
    }
    showFeedback(`Carpeta asignada y comprobante movido a la etapa seleccionada.`);
    setPendingFolderAssign(null);
    setModalSelectedCarpeta('');
  };

  const columnHeaders: Array<{
    id: KanbanColumnId;
    shortTitle: string;
    title: string;
    icon: React.ReactNode;
    subtitle: string;
    color: string;
  }> = [
    {
      id: 'ingesta',
      shortTitle: '1. Ingesta',
      title: '1. Ingesta (Mails)',
      icon: <Inbox className="h-4 w-4 text-[#0072BC] shrink-0" />,
      subtitle: 'Llegaron por email, falta asignarles carpeta',
      color: 'border-sky-500',
    },
    {
      id: 'listas',
      shortTitle: '2. Listas',
      title: '2. Listas Kipintoch',
      icon: <FileCheck className="h-4 w-4 text-[#0072BC] shrink-0" />,
      subtitle: 'Revisados y listos para cargar al sistema',
      color: 'border-[#0072BC]',
    },
    {
      id: 'desvios',
      shortTitle: '3. Desvíos',
      title: '3. Con Desvío de Tarifa',
      icon: <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />,
      subtitle: 'El monto no coincide con la cotización',
      color: 'border-amber-500',
    },
    {
      id: 'asentadas',
      shortTitle: '4. Asentadas',
      title: '4. Asentadas en ERP',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
      subtitle: 'Asentados y cerrados correctamente',
      color: 'border-emerald-500',
    },
  ];

  return (
    <div className="kanban-board-container w-full pb-4 space-y-2.5">
      {/* Interactive Drag & Drop + Mobile Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 rounded-lg bg-slate-100/90 border border-slate-200/90 text-xs text-slate-600">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700 shrink-0 shadow-2xs">
            <GripVertical className="h-3.5 w-3.5 text-[#0072BC]" />
            <span>Drag &amp; Drop Activo</span>
          </span>
          <span className="text-[11px] text-slate-600 leading-snug">
            Arrastrá cualquier comprobante entre las 4 columnas o usá el selector{' '}
            <strong className="text-slate-800 font-semibold inline-flex items-center gap-0.5">
              <ArrowRightLeft className="h-3 w-3 inline text-[#0072BC]" /> Mover a etapa
            </strong>{' '}
            al pie de cada tarjeta.
          </span>
        </div>

        {statusFeedback && (
          <div
            className="px-2.5 py-1 rounded bg-[#0072BC] text-white text-[11px] font-semibold shadow-xs shrink-0 animate-fade-in"
            role="status"
            data-testid="kanban-move-feedback"
          >
            {statusFeedback}
          </div>
        )}
      </div>

      {/* Mobile Stage Tabs (< 768px) for effortless single-column or all-column viewing on phones */}
      <div
        className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        data-testid="kanban-mobile-tabs"
      >
        <button
          type="button"
          onClick={() => setMobileColumnFilter('ALL')}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-colors ${
            mobileColumnFilter === 'ALL'
              ? 'bg-[#0072BC] text-white border-[#0072BC]'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          Todas ({comprobantes.length})
        </button>
        {columnHeaders.map((col) => (
          <button
            key={col.id}
            type="button"
            onClick={() => setMobileColumnFilter(col.id)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-colors flex items-center gap-1 ${
              mobileColumnFilter === col.id
                ? 'bg-[#0072BC] text-white border-[#0072BC]'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            <span>{col.shortTitle}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                mobileColumnFilter === col.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {columns[col.id].length}
            </span>
          </button>
        ))}
      </div>

      {/* Responsive 4-Column Grid: 1 col on mobile, 2 cols on tablet, 4 non-overlapping cols on desktop */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-3 bg-slate-50/80 min-h-[560px] rounded-xl border border-slate-200 items-start"
        data-testid="kanban-board"
      >
        {columnHeaders.map((col) => {
          const isHiddenOnMobile =
            mobileColumnFilter !== 'ALL' && mobileColumnFilter !== col.id;
          return (
            <div
              key={col.id}
              className={`min-w-0 w-full ${isHiddenOnMobile ? 'hidden md:block' : 'block'}`}
            >
              <KanbanColumn
                id={col.id}
                title={col.title}
                icon={col.icon}
                subtitle={col.subtitle}
                color={col.color}
                comprobantes={columns[col.id]}
                carpetasMap={carpetasMap}
                carpetas={carpetas}
                userRole={userRole}
                draggingCardId={draggingCardId}
                approvalModalCardId={approvalModalCardId}
                onExternalApprovalModalClosed={() => setApprovalModalCardId(null)}
                onCopyKipintoch={onCopyKipintoch}
                onSelectPdf={onSelectPdf}
                onAsentar={onAsentar}
                onAssignFolder={onAssignFolder}
                onAuthorizeDeviation={onAuthorizeDeviation}
                onDragStartCard={handleDragStartCard}
                onDragEndCard={handleDragEndCard}
                onDropCardOnColumn={handleMoveCardToColumn}
                onMoveToColumn={handleMoveCardToColumn}
              />
            </div>
          );
        })}
      </div>

      {/* Quick Folder Assignment Modal when dragging an unassigned card from Column 1 to Columns 2/3/4 */}
      {pendingFolderAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          data-testid="kanban-drag-assign-folder-modal"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-50 text-[#0072BC]">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Vincular Carpeta Operativa
                  </h4>
                  <p className="text-xs text-slate-500">
                    Para avanzar este comprobante de 1. Ingesta, seleccioná su carpeta operativa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingFolderAssign(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPendingFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Carpeta Operativa (Impo / Expo)
                </label>
                <select
                  value={modalSelectedCarpeta}
                  onChange={(e) => setModalSelectedCarpeta(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0072BC]"
                  aria-label="Seleccionar carpeta para mover comprobante"
                >
                  <option value="">-- Seleccionar Carpeta --</option>
                  {carpetas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero_carpeta} — {c.cliente} ({c.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  O ingresá el código manualmente:
                </label>
                <input
                  type="text"
                  value={modalSelectedCarpeta}
                  onChange={(e) => setModalSelectedCarpeta(e.target.value)}
                  placeholder="Ej. C1868"
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0072BC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingFolderAssign(null)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!modalSelectedCarpeta.trim()}
                  className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#0072BC] hover:bg-[#005a96] disabled:bg-slate-300 text-white shadow-xs"
                >
                  Vincular y Mover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
