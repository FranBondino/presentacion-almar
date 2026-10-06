# Catálogo Arquitectónico de Scripts - ALMAR Rosario

Este directorio contiene las herramientas de extracción de datos, motores de auditoría estadística, generadores de informes ejecutivos y utilidades de verificación del ecosistema ALMAR Rosario.

---

## 1. Mapa de Módulos y Dominios

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              ECOSISTEMA DE SCRIPTS ALMAR                              │
├─────────────────────────┬──────────────────────────────┬──────────────────────────────┤
│ 📥 EXTRACCIÓN & PIPELINES│ 🔍 AUDITORÍA & CONCILIACIÓN  │ 📊 REPORTES & VISUALES       │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ • extract_quotes_       │ • build_163_carpetas_audit   │ • generate_executive_reports │
│   pipeline.js           │ • verify_163_carpetas_audit  │ • compile_report_pdf.js      │
│ • build_statistical_    │ • verify_noise_purge.js      │ • capture_roles_and_         │
│   engine.js             │ • verify_reconciliation_     │   responsive.js              │
│ • search_maersk_emails  │   integrity.js               │ • audit_captured_            │
│ • check_expo_mailbox    │ • audit_comprobantes_pdfs.js │   screenshots.js             │
└─────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Descripción por Categoría

### 2.1. Pipelines de Ingesta & Extracción de Datos
* **`extract_quotes_pipeline.js`**: Extractor principal de cotizaciones comerciales desde los buzones de Gmail de Almar (Lucía Laje, Nerea, etc.). Utiliza autenticación JWT RS256 con Google Service Account sin almacenamiento de claves en disco.
* **`build_statistical_engine.js`**: Motor estadístico que procesa el dataset consolidado, aplica deduplicación RFC 2822 y ejecuta el filtrado determinístico en 4 capas para descartar ruido operativo.
* **`check_emails_last_5_days.js` / `search_expo_mails.js`**: Scripts de consulta rápida para inspeccionar cadenas recientes en casillas clave de importación y exportación.
* **`search_maersk_emails.js` / `search_msc_developer_emails.js`**: Herramientas especializadas para identificar acuerdos tarifarios y números de contrato de armadores marítimos (Maersk, MSC).

### 2.2. Motores de Conciliación & Auditoría ISO 9001
* **`build_163_carpetas_audit.js`**: Motor de asignación determinística que resolvió las 163 carpetas sin asignar en Kipintoch cruzando referencias operativas con los correos de las operadoras (Aldana Gómez, Ana Laura Talaban, Natali Hermoso, Victoria Moyano, Alexis Bucardo y Abril Stämpfli).
* **`verify_163_carpetas_audit.js`**: Script de verificación que audita el 100% de las 163 carpetas resueltas y genera el ledger de comprobación.
* **`verify_noise_purge.js`**: Verificador matemático que valida que las 30.697 comunicaciones descartadas correspondan exclusivamente a notificaciones de cron, tracking físico y boletines, con 0 falsos positivos sobre cotizaciones.
* **`verify_reconciliation_integrity.js`**: Comprobación integral de integridad referencial entre la base de Kipintoch y los buzones de correo.
* **`audit_comprobantes_pdfs.js`**: Inspección y validación estructural de facturas de proveedores marítimos y aéreos.

### 2.3. Generadores de Reportes Ejecutivos & Auditoría Visual
* **`generate_executive_reports.js`**: Genera los informes HTML y Markdown para la Dirección (`INFORME_COTIZACIONES_ALMAR_2026`, `INFORME_MASTER_TECNICO_ALMAR`, etc.).
* **`compile_report_pdf.js`**: Compila los reportes HTML a PDF vectorial utilizando Puppeteer en modo desatendido.
* **`capture_roles_and_responsive.js`**: Toma automatizada de capturas de pantalla Full HD y Responsive (Desktop 1080p, Laptop 1366x768, Mobile 390x844) para auditar los roles RBAC y componentes del portal.
* **`audit_captured_screenshots.js`**: Comprobación automatizada de dimensiones y calidad de las capturas del sistema.

### 2.4. Utilidades de Diagnóstico & Endpoints Kipintoch
* **`inspect_api_details.js` / `inspect_booking_api.js`**: Mapeo y documentación de esquemas JSON retornados por la API de KipinCARGO (`/forwarding/carpetas`, `/empresas`, `/rentabilidad`).
* **`find_api_defs.js`**: Catálogo de firmas de endpoints de transporte internacional.

---

## 3. Guía de Ejecución

Para ejecutar cualquier pipeline o script de auditoría:

```powershell
# Extracción y consolidación de cotizaciones
node scripts/extract_quotes_pipeline.js

# Verificación de integridad de 163 carpetas
node scripts/verify_163_carpetas_audit.js

# Verificación de descarte de ruido estadístico
node scripts/verify_noise_purge.js
```
