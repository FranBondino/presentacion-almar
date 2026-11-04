'use client';

/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal — Copilot Operativo Widget
 *
 * Multimodal, role-aware operational assistant:
 * 1. Rapid reporting of invoice errors, cost overruns (> USD 10), carrier delays,
 *    and missing documentation with automatic claim email drafting + PDF/image evidence attachment.
 * 2. Live operational & COMEX consultation backed by live portal data (folders, invoices,
 *    quotations, alerts) + ALMAR's 10 operational manuals + multimodal PDF/image analysis.
 * 3. Per-user isolated session persistence in sessionStorage (`almar_copilot_session_v2_<email>`).
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  DollarSign,
  Paperclip,
  Image as ImageIcon,
  Camera,
  Lightbulb,
  FileEdit,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/RoleGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface CopilotCitation {
  source_file: string;
  doc_title: string;
  section: string;
  breadcrumb: string;
  similarity_score: number;
  snippet: string;
}

export interface CopilotClientAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
  extractedText?: string;
}

export interface CopilotWidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: CopilotCitation[];
  attachments?: Array<{ name: string; mimeType: string }>;
  engineUsed?: string;
  isError?: boolean;
}

export type CopilotMode = 'REPORT_ERROR' | 'RAG_QUERY' | 'UAT_FEEDBACK';
export type UatFeedbackTipo = 'CORRECCION_DATO' | 'SUGERENCIA' | 'EDGE_CASE' | 'CONSULTA';
export type UatFeedbackSeveridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'BLOQUEANTE';

export type DeviationType =
  | 'DESVIO_COSTO'
  | 'ERROR_FACTURACION'
  | 'DEMORA_OPERATIVA'
  | 'FALTA_DOCUMENTACION'
  | 'NO_CONFORMIDAD_PROVEEDOR';

export const DEVIATION_TYPES: readonly {
  id: DeviationType;
  label: string;
  icon: string;
  description: string;
  defaultSeverity: 'WARNING' | 'CRITICAL';
}[] = [
  {
    id: 'DESVIO_COSTO',
    label: 'Sobrecosto en Factura / Tarifa Excedida (> USD 10)',
    icon: '📈',
    description: 'La factura del proveedor o naviera supera el costo cotizado o presupuestado.',
    defaultSeverity: 'WARNING',
  },
  {
    id: 'ERROR_FACTURACION',
    label: 'Error en Factura (CUIT, Razón Social, IVA 21% vs 0%)',
    icon: '📑',
    description: 'Comprobante emitido con datos fiscales incorrectos o IVA no correspondiente.',
    defaultSeverity: 'WARNING',
  },
  {
    id: 'DEMORA_OPERATIVA',
    label: 'Demora Operativa / Rolado de Buque o Camión',
    icon: '🚢',
    description: 'Vessel rollover, demora en desconsolidación o retraso en retiro de vacío.',
    defaultSeverity: 'CRITICAL',
  },
  {
    id: 'FALTA_DOCUMENTACION',
    label: 'Falta de Documentación (BL, CRT, Cert. Origen)',
    icon: '🛑',
    description: 'Documentación de origen no liberada o falta de libre deuda marítimo.',
    defaultSeverity: 'CRITICAL',
  },
  {
    id: 'NO_CONFORMIDAD_PROVEEDOR',
    label: 'Incumplimiento de Proveedor / Servicio',
    icon: '⚠️',
    description: 'Incumplimiento de términos acordados o demora de respuesta del proveedor.',
    defaultSeverity: 'WARNING',
  },
] as const;

export const QUICK_ACTIONS = [
  {
    label: 'Carpeta C1868 (Seguridad Litoral)',
    query: '¿Qué información tenemos en vivo de la carpeta C1868 de Seguridad Litoral y cómo fue detectada?',
  },
  {
    label: 'Cotizaciones Confirmadas / Secco',
    query: '¿Cuántas cotizaciones tenemos activas, cuáles están confirmadas y qué propuestas recientes hay de Secco, Brayco o Don Aurelio?',
  },
  {
    label: 'Facturas retenidas por desvío',
    query: '¿Qué comprobantes tenemos retenidos o bloqueados por desvío de tarifa actualmente?',
  },
  {
    label: 'Coordinación FCL EXW y roundtrip',
    query:
      '¿Cómo se coordina una importación marítima FCL bajo Incoterm EXW y quién es responsable del roundtrip y retiro del contenedor vacío?',
  },
  {
    label: 'Diferencia BL Master vs BL House',
    query:
      '¿Cuál es la diferencia operativa entre un BL Master y un BL House, y quién emite cada documento?',
  },
  {
    label: 'Regla del Jueves de COTECAR',
    query:
      '¿En qué consiste la Regla del Jueves de COTECAR para el envío de información y documentación operativa?',
  },
] as const;

export interface CopilotWidgetProps {
  initialOpen?: boolean;
}

function readFileAsAttachment(file: File): Promise<CopilotClientAttachment> {
  return new Promise((resolve, reject) => {
    const isTextLike =
      file.type.startsWith('text/') ||
      /\.(txt|csv|tsv|md|json|xml)$/i.test(file.name);

    if (isTextLike) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          mimeType: file.type || 'text/plain',
          sizeBytes: file.size,
          extractedText: String(reader.result || '').slice(0, 30000),
        });
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de texto'));
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        sizeBytes: file.size,
        dataUrl: String(reader.result || ''),
      });
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo adjunto'));
    reader.readAsDataURL(file);
  });
}

