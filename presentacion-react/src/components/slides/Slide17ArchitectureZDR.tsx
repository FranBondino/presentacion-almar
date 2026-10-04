import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { ArrowRight, Server, Database, Globe } from 'lucide-react';

export const Slide17ArchitectureZDR: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 4: TRIAGE, ARQUITECTURA & DECISIÓN"
        categoryBadge="EMBEBIBLE EN INTRANET FIREBASE · OPENAI ZDR"
        slideNumber="17"
        title="ARQUITECTURA DE PRODUCCIÓN, DIAGRAMA E INTEGRACIÓN EN INTRANET FIREBASE"
        subtitle="Diagrama integral de componentes, soberanía Zero Data Retention (§ 3.2) y especificación técnica para embeber la solución en la Intranet de ALMAR."
      />

      <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden">
        {/* 4-Layer Flow Diagram */}
        <div className="grid grid-cols-12 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 items-center">
          {/* Layer 1: Intranet Firebase (3 cols) */}
          <div className="col-span-3 bg-white border-2 border-sky-400 rounded-lg p-2.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-heading font-bold text-sky-900">
              <span>1. Intranet Firebase</span>
              <Globe className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-[10px] font-mono text-slate-500">Iframe CSP + SSO JWT</div>
            <ul className="text-[10.5px] text-slate-600 space-y-0.5 leading-tight">
              <li>• Embebido seguro frame-ancestors</li>
              <li>• Sesión activa con Firebase Auth</li>
              <li>• Cero nuevas contraseñas</li>
            </ul>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center text-clave-gold font-bold">
            <ArrowRight className="w-5 h-5" />
            <span className="text-[8px] font-mono text-slate-400">HTTPS</span>
          </div>

          {/* Layer 2: Vercel Edge (3 cols) */}
          <div className="col-span-3 bg-white border-2 border-emerald-500 rounded-lg p-2.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-heading font-bold text-emerald-900">
              <span>2. Vercel Edge Serverless</span>
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-[10px] font-mono text-slate-500">Reglas ISO 9001 + RBAC</div>
            <ul className="text-[10.5px] text-slate-600 space-y-0.5 leading-tight">
              <li>• 99,99% de disponibilidad global</li>
              <li>• Microservicios sin servidores locales</li>
              <li>• Despliegues atómicos sin caídas</li>
            </ul>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center text-clave-gold font-bold">
            <ArrowRight className="w-5 h-5" />
            <span className="text-[8px] font-mono text-slate-400">ZDR API</span>
          </div>

          {/* Layer 3: OpenAI ZDR & Supabase (4 cols) */}
          <div className="col-span-4 bg-white border-2 border-clave-navy rounded-lg p-2.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-heading font-bold text-clave-navy">
              <span>3. OpenAI ZDR &amp; Supabase</span>
              <Database className="w-4 h-4 text-clave-navy" />
            </div>
            <div className="text-[10px] font-mono text-clave-gold-dark font-bold">store: false + sa-east-1</div>
            <ul className="text-[10.5px] text-slate-600 space-y-0.5 leading-tight">
              <li>• OpenAI cuenta propia ALMAR (§ 3.2 ZDR)</li>
              <li>• Memoria volátil: cero entrenamiento</li>
              <li>• Postgres São Paulo &lt; 35ms latencia</li>
            </ul>
          </div>
        </div>

        {/* 3 Detail Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
            <h5 className="font-heading font-bold text-xs text-sky-800 uppercase mb-1">
              Integración Intranet
            </h5>
            <p className="text-[11px] text-slate-600 leading-snug">
              Solapa interna directa dentro del portal corporativo de ALMAR existente en Firebase.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
            <h5 className="font-heading font-bold text-xs text-clave-green uppercase mb-1">
              Soberanía Contractual
            </h5>
            <p className="text-[11px] text-slate-600 leading-snug">
              Facturación a tarjeta corporativa de ALMAR. Las claves API permanecen bajo custodia exclusiva de Juan Andrés.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
            <h5 className="font-heading font-bold text-xs text-clave-navy uppercase mb-1">
              Zero Infraestructura
            </h5>
            <p className="text-[11px] text-slate-600 leading-snug">
              Cero servidores físicos en la oficina, respaldos automatizados cada 24hs y auditoría SHA-256.
            </p>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="p-2 px-3 bg-clave-gold-light border-l-4 border-clave-gold rounded-r text-[11px] text-clave-text flex justify-between items-center font-mono">
          <span>Garantía de Confidencialidad: Clave Consultora no intermedia ni retiene datos comerciales de ALMAR</span>
          <span className="text-clave-green font-bold">ZDR CONTRACTUAL § 3.2</span>
        </div>
      </div>
    </div>
  );
};
