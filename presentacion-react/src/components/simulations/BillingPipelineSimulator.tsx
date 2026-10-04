import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronRight, ChevronLeft, Mail, FileSearch, ShieldCheck, Database, Landmark } from 'lucide-react';

export interface PipelineStage {
  id: number;
  title: string;
  shortTitle: string;
  badge: string;
  summary: string;
  input: string;
  systemAction: string;
  businessBenefit: string;
  badgeColor: string;
  headerColor: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 1,
    title: 'Recepción de Facturas',
    shortTitle: '1. Ingesta',
    badge: 'Email o PDF',
    summary: 'Llega la factura por correo o subida manual directa.',
    input: 'PDF original de naviera (ej. Maersk, Hapag-Lloyd) o transporte terrestre.',
    systemAction: 'Ingresa el archivo, verifica que no esté cargado previamente y lo asigna a la bandeja de trabajo.',
    businessBenefit: 'Centraliza todas las facturas en una sola pantalla, terminando con los comprobantes perdidos en casillas individuales.',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    headerColor: 'border-t-4 border-blue-600',
  },
  {
    id: 2,
    title: 'Lectura y Desglose',
    shortTitle: '2. Lectura IA',
    badge: 'Procesamiento en 5s',
    summary: 'Extracción de CUIT, importes y alícuotas fiscales para AFIP.',
    input: 'Comprobante comercial con múltiples ítems, monedas y recargos.',
    systemAction: 'Distingue automáticamente el flete internacional exento del recargo de combustible (BUFF), aplicando la regla fiscal correcta.',
    businessBenefit: 'Elimina el tipeo manual campo por campo y evita multas de AFIP por codificación incorrecta de ítems navieros.',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    headerColor: 'border-t-4 border-emerald-600',
  },
  {
    id: 3,
    title: 'Control de Costos y Margen',
    shortTitle: '3. Control Margen',
    badge: 'Cruce vs Cotización',
    summary: 'Comparación contra lo presupuestado en la carpeta de Kipintoch.',
    input: 'Valores extraídos de la factura cruzados con la cotización original del cliente.',
    systemAction: 'Detecta si la naviera cobró de más. Si el margen de ganancia cae por debajo de USD 200, detiene la emisión y solicita visto bueno gerencial.',
    businessBenefit: 'Protege la rentabilidad de ALMAR: ningún sobrecosto naviero imprevisto se paga sin previa autorización formal.',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    headerColor: 'border-t-4 border-amber-600',
  },
  {
    id: 4,
    title: 'Carga Asistida a Kipintoch',
    shortTitle: '4. Kipintoch',
    badge: '1 Clic · 15 Segundos',
    summary: 'Generación estructurada lista para copiar y asentar en el ERP.',
    input: 'Ficha estructurada con proveedor, carpeta, fecha, importes y cuentas contables.',
    systemAction: 'Ordena los 5 campos canónicos de Kipintoch para copiarlos al portapapeles con un solo clic.',
    businessBenefit: 'Stefania pasa de tardar 12 minutos por comprobante a solo 15 segundos, ahorrando $6.000.000 al año en licencias de conectores.',
    badgeColor: 'bg-emerald-50 text-clave-green border-emerald-300',
    headerColor: 'border-t-4 border-clave-green',
  },
  {
    id: 5,
    title: 'Conciliación Bancaria (Banco Macro)',
    shortTitle: '5. Banco Macro',
    badge: 'Extracto en Cta Cte',
    summary: 'Confirmación del cobro en cuenta bancaria antes del cierre.',
    input: 'Extracto de cuenta corriente Nº 376100000930617 en Banco Macro.',
    systemAction: 'Valida que el dinero de la cobranza esté efectivamente acreditado en el extracto antes de habilitar el recibo oficial o comisiones.',
    businessBenefit: 'Certeza contable y de caja: la operación se da por cancelada únicamente con los fondos confirmados en la cuenta.',
    badgeColor: 'bg-slate-100 text-clave-navy border-slate-300',
    headerColor: 'border-t-4 border-clave-navy',
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
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentStage = PIPELINE_STAGES[activeStep - 1];

  const getStepIcon = (id: number, className: string = 'w-4 h-4') => {
    switch (id) {
      case 1:
        return <Mail className={className} />;
      case 2:
        return <FileSearch className={className} />;
      case 3:
        return <ShieldCheck className={className} />;
      case 4:
        return <Database className={className} />;
      case 5:
        return <Landmark className={className} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full justify-between gap-2.5">
      {/* Barra Superior con Controles de Simulación */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="font-heading font-bold text-xs text-clave-green uppercase tracking-wider">
            Circuito Completo de Facturación:
          </span>
          <span className="text-[11.5px] text-slate-500 font-medium">
            5 pasos continuos desde que ingresa el PDF hasta que se concilia en el banco.
          </span>
        </div>

        {/* Controles de Simulación Paso a Paso */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep <= 1}
            className="p-1 rounded hover:bg-white border border-slate-200 disabled:opacity-30 text-slate-600 transition-colors"
            title="Etapa anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-heading font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white text-clave-green hover:bg-slate-100 border border-slate-300 shadow-2xs'
            }`}
            title="Reproducir avance automático del circuito"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-amber-700" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-clave-green" />
                <span>Simular Recorrido</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
            disabled={activeStep >= 5}
            className="p-1 rounded hover:bg-white border border-slate-200 disabled:opacity-30 text-slate-600 transition-colors"
            title="Siguiente etapa"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grilla Panorámica de las 5 Etapas en Paralelo */}
      <div className="grid grid-cols-5 gap-2">
        {PIPELINE_STAGES.map((stage) => {
          const isCurrent = stage.id === activeStep;
          return (
            <button
              key={stage.id}
              onClick={() => {
                setActiveStep(stage.id);
                setIsPlaying(false);
              }}
              className={`text-left p-2.5 rounded-lg border transition-all duration-200 flex flex-col justify-between h-[155px] relative ${stage.headerColor} ${
                isCurrent
                  ? 'bg-white border-clave-gold shadow-md ring-2 ring-clave-gold/40 -translate-y-0.5'
                  : 'bg-slate-50/80 hover:bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div>
                {/* Cabecera de tarjeta */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                        isCurrent
                          ? 'bg-clave-gold text-clave-navy'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {stage.id}
                    </span>
                    <span className="text-[10px] font-heading font-bold text-slate-400 uppercase">
                      FASE {stage.id}
                    </span>
                  </div>
                  {getStepIcon(stage.id, `w-3.5 h-3.5 ${isCurrent ? 'text-clave-green' : 'text-slate-400'}`)}
                </div>

                {/* Título de etapa */}
                <h4 className="font-heading font-bold text-xs text-clave-navy leading-snug mb-1">
                  {stage.title}
                </h4>

                {/* Resumen operativo */}
                <p className="text-[11px] text-slate-600 leading-snug line-clamp-3">
                  {stage.summary}
                </p>
              </div>

              {/* Pastilla inferior */}
              <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded border ${stage.badgeColor}`}>
                  {stage.badge}
                </span>
                {isCurrent && (
                  <span className="text-[9px] font-heading font-bold text-clave-gold-dark uppercase tracking-wider">
                    Activa
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Ficha Ejecutiva de Detalle de la Etapa Seleccionada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs"
        >
          {/* Título de la Ficha */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-clave-green-soft text-clave-green">
                {getStepIcon(currentStage.id, 'w-4 h-4')}
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-clave-gold-dark uppercase tracking-wider">
                  Detalle Operativo · Etapa {currentStage.id} de 5
                </span>
                <h4 className="font-heading font-bold text-sm text-clave-green leading-none">
                  {currentStage.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Hacé clic en cualquier etapa o usá los botones para recorrer el circuito</span>
            </div>
          </div>

          {/* Tres Bloques Claros: Entrada -> Qué hace -> Beneficio para ALMAR */}
          <div className="grid grid-cols-3 gap-3">
            {/* 1. Qué entra */}
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  1. Entrada al Sistema
                </span>
                <p className="text-[11.5px] text-slate-700 leading-snug">
                  {currentStage.input}
                </p>
              </div>
            </div>

            {/* 2. Qué hace el sistema */}
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-heading font-bold text-clave-green uppercase tracking-wide block mb-1">
                  2. Automatización Realizada
                </span>
                <p className="text-[11.5px] text-slate-700 leading-snug">
                  {currentStage.systemAction}
                </p>
              </div>
            </div>

            {/* 3. Beneficio para ALMAR */}
            <div className="p-2.5 rounded-md bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-heading font-bold text-amber-900 uppercase tracking-wide block mb-1">
                  3. Impacto en ALMAR
                </span>
                <p className="text-[11.5px] text-slate-800 leading-snug font-medium">
                  {currentStage.businessBenefit}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Barra Inferior de Métricas y Control Operativo */}
      <div className="bg-slate-100/90 border border-slate-200 rounded-lg p-2 px-3 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-sm">⏱️</span>
          <div>
            <strong className="text-clave-green text-[11px] block">De 12 min a 15 segundos</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Carga en Kipintoch sin tipeo manual.</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm">🛡️</span>
          <div>
            <strong className="text-amber-800 text-[11px] block">Control de sobrecostos</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Alerta si la naviera cobró más de lo cotizado.</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm">🏦</span>
          <div>
            <strong className="text-clave-navy text-[11px] block">Cobranza en Banco Macro</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Cierre de carpeta respaldado por extracto en cuenta.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