export function CopilotWidget({ initialOpen = false }: CopilotWidgetProps = {}) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = React.useState(initialOpen);
  const [activeTab, setActiveTab] = React.useState<CopilotMode>('RAG_QUERY');

  const firstName = user?.nombre
    ? user.nombre.split(' ')[0]
    : user?.email
      ? user.email.split('@')[0]
      : 'Equipo';

  const roleStr = String(role || '');
  const userEmailLower = (user?.email || '').toLowerCase().trim();
  const roleBadgeLabel =
    roleStr === 'GERENCIA' || roleStr === 'ADMIN' || userEmailLower === 'vmeggiolaro@almarrosario.com'
      ? 'Directorio'
      : roleStr === 'COMERCIAL'
        ? 'Comercial'
        : roleStr === 'FINANZAS' || roleStr === 'FACTURACION'
          ? 'Administración'
          : 'Operaciones';

  const sessionStorageKey = React.useMemo(
    () => `almar_copilot_session_v2_${(user?.email || 'anon').toLowerCase()}`,
    [user?.email]
  );

  // --------------------------------------------------------------------------
  // Form State: Report Error / Deviation
  // --------------------------------------------------------------------------
  const [carpetaId, setCarpetaId] = React.useState('');
  const [tipoDesvio, setTipoDesvio] = React.useState<DeviationType>('DESVIO_COSTO');
  const [proveedor, setProveedor] = React.useState('');
  const [montoDesvio, setMontoDesvio] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [reportAttachment, setReportAttachment] = React.useState<CopilotClientAttachment | null>(null);
  const [isAnalyzingReportFile, setIsAnalyzingReportFile] = React.useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);
  const [createdTicket, setCreatedTicket] = React.useState<{
    id: string;
    isoRule: string;
    draftEmail: string;
  } | null>(null);
  const [copiedDraft, setCopiedDraft] = React.useState(false);

  // Auto-detect carpeta from URL if on /carpetas/[id]
  React.useEffect(() => {
    if (pathname) {
      const match = pathname.match(/\/carpetas\/([^/?#]+)/i);
      if (match && match[1]) {
        try {
          const detected = decodeURIComponent(match[1]).trim().toUpperCase();
          setCarpetaId(detected);
        } catch {
          setCarpetaId(match[1].trim().toUpperCase());
        }
      }
    }
  }, [pathname]);

  // --------------------------------------------------------------------------
  // RAG & Live Operational Chat State
  // --------------------------------------------------------------------------
  const [ragQuery, setRagQuery] = React.useState('');
  const [chatAttachments, setChatAttachments] = React.useState<CopilotClientAttachment[]>([]);
  const [isRagLoading, setIsRagLoading] = React.useState(false);
  const [expandedCitations, setExpandedCitations] = React.useState<Record<string, boolean>>({});

  // --------------------------------------------------------------------------
  // UAT Feedback & Screenshot Triage State
  // --------------------------------------------------------------------------
  const [uatTipo, setUatTipo] = React.useState<UatFeedbackTipo>('CORRECCION_DATO');
  const [uatSeveridad, setUatSeveridad] = React.useState<UatFeedbackSeveridad>('MEDIA');
  const [uatMensaje, setUatMensaje] = React.useState('');
  const [uatScreenshots, setUatScreenshots] = React.useState<
    Array<{ name: string; mimeType: string; dataUrl: string }>
  >([]);
  const [isCapturingScreen, setIsCapturingScreen] = React.useState(false);
  const [isSubmittingUat, setIsSubmittingUat] = React.useState(false);
  const [lastUatTicket, setLastUatTicket] = React.useState<string | null>(null);
  const [copiedUatTicket, setCopiedUatTicket] = React.useState(false);
  const [recentUatTickets, setRecentUatTickets] = React.useState<
    Array<{
      id: string;
      ticket_code: string;
      tipo: string;
      severidad: string;
      mensaje: string;
      carpeta_id?: string | null;
      usuario_nombre?: string;
      created_at?: string;
      screenshots?: Array<{ name: string; mimeType: string; dataUrl: string }>;
    }>
  >([]);
  const uatScreenshotInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen || activeTab !== 'UAT_FEEDBACK') return;
    fetch('/api/feedback')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setRecentUatTickets(json.data.slice(0, 6));
        }
      })
      .catch(() => {});
  }, [isOpen, activeTab]);

  // Global clipboard paste listener (Ctrl+V) for screenshots when Copilot drawer is open
  React.useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || '');
            if (!dataUrl) return;
            const fileName = `captura-uat-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`;
            if (activeTab === 'UAT_FEEDBACK') {
              setUatScreenshots((prev) =>
                [...prev, { name: fileName, mimeType: blob.type || 'image/png', dataUrl }].slice(0, 3)
              );
            } else if (activeTab === 'RAG_QUERY') {
              setChatAttachments((prev) =>
                [
                  ...prev,
                  {
                    name: fileName,
                    mimeType: blob.type || 'image/png',
                    sizeBytes: blob.size,
                    dataUrl,
                  },
                ].slice(0, 3)
              );
            } else if (activeTab === 'REPORT_ERROR') {
              setReportAttachment({
                name: fileName,
                mimeType: blob.type || 'image/png',
                sizeBytes: blob.size,
                dataUrl,
              });
            }
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isOpen, activeTab]);

  const handleCaptureScreen1Click = async (target: 'UAT' | 'CHAT' = 'UAT') => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      uatScreenshotInputRef.current?.click();
      return;
    }
    setIsCapturingScreen(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as MediaTrackConstraints,
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((r) => setTimeout(r, 180));
      const maxW = 1440;
      const scale = video.videoWidth > maxW ? maxW / video.videoWidth : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      if (track) track.stop();
      stream.getTracks().forEach((t) => t.stop());
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const fileName = `pantalla-uat-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`;
      if (target === 'UAT') {
        setUatScreenshots((prev) =>
          [...prev, { name: fileName, mimeType: 'image/jpeg', dataUrl }].slice(0, 3)
        );
      } else {
        setChatAttachments((prev) =>
          [
            ...prev,
            { name: fileName, mimeType: 'image/jpeg', sizeBytes: dataUrl.length, dataUrl },
          ].slice(0, 3)
        );
      }
    } catch {
      // User cancelled screen picker or browser blocked it
    } finally {
      setIsCapturingScreen(false);
    }
  };

  const handleSelectUatScreenshotFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    if (files.length === 0) return;
    try {
      const loaded = await Promise.all(files.map((f) => readFileAsAttachment(f)));
      const valid = loaded
        .filter((l) => l.dataUrl)
        .map((l) => ({
          name: l.name,
          mimeType: l.mimeType || 'image/png',
          dataUrl: l.dataUrl!,
        }));
      setUatScreenshots((prev) => [...prev, ...valid].slice(0, 3));
    } catch {
      // ignore
    } finally {
      if (uatScreenshotInputRef.current) uatScreenshotInputRef.current.value = '';
    }
  };

  const handleSubmitUatFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uatMensaje.trim() || isSubmittingUat) return;
    setIsSubmittingUat(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: uatTipo,
          severidad: uatSeveridad,
          mensaje: uatMensaje.trim(),
          pantalla: pathname || '/',
          carpeta_id: carpetaId.trim() ? carpetaId.trim().toUpperCase() : null,
          usuario_nombre: user?.nombre || firstName,
          usuario_email: user?.email || 'operaciones@almarrosario.com',
          usuario_rol: role || 'OPERATIVO',
          screenshots: uatScreenshots,
          contexto_adicional: {
            timestamp: new Date().toISOString(),
            screenshotsCount: uatScreenshots.length,
            uatSession: true,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLastUatTicket(data.ticketCode);
        setUatMensaje('');
        setUatScreenshots([]);
        if (data.data) {
          setRecentUatTickets((prev) => [data.data, ...prev].slice(0, 6));
        }
      }
    } catch (err) {
      console.error('[CopilotWidget] Error submitting UAT feedback:', err);
    } finally {
      setIsSubmittingUat(false);
    }
  };

  const buildWelcomeMessage = React.useCallback((): CopilotWidgetMessage => {
    const r = String(role || '');
    const roleHint =
      r === 'GERENCIA' || r === 'ADMIN'
        ? 'Podés consultarme el estado en vivo de cualquier carpeta (ej. C1234), facturas con desvío, métricas del equipo o adjuntar un PDF/imagen para analizarlo.'
        : r === 'COMERCIAL'
          ? 'Podés consultarme cotizaciones, alícuotas de IVA (0% internacional vs 21% local), estado de carpetas o adjuntar un tarifario/PDF.'
          : r === 'FINANZAS' || r === 'FACTURACION'
            ? 'Podés consultarme comprobantes por carpeta, validación para Kipintoch, alícuotas de IVA o adjuntar una factura en PDF/imagen.'
            : 'Podés consultarme el estado y comprobantes de cualquier carpeta, dudas de coordinación (FCL, LCL, BLs, COTECAR), adjuntar un PDF/captura o reportar un desvío.';

    return {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hola ${firstName} (${roleBadgeLabel}). Soy el asistente operativo de ALMAR Rosario.\n\n${roleHint}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }, [firstName, role, roleBadgeLabel]);

  const [messages, setMessages] = React.useState<CopilotWidgetMessage[]>(() => [
    buildWelcomeMessage(),
  ]);

  // Restore isolated session per user email from sessionStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.sessionStorage.getItem(sessionStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as CopilotWidgetMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore storage errors
    }
    setMessages([buildWelcomeMessage()]);
  }, [sessionStorageKey, buildWelcomeMessage]);

  // Save session per user email whenever messages change
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore quota errors
    }
  }, [messages, sessionStorageKey]);

  const handleResetChatSession = () => {
    const welcome = buildWelcomeMessage();
    setMessages([welcome]);
    setChatAttachments([]);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(sessionStorageKey);
      } catch {
        // ignore
      }
    }
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const chatFileInputRef = React.useRef<HTMLInputElement>(null);
  const reportFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && activeTab === 'RAG_QUERY' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRagLoading, isOpen, activeTab]);

  React.useEffect(() => {
    if (isOpen && activeTab === 'RAG_QUERY' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  // Support keyboard shortcuts: Escape to close, Ctrl+J / Cmd+J to toggle
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        if (!e.defaultPrevented) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Support global custom event for opening / toggling Copilot
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        mode?: CopilotMode;
        prefillCarpeta?: string;
        prefillQuery?: string;
        action?: 'open' | 'close' | 'toggle';
      }>;

      if (customEvent.detail?.action === 'close') {
        setIsOpen(false);
        return;
      }

      if (customEvent.detail?.action === 'open') {
        setIsOpen(true);
      } else if (
        customEvent.detail?.mode ||
        customEvent.detail?.prefillCarpeta ||
        customEvent.detail?.prefillQuery
      ) {
        setIsOpen(true);
      } else {
        setIsOpen((prev) => !prev);
      }

      if (customEvent.detail?.mode) {
        setActiveTab(customEvent.detail.mode);
      }
      if (customEvent.detail?.prefillCarpeta) {
        setCarpetaId(customEvent.detail.prefillCarpeta);
      }
      if (customEvent.detail?.prefillQuery) {
        setRagQuery(customEvent.detail.prefillQuery);
        setActiveTab('RAG_QUERY');
      }
    };

    window.addEventListener('almar:open-copilot', handleOpenEvent);
    return () => {
      window.removeEventListener('almar:open-copilot', handleOpenEvent);
    };
  }, []);

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // --------------------------------------------------------------------------
  // Attachment Handlers (Chat & Error Report)
  // --------------------------------------------------------------------------
  const handleSelectChatFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    if (files.length === 0) return;
    try {
      const loaded = await Promise.all(files.map((f) => readFileAsAttachment(f)));
      setChatAttachments((prev) => [...prev, ...loaded].slice(0, 3));
    } catch (err) {
      console.warn('[CopilotWidget] Error reading attachment:', err);
    } finally {
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  };

  const handleSelectReportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await readFileAsAttachment(file);
      setReportAttachment(loaded);
      setIsAnalyzingReportFile(true);

      // Ask /api/copilot/chat to extract Carpeta, Proveedor, Monto, and summary from the attached file
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query:
            'Extrae de este documento o imagen adjunta: 1) Carpeta detectada (si figura), 2) Nombre del Proveedor/Emisor, 3) Monto total y moneda, y 4) Breve resumen de una oración del comprobante o incidencia.',
          attachments: [
            {
              name: loaded.name,
              mimeType: loaded.mimeType,
              dataUrl: loaded.dataUrl,
              extractedText: loaded.extractedText,
            },
          ],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const ans = String(json.answer || '');
        const folderMatch = ans.match(/\b(C\d{3,5}|IT\d{3,5}|EA\d{3,5}|IM\d{3,5})\b/i);
        if (folderMatch && folderMatch[1] && !carpetaId) {
          setCarpetaId(folderMatch[1].toUpperCase());
        }
        const amountMatch = ans.match(/\b(USD|ARS|EUR)\s*[\d.,]+/i);
        if (amountMatch && amountMatch[0] && !montoDesvio) {
          setMontoDesvio(amountMatch[0].toUpperCase());
        }
        if (!descripcion.trim()) {
          setDescripcion(`Adjunto: ${loaded.name}. ${ans.replace(/\s+/g, ' ').slice(0, 260)}`);
        }
      }
    } catch {
      // ignore auto-analysis error, attachment still kept
    } finally {
      setIsAnalyzingReportFile(false);
      if (reportFileInputRef.current) reportFileInputRef.current.value = '';
    }
  };

  // --------------------------------------------------------------------------
  // Action: Submit Error / Deviation Report
  // --------------------------------------------------------------------------
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || isSubmittingReport) return;

    setIsSubmittingReport(true);
    const ticketCode = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveFolder = carpetaId.trim().toUpperCase() || 'GENERAL';
    const effectiveSupplier = proveedor.trim() || 'Proveedor / Línea Logística';

    let isoGuideline = '';
    let emailSubject = '';
    let emailBody = '';

    if (tipoDesvio === 'DESVIO_COSTO') {
      isoGuideline =
        'Criterio Operativo: Todo sobrecosto superior a USD 10 queda retenido para revisión antes de pasarlo a Kipintoch. Requiere validación de Jefatura de Operaciones (Natali Hermoso) o Dirección, o Nota de Crédito del proveedor.';
      emailSubject = `Reclamo por Diferencia de Tarifa / Sobrecosto - Carpeta ${effectiveFolder} - ALMAR Rosario`;
      emailBody = `Estimados ${effectiveSupplier},\n\nNos comunicamos en relación a la operación correspondiente a la Carpeta ${effectiveFolder}.\n\nHemos detectado una diferencia en el comprobante recibido por un importe no previsto de ${montoDesvio || 'USD 0'}.\nDetalle: ${descripcion.trim()}\n\nDe acuerdo con la cotización acordada, solicitamos tengan a bien emitir la correspondiente Nota de Crédito rectificatoria o aclarar el concepto a la brevedad para poder avanzar con el circuito de pago.\n\nQuedamos a la espera de su respuesta.\n\nAtentamente,\n${user?.nombre || 'Equipo de Operaciones'}\nALMAR Rosario S.R.L.`;
    } else if (tipoDesvio === 'ERROR_FACTURACION') {
      isoGuideline =
        'Criterio de Facturación: No ingresar en Kipintoch comprobantes con CUIT erróneo o IVA 21% sobre flete internacional (exento). Solicitar anulación y refacturación al proveedor.';
      emailSubject = `Solicitud de Anulación y Refacturación - Carpeta ${effectiveFolder} - ALMAR Rosario`;
      emailBody = `Estimados ${effectiveSupplier},\n\nLes escribimos por la factura emitida para la Carpeta ${effectiveFolder}.\n\nSe detectó un error en los datos de facturación:\n${descripcion.trim()}\n\nRecordamos que los fletes internacionales son exentos de IVA. Solicitamos la anulación del comprobante actual y la emisión de la factura corregida a nombre de ALMAR ROSARIO S.R.L. (CUIT: 30-70864436-2).\n\nMuchas gracias,\n${user?.nombre || 'Administración / Operaciones'}\nALMAR Rosario S.R.L.`;
    } else if (tipoDesvio === 'DEMORA_OPERATIVA') {
      isoGuideline =
        'Criterio de Tráfico: Ante rolado de buque o demora en desconsolidación, avisar al cliente dentro de las 2 horas del aviso de la terminal y actualizar la fecha estimada de arribo (ETA).';
      emailSubject = `Aviso por Reprogramación Operativa - Carpeta ${effectiveFolder}`;
      emailBody = `Estimados,\n\nInformamos que en la operación ${effectiveFolder} se registró la siguiente novedad operativa:\n${descripcion.trim()}\n\nProveedor involucrado: ${effectiveSupplier}.\nEstamos coordinando con la línea para confirmar la nueva fecha de arribo/entrega a la brevedad.\n\nSaludos cordiales,\n${user?.nombre || 'Operaciones ALMAR'}`;
    } else if (tipoDesvio === 'FALTA_DOCUMENTACION') {
      isoGuideline =
        'Criterio Documental: La falta de BL Original o Certificado de Origen próximo al arribo genera riesgo de almacenaje en terminal. Reclamar con prioridad al agente de origen.';
      emailSubject = `Urgente: Documentación Pendiente - Carpeta ${effectiveFolder}`;
      emailBody = `Estimados,\n\nReiteramos con carácter urgente el envío de la documentación pendiente para la Carpeta ${effectiveFolder}.\nPendiente: ${descripcion.trim()}\n\nEl embarque se encuentra próximo a arribo y necesitamos la documentación liberada para evitar costos extra de terminal.\n\nAgradecemos confirmación.\n\nAtentamente,\n${user?.nombre || 'Operaciones ALMAR'}`;
    } else {
      isoGuideline =
        'Seguimiento de Proveedores: La incidencia queda asentada en el legajo del proveedor para su evaluación de desempeño.';
      emailSubject = `Observación de Servicio Logístico - Carpeta ${effectiveFolder} - ALMAR Rosario`;
      emailBody = `Estimados ${effectiveSupplier},\n\nLes escribimos para dejar registrada la siguiente observación ocurrida en la operación ${effectiveFolder}:\n${descripcion.trim()}\n\nSolicitamos nos informen las acciones tomadas para evitar que vuelva a ocurrir en próximos embarques.\n\nSaludos cordiales,\n${user?.nombre || 'Operaciones ALMAR'}`;
    }

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'EDGE_CASE',
          severidad: 'ALTA',
          mensaje: `[${ticketCode}] (${tipoDesvio}) ${descripcion.trim()} | Proveedor: ${effectiveSupplier} | Monto: ${montoDesvio || 'N/A'}${reportAttachment ? ` | Adjunto: ${reportAttachment.name}` : ''}`,
          pantalla: pathname || '/operaciones',
          carpeta_id: effectiveFolder !== 'GENERAL' ? effectiveFolder : undefined,
          usuario_nombre: user?.nombre || firstName,
          usuario_email: user?.email || 'operaciones@almarrosario.com',
          usuario_rol: role || 'OPERATIVO',
          contexto_adicional: {
            ticketCode,
            tipoDesvio,
            proveedor: effectiveSupplier,
            montoDesvio,
            attachmentName: reportAttachment?.name,
          },
        }),
      });

      await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carpeta_id: effectiveFolder !== 'GENERAL' ? effectiveFolder : null,
          tipo: tipoDesvio === 'DESVIO_COSTO' ? 'DESVIO_COSTO' : 'FACTURA_SIN_CARPETA',
          severidad: 'WARNING',
          titulo: `Incidencia Reportada: ${tipoDesvio.replace('_', ' ')} (${effectiveFolder})`,
          mensaje: `${descripcion.trim()} - Proveedor: ${effectiveSupplier} - Ref: ${ticketCode}`,
        }),
      }).catch(() => null);

      setCreatedTicket({
        id: ticketCode,
        isoRule: isoGuideline,
        draftEmail: `${emailSubject}\n\n${emailBody}`,
      });
    } catch (err) {
      console.error('[CopilotWidget] Error reporting deviation:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCopyEmail = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.draftEmail);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleResetForm = () => {
    setCreatedTicket(null);
    setDescripcion('');
    setMontoDesvio('');
    setProveedor('');
    setReportAttachment(null);
  };

  // --------------------------------------------------------------------------
  // Action: Send RAG & Live Operational Query (with optional attachments)
  // --------------------------------------------------------------------------
  const handleSendRagQuery = async (textToSend?: string) => {
    const rawText = textToSend ?? ragQuery;
    const trimmed =
      rawText.trim() ||
      (chatAttachments.length > 0
        ? `Analizá el archivo adjunto (${chatAttachments.map((a) => a.name).join(', ')}) e indicame los datos principales para la operatoria.`
        : '');

    if (!trimmed || isRagLoading) return;

    const currentAttachments = textToSend ? [] : [...chatAttachments];
    const userMessageId = `usr-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: CopilotWidgetMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: nowTime,
      attachments:
        currentAttachments.length > 0
          ? currentAttachments.map((a) => ({ name: a.name, mimeType: a.mimeType }))
          : undefined,
    };

    const historyPayload = messages
      .filter((m) => !m.isError && !m.id.startsWith('msg-welcome'))
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 1800),
      }));

    setMessages((prev) => [...prev, newUserMsg]);
    if (!textToSend) {
      setRagQuery('');
      setChatAttachments([]);
    }
    setIsRagLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          history: historyPayload,
          topK: 4,
          minSimilarity: 0.1,
          activeCarpetaId: carpetaId || undefined,
          attachments:
            currentAttachments.length > 0
              ? currentAttachments.map((a) => ({
                  name: a.name,
                  mimeType: a.mimeType,
                  dataUrl: a.dataUrl,
                  extractedText: a.extractedText,
                }))
              : undefined,
        }),
      });

      const responseTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (!response.ok) {
        let errorText = 'Ocurrió un error al procesar la consulta con el asistente.';
        try {
          const errData = await response.json();
          if (errData?.error) {
            errorText = errData.error;
          }
        } catch {
          // ignore
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: errorText,
            timestamp: responseTime,
            isError: true,
          },
        ]);
        return;
      }

      const json = await response.json();
      const payload = json.data || json;
      const answer = payload.answer || json.answer || 'Consulta procesada correctamente.';
      const citations = payload.citations || json.citations || [];
      const engineUsed = payload.engineUsed || json.engineUsed;

      const assistantMsgId = `asst-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: answer,
          timestamp: responseTime,
          citations,
          engineUsed,
        },
      ]);

      if (citations.length > 0) {
        setExpandedCitations((prev) => ({
          ...prev,
          [assistantMsgId]: false,
        }));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'No fue posible conectar con el asistente. Verifique su conexión.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsRagLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div
        className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex items-center gap-1.5 sm:gap-2 print:hidden"
        data-testid="copilot-floating-bar"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('UAT_FEEDBACK');
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-white hover:bg-amber-50 text-slate-800 border border-amber-300 shadow-lg hover:shadow-xl transition-all cursor-pointer text-[11px] sm:text-xs font-bold"
          title="Reportar error, corrección de dato o sugerencia de mejora con captura de pantalla (Ctrl+V)"
          data-testid="btn-floating-uat-feedback"
        >
          <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
          <span className="hidden sm:inline">Reportar Error / Mejora UAT</span>
          <span className="sm:hidden">Reportar UAT</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('RAG_QUERY');
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0A2540] to-[#0072BC] hover:from-[#00172e] hover:to-[#005d99] text-white border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer text-[11px] sm:text-xs font-bold"
          title="Abrir Copilot Operativo IA (Ctrl+J)"
          data-testid="btn-floating-copilot-open"
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
          <span>Copilot IA</span>
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Copilot Operativo ALMAR" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        data-testid="copilot-backdrop"
      />

      {/* Slide-over Drawer lateral derecho */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] max-w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col h-screen overflow-hidden animate-in slide-in-from-right duration-200 ease-out"
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1), -8px 0 10px -6px rgba(0, 0, 0, 0.1)',
        }}
        data-testid="copilot-drawer"
      >
        {/* Header */}
        <div className="bg-[#0A2540] text-white p-3.5 sm:p-4 flex flex-col gap-2.5 shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#0072BC]/40 rounded-lg border border-white/10">
                <Bot className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm leading-tight text-white">
                    Copilot Operativo &amp; Triage UAT
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30">
                    {roleBadgeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Consultas en Vivo &bull; Reporte UAT con Capturas &bull; Reclamos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChatSession}
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
                data-testid="btn-copilot-reset"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <kbd className="hidden sm:inline-flex items-center rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                Esc
              </kbd>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar Copilot (Esc)"
                aria-label="Cerrar Copilot"
                data-testid="btn-copilot-close"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('RAG_QUERY')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === 'RAG_QUERY'
                  ? 'bg-[#0072BC] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              data-testid="tab-copilot-chat"
            >
              <BookOpen className="h-3.5 w-3.5 text-sky-300 shrink-0" />
              <span>Chat IA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UAT_FEEDBACK')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === 'UAT_FEEDBACK'
                  ? 'bg-[#0072BC] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              data-testid="tab-copilot-uat-feedback"
            >
              <Camera className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span>Error / Mejora UAT</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REPORT_ERROR')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === 'REPORT_ERROR'
                  ? 'bg-[#0072BC] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              data-testid="tab-copilot-report-deviation"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span>Reclamo Prov.</span>
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* TAB UAT_FEEDBACK: REPORTE DE ERRORES Y MEJORAS CON SCREENSHOTS   */}
        {/* ================================================================ */}
        {activeTab === 'UAT_FEEDBACK' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 text-xs">
            <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200 text-amber-950 flex items-start gap-2">
              <Camera className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Canal Directo UAT (Errores, Datos y Sugerencias):</span>{' '}
                Reportá cualquier corrección de dato, caso borde o mejora visual. Podés{' '}
                <strong>pegar una captura con Ctrl+V</strong>, capturar tu pantalla en 1 clic o adjuntar imágenes.
              </div>
            </div>

            {lastUatTicket && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>¡Reporte UAT registrado con éxito!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 border border-emerald-300">
                      {lastUatTicket}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(lastUatTicket);
                        setCopiedUatTicket(true);
                        setTimeout(() => setCopiedUatTicket(false), 2000);
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 underline cursor-pointer"
                    >
                      {copiedUatTicket ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedUatTicket ? 'Copiado' : 'Copiar código'}</span>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLastUatTicket(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitUatFeedback} className="space-y-3.5">
              {/* Tipo de Reporte UAT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ¿Qué querés reportar o sugerir?
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUatTipo('CORRECCION_DATO')}
                    className={`p-2 rounded-lg border text-left flex items-start gap-1.5 transition cursor-pointer ${
                      uatTipo === 'CORRECCION_DATO'
                        ? 'border-[#0072BC] bg-sky-50 text-[#0072BC] ring-1 ring-[#0072BC] font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FileEdit className="h-3.5 w-3.5 text-[#0072BC] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">Error / Dato</div>
                      <div className="text-[10px] text-slate-400">Cliente, importe, BL</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUatTipo('SUGERENCIA')}
                    className={`p-2 rounded-lg border text-left flex items-start gap-1.5 transition cursor-pointer ${
                      uatTipo === 'SUGERENCIA'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">Mejora / Cambio</div>
                      <div className="text-[10px] text-slate-400">Interfaz, columna o flujo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUatTipo('EDGE_CASE')}
                    className={`p-2 rounded-lg border text-left flex items-start gap-1.5 transition cursor-pointer ${
                      uatTipo === 'EDGE_CASE'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">Caso Borde</div>
                      <div className="text-[10px] text-slate-400">Excepción operativa</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUatTipo('CONSULTA')}
                    className={`p-2 rounded-lg border text-left flex items-start gap-1.5 transition cursor-pointer ${
                      uatTipo === 'CONSULTA'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">Duda UAT</div>
                      <div className="text-[10px] text-slate-400">Consulta de uso</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Carpeta & Prioridad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Carpeta / Cotización <span className="font-normal text-slate-400">(opc.)</span>
                  </label>
                  <input
                    type="text"
                    value={carpetaId}
                    onChange={(e) => setCarpetaId(e.target.value.toUpperCase())}
                    placeholder="Ej. C1868, PC2026..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={uatSeveridad}
                    onChange={(e) => setUatSeveridad(e.target.value as UatFeedbackSeveridad)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0072BC] focus:outline-none cursor-pointer"
                  >
                    <option value="BAJA">Baja — Detalle visual</option>
                    <option value="MEDIA">Media — Ajuste normal</option>
                    <option value="ALTA">Alta — Dato importante</option>
                    <option value="BLOQUEANTE">Bloqueante — Frena flujo</option>
                  </select>
                </div>
              </div>

              {/* Capturas de Pantalla (Screenshots) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5 text-[#0072BC]" />
                    <span>Capturas de Pantalla ({uatScreenshots.length}/3)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Pegar con Ctrl+V
                  </span>
                </div>

                <input
                  ref={uatScreenshotInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void handleSelectUatScreenshotFiles(e)}
                  className="hidden"
                  data-testid="uat-screenshot-file-input"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isCapturingScreen || uatScreenshots.length >= 3}
                    onClick={() => void handleCaptureScreen1Click('UAT')}
                    className="py-2 px-2.5 rounded-lg border border-sky-300 bg-sky-50/70 hover:bg-sky-100 text-[#0072BC] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    data-testid="btn-uat-capture-screen"
                  >
                    {isCapturingScreen ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                    <span>Capturar Pantalla</span>
                  </button>

                  <button
                    type="button"
                    disabled={uatScreenshots.length >= 3}
                    onClick={() => uatScreenshotInputRef.current?.click()}
                    className="py-2 px-2.5 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    data-testid="btn-uat-upload-screenshot"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>Subir Captura / Img</span>
                  </button>
                </div>

                {/* Screenshot Thumbnail Previews */}
                {uatScreenshots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1" data-testid="uat-screenshots-preview">
                    {uatScreenshots.map((shot, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={shot.dataUrl}
                          alt={shot.name}
                          className="h-16 w-full object-cover"
                        />
                        <div className="px-1.5 py-0.5 text-[9px] font-mono text-slate-600 truncate bg-slate-50 border-t border-slate-100">
                          {shot.name}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUatScreenshots((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/75 text-white hover:bg-rose-600 transition cursor-pointer"
                          title="Quitar captura"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mensaje / Detalle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Detalle del Error, Corrección o Sugerencia:
                </label>
                <textarea
                  rows={3}
                  value={uatMensaje}
                  onChange={(e) => setUatMensaje(e.target.value)}
                  placeholder="Contanos qué viste o qué te gustaría modificar (ej. 'En carpeta C1865 falta actualizar el HBL', o 'Agregar filtro por cliente en esta tabla'). Podés pegar una captura con Ctrl+V."
                  required
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                  data-testid="input-uat-feedback-mensaje"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingUat || !uatMensaje.trim()}
                className="w-full bg-[#0072BC] hover:bg-[#005d99] text-white font-bold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="btn-submit-uat-feedback"
              >
                {isSubmittingUat ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando reporte y capturas...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      Enviar Reporte UAT
                      {uatScreenshots.length > 0 ? ` (${uatScreenshots.length} captura${uatScreenshots.length > 1 ? 's' : ''})` : ''}
                    </span>
                  </>
                )}
              </Button>
            </form>

            {/* Recent UAT Reports */}
            {recentUatTickets.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Últimos Reportes Registrados</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {recentUatTickets.length} recientes
                  </span>
                </div>
                <div className="space-y-1.5">
                  {recentUatTickets.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-[#0072BC]">
                          {t.ticket_code}
                        </span>
                        <div className="flex items-center gap-1">
                          {t.screenshots && t.screenshots.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-semibold flex items-center gap-0.5">
                              <Camera className="h-2.5 w-2.5" />
                              {t.screenshots.length}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-mono">
                            {t.tipo}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-700 line-clamp-2">{t.mensaje}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 1: REPORT ERROR / DEVIATION                                 */}
        {/* ================================================================ */}
        {activeTab === 'REPORT_ERROR' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 text-xs">
            {!createdTicket ? (
              <form onSubmit={handleSubmitReport} className="space-y-3.5">
                <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-200 text-sky-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[#0072BC] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Registro Rápido de Incidencias:</span>{' '}
                    Cargá cualquier sobrecosto, error de factura o demora. Podés adjuntar el PDF o captura para autocompletar los datos y generar el reclamo listo para enviar.
                  </div>
                </div>

                {/* Evidence File / Image Attachment */}
                <div>
                  <input
                    ref={reportFileInputRef}
                    type="file"
                    accept=".pdf,image/*,.txt,.csv"
                    onChange={(e) => void handleSelectReportFile(e)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => reportFileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg border border-dashed border-sky-300 bg-white hover:bg-sky-50/60 text-[#0072BC] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>
                        {reportAttachment
                          ? `Adjunto: ${reportAttachment.name}`
                          : 'Adjuntar Factura PDF, BL o Captura (Opcional)'}
                      </span>
                    </button>
                    {reportAttachment && (
                      <button
                        type="button"
                        onClick={() => setReportAttachment(null)}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 cursor-pointer"
                        title="Quitar adjunto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {isAnalyzingReportFile && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#0072BC]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Extrayendo datos del archivo adjunto con IA...</span>
                    </div>
                  )}
                </div>

                {/* Carpeta & Proveedor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Carpeta / Operación:
                    </label>
                    <input
                      type="text"
                      value={carpetaId}
                      onChange={(e) => setCarpetaId(e.target.value.toUpperCase())}
                      placeholder="Ej. C1234, IT1697, EA1754"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Proveedor / Línea:
                    </label>
                    <input
                      type="text"
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                      placeholder="Ej. Maersk, Cosco, Transcontainer"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tipo de Desvío */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Incidencia / Desvío:
                  </label>
                  <select
                    value={tipoDesvio}
                    onChange={(e) => setTipoDesvio(e.target.value as DeviationType)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                  >
                    {DEVIATION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monto de sobrecosto (opcional) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Impacto Económico / Diferencia (Opcional):
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={montoDesvio}
                      onChange={(e) => setMontoDesvio(e.target.value)}
                      placeholder="Ej. 180 USD, 45.000 ARS"
                      className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Descripción detallada */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Descripción del Problema:
                  </label>
                  <textarea
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describí qué ocurrió: ej. 'La naviera facturó USD 250 de Demurrage cuando teníamos acordados 14 días libres por cotización.'"
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0072BC] focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmittingReport || !descripcion.trim()}
                  className="w-full bg-[#0072BC] hover:bg-[#005d99] text-white font-bold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Registrando incidencia y redactando reclamo...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-300" />
                      <span>Registrar Incidencia &amp; Generar Reclamo</span>
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Success View with Ticket & Auto-Generated Claim Email */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-900">
                        Incidencia Registrada
                      </span>
                      <div className="text-[11px] text-emerald-700 font-mono font-bold">
                        Referencia: #{createdTicket.id}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    Alerta Creada
                  </Badge>
                </div>

                {/* Operational Rule */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                    Pasos Recomendados:
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {createdTicket.isoRule}
                  </p>
                </div>

                {/* Auto-Drafted Claim Email */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-[#0072BC]" />
                      Borrador de Reclamo al Proveedor:
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyEmail}
                      className="text-[10px] h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 gap-1 cursor-pointer"
                    >
                      {copiedDraft ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-500" />
                          <span>Copiar Email</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <pre className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {createdTicket.draftEmail}
                  </pre>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  className="w-full text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  + Registrar Otra Incidencia
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: CHAT OPERATIVO & CONSULTA MULTIMODAL                     */}
        {/* ================================================================ */}
        {activeTab === 'RAG_QUERY' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {/* Quick Action Shortcuts */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                <span className="text-[10px] font-semibold uppercase text-slate-500 px-1 shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Atajos:
                </span>
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isRagLoading}
                    onClick={() => void handleSendRagQuery(action.query)}
                    className="shrink-0 px-2.5 py-1 text-[11px] rounded-full bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition shadow-2xs whitespace-nowrap cursor-pointer disabled:opacity-50"
                    title={action.query}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isCitationOpen = Boolean(expandedCitations[msg.id]);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div
                      className={`rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? 'max-w-[85%] bg-[#0072BC] text-white rounded-br-xs shadow-xs space-y-1.5'
                          : msg.isError
                            ? 'max-w-[92%] bg-red-50 text-red-800 border border-red-200 rounded-bl-xs'
                            : 'max-w-[92%] bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs space-y-2'
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1 pb-1">
                          {msg.attachments.map((att, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-mono"
                            >
                              {att.mimeType.startsWith('image/') ? (
                                <ImageIcon className="h-3 w-3" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              <span className="truncate max-w-[180px]">{att.name}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Citations Accordion */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCitation(msg.id)}
                            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <BookOpen className="h-3.5 w-3.5 text-[#0072BC]" />
                              Manuales Consultados ({msg.citations.length})
                            </span>
                            {isCitationOpen ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </button>

                          {isCitationOpen && (
                            <div className="space-y-1.5 pt-2 animate-in fade-in duration-150">
                              {msg.citations.map((citation, citIdx) => (
                                <div
                                  key={citIdx}
                                  className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-800 text-[11px] truncate">
                                      {citation.doc_title || citation.source_file}
                                    </span>
                                    <span className="shrink-0 px-1 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      {Math.round((citation.similarity_score || 0) * 100)}%
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded truncate">
                                    {citation.breadcrumb || citation.section}
                                  </div>
                                  {citation.snippet && (
                                    <blockquote className="text-[10px] text-slate-600 italic border-l-2 border-[#0072BC] pl-2 line-clamp-2">
                                      &ldquo;{citation.snippet}&rdquo;
                                    </blockquote>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400 font-mono">
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}

              {isRagLoading && (
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="rounded-2xl rounded-bl-xs p-3 bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0072BC]" />
                    <span>Consultando datos en vivo y manuales operativos...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Attachments Strip */}
            {chatAttachments.length > 0 && (
              <div className="px-3 py-1.5 bg-sky-50 border-t border-sky-200 flex flex-wrap items-center gap-1.5 shrink-0">
                {chatAttachments.map((att, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-sky-200 text-[11px] text-slate-700 shadow-2xs"
                  >
                    {att.mimeType.startsWith('image/') ? (
                      <ImageIcon className="h-3.5 w-3.5 text-[#0072BC]" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-[#0072BC]" />
                    )}
                    <span className="truncate max-w-[170px] font-medium">{att.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setChatAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label={`Quitar ${att.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Chat Input with Attachment Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendRagQuery();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                ref={chatFileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*,.txt,.csv,.tsv"
                onChange={(e) => void handleSelectChatFiles(e)}
                className="hidden"
                data-testid="copilot-file-input"
              />
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                disabled={isRagLoading || chatAttachments.length >= 3}
                title="Adjuntar PDF, factura, BL o imagen (máx. 3)"
                aria-label="Adjuntar archivo o imagen"
                data-testid="btn-copilot-attach"
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0072BC] disabled:opacity-40 transition shrink-0 cursor-pointer"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Consultá por una carpeta (ej. C1234), procedimiento o adjuntá un PDF/imagen..."
                disabled={isRagLoading}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC] text-slate-900 placeholder-slate-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={(!ragQuery.trim() && chatAttachments.length === 0) || isRagLoading}
                className="p-2.5 rounded-xl bg-[#0072BC] hover:bg-[#005d99] text-white disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
                title="Enviar consulta"
                aria-label="Enviar consulta"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Footer Info Badge */}
        <div className="px-3.5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-mono">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Sesión activa: {user?.email || 'ALMAR'}
          </span>
          <span className="font-mono">ALMAR Rosario Comex</span>
        </div>
      </div>
    </aside>
  );
}
