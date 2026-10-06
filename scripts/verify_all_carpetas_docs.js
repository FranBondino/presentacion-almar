const fs = require('fs');
const mockContent = fs.readFileSync('portal/lib/mockData.ts', 'utf8');

const carpetas = [
  { code: 'C1234', uuid: 'c1234000-0000-0000-0000-000000000001' },
  { code: 'C1434', uuid: 'c1434000-0000-0000-0000-000000000002' },
  { code: 'IT1486', uuid: 'it148600-0000-0000-0000-000000000003' },
  { code: 'C1482', uuid: 'c1482000-0000-0000-0000-000000000004' },
  { code: 'C1024', uuid: 'c1024000-0000-0000-0000-000000000005' },
  { code: 'TL1436', uuid: 'tl143600-0000-0000-0000-000000000006' },
  { code: 'C1289', uuid: 'c1289000-0000-0000-0000-000000000007' },
  { code: 'EA1561', uuid: 'ea156100-0000-0000-0000-000000000008' },
  { code: 'C1471', uuid: 'c1471000-0000-0000-0000-000000000009' },
  { code: 'C1056', uuid: 'c1056000-0000-0000-0000-000000000010' },
  { code: 'C367', uuid: 'c0367000-0000-0000-0000-000000000011' },
  { code: 'C620', uuid: 'c0620000-0000-0000-0000-000000000012' },
];

console.log('CARPETA | CLIENTE | COMPROBANTE | MONTO | CONCEPTO | PDF | DISCO');
console.log('-------------------------------------------------------------------------------------');

carpetas.forEach(c => {
  const carpRegex = new RegExp(`numero_carpeta:\\s*['"]${c.code}['"][\\s\\S]*?cliente_nombre:\\s*['"]([^'"]+)['"]`);
  const carpMatch = mockContent.match(carpRegex);
  const cliente = carpMatch ? carpMatch[1] : 'N/A';

  const compSplit = mockContent.split("id: 'f");
  let found = 0;
  compSplit.forEach(chunk => {
    if (chunk.includes(c.uuid)) {
      found++;
      const num = (chunk.match(/numero_comprobante:\s*['"]([^'"]+)['"]/) || [])[1] || 'S/N';
      const emisor = (chunk.match(/emisor_razon_social:\s*['"]([^'"]+)['"]/) || [])[1] || 'S/E';
      const monto = (chunk.match(/monto_total:\s*([0-9.]+)/) || [])[1] || '0';
      const moneda = (chunk.match(/moneda:\s*['"]([^'"]+)['"]/) || [])[1] || 'USD';
      const concepto = (chunk.match(/concepto_gasto:\s*['"]([^'"]+)['"]/) || [])[1] || 'S/C';
      const url = (chunk.match(/archivo_pdf_url:\s*['"]([^'"]+)['"]/) || [])[1] || '';
      const exists = fs.existsSync('public' + url) || fs.existsSync('portal/public' + url);

      console.log(`${c.code.padEnd(7)} | ${cliente.substring(0, 20).padEnd(20)} | ${num.padEnd(14)} | ${(moneda + ' ' + monto).padEnd(12)} | ${concepto.substring(0, 25).padEnd(25)} | ${url} | ${exists ? 'OK' : 'FALTA'}`);
    }
  });
  if (found === 0) {
    console.log(`${c.code.padEnd(7)} | ${cliente.substring(0, 20).padEnd(20)} | (Sin comprobante de compra directo asignado)`);
  }
});
