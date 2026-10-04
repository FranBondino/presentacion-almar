import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-clave-navy/95 backdrop-blur-md p-4 select-none"
          onClick={onClose}
        >
          {/* Top Bar with Title and Close */}
          <div
            className="w-full max-w-6xl flex items-center justify-between py-2 px-4 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded bg-clave-gold text-clave-navy font-mono font-bold text-xs uppercase tracking-wider">
                Captura HD
              </span>
              <h3 className="font-heading font-semibold text-sm truncate max-w-xl text-slate-200">
                {image.title}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
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
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div
            className="flex-1 w-full max-w-6xl max-h-[82vh] flex items-center justify-center overflow-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: isZoomed ? 1.35 : 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              src={image.src}
              alt={image.title}
              onClick={() => setIsZoomed(!isZoomed)}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/20 transition-transform ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />
          </div>

          {/* Bottom Hint */}
          <div className="text-center text-xs text-slate-400 py-1 font-mono">
            Haga clic en la imagen para {isZoomed ? 'reducir' : 'ampliar'} · Presione{' '}
            <kbd className="px-1 py-0.5 bg-white/10 text-slate-200 rounded">Esc</kbd> para cerrar
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
