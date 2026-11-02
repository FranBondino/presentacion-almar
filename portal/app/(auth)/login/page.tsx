'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Ship,
  Anchor,
  Layers,
  Award,
} from 'lucide-react';

interface ExecutiveCard {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTag: string;
  cargo: string;
  area: string;
  initials: string;
  highlight: string;
  avatarBg: string;
  avatarText: string;
  avatarBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  hoverBorder: string;
  hoverBg: string;
}

const EXECUTIVE_UAT_CARDS: ExecutiveCard[] = [
  {
    id: 'finanzas',
    name: 'Vanesa Meggiolaro',
    email: 'vmeggiolaro@almarrosario.com',
    role: 'FINANZAS',
    roleTag: 'Finanzas',
    cargo: 'Directora Financiera',
    area: 'Finanzas',
    initials: 'VM',
    highlight: 'Aprobación desvíos & bancos',
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-800',
    avatarBorder: 'border-emerald-300',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    hoverBg: 'hover:bg-emerald-50/30',
  },
  {
    id: 'comercial',
    name: 'Lucía Laje',
    email: 'llaje@almarrosario.com',
    role: 'COMERCIAL',
    roleTag: 'Comercial',
    cargo: 'Grandes Cuentas & Pricing',
    area: 'Comercial',
    initials: 'LL',
    highlight: 'Cotizaciones & cubicaje',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-800',
    avatarBorder: 'border-amber-300',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
    hoverBg: 'hover:bg-amber-50/30',
  },
  {
    id: 'operaciones',
    name: 'Natali Hermoso',
    email: 'nhermoso@almarrosario.com',
    role: 'LEAD_OPERACIONES',
    roleTag: 'Operaciones',
    cargo: 'Jefa Operaciones COMEX',
    area: 'Operaciones',
    initials: 'NH',
    highlight: 'Tráfico & despachos',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-[#0072BC]',
    avatarBorder: 'border-blue-300',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    hoverBorder: 'hover:border-blue-400',
    hoverBg: 'hover:bg-blue-50/30',
  },
  {
    id: 'direccion',
    name: 'Juan Andrés Arloro',
    email: 'jarloro@almarrosario.com',
    role: 'ADMIN',
    roleTag: 'Dirección / IT',
    cargo: 'IT & Dirección General',
    area: 'Dirección / IT',
    initials: 'JA',
    highlight: 'Auditoría ISO & Control Total',
    avatarBg: 'bg-purple-100',
    avatarText: 'text-purple-800',
    avatarBorder: 'border-purple-300',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    hoverBorder: 'hover:border-purple-400',
    hoverBg: 'hover:bg-purple-50/30',
  },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isUatQuickLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_UAT_QUICK_LOGIN === 'true';

  const performQuickLogin = async (rawUser: string) => {
    setError(null);
    const cleaned = rawUser.toLowerCase().trim();
    const normalized = cleaned === 'consultor' ? 'jarloro@almarrosario.com' : cleaned;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalized, isUatQuickLogin: true }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        user?: { email?: string; role?: string };
      };

      if (response.ok && data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 250);
        return;
      }

      setError(data.error ?? 'Error en el ingreso rápido corporativo.');
      setIsLoading(false);
    } catch {
      setError('Error de conexión con el servicio de autenticación corporativa.');
      setIsLoading(false);
    }
  };

  const performLogin = async (rawUser: string, rawPass: string) => {
    setError(null);
    const cleaned = rawUser.toLowerCase().trim();
    const normalized = cleaned === 'consultor' ? 'jarloro@almarrosario.com' : cleaned;

    if (!normalized || (!normalized.includes('@') && cleaned !== 'consultor')) {
      setError('Por favor ingrese un correo corporativo válido (@almarrosario.com) o "consultor".');
      return;
    }

    if (!rawPass || rawPass.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalized, password: rawPass }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        user?: { email?: string; role?: string };
      };

      if (response.ok && data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 250);
        return;
      }

      setError(data.error ?? 'Credenciales inválidas. Acceso restringido a personal de ALMAR Rosario.');
      setIsLoading(false);
    } catch {
      setError('Error de conexión con el servicio de autenticación corporativa.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm font-medium">{error}</span>
        </div>
      )}

      {isSuccess && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm font-medium">Autenticación exitosa. Redirigiendo al portal...</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Correo Electrónico Corporativo o Usuario
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@almarrosario.com"
              className="block w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-[#0072BC] transition-colors shadow-2xs"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
              Contraseña
            </label>
          </div>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-[#0072BC] transition-colors shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-[#0072BC] hover:bg-[#005d99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0072BC] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {isUatQuickLoginEnabled && (
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Simulador de Acceso Rápido UAT (Ejecutivo)
            </p>
            <span className="text-[10px] font-semibold text-[#0072BC] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              1 Clic
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Seleccione un colaborador institucional para autenticar inmediatamente con su perfil RBAC:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXECUTIVE_UAT_CARDS.map((card) => (
              <button
                key={card.email}
                type="button"
                disabled={isLoading || isSuccess}
                onClick={() => {
                  setEmail(card.email);
                  void performQuickLogin(card.email);
                }}
                className={`p-2.5 rounded-xl border border-slate-200 bg-white text-left transition-all duration-150 shadow-2xs hover:shadow-xs ${card.hoverBorder} ${card.hoverBg} cursor-pointer flex items-center gap-2.5 relative group focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${card.avatarBg} ${card.avatarText} ${card.avatarBorder} border shadow-2xs`}
                >
                  {card.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${card.badgeBg} ${card.badgeText} ${card.badgeBorder} border uppercase`}
                    >
                      {card.roleTag}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 whitespace-nowrap group-hover:text-[#0072BC] transition-colors">
                    {card.name}
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                    {card.cargo}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                    {card.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0072BC]" />
          <span>Acceso corporativo protegido • ISO 9001:2015</span>
        </p>
        <span className="font-mono text-[10px] text-slate-400">TLS 1.3 / SHA-256</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC]">
      {/* Left Panel: Deep Navy (#081433) Institutional Identity */}
      <div className="hidden lg:flex flex-col justify-between bg-[#081433] text-white p-10 xl:p-14 relative overflow-hidden border-r border-slate-800">
        {/* Decorative soft glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0072BC]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1b8db6]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Institutional Branding Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-xl p-2 shadow-sm inline-flex items-center justify-center shrink-0 w-12 h-12 overflow-hidden">
              <Image
                src="/images/logo-header2.png"
                alt="ALMAR Rosario Logo"
                width={44}
                height={44}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">ALMAR Rosario</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0072BC]/40 text-sky-200 border border-[#0072BC]/50">
                  COMEX
                </span>
              </div>
              <p className="text-xs text-[#38bdf8] font-medium tracking-wide">
                Portal Operativo &amp; Logístico
              </p>
            </div>
          </div>
        </div>

        {/* Narrative & Verified Operational Highlights */}
        <div className="my-auto py-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#0072BC]/20 text-sky-300 border border-[#0072BC]/40 mb-4">
            <Anchor className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Infraestructura Portuaria Hidrovía Paraná</span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Infraestructura Operativa de Comercio Exterior para el Hinterland del Gran Rosario y el Mundo
          </h2>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-lg">
            Plataforma institucional de gestión y trazabilidad para operaciones marítimas, fluviales, terrestres y aéreas en el principal nodo agroexportador de Sudamérica.
          </p>

          <div className="mt-7 space-y-2.5">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs flex items-start gap-3 hover:bg-white/[0.07] transition-colors">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  18 Casillas Corporativas @almarrosario.com Sincronizadas en Tiempo Real
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Monitoreo continuo de hilos comerciales, avisos de zarpe y despachos aduaneros.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs flex items-start gap-3 hover:bg-white/[0.07] transition-colors">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Trazabilidad End-to-End con Kipintoch ERP
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Conciliación automatizada de expedientes, carpetas operativas y comprobantes fiscales.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs flex items-start gap-3 hover:bg-white/[0.07] transition-colors">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  SGC Certificado bajo Norma ISO 9001:2015
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Segregación estricta de funciones RBAC, control de no conformidades y auditoría.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs flex items-start gap-3 hover:bg-white/[0.07] transition-colors">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                <Ship className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Terminal Fluvial Rosario | ARROS
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Operaciones directas de atraque, trasbordo y logística multimodal internacional.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs flex items-start gap-3 hover:bg-white/[0.07] transition-colors">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Conexión Encriptada TLS 1.3 / SHA-256
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Canales seguros de alta fidelidad para salvaguarda de información arancelaria.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Panel Footer */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Terminal Fluvial Rosario | ARROS</span>
          </div>
          <span>Conexión Encriptada TLS 1.3 / SHA-256</span>
        </div>
      </div>

      {/* Right Panel: #F8FAFC Canvas with Executive Card */}
      <div className="flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 min-h-screen bg-[#F8FAFC]">
        <div className="w-full max-w-lg">
          {/* Mobile Header Branding (< lg) */}
          <div className="lg:hidden flex justify-center items-center gap-3 mb-6">
            <div className="relative w-12 h-12 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              <Image
                src="/images/logo-header2.png"
                alt="ALMAR Rosario Logo"
                width={44}
                height={44}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">ALMAR Rosario</h1>
              <p className="text-xs text-[#0072BC] font-medium">Portal Operativo &amp; Logístico</p>
            </div>
          </div>

          {/* Executive Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-enterprise p-6 sm:p-8">
            {/* Desktop Card Branding Header */}
            <div className="hidden lg:flex items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <Image
                    src="/images/logo-header2.png"
                    alt="ALMAR Rosario Logo"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ALMAR Rosario</h2>
                  <p className="text-[11px] text-[#0072BC] font-medium">Portal Operativo &amp; Logístico</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0072BC] border border-sky-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0072BC]" />
                <span>Acceso Seguro</span>
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Iniciar Sesión en el Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Acceso corporativo con control de acceso basado en roles (RBAC)
              </p>
            </div>

            <Suspense
              fallback={
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0072BC]" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          {/* Bottom Trust Line */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>ALMAR Rosario S.R.L. — Sistema de Gestión Logística &amp; COMEX</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
