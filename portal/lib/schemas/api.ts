/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Strongly Typed Zod Schemas & Validation Helpers for API Routes
 * 
 * Provides runtime validation, input sanitization, and structured error responses
 * for all operational endpoints matching PROJECT.md contracts.
 */

import { z } from 'zod';
import { type NextRequest, NextResponse } from 'next/server';
import type {
  AreaTransporte,
  SectorTransporte,
  EstadoEmbarque,
  TipoCarga,
  HitoOperativo,
  TipoComprobante,
  DireccionComprobante,
  ClasificacionGasto,
  CategoriaIva,
  CategoriaFiscal,
  CodigoMoneda,
  EstadoPago,
  SeveridadAlerta,
  CategoriaAlerta,
  CategoriaProveedorPA03,
  CondicionFlete,
  TipoUnidadTerrestre,
} from '@/lib/supabase/database.types';

// ============================================================================
// Primitives & Common Schemas
// ============================================================================

export const UUIDSchema = z.string().uuid({ message: 'El ID debe ser un UUID válido' });

export const FolderCodeSchema = z
  .string()
  .trim()
  .min(2, { message: 'El código de carpeta debe tener al menos 2 caracteres' })
  .max(20, { message: 'El código de carpeta no puede superar 20 caracteres' })
  .regex(
    /^(C\d{3,6}|IT\d{3,6}|TL\d{3,6}|[A-Z]{1,4}\d{2,6}|[A-Za-z0-9\-_]+)$/i,
    { message: 'Formato de código de carpeta inválido (ej: C1234, C1434, IT1486, TL1436)' }
  );

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// Enums matching Supabase Database Types
// ============================================================================

export const AreaTransporteEnum = z.enum([
  'MARITIMO',
  'AEREO',
  'TERRESTRE',
  'DESPACHO',
  'VARIOS',
]) satisfies z.ZodType<AreaTransporte>;

export const SectorTransporteEnum = z.enum([
  'IMPORTACION',
  'EXPORTACION',
  'NACIONAL',
]) satisfies z.ZodType<SectorTransporte>;

export const EstadoEmbarqueEnum = z.enum([
  'COTIZACION_PENDIENTE',
  'COTIZACION_APROBADA',
  'BOOKING_CONFIRMADO',
  'EN_TRANSITO',
  'ARRIBADO',
  'EN_ADUANA',
  'LIBRE_DEUDA_EMITIDO',
  'ENTREGADO',
  'CERRADO_OPERATIVO',
  'CERRADO_CONTABLE',
  'ANULADO',
  'BLOQUEADA_RENTABILIDAD_NEGATIVA',
]) satisfies z.ZodType<EstadoEmbarque>;

export const TipoCargaEnum = z.enum([
  'FCL',
  'LCL',
  'AEREO',
  'CONSOLIDADO',
  'CARGA_SUELTA',
]) satisfies z.ZodType<TipoCarga>;

export const HitoOperativoEnum = z.enum([
  'COTIZACION_APROBADA',
  'ASIGNACION_OPERATIVA',
  'DOCUMENTACION_VALIDADA',
  'EMISION_BL_HAWB_CRT',
  'ZARPE_ETD',
  'SEGUIMIENTO_TRANSITO',
  'ARRIBO_ETA',
  'PAGO_FLETE_PROVEEDOR',
  'LIBRE_DEUDA_EMITIDO',
  'DESPACHO_ADUANA',
  'ENTREGA_CLIENTE',
  'PREFACTURACION',
  'CIERRE_CONTABLE',
]) satisfies z.ZodType<HitoOperativo>;

export const TipoComprobanteEnum = z.enum([
  'FACTURA_A',
  'FACTURA_B',
  'FACTURA_C',
  'FACTURA_E',
  'INVOICE_EXTERIOR',
  'DEBIT_NOTE',
  'CREDIT_NOTE',
  'RECIBO_PAGO',
]) satisfies z.ZodType<TipoComprobante>;

export const DireccionComprobanteEnum = z.enum([
  'COMPRA',
  'VENTA',
]) satisfies z.ZodType<DireccionComprobante>;

export const ClasificacionGastoEnum = z.enum([
  'FMA',
  'FIA',
  'FTE',
  'THC',
  'BL_FEE',
  'DESPACHO',
  'SEGURO',
  'ALMACENAJE',
  'BUFF',
  'OTROS',
]) satisfies z.ZodType<ClasificacionGasto>;

