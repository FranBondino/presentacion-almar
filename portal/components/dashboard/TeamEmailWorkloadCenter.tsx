'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/RoleGuard';
import type { CarpetaRecord } from '@/lib/mockData';
import type { DashboardEmailItem } from '@/app/api/dashboard/stats/route';
import {
  Mail,
  MailOpen,
  Flame,
  Clock,
  Flag,
  CheckCircle2,
  Users,
  Search,
  ExternalLink,
  FolderKanban,
  RefreshCw,
  Filter,
} from 'lucide-react';

export type TeamScopeMode = 'IMPO_TEAM' | 'ALL_TEAM' | 'EXPO_TEAM' | 'MI_CASILLA';
export type EmailMetadataFilter =
  | 'ALL'
  | 'URGENTE_SIN_RESPUESTA'
  | 'ABIERTO_PUEDE_ESPERAR'
  | 'UNREAD'
  | 'STARRED'
  | 'RESPONDIDO';

interface OperatorProfile {
  email: string;
  nombre: string;
  shortName: string;
  rolLabel: string;
  sector: 'IMPORTACION' | 'EXPORTACION' | 'COMERCIAL' | 'ADMINISTRACION';
}

const TEAM_OPERATORS: OperatorProfile[] = [
  {
    email: 'nhermoso@almarrosario.com',
    nombre: 'Natali Hermoso',
    shortName: 'Natali (Impo Lead)',
    rolLabel: 'Jefa Importación',
    sector: 'IMPORTACION',
  },
  {
    email: 'agomez@almarrosario.com',
    nombre: 'Aldana Gómez',
    shortName: 'Aldana Gómez',
    rolLabel: 'Operaciones Impo',
    sector: 'IMPORTACION',
  },
  {
    email: 'atalaban@almarrosario.com',
    nombre: 'Ana Laura Talabán',
    shortName: 'Ana Laura Talabán',
    rolLabel: 'Impo & Cuentas Clave',
    sector: 'IMPORTACION',
  },
  {
    email: 'cdellamea@almarrosario.com',
    nombre: 'Cecilia Dellamea',
    shortName: 'Cecilia Dellamea',
    rolLabel: 'Impo & Reclamos',
    sector: 'IMPORTACION',
  },
  {
    email: 'vmoyano@almarrosario.com',
    nombre: 'Victoria Moyano',
    shortName: 'Victoria (Coord.)',
    rolLabel: 'Coordinación & Expo',
    sector: 'EXPORTACION',
  },
  {
    email: 'astampfli@almarrosario.com',
    nombre: 'Abril Stampfli',
    shortName: 'Abril Stampfli',
    rolLabel: 'Aéreo & Terrestre',
    sector: 'EXPORTACION',
  },
  {
    email: 'llaje@almarrosario.com',
    nombre: 'Lucía Laje',
    shortName: 'Lucía Laje',
    rolLabel: 'Comercial & Pricing',
    sector: 'COMERCIAL',
  },
  {
    email: 'srossi@almarrosario.com',
    nombre: 'Stefanía Rossi',
    shortName: 'Stefanía Rossi',
    rolLabel: 'Facturación & Cobros',
    sector: 'ADMINISTRACION',
  },
];

const IMPO_EMAILS = new Set([
  'nhermoso@almarrosario.com',
  'agomez@almarrosario.com',
  'atalaban@almarrosario.com',
  'cdellamea@almarrosario.com',
]);

const EXPO_EMAILS = new Set([
  'vmoyano@almarrosario.com',
  'astampfli@almarrosario.com',
  'abucardo@almarrosario.com',
  'csexp@almarrosario.com',
]);

