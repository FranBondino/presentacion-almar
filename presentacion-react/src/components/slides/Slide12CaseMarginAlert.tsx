import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { AlertTriangle, Fingerprint, ShieldCheck } from 'lucide-react';

export const Slide12CaseMarginAlert: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: CASOS OPERATIVOS REALES"
        categoryBadge="RESPUESTA A ALEJANDRO & JUAN ANDRÉS"
        slideNumber="12"
        title="CASO C1234: ALERTA PREVENTIVA & AUTORIZACIÓN BIOMÉTRICA WEBAUTHN"
        subtitle="Gestión de descalces de rentabilidad (< USD 200) y aprobación gerencial con firma criptográfica SHA-256."
      />

      <div className="flex-1 grid grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Descalce en Carpeta C1234 (USD 142.50)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Un aumento imprevisto en acarreos portuarios en pesos redujo el margen por debajo de USD 200. El portal encendió el semáforo preventivo amarillo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
          >
            <div className="flex items-center space-x-1.5 text-xs font-heading font-bold text-clave-navy">
              <Fingerprint className="w-4 h-4 text-clave-gold" />
              <span>Autorización en 3 Segundos (Alejandro)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Gerencia abre el comprobante, selecciona el motivo formal y apoya su huella dactilar (Touch ID o Windows Hello). Cero llamadas ni papeles.
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
              <span>Validez Jurídica Ley 25.506 (Juan Andrés)</span>
            </div>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              Genera un hash SHA-256 inmutable de 64 caracteres en el <code className="text-[10px] bg-white px-1 py-0.5 rounded border">audit_log</code>. No repudio pericial pleno.
            </p>
          </motion.div>

          <div className="p-2.5 rounded bg-clave-gold-light border-l-4 border-clave-gold text-[11px] text-clave-text">
            ⚖️ <strong>Garantía Societaria:</strong> Respaldo probatorio total ante auditorías fiscales y societarias.
          </div>
        </div>

        {/* Right Column: Case C1234 Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/carpetas/C1234 · Autorización Biométrica WebAuthn [WEBAUTHN SHA-256]"
            badge="WEBAUTHN FIDO2 OK"
            imageSrc="./screenshots/caso_c1234_webauthn_sha256_light.png"
            imageAlt="Caso C1234 Autorización WebAuthn"
            caption="Modal Biométrico con Selección de Motivo, Sensor FIDO2 y Hash Criptográfico SHA-256"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

