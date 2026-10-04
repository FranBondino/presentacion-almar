import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { CheckCircle2, Award, ArrowRight } from 'lucide-react';

export const Slide18RoadmapNextSteps: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 4: TRIAGE, ARQUITECTURA & DECISIÓN"
        categoryBadge="HOJA DE RUTA EJECUTIVA · 4 SEMANAS"
        slideNumber="18"
        title="HOJA DE RUTA DE PUESTA EN MARCHA (4 SEMANAS) Y DECISIÓN DIRECTIVA"
        subtitle="Cronograma de 4 semanas hacia la producción definitiva y llamado a la decisión directiva."
      />

      <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden">
        {/* 4 Weeks Grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              sem: 'Semana 1',
              title: 'Set-up & Cloud',
              badge: 'INICIO INMEDIATO',
              badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
              tasks: [
                'Alta cuenta OpenAI de ALMAR',
                'Despliegue Vercel Edge + Supabase',
                'Embebido en Intranet Firebase',
              ],
            },
            {
              sem: 'Semana 2',
              title: 'Inicio Piloto Real',
              badge: 'CAPACITACIÓN',
              badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
              tasks: [
                'Sesión de 45 min con Stefania',
                'Carga asistida de 50 facturas',
                'Widget #TKT activo para desvíos',
              ],
            },
            {
              sem: 'Semana 3',
              title: 'Calibración Fina',
              badge: 'OPTIMIZACIÓN',
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
              tasks: [
                'Ajuste fino de reglas de desvíos',
                'Pruebas con extractos Banco Macro',
                'Validación semáforo comercial',
              ],
            },
            {
              sem: 'Semana 4',
              title: 'Régimen Definitivo',
              badge: 'PRODUCCIÓN',
              badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
              tasks: [
                'Corte de tipeo manual a Kipintoch',
                '100% facturas procesadas con IA',
                'Tablero de métricas en vivo',
              ],
            },
          ].map((item, idx) => (
            <motion.div
              key={item.sem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (idx + 1) }}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
                  <span className="font-mono font-bold text-xs text-clave-green uppercase">
                    {item.sem}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-xs text-clave-navy mb-2">
                  {item.title}
                </h4>
                <ul className="text-[11px] text-slate-600 space-y-1 leading-snug">
                  {item.tasks.map((t, i) => (
                    <li key={i} className="flex items-start space-x-1">
                      <span className="text-clave-green font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3 Executive Guarantees */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-clave-green flex-shrink-0" />
            <div className="text-[11px] text-slate-700 leading-tight">
              <strong>Cero Interrupción Operativa:</strong> Kipintoch sigue operando normalmente en paralelo durante el piloto.
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-clave-green flex-shrink-0" />
            <div className="text-[11px] text-slate-700 leading-tight">
              <strong>Ahorro Comprobado:</strong> $6.000.000 ARS/año en conectores y reducción del 95% del tiempo de carga.
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-clave-green flex-shrink-0" />
            <div className="text-[11px] text-slate-700 leading-tight">
              <strong>Plataforma Lista:</strong> Sistema desarrollado, testeado y disponible para comenzar mañana mismo.
            </div>
          </div>
        </div>

        {/* Directorial Call to Action Callout */}
        <div className="p-3 bg-clave-green text-white rounded-lg flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <Award className="w-6 h-6 text-clave-gold flex-shrink-0" />
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-clave-gold">
                Propuesta de Decisión Directiva:
              </h4>
              <p className="text-xs text-white/95 leading-tight">
                Aprobación del Directorio para iniciar la <strong>Semana 1 (Set-up &amp; Cloud)</strong> y puesta en marcha del piloto asistido.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded bg-clave-gold text-clave-navy font-heading font-bold text-xs uppercase tracking-wider shadow-sm flex items-center space-x-1">
            <span>Aprobar Semana 1</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
