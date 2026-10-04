import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { BillingPipelineSimulator } from '../simulations/BillingPipelineSimulator';

export const Slide04Pipeline: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 1: CIRCUITO OPERATIVO"
        categoryBadge="TRAZABILIDAD PASO A PASO"
        slideNumber="04"
        title="CIRCUITO DE FACTURACIÓN: DE LA RECEPCIÓN DEL COMPROBANTE AL BANCO"
        subtitle="Las cinco etapas del proceso: ingreso de la factura, lectura automática, control de margen, carga en Kipintoch y cobro en Banco Macro."
      />

      <div className="flex-1 overflow-hidden">
        <BillingPipelineSimulator />
      </div>
    </div>
  );
};
