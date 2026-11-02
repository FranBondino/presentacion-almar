'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Calculator,
  Clock,
  Info,
  Ruler,
  Ship,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { canAccessMulticotizador } from '@/lib/auth';
import { useAuth } from '@/components/auth/RoleGuard';
import { CotizacionesTable } from '@/components/cotizaciones/CotizacionesTable';
import { SmartFollowUpPanel } from '@/components/cotizaciones/SmartFollowUpPanel';
import { CalculadoraModal } from '@/components/cotizaciones/CalculadoraModal';
import { CubicajeInteligenteModal } from '@/components/cotizaciones/CubicajeInteligenteModal';
import { BultoItem, CotizacionRecord, FeedbackComercialRegistro } from '@/types/cotizaciones';

export default function CotizacionesPage() {
  const { role } = useAuth();
  const [cotizaciones, setCotizaciones] = React.useState<CotizacionRecord[]>([]);
  const [isCalculadoraOpen, setIsCalculadoraOpen] = React.useState(false);
  const [isCubicajeOpen, setIsCubicajeOpen] = React.useState(false);
  const [calculadoraBultos, setCalculadoraBultos] = React.useState<BultoItem[] | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    let cancelled = false;
    fetch('/api/cotizaciones')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.success || !Array.isArray(json.data)) return;
        setCotizaciones(json.data as CotizacionRecord[]);
      })
      .catch(() => {
        // Keep initial state on offline/test mode
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCotizaciones = cotizaciones.length;
  const totalGanadas = cotizaciones.filter((c) => c.estado === 'GANADA').length;
  const totalRequiereFollowUp = cotizaciones.filter((c) => {
    if (c.estado !== 'REQUIERE_SEGUIMIENTO' || c.followUpEnviado) return false;
    const hrs =
      typeof c.horasDesdeEmision === 'number' && c.horasDesdeEmision > 0
        ? c.horasDesdeEmision
        : c.fechaEmision
          ? Math.round((Date.now() - new Date(c.fechaEmision).getTime()) / 3600000)
          : 48;
    return hrs >= 48;
  }).length;
  const volumenTotalUsd = Math.round(
    cotizaciones.reduce((acc, c) => acc + (c.fleteVentaUsd || 0), 0)
  );
  const avgCotizacionUsd =
    totalCotizaciones > 0 ? Math.round(volumenTotalUsd / totalCotizaciones) : 0;
  const porcentajeGanadas =
    totalCotizaciones > 0 ? ((totalGanadas / totalCotizaciones) * 100).toFixed(1) : '0.0';
  const porcentajeFollowUp =
    totalCotizaciones > 0 ? ((totalRequiereFollowUp / totalCotizaciones) * 100).toFixed(1) : '0.0';

  const handleFollowUpSent = (cotId: string) => {
    const nowIso = new Date().toISOString();
    setCotizaciones((prev) =>
      prev.map((c) =>
        c.id === cotId
          ? {
              ...c,
              estado: 'COTIZADA',
              followUpEnviado: true,
              ultimoContactoFecha: nowIso,
            }
          : c
      )
    );

    if (typeof fetch !== 'undefined') {
      void fetch(`/api/cotizaciones/${encodeURIComponent(cotId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'COTIZADA',
          followUpEnviado: true,
          ultimoContactoFecha: nowIso,
        }),
      }).catch(() => {});
    }
  };

  const handleUpdateFeedback = (
    cotId: string,
    feedback: string,
    registro?: FeedbackComercialRegistro
  ) => {
    setCotizaciones((prev) =>
      prev.map((c) =>
        c.id === cotId
          ? {
              ...c,
              feedbackComercial: feedback,
              feedbackRegistro: registro,
            }
          : c
      )
    );

    if (typeof fetch !== 'undefined') {
      void fetch(`/api/cotizaciones/${encodeURIComponent(cotId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackComercial: feedback,
          feedbackRegistro: registro,
        }),
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div id="cotizaciones-header" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-[#0072BC]" />
              <span>Gestión Comercial &amp; Cotizaciones de Flete</span>
            </h1>
            {role === 'COMERCIAL' && (
              <Badge variant="warning" className="text-xs font-semibold py-0.5">
                Cartera Activa (Lucía Laje)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Registro y seguimiento comercial de cotizaciones: base tarifaria acordada con clientes, calculadora de flete y control de vigencias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canAccessMulticotizador(role) && (
            <Link href="/cotizaciones/multicotizador" id="multicotizador-navieras-btn">
              <Button
                type="button"
                className="gap-1.5 text-xs bg-[#081433] hover:bg-slate-800 text-white shadow-xs font-semibold cursor-pointer"
              >
                <Ship className="h-3.5 w-3.5 text-sky-400" />
                <span>Multicotizador FCL Navieras</span>
              </Button>
            </Link>
          )}
          <Button
            id="asistente-cubicaje-btn"
            variant="outline"
            onClick={() => setIsCubicajeOpen(true)}
            className="gap-1.5 text-xs border-sky-300 bg-sky-50 text-[#0072BC] hover:bg-sky-100 shadow-2xs font-semibold cursor-pointer"
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>📐 Calcular m³ desde Mail/Doc (IA)</span>
          </Button>
          <Button
            id="asistente-calculos-btn"
            onClick={() => {
              setCalculadoraBultos(undefined);
              setIsCalculadoraOpen(true);
            }}
            className="gap-1.5 text-xs bg-[#0072BC] hover:bg-[#005d99] text-white shadow-xs font-semibold cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Calculadora LCL / Aéreo</span>
          </Button>
        </div>
      </div>

      {/* Non-commercial / Non-pricing Mode Banner */}
      {!canAccessMulticotizador(role) && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 flex items-center justify-between shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <Info className="h-4 w-4 text-[#0072BC] shrink-0" />
            <div>
              <span className="font-bold">Modo Consulta de Base Tarifaria Comercial</span>
              <span className="text-sky-700 ml-1.5 hidden sm:inline">
                | Visualización de acuerdos tarifarios de referencia. Emisión y Multicotizador reservados para Comercial y Dirección.
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-sky-300 text-sky-800 bg-white text-[10px] shrink-0">
            Solo Consulta
          </Badge>
        </div>
      )}

      {/* KPI Cards Row */}
      <div id="cotizaciones-kpi-row" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Total Cotizaciones Auditadas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-900">{totalCotizaciones.toLocaleString('es-AR')}</span>
            <span className="text-[11px] font-semibold text-[#0072BC]">{totalCotizaciones} Cotizaciones</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cartera Comercial Front-Office</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Fletes en Operación (Ganadas)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-700">{totalGanadas.toLocaleString('es-AR')}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {porcentajeGanadas}% Cierre
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Convertidas en carpetas operativas</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 bg-amber-50/30 shadow-2xs">
          <span className="text-amber-800 text-xs font-semibold block flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Requieren Follow-Up (&gt;48hs)</span>
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-1 mt-1">
            <span className="text-xl font-bold text-amber-900">{totalRequiereFollowUp.toLocaleString('es-AR')}</span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
              {porcentajeFollowUp}% Sin respuesta (&gt;48hs)
            </span>
          </div>
          <span className="text-[10px] text-amber-700/80 mt-1 block">Seguimiento comercial activo</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Monto Total Presupuestado</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-900">USD {(volumenTotalUsd / 1_000_000).toFixed(2)}M</span>
            <span className="text-[11px] font-semibold text-slate-600">Avg USD {avgCotizacionUsd.toLocaleString('es-AR')}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Base para auditar desvíos de navieras</span>
        </div>
      </div>

      {/* Smart Follow-Up Panel (Alarma de Ventas) */}
      <div id="smart-followup-panel">
        <SmartFollowUpPanel
          cotizaciones={cotizaciones}
          onFollowUpSent={handleFollowUpSent}
        />
      </div>

      {/* Main Cotizaciones Table */}
      <div id="cotizaciones-table">
        <CotizacionesTable
          cotizaciones={cotizaciones}
          onOpenCalculadora={() => {
            setCalculadoraBultos(undefined);
            setIsCalculadoraOpen(true);
          }}
          onOpenCalculadoraWithBultos={(bultos) => {
            setCalculadoraBultos(bultos);
            setIsCalculadoraOpen(true);
          }}
          onOpenCubicajeModal={() => setIsCubicajeOpen(true)}
          onUpdateFeedback={handleUpdateFeedback}
          userRole={role ?? undefined}
        />
      </div>

      {/* Modal Inteligente de Cubicaje (CBM) & Peso Tasable (Milestone 2 - Pedido Lucía Laje) */}
      <CubicajeInteligenteModal
        isOpen={isCubicajeOpen}
        onClose={() => setIsCubicajeOpen(false)}
        onApplyToCalculadora={(bultos) => {
          setIsCubicajeOpen(false);
          setCalculadoraBultos(bultos);
          setIsCalculadoraOpen(true);
        }}
      />

      {/* Modal Asistente de Cálculos */}
      <CalculadoraModal
        isOpen={isCalculadoraOpen}
        onClose={() => setIsCalculadoraOpen(false)}
        initialBultos={calculadoraBultos}
      />
    </div>
  );
}