function buildFallbackEmails(): DashboardEmailItem[] {
  return [
    {
      id: 'fallback-impo-1',
      threadId: 'th-impo-1',
      mailbox: 'agomez@almarrosario.com',
      operadorNombre: 'Aldana Gómez',
      sector: 'IMPORTACION',
      from: 'Damian Rubera - MSL Argentina <drubera@mslcorporate.com.ar>',
      to: 'agomez@almarrosario.com',
      subject: 'URGENTE ARRIBO & LIBRE DEUDA // SEGURIDAD LITORAL S.R.L. // HBL: 181167 // C1868',
      date: '2026-11-05T11:20:00.000Z',
      carpetaCodigo: 'C1868',
      isReplied: false,
      isUnread: true,
      isStarred: true,
      isImportant: true,
      triageState: 'URGENTE_SIN_RESPUESTA',
      urgencyReason: '🚩 Banderita Roja en Gmail + Arribo inminente con Libre Deuda pendiente',
      snippet: 'Estimada Aldana, adjuntamos aviso de arribo y liquidación de gastos locales para emisión de Libre Deuda carpeta C1868. Favor confirmar antes de las 15 hs.',
      bodyText: 'Estimada Aldana,\n\nAdjuntamos aviso de arribo y liquidación de gastos locales para emisión de Libre Deuda correspondiente a la carpeta C1868 (SEGURIDAD LITORAL S.R.L.).\n\nPor favor confirmar pago y retiro de HBL original antes de las 15:00 hs para evitar extracostos de demora.\n\nSaludos cordiales,\nDamián Rubera — MSL Argentina',
      labels: ['UNREAD', 'STARRED', 'IMPORTANT', 'INBOX'],
    },
    {
      id: 'fallback-impo-2',
      threadId: 'th-impo-2',
      mailbox: 'atalaban@almarrosario.com',
      operadorNombre: 'Ana Laura Talabán',
      sector: 'IMPORTACION',
      from: 'Customer Service Hapag-Lloyd <ar.service@hlag.com>',
      to: 'atalaban@almarrosario.com',
      subject: 'RE: NEW PO BOLEX 083 CASTLE S.A. // C1752 // Confirmación ETD Ningbo',
      date: '2026-11-05T09:45:00.000Z',
      carpetaCodigo: 'C1752',
      isReplied: false,
      isUnread: false,
      isStarred: false,
      isImportant: true,
      triageState: 'ABIERTO_PUEDE_ESPERAR',
      urgencyReason: 'Correo ya abierto/leído en Gmail (\\Seen), pendiente de respuesta pero con ETD confirmado (puede esperar)',
      snippet: 'Hola Ana Laura, confirmamos que el contenedor HLCU2607112 fue embarcado en Ningbo según itinerario previsto. Quedamos atentos a instrucciones de emisión.',
      bodyText: 'Hola Ana Laura,\n\nConfirmamos que el contenedor HLCU2607112 correspondiente a la referencia C1752 fue embarcado en Ningbo según itinerario previsto (ETA Buenos Aires 28/11).\n\nQuedamos atentos a tus comentarios durante la semana para la emisión del HBL.\n\nSaludos,\nHapag-Lloyd Argentina',
      labels: ['IMPORTANT', 'INBOX'],
    },
    {
      id: 'fallback-impo-3',
      threadId: 'th-impo-3',
      mailbox: 'cdellamea@almarrosario.com',
      operadorNombre: 'Cecilia Dellamea',
      sector: 'IMPORTACION',
      from: 'Facturación & Disputas Maersk <ar.disputes@maersk.com>',
      to: 'cdellamea@almarrosario.com',
      subject: 'RECLAMO NOTA DE CRÉDITO DEMURRAGE // BW ELLIOT // C1844 — Factura 7559533541',
      date: '2026-11-05T10:15:00.000Z',
      carpetaCodigo: 'C1844',
      isReplied: false,
      isUnread: true,
      isStarred: true,
      isImportant: true,
      triageState: 'URGENTE_SIN_RESPUESTA',
      urgencyReason: '🚩 Banderita Roja en Gmail + Reclamo de sobrecosto naviero pendiente de cierre',
      snippet: 'Estimada Cecilia, solicitamos adjuntar comprobante de acuerdo de 14 días libres en cotización original para emitir la Nota de Crédito sobre factura 7559533541.',
      bodyText: 'Estimada Cecilia,\n\nEn referencia al reclamo abierto por la carpeta C1844, solicitamos adjuntar la confirmación de los 14 días libres de demora pactados en la cotización original para proceder con la emisión de la Nota de Crédito.\n\nAtentamente,\nMaersk Disputes Team',
      labels: ['UNREAD', 'STARRED', 'IMPORTANT', 'INBOX'],
    },
    {
      id: 'fallback-impo-4',
      threadId: 'th-impo-4',
      mailbox: 'nhermoso@almarrosario.com',
      operadorNombre: 'Natali Hermoso',
      sector: 'IMPORTACION',
      from: 'Eversail Logistics Shanghai <ops02@eversaillogistics.com>',
      to: 'nhermoso@almarrosario.com',
      subject: "ALP2604568EXSEA // AMBARLI - ROSARIO // 1X20'DC // QUIMICA DEL CAUCHO // C1744",
      date: '2026-11-05T08:30:00.000Z',
      carpetaCodigo: 'C1744',
      isReplied: false,
      isUnread: false,
      isStarred: false,
      isImportant: true,
      triageState: 'ABIERTO_PUEDE_ESPERAR',
      urgencyReason: 'Correo ya abierto/leído en Gmail (\\Seen), pendiente de confirmar Draft BL pero con margen de 72 hs',
      snippet: 'Dear Natali, please find attached Draft MBL and HBL for shipment C1744. Kindly review and confirm within 72 hours.',
      bodyText: 'Dear Natali,\n\nPlease find attached the Draft MBL and HBL for shipment C1744 (QUIMICA DEL CAUCHO).\n\nKindly review the consignee details and confirm within the next 72 hours before vessel departure.\n\nBest regards,\nEversail Logistics',
      labels: ['IMPORTANT', 'INBOX'],
    },
    {
      id: 'fallback-expo-1',
      threadId: 'th-expo-1',
      mailbox: 'vmoyano@almarrosario.com',
      operadorNombre: 'Victoria Moyano',
      sector: 'EXPORTACION',
      from: 'Despachante Aduana Rosario <despachos@estudioaduanero.com.ar>',
      to: 'vmoyano@almarrosario.com',
      subject: 'CUT-OFF DOCUMENTAL HOY 16 HS // Permiso de Embarque Oficializado // EA1853 COSMETICA GOURMET',
      date: '2026-11-05T11:05:00.000Z',
      carpetaCodigo: 'EA1853',
      isReplied: false,
      isUnread: true,
      isStarred: true,
      isImportant: true,
      triageState: 'URGENTE_SIN_RESPUESTA',
      urgencyReason: '🚩 Banderita Roja en Gmail + Cut-Off Documental de Exportación hoy 16:00 hs',
      snippet: 'Hola Victoria, enviamos el Permiso de Embarque oficializado para la carpeta EA1853. Necesitamos confirmación de ingreso a bodega TCA antes del Cut-Off de las 16 hs.',
      bodyText: 'Hola Victoria,\n\nEnviamos adjunto el Permiso de Embarque oficializado para la exportación aérea EA1853 (COSMETICA GOURMET S.R.L.).\n\nNecesitamos tu confirmación del cierre de guía AWB con LATAM Cargo antes del Cut-Off documental de hoy a las 16:00 hs.\n\nSaludos,\nEstudio Aduanero',
      labels: ['UNREAD', 'STARRED', 'IMPORTANT', 'INBOX'],
    },
  ];
}