export const CategoriaIvaEnum = z.enum([
  'IVA_0_EXENTO',
  'IVA_21_GENERAL',
  'IVA_10_5_REDUCIDO',
  'IVA_NO_GRAVADO',
]) satisfies z.ZodType<CategoriaIva>;

export const CategoriaFiscalEnum = z.enum([
  'INTERNACIONAL_EXENTO_0',
  'NACIONAL_GRAVADO_21',
  'NACIONAL_GRAVADO_OTRO',
  'NO_GRAVADO',
]) satisfies z.ZodType<CategoriaFiscal>;

export const CodigoMonedaEnum = z.enum([
  'USD',
  'ARS',
  'EUR',
  'GBP',
  'BRL',
  'CNY',
]) satisfies z.ZodType<CodigoMoneda>;

export const EstadoPagoEnum = z.enum([
  'PENDIENTE',
  'SOLICITADO_A_PAGAR',
  'PROGRAMADO',
  'PAGADO',
  'RECHAZADO',
  'CONCILIADO',
]) satisfies z.ZodType<EstadoPago>;

export const SeveridadAlertaEnum = z.enum([
  'INFO',
  'WARNING',
  'CRITICAL',
]) satisfies z.ZodType<SeveridadAlerta>;

export const CategoriaAlertaEnum = z.enum([
  'DESVIO_COSTO',
  'FACTURA_SIN_CARPETA',
  'IVA_INCORRECTO',
  'VENCIMIENTO_PROXIMO',
  'BLOQUEO_LIBRE_DEUDA',
  'SOBRECARGA_OPERADOR',
  'CUOTA_API',
  'CORRUPT_DOCUMENT',
  'MARGEN_CRITICO',
  'ARRIBO_VIERNES_RIESGO',
]) satisfies z.ZodType<CategoriaAlerta>;

export const CategoriaProveedorPA03Enum = z.enum([
  'AGENTE_INTERNACIONAL',
  'TRANSPORTE_LOGISTICA',
  'SERVICIOS_OPERATIVOS',
  'TECNOLOGIA_INFORMACION',
  'PROFESIONALES_APOYO',
  'PROVEEDORES_BIENES',
]) satisfies z.ZodType<CategoriaProveedorPA03>;

export const CondicionFleteEnum = z.enum([
  'PREPAID',
  'COLLECT',
]) satisfies z.ZodType<CondicionFlete>;

export const TipoUnidadTerrestreEnum = z.enum([
  'SEMIRREMOLQUE',
  'CHASIS',
  'BALANCIN',
  'ACOPLADO',
]) satisfies z.ZodType<TipoUnidadTerrestre>;

// ============================================================================
// Carpetas Schemas
// ============================================================================

export const GetCarpetasQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  estado: EstadoEmbarqueEnum.optional(),
  area: AreaTransporteEnum.optional(),
  sector: SectorTransporteEnum.optional(),
  tipo_operacion: z.string().trim().optional(),
});

