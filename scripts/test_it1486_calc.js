const fs = require('fs');

// We simulate what classifyKanbanColumn does for f0000002
const comp = {
  id: 'f0000002-0000-0000-0000-000000000002',
  carpeta_id: 'it148600-0000-0000-0000-000000000003',
  subtotal_neto: 800000.0,
  monto_total: 968000.0,
  moneda: 'ARS',
  estado_pago: 'PROGRAMADO'
};

const carpeta = {
  id: 'it148600-0000-0000-0000-000000000003',
  numero_carpeta: 'IT1486',
  costo_estimado_total: 800000.0,
  moneda: 'ARS'
};

console.log('comp.subtotal_neto:', comp.subtotal_neto);
console.log('carpeta.costo_estimado_total:', carpeta.costo_estimado_total);

// In KanbanCard.tsx:
const estimatedCost = carpeta.costo_estimado_total;
const sameCurrency = true;
const hasVariance = (comp.monto_total > estimatedCost && estimatedCost > 0 && sameCurrency);
console.log('KanbanCard hasVariance:', hasVariance, 'because comp.monto_total (', comp.monto_total, ') > estimatedCost (', estimatedCost, ')');
const varianceAmount = comp.monto_total - estimatedCost;
console.log('varianceAmount:', varianceAmount);
console.log('variancePct:', (varianceAmount / estimatedCost) * 100);
