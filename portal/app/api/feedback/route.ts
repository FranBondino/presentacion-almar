/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * POST /api/feedback, GET /api/feedback & PATCH /api/feedback
 *
 * Provides an in-app edge-case & improvement reporting circuit for the team,
 * routed to each Directorate member by area (Juan Arloro -> Operaciones,
 * Alejandro Noacco -> Comercial, Vanesa Meggiolaro -> Administración/Finanzas),
 * with daily batch approval/modification for Francisco (Fran).
 */

import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  CreateFeedbackSchema,
  validateBody,
} from '@/lib/schemas/api';
import { getCurrentUser } from '@/lib/auth.server';
import { logAuditEvent } from '@/lib/audit';
import { apiRateLimiter, enforceRateLimit } from '@/lib/ratelimit';

import {
  IN_MEMORY_FEEDBACK_STORE,
  loadPersistedFeedbackStore,
  savePersistedFeedbackStore,
  resolveDirectorateRouting,
  type FeedbackTicketRecord,
  type DirectorioArea,
  type EstadoAprobacionDirectorio,
} from '@/lib/feedback';
import { dispatchTicketNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'feedback',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const { searchParams } = request.nextUrl;
  const carpetaId = searchParams.get('carpeta_id');
  const tipo = searchParams.get('tipo');
  const area = searchParams.get('area_directorio');
  const estadoAprobacion = searchParams.get('estado_aprobacion');

  loadPersistedFeedbackStore();
  let results = [...IN_MEMORY_FEEDBACK_STORE];

  if (carpetaId) {
    results = results.filter((r) => r.carpeta_id?.toUpperCase() === carpetaId.toUpperCase());
  }
  if (tipo) {
    results = results.filter((r) => r.tipo.toUpperCase() === tipo.toUpperCase());
  }
  if (area && area !== 'ALL') {
    results = results.filter((r) => r.area_directorio === area);
  }
  if (estadoAprobacion && estadoAprobacion !== 'ALL') {
    results = results.filter((r) => r.estado_aprobacion === estadoAprobacion);
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    data: results,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'feedback',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const validation = await validateBody(CreateFeedbackSchema, request);
  if (!validation.success) {
    return validation.response;
  }

  const body = validation.data;

  let userEmail = body.usuario_email;
  let userRole = body.usuario_rol || 'OPERATIVO';
  let userName = body.usuario_nombre || 'Usuario Operativo';
  let userId: string | null = null;

  try {
    const session = await getCurrentUser();
    if (session?.user) {
      userEmail = session.user.email || userEmail;
      userRole = session.role || userRole;
      userName = (session.user.user_metadata?.nombre as string) || session.user.email || userName;
      userId = session.user.id || null;
    }
  } catch {
    // Graceful fallback for non-cookie contexts / mock sessions
  }

  const tipo = (body.tipo ?? 'EDGE_CASE') as string;
  const severidad = (body.severidad ?? 'MEDIA') as string;
  const effectiveEmail = userEmail || 'operaciones@almarrosario.com';
  const shortId = crypto.randomBytes(3).toString('hex').toUpperCase();
  const ticketCode = `TKT-${tipo.substring(0, 3)}-${shortId}`;

  const requestedArea = (body.contexto_adicional as Record<string, unknown> | undefined)
    ?.area_directorio as DirectorioArea | undefined;

  const routing = resolveDirectorateRouting({
    pantalla: body.pantalla,
    usuario_rol: userRole,
    usuario_email: effectiveEmail,
    area_directorio: requestedArea,
  });

  const newTicket: FeedbackTicketRecord = {
    id: `fb-${crypto.randomUUID()}`,
    ticket_code: ticketCode,
    tipo,
    severidad,
    mensaje: body.mensaje,
    pantalla: body.pantalla,
    carpeta_id: body.carpeta_id ?? null,
    usuario_nombre: userName,
    usuario_email: effectiveEmail,
    usuario_rol: userRole,
    contexto_adicional: body.contexto_adicional ?? {},
    screenshots: body.screenshots ?? [],
    created_at: new Date().toISOString(),
    estado: 'ABIERTO',
    area_directorio: routing.area_directorio,
    director_asignado_email: routing.director_asignado_email,
    director_asignado_nombre: routing.director_asignado_nombre,
    estado_aprobacion: 'PENDIENTE_DIRECTORIO',
    mensaje_modificado_directorio: null,
    nota_directorio_para_fran: null,
    resuelto_por_nombre: null,
    resuelto_por_email: null,
    fecha_resolucion_directorio: null,
    lote_diario_fecha: null,
  };

  loadPersistedFeedbackStore();
  IN_MEMORY_FEEDBACK_STORE.unshift(newTicket);
  savePersistedFeedbackStore(IN_MEMORY_FEEDBACK_STORE);

  try {
    await logAuditEvent({
      userId,
      userEmail: effectiveEmail,
      userRole,
      action: 'REPORTAR_FEEDBACK_EDGE_CASE',
      entity: 'alertas',
      entityId: body.carpeta_id ?? null,
      details: {
        ticket_code: ticketCode,
        tipo: body.tipo,
        severidad: body.severidad,
        pantalla: body.pantalla,
        mensaje: body.mensaje,
        area_directorio: routing.area_directorio,
        director_asignado: routing.director_asignado_nombre,
        screenshots_count: (body.screenshots ?? []).length,
        contexto: body.contexto_adicional,
      },
    });
  } catch (err) {
    console.warn('[Feedback Route] Warning: could not persist audit event to DB:', err);
  }

  try {
    void dispatchTicketNotification(newTicket);
  } catch (notifErr) {
    console.warn('[Feedback Route] Warning: could not dispatch ticket notification:', notifErr);
  }

  return NextResponse.json(
    {
      success: true,
      ticketCode,
      message: `Propuesta registrada con el código ${ticketCode} y derivada a ${routing.director_asignado_nombre} para aprobación diaria del Directorio.`,
      data: newTicket,
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'feedback',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Payload JSON inválido' },
      { status: 400 }
    );
  }

  loadPersistedFeedbackStore();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Batch confirmation action: confirm all approved items in today's batch for Fran
  if (body.action === 'CONFIRM_DAILY_BATCH_FOR_FRAN') {
    const resolvedBy = String(body.resuelto_por_nombre || 'Directorio ALMAR');
    let count = 0;
    for (const item of IN_MEMORY_FEEDBACK_STORE) {
      if (
        item.estado_aprobacion === 'APROBADA_PARA_FRAN' ||
        item.estado_aprobacion === 'MODIFICADA_Y_APROBADA'
      ) {
        item.lote_diario_fecha = todayStr;
        if (!item.resuelto_por_nombre) {
          item.resuelto_por_nombre = resolvedBy;
        }
        count++;
      }
    }
    savePersistedFeedbackStore(IN_MEMORY_FEEDBACK_STORE);
    return NextResponse.json({
      success: true,
      confirmedCount: count,
      loteFecha: todayStr,
      data: IN_MEMORY_FEEDBACK_STORE,
    });
  }

  const id = String(body.id || '');
  const idx = IN_MEMORY_FEEDBACK_STORE.findIndex((t) => t.id === id || t.ticket_code === id);
  if (idx === -1) {
    return NextResponse.json(
      { success: false, error: 'Propuesta o ticket no encontrado' },
      { status: 404 }
    );
  }

  const target = IN_MEMORY_FEEDBACK_STORE[idx]!;
  const nextEstadoAprobacion = (body.estado_aprobacion ||
    target.estado_aprobacion ||
    'PENDIENTE_DIRECTORIO') as EstadoAprobacionDirectorio;

  if (typeof body.mensaje_modificado_directorio === 'string') {
    target.mensaje_modificado_directorio = body.mensaje_modificado_directorio.trim() || null;
  }
  if (typeof body.nota_directorio_para_fran === 'string') {
    target.nota_directorio_para_fran = body.nota_directorio_para_fran.trim() || null;
  }
  if (typeof body.area_directorio === 'string') {
    const r = resolveDirectorateRouting({
      area_directorio: body.area_directorio as DirectorioArea,
    });
    target.area_directorio = r.area_directorio;
    target.director_asignado_email = r.director_asignado_email;
    target.director_asignado_nombre = r.director_asignado_nombre;
  }

  target.estado_aprobacion = nextEstadoAprobacion;
  target.resuelto_por_nombre = String(
    body.resuelto_por_nombre || target.director_asignado_nombre || 'Directorio ALMAR'
  );
  target.resuelto_por_email = String(
    body.resuelto_por_email || target.director_asignado_email || 'directorio@almarrosario.com'
  );
  target.fecha_resolucion_directorio = new Date().toISOString();

  if (
    nextEstadoAprobacion === 'APROBADA_PARA_FRAN' ||
    nextEstadoAprobacion === 'MODIFICADA_Y_APROBADA'
  ) {
    target.estado = 'EN_REVISION';
    target.lote_diario_fecha = todayStr;
  } else if (nextEstadoAprobacion === 'RECHAZADA_DESCARTADA') {
    target.estado = 'RESUELTO';
    target.lote_diario_fecha = null;
  } else if (nextEstadoAprobacion === 'IMPLEMENTADA') {
    target.estado = 'RESUELTO';
  } else {
    target.estado = 'ABIERTO';
  }

  savePersistedFeedbackStore(IN_MEMORY_FEEDBACK_STORE);

  return NextResponse.json({
    success: true,
    data: target,
  });
}
