'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Ruler,
  Sparkles,
  Ship,
  Plane,
  Truck,
  Copy,
  Check,
  RotateCcw,
  X,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/ToastProvider';
import { canAccessMulticotizador } from '@/lib/auth';
import { useAuth } from '@/components/auth/RoleGuard';
import {
  calcularResumenCubicajeDesdeTexto,
  convertirCargoItemsABultos,
  formatearResumenCubicajeParaMail,
  procesarArchivoDocumentoCliente,
} from '@/lib/calculadora-cubicaje';
import {
  BultoItem,
  DocumentoCubicajeAdjunto,
  ResumenCubicaje,
} from '@/types/cotizaciones';

interface CubicajeInteligenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToCalculadora?: (bultos: BultoItem[], documentos?: DocumentoCubicajeAdjunto[]) => void;
  initialText?: string;
}

const SAMPLE_TEXTS = [
  {
    label: '✈️ Apta Copa Directo ROS (Cajas <=80cm / <=80kg)',
    text: '4 cajas de 80x60x55 cm (180 kg) + 2 cajas de 100x75x65 cm (130 kg)',
    desc: 'Cumple gálibo B737 Copa (48×40×32 in / 122×102×82 cm) y <= 80 kg/bulto',
  },
  {
    label: '⛔ No Apta Copa (Pallet alto 1.45m / Sipar)',
    text: '2 pallets de 1.20x1.00x1.45m (420 kg)',
    desc: 'Excede puerta bodega B737 (82 cm) y peso x bulto (210 kg > 80 kg). Permite simular desarmado en cajas sueltas.',
  },
  {
    label: '⚠️ Copa Condicional (88 kg x bulto / Tradewings)',
    text: '1 cajón de 115x90x78 cm (88 kg)',
    desc: 'Medidas aptas pero peso entre 80 y 100 kg/pc requiere OK to Forward de Copa ROS',
  },
  {
    label: 'Lucía (Pallets sin altura)',
    text: '10 palet de 1 x 1 y 4200 kg',
    desc: 'Auto-estima altura 1.20m y evita colisión con "y"',
  },
  {
    label: 'Gisel (Pallets + Cajas)',
    text: '4 pallets de 1.20x1.00x1.50m (2000 kg) + 6 cajas de 60x40x50cm (300 kg)',
    desc: 'Carga mixta multilínea con unidades cm y m',
  },
  {
    label: 'Pulgadas Miami (48x40x32 in)',
    text: '2 crates 48x40x32 in 150 kg',
    desc: 'Conversión automática de pulgadas (inches) al límite exacto Copa',
  },
];

const PRESET_DOCUMENTS = [
  {
    id: 'preset-copa-apta',
    testId: 'sample-doc-copa-apta',
    label: '📄 Packing_List_Teltonika_Copa_ROS.csv (Apta)',
    fileName: 'Packing_List_Teltonika_Copa_ROS.csv',
    mimeType: 'text/csv',
    content: [
      'CANTIDAD;TIPO;LARGO_CM;ANCHO_CM;ALTO_CM;PESO_TOTAL_KG',
      '4;caja;80;60;55;180',
      '2;caja;100;75;65;130',
    ].join('\n'),
  },
  {
    id: 'preset-copa-no-apta',
    testId: 'sample-doc-copa-no-apta',
    label: '📄 Packing_List_Sipar_Pallet_MIA_ROS.pdf (No Apta Copa)',
    fileName: 'Packing_List_Sipar_Pallet_MIA_ROS.pdf',
    mimeType: 'application/pdf',
    content: [
      '%PDF-1.4 ALMAR ROSARIO PACKING LIST SIPAR',
      '(Shipper: Taylor Studwelding / Consignee: Sipar Aceros Rosario)',
      '(2 pallets de 120x100x145 cm 420 kg)',
      '(1 cajon de 130x90x95 cm 115 kg)',
    ].join('\n'),
  },
  {
    id: 'preset-copa-condicional',
    testId: 'sample-doc-copa-condicional',
    label: '📄 RFQ_Tradewings_MIA_ROS_88kg.txt (Sujeta a OK Copa)',
    fileName: 'RFQ_Tradewings_MIA_ROS_88kg.txt',
    mimeType: 'text/plain',
    content: [
      'WAREHOUSE RECEIPT TWUS-3677 - MIAMI FL 33166',
      '1 cajon de 115x90x78 cm - 88 kg',
      '2 cajas de 60x50x50 cm - 70 kg',
    ].join('\n'),
  },
];

