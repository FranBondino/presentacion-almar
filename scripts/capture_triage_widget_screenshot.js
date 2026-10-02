const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const outputDir = path.resolve(__dirname, '..', 'screenshots');
const targetFile = path.join(outputDir, 'triage_reporte_incidencia_light.png');

async function captureTriageScreenshot() {
  console.log('Generando captura en alta resolución del Widget de Triage y Reporte de Incidencias...');

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1280, initial-scale=1.0" />
  <title>ALMAR Rosario — Triage Operativo & Reporte de Incidencias</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Open+Sans:wght@400;600;700&family=Fira+Code:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Open Sans', system-ui, -apple-system, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      width: 1280px;
      height: 720px;
      overflow: hidden;
      display: flex;
      position: relative;
    }

    /* Sidebar Background Mockup */
    .mock-sidebar {
      width: 220px;
      background: #0f172a;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #1e293b;
      flex-shrink: 0;
    }
    .mock-sidebar-header {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #1e293b;
    }
    .mock-logo {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      color: #ffffff;
      font-size: 14px;
      letter-spacing: 0.05em;
    }
    .mock-nav-item {
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      border-left: 3px solid transparent;
    }
    .mock-nav-item.active {
      background: #1e293b;
      color: #38bdf8;
      border-left-color: #38bdf8;
    }

    /* Main Area Background */
    .mock-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      position: relative;
      overflow: hidden;
    }
    .mock-header {
      height: 56px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
    }
    .mock-content {
      padding: 18px 24px;
      flex: 1;
      opacity: 0.88;
    }

    /* Background Card Mockups */
    .bg-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 16px;
    }
    .bg-stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .bg-table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    /* Soft Dim Backdrop behind modal */
    .modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.40);
      backdrop-filter: blur(2px);
      z-index: 80;
    }

    /* =========================================================================
       TRIAGE WIDGET MODAL WINDOW (CENTRAL, PROTAGONISTA DEL SCREENSHOT)
       ========================================================================= */
    .widget-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 530px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 25px 60px -10px rgba(10, 37, 64, 0.5), 0 0 0 1px rgba(15, 23, 42, 0.12);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .widget-header {
      background: #0A2540;
      color: #ffffff;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e3a5f;
    }
    .widget-header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .widget-spark-badge {
      background: #0072BC;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .widget-header-text h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    .widget-header-text p {
      font-size: 10px;
      color: #7dd3fc;
      font-weight: 500;
    }

    .widget-context-bar {
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      color: #475569;
    }
    .context-tag {
      font-family: 'Fira Code', monospace;
      font-size: 10px;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      color: #1e293b;
      font-weight: 700;
    }
    .user-badge {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9.5px;
      font-weight: 700;
      color: #0369a1;
      text-transform: uppercase;
    }

    .widget-tabs {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .widget-tab {
      flex: 1;
      padding: 8px 12px;
      text-align: center;
      font-family: 'Montserrat', sans-serif;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
    }
    .widget-tab.active {
      background: #ffffff;
      color: #0072BC;
      border-bottom: 3px solid #0072BC;
    }
    .widget-tab.inactive {
      color: #64748b;
      border-bottom: 3px solid transparent;
    }

    .widget-body {
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 11px;
    }

    /* Ticket Success Banner */
    .ticket-success-box {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .ticket-success-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .ticket-code-pill {
      font-family: 'Fira Code', monospace;
      font-size: 11.5px;
      font-weight: 800;
      background: #dcfce7;
      color: #14532d;
      border: 1px solid #bbf7d0;
      padding: 2px 7px;
      border-radius: 5px;
      letter-spacing: 0.04em;
    }
    .ticket-copy-btn {
      background: #ffffff;
      border: 1px solid #86efac;
      color: #166534;
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Field Group */
    .field-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #1e293b;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }

    /* 2x2 Type Grid */
    .type-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .type-card {
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 9px;
      display: flex;
      align-items: flex-start;
      gap: 7px;
      background: #ffffff;
    }
    .type-card.selected {
      border-color: #f59e0b;
      background: #fefbeb;
      box-shadow: 0 0 0 1px #f59e0b;
    }
    .type-card-title {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    .type-card.selected .type-card-title {
      color: #92400e;
    }
    .type-card-sub {
      font-size: 9px;
      color: #64748b;
    }
    .type-card.selected .type-card-sub {
      color: #b45309;
    }

    /* Severity Pills */
    .severity-row {
      display: flex;
      gap: 6px;
    }
    .severity-pill {
      flex: 1;
      padding: 5px 0;
      text-align: center;
      border-radius: 5px;
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
    }
    .severity-pill.selected {
      border-color: #ef4444;
      background: #fef2f2;
      color: #b91c1c;
      box-shadow: 0 0 0 1px #ef4444;
    }

    /* Inputs */
    .input-mock {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 5px;
      padding: 6px 9px;
      font-size: 11px;
      background: #ffffff;
      color: #1e293b;
    }
    .textarea-mock {
      width: 100%;
      height: 52px;
      border: 1.5px solid #cbd5e1;
      border-radius: 5px;
      padding: 6px 9px;
      font-size: 10.5px;
      line-height: 1.3;
      background: #ffffff;
      color: #1e293b;
      resize: none;
    }

    /* Submit Button */
    .btn-submit {
      background: linear-gradient(135deg, #0A2540 0%, #0072BC 100%);
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      font-family: 'Montserrat', sans-serif;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      box-shadow: 0 4px 12px rgba(0, 114, 188, 0.35);
    }

    .widget-footer-note {
      font-size: 9.5px;
      color: #64748b;
      text-align: center;
      line-height: 1.25;
      padding: 0 6px;
    }

    /* Floating Pill Button Outside (Bottom Right Indicator) */
    .floating-trigger-pill {
      position: absolute;
      bottom: 16px;
      right: 20px;
      background: linear-gradient(135deg, #0A2540 0%, #0072BC 100%);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 20px rgba(10, 37, 64, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      z-index: 95;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #facc15;
      border-radius: 50%;
      box-shadow: 0 0 8px #facc15;
    }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="mock-sidebar">
    <div class="mock-sidebar-header">
      <div style="width: 26px; height: 26px; background: #0072BC; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px;">A</div>
      <div class="mock-logo">ALMAR ROSARIO</div>
    </div>
    <div style="padding: 14px 0;">
      <div class="mock-nav-item"><span>📊</span> <span>Dashboard</span></div>
      <div class="mock-nav-item"><span>💼</span> <span>Cotizaciones</span></div>
      <div class="mock-nav-item active"><span>📁</span> <span>Carpetas HBL</span></div>
      <div class="mock-nav-item"><span>🧾</span> <span>Comprobantes</span></div>
      <div class="mock-nav-item"><span>🏦</span> <span>Banco Macro</span></div>
      <div class="mock-nav-item"><span>🛡️</span> <span>Auditoría Forense</span></div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="mock-main">
    <header class="mock-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 800; color: #0A2540;">CARPETAS OPERATIVAS &bull; EXPEDIENTE C1234</span>
        <span style="background: #fef08a; color: #854d0e; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 10px; border: 1px solid #fde047;">ALERTA MARGEN &lt; USD 200</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 11px; color: #64748b;">Usuario: <strong>Stefania Rossi</strong></span>
        <span class="user-badge">FINANZAS &bull; NIVEL 3</span>
      </div>
    </header>

    <div class="mock-content">
      <div class="bg-grid">
        <div class="bg-stat-card">
          <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Estado de Carpeta</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px;">OPERATIVA CONFIRMADA</div>
          <div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">Cotización #COT-1080 vinculada</div>
        </div>
        <div class="bg-stat-card">
          <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Venta Cotizada</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px;">USD 3.250,00</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Cliente: Siderúrgica San Martín</div>
        </div>
        <div class="bg-stat-card">
          <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Costos Cargados</div>
          <div style="font-size: 15px; font-weight: 800; color: #dc2626; margin-top: 3px;">USD 3.107,50</div>
          <div style="font-size: 10px; color: #dc2626; font-weight: 600; margin-top: 2px;">+ USD 45 Cargo Naviero Extra</div>
        </div>
        <div class="bg-stat-card">
          <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Margen Resultante</div>
          <div style="font-size: 15px; font-weight: 800; color: #d97706; margin-top: 3px;">USD 142,50 (4.38%)</div>
          <div style="font-size: 10px; color: #d97706; font-weight: 700; margin-top: 2px;">Requiere Override Gerencial</div>
        </div>
      </div>

      <div class="bg-table-card">
        <div style="font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800; color: #0A2540; margin-bottom: 10px; display: flex; justify-content: space-between;">
          <span>COMPROBANTES ASOCIADOS AL EXPEDIENTE C1234</span>
          <span style="font-size: 10.5px; color: #0072BC; font-weight: 700;">4 Comprobantes Procesados</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 6px;">Tipo</th>
              <th style="padding: 6px;">Emisor</th>
              <th style="padding: 6px;">N° Comprobante</th>
              <th style="padding: 6px;">Concepto</th>
              <th style="padding: 6px;">Moneda & Monto</th>
              <th style="padding: 6px;">Estado Auditoría</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px;"><span style="background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 4px; font-weight: 700; font-size: 9px;">BL MARÍTIMO</span></td>
              <td style="padding: 6px; font-weight: 600;">Maersk Line</td>
              <td style="padding: 6px; font-family: monospace;">MSK-928172</td>
              <td style="padding: 6px;">Flete Internacional FCL 40' HC</td>
              <td style="padding: 6px; font-weight: 700;">USD 2.850,00</td>
              <td style="padding: 6px;"><span style="color: #059669; font-weight: 700;">✓ Conciliado 100%</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; background: #fffbeb;">
              <td style="padding: 6px;"><span style="background: #fef08a; color: #854d0e; padding: 1px 5px; border-radius: 4px; font-weight: 700; font-size: 9px;">EXTRA LOCAL</span></td>
              <td style="padding: 6px; font-weight: 600;">Maersk Argentina</td>
              <td style="padding: 6px; font-family: monospace;">FC-A 0005-001928</td>
              <td style="padding: 6px; color: #92400e; font-weight: 700;">Cleaning Fee Portuario (No Cotizado)</td>
              <td style="padding: 6px; font-weight: 800; color: #b45309;">USD 45,00</td>
              <td style="padding: 6px;"><span style="color: #d97706; font-weight: 800;">⚠️ ALERTA DESVÍO DE COSTO</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px;"><span style="background: #ede9fe; color: #5b21b6; padding: 1px 5px; border-radius: 4px; font-weight: 700; font-size: 9px;">SEGURO</span></td>
              <td style="padding: 6px; font-weight: 600;">Sancor Seguros</td>
              <td style="padding: 6px; font-family: monospace;">PROV-SANCOR-150D</td>
              <td style="padding: 6px;">Provisión Automática Seguro 0,55% FOB</td>
              <td style="padding: 6px; font-weight: 700;">USD 212,50</td>
              <td style="padding: 6px;"><span style="color: #0284c7; font-weight: 700;">🔒 Provisión Retenida 150d</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Soft Dim Backdrop -->
    <div class="modal-backdrop"></div>

    <!-- Floating Pill trigger button (reference) -->
    <div class="floating-trigger-pill">
      <div class="pulse-dot"></div>
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.02em;">Reportar Ajuste &bull; Triage en Vivo ALMAR</div>
    </div>

    <!-- THE EXPANDED TRIAGE WIDGET MODAL (CENTERED & PROTAGONIST) -->
    <div class="widget-container">
      <!-- Header -->
      <div class="widget-header">
        <div class="widget-header-title">
          <div class="widget-spark-badge">✨</div>
          <div class="widget-header-text">
            <h3>ALMAR Copilot &amp; Triage</h3>
            <p>Alineación continua para etapa piloto &bull; Captura de Casos Borde</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="font-size: 13px; opacity: 0.7; cursor: pointer;">&minus;</span>
          <span style="font-size: 13px; opacity: 0.7; cursor: pointer;">&times;</span>
        </div>
      </div>

      <!-- Context Bar -->
      <div class="widget-context-bar">
        <div style="display: flex; align-items: center; gap: 6px;">
          <strong>Pantalla:</strong>
          <span class="context-tag">/carpetas/C1234</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 9.5px; font-weight: 600;">Stefania Rossi</span>
          <span class="user-badge">FINANZAS</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="widget-tabs">
        <div class="widget-tab active">
          <span>⚠️</span> Reportar Caso / Ajuste (#TKT)
        </div>
        <div class="widget-tab inactive">
          <span>✨</span> Copilot IA Operativo
        </div>
      </div>

      <!-- Body / Form -->
      <div class="widget-body">
        <!-- Ticket Generated Banner -->
        <div class="ticket-success-box">
          <div>
            <div class="ticket-success-title">
              <span>✓</span> ¡Caso registrado con éxito en Auditoría!
            </div>
            <div style="font-size: 10px; color: #15803d;">
              Identificador inmutable asignado para soporte:
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
              <span class="ticket-code-pill">#TKT-8421</span>
              <button class="ticket-copy-btn"><span>📋</span> Copiado al portapapeles</button>
            </div>
          </div>
          <span style="font-size: 9px; font-weight: 700; color: #166534; background: #bbf7d0; padding: 2px 6px; border-radius: 4px;">AUDIT_LOG OK</span>
        </div>

        <!-- 1. Tipo de Incidencia -->
        <div>
          <div class="field-label">
            <span>Tipo de Incidencia / Ajuste:</span>
            <span style="color: #d97706; font-weight: 700;">CASO BORDE DETECTADO</span>
          </div>
          <div class="type-grid">
            <div class="type-card selected">
              <span style="font-size: 13px;">⚠️</span>
              <div>
                <div class="type-card-title">Caso Borde</div>
                <div class="type-card-sub">Regla o sobrecosto no previsto</div>
              </div>
            </div>
            <div class="type-card">
              <span style="font-size: 13px;">✏️</span>
              <div>
                <div class="type-card-title">Corregir Dato</div>
                <div class="type-card-sub">Importe / Tarifa / CUIT</div>
              </div>
            </div>
            <div class="type-card">
              <span style="font-size: 13px;">❓</span>
              <div>
                <div class="type-card-title">Duda Operativa</div>
                <div class="type-card-sub">¿Cómo se procede con la regla?</div>
              </div>
            </div>
            <div class="type-card">
              <span style="font-size: 13px;">💡</span>
              <div>
                <div class="type-card-title">Sugerencia</div>
                <div class="type-card-sub">Mejora funcional de pantalla</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Nivel de Severidad -->
        <div>
          <div class="field-label">
            <span>Nivel de Severidad / Urgencia:</span>
            <span style="color: #dc2626; font-weight: 700;">BLOQUEANTE EN CARPETA</span>
          </div>
          <div class="severity-row">
            <div class="severity-pill">🟢 Baja</div>
            <div class="severity-pill">🟡 Media</div>
            <div class="severity-pill">🟠 Alta</div>
            <div class="severity-pill selected">🔴 Bloqueante</div>
          </div>
        </div>

        <!-- 3. Carpeta Afectada -->
        <div>
          <div class="field-label">
            <span>Carpeta Operativa Asociada:</span>
            <span style="color: #0284c7; font-weight: 600;">AUTO-DETECTADA</span>
          </div>
          <input type="text" class="input-mock" value="C1234 — Siderúrgica San Martín (Embarque Marítimo)" readonly style="background: #f8fafc; font-weight: 600; font-family: monospace;" />
        </div>

        <!-- 4. Descripción del Error / Desvío -->
        <div>
          <div class="field-label">
            <span>Descripción del Comprobante / Incidencia:</span>
          </div>
          <textarea class="textarea-mock" readonly>Maersk facturó cargo 'Cleaning Fee' por USD 45 no presupuestado en cotización inicial. El sistema bloqueó la emisión por margen &lt; USD 200. Solicito derivar a Desvíos y calibrar extracción.</textarea>
        </div>

        <!-- Botón Enviar -->
        <button class="btn-submit">
          <span>📤</span> REPORTE ASENTADO EN AUDIT_LOG &bull; CASO DERIVADO
        </button>

        <p class="widget-footer-note">
          🔒 Estampado inmutable en base de datos. Se notifica de inmediato al equipo de ingeniería para calibración de reglas en menos de 24 horas.
        </p>
      </div>
    </div>
  </main>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: targetFile, type: 'png' });
  await browser.close();

  console.log('✓ Captura guardada con éxito en:', targetFile);
}

captureTriageScreenshot().catch(err => {
  console.error('Error al capturar screenshot:', err);
  process.exit(1);
});
