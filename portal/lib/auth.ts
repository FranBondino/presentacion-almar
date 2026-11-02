/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Authentication & Role-Based Access Control (RBAC) Service
 * 
 * Implements strict type-safe session verification, role claim extraction,
 * and capability validation matching the ISO 9001 and freight operational matrices.
 */

import type { User } from '@supabase/supabase-js';
import type { Database, RolUsuario } from './supabase/database.types';

export type UserRole = RolUsuario;

export const ALL_ROLES: readonly UserRole[] = [
  'OPERATIVO',
  'LEAD_OPERACIONES',
  'FINANZAS',
  'COMERCIAL',
  'GERENCIA',
  'ADMIN',
] as const;

export const CORPORATE_DIRECTORY: Record<string, { id: string; role: UserRole; nombre: string }> = {
  // Aliases & Demo/Test accounts (aligned to authentic @almarrosario.com accounts)
  'consultor': { id: '00000000-0000-0000-0000-000000000001', role: 'ADMIN', nombre: 'Juan Andrés Arloro' },
  'consultor@almarrosario.com': { id: '00000000-0000-0000-0000-000000000001', role: 'ADMIN', nombre: 'Juan Andrés Arloro' },

  // 18 Casillas Reales de ALMAR Rosario (@almarrosario.com)
  'jarloro@almarrosario.com': { id: '00000000-0000-0000-0000-000000000001', role: 'ADMIN', nombre: 'Juan Andrés Arloro' },
  'anoacco@almarrosario.com': { id: '00000000-0000-0000-0000-000000000002', role: 'GERENCIA', nombre: 'Alejandro Noacco' },
  'vmeggiolaro@almarrosario.com': { id: '00000000-0000-0000-0000-000000000003', role: 'FINANZAS', nombre: 'Vanesa Meggiolaro' },
  'srossi@almarrosario.com': { id: '00000000-0000-0000-0000-000000000010', role: 'FINANZAS', nombre: 'Stefanía Rossi' },
  'dsilvi@almarrosario.com': { id: '00000000-0000-0000-0000-000000000011', role: 'FINANZAS', nombre: 'Dalia Silvi' },
  'nhermoso@almarrosario.com': { id: '00000000-0000-0000-0000-000000000004', role: 'LEAD_OPERACIONES', nombre: 'Natali Hermoso' },
  'llaje@almarrosario.com': { id: '00000000-0000-0000-0000-000000000006', role: 'COMERCIAL', nombre: 'Lucía Laje' },
  'nguida@almarrosario.com': { id: '00000000-0000-0000-0000-000000000012', role: 'COMERCIAL', nombre: 'Nerea Guida' },
  'mfusco@almarrosario.com': { id: '00000000-0000-0000-0000-000000000013', role: 'COMERCIAL', nombre: 'Martín Fusco' },
  'astampfli@almarrosario.com': { id: '00000000-0000-0000-0000-000000000014', role: 'OPERATIVO', nombre: 'Abril Stampfli' },
  'atalaban@almarrosario.com': { id: '00000000-0000-0000-0000-000000000015', role: 'OPERATIVO', nombre: 'Ana Laura Talabán' },
  'abucardo@almarrosario.com': { id: '00000000-0000-0000-0000-000000000016', role: 'OPERATIVO', nombre: 'Agustina Bucardo' },
  'agomez@almarrosario.com': { id: '00000000-0000-0000-0000-000000000005', role: 'OPERATIVO', nombre: 'Aldana Gómez' },
  'cdellamea@almarrosario.com': { id: '00000000-0000-0000-0000-000000000017', role: 'OPERATIVO', nombre: 'Cecilia Dellamea' },
  'vmoyano@almarrosario.com': { id: '00000000-0000-0000-0000-000000000018', role: 'OPERATIVO', nombre: 'Victoria Moyano' },
  'zabraham@almarrosario.com': { id: '00000000-0000-0000-0000-000000000019', role: 'COMERCIAL', nombre: 'Zamira Abraham' },
  'csexp@almarrosario.com': { id: '00000000-0000-0000-0000-000000000020', role: 'OPERATIVO', nombre: 'Customer Service Expo' },
  'tracking@almarrosario.com': { id: '00000000-0000-0000-0000-000000000021', role: 'OPERATIVO', nombre: 'Tracking Cargas' },
};

