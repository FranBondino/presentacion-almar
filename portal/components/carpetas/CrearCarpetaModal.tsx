'use client';

import * as React from 'react';
import {
  X,
  FolderPlus,
  Building2,
  Ship,
  Plane,
  Truck,
  Radio,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Hash,
} from 'lucide-react';
import type { CarpetaRecord } from '@/lib/mockData';
import type {
  AreaTransporte,
  SectorTransporte,
  EstadoEmbarque,
  TipoCarga,
} from '@/lib/supabase/database.types';
import { useToast } from '@/components/ui/ToastProvider';

export interface CrearCarpetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (nuevaCarpeta: CarpetaRecord) => void;
  existingCarpetas?: CarpetaRecord[];
  defaultOperatorName?: string;
}

const FREQUENT_CLIENTS = [
  { nombre: 'INDUSTRIAS JUAN F. SECCO S.A.', cuit: '30-50148721-6' },
  { nombre: 'SEGURIDAD LITORAL S.R.L.', cuit: '30-71084921-5' },
  { nombre: 'TADEO CZERWENY S.A.', cuit: '30-54129528-6' },
  { nombre: 'BRAYCO S.A.', cuit: '30-68912345-1' },
  { nombre: 'DON AURELIO S.A.', cuit: '30-70918273-4' },
  { nombre: 'COSMETICA GOURMET S.R.L.', cuit: '30-71123456-8' },
  { nombre: 'GERDAU ARGENTINA S.A.', cuit: '30-50284512-4' },
  { nombre: 'SOLARSOL S.R.L.', cuit: '30-71537318-8' },
];

const OPERADORES_ALMAR = [
  'Natali Hermoso',
  'Aldana Gómez',
  'Cecilia Dellamea',
  'Agustina Bucardo',
  'Ana Laura Talaban',
  'Victoria Moyano',
  'Abril Stampfli',
  'Zamira Abraham',
];

function computeNextSuggestedFolderCode(
  carpetas: CarpetaRecord[],
  area: AreaTransporte,
  sector: SectorTransporte
): { code: string; internalCode: string } {
  let maxNum = 1868;
  for (const c of carpetas) {
    const m = (c.numero_carpeta || '').match(/(\d{4,5})$/);
    if (m) {
      const n = parseInt(m[1]!, 10);
      if (n >= 1300 && n < 9000 && n > maxNum) {
        maxNum = n;
      }
    }
  }
  const next = maxNum + 1;
  const pad8 = String(next).padStart(8, '0');
  const yyyymm = '202611';

  if (sector === 'EXPORTACION') {
    const prefix = area === 'AEREO' ? 'EA' : area === 'TERRESTRE' ? 'ET' : 'EM';
    return {
      code: `${prefix}${next}`,
      internalCode: `OR/C-${yyyymm}${prefix}-${pad8}`,
    };
  }
  if (area === 'TERRESTRE') {
    return {
      code: `IT${next}`,
      internalCode: `OR/C-${yyyymm}IT-${pad8}`,
    };
  }
  const modCode = area === 'AEREO' ? 'IA' : 'IM';
  return {
    code: `C${next}`,
    internalCode: `OR/C-${yyyymm}${modCode}-${pad8}`,
  };
}

