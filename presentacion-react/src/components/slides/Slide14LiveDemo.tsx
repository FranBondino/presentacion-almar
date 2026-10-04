import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Sparkles, ShieldCheck, Copy, BarChart3, ExternalLink } from 'lucide-react';

export const Slide14LiveDemo: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: DEMOSTRACIÓN EN VIVO"
        categoryBadge="ENTORNO ACTIVO · PRUEBA EN VIVO ANTE DIRECTORIO"
        slideNumber="14"
        title="DEMOSTRACIÓN EN VIVO DE LA SOLUCIÓN EN FUNCIONAMIENTO"
        subtitle="Transición al navegador (http://localhost:3000): prueba integral del circuito de facturación, comercial y métricas de productividad."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-0.5"
            >
              <div className="flex items-center space-x-1 text-xs font-heading font-bold text-clave-green">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Ingesta y Extracción</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-tight">
                Arrastre de factura Maersk. Normalización BUFF y desglose AFIP en &lt; 5s.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-0.5"
            >
              <div className="flex items-center space-x-1 text-xs font-heading font-bold text-amber-800">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Desvío &amp; WebAuthn</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-tight">
                Retención de sobrecosto no pactado y firma biométrica en 3 segundos.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-0.5"
            >
              <div className="flex items-center space-x-1 text-xs font-heading font-bold text-clave-navy">
                <Copy className="w-3.5 h-3.5 text-clave-gold" />
                <span>3. Copiado a Kipintoch</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-tight">
                5 campos canónicos en 15 segundos sin tipeo manual en el ERP local.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-0.5"
            >
              <div className="flex items-center space-x-1 text-xs font-heading font-bold text-emerald-900">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. Métricas de Productividad</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-tight">
                Scorecard por operador, tiempos reales y sobrecostos evitados.
              </p>
            </motion.div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Servidor Local: http://localhost:3000</span>
            </div>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
            >
              <span>ABRIR EN PANTALLA</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="p-2 rounded bg-slate-100 border border-slate-300 text-[10.5px] text-slate-700 leading-snug">
            💡 <strong>Prueba Práctica:</strong> Recorreremos los 4 módulos con facturas reales para que el Directorio verifique la velocidad y la claridad operativa.
          </div>
        </div>

        {/* Right Column: Live Mockup (7 cols) with KeyData and Focal Zoom */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="http://localhost:3000/comprobantes · Tablero Operativo y Métricas"
            badge="● EN VIVO"
            imageSrc="./screenshots/kanban_corporate_light.png"
            imageAlt="Portal en Vivo http://localhost:3000"
            caption="Bandeja de Comprobantes, Visor Dual y Métricas de Productividad en Vivo"
            keyData={[
              { label: 'Entorno', value: 'Localhost:3000 Listo', color: 'green', highlight: true },
              { label: 'Tiempo Carga', value: '15 segundos', color: 'slate' },
              { label: 'Métricas Equipo', value: '4 Operadores Activos', color: 'navy' },
            ]}
            focalOrigin="center 20%"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};