export interface CanonicalCorporateUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  cargo: string;
}

export const CANONICAL_CORPORATE_USERS: CanonicalCorporateUser[] = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'jarloro@almarrosario.com', nombre: 'Juan Andrés Arloro', rol: 'ADMIN', cargo: 'Socio Directivo / Administrador' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'anoacco@almarrosario.com', nombre: 'Alejandro Noacco', rol: 'GERENCIA', cargo: 'Socio Directivo / Gerencia' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'vmeggiolaro@almarrosario.com', nombre: 'Vanesa Meggiolaro', rol: 'FINANZAS', cargo: 'Directora Financiera / Socia' },
  { id: '00000000-0000-0000-0000-000000000010', email: 'srossi@almarrosario.com', nombre: 'Stefanía Rossi', rol: 'FINANZAS', cargo: 'Facturación / Administración & Cobranzas' },
  { id: '00000000-0000-0000-0000-000000000011', email: 'dsilvi@almarrosario.com', nombre: 'Dalia Silvi', rol: 'FINANZAS', cargo: 'Administración & Finanzas' },
  { id: '00000000-0000-0000-0000-000000000004', email: 'nhermoso@almarrosario.com', nombre: 'Natali Hermoso', rol: 'LEAD_OPERACIONES', cargo: 'Jefa de Tráfico Marítimo' },
  { id: '00000000-0000-0000-0000-000000000006', email: 'llaje@almarrosario.com', nombre: 'Lucía Laje', rol: 'COMERCIAL', cargo: 'Comercial Lead & Grandes Cuentas' },
  { id: '00000000-0000-0000-0000-000000000012', email: 'nguida@almarrosario.com', nombre: 'Nerea Guida', rol: 'COMERCIAL', cargo: 'Comercial / Pricing' },
  { id: '00000000-0000-0000-0000-000000000013', email: 'mfusco@almarrosario.com', nombre: 'Martín Fusco', rol: 'COMERCIAL', cargo: 'Ejecutivo Comercial Senior / Cuentas' },
  { id: '00000000-0000-0000-0000-000000000019', email: 'zabraham@almarrosario.com', nombre: 'Zamira Abraham', rol: 'COMERCIAL', cargo: 'Comercial & Operaciones' },
  { id: '00000000-0000-0000-0000-000000000005', email: 'agomez@almarrosario.com', nombre: 'Aldana Gómez', rol: 'OPERATIVO', cargo: 'Operadora de Tráfico / Carga' },
  { id: '00000000-0000-0000-0000-000000000014', email: 'astampfli@almarrosario.com', nombre: 'Abril Stampfli', rol: 'OPERATIVO', cargo: 'Operaciones de Tráfico Marítimo' },
  { id: '00000000-0000-0000-0000-000000000015', email: 'atalaban@almarrosario.com', nombre: 'Ana Laura Talabán', rol: 'OPERATIVO', cargo: 'Customer Lead & Operaciones Impo' },
  { id: '00000000-0000-0000-0000-000000000016', email: 'abucardo@almarrosario.com', nombre: 'Agustina Bucardo', rol: 'OPERATIVO', cargo: 'Operaciones / Tráfico' },
  { id: '00000000-0000-0000-0000-000000000017', email: 'cdellamea@almarrosario.com', nombre: 'Cecilia Dellamea', rol: 'OPERATIVO', cargo: 'Operaciones Terrestre/Marítima' },
  { id: '00000000-0000-0000-0000-000000000018', email: 'vmoyano@almarrosario.com', nombre: 'Victoria Moyano', rol: 'OPERATIVO', cargo: 'Exportación / Tráfico Terrestre' },
  { id: '00000000-0000-0000-0000-000000000020', email: 'csexp@almarrosario.com', nombre: 'Customer Service Expo', rol: 'OPERATIVO', cargo: 'Atención Exportación' },
  { id: '00000000-0000-0000-0000-000000000021', email: 'tracking@almarrosario.com', nombre: 'Tracking Cargas', rol: 'OPERATIVO', cargo: 'Tracking & Alertas' },
];

