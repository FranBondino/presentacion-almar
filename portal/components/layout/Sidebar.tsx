'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { canAccessMulticotizador } from '@/lib/auth';
import { useAuth, RoleGuard } from '@/components/auth/RoleGuard';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  FileSpreadsheet,
  Ship,
  Activity,
  Files,
  AlertTriangle,
  BarChart3,
  History,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  title: string;
  shortTitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'core' | 'secondary';
  stepNumber?: string;
  badge?: number | string;
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'info';
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    title: 'Inicio / Resumen',
    href: '/',
    icon: LayoutDashboard,
    section: 'core',
  },
  {
    title: 'Cotizaciones & Preventa',
    href: '/cotizaciones',
    icon: FileSpreadsheet,
    section: 'core',
    stepNumber: '1',
  },
  {
    title: 'Multicotizador Navieras',
    href: '/cotizaciones/multicotizador',
    icon: Ship,
    section: 'core',
  },
  {
    title: 'Carpetas de Embarque',
    href: '/carpetas',
    icon: FolderKanban,
    section: 'core',
    stepNumber: '2',
  },
  {
    title: 'Comprobantes & Facturación',
    href: '/comprobantes',
    icon: FileText,
    section: 'core',
    stepNumber: '3',
  },
  {
    title: 'Eventos & Tracking',
    href: '/eventos',
    icon: Activity,
    section: 'secondary',
  },
  {
    title: 'Documentos',
    href: '/documentos',
    icon: Files,
    section: 'secondary',
  },
  {
    title: 'Centro de Alertas',
    href: '/alertas',
    icon: AlertTriangle,
    section: 'secondary',
  },
  {
    title: 'Métricas & Rendimiento',
    href: '/metricas',
    icon: BarChart3,
    section: 'secondary',
  },
];

