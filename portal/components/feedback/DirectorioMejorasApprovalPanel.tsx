'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/RoleGuard';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  FeedbackTicketRecord,
  DirectorioArea,
  EstadoAprobacionDirectorio,
} from '@/lib/feedback';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  Sparkles,
  Users,
  Send,
  Copy,
  Check,
  PlusCircle,
  FolderKanban,
  ShieldCheck,
  Filter,
  Search,
  FileText,
  ArrowRight,
} from 'lucide-react';

export interface DirectorioMejorasApprovalPanelProps {
  initialTickets?: FeedbackTicketRecord[];
  compactMode?: boolean;
}

const DIRECTOR_PROFILES: Array<{
  area: DirectorioArea;
  nombre: string;
  shortName: string;
  email: string;
  cargo: string;
  modulos: string;
  badgeClass: string;
}> = [
  {
    area: 'OPERACIONES_SISTEMAS',
    nombre: 'Juan Andrés Arloro',
    shortName: 'Juan (Operaciones & Sistemas)',
    email: 'jarloro@almarrosario.com',
    cargo: 'Socio Directivo · Operaciones & Tecnología',
    modulos: 'Importación, Exportación, Aéreo/Terrestre, Tracking y Casillas Gmail',
    badgeClass: 'bg-sky-50 text-[#0072BC] border-sky-200',
  },
  {
    area: 'COMERCIAL_PRICING',
    nombre: 'Alejandro Noacco',
    shortName: 'Ale (Comercial & Pricing)',
    email: 'anoacco@almarrosario.com',
    cargo: 'Socio Directivo · Comercial & Pricing',
    modulos: 'Cotizaciones PO.01, Seguimiento 48hs y Multicotizador Navieras',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    area: 'ADMINISTRACION_FINANZAS',
    nombre: 'Vanesa Meggiolaro',
    shortName: 'Vane (Administración & Finanzas)',
    email: 'vmeggiolaro@almarrosario.com',
    cargo: 'Directora Financiera / Socia · Administración & Cobros',
    modulos: 'Facturación de Venta PO.03, Comprobantes, Cobranzas Banco Macro y Rentabilidad',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
];

export function DirectorioMejorasApprovalPanel({
  initialTickets = [],
  compactMode = false,
}: DirectorioMejorasApprovalPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const userEmail = (user?.email || 'jarloro@almarrosario.com').toLowerCase();

  // Auto-select the Director's area if Juan, Ale, or Vane logs in; allow switching to ALL
  const defaultAreaFilter = React.useMemo<'ALL' | DirectorioArea>(() => {
    if (userEmail === 'anoacco@almarrosario.com') return 'COMERCIAL_PRICING';
    if (userEmail === 'vmeggiolaro@almarrosario.com') return 'ADMINISTRACION_FINANZAS';
    return 'ALL';
  }, [userEmail]);

  const [tickets, setTickets] = React.useState<FeedbackTicketRecord[]>(initialTickets);
  const [isLoading, setIsLoading] = React.useState<boolean>(initialTickets.length === 0);
  const [areaFilter, setAreaFilter] = React.useState<'ALL' | DirectorioArea>(defaultAreaFilter);
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | EstadoAprobacionDirectorio>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  // Inline editor state for the selected proposal
  const [editMensajeModificado, setEditMensajeModificado] = React.useState<string>('');
  const [editNotaFran, setEditNotaFran] = React.useState<string>('');
  const [editArea, setEditArea] = React.useState<DirectorioArea>('OPERACIONES_SISTEMAS');
  const [isSavingAction, setIsSavingAction] = React.useState<boolean>(false);
  const [copiedDailyBatch, setCopiedDailyBatch] = React.useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = React.useState<boolean>(false);

  // Quick "Nueva Mejora del Directorio" modal state
  const [showNewModal, setShowNewModal] = React.useState<boolean>(false);
  const [newMensaje, setNewMensaje] = React.useState<string>('');
  const [newArea, setNewArea] = React.useState<DirectorioArea>('OPERACIONES_SISTEMAS');
  const [newSeveridad, setNewSeveridad] = React.useState<string>('ALTA');
  const [newCarpeta, setNewCarpeta] = React.useState<string>('');

  const fetchTickets = React.useCallback(async () => {
    try {
      const res = await fetch('/api/feedback');
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setTickets(json.data);
      }
    } catch {
      // ignore network error
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const activeDirectorProfile = React.useMemo(() => {
    const byEmail = DIRECTOR_PROFILES.find((d) => d.email.toLowerCase() === userEmail);
    if (byEmail) return byEmail;
    if (areaFilter !== 'ALL') {
      const byArea = DIRECTOR_PROFILES.find((d) => d.area === areaFilter);
      if (byArea) return byArea;
    }
    return DIRECTOR_PROFILES[0]!;
  }, [userEmail, areaFilter]);

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((t) => {
      if (areaFilter !== 'ALL' && t.area_directorio !== areaFilter) return false;
      if (statusFilter !== 'ALL' && t.estado_aprobacion !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const m1 = (t.mensaje || '').toLowerCase().includes(q);
        const m2 = (t.mensaje_modificado_directorio || '').toLowerCase().includes(q);
        const m3 = (t.usuario_nombre || '').toLowerCase().includes(q);
        const m4 = (t.ticket_code || '').toLowerCase().includes(q);
        const m5 = (t.carpeta_id || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }
      return true;
    });
  }, [tickets, areaFilter, statusFilter, searchQuery]);

  const activeTicket = React.useMemo(() => {
    if (selectedTicketId) {
      const found = filteredTickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return filteredTickets[0] || null;
  }, [filteredTickets, selectedTicketId]);

  // Synchronize editor fields whenever activeTicket changes
  React.useEffect(() => {
    if (activeTicket) {
      setEditMensajeModificado(
        activeTicket.mensaje_modificado_directorio || activeTicket.mensaje || ''
      );
      setEditNotaFran(activeTicket.nota_directorio_para_fran || '');
      setEditArea(activeTicket.area_directorio || 'OPERACIONES_SISTEMAS');
    }
  }, [activeTicket]);

  // KPI counters across all tickets (or current area)
  const kpis = React.useMemo(() => {
    const base = areaFilter === 'ALL' ? tickets : tickets.filter((t) => t.area_directorio === areaFilter);
    const pendientes = base.filter(
      (t) => !t.estado_aprobacion || t.estado_aprobacion === 'PENDIENTE_DIRECTORIO'
    ).length;
    const aprobadasDirectas = base.filter(
      (t) => t.estado_aprobacion === 'APROBADA_PARA_FRAN'
    ).length;
    const modificadasAprobadas = base.filter(
      (t) => t.estado_aprobacion === 'MODIFICADA_Y_APROBADA'
    ).length;
    const rechazadas = base.filter(
      (t) => t.estado_aprobacion === 'RECHAZADA_DESCARTADA'
    ).length;
    return {
      total: base.length,
      pendientes,
      aprobadasDirectas,
      modificadasAprobadas,
      totalAvanzanParaFran: aprobadasDirectas + modificadasAprobadas,
      rechazadas,
    };
  }, [tickets, areaFilter]);

  const approvedForFranAllAreas = React.useMemo(() => {
    return tickets.filter(
      (t) =>
        t.estado_aprobacion === 'APROBADA_PARA_FRAN' ||
        t.estado_aprobacion === 'MODIFICADA_Y_APROBADA'
    );
  }, [tickets]);

  const handleDecision = async (
    ticket: FeedbackTicketRecord,
    decision: EstadoAprobacionDirectorio,
    useModifiedScope: boolean
  ) => {
    setIsSavingAction(true);
    try {
      const directorForTicket =
        DIRECTOR_PROFILES.find((d) => d.area === editArea) || activeDirectorProfile;

      const payload = {
        id: ticket.id,
        estado_aprobacion: decision,
        area_directorio: editArea,
        mensaje_modificado_directorio:
          useModifiedScope && editMensajeModificado.trim() !== ticket.mensaje.trim()
            ? editMensajeModificado.trim()
            : decision === 'MODIFICADA_Y_APROBADA'
            ? editMensajeModificado.trim()
            : ticket.mensaje_modificado_directorio,
        nota_directorio_para_fran: editNotaFran.trim() || null,
        resuelto_por_nombre: user?.nombre || directorForTicket.nombre,
        resuelto_por_email: user?.email || directorForTicket.email,
      };

      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json?.success && json.data) {
        setTickets((prev) => prev.map((item) => (item.id === ticket.id ? json.data : item)));
        const label =
          decision === 'APROBADA_PARA_FRAN'
            ? 'Aprobada e incorporada al lote diario para Fran'
            : decision === 'MODIFICADA_Y_APROBADA'
            ? 'Alcance modificado y aprobado para Fran'
            : decision === 'RECHAZADA_DESCARTADA'
            ? 'Propuesta descartada / pospuesta'
            : 'Estado actualizado';
        toast.success(label, `${ticket.ticket_code} actualizado por ${payload.resuelto_por_nombre}.`);
      } else {
        toast.error('No se pudo actualizar', json?.error || 'Intente nuevamente.');
      }
    } catch {
      toast.error('Error de conexión', 'No se pudo guardar la resolución del Directorio.');
    } finally {
      setIsSavingAction(false);
    }
  };

  const buildDailySummaryForFran = () => {
    const today = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const lines: string[] = [
      `📌 LOTE DIARIO DE MEJORAS APROBADAS POR DIRECTORIO ALMAR (${today})`,
      `Confirmado para implementación a: Francisco (Fran)`,
      `------------------------------------------------------------`,
    ];

    for (const dir of DIRECTOR_PROFILES) {
      const areaItems = approvedForFranAllAreas.filter((t) => t.area_directorio === dir.area);
      lines.push(`\n▶ ÁREA: ${dir.shortName.toUpperCase()} (${areaItems.length} aprobadas)`);
      if (areaItems.length === 0) {
        lines.push(`  • Sin mejoras pendientes en este corte.`);
      } else {
        for (const item of areaItems) {
          const finalScope = item.mensaje_modificado_directorio || item.mensaje;
          const wasModified = item.estado_aprobacion === 'MODIFICADA_Y_APROBADA';
          lines.push(
            `  • [${item.ticket_code}] (${item.severidad}) Propuesto por ${item.usuario_nombre} en ${item.pantalla}${
              item.carpeta_id ? ` [Carpeta ${item.carpeta_id}]` : ''
            }:`
          );
          lines.push(
            `    ${wasModified ? '✏️ ALCANCE AJUSTADO POR DIRECTORIO' : '✅ APROBADO DIRECTO'}: "${finalScope}"`
          );
          if (item.nota_directorio_para_fran) {
            lines.push(`    💬 Nota de ${item.resuelto_por_nombre || dir.nombre} para Fran: ${item.nota_directorio_para_fran}`);
          }
        }
      }
    }

    return lines.join('\n');
  };

  const handleConfirmAndCopyBatchForFran = async () => {
    setIsSavingAction(true);
    try {
      await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_DAILY_BATCH_FOR_FRAN',
          resuelto_por_nombre: user?.nombre || activeDirectorProfile.nombre,
        }),
      });
      const text = buildDailySummaryForFran();
      await navigator.clipboard.writeText(text);
      setCopiedDailyBatch(true);
      setTimeout(() => setCopiedDailyBatch(false), 3000);
      toast.success(
        '¡Lote Diario Confirmado para Fran!',
        `Se confirmaron ${approvedForFranAllAreas.length} mejoras aprobadas por el Directorio y se copió la minuta al portapapeles.`
      );
      void fetchTickets();
    } catch {
      toast.error('Error al confirmar lote', 'Intente nuevamente.');
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleCreateDirectorateImprovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMensaje.trim()) return;
    setIsSavingAction(true);
    try {
      const dir = DIRECTOR_PROFILES.find((d) => d.area === newArea) || activeDirectorProfile;
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'SUGERENCIA',
          severidad: newSeveridad,
          mensaje: newMensaje.trim(),
          pantalla: '/mejoras-directorio',
          carpeta_id: newCarpeta.trim() ? newCarpeta.trim().toUpperCase() : null,
          usuario_nombre: user?.nombre || dir.nombre,
          usuario_email: user?.email || dir.email,
          usuario_rol: 'GERENCIA',
          contexto_adicional: {
            area_directorio: newArea,
            origen: 'Cargada directamente por Directorio',
          },
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success && json.data) {
        // Immediately mark it as approved by the Director who created it
        const patchRes = await fetch('/api/feedback', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: json.data.id,
            estado_aprobacion: 'APROBADA_PARA_FRAN',
            area_directorio: newArea,
            nota_directorio_para_fran: `Solicitado directamente por ${dir.nombre} en revisión diaria.`,
            resuelto_por_nombre: dir.nombre,
            resuelto_por_email: dir.email,
          }),
        });
        const patchJson = await patchRes.json();
        const created = patchJson?.data || json.data;
        setTickets((prev) => [created, ...prev]);
        setSelectedTicketId(created.id);
        setNewMensaje('');
        setNewCarpeta('');
        setShowNewModal(false);
        toast.success(
          'Mejora agregada al lote de Fran',
          `Registrada bajo el área de ${dir.nombre} (${created.ticket_code}).`
        );
      }
    } catch {
      toast.error('Error', 'No se pudo crear la mejora.');
    } finally {
      setIsSavingAction(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
      data-testid="directorio-mejoras-approval-panel"
    >
      {/* 1. Encabezado de Gobernanza del Directorio (Juan, Ale, Vane -> Confirmación Diaria a Fran) */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0A2540] via-[#0b2e59] to-[#0072BC] text-white border-b border-slate-200">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                <span>Circuito Diario Directorio → Desarrollo (Francisco)</span>
              </span>
              <span className="text-[11px] text-sky-200 font-mono">
                Resolución 1 vez por día por Área (Juan · Ale · Vane)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold flex flex-wrap items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300 shrink-0" />
              <span>Panel Consolidado de Mejoras &amp; Sugerencias del Equipo (Aprobación Directorio)</span>
            </h2>
            <p className="text-xs text-sky-100/90 leading-relaxed max-w-4xl">
              Las mejoras y ajustes reportados por el equipo desde el botón <strong>Reportar UAT</strong> llegan asignadas al perfil de cada socio según su área:{' '}
              <strong>Juan Andrés Arloro</strong> (Operaciones &amp; Sistemas),{' '}
              <strong>Alejandro Noacco</strong> (Comercial &amp; Pricing) y{' '}
              <strong>Vanesa Meggiolaro</strong> (Administración &amp; Finanzas). Cada director puede <strong>aprobarlas directo</strong>, <strong>modificarles el alcance</strong> o <strong>descartarlas</strong> antes de confirmar el lote diario a <strong>Fran</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNewModal((v) => !v)}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all cursor-pointer flex items-center gap-1.5"
              data-testid="btn-nueva-mejora-directorio"
            >
              <PlusCircle className="h-4 w-4 text-sky-200" />
              <span>+ Cargar Mejora de Directorio</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBatchModal((v) => !v)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              data-testid="btn-confirmar-lote-fran"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                Confirmar Lote del Día a Fran ({approvedForFranAllAreas.length} aprobadas)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Drawer Inline para Nueva Mejora Directa del Directorio */}
      {showNewModal && (
        <form
          onSubmit={handleCreateDirectorateImprovement}
          className="p-4 bg-sky-50/90 border-b border-sky-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4 text-[#0072BC]" />
              <span>Agregar Mejora o Requerimiento Directo del Directorio al Lote de Fran</span>
            </span>
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Área / Socio Responsable
              </label>
              <select
                value={newArea}
                onChange={(e) => setNewArea(e.target.value as DirectorioArea)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="OPERACIONES_SISTEMAS">Juan Arloro — Operaciones &amp; Sistemas</option>
                <option value="COMERCIAL_PRICING">Alejandro Noacco — Comercial &amp; Pricing</option>
                <option value="ADMINISTRACION_FINANZAS">Vanesa Meggiolaro — Administración &amp; Finanzas</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Prioridad</label>
              <select
                value={newSeveridad}
                onChange={(e) => setNewSeveridad(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="ALTA">ALTA (Avanza Hoy)</option>
                <option value="BLOQUEANTE">BLOQUEANTE (Urgente)</option>
                <option value="MEDIA">MEDIA</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Carpeta Ejemplo (Opcional)
              </label>
              <input
                type="text"
                value={newCarpeta}
                onChange={(e) => setNewCarpeta(e.target.value)}
                placeholder="Ej. C1868, EA1853..."
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSavingAction || !newMensaje.trim()}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0072BC] hover:bg-[#005a96] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Guardar y Aprobar para Fran
              </button>
            </div>
          </div>
          <div>
            <textarea
              rows={2}
              value={newMensaje}
              onChange={(e) => setNewMensaje(e.target.value)}
              placeholder="Describí la mejora aprobada por el Directorio para que Fran la implemente..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800"
            />
          </div>
        </form>
      )}

      {/* Resumen / Minuta Diaria para Fran (Desplegable) */}
      {showBatchModal && (
        <div className="p-4 bg-emerald-50/90 border-b border-emerald-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-700" />
                <span>
                  Minuta Diaria Consolidada del Directorio para Francisco ({approvedForFranAllAreas.length} mejoras aprobadas)
                </span>
              </h3>
              <p className="text-[11px] text-emerald-800">
                Incluye las propuestas aprobadas y modificadas hoy por Juan Andrés Arloro, Alejandro Noacco y Vanesa Meggiolaro.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmAndCopyBatchForFran}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDailyBatch ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>¡Copiado para enviar a Fran!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Confirmar Cierre Diario y Copiar Minuta para Fran</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-xs text-emerald-900 hover:underline px-2 py-1 cursor-pointer"
              >
                Ocultar
              </button>
            </div>
          </div>
          <pre className="p-3 rounded-lg bg-white border border-emerald-200 text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto">
            {buildDailySummaryForFran()}
          </pre>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Tarjetas por Miembro del Directorio (Juan, Ale, Vane) + Botón Consolidado */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setAreaFilter('ALL')}
            data-testid="director-tab-all"
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              areaFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50/80 text-slate-800 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-sky-400" />
                <span>Consolidado Directorio</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {tickets.length} total
              </span>
            </div>
            <div className="text-sm font-bold mt-1.5">Juan + Ale + Vane</div>
            <p
              className={`text-[11px] mt-0.5 ${
                areaFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Vista completa de todas las áreas y lote diario unificado para Fran
            </p>
          </button>

          {DIRECTOR_PROFILES.map((dir) => {
            const areaTickets = tickets.filter((t) => t.area_directorio === dir.area);
            const pend = areaTickets.filter(
              (t) => !t.estado_aprobacion || t.estado_aprobacion === 'PENDIENTE_DIRECTORIO'
            ).length;
            const aprob = areaTickets.filter(
              (t) =>
                t.estado_aprobacion === 'APROBADA_PARA_FRAN' ||
                t.estado_aprobacion === 'MODIFICADA_Y_APROBADA'
            ).length;
            const isSelected = areaFilter === dir.area;

            return (
              <button
                key={dir.area}
                type="button"
                onClick={() => setAreaFilter(isSelected ? 'ALL' : dir.area)}
                data-testid={`director-tab-${dir.area}`}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/90 border-[#0072BC] ring-2 ring-[#0072BC]/25 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">{dir.nombre}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dir.badgeClass}`}>
                    {dir.shortName.split(' ')[0]}
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 truncate mt-0.5">{dir.modulos}</div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10.5px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                    ⏳ {pend} pend.
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    ✅ {aprob} aprob. Fran
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Barra de Filtros por Estado de Aprobación + Buscador */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3 text-[#0072BC]" />
              <span>Estado de Aprobación:</span>
            </span>
            {(
              [
                { id: 'ALL', label: `Todas (${kpis.total})` },
                { id: 'PENDIENTE_DIRECTORIO', label: `⏳ Pendientes Directorio (${kpis.pendientes})` },
                {
                  id: 'APROBADA_PARA_FRAN',
                  label: `✅ Aprobadas Directas (${kpis.aprobadasDirectas})`,
                },
                {
                  id: 'MODIFICADA_Y_APROBADA',
                  label: `✏️ Modificadas y Aprobadas (${kpis.modificadasAprobadas})`,
                },
                {
                  id: 'RECHAZADA_DESCARTADA',
                  label: `❌ Descartadas (${kpis.rechazadas})`,
                },
              ] as Array<{ id: 'ALL' | EstadoAprobacionDirectorio; label: string }>
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                  statusFilter === pill.id
                    ? 'bg-[#0072BC] text-white border-[#0072BC]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mejora, empleado, carpeta..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0072BC]"
            />
          </div>
        </div>

        {/* 4. Grilla Principal: Lista de Propuestas del Equipo (Izquierda) + Editor / Aprobador del Directorio (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Lista de Propuestas (6 columnas) */}
          <div className="lg:col-span-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
            <div
              className={`${
                compactMode ? 'max-h-[420px]' : 'max-h-[540px]'
              } overflow-y-auto divide-y divide-slate-200/80`}
            >
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Cargando propuestas de mejora del equipo...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No hay propuestas que coincidan con el filtro seleccionado.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = activeTicket?.id === t.id;
                  const est = t.estado_aprobacion || 'PENDIENTE_DIRECTORIO';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      data-testid={`mejora-row-${t.ticket_code}`}
                      className={`p-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50/95 border-l-4 border-l-[#0072BC]'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#0A2540] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {t.ticket_code}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {t.usuario_nombre}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            ({t.usuario_rol})
                          </span>
                          {t.carpeta_id && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-[#0072BC] border border-sky-200 font-mono text-[10px] font-bold">
                              {t.carpeta_id}
                            </span>
                          )}
                        </div>

                        {est === 'PENDIENTE_DIRECTORIO' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Pendiente {t.director_asignado_nombre?.split(' ')[0]}</span>
                          </span>
                        )}
                        {est === 'APROBADA_PARA_FRAN' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Aprobada para Fran</span>
                          </span>
                        )}
                        {est === 'MODIFICADA_Y_APROBADA' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0072BC] border border-sky-300 flex items-center gap-1">
                            <Edit3 className="h-3 w-3" />
                            <span>Modificada y Aprobada</span>
                          </span>
                        )}
                        {est === 'RECHAZADA_DESCARTADA' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>Descartada</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                        {t.mensaje_modificado_directorio || t.mensaje}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-500">
                        <span>
                          Área Directorio:{' '}
                          <strong className="text-slate-700">
                            {t.director_asignado_nombre || 'Juan Andrés Arloro'}
                          </strong>
                        </span>
                        <span className="font-mono">Pantalla: {t.pantalla}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel de Detalle, Modificación y Aprobación del Directorio (6 columnas) */}
          <div className="lg:col-span-6 border border-slate-200 rounded-xl bg-white p-4 shadow-2xs">
            {!activeTicket ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Seleccioná una propuesta de la izquierda para ver su detalle, modificarla o aprobarla para Fran.
              </div>
            ) : (
              <div className="space-y-3.5" data-testid="mejora-detail-editor">
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                        {activeTicket.ticket_code}
                      </span>
                      <span className="text-xs font-bold text-[#0072BC]">
                        Propuesto por: {activeTicket.usuario_nombre} ({activeTicket.usuario_email})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>
                        Pantalla: <code className="font-mono text-slate-700">{activeTicket.pantalla}</code>
                      </span>
                      <span>
                        Severidad: <strong className="text-slate-700">{activeTicket.severidad}</strong>
                      </span>
                      {activeTicket.carpeta_id && (
                        <Link
                          href={`/carpetas/${activeTicket.carpeta_id}`}
                          className="text-[#0072BC] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <FolderKanban className="h-3 w-3" />
                          <span>Ver Carpeta {activeTicket.carpeta_id}</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                      Socio Aprobador (Área)
                    </label>
                    <select
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value as DirectorioArea)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800"
                    >
                      <option value="OPERACIONES_SISTEMAS">Juan Arloro (Operaciones)</option>
                      <option value="COMERCIAL_PRICING">Alejandro Noacco (Comercial)</option>
                      <option value="ADMINISTRACION_FINANZAS">Vanesa Meggiolaro (Admin/Finanzas)</option>
                    </select>
                  </div>
                </div>

                {/* Mensaje Original del Empleado */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    1. Propuesta Original del Equipo ({activeTicket.usuario_nombre}):
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {activeTicket.mensaje}
                  </p>
                </div>

                {/* Capturas Adjuntas si existen */}
                {activeTicket.screenshots && activeTicket.screenshots.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                      Capturas de Pantalla Adjuntas ({activeTicket.screenshots.length}):
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeTicket.screenshots.map((shot, idx) => (
                        <a
                          key={idx}
                          href={shot.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block border border-slate-200 rounded-lg overflow-hidden hover:border-[#0072BC]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={shot.dataUrl}
                            alt={shot.name}
                            className="w-full h-24 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editor del Directorio para Modificar el Alcance antes de Aprobar */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      2. Especificación / Alcance Aprobado por Directorio (Editable por Juan, Ale o Vane):
                    </span>
                    <span className="text-[10px] font-normal text-slate-500">
                      Podés editar el texto si querés ajustar lo que pidió el empleado
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={editMensajeModificado}
                    onChange={(e) => setEditMensajeModificado(e.target.value)}
                    data-testid="input-alcance-directorio"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0072BC]"
                  />
                </div>

                {/* Nota Ejecutiva para Fran */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-800">
                    3. Nota o Instrucción del Directorio para Francisco (Fran):
                  </label>
                  <input
                    type="text"
                    value={editNotaFran}
                    onChange={(e) => setEditNotaFran(e.target.value)}
                    data-testid="input-nota-fran"
                    placeholder="Ej: Aprobado por Juan/Ale/Vane. Priorizar para el corte de hoy..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0072BC]"
                  />
                </div>

                {/* Estado de Resolución Actual */}
                {activeTicket.resuelto_por_nombre && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Última resolución por <strong>{activeTicket.resuelto_por_nombre}</strong>
                      {activeTicket.lote_diario_fecha
                        ? ` · Incluida en Lote Diario ${activeTicket.lote_diario_fecha}`
                        : ''}
                    </span>
                    <span className="font-mono font-bold">{activeTicket.estado_aprobacion}</span>
                  </div>
                )}

                {/* Botones de Acción del Directorio */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSavingAction}
                      onClick={() =>
                        handleDecision(activeTicket, 'APROBADA_PARA_FRAN', false)
                      }
                      data-testid="btn-aprobar-directo-fran"
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Aprobar para Fran</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingAction}
                      onClick={() =>
                        handleDecision(activeTicket, 'MODIFICADA_Y_APROBADA', true)
                      }
                      data-testid="btn-modificar-y-aprobar-fran"
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-[#0072BC] hover:bg-[#005a96] text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Guardar Modificación y Aprobar</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingAction}
                    onClick={() =>
                      handleDecision(activeTicket, 'RECHAZADA_DESCARTADA', false)
                    }
                    data-testid="btn-descartar-mejora"
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Descartar / Posponer</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
