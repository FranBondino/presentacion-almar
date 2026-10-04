import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Globe2, ShieldCheck } from 'lucide-react';

export const Slide13CaseNetTrade: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: CASOS OPERATIVOS REALES"
        categoryBadge="NET TRADE LLC & BANCO MACRO"
        slideNumber="13"
        title="CASO TRIANGULACIÓN (NET TRADE MIAMI) & CONCILIACIÓN BANCO MACRO"
        subtitle="Trazabilidad de prefacturas Net Trade LLC y validación en extracto de Banco Macro antes del recibo definitivo."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {/* Visible Data Card for Immediate Legibility */}
          <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500">
              Circuito de Fondos y Validación Bancaria
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="text-[10px] text-slate-500 font-sans">Prefactura Miami:</div>
                <div className="font-bold text-blue-900 text-sm">Net Trade LLC</div>
                <div className="text-[9.5px] text-slate-500">Cuenta IFB Florida</div>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-200">
                <div className="text-[10px] text-slate-500 font-sans">Validación Local:</div>
                <div className="font-bold text-emerald-800 text-sm">Banco Macro</div>
                <div className="text-[9.5px] text-slate-500">Cta Cte Nº 376100000930617</div>
              </div>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 text-xs font-mono text-slate-700">
              <div className="font-bold text-slate-900 mb-0.5">Regla de Tesorería Inquebrantable:</div>
              <div className="text-[10.5px]">Prohibido emitir recibo oficial sin acreditación real en extracto bancario.</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-navy">
              <Globe2 className="w-4 h-4 text-blue-600" />
              <span>Enlace Directo Offshore con Carpeta</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Conexión directa entre prefacturas de Net Trade LLC y el expediente en Kipintoch, controlando reembolsos y normativa de Precios de Transferencia del BCRA.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conciliación Automatizada</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Cotejo automático de importes y referencias en el extracto del Macro antes de liberar comisiones comerciales. Caja blindada al 100%.
            </p>
          </motion.div>

          <div className="p-2 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text flex items-center justify-between">
            <span>🛡️ <strong>Blindaje de Caja:</strong> Cero emisión por comprobantes informales</span>
            <span className="font-mono font-bold text-clave-navy">100% AUDITABLE</span>
          </div>
        </div>

        {/* Right Column: Macro Mockup (7 cols) with KeyData and Focal Zoom */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/finanzas/banco-macro · Conciliación Bancaria y Extractos"
            badge="BANCO MACRO OK"
            imageSrc="./screenshots/banco_macro_conciliacion_extracto_light.png"
            imageAlt="Conciliación Extracto Banco Macro"
            caption="Validación Cruzada entre Movimientos de Extracto y Carpetas Operativas"
            keyData={[
              { label: 'Origen', value: 'Net Trade LLC (Miami)', color: 'navy' },
              { label: 'Cta Cte Macro', value: '376100000930617', color: 'slate' },
              { label: 'Validación', value: '100% Fondos Acreditados', color: 'green', highlight: true },
              { label: 'Recibo', value: 'Emitido post-extracto', color: 'slate' },
            ]}
            focalOrigin="center 30%"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};
