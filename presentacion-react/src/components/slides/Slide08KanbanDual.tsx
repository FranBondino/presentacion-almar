import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Zap,
  LayoutGrid,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

interface OperatorPerformance {
  nombre: string;
  puesto: string;
  avatar: string;
  facturas: number;
  tiempoProm: string;
  desviosAuditados: number;
  ahorroPrevenido: string;
  scoreSla: string;
}

const OPERADORES_ALMAR: OperatorPerformance[] = [
  {
    nombre: 'Natali Hermoso',
    puesto: 'Coordinación Marítimo Impo',
    avatar: 'NH',
    facturas: 110,
    tiempoProm: '10.5m',
    desviosAuditados: 3,
    ahorroPrevenido: 'USD 5.400',
    scoreSla: '98.8%',
  },
  {
    nombre: 'Victoria Moyano',
    puesto: 'Customer Service Exportaciones',
    avatar: 'VM',
    facturas: 68,
    tiempoProm: '11.2m',
    desviosAuditados: 2,
    ahorroPrevenido: 'USD 3.500',
    scoreSla: '97.4%',
  },
  {
    nombre: 'Ana Laura Talaban',
    puesto: 'Operaciones Impo & Corporativas',
    avatar: 'AT',
    facturas: 62,
    tiempoProm: '11.8m',
    desviosAuditados: 1,
    ahorroPrevenido: 'USD 2.400',
    scoreSla: '98.1%',
  },
  {
    nombre: 'Abril Stampfli',
    puesto: 'Aéreo & Terrestre Nacional',
    avatar: 'AS',
    facturas: 54,
    tiempoProm: '13.0m',
    desviosAuditados: 1,
    ahorroPrevenido: 'USD 2.150',
    scoreSla: '96.5%',
  },
];

