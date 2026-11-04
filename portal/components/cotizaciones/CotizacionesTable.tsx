'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Plane,
  Ship,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  MessageSquare,
  MessageSquarePlus,
  X,
  TrendingDown,
  Check,
  ClipboardCopy,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  Ruler,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import {
  CotizacionRecord,
  ViaTransporte,
  EstadoCotizacion,
  TipoFeedbackComercial,
  FeedbackComercialRegistro,
  BultoItem,
} from '@/types/cotizaciones';
import { KipintochSaleCopyButton } from './KipintochSaleCopyButton';
import { CubicajeInteligenteModal } from './CubicajeInteligenteModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/ToastProvider';
import { formatearCotizacionParaKipintoch } from '@/lib/calculadora-logistica';
import { canAccessFinancials, type UserRole } from '@/lib/auth';
import { useAuth } from '@/components/auth/RoleGuard';
import { cn } from '@/lib/utils';

interface CotizacionesTableProps {
  cotizaciones?: CotizacionRecord[];
  initialCotizaciones?: CotizacionRecord[];
  onOpenCalculadora?: () => void;
  onOpenCalculadoraWithBultos?: (bultos: BultoItem[]) => void;
  onOpenCubicajeModal?: () => void;
  onUpdateFeedback?: (cotId: string, feedback: string, registro?: FeedbackComercialRegistro) => void;
  userRole?: UserRole;
}

