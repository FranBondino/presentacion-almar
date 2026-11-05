/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * GET /api/comprobantes/[id] & PATCH /api/comprobantes/[id]
 * 
 * Provides single-record retrieval and updates for fiscal invoices
 * with RBAC checks and ISO 9001 audit logging.
 */

import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import {
  UpdateComprobanteSchema,
  validateBody,
} from '@/lib/schemas/api';
import { getCurrentUser } from '@/lib/auth.server';
import { canEditComprobantes, canDiscardComprobante } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { apiRateLimiter, enforceRateLimit } from '@/lib/ratelimit';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { ComprobanteRecord } from '@/lib/mockData';
import { loadLiveStore, updateComprobanteInStore, recalculateFolderFinancials } from '@/lib/persistence/live-store';
import type { Database, Json } from '@/lib/supabase/database.types';

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
    entity: 'comprobantes',
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

    const { data: dbData, error: dbError } = await supabase
      .from('comprobantes')
      .select('*')
      .or(`id.eq.${id},numero_comprobante.eq.${id}`)
      .single();

    let comprobante: ComprobanteRecord | undefined;
    if (!dbError && dbData) {
      comprobante = dbData as ComprobanteRecord;
    } else {
      comprobante = liveStore.comprobantes.find(
        (c) => c.id === id || c.numero_comprobante === id
      );
    }

    if (!comprobante) {
      return NextResponse.json(
        {
          success: false,
          error: `Comprobante '${id}' no encontrado`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 3. RBAC Policy Check on Specific Comprobante
    if (role === 'COMERCIAL' && comprobante.direccion !== 'VENTA') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: El rol COMERCIAL solo puede visualizar facturas de venta.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    if (role === 'OPERATIVO') {
      if (
        comprobante.direccion !== 'COMPRA' ||
        ['DESPACHO', 'SEGURO'].includes(comprobante.clasificacion_gasto)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Acceso denegado: El rol OPERATIVO no tiene permisos para ver este tipo de comprobante.',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: comprobante,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al consultar comprobante';
    console.error('[GET /api/comprobantes/[id]] Error:', err);
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
    entity: 'comprobantes',
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

  // 3. Request Body Validation
  const validation = await validateBody(UpdateComprobanteSchema, request);
  if (!validation.success) {
    return validation.response;
  }

  const updates = validation.data;
  const isAssigningFolder = updates.carpeta_id !== undefined || updates.carpeta_codigo !== undefined;
  const isModifyingAccountingFields =
    updates.monto_total !== undefined ||
    updates.subtotal_neto !== undefined ||
    updates.monto_iva !== undefined ||
    updates.alicuota_iva !== undefined ||
    updates.emisor_cuit !== undefined;
  const isKanbanWorkflowTransition =
    isAssigningFolder ||
    (!isModifyingAccountingFields &&
      (updates.asentado_en_erp !== undefined ||
        updates.estado_pago !== undefined ||
        updates.estado_workflow !== undefined ||
        updates.desvio_porcentaje !== undefined ||
        updates.desvio_autorizado !== undefined));

  // 4. Role Authorization:
  // Asignación/reasignación de carpeta y movimiento en Kanban permitido a OPERATIVO, LEAD_OPERACIONES, FINANZAS, GERENCIA, ADMIN
  const allowedRolesForAssignment = ['OPERATIVO', 'LEAD_OPERACIONES', 'FINANZAS', 'GERENCIA', 'ADMIN'];
  if (isKanbanWorkflowTransition) {
    if (!allowedRolesForAssignment.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso denegado: El rol '${role}' no tiene permisos para mover o asignar comprobantes.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  } else if (!canEditComprobantes(role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Acceso denegado: El rol '${role}' no tiene permisos para modificar comprobantes.`,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  try {
    const adminClient = createAdminClient();
    const liveStore = loadLiveStore();

    const existing = liveStore.comprobantes.find(
      (c) => c.id === id || c.numero_comprobante === id
    );

    const updatePayload: Database['public']['Tables']['comprobantes']['Update'] = {
      ...updates,
      metadata_raw: updates.metadata_raw ? (updates.metadata_raw as Json) : undefined,
      updated_at: new Date().toISOString(),
    };

    const { data: dbData, error: dbError } = await adminClient
      .from('comprobantes')
      .update(updatePayload)
      .or(`id.eq.${id},numero_comprobante.eq.${id}`)
      .select('*')
      .single();

    const updatedInLiveStore = updateComprobanteInStore(id, {
      ...updates,
      metadata_raw: updates.metadata_raw
        ? (updates.metadata_raw as Json)
        : (existing?.metadata_raw ?? {}),
    });

    const finalComprobante: ComprobanteRecord =
      (!dbError && dbData ? (dbData as ComprobanteRecord) : null) ??
      updatedInLiveStore ??
      (existing
        ? {
            ...existing,
            ...updates,
            metadata_raw: updates.metadata_raw
              ? (updates.metadata_raw as Json)
              : (existing.metadata_raw ?? {}),
            updated_at: new Date().toISOString(),
          }
        : (null as unknown as ComprobanteRecord));

    // Calculate diff for audit log
    const diff: Record<string, { anterior: unknown; nuevo: unknown }> = {};
    if (existing) {
      for (const [key, val] of Object.entries(updates)) {
        if (key in existing && (existing as Record<string, unknown>)[key] !== val) {
          diff[key] = {
            anterior: (existing as Record<string, unknown>)[key],
            nuevo: val,
          };
        }
      }
    }

    // Recalculate target folder financials if assigned
    if (finalComprobante.carpeta_id) {
      recalculateFolderFinancials(finalComprobante.carpeta_id);
    }

    // 5. ISO 9001 Immutable Audit Log
    const auditAction = isAssigningFolder ? 'ASIGNAR_CARPETA_COMPROBANTE' : 'MODIFICAR_COMPROBANTE';
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email ?? 'user@almarrosario.com',
      userRole: role,
      action: auditAction,
      entity: 'comprobantes',
      entityId: finalComprobante.numero_comprobante || id,
      ipAddress,
      userAgent,
      details: {
        updates,
        diff,
        action: auditAction,
        carpeta_id: finalComprobante.carpeta_id,
        carpeta_codigo: finalComprobante.carpeta_codigo,
        modifiedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: finalComprobante,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al modificar comprobante';
    console.error('[PATCH /api/comprobantes/[id]] Error:', err);
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
    entity: 'comprobantes',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const ipAddress = rateLimitCheck.ipAddress;
  const userAgent = request.headers.get('user-agent') ?? 'API Client';
  const { id } = await context.params;

  // 1. Authentication Check
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

  // 2. Role Authorization
  if (!canDiscardComprobante(role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Acceso denegado: El rol '${role}' no tiene permisos para descartar comprobantes.`,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  // 3. Extract Motivo (Mandatory for ISO 9001 compliance)
  let motivo = 'Descarte por corrección operativa / comprobante duplicado';
  try {
    const body = await request.json();
    if (body && typeof body.motivo === 'string' && body.motivo.trim().length > 0) {
      motivo = body.motivo.trim();
    }
  } catch {
    const queryMotivo = request.nextUrl.searchParams.get('motivo');
    if (queryMotivo && queryMotivo.trim().length > 0) {
      motivo = queryMotivo.trim();
    }
  }

  try {
    const liveStore = loadLiveStore();
    const existing = liveStore.comprobantes.find(
      (c) => c.id === id || c.numero_comprobante === id
    );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Comprobante '${id}' no encontrado.`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Soft delete: Mark as RECHAZADO and metadata descartado = true
    const existingMeta = (existing.metadata_raw && typeof existing.metadata_raw === 'object' && !Array.isArray(existing.metadata_raw))
      ? (existing.metadata_raw as Record<string, unknown>)
      : {};

    const updatedRecord: ComprobanteRecord = {
      ...existing,
      estado_pago: 'RECHAZADO',
      metadata_raw: {
        ...existingMeta,
        descartado: true,
        motivo_descarte: motivo,
        descartado_por: user.email ?? 'operaciones@almar.com.ar',
        descartado_rol: role,
        descartado_at: new Date().toISOString(),
      } as Json,
      updated_at: new Date().toISOString(),
    };

    updateComprobanteInStore(id, {
      estado_pago: 'RECHAZADO',
      metadata_raw: updatedRecord.metadata_raw,
    });

    // Supabase soft-delete update
    const adminClient = createAdminClient();
    await adminClient
      .from('comprobantes')
      .update({
        estado_pago: 'RECHAZADO',
        metadata_raw: updatedRecord.metadata_raw,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${id},numero_comprobante.eq.${id}`);

    // Immutable ISO 9001 Audit Log
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email ?? 'user@almarrosario.com',
      userRole: role,
      action: 'DESCARTAR_COMPROBANTE',
      entity: 'comprobantes',
      entityId: existing.numero_comprobante || id,
      ipAddress,
      userAgent,
      details: {
        comprobanteId: id,
        numeroComprobante: existing.numero_comprobante,
        proveedor: existing.emisor_razon_social,
        montoTotal: existing.monto_total,
        moneda: existing.moneda,
        motivo,
        descartadoAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Comprobante descartado y archivado correctamente con trazabilidad ISO 9001.',
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al descartar comprobante';
    console.error('[DELETE /api/comprobantes/[id]] Error:', err);
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