export const CreateCarpetaSchema = z.object({
  numero_carpeta: FolderCodeSchema,
  numero_interno: z.string().trim().max(50).optional().nullable(),
  cliente_nombre: z.string().trim().min(2, 'El nombre de cliente es requerido').max(150),
  cliente_cuit: z.string().trim().max(30).optional().nullable(),
  cliente_email: z.string().trim().email('Email inválido').optional().nullable(),
  area: AreaTransporteEnum.default('MARITIMO'),
  sector: SectorTransporteEnum.default('IMPORTACION'),
  estado: EstadoEmbarqueEnum.default('BOOKING_CONFIRMADO'),
  tipo_carga: TipoCargaEnum.default('FCL'),
  origen: z.string().trim().min(2, 'Origen es requerido').max(150),
  destino: z.string().trim().min(2, 'Destino es requerido').max(150),
  buque_vuelo: z.string().trim().max(100).optional().nullable(),
  viaje: z.string().trim().max(50).optional().nullable(),
  hbl_hawb: z.string().trim().max(50).optional().nullable(),
  mbl_mawb: z.string().trim().max(50).optional().nullable(),
  booking: z.string().trim().max(50).optional().nullable(),
  contenedor: z.string().trim().max(50).optional().nullable(),
  etd: z.string().trim().optional().nullable(),
  eta: z.string().trim().optional().nullable(),
  volumen_m3: z.coerce.number().nonnegative('El volumen no puede ser negativo').default(0),
  peso_kg: z.coerce.number().nonnegative('El peso no puede ser negativo').default(0),
  bultos: z.coerce.number().int().nonnegative('Los bultos no pueden ser negativos').default(1),
  operador_id: z.string().uuid().optional().nullable(),
  comercial_id: z.string().uuid().optional().nullable(),
  costo_estimado_total: z.coerce.number().nonnegative('El costo no puede ser negativo').default(0),
  venta_estimada_total: z.coerce.number().nonnegative('La venta no puede ser negativa').default(0),
  moneda: CodigoMonedaEnum.default('USD'),
  cierre_operativo: z.boolean().default(false),
  cierre_contable: z.boolean().default(false),
  condicion_flete: CondicionFleteEnum.optional().nullable(),
  tipo_unidad_terrestre: TipoUnidadTerrestreEnum.optional().nullable(),
  rentabilidad_autorizada: z.boolean().optional().nullable(),
  rentabilidad_autorizada_por: z.string().optional().nullable(),
  rentabilidad_autorizada_at: z.string().optional().nullable(),
  rentabilidad_autorizada_hash: z.string().optional().nullable(),
  rentabilidad_autorizada_motivo: z.string().optional().nullable(),
  seguro_contratado: z.boolean().optional().nullable(),
  poliza_seguro_recibida: z.boolean().optional().nullable(),
  poliza_seguro_numero: z.string().optional().nullable(),
  provision_seguro_usd: z.coerce.number().optional().nullable(),
  provision_seguro_fecha_vencimiento: z.string().optional().nullable(),
  costos_pendientes: z.boolean().optional().nullable(),
  prefactura_triangulada: z.record(z.unknown()).optional().nullable(),
  checklist_progreso: z.record(z.any()).optional().nullable(),
  estado_kipintoch: z.enum(['Orden de venta', 'House', 'ORDEN_DE_VENTA', 'HOUSE']).optional().nullable(),
  cotizacion_vinculada_id: z.string().optional().nullable(),
  cotizacion_vinculada_codigo: z.string().optional().nullable(),
  costo_estimado_flete: z.coerce.number().optional().nullable(),
  venta_estimada_flete: z.coerce.number().optional().nullable(),
  shipper_nombre: z.string().trim().max(160).optional().nullable(),
  consignee_nombre: z.string().trim().max(160).optional().nullable(),
  transportista_nombre: z.string().trim().max(160).optional().nullable(),
  usuario_asignado: z.string().trim().max(120).optional().nullable(),
  incoterm: z.string().trim().max(20).optional().nullable(),
});

export const UpdateCarpetaSchema = CreateCarpetaSchema.partial();

// ============================================================================
// Comprobantes Schemas
// ============================================================================

export const GetComprobantesQuerySchema = PaginationQuerySchema.extend({
  carpeta_id: z.string().trim().optional(),
  tipo_comprobante: TipoComprobanteEnum.optional(),
  categoria_fiscal: CategoriaFiscalEnum.optional(),
  categoria_proveedor_pa03: CategoriaProveedorPA03Enum.optional(),
  direccion: DireccionComprobanteEnum.optional(),
  estado_pago: EstadoPagoEnum.optional(),
});

