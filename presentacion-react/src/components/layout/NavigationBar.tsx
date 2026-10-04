import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Grid,
  FileText,
} from 'lucide-react';

interface NavigationBarProps {
  currentSlide: number;
  totalSlides: number;
  isNotesOpen: boolean;
  isFullscreen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleGrid: () => void;
  onToggleNotes: () => void;
  onToggleFullscreen: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentSlide,
  totalSlides,
  isNotesOpen,
  isFullscreen,
  onPrev,
  onNext,
  onToggleGrid,
  onToggleNotes,
  onToggleFullscreen,
}) => {
  const progressPercent = ((currentSlide - 1) / (totalSlides - 1 || 1)) * 100;
  const currentFormatted = String(currentSlide).padStart(2, '0');
  const totalFormatted = String(totalSlides).padStart(2, '0');

  return (
    <footer className="h-12 bg-white/95 backdrop-blur border-t border-clave-border-light flex flex-col justify-between select-none z-30 flex-shrink-0 shadow-sm">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-clave-green via-clave-green-light to-clave-gold transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Bar Controls */}
      <div className="flex-1 px-4 flex items-center justify-between text-xs text-clave-muted">
        {/* Left: Quick Access Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleGrid}
            title="Ver índice de diapositivas (O / M)"
            className="flex items-center space-x-1 px-2.5 py-1 rounded hover:bg-slate-100 text-clave-text transition-colors border border-transparent hover:border-clave-border-light"
          >
            <Grid className="w-3.5 h-3.5 text-clave-gold" />
            <span className="font-heading font-medium">Índice (O)</span>
          </button>

          <button
            onClick={onToggleNotes}
            title="Alternar notas del orador (N)"
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors border ${
              isNotesOpen
                ? 'bg-clave-green-soft text-clave-green border-clave-green/30 font-semibold'
                : 'hover:bg-slate-100 text-clave-text border-transparent hover:border-clave-border-light font-medium'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-clave-green" />
            <span className="font-heading">Notas (N)</span>
          </button>
        </div>

        {/* Center: Slide Counter & Prev/Next */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onPrev}
            disabled={currentSlide <= 1}
            title="Diapositiva anterior (← / RePág)"
            className="flex items-center space-x-1 px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-clave-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium border border-clave-border-light"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="px-3 py-1 bg-clave-platinum rounded border border-clave-border-light font-mono font-semibold text-clave-text tracking-wider text-xs">
            <span className="text-clave-green font-bold">{currentFormatted}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span>{totalFormatted}</span>
          </div>

          <button
            onClick={onNext}
            disabled={currentSlide >= totalSlides}
            title="Siguiente diapositiva (→ / Espacio / AvPág)"
            className="flex items-center space-x-1 px-3 py-1 rounded bg-clave-green hover:bg-clave-green-light text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Fullscreen Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleFullscreen}
            title="Pantalla completa (F)"
            className="flex items-center space-x-1 px-2.5 py-1 rounded hover:bg-slate-100 text-clave-text transition-colors border border-transparent hover:border-clave-border-light"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-clave-navy" />
                <span className="font-heading hidden md:inline font-medium">Salir (F)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-clave-navy" />
                <span className="font-heading hidden md:inline font-medium">Pantalla Completa (F)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};
