import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';
import { Bot } from 'lucide-react';

export const Slide15TriageCopilot: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 4: TRIAGE, ARQUITECTURA & DECISIÓN"
        categoryBadge="TRIAGE EN VIVO (#TKT-XXX) · COPILOT IA"
        slideNumber="15"
        title="CIRCUITO DE REPORTE DE INCIDENCIAS & TRIAGE OPERATIVO EN VIVO"
        subtitle="Proceso visual en 4 pasos para captura de errores y casos borde en 10 segundos, con auditoría inmutable (#TKT-XXX) y Copilot IA."
      />

      <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] grid-cols-12 gap-3.5 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {/* 4 Steps */}
          <div className="space-y-1.5">
            {[
              {
                num: 1,
                title: 'Detección In Situ (Botón Flotante 24/7)',
                desc: 'Disponible en cualquier pantalla para reportar sin interrumpir el flujo.',
              },
              {
                num: 2,
                title: 'Auto-Captura de Contexto',
                desc: 'Captura pantalla, usuario, rol y carpeta (C1234) sin campos redundantes.',
              },
              {
                num: 3,
                title: 'Tipificación en 10 Segundos',
                desc: 'Selector 2x2 (Caso Borde, Corregir Dato, Consulta, Sugerencia) y severidad.',
              },
              {
                num: 4,
                title: 'Ticket Inmutable #TKT-8421 en Audit Log',
                desc: 'Se deriva al Kanban de desvíos y nos alerta para calibrar en < 24hs.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-2 rounded border border-slate-200 bg-slate-50 flex items-start space-x-2 text-xs"
              >
                <div className="w-5 h-5 rounded-full bg-clave-green text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <strong className="text-clave-navy block text-[11px] leading-tight">
                    {step.title}
                  </strong>
                  <span className="text-[10px] text-slate-600 leading-tight">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Copilot IA Box */}
          <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-[10.5px]">
              <strong>Copilot IA Asistente Operativo:</strong> Responde dudas sobre Incoterms y criterios de facturación de ALMAR en tiempo real.
            </div>
          </div>
        </div>

        {/* Right Column: Triage Mockup (7 cols) */}
        <div className="col-span-7 h-full">
          <BrowserMockup
            url="/carpetas/C1234 · Formulario de Reporte de Incidencias y Triage [#TKT-8421]"
            badge="#TKT-8421 AUDIT_LOG OK"
            imageSrc="./screenshots/triage_reporte_incidencia_light.png"
            imageAlt="Formulario Flotante de Triage de Casos Borde"
            caption="Widget de Captura In Situ con Ticket Generado y Asistencia Copilot IA"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