export const Slide08KanbanDual: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  const [activeTab, setActiveTab] = useState<'operativo' | 'metricas'>('operativo');

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <div className="flex items-start justify-between gap-4">
        <SlideHeader
          momentoBadge="MOMENTO 3: EL ESCUDO FINANCIERO"
          categoryBadge="EXPERIENCIA OPERATIVA & CONTROL DE GESTIÓN"
          slideNumber="08"
          title="CONTROL OPERATIVO: FLUJO DIARIO & MÉTRICAS DE PRODUCTIVIDAD"
          subtitle="Visibilidad punta a punta: desde el tablero operativo de comprobantes hasta el rendimiento individual del equipo."
        />

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 flex-shrink-0 shadow-xs mt-1">
          <button
            type="button"
            onClick={() => setActiveTab('operativo')}
            className={`px-3 py-1.5 rounded-md text-xs font-heading font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'operativo'
                ? 'bg-white text-clave-green shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tablero Operativo & Visor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metricas')}
            className={`px-3 py-1.5 rounded-md text-xs font-heading font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'metricas'
                ? 'bg-clave-green text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas de Productividad</span>
          </button>
        </div>
      </div>

      {/* Main Content Area with Tab Transitions */}
      <div className="flex-1 overflow-hidden mt-2">
        <AnimatePresence mode="wait">
          {activeTab === 'operativo' ? (
            <motion.div
              key="operativo"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col justify-between gap-2.5"
            >
              <div className="flex-1 grid grid-cols-2 gap-3.5 overflow-hidden">
                {/* Left: Kanban Board Mockup with High-Legibility Data */}
                <div className="h-full flex flex-col">
                  <BrowserMockup
                    url="/comprobantes · Tablero Kanban de Comprobantes"
                    badge="KANBAN 4 COLUMNAS"
                    imageSrc="./screenshots/kanban_corporate_light.png"
                    imageAlt="Tablero Kanban de Comprobantes"
                    caption="4 Estados: Ingesta → Listas Kipintoch → Con Desvío de Tarifa (Retenidas) → Asentadas"
                    keyData={[
                      { label: 'Volumen Mensual', value: '324 facturas', color: 'slate' },
                      { label: 'Desvío Retenido', value: 'Maersk USD 4.840', color: 'rose', highlight: true },
                      { label: 'Asentadas', value: '100% trazables', color: 'green' },
                    ]}
                    focalOrigin="center 20%"
                    onOpenLightbox={onOpenLightbox}
                  />
                </div>

                {/* Right: Side-by-Side Dual Viewer with High-Legibility Data */}
                <div className="h-full flex flex-col">
                  <BrowserMockup
                    url="/comprobantes/7554566633 · Visor Dual Side-by-Side"
                    badge="VISOR DUAL 15s"
                    imageSrc="./screenshots/modal_comprobante_detalle_light.png"
                    imageAlt="Visor Dual Side-by-Side"
                    caption="PDF original del armador a la izquierda vs Ficha normalizada con botón Copiar a Kipintoch"
                    keyData={[
                      { label: 'Tiempo de Carga', value: '15 segundos', color: 'green', highlight: true },
                      { label: 'Extracción Canónica', value: '5 campos AFIP', color: 'slate' },
                      { label: 'Tipeo Manual', value: '0% de error', color: 'slate' },
                    ]}
                    focalOrigin="center 30%"
                    onOpenLightbox={onOpenLightbox}
                  />
                </div>
              </div>

              {/* Practical Bottom Callout */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-clave-navy flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Impacto en Operación Diaria:
                  </span>
                  <span className="text-slate-700">
                    Stefania no imprime ni transcribe a mano: el sistema valida el PDF contra Kipintoch y previene pagos con desvío antes de emitir.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('metricas')}
                  className="font-mono text-[11px] font-bold text-clave-green hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <span>Ver métricas del equipo</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="metricas"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col justify-between gap-3"
            >
              {/* Top 4 Executive KPI Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    <span>Tiempo por Factura</span>
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-900">15 seg</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">-98% vs manual</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">Antes 12 min de tipeo manual por comprobante</p>
                </div>

                <div className="bg-slate-50 border border-amber-200 bg-amber-50/40 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold uppercase tracking-wider mb-1">
                    <span>Sobrecostos Frenados</span>
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-amber-950">USD 14.890</span>
                  </div>
                  <p className="text-[10px] text-amber-800 mt-0.5">Prevenidos en flete/THC a Maersk, MSC y TRP</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    <span>Cumplimiento SLA</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-emerald-700">98.2%</span>
                    <span className="text-xs font-bold text-slate-500 font-mono">&lt; 24 horas</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">324 comprobantes procesados en tiempo formal</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    <span>Ahorro en Licencias</span>
                    <Zap className="w-4 h-4 text-clave-green" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-slate-900">$6.000.000</span>
                    <span className="text-xs text-slate-500 font-mono">ARS/año</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">Ahorro al evitar conectores cerrados en Kipintoch</p>
                </div>
              </div>

              {/* Operator Productivity Scorecard Table */}
              <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-clave-navy" />
                    <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wide">
                      Rendimiento Individual por Operador (Scorecard Mensual)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLightbox &&
                      onOpenLightbox('./screenshots/metricas_productividad_light.png', 'Tablero de Rendimiento & Productividad')
                    }
                    className="text-[11px] font-mono font-bold text-clave-green hover:underline flex items-center gap-1"
                  >
                    <span>Ver Tablero Completo en HD</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Operador / Área</th>
                        <th className="py-2 px-3 text-center">Facturas Procesadas</th>
                        <th className="py-2 px-3 text-center">Tiempo Promedio</th>
                        <th className="py-2 px-3 text-center">Desvíos Frenados</th>
                        <th className="py-2 px-3 text-right">Ahorro Prevenido</th>
                        <th className="py-2 px-3 text-center">Cumplimiento SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {OPERADORES_ALMAR.map((op, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center">
                                {op.avatar}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900">{op.nombre}</div>
                                <div className="text-[10px] text-slate-500">{op.puesto}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                            {op.facturas}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-700">
                            {op.tiempoProm}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10.5px]">
                              {op.desviosAuditados}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {op.ahorroPrevenido}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-200">
                              {op.scoreSla}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    ✓ Datos auditados en tiempo real. Exportable a Excel para informes de Directorio e ISO 9001.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('operativo')}
                    className="font-bold text-clave-navy hover:underline"
                  >
                    ← Volver a Tablero Operativo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
