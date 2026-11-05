/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Tipos Canónicos para el Módulo de Cotizaciones, Asistente de Cálculos y Seguimiento Comercial
 * Control de Procesos & PO-01 Gestión Comercial
 */

export type ViaTransporte = 'MARITIMO_FCL' | 'MARITIMO_LCL' | 'AEREO' | 'TERRESTRE';

export type EstadoCotizacion = 
  | 'COTIZADA'               // Enviada al cliente, dentro de las 48hs de vigencia inicial
  | 'REQUIERE_SEGUIMIENTO'   // Pasaron >48hs sin respuesta del cliente (Smart Follow-Up)
  | 'GANADA'                 // Cliente confirmó -> Nace carpeta operativa en Kipintoch
  | 'PERDIDA'                // Cliente declinó o expiró sin cierre
  | 'ANULADA';               // Desestimada por falta de datos o inviabilidad

export type SegmentoCliente = 
  | 'ESTRATEGICO_CORPORATIVO' // Secco, Gerdau, Ternium, Disden (Máxima prioridad, TAT < 2h)
  | 'FIDELIZADO_HABITUAL'     // Mastergom, Weedon, Quimcau, Allocco
  | 'AGENTE_FORWARDER'        // Eversail, K2 Cargo, Green Shipping, redes internacionales
  | 'NUEVO_DESARROLLO'        // Inbound web, prospectos fríos
  | 'OCASIONAL_SPOT';         // Consultas esporádicas de flete

export type PerfilRentabilidad = 
  | 'CUENTA_ESTRATEGICA'   // Cuentas corporativas de gran volumen (Gerdau, Secco, Ternium) -> Markup ~8%
  | 'ESTANDAR'             // Clientes fidelizados con flujo regular -> Markup ~14%
  | 'SPOT_ALTO_RIESGO'     // Cotizaciones puntuales de alto riesgo o rutas volátiles -> Markup ~22%
  | 'PERSONALIZADO';       // Margen configurado manualmente por el asesor comercial

export type EstadoVigenciaTarifa = 'VIGENTE' | 'POR_VENCER' | 'VENCIDA';

export type SemaforoRentabilidad = 'SALUDABLE' | 'PREVENTIVO_MINIMO' | 'BLOQUEO_NEGATIVO';

export interface EvaluacionVigenciaTarifa {
  estado: EstadoVigenciaTarifa;
  diasRestantes: number;
  fechaVencimiento: string;
  esVencida: boolean;
  esPorVencer: boolean;
  esVigente: boolean;
  mensajeAlerta: string;
}

export interface CalculoRentabilidadComercial {
  perfil: PerfilRentabilidad;
  markupPorcentaje: number;
  fleteCostoUsd: number;
  fleteVentaUsd: number;
  margenBrutoUsd: number;
  margenPorcentaje: number;
  semaforo: SemaforoRentabilidad;
  esBloqueante: boolean;         // margen < USD 3.00
  esAlertaPreventiva: boolean;   // USD 3.00 <= margen < USD 200.00
  mensajeSemaforo: string;
}

export type TipoFeedbackComercial =
  | 'COMPETENCIA_MENOR_PRECIO'   // ej. "Competencia cotizó USD 150 menos"
  | 'CARGA_DIFERIDA'            // ej. "Carga diferida por producción/embarque"
  | 'EVALUACION_GERENCIA'       // ej. "En evaluación por Gerencia del cliente"
  | 'CAMBIO_CONDICIONES'        // ej. "Cliente evalúa cambio de Incoterm o puerto"
  | 'FALTA_ESPACIO_NAVIERA'     // ej. "Dificultad de espacio o rolleo en buque"
  | 'OTRO';

export interface FeedbackComercialRegistro {
  tipo: TipoFeedbackComercial;
  descripcion: string;
  fechaRegistro: string;        // ISO 8601 UTC
  registradoPor: string;        // ej. "Lucía Laje"
  diferenciaPrecioUsd?: number; // ej. -150
}

export interface BultoItem {
  id: string;
  cantidad: number;
  tipo: 'pallet' | 'caja' | 'atado' | 'tambor' | 'bulto';
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  pesoUnitarioKg: number;
}

