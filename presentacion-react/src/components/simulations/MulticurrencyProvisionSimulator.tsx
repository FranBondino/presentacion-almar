import React, { useState } from 'react';
import { CurrencyCode } from '../../types/presentation';
import { Coins, Clock, FileCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

interface MulticurrencyProvisionSimulatorProps {
  initialTab?: 'multicurrency' | 'sancor';
}

export const MulticurrencyProvisionSimulator: React.FC<MulticurrencyProvisionSimulatorProps> = ({
  initialTab = 'multicurrency',
}) => {
  const [activeTab, setActiveTab] = useState<'multicurrency' | 'sancor'>(initialTab);

  // Multicurrency State (Caso C620)
  const [moneda, setMoneda] = useState<CurrencyCode>('GBP');
  const [montoOriginal, setMontoOriginal] = useState<number>(543);

  const exchangeRates: Record<CurrencyCode, { rate: number; label: string; symbol: string }> = {
    GBP: { rate: 1.3628, label: 'Libra Esterlina (GBP)', symbol: '£' },
    EUR: { rate: 1.085, label: 'Euro (EUR)', symbol: '€' },
    BRL: { rate: 0.182, label: 'Real Brasileño (BRL)', symbol: 'R$' },
    USD: { rate: 1.0, label: 'Dólar Estadounidense (USD)', symbol: 'USD' },
  };

  const currentRate = exchangeRates[moneda];
  const totalUSD = montoOriginal * currentRate.rate;

  // Sancor Provision State (Caso Sancor Seguros)
  const [fobAmount, setFobAmount] = useState<number>(40000);
  const [diasTranscurridos, setDiasTranscurridos] = useState<number>(45);
  const [polizaArribada, setPolizaArribada] = useState<boolean>(false);

  const provisionRate = 0.0055; // 0.55% FOB
  const provisionUSD = fobAmount * provisionRate;
  const fleteCotizado = 3200;
  const costoNaviero = 2400;
  const costoSeguroReal = 215; // facturado al día 118
  const margenConProvision = fleteCotizado - costoNaviero - (polizaArribada ? costoSeguroReal : provisionUSD);

  const isCommissionReleased = polizaArribada || diasTranscurridos >= 150;

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-clave-border-light rounded-lg p-3.5 justify-between shadow-xs">
      {/* Tabs Switcher */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('multicurrency')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-heading font-bold transition-colors ${
              activeTab === 'multicurrency'
                ? 'bg-clave-green text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Caso C620: Multimoneda BNA Oficial</span>
          </button>

          <button
            onClick={() => setActiveTab('sancor')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-heading font-bold transition-colors ${
              activeTab === 'sancor'
                ? 'bg-clave-green text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Caso Sancor: Provisión 150 Días</span>
          </button>
        </div>

        <span className="text-[10.5px] font-mono text-clave-muted uppercase hidden sm:inline">
          {activeTab === 'multicurrency' ? 'Compliance Cambiario & DGA' : 'Blindaje Financiero'}
        </span>
      </div>

      {/* Main Tab Content */}
      <div className="py-2 flex-1">
        {activeTab === 'multicurrency' ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Currency Selector & Inputs */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Seleccionar Divisa de Factura:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GBP', 'EUR', 'BRL'] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setMoneda(c);
                        if (c === 'GBP') setMontoOriginal(543);
                        if (c === 'EUR') setMontoOriginal(1200);
                        if (c === 'BRL') setMontoOriginal(4500);
                      }}
                      className={`py-1.5 px-2 rounded border text-xs font-heading font-bold transition-colors ${
                        moneda === c
                          ? 'border-clave-green bg-emerald-50 text-clave-green'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {exchangeRates[c].symbol} {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Monto Original en {moneda}:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">
                    {currentRate.symbol}
                  </span>
                  <input
                    type="number"
                    value={montoOriginal}
                    onChange={(e) => setMontoOriginal(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-clave-green"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tipo de Cambio Oficial BNA:</span>
                  <span className="font-mono font-bold text-slate-800">
                    1 {moneda} = {currentRate.rate.toFixed(4)} USD
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fecha de Operación:</span>
                  <span className="font-mono text-slate-800">Fecha de Embarque Canónica</span>
                </div>
              </div>
            </div>

            {/* Conversion Result & Certificate Preview */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Liquidación Oficial Validada
                </div>

                <div className="p-3 bg-clave-platinum rounded-lg border border-clave-border-light text-center space-y-1 mb-3">
                  <div className="text-xs text-slate-500 font-heading">TOTAL CONVERTIDO A DÓLARES:</div>
                  <div className="font-heading font-extrabold text-2xl text-clave-green font-mono">
                    USD {totalUSD.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {currentRate.symbol} {montoOriginal.toLocaleString()} × {currentRate.rate.toFixed(4)}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center space-x-1 font-bold">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Constancia Digital Adjunta:</span>
                  </div>
                  <p className="text-[10.5px] leading-tight text-emerald-800 font-mono">
                    C620_Constancia_Cotizacion_BNA_{moneda}.pdf
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[10.5px] text-slate-500 font-mono">
                <span>Cero tipeo a mano en Permiso DGA</span>
                <span className="text-clave-green font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Vanesa Tranquila
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Sancor Provision Tab */
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Controls */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-heading font-semibold mb-1">
                  <span className="text-slate-700">Valor FOB Mercadería (USD):</span>
                  <span className="font-mono text-clave-navy font-bold">
                    USD {fobAmount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="5000"
                  value={fobAmount}
                  onChange={(e) => {
                    setFobAmount(Number(e.target.value));
                    setPolizaArribada(false);
                  }}
                  className="w-full accent-clave-green cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
                  <span>$10,000</span>
                  <span>$100,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-heading font-semibold mb-1">
                  <span className="text-slate-700">Ventana de Tiempo Transcurrida:</span>
                  <span className="font-mono text-clave-gold-dark font-bold">
                    Día {diasTranscurridos} de 150
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="150"
                  step="1"
                  value={diasTranscurridos}
                  onChange={(e) => {
                    setDiasTranscurridos(Number(e.target.value));
                    if (Number(e.target.value) >= 118) {
                      setPolizaArribada(true);
                    } else {
                      setPolizaArribada(false);
                    }
                  }}
                  className="w-full accent-clave-gold cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
                  <span>Día 1 (Embarque)</span>
                  <span>Día 118 (Póliza Sancor)</span>
                  <span>Día 150 (Vence Holdback)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setDiasTranscurridos(118);
                  setPolizaArribada(true);
                }}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-heading font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simular Arribo de Póliza Sancor (Día 118)</span>
              </button>
            </div>

            {/* Ledger & Commission Status */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ledger Contable de Carpeta
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">Flete Internacional:</span>
                  <span className="font-mono font-bold text-clave-navy">+USD {fleteCotizado}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">Costo Naviero Real:</span>
                  <span className="font-mono font-bold text-rose-600">-USD {costoNaviero}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">
                    Provisión Seguro ({polizaArribada ? 'Factura Real' : '0.55% FOB'}):
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    -USD {polizaArribada ? costoSeguroReal : provisionUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span className="text-slate-800">Margen Neto Real:</span>
                  <span className="font-mono text-clave-green">USD {margenConProvision.toFixed(2)}</span>
                </div>
              </div>

              {/* Commission Holdback Badge */}
              <div className="mt-2">
                {isCommissionReleased ? (
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-0.5">
                    <div className="font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>COMISIÓN LIBERADA / LIQUIDABLE</span>
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      Póliza ingresada o plazo cumplido. Ganancia neta real confirmada en caja.
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-0.5">
                    <div className="font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      <span>RETENIDA_COSTOS_PENDIENTES</span>
                    </div>
                    <p className="text-[10px] text-rose-800">
                      Faltan {150 - diasTranscurridos} días o arribo de póliza. Cero anticipo de comisiones sobre utilidades ficticias.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 px-3 bg-clave-gold-light border border-clave-gold/40 rounded text-[11px] text-clave-text flex justify-between items-center">
        <span>
          {activeTab === 'multicurrency'
            ? 'Regla: Cotización oficial vendedor del BNA a fecha de embarque incorporada automáticamente.'
            : 'Directiva Vanesa: Ni un solo peso de comisión sale de caja hasta el impacto real de costos.'}
        </span>
        <span className="font-mono text-[10px] text-clave-green font-bold">
          {activeTab === 'multicurrency' ? 'DGA COMPLIANCE' : 'PROTECCIÓN DE CAJA'}
        </span>
      </div>
    </div>
  );
};
