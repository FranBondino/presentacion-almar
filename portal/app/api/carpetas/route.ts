/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * GET /api/carpetas & POST /api/carpetas
 * 
 * Provides validated listing and creation of freight shipment folders with
 * RBAC financial masking, rate limiting, and ISO 9001 audit logging.
 */

import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import crypto from 'crypto';
import {
  GetCarpetasQuerySchema,
  CreateCarpetaSchema,
  validateBody,
  validateQuery,
} from '@/lib/schemas/api';
import { getCurrentUser } from '@/lib/auth.server';
import { canAccessFinancials } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { apiRateLimiter, enforceRateLimit } from '@/lib/ratelimit';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { type CarpetaRecord } from '@/lib/mockData';
import {
  loadLiveStore,
  saveLiveStore,
  normalizeLiveStoreRecords,
  persistCarpetaRecord,
  scheduleSupabaseSync,
} from '@/lib/persistence/live-store';
import type { Database } from '@/lib/supabase/database.types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rateLimitCheck = await enforceRateLimit({
    limiter: apiRateLimiter,
    request,
    entity: 'carpetas',
  });
  if (rateLimitCheck.blocked && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

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

  // 3. Query Parameter Validation
  const validation = validateQuery(GetCarpetasQuerySchema, request.nextUrl.searchParams);
  if (!validation.success) {
    return validation.response;
  }

  const search = validation.data.search;
  const estado = validation.data.estado;
  const area = validation.data.area;
  const sector = validation.data.sector;
  const limit = validation.data.limit ?? 50;
  const offset = validation.data.offset ?? 0;

  try {
    const supabase = await createClient();
    const liveStore = loadLiveStore();
    let carpetas: CarpetaRecord[] = [];

    // Attempt Supabase query and merge with persistent LiveStore
    const { data: dbCarpetas, error: dbError } = await supabase
      .from('carpetas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dbError && dbCarpetas && dbCarpetas.length > 0) {
      const typedDbCarpetas = dbCarpetas as CarpetaRecord[];
      const seenCodes = new Set<string>(
        liveStore.carpetas.map((c) => c.numero_carpeta.toUpperCase())
      );
      let addedFromDb = false;
      for (const dbC of typedDbCarpetas) {
        const cu = (dbC.numero_carpeta || '').toUpperCase().trim();
        if (
          cu &&
          cu !== 'C9999' &&
          cu !== 'C995' &&
          cu !== 'C985' &&
          cu !== 'C1415' &&
          cu !== 'TL11849' &&
          !seenCodes.has(cu) &&
          !(cu === 'L0703' && seenCodes.has('C1395'))
        ) {
          liveStore.carpetas.push(dbC);
          seenCodes.add(cu);
          addedFromDb = true;
        }
      }
      const hasLegacyRowsInDb = typedDbCarpetas.some((c) => {
        const cu = (c.numero_carpeta || '').toUpperCase().trim();
        return (
          ['L0703', 'C1415', 'C995', 'C985', 'TL11849'].includes(cu) ||
          /^operaci[oó]n/i.test(c.cliente_nombre || '')
        );
      });
      if ((addedFromDb || hasLegacyRowsInDb) && !process.env.VITEST && process.env.NODE_ENV !== 'test') {
        const { modified } = normalizeLiveStoreRecords(liveStore);
        if (modified || hasLegacyRowsInDb) {
          saveLiveStore(liveStore);
          for (const c of liveStore.carpetas) {
            scheduleSupabaseSync('carpetas', c);
          }
          Promise.resolve().then(async () => {
            try {
              const adminDb = createAdminClient();
              await adminDb
                .from('carpetas')
                .delete()
                .in('numero_carpeta', ['L0703', 'C1415', 'C995', 'C985', 'TL11849']);
            } catch {
              void 0;
            }
          });
        }
      }
      carpetas = [...liveStore.carpetas];
    } else {
      carpetas = [...liveStore.carpetas];
    }

    // Apply Filters
    if (search) {
      const q = search.toLowerCase();
      carpetas = carpetas.filter(
        (c) =>
          c.numero_carpeta.toLowerCase().includes(q) ||
          (c.numero_interno?.toLowerCase().includes(q) ?? false) ||
          c.cliente_nombre.toLowerCase().includes(q) ||
          (c.contenedor?.toLowerCase().includes(q) ?? false) ||
          (c.hbl_hawb?.toLowerCase().includes(q) ?? false) ||
          (c.booking?.toLowerCase().includes(q) ?? false)
      );
    }

    if (estado) {
      carpetas = carpetas.filter((c) => c.estado === estado);
    }
    if (area) {
      carpetas = carpetas.filter((c) => c.area === area);
    }
    if (sector) {
      carpetas = carpetas.filter((c) => c.sector === sector);
    }

    const total = carpetas.length;
    const paginated = carpetas.slice(offset, offset + limit);

    // 4. Financial Masking for OPERATIVO & unauthorized roles
    const showFinancials = canAccessFinancials(role);
    const sanitizedCarpetas = paginated.map((c) => {
      if (!showFinancials) {
        return {
          ...c,
          costo_estimado_total: null,
          costo_total_compra: null,
          venta_estimada_total: null,
          margen_estimado: null,
        };
      }
      return c;
    });

    return NextResponse.json({
      success: true,
      data: sanitizedCarpetas,
      total,
      limit,
      offset,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al listar carpetas';
    console.error('[GET /api/carpetas] Error:', err);
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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  // 3. RBAC Authorization Check (All operational, commercial, finance, and management roles)
  const allowedRoles = ['LEAD_OPERACIONES', 'OPERATIVO', 'COMERCIAL', 'GERENCIA', 'ADMIN', 'FINANZAS'];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Acceso denegado: El rol '${role}' no tiene permisos para crear carpetas.`,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  // 4. Request Body Validation
  const validation = await validateBody(CreateCarpetaSchema, request);
  if (!validation.success) {
    return validation.response;
  }

  const input = validation.data;
  const area = input.area ?? 'MARITIMO';
  const sector = input.sector ?? 'IMPORTACION';
  const estado = input.estado ?? 'BOOKING_CONFIRMADO';
  const tipoCarga = input.tipo_carga ?? 'FCL';
  const volumenM3 = input.volumen_m3 ?? 0;
  const pesoKg = input.peso_kg ?? 0;
  const bultos = input.bultos ?? 1;
  const costoTotal = input.costo_estimado_total ?? 0;
  const ventaTotal = input.venta_estimada_total ?? 0;
  const moneda = input.moneda ?? 'USD';
  const cierreOp = input.cierre_operativo ?? false;
  const cierreCont = input.cierre_contable ?? false;

  try {
    const adminClient = createAdminClient();

    const insertPayload: Database['public']['Tables']['carpetas']['Insert'] = {
      id: crypto.randomUUID(),
      numero_carpeta: input.numero_carpeta,
      numero_interno: input.numero_interno ?? null,
      cliente_nombre: input.cliente_nombre,
      cliente_cuit: input.cliente_cuit ?? null,
      cliente_email: input.cliente_email ?? null,
      area,
      sector,
      estado,
      tipo_carga: tipoCarga,
      origen: input.origen,
      destino: input.destino,
      buque_vuelo: input.buque_vuelo ?? null,
      viaje: input.viaje ?? null,
      hbl_hawb: input.hbl_hawb ?? null,
      mbl_mawb: input.mbl_mawb ?? null,
      booking: input.booking ?? null,
      contenedor: input.contenedor ?? null,
      etd: input.etd ?? null,
      eta: input.eta ?? null,
      volumen_m3: volumenM3,
      peso_kg: pesoKg,
      bultos: bultos,
      operador_id: input.operador_id ?? null,
      comercial_id: input.comercial_id ?? null,
      costo_estimado_total: costoTotal,
      venta_estimada_total: ventaTotal,
      moneda,
      cierre_operativo: cierreOp,
      cierre_contable: cierreCont,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newCarpetaRecord: CarpetaRecord = {
      ...insertPayload,
      id: insertPayload.id ?? crypto.randomUUID(),
      numero_interno: insertPayload.numero_interno ?? null,
      cliente_cuit: insertPayload.cliente_cuit ?? null,
      cliente_email: insertPayload.cliente_email ?? null,
      buque_vuelo: insertPayload.buque_vuelo ?? null,
      viaje: insertPayload.viaje ?? null,
      hbl_hawb: insertPayload.hbl_hawb ?? null,
      mbl_mawb: insertPayload.mbl_mawb ?? null,
      booking: insertPayload.booking ?? null,
      contenedor: insertPayload.contenedor ?? null,
      etd: insertPayload.etd ?? null,
      eta: insertPayload.eta ?? null,
      operador_id: insertPayload.operador_id ?? null,
      comercial_id: insertPayload.comercial_id ?? null,
      area,
      sector,
      estado,
      tipo_carga: tipoCarga,
      volumen_m3: volumenM3,
      peso_kg: pesoKg,
      bultos,
      costo_estimado_total: costoTotal,
      venta_estimada_total: ventaTotal,
      margen_estimado: Math.round((ventaTotal - costoTotal) * 100) / 100,
      moneda,
      cierre_operativo: cierreOp,
      cierre_contable: cierreCont,
      estado_kipintoch: input.estado_kipintoch ?? 'Orden de venta',
      shipper_nombre: input.shipper_nombre ?? null,
      consignee_nombre: input.consignee_nombre ?? input.cliente_nombre,
      transportista_nombre: input.transportista_nombre ?? null,
      usuario_asignado: input.usuario_asignado ?? (user as { nombre?: string }).nombre ?? 'Natali Hermoso',
      usuario_responsable: input.usuario_asignado ?? (user as { nombre?: string }).nombre ?? 'Natali Hermoso',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Attempt DB insertion
    const { data: insertedData, error: insertError } = await adminClient
      .from('carpetas')
      .insert(insertPayload)
      .select('*')
      .single();

    const createdCarpeta: CarpetaRecord = (!insertError && insertedData)
      ? (insertedData as CarpetaRecord)
      : newCarpetaRecord;

    persistCarpetaRecord(createdCarpeta);

    // 5. ISO 9001 Immutable Audit Log
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email ?? 'user@almarrosario.com',
      userRole: role,
      action: 'CREAR_CARPETA',
      entity: 'carpetas',
      entityId: createdCarpeta.numero_carpeta,
      ipAddress,
      userAgent,
      details: {
        id: createdCarpeta.id,
        numero_carpeta: createdCarpeta.numero_carpeta,
        cliente: createdCarpeta.cliente_nombre,
        area: createdCarpeta.area,
        origen: createdCarpeta.origen,
        destino: createdCarpeta.destino,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: createdCarpeta,
      },
      { status: 201 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al crear carpeta';
    console.error('[POST /api/carpetas] Error:', err);
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