export interface CalculoLogisticoInput {
  clienteNombre: string;
  contactoEmail?: string;
  origen: string;
  destino: string;
  incoterm: 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF' | 'DAP' | 'DDP';
  bultos: BultoItem[];
  valorMercaderiaFobUsd?: number;
  tarifaBaseAereaPorKgUsd?: number;
  tarifaBaseMaritimaPorM3Usd?: number;
  diasLibresDemoras?: number;
  perfilRentabilidad?: PerfilRentabilidad;
  markupPersonalizadoPct?: number;
  vigenciaDias?: number;
  fechaTarifaNaviera?: string;
  fechaReferencia?: string | Date;
}

export interface CalculoLogisticoResult {
  cantidadBultosTotal: number;
  pesoBrutoTotalKg: number;
  volumenTotalM3: number;
  
  // Aéreo (IATA 1:6 -> 1 m3 = 167 kg)
  pesoVolumetricoAereoKg: number;
  pesoTasableAereoKg: number;
  aplicaVolumenAereo: boolean;
  costoFleteAereoSugeridoUsd: number;
  gastosOrigenAereoUsd: number;
  gastosDestinoAereoUsd: number;
  totalAereoEstimadoUsd: number;
  
  // Marítimo LCL (W/M 1:1 -> 1 ton = 1 m3)
  pesoToneladasMaritimo: number;
  volumenTasableLclM3: number;
  aplicaVolumenMaritimo: boolean;
  costoFleteMaritimoSugeridoUsd: number;
  desconsolidacionDestinoUsd: number;
  documentacionDestinoUsd: number;
  seguroTransporteUsd: number;
  totalMaritimoLclEstimadoUsd: number;
  
  // Borradores automáticos listos para Gmail
  borradorCorreoCliente: string;
  borradorFollowUp: string;
  payloadKipintochClipboard: string;
  vigenciaTarifaDias?: number;
  fechaVencimientoTarifa?: string;

  // Extensiones comerciales M1
  perfilRentabilidad?: PerfilRentabilidad;
  fleteVentaAereoSugeridoUsd?: number;
  fleteVentaMaritimoSugeridoUsd?: number;
  rentabilidadAerea?: CalculoRentabilidadComercial;
  rentabilidadMaritima?: CalculoRentabilidadComercial;
  evaluacionVigencia?: EvaluacionVigenciaTarifa;
  borradorSeguimientoInstitucional?: string;
  aptitudCopa?: EvaluacionAptitudCopa;
}

export interface CotizacionRecord {
  id: string;
  numeroCotizacion: string; // ej. "C1580", "C1581"
  clienteNombre: string;
  clienteCuit?: string;
  segmento: SegmentoCliente;
  fechaEmision: string; // ISO String
  horasDesdeEmision: number;
  contactoEmail: string;
  responsableComercial: string; // "Lucía Laje", "Nerea Guida", "Martín Fusco"
  via: ViaTransporte;
  origen: string;
  destino: string;
  incoterm: string;
  
  // Valores Económicos (USD)
  fleteVentaUsd: number;
  fleteCostoEstimadoUsd: number; // Base para auditar facturas de navieras (Desvíos)
  margenBrutoUsd: number;
  margenPorcentaje: number;
  
  // Condiciones de Operación
  navieraOAerolineaSugerida: string;
  tiempoTransitoEstimadoDias: number;
  diasLibresDemora: number;
  
  // Vigencia de Tarifas (Control de Descalce)
  vigenciaTarifaDias?: number;
  fechaVencimientoTarifa?: string;
  tarifaVencida?: boolean;

  // Estado y Gestión Comercial
  estado: EstadoCotizacion;
  carpetaOperativaId?: string; // Vínculo a la carpeta en Kipintoch si fue ganada
  ultimoContactoFecha?: string;
  followUpEnviado: boolean;
  notasComerciales?: string;

  // Extensiones comerciales M1
  perfilRentabilidad?: PerfilRentabilidad;
  feedbackComercial?: string;
  feedbackRegistro?: FeedbackComercialRegistro;
  evaluacionVigencia?: EvaluacionVigenciaTarifa;
  calculoRentabilidad?: CalculoRentabilidadComercial;
  ccDireccion?: string[];

  // Milestone 2 / R2: Folder Linking & Ingestion Provenance
  carpetaCodigo?: string | null;
  modalidadOperativa?: string;
  gmail_message_id?: string;
  rfc_message_id?: string;
  source_mailbox?: string;
  created_at?: string;
  updated_at?: string;

