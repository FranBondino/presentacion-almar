import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SLIDES_METADATA } from '../../data/slidesMetadata';
import { NavigationBar } from './NavigationBar';

interface PresentationShellProps {
  currentSlide: number;
  totalSlides: number;
  isNotesOpen: boolean;
  isFullscreen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleGrid: () => void;
  onToggleNotes: () => void;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}

export const PresentationShell: React.FC<PresentationShellProps> = ({
  currentSlide,
  totalSlides,
  isNotesOpen,
  isFullscreen,
  onPrev,
  onNext,
  onToggleGrid,
  onToggleNotes,
  onToggleFullscreen,
  children,
}) => {
  const currentMeta = SLIDES_METADATA[currentSlide - 1];
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  // Responsive 16:9 scaling algorithm
  useEffect(() => {
    const handleResize = () => {
      if (!stageRef.current) return;
      const availableWidth = stageRef.current.clientWidth - 32; // 16px padding on each side
      const availableHeight = stageRef.current.clientHeight - 24; // 12px padding top/bottom

      const baseWidth = 1180;
      const baseHeight = 660;

      const scaleX = availableWidth / baseWidth;
      const scaleY = availableHeight / baseHeight;
      const fittedScale = Math.min(scaleX, scaleY, 1.35); // max 1.35x for ultra wide

      setScale(Math.max(0.4, fittedScale));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const blocks = [
    { id: 1, name: 'Diagnóstico', range: [1, 2] },
    { id: 2, name: 'Solución & Pipeline', range: [3, 4] },
    { id: 3, name: 'Módulo Comercial', range: [5, 7] },
    { id: 4, name: 'Escudo & Casos Críticos', range: [8, 14] },
    { id: 5, name: 'Triage, Arq. & Decisión', range: [15, 18] },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-clave-platinum text-clave-text select-none">
      {/* Top Header Bar */}
      <header className="h-12 min-h-[48px] bg-white/95 backdrop-blur border-b border-clave-border-light px-4 flex items-center justify-between gap-3 z-20 flex-shrink-0 shadow-sm overflow-hidden whitespace-nowrap">
        {/* Left: Brand & Organization */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <img
            src="./logo_clave.png"
            alt="Clave Consultora"
            className="h-7 w-auto object-contain"
          />
          <div className="hidden xl:block h-4 w-px bg-slate-300" />
          <div className="hidden xl:flex flex-col justify-center">
            <span className="font-heading font-bold text-xs text-clave-green tracking-wide leading-tight">
              ALMAR ROSARIO S.R.L.
            </span>
            <span className="text-[10px] text-clave-muted leading-tight">
              Presentación Ejecutiva · Directorio
            </span>
          </div>
        </div>

        {/* Center: Stage Blocks Stepper */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 p-1 rounded-full border border-slate-200 flex-shrink min-w-0">
          {blocks.map((b) => {
            const isActive = currentSlide >= b.range[0] && currentSlide <= b.range[1];
            return (
              <div
                key={b.id}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-heading whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-clave-green text-white font-semibold shadow-xs'
                    : 'text-slate-500 font-medium'
                }`}
              >
                {b.name}
              </div>
            );
          })}
        </div>

        {/* Right: Badges */}
        <div className="flex items-center space-x-2">
          {currentMeta?.badgePrimary && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-clave-gold/40 text-clave-gold-dark font-mono font-semibold text-[11px] hidden 2xl:inline-block">
              {currentMeta.badgePrimary}
            </span>
          )}
          <a
            href="../"
            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-heading font-semibold text-[10.5px] transition-colors flex items-center space-x-1"
            title="Ver versión clásica original"
          >
            <span>‹ Versión Clásica</span>
          </a>
          <span className="px-2 py-0.5 rounded bg-clave-navy text-white font-mono font-bold text-xs">
            {currentMeta?.number || '01'}
          </span>
        </div>
      </header>

      {/* Main Presentation Stage (Canvas Area) */}
      <main
        ref={stageRef}
        className="flex-1 flex items-center justify-center p-2 relative overflow-hidden bg-slate-200/60"
      >
        <div
          className="canvas-wrapper flex flex-col justify-between"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1], // spring-like smooth cubic bezier
              }}
              className="w-full h-full flex flex-col overflow-hidden"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <NavigationBar
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        isNotesOpen={isNotesOpen}
        isFullscreen={isFullscreen}
        onPrev={onPrev}
        onNext={onNext}
        onToggleGrid={onToggleGrid}
        onToggleNotes={onToggleNotes}
        onToggleFullscreen={onToggleFullscreen}
      />
    </div>
  );
};

