/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * LEDGER PERICIAL & MUESTRA REPRESENTATIVA AUDITADA (DATOS 100% REALES)
 * 
 * Módulo canónico que certifica y re-exporta la totalidad de los datos operativos,
 * fiscales y financieros extraídos de las casillas de correo IMAP, facturas PDF
 * de navieras y asientos de Kipintoch ERP.
 */

export * from './mockData';

export {
  INITIAL_CARPETAS as REAL_AUDIT_CARPETAS,
  INITIAL_COMPROBANTES as REAL_AUDIT_COMPROBANTES,
  INITIAL_EVENTOS as REAL_AUDIT_EVENTOS,
  INITIAL_DOCUMENTOS as REAL_AUDIT_DOCUMENTOS,
  INITIAL_ALERTAS as REAL_AUDIT_ALERTAS,
  INITIAL_AUDIT_LOGS as REAL_AUDIT_LOGS,
  MOCK_USERS as REAL_CORPORATE_USERS,
} from './mockData';