export const CreateComprobanteSchema = z.object({
  carpeta_id: z.string().trim().optional().nullable(),
  carpeta_codigo: z.string().trim().optional().nullable(),
  tipo_comprobante: TipoComprobanteEnum,
  direccion: DireccionComprobanteEnum.default('COMPRA'),
  numero_comprobante: z.string().trim().min(1, 'Número de comprobante requerido').max(50),
  emisor_razon_social: z.string().trim().min(2, 'Razón social requerida').max(150),
  emisor_cuit: z.string().trim().max(30).optional().nullable(),
  proveedor_exterior: z.boolean().default(false),
  categoria_proveedor_pa03: CategoriaProveedorPA03Enum.optional().nullable(),
  concepto_gasto: z.string().trim().min(2, 'Concepto de gasto requerido').max(255),
  clasificacion_gasto: ClasificacionGastoEnum.default('OTROS'),
  tipo_iva: CategoriaIvaEnum.optional(),
  categoria_fiscal: CategoriaFiscalEnum.optional(),
  moneda: CodigoMonedaEnum.default('USD'),
  tipo_cambio: z.coerce.number().positive('El tipo de cambio debe ser positivo').default(1.0),
  subtotal_neto: z.coerce.number().nonnegative('El subtotal neto no puede ser negativo'),
  alicuota_iva: z.coerce.number().nonnegative('La alícuota de IVA no puede ser negativa').default(0),
  monto_iva: z.coerce.number().nonnegative('El monto de IVA no puede ser negativo').optional(),
  monto_total: z.coerce.number().nonnegative('El monto total no puede ser negativo').optional(),
  estado_pago: EstadoPagoEnum.default('PENDIENTE'),
  fecha_emision: z.string().trim().min(1, 'Fecha de emisión requerida'),
  fecha_vencimiento: z.string().trim().optional().nullable(),
  documento_id: z.string().uuid().optional().nullable(),
  score_confianza: z.coerce.number().min(0).max(1).optional().nullable(),
  metadata_raw: z.record(z.unknown()).optional().default({}),
  conversion_proof: z.record(z.unknown()).optional().nullable(),
  conversionProof: z.record(z.unknown()).optional().nullable(),
  rentabilidad_autorizada: z.boolean().optional().nullable(),
  rentabilidadAutorizada: z.boolean().optional().nullable(),
  costos_asignados: z.coerce.number().optional().nullable(),
  costosUSD: z.coerce.number().optional().nullable(),
  asentado_en_erp: z.boolean().optional().nullable(),
  desvio_autorizado: z.boolean().optional().nullable(),
  motivo_desvio: z.string().optional().nullable(),
  justificacion_desvio: z.string().optional().nullable(),
  resolucion_alerta: z.boolean().optional().nullable(),
});

export const UpdateComprobanteSchema = CreateComprobanteSchema.partial();

// ============================================================================
// Eventos Schemas
// ============================================================================

export const GetEventosQuerySchema = PaginationQuerySchema.extend({
  carpeta_id: z.string().trim().optional(),
  hito: HitoOperativoEnum.optional(),
});

export const CreateEventoSchema = z.object({
  carpeta_id: z.string().trim().min(1, 'El ID de carpeta es requerido'),
  hito: HitoOperativoEnum,
  titulo: z.string().trim().min(2, 'El título es requerido').max(150),
  descripcion: z.string().trim().min(2, 'La descripción es requerida').max(1000),
  fecha_evento: z.string().trim().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Fecha de evento inválida. Debe ser una fecha ISO válida.' }
  ),
  es_critico: z.boolean().default(false),
  completado: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const UpdateEventoSchema = CreateEventoSchema.partial();

// ============================================================================
// Alertas Schemas
// ============================================================================

export const GetAlertasQuerySchema = PaginationQuerySchema.extend({
  carpeta_id: z.string().trim().optional(),
  severidad: SeveridadAlertaEnum.optional(),
  tipo: CategoriaAlertaEnum.optional(),
  resuelta: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
        return undefined;
      }
      return val;
    }),
});

export const CreateAlertaSchema = z.object({
  carpeta_id: z.string().trim().optional().nullable(),
  comprobante_id: z.string().trim().optional().nullable(),
  tipo: CategoriaAlertaEnum,
  severidad: SeveridadAlertaEnum.default('WARNING'),
  titulo: z.string().trim().min(2, 'Título requerido').max(150),
  mensaje: z.string().trim().min(2, 'Mensaje requerido').max(1000),
});

export const ResolveAlertaSchema = z.object({
  resuelta: z.boolean({ required_error: 'El estado resuelta (booleano) es obligatorio' }),
  resolucion_accion: z.string().trim().min(2, 'La justificación de resolución es requerida').max(500).optional().nullable(),
});

// ============================================================================
// Feedback & Edge-Case Triage Schemas
// ============================================================================

export const FeedbackTipoEnum = z.enum([
  'EDGE_CASE',
  'CORRECCION_DATO',
  'CONSULTA',
  'SUGERENCIA',
]);
export type FeedbackTipo = z.infer<typeof FeedbackTipoEnum>;

export const FeedbackSeveridadEnum = z.enum([
  'BAJA',
  'MEDIA',
  'ALTA',
  'BLOQUEANTE',
]);
export type FeedbackSeveridad = z.infer<typeof FeedbackSeveridadEnum>;

