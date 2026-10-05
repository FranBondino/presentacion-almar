import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { ShieldCheck, Lock } from 'lucide-react';

export const Slide05CarrierValidity: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 2: EL MÓDULO COMERCIAL FLEXIBLE"
        categoryBadge="PROTECCIÓN FINANCIERA & CONTROL DE TARIFAS"
        slideNumber="05"
        title="TABLERO COMERCIAL Y CONTROL DE VIGENCIA DE TARIFAS NAVIERAS"
        subtitle="Semáforo de vigencias (15/30 días) para impedir cotizaciones desactualizadas que generen quebranto económico."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column: Rules & Protection (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {/* Visible Data Summary Card */}
          <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500">
              Reglas del Semáforo Comercial
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
              <div className="bg-emerald-50 border border-emerald-300 p-1.5 rounded">
                <div className="text-[9px] text-emerald-800 font-sans font-bold">&gt; 3 Días</div>
                <div className="font-bold text-emerald-700 text-xs">VIGENTE</div>
                <div className="text-[8.5px] text-emerald-800">Emisión 1-Clic</div>
              </div>
              <div className="bg-amber-50 border border-amber-300 p-1.5 rounded">
                <div className="text-[9px] text-amber-900 font-sans font-bold">≤ 3 Días</div>
                <div className="font-bold text-amber-800 text-xs">POR VENCER</div>
                <div className="text-[8.5px] text-amber-800">Alerta Celeridad</div>
              </div>
              <div className="bg-rose-50 border border-rose-300 p-1.5 rounded">
                <div className="text-[9px] text-rose-900 font-sans font-bold">Vencida</div>
                <div className="font-bold text-rose-800 text-xs">BLOQUEADA</div>
                <div className="text-[8.5px] text-rose-800">Candado Activo</div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-2.5 rounded-lg border border-emerald-200 bg-white"
          >
            <div className="flex items-center space-x-2 text-emerald-800 font-heading font-bold text-xs uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tarifas Validadas con Armadores</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Tarifa confirmada con naviera (Maersk, MSC, Hapag). Emisión de cotizaciones habilitada de forma inmediata con 1 clic sin demoras.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-2.5 rounded-lg border border-rose-200 bg-white"
          >
            <div className="flex items-center space-x-2 text-rose-900 font-heading font-bold text-xs uppercase mb-1">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Bloqueo Preventivo ante Vencimiento</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Botón de emisión bloqueado con candado. Prohíbe emitir presupuestos con tarifas desactualizadas que trasladen sobrecostos a ALMAR.
            </p>
          </motion.div>

          <div className="p-2 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text flex items-center justify-between">
            <span>🛡️ <strong>Control Financiero:</strong> Cero absorción de aumentos desfasados</span>
            <span className="font-mono font-bold text-clave-navy">100% PROTEGIDO</span>
          </div>
        </div>

        {/* Right Column: Cotizaciones Mockup (7 cols) with KeyData and Focal Zoom */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/cotizaciones · Tablero Comercial y Semáforo de Vigencias"
            badge="VIGENCIA 15/30 DÍAS"
            imageSrc="./screenshots/cotizaciones_vigencia_tarifas_light.png"
            imageAlt="Tablero de Cotizaciones y Control de Vigencia"
            caption="Semáforo de Vigencia de Tarifas Navieras en Tiempo Real"
            keyData={[
              { label: 'Flete 40\' HC', value: 'Vigente (12 días)', color: 'green', highlight: true },
              { label: 'THC y Gastos Locales', value: 'Por Vencer (48h)', color: 'amber' },
              { label: 'Tarifa Expirada', value: 'Bloqueada con candado', color: 'rose' },
            ]}
            focalOrigin="center 20%"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};
