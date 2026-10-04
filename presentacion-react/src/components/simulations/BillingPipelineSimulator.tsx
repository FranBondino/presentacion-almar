import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronRight, ChevronLeft, CheckCircle2, ShieldAlert, FileText, Database, Landmark } from 'lucide-react';
import { PipelineStageInfo } from '../../types/presentation';

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 1,
    key: 'ingesta',
    title: '1. Ingesta Multicanal',
    badge: 'CORREO / DRAG & DROP',
    subtitle: 'Recepción del PDF original y deduplicación criptográfica',
    description: 'El comprobante entra por correo corporativo o arrastre. Se calcula el hash SHA-256 para evitar duplicaciones.',
    statusColor: 'text-blue-600',
    payloadPreview: {
      remitente: 'billing@maersk.com',
      archivo: 'MSK_INVOICE_9823412.pdf',
      tamano: '1.4 MB',
      sha256: '8f3b92c4...e19d',
      estado: 'RECIBIDO_EN_BANDEJA',
    },
  },
  {
    id: 2,
    key: 'extraccion',
    title: '2. Extracción IA & Normalización',
    badge: 'GPT-4o MINI · 4.8 SEG',
    subtitle: 'Reconocimiento semántico y mapeo a código fiscal BUFF',
    description: 'Desglose de CUIT emisor, discriminación flete internacional vs recargos y normalización semántica a código BUFF de AFIP.',
    statusColor: 'text-emerald-600',
    payloadPreview: {
      cuit: '30-70809012-3 (Maersk)',
      fleteInternacional: 'USD 2,450.00',
      recargoBunker: 'USD 180.00 (BAF -> BUFF AFIP)',
      alicuotaIva: 'Exento Flete / 21% BUFF',
      tiempoExtraccion: '4.8 segundos',
    },
  },
  {
    id: 3,
    key: 'reglas',
    title: '3. Reglas & Escudo Financiero',
    badge: 'AUDITORÍA VS KIPINTOCH',
    subtitle: 'Cruce contra cotización y detección de sobrecostos',
    description: 'Verificación de que el costo real no exceda lo presupuestado. Si supera el margen, activa alerta preventiva o retención.',
    statusColor: 'text-amber-600',
    payloadPreview: {
      carpetaOperativa: 'C367 (FCA Guangzhou)',
      costoCotizado: 'USD 2,700.00',
      costoFacturado: 'USD 2,795.00 (+USD 95.00)',
      alertaMargen: 'RETENIDO_CON_DESVIO',
      requiereOverride: 'GERENCIA_BIOMETRIA',
    },
  },
  {
    id: 4,
    key: 'kipin',
    title: '4. Kipintoch Asistido (1-Clic)',
    badge: 'COPIADO EN 15 SEG',
    subtitle: 'Payload formateado en 5 campos canónicos sin conectores caros',
    description: 'Generación de prefactura digital lista para pegar en el ERP local, ahorrando $6M ARS al año en licencias de software.',
    statusColor: 'text-clave-green',
    payloadPreview: {
      formatoClipboard: '5 Campos Canónicos',
      operador: 'Stefania (Rol Operativo)',
      tiempoCarga: '15 segundos',
      ahorroAnual: '$6.000.000 ARS',
      estadoErp: 'ASENTADO_EN_KIPINTOCH',
    },
  },
  {
    id: 5,
    key: 'macro',
    title: '5. Conciliación Banco Macro',
    badge: 'EXTRACTO CTA CTE',
    subtitle: 'Validación en cuenta antes del recibo oficial y comisiones',
    description: 'Concordancia estricta entre el cobro y la cuenta corriente Nº 376100000930617 en Banco Macro para liberar comisiones.',
    statusColor: 'text-purple-600',
    payloadPreview: {
      cuentaMacro: 'Cta Cte 376100000930617',
      movimientoExtracto: 'CREDITO USD 3,140.00',
      conciliacion: '100% CONCILIADO',
      comisionVenta: 'LIBERADA (Lucía Laje)',
      estadoFinal: 'COBRADA_CONCILIADA',
    },
  },
];

export const BillingPipelineSimulator: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev >= 5 ? 1 : prev + 1));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentStage = PIPELINE_STAGES[activeStep - 1];

  const getStepIcon = (id: number) => {
    switch (id) {
      case 1:
        return <FileText className="w-4 h-4" />;
      case 2:
        return <CheckCircle2 className="w-4 h-4" />;
      case 3:
        return <ShieldAlert className="w-4 h-4" />;
      case 4:
        return <Database className="w-4 h-4" />;
      case 5:
        return <Landmark className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-clave-border-light rounded-lg p-3 justify-between shadow-xs">
      {/* Top Stepper Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 px-3 shadow-2xs">
        <div className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-between">
          {PIPELINE_STAGES.map((stage) => {
            const isCurrent = stage.id === activeStep;
            const isCompleted = stage.id < activeStep;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStep(stage.id);
                  setIsPlaying(false);
                }}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-all text-left ${
                  isCurrent
                    ? 'bg-clave-green text-white shadow-xs font-semibold'
                    : isCompleted
                    ? 'bg-clave-green-soft text-clave-green hover:bg-emerald-100 font-medium'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-clave-gold text-clave-navy'
                      : isCompleted
                      ? 'bg-clave-green text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {stage.id}
                </div>
                <span className="text-[11px] font-heading hidden lg:inline">
                  {stage.key.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Play/Pause & Nav Controls */}
        <div className="flex items-center space-x-1.5 ml-3 pl-3 border-l border-slate-200">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep <= 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
            title="Etapa anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
              isPlaying
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
            title="Auto-reproducir etapas del pipeline"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-amber-700" />
                <span>Pausa</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-clave-green" />
                <span>Auto</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
            disabled={activeStep >= 5}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
            title="Siguiente etapa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Viewer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="my-2 p-3 bg-white border border-slate-200 rounded-lg flex-1 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-md bg-clave-platinum text-clave-green">
                {getStepIcon(currentStage.id)}
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-clave-navy">
                  {currentStage.title}
                </h4>
                <p className="text-[11px] text-slate-500">{currentStage.subtitle}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-clave-gold-light border border-clave-gold/40 text-clave-gold-dark font-mono font-bold text-[10.5px]">
              {currentStage.badge}
            </span>
          </div>

          <p className="text-xs text-slate-700 py-2 leading-relaxed font-body">
            {currentStage.description}
          </p>

          {/* Payload Data Table Preview */}
          <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-hidden">
            <div className="text-[9.5px] uppercase tracking-wider text-clave-gold font-bold mb-1">
              PAYLOAD DE PROCESAMIENTO · FASE {currentStage.id} DE 5
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(currentStage.payloadPreview).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-slate-400">{k}:</span>
                  <span className="font-semibold text-emerald-400 truncate max-w-[200px]">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Governance Footer Callout */}
      <div className="p-2 px-3 bg-clave-navy text-white rounded text-[11px] flex items-center justify-between font-mono">
        <span className="text-slate-300">
          Auditoría de Trazabilidad: Hash SHA-256 inmutable en cada transición
        </span>
        <span className="text-clave-gold font-bold">100% AUDITABLE ISO 9001</span>
      </div>
    </div>
  );
};
