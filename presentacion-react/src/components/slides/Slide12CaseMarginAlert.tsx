import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Fingerprint, ShieldCheck } from 'lucide-react';

export const Slide12CaseMarginAlert: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: CASOS OPERATIVOS REALES"
        categoryBadge="RESPUESTA A ALEJANDRO & JUAN ANDRÉS"
        slideNumber="12"
        title="CASO C1234: ALERTA PREVENTIVA & AUTORIZACIÓN BIOMÉTRICA WEBAUTHN"
        subtitle="Gestión de descalces de rentabilidad (< USD 200) y aprobación gerencial con firma digital en 3 segundos."
      />

      <div className="flex-1 grid grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {/* Visible Data Card for Immediate Legibility */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-amber-900">
              Datos Clave de la Operación en Pantalla
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-amber-300">
                <div className="text-[10px] text-slate-500 font-sans">Margen Resultante:</div>
                <div className="font-bold text-amber-900 text-sm">USD 142.50</div>
                <div className="text-[9.5px] text-amber-700">Por debajo de USD 200</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans">Semáforo:</div>
                <div className="font-bold text-slate-800 text-sm">Amarillo Preventivo</div>
                <div className="text-[9.5px] text-slate-500">No bloquea la venta</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs font-mono">
              <span className="text-slate-600 font-sans">Aprobador Formal:</span>
              <span className="font-bold text-clave-navy">Alejandro Bondino (Director)</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-navy">
              <Fingerprint className="w-4 h-4 text-clave-gold" />
              <span>Autorización en 3 Segundos</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Gerencia abre el comprobante, selecciona el motivo comercial y apoya su huella (Touch ID o Windows Hello). Cero papeles ni llamadas que frenen la venta.
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
              <span>Validez Legal y Asiento de Auditoría</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Queda asentado formalmente en el libro digital de auditoría con fecha, hora y responsable. Pleno respaldo societario y fiscal (Ley 25.506).
            </p>
          </motion.div>

          <div className="p-2 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text flex items-center justify-between">
            <span>⚖️ <strong>Garantía Societaria:</strong> Respaldo total sin burocracia</span>
            <span className="font-mono font-bold text-clave-navy">3 SEGUNDOS</span>
          </div>
        </div>

        {/* Right Column: Case C1234 Mockup (7 cols) with KeyData and Focal Zoom */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/carpetas/C1234 · Autorización Biométrica WebAuthn"
            badge="WEBAUTHN OK"
            imageSrc="./screenshots/caso_c1234_webauthn_sha256_light.png"
            imageAlt="Caso C1234 Autorización WebAuthn"
            caption="Modal de Autorización con Selección de Motivo, Sensor Biométrico y Registro de Auditoría"
            keyData={[
              { label: 'Margen Real', value: 'USD 142.50', color: 'amber', highlight: true },
              { label: 'Alerta', value: 'Amarillo Preventivo', color: 'slate' },
              { label: 'Aprobación', value: 'TouchID en 3s', color: 'green' },
              { label: 'Registro', value: 'Ley 25.506', color: 'navy' },
            ]}
            focalOrigin="center 30%"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};
