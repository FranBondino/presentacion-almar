import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Zap, ShieldCheck, Copy } from 'lucide-react';

export const Slide03SolutionOverview: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 1: SOLUCIÓN INTEGRAL"
        categoryBadge="PORTAL DE FACTURACIÓN INTELIGENTE"
        slideNumber="03"
        title="PORTAL CENTRALIZADO DE FACTURACIÓN ASISTIDO POR IA"
        subtitle="Plataforma integral para recepción, extracción asistida, validación de reglas de negocio y control de gestión."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column: 3 Strategic Pillars (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg border border-clave-border-light bg-slate-50 border-l-4 border-l-clave-green shadow-xs"
          >
            <div className="flex items-center space-x-2 text-clave-green font-heading font-bold text-xs uppercase mb-1">
              <Zap className="w-4 h-4" />
              <span>1. Extracción con IA en 5 Segundos</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Ingesta automática de comprobantes en PDF (Maersk, MSC, Terminales), reconociendo CUIT, fecha, alícuotas y recargos navieros al instante.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-clave-border-light bg-slate-50 border-l-4 border-l-clave-gold shadow-xs"
          >
            <div className="flex items-center space-x-2 text-clave-gold-dark font-heading font-bold text-xs uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>2. Escudo Financiero y Rentabilidad</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Auditoría automática contra lo presupuestado en Kipintoch: bloqueo de sobrecostos, semáforo preventivo (&lt; USD 200) y alerta estricta (&lt; USD 3.00).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg border border-clave-border-light bg-slate-50 border-l-4 border-l-clave-navy shadow-xs"
          >
            <div className="flex items-center space-x-2 text-clave-navy font-heading font-bold text-xs uppercase mb-1">
              <Copy className="w-4 h-4" />
              <span>3. Copiado Asistido y Productividad</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Carga en Kipintoch en 15 segundos sin tipeo manual. Scorecard de rendimiento por operador y ahorro de <strong>$6.000.000 ARS/año</strong> al evitar conectores cerrados.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-clave-gold-light border border-clave-gold/40 text-[11px] text-clave-text flex items-center justify-between">
            <span>💡 <strong>Soberanía Tecnológica:</strong> Alojado en nube privada con retención cero</span>
            <span className="font-mono font-bold text-clave-navy">100% SEGURO</span>
          </div>
        </div>

        {/* Right Column: Live Corporate Browser Mockup (7 cols) with KeyData and Focal Zoom */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="http://localhost:3000/ · Dashboard Operativo ALMAR"
            badge="● EN VIVO"
            imageSrc="./screenshots/dashboard_corporate_light.png"
            imageAlt="Dashboard Central de Facturación ALMAR"
            caption="Vista del Tablero General con Métricas de Rentabilidad y KPIs de Productividad"
            keyData={[
              { label: 'Tiempo Carga', value: '15 seg', color: 'green', highlight: true },
              { label: 'Ahorro ERP', value: '$6.000.000 ARS', color: 'gold' },
              { label: 'Sobrecostos', value: 'USD 14.890 frenados', color: 'amber' },
              { label: 'Control', value: 'Scorecard por Operador', color: 'navy' },
            ]}
            focalOrigin="center 20%"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};
