import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, Eye, HelpCircle, MessageSquare } from 'lucide-react';
import { SpeakerNotesData } from '../../types/presentation';

interface SpeakerNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: SpeakerNotesData | undefined;
  slideNumber: number;
}

export const SpeakerNotesDrawer: React.FC<SpeakerNotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  slideNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'verbatim' | 'cues' | 'objections'>('verbatim');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile/tablet click-out) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-clave-navy/40 z-40 backdrop-blur-[2px]"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-clave-border shadow-2xl z-50 flex flex-col select-text"
          >
            {/* Header */}
            <div className="p-4 bg-clave-navy text-white flex items-center justify-between border-b border-clave-green">
              <div className="flex items-center space-x-2">
                <div className="px-2 py-0.5 rounded bg-clave-gold text-clave-navy font-mono font-bold text-xs">
                  Slide {String(slideNumber).padStart(2, '0')}
                </div>
                <h3 className="font-heading font-semibold text-sm truncate max-w-[300px]">
                  Notas del Orador
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title="Cerrar notas (N o Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Strip */}
            {notes && (
              <div className="px-4 py-2 bg-clave-platinum border-b border-clave-border-light flex flex-wrap gap-2 text-xs text-clave-muted">
                <span className="flex items-center space-x-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-clave-gold" />
                  <span>{notes.timeAllocation}</span>
                </span>
                <span className="flex items-center space-x-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-clave-green" />
                  <span>{notes.keyStakeholders.join(', ')}</span>
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-clave-border-light bg-slate-50 text-xs">
              <button
                onClick={() => setActiveTab('verbatim')}
                className={`flex-1 py-2.5 font-heading font-semibold text-center transition-colors border-b-2 ${
                  activeTab === 'verbatim'
                    ? 'border-clave-green text-clave-green bg-white'
                    : 'border-transparent text-slate-500 hover:text-clave-text'
                }`}
              >
                🎙️ Guion Verbatim
              </button>
              <button
                onClick={() => setActiveTab('cues')}
                className={`flex-1 py-2.5 font-heading font-semibold text-center transition-colors border-b-2 ${
                  activeTab === 'cues'
                    ? 'border-clave-green text-clave-green bg-white'
                    : 'border-transparent text-slate-500 hover:text-clave-text'
                }`}
              >
                🎯 Visual Cues
              </button>
              {notes?.objections && notes.objections.length > 0 && (
                <button
                  onClick={() => setActiveTab('objections')}
                  className={`flex-1 py-2.5 font-heading font-semibold text-center transition-colors border-b-2 ${
                    activeTab === 'objections'
                      ? 'border-clave-green text-clave-green bg-white'
                      : 'border-transparent text-slate-500 hover:text-clave-text'
                  }`}
                >
                  ⚡ Objeciones ({notes.objections.length})
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 text-sm space-y-4">
              {!notes ? (
                <div className="text-slate-400 italic text-center py-8">
                  No hay notas específicas para esta diapositiva.
                </div>
              ) : activeTab === 'verbatim' ? (
                <div className="space-y-4">
                  <div className="bg-clave-gold-light/60 border-l-4 border-clave-gold p-3 rounded-r text-xs text-clave-text">
                    <span className="font-heading font-bold text-clave-navy block mb-1">
                      Encuadre Narrativo:
                    </span>
                    {notes.whatAudienceSees}
                  </div>

                  <div className="space-y-3 text-slate-800 leading-relaxed font-body">
                    <h4 className="font-heading font-bold text-clave-green text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> Discurso Sugerido (Minuto a Minuto):
                    </h4>
                    <p className="bg-slate-50 p-4 rounded-lg border border-clave-border-light text-slate-800 italic leading-relaxed text-[13px] shadow-sm">
                      "{notes.verbatimSpeech}"
                    </p>
                  </div>
                </div>
              ) : activeTab === 'cues' ? (
                <div className="space-y-4">
                  <h4 className="font-heading font-bold text-clave-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-clave-gold" /> Qué Señalar en Pantalla:
                  </h4>
                  <ul className="space-y-2.5">
                    {notes.demoCues.map((cue, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-clave-green text-white flex items-center justify-center font-bold text-[10px]">
                          {index + 1}
                        </span>
                        <span className="text-slate-700 leading-normal">{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-heading font-bold text-clave-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-clave-green" /> Manejo Táctico de Objeciones:
                  </h4>
                  {notes.objections?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-clave-border-light rounded-lg p-3.5 space-y-2 text-xs shadow-sm"
                    >
                      <div className="font-heading font-bold text-clave-navy flex items-center justify-between">
                        <span>{item.stakeholder}</span>
                        <span className="text-[10px] text-clave-gold font-mono uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Pregunta Frecuente
                        </span>
                      </div>
                      <p className="text-rose-900 font-medium italic bg-rose-50/70 p-2 rounded border border-rose-100">
                        "{item.objection}"
                      </p>
                      <div className="text-slate-700 pt-1">
                        <strong className="text-clave-green block mb-0.5">Respuesta de Fran:</strong>
                        <p>{item.response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-clave-platinum border-t border-clave-border-light text-[11px] text-slate-500 text-center font-mono">
              Presione <kbd className="px-1 py-0.5 bg-white border rounded">N</kbd> o{' '}
              <kbd className="px-1 py-0.5 bg-white border rounded">Esc</kbd> para cerrar
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
