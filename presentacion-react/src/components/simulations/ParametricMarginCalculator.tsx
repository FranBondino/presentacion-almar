import React, { useState } from 'react';
import { MarginProfile } from '../../types/presentation';
import { WebAuthnModal } from './WebAuthnModal';
import { AlertTriangle, Lock, ShieldCheck, Fingerprint, Calculator } from 'lucide-react';

export const ParametricMarginCalculator: React.FC = () => {
  const [perfil, setPerfil] = useState<MarginProfile>('ESTANDAR');
  const [fleteNaviero, setFleteNaviero] = useState<number>(2800);
  const [margenComercial, setMargenComercial] = useState<number>(350);
  const [isWebAuthnOpen, setIsWebAuthnOpen] = useState<boolean>(false);
  const [authorizedHash, setAuthorizedHash] = useState<string | null>(null);

  const gastosLocalesFijos = 320; // USD

  // Dynamic profile updates
  const handleProfileChange = (newProfile: MarginProfile) => {
    setPerfil(newProfile);
    if (newProfile === 'CUENTA_ESTRATEGICA') {
      setMargenComercial(220); // 7-8%
    } else if (newProfile === 'ESTANDAR') {
      setMargenComercial(450); // 14-15%
    } else if (newProfile === 'SPOT_ALTO_RIESGO') {
      setMargenComercial(750); // 20-25%
    }
  };

  const precioVenta = fleteNaviero + gastosLocalesFijos + margenComercial;
  const margenUSD = margenComercial;
  const margenPorcentaje = (margenUSD / (precioVenta || 1)) * 100;

  // Gate evaluation
  const isBlocking = margenUSD < 3.0;
  const isWarning = margenUSD < 200.0 && !isBlocking;
  const isSafe = margenUSD >= 200.0;

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-clave-border-light rounded-lg p-3.5 justify-between shadow-xs">
      {/* Header with Title and Profile Selector */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-clave-gold/20 text-clave-gold-dark">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs uppercase text-clave-navy">
              Calculadora Paramétrica en Tiempo Real
            </h4>
            <p className="text-[10.5px] text-slate-500">
              Adaptación instantánea de pricing según tipo de cliente y mercado
            </p>
          </div>
        </div>

        {/* Profile Selector */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
          {(['CUENTA_ESTRATEGICA', 'ESTANDAR', 'SPOT_ALTO_RIESGO', 'PERSONALIZADO'] as MarginProfile[]).map(
            (p) => (
              <button
                key={p}
                onClick={() => handleProfileChange(p)}
                className={`px-2 py-0.5 rounded text-[10px] font-heading font-semibold transition-colors ${
                  perfil === p
                    ? 'bg-clave-green text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p === 'CUENTA_ESTRATEGICA'
                  ? 'Estratégico'
                  : p === 'ESTANDAR'
                  ? 'Estándar'
                  : p === 'SPOT_ALTO_RIESGO'
                  ? 'Spot Alto'
                  : 'Personalizado'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-2 gap-4 py-2 flex-1">
        {/* Left Column: Sliders */}
        <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-around">
          <div>
            <div className="flex justify-between text-xs font-heading font-semibold mb-1">
              <span className="text-slate-700">Flete Naviero Base (USD):</span>
              <span className="font-mono text-clave-navy font-bold">USD {fleteNaviero.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="6000"
              step="50"
              value={fleteNaviero}
              onChange={(e) => {
                setFleteNaviero(Number(e.target.value));
                setAuthorizedHash(null);
              }}
              className="w-full accent-clave-green cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
              <span>$1,000 (Spot Baja)</span>
              <span>$6,000 (Pico Asia)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-heading font-semibold mb-1">
              <span className="text-slate-700">Margen Comercial (Markup):</span>
              <span
                className={`font-mono font-bold ${
                  isBlocking ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                USD {margenComercial.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1200"
              step="10"
              value={margenComercial}
              onChange={(e) => {
                setMargenComercial(Number(e.target.value));
                setAuthorizedHash(null);
              }}
              className="w-full accent-clave-gold cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
              <span>$0 (Pérdida)</span>
              <span>$200 (Umbral)</span>
              <span>$1,200 (Premium)</span>
            </div>
          </div>

          <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Gastos Locales &amp; Puerto (Fijos):</span>
            <span className="font-mono font-semibold text-slate-800">USD {gastosLocalesFijos}</span>
          </div>
        </div>

        {/* Right Column: Calculated Results & Safeguards */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Resultados en Tiempo Real
            </div>

            <div className="flex justify-between items-center pb-1 border-b border-slate-100">
              <span className="text-xs text-slate-600">Precio Venta Cotizado:</span>
              <span className="font-heading font-extrabold text-base text-clave-navy font-mono">
                USD {precioVenta.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pb-1 border-b border-slate-100">
              <span className="text-xs text-slate-600">Margen Neto Proyectado:</span>
              <span
                className={`font-mono font-extrabold text-sm ${
                  isBlocking ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                USD {margenUSD.toLocaleString()} ({margenPorcentaje.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Status Alert Indicator */}
          <div className="mt-2">
            {isSafe ? (
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="leading-tight">
                  <strong>Margen Seguro:</strong> Rentabilidad adecuada. Emisión autorizada en 45 segundos.
                </span>
              </div>
            ) : isWarning ? (
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>ALERTA: Margen &lt; USD 200 (Riesgo Descalce)</span>
                </div>
                <p className="text-[10.5px] leading-tight text-amber-800">
                  Gastos en pesos pueden absorber el margen. Se permite emitir o requerir override gerencial.
                </p>
                {!authorizedHash ? (
                  <button
                    onClick={() => setIsWebAuthnOpen(true)}
                    className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-heading font-semibold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Firmar Override con WebAuthn</span>
                  </button>
                ) : (
                  <div className="p-1 bg-emerald-100 text-emerald-900 rounded font-mono text-[9px] truncate">
                    ✓ Autorizado con firma SHA-256: {authorizedHash.substring(0, 16)}...
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>BLOQUEO ESTRICTO: Margen &lt; USD 3.00</span>
                </div>
                <p className="text-[10.5px] leading-tight text-rose-800">
                  Operación a quebranto nulo o negativo. Emisión deshabilitada en el sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Callout */}
      <div className="p-2 px-3 bg-clave-gold-light border border-clave-gold/40 rounded text-[11px] text-clave-text flex justify-between items-center">
        <span>
          <strong>Respuesta a Alejandro:</strong> Flexibilidad total para pelear fletes spot sin trabar la venta, con compuerta de seguridad automática.
        </span>
        <span className="font-mono text-[10px] text-clave-green font-bold">
          PRICING DINÁMICO
        </span>
      </div>

      {/* Biometric WebAuthn Modal */}
      <WebAuthnModal
        isOpen={isWebAuthnOpen}
        onClose={() => setIsWebAuthnOpen(false)}
        onAuthorized={(hash) => {
          setAuthorizedHash(hash);
        }}
        carpeta="C1234"
        margenUSD={margenUSD}
      />
    </div>
  );
};
