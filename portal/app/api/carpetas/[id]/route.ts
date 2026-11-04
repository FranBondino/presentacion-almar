/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * GET /api/carpetas/[id] & PATCH /api/carpetas/[id] & DELETE /api/carpetas/[id]
 * 
 * Provides single-record retrieval and modification of shipment folders
 * with RBAC financial masking, role authorization, and ISO 9001 audit logging.
 */

import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import {
  UpdateCarpetaSchema,
  validateBody,
} from '@/lib/schemas/api';
import { getCurrentUser } from '@/lib/auth.server';
import { canAccessFinancials, canCloseCarpeta } from '@/lib/auth';
import { validarCierreDefinitivo } from '@/lib/rentabilidad-seguros';
import {
  reconcileTriangulatedPrefactura,
  findTriangulatedPrefactura,
  type PrefacturaTriangulada,
} from '@/lib/triangulacion/reconciliation';
import { logAuditEvent } from '@/lib/audit';
import { apiRateLimiter, enforceRateLimit } from '@/lib/ratelimit';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { CarpetaRecord } from '@/lib/mockData';
import {
  loadLiveStore,
  saveLiveStore,
  normalizeLiveStoreRecords,
  updateCarpetaInStore,
  deleteCarpetaFromStore,
} from '@/lib/persistence/live-store';
import { extractActorsFromFolder } from '@/lib/actors';
import type { Database } from '@/lib/supabase/database.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'carpetas',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const { id } = await context.params;

  // 2. Authentication Check
  const { user, role } = await getCurrentUser();
  if (!user || !role) {
    return NextResponse.json(
      {
        success: false,
        error: 'No autenticado. Por favor inicie sesión.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );
  }

  try {
    const supabase = await createClient();
    const liveStore = loadLiveStore();

    // Query DB by ID, numero_carpeta or numero_interno
    const { data: dbData, error: dbError } = await supabase
      .from('carpetas')
      .select('*')
      .or(`id.eq.${id},numero_carpeta.eq.${id.toUpperCase()},numero_interno.eq.${id.toUpperCase()}`)
      .single();

    const localMatch = liveStore.carpetas.find(
      (c) =>
        c.id === id ||
        c.numero_carpeta.toUpperCase() === id.toUpperCase() ||
        (c.numero_interno && c.numero_interno.toUpperCase() === id.toUpperCase())
    );

    let carpeta: CarpetaRecord | undefined;
    if (localMatch) {
      carpeta = localMatch;
    } else if (!dbError && dbData) {
      liveStore.carpetas.push(dbData as CarpetaRecord);
      if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
        const { modified } = normalizeLiveStoreRecords(liveStore);
        if (modified) {
          saveLiveStore(liveStore);
        }
      }
      carpeta =
        liveStore.carpetas.find(
          (c) =>
            c.id === id ||
            c.numero_carpeta.toUpperCase() === id.toUpperCase() ||
            (id.toUpperCase() === 'L0703' && c.numero_carpeta.toUpperCase() === 'C1395')
        ) || (dbData as CarpetaRecord);
    }

    if (carpeta) {
      carpeta = {
        ...carpeta,
        actores_expediente: extractActorsFromFolder(carpeta, carpeta.evidencia_gmail || []),
      };
    }

    if (!carpeta) {
      return NextResponse.json(
        {
          success: false,
          error: `Carpeta '${id}' no encontrada`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 3. Financial Masking for OPERATIVO & unauthorized roles
    const showFinancials = canAccessFinancials(role) || role === 'LEAD_OPERACIONES';
    const sanitizedCarpeta = showFinancials
      ? carpeta
      : {
          ...carpeta,
          costo_estimado_total: null,
          costo_total_compra: null,
          venta_estimada_total: null,
          margen_estimado: null,
        };

    const folderCodeUpper = carpeta.numero_carpeta.toUpperCase();
    const numeroInternoUpper = carpeta.numero_interno?.toUpperCase();
    const carpetaComprobantes = liveStore.comprobantes.filter(
      (c) =>
        c.carpeta_id === carpeta.id ||
        c.carpeta_id?.toUpperCase() === folderCodeUpper ||
        (numeroInternoUpper && c.carpeta_id?.toUpperCase() === numeroInternoUpper) ||
        (c as { carpeta_codigo?: string | null }).carpeta_codigo?.toUpperCase() === folderCodeUpper ||
        (numeroInternoUpper && (c as { carpeta_codigo?: string | null }).carpeta_codigo?.toUpperCase() === numeroInternoUpper)
    );
    const carpetaEventos = liveStore.eventos.filter(
      (e) => e.carpeta_id === carpeta.id || e.carpeta_id.toUpperCase() === folderCodeUpper
    );
    const carpetaDocumentos = liveStore.documentos.filter(
      (d) =>
        d.carpeta_id === carpeta.id ||
        d.carpeta_id?.toUpperCase() === folderCodeUpper ||
        (d.metadata_extraida as { carpeta_codigo?: string })?.carpeta_codigo?.toUpperCase() === folderCodeUpper
    );

    return NextResponse.json({
      success: true,
      data: sanitizedCarpeta,
      comprobantes: carpetaComprobantes,
      eventos: carpetaEventos,
      documentos: carpetaDocumentos,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al consultar carpeta';
    console.error('[GET /api/carpetas/[id]] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'carpetas',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const ipAddress = rateLimitCheck.ipAddress;
  const userAgent = request.headers.get('user-agent') ?? 'API Client';
  const { id } = await context.params;

  // 2. Authentication Check
  const { user, role } = await getCurrentUser();
  if (!user || !role) {
    return NextResponse.json(
      {
        success: false,
        error: 'No autenticado. Por favor inicie sesión.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );
  }

  // 3. Validate Request Body
  const validation = await validateBody(UpdateCarpetaSchema, request);
  if (!validation.success) {
    return validation.response;
  }

  const updates = validation.data;

  // 4. Role Authorization Matrix Check
  if (role === 'COMERCIAL') {
    return NextResponse.json(
      {
        success: false,
        error: 'Acceso denegado: El rol COMERCIAL no tiene permisos para modificar carpetas.',
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  if (role === 'OPERATIVO') {
    // OPERATIVO cannot modify financial totals, authorized profitability, insurance policy receipt, or pending costs
    if (
      updates.costo_estimado_total !== undefined ||
      updates.venta_estimada_total !== undefined ||
      updates.rentabilidad_autorizada !== undefined ||
      updates.poliza_seguro_recibida !== undefined ||
      updates.costos_pendientes !== undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: El rol OPERATIVO no tiene permisos para modificar valores financieros, costos pendientes, pólizas de seguro o autorizaciones de rentabilidad.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  }

  try {
    const adminClient = createAdminClient();

    // Retrieve authentic existing folder state (DB first, fallback to mockData)
    let existingCarpeta: CarpetaRecord | undefined;
    const { data: dbDataExisting } = await adminClient
      .from('carpetas')
      .select('*')
      .or(`id.eq.${id},numero_carpeta.eq.${id.toUpperCase()}`)
      .maybeSingle();

    if (dbDataExisting) {
      existingCarpeta = dbDataExisting as CarpetaRecord;
    } else {
      const liveStore = loadLiveStore();
      existingCarpeta = liveStore.carpetas.find(
        (c) => c.id === id || c.numero_carpeta.toUpperCase() === id.toUpperCase()
      );
    }

    // 5. Rule R2, R5 & RBAC: Folder Closure Guards
    const isClosing =
      updates.estado === 'CERRADO_OPERATIVO' ||
      updates.estado === 'CERRADO_CONTABLE' ||
      (updates.estado as string) === 'CERRADA' ||
      updates.cierre_operativo === true ||
      updates.cierre_contable === true;

    if (isClosing) {
      // Segregation of duties: OPERATIVO can only perform operational closure (CERRADO_OPERATIVO);
      // accounting closure requires FINANZAS, GERENCIA or ADMIN.
      if (
        role === 'OPERATIVO' &&
        (updates.estado === 'CERRADO_CONTABLE' || updates.cierre_contable === true)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Acceso denegado: El rol OPERATIVO sólo puede realizar cierre operativo (CERRADO_OPERATIVO); el cierre contable requiere autorización de FINANZAS, GERENCIA o ADMIN.',
            code: 'FORBIDDEN_OPERATIVO_ACCOUNTING_CLOSURE',
          },
          { status: 403 }
        );
      }

      // Verify pending costs from un-settled comprobantes in DB and mock store
      const folderId = existingCarpeta?.id || id;
      const folderNum = existingCarpeta?.numero_carpeta || id;
      let pendingCostsInComprobantes = false;

      const { data: dbComps } = await adminClient
        .from('comprobantes')
        .select('id, estado_pago, direccion')
        .or(`carpeta_id.eq.${folderId},carpeta_id.eq.${folderNum}`);

      if (dbComps && dbComps.length > 0) {
        pendingCostsInComprobantes = dbComps.some(
          (c) => c.direccion === 'COMPRA' && c.estado_pago !== 'PAGADO' && c.estado_pago !== 'CONCILIADO'
        );
      } else {
        const liveStore = loadLiveStore();
        const liveComps = liveStore.comprobantes.filter(
          (c) => c.carpeta_id === folderId || c.carpeta_id === folderNum
        );
        pendingCostsInComprobantes = liveComps.some(
          (c) => c.direccion === 'COMPRA' && c.estado_pago !== 'PAGADO' && c.estado_pago !== 'CONCILIADO'
        );
      }

      // Pending costs cannot be subverted by a client sending costos_pendientes: false
      const existingHasPending = Boolean(existingCarpeta?.costos_pendientes || pendingCostsInComprobantes);
      const hasPendingCosts = existingHasPending || (updates.costos_pendientes === true);

      if (!canCloseCarpeta(role, hasPendingCosts)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Acceso denegado: El rol OPERATIVO no puede forzar el cierre de carpetas con costos o comprobantes pendientes de pago/asiento en ERP.',
            code: 'FORBIDDEN_OPERATIVO_PENDING_COSTS',
          },
          { status: 403 }
        );
      }

      const seguroContratado = Boolean(
        updates.seguro_contratado ?? existingCarpeta?.seguro_contratado
      );

      const polizaRecibida = Boolean(
        updates.poliza_seguro_recibida ?? existingCarpeta?.poliza_seguro_recibida
      );

      const fechaOp = existingCarpeta?.etd || existingCarpeta?.created_at || new Date().toISOString();
      const diffDays = Math.max(
        0,
        Math.floor((Date.now() - new Date(fechaOp).getTime()) / (1000 * 60 * 60 * 24))
      );

      const validationCierre = validarCierreDefinitivo({
        seguroContratado,
        polizaSeguroRecibida: polizaRecibida,
        diasDesdeOperacion: diffDays,
        costosPendientes: hasPendingCosts,
        role,
      });

      if (!validationCierre.permitido) {
        return NextResponse.json(
          {
            success: false,
            error: validationCierre.motivo,
            code: validationCierre.code || 'BLOCKED_INSURANCE_PROVISION_ACTIVE',
          },
          { status: 400 }
        );
      }

      // R5: Net Trade LLC Miami Triangulation Gate on Accounting Closure
      const isAccountingClosure =
        updates.estado === 'CERRADO_CONTABLE' || updates.cierre_contable === true;

      if (isAccountingClosure) {
        const targetFolderCode = existingCarpeta?.numero_carpeta || id;
        const targetFolderId = existingCarpeta?.id || id;

        let triangPrefactura: PrefacturaTriangulada | undefined;

        // 1. Check database for triangulated prefacturas
        const { data: dbTriang } = await adminClient
          .from('prefacturas_trianguladas')
          .select('*')
          .or(`carpeta_id.eq.${targetFolderId},carpeta_id.eq.${targetFolderCode}`)
          .maybeSingle();

        if (dbTriang) {
          const row = dbTriang;
          triangPrefactura = {
            id: row.id,
            carpetaId: row.carpeta_id,
            numeroPrefacturaKipin: row.numero_prefactura_kipin,
            entidadFacturadora: (row.entidad_facturadora || 'NET_TRADE_LLC_MIAMI') as 'NET_TRADE_LLC_MIAMI',
            einTaxId: row.ein_tax_id,
            invoiceExteriorNumero: row.invoice_exterior_numero,
            clienteExterior: row.cliente_exterior,
            montoFacturadoUSD: row.monto_facturado_usd,
            bancoDestino: (row.banco_destino || 'INTERNATIONAL_FINANCE_BANK_MIAMI') as 'INTERNATIONAL_FINANCE_BANK_MIAMI',
            cuentaIFB: row.cuenta_ifb,
            costosLocalesAlmarUSD: row.costos_locales_almar_usd,
            fondosAcreditadosIFB: Boolean(row.fondos_acreditados_ifb),
            fechaAcreditacionIFB: row.fecha_acreditacion_ifb,
            comprobanteIFBUrl: row.comprobante_ifb_url,
            montoRecuperadoAlmarUSD: row.monto_recuperado_almar_usd,
            estadoRecupero: row.estado_recupero as PrefacturaTriangulada['estadoRecupero'],
            diferenciaDescalceUSD: row.diferencia_descalce_usd,
            requiereContratoTransferPricing: Boolean(row.requiere_contrato_transfer_pricing),
            notasAuditoria: row.notas_auditoria ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        } else {
          // 2. Check canonical / mock triangulated prefacturas
          triangPrefactura =
            findTriangulatedPrefactura(targetFolderCode) ||
            findTriangulatedPrefactura(targetFolderId);
        }

        // 3. Merge or use caller-passed triangulated prefactura in request body
        const rawUpdates = updates as Record<string, unknown>;
        if (rawUpdates.prefactura_triangulada && typeof rawUpdates.prefactura_triangulada === 'object') {
          triangPrefactura = {
            ...(triangPrefactura ?? {}),
            ...(rawUpdates.prefactura_triangulada as object),
          } as PrefacturaTriangulada;
        }

        if (triangPrefactura) {
          const localCosts =
            triangPrefactura.costosLocalesAlmarUSD ||
            existingCarpeta?.costo_estimado_total ||
            0;

          const reconciliation = reconcileTriangulatedPrefactura(
            triangPrefactura,
            localCosts
          );

          if (reconciliation.action === 'BLOCK_ACCOUNTING_CLOSURE') {
            return NextResponse.json(
              {
                success: false,
                error: reconciliation.alertaMensaje,
                code: 'BLOCK_ACCOUNTING_CLOSURE',
                estadoRecupero: reconciliation.estadoRecupero,
                descalceUSD: reconciliation.descalceUSD,
              },
              { status: 422 }
            );
          }
        }
      }
    }

    const updatePayload: Database['public']['Tables']['carpetas']['Update'] = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const costo = updates.costo_estimado_total ?? existingCarpeta?.costo_estimado_total ?? 0;
    const venta = updates.venta_estimada_total ?? existingCarpeta?.venta_estimada_total ?? 0;
    const calculatedMargen = Math.round((venta - costo) * 100) / 100;

    const { data: dbData, error: dbError } = await adminClient
      .from('carpetas')
      .update(updatePayload)
      .or(`id.eq.${id},numero_carpeta.eq.${id.toUpperCase()}`)
      .select('*')
      .single();



    if (!existingCarpeta && (!dbData || dbError)) {
      return NextResponse.json(
        {
          success: false,
          error: `Carpeta '${id}' no encontrada`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const finalCarpeta: CarpetaRecord = {
      ...existingCarpeta!,
      ...((!dbError && dbData ? (dbData as Partial<CarpetaRecord>) : {})),
      ...updates,
      margen_estimado: calculatedMargen,
      updated_at: new Date().toISOString(),
    };

    updateCarpetaInStore(id, finalCarpeta);

    // 5. ISO 9001 Immutable Audit Trail
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email ?? 'user@almarrosario.com',
      userRole: role,
      action: 'MODIFICAR_CARPETA',
      entity: 'carpetas',
      entityId: finalCarpeta.numero_carpeta || id,
      ipAddress,
      userAgent,
      details: {
        updates,
        modifiedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: finalCarpeta,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al modificar carpeta';
    console.error('[PATCH /api/carpetas/[id]] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'carpetas',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const ipAddress = rateLimitCheck.ipAddress;
  const userAgent = request.headers.get('user-agent') ?? 'API Client';
  const { id } = await context.params;

  // 2. Authentication Check
  const { user, role } = await getCurrentUser();
  if (!user || !role) {
    return NextResponse.json(
      {
        success: false,
        error: 'No autenticado. Por favor inicie sesión.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );
  }

  // 3. Role Authorization (Directorio: ADMIN, GERENCIA, FINANZAS, plus LEAD_OPERACIONES)
  const allowedRoles = ['LEAD_OPERACIONES', 'GERENCIA', 'ADMIN', 'FINANZAS'];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Acceso denegado: El rol '${role}' no tiene permisos para eliminar carpetas.`,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  try {
    const adminClient = createAdminClient();

    await adminClient
      .from('carpetas')
      .delete()
      .or(`id.eq.${id},numero_carpeta.eq.${id.toUpperCase()}`);

    deleteCarpetaFromStore(id);

    // ISO 9001 Immutable Audit Log
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email ?? 'user@almarrosario.com',
      userRole: role,
      action: 'ELIMINAR_CARPETA',
      entity: 'carpetas',
      entityId: id,
      ipAddress,
      userAgent,
      details: {
        deletedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Carpeta '${id}' eliminada exitosamente`,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al eliminar carpeta';
    console.error('[DELETE /api/carpetas/[id]] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