export const FeedbackScreenshotSchema = z.object({
  name: z.string().trim().min(1).max(260),
  mimeType: z.string().trim().min(1).max(120),
  dataUrl: z.string().max(10_000_000),
});
export type FeedbackScreenshot = z.infer<typeof FeedbackScreenshotSchema>;

export const CreateFeedbackSchema = z.object({
  tipo: FeedbackTipoEnum.default('EDGE_CASE'),
  severidad: FeedbackSeveridadEnum.default('MEDIA'),
  mensaje: z.string().trim().min(3, 'El mensaje debe tener al menos 3 caracteres').max(2000),
  pantalla: z.string().trim().min(1, 'La pantalla o ruta es requerida'),
  carpeta_id: z.string().trim().optional().nullable(),
  usuario_nombre: z.string().trim().optional().nullable(),
  usuario_email: z.string().trim().optional().nullable(),
  usuario_rol: z.string().trim().optional().nullable(),
  contexto_adicional: z.record(z.unknown()).optional().default({}),
  screenshots: z.array(FeedbackScreenshotSchema).max(3).optional().default([]),
});
export type CreateFeedbackInput = z.output<typeof CreateFeedbackSchema>;

// ============================================================================
// Audit Log Schemas
// ============================================================================

export const GetAuditLogQuerySchema = PaginationQuerySchema.extend({
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  userEmail: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

// ============================================================================
// Cotizaciones Schemas
// ============================================================================

export const CreateCotizacionSchema = z.object({
  id: z.string().nullish().transform((v) => v ?? undefined),
  numeroCotizacion: z.string().nullish().transform((v) => v ?? undefined),
  clienteNombre: z.string().min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
  clienteCuit: z.string().nullish().transform((v) => v ?? undefined),
  segmento: z
    .enum([
      'ESTRATEGICO_CORPORATIVO',
      'FIDELIZADO_HABITUAL',
      'AGENTE_FORWARDER',
      'NUEVO_DESARROLLO',
      'OCASIONAL_SPOT',
    ])
    .optional()
    .default('FIDELIZADO_HABITUAL'),
  contactoEmail: z.string().email().optional().default('comercial@cliente.com'),
  responsableComercial: z.string().optional().default('Lucía Laje'),
  via: z
    .enum(['MARITIMO_FCL', 'MARITIMO_LCL', 'AEREO', 'TERRESTRE'])
    .optional()
    .default('MARITIMO_FCL'),
  origen: z.string().min(2, 'Origen requerido'),
  destino: z.string().min(2, 'Destino requerido'),
  incoterm: z.string().optional().default('FOB'),
  fleteVentaUsd: z.coerce.number().nonnegative().optional().default(0),
  fleteCostoEstimadoUsd: z.coerce.number().nonnegative().optional().default(0),
  navieraOAerolineaSugerida: z.string().optional().default('Maersk Line'),
  tiempoTransitoEstimadoDias: z.coerce.number().int().positive().optional().default(18),
  diasLibresDemora: z.coerce.number().int().nonnegative().optional().default(14),
  estado: z
    .enum(['COTIZADA', 'REQUIERE_SEGUIMIENTO', 'GANADA', 'PERDIDA', 'ANULADA'])
    .optional()
    .default('COTIZADA'),
  carpetaOperativaId: z.string().nullish().transform((v) => v ?? undefined),
  carpetaCodigo: z.string().nullish().transform((v) => v ?? undefined),
  carpetaNumeroInterno: z.string().nullish().transform((v) => v ?? undefined),
  propuestaComercialCodigo: z.string().nullish().transform((v) => v ?? undefined),
  cotizacionCodigo: z.string().nullish().transform((v) => v ?? undefined),
  tipoServicio: z.string().nullish().transform((v) => v ?? undefined),
  usuarioPricing: z.string().nullish().transform((v) => v ?? undefined),
  vendedor: z.string().nullish().transform((v) => v ?? undefined),
  agenteTransportista: z.string().nullish().transform((v) => v ?? undefined),
  shipperProveedor: z.string().nullish().transform((v) => v ?? undefined),
  fechaDesde: z.string().nullish().transform((v) => v ?? undefined),
  fechaHasta: z.string().nullish().transform((v) => v ?? undefined),
  statusKipintoch: z.enum(['Pendiente', 'Confirmada', 'Vencida']).nullish().transform((v) => v ?? undefined),
  status_kipintoch: z.enum(['Pendiente', 'Confirmada', 'Vencida']).nullish().transform((v) => v ?? undefined),
  cbmTotal: z.coerce.number().nullish().transform((v) => v ?? undefined),
  pesoBrutoKg: z.coerce.number().nullish().transform((v) => v ?? undefined),
  pesoTasableKg: z.coerce.number().nullish().transform((v) => v ?? undefined),
  sugerenciaEquipo: z.string().nullish().transform((v) => v ?? undefined),
  resumenCubicaje: z.string().nullish().transform((v) => v ?? undefined),
  bultos: z.any().nullish().transform((v) => v ?? undefined),
  bultosDetalle: z.array(z.any()).nullish().transform((v) => v ?? undefined),
  accion: z.string().nullish().transform((v) => v ?? undefined),
  abrirCarpeta: z.boolean().nullish().transform((v) => v ?? undefined),
});

export const UpdateCotizacionSchema = CreateCotizacionSchema.partial().extend({
  followUpEnviado: z.boolean().nullish().transform((v) => v ?? undefined),
  ultimoContactoFecha: z.string().nullish().transform((v) => v ?? undefined),
  feedbackComercial: z.string().nullish().transform((v) => v ?? undefined),
  feedbackRegistro: z.any().nullish().transform((v) => v ?? undefined),
  notasComerciales: z.string().nullish().transform((v) => v ?? undefined),
  accion: z.string().nullish().transform((v) => v ?? undefined),
  abrirCarpeta: z.boolean().nullish().transform((v) => v ?? undefined),
});

// ============================================================================
// TypeScript Inferred Types
// ============================================================================

export type GetCarpetasQuery = z.infer<typeof GetCarpetasQuerySchema>;
export type CreateCarpetaInput = z.infer<typeof CreateCarpetaSchema>;
export type UpdateCarpetaInput = z.infer<typeof UpdateCarpetaSchema>;

export type GetComprobantesQuery = z.infer<typeof GetComprobantesQuerySchema>;
export type CreateComprobanteInput = z.infer<typeof CreateComprobanteSchema>;
export type UpdateComprobanteInput = z.infer<typeof UpdateComprobanteSchema>;

export type GetEventosQuery = z.infer<typeof GetEventosQuerySchema>;
export type CreateEventoInput = z.infer<typeof CreateEventoSchema>;
export type UpdateEventoInput = z.infer<typeof UpdateEventoSchema>;

export type GetAlertasQuery = z.infer<typeof GetAlertasQuerySchema>;
export type CreateAlertaInput = z.infer<typeof CreateAlertaSchema>;
export type ResolveAlertaInput = z.infer<typeof ResolveAlertaSchema>;

export type GetAuditLogQuery = z.infer<typeof GetAuditLogQuerySchema>;

export type CreateCotizacionInput = z.infer<typeof CreateCotizacionSchema>;
export type UpdateCotizacionInput = z.infer<typeof UpdateCotizacionSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  response: NextResponse;
  errors: Array<{ field: string; message: string }>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Formats a ZodError into a standard 400 Bad Request JSON response.
 */
export function formatZodErrorResponse(error: z.ZodError): NextResponse {
  const details = error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return NextResponse.json(
    {
      success: false,
      error: 'Datos de validación incorrectos',
      code: 'VALIDATION_ERROR',
      details,
    },
    { status: 400 }
  );
}

/**
 * Validates request JSON body against a Zod schema.
 */
export async function validateBody<T>(
  schema: z.ZodType<T>,
  request: NextRequest | Request
): Promise<ValidationResult<T>> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Cuerpo de solicitud inválido (JSON malformado)',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      ),
      errors: [{ field: 'body', message: 'JSON malformado' }],
    };
  }

  const result = schema.safeParse(rawBody);
  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return {
      success: false,
      response: formatZodErrorResponse(result.error),
      errors: details,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validates query search parameters against a Zod schema.
 */
export function validateQuery<T>(
  schema: z.ZodType<T>,
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ValidationResult<T> {
  let rawParams: Record<string, unknown>;

  if (searchParams instanceof URLSearchParams) {
    rawParams = Object.fromEntries(searchParams.entries());
  } else {
    rawParams = { ...searchParams };
  }

  const result = schema.safeParse(rawParams);
  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return {
      success: false,
      response: formatZodErrorResponse(result.error),
      errors: details,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
