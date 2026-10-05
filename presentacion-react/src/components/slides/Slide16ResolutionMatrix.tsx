import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { UserCheck, ShieldCheck, Scale } from 'lucide-react';

export const Slide16ResolutionMatrix: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 4: TRIAGE, ARQUITECTURA & DECISIÓN"
        categoryBadge="PRICING & VENTAS · RENTABILIDAD · SEGURIDAD"
        slideNumber="16"
        title="MATRIZ DE RESOLUCIÓN DE DESAFÍOS OPERATIVOS Y ESTRATÉGICOS"
        subtitle="Respuestas sistémicas y estructuradas a los principales desafíos de pricing comercial, control financiero y soberanía tecnológica."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-3 gap-3.5 overflow-hidden">
        {/* Column 1: Dirección General & Comercial */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 bg-slate-50 border border-slate-200 border-t-4 border-t-clave-green rounded-lg flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
              <span className="font-heading font-extrabold text-xs text-clave-navy uppercase">
                1. Gestión Comercial
              </span>
              <UserCheck className="w-4 h-4 text-clave-green" />
            </div>
            <div className="text-[10px] font-mono text-clave-muted mb-2">DIRECCIÓN GENERAL & COMERCIAL</div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-green block text-[10.5px]">Agilidad Spot vs Control:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Cotización en 45 segundos con selector de perfiles sin markups rígidos. Alerta preventiva sin frenar la venta.
                </p>
              </div>

              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-green block text-[10.5px]">Negociación de Fletes:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Registro cualitativo de pérdidas para exigir tarifas de volumen a los armadores con datos concretos.
                </p>
              </div>

              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-green block text-[10.5px]">Smart Follow-Up:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  20 seguimientos en 10 minutos para Lucía Laje desde Gmail sin escribir a mano.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 p-1.5 rounded bg-emerald-50 text-[9.5px] text-emerald-800 font-mono text-center font-bold">
            +35% VELOCIDAD COMERCIAL
          </div>
        </motion.div>

        {/* Column 2: Administración & Finanzas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="p-3 bg-slate-50 border border-slate-200 border-t-4 border-t-clave-gold rounded-lg flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
              <span className="font-heading font-extrabold text-xs text-clave-navy uppercase">
                2. Control Financiero
              </span>
              <ShieldCheck className="w-4 h-4 text-clave-gold" />
            </div>
            <div className="text-[10px] font-mono text-clave-muted mb-2">ADMINISTRACIÓN & FINANZAS</div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-gold-dark block text-[10.5px]">Tarifas Caducadas:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Semáforo de vigencias 15/30 días. Bloqueo estricto a presupuestos con fletes viejos de armadores.
                </p>
              </div>

              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-gold-dark block text-[10.5px]">Provisión Sancor 150d:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Devengamiento automático del 0,55% FOB. Cero liquidación prematura de comisiones sobre utilidades ficticias.
                </p>
              </div>

              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-gold-dark block text-[10.5px]">Conciliación Banco Macro:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Validación estricta de acreditación en Cta Cte Nº 376100000930617 antes del recibo oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 p-1.5 rounded bg-amber-50 text-[9.5px] text-amber-800 font-mono text-center font-bold">
            100% BLINDAJE DE CAJA
          </div>
        </motion.div>

        {/* Column 3: Gobierno Corporativo & TI */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="p-3 bg-slate-50 border border-slate-200 border-t-4 border-t-clave-navy rounded-lg flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
              <span className="font-heading font-extrabold text-xs text-clave-navy uppercase">
                3. Gobernanza &amp; Legal
              </span>
              <Scale className="w-4 h-4 text-clave-navy" />
            </div>
            <div className="text-[10px] font-mono text-clave-muted mb-2">GOBIERNO CORPORATIVO & TI</div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-navy block text-[10.5px]">Firma WebAuthn SHA-256:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Plena validez probatoria conforme a la Ley Nacional de Firma Digital Nº 25.506 (art. 5).
                </p>
              </div>

              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-navy block text-[10.5px]">OpenAI ZDR Soberano:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Contratación directa de ALMAR con <code className="bg-slate-100 px-1 py-0.5 rounded">store: false</code>. Cero persistencia y cero entrenamiento.
                </p>
              </div>

              <div className="p-2 rounded bg-white border border-slate-200">
                <strong className="text-clave-navy block text-[10.5px]">Intranet Firebase SSO:</strong>
                <p className="text-[10.5px] text-slate-700 leading-tight mt-0.5">
                  Autenticación unificada con JWT sin requerir nuevas contraseñas para los empleados.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 p-1.5 rounded bg-blue-50 text-[9.5px] text-blue-900 font-mono text-center font-bold">
            SEGURIDAD JURÍDICA LEY 25.506
          </div>
        </motion.div>
      </div>
    </div>
  );
};
