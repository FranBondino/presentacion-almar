'use client';

import * as React from 'react';
import {
  Calculator,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Plane,
  Ship,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Percent,
  Wand2,
  Upload,
  FileText,
  Download,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BultoItem,
  CalculoLogisticoInput,
  PerfilRentabilidad,
  CotizacionRecord,
  DocumentoCubicajeAdjunto,
} from '@/types/cotizaciones';
import {
  CONFIG_PERFILES_RENTABILIDAD,
  ejecutarCalculoLogistico,
} from '@/lib/calculadora-logistica';
import {
  parseCargoDimensionsFromText,
  convertirCargoItemsABultos,
  extraerTextoYMedidasDesdeDocumento,
} from '@/lib/calculadora-cubicaje';
import { useToast } from '@/components/ui/ToastProvider';

interface CalculadoraModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCliente?: string;
  initialOrigen?: string;
  initialDestino?: string;
  initialBultos?: BultoItem[];
  initialDocumentos?: DocumentoCubicajeAdjunto[];
  onCotizacionCreated?: (cotizacion: CotizacionRecord) => void;
}

export function CalculadoraModal({
  isOpen,
  onClose,
  initialCliente = 'Industrias Juan F. Secco S.A.',
  initialOrigen = 'Shanghai, China',
  initialDestino = 'Puerto Buenos Aires / Rosario',
  initialBultos,
  initialDocumentos,
  onCotizacionCreated,
}: CalculadoraModalProps) {
  const { toast } = useToast();
  const [copiedDraft, setCopiedDraft] = React.useState(false);
  const [quickPasteText, setQuickPasteText] = React.useState('');
  const [documentosAdjuntos, setDocumentosAdjuntos] = React.useState<DocumentoCubicajeAdjunto[]>(
    initialDocumentos ?? []
  );
  const calcFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form State
  const [clienteNombre, setClienteNombre] = React.useState(initialCliente);
  const [origen, setOrigen] = React.useState(initialOrigen);
  const [destino, setDestino] = React.useState(initialDestino);
  const [incoterm, setIncoterm] = React.useState<'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF'>('FOB');
  const [diasLibres, setDiasLibres] = React.useState<number>(14);
  const [valorMercaderiaUsd, setValorMercaderiaUsd] = React.useState<number>(15000);
  const [vigenciaDias, setVigenciaDias] = React.useState<number>(15);

  // Commercial Profile & Dynamic Markup State
  const [perfilRentabilidad, setPerfilRentabilidad] = React.useState<PerfilRentabilidad>('ESTANDAR');
  const [markupPersonalizadoPct, setMarkupPersonalizadoPct] = React.useState<number>(15.0);

  // Date of Naviera Rate (defaults to today)
  const [fechaTarifaNaviera, setFechaTarifaNaviera] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Packages State
  const [bultos, setBultos] = React.useState<BultoItem[]>(() => {
    if (initialBultos && initialBultos.length > 0) return initialBultos;
    return [
      {
        id: 'b-1',
        cantidad: 3,
        tipo: 'pallet',
        largoCm: 120,
        anchoCm: 80,
        altoCm: 140,
        pesoUnitarioKg: 420,
      },
    ];
  });

  React.useEffect(() => {
    if (initialBultos && initialBultos.length > 0) {
      setBultos(initialBultos);
    }
  }, [initialBultos]);

  React.useEffect(() => {
    if (initialDocumentos && initialDocumentos.length > 0) {
      setDocumentosAdjuntos(initialDocumentos);
    }
  }, [initialDocumentos]);

  // Global Escape key listener to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;
    const parsed = parseCargoDimensionsFromText(quickPasteText);
    if (parsed.length > 0) {
      const converted = convertirCargoItemsABultos(parsed);
      setBultos(converted);
      toast.success(
        'Medidas Parseadas (IA)',
        `Se interpretaron ${converted.length} líneas de bultos (${converted.reduce((acc, b) => acc + b.cantidad, 0)} bultos en total).`
      );
    } else {
      toast.warning('Sin Coincidencias', 'No se detectaron dimensiones válidas en el texto.');
    }
  };

  const handleProcessCalcFile = async (file: File) => {
    try {
      const rawText = await file.text();
      const { textoExtraido, resumen: docResumen, documento } = extraerTextoYMedidasDesdeDocumento({
        fileName: file.name,
        rawContent: rawText,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      });

      let previewUrl: string | undefined;
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        previewUrl = URL.createObjectURL(file);
      }

      const nuevoDoc: DocumentoCubicajeAdjunto = {
        ...documento,
        previewUrl,
      };

      setDocumentosAdjuntos((prev) => [nuevoDoc, ...prev]);
      setQuickPasteText(textoExtraido);
      if (docResumen.items.length > 0) {
        setBultos(convertirCargoItemsABultos(docResumen.items));
      }

      toast.success(
        'Documento Adjuntado y Procesado',
        `Se cargó "${file.name}" (${docResumen.cantidadBultosTotal} bultos · ${docResumen.volumenTotalM3.toFixed(2)} m³).`
      );
    } catch {
      toast.error('Error al leer archivo', `No se pudo procesar el archivo ${file.name}.`);
    }
  };

  const handleCalcFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f) await handleProcessCalcFile(f);
    }
    e.target.value = '';
  };

  const handleLoadSampleCalcDoc = () => {
    const sampleCsv = [
      'CANTIDAD;TIPO;LARGO_CM;ANCHO_CM;ALTO_CM;PESO_TOTAL_KG',
      '4;caja;80;60;55;180',
      '2;caja;100;75;65;130',
    ].join('\n');
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const file = new File([blob], 'Packing_List_Copa_ROS_Ejemplo.csv', { type: 'text/csv' });
    void handleProcessCalcFile(file);
  };

  const handleDesarmarPalletParaCopa = () => {
    setBultos((prev) => {
      const next: BultoItem[] = [];
      prev.forEach((b, idx) => {
        if (b.altoCm > 82 || b.pesoUnitarioKg > 80 || b.largoCm > 122 || b.anchoCm > 102) {
          const totalKg = b.cantidad * b.pesoUnitarioKg;
          const totalM3 = (b.cantidad * b.largoCm * b.anchoCm * b.altoCm) / 1_000_000;
          const numCajas = Math.max(
            b.cantidad * 2,
            Math.ceil(totalKg / 65),
            Math.ceil(totalM3 / (0.8 * 0.6 * 0.65))
          );
          const pesoUnitNuevo = Math.round((totalKg / numCajas) * 10) / 10;
          const volUnitM3 = totalM3 / numCajas;
          const altoNuevoCm = Math.min(78, Math.max(35, Math.round((volUnitM3 / (0.8 * 0.6)) * 100)));
          next.push({
            id: `b-copa-unp-${idx}-${Date.now()}`,
            cantidad: numCajas,
            tipo: 'caja',
            largoCm: 80,
            anchoCm: 60,
            altoCm: altoNuevoCm,
            pesoUnitarioKg: pesoUnitNuevo,
          });
        } else {
          next.push(b);
        }
      });
      return next;
    });
    toast.success(
      'Bultos adaptados a Gálibo Copa Airlines',
      'Se simularon cajas sueltas (<= 80 cm alto y <= 80 kg/bulto) manteniendo el peso y volumen total.'
    );
  };

  const handleAddBulto = () => {
    setBultos((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        cantidad: 1,
        tipo: 'caja',
        largoCm: 60,
        anchoCm: 40,
        altoCm: 40,
        pesoUnitarioKg: 25,
      },
    ]);
  };

  const handleRemoveBulto = (id: string) => {
    if (bultos.length > 1) {
      setBultos((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleUpdateBulto = (id: string, field: keyof BultoItem, value: BultoItem[keyof BultoItem]) => {
    setBultos((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // Perform Calculation with Commercial Engine
  const resultado = React.useMemo(() => {
    const input: CalculoLogisticoInput = {
      clienteNombre,
      origen,
      destino,
      incoterm,
      bultos,
      valorMercaderiaFobUsd: valorMercaderiaUsd,
      diasLibresDemoras: diasLibres,
      perfilRentabilidad,
      markupPersonalizadoPct: perfilRentabilidad === 'PERSONALIZADO' ? markupPersonalizadoPct : undefined,
      vigenciaDias,
      fechaTarifaNaviera,
    };
    return ejecutarCalculoLogistico(input);
  }, [
    clienteNombre,
    origen,
    destino,
    incoterm,
    bultos,
    valorMercaderiaUsd,
    diasLibres,
    perfilRentabilidad,
    markupPersonalizadoPct,
    vigenciaDias,
    fechaTarifaNaviera,
  ]);

  // Validity Evaluation
  const vigencia = resultado.evaluacionVigencia;
  const isTarifaVencida = vigencia ? vigencia.esVencida : false;
  const fechaVencimientoFormateada = React.useMemo(() => {
    if (vigencia?.fechaVencimiento) {
      const d = new Date(vigencia.fechaVencimiento);
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const d = new Date();
    d.setDate(d.getDate() + vigenciaDias);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [vigencia?.fechaVencimiento, vigenciaDias]);

  // Two-tier Margin Governance
  // Tier 1: Strict Blocking (< USD 3.00, BLOQUEADA_RENTABILIDAD_NEGATIVA)
  const isMarginBlocked = Boolean(
    resultado.rentabilidadMaritima?.esBloqueante || resultado.rentabilidadAerea?.esBloqueante
  );

  // Tier 2: Yellow Preventive Alert (< USD 200 - Directiva Vanesa Meggiolaro)
  const isMarginPreventivo = Boolean(
    !isMarginBlocked &&
    (resultado.rentabilidadMaritima?.esAlertaPreventiva || resultado.rentabilidadAerea?.esAlertaPreventiva)
  );

  const perfilActual = CONFIG_PERFILES_RENTABILIDAD[perfilRentabilidad] || CONFIG_PERFILES_RENTABILIDAD.ESTANDAR;
  const markupActivo = perfilRentabilidad === 'PERSONALIZADO' ? markupPersonalizadoPct : perfilActual.markupDefault;

  // Commercial Draft text
  const borradorFinal = React.useMemo(() => {
    const copaNote = resultado.aptitudCopa
      ? `\n\n✈️ Validación Bodega Copa Airlines (Ruta PTY ➔ ROS · B737): ${resultado.aptitudCopa.tituloEstado}\n   • ${resultado.aptitudCopa.recomendacionComercial}`
      : '';
    let notaAdicional = `\n\n⚠️ Nota de Vigencia (Control Comercial ALMAR): Oferta válida por ${vigenciaDias} días corridos (vencimiento: ${fechaVencimientoFormateada}). Luego de esta fecha, las tarifas quedan sujetas a revalidación con el transportista.`;
    if (isTarifaVencida) {
      notaAdicional = `\n\n⛔ ATENCIÓN: TARIFA CADUCADA (Venció el ${fechaVencimientoFormateada}). Requiere re-cotización mandatoria con la naviera antes de confirmar booking.`;
    }
    return `${resultado.borradorCorreoCliente}${copaNote}${notaAdicional}`;
  }, [resultado.borradorCorreoCliente, resultado.aptitudCopa, vigenciaDias, fechaVencimientoFormateada, isTarifaVencida]);

  const canCopy = !isMarginBlocked && !isTarifaVencida;

  const handleCopyDraft = async () => {
    if (isMarginBlocked) {
      toast.error(
        'Bloqueo Estricto de Rentabilidad',
        'Margen comercial inferior a USD 3.00 (BLOQUEADA_RENTABILIDAD_NEGATIVA). Requiere autorización formal de Gerencia.'
      );
      return;
    }
    if (isTarifaVencida) {
      toast.error(
        'Tarifa Caducada',
        'No se puede emitir propuesta comercial con tarifas vencidas. Revalide costos con el transportista.'
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(borradorFinal);
      setCopiedDraft(true);
      toast.success(
        '¡Borrador copiado!',
        'El correo con las opciones cotizadas y desglose de flete está listo en el portapapeles para pegar en Gmail.'
      );
      setTimeout(() => setCopiedDraft(false), 2500);
    } catch {
      toast.error('Error', 'No se pudo copiar el texto al portapapeles.');
    }
  };

  const [isSavingCotizacion, setIsSavingCotizacion] = React.useState(false);

  const handleGuardarCotizacion = async () => {
    if (isMarginBlocked) {
      toast.error('Bloqueo de Rentabilidad', 'No se puede emitir una cotización con margen negativo (< USD 3.00).');
      return;
    }
    if (isTarifaVencida) {
      toast.error('Tarifa Caducada', 'No se puede emitir con tarifa naviera vencida.');
      return;
    }

    setIsSavingCotizacion(true);
    try {
      const payload = {
        clienteNombre,
        origen,
        destino,
        incoterm,
        via: resultado.volumenTotalM3 > 15 ? 'MARITIMO_FCL' : 'MARITIMO_LCL',
        fleteVentaUsd: Math.round(resultado.totalMaritimoLclEstimadoUsd || 1200),
        fleteCostoEstimadoUsd: Math.round(resultado.costoFleteMaritimoSugeridoUsd || 950),
        diasLibresDemora: diasLibres,
        cbmTotal: Math.round(resultado.volumenTotalM3 * 100) / 100,
        pesoBrutoKg: Math.round(resultado.pesoBrutoTotalKg * 10) / 10,
        pesoTasableKg: Math.round(resultado.pesoTasableAereoKg * 10) / 10,
        volumenTasableLclM3: Math.round(resultado.volumenTasableLclM3 * 100) / 100,
        cantidadBultos: resultado.cantidadBultosTotal,
        sugerenciaEquipo:
          resultado.volumenTotalM3 > 15
            ? "Contenedor 40' HC"
            : resultado.volumenTotalM3 > 5
            ? "Contenedor 20' Standard"
            : 'Consolidado LCL (W/M)',
        resumenCubicaje: `${resultado.cantidadBultosTotal} bultos | ${resultado.pesoBrutoTotalKg.toFixed(1)} kg | ${resultado.volumenTotalM3.toFixed(2)} m³ | Copa: ${resultado.aptitudCopa?.estado || 'APTA'}`,
        bultos: bultos,
        bultosDetalle: bultos,
        documentosAdjuntos: documentosAdjuntos,
        notasComerciales: borradorFinal,
        statusKipintoch: 'Pendiente',
        estado: 'COTIZADA',
      };

      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const createdCot = json.data;
        toast.success(
          'Cotización emitida y persistida',
          `Cotización ${createdCot.numeroCotizacion || createdCot.id} creada exitosamente con cubicaje.`
        );
        onCotizacionCreated?.(createdCot);
        onClose();
      } else {
        const errJson = await res.json().catch(() => null);
        toast.error('Error al emitir', errJson?.error || 'No se pudo guardar la cotización.');
      }
    } catch {
      toast.error('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setIsSavingCotizacion(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      data-testid="calculadora-modal"
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0072BC]/30 text-sky-300 border border-[#0072BC]/40">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Calculadora de Flete Comercial</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LCL &amp; Aéreo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Perfil: {perfilActual.nombre} (+{markupActivo}%)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cálculo de CBM (m³), peso tasable IATA, márgenes comerciales y control de vigencias.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Two columns layout */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Columna Izquierda: Parámetros, Perfil y Bultos (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Datos Generales y Ruta */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>1. Datos del Cliente &amp; Ruta</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Cliente / Cuenta</label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                    placeholder="Ej. Industrias Juan F. Secco S.A."
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Incoterm</label>
                  <select
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value as 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF')}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                  >
                    <option value="FOB">FOB (Puerto de Embarque)</option>
                    <option value="FCA">FCA (Depósito Origen)</option>
                    <option value="EXW">EXW (Fábrica Proveedor)</option>
                    <option value="CFR">CFR (Puerto Destino)</option>
                    <option value="CIF">CIF (Costo, Seguro y Flete)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Origen</label>
                  <input
                    type="text"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Destino</label>
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Días Libres Demoras</label>
                  <input
                    type="number"
                    value={diasLibres}
                    onChange={(e) => setDiasLibres(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Valor Mercadería FOB (USD)</label>
                  <input
                    type="number"
                    value={valorMercaderiaUsd}
                    onChange={(e) => setValorMercaderiaUsd(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Perfil Comercial y Vigencia de Tarifas (Gobernanza Alejandro Noacco & Vanesa Meggiolaro) */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>2. Perfil Comercial &amp; Vigencia Tarifaria</span>
                <span className="text-[10px] font-semibold text-[#0072BC] bg-sky-100/70 px-2 py-0.5 rounded border border-sky-200">
                  Gobernanza Tarifaria
                </span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Selector de Perfil de Rentabilidad */}
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Perfil de Rentabilidad Comercial
                  </label>
                  <select
                    value={perfilRentabilidad}
                    onChange={(e) => setPerfilRentabilidad(e.target.value as PerfilRentabilidad)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-[#0072BC]"
                    data-testid="select-perfil-rentabilidad"
                  >
                    <option value="CUENTA_ESTRATEGICA">Cuenta Estratégica (8% markup)</option>
                    <option value="ESTANDAR">Estándar Fidelizado (14% markup)</option>
                    <option value="SPOT_ALTO_RIESGO">Spot / Alto Riesgo (22% markup)</option>
                    <option value="PERSONALIZADO">Personalizado (Manual)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    {perfilActual.descripcion}
                  </p>
                </div>

                {/* Markup Manual si es Personalizado */}
                {perfilRentabilidad === 'PERSONALIZADO' ? (
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 flex items-center justify-between">
                      <span>% Markup Personalizado</span>
                      <span className="font-mono text-xs font-bold text-[#0072BC]">{markupPersonalizadoPct}%</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={markupPersonalizadoPct}
                          onChange={(e) => setMarkupPersonalizadoPct(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:ring-1 focus:ring-[#0072BC]"
                        />
                        <Percent className="h-3.5 w-3.5 absolute right-2.5 top-2 text-slate-400" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Requiere validación comercial ante márgenes inferiores a USD 200.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Fecha Base Tarifa Naviera
                    </label>
                    <input
                      type="date"
                      value={fechaTarifaNaviera}
                      onChange={(e) => setFechaTarifaNaviera(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Fecha de emisión de cotización por la naviera o co-loader.
                    </p>
                  </div>
                )}

                {/* Vigencia de Tarifa (15/30 días) */}
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Vigencia de Tarifa (Directiva Financiera)
                  </label>
                  <select
                    value={vigenciaDias}
                    onChange={(e) => setVigenciaDias(Number(e.target.value) || 15)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-[#0072BC]"
                    data-testid="select-vigencia-tarifa"
                  >
                    <option value={15}>15 Días (Flete Spot)</option>
                    <option value={30}>30 Días (Acuerdo Mensual)</option>
                    <option value={7}>7 Días (Aéreo Crítico)</option>
                  </select>
                </div>

                {/* Indicador Visual de Vigencia */}
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Estado de Vigencia Operativa
                  </label>
                  {isTarifaVencida ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-rose-300 bg-rose-50 text-rose-900 font-semibold">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="truncate">Tarifa Vencida (0d)</span>
                    </div>
                  ) : vigencia?.esPorVencer ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-amber-300 bg-amber-50 text-amber-900 font-semibold">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">Por Vencer ({vigencia.diasRestantes}d restantes)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Tarifa Vigente ({vigencia?.diasRestantes ?? vigenciaDias}d restantes)</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight font-mono">
                    Vence: {fechaVencimientoFormateada}
                  </p>
                </div>
              </div>

              {/* Banners de Gobernanza de Margen */}
              {isMarginBlocked && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in">
                  <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">
                      BLOQUEO ESTRICTO DE RENTABILIDAD (BLOQUEADA_RENTABILIDAD_NEGATIVA)
                    </strong>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      El margen comercial resultante es inferior al umbral de seguridad de USD 3.00. La emisión del borrador comercial ha sido bloqueada. Requiere autorización formal de Gerencia de Operaciones.
                    </p>
                  </div>
                </div>
              )}

              {isMarginPreventivo && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">
                      ALERTA DE MARGEN OPERATIVO MÍNIMO (&lt; USD 200 - Directiva Vanesa Meggiolaro)
                    </strong>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Margen bruto comercial inferior a USD 200. Riesgo de quebranto ante desvíos de transportistas, demoras en terminal o costos no previstos. Proceda con precaución.
                    </p>
                  </div>
                </div>
              )}

              {isTarifaVencida && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">
                      ADVERTENCIA: TARIFA NAVIERA CADUCADA
                    </strong>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      La tarifa de referencia ha expirado. No es posible transferir o enviar la cotización sin revalidar previamente el flete con el transportista.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Bultos, Documentos y Medidas */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Bultos, Medidas (cm), Documentos &amp; Kilos
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={calcFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.csv,.txt,.eml,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleCalcFileInputChange}
                    className="hidden"
                    data-testid="input-file-calculadora"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => calcFileInputRef.current?.click()}
                    data-testid="btn-upload-doc-calculadora"
                    className="h-7 text-xs gap-1 border-sky-300 bg-sky-50 text-[#0072BC] hover:bg-sky-100 font-semibold cursor-pointer"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Subir Doc / Packing List</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSampleCalcDoc}
                    data-testid="btn-sample-doc-calculadora"
                    className="h-7 text-xs gap-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Cargar Packing List de ejemplo y calcular automáticamente"
                  >
                    <FileText className="h-3 w-3 text-[#0072BC]" />
                    <span>Doc Ejemplo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddBulto}
                    className="h-7 text-xs gap-1 border-slate-300 bg-white text-[#0072BC] hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Agregar Bulto</span>
                  </Button>
                </div>
              </div>

              {/* Quick Paste AI & Uploaded Documents Box */}
              <div className="p-2.5 rounded-md bg-white border border-sky-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#0072BC]" />
                    <span>Pegado Rápido de Medidas o Carga desde Mail / Doc (IA):</span>
                  </label>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    Suba un archivo o pegue texto libre (cm, m, mm, in)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickPasteText}
                    onChange={(e) => setQuickPasteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyQuickPaste();
                      }
                    }}
                    placeholder="Ej.: 4 pallets de 1.20x1.00x1.50m (2000 kg) + 6 cajas de 60x40x50cm (300 kg)"
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#0072BC] focus:outline-hidden bg-slate-50/50"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyQuickPaste}
                    className="h-7 text-xs bg-[#0072BC] hover:bg-[#005d99] text-white gap-1 shrink-0 cursor-pointer font-semibold"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Interpretar (IA)</span>
                  </Button>
                </div>

                {documentosAdjuntos.length > 0 && (
                  <div
                    data-testid="calculadora-uploaded-docs"
                    className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5"
                  >
                    <span className="text-[10px] font-bold text-slate-600">
                      Docs adjuntos ({documentosAdjuntos.length}):
                    </span>
                    {documentosAdjuntos.map((doc) => (
                      <div
                        key={doc.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-[10px] text-sky-900"
                      >
                        <FileText className="h-3 w-3 text-[#0072BC]" />
                        <span className="font-semibold truncate max-w-[160px]">{doc.nombre}</span>
                        <span className="text-emerald-700 font-bold">
                          ({doc.bultosExtraidos} bultos · {doc.cbmExtraido.toFixed(2)} m³)
                        </span>
                        {doc.previewUrl && (
                          <a
                            href={doc.previewUrl}
                            download={doc.nombre}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0072BC] hover:underline"
                            title="Descargar documento"
                          >
                            <Download className="h-2.5 w-2.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentosAdjuntos((prev) => prev.filter((d) => d.id !== doc.id))
                          }
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Quitar documento"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {bultos.map((b, idx) => {
                  const evalItem = resultado.aptitudCopa?.bultosEvaluados[idx];
                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-md bg-white border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs shadow-2xs"
                    >
                      <span className="font-semibold text-slate-500 w-5">#{idx + 1}</span>
                      <div className="w-14">
                        <label className="block text-[10px] text-slate-500">Cant.</label>
                        <input
                          type="number"
                          min="1"
                          value={b.cantidad}
                          onChange={(e) => handleUpdateBulto(b.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-full px-1.5 py-1 border border-slate-300 rounded text-center font-medium"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500">Tipo</label>
                        <select
                          value={b.tipo}
                          onChange={(e) => handleUpdateBulto(b.id, 'tipo', e.target.value)}
                          className="w-full px-1 py-1 border border-slate-300 rounded"
                        >
                          <option value="pallet">Pallet</option>
                          <option value="caja">Caja</option>
                          <option value="atado">Atado</option>
                          <option value="tambor">Tambor</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <div>
                          <label className="block text-[10px] text-slate-500">Largo (cm)</label>
                          <input
                            type="number"
                            value={b.largoCm}
                            onChange={(e) => handleUpdateBulto(b.id, 'largoCm', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-center"
                          />
                        </div>
                        <span className="text-slate-400 mt-3">×</span>
                        <div>
                          <label className="block text-[10px] text-slate-500">Ancho (cm)</label>
                          <input
                            type="number"
                            value={b.anchoCm}
                            onChange={(e) => handleUpdateBulto(b.id, 'anchoCm', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-center"
                          />
                        </div>
                        <span className="text-slate-400 mt-3">×</span>
                        <div>
                          <label className="block text-[10px] text-slate-500">Alto (cm)</label>
                          <input
                            type="number"
                            value={b.altoCm}
                            onChange={(e) => handleUpdateBulto(b.id, 'altoCm', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-center"
                          />
                        </div>
                      </div>
                      <div className="w-18">
                        <label className="block text-[10px] text-slate-500">Peso u. (kg)</label>
                        <input
                          type="number"
                          value={b.pesoUnitarioKg}
                          onChange={(e) => handleUpdateBulto(b.id, 'pesoUnitarioKg', parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 border border-slate-300 rounded text-center font-medium"
                        />
                      </div>
                      {evalItem && (
                        <div className="mt-3 shrink-0" title={evalItem.motivos.join(' ')}>
                          {evalItem.estado === 'APTA' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Copa
                            </span>
                          ) : evalItem.estado === 'SUJETA_AUTORIZACION' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ OK Copa
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              ✗ No Copa
                            </span>
                          )}
                        </div>
                      )}
                      {bultos.length > 1 && (
                        <button
                          onClick={() => handleRemoveBulto(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors mt-3"
                          title="Eliminar bulto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen Métrico Instantáneo */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs">
              <div>
                <span className="text-[11px] text-sky-700 font-medium">Bultos Totales:</span>
                <p className="text-base font-bold text-sky-950">{resultado.cantidadBultosTotal}</p>
              </div>
              <div>
                <span className="text-[11px] text-sky-700 font-medium">Peso Bruto Total:</span>
                <p className="text-base font-bold text-sky-950">{resultado.pesoBrutoTotalKg.toLocaleString('es-AR')} kg</p>
              </div>
              <div>
                <span className="text-[11px] text-sky-700 font-medium">Volumen Total CBM:</span>
                <p className="text-base font-bold text-[#0072BC]">{resultado.volumenTotalM3.toFixed(3)} m³</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Opciones Comparativas & Borrador para Gmail (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Tarjetas Comparativas Aéreo vs Marítimo con Desglose Comercial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-xs">
              {/* Opción Aéreo + Validador Bodega Copa Airlines */}
              <div className="p-3 rounded-lg border border-sky-200 bg-sky-50/50 space-y-2.5">
                <div className="flex items-center justify-between text-sky-800 font-bold border-b border-sky-200/80 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Plane className="h-3.5 w-3.5" />
                    <span>Aéreo (IATA 1:6) · Ruta PTY ➔ ROS</span>
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-sky-950">
                      USD {(resultado.fleteVentaAereoSugeridoUsd ?? resultado.costoFleteAereoSugeridoUsd).toFixed(2)}
                    </span>
                    <span className="block text-[9px] font-normal text-sky-700">Flete Venta</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Costo Base Aerolínea:</span>
                    <span className="font-mono font-medium">USD {resultado.costoFleteAereoSugeridoUsd.toFixed(2)}</span>
                  </div>
                  {resultado.rentabilidadAerea && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Margen Comercial ({resultado.rentabilidadAerea.markupPorcentaje}%):</span>
                      <span className={`font-mono font-bold ${
                        resultado.rentabilidadAerea.esBloqueante
                          ? 'text-rose-600'
                          : resultado.rentabilidadAerea.esAlertaPreventiva
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        +USD {resultado.rentabilidadAerea.margenBrutoUsd.toFixed(2)} ({resultado.rentabilidadAerea.margenPorcentaje}%)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Peso Tasable:</span>
                    <span className="font-medium text-slate-800">{resultado.pesoTasableAereoKg.toFixed(1)} kg</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {resultado.aplicaVolumenAereo ? '⚡ Rige peso volumétrico (1:6)' : '⚡ Rige peso real'}
                  </p>
                </div>

                {/* Semáforo Aptitud Copa Airlines (B737 PAX a ROS) */}
                {resultado.aptitudCopa && (
                  <div
                    data-testid="calculadora-copa-panel"
                    className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                      resultado.aptitudCopa.estado === 'APTA'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : resultado.aptitudCopa.estado === 'SUJETA_AUTORIZACION'
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {resultado.aptitudCopa.estado === 'APTA' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : resultado.aptitudCopa.estado === 'SUJETA_AUTORIZACION' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span data-testid="calculadora-copa-status">
                          {resultado.aptitudCopa.tituloEstado}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] leading-snug opacity-90">
                      <strong>Límite B737 Copa (ROS):</strong>{' '}
                      {resultado.aptitudCopa.limitesReferencia.medidasPulgadasRef} | Máx. 80 kg/pc directo (100 kg c/ OK).
                    </p>
                    {resultado.aptitudCopa.motivosPrincipales.length > 0 && (
                      <p className="text-[10px] font-medium leading-snug bg-white/70 p-1.5 rounded border border-black/10">
                        {resultado.aptitudCopa.motivosPrincipales[0]}
                      </p>
                    )}
                    {resultado.aptitudCopa.estado !== 'APTA' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleDesarmarPalletParaCopa}
                        data-testid="btn-calculadora-desarmar-copa"
                        className="w-full h-7 text-[10px] gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer mt-1"
                      >
                        <Wrench className="h-3 w-3 text-amber-400" />
                        <span>Desarmar Pallet en Cajas Sueltas (Apta Copa)</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Opción Marítimo LCL */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between text-emerald-800 font-bold border-b border-emerald-200/80 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Ship className="h-3.5 w-3.5" />
                    <span>Marítimo LCL (W/M)</span>
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-950">
                      USD {(resultado.fleteVentaMaritimoSugeridoUsd ?? resultado.costoFleteMaritimoSugeridoUsd).toFixed(2)}
                    </span>
                    <span className="block text-[9px] font-normal text-emerald-700">Flete Venta</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Costo Base Naviera:</span>
                    <span className="font-mono font-medium">USD {resultado.costoFleteMaritimoSugeridoUsd.toFixed(2)}</span>
                  </div>
                  {resultado.rentabilidadMaritima && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Margen Comercial ({resultado.rentabilidadMaritima.markupPorcentaje}%):</span>
                      <span className={`font-mono font-bold ${
                        resultado.rentabilidadMaritima.esBloqueante
                          ? 'text-rose-600'
                          : resultado.rentabilidadMaritima.esAlertaPreventiva
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        +USD {resultado.rentabilidadMaritima.margenBrutoUsd.toFixed(2)} ({resultado.rentabilidadMaritima.margenPorcentaje}%)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Volumen Tasable:</span>
                    <span className="font-medium text-slate-800">{resultado.volumenTasableLclM3.toFixed(2)} m³</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Gastos Puerto + Seguro:</span>
                    <span className="font-mono">
                      USD {(resultado.desconsolidacionDestinoUsd + resultado.documentacionDestinoUsd + resultado.seguroTransporteUsd).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrador Formateado para Gmail */}
            <div className="flex-1 flex flex-col rounded-lg border border-slate-200 bg-slate-900 text-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Borrador de Propuesta Comercial</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {canCopy ? 'Listo para enviar' : 'Bloqueado por gobernanza'}
                </span>
              </div>
              <textarea
                readOnly
                value={borradorFinal}
                className="flex-1 w-full p-2.5 rounded bg-slate-950 text-slate-200 text-[11px] font-mono leading-relaxed border border-slate-800 resize-none focus:outline-none min-h-[160px]"
              />
              <div className="pt-1">
                <Button
                  onClick={handleCopyDraft}
                  disabled={!canCopy}
                  className={`w-full text-xs font-semibold py-2 gap-1.5 shadow-sm transition-all ${
                    !canCopy
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed hover:bg-slate-700'
                      : copiedDraft
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-[#0072BC] hover:bg-[#005d99] text-white cursor-pointer'
                  }`}
                  title={
                    isMarginBlocked
                      ? 'Bloqueado: Margen inferior a USD 3.00 (BLOQUEADA_RENTABILIDAD_NEGATIVA)'
                      : isTarifaVencida
                      ? 'Bloqueado: Tarifa naviera vencida'
                      : 'Copiar borrador al portapapeles'
                  }
                >
                  {copiedDraft ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>¡Borrador Copiado al Portapapeles!</span>
                    </>
                  ) : isMarginBlocked ? (
                    <>
                      <AlertOctagon className="h-4 w-4 text-rose-400" />
                      <span>Bloqueado por Margen (&lt; USD 3.00)</span>
                    </>
                  ) : isTarifaVencida ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      <span>Bloqueado: Tarifa Caducada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar Borrador para Pegar en Gmail</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3.5 z-10 shadow-sm flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Fórmulas, markup comercial y recargos alineados con PO-01 Gestión Comercial ALMAR</span>
            <span className="sm:hidden">PO-01 Gestión Comercial ALMAR</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleGuardarCotizacion}
              disabled={!canCopy || isSavingCotizacion}
              className="bg-[#1e3d2f] hover:bg-[#152b21] text-white font-bold gap-1 text-xs cursor-pointer shadow-xs"
              data-testid="btn-guardar-emitir-cotizacion"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSavingCotizacion ? 'Guardando...' : '+ Guardar y Emitir Cotización'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
            >
              Cerrar Asistente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
