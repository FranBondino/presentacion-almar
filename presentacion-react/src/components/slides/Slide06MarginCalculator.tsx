import React from 'react';
import { SlideProps } from '../../types/presentation';
import { SlideHeader } from '../common/SlideHeader';
import { ParametricMarginCalculator } from '../simulations/ParametricMarginCalculator';

export const Slide06MarginCalculator: React.FC<SlideProps> = () => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
      <SlideHeader
        momentoBadge="MOMENTO 2: EL MÓDULO COMERCIAL FLEXIBLE"
        categoryBadge="RESPUESTA DIRECTA A ALEJANDRO NOACCO"
        slideNumber="06"
        title="CALCULADORA PARAMÉTRICA CON PERFILES DINÁMICOS DE MARGEN"
        subtitle="Agilidad para cotizar en segundos adaptando el margen al tipo de cliente, sin rigideces ni pérdida de control."
      />

      <div className="flex-1 overflow-hidden">
        <ParametricMarginCalculator />
      </div>
    </div>
  );
};
