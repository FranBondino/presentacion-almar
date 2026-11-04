'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserNav } from './UserNav';
import { UatRoleSwitcher } from './UatRoleSwitcher';
import {
  Search,
  Bell,
  ChevronRight,
  Menu,
  Compass,
  ShieldCheck,
  Sparkles,
  Camera,
} from 'lucide-react';
import { AuditProvenanceModal } from './AuditProvenanceModal';
import { LiveSyncControl } from './LiveSyncControl';

export interface HeaderProps {
  onToggleMobileSidebar?: () => void;
}

export function Header({ onToggleMobileSidebar }: HeaderProps) {
  const [isAuditModalOpen, setIsAuditModalOpen] = React.useState(false);
  const [unreadAlerts, setUnreadAlerts] = React.useState(0);
  const rawPathname = usePathname();
  const pathname = rawPathname ?? '/';

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    let cancelled = false;
    fetch('/api/alertas?limit=100')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setUnreadAlerts(json.data.filter((a: { resuelta?: boolean }) => !a.resuelta).length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('almar:open-copilot'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumbs = () => {
    const segments = (pathname || '').split('/').filter(Boolean);
    if (segments.length === 0) {
      return [{ label: 'Dashboard Operativo', href: '/' }];
    }

    const map: Record<string, string> = {
      carpetas: 'Carpetas de Embarque',
      comprobantes: 'Comprobantes & Facturación',
      cotizaciones: 'Cotizaciones & Preventa',
      metricas: 'Métricas & Rendimiento',
      eventos: 'Eventos & Tracking',
      documentos: 'Repositorio Documental',
      alertas: 'Centro de Alertas',
      'audit-log': 'Registro de Auditoría',
      chat: 'Asistente IA',
      gastos: 'Gastos Operativos',
      rentabilidad: 'Rentabilidad',
    };

    const breadcrumbs = [{ label: 'Inicio', href: '/' }];
    let currentPath = '';

    for (const seg of segments) {
      currentPath += `/${seg}`;
      breadcrumbs.push({
        label: map[seg] ?? seg.toUpperCase(),
        href: currentPath,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full max-w-full min-w-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-5 shadow-xs text-slate-900 overflow-x-clip">
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Mobile branding icon */}
        <div className="flex items-center gap-2 lg:hidden shrink-0">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-1 shadow-xs overflow-hidden">
            <Image
              src="/images/logo-almar.png"
              alt="ALMAR"
              width={26}
              height={26}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="font-bold text-sm text-slate-900">ALMAR</span>
        </div>

        {/* Desktop Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1 text-xs text-slate-500 min-w-0 max-w-[120px] xl:max-w-[200px] truncate">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                {isLast ? (
                  <span className="font-semibold text-slate-900 truncate max-w-[120px] xl:max-w-[200px]">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-[#0072BC] transition-colors truncate max-w-[120px] xl:max-w-[200px]"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Center / Right: Search + Notifications + UserNav */}
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 min-w-0">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-28 lg:w-36 xl:w-40 2xl:w-60 min-w-0 shrink">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Buscar carpeta, BL, CUIT..."
            className="h-8.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0072BC] focus:outline-none focus:ring-1 focus:ring-[#0072BC] transition-all shadow-xs"
          />
        </div>

        {/* Live Mailbox & Tracking Sync Control */}
        <LiveSyncControl />

        {/* UAT Error / Improvement Feedback with Screenshot Trigger */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('almar:open-copilot', {
                  detail: { mode: 'UAT_FEEDBACK', action: 'open' },
                })
              );
            }
          }}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/90 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-xs cursor-pointer shrink-0"
          title="Reportar error, dato a corregir o sugerencia de mejora con captura de pantalla (Ctrl+V)"
          aria-label="Reportar Error o Mejora UAT"
          data-testid="btn-header-uat-feedback"
        >
          <Camera className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="hidden md:inline">Reportar UAT</span>
        </button>

        {/* Executive Copilot IA Trigger (Ctrl+J) */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('almar:open-copilot', {
                  detail: { mode: 'RAG_QUERY', action: 'toggle' },
                })
              );
            }
          }}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/80 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-[#0072BC] hover:bg-sky-100 hover:border-sky-300 transition-all shadow-xs cursor-pointer shrink-0"
          title="Copilot IA — Consultas Operativas & Desvíos (Ctrl+J)"
          aria-label="Abrir Copilot IA"
          data-testid="btn-header-copilot-trigger"
        >
          <Sparkles className="h-4 w-4 text-[#0072BC] shrink-0" />
          <span className="hidden sm:inline">Copilot IA</span>
          <kbd className="hidden xl:inline-flex items-center gap-0.5 rounded border border-sky-300/60 bg-white/80 px-1 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
            Ctrl+J
          </kbd>
        </button>

        {/* Auditoría de Datos Reales Badge / Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsAuditModalOpen(true)}
          className="hidden 2xl:flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-xs cursor-pointer shrink-0"
          title="Ver trazabilidad forense, casillas de correo y fechas auditadas"
          aria-label="Ver Trazabilidad y Datos Auditados"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>Auditoría</span>
        </button>

        {/* Tutorial Guiado / FTUX Launch Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('almar:open-onboarding-tour'));
            }
          }}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0072BC]/40 hover:bg-sky-50 hover:text-[#0072BC] transition-all shadow-xs cursor-pointer shrink-0"
          title="Tutorial Guiado"
          aria-label="Tutorial Guiado"
        >
          <Compass className="h-4 w-4 text-[#0072BC] shrink-0" />
          <span className="hidden 2xl:inline">Tutorial Guiado</span>
        </button>

        {/* Alerts Bell Link */}
        <Link
          href="/alertas"
          className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs shrink-0"
          aria-label="Ver alertas"
        >
          <Bell className="h-4 w-4" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs ring-2 ring-white">
              {unreadAlerts}
            </span>
          )}
        </Link>

        {/* Quick UAT Multi-Role Switcher (1-Click corporate personas) */}
        <UatRoleSwitcher />

        {/* Unified User Navigation & 1-Click Role Switcher */}
        <UserNav />
      </div>

      {/* Global Audit Provenance Modal */}
      <AuditProvenanceModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </header>
  );
}
