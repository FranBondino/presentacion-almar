'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import type { CarpetaRecord } from '@/lib/mockData';
import type { UserRole } from '@/lib/auth';
import { useAuth } from '@/components/auth/RoleGuard';
import { ComprobantesHelpBanner } from './ComprobantesHelpBanner';
import { ComprobanteFilterBar } from './ComprobanteFilterBar';
import { KanbanBoard } from './KanbanBoard';
import { ComprobanteList } from './ComprobanteList';
import { ComprobantePdfModal } from './ComprobantePdfModal';
import { CrearComprobanteModal } from './CrearComprobanteModal';
import { SyncMailboxesModal } from './SyncMailboxesModal';
import { useToast } from '@/components/ui/ToastProvider';
import type { IngestedInvoiceSummary } from '@/lib/gmail/multi-sync';
import { canEditComprobantes } from '@/lib/auth';
import {
  classifyKanbanColumn,
  type KanbanViewMode,
  type FilterScope,
  type ModalityFilter,
  type KanbanComprobante,
} from '@/lib/kanban-utils';
import type { CategoriaProveedorPA03 } from '@/types/domain';

export interface ComprobantesViewContainerProps {
  comprobantes?: KanbanComprobante[];
  carpetas?: CarpetaRecord[];
  initialView?: KanbanViewMode;
  initialScope?: FilterScope;
  initialModality?: ModalityFilter;
  userRole?: UserRole;
  currentUserId?: string;
  showHelpBanner?: boolean;
}

const EMPTY_COMPROBANTES: KanbanComprobante[] = [];
const EMPTY_CARPETAS: CarpetaRecord[] = [];