  // Milestone 3: Kipintoch Alignment & UI Model
  propuestaComercialCodigo?: string;
  cotizacionCodigo?: string;
  tipoServicio?: 'FTL' | 'FCL - FCL' | 'LCL - LCL' | 'AEREO' | 'CARGA_SUELTA' | (string & {});
  usuarioPricing?: string;
  vendedor?: string;
  agenteTransportista?: string;
  shipperProveedor?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  statusKipintoch?: 'Confirmada' | 'Pendiente' | 'Vencida';
  carpetaNumeroInterno?: string | null;

  // Milestone 2 / Phase 2: Cubicaje (CBM) & Peso Tasable Inteligente
  cbmTotal?: number;
  pesoBrutoKg?: number;
  cantidadBultos?: number;
  pesoTasableKg?: number;
  volumenTasableLclM3?: number;
  sugerenciaEquipo?: string;
  resumenCubicaje?: string;
  cubicaje?: CotizacionCubicajeData;
  documentosAdjuntos?: DocumentoCubicajeAdjunto[];
}

export type TipoBultoParsed = 'pallet' | 'caja' | 'atado' | 'tambor' | 'bulto' | 'cajon';

export interface CargoDimensionItem {
  rawText: string;
  cantidad: number;
  tipoBulto: TipoBultoParsed;
  largoM: number;
  anchoM: number;
  altoM: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  altoEstimadoPorDefecto: boolean;
  pesoUnitarioKg: number;
  pesoTotalKg: number;
  volumenUnitarioM3: number;
  volumenTotalM3: number;
}

export interface SugerenciaEquipoFcl {
  requiereFcl: boolean;
  equipoSugerido: '20_STD' | '40_STD' | '40_HC' | null;
  nombreEquipo: string | null;
  capacidadM3: string | null;
  razonComercial: string;
}

export type EstadoAptitudCopa = 'APTA' | 'SUJETA_AUTORIZACION' | 'NO_APTA';

export interface EvaluacionBultoCopa {
  indice: number;
  tipo: string;
  cantidad: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  pesoUnitarioKg: number;
  estado: EstadoAptitudCopa;
  motivos: string[];
  puedeDesarmarPallet: boolean;
}

export interface EvaluacionAptitudCopa {
  estado: EstadoAptitudCopa;
  esApta: boolean;
  requiereAutorizacion: boolean;
  tituloEstado: string;
  resumenEjecutivo: string;
  aeronaveReferencia: string;
  limitesReferencia: {
    largoMaxEstCm: number;
    anchoMaxEstCm: number;
    altoMaxPuertaCm: number;
    pesoMaxDirectoKg: number;
    pesoMaxAutorizableKg: number;
    medidasPulgadasRef: string;
  };
  bultosEvaluados: EvaluacionBultoCopa[];
  motivosPrincipales: string[];
  recomendacionComercial: string;
  alternativaSugerida: string;
}

export interface DocumentoCubicajeAdjunto {
  id: string;
  nombre: string;
  tamanoBytes: number;
  tipoMime: string;
  fechaCarga: string;
  bultosExtraidos: number;
  cbmExtraido: number;
  textoExtraido: string;
  previewUrl?: string;
}

export interface ResumenCubicaje {
  items: CargoDimensionItem[];
  cantidadBultosTotal: number;
  pesoBrutoTotalKg: number;
  volumenTotalM3: number;
  pesoTasable: {
    maritimoLcl: {
      volumenM3: number;
      pesoToneladas: number;
      revenueTonsWm: number;
      reglaAplicada: 'VOLUMEN' | 'PESO';
    };
    aereo: {
      pesoRealKg: number;
      pesoVolumetricoKg: number;
      pesoTasableKg: number;
      reglaAplicada: 'VOLUMEN' | 'PESO';
    };
    terrestre: {
      pesoRealKg: number;
      pesoVolumetricoKg: number;
      pesoTasableKg: number;
      reglaAplicada: 'VOLUMEN' | 'PESO';
    };
  };
  sugerenciaFcl: SugerenciaEquipoFcl;
  aptitudCopa?: EvaluacionAptitudCopa;
}

export type CotizacionCubicajeData = ResumenCubicaje;

export interface PlantillaSeguimientoParams {
  numeroCotizacion: string;
  clienteNombre: string;
  contactoEmail: string;
  origen: string;
  destino: string;
  via: string;
  fleteVentaUsd: number;
  diasLibresDemora?: number;
  navieraOAerolineaSugerida?: string;
  responsableComercial?: string;
  fechaEmision?: string;
  ccEmails?: string[];
}

export interface SeguimientoInstitucionalResult {
  to: string;
  cc: string[];
  subject: string;
  body: string;
  mailtoUrl: string;
}