export function CrearCarpetaModal({
  isOpen,
  onClose,
  onCreated,
  existingCarpetas = [],
  defaultOperatorName = 'Natali Hermoso',
}: CrearCarpetaModalProps) {
  const { toast } = useToast();

  const [area, setArea] = React.useState<AreaTransporte>('MARITIMO');
  const [sector, setSector] = React.useState<SectorTransporte>('IMPORTACION');
  const [tipoCarga, setTipoCarga] = React.useState<TipoCarga>('FCL');
  const [estadoKipintoch, setEstadoKipintoch] = React.useState<'Orden de venta' | 'House'>('Orden de venta');
  const [estadoEmbarque, setEstadoEmbarque] = React.useState<EstadoEmbarque>('BOOKING_CONFIRMADO');

  const [numeroCarpeta, setNumeroCarpeta] = React.useState<string>('C1869');
  const [numeroInterno, setNumeroInterno] = React.useState<string>('OR/C-202611IM-00001869');
  const [clienteNombre, setClienteNombre] = React.useState<string>('');
  const [clienteCuit, setClienteCuit] = React.useState<string>('');
  const [shipperNombre, setShipperNombre] = React.useState<string>('');
  const [transportistaNombre, setTransportistaNombre] = React.useState<string>('');
  const [usuarioAsignado, setUsuarioAsignado] = React.useState<string>(defaultOperatorName);

  const [origen, setOrigen] = React.useState<string>('Shanghai, China (CNSHA)');
  const [destino, setDestino] = React.useState<string>('Puerto Rosario, Argentina (ARROS)');
  const [contenedor, setContenedor] = React.useState<string>('');
  const [hblHawb, setHblHawb] = React.useState<string>('');
  const [mblMawb, setMblMawb] = React.useState<string>('');
  const [booking, setBooking] = React.useState<string>('');
  const [buqueVuelo, setBuqueVuelo] = React.useState<string>('');
  const [etd, setEtd] = React.useState<string>('');
  const [eta, setEta] = React.useState<string>('');
  const [ventaEstimada, setVentaEstimada] = React.useState<number>(0);
  const [costoEstimado, setCostoEstimado] = React.useState<number>(0);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const suggested = computeNextSuggestedFolderCode(existingCarpetas, area, sector);
    setNumeroCarpeta(suggested.code);
    setNumeroInterno(
      estadoKipintoch === 'House'
        ? suggested.internalCode.replace(/^OR\//, '')
        : suggested.internalCode
    );
  }, [isOpen, existingCarpetas, area, sector, estadoKipintoch]);

  if (!isOpen) return null;

  const handleSelectQuickClient = (client: { nombre: string; cuit: string }) => {
    setClienteNombre(client.nombre);
    setClienteCuit(client.cuit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!numeroCarpeta.trim()) {
      setErrorMsg('El código de carpeta (ej. C1869) es obligatorio.');
      return;
    }
    if (!clienteNombre.trim()) {
      setErrorMsg('El nombre o razón social del cliente es obligatorio.');
      return;
    }
    if (!origen.trim() || !destino.trim()) {
      setErrorMsg('El origen y el destino de la operación son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        numero_carpeta: numeroCarpeta.trim().toUpperCase(),
        numero_interno: numeroInterno.trim() || null,
        cliente_nombre: clienteNombre.trim(),
        cliente_cuit: clienteCuit.trim() || null,
        area,
        sector,
        estado: estadoEmbarque,
        tipo_carga: tipoCarga,
        estado_kipintoch: estadoKipintoch,
        origen: origen.trim(),
        destino: destino.trim(),
        contenedor: contenedor.trim().toUpperCase() || null,
        hbl_hawb: hblHawb.trim().toUpperCase() || null,
        mbl_mawb: mblMawb.trim().toUpperCase() || null,
        booking: booking.trim().toUpperCase() || null,
        buque_vuelo: buqueVuelo.trim() || null,
        etd: etd || null,
        eta: eta || null,
        shipper_nombre: shipperNombre.trim() || null,
        consignee_nombre: clienteNombre.trim(),
        transportista_nombre: transportistaNombre.trim() || null,
        usuario_asignado: usuarioAsignado,
        venta_estimada_total: Number(ventaEstimada) || 0,
        costo_estimado_total: Number(costoEstimado) || 0,
        moneda: 'USD',
      };

      const res = await fetch('/api/carpetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `No se pudo crear la carpeta (HTTP ${res.status})`);
      }

      const created = json.data as CarpetaRecord;
      toast.success(
        `Carpeta ${created.numero_carpeta} creada y en escucha 24/7`,
        `Asignada a ${usuarioAsignado}. Cualquier correo o factura PDF que mencione ${created.numero_carpeta}, su BL, contenedor o booking se vinculará automáticamente.`
      );
      onCreated(created);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la carpeta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-crear-carpeta-title"
      data-testid="crear-carpeta-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#0072BC]/20 text-sky-400 border border-[#0072BC]/40">
              <FolderPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 id="modal-crear-carpeta-title" className="text-base font-bold tracking-tight">
                Apertura Manual de Carpeta Operativa + Vinculación Automática Gmail 24/7
              </h2>
              <p className="text-xs text-slate-400">
                Para operaciones anticipadas por teléfono/WhatsApp o aperturas directas antes del primer hilo en Gmail.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs text-slate-800">
          {/* Active 24/7 Gmail Auto-Matching Banner */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
            <Radio className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold text-emerald-900">
                ¿Qué pasa con los correos y facturas después de crear la carpeta manualmente?
              </p>
              <p className="text-[11px] text-emerald-800">
                Apenas guardás esta carpeta, el motor de sincronización 24/7 la incorpora al índice activo de las{' '}
                <strong>18 casillas de ALMAR</strong>. Todo mail o factura PDF entrante que contenga el{' '}
                <strong>Código ({numeroCarpeta})</strong>, el <strong>Contenedor</strong>, el{' '}
                <strong>HBL/MBL</strong>, el <strong>Booking</strong> o el <strong>CUIT del cliente</strong> se adjunta
                automáticamente al timeline y al Kanban de comprobantes de esta carpeta.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Modality, Sector, Kipintoch State, Folder Code */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vía / Área</label>
              <select
                value={area}
                onChange={(e) => {
                  const nextArea = e.target.value as AreaTransporte;
                  setArea(nextArea);
                  if (nextArea === 'AEREO') setTipoCarga('AEREO');
                  else if (nextArea === 'MARITIMO') setTipoCarga('FCL');
                }}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="MARITIMO">🚢 Marítimo (IM/EM)</option>
                <option value="AEREO">✈️ Aéreo / Courier (IA/EA)</option>
                <option value="TERRESTRE">🚛 Terrestre (IT/ET)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorTransporte)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="IMPORTACION">Importación</option>
                <option value="EXPORTACION">Exportación</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estado Kipintoch</label>
              <select
                value={estadoKipintoch}
                onChange={(e) => setEstadoKipintoch(e.target.value as 'Orden de venta' | 'House')}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Orden de venta">Orden de venta (OR/...)</option>
                <option value="House">House (Embarque en curso)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-[#0072BC]" />
                <span>Código Carpeta *</span>
              </label>
              <input
                type="text"
                value={numeroCarpeta}
                onChange={(e) => setNumeroCarpeta(e.target.value.toUpperCase())}
                placeholder="Ej. C1869"
                className="w-full px-2.5 py-2 border border-sky-300 bg-sky-50/40 rounded-lg font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Quick Client Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Autocompletar Cliente Frecuente de ALMAR:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENT_CLIENTS.map((c) => (
                <button
                  key={c.cuit}
                  type="button"
                  onClick={() => handleSelectQuickClient(c)}
                  className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {c.nombre.split(' ')[0]} ({c.cuit})
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Client, CUIT, Assigned Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Cliente (Importador / Exportador) *</span>
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. INDUSTRIAS JUAN F. SECCO S.A."
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">CUIT Cliente (para match AFIP)</label>
              <input
                type="text"
                value={clienteCuit}
                onChange={(e) => setClienteCuit(e.target.value)}
                placeholder="Ej. 30-50148721-6"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Operador Responsable Asignado</span>
              </label>
              <select
                value={usuarioAsignado}
                onChange={(e) => setUsuarioAsignado(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                {OPERADORES_ALMAR.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Origin, Destination, Internal Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Puerto / Aeropuerto Origen *</label>
              <input
                type="text"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                placeholder="Ej. Shanghai, China (CNSHA)"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Puerto / Aeropuerto Destino *</label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej. Puerto Rosario (ARROS)"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">N° Interno Kipintoch</label>
              <input
                type="text"
                value={numeroInterno}
                onChange={(e) => setNumeroInterno(e.target.value)}
                placeholder="OR/C-202611IM-00001869"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Row 4: Identifiers for Automatic Gmail & Invoice Matching */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Identificadores de Trazabilidad &amp; Actores (Opcionales — activan match automático de facturas)
              </span>
              <span className="text-[10px] text-slate-500">Prioridad: Contenedor (95%) &gt; BL (90%) &gt; Booking (85%)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Contenedor (ISO 6346)</label>
                <input
                  type="text"
                  value={contenedor}
                  onChange={(e) => setContenedor(e.target.value.toUpperCase())}
                  placeholder="Ej. MSCU9876543"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">HBL / HAWB / CRT</label>
                <input
                  type="text"
                  value={hblHawb}
                  onChange={(e) => setHblHawb(e.target.value.toUpperCase())}
                  placeholder="Ej. SHAROS2611089"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Booking / MBL</label>
                <input
                  type="text"
                  value={booking}
                  onChange={(e) => setBooking(e.target.value.toUpperCase())}
                  placeholder="Ej. BKG2611990"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-600 mb-1">Shipper / Proveedor Exterior</label>
                <input
                  type="text"
                  value={shipperNombre}
                  onChange={(e) => setShipperNombre(e.target.value)}
                  placeholder="Ej. WUXI HUANAWELL METAL MFG CO."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-600 mb-1">Agente / Naviera / Aerolínea</label>
                <input
                  type="text"
                  value={transportistaNombre}
                  onChange={(e) => setTransportistaNombre(e.target.value)}
                  placeholder="Ej. EVERSAIL LOGISTICS / MSC / MAERSK"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Venta Estimada (USD)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ventaEstimada || ''}
                  onChange={(e) => setVentaEstimada(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Costo Estimado (USD)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={costoEstimado || ''}
                  onChange={(e) => setCostoEstimado(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">ETD (Salida Est.)</label>
                <input
                  type="date"
                  value={etd}
                  onChange={(e) => setEtd(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">ETA (Arribo Est.)</label>
                <input
                  type="date"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#0072BC] hover:bg-[#005a96] text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Creando Carpeta...' : `Crear Carpeta ${numeroCarpeta} y Activar Escucha`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
