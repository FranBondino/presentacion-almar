import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { ShieldCheck, FileSearch } from 'lucide-react';

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

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {/* Visual Comparison Box for 100% Legibility */}
          <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500">
              Datos Clave Extraídos de la Operación
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-rose-200">
                <div className="text-[10px] text-slate-500 font-sans">Facturado por MSL:</div>
                <div className="font-bold text-rose-700 text-sm">BAF USD 80.00</div>
                <div className="text-[9.5px] text-slate-500">Combustible no pactado</div>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-200">
                <div className="text-[10px] text-slate-500 font-sans">Mapeo Canónico:</div>
                <div className="font-bold text-emerald-700 text-sm">BUFF (21% IVA)</div>
                <div className="text-[9.5px] text-slate-500">Código fiscal AFIP</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200 text-xs font-mono">
              <span className="text-amber-900 font-sans font-medium">Cotización pactada: USD 0 extra</span>
              <span className="font-bold text-amber-800">→ Retenido (+USD 80)</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-navy">
              <FileSearch className="w-4 h-4 text-clave-green" />
              <span>Problema en Circuito Manual</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              El co-loader facturó bajo siglas dispares (<em>BAF</em>, <em>BRC</em>, <em>EBS</em>). El operador dudaba de la imputación contable, demorando la carpeta.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Normalización AFIP Automática</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              La IA reconoce las 15 variantes navieras y las unifica en <strong>BUFF (Combustible)</strong> gravado al 21% sin error de tipeo.
            </p>
          </motion.div>

          <div className="p-2 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text flex items-center justify-between">
            <span>💰 <strong>Quebranto Evitado:</strong> USD 80 + IVA recuperados</span>
            <span className="font-mono font-bold text-clave-navy">C367 PROTEGIDA</span>
          </div>
        </div>

        {/* Right Column: Case C367 Mockup (7 cols) with KeyData and Focal Zoom */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/carpetas/C367 · Normalización BUFF & Visor Dual"
            badge="AFIP BUFF NORMALIZADO"
            imageSrc="./screenshots/caso_c367_dual_buff_light.png"
            imageAlt="Caso C367 Normalización BUFF"
            caption="Visor Dual con Detección de Desvío BAF/BUFF en Factura de MSL Líneas Marítimas"
            keyData={[
              { label: 'Factura MSL', value: 'BAF USD 80.00', color: 'rose' },
              { label: 'Normalizado', value: 'BUFF 21%', color: 'navy', highlight: true },
              { label: 'Cotizado', value: 'USD 0 extra', color: 'slate' },
              { label: 'Acción', value: 'Retenido Preventivo', color: 'amber' },
            ]}
            focalOrigin="center 25%"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};
