import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BrowserMockup } from '../common/BrowserMockup';

export const Slide08KanbanDual: React.FC<SlideProps> = ({ onOpenLightbox }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: EL ESCUDO FINANCIERO"
        categoryBadge="EXPERIENCIA OPERATIVA INTEGRAL"
        slideNumber="08"
        title="CONTROL OPERATIVO: TABLERO KANBAN & VISOR SIDE-BY-SIDE"
        subtitle="Captura real de las dos interfaces centrales con las que opera el equipo de Administración y Finanzas."
      />

      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        {/* Left: Kanban Board Mockup */}
        <div className="h-full flex flex-col">
          <BrowserMockup
            url="/comprobantes · Tablero Kanban Operativo"
            badge="KANBAN 4 COLUMNAS"
            imageSrc="./screenshots/kanban_corporate_light.png"
            imageAlt="Tablero Kanban de Comprobantes"
            caption="4 Columnas: Ingesta → Listas Kipintoch → Con Desvío de Tarifa (Retenidas) → Asentadas"
            onOpenLightbox={onOpenLightbox}
          />
        </div>

        {/* Right: Side-by-Side Dual Viewer */}
        <div className="h-full flex flex-col">
          <BrowserMockup
            url="/comprobantes/7554566633 · Modal Dual Side-by-Side"
            badge="VISOR DUAL 15s"
            imageSrc="./screenshots/modal_comprobante_detalle_light.png"
            imageAlt="Visor Dual Side-by-Side"
            caption="PDF original del armador a la izquierda vs Ficha normalizada con botón Copiar a Kipintoch"
            onOpenLightbox={onOpenLightbox}
          />
        </div>
      </div>
    </div>
  );
};

