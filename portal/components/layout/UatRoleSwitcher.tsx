'use client';

import * as React from 'react';
import { useAuth } from '@/components/auth/RoleGuard';
import { isUatModeEnabled, type UserRole } from '@/lib/auth';
import {
  Briefcase,
  Shield,
  TrendingUp,
  Settings,
  Sparkles,
} from 'lucide-react';

export interface CorporateUatPersona {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  cargo: string;
  shortLabel: string;
  area: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';
  activeClass: string;
  hoverClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CORPORATE_UAT_PERSONAS: CorporateUatPersona[] = [
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'llaje@almarrosario.com',
    nombre: 'Lucía Laje',
    role: 'COMERCIAL',
    cargo: 'Comercial / Pricing & Cotizaciones',
    shortLabel: 'Comercial',
    area: 'Pricing',
    badgeVariant: 'warning',
    activeClass: 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-300',
    hoverClass: 'hover:bg-amber-50/60 hover:text-amber-800 hover:border-amber-200',
    icon: Briefcase,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'nhermoso@almarrosario.com',
    nombre: 'Natali Hermoso',
    role: 'LEAD_OPERACIONES',
    cargo: 'Lead Operaciones Comex & Embarques',
    shortLabel: 'Operaciones',
    area: 'Comex',
    badgeVariant: 'default',
    activeClass: 'border-sky-400 bg-sky-50 text-sky-900 shadow-xs ring-1 ring-sky-300',
    hoverClass: 'hover:bg-sky-50/60 hover:text-sky-800 hover:border-sky-200',
    icon: Shield,
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    email: 'srossi@almarrosario.com',
    nombre: 'Stefania Rossi',
    role: 'FINANZAS',
    cargo: 'Facturación / Administración & Cobranzas',
    shortLabel: 'Finanzas',
    area: 'Facturación',
    badgeVariant: 'success',
    activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-300',
    hoverClass: 'hover:bg-emerald-50/60 hover:text-emerald-800 hover:border-emerald-200',
    icon: TrendingUp,
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'jarloro@almarrosario.com',
    nombre: 'Juan Andrés Arloro',
    role: 'ADMIN',
    cargo: 'Gerencia General / Auditoría ISO',
    shortLabel: 'Dirección',
    area: 'Auditoría',
    badgeVariant: 'purple',
    activeClass: 'border-purple-400 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-300',
    hoverClass: 'hover:bg-purple-50/60 hover:text-purple-800 hover:border-purple-200',
    icon: Settings,
  },
];

export function UatRoleSwitcher() {
  const { user, role, impersonateUser } = useAuth();
  const [switchingEmail, setSwitchingEmail] = React.useState<string | null>(null);

  if (!isUatModeEnabled() || (role && role !== 'ADMIN' && !process.env.VITEST)) {
    return null;
  }

  const handleSwitch = async (persona: CorporateUatPersona) => {
    if (switchingEmail) return;
    setSwitchingEmail(persona.email);
    try {
      if (impersonateUser) {
        await impersonateUser({
          id: persona.id,
          email: persona.email,
          nombre: persona.nombre,
          role: persona.role,
        });
      }
    } finally {
      setSwitchingEmail(null);
    }
  };

  return (
    <div
      data-testid="uat-role-switcher"
      className="hidden xl:flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80 shadow-2xs shrink-0"
      title="Selector Rápido UAT Multi-Rol (1 Clic) - Alterna identidades corporativas reales sin reloguear"
      role="group"
      aria-label="Selector de rol UAT"
    >
      <div className="hidden 2xl:flex items-center gap-1 px-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        <Sparkles className="h-3 w-3 text-[#0072BC]" />
        <span>UAT:</span>
      </div>

      {CORPORATE_UAT_PERSONAS.map((p) => {
        const isActive =
          user?.email?.toLowerCase() === p.email.toLowerCase() ||
          role === p.role;
        const Icon = p.icon;
        const isCurrentlySwitching = switchingEmail === p.email;

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSwitch(p)}
            disabled={isCurrentlySwitching}
            data-testid={`uat-role-btn-${p.role.toLowerCase()}`}
            data-role={p.role}
            data-email={p.email}
            aria-pressed={isActive}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
              isActive
                ? p.activeClass
                : `border-transparent text-slate-600 bg-transparent ${p.hoverClass}`
            } ${isCurrentlySwitching ? 'opacity-70 cursor-wait' : ''}`}
            title={`${p.nombre} (${p.email}) - ${p.cargo}`}
          >
            <Icon className={`h-3 w-3 shrink-0 ${isActive ? 'stroke-[2.2]' : 'opacity-70'}`} />
            <span className="hidden 2xl:inline">{p.shortLabel}</span>
            <span className="2xl:hidden">{p.shortLabel.slice(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
}
