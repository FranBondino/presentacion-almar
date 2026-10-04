import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Sparkles, ShieldCheck, Copy } from 'lucide-react';

export const Slide14LiveDemo: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: DEMOSTRACIÓN EN VIVO"
        categoryBadge="ENTORNO ACTIVO · PRUEBA EN VIVO ANTE DIRECTORIO"
        slideNumber="14"
        title="DEMOSTRACIÓN EN VIVO DE LA SOLUCIÓN EN FUNCIONAMIENTO"
        subtitle="Transición al navegador (http://localhost:3000): prueba integral del circuito de facturación, comercial y cobranzas."
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
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-green">
              <Sparkles className="w-4 h-4" />
              <span>1. Ingesta y Extracción en Vivo (&lt; 5s)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Arrastre de factura real de Maersk. Reconocimiento de conceptos flete, bunker BAF a BUFF y alícuotas impositivas sin errores.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-amber-700">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>2. Detección de Desvío &amp; Override Gerencial</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Retención automática de sobrecostos no pactados y autorización biométrica WebAuthn en 3 segundos con hash SHA-256.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-navy">
              <Copy className="w-4 h-4 text-clave-gold" />
              <span>3. Copiado Asistido a Kipintoch (15s)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              5 campos canónicos al portapapeles. Cero tipeo manual por parte de Stefania en el ERP local.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between font-mono">
            <span>● Servidor Local Listo: Port 3000</span>
            <span className="font-bold text-emerald-700">TRANSICIÓN EN VIVO</span>
          </div>
        </div>

        {/* Right Column: Live Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="http://localhost:3000/comprobantes · Tablero en Vivo [● EN VIVO]"
            badge="● EN VIVO"
            imageSrc="./screenshots/kanban_corporate_light.png"
            imageAlt="Portal en Vivo http://localhost:3000"
            caption="Bandeja de Comprobantes con Procesamiento y Validación en Vivo"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

