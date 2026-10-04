import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

export const Slide05CarrierValidity: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 2: EL MÓDULO COMERCIAL FLEXIBLE"
        categoryBadge="RESPUESTA DIRECTA A VANESA MEGGIOLARO"
        slideNumber="05"
        title="TABLERO COMERCIAL Y CONTROL DE VIGENCIA DE TARIFAS NAVIERAS"
        subtitle="Semáforo de vigencias (15/30 días) para impedir cotizaciones desactualizadas que generen quebranto económico."
      />

      <div className="flex-1 grid grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column: Rules & Protection (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60"
          >
            <div className="flex items-center space-x-2 text-emerald-800 font-heading font-bold text-xs uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vigente (&gt; 3 días restantes)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Tarifa confirmada con naviera. Emisión de cotizaciones habilitada de forma inmediata con 1 clic.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-amber-200 bg-amber-50/60"
          >
            <div className="flex items-center space-x-2 text-amber-900 font-heading font-bold text-xs uppercase mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Por Vencer (&le; 3 días)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Alerta preventiva amarilla. Advierte al comercial que la cotización debe cerrarse con celeridad o requerirá revalidación.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg border border-rose-200 bg-rose-50/60"
          >
            <div className="flex items-center space-x-2 text-rose-900 font-heading font-bold text-xs uppercase mb-1">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Vencida (Bloqueo Estricto)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Botón de emisión bloqueado con candado. Prohíbe emitir presupuestos con tarifas desactualizadas que trasladen quebranto a ALMAR.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text">
            <strong>Respuesta a Vanesa:</strong> Cero riesgo de que un cliente acepte una cotización de hace un mes con aumentos de USD 300 o 400 absorbidos por la empresa.
          </div>
        </div>

        {/* Right Column: Cotizaciones Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/cotizaciones · Tablero Comercial y Semáforo de Vigencias [TARIFAS VÁLIDAS]"
            badge="VIGENCIA 15/30 DÍAS"
            imageSrc="./screenshots/cotizaciones_vigencia_tarifas_light.png"
            imageAlt="Tablero de Cotizaciones y Control de Vigencia"
            caption="Semáforo de Vigencia de Tarifas Navieras en Tiempo Real"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