export function CotizacionesTable({
  cotizaciones: propCotizaciones,
  initialCotizaciones,
  onOpenCalculadora = () => {},
  onOpenCalculadoraWithBultos,
  onOpenCubicajeModal,
  onUpdateFeedback,
  userRole,
}: CotizacionesTableProps) {
  const cotizaciones = propCotizaciones ?? initialCotizaciones ?? [];
  const [items, setItems] = React.useState<CotizacionRecord[]>(cotizaciones);

  React.useEffect(() => {
    setItems(cotizaciones);
  }, [cotizaciones]);

  const auth = useAuth();
  const effectiveRole = userRole || auth.role || 'OPERATIVO';
  const showFinancials = canAccessFinancials(effectiveRole);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (q && q.trim()) {
        setSearchTerm(q.trim());
      }
    } catch {
      void 0;
    }
  }, []);
  const [selectedEstado, setSelectedEstado] = React.useState<string>('TODAS');
  const [selectedVia, setSelectedVia] = React.useState<string>('TODAS');
  const [selectedResponsable, setSelectedResponsable] = React.useState<string>('TODOS');
  const [isCubicajeModalOpen, setIsCubicajeModalOpen] = React.useState(false);
  const [openingFolderId, setOpeningFolderId] = React.useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Feedback Modal State
  const [feedbackModalCot, setFeedbackModalCot] = React.useState<CotizacionRecord | null>(null);
  const [tipoFeedback, setTipoFeedback] = React.useState<TipoFeedbackComercial>('COMPETENCIA_MENOR_PRECIO');
  const [descripcionFeedback, setDescripcionFeedback] = React.useState('');
  const [diferenciaPrecioUsd, setDiferenciaPrecioUsd] = React.useState<string>('');
  const [registradoPor, setRegistradoPor] = React.useState('Lucía Laje');

  // Protected Expired Rate Confirmation Modal State
  const [confirmVencidaCot, setConfirmVencidaCot] = React.useState<CotizacionRecord | null>(null);
  const [copiedExpired, setCopiedExpired] = React.useState(false);

  const handleUpdateStatusKipintoch = async (cotId: string, newStatus: 'Pendiente' | 'Confirmada' | 'Vencida') => {
    setItems((prev) =>
      prev.map((c) =>
        c.id === cotId
          ? {
              ...c,
              statusKipintoch: newStatus,
              estado: newStatus === 'Confirmada' ? 'GANADA' : newStatus === 'Vencida' ? 'PERDIDA' : 'COTIZADA',
            }
          : c
      )
    );

    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`/api/cotizaciones/${encodeURIComponent(cotId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusKipintoch: newStatus }),
        });
        if (res.ok) {
          toast.success('Estado actualizado', `Cotización marcada como ${newStatus}.`);
        } else {
          toast.error('Error al actualizar', 'No se pudo actualizar el estado de la cotización.');
        }
      }
    } catch {
      // offline
    }
  };

  const handleAbrirCarpeta = async (cot: CotizacionRecord) => {
    setOpeningFolderId(cot.id);
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`/api/cotizaciones/${encodeURIComponent(cot.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: 'abrir_carpeta' }),
        });
        if (res.ok) {
          const json = await res.json();
          const newCarpeta = json.carpeta;
          setItems((prev) =>
            prev.map((c) =>
              c.id === cot.id
                ? {
                    ...c,
                    carpetaOperativaId: newCarpeta.id,
                    carpetaCodigo: newCarpeta.numero_carpeta,
                    carpetaNumeroInterno: newCarpeta.numero_carpeta,
                    statusKipintoch: 'Confirmada',
                    estado: 'GANADA',
                  }
                : c
            )
          );
          toast.success(
            'Carpeta operativa creada',
            `Se abrió exitosamente la carpeta ${newCarpeta.numero_carpeta} en estado Orden de venta vinculada a la cotización.`
          );
        } else {
          const errData = await res.json().catch(() => null);
          toast.error('Error al abrir carpeta', errData?.error || 'No se pudo generar la carpeta operativa.');
        }
      }
    } catch {
      toast.error('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setOpeningFolderId(null);
    }
  };

  const formatDateVal = (dateVal?: string): string => {
    if (!dateVal) return '-';
    if (dateVal.includes('/') && !dateVal.includes('T')) return dateVal;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateVal;
    }
  };

  const filteredCotizaciones = React.useMemo(() => {
    return items.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (c.clienteNombre || '').toLowerCase().includes(q) ||
        (c.numeroCotizacion || '').toLowerCase().includes(q) ||
        (c.propuestaComercialCodigo && c.propuestaComercialCodigo.toLowerCase().includes(q)) ||
        (c.cotizacionCodigo && c.cotizacionCodigo.toLowerCase().includes(q)) ||
        (c.carpetaCodigo && c.carpetaCodigo.toLowerCase().includes(q)) ||
        (c.usuarioPricing && c.usuarioPricing.toLowerCase().includes(q)) ||
        (c.vendedor && c.vendedor.toLowerCase().includes(q)) ||
        (c.agenteTransportista && c.agenteTransportista.toLowerCase().includes(q)) ||
        (c.shipperProveedor && c.shipperProveedor.toLowerCase().includes(q)) ||
        (c.carpetaNumeroInterno && c.carpetaNumeroInterno.toLowerCase().includes(q)) ||
        (c.origen || '').toLowerCase().includes(q) ||
        (c.destino || '').toLowerCase().includes(q) ||
        (c.navieraOAerolineaSugerida && c.navieraOAerolineaSugerida.toLowerCase().includes(q));

      const matchEstado =
        selectedEstado === 'TODAS' || c.estado === selectedEstado;

      const matchVia = selectedVia === 'TODAS' || c.via === selectedVia;

      const matchResponsable =
        selectedResponsable === 'TODOS' ||
        c.responsableComercial === selectedResponsable ||
        c.usuarioPricing === selectedResponsable ||
        c.vendedor === selectedResponsable;

      return matchSearch && matchEstado && matchVia && matchResponsable;
    });
  }, [items, searchTerm, selectedEstado, selectedVia, selectedResponsable]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEstado, selectedVia, selectedResponsable, pageSize]);

  const totalPages = Math.ceil(filteredCotizaciones.length / pageSize) || 1;
  const paginatedCotizaciones = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCotizaciones.slice(start, start + pageSize);
  }, [filteredCotizaciones, currentPage, pageSize]);

  const availableResponsables = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of items) {
      const names = [c.responsableComercial, c.usuarioPricing, c.vendedor].filter(Boolean) as string[];
      for (const name of names) {
        counts[name] = (counts[name] || 0) + 1;
      }
    }
    const canonicalList = [
      'Lucía Laje',
      'Nerea Guida',
      'Martín Fusco',
      'Juan Andrés Arloro',
      'Victoria Moyano',
      'Abril Stampfli',
      'Zamira Abraham',
      'Alejandro Noacco',
    ];
    const allNames = Array.from(new Set([...canonicalList, ...Object.keys(counts)]));
    return allNames.map((name) => ({
      name,
      count: counts[name] || 0,
    }));
  }, [items]);

  const renderViaIcon = (via?: ViaTransporte, tipoServicio?: string) => {
    if (via === 'AEREO' || tipoServicio === 'AEREO') {
      return <Plane className="h-3.5 w-3.5 text-sky-600 inline mr-1" />;
    }
    if (via === 'TERRESTRE' || tipoServicio === 'FTL') {
      return <Truck className="h-3.5 w-3.5 text-amber-600 inline mr-1" />;
    }
    return <Ship className="h-3.5 w-3.5 text-teal-600 inline mr-1" />;
  };

  const renderKipintochStatusBadge = (c: CotizacionRecord) => {
    const isVencida = checkIsVencida(c);
    let statusText: 'Confirmada' | 'Pendiente' | 'Vencida';

    if (c.statusKipintoch) {
      statusText = c.statusKipintoch;
    } else if (c.estado === 'GANADA') {
      statusText = 'Confirmada';
    } else if (isVencida || c.estado === 'PERDIDA' || c.estado === 'ANULADA') {
      statusText = 'Vencida';
    } else {
      statusText = 'Pendiente';
    }

    const hasFolder = Boolean(c.carpetaOperativaId || c.carpetaCodigo || c.carpetaNumeroInterno);

    return (
      <div className="flex flex-col gap-1.5" data-testid={`status-badge-${c.id}`}>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0',
              statusText === 'Confirmada'
                ? 'bg-emerald-500'
                : statusText === 'Pendiente'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            )}
          />
          <select
            value={statusText}
            onChange={(e) =>
              handleUpdateStatusKipintoch(c.id, e.target.value as 'Confirmada' | 'Pendiente' | 'Vencida')
            }
            className={`text-[11px] font-semibold rounded px-2 py-0.5 border cursor-pointer focus:outline-none ${
              statusText === 'Confirmada'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : statusText === 'Pendiente'
                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                : 'bg-rose-50 text-rose-800 border-rose-200/80'
            }`}
            aria-label={`Estado Kipintoch de cotización ${c.numeroCotizacion}`}
          >
            <option value="Pendiente">⏳ Pendiente</option>
            <option value="Confirmada">✓ Confirmada</option>
            <option value="Vencida">✗ Vencida</option>
          </select>
        </div>

        {/* Action button to open folder if confirmed and no folder yet */}
        {statusText === 'Confirmada' && !hasFolder && (
          <button
            type="button"
            disabled={openingFolderId === c.id}
            onClick={() => handleAbrirCarpeta(c)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e3d2f] hover:bg-[#152b21] text-white text-[10px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
            title="Crear carpeta operativa correlativa (Orden de venta) en Kipintoch"
          >
            <FolderPlus className="h-3 w-3" />
            <span>{openingFolderId === c.id ? 'Abriendo...' : 'Abrir Carpeta'}</span>
          </button>
        )}
      </div>
    );
  };

  const renderEstadoBadge = (estado: EstadoCotizacion) => {
    switch (estado) {
      case 'GANADA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>Ganada / En Kipin</span>
          </span>
        );
      case 'REQUIERE_SEGUIMIENTO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <Clock className="h-3 w-3 text-amber-600 shrink-0" />
            <span>Smart Follow-Up</span>
          </span>
        );
      case 'COTIZADA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-800 border border-sky-200/80 flex items-center gap-1.5 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
            <span>En Evaluación (&lt;48h)</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 w-fit">
            {estado}
          </span>
        );
    }
  };

  const checkIsVencida = (c: CotizacionRecord): boolean => {
    if (c.tarifaVencida === true) return true;
    if (c.fechaVencimientoTarifa) {
      const now = new Date();
      const vencDate = new Date(c.fechaVencimientoTarifa);
      const diffMs = vencDate.getTime() - now.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diasRestantes <= 0;
    }
    return false;
  };

  const renderVigenciaBadge = (c: CotizacionRecord) => {
    const now = new Date();
    let diasRestantes: number | null = null;
    let isVencida = c.tarifaVencida === true;

    if (c.fechaVencimientoTarifa) {
      const vencDate = new Date(c.fechaVencimientoTarifa);
      const diffMs = vencDate.getTime() - now.getTime();
      diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 0) {
        isVencida = true;
      }
    }

    if (isVencida) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200/80 w-fit"
          data-testid={`vigencia-badge-${c.id}`}
          title="Tarifa caducada. Requiere re-cotización antes de confirmar booking comercial."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
          <span>Tarifa Vencida</span>
        </span>
      );
    }

    if (diasRestantes !== null && diasRestantes <= 5) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 w-fit"
          data-testid={`vigencia-badge-${c.id}`}
          title="Tarifa por caducar próximamente. Seguimiento comercial urgente."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <Clock className="h-3 w-3 text-amber-600 shrink-0" />
          <span>Por Vencer ({diasRestantes}d)</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 w-fit"
        data-testid={`vigencia-badge-${c.id}`}
        title="Tarifa vigente y operable con la naviera o aerolínea."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
        <span>Tarifa Vigente {diasRestantes !== null ? `(${diasRestantes}d)` : ''}</span>
      </span>
    );
  };

  const handleOpenFeedbackModal = (c: CotizacionRecord) => {
    setFeedbackModalCot(c);
    if (c.feedbackRegistro) {
      setTipoFeedback(c.feedbackRegistro.tipo);
      setDescripcionFeedback(c.feedbackRegistro.descripcion);
      setDiferenciaPrecioUsd(c.feedbackRegistro.diferenciaPrecioUsd?.toString() || '');
      setRegistradoPor(c.feedbackRegistro.registradoPor || 'Lucía Laje');
    } else if (c.feedbackComercial) {
      setTipoFeedback('OTRO');
      setDescripcionFeedback(c.feedbackComercial);
      setDiferenciaPrecioUsd('');
      setRegistradoPor('Lucía Laje');
    } else {
      setTipoFeedback('COMPETENCIA_MENOR_PRECIO');
      setDescripcionFeedback('');
      setDiferenciaPrecioUsd('');
      setRegistradoPor('Lucía Laje');
    }
  };

  const handleSaveFeedback = () => {
    if (!feedbackModalCot) return;
    const diffNum = diferenciaPrecioUsd ? parseFloat(diferenciaPrecioUsd) : undefined;
    const registro: FeedbackComercialRegistro = {
      tipo: tipoFeedback,
      descripcion: descripcionFeedback.trim(),
      fechaRegistro: new Date().toISOString(),
      registradoPor: registradoPor.trim() || 'Lucía Laje',
      diferenciaPrecioUsd: diffNum,
    };

    if (onUpdateFeedback) {
      onUpdateFeedback(feedbackModalCot.id, registro.descripcion, registro);
    }

    if (typeof fetch !== 'undefined') {
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'SUGERENCIA',
          severidad: 'BAJA',
          mensaje: `[Feedback Comercial] ${feedbackModalCot.numeroCotizacion} - ${feedbackModalCot.clienteNombre}: ${registro.tipo} - ${registro.descripcion}`,
          pantalla: '/cotizaciones',
          carpeta_id: feedbackModalCot.numeroCotizacion,
          usuario_nombre: registro.registradoPor,
          usuario_email: auth.user?.email || 'comercial@almar.com.ar',
          usuario_rol: effectiveRole,
          contexto_adicional: {
            cotizacion_id: feedbackModalCot.id,
            numero_cotizacion: feedbackModalCot.numeroCotizacion,
            cliente: feedbackModalCot.clienteNombre,
            tipo_feedback: registro.tipo,
            diferencia_usd: registro.diferenciaPrecioUsd,
          },
        }),
      }).catch(() => {});
    }

    toast.success(
      'Feedback comercial registrado',
      `Se guardó el feedback para la cotización ${feedbackModalCot.numeroCotizacion} (${feedbackModalCot.clienteNombre}).`
    );
    setFeedbackModalCot(null);
  };

  const handleConfirmCopyExpired = async (cot: CotizacionRecord) => {
    try {
      const payload = formatearCotizacionParaKipintoch(cot);
      await navigator.clipboard.writeText(payload);
      setCopiedExpired(true);
      toast.warning(
        'Venta copiada con tarifa vencida',
        `Payload de ${cot.numeroCotizacion} copiado al portapapeles. ADVERTENCIA: La tarifa naviera caducó. Verificar desvíos con Jefatura.`
      );
      setTimeout(() => {
        setCopiedExpired(false);
        setConfirmVencidaCot(null);
      }, 1500);
    } catch {
      toast.error('Error al copiar', 'No se pudo acceder al portapapeles.');
    }
  };

  const renderFeedbackCell = (c: CotizacionRecord) => {
    const reg = c.feedbackRegistro;
    const textFallback = c.feedbackComercial;

    if (!reg && !textFallback) {
      return (
        <button
          onClick={() => handleOpenFeedbackModal(c)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#0072BC] hover:underline transition-colors cursor-pointer"
          title="Asentar feedback comercial post-cotización"
        >
          <MessageSquarePlus className="h-3 w-3" />
          <span>+ Feedback</span>
        </button>
      );
    }

    let badgeClass = 'bg-slate-100 text-slate-800 border-slate-300';
    let label = 'Feedback';
    const tipo = reg?.tipo;

    if (tipo === 'COMPETENCIA_MENOR_PRECIO') {
      badgeClass = 'bg-purple-50 text-purple-800 border-purple-300';
      label = reg?.diferenciaPrecioUsd
        ? `Competencia (-USD ${Math.abs(reg.diferenciaPrecioUsd)})`
        : 'Competencia Menor Precio';
    } else if (tipo === 'CARGA_DIFERIDA') {
      badgeClass = 'bg-blue-50 text-blue-800 border-blue-300';
      label = 'Carga Diferida';
    } else if (tipo === 'EVALUACION_GERENCIA') {
      badgeClass = 'bg-amber-50 text-amber-900 border-amber-300';
      label = 'En Evaluación Gerencia';
    } else if (tipo === 'CAMBIO_CONDICIONES') {
      badgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-300';
      label = 'Cambio Condiciones';
    } else if (tipo === 'FALTA_ESPACIO_NAVIERA') {
      badgeClass = 'bg-orange-50 text-orange-900 border-orange-300';
      label = 'Falta Espacio';
    } else {
      label = 'Otro Feedback';
    }

    const desc = reg?.descripcion || textFallback || '';

    return (
      <div className="space-y-0.5">
        <button
          onClick={() => handleOpenFeedbackModal(c)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-all hover:shadow-2xs ${badgeClass}`}
          title={`${desc} (Clic para editar)`}
        >
          <MessageSquare className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate max-w-[130px]">{label}</span>
        </button>
        <span
          className="block text-[10px] text-slate-500 truncate max-w-[140px]"
          title={desc}
        >
          {desc}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, cotización, ruta o naviera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Asesor:</span>
            <select
              value={selectedResponsable}
              onChange={(e) => setSelectedResponsable(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-xs"
            >
              <option value="TODOS">Todos ({cotizaciones.length.toLocaleString('es-AR')})</option>
              {availableResponsables.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.count.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-xs"
            >
              <option value="TODAS">Todos</option>
              <option value="REQUIERE_SEGUIMIENTO">Requiere Follow-Up</option>
              <option value="GANADA">Ganadas</option>
              <option value="COTIZADA">En Espera (&lt;48h)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Vía:</span>
            <select
              value={selectedVia}
              onChange={(e) => setSelectedVia(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-xs"
            >
              <option value="TODAS">Todas</option>
              <option value="MARITIMO_FCL">Marítimo FCL</option>
              <option value="MARITIMO_LCL">Marítimo LCL</option>
              <option value="AEREO">Aéreo</option>
              <option value="TERRESTRE">Terrestre</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onOpenCubicajeModal) {
                  onOpenCubicajeModal();
                } else {
                  setIsCubicajeModalOpen(true);
                }
              }}
              className="border-sky-300 bg-sky-50 text-[#0072BC] hover:bg-sky-100 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
            >
              <Ruler className="h-3.5 w-3.5 text-[#0072BC]" />
              <span>📐 Calcular m³ (IA)</span>
            </Button>

            <Button
              size="sm"
              onClick={onOpenCalculadora}
              className="bg-[#0072BC] hover:bg-[#005d99] text-white text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <span>+ Nueva Cotización</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Cards (< 768px) */}
      <div className="md:hidden divide-y divide-slate-200">
        {paginatedCotizaciones.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No se encontraron cotizaciones con los filtros seleccionados.
          </div>
        ) : (
          paginatedCotizaciones.map((c) => {
            const isVencida = checkIsVencida(c);
            const fechaEmisionFmt = new Date(c.fechaEmision).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            return (
              <div key={`mobile-cot-${c.id}`} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      {renderViaIcon(c.via, c.tipoServicio)}
                      <span>{c.propuestaComercialCodigo || c.numeroCotizacion}</span>
                    </div>
                    <div className="font-mono text-[11px] font-bold text-[#0072BC]">
                      {c.cotizacionCodigo || c.numeroCotizacion} • {c.tipoServicio || c.via.replace('_', ' ')}
                    </div>
                    {typeof c.cbmTotal === 'number' && c.cbmTotal >= 0.05 && c.cbmTotal <= 300 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          📦 {c.cbmTotal.toFixed(2)} m³{(c.pesoBrutoKg || 0) > 0 ? ` • ${(c.pesoBrutoKg || 0).toLocaleString('es-AR')} kg` : ''}
                        </span>
                        {c.via === 'MARITIMO_LCL' && c.cbmTotal > 15 && c.cbmTotal <= 68 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            ✨ 20&apos; STD Sugerido
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {renderKipintochStatusBadge(c)}
                </div>

                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">{c.clienteNombre}</div>
                  {(c.agenteTransportista || c.navieraOAerolineaSugerida) && (
                    <div className="text-[11px] text-slate-600">
                      <span className="text-slate-400">Agente/Transp:</span> {c.agenteTransportista || c.navieraOAerolineaSugerida}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-700 font-medium pt-0.5">
                    {c.origen} → {c.destino}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Emisión: {fechaEmisionFmt} •Pricing: {c.usuarioPricing || c.responsableComercial} • Vend: {c.vendedor || c.responsableComercial}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    {(c.carpetaNumeroInterno || c.carpetaOperativaId || c.carpetaCodigo) ? (
                      <Link
                        href={`/carpetas/${encodeURIComponent(c.carpetaOperativaId || c.carpetaCodigo || c.carpetaNumeroInterno || '')}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0072BC] bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
                      >
                        <span>{`Carpeta: ${c.carpetaNumeroInterno || c.carpetaCodigo || c.carpetaOperativaId}`}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    ) : showFinancials ? (
                      <span className="text-xs font-mono font-bold text-slate-900">
                        USD {c.fleteVentaUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    {isVencida ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmVencidaCot(c)}
                        className="border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] h-7 gap-1"
                      >
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                        <span>Copiar (Vencida)</span>
                      </Button>
                    ) : (
                      <KipintochSaleCopyButton cotizacion={c} size="sm" showLabel={true} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Table (Desktop & Laptop >= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-enterprise">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs text-slate-700 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 shadow-2xs">
            <tr>
              <th className="py-2.5 px-3"># / Propuesta</th>
              <th className="py-2.5 px-3">Empresas</th>
              <th className="py-2.5 px-3">Fechas &amp; Vigencia Tarifa</th>
              <th className="py-2.5 px-3">Origen / Destino</th>
              <th className="py-2.5 px-3">Cotización &amp; Servicio</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Venta / Costo / Margen</th>
              <th className="py-2.5 px-3 text-center">Acción Kipintoch (Ctrl+V)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {paginatedCotizaciones.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                  No se encontraron cotizaciones con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedCotizaciones.map((c) => {
                const isVencida = checkIsVencida(c);
                const isMarginCritico = c.margenBrutoUsd < 3.00;
                const isMarginMinimo = !isMarginCritico && c.margenBrutoUsd < 200.00;
                const fechaEmisionFmt = new Date(c.fechaEmision).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Col 1: # / Propuesta */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-md bg-slate-100 p-1.5 shrink-0" title={`Vía: ${c.via}`}>
                          {renderViaIcon(c.via, c.tipoServicio)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {c.propuestaComercialCodigo || c.numeroCotizacion}
                            </span>
                            {c.horasDesdeEmision !== undefined && c.estado === 'REQUIERE_SEGUIMIENTO' && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 font-mono font-bold" title="Horas transcurridas sin respuesta">
                                {c.horasDesdeEmision}h
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                            <span className="text-slate-400">Usuario:</span>{' '}
                            <span className="font-semibold text-slate-700">{c.usuarioPricing || c.responsableComercial}</span>
                          </div>
                          <div className="text-[10px] text-slate-600 leading-tight">
                            <span className="text-slate-400">Vendedor:</span>{' '}
                            <span className="font-medium text-slate-700">{c.vendedor || c.responsableComercial}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Empresas */}
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900 leading-snug">{c.clienteNombre}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {c.clienteCuit || 'CUIT Verificado'}
                        </span>
                        {c.segmento === 'ESTRATEGICO_CORPORATIVO' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Corporativo
                          </span>
                        )}
                        {c.segmento === 'NUEVO_DESARROLLO' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Nuevo
                          </span>
                        )}
                      </div>
                      {(c.agenteTransportista || c.navieraOAerolineaSugerida) && (
                        <div className="text-[11px] text-slate-600 mt-1 leading-tight flex items-start gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold shrink-0">Agente/Transp:</span>
                          <span
                            className="text-slate-700 font-medium truncate max-w-[200px]"
                            title={c.agenteTransportista || c.navieraOAerolineaSugerida}
                          >
                            {c.agenteTransportista || c.navieraOAerolineaSugerida}
                          </span>
                        </div>
                      )}
                      {c.shipperProveedor && (
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-tight flex items-start gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold shrink-0">Shipper:</span>
                          <span
                            className="text-slate-700 font-medium truncate max-w-[200px]"
                            title={c.shipperProveedor}
                          >
                            {c.shipperProveedor}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Col 3: Fechas & Vigencia */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-slate-700 font-mono leading-tight">
                          <span className="text-slate-400 font-sans">Emisión:</span> {fechaEmisionFmt}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono leading-tight">
                          <span className="text-slate-400 font-sans">Desde:</span> {c.fechaDesde ? formatDateVal(c.fechaDesde) : fechaEmisionFmt}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono leading-tight">
                          <span className="text-slate-400 font-sans">Hasta:</span> {c.fechaHasta ? formatDateVal(c.fechaHasta) : c.fechaVencimientoTarifa ? formatDateVal(c.fechaVencimientoTarifa) : fechaEmisionFmt}
                        </div>
                        <div className="pt-1">
                          {renderVigenciaBadge(c)}
                        </div>
                      </div>
                    </td>

                    {/* Col 4: Origen / Destino */}
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-slate-800 space-y-0.5">
                        <div className="leading-tight">
                          <span className="text-slate-400 font-normal mr-1">Origen:</span>
                          <span className="font-semibold text-slate-900">{c.origen}</span>
                        </div>
                        <div className="leading-tight">
                          <span className="text-slate-400 font-normal mr-1">Destino:</span>
                          <span className="font-semibold text-slate-900">{c.destino}</span>
                        </div>
                        {c.incoterm && (
                          <div className="pt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {c.incoterm}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Col 5: Cotización & Servicio */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-[#0072BC] text-xs">
                          {c.cotizacionCodigo || c.numeroCotizacion}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          <span className="text-slate-400">Tipo:</span> {c.tipoServicio || c.via.replace('_', ' ')}
                        </div>
                        {typeof c.cbmTotal === 'number' && c.cbmTotal >= 0.05 && c.cbmTotal <= 300 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              title={`Cubicaje: ${c.cbmTotal} m³ • Peso: ${(c.pesoBrutoKg || 0).toLocaleString('es-AR')} kg • Bultos: ${c.cantidadBultos || 0}`}
                            >
                              <span>📦 {c.cbmTotal.toFixed(2)} m³{(c.pesoBrutoKg || 0) > 0 ? ` • ${(c.pesoBrutoKg || 0).toLocaleString('es-AR')} kg` : ''}</span>
                            </span>
                            {c.via === 'MARITIMO_LCL' && c.cbmTotal > 15 && c.cbmTotal <= 68 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                title="Volumen > 15 m³: Sugerencia Comercial FCL 20' STD (costo LCL + desconsolidación superior al contenedor exclusivo)"
                              >
                                <span>✨ 20&apos; STD Sugerido</span>
                              </span>
                            )}
                          </div>
                        )}
                        {(c.carpetaNumeroInterno || c.carpetaOperativaId || c.carpetaCodigo) && (
                          <Link
                            href={`/carpetas/${encodeURIComponent(c.carpetaOperativaId || c.carpetaCodigo || c.carpetaNumeroInterno || '')}`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0072BC] hover:underline bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 hover:bg-sky-100 transition-colors"
                            title={`Abrir carpeta operativa ${c.carpetaNumeroInterno || c.carpetaCodigo || c.carpetaOperativaId}`}
                          >
                            <span>{`Carpeta: ${c.carpetaNumeroInterno || c.carpetaCodigo || c.carpetaOperativaId}`}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* Col 6: Status + Feedback */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1.5">
                        {renderKipintochStatusBadge(c)}
                        <div>{renderFeedbackCell(c)}</div>
                      </div>
                    </td>

                    {/* Col 7: Financials / RBAC */}
                    <td className="py-2.5 px-3 text-right">
                      {showFinancials ? (
                        <div className="space-y-0.5 tabular-nums font-mono text-right">
                          <div className="font-bold text-slate-900 text-xs">
                            USD {c.fleteVentaUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Costo: USD {c.fleteCostoEstimadoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="flex items-center justify-end gap-1 pt-0.5">
                            {isMarginCritico && (
                              <span title="BLOQUEO ESTRICTO (< USD 3.00): Margen nulo o negativo. Requiere autorización formal." className="inline-flex">
                                <AlertOctagon className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              </span>
                            )}
                            {isMarginMinimo && (
                              <span title="ALERTA PREVENTIVA DE MARGEN (< USD 200 - Directiva Vanesa Meggiolaro): Riesgo por descalce en pesos o gastos locales." className="inline-flex">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                            <span
                              className={`font-bold text-[11px] ${
                                isMarginCritico
                                  ? 'text-rose-700'
                                  : isMarginMinimo
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              +USD {c.margenBrutoUsd.toLocaleString('es-AR')} ({c.margenPorcentaje.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                          title="Información de costos y rentabilidad restringida bajo norma de confidencialidad y control interno (Requiere rol Finanzas o Dirección)"
                        >
                          🔒 Confidencial
                        </span>
                      )}
                    </td>

                    {/* Col 8: Acción Kipintoch */}
                    <td className="py-2.5 px-3 text-center">
                      {isVencida ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmVencidaCot(c)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] gap-1 font-medium bg-white cursor-pointer shadow-2xs"
                          title="Tarifa vencida: requiere confirmación explícita para copiar al ERP"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Copiar (Vencida)</span>
                        </Button>
                      ) : (
                        <KipintochSaleCopyButton cotizacion={c} size="sm" showLabel={true} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Paginación */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-600 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong>{paginatedCotizaciones.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> a{' '}
            <strong>{Math.min(currentPage * pageSize, filteredCotizaciones.length)}</strong> de{' '}
            <strong>{filteredCotizaciones.length}</strong> cotizaciones ({cotizaciones.length} totales en catálogo).
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 border-l border-slate-300 pl-2">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-slate-800 text-[11px]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Controles de Paginación */}
        <div className="flex items-center gap-1 self-end sm:self-center" data-testid="cotizaciones-pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2 text-xs border-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Anterior</span>
          </Button>

          <span className="px-2 text-xs font-semibold text-slate-700 tabular-nums">
            Página {currentPage} de {Math.max(1, totalPages)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= Math.max(1, totalPages)}
            onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
            className="h-7 px-2 text-xs border-slate-300 disabled:opacity-40"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Interactive Modal: Registro de Feedback Comercial */}
      {feedbackModalCot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold">
                  Feedback Comercial — {feedbackModalCot.numeroCotizacion}
                </h3>
              </div>
              <button
                onClick={() => setFeedbackModalCot(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Cliente / Cuenta:</span>
                  <span className="font-bold text-slate-900">{feedbackModalCot.clienteNombre}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Flete Cotizado:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    USD {feedbackModalCot.fleteVentaUsd.toLocaleString('es-AR')} ({feedbackModalCot.via})
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Categoría del Feedback Comercial:
                </label>
                <select
                  value={tipoFeedback}
                  onChange={(e) => setTipoFeedback(e.target.value as TipoFeedbackComercial)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-medium focus:ring-1 focus:ring-[#0072BC]"
                >
                  <option value="COMPETENCIA_MENOR_PRECIO">Competencia cotizó menor precio</option>
                  <option value="CARGA_DIFERIDA">Carga diferida por producción/embarque</option>
                  <option value="EVALUACION_GERENCIA">En evaluación por Gerencia del cliente</option>
                  <option value="CAMBIO_CONDICIONES">Cliente evalúa cambio de Incoterm o puerto</option>
                  <option value="FALTA_ESPACIO_NAVIERA">Dificultad de espacio / rolleo en naviera</option>
                  <option value="OTRO">Otro motivo comercial</option>
                </select>
              </div>

              {tipoFeedback === 'COMPETENCIA_MENOR_PRECIO' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diferencia de Precio Estimada (USD):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ej. -150"
                      value={diferenciaPrecioUsd}
                      onChange={(e) => setDiferenciaPrecioUsd(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-mono focus:ring-1 focus:ring-[#0072BC]"
                    />
                    <TrendingDown className="h-3.5 w-3.5 absolute left-2.5 top-2 text-rose-500" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ingrese el monto en USD que cotizó por debajo la competencia (ej. 150).
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción Cualitativa del Cliente:
                </label>
                <textarea
                  rows={3}
                  placeholder="Detallar comentarios del cliente, transportista competidor o fecha estimada de reactivación..."
                  value={descripcionFeedback}
                  onChange={(e) => setDescripcionFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Registrado Por:
                  </label>
                  <input
                    type="text"
                    value={registradoPor}
                    onChange={(e) => setRegistradoPor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha de Registro:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={new Date().toLocaleDateString('es-AR')}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedbackModalCot(null)}
                  className="text-slate-700 border-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFeedback}
                  className="bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Guardar Feedback</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Protected Expired Rate Copy */}
      {confirmVencidaCot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-rose-300 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
                <h3 className="text-sm font-bold">
                  Advertencia: Tarifa Naviera Caducada
                </h3>
              </div>
              <button
                onClick={() => setConfirmVencidaCot(null)}
                className="text-rose-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
                <p className="font-bold text-rose-950">
                  Cotización {confirmVencidaCot.numeroCotizacion} — {confirmVencidaCot.clienteNombre}
                </p>
                <p className="text-rose-800 text-[11px]">
                  La tarifa de flete base cargada en esta cotización se encuentra <strong>VENCIDA</strong>.
                  El traspaso a Kipintoch ERP sin revalidación puede generar un desvío operativo en el costo final liquidado por la naviera.
                </p>
              </div>

              <p className="text-slate-600 text-[11px]">
                ¿Confirma el copiado del pase comercial a Kipintoch bajo apercibimiento comercial?
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmVencidaCot(null)}
                  className="text-slate-700 border-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmCopyExpired(confirmVencidaCot)}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-semibold gap-1.5 shadow-sm"
                >
                  {copiedExpired ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-3.5 w-3.5" />
                      <span>Confirmar y Copiar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inteligente de Cubicaje (CBM) & Peso Tasable (Milestone 2 - Pedido Lucía Laje) */}
      <CubicajeInteligenteModal
        isOpen={isCubicajeModalOpen}
        onClose={() => setIsCubicajeModalOpen(false)}
        onApplyToCalculadora={(bultos) => {
          setIsCubicajeModalOpen(false);
          if (onOpenCalculadoraWithBultos) {
            onOpenCalculadoraWithBultos(bultos);
          } else {
            onOpenCalculadora();
          }
        }}
      />
    </div>
  );
}