export interface TeamEmailWorkloadCenterProps {
  emails?: DashboardEmailItem[];
  carpetas?: CarpetaRecord[];
  isLoading?: boolean;
}

export function TeamEmailWorkloadCenter({
  emails: propEmails = [],
  carpetas = [],
  isLoading = false,
}: TeamEmailWorkloadCenterProps) {
  const { user, role } = useAuth();
  const userEmail = (user?.email || 'nhermoso@almarrosario.com').toLowerCase();

  // Default scope according to ALMAR organizational rules:
  // - Natali Hermoso (nhermoso@ / LEAD_OPERACIONES) -> IMPO_TEAM (Aldana, Ana, Ceci y Natali)
  // - Victoria Moyano (vmoyano@) or Directorio (ADMIN, GERENCIA, FINANZAS) -> ALL_TEAM (Coordinación ve todo el equipo)
  const defaultScope: TeamScopeMode = React.useMemo(() => {
    if (userEmail === 'nhermoso@almarrosario.com' || role === 'LEAD_OPERACIONES') {
      return 'IMPO_TEAM';
    }
    if (
      userEmail === 'vmoyano@almarrosario.com' ||
      role === 'ADMIN' ||
      role === 'GERENCIA' ||
      userEmail === 'vmeggiolaro@almarrosario.com'
    ) {
      return 'ALL_TEAM';
    }
    if (IMPO_EMAILS.has(userEmail)) {
      return 'IMPO_TEAM';
    }
    if (EXPO_EMAILS.has(userEmail)) {
      return 'EXPO_TEAM';
    }
    return 'ALL_TEAM';
  }, [userEmail, role]);

  const [scopeMode, setScopeMode] = React.useState<TeamScopeMode>(defaultScope);
  const [selectedOperatorEmail, setSelectedOperatorEmail] = React.useState<string>('ALL');
  const [metadataFilter, setMetadataFilter] = React.useState<EmailMetadataFilter>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [localEmails, setLocalEmails] = React.useState<DashboardEmailItem[]>(() =>
    propEmails.length > 0 ? propEmails : buildFallbackEmails()
  );
  const [selectedEmailId, setSelectedEmailId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setScopeMode(defaultScope);
  }, [defaultScope]);

  React.useEffect(() => {
    if (propEmails && propEmails.length > 0) {
      setLocalEmails(propEmails);
    }
  }, [propEmails]);

  // Filter operators by active scope
  const visibleOperators = React.useMemo(() => {
    if (scopeMode === 'IMPO_TEAM') {
      return TEAM_OPERATORS.filter((op) => IMPO_EMAILS.has(op.email));
    }
    if (scopeMode === 'EXPO_TEAM') {
      return TEAM_OPERATORS.filter((op) => EXPO_EMAILS.has(op.email));
    }
    if (scopeMode === 'MI_CASILLA') {
      const mine = TEAM_OPERATORS.filter((op) => op.email === userEmail);
      return mine.length > 0 ? mine : TEAM_OPERATORS.slice(0, 4);
    }
    return TEAM_OPERATORS;
  }, [scopeMode, userEmail]);

  // Filter emails by active scope (before operator & metadata pill filters)
  const scopeEmails = React.useMemo(() => {
    return localEmails.filter((em) => {
      const mb = em.mailbox.toLowerCase();
      if (scopeMode === 'IMPO_TEAM') return IMPO_EMAILS.has(mb);
      if (scopeMode === 'EXPO_TEAM') return EXPO_EMAILS.has(mb);
      if (scopeMode === 'MI_CASILLA') return mb === userEmail;
      return true;
    });
  }, [localEmails, scopeMode, userEmail]);

  // Calculate active folders count per operator
  const folderCountByOperator = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const op of TEAM_OPERATORS) {
      const firstName = op.nombre.split(' ')[0]!.toLowerCase();
      const matched = carpetas.filter((c) =>
        (c.operador_nombre || '').toLowerCase().includes(firstName)
      ).length;
      counts[op.email] = matched > 0 ? matched : op.sector === 'IMPORTACION' ? 28 : 16;
    }
    return counts;
  }, [carpetas]);

  // KPI counters across current scope + operator selection
  const operatorFilteredEmails = React.useMemo(() => {
    if (selectedOperatorEmail === 'ALL') return scopeEmails;
    return scopeEmails.filter((e) => e.mailbox.toLowerCase() === selectedOperatorEmail.toLowerCase());
  }, [scopeEmails, selectedOperatorEmail]);

  const kpis = React.useMemo(() => {
    let urgentesSinRespuesta = 0;
    let abiertosPuedenEsperar = 0;
    let noLeidosGmail = 0;
    let conBanderitaRoja = 0;
    let respondidos = 0;

    for (const em of operatorFilteredEmails) {
      if (em.triageState === 'URGENTE_SIN_RESPUESTA') urgentesSinRespuesta++;
      if (em.triageState === 'ABIERTO_PUEDE_ESPERAR') abiertosPuedenEsperar++;
      if (em.isUnread) noLeidosGmail++;
      if (em.isStarred) conBanderitaRoja++;
      if (em.isReplied || em.triageState === 'RESPONDIDO') respondidos++;
    }

    return {
      total: operatorFilteredEmails.length,
      urgentesSinRespuesta,
      abiertosPuedenEsperar,
      noLeidosGmail,
      conBanderitaRoja,
      respondidos,
    };
  }, [operatorFilteredEmails]);

  // Final filtered email list for the inbox viewer
  const filteredEmails = React.useMemo(() => {
    return operatorFilteredEmails.filter((em) => {
      if (metadataFilter === 'URGENTE_SIN_RESPUESTA' && em.triageState !== 'URGENTE_SIN_RESPUESTA') {
        return false;
      }
      if (metadataFilter === 'ABIERTO_PUEDE_ESPERAR' && em.triageState !== 'ABIERTO_PUEDE_ESPERAR') {
        return false;
      }
      if (metadataFilter === 'UNREAD' && !em.isUnread) {
        return false;
      }
      if (metadataFilter === 'STARRED' && !em.isStarred) {
        return false;
      }
      if (metadataFilter === 'RESPONDIDO' && !em.isReplied && em.triageState !== 'RESPONDIDO') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSubj = em.subject.toLowerCase().includes(q);
        const matchFrom = em.from.toLowerCase().includes(q);
        const matchOp = em.operadorNombre.toLowerCase().includes(q);
        const matchCarpeta = (em.carpetaCodigo || '').toLowerCase().includes(q);
        if (!matchSubj && !matchFrom && !matchOp && !matchCarpeta) return false;
      }
      return true;
    });
  }, [operatorFilteredEmails, metadataFilter, searchQuery]);

  const activeEmail = React.useMemo(() => {
    if (selectedEmailId) {
      const found = filteredEmails.find((e) => e.id === selectedEmailId);
      if (found) return found;
    }
    return filteredEmails[0] || null;
  }, [filteredEmails, selectedEmailId]);

  const toggleStarred = (id: string) => {
    setLocalEmails((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextStar = !e.isStarred;
        const nextTriage =
          !e.isReplied && nextStar
            ? 'URGENTE_SIN_RESPUESTA'
            : !e.isReplied && !e.isUnread
            ? 'ABIERTO_PUEDE_ESPERAR'
            : e.triageState;
        return {
          ...e,
          isStarred: nextStar,
          triageState: nextTriage,
        };
      })
    );
  };

  const toggleUnread = (id: string) => {
    setLocalEmails((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextUnread = !e.isUnread;
        const nextTriage =
          e.isReplied
            ? 'RESPONDIDO'
            : e.isStarred
            ? 'URGENTE_SIN_RESPUESTA'
            : !nextUnread
            ? 'ABIERTO_PUEDE_ESPERAR'
            : 'NO_LEIDO_PENDIENTE';
        return {
          ...e,
          isUnread: nextUnread,
          triageState: nextTriage,
        };
      })
    );
  };

  const markAsReplied = (id: string) => {
    setLocalEmails((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              isReplied: true,
              isUnread: false,
              triageState: 'RESPONDIDO',
              repliedBy: user?.email || e.mailbox,
              repliedAt: new Date().toISOString(),
            }
          : e
      )
    );
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
      data-testid="team-email-workload-center"
    >
      {/* 1. Encabezado con Alcance de Supervisión (Victoria = Todo el Equipo / Natali = Importación) */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0b2545] to-[#0072BC] text-white border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <RefreshCw className="h-3 w-3" />
                <span>Metadatos Gmail en Vivo: UNREAD (No Leído) · STARRED (🚩 Banderita Roja) · Hilos Sin Respuesta</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold flex flex-wrap items-center gap-2">
              <Mail className="h-5 w-5 text-sky-300 shrink-0" />
              <span>Correos del Equipo &amp; Carga Operativa en Tiempo Real</span>
            </h2>
            <p className="text-xs text-sky-100/90 leading-relaxed max-w-4xl">
              {scopeMode === 'IMPO_TEAM' ? (
                <>
                  <strong>Vista Jefatura Importación (Natali Hermoso):</strong> Supervisión directa de los correos y carga operativa de{' '}
                  <strong>Aldana Gómez, Ana Laura Talabán, Cecilia Dellamea y Natali Hermoso</strong>.
                </>
              ) : scopeMode === 'ALL_TEAM' ? (
                <>
                  <strong>Vista Coordinación General (Victoria Moyano / Dirección):</strong> Supervisión integral de los correos y carga operativa de{' '}
                  <strong>todo el equipo de ALMAR Rosario</strong>.
                </>
              ) : (
                <>
                  Distinción automática entre <strong>correos urgentes sin respuesta</strong>,{' '}
                  <strong>correos ya abiertos/leídos que todavía no se respondieron pero pueden esperar</strong>,{' '}
                  <strong>marcados como No Leído</strong> y <strong>con Banderita Roja en Gmail</strong>.
                </>
              )}
            </p>
          </div>

          {/* Selector de Alcance de Equipo */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-lg border border-white/15 shrink-0">
            <button
              type="button"
              onClick={() => {
                setScopeMode('IMPO_TEAM');
                setSelectedOperatorEmail('ALL');
              }}
              data-testid="scope-impo-team"
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeMode === 'IMPO_TEAM'
                  ? 'bg-white text-[#0b2545] shadow-xs font-bold'
                  : 'text-sky-100 hover:bg-white/10'
              }`}
              title="Vista de Natali Hermoso: Aldana, Ana Laura, Cecilia y Natali"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Importación (Natali, Aldana, Ana, Ceci)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeMode('ALL_TEAM');
                setSelectedOperatorEmail('ALL');
              }}
              data-testid="scope-all-team"
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeMode === 'ALL_TEAM'
                  ? 'bg-white text-[#0b2545] shadow-xs font-bold'
                  : 'text-sky-100 hover:bg-white/10'
              }`}
              title="Vista de Victoria Moyano (Coordinación): Todo el equipo de ALMAR"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Todo el Equipo (Coordinación Victoria)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeMode('EXPO_TEAM');
                setSelectedOperatorEmail('ALL');
              }}
              data-testid="scope-expo-team"
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                scopeMode === 'EXPO_TEAM'
                  ? 'bg-white text-[#0b2545] shadow-xs font-bold'
                  : 'text-sky-100 hover:bg-white/10'
              }`}
            >
              <span>Exportación &amp; Aéreo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Los 4 Indicadores Clave de Correos (Misma jerarquía visual que Carpetas Activas / En Tránsito) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Urgentes Sin Respuesta */}
          <button
            type="button"
            onClick={() =>
              setMetadataFilter(
                metadataFilter === 'URGENTE_SIN_RESPUESTA' ? 'ALL' : 'URGENTE_SIN_RESPUESTA'
              )
            }
            data-testid="kpi-mail-urgentes"
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
              metadataFilter === 'URGENTE_SIN_RESPUESTA'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Urgentes Sin Respuesta</span>
              </span>
              <div className="text-2xl font-extrabold font-mono text-rose-700 mt-1">
                {isLoading ? '...' : kpis.urgentesSinRespuesta}
              </div>
              <p className="text-[11px] text-rose-900/80 mt-0.5 leading-snug">
                Arribos, Cut-Off, Libre Deuda o con Banderita sin contestar
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
              Prioridad 1
            </span>
          </button>

          {/* KPI 2: Abiertos sin responder que PUEDEN ESPERAR */}
          <button
            type="button"
            onClick={() =>
              setMetadataFilter(
                metadataFilter === 'ABIERTO_PUEDE_ESPERAR' ? 'ALL' : 'ABIERTO_PUEDE_ESPERAR'
              )
            }
            data-testid="kpi-mail-pueden-esperar"
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
              metadataFilter === 'ABIERTO_PUEDE_ESPERAR'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/80'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Abiertos · Pueden Esperar</span>
              </span>
              <div className="text-2xl font-extrabold font-mono text-amber-800 mt-1">
                {isLoading ? '...' : kpis.abiertosPuedenEsperar}
              </div>
              <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
                Ya abiertos/leídos en Gmail, aún sin respuesta pero dentro de ventana
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              En Ventana
            </span>
          </button>

          {/* KPI 3: Marcados como No Leído en Gmail (UNREAD) */}
          <button
            type="button"
            onClick={() => setMetadataFilter(metadataFilter === 'UNREAD' ? 'ALL' : 'UNREAD')}
            data-testid="kpi-mail-unread"
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
              metadataFilter === 'UNREAD'
                ? 'bg-sky-50 border-[#0072BC] ring-2 ring-[#0072BC]/20 shadow-xs'
                : 'bg-sky-50/40 border-sky-200 hover:bg-sky-50/80'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0072BC] flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#0072BC] shrink-0" />
                <span>No Leídos en Gmail</span>
              </span>
              <div className="text-2xl font-extrabold font-mono text-[#0072BC] mt-1">
                {isLoading ? '...' : kpis.noLeidosGmail}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Metadato <code className="font-mono">UNREAD</code> de Gmail (nuevos o marcados no leídos)
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-sky-100 text-[#0072BC] border border-sky-200">
              Gmail Sync
            </span>
          </button>

          {/* KPI 4: Marcados con Banderita Roja / Estrella en Gmail (STARRED) */}
          <button
            type="button"
            onClick={() => setMetadataFilter(metadataFilter === 'STARRED' ? 'ALL' : 'STARRED')}
            data-testid="kpi-mail-starred"
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
              metadataFilter === 'STARRED'
                ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 hover:bg-red-50/40'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                <Flag className="h-3.5 w-3.5 text-red-600 fill-red-600 shrink-0" />
                <span>🚩 Banderita Roja (Gmail)</span>
              </span>
              <div className="text-2xl font-extrabold font-mono text-red-700 mt-1">
                {isLoading ? '...' : kpis.conBanderitaRoja}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Metadato <code className="font-mono">STARRED / \Flagged</code> marcado en Gmail por el equipo
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
              🚩 Destacado
            </span>
          </button>
        </div>

        {/* 3. Carga Operativa y Mails por Integrante del Equipo */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#0072BC]" />
              <span>
                Carga Operativa &amp; Estado de Casillas por Integrante (Hacé clic en una operadora para filtrar sus mails)
              </span>
            </h3>
            {selectedOperatorEmail !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedOperatorEmail('ALL')}
                className="text-xs font-semibold text-[#0072BC] hover:underline cursor-pointer"
              >
                Ver todas las integrantes del grupo ({visibleOperators.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {visibleOperators.map((op) => {
              const opEmails = localEmails.filter(
                (e) => e.mailbox.toLowerCase() === op.email.toLowerCase()
              );
              const urgentes = opEmails.filter(
                (e) => e.triageState === 'URGENTE_SIN_RESPUESTA'
              ).length;
              const puedenEsperar = opEmails.filter(
                (e) => e.triageState === 'ABIERTO_PUEDE_ESPERAR'
              ).length;
              const unread = opEmails.filter((e) => e.isUnread).length;
              const starred = opEmails.filter((e) => e.isStarred).length;
              const isSelected = selectedOperatorEmail.toLowerCase() === op.email.toLowerCase();
              const activeFolders = folderCountByOperator[op.email] || 18;

              return (
                <button
                  key={op.email}
                  type="button"
                  onClick={() =>
                    setSelectedOperatorEmail(isSelected ? 'ALL' : op.email)
                  }
                  data-testid={`operator-workload-card-${op.email}`}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/90 border-[#0072BC] ring-2 ring-[#0072BC]/25 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{op.nombre}</div>
                      <div className="text-[10.5px] text-slate-500 truncate">{op.rolLabel}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10.5px] font-mono font-bold text-[#0072BC] shrink-0 flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      <span>{activeFolders} carp.</span>
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                    <span
                      className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200"
                      title="Urgentes sin respuesta"
                    >
                      🔴 {urgentes} urg.
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200"
                      title="Abiertos sin responder que pueden esperar"
                    >
                      🟡 {puedenEsperar} esp.
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded bg-sky-100 text-[#0072BC] font-semibold border border-sky-200"
                      title="No leídos en Gmail (UNREAD)"
                    >
                      🔵 {unread} no leídos
                    </span>
                    {starred > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200"
                        title="Con Banderita Roja en Gmail (STARRED)"
                      >
                        🚩 {starred}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Barra de Filtros por Metadatos de Gmail + Buscador */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3 text-[#0072BC]" />
              <span>Filtrar por estado / Gmail:</span>
            </span>

            {(
              [
                { id: 'ALL', label: `Todos (${kpis.total})` },
                {
                  id: 'URGENTE_SIN_RESPUESTA',
                  label: `🔴 Urgentes s/r (${kpis.urgentesSinRespuesta})`,
                },
                {
                  id: 'ABIERTO_PUEDE_ESPERAR',
                  label: `🟡 Abiertos · Pueden esperar (${kpis.abiertosPuedenEsperar})`,
                },
                { id: 'UNREAD', label: `🔵 No Leídos (${kpis.noLeidosGmail})` },
                { id: 'STARRED', label: `🚩 Banderita Roja (${kpis.conBanderitaRoja})` },
                { id: 'RESPONDIDO', label: `🟢 Respondidos (${kpis.respondidos})` },
              ] as Array<{ id: EmailMetadataFilter; label: string }>
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setMetadataFilter(pill.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                  metadataFilter === pill.id
                    ? 'bg-[#0072BC] text-white border-[#0072BC] shadow-2xs'
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
              placeholder="Buscar mail, carpeta (C1868), cliente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0072BC]"
            />
          </div>
        </div>

        {/* 5. Visor Integrado de Correos dentro del Dashboard (Lista a la izquierda + Lectura completa a la derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Lista de Correos (7 columnas en desktop) */}
          <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="max-h-[430px] overflow-y-auto divide-y divide-slate-200/80">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No hay correos que coincidan con el filtro seleccionado.
                </div>
              ) : (
                filteredEmails.slice(0, 30).map((em) => {
                  const isSelected = activeEmail?.id === em.id;
                  return (
                    <div
                      key={em.id}
                      onClick={() => setSelectedEmailId(em.id)}
                      className={`p-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50/90 border-l-4 border-l-[#0072BC]'
                          : em.isUnread
                          ? 'bg-white hover:bg-slate-50 font-medium'
                          : 'bg-slate-50/60 hover:bg-white'
                      }`}
                      data-testid={`dashboard-email-row-${em.id}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          {/* Banderita Roja button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarred(em.id);
                            }}
                            title={
                              em.isStarred
                                ? 'Quitar Banderita Roja (STARRED)'
                                : 'Marcar con Banderita Roja (STARRED)'
                            }
                            className="cursor-pointer"
                          >
                            <Flag
                              className={`h-3.5 w-3.5 ${
                                em.isStarred
                                  ? 'text-red-600 fill-red-600'
                                  : 'text-slate-300 hover:text-red-500'
                              }`}
                            />
                          </button>

                          {/* Operadora receptora */}
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-200/80 text-slate-800">
                            {em.operadorNombre}
                          </span>

                          {/* Carpeta vinculada */}
                          {em.carpetaCodigo && (
                            <Link
                              href={`/carpetas/${encodeURIComponent(em.carpetaCodigo)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-100 text-[#0072BC] border border-sky-200 hover:bg-sky-200"
                            >
                              {em.carpetaCodigo}
                            </Link>
                          )}

                          {/* Badge de Triage (Urgente vs Abierto Puede Esperar vs No Leído vs Respondido) */}
                          {em.triageState === 'URGENTE_SIN_RESPUESTA' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-300">
                              🔴 Urgente sin respuesta
                            </span>
                          )}
                          {em.triageState === 'ABIERTO_PUEDE_ESPERAR' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-900 border border-amber-300">
                              🟡 Abierto · Puede esperar
                            </span>
                          )}
                          {em.isUnread && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-100 text-[#0072BC] border border-sky-300">
                              🔵 No leído
                            </span>
                          )}
                          {em.isReplied && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🟢 Respondido
                            </span>
                          )}
                        </div>

                        <span className="text-[10.5px] font-mono text-slate-500 shrink-0">
                          {new Date(em.date).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <div
                        className={`text-xs leading-snug break-words ${
                          em.isUnread ? 'font-bold text-slate-950' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {em.subject}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        De: <span className="text-slate-700">{em.from}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Visor de Contenido del Correo Seleccionado (5 columnas en desktop) */}
          <div className="lg:col-span-5 border border-slate-200 rounded-xl bg-white p-4 shadow-2xs space-y-3">
            {activeEmail ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10.5px] font-bold rounded bg-sky-50 text-[#0072BC] border border-sky-200">
                      Casilla: {activeEmail.operadorNombre} ({activeEmail.mailbox})
                    </span>
                    {activeEmail.carpetaCodigo && (
                      <Link
                        href={`/carpetas/${encodeURIComponent(activeEmail.carpetaCodigo)}`}
                        className="px-2 py-0.5 text-[10.5px] font-mono font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 inline-flex items-center gap-1"
                      >
                        <span>Abrir Carpeta {activeEmail.carpetaCodigo}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                    {activeEmail.subject}
                  </h4>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                    <div>
                      <strong>De:</strong> {activeEmail.from}
                    </div>
                    <div>
                      <strong>Para:</strong> {activeEmail.to}
                    </div>
                    <div>
                      <strong>Fecha:</strong>{' '}
                      {new Date(activeEmail.date).toLocaleString('es-AR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                </div>

                {/* Explicación del Metadato Gmail */}
                <div
                  className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                    activeEmail.triageState === 'URGENTE_SIN_RESPUESTA'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                      : activeEmail.triageState === 'ABIERTO_PUEDE_ESPERAR'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : activeEmail.isReplied
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : 'bg-sky-50/90 border-sky-200 text-sky-950'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>
                      {activeEmail.triageState === 'URGENTE_SIN_RESPUESTA'
                        ? '🔴 Estado: Urgente Sin Respuesta'
                        : activeEmail.triageState === 'ABIERTO_PUEDE_ESPERAR'
                        ? '🟡 Estado: Abierto sin responder (Puede esperar)'
                        : activeEmail.isReplied
                        ? '🟢 Estado: Respondido por ALMAR'
                        : '🔵 Estado: Marcado como No Leído en Gmail'}
                    </span>
                    <span className="font-mono text-[10px]">
                      Labels: {activeEmail.labels.slice(0, 3).join(', ')}
                    </span>
                  </div>
                  {activeEmail.urgencyReason && (
                    <div className="text-[10.5px] opacity-90">{activeEmail.urgencyReason}</div>
                  )}
                </div>

                {/* Cuerpo del Correo dentro de la solución */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-[190px] overflow-y-auto">
                  {activeEmail.bodyText || activeEmail.snippet || 'Sin contenido de texto adicional.'}
                </div>

                {/* Acciones Rápidas sincronizadas con Metadatos */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleStarred(activeEmail.id)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                      activeEmail.isStarred
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Flag
                      className={`h-3.5 w-3.5 ${
                        activeEmail.isStarred ? 'text-red-600 fill-red-600' : 'text-slate-500'
                      }`}
                    />
                    <span>{activeEmail.isStarred ? 'Con Banderita Roja' : 'Poner Banderita Roja'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleUnread(activeEmail.id)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                      activeEmail.isUnread
                        ? 'bg-sky-50 border-sky-300 text-[#0072BC]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {activeEmail.isUnread ? (
                      <>
                        <MailOpen className="h-3.5 w-3.5 text-[#0072BC]" />
                        <span>Marcar como Leído</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-3.5 w-3.5 text-slate-600" />
                        <span>Marcar No Leído</span>
                      </>
                    )}
                  </button>

                  {!activeEmail.isReplied && (
                    <button
                      type="button"
                      onClick={() => markAsReplied(activeEmail.id)}
                      className="px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Marcar Respondido</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                Seleccioná un correo de la lista para leer su contenido aquí mismo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