export function ComprobantesViewContainer({
  comprobantes: propComprobantes = EMPTY_COMPROBANTES,
  carpetas: propCarpetas = EMPTY_CARPETAS,
  initialView = 'kanban',
  initialScope = 'todas',
  initialModality = 'ALL',
  userRole: propUserRole,
  currentUserId: propCurrentUserId,
  showHelpBanner = true,
}: ComprobantesViewContainerProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const effectiveRole: UserRole = propUserRole || auth.role || 'OPERATIVO';
  const effectiveUserId = propCurrentUserId || auth.user?.id || '00000000-0000-0000-0000-000000000005';

  // Safe search params parsing with defensive fallback
  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    searchParams = null;
  }

  const paramTab = searchParams?.get('tab');
  const paramView = searchParams?.get('view');
  const paramScope = searchParams?.get('scope');
  const paramModality = searchParams?.get('modalidad');
  const paramCategoria = searchParams?.get('categoria');
  const paramSearch = searchParams?.get('search') || searchParams?.get('q');
  const paramHighlight = searchParams?.get('highlight');

  const resolvedInitialView: KanbanViewMode =
    paramView === 'table' ? 'table' : paramView === 'kanban' ? 'kanban' : initialView;

  const resolvedInitialScope: FilterScope =
    paramScope === 'mis_carpetas' ? 'mis_carpetas' : paramScope === 'todas' ? 'todas' : initialScope;

  const resolvedInitialModality: ModalityFilter =
    paramModality === 'MARITIMO' || paramModality === 'AEREO' || paramModality === 'TERRESTRE'
      ? paramModality
      : initialModality;

  const resolvedInitialCategoria: CategoriaProveedorPA03 | 'ALL' =
    paramCategoria && ['AGENTE_INTERNACIONAL', 'TRANSPORTE_LOGISTICA', 'SERVICIOS_OPERATIVOS', 'TECNOLOGIA_INFORMACION', 'PROFESIONALES_APOYO', 'PROVEEDORES_BIENES'].includes(paramCategoria)
      ? (paramCategoria as CategoriaProveedorPA03)
      : 'ALL';

  const resolvedInitialUrgentes = paramTab === 'desvios';

  const [comprobantes, setComprobantes] = React.useState<KanbanComprobante[]>(propComprobantes);
  const [carpetas, setCarpetas] = React.useState<CarpetaRecord[]>(propCarpetas);

  const [viewMode, setViewMode] = React.useState<KanbanViewMode>(resolvedInitialView);
  const [filterScope, setFilterScope] = React.useState<FilterScope>(resolvedInitialScope);
  const [modalityFilter, setModalityFilter] = React.useState<ModalityFilter>(resolvedInitialModality);
  const [categoriaFilter, setCategoriaFilter] = React.useState<CategoriaProveedorPA03 | 'ALL'>(resolvedInitialCategoria);
  const [soloUrgentes, setSoloUrgentes] = React.useState<boolean>(resolvedInitialUrgentes);
  const [searchQuery, setSearchQuery] = React.useState<string>(paramSearch || '');

  const [selectedPdfCompId, setSelectedPdfCompId] = React.useState<string | null>(paramHighlight || null);
  const [helpVisible, setHelpVisible] = React.useState<boolean>(showHelpBanner);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (paramHighlight) {
      setSelectedPdfCompId(paramHighlight);
    }
  }, [paramHighlight]);

  const refreshLiveComprobantesAndCarpetas = React.useCallback(async () => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      const [compRes, carpRes] = await Promise.all([
        fetch('/api/comprobantes?limit=250'),
        fetch('/api/carpetas?limit=250'),
      ]);
      if (compRes.ok) {
        const compJson = await compRes.json();
        if (compJson?.success && Array.isArray(compJson.data)) {
          setComprobantes(compJson.data as KanbanComprobante[]);
        }
      }
      if (carpRes.ok) {
        const carpJson = await carpRes.json();
        if (carpJson?.success && Array.isArray(carpJson.data)) {
          setCarpetas(carpJson.data as CarpetaRecord[]);
        }
      }
    } catch {
      // Keep current state on offline / test mode
    }
  }, []);

  React.useEffect(() => {
    // Auto-fetch live data if no explicit props were provided
    if (!propComprobantes || propComprobantes.length === 0) {
      void refreshLiveComprobantesAndCarpetas();
    }
  }, [propComprobantes, refreshLiveComprobantesAndCarpetas]);

  const handleCreatedComprobante = React.useCallback((nuevo: KanbanComprobante) => {
    setComprobantes((prev) => [nuevo, ...prev]);
  }, []);

  const handleInvoicesIngested = React.useCallback(
    (newInvoices: IngestedInvoiceSummary[]) => {
      const newComprobantes: KanbanComprobante[] = newInvoices.map((inv) => {
        const matchedCarpeta = inv.carpetaCodigo
          ? carpetas.find(
              (c) =>
                c.numero_carpeta === inv.carpetaCodigo ||
                c.id === inv.carpetaCodigo
            )
          : undefined;
        const isFacturaA = inv.tipoComprobante === 'Factura A';
        const isFacturaB = inv.tipoComprobante === 'Factura B';
        const isForeign =
          inv.tipoComprobante === 'Invoice Exterior' || inv.emisorCuit.startsWith('50-');
        return {
          id: inv.id,
          carpeta_id: matchedCarpeta?.id ?? null,
          tipo_comprobante: (isFacturaA
            ? 'FACTURA_A'
            : isFacturaB
            ? 'FACTURA_B'
            : 'INVOICE_EXTERIOR') as any,
          direccion: 'COMPRA',
          numero_comprobante: inv.numeroComprobante,
          emisor_razon_social: inv.emisorNombre,
          emisor_cuit: inv.emisorCuit,
          proveedor_exterior: isForeign,
          concepto_gasto: `Comprobante Ingesta Mailbox (${inv.sourceMailbox})`,
          clasificacion_gasto: isForeign ? 'FMA' : 'BUFF',
          tipo_iva: isForeign ? 'IVA_0_EXENTO' : 'IVA_21_GENERAL',
          categoria_fiscal: isForeign ? 'INTERNACIONAL_EXENTO_0' : 'LOCAL_GRAVADO_21',
          moneda: (inv.moneda as any) || 'USD',
          tipo_cambio: 1.0,
          subtotal_neto: inv.total,
          alicuota_iva: isForeign ? 0 : 21,
          monto_iva: 0,
          monto_total: inv.total,
          estado_pago: 'PENDIENTE',
          fecha_emision: inv.emailDate
            ? new Date(inv.emailDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          documento_id: null,
          score_confianza: 0.98,
          metadata_raw: {
            source_mailbox: inv.sourceMailbox,
            email_subject: inv.emailSubject,
            filename: inv.filename,
            sha256: inv.sha256,
            message_id: inv.messageId,
          },
          creado_por: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          asentado_en_erp: false,
          desvio_porcentaje: 0,
        } as KanbanComprobante;
      });

      setComprobantes((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const filtered = newComprobantes.filter((c) => !existingIds.has(c.id));
        return [...filtered, ...prev];
      });

      // Immediately refresh from live store to load exact persisted fiscal fields and newly created folders
      void refreshLiveComprobantesAndCarpetas();
    },
    [carpetas, refreshLiveComprobantesAndCarpetas]
  );

  // Sync state if propComprobantes changes
  React.useEffect(() => {
    setComprobantes(propComprobantes);
  }, [propComprobantes]);

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

  // Handler for settling an invoice in Kipintoch ERP
  const handleAsentar = React.useCallback(async (comprobanteId: string) => {
    setComprobantes((prev) =>
      prev.map((c) =>
        c.id === comprobanteId
          ? {
              ...c,
              asentado_en_erp: true,
              estado_pago: 'PAGADO',
            }
          : c
      )
    );

    try {
      if (typeof fetch !== 'undefined') {
        await fetch(`/api/comprobantes/${encodeURIComponent(comprobanteId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asentado_en_erp: true,
            estado_pago: 'PAGADO',
          }),
        });
      }
    } catch {
      // Offline / mock resilience
    }
  }, []);

  // Handler for assigning an unassigned invoice to a folder
  const handleAssignFolder = React.useCallback(async (comprobanteId: string, carpetaId: string) => {
    setComprobantes((prev) =>
      prev.map((c) =>
        c.id === comprobanteId || c.numero_comprobante === comprobanteId
          ? {
              ...c,
              carpeta_id: carpetaId,
              estado_workflow: 'vinculada',
            }
          : c
      )
    );

    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`/api/comprobantes/${encodeURIComponent(comprobanteId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carpeta_id: carpetaId,
          }),
        });

        if (res.ok) {
          await refreshLiveComprobantesAndCarpetas();
          toast.success('Comprobante vinculado', 'Se asignó correctamente a la carpeta operativa y se recalcularon los costos.');
        } else {
          const errData = await res.json().catch(() => null);
          toast.error('Error al vincular carpeta', errData?.error || 'No se pudo vincular el comprobante.');
        }
      }
    } catch {
      // Offline / mock resilience
    }
  }, [refreshLiveComprobantesAndCarpetas, toast]);

  // Handler for authorizing a rate deviation (ISO 9001 Governance)
  const handleAuthorizeDeviation = React.useCallback(
    async (comprobanteId: string, motivo: string, justificacion: string) => {
      const utcTimestamp = new Date().toISOString();
      setComprobantes((prev) =>
        prev.map((c) => {
          if (c.id === comprobanteId || c.numero_comprobante === comprobanteId) {
            const raw = c as Record<string, unknown>;
            const existingMeta =
              raw.metadata_raw && typeof raw.metadata_raw === 'object' && !Array.isArray(raw.metadata_raw)
                ? (raw.metadata_raw as Record<string, unknown>)
                : {};
            return {
              ...c,
              desvio_autorizado: true,
              motivo_desvio: motivo,
              justificacion_desvio: justificacion,
              metadata_raw: {
                ...existingMeta,
                desvio_autorizado: true,
                motivo_desvio: motivo,
                justificacion_desvio: justificacion,
                fecha_autorizacion_desvio: utcTimestamp,
                autorizado_por: auth.user?.email || 'supervisor@almar.com.ar',
              },
            } as KanbanComprobante;
          }
          return c;
        })
      );

      // Connect with backend route POST /api/comprobantes/[id]/autorizar-desvio
      try {
        if (typeof fetch !== 'undefined') {
          await fetch(`/api/comprobantes/${encodeURIComponent(comprobanteId)}/autorizar-desvio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo, justificacion }),
          });
        }
      } catch {
        // Offline / mock resilience
      }
    },
    [auth.user?.email]
  );

  // Handler for updating/correcting invoice fields (OCR correction)
  const handleUpdateComprobante = React.useCallback(
    async (comprobanteId: string, updates: Partial<KanbanComprobante>) => {
      setComprobantes((prev) =>
        prev.map((c) =>
          c.id === comprobanteId || c.numero_comprobante === comprobanteId
            ? ({
                ...c,
                ...updates,
                updated_at: new Date().toISOString(),
              } as KanbanComprobante)
            : c
        )
      );

      try {
        if (typeof fetch !== 'undefined') {
          await fetch(`/api/comprobantes/${encodeURIComponent(comprobanteId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        }
      } catch {
        // Offline / mock resilience
      }
    },
    []
  );

  // Handler for discarding/soft-deleting an invoice (ISO 9001 traceable cancellation)
  const handleDiscardComprobante = React.useCallback(
    async (comprobanteId: string, motivo: string) => {
      setComprobantes((prev) =>
        prev.map((c) => {
          if (c.id === comprobanteId || c.numero_comprobante === comprobanteId) {
            const raw = c as Record<string, unknown>;
            const existingMeta =
              raw.metadata_raw && typeof raw.metadata_raw === 'object' && !Array.isArray(raw.metadata_raw)
                ? (raw.metadata_raw as Record<string, unknown>)
                : {};
            return {
              ...c,
              estado_pago: 'RECHAZADO',
              metadata_raw: {
                ...existingMeta,
                descartado: true,
                motivo_descarte: motivo,
                descartado_por: auth.user?.email || 'operaciones@almar.com.ar',
                descartado_at: new Date().toISOString(),
              },
            } as KanbanComprobante;
          }
          return c;
        })
      );

      try {
        if (typeof fetch !== 'undefined') {
          await fetch(`/api/comprobantes/${encodeURIComponent(comprobanteId)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo }),
          });
        }
      } catch {
        // Offline / mock resilience
      }
    },
    [auth.user?.email]
  );

  // Filter application
  const filteredComprobantes = React.useMemo(() => {
    return comprobantes.filter((comp) => {
      const raw = comp as Record<string, unknown>;
      const isDiscarded =
        comp.estado_pago === 'RECHAZADO' ||
        raw.descartado === true ||
        Boolean((raw.metadata_raw as Record<string, unknown> | undefined)?.descartado);

      if (isDiscarded) {
        return false;
      }

      const carpeta = comp.carpeta_id ? carpetasMap.get(comp.carpeta_id) : null;

      // 1. Scope filter: Mis Carpetas vs Todas
      if (filterScope === 'mis_carpetas') {
        if (!carpeta || carpeta.operador_id !== effectiveUserId) {
          return false;
        }
      }

      // 2. Modality filter
      if (modalityFilter !== 'ALL') {
        const area =
          carpeta?.area ||
          (comp.clasificacion_gasto === 'FIA'
            ? 'AEREO'
            : comp.clasificacion_gasto === 'FTE'
            ? 'TERRESTRE'
            : 'MARITIMO');
        if (area !== modalityFilter) return false;
      }

      // 3. Solo urgentes filter (only show items in desvios column)
      if (soloUrgentes) {
        const colId = classifyKanbanColumn(comp, carpeta);
        if (colId !== 'desvios') return false;
      }

      // 4. Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchEmisor = comp.emisor_razon_social.toLowerCase().includes(q);
        const matchNro = comp.numero_comprobante.toLowerCase().includes(q);
        const matchCuit = comp.emisor_cuit ? comp.emisor_cuit.toLowerCase().includes(q) : false;
        const matchConcepto = comp.concepto_gasto.toLowerCase().includes(q);
        const matchCarpeta = carpeta ? carpeta.numero_carpeta.toLowerCase().includes(q) : false;
        if (!matchEmisor && !matchNro && !matchCuit && !matchConcepto && !matchCarpeta) {
          return false;
        }
      }

      // 5. PA.03 Category filter
      if (categoriaFilter !== 'ALL') {
        if (comp.categoria_proveedor_pa03 !== categoriaFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    comprobantes,
    carpetasMap,
    filterScope,
    effectiveUserId,
    modalityFilter,
    categoriaFilter,
    soloUrgentes,
    searchQuery,
  ]);

  const selectedPdfComp = React.useMemo(
    () => comprobantes.find((c) => c.id === selectedPdfCompId) || null,
    [comprobantes, selectedPdfCompId]
  );

  const selectedPdfCarpeta = React.useMemo(
    () => (selectedPdfComp?.carpeta_id ? carpetasMap.get(selectedPdfComp.carpeta_id) || null : null),
    [selectedPdfComp, carpetasMap]
  );

  return (
    <div className="comprobantes-view-container space-y-4" data-testid="comprobantes-view-container">
      {/* Collapsible Onboarding & Help Banner */}
      {helpVisible && <ComprobantesHelpBanner />}

      {/* Filter Bar & View Switcher Toolbar */}
      <ComprobanteFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterScope={filterScope}
        onFilterScopeChange={setFilterScope}
        modalityFilter={modalityFilter}
        onModalityFilterChange={setModalityFilter}
        categoriaProveedorFilter={categoriaFilter}
        onCategoriaProveedorFilterChange={setCategoriaFilter}
        soloUrgentes={soloUrgentes}
        onSoloUrgentesChange={setSoloUrgentes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showHelp={helpVisible}
        onToggleHelp={() => setHelpVisible(!helpVisible)}
        onOpenCrearComprobante={() => setIsCreateModalOpen(true)}
        onOpenSyncMailboxes={() => setIsSyncModalOpen(true)}
        canCreate={canEditComprobantes(effectiveRole)}
      />

      {/* Main View: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          comprobantes={filteredComprobantes}
          carpetas={carpetas}
          userRole={effectiveRole}
          onSelectPdf={setSelectedPdfCompId}
          onAsentar={handleAsentar}
          onAssignFolder={handleAssignFolder}
          onAuthorizeDeviation={handleAuthorizeDeviation}
          onUpdateComprobante={handleUpdateComprobante}
        />
      ) : (
        <ComprobanteList
          initialComprobantes={filteredComprobantes}
          carpetas={carpetas}
          onAssignFolder={handleAssignFolder}
          onSelectPdf={setSelectedPdfCompId}
          hideInternalFilters={true}
        />
      )}

      {/* Slide-over / Modal Document PDF & AI Inspector */}
      <ComprobantePdfModal
        isOpen={!!selectedPdfCompId}
        comprobante={selectedPdfComp}
        carpeta={selectedPdfCarpeta}
        carpetas={carpetas}
        userRole={effectiveRole}
        onClose={() => setSelectedPdfCompId(null)}
        onAsentar={handleAsentar}
        onAssignFolder={handleAssignFolder}
        onAuthorizeDeviation={handleAuthorizeDeviation}
        onUpdateComprobante={handleUpdateComprobante}
        onDiscardComprobante={handleDiscardComprobante}
      />

      {/* Modal para Registro Manual de Comprobantes (Ventanilla / Chofer / Papel) */}
      <CrearComprobanteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreatedComprobante}
        carpetas={carpetas}
        userEmail={auth.user?.email}
      />

      {/* Modal de Sincronización en Vivo de las 18 Casillas ALMAR */}
      <SyncMailboxesModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onInvoicesIngested={handleInvoicesIngested}
      />
    </div>
  );
}
