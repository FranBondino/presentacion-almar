import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Mail, TrendingUp, Users } from 'lucide-react';

export const Slide07SmartFollowUp: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 2: EL MÓDULO COMERCIAL FLEXIBLE"
        categoryBadge="AUDITORÍA COMERCIAL LUCÍA LAJE (54,1%)"
        slideNumber="07"
        title="REGISTRO DE FEEDBACK CUALITATIVO & SMART FOLLOW-UP A 48 HS"
        subtitle="Estandarización del seguimiento comercial y captura sistemática de pérdidas para renegociar contratos de volumen."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center space-x-2 text-clave-green font-heading font-bold text-xs uppercase mb-1">
              <Users className="w-4 h-4" />
              <span>Descompresión de Lucía Laje (54,1%)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Con más de 500 cotizaciones mensuales, el seguimiento manual insumía horas. El sistema filtra las cotizaciones con más de 48 hs de silencio en un panel unificado.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center space-x-2 text-blue-700 font-heading font-bold text-xs uppercase mb-1">
              <Mail className="w-4 h-4" />
              <span>Plantilla Formal en 1-Clic para Gmail</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Genera un correo institucional impecable con cliente, ruta y tarifa. Lucía ejecuta 20 seguimientos en 10 minutos sin tipear una sola palabra.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg border border-clave-gold/40 bg-clave-gold-light"
          >
            <div className="flex items-center space-x-2 text-clave-gold-dark font-heading font-bold text-xs uppercase mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Inteligencia de Pérdidas de Mercado</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Registro del motivo: <em>"Competencia cotizó USD 150 menos"</em>. Alejandro obtiene la métrica exacta para exigir tarifas de volumen a los armadores.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-slate-900 text-slate-200 text-[11px] font-mono flex items-center justify-between">
            <span>SLA Objetivo: Seguimiento en &lt; 48hs</span>
            <span className="text-emerald-400 font-bold">+28% CONVERSIÓN</span>
          </div>
        </div>

        {/* Right Column: Follow-up Modal Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/cotizaciones · Panel de Smart Follow-Up y Feedback Comercial [CONVERSIÓN COMERCIAL]"
            badge="SMART FOLLOW-UP 48H"
            imageSrc="./screenshots/03_smart_follow_up_modal_desktop.png"
            imageAlt="Modal de Smart Follow-Up y Registro de Feedback"
            caption="Modal de Seguimiento con 1-Clic a Gmail y Categorización de Motivos de Pérdida"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