export function CubicajeInteligenteModal({
  isOpen,
  onClose,
  onApplyToCalculadora,
  initialText = '',
}: CubicajeInteligenteModalProps) {
  const { toast } = useToast();
  const { role } = useAuth();
  const [inputText, setInputText] = React.useState(initialText || SAMPLE_TEXTS[0]?.text || '');
  const [defaultHeightM, setDefaultHeightM] = React.useState<number>(1.20);
  const [resumen, setResumen] = React.useState<ResumenCubicaje | null>(null);
  const [copiedMail, setCopiedMail] = React.useState(false);
  const [documentosAdjuntos, setDocumentosAdjuntos] = React.useState<DocumentoCubicajeAdjunto[]>([]);
  const [isDraggingFile, setIsDraggingFile] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Auto-calcular al abrir o al cambiar texto
  React.useEffect(() => {
    if (inputText.trim()) {
      try {
        const res = calcularResumenCubicajeDesdeTexto(inputText, {
          defaultPalletHeightM: defaultHeightM,
        });
        setResumen(res);
      } catch (e) {
        console.error('Error calculando cubicaje:', e);
      }
    } else {
      setResumen(null);
    }
  }, [inputText, defaultHeightM]);

  const processUploadedFile = async (file: File) => {
    try {
      const { textoExtraido, resumen: docResumen, documento } =
        await procesarArchivoDocumentoCliente(file, defaultHeightM);

      let previewUrl: string | undefined;
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        previewUrl = URL.createObjectURL(file);
      }

      const nuevoDoc: DocumentoCubicajeAdjunto = {
        ...documento,
        previewUrl,
      };

      setDocumentosAdjuntos((prev) => [nuevoDoc, ...prev]);
      setInputText(textoExtraido);

      toast.success(
        'Documento Procesado',
        `Se cargó "${file.name}" y se extrajeron ${docResumen.cantidadBultosTotal} bultos (${docResumen.volumenTotalM3.toFixed(2)} m³).`
      );
    } catch {
      toast.error('Error de lectura', `No se pudo leer el archivo ${file.name}.`);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f) await processUploadedFile(f);
    }
    e.target.value = '';
  };

  const handleLoadPresetDocument = (preset: (typeof PRESET_DOCUMENTS)[number]) => {
    const blob = new Blob([preset.content], { type: preset.mimeType });
    const file = new File([blob], preset.fileName, { type: preset.mimeType });
    void processUploadedFile(file);
  };

  const handleRemoveDocument = (docId: string) => {
    setDocumentosAdjuntos((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSimularDesarmadoPalletCopa = () => {
    if (!resumen || resumen.items.length === 0) return;

    const nuevasLineas: string[] = [];
    for (const it of resumen.items) {
      const pesoUnit = it.pesoUnitarioKg;
      const altoCm = it.altoCm;
      const largoCm = it.largoCm;
      const anchoCm = it.anchoCm;

      if (altoCm > 82 || pesoUnit > 80 || largoCm > 122 || anchoCm > 102) {
        // Dividir cada pallet/bulto excedido en cajas sueltas <= 75 cm alto y <= 65 kg c/u conservando volumen y peso total
        const minCajasPorPeso = Math.max(1, Math.ceil(it.pesoTotalKg / 65));
        const minCajasPorVolumen = Math.max(1, Math.ceil(it.volumenTotalM3 / (0.8 * 0.6 * 0.65)));
        const numCajas = Math.max(minCajasPorPeso, minCajasPorVolumen, it.cantidad * 2);
        const volPorCajaM3 = it.volumenTotalM3 / numCajas;
        // Mantener base 80x60 cm y ajustar alto <= 75 cm
        const baseLargoM = 0.80;
        const baseAnchoM = 0.60;
        const altoCalcCm = Math.min(78, Math.max(35, Math.round((volPorCajaM3 / (baseLargoM * baseAnchoM)) * 100)));
        const largoCalcCm = Math.min(115, Math.max(60, Math.round( Math.sqrt((volPorCajaM3 / (altoCalcCm / 100)) * (4 / 3)) * 100 )));
        const anchoCalcCm = Math.min(95, Math.max(45, Math.round((volPorCajaM3 / ((altoCalcCm / 100) * (largoCalcCm / 100))) * 100)));
        nuevasLineas.push(
          `${numCajas} cajas de ${largoCalcCm}x${anchoCalcCm}x${altoCalcCm} cm (${Math.round(it.pesoTotalKg)} kg)`
        );
      } else {
        nuevasLineas.push(
          `${it.cantidad} ${it.tipoBulto} de ${it.largoCm}x${it.anchoCm}x${it.altoCm} cm (${Math.round(it.pesoTotalKg)} kg)`
        );
      }
    }

    const nuevoTexto = nuevasLineas.join(' + ');
    setInputText(nuevoTexto);
    toast.success(
      'Simulación de Despalletizado Aplicada',
      'Se recalcularon los bultos como cajas sueltas dentro del límite de puerta y peso de Copa Airlines (<= 82 cm y <= 80 kg/bulto).'
    );
  };

  const handleCopyResumen = async () => {
    if (!resumen) return;
    const mailText = formatearResumenCubicajeParaMail(resumen);
    try {
      await navigator.clipboard.writeText(mailText);
      setCopiedMail(true);
      toast.success(
        'Resumen Copiado',
        'El desglose de cubicaje, peso tasable y aptitud Copa fue copiado al portapapeles.'
      );
      setTimeout(() => setCopiedMail(false), 2500);
    } catch {
      toast.error('Error', 'No se pudo copiar el texto al portapapeles.');
    }
  };

  const handleTransferir = () => {
    if (!resumen || resumen.items.length === 0) return;
    const bultos = convertirCargoItemsABultos(resumen.items);
    if (onApplyToCalculadora) {
      onApplyToCalculadora(bultos, documentosAdjuntos);
      toast.success(
        'Medidas y Documentos Transferidos',
        `Se transfirieron ${bultos.length} filas de bultos${documentosAdjuntos.length > 0 ? ` y ${documentosAdjuntos.length} documento(s)` : ''} a la Calculadora de Flete.`
      );
      onClose();
    }
  };

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

  if (!isOpen) return null;

  const copa = resumen?.aptitudCopa;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      data-testid="cubicaje-modal"
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0072BC]/30 text-sky-300 border border-[#0072BC]/40">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Asistente de Cubicaje (CBM), Documentos &amp; Validador Copa Airlines
                </h2>
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px] py-0.5">
                  Mail / Packing List + Gálibo B737
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Cargue un documento (Packing List, Factura, PDF/Excel/CSV) o pegue el texto del correo para calcular volumen, peso tasable y aptitud de bodega Copa Airlines (PTY ➔ ROS).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-800">
          {/* 1. Zona de Carga Real de Documentos (Packing List / Invoice / RFQ) */}
          <div
            data-testid="document-upload-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                  const f = e.dataTransfer.files[i];
                  if (f) void processUploadedFile(f);
                }
              }
            }}
            className={`p-4 rounded-xl border-2 border-dashed transition-all ${
              isDraggingFile
                ? 'border-[#0072BC] bg-sky-50/80'
                : 'border-sky-300 bg-sky-50/40 hover:bg-sky-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.txt,.eml,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="hidden"
              data-testid="input-file-cubicaje"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#0072BC] text-white shrink-0 mt-0.5">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      Cargar Documento de Respaldo (Packing List / Factura Comercial / Solicitud RFQ)
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0">
                      Extracción Automática de Medidas
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Arrastre su archivo aquí o haga clic en <strong>Subir Documento</strong> (PDF, Excel, CSV, TXT, EML). El sistema lee los bultos, calcula los m³ y verifica si la carga es apta para volar por Copa Airlines.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                data-testid="btn-upload-doc-cubicaje"
                className="gap-1.5 text-xs bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold shrink-0 cursor-pointer shadow-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Subir Documento (PDF / Excel / CSV)</span>
              </Button>
            </div>

            {/* Plantillas de Documentos Reales para Prueba en 1 Clic */}
            <div className="mt-3 pt-2.5 border-t border-sky-200/70 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-sky-900 mr-1">
                Probar con documento de ejemplo:
              </span>
              {PRESET_DOCUMENTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={preset.testId}
                  onClick={() => handleLoadPresetDocument(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-white hover:bg-sky-100 text-[#0072BC] border border-sky-200 transition-colors cursor-pointer font-semibold shadow-2xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Lista de Documentos Cargados */}
            {documentosAdjuntos.length > 0 && (
              <div
                data-testid="uploaded-docs-list"
                className="mt-3 pt-2.5 border-t border-sky-200 space-y-1.5"
              >
                <span className="block text-[11px] font-bold text-slate-700">
                  Documentos Cargados ({documentosAdjuntos.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documentosAdjuntos.map((doc) => (
                    <div
                      key={doc.id}
                      data-testid={`uploaded-doc-item-${doc.nombre}`}
                      className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-[#0072BC] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate" title={doc.nombre}>
                            {doc.nombre}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {Math.max(1, Math.round(doc.tamanoBytes / 1024))} KB · Extraídos:{' '}
                            <strong className="text-emerald-700">
                              {doc.bultosExtraidos} bultos ({doc.cbmExtraido.toFixed(2)} m³)
                            </strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.previewUrl && (
                          <a
                            href={doc.previewUrl}
                            download={doc.nombre}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-500 hover:text-[#0072BC] rounded hover:bg-slate-100"
                            title="Ver / Descargar documento"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="Quitar documento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Sample Text Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Casos Reales de Prueba (Aéreo Copa ROS &amp; Marítimo):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(sample.text)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer font-medium"
                  title={sample.desc}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea Input & Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Texto extraído del documento o pegado desde Correo / RFQ / WhatsApp:
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Altura estándar x defecto:</span>
                <select
                  value={defaultHeightM}
                  onChange={(e) => setDefaultHeightM(parseFloat(e.target.value) || 1.20)}
                  className="px-2 py-0.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value={1.20}>1.20 m (Estándar Arlog/Mercosur)</option>
                  <option value={0.80}>0.80 m (Pallet Bajo Apto Copa)</option>
                  <option value={1.00}>1.00 m</option>
                  <option value={1.50}>1.50 m</option>
                  <option value={1.80}>1.80 m (High stack)</option>
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              data-testid="cubicaje-textarea"
              placeholder="Ej.: 4 cajas de 80x60x55 cm (180 kg) + 2 cajas de 100x75x65 cm (130 kg)"
              className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0072BC]/40 transition-colors"
            />

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>Formatos soportados: x, X, ×, by, por. Unidades: m, cm, mm, in (pulgadas). Pesos: kg, ton, lbs.</span>
              </span>
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Parsed Items Section */}
          {resumen && resumen.items.length > 0 && (
            <div className="space-y-4 pt-1">
              {/* Summary KPIs Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-sky-800 font-medium">Bultos Totales</span>
                    <p className="text-xl font-bold text-sky-950 mt-0.5">
                      {resumen.cantidadBultosTotal}{' '}
                      <span className="text-xs font-normal text-sky-700">unidades</span>
                    </p>
                  </div>
                  <Box className="h-7 w-7 text-[#0072BC]/40" />
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium">Volumen Total (CBM)</span>
                    <p className="text-xl font-bold text-emerald-950 mt-0.5">
                      {resumen.volumenTotalM3.toFixed(3)}{' '}
                      <span className="text-xs font-normal text-emerald-700">m³</span>
                    </p>
                  </div>
                  <Ruler className="h-7 w-7 text-emerald-600/40" />
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-indigo-800 font-medium">Peso Bruto Real</span>
                    <p className="text-xl font-bold text-indigo-950 mt-0.5">
                      {resumen.pesoBrutoTotalKg.toLocaleString('es-AR')}{' '}
                      <span className="text-xs font-normal text-indigo-700">kg</span>
                    </p>
                  </div>
                  <Truck className="h-7 w-7 text-indigo-600/40" />
                </div>
              </div>

              {/* VALIDADOR DE BODEGA COPA AIRLINES (PTY -> ROS / B737-800 & MAX 9) */}
              {copa && (
                <div
                  data-testid="copa-aptitud-panel"
                  className={`p-4 rounded-xl border-2 space-y-2.5 shadow-xs ${
                    copa.estado === 'APTA'
                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                      : copa.estado === 'SUJETA_AUTORIZACION'
                        ? 'border-amber-300 bg-amber-50/80 text-amber-950'
                        : 'border-rose-300 bg-rose-50/80 text-rose-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {copa.estado === 'APTA' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : copa.estado === 'SUJETA_AUTORIZACION' ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            data-testid="copa-aptitud-titulo"
                            className="text-xs sm:text-sm font-bold tracking-tight"
                          >
                            {copa.tituloEstado}
                          </h3>
                          <Badge
                            className={
                              copa.estado === 'APTA'
                                ? 'bg-emerald-600 text-white text-[10px]'
                                : copa.estado === 'SUJETA_AUTORIZACION'
                                  ? 'bg-amber-600 text-white text-[10px]'
                                  : 'bg-rose-600 text-white text-[10px]'
                            }
                          >
                            {copa.aeronaveReferencia}
                          </Badge>
                        </div>
                        <p className="text-xs opacity-90 mt-0.5">{copa.resumenEjecutivo}</p>
                      </div>
                    </div>

                    {copa.estado !== 'APTA' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSimularDesarmadoPalletCopa}
                        data-testid="btn-desarmar-pallet-copa"
                        className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold shrink-0 cursor-pointer shadow-xs"
                      >
                        <Wrench className="h-3.5 w-3.5 text-amber-400" />
                        <span>Simular Desarmado en Cajas Sueltas (Apta Copa)</span>
                      </Button>
                    )}
                  </div>

                  {/* Parámetros técnicos de bodega Copa Airlines */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded bg-white/80 border border-black/10">
                      <span className="font-semibold block text-slate-600">
                        Gálibo Máx. Puerta B737 Copa:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {copa.limitesReferencia.medidasPulgadasRef}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white/80 border border-black/10">
                      <span className="font-semibold block text-slate-600">
                        Peso Máx. por Bulto (Ruta ROS):
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        80 kg directo | 80–100 kg c/ OK Copa
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white/80 border border-black/10">
                      <span className="font-semibold block text-slate-600">
                        Acción Comercial Sugerida:
                      </span>
                      <span className="font-medium text-slate-900">
                        {copa.recomendacionComercial}
                      </span>
                    </div>
                  </div>

                  {copa.motivosPrincipales.length > 0 && (
                    <div className="text-[11px] bg-white/70 rounded p-2 border border-black/10 space-y-1">
                      <span className="font-bold block">
                        Detalle Técnico por Bulto (Bodega Inferior B737 PAX):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {copa.motivosPrincipales.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                      {copa.estado !== 'APTA' && (
                        <p className="pt-1 font-semibold text-slate-800">
                          💡 Alternativa: {copa.alternativaSugerida}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items Breakdown Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Desglose de Bultos Interpretados ({resumen.items.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Conversión automática a dimensiones métricas + Aptitud Copa por ítem
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3 text-center">Cant.</th>
                        <th className="py-2 px-3">Dimensiones (L × An × Al)</th>
                        <th className="py-2 px-3 text-right">Peso Unit.</th>
                        <th className="py-2 px-3 text-right">Volumen Total</th>
                        <th className="py-2 px-3 text-right">Peso Total</th>
                        <th className="py-2 px-3 text-center">Estado Copa (ROS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resumen.items.map((it, idx) => {
                        const evalItem = copa?.bultosEvaluados[idx];
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3 capitalize font-medium text-slate-800">
                              {it.tipoBulto}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700">{it.cantidad}</td>
                            <td className="py-2 px-3 text-slate-700">
                              <span className="font-mono">
                                {it.largoCm} × {it.anchoCm} × {it.altoCm} cm
                              </span>
                              <span className="text-slate-400 text-[10px] ml-1">
                                ({it.largoM.toFixed(2)}×{it.anchoM.toFixed(2)}×{it.altoM.toFixed(2)}m)
                              </span>
                              {it.altoEstimadoPorDefecto && (
                                <Badge
                                  variant="warning"
                                  className="ml-1.5 text-[9px] py-0 px-1 border-amber-300 bg-amber-100 text-amber-900"
                                >
                                  Altura est. {it.altoM}m
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600 font-mono">
                              {it.pesoUnitarioKg.toLocaleString('es-AR')} kg
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-800 font-mono">
                              {it.volumenTotalM3.toFixed(3)} m³
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-800 font-mono">
                              {it.pesoTotalKg.toLocaleString('es-AR')} kg
                            </td>
                            <td className="py-2 px-3 text-center">
                              {evalItem?.estado === 'APTA' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  title={evalItem.motivos.join(' ')}
                                >
                                  ✓ Apta Copa
                                </span>
                              ) : evalItem?.estado === 'SUJETA_AUTORIZACION' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                                  title={evalItem.motivos.join(' ')}
                                >
                                  ⚠️ OK Copa (80-100kg)
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                                  title={evalItem?.motivos.join(' ')}
                                >
                                  ✗ No Apta Copa
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Triple Chargeable Weight Cards (Marítimo LCL, Aéreo, Terrestre) */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <span>Peso Tasable según Modalidad Operativa:</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Marítimo LCL */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                        <Ship className="h-4 w-4 text-[#0072BC]" />
                        <span>Marítimo LCL (W/M)</span>
                      </div>
                      <Badge
                        className={
                          resumen.pesoTasable.maritimoLcl.reglaAplicada === 'VOLUMEN'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                            : 'bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px]'
                        }
                      >
                        Rige {resumen.pesoTasable.maritimoLcl.reglaAplicada}
                      </Badge>
                    </div>
                    <div className="pt-1">
                      <p className="text-lg font-bold text-slate-900 font-mono">
                        {resumen.pesoTasable.maritimoLcl.revenueTonsWm.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-600">W/M</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Volumen ({resumen.pesoTasable.maritimoLcl.volumenM3.toFixed(2)} m³) vs Peso (
                        {resumen.pesoTasable.maritimoLcl.pesoToneladas.toFixed(2)} tn).
                      </p>
                    </div>
                  </div>

                  {/* Aéreo IATA */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                        <Plane className="h-4 w-4 text-sky-600" />
                        <span>Aéreo IATA (1:6)</span>
                      </div>
                      <Badge
                        className={
                          resumen.pesoTasable.aereo.reglaAplicada === 'VOLUMEN'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                            : 'bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px]'
                        }
                      >
                        Rige {resumen.pesoTasable.aereo.reglaAplicada}
                      </Badge>
                    </div>
                    <div className="pt-1">
                      <p className="text-lg font-bold text-slate-900 font-mono">
                        {resumen.pesoTasable.aereo.pesoTasableKg.toLocaleString('es-AR')}{' '}
                        <span className="text-xs font-normal text-slate-600">kg</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Volumétrico ({resumen.pesoTasable.aereo.pesoVolumetricoKg.toLocaleString('es-AR')} kg) vs Real (
                        {resumen.pesoTasable.aereo.pesoRealKg.toLocaleString('es-AR')} kg).
                      </p>
                    </div>
                  </div>

                  {/* Terrestre Carretero */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                        <Truck className="h-4 w-4 text-amber-600" />
                        <span>Terrestre (1 m³ = 300 kg)</span>
                      </div>
                      <Badge
                        className={
                          resumen.pesoTasable.terrestre.reglaAplicada === 'VOLUMEN'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                            : 'bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px]'
                        }
                      >
                        Rige {resumen.pesoTasable.terrestre.reglaAplicada}
                      </Badge>
                    </div>
                    <div className="pt-1">
                      <p className="text-lg font-bold text-slate-900 font-mono">
                        {resumen.pesoTasable.terrestre.pesoTasableKg.toLocaleString('es-AR')}{' '}
                        <span className="text-xs font-normal text-slate-600">kg</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Volumétrico ({resumen.pesoTasable.terrestre.pesoVolumetricoKg.toLocaleString('es-AR')} kg) vs Real (
                        {resumen.pesoTasable.terrestre.pesoRealKg.toLocaleString('es-AR')} kg).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FCL Recommendation Banner */}
              {resumen.sugerenciaFcl.requiereFcl ? (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-amber-900">
                          Recomendación Comercial: Sugerir Contenedor Exclusivo {resumen.sugerenciaFcl.nombreEquipo}
                        </h4>
                        <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                          {resumen.sugerenciaFcl.equipoSugerido === '40_STD' ? 'FCL 40\' HC' : 'FCL 20\' STD'}
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                        {resumen.sugerenciaFcl.razonComercial}
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        Capacidad de referencia del equipo: {resumen.sugerenciaFcl.capacidadM3}
                      </p>
                    </div>
                  </div>
                  {canAccessMulticotizador(role) && (
                    <Link
                      href={`/cotizaciones/multicotizador?equip=${
                        resumen.volumenTotalM3 > 30 ? '40HC' : '20GP'
                      }&qty=${
                        resumen.volumenTotalM3 > 65 ? Math.ceil(resumen.volumenTotalM3 / 65) : 1
                      }&weightKg=${Math.round(resumen.pesoBrutoTotalKg)}&cbm=${resumen.volumenTotalM3.toFixed(2)}`}
                      onClick={onClose}
                      className="shrink-0"
                    >
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5 text-xs bg-[#081433] hover:bg-slate-800 text-white font-semibold cursor-pointer"
                      >
                        <Ship className="h-3.5 w-3.5 text-sky-400" />
                        <span>Cotizar FCL en Multicotizador</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Carga dentro de rango LCL:</strong> Con {resumen.volumenTotalM3.toFixed(2)} m³, el flete consolidado LCL resulta económicamente ventajoso frente a contratar un contenedor exclusivo FCL.
                  </span>
                </div>
              )}
            </div>
          )}

          {(!resumen || resumen.items.length === 0) && (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 space-y-2">
              <Box className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-xs">
                Suba un documento (Packing List / Factura), pegue las medidas o elija uno de los casos rápidos superiores para calcular el cubicaje y validar si es apta para Copa Airlines.
              </p>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3.5 z-10 shadow-sm flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!resumen || resumen.items.length === 0}
              onClick={handleCopyResumen}
              data-testid="btn-copy-resumen-cubicaje"
              className="gap-1.5 text-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              {copiedMail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedMail ? 'Copiado al Portapapeles' : 'Copiar Resumen + Validación Copa'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cerrar
            </Button>
            {onApplyToCalculadora && (
              <Button
                size="sm"
                disabled={!resumen || resumen.items.length === 0}
                onClick={handleTransferir}
                data-testid="btn-transferir-calculadora"
                className="gap-1.5 text-xs bg-[#0072BC] hover:bg-[#005d99] text-white font-semibold cursor-pointer"
              >
                <span>Transferir a Calculadora</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
