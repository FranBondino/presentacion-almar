'use client';

import * as React from 'react';
import type { CarpetaRecord } from '@/lib/mockData';
import type { UserRole } from '@/lib/auth';
import { KanbanCard } from './KanbanCard';
import { TablePagination } from '@/components/ui/TablePagination';
import type { KanbanColumnId, KanbanComprobante } from '@/lib/kanban-utils';
import { Inbox, FileCheck, AlertCircle, CheckCircle2, ArrowDownToLine } from 'lucide-react';

export interface KanbanColumnProps {
  id: KanbanColumnId;
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  color: string;
  comprobantes: KanbanComprobante[];
  carpetasMap: Map<string, CarpetaRecord>;
  carpetas: CarpetaRecord[];
  userRole?: UserRole;
  draggingCardId?: string | null;
  approvalModalCardId?: string | null;
  onExternalApprovalModalClosed?: () => void;
  onCopyKipintoch?: (text: string) => void;
  onSelectPdf?: (comprobanteId: string) => void;
  onAsentar?: (comprobanteId: string) => void;
  onAssignFolder?: (comprobanteId: string, carpetaId: string) => void;
  onAuthorizeDeviation?: (comprobanteId: string, motivo: string, justificacion: string) => void | Promise<void>;
  onDragStartCard?: (comprobanteId: string, fromColumn: KanbanColumnId) => void;
  onDragEndCard?: () => void;
  onDropCardOnColumn?: (comprobanteId: string, targetColumn: KanbanColumnId) => void;
  onMoveToColumn?: (comprobanteId: string, targetColumn: KanbanColumnId) => void;
}

function getColumnDefaultIcon(id: KanbanColumnId) {
  switch (id) {
    case 'ingesta':
      return <Inbox className="h-4 w-4 text-[#0072BC] shrink-0" />;
    case 'listas':
      return <FileCheck className="h-4 w-4 text-[#0072BC] shrink-0" />;
    case 'desvios':
      return <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />;
    case 'asentadas':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
    default:
      return null;
  }
}

export function KanbanColumn({
  id,
  title,
  icon,
  subtitle,
  color,
  comprobantes,
  carpetasMap,
  carpetas,
  userRole = 'OPERATIVO',
  draggingCardId,
  approvalModalCardId,
  onExternalApprovalModalClosed,
  onCopyKipintoch,
  onSelectPdf,
  onAsentar,
  onAssignFolder,
  onAuthorizeDeviation,
  onDragStartCard,
  onDragEndCard,
  onDropCardOnColumn,
  onMoveToColumn,
}: KanbanColumnProps) {
  const columnIcon = icon ?? getColumnDefaultIcon(id);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);
  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(comprobantes.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [comprobantes.length, pageSize, currentPage]);

  const paginatedCards = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return comprobantes.slice(start, start + pageSize);
  }, [comprobantes, currentPage, pageSize]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only reset if leaving the column element itself
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedId =
      e.dataTransfer?.getData?.('text/plain') || draggingCardId;
    if (droppedId && onDropCardOnColumn) {
      onDropCardOnColumn(droppedId, id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`kanban-column min-w-0 w-full overflow-hidden border-t-4 ${color} border rounded-lg p-3 flex flex-col shadow-xs transition-all duration-150 ${
        isDragOver
          ? 'bg-sky-50/90 border-[#0072BC] ring-2 ring-[#0072BC]/60 shadow-md'
          : 'bg-slate-100/80 border-slate-200'
      }`}
      data-column-id={id}
      data-testid={`kanban-column-${id}`}
    >
      {/* Column Header */}
      <div className="flex flex-col pb-3 mb-3 border-b border-slate-200 gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {columnIcon}
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate" title={title}>
              {title}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-white text-slate-800 border border-slate-300 font-mono shadow-xs shrink-0">
            {comprobantes.length}
          </span>
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-500 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      {/* Active Drop Target Banner */}
      {isDragOver && (
        <div
          className="mb-3 p-2.5 rounded-md border-2 border-dashed border-[#0072BC] bg-sky-100/80 text-[#0072BC] text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse"
          data-testid={`drop-indicator-${id}`}
        >
          <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" />
          <span>Soltar aquí para mover a {title}</span>
        </div>
      )}

      {/* Cards List */}
      <div className="flex-1 space-y-3 h-auto min-w-0">
        {comprobantes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-md bg-white/60">
            {draggingCardId
              ? `Arrastrá y soltá aquí para mover a ${title}`
              : 'No hay comprobantes en esta columna'}
          </div>
        ) : (
          paginatedCards.map((comp) => {
            const rawCode = (comp as Record<string, unknown>).carpeta_codigo as string | undefined;
            const carpeta =
              (comp.carpeta_id ? carpetasMap.get(comp.carpeta_id) : null) ||
              (rawCode ? carpetasMap.get(rawCode) : null) ||
              null;
            return (
              <KanbanCard
                key={comp.id}
                comp={comp}
                carpeta={carpeta}
                carpetas={carpetas}
                columnId={id}
                userRole={userRole}
                isDragging={draggingCardId === comp.id}
                externalOpenApprovalModal={approvalModalCardId === comp.id}
                onExternalApprovalModalClosed={onExternalApprovalModalClosed}
                onCopyKipintoch={onCopyKipintoch}
                onSelectPdf={onSelectPdf}
                onAsentar={onAsentar}
                onAssignFolder={onAssignFolder}
                onAuthorizeDeviation={onAuthorizeDeviation}
                onDragStartCard={onDragStartCard}
                onDragEndCard={onDragEndCard}
                onMoveToColumn={onMoveToColumn}
              />
            );
          })
        )}
      </div>

      {comprobantes.length > pageSize && (
        <TablePagination
          currentPage={currentPage}
          totalItems={comprobantes.length}
          pageSize={pageSize}
          pageSizeOptions={[8, 16, 50]}
          itemLabel="facturas"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          variant="inline"
          compact={true}
          testId={`kanban-col-pagination-${id}`}
        />
      )}
    </div>
  );
}
