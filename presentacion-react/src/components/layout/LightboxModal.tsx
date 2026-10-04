import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface LightboxModalProps {
  image: { src: string; title: string } | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ image, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-clave-navy/95 backdrop-blur-md p-3 select-none"
          onClick={onClose}
        >
          {/* Top Bar with Title and Controls */}
          <div
            className="w-full max-w-6xl flex items-center justify-between py-2 px-4 text-white z-10 bg-clave-navy/80 rounded-lg border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <span className="px-2.5 py-0.5 rounded bg-clave-gold text-clave-navy font-mono font-bold text-xs uppercase tracking-wider flex-shrink-0">
                Captura HD
              </span>
              <h3 className="font-heading font-semibold text-sm truncate max-w-xl text-slate-100">
                {image.title}
              </h3>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {isZoomed && (
                <span className="text-[11px] font-mono text-amber-300 hidden sm:flex items-center gap-1 mr-2 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-500/40">
                  <Move className="w-3 h-3" />
                  <span>Arrastre para desplazar</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
                title={isZoomed ? 'Reducir zoom' : 'Ampliar 1.4x'}
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-4 h-4 text-clave-gold" />
                    <span>Zoom 100%</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 text-clave-gold" />
                    <span>Zoom 140%</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Image Container with Drag & Pan Support */}
          <div
            className="flex-1 w-full max-w-6xl max-h-[82vh] flex items-center justify-center overflow-hidden p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              drag={isZoomed}
              dragConstraints={{ left: -500, right: 500, top: -350, bottom: 350 }}
              dragElastic={0.08}
              whileTap={{ cursor: isZoomed ? 'grabbing' : 'default' }}
              className={`flex items-center justify-center w-full h-full ${
                isZoomed ? 'cursor-grab' : 'cursor-zoom-in'
              }`}
            >
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: isZoomed ? 1.4 : 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                src={image.src}
                alt={image.title}
                onClick={() => setIsZoomed(!isZoomed)}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/20 select-none pointer-events-auto"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Bottom Helpful Navigation Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between text-xs text-slate-300 py-1.5 px-4 font-mono bg-clave-navy/70 rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-clave-gold">● Calidad UHD 1080p</span>
              <span className="hidden sm:inline text-slate-400">· Haga clic en la imagen o en el botón para alternar zoom</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Cerrar con</span>
              <kbd className="px-1.5 py-0.5 bg-white/15 text-white font-bold rounded text-[10px]">Esc</kbd>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