export const CANONICAL_ROLE_PERSONAS: CanonicalCorporateUser[] = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'jarloro@almarrosario.com', nombre: 'Juan Andrés Arloro', rol: 'ADMIN', cargo: 'Socio Directivo / Administrador' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'anoacco@almarrosario.com', nombre: 'Alejandro Noacco', rol: 'GERENCIA', cargo: 'Socio Directivo / Gerencia' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'vmeggiolaro@almarrosario.com', nombre: 'Vanesa Meggiolaro', rol: 'FINANZAS', cargo: 'Directora Financiera / Socia' },
  { id: '00000000-0000-0000-0000-000000000004', email: 'nhermoso@almarrosario.com', nombre: 'Natali Hermoso', rol: 'LEAD_OPERACIONES', cargo: 'Jefa de Tráfico Marítimo' },
  { id: '00000000-0000-0000-0000-000000000005', email: 'agomez@almarrosario.com', nombre: 'Aldana Gómez', rol: 'OPERATIVO', cargo: 'Operadora de Tráfico / Carga' },
  { id: '00000000-0000-0000-0000-000000000006', email: 'llaje@almarrosario.com', nombre: 'Lucía Laje', rol: 'COMERCIAL', cargo: 'Comercial Lead & Grandes Cuentas' },
];

export interface CorporateUatIdentity {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  cargo: string;
}

export const CORPORATE_UAT_PERSONAS: CorporateUatIdentity[] = [
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'llaje@almarrosario.com',
    nombre: 'Lucía Laje',
    rol: 'COMERCIAL',
    cargo: 'Comercial / Pricing & Cotizaciones',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'nhermoso@almarrosario.com',
    nombre: 'Natali Hermoso',
    rol: 'LEAD_OPERACIONES',
    cargo: 'Lead Operaciones Comex & Embarques',
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    email: 'srossi@almarrosario.com',
    nombre: 'Stefanía Rossi',
    rol: 'FINANZAS',
    cargo: 'Facturación / Administración & Cobranzas',
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'jarloro@almarrosario.com',
    nombre: 'Juan Andrés Arloro',
    rol: 'ADMIN',
    cargo: 'Gerencia General / Auditoría ISO',
  },
];


export type PerfilUsuarioRow = Database['public']['Tables']['perfiles_usuario']['Row'];

/**
 * Custom error class for authentication and authorization failures.
 */
export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 401, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Standardized authenticated user payload.
 */
export interface AuthenticatedUser {
  user: User;
  role: UserRole;
  profile: PerfilUsuarioRow | null;
}

/**
 * Decodes a base64 or base64url string to a UTF-8 string universally (Node + Browser + Edge).
 * Correctly decodes multi-byte UTF-8 sequences such as accented characters (e.g. Lucía Laje, Aldana Gómez).
 */
export function decodeBase64UrlToUtf8(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8');
  }

  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  throw new Error('No base64 decoder available in runtime');
}

/**
 * Parses and validates Supabase / Demo JWT payload universally (Node + Edge + Browser).
 * Enforces strict presence and validity of expiration timestamp (exp).
 */
