const fs = require('fs');
const path = require('path');
const docx = require('docx');
const {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  Packer,
  ImageRun,
  convertInchesToTwip
} = docx;

// 1. Load Images
let logoBuffer = null;
try {
  if (fs.existsSync('clave_logo.png')) {
    logoBuffer = fs.readFileSync('clave_logo.png');
  }
} catch (e) {}

let diagramBuffer = null;
try {
  if (fs.existsSync('diagrama_actores_facturacion.png')) {
    diagramBuffer = fs.readFileSync('diagrama_actores_facturacion.png');
    console.log('Diagram loaded, size:', diagramBuffer.length);
  }
} catch (e) {
  console.log('Diagram load error:', e.message);
}

// Clave Consultora Colors
const COLORS = {
  GREEN_PRIMARY: '1E3D2F',   // #1e3d2f - Clave Forest Green
  GREEN_LIGHT: '2C5442',     // #2c5442
  GREEN_BG: 'F0FDF4',        // light emerald tint
  GOLD: 'C29320',            // #c29320 - Accent Gold
  GOLD_LIGHT: 'FEFCF5',       // #fefcf5 - Pill & box fill
  GOLD_BORDER: 'EEDAA2',     // #eedaa2
  NAVY: '081433',            // #081433
  MUTED: '64748B',           // #64748b - Slate grey
  BORDER: 'E2E8F0',          // #e2e8f0 - Table border
  BG_LIGHT: 'F8FAFC',        // #f8fafc - Table alt row
  TEXT: '1E293B',            // #1e293b - Main body
  WHITE: 'FFFFFF'
};

const FONT_TITLE = 'Arial';
const FONT_BODY = 'Calibri';

function pTitle(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 30, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE })
    ]
  });
}

function pHeading2(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE })
    ]
  });
}

function pBody(text, options = {}) {
  return new Paragraph({
    spacing: { before: 40, after: 60 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        size: options.size || 21,
        color: options.color || COLORS.TEXT,
        font: FONT_BODY,
        bold: options.bold || false,
        italics: options.italics || false
      })
    ]
  });
}

function createCalloutBox(title, bodyLines, type = 'gold') {
  const borderColor = type === 'green' ? COLORS.GREEN_PRIMARY : COLORS.GOLD;
  const bgColor = type === 'green' ? COLORS.GREEN_BG : COLORS.GOLD_LIGHT;

  const children = [
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({ text: title.toUpperCase(), bold: true, size: 19, color: borderColor, font: FONT_TITLE })
      ]
    })
  ];

  for (const line of bodyLines) {
    children.push(
      new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({ text: line, size: 20, color: COLORS.TEXT, font: FONT_BODY })
        ]
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: borderColor }
            },
            children
          })
        ]
      })
    ]
  });
}

// Question Block with Editable Answer Area
function createQuestionBlock(qNum, question, objective, probe, tag = 'ISO / SISTEMAS') {
  const children = [
    new Paragraph({
      spacing: { before: 40, after: 30 },
      children: [
        new TextRun({ text: `[ ${tag} ]  `, bold: true, size: 17, color: COLORS.GOLD, font: FONT_TITLE }),
        new TextRun({ text: `Pregunta ${qNum}: `, bold: true, size: 21, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE }),
        new TextRun({ text: question, bold: true, size: 21, color: COLORS.TEXT, font: FONT_BODY })
      ]
    }),
    new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: 'Objetivo de Relevamiento: ', bold: true, size: 18, color: COLORS.MUTED, font: FONT_BODY }),
        new TextRun({ text: objective, size: 18, color: COLORS.MUTED, font: FONT_BODY, italics: true })
      ]
    }),
    new Paragraph({
      spacing: { before: 20, after: 40 },
      children: [
        new TextRun({ text: 'Repregunta / Buscar Práctica Real: ', bold: true, size: 18, color: COLORS.GREEN_LIGHT, font: FONT_BODY }),
        new TextRun({ text: probe, size: 18, color: COLORS.TEXT, font: FONT_BODY })
      ]
    }),
    new Paragraph({
      spacing: { before: 30, after: 30 },
      children: [
        new TextRun({ text: 'Notas y Evidencia Relevada (Completar durante la reunión):', bold: true, size: 17, color: COLORS.MUTED, font: FONT_BODY })
      ]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                bottom: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                left: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                right: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' }
              },
              children: [
                new Paragraph({
                  spacing: { before: 80, after: 220 },
                  children: [new TextRun({ text: '  ', size: 18 })]
                })
              ]
            })
          ]
        })
      ]
    })
  ];

  return new Paragraph({
    spacing: { before: 120, after: 120 },
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
                  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
                  left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.GREEN_PRIMARY }
                },
                children
              })
            ]
          })
        ]
      })
    ]
  });
}

