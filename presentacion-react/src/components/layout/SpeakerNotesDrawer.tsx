import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Users,
  Eye,
  HelpCircle,
  MessageSquare,
  FileText,
  Activity,
  TrendingUp,
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'verbatim' | 'cues' | 'technical'>('verbatim');

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
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[540px] md:w-[560px] bg-white border-l border-clave-border shadow-2xl z-50 flex flex-col select-text"
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
                className={`flex-1 py-2.5 px-1 font-heading font-semibold text-center transition-colors border-b-2 text-[11px] sm:text-xs truncate ${
                  activeTab === 'verbatim'
                    ? 'border-clave-green text-clave-green bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-clave-text'
                }`}
                title="Guion Verbatim (speech para Fran)"
              >
                🎙️ Guion Verbatim
              </button>
              <button
                onClick={() => setActiveTab('cues')}
                className={`flex-1 py-2.5 px-1 font-heading font-semibold text-center transition-colors border-b-2 text-[11px] sm:text-xs truncate ${
                  activeTab === 'cues'
                    ? 'border-clave-green text-clave-green bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-clave-text'
                }`}
                title="Visual Cues (qué señalar en pantalla)"
              >
                🎯 Visual Cues
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`flex-1 py-2.5 px-1 font-heading font-semibold text-center transition-colors border-b-2 text-[11px] sm:text-xs truncate ${
                  activeTab === 'technical'
                    ? 'border-clave-green text-clave-green bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-clave-text'
                }`}
                title="Ficha Técnica & Métricas"
              >
                📋 Ficha Técnica & Métricas
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-sm space-y-4">
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
                    <p className="bg-slate-50 p-4 rounded-lg border border-clave-border-light text-slate-800 italic leading-relaxed text-[13px] shadow-sm whitespace-pre-line">
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
                /* Tab 3: Technical Sheet & Metrics */
                <div className="space-y-5">
                  {!notes.technicalSheet && (!notes.objections || notes.objections.length === 0) ? (
                    <div className="text-slate-400 italic text-center py-8">
                      No hay ficha técnica registrada para esta diapositiva.
                    </div>
                  ) : (
                    <>
                      {/* Header Badges: Expediente, Operación, Normativa */}
                      {(notes.technicalSheet?.expediente ||
                        notes.technicalSheet?.operacion ||
                        notes.technicalSheet?.normativa) && (
                        <div className="bg-slate-900 text-white rounded-lg p-3.5 space-y-2 border border-slate-800 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {notes.technicalSheet?.expediente && (
                              <span className="px-2 py-0.5 rounded bg-clave-gold text-clave-navy font-mono font-bold text-[11px] tracking-wide">
                                📁 {notes.technicalSheet.expediente}
                              </span>
                            )}
                            {notes.technicalSheet?.normativa && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono text-[10px]">
                                ⚖️ {notes.technicalSheet.normativa}
                              </span>
                            )}
                          </div>
                          {notes.technicalSheet?.operacion && (
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">
                              {notes.technicalSheet.operacion}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Metrics Grid (2 columns) */}
                      {notes.technicalSheet?.metrics && notes.technicalSheet.metrics.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-heading font-bold text-clave-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-clave-green" /> Métricas Clave & KPIs
                          </h4>
                          <div className="grid grid-cols-2 gap-2.5">
                            {notes.technicalSheet.metrics.map((metric, idx) => {
                              const borderCls =
                                metric.status === 'success'
                                  ? 'border-emerald-200 bg-emerald-50/50'
                                  : metric.status === 'danger'
                                  ? 'border-rose-200 bg-rose-50/50'
                                  : metric.status === 'warning'
                                  ? 'border-amber-200 bg-amber-50/50'
                                  : 'border-slate-200 bg-slate-50';

                              const valCls =
                                metric.status === 'success'
                                  ? 'text-emerald-800'
                                  : metric.status === 'danger'
                                  ? 'text-rose-800'
                                  : metric.status === 'warning'
                                  ? 'text-amber-800'
                                  : 'text-clave-navy';

                              return (
                                <div
                                  key={idx}
                                  className={`border rounded-lg p-2.5 flex flex-col justify-between shadow-2xs ${borderCls}`}
                                >
                                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                                    {metric.label}
                                  </div>
                                  <div className={`font-mono text-sm sm:text-base font-bold ${valCls}`}>
                                    {metric.value}
                                  </div>
                                  {metric.detail && (
                                    <div className="text-[10px] mt-1 font-medium text-slate-600 leading-tight">
                                      {metric.detail}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Technical Details Table */}
                      {notes.technicalSheet?.details && notes.technicalSheet.details.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-heading font-bold text-clave-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-clave-navy" /> Parámetros Técnicos & Hechos Auditados
                          </h4>
                          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-xs divide-y divide-slate-100 shadow-2xs">
                            {notes.technicalSheet.details.map((detail, idx) => {
                              const badgeBg =
                                detail.badgeColor === 'green'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : detail.badgeColor === 'rose'
                                  ? 'bg-rose-100 text-rose-800'
                                  : detail.badgeColor === 'amber' || detail.badgeColor === 'gold'
                                  ? 'bg-amber-100 text-amber-800'
                                  : detail.badgeColor === 'navy'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-slate-100 text-slate-800';

                              return (
                                <div
                                  key={idx}
                                  className="flex items-start sm:items-center justify-between p-2.5 gap-2 hover:bg-slate-50/70 transition-colors"
                                >
                                  <span className="font-medium text-slate-600 text-[11px] leading-tight">
                                    {detail.label}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-right flex-shrink-0">
                                    <span className="font-mono text-slate-900 text-[11px] font-semibold">
                                      {detail.value}
                                    </span>
                                    {detail.badge && (
                                      <span
                                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono ${badgeBg}`}
                                      >
                                        {detail.badge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Scorecard Table (Slides 08, 14, 18 or whichever has scorecard) */}
                      {notes.technicalSheet?.scorecard && notes.technicalSheet.scorecard.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-heading font-bold text-clave-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Scorecard Individual de Operadores
                          </h4>
                          <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white text-[11px] shadow-2xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                  <th className="py-2 px-2.5">Operador</th>
                                  <th className="py-2 px-2 text-center">Facturas</th>
                                  <th className="py-2 px-2 text-center">Tiempo</th>
                                  <th className="py-2 px-2 text-right">Ahorro USD</th>
                                  <th className="py-2 px-2 text-right">SLA %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                {notes.technicalSheet.scorecard.map((op, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2 px-2.5 font-sans font-medium text-slate-800">
                                      {op.operador}
                                    </td>
                                    <td className="py-2 px-2 text-center text-slate-700">{op.facturas}</td>
                                    <td className="py-2 px-2 text-center text-slate-700">{op.tiempoMin}m</td>
                                    <td className="py-2 px-2 text-right text-emerald-700 font-bold">
                                      ${op.ahorroUsd.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-700 font-bold">
                                      {op.slaScore}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Hard Questions / Objections Section */}
                      {((notes.technicalSheet?.hardQuestions && notes.technicalSheet.hardQuestions.length > 0) ||
                        (notes.objections && notes.objections.length > 0)) && (
                        <div className="space-y-3">
                          <h4 className="font-heading font-bold text-clave-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Respuestas a Repreguntas Filosas / Objeciones
                          </h4>
                          {/* Prefer technicalSheet.hardQuestions */}
                          {notes.technicalSheet?.hardQuestions && notes.technicalSheet.hardQuestions.length > 0
                            ? notes.technicalSheet.hardQuestions.map((q, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-clave-navy">
                                      {q.stakeholder}
                                    </span>
                                    {q.legalBasis && (
                                      <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        ⚖️ {q.legalBasis}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-rose-950 font-medium italic bg-rose-50/80 p-2 rounded border border-rose-100">
                                    "{q.question}"
                                  </p>
                                  <div className="text-slate-800 pt-0.5 leading-relaxed">
                                    <strong className="text-clave-green block mb-0.5">Respuesta de Fran:</strong>
                                    <p>{q.answer}</p>
                                  </div>
                                </div>
                              ))
                            : notes.objections?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-clave-navy">
                                      {item.stakeholder}
                                    </span>
                                    <span className="text-[10px] text-clave-gold font-mono uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      Repregunta Directiva
                                    </span>
                                  </div>
                                  <p className="text-rose-950 font-medium italic bg-rose-50/80 p-2 rounded border border-rose-100">
                                    "{item.objection}"
                                  </p>
                                  <div className="text-slate-800 pt-0.5 leading-relaxed">
                                    <strong className="text-clave-green block mb-0.5">Respuesta de Fran:</strong>
                                    <p>{item.response}</p>
                                  </div>
                                </div>
                              ))}
                        </div>
                      )}
                    </>
                  )}
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
