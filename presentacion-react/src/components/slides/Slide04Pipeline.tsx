import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BillingPipelineSimulator } from '../simulations/BillingPipelineSimulator';

export const Slide04Pipeline: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 1: SOLUCIÓN INTEGRAL"
        categoryBadge="TRAZABILIDAD DE EXTREMO A EXTREMO"
        slideNumber="04"
        title="ARQUITECTURA DEL PIPELINE: DE LA FACTURA A LA CARPETA Y BANCO"
        subtitle="Flujo continuo de cinco etapas automatizadas para garantizar consistencia contable, fiscal y bancaria."
      />

      <div className="flex-1 overflow-hidden">
        <BillingPipelineSimulator />
      </div>
    </div>
  );
};
