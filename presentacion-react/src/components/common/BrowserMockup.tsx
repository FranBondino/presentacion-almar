import React, { useState } from 'react';
import { ZoomIn, Eye, Sparkles } from 'lucide-react';

export interface KeyDataItem {
  label: string;
  value: string;
  color?: 'green' | 'gold' | 'navy' | 'rose' | 'amber' | 'slate';
  highlight?: boolean;
}

interface BrowserMockupProps {
  url: string;
  badge?: string;
  imageSrc: string;
  imageAlt: string;
  caption?: string;
  keyData?: KeyDataItem[];
  focalOrigin?: string; // e.g. 'center top', 'center center'
  onOpenLightbox?: (src: string, title: string) => void;
}

export const BrowserMockup: React.FC<BrowserMockupProps> = ({
  url,
  badge = 'SISTEMA EN VIVO',
  imageSrc,
  imageAlt,
  caption,
  keyData,
  focalOrigin = 'center 28%',
  onOpenLightbox,
}) => {
  const [isFocalZoom, setIsFocalZoom] = useState(false);

  const getPillClasses = (color: KeyDataItem['color'] = 'slate', highlight?: boolean) => {
    const base = 'px-2 py-0.5 rounded text-[10.5px] font-mono font-bold flex items-center gap-1 border ';
    if (highlight) {
      return base + 'bg-clave-gold text-clave-navy border-clave-gold-dark shadow-xs';
    }
    switch (color) {
      case 'green':
        return base + 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'rose':
        return base + 'bg-rose-50 text-rose-800 border-rose-300';
      case 'amber':
        return base + 'bg-amber-50 text-amber-900 border-amber-300';
      case 'gold':
        return base + 'bg-amber-100/80 text-amber-950 border-amber-300';
      case 'navy':
        return base + 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return base + 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      onClick={() => onOpenLightbox && onOpenLightbox(imageSrc, imageAlt)}
      className="group relative flex flex-col h-full bg-white border border-clave-border rounded-lg overflow-hidden shadow-md cursor-pointer hover:border-clave-gold transition-all duration-200"
    >
      {/* Browser Bar */}
      <div className="bg-slate-100 border-b border-clave-border-light px-3 py-1.5 flex items-center justify-between gap-2 select-none flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex gap-1.5 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="bg-white border border-slate-300 rounded px-2 py-0.5 font-mono text-[9.5px] text-slate-600 truncate max-w-[260px]">
            {url}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick In-Slide Focal Zoom Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFocalZoom(!isFocalZoom);
            }}
            title={isFocalZoom ? 'Ver captura completa' : 'Acercar datos clave (Modo Lupa)'}
            className={`px-2 py-0.5 rounded text-[9px] font-heading font-bold flex items-center gap-1 transition-colors ${
              isFocalZoom
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{isFocalZoom ? 'Vista Normal' : '🔍 Lupa Datos'}</span>
          </button>

          {badge && (
            <span className="bg-clave-green text-white font-heading font-bold text-[8.5px] px-2 py-0.5 rounded uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Image Preview Container */}
      <div className="relative flex-1 bg-slate-900/5 overflow-hidden flex items-center justify-center min-h-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{
            transformOrigin: focalOrigin,
            transform: isFocalZoom ? 'scale(1.75)' : 'scale(1)',
          }}
          className="w-full h-full object-cover object-top transition-transform duration-300 ease-out"
        />

        {/* Floating Zoom Action Pill */}
        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-clave-navy/90 text-white font-heading font-bold text-[9px] flex items-center space-x-1.5 shadow-md pointer-events-none group-hover:bg-clave-gold group-hover:text-clave-navy transition-colors">
          <ZoomIn className="w-3 h-3" />
          <span>{isFocalZoom ? 'Clic para HD Pantalla Completa' : 'Clic para ampliar HD'}</span>
        </div>

        {/* Indicator when focal zoom is active */}
        {isFocalZoom && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500/90 text-white font-mono text-[9px] font-bold shadow-xs pointer-events-none flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>MODO LUPA 175% · DATOS AMPLIADOS</span>
          </div>
        )}
      </div>

      {/* Extracted Key Data Strip (Ensures 100% legibility on projector/screen) */}
      {keyData && keyData.length > 0 && (
        <div className="px-2.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 flex-wrap flex-shrink-0 select-none">
          <span className="text-[9px] font-heading font-bold text-slate-500 uppercase tracking-wider mr-1">
            Datos Clave:
          </span>
          {keyData.map((item, idx) => (
            <div key={idx} className={getPillClasses(item.color, item.highlight)}>
              <span className="opacity-75">{item.label}:</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer Caption */}
      {caption && (
        <div className="px-3 py-1 bg-white border-t border-slate-100 text-[10.5px] text-clave-muted flex-shrink-0 truncate font-mono">
          {caption}
        </div>
      )}
    </div>
  );
};