export function Sidebar({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? '/';
  const { role, logout } = useAuth();

  const [activeAlertsCount, setActiveAlertsCount] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    let cancelled = false;
    fetch('/api/alertas?limit=100')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setActiveAlertsCount(json.data.filter((a: { resuelta?: boolean }) => !a.resuelta).length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const isDirectorio = role === 'ADMIN' || role === 'GERENCIA' || role === 'FINANZAS';

  const visibleNavItems = PRIMARY_NAV_ITEMS.filter((item) => {
    if (item.href === '/metricas') {
      return isDirectorio;
    }
    if (item.href === '/cotizaciones/multicotizador') {
      return canAccessMulticotizador(role);
    }
    return true;
  });

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/cotizaciones') {
      return pathname === '/cotizaciones';
    }
    return pathname.startsWith(href);
  };

  const getRoleNavBadge = (href: string) => {
    if (canAccessMulticotizador(role) && href === '/cotizaciones/multicotizador') {
      return {
        label: 'FCL',
        className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    if (role === 'COMERCIAL' && href === '/cotizaciones') {
      return {
        label: 'Mi Área',
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    if (role === 'FINANZAS') {
      if (href === '/comprobantes') {
        return {
          label: 'Aprobaciones',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      }
      if (href === '/audit-log') {
        return {
          label: 'Prioritario',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      }
    }
    if (role === 'OPERATIVO' && href === '/carpetas') {
      return {
        label: 'Tráfico',
        className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    if (role === 'LEAD_OPERACIONES' && href === '/carpetas') {
      return {
        label: 'Supervisión',
        className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    if (role === 'GERENCIA' && href === '/metricas') {
      return {
        label: 'Directiva',
        className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    }
    if (role === 'ADMIN' && href === '/audit-log') {
      return {
        label: 'Auditoría',
        className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    }
    return null;
  };

  const coreItems = visibleNavItems.filter((item) => item.section === 'core');
  const secondaryItems = visibleNavItems.filter((item) => item.section === 'secondary');

  const renderNavItem = (item: NavItem, compact: boolean) => {
    const active = isLinkActive(item.href);
    const Icon = item.icon;
    const isAlertsItem = item.href === '/alertas';
    const roleBadge = getRoleNavBadge(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
        title={compact ? item.title : undefined}
        className={cn(
          'flex items-center rounded-lg py-2.5 text-xs font-medium transition-all group relative',
          compact ? 'justify-center px-2' : 'justify-between px-3',
          active
            ? 'bg-white/10 text-white font-semibold border-r-2 border-[#0072BC] shadow-xs'
            : 'text-slate-300 hover:bg-white/5 hover:text-white border-r-2 border-transparent'
        )}
      >
        <div className={cn('flex items-center', compact ? 'justify-center' : 'gap-2.5 min-w-0 flex-1')}>
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
            )}
          />
          {!compact && (
            <span className="min-w-0 flex items-center gap-1.5">
              {item.stepNumber && (
                <span
                  className={cn(
                    'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold',
                    active
                      ? 'bg-[#0072BC] text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 border border-white/10'
                  )}
                >
                  {item.stepNumber}
                </span>
              )}
              <span className="truncate">{item.title}</span>
            </span>
          )}
        </div>

        {!compact && (
          <>
            {isAlertsItem && activeAlertsCount > 0 ? (
              <span className="ml-1.5 shrink-0 whitespace-nowrap flex h-5 items-center justify-center rounded-full bg-rose-500/20 px-2 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                {activeAlertsCount}
              </span>
            ) : roleBadge ? (
              <span
                className={cn(
                  'ml-1.5 shrink-0 whitespace-nowrap flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold border shadow-2xs',
                  roleBadge.className
                )}
              >
                {roleBadge.label}
              </span>
            ) : null}
          </>
        )}

        {compact && isAlertsItem && activeAlertsCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#081433]" />
        )}
      </Link>
    );
  };

  const renderSidebarBody = (compact: boolean) => (
    <div className="flex h-full flex-col justify-between bg-[#081433] text-slate-300 border-r border-white/10">
      {/* Brand Header */}
      <div className="overflow-y-auto flex-1">
        <div
          className={cn(
            'flex h-16 items-center border-b border-white/10 bg-[#081433] sticky top-0 z-10',
            compact ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group min-w-0" onClick={onCloseMobile}>
            <div className="bg-white rounded-lg p-1.5 shadow-xs shrink-0 flex items-center justify-center h-9 w-9 group-hover:scale-105 transition-transform overflow-hidden">
              <Image
                src="/images/logo-almar.png"
                alt="ALMAR Rosario"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            {!compact && (
              <div className="min-w-0">
                <div className="font-bold text-sm text-white tracking-tight truncate">
                  ALMAR Rosario
                </div>
                <div className="text-[10px] font-medium text-sky-400 font-mono truncate">
                  Portal Operativo &amp; Logístico
                </div>
              </div>
            )}
          </Link>

          {onToggleCollapse && !compact && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Colapsar barra lateral (ganar espacio para tablas)"
              aria-label="Colapsar barra lateral"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Cerrar barra lateral"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {compact && onToggleCollapse && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Expandir barra lateral"
              aria-label="Expandir barra lateral"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className={cn('py-4', compact ? 'px-2' : 'px-3')}>
          {!compact && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Circuito Operativo (1 → 2 → 3)
            </div>
          )}
          <nav className="space-y-1">
            {coreItems.map((item) => renderNavItem(item, compact))}
          </nav>

          <div className="mt-5 pt-4 border-t border-white/10">
            {!compact && (
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Consultas &amp; Supervisión
              </div>
            )}
            <nav className="space-y-1">
              {secondaryItems.map((item) => renderNavItem(item, compact))}
            </nav>
          </div>

          {/* Conditional Audit Log Link: Restricted to ADMIN, GERENCIA, FINANZAS, LEAD_OPERACIONES */}
          <RoleGuard allowedRoles={['ADMIN', 'GERENCIA', 'FINANZAS', 'LEAD_OPERACIONES']}>
            <div className="mt-5 pt-4 border-t border-white/10">
              {!compact && (
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Gobernanza &amp; Cumplimiento
                </div>
              )}
              <nav className="space-y-1">
                {renderNavItem(
                  {
                    title: 'Registro de Auditoría',
                    href: '/audit-log',
                    icon: History,
                    section: 'secondary',
                  },
                  compact
                )}
              </nav>
            </div>
          </RoleGuard>
        </div>
      </div>

      {/* Footer / System Status & Logout */}
      <div className="p-2.5 border-t border-white/10 space-y-2 bg-[#081433]">
        {!compact && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Terminal:</span>
              <span className="font-semibold text-white">Rosario (ARROS)</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Rol Activo:</span>
              <span className="text-sky-400 font-semibold">{role ?? 'OPERATIVO'}</span>
            </div>
          </div>
        )}

        <PwaInstallButton variant={compact ? 'compact' : 'sidebar'} />

        <button
          onClick={logout}
          title={compact ? 'Cerrar Sesión' : undefined}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 hover:bg-rose-950/40 hover:border-rose-500/40 hover:text-rose-300 transition-colors cursor-pointer shadow-xs"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!compact && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 transition-all duration-200',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
      >
        {renderSidebarBody(isCollapsed)}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-xs flex-1 flex-col z-50">
            {renderSidebarBody(false)}
          </div>
        </div>
      )}
    </>
  );
}