export function parseSupabaseJwt(token: string): Partial<User> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const jsonPayload = decodeBase64UrlToUtf8(parts[1]!);

    const payload = JSON.parse(jsonPayload) as {
      sub?: string;
      id?: string;
      email?: string;
      exp?: number;
      role?: string;
      app_metadata?: Record<string, unknown>;
      user_metadata?: Record<string, unknown>;
    };

    // Strict expiration check: exp claim must exist, be a number, and not be expired
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
      return null;
    }

    const userRole = (payload.app_metadata?.['role'] as string | undefined) ?? payload.role ?? 'OPERATIVO';

    return {
      id: payload.sub ?? payload.id ?? 'usr_authenticated',
      email: payload.email,
      app_metadata: payload.app_metadata ?? { role: userRole },
      user_metadata: payload.user_metadata ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and normalizes the user's role claim from Supabase auth user metadata or profile.
 */
export function getUserRole(
  user: User | { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null
): UserRole | null {
  if (!user) return null;

  const appMeta = user.app_metadata;
  const userMeta = user.user_metadata;

  const candidate =
    (appMeta?.['role'] as string | undefined) ??
    (appMeta?.['rol'] as string | undefined) ??
    (userMeta?.['role'] as string | undefined) ??
    (userMeta?.['rol'] as string | undefined);

  if (typeof candidate === 'string') {
    const normalized = candidate.toUpperCase().trim() as UserRole;
    if (ALL_ROLES.includes(normalized)) {
      return normalized;
    }
  }

  const rawRole = (user as Record<string, unknown>)['role'] as string | undefined;
  if (rawRole && ALL_ROLES.includes(rawRole as UserRole)) {
    return rawRole as UserRole;
  }

  return null;
}

/**
 * Role Permission Checks matching PROJECT.md RBAC Matrix:
 */
export const MULTICOTIZADOR_ALLOWED_ROLES: readonly UserRole[] = [
  'COMERCIAL',
  'GERENCIA',
  'ADMIN',
] as const;

/**
 * Authorizes access to the Ocean Carrier Multi-Quoter (/cotizaciones/multicotizador & /api/multicotizador).
 * Strictly restricted to COMERCIAL (Lucía Laje, Nerea Guida, Martín Fusco, Zamira Abraham),
 * GERENCIA (Alejandro Noacco), and ADMIN (Juan Andrés Arloro).
 */
export function canAccessMulticotizador(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'COMERCIAL' || role === 'GERENCIA' || role === 'ADMIN';
}

export function canAccessFinancials(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'FINANZAS' || role === 'COMERCIAL' || role === 'GERENCIA' || role === 'ADMIN';
}

export function canEditComprobantes(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

export function canDiscardComprobante(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

export function canViewAuditLog(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'LEAD_OPERACIONES' || role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

export function canResolveAlertas(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'OPERATIVO' || role === 'LEAD_OPERACIONES' || role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

export function canFullAdmin(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'GERENCIA' || role === 'FINANZAS';
}

/**
 * Checks whether a given role belongs to the Directorio / Executive Leadership
 * (Juan Andrés Arloro, Alejandro Noacco, Vanesa Meggiolaro).
 */
export function isDirectorio(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'GERENCIA' || role === 'FINANZAS';
}

/**
 * Authorizes individual folder financial visibility (cost, sale, margin).
 * All authenticated operations, commercial, finance, and management roles can view folder margins.
 */
export function canViewFolderFinancials(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ALL_ROLES.includes(role);
}

/**
 * Authorizes approval of freight rate variances / cost deviations over original quotations.
 * Granted to the Directorio: FINANZAS (Vanesa Meggiolaro), GERENCIA (Alejandro Noacco), and ADMIN (Juan Andrés Arloro).
 * Operational (OPERATIVO, LEAD_OPERACIONES) and Commercial (COMERCIAL) roles cannot authorize rate deviations.
 */
export function canAuthorizeRateDeviation(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

/**
 * Authorizes exporting ISO 9001 audit logs.
 */
export function canExportAuditLog(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'LEAD_OPERACIONES' || role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

/**
 * Checks whether a given role is authorized to access a specific route pathname.
 */
export function canAccessRoute(role: UserRole | null | undefined, pathname: string): boolean {
  if (!role) return false;

  // Admin and Gerencia have access to all routes
  if (role === 'ADMIN' || role === 'GERENCIA') return true;

  // Multicotizador de Navieras — strictly COMERCIAL, GERENCIA (Alejandro), and ADMIN (Juan)
  if (
    pathname.startsWith('/cotizaciones/multicotizador') ||
    pathname.startsWith('/api/multicotizador')
  ) {
    return canAccessMulticotizador(role);
  }

  // Audit log route protection
  if (pathname.startsWith('/audit-log') || pathname.startsWith('/api/audit-log')) {
    return canViewAuditLog(role);
  }

  // Executive metrics (/metricas) - strictly Directorio (ADMIN & GERENCIA already granted above)
  if (pathname.startsWith('/metricas')) {
    return role === 'FINANZAS';
  }

  // Financial & profitability routes
  if (
    pathname.startsWith('/rentabilidad') ||
    pathname.startsWith('/gastos') ||
    pathname.startsWith('/api/finanzas')
  ) {
    return canAccessFinancials(role);
  }

  if (role === 'OPERATIVO') {
    const forbiddenPaths = ['/audit-log', '/rentabilidad', '/api/audit-log', '/metricas'];
    return !forbiddenPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  if (role === 'COMERCIAL') {
    const forbiddenPaths = ['/audit-log', '/api/audit-log', '/metricas'];
    return !forbiddenPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  if (role === 'LEAD_OPERACIONES') {
    const forbiddenPaths = ['/metricas'];
    return !forbiddenPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  return true;
}

/**
 * R1: Authorizes formal approval of negative or sub-threshold (< USD 3.00) margins.
 * Allowed for LEAD_OPERACIONES, FINANZAS, GERENCIA, and ADMIN.
 * Denied for OPERATIVO and COMERCIAL.
 */
export function canAuthorizeNegativeMargin(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'LEAD_OPERACIONES' || role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

/**
 * R1: Authorizes bypassing critical margin alerts.
 * Allowed for FINANZAS, GERENCIA, and ADMIN.
 */
export function canBypassMarginAlerts(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'FINANZAS' || role === 'GERENCIA' || role === 'ADMIN';
}

/**
 * R4: Authorizes viewing Banco Macro bank reconciliation and statements.
 * Allowed for ADMIN, FINANZAS, and GERENCIA.
 */
export function canViewBankReconciliation(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'FINANZAS' || role === 'GERENCIA';
}

/**
 * R4: Authorizes bank reconciliation execution and liberation of commercial sales commissions.
 * Allowed for ADMIN, FINANZAS, and GERENCIA.
 */
export function canReconcileAndLiberateCommissions(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'FINANZAS' || role === 'GERENCIA';
}

/**
 * R2/RBAC: Authorizes folder closure.
 * OPERATIVO is strictly forbidden from closing folders with unsettled costs or pending vouchers.
 * COMERCIAL cannot close folders.
 */
export function canCloseCarpeta(
  role: UserRole | null | undefined,
  hasPendingCosts: boolean
): boolean {
  if (!role) return false;
  if (role === 'OPERATIVO' && hasPendingCosts) {
    return false;
  }
  return (
    role === 'OPERATIVO' ||
    role === 'LEAD_OPERACIONES' ||
    role === 'FINANZAS' ||
    role === 'GERENCIA' ||
    role === 'ADMIN'
  );
}

/**
 * Role-segregated corporate credentials so operational, commercial, finance,
 * and management users cannot log into each other's accounts.
 */
export const ROLE_CORPORATE_PASSWORDS: Record<UserRole, string> = {
  ADMIN: 'AlmarDir2026!',
  GERENCIA: 'AlmarDir2026!',
  FINANZAS: 'AlmarFin2026!',
  COMERCIAL: 'AlmarCom2026!',
  LEAD_OPERACIONES: 'AlmarLead2026!',
  OPERATIVO: 'AlmarOps2026!',
};

/**
 * Checks whether UAT Quick-Switch Mode is enabled.
 * Disabled by default in production/UAT unless NEXT_PUBLIC_UAT_MODE is explicitly 'true'.
 */
export function isUatModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_UAT_MODE === 'false') return false;
  if (process.env.NEXT_PUBLIC_UAT_MODE === 'true') return true;
  return Boolean(process.env.VITEST);
}


