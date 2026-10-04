import React from 'react';
import { ZoomIn } from 'lucide-react';

interface BrowserMockupProps {
  url: string;
  badge?: string;
  imageSrc: string;
  imageAlt: string;
  caption?: string;
  onOpenLightbox?: (src: string, title: string) => void;
}

export const BrowserMockup: React.FC<BrowserMockupProps> = ({
  url,
  badge = 'SISTEMA EN VIVO',
  imageSrc,
  imageAlt,
  caption,
  onOpenLightbox,
}) => {
  return (
    <div
      onClick={() => onOpenLightbox && onOpenLightbox(imageSrc, imageAlt)}
      className="group relative flex flex-col h-full bg-white border border-clave-border rounded-lg overflow-hidden shadow-md cursor-pointer hover:border-clave-gold transition-all duration-200"
    >
      {/* Browser Bar */}
      <div className="bg-slate-100 border-b border-clave-border-light px-3 py-1.5 flex items-center gap-2 select-none flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex-1 bg-white border border-slate-300 rounded px-2 py-0.5 font-mono text-[9.5px] text-slate-600 truncate text-center">
          {url}
        </div>
        {badge && (
          <span className="bg-clave-green text-white font-heading font-bold text-[8.5px] px-2 py-0.5 rounded uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>

      {/* Image Preview */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden flex items-start justify-center min-h-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-top group-hover:scale-[1.01] transition-transform duration-200"
        />

        {/* Floating Zoom Badge */}
        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-clave-navy/85 text-white font-heading font-bold text-[9px] flex items-center space-x-1.5 shadow-md pointer-events-none group-hover:bg-clave-gold group-hover:text-clave-navy transition-colors">
          <ZoomIn className="w-3 h-3" />
          <span>Clic para ampliar</span>
        </div>
      </div>

      {/* Footer Caption */}
      {caption && (
        <div className="px-3 py-1 bg-white border-t border-slate-100 text-[10.5px] text-clave-muted flex-shrink-0 truncate font-mono">
          {caption}
        </div>
      )}
    </div>
  );
};
