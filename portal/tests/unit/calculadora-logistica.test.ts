import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import {
  calcularMetricasBultos,
  ejecutarCalculoLogistico,
  formatearCotizacionParaKipintoch,
  calcularResumenCubicajeDesdeTexto,
  evaluarAptitudCopaAirlines,
  extraerTextoYMedidasDesdeDocumento,
} from '@/lib/calculadora-logistica';
import { parsearBufferDocumentoLogistico } from '@/lib/documento-parser-server';
import { BultoItem, CalculoLogisticoInput, CotizacionRecord } from '@/types/cotizaciones';

/**
 * Helper para construir un archivo ZIP/XLSX binario real en memoria (con compresión Deflate 8)
 */
function buildRealXlsxBuffer(sharedStrings: string[], rows: Array<Array<{ type: 's' | 'n'; val: string | number }>>): Buffer {
  const ssItems = sharedStrings.map((s) => `<si><t>${s}</t></si>`).join('');
  const ssXml = `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${ssItems}</sst>`;

  const rowXmls = rows
    .map((cells, rIdx) => {
      const cXml = cells
        .map((c, cIdx) => {
          const colLetter = String.fromCharCode(65 + cIdx);
          return c.type === 's'
            ? `<c r="${colLetter}${rIdx + 1}" t="s"><v>${c.val}</v></c>`
            : `<c r="${colLetter}${rIdx + 1}"><v>${c.val}</v></c>`;
        })
        .join('');
      return `<row r="${rIdx + 1}">${cXml}</row>`;
    })
    .join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXmls}</sheetData></worksheet>`;

  const files = [
    { name: 'xl/sharedStrings.xml', data: Buffer.from(ssXml, 'utf8') },
    { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(sheetXml, 'utf8') },
  ];

  const localChunks: Buffer[] = [];
  for (const f of files) {
    const compressed = zlib.deflateRawSync(f.data);
    const nameBuf = Buffer.from(f.name, 'utf8');
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(8, 8); // Deflate
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(f.data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    localChunks.push(header, nameBuf, compressed);
  }
  return Buffer.concat(localChunks);
}

describe('Calculadora Logística Canónica & Asistente Comercial ALMAR', () => {
  it('1. Calcula correctamente el volumen y peso de bultos estándar', () => {
    // 3 pallets de 120 x 80 x 140 cm con 400 kg cada uno
    const bultos: BultoItem[] = [
      {
        id: '1',
        cantidad: 3,
        tipo: 'pallet',
        largoCm: 120,
        anchoCm: 80,
        altoCm: 140,
        pesoUnitarioKg: 400,
      },
    ];

    const metricas = calcularMetricasBultos(bultos);
    expect(metricas.cantidadBultosTotal).toBe(3);
    expect(metricas.pesoBrutoTotalKg).toBe(1200);
    // 1.20 * 0.80 * 1.40 = 1.344 m3 * 3 = 4.032 m3
    expect(metricas.volumenTotalM3).toBeCloseTo(4.032, 2);
  });

  it('2. Aplica correctamente la regla de peso tasable aéreo IATA (1:6)', () => {
    // Caso donde rige el volumen: 1 m3 de solo 50 kg
    const bultosLigeros: BultoItem[] = [
      {
        id: 'b1',
        cantidad: 1,
        tipo: 'caja',
        largoCm: 100,
        anchoCm: 100,
        altoCm: 100,
        pesoUnitarioKg: 50,
      },
    ];

    const input: CalculoLogisticoInput = {
      clienteNombre: 'Disden S.A.',
      origen: 'Madrid (MAD)',
      destino: 'Buenos Aires (EZE)',
      incoterm: 'FCA',
      bultos: bultosLigeros,
      valorMercaderiaFobUsd: 5000,
    };

    const res = ejecutarCalculoLogistico(input);
    // 1 m3 * 167 = 167 kg volumétrico > 50 kg peso real
    expect(res.pesoVolumetricoAereoKg).toBe(167);
    expect(res.pesoTasableAereoKg).toBe(167);
    expect(res.aplicaVolumenAereo).toBe(true);
    // 167 kg * 2.10 USD/kg = 350.70 USD
    expect(res.costoFleteAereoSugeridoUsd).toBeCloseTo(350.7, 1);
  });

  it('3. Aplica correctamente la regla W/M Marítimo LCL (1 ton = 1 m3)', () => {
    // Caso donde rige el peso: 2 pallets chicos de 0.5 m3 en total pero 2000 kg (2 toneladas)
    const bultosPesados: BultoItem[] = [
      {
        id: 'p1',
        cantidad: 2,
        tipo: 'pallet',
        largoCm: 80,
        anchoCm: 60,
        altoCm: 50,
        pesoUnitarioKg: 1000,
      },
    ];

    const input: CalculoLogisticoInput = {
      clienteNombre: 'Industrias Juan F. Secco S.A.',
      origen: 'Valencia',
      destino: 'Puerto Buenos Aires',
      incoterm: 'FOB',
      bultos: bultosPesados,
      valorMercaderiaFobUsd: 20000,
    };

    const res = ejecutarCalculoLogistico(input);
    expect(res.pesoToneladasMaritimo).toBe(2);
    expect(res.volumenTasableLclM3).toBe(2); // rige las 2 toneladas frente a los 0.48 m3
    expect(res.aplicaVolumenMaritimo).toBe(false);

    // Desconsolidación: 2 * 35 = 70 USD
    expect(res.desconsolidacionDestinoUsd).toBe(70);
    // Documentación local ALMAR: 75 USD
    expect(res.documentacionDestinoUsd).toBe(75);
    // Seguro 0.55% de 20,000 USD = 110 USD
    expect(res.seguroTransporteUsd).toBe(110);
  });

  it('4. Genera borrador canónico para Lucía Laje con formato exacto', () => {
    const input: CalculoLogisticoInput = {
      clienteNombre: 'Gerdau Argentina S.A.',
      origen: 'Shanghai',
      destino: 'Buenos Aires',
      incoterm: 'FOB',
      bultos: [
        {
          id: '1',
          cantidad: 2,
          tipo: 'pallet',
          largoCm: 100,
          anchoCm: 100,
          altoCm: 100,
          pesoUnitarioKg: 300,
        },
      ],
      diasLibresDemoras: 14,
    };

    const res = ejecutarCalculoLogistico(input);
    expect(res.borradorCorreoCliente).toContain('Hola Gerdau!');
    expect(res.borradorCorreoCliente).toContain('OPCIÓN AÉREA');
    expect(res.borradorCorreoCliente).toContain('OPCIÓN MARÍTIMO LCL');
    expect(res.borradorCorreoCliente).toContain('14 días');
    expect(res.borradorCorreoCliente).toContain('Lucía Laje');

    // Follow up
    expect(res.borradorFollowUp).toContain('Hola Gerdau, ¿cómo estás?');
    expect(res.borradorFollowUp).toContain('Shanghai');
  });

  it('5. Genera payload de Kipintoch con costo de API = $0 para Ctrl+V', () => {
    const cot: CotizacionRecord = {
      id: 'cot-1',
      numeroCotizacion: 'C1590',
      clienteNombre: 'Industrias Juan F. Secco S.A.',
      clienteCuit: '30-61245890-4',
      segmento: 'ESTRATEGICO_CORPORATIVO',
      fechaEmision: '2026-09-02T10:00:00Z',
      horasDesdeEmision: 5,
      contactoEmail: 'magimenez@secco.com.ar',
      responsableComercial: 'Lucía Laje',
      via: 'MARITIMO_FCL',
      origen: 'Santos, Brasil',
      destino: 'Zárate, Argentina',
      incoterm: 'FOB',
      fleteVentaUsd: 2350,
      fleteCostoEstimadoUsd: 1950,
      margenBrutoUsd: 400,
      margenPorcentaje: 17.0,
      navieraOAerolineaSugerida: 'Maersk',
      tiempoTransitoEstimadoDias: 8,
      diasLibresDemora: 14,
      estado: 'GANADA',
      followUpEnviado: false,
    };

    const payload = formatearCotizacionParaKipintoch(cot);
    expect(payload).toContain('[ALMAR KIPINTOCH ERP - PASE COMERCIAL]');
    expect(payload).toContain('REF_COTIZACION: C1590');
    expect(payload).toContain('FLETE_VENTA_USD: 2350.00');
    expect(payload).toContain('FLETE_COSTO_ESTIMADO_USD: 1950.00');
    expect(payload).toContain('MARGEN_BRUTO_USD: 400.00 (17.0%)');
    expect(payload).toContain('FREE_TIME_DIAS: 14');
  });

  it('6. Valida correctamente Carga APTA Copa Airlines directo a Rosario (<= 122x102x82 cm y <= 80 kg/bulto)', () => {
    const res = calcularResumenCubicajeDesdeTexto(
      '4 cajas de 80x60x55 cm (180 kg) + 2 cajas de 100x75x65 cm (130 kg)'
    );
    expect(res.cantidadBultosTotal).toBe(6);
    expect(res.pesoBrutoTotalKg).toBe(310);
    expect(res.aptitudCopa).toBeDefined();
    expect(res.aptitudCopa?.estado).toBe('APTA');
    expect(res.aptitudCopa?.esApta).toBe(true);
    expect(res.aptitudCopa?.bultosEvaluados.every((b) => b.estado === 'APTA')).toBe(true);
  });

  it('7. Detecta Carga NO APTA Copa Airlines cuando el pallet supera la puerta B737 (82 cm) o 100 kg/bulto y sugiere despalletizar', () => {
    const res = calcularResumenCubicajeDesdeTexto('2 pallets de 1.20x1.00x1.45m (420 kg)');
    expect(res.aptitudCopa).toBeDefined();
    expect(res.aptitudCopa?.estado).toBe('NO_APTA');
    expect(res.aptitudCopa?.esApta).toBe(false);
    expect(res.aptitudCopa?.recomendacionComercial).toContain('desarmar el pallet');
    expect(res.aptitudCopa?.motivosPrincipales.some((m) => m.includes('145 cm'))).toBe(true);
  });

  it('8. Detecta Carga SUJETA A AUTORIZACIÓN Copa Airlines (80.1 a 100 kg/bulto con medidas aptas)', () => {
    const res = evaluarAptitudCopaAirlines([
      {
        cantidad: 1,
        tipo: 'cajon',
        largoCm: 115,
        anchoCm: 90,
        altoCm: 78,
        pesoUnitarioKg: 88,
      },
    ]);
    expect(res.estado).toBe('SUJETA_AUTORIZACION');
    expect(res.requiereAutorizacion).toBe(true);
    expect(res.motivosPrincipales[0] || '').toContain('88 kg/bulto');
  });

  it('9. Convierte medidas en pulgadas (48x40x32 in) y libras (lbs) de agentes en Miami al límite exacto de Copa', () => {
    const res = calcularResumenCubicajeDesdeTexto('2 crates 48x40x32 in 150 kg');
    expect(res.items.length).toBe(1);
    // 48 in = 122 cm, 40 in = 102 cm, 32 in = 81 cm, 75 kg c/u -> APTA COPA
    expect(res.items[0]?.largoCm).toBe(122);
    expect(res.items[0]?.anchoCm).toBe(102);
    expect(res.items[0]?.altoCm).toBe(81);
    expect(res.aptitudCopa?.estado).toBe('APTA');
  });

  it('10. Extrae bultos, CBM y aptitud Copa desde documentos CSV y PDF cargados', () => {
    const csvDoc = extraerTextoYMedidasDesdeDocumento({
      fileName: 'Packing_List_Teltonika_Copa_ROS.csv',
      rawContent: 'CANTIDAD;TIPO;LARGO_CM;ANCHO_CM;ALTO_CM;PESO_TOTAL_KG\n4;caja;80;60;55;180\n2;caja;100;75;65;130',
      fileSize: 512,
      mimeType: 'text/csv',
    });
    expect(csvDoc.resumen.cantidadBultosTotal).toBe(6);
    expect(csvDoc.resumen.aptitudCopa?.estado).toBe('APTA');
    expect(csvDoc.documento.bultosExtraidos).toBe(6);

    const pdfDoc = extraerTextoYMedidasDesdeDocumento({
      fileName: 'Packing_List_Sipar_Pallet_MIA_ROS.pdf',
      rawContent: '%PDF-1.4\n(2 pallets de 120x100x145 cm 420 kg)',
      fileSize: 2048,
      mimeType: 'application/pdf',
    });
    expect(pdfDoc.resumen.cantidadBultosTotal).toBe(2);
    expect(pdfDoc.resumen.aptitudCopa?.estado).toBe('NO_APTA');
  });

  it('11. Descomprime y extrae medidas desde un libro Excel (.xlsx) binario ZIP real y PDF comprimido FlateDecode', () => {
    // 1. Excel .xlsx binario con 5 cajas de 90x70x60 cm (250 kg total) + 2 pallets de 120x100x75 cm (140 kg total) -> 7 bultos APTA Copa
    const xlsxBuf = buildRealXlsxBuffer(
      ['CANTIDAD', 'TIPO', 'LARGO_CM', 'ANCHO_CM', 'ALTO_CM', 'PESO_KG', 'caja', 'pallet'],
      [
        [
          { type: 's', val: 0 },
          { type: 's', val: 1 },
          { type: 's', val: 2 },
          { type: 's', val: 3 },
          { type: 's', val: 4 },
          { type: 's', val: 5 },
        ],
        [
          { type: 'n', val: 5 },
          { type: 's', val: 6 },
          { type: 'n', val: 90 },
          { type: 'n', val: 70 },
          { type: 'n', val: 60 },
          { type: 'n', val: 250 },
        ],
        [
          { type: 'n', val: 2 },
          { type: 's', val: 7 },
          { type: 'n', val: 120 },
          { type: 'n', val: 100 },
          { type: 'n', val: 75 },
          { type: 'n', val: 140 },
        ],
      ]
    );

    const parsedXlsx = parsearBufferDocumentoLogistico({
      fileName: 'Planilla_Packing_Excel_Real.xlsx',
      buffer: xlsxBuf,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(parsedXlsx.resumen.cantidadBultosTotal).toBe(7);
    expect(parsedXlsx.resumen.pesoBrutoTotalKg).toBe(390);
    // 5 * 0.9 * 0.7 * 0.6 = 1.89 m3 + 2 * 1.2 * 1.0 * 0.75 = 1.80 m3 -> 3.69 m3
    expect(parsedXlsx.resumen.volumenTotalM3).toBeCloseTo(3.69, 2);
    expect(parsedXlsx.resumen.aptitudCopa?.estado).toBe('APTA');

    // 2. PDF con stream FlateDecode comprimido con zlib
    const pdfStreamContent = 'BT /F1 12 Tf (3 pallets de 120x100x135 cm 540 kg) Tj ET';
    const deflated = zlib.deflateSync(Buffer.from(pdfStreamContent, 'latin1'));
    const pdfBuf = Buffer.concat([
      Buffer.from('%PDF-1.4\n1 0 obj << /Filter /FlateDecode >>\nstream\n', 'latin1'),
      deflated,
      Buffer.from('\nendstream\nendobj\n%%EOF', 'latin1'),
    ]);

    const parsedPdf = parsearBufferDocumentoLogistico({
      fileName: 'Documento_Comprimido_FlateDecode.pdf',
      buffer: pdfBuf,
      mimeType: 'application/pdf',
    });
    expect(parsedPdf.resumen.cantidadBultosTotal).toBe(3);
    expect(parsedPdf.resumen.pesoBrutoTotalKg).toBe(540);
    expect(parsedPdf.resumen.aptitudCopa?.estado).toBe('NO_APTA');
  });
});
