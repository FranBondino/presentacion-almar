'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import type { CategoriaFiscal, CategoriaIva } from '@/lib/supabase/database.types';
import { ShieldCheck, FileCheck, AlertCircle } from 'lucide-react';

export interface FiscalBadgeProps {
  categoriaFiscal?: CategoriaFiscal | null;
  tipoIva?: CategoriaIva | null;
  alicuotaIva?: number;
  showExplanation?: boolean;
  className?: string;
}

export function FiscalBadge({
  categoriaFiscal,
  tipoIva,
  alicuotaIva = 0,
  showExplanation = false,
  className,
}: FiscalBadgeProps) {
  const catStr = String(categoriaFiscal || '').toUpperCase();
  const ivaStr = String(tipoIva ?? '').toUpperCase();

  const isInternationalExempt =
    catStr === 'INTERNACIONAL_EXENTO_0' ||
    catStr === 'INTERNACIONAL_NO_GRAVADO' ||
    ivaStr === 'IVA_0_EXENTO' ||
    ivaStr === '0' ||
    (!catStr.includes('NACIONAL') && !catStr.includes('LOCAL') && alicuotaIva === 0);

  const isNoGravado =
    catStr === 'NO_GRAVADO' ||
    ivaStr === 'IVA_NO_GRAVADO';

  const isNational21 =
    !isInternationalExempt &&
    (catStr === 'NACIONAL_GRAVADO_21' ||
      catStr === 'NACIONAL_GRAVADO_OTRO' ||
      catStr === 'LOCAL_GRAVADO_21' ||
      ivaStr === 'IVA_21_GENERAL' ||
      ivaStr === 'IVA_10_5_REDUCIDO' ||
      ivaStr === '21' ||
      alicuotaIva > 0);

  let badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'purple' = 'info';
  let label = '0% IVA (Internacional Exento)';
  let explanation = 'Flete internacional exento de IVA según régimen aduanero (Art. 7 inc. h Ley de IVA — Kipintoch Tipo E).';
  let Icon = ShieldCheck;

  if (isInternationalExempt) {
    badgeVariant = 'info';
    label = '0% IVA (Internacional Exento)';
    explanation = 'Flete marítimo / aéreo internacional exento de IVA (Kipintoch Tipo E).';
    Icon = ShieldCheck;
  } else if (isNoGravado) {
    badgeVariant = 'secondary';
    label = 'No Gravado';
    explanation = 'Concepto no computable para el débito/crédito fiscal de IVA.';
    Icon = AlertCircle;
  } else if (isNational21) {
    badgeVariant = 'success';
    label = '21% IVA (Nacional Gravado)';
    explanation = 'Transporte terrestre local y servicios portuarios/terminales gravados con alícuota general 21% (Kipintoch Tipo G).';
    Icon = FileCheck;
  } else {
    badgeVariant = 'secondary';
    label = 'No Gravado';
    explanation = 'Concepto no computable para el débito/crédito fiscal de IVA.';
    Icon = AlertCircle;
  }

  return (
    <div className="inline-flex flex-col gap-0.5 max-w-full min-w-0">
      <Badge variant={badgeVariant} className={`max-w-full whitespace-normal leading-tight py-0.5 px-2 ${className || ''}`}>
        <Icon className="h-3 w-3 mr-1 shrink-0" />
        <span className="font-mono text-[10.5px] font-semibold break-words">{label}</span>
      </Badge>
      {showExplanation && (
        <span className="text-[10px] text-slate-400 max-w-xs">{explanation}</span>
      )}
    </div>
  );
}
