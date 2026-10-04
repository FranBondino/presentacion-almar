import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid, CheckCircle2 } from 'lucide-react';
import { SLIDES_METADATA } from '../../data/slidesMetadata';

interface ThumbnailGridModalProps {
  isOpen: boolean;
  currentSlide: number;
  onClose: () => void;
  onSelectSlide: (slideIndex: number) => void;
}

export const ThumbnailGridModal: React.FC<ThumbnailGridModalProps> = ({
  isOpen,
  currentSlide,
  onClose,
  onSelectSlide,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-clave-navy/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-clave-border overflow-hidden flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-clave-border-light flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-clave-green/10 flex items-center justify-center text-clave-green">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-clave-navy">
                    Índice de Diapositivas (18 Secciones)
                  </h2>
                  <p className="text-xs text-clave-muted">
                    Seleccione cualquier diapositiva para saltar directamente. Atajo rápido:{' '}
                    <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[11px] font-mono">O</kbd> /{' '}
                    <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[11px] font-mono">M</kbd>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Cerrar índice (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of 18 Slides */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {SLIDES_METADATA.map((meta) => {
                  const isCurrent = meta.id === currentSlide;
                  return (
                    <motion.button
                      key={meta.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectSlide(meta.id)}
                      className={`group relative flex flex-col rounded-lg border text-left overflow-hidden transition-all duration-200 ${
                        isCurrent
                          ? 'border-clave-green ring-2 ring-clave-green shadow-md bg-clave-green-soft/40'
                          : 'border-slate-200 hover:border-clave-gold hover:shadow bg-white'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={meta.thumbnailUrl}
                          alt={meta.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-clave-navy/85 text-white font-mono font-bold text-[10px]">
                          {meta.number}
                        </div>
                        {isCurrent && (
                          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-clave-green text-white">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-clave-gold truncate">
                          Bloque {meta.block}: {meta.blockTitle}
                        </div>
                        <h4 className="text-[11px] font-heading font-semibold text-slate-800 line-clamp-2 leading-tight mt-0.5">
                          {meta.title}
                        </h4>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-clave-border-light flex items-center justify-between text-xs text-clave-muted">
              <span className="font-mono">
                Diapositiva activa: <strong className="text-clave-green">{String(currentSlide).padStart(2, '0')}</strong> / 18
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
