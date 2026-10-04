import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { MulticurrencyProvisionSimulator } from '../simulations/MulticurrencyProvisionSimulator';

export const Slide10CaseMulticurrency: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: CASOS OPERATIVOS REALES"
        categoryBadge="CUMPLIMIENTO CAMBIARIO & DGA"
        slideNumber="10"
        title="CASO C620: MÓDULO MULTIMONEDA BNA OFICIAL PARA DIVISAS COMPLEJAS (GBP)"
        subtitle="Ingesta del tipo de cambio oficial vendedor del Banco Nación (BNA) a fecha de embarque con respaldo digital."
      />

      <div className="flex-1 overflow-hidden">
        <MulticurrencyProvisionSimulator initialTab="multicurrency" />
      </div>
    </div>
  );
};
