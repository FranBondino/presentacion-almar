import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Landmark, Globe2, ShieldCheck } from 'lucide-react';

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
              <Globe2 className="w-4 h-4 text-blue-600" />
              <span>Triangulación Net Trade LLC (Miami)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Enlace directo entre prefacturas offshore (International Finance Bank - IFB) y el expediente local en Kipintoch, controlando reembolsos y Precios de Transferencia (BCRA).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-purple-200 bg-purple-50/60 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-purple-900">
              <Landmark className="w-4 h-4 text-purple-600" />
              <span>Ciclo de Cobranzas en 3 Pasos</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug font-mono text-[10.5px]">
              EMITIDA_PENDIENTE_COBRO → EN_VERIFICACION_BANCARIA → COBRADA_CONCILIADA
            </p>
            <p className="text-[11px] text-slate-600 leading-tight">
              Cero recibos emitidos por volantes informales en WhatsApp sin impacto en banco.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/70 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conciliación Cta Cte Nº 376100000930617</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Validación obligatoria en el extracto de Banco Macro antes del recibo final y de la liberación de comisiones. Tesorería blindada al 100%.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text">
            🛡️ <strong>Blindaje de Caja:</strong> Fondos efectivamente acreditados antes de mover cualquier registro de cobranza.
          </div>
        </div>

        {/* Right Column: Macro Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/finanzas/banco-macro · Conciliación Bancaria y Extractos [CONCILIACIÓN BANCO]"
            badge="BANCO MACRO OK"
            imageSrc="./screenshots/banco_macro_conciliacion_extracto_light.png"
            imageAlt="Conciliación Extracto Banco Macro"
            caption="Validación Cruzada entre Movimientos de Extracto y Carpetas Operativas"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

