import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '../../types/presentation';

export const Slide01Cover: React.FC<SlideProps> = () => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-white overflow-hidden select-none">
      {/* Canonical Top-Left Geometric SVG Vector Accent */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.85, x: -20, y: -20 }}
        animate={{ opacity: 0.95, scale: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 w-[220px] h-[165px] z-0 pointer-events-none"
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M-40 -40 L280 -40 L-40 220 Z" fill="#1e3d2f" />
        <path d="M-40 220 L300 -40 L315 -40 L-40 232 Z" fill="#c29320" />
        <path d="M-40 232 L315 -40 L320 -40 L-40 236 Z" fill="#2c5442" />
      </motion.svg>

      {/* Canonical Bottom-Right Geometric SVG Vector Accent */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.85, x: 20, y: 20 }}
        animate={{ opacity: 0.95, scale: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute bottom-0 right-0 w-[220px] h-[165px] z-0 pointer-events-none"
        viewBox="0 0 360 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M360 280 L40 280 L360 20 Z" fill="#1e3d2f" />
        <path d="M360 20 L20 280 L5 280 L360 8 Z" fill="#c29320" />
        <path d="M360 8 L5 280 L0 280 L360 4 Z" fill="#2c5442" />
      </motion.svg>

      {/* Central Editorial Layout */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-[900px] w-full my-auto">
        {/* Official Logo */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4"
        >
          <img
            src="./logo_clave.png"
            alt="Clave Consultora"
            className="h-16 w-auto object-contain mx-auto drop-shadow-sm"
          />
        </motion.div>

        {/* Gold Demo Badge Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mb-3.5 inline-block bg-clave-gold-light text-clave-green border-[1.5px] border-clave-gold font-heading font-bold text-[10.5px] tracking-[1.5px] uppercase px-4 py-1 rounded-full shadow-xs"
        >
          DEMO OFICIAL DE LA SOLUCIÓN TECNOLÓGICA · 2026
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="font-heading font-extrabold text-[23px] text-clave-green leading-[1.25] tracking-[-0.5px] uppercase max-w-[860px] mb-2"
        >
          AUTOMATIZACIÓN INTELIGENTE DE FACTURACIÓN Y PROCESAMIENTO DE COMPROBANTES
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="font-body text-[12.5px] text-clave-muted leading-[1.45] max-w-[740px] mb-5 font-normal"
        >
          Extracción automática de comprobantes, control de desvíos de costos y conciliación contable para ALMAR Rosario S.R.L.
        </motion.p>

        {/* Executive Metadata Grid Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="grid grid-cols-4 gap-3 bg-[#fdfcf9] border border-clave-gold-border p-3 px-4 rounded-md text-left w-full max-w-[860px] shadow-sm"
        >
          <div>
            <strong className="block text-clave-green font-heading font-bold uppercase text-[9px] tracking-wider mb-0.5">
              ORGANIZACIÓN:
            </strong>
            <span className="text-[11.5px] text-clave-text font-semibold">
              ALMAR Rosario S.R.L.
            </span>
          </div>
          <div>
            <strong className="block text-clave-green font-heading font-bold uppercase text-[9px] tracking-wider mb-0.5">
              DESARROLLO &amp; CONSULTORÍA:
            </strong>
            <span className="text-[11.5px] text-clave-text font-semibold">
              Clave Consultora
            </span>
          </div>
          <div>
            <strong className="block text-clave-green font-heading font-bold uppercase text-[9px] tracking-wider mb-0.5">
              PRESENTADOR:
            </strong>
            <span className="text-[11.5px] text-clave-text font-semibold">
              Ing. Fran Bondino
            </span>
          </div>
          <div>
            <strong className="block text-clave-green font-heading font-bold uppercase text-[9px] tracking-wider mb-0.5">
              DESTINATARIOS:
            </strong>
            <span className="text-[11.5px] text-clave-text font-semibold">
              Directorio Ejecutivo — ALMAR
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

