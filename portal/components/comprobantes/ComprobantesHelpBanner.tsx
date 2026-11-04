'use client';

import * as React from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Inbox,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export interface ComprobantesHelpBannerProps {
  defaultOpen?: boolean;
  className?: string;
}

export function ComprobantesHelpBanner({
  defaultOpen = true,
  className = '',
}: ComprobantesHelpBannerProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(defaultOpen);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, []);

  return (
    <div
      className={`comprobantes-help-banner bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-xs transition-all ${className}`}
      data-testid="comprobantes-help-banner"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-50 text-[#0072BC] border border-sky-200 shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>Guía Operativa: Flujo de Comprobantes a Kipintoch</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-sky-50 text-[#0072BC] border border-sky-200 font-mono font-semibold">
                Paso a Paso
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              Conocé cómo clasificar, validar desvíos y asentar comprobantes en el sistema ERP en 4 pasos sencillos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200"
          aria-expanded={isOpen}
          aria-label="Alternar guía de ayuda"
          data-testid="toggle-help-banner"
        >
          <span>{isOpen ? 'Ocultar Guía' : '¿Cómo usar el tablero?'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div
          className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in fade-in-0 duration-200"
          data-testid="help-banner-content"
        >
          {/* 4 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-sky-50/50 border border-sky-200 space-y-1">
              <div className="text-xs font-bold text-[#0072BC] flex items-center gap-1.5">
                <Inbox className="h-4 w-4" />
                <span>1. Ingesta (Mails o Manual)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Llegan automáticamente desde emails o podés registrarlas con <strong>&ldquo;+ Nuevo Comprobante&rdquo;</strong> (ventanilla, WhatsApp, remitos papel).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-sky-50/50 border border-sky-200 space-y-1">
              <div className="text-xs font-bold text-[#0072BC] flex items-center gap-1.5">
                <FileCheck className="h-4 w-4" />
                <span>2. Listas Kipintoch</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Comprobantes con carpeta y monto coincidente. Hacé clic en <strong>&ldquo;Copiar para Kipintoch&rdquo;</strong> y pegalo directamente con Ctrl+V.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1">
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>3. Desvíos &amp; Edición OCR</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Si supera la cotización o el PDF vino borroso, usá <strong>&ldquo;✏️ Corregir OCR&rdquo;</strong> o <strong>&ldquo;Descartar&rdquo;</strong> con registro auditable.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1">
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>4. Asentadas en ERP</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Comprobantes ya cargados y asentados en Kipintoch ERP. La operación queda finalizada y registrada.
              </p>
            </div>
          </div>

          {/* Operational Tips & Shortcuts Footer */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Atajo Rápido:</strong> El botón de acción copia en 1 clic el formato para Kipintoch:{' '}
                <code className="px-1.5 py-0.5 rounded bg-white text-[#0072BC] font-mono text-[11px] border border-slate-200">
                  [Gasto] [CUIT] [Monto] [Moneda] [Carpeta]
                </code>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-[#0072BC] shrink-0" />
              <span>
                ¿Dudas con un remito o flete? Usá el <strong>Copilot IA en la barra superior (Ctrl+J)</strong> para reportar una incidencia en 5 segundos.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
