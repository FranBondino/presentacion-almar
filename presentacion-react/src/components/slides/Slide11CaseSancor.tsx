import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { MulticurrencyProvisionSimulator } from '../simulations/MulticurrencyProvisionSimulator';

export const Slide11CaseSancor: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 3: CASOS OPERATIVOS REALES"
        categoryBadge="BLINDAJE DE COMISIONES · DIRECTIVA FINANCIERA"
        slideNumber="11"
        title="CASO SANCOR SEGUROS: PROVISIÓN DIFERIDA AUTOMÁTICA A 150 DÍAS"
        subtitle="Blindaje de comisiones comerciales e imputación de costos pendientes ante demoras de pólizas de hasta 5 meses."
      />

      <div className="flex-1 overflow-hidden">
        <MulticurrencyProvisionSimulator initialTab="sancor" />
      </div>
    </div>
  );
};
