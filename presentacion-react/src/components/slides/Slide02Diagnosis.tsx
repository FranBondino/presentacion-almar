import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const Slide02Diagnosis: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 1: EL DIAGNÓSTICO REAL"
        categoryBadge="AUDITORÍA OPERATIVA & FUERZA COMERCIAL"
        slideNumber="02"
        title="DIAGNÓSTICO OPERATIVO & COMERCIAL: FACTURACIÓN Y PROCESOS"
        subtitle="Relevamiento integral de flujos de trabajo, dispersión de comprobantes y cuellos de botella en el circuito actual."
      />

      <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden">
        {/* 3 KPIs Superiores */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 bg-slate-50 border border-clave-border-light border-t-4 border-t-clave-green rounded-lg shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-clave-muted mb-1 font-heading font-semibold">
              <span>FLUJO DE COMPROBANTES</span>
              <RefreshCw className="w-4 h-4 text-clave-green" />
            </div>
            <div className="font-heading font-extrabold text-xl text-clave-navy">FRAGMENTADO</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Facturas y débitos de Maersk, MSC y co-loaders dispersos en múltiples casillas sin repositorio unificado.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="p-3 bg-slate-50 border border-clave-border-light border-t-4 border-t-rose-600 rounded-lg shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-clave-muted mb-1 font-heading font-semibold">
              <span>CARGA EN ERP</span>
              <Clock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="font-heading font-extrabold text-xl text-rose-700">8 - 12 MIN / FACTURA</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Tipeo artesanal campo por campo en Kipintoch, generando riesgos de alícuotas y recargos no cotejados.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="p-3 bg-slate-50 border border-clave-border-light border-t-4 border-t-clave-gold rounded-lg shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-clave-muted mb-1 font-heading font-semibold">
              <span>SEGUIMIENTO COMERCIAL</span>
              <AlertTriangle className="w-4 h-4 text-clave-gold" />
            </div>
            <div className="font-heading font-extrabold text-xl text-amber-700">DISCONTINUO</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              54,1% de cotizaciones concentradas en Lucía Laje sin alertas de vencimiento ni registro sistemático de pérdidas.
            </p>
          </motion.div>
        </div>

        {/* 3 Ejes Operativos con Cajas de Fuga */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <h4 className="font-heading font-bold text-xs text-clave-green uppercase mb-1">
              1. Despacho &amp; Operaciones
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
              Dudas semánticas en conceptos navieros (BAF, BRC, EBS) y demoras de hasta 5 meses en pólizas de Sancor Seguros.
            </p>
            <div className="p-2 rounded bg-amber-50 text-[10.5px] text-amber-900 border border-amber-200">
              ⚠️ <strong>Fuga:</strong> Facturación sin recargo trasladado al cliente final.
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <h4 className="font-heading font-bold text-xs text-clave-green uppercase mb-1">
              2. Administración &amp; Finanzas
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
              Cálculo manual de monedas complejas (GBP) y cobros informados por WhatsApp sin validar en Banco Macro.
            </p>
            <div className="p-2 rounded bg-rose-50 text-[10.5px] text-rose-900 border border-rose-200">
              ⚠️ <strong>Riesgo:</strong> Descalce cambiario con DGA y liquidación de comisiones ficticias.
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <h4 className="font-heading font-bold text-xs text-clave-green uppercase mb-1">
              3. Fuerza Comercial
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
              Cotizaciones emitidas en planillas con tarifas navieras caducadas y falta de feedback cualitativo.
            </p>
            <div className="p-2 rounded bg-blue-50 text-[10.5px] text-blue-900 border border-blue-200">
              ⚠️ <strong>Pérdida:</strong> Cotizaciones caídas sin datos para negociar contratos de volumen.
            </div>
          </div>
        </div>

        {/* Callout Inferior */}
        <div className="p-2.5 px-4 bg-clave-gold-light border-l-4 border-clave-gold rounded-r text-xs text-clave-text flex items-center justify-between">
          <span>
            <strong>Objetivo Integral:</strong> Automatizar la extracción de comprobantes en segundos y blindar los márgenes de ALMAR Rosario sin restar agilidad a las cotizaciones comerciales.
          </span>
          <span className="font-mono text-[10.5px] text-clave-gold-dark font-bold ml-2">
            AUDITORÍA DE PROCESOS 2026
          </span>
        </div>
      </div>
    </div>
  );
};
