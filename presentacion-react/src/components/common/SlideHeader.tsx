import React from 'react';

interface SlideHeaderProps {
  momentoBadge: string;
  slideNumber: string;
  categoryBadge?: string;
  title: string;
  subtitle: string;
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({
  momentoBadge,
  slideNumber,
  categoryBadge,
  title,
  subtitle,
}) => {
  return (
    <div className="mb-2 pb-1.5 border-b-[1.5px] border-clave-border-light relative z-10 flex-shrink-0 select-none">
      <div className="flex items-center justify-between mb-0.5">
        <span className="inline-block bg-clave-gold-light border border-clave-gold text-clave-green font-heading text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          {momentoBadge}
        </span>
        <div className="flex items-center space-x-2">
          {categoryBadge && (
            <span className="px-2 py-0.5 rounded-full font-heading text-[9px] font-bold uppercase tracking-wide bg-clave-green-soft text-clave-green border border-clave-green/20">
              {categoryBadge}
            </span>
          )}
          <span className="text-[10px] text-clave-muted font-mono font-semibold tracking-wider uppercase">
            SLIDE {slideNumber}
          </span>
        </div>
      </div>
      <h2 className="font-heading text-[18px] font-extrabold text-clave-green uppercase tracking-tight leading-tight mb-0.5">
        {title}
      </h2>
      <p className="font-body text-[11.5px] text-clave-muted leading-tight">
        {subtitle}
      </p>
    </div>
  );
};
