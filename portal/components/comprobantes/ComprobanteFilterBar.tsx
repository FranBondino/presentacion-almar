'use client';

import * as React from 'react';
import type {
  KanbanViewMode,
  FilterScope,
  ModalityFilter,
} from '@/lib/kanban-utils';
import type { CategoriaProveedorPA03 } from '@/types/domain';
import { CATEGORIAS_PA03_LIST } from '@/lib/pa03';
import { HelpCircle, Search, LayoutGrid, Table, AlertTriangle, Plus, RefreshCw } from 'lucide-react';

export interface ComprobanteFilterBarProps {
  viewMode: KanbanViewMode;
  onViewModeChange: (mode: KanbanViewMode) => void;
  filterScope: FilterScope;
  onFilterScopeChange: (scope: FilterScope) => void;
  modalityFilter: ModalityFilter;
  onModalityFilterChange: (modality: ModalityFilter) => void;
  categoriaProveedorFilter?: CategoriaProveedorPA03 | 'ALL';
  onCategoriaProveedorFilterChange?: (categoria: CategoriaProveedorPA03 | 'ALL') => void;
  soloUrgentes: boolean;
  onSoloUrgentesChange: (solo: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showHelp?: boolean;
  onToggleHelp?: () => void;
  onOpenCrearComprobante?: () => void;
  onOpenSyncMailboxes?: () => void;
  canCreate?: boolean;
}

export function ComprobanteFilterBar({
  viewMode,
  onViewModeChange,
  filterScope,
  onFilterScopeChange,
  modalityFilter,
  onModalityFilterChange,
  categoriaProveedorFilter = 'ALL',
  onCategoriaProveedorFilterChange,
  soloUrgentes,
  onSoloUrgentesChange,
  searchQuery,
  onSearchChange,
  showHelp,
  onToggleHelp,
  onOpenCrearComprobante,
  onOpenSyncMailboxes,
  canCreate = true,
}: ComprobanteFilterBarProps) {
  return (
    <div
      className="comprobantes-filter-toolbar bg-white border border-slate-200 rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
      data-testid="filter-toolbar"
    >
      {/* Left: View Mode Switcher */}
      <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center ${
            viewMode === 'kanban'
              ? 'bg-[#0072BC] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => onViewModeChange('kanban')}
          data-testid="view-tablero-kanban"
        >
          <LayoutGrid className="h-4 w-4 mr-1.5" />
          <span>Tablero Kanban</span>
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center ${
            viewMode === 'table'
              ? 'bg-[#0072BC] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => onViewModeChange('table')}
          data-testid="view-tabla-detallada"
        >
          <Table className="h-4 w-4 mr-1.5" />
          <span>Tabla Detallada</span>
        </button>
      </div>

      {/* Middle: Operator Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Scope Toggle: Mis Carpetas vs Todas */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
          <button
            type="button"
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterScope === 'mis_carpetas'
                ? 'bg-white text-[#0072BC] border border-slate-200 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => onFilterScopeChange('mis_carpetas')}
          >
            Mis Carpetas
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterScope === 'todas'
                ? 'bg-white text-[#0072BC] border border-slate-200 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => onFilterScopeChange('todas')}
          >
            Todas
          </button>
        </div>

        {/* Modality Filter */}
        <select
          value={modalityFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onModalityFilterChange(e.target.value as ModalityFilter)
          }
          className="bg-white border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-[#0072BC]"
          aria-label="Filtrar por modalidad"
        >
          <option value="ALL">Todas las Modalidades</option>
          <option value="MARITIMO">Marítimo</option>
          <option value="AEREO">Aéreo</option>
          <option value="TERRESTRE">Terrestre</option>
        </select>

        {/* ISO 9001 PA.03 Category Filter */}
        {onCategoriaProveedorFilterChange && (
          <select
            value={categoriaProveedorFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onCategoriaProveedorFilterChange(e.target.value as CategoriaProveedorPA03 | 'ALL')
            }
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-[#0072BC]"
            aria-label="Filtrar por categoría PA.03"
            data-testid="filter-pa03"
          >
            <option value="ALL">Todas las Categorías PA.03</option>
            {CATEGORIAS_PA03_LIST.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        )}

        {/* Solo Urgentes Toggle */}
        <button
          type="button"
          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer flex items-center ${
            soloUrgentes
              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs font-semibold'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => onSoloUrgentesChange(!soloUrgentes)}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" />
          <span>Solo Urgentes / Desvíos</span>
        </button>

        {/* Help Toggle Button */}
        {onToggleHelp && (
          <button
            type="button"
            onClick={onToggleHelp}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showHelp
                ? 'bg-sky-50 border-sky-300 text-[#0072BC] font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Mostrar / Ocultar guía de ayuda"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[#0072BC]" />
            <span>Ayuda</span>
          </button>
        )}
      </div>

      {/* Right: Search Input & Manual Upload */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        <div className="relative flex-1 min-w-[200px] sm:flex-initial">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar comprobante, proveedor o carpeta..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 text-xs rounded-md pl-8 pr-3 py-1.5 w-full sm:w-64 focus:outline-none focus:border-[#0072BC] placeholder:text-slate-400"
          />
        </div>

        {onOpenSyncMailboxes && (
          <button
            type="button"
            onClick={onOpenSyncMailboxes}
            className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Sincronizar facturas desde las 18 casillas de correo ALMAR"
            data-testid="btn-sync-mailboxes-trigger"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sincronizar Casillas (18)</span>
            <span className="sm:hidden">Sincronizar</span>
          </button>
        )}

        {canCreate && onOpenCrearComprobante && (
          <button
            type="button"
            onClick={onOpenCrearComprobante}
            className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#0072BC] hover:bg-[#005a96] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Registrar factura manual (ventanilla, WhatsApp, papel)"
            data-testid="btn-nuevo-comprobante-manual"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nuevo Comprobante</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        )}
      </div>
    </div>
  );
}
