'use client';

import * as React from 'react';
import { useAuth } from '@/components/auth/RoleGuard';
import { isUatModeEnabled, type UserRole } from '@/lib/auth';
import { MOCK_USERS, type MockUserSession } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  Shield,
  ChevronDown,
  Check,
  Zap,
  TrendingUp,
  Briefcase,
  FileSpreadsheet,
  Settings,
  Sparkles,
} from 'lucide-react';

interface PersonaMeta {
  role: UserRole;
  cargo: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';
  description: string;
  avatarBg: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PERSONA_CONFIG: Record<string, PersonaMeta> = {
  'vmeggiolaro@almarrosario.com': {
    role: 'FINANZAS',
    cargo: 'Directora Financiera / Socia',
    badgeVariant: 'success',
    description: 'Aprobación exclusiva de desvíos tarifarios (+21%) y cierre contable',
    avatarBg: 'bg-emerald-600',
    icon: TrendingUp,
  },
  'llaje@almarrosario.com': {
    role: 'COMERCIAL',
    cargo: 'Comercial Lead & Grandes Cuentas',
    badgeVariant: 'warning',
    description: '1.080 cotizaciones, Calculadora de Flete y Smart Follow-Up',
    avatarBg: 'bg-amber-600',
    icon: Briefcase,
  },
  'nhermoso@almarrosario.com': {
    role: 'LEAD_OPERACIONES',
    cargo: 'Jefa de Tráfico Marítimo',
    badgeVariant: 'default',
    description: 'Despacho de importaciones marítimas e ingesta OCR',
    avatarBg: 'bg-sky-600',
    icon: Shield,
  },
  'agomez@almarrosario.com': {
    role: 'OPERATIVO',
    cargo: 'Operadora de Tráfico / Carga',
    badgeVariant: 'secondary',
    description: 'Carga asistida Kipintoch y despacho de tráfico',
    avatarBg: 'bg-slate-600',
    icon: FileSpreadsheet,
  },
  'anoacco@almarrosario.com': {
    role: 'GERENCIA',
    cargo: 'Socio Directivo / Gerencia',
    badgeVariant: 'info',
    description: 'Supervisión ejecutiva 360°, rentabilidad y directiva',
    avatarBg: 'bg-indigo-600',
    icon: Sparkles,
  },
  'jarloro@almarrosario.com': {
    role: 'ADMIN',
    cargo: 'Socio Directivo / Administrador',
    badgeVariant: 'purple',
    description: 'Supervisión técnica, seguridad y auditoría general',
    avatarBg: 'bg-purple-600',
    icon: Settings,
  },
  'srossi@almarrosario.com': {
    role: 'FINANZAS',
    cargo: 'Facturación / Administración & Cobranzas',
    badgeVariant: 'success',
    description: 'Aprobación exclusiva de desvíos tarifarios (+21%) y cierre contable',
    avatarBg: 'bg-emerald-600',
    icon: TrendingUp,
  },
};

const ROLE_AVATAR_BG: Record<UserRole, string> = {
  FINANZAS: 'bg-emerald-600',
  COMERCIAL: 'bg-amber-600',
  OPERATIVO: 'bg-slate-600',
  LEAD_OPERACIONES: 'bg-sky-600',
  GERENCIA: 'bg-indigo-600',
  ADMIN: 'bg-purple-600',
};

export function UserNav() {
  const { user, role, setRole, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeVariant = (
    userRole: UserRole | null
  ): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' => {
    switch (userRole) {
      case 'ADMIN':
        return 'purple';
      case 'GERENCIA':
        return 'info';
      case 'FINANZAS':
        return 'success';
      case 'LEAD_OPERACIONES':
        return 'default';
      case 'OPERATIVO':
        return 'secondary';
      case 'COMERCIAL':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleSelectPersona = async (persona: MockUserSession) => {
    if (isSwitching) return;
    setIsSwitching(true);
    setIsOpen(false);

    try {
      setRole(persona.rol as UserRole);
    } finally {
      setIsSwitching(false);
    }
  };

  const currentMeta = user?.email ? PERSONA_CONFIG[user.email] : undefined;
  const avatarBg = role ? ROLE_AVATAR_BG[role] ?? 'bg-[#0072BC]' : 'bg-[#0072BC]';
  const userInitials = user?.nombre
    ? user.nombre
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const userCargo =
    currentMeta?.cargo ??
    (role === 'FINANZAS'
      ? 'Directora Financiera / Socia'
      : role === 'COMERCIAL'
      ? 'Comercial Lead & Grandes Cuentas'
      : role === 'OPERATIVO'
      ? 'Operadora de Tráfico / Carga'
      : role === 'LEAD_OPERACIONES'
      ? 'Jefa de Tráfico Marítimo'
      : role === 'GERENCIA'
      ? 'Socio Directivo / Gerencia'
      : 'Socio Directivo / Administrador');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Unified Trigger Button */}
      <button
        type="button"
        id="role-switcher-trigger"
        data-testid="role-switcher-trigger"
        data-nav-id="user-nav-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 py-1.5 text-left text-xs text-slate-700 hover:border-[#0072BC]/50 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-[#0072BC] cursor-pointer shadow-xs shrink-0"
        title="Mi Perfil & Simulador de Roles ALMAR"
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${avatarBg} text-white font-bold text-xs shadow-xs shrink-0`}
        >
          {userInitials}
        </div>
        <div className="hidden text-left 2xl:block">
          <div className="font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
            {user?.nombre ?? 'Usuario'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono leading-tight truncate max-w-[140px]">
            {user?.email ?? 'usuario@almar.com.ar'}
          </div>
        </div>
        <Badge
          variant={getRoleBadgeVariant(role)}
          className="hidden sm:inline-flex ml-0.5 text-[10px] py-0 px-2 font-mono shrink-0 shadow-2xs"
        >
          {role ?? 'OPERATIVO'}
        </Badge>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-0.5" />
      </button>

      {/* Unified Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          id="role-switcher-menu"
          data-testid="user-nav-menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 animate-in fade-in-0 zoom-in-95"
        >
          {/* Active User Identity Card */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 mb-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm shadow-xs ${avatarBg}`}
              >
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {user?.nombre ?? 'Usuario'}
                  </span>
                  <Badge
                    variant={getRoleBadgeVariant(role)}
                    className="text-[9px] py-0 px-1.5 font-mono shrink-0"
                  >
                    {role ?? 'OPERATIVO'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 font-medium truncate">
                  {userCargo}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {user?.email ?? 'usuario@almar.com.ar'}
                </div>
              </div>
            </div>
          </div>

          {isUatModeEnabled() && role === 'ADMIN' && (
            <>
              {/* 1-Click Role Switcher Section */}
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#0072BC]" />
                    Simular Perfil Operativo (1 Clic)
                  </span>
                  <span className="text-[10px] bg-sky-100 text-[#0072BC] font-semibold px-2 py-0.5 rounded-full">
                    1 Clic
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Alterne instantáneamente entre los 6 perfiles reales de ALMAR para auditar vistas, permisos y restricciones sin cerrar sesión.
                </p>
              </div>

              {/* Persona List */}
              <div className="space-y-1 max-h-[340px] overflow-y-auto pr-0.5">
                {MOCK_USERS.map((persona) => {
                  const meta = PERSONA_CONFIG[persona.email] ?? {
                    role: persona.rol as UserRole,
                    cargo: 'Personal ALMAR',
                    badgeVariant: 'secondary' as const,
                    description: '',
                    avatarBg: 'bg-slate-600',
                    icon: Shield,
                  };
                  const isCurrent =
                    user?.email?.toLowerCase() === persona.email.toLowerCase() ||
                    role === persona.rol;
                  const IconComp = meta.icon;

                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleSelectPersona(persona)}
                      data-testid={`switch-to-${persona.rol.toLowerCase()}`}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'border-sky-300 bg-sky-50/90 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs shadow-xs mt-0.5 ${meta.avatarBg}`}
                      >
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {persona.nombre}
                          </span>
                          <Badge
                            variant={meta.badgeVariant}
                            className="text-[9px] py-0 px-1.5 font-mono shrink-0"
                          >
                            {persona.rol}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {meta.cargo}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 line-clamp-2 leading-tight">
                          {meta.description}
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="shrink-0 self-center text-emerald-600 bg-emerald-100 rounded-full p-1">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Logout Action */}
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs rounded-md font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Sesión segura por cookies JWT</span>
              <span className="font-semibold text-[#0072BC]">Matriz de Roles RBAC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
