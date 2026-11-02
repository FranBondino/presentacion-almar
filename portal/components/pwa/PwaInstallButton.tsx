'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Smartphone, Download, Share, PlusSquare, MoreVertical, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __almarDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export interface PwaInstallButtonProps {
  variant?: 'sidebar' | 'login' | 'compact';
  className?: string;
}

export function PwaInstallButton({ variant = 'sidebar', className }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'ios' | 'android'>('ios');

  React.useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // Detect if already running as installed standalone PWA
    const standaloneMatch =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
    setIsStandalone(Boolean(standaloneMatch));

    // Detect OS to default the modal tab
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('android')) {
      setActiveTab('android');
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }

    // Register Service Worker for PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (window.__almarDeferredPrompt) {
      setDeferredPrompt(window.__almarDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__almarDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__almarDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__almarDeferredPrompt : null);
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          window.__almarDeferredPrompt = null;
          setDeferredPrompt(null);
        }
        return;
      } catch {
        // Fallback to visual guide modal
      }
    }
    setShowModal(true);
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          data-testid="btn-pwa-install-sidebar"
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/15 py-2 px-3 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 hover:border-sky-400/50 hover:text-white transition-colors cursor-pointer shadow-xs',
            className
          )}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0 text-sky-400" />
          <span className="truncate">Descargar App en Celular</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Descargar App en el Celular"
          data-testid="btn-pwa-install-compact"
          className={cn(
            'w-full flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/15 py-2 text-sky-300 hover:bg-sky-500/25 hover:text-white transition-colors cursor-pointer',
            className
          )}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
        </button>
      )}

      {variant === 'login' && (
        <button
          type="button"
          onClick={handleInstallClick}
          data-testid="btn-pwa-install-login"
          className={cn(
            'w-full flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-white/90 hover:bg-sky-50/80 px-4 py-3 text-left shadow-xs transition-all cursor-pointer group',
            className
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
              <Image
                src="/icons/icon-192.png"
                alt="App ALMAR Rosario"
                width={36}
                height={36}
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#0072BC] transition-colors flex items-center gap-1.5">
                <span>Descargar App en el Celular</span>
                <span className="inline-flex items-center rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-[#0072BC]">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Instalala en tu pantalla de inicio con el logo de ALMAR
              </p>
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#0072BC]/10 text-[#0072BC] group-hover:bg-[#0072BC] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Download className="h-4 w-4" />
          </div>
        </button>
      )}

      {mounted &&
        showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-pwa-install"
            >
              {/* Top Corporate Banner */}
              <div className="bg-[#081433] px-5 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/icons/icon-192.png"
                      alt="ALMAR Rosario App"
                      width={44}
                      height={44}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white">Instalar App ALMAR Rosario</h3>
                    </div>
                    <p className="text-[11px] text-sky-300">
                      Acceso directo en tu celular a pantalla completa
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  aria-label="Cerrar ventana de instalación"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Preview Badge */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-slate-700 leading-relaxed">
                    El portal funciona como una <strong>Aplicación Web Progresiva (PWA)</strong>: no ocupa memoria en tu teléfono, no requiere App Store y queda en tu pantalla de inicio con el <strong>logo oficial de ALMAR</strong>.
                  </p>
                </div>

                {/* OS Selector Tabs */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activeTab === 'android'
                        ? 'bg-[#0072BC] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Android / Chrome
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activeTab === 'ios'
                        ? 'bg-[#0072BC] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    iPhone / iPad (Safari)
                  </button>
                </div>

                {activeTab === 'android' ? (
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0072BC] text-white font-bold text-[11px]">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>Tocá el menú de opciones de Chrome</span>
                          <MoreVertical className="h-4 w-4 text-slate-500 inline" />
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          Ubicado en la esquina superior derecha de tu navegador móvil (o el ícono de instalación en la barra de direcciones en PC).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0072BC] text-white font-bold text-[11px]">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>Seleccioná &ldquo;Instalar aplicación&rdquo;</span>
                          <Download className="h-4 w-4 text-[#0072BC] inline" />
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          También puede figurar como <strong>&ldquo;Agregar a la pantalla principal&rdquo;</strong>. Confirmá tocando <strong>Instalar</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0072BC] text-white font-bold text-[11px]">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>Tocá el botón Compartir en Safari</span>
                          <Share className="h-4 w-4 text-[#0072BC] inline" />
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          En la barra inferior de Safari, tocá el ícono del cuadrado con la flecha hacia arriba.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0072BC] text-white font-bold text-[11px]">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>Elegí &ldquo;Agregar a inicio&rdquo;</span>
                          <PlusSquare className="h-4 w-4 text-[#0072BC] inline" />
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          Deslizá el menú hacia abajo, tocá <strong>&ldquo;Agregar a inicio&rdquo;</strong> y luego confirmá en <strong>Agregar</strong> arriba a la derecha.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#081433] hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
