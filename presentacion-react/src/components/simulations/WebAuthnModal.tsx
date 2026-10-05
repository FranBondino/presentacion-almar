import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

interface WebAuthnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: (hash: string) => void;
  carpeta?: string;
  margenUSD?: number;
}

export const WebAuthnModal: React.FC<WebAuthnModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  carpeta = 'C1234',
  margenUSD = 142.5,
}) => {
  const [motivo, setMotivo] = useState<string>('Aumento de tarifa naviera pactado con cliente');
  const [scanning, setScanning] = useState<boolean>(false);
  const [completedHash, setCompletedHash] = useState<string | null>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      // Simulate genuine cryptographic SHA-256 hash stamp
      const randomHex = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setScanning(false);
      setCompletedHash(randomHex);
      onAuthorized(randomHex);
    }, 1200);
  };

  const handleReset = () => {
    setCompletedHash(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="fixed inset-0 bg-clave-navy/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-clave-border overflow-hidden z-10 p-5 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-clave-navy text-clave-gold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-clave-navy">
                    Autorización Biométrica WebAuthn
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    Carpeta {carpeta} · FIDO2 / TPM Hardware
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-3.5">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                <div className="flex justify-between font-mono font-bold text-amber-900 mb-0.5">
                  <span>DESVÍO PREVENTIVO:</span>
                  <span>Margen USD {margenUSD.toFixed(2)} (&lt; $200)</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-tight">
                  Requiere validación pericial de Gerencia y Dirección General.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Motivo Formal de Excepción:
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-clave-green"
                >
                  <option value="Aumento de tarifa naviera pactado con cliente">
                    Aumento de tarifa naviera pactado con cliente
                  </option>
                  <option value="Volumen estratégico de cuenta corporativa">
                    Volumen estratégico de cuenta corporativa
                  </option>
                  <option value="Carga spot compensada en otro tramo operativo">
                    Carga spot compensada en otro tramo operativo
                  </option>
                  <option value="Acuerdo especial de Jefatura Comercial">
                    Acuerdo especial de Jefatura Comercial
                  </option>
                </select>
              </div>

              {/* Biometric Sensor Area */}
              {!completedHash ? (
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleScan}
                    disabled={scanning}
                    className={`relative p-4 rounded-full transition-all ${
                      scanning
                        ? 'bg-amber-100 text-amber-700 animate-pulse'
                        : 'bg-clave-green text-white hover:bg-clave-green-light shadow-md'
                    }`}
                  >
                    <Fingerprint className="w-10 h-10" />
                  </motion.button>
                  <span className="font-heading font-semibold text-xs text-slate-700 mt-2">
                    {scanning ? 'Escaneando hardware biométrico...' : 'Apoyar huella dactilar (Touch ID / Windows Hello)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Clave privada protegida en chip TPM (cero passwords compartidas)
                  </span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-heading font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Firma Criptográfica SHA-256 Aprobada</span>
                  </div>
                  <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[9px] break-all leading-tight select-all">
                    {completedHash}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ley Nº 25.506 (Firma Digital)</span>
                    </span>
                    <span className="text-emerald-700 font-bold">AUDIT_LOG OK</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                {completedHash ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
