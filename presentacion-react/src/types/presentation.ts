// Types for ALMAR Rosario Executive Presentation

export interface SlideProps {
  slideIndex: number;
  isActive: boolean;
  onOpenLightbox?: (src: string, title: string) => void;
}

export interface PresentationState {
  currentSlide: number; // 1 to 18
  isNotesOpen: boolean;
  isGridOpen: boolean;
  isFullscreen: boolean;
  lightboxImage: { src: string; title: string } | null;
}

export interface SlideMetadata {
  id: number;
  number: string; // '01'..'18'
  title: string;
  subtitle: string;
  block: number; // 1..5
  blockTitle: string;
  badgePrimary: string;
  badgeSecondary?: string;
  thumbnailUrl: string;
}

export interface SpeakerNotesData {
  slideId: number;
  title: string;
  timeAllocation: string;
  keyStakeholders: string[];
  whatAudienceSees: string;
  demoCues: string[];
  verbatimSpeech: string;
  objections?: {
    stakeholder: string;
    objection: string;
    response: string;
  }[];
}

/* Micro-simulation Contracts */

export type PipelineStage = 'ingesta' | 'extraccion' | 'reglas' | 'kipin' | 'macro';

export interface PipelineStageInfo {
  id: number;
  key: PipelineStage;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  statusColor: string;
  payloadPreview: Record<string, string | number | boolean>;
}

export type MarginProfile = 'CUENTA_ESTRATEGICA' | 'ESTANDAR' | 'SPOT_ALTO_RIESGO' | 'PERSONALIZADO';

export interface MarginParams {
  fleteNaviero: number; // USD
  recargosLocales: number; // USD
  margenComercial: number; // USD
  perfil: MarginProfile;
}

export type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'BRL';

export interface CurrencyState {
  moneda: CurrencyCode;
  tipoCambioBNA: number;
  fobAmount: number;
  diasDevengados: number; // 0..150
}
