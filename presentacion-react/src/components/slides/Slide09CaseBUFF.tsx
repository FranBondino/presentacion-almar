import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { ShieldCheck, AlertCircle, FileSearch } from 'lucide-react';

export const Slide09CaseBUFF: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: CASOS OPERATIVOS REALES"
        categoryBadge="CASO C367 · LCL IMPORTACIÓN"
        slideNumber="09"
        title="CASO C367: NORMALIZACIÓN SEMÁNTICA DE COMBUSTIBLE NAVIERO (BUFF)"
        subtitle="Unificación de 15 variantes de Bunker bajo el código canónico BUFF y auditoría contra cotización FCA Guangzhou."
      />

      <div className="flex-1 grid grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-navy">
              <FileSearch className="w-4 h-4 text-clave-green" />
              <span>Diagnóstico en Casillas Reales</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              El co-loader MSL facturó conceptos bajo siglas dispares: <em>BAF</em>, <em>BRC</em>, <em>EBS</em>. En el circuito manual se dudó sobre la imputación contable, demorando la carpeta.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Normalización Canónica AFIP: BUFF</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              El motor de IA reconoce automáticamente las 15 variantes navieras y las traduce al concepto fiscal <strong>BUFF (Combustible de Navegación)</strong> gravado al 21%.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Auditoría de Desvío: USD 80 Retenidos</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Al cotejar contra la cotización pactada por Juan Cuello, detectó que no contemplaba el recargo de USD 80. Bloqueó la emisión y evitó la pérdida neta.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text">
            💰 <strong>Quebranto Evitado:</strong> USD 80 + IVA recuperados antes de emitir la factura final al cliente.
          </div>
        </div>

        {/* Right Column: Case C367 Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/carpetas/C367 · Normalización BUFF & Visor Dual [CASO C367]"
            badge="AFIP BUFF NORMALIZADO"
            imageSrc="./screenshots/caso_c367_dual_buff_light.png"
            imageAlt="Caso C367 Normalización BUFF"
            caption="Visor Dual con Detección de Desvío BAF/BUFF en Factura de MSL Líneas Marítimas"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

