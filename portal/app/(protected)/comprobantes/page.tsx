'use client';

import * as React from 'react';
import { ComprobantesViewContainer } from '@/components/comprobantes/ComprobantesViewContainer';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComprobantesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#0072BC]" />
            <span>Comprobantes, Facturación de Venta &amp; Cobranzas</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            1) <strong>Operaciones:</strong> Control de costos y sobrecostos de proveedores contra cotización · 2) <strong>Administración &amp; Finanzas:</strong> Emisión de Factura de Venta con trazabilidad completa y Cobranzas (Banco Macro / Kipintoch).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <Download className="h-3.5 w-3.5 text-[#0072BC]" />
            <span>Exportar Excel</span>
          </Button>
        </div>
      </div>

      {/* Comprobantes Root View Container (Kanban / Table Switcher) */}
      <React.Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg shadow-xs">
            Cargando tablero y comprobantes...
          </div>
        }
      >
        <ComprobantesViewContainer />
      </React.Suspense>
    </div>
  );
}