function createStyledTable(headers, rowsData, colWidths = []) {
  const tableRows = [];

  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => new TableCell({
        shading: { fill: COLORS.GREEN_PRIMARY, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.GREEN_PRIMARY },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.GOLD },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE }
        },
        width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: h, bold: true, size: 19, color: COLORS.WHITE, font: FONT_TITLE })
            ]
          })
        ]
      }))
    })
  );

  rowsData.forEach((row, rowIndex) => {
    const isAlt = rowIndex % 2 === 1;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, i) => new TableCell({
          shading: { fill: isAlt ? COLORS.BG_LIGHT : COLORS.WHITE, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: cellText, size: 18, color: COLORS.TEXT, font: FONT_BODY })
              ]
            })
          ]
        }))
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });
}

async function buildCompleteDocx() {
  console.log('Generating Complete Clave Consultora DOCX with ALL 32 Questions & Diagram...');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_BODY, size: 21, color: COLORS.TEXT }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75)
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: 'ALMAR ROSARIO S.R.L.  |  SGC ISO 9001:2015  |  ', size: 16, color: COLORS.MUTED, font: FONT_TITLE, bold: true }),
                  new TextRun({ text: 'PROCESO ADMINISTRACIÓN Y FACTURACIÓN', size: 16, color: COLORS.GOLD, font: FONT_TITLE, bold: true })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'CLAVE CONSULTORA & ALMAR ROSARIO  •  Página ', size: 16, color: COLORS.MUTED, font: FONT_BODY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: COLORS.GREEN_PRIMARY, bold: true }),
                  new TextRun({ text: ' de ', size: 16, color: COLORS.MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: COLORS.GREEN_PRIMARY, bold: true })
                ]
              })
            ]
          })
        },
        children: [
          // PORTADA / HEADER
          ...(logoBuffer ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 100 },
              children: [new ImageRun({ data: logoBuffer, transformation: { width: 180, height: 45 } })]
            })
          ] : []),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: 'CLAVE CONSULTORA  •  ALMAR ROSARIO S.R.L.', bold: true, size: 19, color: COLORS.GOLD, font: FONT_TITLE })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 80 },
            children: [
              new TextRun({ text: 'GUÍA INTEGRAL DE RELEVAMIENTO DE CAMPO Y VALIDACIÓN DE SOFTWARE', bold: true, size: 30, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 160 },
            children: [
              new TextRun({ text: 'PROCESO: ADMINISTRACIÓN, FACTURACIÓN Y CONTROL FINANCIERO DE OPERACIONES (ISO 9001)', size: 21, color: COLORS.MUTED, font: FONT_BODY, italics: true })
            ]
          }),

          // METADATA GRID TABLE
          createStyledTable(
            ['CAMPO', 'DETALLE RELEVAMIENTO', 'CAMPO', 'DETALLE RELEVAMIENTO'],
            [
              ['Empresa', 'ALMAR ROSARIO S.R.L.', 'Código Proceso', 'PA.04 / PO.03 (A homologar con Clave)'],
              ['Entrevistada Principal', 'Stefania Rossi (Adm., Facturación & Cobranzas)', 'Supervisión Área', 'Vanesa Meggiolaro (Socia / Finanzas)'],
              ['Equipo Implementador', 'Francisco Bondino + Consultores de Clave', 'Fecha de Reunión', '25 de Septiembre de 2026'],
              ['Objetivo de Sesión', 'Ficha ISO 9001 + Validación App Facturación Kipin', 'Estado Documento', 'Borrador Completo de Trabajo Editable']
            ],
            [22, 28, 22, 28]
          ),

          new Paragraph({ spacing: { before: 140, after: 60 } }),

          createCalloutBox(
            'Instrucciones Metodológicas de Trabajo en Sala (Regla Clave Consultora)',
            [
              '• Relevar la práctica real del día a día, no el procedimiento teórico ni el "deber ser" de manual.',
              '• Separar estados en las notas: [CONFIRMADO] con evidencia tangible, [A VALIDAR] pendiente de confirmación, y [BRECHA] cuando el control no existe.',
              '• Integrar las preguntas técnicas de la aplicación en la matriz de riesgos ISO (§ 6.1) para mantener total armonía con la consultora.'
            ],
            'gold'
          ),

          new Paragraph({ spacing: { before: 180, after: 80 } }),

          // SECCIÓN 1: FICHA METODOLÓGICA ISO 9001
          pTitle('1. Ficha Metodológica de Proceso (ISO 9001:2015)'),
          pBody('Esta sección establece las bases de gobernanza que completará el equipo consultor para dar cumplimiento a los requisitos normativos del Sistema de Gestión de Calidad de ALMAR.'),

          pHeading2('1.1 Objetivo, Límites y Alcance'),
          createStyledTable(
            ['Elemento ISO', 'Definición Propuesta', 'Validación / Notas de Stefania'],
            [
              ['Objetivo del Proceso', 'Asegurar la facturación oportuna y correcta de los servicios, el control preventivo de costos y sobreprecios de proveedores, la gestión de cobranzas y la preservación del margen económico.', '____________________________________________'],
              ['Disparador / Inicio', 'Aviso de embarque / confirmación de arribo de carga / instrucción formal de facturar transferida desde Operaciones.', '____________________________________________'],
              ['Límite Final', 'Cobranza efectiva registrada en banco, emisión de recibo y cierre económico de la carpeta en KipinCARGO.', '____________________________________________'],
              ['Actividades Incluidas', 'Recepción de instrucción; cotejo de comprobantes navieros vs presupuesto; emisión de prefactura; facturación fiscal AFIP; seguimiento de cobranzas; registro de pagos.', '____________________________________________'],
              ['Actividades Excluidas', 'Coordinación con despachantes de aduana (Operaciones); reclamos por daños o siniestros de carga; negociación tarifaria previa (Comercial).', '____________________________________________']
            ],
            [25, 45, 30]
          ),

          new Paragraph({ spacing: { before: 140, after: 60 } }),

          pHeading2('1.2 Esquema SIPOC (Entradas, Salidas y Receptores)'),
          createStyledTable(
            ['Proveedores', 'Entradas Críticas', 'Etapas del Proceso', 'Salidas Críticas', 'Receptores'],
            [
              ['Operaciones (Natali / Aldana / Cecilia)', 'Carpetas cerradas, HBL, Booking, avisos de arribo.', '1. Recepción y control previo\n2. Cotejo de costos vs cotizado\n3. Prefactura y validación BNA\n4. Emisión factura AFIP\n5. Carga comprobantes Kipin\n6. Cobranza y conciliación', 'Facturas A / B / E electrónicas.', 'Clientes ALMAR'],
              ['Navieras / Depósitos (Maersk, MSC, etc.)', 'Facturas de flete, peajes, THC, seguros en PDF.', 'Reportes de desvíos aprobados.', 'Vanesa Meggiolaro (Finanzas)'],
              ['Comercial (Lucía / Martín / Nerea)', 'Cotizaciones confirmadas, condiciones de pago.', 'Recibos oficiales de cobro.', 'Clientes / Bancos'],
              ['Bancos / AFIP', 'Extractos bancarios, tipos de cambio BNA, retenciones.', 'Carpetas saldadas económicamente.', 'Dirección / Contabilidad']
            ],
            [18, 22, 25, 18, 17]
          ),

          new Paragraph({ spacing: { before: 200, after: 80 } }),

          // SECCIÓN 2: ORGANIGRAMA Y DIAGRAMA DE ACTORES
          pTitle('2. Matriz de Actores, Gobernanza y Flujo de Información'),
          pBody('Estructura auditada del personal interviniente en los flujos administrativos, comerciales y operativos de ALMAR Rosario:'),

          // INSERT DIAGRAM IMAGE
          ...(diagramBuffer ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 60 },
              children: [
                new ImageRun({
                  data: diagramBuffer,
                  transformation: { width: 580, height: 148 }
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 20, after: 120 },
              children: [
                new TextRun({
                  text: 'Figura 1: Mapa Canónico de Actores y Flujo de Información de Facturación (ALMAR Rosario S.R.L.)',
                  size: 17,
                  color: COLORS.MUTED,
                  font: FONT_BODY,
                  italics: true
                })
              ]
            })
          ] : []),

          createStyledTable(
            ['Nombre y Apellido', 'Casilla Corporativa', 'Rol Formal en el Sistema', 'Interacción con Facturación'],
            [
              ['Stefania Rossi', 'srossi@almarrosario.com', 'Administración, Facturación & Cobranzas', 'Responsable del proceso integral, emisión AFIP y Kipin.'],
              ['Vanesa Meggiolaro', 'vmeggiolaro@almarrosario.com', 'Socia Directora / Finanzas & Rentabilidad', 'Supervisión de descalce USD/ARS, márgenes < $200 y desvíos.'],
              ['Dalia Silvi', 'dsilvi@almarrosario.com', 'Administración & Pagos Exterior', 'Pagos a navieras internacionales y transferencias al exterior.'],
              ['Natali Hermoso', 'nhermoso@almarrosario.com', 'Lead Operaciones Importación', 'Apertura de carpetas Canal 2 y transferencia para facturar.'],
              ['Aldana Gómez', 'agomez@almarrosario.com', 'Jefa Customer Service & Impo', 'Validación de gastos locales y soporte a cuentas.'],
              ['Cecilia Dellamea', 'cdellamea@almarrosario.com', 'Operaciones / Documentación HBL y MBL', 'Nodo transversal de canjes, avisos de arribo y aduana.'],
              ['Lucía Laje', 'llaje@almarrosario.com', 'Comercial Lead & Grandes Cuentas', 'Definición de márgenes y condiciones especiales pactadas.'],
              ['Martín Fusco', 'mfusco@almarrosario.com', 'Pricing & Emisión de Cotizaciones', 'Cotizaciones cargadas en el sistema comercial.'],
              ['Juan Andrés Arloro', 'jarloro@almarrosario.com', 'Socio Director General / Operaciones', 'Aprobación final de excepciones de crédito y operaciones críticas.'],
              ['Alejandro Noacco', 'anoacco@almarrosario.com', 'Socio Director Comercial / Pricing Ultramar', 'Acuerdos marco corporativos y tarifas de navieras.']
            ],
            [22, 28, 26, 24]
          ),

          new Paragraph({ spacing: { before: 200, after: 80 } }),

          // SECCIÓN 3: LAS 32 PREGUNTAS EN 11 BLOQUES EXHAUSTIVOS
          pTitle('3. Batería Exhaustiva de Preguntas de Relevamiento (32 Preguntas)'),
          pBody('Cuestionario completo y detallado para el relevamiento de campo, combinando el rigor normativo ISO con las especificaciones técnicas del software:'),

          // BLOQUE 1
          pHeading2('Bloque 1: Disparador e Inicio de Facturación (Hand-off Operaciones -> Stefania)'),
          createQuestionBlock(
            '1',
            '¿Cuál es el hecho exacto y el canal por el que te enterás de que una carpeta está lista para ser facturada?',
            'Identificar el gatillador real y el tiempo de latencia entre arribo de carga y facturación.',
            '¿Te llega un correo del operativo, te salta una notificación en Kipintoch, te avisan por WhatsApp o vos tenés que entrar a revisar buques arribados a mano?',
            'CANALES Y LATENCIA'
          ),
          createQuestionBlock(
            '2',
            '¿Qué documentación mínima y qué datos en la carpeta necesitás tener sí o sí antes de empezar a confeccionar la factura?',
            'Definir los campos de validación obligatoria en el software antes de habilitar la acción de facturar.',
            '¿Qué pasa si falta algún dato o comprobante? ¿Facturás igual o la carpeta queda frenada?',
            'REQUISITOS DE ENTRADA'
          ),
          createQuestionBlock(
            '3',
            'Si falta algún comprobante local menor (ej. peaje o seguro), ¿frenás la emisión completa o facturás una parte (flete internacional) y después los gastos locales?',
            'Determinar si el sistema debe soportar facturación parcial o por tramos en una misma carpeta.',
            '¿El cliente acepta dos facturas separadas o exige un único comprobante consolidado con todos los conceptos?',
            'FACTURACIÓN PARCIAL'
          ),

          // BLOQUE 2
          pHeading2('Bloque 2: Desarmando el Caso Ideal y Gestión de Riesgos (ISO 6.1)'),
          createQuestionBlock(
            '4',
            '¿Qué hacés cuando la carga ya llegó al puerto, el cliente necesita urgente el canje para despachar, pero la naviera NO mandó la factura todavía?',
            'Mapear la gestión de la urgencia vs el riesgo de facturar a ciegas sin costos reales.',
            '¿Facturás con el costo estimado que cotizó Pricing, o frenás la entrega del HBL hasta tener la factura real?',
            'RIESGO OPERATIVO'
          ),
          createQuestionBlock(
            '5',
            '¿Cuál fue la última factura que tuviste que anular o hacerle Nota de Crédito en el último mes y cuál fue la causa raíz?',
            'Detectar los errores sistemáticos de carga o discrepancias comerciales.',
            '¿Ocurrió por error de tipeo de datos fiscales, por reclamo de tarifa del cliente, o por diferencia en el tipo de cambio?',
            'CALIDAD Y NO CONFORMIDADES'
          ),
          createQuestionBlock(
            '6',
            '¿Ocurre que una carpeta ya esté cerrada y cobrada, y un mes o dos después cae una factura de un fletero, depósito o peaje no previsto?',
            'Detectar costos extemporáneos y cómo impactan en la rentabilidad real.',
            '¿A quién se le imputa esa pérdida? ¿Se le puede refacturar al cliente o la absorbe ALMAR?',
            'COSTOS EXTEMPORÁNEOS'
          ),

          // BLOQUE 3
          pHeading2('Bloque 3: Ingesta de Facturas de Proveedores, Formatos y OCR'),
          createQuestionBlock(
            '7',
            '¿Por qué vía recibís las facturas de proveedores y qué 4 o 5 empresas concentran el 80% de tus comprobantes?',
            'Calibrar el motor de lectura OCR y los conectores automáticos de correo.',
            '¿Entran a tu casilla personal, a una general, o tenés que entrar con usuario y clave a las webs de Maersk/MSC a bajarlas?',
            'OCR / INGESTA'
          ),
          createQuestionBlock(
            '8',
            '¿Cuáles son las 4 o 5 navieras o proveedores que representan el 80% de tus comprobantes de costos?',
            'Garantizar compatibilidad de parsers para MSC, Maersk, Hapag, Cosco y depósitos.',
            '¿Tienen formatos estables en PDF o cambian según la agencia marítima que intervenga?',
            'CONCENTRACIÓN PROVEEDORES'
          ),
          createQuestionBlock(
            '9',
            '¿Cómo vienen expresadas las monedas en esos comprobantes de proveedores?',
            'Manejo de facturación multimoneda (USD / ARS) y liquidaciones mixtas en el motor contable.',
            '¿Vienen en USD puro, en ARS, o facturas en USD liquidadas en pesos al BNA con conceptos gravados y no gravados?',
            'MULTIMONEDA Y ARS'
          ),

          // BLOQUE 4
          pHeading2('Bloque 4: Matching Predictivo (Comprobante -> Carpeta KipinCARGO)'),
          createQuestionBlock(
            '10',
            'Cuando abrís el PDF de una factura de naviera, ¿qué dato mirás primero para saber a qué carpeta de ALMAR pertenece?',
            'Definir los algoritmos de búsqueda y coincidencia automática en el software.',
            '¿Viene el Booking, el HBL, el número de contenedor o el nombre del cliente? ¿Qué campo tiene mayor efectividad?',
            'MATCHING DE CARPETAS'
          ),
          createQuestionBlock(
            '11',
            '¿Existen facturas multicarpeta (por ejemplo, una naviera o camión que factura 3 contenedores de distintos clientes en un solo PDF)?',
            'Definir si el sistema debe permitir prorrateo y asociación 1 a N de comprobantes contra carpetas.',
            '¿Cómo prorrateás los costos compartidos como el handling o peajes entre los clientes afectados?',
            'FACTURAS MULTICARPETA'
          ),

          // BLOQUE 5
          pHeading2('Bloque 5: Detección de Desvíos, Sobrecostos y Tolerancia (Semáforo de Alertas)'),
          createQuestionBlock(
            '12',
            '¿Dónde comparás lo que cobró la naviera contra lo presupuestado para esa operación?',
            'Identificar la fuente de la verdad para el algoritmo de comparación de costos.',
            '¿Entrás a la pantalla de costos de la carpeta en Kipintoch, o te fijás en una planilla Excel o mail de cotizaciones?',
            'FUENTE DE LA VERDAD'
          ),
          createQuestionBlock(
            '13',
            '¿Cuál es la tolerancia aceptable antes de considerar que un costo tiene un desvío y frenar la operación?',
            'Configurar los umbrales de alerta del semáforo preventivo en el Kanban.',
            'Si la naviera factura USD 5 o USD 10 más por redondeo, ¿se aprueba sola o requiere aviso formal?',
            'UMBRAL DE TOLERANCIA'
          ),
          createQuestionBlock(
            '14',
            '¿Cuáles son los recargos sorpresa no previstos que más cobran las navieras y terceros que nunca están en la cotización?',
            'Clasificar automáticamente los conceptos de desvío en el modal de autorización ISO.',
            '¿Demurrage/estadías, lavado de contenedor, peajes de hidrovía, seguro local, handling, diferencias de BAF?',
            'RECARGOS NO COTIZADOS'
          ),

          // BLOQUE 6
          pHeading2('Bloque 6: Protocolo y Gobernanza de Aprobación de Desvíos (Modal ISO 9001)'),
          createQuestionBlock(
            '15',
            'Si una factura viene con USD 300 de sobrecosto: ¿quién tiene la autoridad formal para autorizar que se pague igual?',
            'Mapear los niveles de autorización en el modal de desvíos de la aplicación.',
            '¿Lo autoriza Natali Hermoso (Ops), Vanesa Meggiolaro (Finanzas) o Juan Arloro? ¿Depende del monto del desvío?',
            'AUTORIZACIONES ISO'
          ),
          createQuestionBlock(
            '16',
            '¿Qué se hace formalmente con ese sobrecosto aprobado?',
            'Definir si el sobrecosto se traslada a la factura de venta o se absorbe contra el margen.',
            '¿Se le traslada al cliente en una prefactura / nota de débito, o ALMAR absorbe la pérdida comiéndose el margen?',
            'TRATAMIENTO ECONÓMICO'
          ),
          createQuestionBlock(
            '17',
            '¿Te serviría que el sistema bloquee preventivamente el comprobante y no lo deje pasar a pago hasta que el responsable ponga la justificación y le dé "Autorizar"?',
            'Validar directamente el feature de Kanban Deviation Lock.',
            '¿Cómo evitarías que el bloqueo frene una urgencia operativa en el puerto?',
            'BLOQUEO PREVENTIVO'
          ),

          // BLOQUE 7
          pHeading2('Bloque 7: Carga Asistida en Kipintoch (Ergonomía 1-Click Copy)'),
          createQuestionBlock(
            '18',
            'Observación en Vivo: ¿Nos mostrás 3 minutos cómo cargás una factura de proveedor en la pantalla de Kipintoch?',
            'Mapear el orden exacto de campos para configurar la secuencia de teclas / 1-Click Copy.',
            '¿Cuáles son los pasos obligatorios desde que abrís la pantalla de compras hasta que el comprobante queda guardado?',
            'OBSERVACIÓN EN VIVO'
          ),
          createQuestionBlock(
            '19',
            '¿Cuál es la secuencia exacta de campos y cuáles son los más engorrosos de tipear a mano?',
            'Calibrar la botonera y los atajos de teclado del panel de carga asistida.',
            '¿Punto de venta (5 dígitos), Nro comprobante (8 dígitos), CUIT, CAE, Fecha emisión, Gravado 21%, No gravado, Percepciones?',
            'CAMPOS FISCALES'
          ),
          createQuestionBlock(
            '20',
            'Al cargar una factura en dólares en Kipintoch, ¿el sistema calcula el tipo de cambio oficial BNA solo o lo tipeás a mano?',
            'Sincronización cambiaria y prevención de errores manuales.',
            '¿Qué cotización BNA se toma? ¿Comprador o vendedor? ¿Del día de la factura o del día en que se carga en el sistema?',
            'TIPO DE CAMBIO EN KIPIN'
          ),

          // BLOQUE 8
          pHeading2('Bloque 8: Clientes Especiales ("Alfombra Roja", Cuentas Corrientes y Riesgo)'),
          createQuestionBlock(
            '21',
            'Con clientes de "alfombra roja" (ej. Acindar, Secco): ¿se les entrega el HBL / canje antes de que paguen?',
            'Riesgo crediticio y trazabilidad de excepciones.',
            '¿Quién autoriza por escrito o de palabra esa excepción de entrega sin pago previo?',
            'ENTREGA SIN PAGO'
          ),
          createQuestionBlock(
            '22',
            '¿Hay clientes a los que no se les factura por carpeta individual sino con factura mensual consolidada por 10 o 15 embarques juntos?',
            'Mapear la funcionalidad de facturación agrupada o consolidada.',
            '¿Cómo controlás que no se te escape ningún costo de esas 15 carpetas al momento de liquidar a fin de mes?',
            'FACTURACIÓN CONSOLIDADA'
          ),
          createQuestionBlock(
            '23',
            '¿Tienen clientes con plazos de pago a 30, 60 o 90 días?',
            'Gestión del riesgo por devaluación y descalce financiero.',
            '¿Cómo se fija el tipo de cambio al cobrar? ¿Se emite en pesos con pagaré o en dólares con Nota de Débito por diferencia de cambio?',
            'PLAZOS Y CRÉDITO'
          ),

          // BLOQUE 9
          pHeading2('Bloque 9: El Circuito Informal (WhatsApp, Teléfono y Acuerdos de Palabra)'),
          createQuestionBlock(
            '24',
            'Cuando un comercial (Lucía, Martín, Ale) o un socio (Juan) negocia un descuento verbal de último momento: ¿dónde queda registrado?',
            'Eliminar la pérdida de información en WhatsApp y chats personales.',
            '¿Te mandan un WhatsApp diciendo "Cobrale USD 50 menos que se lo prometí"? ¿Dónde guardás esa constancia para no tener problemas después?',
            'DESCUENTOS POR WHATSAPP'
          ),
          createQuestionBlock(
            '25',
            'Si el camión o la naviera cobró una estadía o peaje extra y el cliente aceptó pagarlo por teléfono: ¿cómo te enterás vos para sumarlo a la factura?',
            'Garantizar que todo gasto recuperable se facture efectivamente al cliente.',
            '¿Qué pasa si el operativo se olvida de avisarte y la factura de venta ya se emitió?',
            'SOBRECOSTOS DE PALABRA'
          ),
          createQuestionBlock(
            '26',
            '¿Te llegan comprobantes como fotos de WhatsApp enviadas por fleteros o papeles que trae el cadete?',
            'Canalizar comprobantes físicos y móviles hacia la bandeja centralizada.',
            '¿Cómo se archivan hoy esos comprobantes para que queden vinculados a la carpeta contable?',
            'COMPROBANTES INFORMALES'
          ),

          // BLOQUE 10
          pHeading2('Bloque 10: Finanzas, Descalce Cambiario y Margen Crítico (< USD 200)'),
          createQuestionBlock(
            '27',
            '¿Cómo vivís la trampa del margen en dólares al pasarse a pesos con las retenciones de AFIP, Sircreb e impuestos bancarios?',
            'Validar el dolor financiero planteado por Vanesa Meggiolaro.',
            '¿Te pasó que una operación que dejaba USD 80 de ganancia terminó en pérdida neta en pesos al liquidar impuestos y comisiones?',
            'DESCALCE USD / ARS'
          ),
          createQuestionBlock(
            '28',
            '¿Te serviría que el sistema tenga un semáforo rojo que alerte preventivamente si el margen proyectado es menor a USD 200 en marítimo antes de facturar?',
            'Validar el umbral paramétrico de alerta temprana en la aplicación.',
            '¿Qué harías cuando salta esa alerta? ¿Revisar costos con Vanesa o renegociar con el cliente?',
            'ALERTA MARGEN < $200'
          ),
          createQuestionBlock(
            '29',
            '¿En qué momento exacto emitís la factura de venta al cliente?',
            'Equilibrio entre cobrar rápido y tener certeza de costos.',
            '¿Apenas sale el buque / aviso de arribo (para cobrar antes), o esperás a tener todas las facturas de proveedores para no errarle al costo real?',
            'MOMENTO DE FACTURAR'
          ),

          // BLOQUE 11
          pHeading2('Bloque 11: Emisión Fiscal AFIP, Cobranzas y Cierre Definitivo'),
          createQuestionBlock(
            '30',
            '¿Cómo se emite la factura al cliente (USD con leyenda BNA o pesos directos) y quién le comunica el importe exacto a transferir?',
            'Trazabilidad en la comunicación de cobranza.',
            '¿Se le manda un correo con la liquidación y la cuenta bancaria, o se coordina por WhatsApp?',
            'MONEDA Y AVISO DE PAGO'
          ),
          createQuestionBlock(
            '31',
            '¿Qué reporte o pantalla de Kipintoch usás para hacer el seguimiento de cobranzas de clientes morosos?',
            'Diseñar el módulo de cuentas corrientes en la solución.',
            '¿Quién llama al cliente que no paga? ¿A partir de cuántos días de atraso se bloquean nuevos embarques en Operaciones?',
            'GESTIÓN DE MORA'
          ),
          createQuestionBlock(
            '32',
            '¿Cuándo considerás que una carpeta está 100% CERRADA a nivel administrativo y contable?',
            'Definir el evento de cierre definitivo de ciclo de vida de la entidad Carpeta.',
            '¿Cuando el saldo del cliente está en cero y todos los proveedores cobraron, o hay un cierre contable mensual posterior?',
            'CIERRE CONTABLE DEFINITIVO'
          ),

          new Paragraph({ spacing: { before: 240, after: 100 } }),

          // SECCIÓN 4: CHECKLIST DE EVIDENCIAS
          pTitle('4. Checklist de Evidencias de Campo (Entregables de la Visita)'),
          pBody('Material probatorio indispensable que Francisco debe solicitar y llevarse de la reunión para alimentar el desarrollo del software:'),

          createStyledTable(
            ['Evidencia Requerida', 'Propósito Técnico / Metodológico', 'Estado', 'Responsable Entrega'],
            [
              ['1 Factura PDF limpia de Naviera (MSC / Maersk)', 'Verificar desglose de ítems, flete internacional y recargos locales en el motor OCR.', '[  ] Pendiente\n[  ] Obtenida', 'Stefania Rossi'],
              ['1 Factura PDF con sobrecosto / desvío real', 'Entrenar el algoritmo de detección de discrepancias y prueba del modal de desvíos.', '[  ] Pendiente\n[  ] Obtenida', 'Stefania Rossi'],
              ['Foto / Captura de pantalla de Kipintoch (Gastos)', 'Asegurar orden ergonómico idéntico en el botón de 1-Click Copy.', '[  ] Pendiente\n[  ] Obtenida', 'Francisco (en vivo)'],
              ['1 Ejemplo real de Prefactura vs Factura AFIP', 'Validar la liquidación cambiaria BNA y retenciones impositivas aplicadas.', '[  ] Pendiente\n[  ] Obtenida', 'Stefania Rossi'],
              ['Lista de 5 mayores proveedores recurrentes', 'Configurar reglas predeterminadas de lectura y cuentas contables.', '[  ] Pendiente\n[  ] Obtenida', 'Stefania Rossi']
            ],
            [30, 42, 14, 14]
          ),

          new Paragraph({ spacing: { before: 240, after: 100 } }),

          // SECCIÓN 5: MATRIZ DE RIESGOS PRELIMINAR (ISO 6.1)
          pTitle('5. Matriz Preliminar de Riesgos y Controles (ISO 9001:2015 § 6.1)'),
          createStyledTable(
            ['Riesgo Identificado', 'Causa Raíz Operativa', 'Impacto en el Negocio', 'Mitigación en Solución de Software'],
            [
              ['Sobrecosto de naviera no detectado', 'El operativo no coteja la factura contra lo presupuestado al recibirla.', 'Pérdida directa de rentabilidad económica en la carpeta.', 'Bloqueo preventivo en bandeja Kanban hasta autorización formal con justificación ISO.'],
              ['Pérdida cambiaria en pase a pesos', 'Márgenes pequeños (< USD 200) absorbidos por retenciones y bancos.', 'Rentabilidad neta negativa al transformar a moneda local.', 'Alerta preventiva de Margen Crítico (< USD 200) visible antes de confirmar prefactura.'],
              ['Demoras por comprobantes dispersos', 'Facturas de proveedores dispersas en casillas personales.', 'Atraso en la emisión y descalce financiero en las cobranzas.', 'Bandeja centralizada de comprobantes con estado de carga y semáforo de antigüedad.'],
              ['Errores de carga manual en Kipintoch', 'Tipeo manual de 12 campos fiscales por cada comprobante.', 'Inconsistencias en libros de IVA compras y demoras.', 'Asistente de carga rápida con 1-Click Copy adaptado a la secuencia exacta de Kipin.'],
              ['Excepciones de crédito no documentadas', 'Autorizaciones verbales para entregar HBL sin pago previo.', 'Riesgo de incobrabilidad de fletes y falta de trazabilidad.', 'Registro auditable de excepciones con usuario, fecha y motivo formal.'],
              ['Costos extemporáneos de terceros', 'Facturas de depósitos o peajes recibidas 60 días después del cierre.', 'Desbalance en el cierre contable de la operación.', 'Alerta de comprobantes huérfanos y período de gracia antes del cierre definitivo.']
            ],
            [22, 26, 24, 28]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // FIRMAS
          pHeading2('Validación y Cierre de la Sesión'),
          new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'Fecha de Realización: _____ / _____ / 2026', bold: true, size: 20 })] }),
          new Paragraph({ spacing: { before: 40, after: 120 }, children: [new TextRun({ text: 'Participantes: Stefania Rossi  |  Vanesa Meggiolaro  |  Equipo Clave Consultores  |  Francisco Bondino', size: 19, color: COLORS.MUTED })] }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.MUTED }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Firma Responsable Área\nStefania Rossi / Vanesa Meggiolaro', bold: true, size: 19 })] })
                    ]
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [new Paragraph({ children: [new TextRun({ text: ' ' })] })]
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.MUTED }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Firma Equipo Implementador\nClave Consultores & Francisco Bondino', bold: true, size: 19 })] })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);

  const downloadPath = path.join(process.env.USERPROFILE, 'Downloads', 'ALMAR - Guia de Relevamiento Administracion y Facturacion - Clave.docx');
  fs.writeFileSync(downloadPath, buffer);
  console.log('Saved to Downloads:', downloadPath, `(${buffer.length} bytes)`);

  const localDocxPath = path.join(__dirname, '..', 'ALMAR_Guia_Relevamiento_Administracion_Facturacion_Clave.docx');
  fs.writeFileSync(localDocxPath, buffer);
  console.log('Saved to workspace:', localDocxPath);

  return { downloadPath, localDocxPath };
}

buildCompleteDocx().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
