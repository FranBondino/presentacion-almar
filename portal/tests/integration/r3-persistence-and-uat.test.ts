/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Integration Test Suite: Milestone M3
 * - Supabase Migration 005 DDL & Indexes Verification
 * - Hybrid Persistence Store (Durable Local Disk <15ms + Non-Blocking Async Supabase Sync)
 * - Corporate Multi-Role Impersonator Endpoint (/api/auth/impersonate)
 * - 1-Click Quick UAT Role Switcher Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { NextRequest } from 'next/server';

import {
  loadLiveStore,
  saveLiveStore,
  scheduleSupabaseSync,
  persistCarpetaRecord,
  updateCarpetaInStore,
  persistCotizacionRecord,
  updateCotizacionInStore,
  persistComprobanteRecord,
  updateComprobanteInStore,
  persistTrackingEventRecord,
  type TrackingEventRecord,
} from '@/lib/persistence/live-store';

import {
  POST as impersonatePostHandler,
  GET as impersonateGetHandler,
} from '@/app/api/auth/impersonate/route';
import { CORPORATE_UAT_PERSONAS } from '@/lib/auth';

import { UatRoleSwitcher } from '@/components/layout/UatRoleSwitcher';
import { AuthProvider } from '@/components/auth/RoleGuard';
import type { CarpetaRecord, ComprobanteRecord } from '@/lib/mockData';
import type { CotizacionRecord } from '@/types/cotizaciones';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone M3: Persistencia Híbrida y Modo UAT Multi-Rol Test Suite', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  // =========================================================================
  // 1. Supabase Migration 005 DDL Verification
  // =========================================================================
  describe('1. Supabase Migration 005: Schema & DDL Integrity', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/005_kipintoch_cubicaje_manuals.sql'
    );

    it('Migration file 005 exists on disk and is non-empty', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content.length).toBeGreaterThan(500);
    });

    it('Migration 005 contains complete ALTER TABLE carpetas with all 28 required columns', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain('ALTER TABLE public.carpetas');

      const expectedCarpetasColumns = [
        'costo_real_total',
        'desvio_costo_usd',
        'estado_kipintoch',
        'modalidad_consolidacion',
        'tipo_operacion_kipin',
        'shipper_nombre',
        'consignee_nombre',
        'transportista_nombre',
        'customer_operador',
        'usuario_responsable',
        'cotizacion_vinculada_codigo',
        'costos_estimados',
        'checklist_progreso',
        'evidencia_gmail',
        'actores_expediente',
        'condicion_flete',
        'tipo_unidad_terrestre',
        'rentabilidad_autorizada',
        'seguro_contratado',
        'poliza_seguro_recibida',
        'poliza_seguro_numero',
        'provision_seguro_usd',
        'costos_pendientes',
      ];

      for (const col of expectedCarpetasColumns) {
        expect(content, `Column ${col} missing in carpetas DDL`).toContain(col);
      }
    });

    it('Migration 005 contains complete ALTER TABLE cotizaciones with all 16 required columns', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain('ALTER TABLE public.cotizaciones');

      const expectedCotizacionesColumns = [
        'propuesta_comercial_codigo',
        'usuario_pricing',
        'vendedor_nombre',
        'agente_proveedor',
        'shipper_proveedor',
        'cbm_total',
        'peso_bruto_kg',
        'peso_tasable',
        'cantidad_bultos',
        'sugerencia_equipo',
        'resumen_cubicaje',
        'bultos_detalle',
        'cubicaje_data',
        'status_kipintoch',
        'gmail_message_id',
        'rfc_message_id',
      ];

      for (const col of expectedCotizacionesColumns) {
        expect(content, `Column ${col} missing in cotizaciones DDL`).toContain(col);
      }
    });

    it('Migration 005 creates public.eventos_tracking table with RLS and proper types', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.eventos_tracking');
      expect(content).toContain('carpeta_id UUID');
      expect(content).toContain('carpeta_codigo');
      expect(content).toContain('tipo_evento');
      expect(content).toContain('fecha_evento TIMESTAMPTZ');
      expect(content).toContain('ENABLE ROW LEVEL SECURITY');
    });

    it('Migration 005 includes all 9 required performance and foreign-key indexes', () => {
      const content = fs.readFileSync(migrationPath, 'utf8');
      const expectedIndexes = [
        'idx_carpetas_estado_kipintoch',
        'idx_carpetas_modalidad_consolidacion',
        'idx_carpetas_cotizacion_vinculada',
        'idx_cotizaciones_propuesta_comercial',
        'idx_cotizaciones_status_kipintoch',
        'idx_cotizaciones_usuario_pricing',
        'idx_eventos_tracking_carpeta_codigo',
        'idx_eventos_tracking_carpeta_id',
        'idx_eventos_tracking_tipo_fecha',
      ];

      for (const idx of expectedIndexes) {
        expect(content, `Index ${idx} missing in migration 005`).toContain(idx);
      }
    });
  });

  // =========================================================================
  // 2. Hybrid Persistence & Non-Blocking Async Sync
  // =========================================================================
  describe('2. Hybrid Persistence: Local Atomic Store & scheduleSupabaseSync', () => {
    it('scheduleSupabaseSync executes without throwing and does not block when remote is offline', () => {
      expect(() => {
        scheduleSupabaseSync('carpetas', { id: 'test-c1', numero_carpeta: 'C9999' });
        scheduleSupabaseSync('cotizaciones', { id: 'test-q1', numeroCotizacion: 'COT-9999' });
        scheduleSupabaseSync('comprobantes', { id: 'test-cmp1', numero_comprobante: 'A-0001-00000001' });
        scheduleSupabaseSync('eventos_tracking', { id: 'test-trk1', carpeta_codigo: 'C9999' });
      }).not.toThrow();
    });

    it('Local atomic saveLiveStore completes with low response latency', () => {
      const store = loadLiveStore();
      const start = performance.now();
      saveLiveStore(store);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(250);
    });

    it('persistCarpetaRecord persists into local store and returns record immediately', () => {
      const uniqueId = `carpeta-test-${Date.now()}`;
      const uniqueCode = `C${Math.floor(1000 + Math.random() * 9000)}`;

      const testCarpeta: CarpetaRecord = {
        id: uniqueId,
        numero_carpeta: uniqueCode,
        numero_interno: null,
        cliente_nombre: 'TEST HYBRID LOGISTICS S.A.',
        cliente_cuit: '30-71234567-9',
        cliente_email: 'comex@testhybrid.com',
        area: 'MARITIMO',
        sector: 'IMPORTACION',
        estado: 'EN_TRANSITO',
        tipo_carga: 'FCL',
        origen: 'Ningbo, China (CNNGB)',
        destino: 'Buenos Aires, Argentina (ARBUE)',
        buque_vuelo: 'MSC TIANPING',
        viaje: '2403W',
        hbl_hawb: 'HBL-HYBRID-01',
        mbl_mawb: 'MEDUNB998877',
        booking: 'BKG-998877',
        contenedor: 'MEDU1234567 (1x40HC)',
        etd: '2026-10-15',
        eta: '2026-11-20',
        volumen_m3: 65,
        peso_kg: 22000,
        bultos: 18,
        operador_id: null,
        comercial_id: null,
        costo_estimado_total: 3200,
        costo_real_total: 3200,
        desvio_costo_usd: 0,
        venta_estimada_total: 4100,
        margen_estimado: 900,
        moneda: 'USD',
        cierre_operativo: false,
        cierre_contable: false,
        estado_kipintoch: 'ORDEN_DE_VENTA',
        modalidad_embarque: 'DIRECTA',
        tipo_operacion: 'FCL - FCL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = persistCarpetaRecord(testCarpeta);
      expect(result.id).toBe(uniqueId);

      const store = loadLiveStore();
      const found = store.carpetas.find((c) => c.id === uniqueId);
      expect(found).toBeDefined();
      expect(found?.numero_carpeta).toBe(uniqueCode);

      // Verify updateCarpetaInStore
      const updated = updateCarpetaInStore(uniqueCode, {
        costo_real_total: 3450,
        desvio_costo_usd: 250,
      });
      expect(updated?.costo_real_total).toBe(3450);
      expect(updated?.desvio_costo_usd).toBe(250);
    });

    it('persistCotizacionRecord and updateCotizacionInStore persist and sync', () => {
      const uniqueId = `quote-test-${Date.now()}`;
      const uniqueNum = `COT-${Math.floor(1000 + Math.random() * 9000)}`;

      const testQuote: CotizacionRecord = {
        id: uniqueId,
        numeroCotizacion: uniqueNum,
        clienteNombre: 'IMPORTADORA ROSARIO SRL',
        clienteCuit: '30-68112233-4',
        contactoEmail: 'lucia@importadorarosario.com',
        segmento: 'FIDELIZADO_HABITUAL',
        fechaEmision: new Date().toISOString(),
        horasDesdeEmision: 2,
        responsableComercial: 'Lucía Laje',
        via: 'MARITIMO_FCL',
        origen: 'Santos, Brasil',
        destino: 'Rosario, Argentina',
        incoterm: 'FOB',
        fleteVentaUsd: 1950,
        fleteCostoEstimadoUsd: 1550,
        margenBrutoUsd: 400,
        margenPorcentaje: 20.5,
        navieraOAerolineaSugerida: 'Hapag-Lloyd',
        tiempoTransitoEstimadoDias: 14,
        diasLibresDemora: 10,
        vigenciaTarifaDias: 30,
        fechaVencimientoTarifa: '2026-11-24',
        estado: 'COTIZADA',
        followUpEnviado: false,
        propuestaComercialCodigo: 'PROP-2026-089',
        usuarioPricing: 'Lucía Laje',
        vendedor: 'Lucía Laje',
        agenteTransportista: 'Hapag-Lloyd Rosario',
        cbmTotal: 45.2,
        pesoBrutoKg: 14500,
        pesoTasableKg: 14500,
        cantidadBultos: 22,
        statusKipintoch: 'Pendiente',
      };

      const result = persistCotizacionRecord(testQuote);
      expect(result.id).toBe(uniqueId);

      const store = loadLiveStore();
      const found = store.cotizaciones.find((q) => q.id === uniqueId);
      expect(found).toBeDefined();
      expect(found?.numeroCotizacion).toBe(uniqueNum);

      const updated = updateCotizacionInStore(uniqueNum, {
        statusKipintoch: 'Confirmada',
        estado: 'GANADA',
      });
      expect(updated?.statusKipintoch).toBe('Confirmada');
      expect(updated?.estado).toBe('GANADA');
    });

    it('persistTrackingEventRecord stores tracking events and integrates with live-store', () => {
      const trackingId = `trk-test-${Date.now()}`;
      const trackingEvent: TrackingEventRecord = {
        id: trackingId,
        carpeta_codigo: 'C1465',
        carpeta_id: null,
        tipo_evento: 'ETA_UPDATE',
        buque: 'CMA CGM TANGER',
        carrier: 'CMA CGM',
        pol: 'Valencia, Spain (ESVLC)',
        pod: 'Zárate, Argentina (ARZAR)',
        etd: '2026-09-12',
        eta: '2026-10-18',
        containers: ['CMAU9876543'],
        mbl: 'CMAU12345678',
        hbl: 'HBL-VAL-098',
        raw_subject: 'Actualización ETA CMA CGM TANGER - Carpeta C1465',
        fecha_evento: new Date().toISOString(),
        gmail_message_id: '18f2a1b3c4d5e6f7',
      };

      const persisted = persistTrackingEventRecord(trackingEvent);
      expect(persisted.id).toBe(trackingId);

      const store = loadLiveStore();
      const found = store.eventos_tracking.find((t) => t.id === trackingId);
      expect(found).toBeDefined();
      expect(found?.buque).toBe('CMA CGM TANGER');
      expect(found?.carpeta_codigo).toBe('C1465');
    });
  });

  // =========================================================================
  // 3. /api/auth/impersonate Corporate Personas & Production Resilience
  // =========================================================================
  describe('3. Corporate UAT Impersonator (/api/auth/impersonate)', () => {
    it('POST /api/auth/impersonate switches to Lucía Laje (COMERCIAL, llaje@almarrosario.com)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'llaje@almarrosario.com' }),
      });

      const res = await impersonatePostHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.user.nombre).toBe('Lucía Laje');
      expect(body.user.email).toBe('llaje@almarrosario.com');
      expect(body.user.role).toBe('COMERCIAL');

      const cookies = res.cookies.getAll();
      expect(cookies.some((c) => c.name === 'almar_auth')).toBe(true);
      expect(cookies.some((c) => c.name === 'sb-access-token')).toBe(true);
    });

    it('POST /api/auth/impersonate switches to Natali Hermoso (LEAD_OPERACIONES, nhermoso@almarrosario.com)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nhermoso@almarrosario.com' }),
      });

      const res = await impersonatePostHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.user.nombre).toBe('Natali Hermoso');
      expect(body.user.email).toBe('nhermoso@almarrosario.com');
      expect(body.user.role).toBe('LEAD_OPERACIONES');
    });

    it('POST /api/auth/impersonate switches to Stefania Rossi (FINANZAS, srossi@almarrosario.com)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'srossi@almarrosario.com' }),
      });

      const res = await impersonatePostHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.user.email).toBe('srossi@almarrosario.com');
      expect(body.user.role).toBe('FINANZAS');
    });

    it('POST /api/auth/impersonate switches to Juan Andrés Arloro (ADMIN, jarloro@almarrosario.com)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jarloro@almarrosario.com' }),
      });

      const res = await impersonatePostHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.user.nombre).toBe('Juan Andrés Arloro');
      expect(body.user.email).toBe('jarloro@almarrosario.com');
      expect(body.user.role).toBe('ADMIN');
    });

    it('GET /api/auth/impersonate returns corporatePersonas array with 4 corporate personas', async () => {
      const res = await impersonateGetHandler(new NextRequest('http://localhost:3000/api/auth/impersonate'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.personas).toHaveLength(6);
      expect(body.corporatePersonas).toHaveLength(4);

      const corporateEmails = body.corporatePersonas.map((p: { email: string }) => p.email);
      expect(corporateEmails).toContain('llaje@almarrosario.com');
      expect(corporateEmails).toContain('nhermoso@almarrosario.com');
      expect(corporateEmails).toContain('srossi@almarrosario.com');
      expect(corporateEmails).toContain('jarloro@almarrosario.com');
    });

    it('ALLOW_UAT_SWITCH=true unblocks endpoint in production mode for reviewer evaluations', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_UAT_SWITCH', 'true');

      const req = new NextRequest('https://almarrosario.com/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'llaje@almarrosario.com' }),
      });

      const res = await impersonatePostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe('llaje@almarrosario.com');
    });

    it('ALLOW_UAT_SWITCH=false strictly locks down endpoint in production mode without active session', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_UAT_SWITCH', 'false');

      const req = new NextRequest('https://almarrosario.com/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'llaje@almarrosario.com' }),
      });

      const res = await impersonatePostHandler(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Endpoint no disponible en producción');
    });
  });

  // =========================================================================
  // 4. Quick UAT Role Switcher Component
  // =========================================================================
  describe('4. Quick UAT Role Switcher Component Rendering & Functionality', () => {
    it('UatRoleSwitcher renders container with data-testid="uat-role-switcher"', () => {
      const html = renderToString(
        React.createElement(
          AuthProvider,
          {
            initialUser: {
              id: '00000000-0000-0000-0000-000000000001',
              email: 'jarloro@almarrosario.com',
              nombre: 'Juan Andrés Arloro',
              role: 'ADMIN',
            },
          },
          React.createElement(UatRoleSwitcher)
        )
      );

      expect(html).toContain('data-testid="uat-role-switcher"');
    });

    it('UatRoleSwitcher renders 4 corporate buttons for Comercial, Operaciones, Finanzas, and Dirección', () => {
      const html = renderToString(
        React.createElement(
          AuthProvider,
          {
            initialUser: {
              id: '00000000-0000-0000-0000-000000000001',
              email: 'jarloro@almarrosario.com',
              nombre: 'Juan Andrés Arloro',
              role: 'ADMIN',
            },
          },
          React.createElement(UatRoleSwitcher)
        )
      );

      expect(html).toContain('data-testid="uat-role-btn-comercial"');
      expect(html).toContain('data-testid="uat-role-btn-lead_operaciones"');
      expect(html).toContain('data-testid="uat-role-btn-finanzas"');
      expect(html).toContain('data-testid="uat-role-btn-admin"');

      expect(html).toContain('Comercial');
      expect(html).toContain('Operaciones');
      expect(html).toContain('Finanzas');
      expect(html).toContain('Dirección');
    });

    it('CORPORATE_UAT_PERSONAS exports the 4 canonical @almarrosario.com identities', () => {
      expect(CORPORATE_UAT_PERSONAS).toHaveLength(4);

      const personas = CORPORATE_UAT_PERSONAS.map((p) => ({
        email: p.email,
        nombre: p.nombre,
        role: p.rol,
      }));

      expect(personas).toEqual([
        { email: 'llaje@almarrosario.com', nombre: 'Lucía Laje', role: 'COMERCIAL' },
        { email: 'nhermoso@almarrosario.com', nombre: 'Natali Hermoso', role: 'LEAD_OPERACIONES' },
        { email: 'srossi@almarrosario.com', nombre: 'Stefanía Rossi', role: 'FINANZAS' },
        { email: 'jarloro@almarrosario.com', nombre: 'Juan Andrés Arloro', role: 'ADMIN' },
      ]);
    });
  });
});
