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
  ImageRun
} = docx;

const REPO_DIR = 'C:\\Users\\franc\\relev-adm';
const DOWNLOADS_DIR = path.join(process.env.USERPROFILE, 'Downloads');

// 1. Clave Consultora Palette
const COLORS = {
  GREEN_PRIMARY: '1E3D2F',   // #1e3d2f - Deep Forest Green
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

// 2. Load Clave Logo
let logoBase64 = '';
let logoBuffer = null;
try {
  if (fs.existsSync('clave_logo.png')) {
    logoBuffer = fs.readFileSync('clave_logo.png');
    logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
  } else {
    const origHtml = fs.readFileSync('INFORME_COTIZACIONES_ALMAR_2026.html', 'utf8');
    const m = origHtml.match(/<img[^>]+class="cover-logo"[^>]+src="(data:image\/png;base64,[^"]+)"/);
    if (m) {
      logoBase64 = m[1];
      logoBuffer = Buffer.from(logoBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
    }
  }
} catch (e) {
  console.log('Logo load notice:', e.message);
}

// 3. Define the exact 6 phases requested by the user
const PHASES = [
  {
    phaseNum: 1,
    phaseTitle: "FASE 1: Encuadre y Límites del Proceso (Marco ISO con Clave)",
    objective: "Delimitar el proceso formalmente para la Ficha ISO sin entrar en tecnicismos de sistemas.",
    sections: [
      {
        sectionTitle: "El Disparador Real (Inicio)",
        questions: [
          {
            id: "f1_q1",
            num: "1.1",
            title: "El Disparador Real (Inicio)",
            prompt: "“Stefi, ¿cuál es el hecho exacto que te avisa que tenés que ponerte a trabajar en una carpeta?”",
            probe: "Repregunta para buscar la realidad: “¿Te salta una alerta en Kipintoch, te llega un mail del operativo, te mandan un WhatsApp, o vos tenés que entrar a revisar a mano qué buques ya arribaron?”",
            quickOptions: [
              "Alerta automática en Kipintoch",
              "Email del operativo (carpeta lista)",
              "Aviso por WhatsApp de Operaciones",
              "Revisión manual diaria de buques arribados",
              "Aviso verbal directo en oficina"
            ],
            placeholder: "Anotar el disparador real, tiempo de demora entre arribo y aviso, canales utilizados y fricciones..."
          }
        ]
      },
      {
        sectionTitle: "El Límite Final",
        questions: [
          {
            id: "f1_q2",
            num: "1.2",
            title: "El Límite Final",
            prompt: "“¿Tu trabajo con esa carpeta termina cuando emitís la factura electrónica y se la mandás al cliente, o termina recién cuando la plata entró al banco y aplicaste la cobranza en Kipin?”",
            note: "Nota técnica ISO: Si incluye cobranza, el proceso se llama 'Facturación, Cobranzas y Cierre Económico', y requiere registrar la conciliación bancaria.",
            quickOptions: [
              "Termina al emitir y enviar la factura electrónica al cliente",
              "Termina al acreditarse el pago en banco y aplicar cobranza en Kipin",
              "Mixto: Stefi emite factura, Dalia/Vanesa concilian banco y Stefi cierra carpeta",
              "Incluye gestión y seguimiento de cobranza morosa"
            ],
            placeholder: "Registrar alcance exacto, quién concilia el banco, cómo se da por cerrada formalmente la carpeta..."
          }
        ]
      },
      {
        sectionTitle: "Actividades Excluidas (Fronteras)",
        questions: [
          {
            id: "f1_q3",
            num: "1.3",
            title: "Actividades Excluidas (Fronteras)",
            prompt: "“Si una naviera factura un gasto indebido o el cliente reclama por la tarifa: ¿ese reclamo lo peleás vos o se lo devolvés a Operaciones/Comercial?”",
            quickOptions: [
              "Lo pelea y gestiona Stefi directamente con la naviera/cliente",
              "Se devuelve formalmente a Operaciones (Natali Hermoso)",
              "Se devuelve a Comercial / Pricing (Gonzalo)",
              "Interviene Dirección / Socios (Juan Arloro)"
            ],
            placeholder: "Detallar la frontera de responsabilidad y criterios de escalamiento ante reclamos..."
          }
        ]
      }
    ]
  },
  {
    phaseNum: 2,
    phaseTitle: "FASE 2: Desarmando el Caso Ideal (Búsqueda de Fallas y Riesgos ISO 6.1)",
    objective: "Salir del relato teórico (\"todo fluye perfecto\") y capturar las fricciones reales del día a día.",
    sections: [
      {
        sectionTitle: "El Dilema: Urgencia del Cliente vs. Falta de Facturas de Costos",
        questions: [
          {
            id: "f2_q1",
            num: "2.1",
            title: "Urgencia del Cliente vs. Falta de Facturas de Costos",
            prompt: "“¿Qué pasa si la carga ya llegó, el cliente necesita urgente el canje del HBL para que la aduana no le cobre almacenaje, pero la naviera todavía NO te mandó la factura de costos? ¿Facturás a ciegas estimando los costos o frenás la entrega?”",
            quickOptions: [
              "Se factura a ciegas estimando el costo de cotización/Pricing",
              "Se frena la entrega del HBL hasta tener la factura real",
              "Se emite prefactura provisoria sujeta a reajuste",
              "Excepción autorizada verbalmente por Juan Arloro / Gerencia"
            ],
            placeholder: "Documentar frecuencia de esta situación, cómo resuelven la presión del cliente y qué riesgo económico genera..."
          }
        ]
      },
      {
        sectionTitle: "Autopsia del Último Problema (Notas de Crédito)",
        questions: [
          {
            id: "f2_q2",
            num: "2.2",
            title: "Autopsia del Último Problema (Notas de Crédito)",
            prompt: "“¿Cuál fue la última factura que tuviste que anular o hacerle Nota de Crédito este mes? ¿Por qué motivo ocurrió exactamente? (¿Error de tipeo de datos fiscales, diferencia de cambio, reclamo del cliente porque le prometieron otra tarifa?)”",
            quickOptions: [
              "Error de tipeo de datos fiscales / CUIT / Razón Social",
              "Diferencia de tipo de cambio (BNA)",
              "Reclamo del cliente por tarifa discrepante con cotización comercial",
              "Gasto local mal liquidado u omitido en la prefactura"
            ],
            placeholder: "Detallar caso real reciente, importe involucrado, causa raíz y tiempo perdido en la corrección..."
          }
        ]
      },
      {
        sectionTitle: "Comprobantes Extemporáneos (\"Los costos olvidados\")",
        questions: [
          {
            id: "f2_q3",
            num: "2.3",
            title: "Comprobantes Extemporáneos (\"Los costos olvidados\")",
            prompt: "“¿Te pasa que una carpeta ya está cerrada, cobrada y archivada, y un mes después te llega una factura de un depósito fiscal, un peaje o un fletero que nadie había contemplado? ¿Cómo se imputa ese costo y a quién le impacta la pérdida?”",
            quickOptions: [
              "ALMAR absorbe la pérdida contra su margen operativo",
              "Se emite Nota de Débito al cliente para refacturar el costo",
              "Se imputa a una cuenta de pérdidas generales de la empresa",
              "Se reabre la carpeta en Kipin afectando la rentabilidad histórica"
            ],
            placeholder: "Frecuencia de comprobantes tardíos, proveedores que más demoran, tratamiento contable..."
          }
        ]
      }
    ]
  },
  {
    phaseNum: 3,
    phaseTitle: "FASE 3: El Núcleo de la Solución de Software (Comprobantes, OCR y Desvíos)",
    objective: "Obtener las especificaciones exactas para el motor de lectura, la bandeja Kanban y el detector de sobrecostos.",
    sections: [
      {
        sectionTitle: "Bandeja de Entrada y Formatos Reales (Para calibrar el OCR)",
        questions: [
          {
            id: "f3_q1",
            num: "3.1",
            title: "Canales de Ingesta de Facturas",
            prompt: "“¿Por dónde te llegan las facturas de proveedores? ¿A tu casilla personal, a una general, o tenés que entrar a las webs de Maersk/MSC a descargarlas una por una?”",
            quickOptions: [
              "Email personal de Stefi",
              "Email general de administración (administracion@ / facturacion@)",
              "Descarga manual en portales web (Maersk, MSC, Hapag)",
              "Recepción por WhatsApp / Fotos"
            ],
            placeholder: "Canales principales, cantidad semanal promedio, tiempo dedicado a la descarga manual..."
          },
          {
            id: "f3_q2",
            num: "3.2",
            title: "Top Proveedores y Patrones de Moneda",
            prompt: "“¿Cuáles son las 4 o 5 navieras o proveedores que representan el 80% de tus facturas? ¿Vienen en USD, en ARS o mixtas (flete en USD liquidado en ARS al BNA)?”",
            quickOptions: [
              "MSC (Mediterranean Shipping Company)",
              "Maersk Line",
              "Hapag-Lloyd",
              "Cosco Shipping",
              "Depósitos fiscales / Fleteros locales",
              "Comprobantes en USD Puro",
              "Comprobantes en ARS Puro",
              "Liquidaciones mixtas (USD liquidado en ARS al BNA oficial)"
            ],
            placeholder: "Listar los proveedores del 80% y los patrones de moneda observados..."
          }
        ]
      },
      {
        sectionTitle: "Algoritmo de Matching Comprobante ↔ Carpeta Kipin",
        questions: [
          {
            id: "f3_q3",
            num: "3.3",
            title: "Datos Clave para el Cruce Comprobante - Carpeta",
            prompt: "“Cuando abrís el PDF de una factura de naviera, ¿qué dato mirás primero para saber a qué carpeta de ALMAR pertenece? ¿El Booking, el HBL, el número de Contenedor o el nombre del cliente?”",
            quickOptions: [
              "Nro. de Booking",
              "Nro. de HBL / B/L Master",
              "Nro. de Contenedor",
              "Razón social del cliente / importador",
              "Referencia interna ALMAR"
            ],
            placeholder: "Jerarquía de búsqueda exacta que realiza Stefi manualmente en Kipin..."
          },
          {
            id: "f3_q4",
            num: "3.4",
            title: "Facturas Multicarpeta vs. Unicarpeta",
            prompt: "“¿Existen facturas multicarpeta (por ejemplo, una factura que incluye gastos de 3 contenedores de distintos clientes), o siempre es 1 factura = 1 carpeta?”",
            quickOptions: [
              "100% de las facturas son 1 a 1 (1 factura = 1 carpeta)",
              "Existen facturas multicarpeta (depósitos, consolidados, peajes)",
              "Frecuencia de multicarpeta: baja (< 5%)",
              "Frecuencia de multicarpeta: habitual (> 20%)"
            ],
            placeholder: "Cómo se prorratea hoy un comprobante compartido entre múltiples carpetas..."
          }
        ]
      },
      {
        sectionTitle: "Cotejo de Costos y Tolerancia (Para el Semáforo de Alertas)",
        questions: [
          {
            id: "f3_q5",
            num: "3.5",
            title: "Consulta del Costo Presupuestado",
            prompt: "“¿Dónde mirás hoy el costo que estaba presupuestado para esa operación? ¿En la pantalla de costos de Kipintoch o en un mail?”",
            quickOptions: [
              "Pantalla de costos/cálculo de KipinCARGO",
              "Mail de cotización de Pricing",
              "Planilla Excel de Operaciones",
              "Consulta directa por WhatsApp a Operaciones"
            ],
            placeholder: "Cómo sabe hoy si el costo es el esperado y si Kipin tiene el dato actualizado..."
          },
          {
            id: "f3_q6",
            num: "3.6",
            title: "Tolerancia Aceptable en Desvíos",
            prompt: "“¿Cuál es la tolerancia aceptable? Si la naviera factura USD 10 más por una diferencia de redondeo, ¿se frena, o hay un margen de tolerancia donde pasa directo?”",
            quickOptions: [
              "Tolerancia cero: cualquier diferencia se frena",
              "Margen menor a USD 10-20 pasa automático",
              "Margen porcentual (ej. hasta 1-2%)",
              "Queda a criterio de Stefi según la urgencia"
            ],
            placeholder: "Definir umbral de tolerancia para el algoritmo de semáforo verde/amarillo/rojo..."
          },
          {
            id: "f3_q7",
            num: "3.7",
            title: "Recargos Sorpresa más Frecuentes",
            prompt: "“¿Cuáles son los recargos sorpresa más comunes que nunca están en la cotización? (Demurrage/estadías, lavado, peajes de hidrovía, seguro local).”",
            quickOptions: [
              "Demurrage / Estadías de contenedor",
              "Lavado e inspección de contenedor",
              "Peaje hidrovía / Agencia marítima",
              "Seguro local / Garantía de contenedores",
              "Gastos de cesión o desconsolidación"
            ],
            placeholder: "Anotar conceptos no cotizados habituales y cómo se detectan..."
          }
        ]
      },
      {
        sectionTitle: "Protocolo y Niveles de Aprobación de Desvíos (Para el Modal ISO de la App)",
        questions: [
          {
            id: "f3_q8",
            num: "3.8",
            title: "Autoridad Formal de Aprobación",
            prompt: "“Si una factura viene con USD 300 de sobrecosto: ¿quién tiene la autoridad formal para autorizar que se pague igual? ¿Natali Hermoso (Ops), Vanesa Meggiolaro (Finanzas) o Juan Arloro (Dirección)?”",
            quickOptions: [
              "Natali Hermoso (Operaciones)",
              "Vanesa Meggiolaro (Finanzas / Tesorería)",
              "Juan Arloro (Dirección General)",
              "Gonzalo / Pricing"
            ],
            placeholder: "Definir matriz de autorización según rangos de montos (ej. < USD 100 vs > USD 300)..."
          },
          {
            id: "f3_q9",
            num: "3.9",
            title: "Destino del Sobrecosto",
            prompt: "“¿Qué se hace con ese sobrecosto? ¿Se traslada al cliente en la prefactura o ALMAR absorbe la pérdida?”",
            quickOptions: [
              "Se traslada al cliente en la prefactura",
              "ALMAR absorbe la pérdida contra margen de la operación",
              "Se negocia con el comercial/operativo",
              "Depende de la categoría del cliente"
            ],
            placeholder: "Criterio de traslado y comunicación al cliente..."
          },
          {
            id: "f3_q10",
            num: "3.10",
            title: "Bloqueo Preventivo en la Aplicación",
            prompt: "“¿Te serviría que el sistema bloquee preventivamente el comprobante y no lo deje pasar a pago hasta que el responsable ponga la justificación y le dé 'Autorizar'?”",
            quickOptions: [
              "Sí, fundamental para evitar pagos indebidos",
              "Sí, genera trazabilidad ISO para auditorías",
              "No, podría ralentizar los pagos urgentes",
              "Solo para desvíos superiores a un monto fijado"
            ],
            placeholder: "Validar con Stefi la ergonomía del modal de autorización y desbloqueo..."
          }
        ]
      }
    ]
  },
  {
    phaseNum: 4,
    phaseTitle: "FASE 4: Ergonomía de Carga en Kipintoch (Módulo Carga Asistida / 1-Click Copy)",
    objective: "Diseñar la interfaz de carga rápida para que replique exactamente el formulario de Kipin.",
    sections: [
      {
        sectionTitle: "Observación en Vivo (Prueba de Campo Fundamental)",
        questions: [
          {
            id: "f4_q1",
            num: "4.1",
            title: "Secuencia de Carga de Comprobante en Kipintoch",
            prompt: "“Stefi, ¿nos mostrás 3 minutos en tu pantalla cómo cargás una factura de compra en Kipintoch?”",
            note: "Secuencia a auditar: Punto de venta (5 dígitos) -> Nro comprobante (8 dígitos) -> CUIT emisor -> CAE -> Fecha emisión -> Fecha vto -> Neto gravado -> IVA 21% -> IVA 10.5% -> No gravado -> Percepciones.\nTu feature: Tu botón de 1-Click Copy debe ordenar los datos en ese orden para que con la tecla Tab pegue todo en segundos sin tocar el mouse.",
            quickOptions: [
              "1. Pto. Venta (5 dígitos)",
              "2. Nro. Comprobante (8 dígitos)",
              "3. CUIT Emisor",
              "4. Código CAE / Vto CAE",
              "5. Fecha Emisión / Vto",
              "6. Neto Gravado",
              "7. Alícuotas IVA (21% / 10.5%)",
              "8. Conceptos No Gravados / Exentos",
              "9. Percepciones (IIBB / Ganancias / IVA)"
            ],
            placeholder: "Anotar orden real de navegación (Tab / Mouse), campos que autocompleta Kipin y fricciones observadas..."
          }
        ]
      },
      {
        sectionTitle: "Manejo del Tipo de Cambio en Kipin",
        questions: [
          {
            id: "f4_q2",
            num: "4.2",
            title: "Tipo de Cambio en Comprobantes en USD",
            prompt: "“Al cargar una factura en dólares en Kipin, ¿el sistema toma el tipo de cambio oficial BNA solo, o tenés que buscarlo y tipear la cotización a mano?”",
            quickOptions: [
              "Kipin lo toma automático del BNA",
              "Stefi lo busca y lo tipea a mano todos los días",
              "Toman tipo de cambio vendedor del día anterior",
              "Toman cotización especial según naviera"
            ],
            placeholder: "Fuente del tipo de cambio, fecha de referencia y riesgos de descalce cambiario..."
          }
        ]
      }
    ]
  },
  {
    phaseNum: 5,
    phaseTitle: "FASE 5: Clientes Especiales y Circuito Informal (El \"Camino Negro\")",
    objective: "Identificar las excepciones donde las reglas se rompen por acuerdos comerciales o de palabra.",
    sections: [
      {
        sectionTitle: "Clientes con \"Alfombra Roja\" (Grandes Cuentas / Amigos de Dirección)",
        questions: [
          {
            id: "f5_q1",
            num: "5.1",
            title: "Liberación de Carga sin Pago Previo (Crédito)",
            prompt: "“La regla de oro es 'contra pago se entrega el HBL / canje'. Con clientes estratégicos (como Acindar o Secco): ¿se les libera la carga antes de que paguen? ¿Quién autoriza esa excepción de crédito?”",
            quickOptions: [
              "Nunca se libera sin pago previo (regla estricta)",
              "Se libera a clientes con cuenta corriente autorizada",
              "Autorización verbal de Juan Arloro",
              "Acuerdo comercial directo de Gonzalo / Comercial"
            ],
            placeholder: "Clientes autorizados, límite de crédito, quién asume la responsabilidad..."
          },
          {
            id: "f5_q2",
            num: "5.2",
            title: "Facturación Consolidada a Fin de Mes",
            prompt: "“¿Hay clientes a los que les hacés facturación consolidada a fin de mes por 10 embarques juntos en lugar de factura por carpeta?”",
            quickOptions: [
              "No, 100% factura individual por carpeta",
              "Sí, clientes recurrentes piden factura agrupada mensual",
              "Se emite prefactura por carpeta y factura fiscal consolidada"
            ],
            placeholder: "Identificar clientes con facturación agrupada y cómo se asocian en Kipin..."
          }
        ]
      },
      {
        sectionTitle: "Instrucciones por WhatsApp y Acuerdos Verbales",
        questions: [
          {
            id: "f5_q3",
            num: "5.3",
            title: "Descuentos de Último Momento y Acuerdos Verbales",
            prompt: "“Cuando un comercial o socio acuerda un descuento de último momento o bonificar un gasto: ¿te lo dejan asentado en Kipin o te mandan un WhatsApp diciendo 'A Fulano cobrale USD 100 menos'? ¿Dónde guardás esa constancia?”",
            quickOptions: [
              "Queda asentado en el cálculo de Kipin",
              "Llega por WhatsApp al celular de Stefi",
              "Llega por correo electrónico",
              "Aviso verbal informal"
            ],
            placeholder: "Dónde se archiva la evidencia, riesgo de olvido o reclamo posterior..."
          }
        ]
      },
      {
        sectionTitle: "Comprobantes Informales",
        questions: [
          {
            id: "f5_q4",
            num: "5.4",
            title: "Fotos de WhatsApp y Comprobantes en Papel",
            prompt: "“¿Te llegan comprobantes como fotos de WhatsApp enviadas por fleteros o papeles que trae el cadete? ¿Cómo se procesan para que no queden fuera de la carpeta?”",
            quickOptions: [
              "Llegan fotos borrosas por WhatsApp",
              "Comprobantes físicos en papel (cadete/fletero)",
              "Se imprimen y se adjuntan a carpeta física",
              "Se suben escaneados a Kipin"
            ],
            placeholder: "Cómo asegurar que no se pierdan comprobantes informales..."
          }
        ]
      }
    ]
  },
  {
    phaseNum: 6,
    phaseTitle: "FASE 6: Cierre Táctico y Evidencias de Campo",
    objective: "Traerte material real para probar tus algoritmos y modelos de datos.",
    sections: [
      {
        sectionTitle: "Evidencias Clave a Solicitar antes de Finalizar",
        items: [
          {
            id: "f6_item1",
            text: "1 PDF real de factura de naviera limpia (MSC o Maersk) con flete e ítems locales.",
            tag: "Dataset OCR Limpio",
            placeholder: "Registrar nombre de archivo, naviera, fecha..."
          },
          {
            id: "f6_item2",
            text: "1 PDF real de factura con sobrecosto o concepto no previsto (para entrenar la detección de desvíos).",
            tag: "Dataset Desvíos",
            placeholder: "Registrar naviera, concepto sorpresa (demurrage, lavado, etc.), desvío en USD..."
          },
          {
            id: "f6_item3",
            text: "Foto o captura nítida de la pantalla de carga de comprobantes de KipinCARGO.",
            tag: "Ergonomía 1-Click",
            placeholder: "Detalles de campos observados, versión de KipinCARGO..."
          },
          {
            id: "f6_item4",
            text: "1 Caso real de prefactura vs. factura final en pesos (para ver cómo liquidaron el tipo de cambio y las retenciones).",
            tag: "Liquidación Fiscal",
            placeholder: "Cliente, carpeta, tipo de cambio BNA aplicado, retenciones..."
          }
        ]
      }
    ]
  }
];

// 4. Generate Interactive HTML
function buildHtml() {
  let phasesHtml = '';

  PHASES.forEach(phase => {
    let sectionsHtml = '';

    if (phase.phaseNum === 6) {
      // Evidence phase
      const itemsHtml = phase.sections[0].items.map(it => `
        <div class="evidence-card">
          <div class="evidence-header">
            <label class="custom-checkbox">
              <input type="checkbox" data-check="${it.id}">
              <span class="checkmark"></span>
              <span class="evidence-label"><strong>${it.text}</strong></span>
            </label>
            <span class="evidence-tag">${it.tag}</span>
          </div>
          <div class="evidence-body">
            <textarea class="q-notes-box evidence-notes" data-qid="${it.id}_notes" rows="2" placeholder="${it.placeholder}"></textarea>
          </div>
        </div>
      `).join('');

      sectionsHtml = `
        <div class="phase-section">
          <h3 class="section-title">📋 Lista de Control de Evidencias de Campo</h3>
          <div class="evidence-grid">
            ${itemsHtml}
          </div>
        </div>
      `;
    } else {
      // Standard Question Phase
      sectionsHtml = phase.sections.map(sec => {
        const qHtml = sec.questions.map(q => {
          const optionsHtml = q.quickOptions ? `
            <div class="quick-options-grid">
              ${q.quickOptions.map((opt, idx) => `
                <label class="custom-checkbox option-chip">
                  <input type="checkbox" data-check="${q.id}_opt${idx}">
                  <span class="checkmark"></span>
                  <span class="option-text">${opt}</span>
                </label>
              `).join('')}
            </div>
          ` : '';

          const probeHtml = q.probe ? `
            <div class="probe-callout">
              <span class="probe-icon">🔍</span>
              <div class="probe-content">
                <strong>Repregunta / Foco de Campo:</strong>
                <p>${q.probe.replace(/^Repregunta para buscar la realidad:\s*/, '')}</p>
              </div>
            </div>
          ` : '';

          const noteHtml = q.note ? `
            <div class="note-callout">
              <span class="note-icon">💡</span>
              <div class="note-content">
                <strong>Enfoque Técnico / ISO:</strong>
                <p>${q.note.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          ` : '';

          return `
            <div class="question-card" id="card-${q.id}">
              <div class="question-card-header">
                <div class="q-badge-row">
                  <span class="q-num-badge">${q.num}</span>
                  <span class="q-title-tag">${q.title}</span>
                </div>
              </div>
              <div class="q-prompt-box">
                <p class="q-prompt-text">${q.prompt}</p>
              </div>
              ${probeHtml}
              ${noteHtml}
              ${optionsHtml}
              <div class="q-notes-wrapper">
                <div class="q-notes-header">
                  <label for="txt-${q.id}">✍️ Notas y Respuestas de Stefania (Tiempo Real):</label>
                  <span class="auto-save-indicator" id="ind-${q.id}">Auto-guardado</span>
                </div>
                <textarea id="txt-${q.id}" class="q-notes-box" data-qid="${q.id}" rows="4" placeholder="${q.placeholder}"></textarea>
              </div>
            </div>
          `;
        }).join('');

        // Ergonomics pipeline visualization for Phase 4
        let ergonomicsVisual = '';
        if (sec.sectionTitle.includes('Observación en Vivo')) {
          ergonomicsVisual = `
            <div class="ergonomics-pipeline-card">
              <div class="pipeline-title">⚡ Secuencia de Campos Formulada para el Botón "1-Click Copy":</div>
              <div class="pipeline-flow">
                <span class="pipeline-step">1. Pto. Venta (5d)</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">2. Nro. Comp (8d)</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">3. CUIT Emisor</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">4. Código CAE</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">5. F. Emisión</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">6. F. Vto</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step highlight">7. Neto Gravado</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">8. Alícuota IVA</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">9. No Gravado</span>
                <span class="pipeline-arrow">➔</span>
                <span class="pipeline-step">10. Percepciones</span>
              </div>
              <p class="pipeline-note">Objetivo Ergonómico: Con la tecla <code>Tab</code> se avanza automáticamente entre celdas pegando el portapapeles en menos de 5 segundos sin tocar el mouse.</p>
            </div>
          `;
        }

        return `
          <div class="phase-section">
            <h3 class="section-title">${sec.sectionTitle}</h3>
            ${ergonomicsVisual}
            <div class="questions-list">
              ${qHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    phasesHtml += `
      <section class="phase-block" id="fase-${phase.phaseNum}">
        <div class="phase-header-banner">
          <div class="phase-banner-main">
            <span class="phase-pill">FASE ${phase.phaseNum}</span>
            <h2 class="phase-title">${phase.phaseTitle}</h2>
          </div>
        </div>
        <div class="phase-objective-box">
          <div class="obj-label">🎯 OBJETIVO:</div>
          <div class="obj-text">${phase.objective}</div>
        </div>
        <div class="phase-content">
          ${sectionsHtml}
        </div>
      </section>
    `;
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ALMAR Rosario — Relevamiento Administración, Facturación y Finanzas</title>
    <style>
        :root {
            --green-primary: #1e3d2f;
            --green-light: #2c5442;
            --green-tint: #f0fdf4;
            --gold: #c29320;
            --gold-light: #fefcf5;
            --gold-border: #eedaa2;
            --navy: #081433;
            --text-dark: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
            --shadow-md: 0 4px 14px rgba(0,0,0,0.07);
            --radius-md: 8px;
            --radius-lg: 12px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-dark);
            line-height: 1.6;
            padding-bottom: 80px;
        }

        /* Top Sticky Toolbar */
        .sticky-toolbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: #ffffff;
            border-bottom: 2px solid var(--gold);
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            padding: 10px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .toolbar-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand-badge {
            background: var(--green-primary);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .brand-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--green-primary);
        }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            color: #15803d;
            background: #dcfce7;
            padding: 4px 10px;
            border-radius: 20px;
            border: 1px solid #bbf7d0;
            transition: all 0.3s ease;
        }

        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: var(--green-primary);
            color: #ffffff;
        }
        .btn-primary:hover {
            background: var(--green-light);
            box-shadow: 0 2px 6px rgba(30,61,47,0.3);
        }

        .btn-secondary {
            background: #ffffff;
            color: var(--text-dark);
            border: 1px solid var(--border-color);
        }
        .btn-secondary:hover {
            background: #f1f5f9;
        }

        .btn-gold {
            background: var(--gold);
            color: #ffffff;
        }
        .btn-gold:hover {
            background: #a97e16;
        }

        .btn-danger {
            background: #fff;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        .btn-danger:hover {
            background: #fef2f2;
        }

        /* Container */
        .container {
            max-width: 1040px;
            margin: 24px auto;
            padding: 0 20px;
        }

        /* Document Header */
        .doc-header-card {
            background: #ffffff;
            border-radius: var(--radius-lg);
            border-top: 5px solid var(--green-primary);
            box-shadow: var(--shadow-md);
            padding: 28px 32px;
            margin-bottom: 28px;
        }

        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 16px;
        }

        .logo-wrap img {
            max-height: 48px;
            width: auto;
        }

        .logo-fallback {
            font-size: 20px;
            font-weight: 800;
            color: var(--green-primary);
            letter-spacing: -0.5px;
        }

        .doc-meta-badge {
            background: var(--gold-light);
            border: 1px solid var(--gold-border);
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .doc-main-title {
            font-size: 24px;
            font-weight: 800;
            color: var(--green-primary);
            margin-bottom: 6px;
            line-height: 1.25;
        }

        .doc-subtitle {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 20px;
        }

        .meta-table-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            background: #f8fafc;
            padding: 16px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
        }

        .meta-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .meta-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            letter-spacing: 0.5px;
        }

        .meta-value {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-dark);
        }

        .meta-value[contenteditable="true"] {
            border-bottom: 1px dashed var(--gold);
            outline: none;
            padding: 1px 3px;
            border-radius: 3px;
        }
        .meta-value[contenteditable="true"]:focus {
            background: #fefcf5;
            border-bottom: 1px solid var(--gold);
        }

        /* Phase Block */
        .phase-block {
            background: #ffffff;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
            margin-bottom: 32px;
            overflow: hidden;
        }

        .phase-header-banner {
            background: linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%);
            padding: 18px 24px;
            color: #ffffff;
        }

        .phase-pill {
            display: inline-block;
            background: var(--gold);
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }

        .phase-title {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.2px;
        }

        .phase-objective-box {
            background: var(--gold-light);
            border-bottom: 1px solid var(--gold-border);
            padding: 12px 24px;
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .obj-label {
            font-size: 11px;
            font-weight: 800;
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }

        .obj-text {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-dark);
        }

        .phase-content {
            padding: 24px;
        }

        .phase-section {
            margin-bottom: 28px;
        }
        .phase-section:last-child {
            margin-bottom: 0;
        }

        .section-title {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--green-primary);
            letter-spacing: 0.5px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 16px;
        }

        /* Question Card */
        .question-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 18px 20px;
            margin-bottom: 16px;
            transition: all 0.2s ease;
        }
        .question-card:hover {
            border-color: #cbd5e1;
            box-shadow: var(--shadow-sm);
        }

        .question-card-header {
            margin-bottom: 10px;
        }

        .q-badge-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .q-num-badge {
            background: var(--green-primary);
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 4px;
        }

        .q-title-tag {
            font-size: 12px;
            font-weight: 700;
            color: var(--green-light);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .q-prompt-box {
            background: #f8fafc;
            border-left: 3px solid var(--green-primary);
            padding: 10px 14px;
            border-radius: 0 4px 4px 0;
            margin-bottom: 12px;
        }

        .q-prompt-text {
            font-size: 14.5px;
            font-weight: 600;
            color: var(--text-dark);
            line-height: 1.45;
        }

        /* Callouts */
        .probe-callout {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 12.5px;
            color: #92400e;
        }

        .probe-callout p {
            margin-top: 2px;
        }

        .note-callout {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: #eff6ff;
            border: 1px solid #dbeafe;
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 12.5px;
            color: #1e40af;
        }

        .note-callout p {
            margin-top: 2px;
        }

        /* Quick Options Grid */
        .quick-options-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 14px;
            padding: 8px 10px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px dashed var(--border-color);
        }

        .option-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            border: 1px solid var(--border-color);
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 11.5px;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
        }
        .option-chip:hover {
            border-color: var(--gold);
            background: var(--gold-light);
        }

        /* Custom Checkbox */
        .custom-checkbox {
            position: relative;
            display: inline-flex;
            align-items: center;
            cursor: pointer;
        }
        .custom-checkbox input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
        }
        .checkmark {
            height: 15px;
            width: 15px;
            background-color: #fff;
            border: 1.5px solid #94a3b8;
            border-radius: 3px;
            margin-right: 6px;
            display: inline-block;
            position: relative;
            transition: all 0.15s;
        }
        .custom-checkbox:hover input ~ .checkmark {
            border-color: var(--green-primary);
        }
        .custom-checkbox input:checked ~ .checkmark {
            background-color: var(--green-primary);
            border-color: var(--green-primary);
        }
        .checkmark:after {
            content: "";
            position: absolute;
            display: none;
            left: 4px;
            top: 1px;
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        .custom-checkbox input:checked ~ .checkmark:after {
            display: block;
        }

        /* Notes Box */
        .q-notes-wrapper {
            margin-top: 10px;
        }

        .q-notes-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        .q-notes-header label {
            font-size: 11.5px;
            font-weight: 700;
            color: var(--green-primary);
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .auto-save-indicator {
            font-size: 10px;
            color: #94a3b8;
            font-style: italic;
        }

        .q-notes-box {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 12px;
            font-family: inherit;
            font-size: 13.5px;
            color: var(--text-dark);
            line-height: 1.5;
            background: #ffffff;
            resize: vertical;
            transition: all 0.2s ease;
        }

        .q-notes-box:focus {
            outline: none;
            border-color: var(--green-primary);
            box-shadow: 0 0 0 3px rgba(30,61,47,0.12);
            background: #ffffff;
        }

        /* Ergonomics Pipeline Visualization */
        .ergonomics-pipeline-card {
            background: var(--gold-light);
            border: 1px solid var(--gold-border);
            border-radius: var(--radius-md);
            padding: 16px 20px;
            margin-bottom: 20px;
        }

        .pipeline-title {
            font-size: 13px;
            font-weight: 800;
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        .pipeline-flow {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 10px;
        }

        .pipeline-step {
            background: #ffffff;
            border: 1px solid var(--border-color);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            color: var(--green-primary);
        }

        .pipeline-step.highlight {
            background: var(--green-primary);
            color: #ffffff;
            border-color: var(--green-primary);
        }

        .pipeline-arrow {
            color: var(--gold);
            font-weight: bold;
            font-size: 12px;
        }

        .pipeline-note {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.4;
        }

        .pipeline-note code {
            background: #e2e8f0;
            padding: 1px 4px;
            border-radius: 3px;
            font-weight: 600;
            color: var(--navy);
        }

        /* Evidence Cards */
        .evidence-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 16px;
        }

        .evidence-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .evidence-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }

        .evidence-label {
            font-size: 13px;
            line-height: 1.4;
            color: var(--text-dark);
        }

        .evidence-tag {
            background: var(--gold-light);
            border: 1px solid var(--gold-border);
            color: var(--gold);
            font-size: 10px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }

        .evidence-notes {
            font-size: 12.5px;
            padding: 8px 10px;
        }

        /* Sign-off Block */
        .signoff-card {
            background: #ffffff;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-color);
            padding: 24px 32px;
            margin-top: 36px;
            box-shadow: var(--shadow-sm);
        }

        .signoff-title {
            font-size: 14px;
            font-weight: 800;
            color: var(--green-primary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 8px;
        }

        .signoff-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 24px;
        }

        .signoff-box {
            border: 1px dashed var(--border-color);
            padding: 16px;
            border-radius: var(--radius-md);
            background: #fafafa;
        }

        .signoff-line {
            height: 40px;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 8px;
        }

        .signoff-name {
            font-size: 12.5px;
            font-weight: 700;
            color: var(--text-dark);
        }

        .signoff-role {
            font-size: 11px;
            color: var(--text-muted);
        }

        /* Print Media Styles */
        @media print {
            .sticky-toolbar {
                display: none !important;
            }
            body {
                background: #ffffff !important;
                padding: 0 !important;
            }
            .container {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .phase-block {
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                page-break-inside: avoid;
                margin-bottom: 20px !important;
            }
            .question-card {
                page-break-inside: avoid;
                border: 1px solid #e2e8f0 !important;
            }
            .q-notes-box {
                border: 1px solid #94a3b8 !important;
            }
            .btn {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    <!-- Sticky Toolbar -->
    <header class="sticky-toolbar">
        <div class="toolbar-brand">
            <span class="brand-badge">CLAVE CONSULTORES</span>
            <span class="brand-title">ALMAR Rosario — Relevamiento Administración y Facturación</span>
            <span class="status-pill" id="storageStatusBadge">
                <span class="status-dot">●</span>
                <span id="storageStatusText">Guardado en este equipo</span>
            </span>
        </div>
        <div class="toolbar-actions">
            <button class="btn btn-secondary" onclick="exportBackupJson()">
                💾 Exportar JSON
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('importFileInput').click()">
                📂 Cargar JSON
            </button>
            <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importBackupJson(event)">
            <button class="btn btn-primary" onclick="window.print()">
                🖨️ Imprimir / PDF
            </button>
            <button class="btn btn-danger" onclick="resetForm()">
                🔄 Restablecer
            </button>
        </div>
    </header>

    <div class="container">
        <!-- Executive Document Header -->
        <div class="doc-header-card">
            <div class="header-top">
                <div class="logo-wrap">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Clave Consultora">` : '<div class="logo-fallback">CLAVE CONSULTORES</div>'}
                </div>
                <div class="doc-meta-badge">
                    ISO 9001:2015 § 8.1 / § 8.2 / § 8.5.1
                </div>
            </div>

            <h1 class="doc-main-title">GUÍA DE RELEVAMIENTO DE CAMPO: ADMINISTRACIÓN, FACTURACIÓN Y FINANZAS</h1>
            <p class="doc-subtitle">Instrumento operativo de diagnóstico, delimitación de procesos bajo metodología ISO y especificación técnica de la solución automatizada de comprobantes.</p>

            <div class="meta-table-grid">
                <div class="meta-item">
                    <span class="meta-label">Entrevistada</span>
                    <span class="meta-value" contenteditable="true" data-meta="entrevistada">Stefania Rossi (Responsable de Facturación y Administración)</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Organización</span>
                    <span class="meta-value">ALMAR Rosario S.R.L.</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Relevadores</span>
                    <span class="meta-value" contenteditable="true" data-meta="relevadores">Equipo de Proceso & Sistemas (Clave Consultores)</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Fecha de Relevamiento</span>
                    <span class="meta-value" contenteditable="true" data-meta="fecha">${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Sistema de Gestión</span>
                    <span class="meta-value">Kipintoch / KipinCARGO v2.6.4</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Alcance</span>
                    <span class="meta-value">Ingesta de Comprobantes, Matching, Detección de Desvíos y Facturación Electrónica</span>
                </div>
            </div>
        </div>

        <!-- Render All 6 Phases -->
        ${phasesHtml}

        <!-- Final Sign-off Card -->
        <div class="signoff-card">
            <h3 class="signoff-title">✍️ Cierre y Conformidad del Relevamiento de Campo</h3>
            <div class="signoff-grid">
                <div class="signoff-box">
                    <div class="signoff-line"></div>
                    <div class="signoff-name">Stefania Rossi</div>
                    <div class="signoff-role">Administración y Facturación — ALMAR Rosario</div>
                </div>
                <div class="signoff-box">
                    <div class="signoff-line"></div>
                    <div class="signoff-name">Franco Bondino / Consultor Asignado</div>
                    <div class="signoff-role">Líder de Sistemas & Procesos — Clave Consultores</div>
                </div>
                <div class="signoff-box">
                    <div class="signoff-line"></div>
                    <div class="signoff-name">Juan Arloro / Dirección</div>
                    <div class="signoff-role">Socio Gerente — ALMAR Rosario S.R.L.</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Reactive Persistence Engine -->
    <script>
        const STORAGE_KEY = 'almar_relevamiento_stefania_v2';
        let saveTimeout = null;

        function updateStatus(text, color = '#15803d') {
            const badge = document.getElementById('storageStatusBadge');
            const txt = document.getElementById('storageStatusText');
            if (badge && txt) {
                txt.textContent = text;
                badge.style.color = color;
            }
        }

        function collectFormData() {
            const data = {
                metadata: {},
                answers: {},
                checkboxes: {},
                timestamp: new Date().toISOString()
            };

            // Metadata
            document.querySelectorAll('[data-meta]').forEach(el => {
                const key = el.getAttribute('data-meta');
                data.metadata[key] = el.innerText.trim();
            });

            // Textareas (answers and notes)
            document.querySelectorAll('textarea.q-notes-box').forEach(el => {
                const qid = el.getAttribute('data-qid');
                if (qid) {
                    data.answers[qid] = el.value;
                }
            });

            // Checkboxes
            document.querySelectorAll('input[type="checkbox"][data-check]').forEach(el => {
                const cid = el.getAttribute('data-check');
                if (cid) {
                    data.checkboxes[cid] = el.checked;
                }
            });

            return data;
        }

        function saveToStorage() {
            try {
                const data = collectFormData();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                updateStatus('🟢 Guardado automático (' + timeStr + ')', '#15803d');
            } catch(e) {
                console.error('Save error:', e);
                updateStatus('⚠️ Error de almacenamiento', '#dc2626');
            }
        }

        function queueSave() {
            updateStatus('🟡 Guardando...', '#d97706');
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveToStorage, 300);
        }

        function restoreFromStorage() {
            try {
                let saved = localStorage.getItem(STORAGE_KEY);
                // Fallback check for older key if new is empty
                if (!saved) {
                    saved = localStorage.getItem('almar_relevamiento_adm_finanzas_v1');
                }
                if (!saved) return;

                const data = JSON.parse(saved);

                // Restore metadata
                if (data.metadata) {
                    document.querySelectorAll('[data-meta]').forEach(el => {
                        const key = el.getAttribute('data-meta');
                        if (data.metadata[key]) {
                            el.innerText = data.metadata[key];
                        }
                    });
                }

                // Restore answers
                if (data.answers) {
                    document.querySelectorAll('textarea.q-notes-box').forEach(el => {
                        const qid = el.getAttribute('data-qid');
                        if (data.answers[qid] !== undefined) {
                            el.value = data.answers[qid];
                        }
                    });
                }

                // Restore checkboxes
                if (data.checkboxes) {
                    document.querySelectorAll('input[type="checkbox"][data-check]').forEach(el => {
                        const cid = el.getAttribute('data-check');
                        if (data.checkboxes[cid] !== undefined) {
                            el.checked = !!data.checkboxes[cid];
                        }
                    });
                }

                const savedDate = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '';
                updateStatus('🟢 Restaurado de sesión (' + savedDate + ')', '#15803d');
            } catch(e) {
                console.error('Restore error:', e);
            }
        }

        function exportBackupJson() {
            const data = collectFormData();
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = 'ALMAR_Relevamiento_Stefania_' + dateStr + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            updateStatus('💾 JSON Exportado con éxito', '#15803d');
        }

        function importBackupJson(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                    restoreFromStorage();
                    alert('✅ Relevamiento restaurado con éxito desde el archivo JSON.');
                } catch(err) {
                    alert('❌ Error: El archivo no tiene un formato JSON válido.');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        }

        function resetForm() {
            if (confirm('¿Estás seguro de que deseás borrar todas las respuestas de la sesión?')) {
                localStorage.removeItem(STORAGE_KEY);
                document.querySelectorAll('textarea.q-notes-box').forEach(el => el.value = '');
                document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
                updateStatus('⚪ Respuestas restablecidas a cero', '#64748b');
            }
        }

        // Initialize event listeners
        document.addEventListener('DOMContentLoaded', () => {
            restoreFromStorage();

            document.querySelectorAll('textarea.q-notes-box').forEach(el => {
                el.addEventListener('input', queueSave);
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(el => {
                el.addEventListener('change', queueSave);
            });

            document.querySelectorAll('[data-meta]').forEach(el => {
                el.addEventListener('input', queueSave);
            });
        });
    </script>
</body>
</html>`;
}

// 5. Generate Professional DOCX with exact 6 Phases and no organigrama
async function buildDocx() {
  const docChildren = [];

  // Title & Header
  docChildren.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({ text: 'ALMAR ROSARIO S.R.L. — CLAVE CONSULTORES', bold: true, size: 20, color: COLORS.GOLD, font: FONT_TITLE })
      ]
    }),
    new Paragraph({
      spacing: { before: 40, after: 120 },
      children: [
        new TextRun({ text: 'GUÍA DE RELEVAMIENTO DE CAMPO: ADMINISTRACIÓN, FACTURACIÓN Y FINANZAS', bold: true, size: 28, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE })
      ]
    }),
    new Paragraph({
      spacing: { before: 40, after: 200 },
      children: [
        new TextRun({ text: 'Instrumento operativo de diagnóstico, delimitación de procesos bajo metodología ISO 9001:2015 y especificación de solución de software para el proceso de Facturación y Comprobantes.', size: 20, color: COLORS.TEXT, font: FONT_BODY, italics: true })
      ]
    })
  );

  // Metadata Table
  const metaRows = [
    [
      { label: 'Entrevistada:', val: 'Stefania Rossi (Responsable de Facturación)' },
      { label: 'Organización:', val: 'ALMAR Rosario S.R.L.' }
    ],
    [
      { label: 'Relevadores:', val: 'Equipo de Procesos & Sistemas (Clave Consultores)' },
      { label: 'Fecha:', val: new Date().toLocaleDateString('es-AR') }
    ],
    [
      { label: 'Norma Aplicable:', val: 'ISO 9001:2015 § 8.1, § 8.2, § 8.5.1' },
      { label: 'Sistema Base:', val: 'Kipintoch / KipinCARGO' }
    ]
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metaRows.map(r => new TableRow({
      children: r.map(c => new TableCell({
        shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
          left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
          right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
        },
        children: [
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: c.label + ' ', bold: true, size: 19, color: COLORS.GREEN_PRIMARY, font: FONT_BODY }),
              new TextRun({ text: c.val, size: 19, color: COLORS.TEXT, font: FONT_BODY })
            ]
          })
        ]
      }))
    }))
  });

  docChildren.push(metaTable);
  docChildren.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));

  // Add each phase
  PHASES.forEach(phase => {
    // Phase Heading
    docChildren.push(
      new Paragraph({
        spacing: { before: 260, after: 80 },
        children: [
          new TextRun({ text: phase.phaseTitle.toUpperCase(), bold: true, size: 24, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE })
        ]
      })
    );

    // Objective Callout Box
    const objTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: COLORS.GOLD_LIGHT, type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.GOLD }
              },
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({ text: 'OBJETIVO: ', bold: true, size: 19, color: COLORS.GOLD, font: FONT_TITLE }),
                    new TextRun({ text: phase.objective, size: 19, color: COLORS.TEXT, font: FONT_BODY })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
    docChildren.push(objTable);
    docChildren.push(new Paragraph({ spacing: { before: 100, after: 60 }, children: [] }));

    if (phase.phaseNum === 6) {
      // Evidence Checklist Table
      const evRows = phase.sections[0].items.map(it => new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            shading: { fill: COLORS.WHITE, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                  new TextRun({ text: `[  ]  ${it.text}`, bold: true, size: 20, color: COLORS.TEXT, font: FONT_BODY })
                ]
              }),
              new Paragraph({
                spacing: { before: 20, after: 60 },
                children: [
                  new TextRun({ text: `Foco: ${it.tag}`, size: 17, color: COLORS.GOLD, font: FONT_BODY, italics: true })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: 'Notas / Nombre de archivo obtenido:\n\n_________________________________', size: 18, color: COLORS.MUTED, font: FONT_BODY })
                ]
              })
            ]
          })
        ]
      }));

      const evTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: evRows
      });
      docChildren.push(evTable);
    } else {
      // Standard Question Phase
      phase.sections.forEach(sec => {
        docChildren.push(
          new Paragraph({
            spacing: { before: 180, after: 60 },
            children: [
              new TextRun({ text: `■ ${sec.sectionTitle.toUpperCase()}`, bold: true, size: 21, color: COLORS.GREEN_LIGHT, font: FONT_TITLE })
            ]
          })
        );

        sec.questions.forEach(q => {
          const qItems = [
            new Paragraph({
              spacing: { before: 80, after: 40 },
              children: [
                new TextRun({ text: `Pregunta ${q.num}: `, bold: true, size: 20, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE }),
                new TextRun({ text: q.prompt, bold: true, size: 20, color: COLORS.TEXT, font: FONT_BODY })
              ]
            })
          ];

          if (q.probe) {
            qItems.push(
              new Paragraph({
                spacing: { before: 20, after: 40 },
                children: [
                  new TextRun({ text: '  🔍 Repregunta de Foco: ', bold: true, size: 18, color: COLORS.GOLD, font: FONT_BODY }),
                  new TextRun({ text: q.probe.replace(/^Repregunta para buscar la realidad:\s*/, ''), size: 18, color: COLORS.TEXT, font: FONT_BODY, italics: true })
                ]
              })
            );
          }

          if (q.note) {
            qItems.push(
              new Paragraph({
                spacing: { before: 20, after: 40 },
                children: [
                  new TextRun({ text: '  💡 Nota Técnica / ISO: ', bold: true, size: 18, color: COLORS.NAVY, font: FONT_BODY }),
                  new TextRun({ text: q.note, size: 18, color: COLORS.TEXT, font: FONT_BODY })
                ]
              })
            );
          }

          if (q.quickOptions) {
            const optRuns = [];
            q.quickOptions.forEach(opt => {
              optRuns.push(new TextRun({ text: `    [  ] ${opt}    `, size: 17, color: COLORS.MUTED, font: FONT_BODY }));
            });
            qItems.push(
              new Paragraph({
                spacing: { before: 20, after: 40 },
                children: optRuns
              })
            );
          }

          // Shaded Editable Answer Area
          const answerArea = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
                      left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
                      right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 120 },
                        children: [
                          new TextRun({ text: 'Notas y Respuestas de Stefania:\n\n[ Haz clic aquí para escribir las respuestas durante la reunión... ]\n', size: 18, color: COLORS.MUTED, font: FONT_BODY, italics: true })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          });

          qItems.push(answerArea);
          qItems.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }));

          docChildren.push(...qItems);
        });
      });
    }
  });

  // Final Sign-off block in Word
  docChildren.push(
    new Paragraph({
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({ text: 'REGISTRO DE CONFORMIDAD Y CIERRE DE RELEVAMIENTO', bold: true, size: 21, color: COLORS.GREEN_PRIMARY, font: FONT_TITLE })
      ]
    })
  );

  const signoffTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
            },
            children: [
              new Paragraph({
                spacing: { before: 140, after: 40 },
                children: [
                  new TextRun({ text: '_________________________\nStefania Rossi\nAdministración y Facturación', size: 18, color: COLORS.TEXT, font: FONT_BODY, bold: true })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
            },
            children: [
              new Paragraph({
                spacing: { before: 140, after: 40 },
                children: [
                  new TextRun({ text: '_________________________\nFranco Bondino / Consultor\nClave Consultores', size: 18, color: COLORS.TEXT, font: FONT_BODY, bold: true })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            shading: { fill: COLORS.BG_LIGHT, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BORDER }
            },
            children: [
              new Paragraph({
                spacing: { before: 140, after: 40 },
                children: [
                  new TextRun({ text: '_________________________\nJuan Arloro\nDirección — ALMAR Rosario', size: 18, color: COLORS.TEXT, font: FONT_BODY, bold: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  docChildren.push(signoffTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'ALMAR Rosario S.R.L. | Relevamiento de Facturación ISO 9001:2015', size: 16, color: COLORS.MUTED, font: FONT_BODY })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Clave Consultores — Documento Confidencial de Trabajo — Página ', size: 16, color: COLORS.MUTED, font: FONT_BODY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: COLORS.MUTED, font: FONT_BODY })
                ]
              })
            ]
          })
        },
        children: docChildren
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

// 6. Update README
function buildReadme() {
  return `# ALMAR Rosario — Relevamiento de Administración, Facturación y Finanzas

Guía interactiva y digital de relevamiento de campo para el proceso de **Administración, Facturación y Finanzas** de **ALMAR Rosario S.R.L.**, bajo metodología **ISO 9001:2015** (Clave Consultores) y especificación técnica de la solución automatizada de comprobantes.

## 🌐 Aplicación en Vivo (GitHub Pages)
👉 **\`https://FranBondino.github.io/relev-adm/\`**

---

## ⚡ Estructura Canónica de Relevamiento (6 Fases)

1. **FASE 1: Encuadre y Límites del Proceso (Marco ISO con Clave)**
   - *1.1 El Disparador Real (Inicio):* Gatillador exacto entre arribo y facturación.
   - *1.2 El Límite Final:* Frontera entre emisión, envío y cobranza en banco.
   - *1.3 Actividades Excluidas (Fronteras):* Tratamiento de reclamos navieros y comerciales.

2. **FASE 2: Desarmando el Caso Ideal (Búsqueda de Fallas y Riesgos ISO 6.1)**
   - *2.1 Urgencia del Cliente vs. Falta de Facturas de Costos:* Dilema operativo ante demoras navieras.
   - *2.2 Autopsia del Último Problema (Notas de Crédito):* Causa raíz de anulaciones y refacturaciones.
   - *2.3 Comprobantes Extemporáneos ("Los costos olvidados"):* Imputación de gastos tardíos.

3. **FASE 3: El Núcleo de la Solución de Software (Comprobantes, OCR y Desvíos)**
   - *3.1 Canales de Ingesta:* Casillas de correo y portales navieros.
   - *3.2 Top Proveedores y Monedas:* El 80% de comprobantes y manejo USD / ARS BNA.
   - *3.3 Matching Comprobante ↔ Carpeta:* Prioridad Booking, HBL, Contenedor y Cliente.
   - *3.4 Facturas Multicarpeta:* Casos de comprobantes compartidos vs 1 a 1.
   - *3.5 Consulta del Costo Presupuestado:* Pantalla de KipinCARGO vs Cotización.
   - *3.6 Tolerancia en Desvíos:* Umbral verde/amarillo/rojo para aprobación automática.
   - *3.7 Recargos Sorpresa:* Demurrages, lavado, peajes y seguros no presupuestados.
   - *3.8 Autoridad de Aprobación:* Matriz de autorizaciones (Operaciones, Finanzas, Dirección).
   - *3.9 Destino del Sobrecosto:* Traslado a prefactura o absorción contra margen.
   - *3.10 Bloqueo Preventivo:* Modal de justificación obligatoria ISO antes del pago.

4. **FASE 4: Ergonomía de Carga en Kipintoch (Módulo Carga Asistida / 1-Click Copy)**
   - *4.1 Secuencia de Carga:* Pto Venta (5d) ➔ Nro Comp (8d) ➔ CUIT ➔ CAE ➔ Fechas ➔ Neto ➔ IVA ➔ No Gravado ➔ Percepciones.
   - *4.2 Tipo de Cambio BNA:* Cotización automática vs tipeo manual.

5. **FASE 5: Clientes Especiales y Circuito Informal (El "Camino Negro")**
   - *5.1 Cuentas con "Alfombra Roja":* Excepciones de crédito y canje de HBL sin pago previo.
   - *5.2 Facturación Consolidada:* Liquidaciones mensuales unificadas.
   - *5.3 Instrucciones Verbales y WhatsApp:* Gestión de acuerdos no registrados.
   - *5.4 Comprobantes Informales:* Fotos de WhatsApp y remitos en papel.

6. **FASE 6: Cierre Táctico y Evidencias de Campo**
   - *Checklist de evidencias:* PDF limpio MSC/Maersk, PDF con desvío sorpresa, captura de KipinCARGO y caso real de liquidación en pesos.

---

## 💾 Persistencia y Uso en Campo
- **Autoguardado en tiempo real (\`localStorage\`):** Las notas, respuestas y casillas se graban automáticamente a medida que se tipea. No se pierden datos si se cierra el navegador.
- **Exportar / Importar JSON:** Permite respaldar la sesión en un archivo o transferirla a otra computadora.
- **Imprimir / PDF:** Modo de impresión optimizado para hojas A4 ejecutivas.
`;
}

// 7. Execution Pipeline
async function run() {
  console.log('🚀 Iniciando compilación de Relevamiento v2 (6 Fases sin organigrama)...');

  // 1. Generate HTML
  const htmlContent = buildHtml();
  const repoHtmlPath = path.join(REPO_DIR, 'index.html');
  const dlHtmlPath = path.join(DOWNLOADS_DIR, 'ALMAR - Guia de Relevamiento Administracion y Facturacion - Clave.html');
  fs.writeFileSync(repoHtmlPath, htmlContent, 'utf8');
  fs.writeFileSync(dlHtmlPath, htmlContent, 'utf8');
  console.log('✅ HTML guardado en:', repoHtmlPath);

  // 2. Generate DOCX
  const docxBuffer = await buildDocx();
  const repoDocxPath = path.join(REPO_DIR, 'ALMAR - Guia de Relevamiento Administracion y Facturacion - Clave.docx');
  const dlDocxPath = path.join(DOWNLOADS_DIR, 'ALMAR - Guia de Relevamiento Administracion y Facturacion - Clave.docx');
  fs.writeFileSync(repoDocxPath, docxBuffer);
  fs.writeFileSync(dlDocxPath, docxBuffer);
  console.log('✅ DOCX guardado en:', repoDocxPath, `(${docxBuffer.length} bytes)`);

  // 3. Generate README
  const readmeContent = buildReadme();
  const repoReadmePath = path.join(REPO_DIR, 'README.md');
  fs.writeFileSync(repoReadmePath, readmeContent, 'utf8');
  console.log('✅ README guardado en:', repoReadmePath);

  // Remove diagram from repo if present to keep repo clean
  const diagramPath = path.join(REPO_DIR, 'diagrama_actores_facturacion.png');
  if (fs.existsSync(diagramPath)) {
    fs.unlinkSync(diagramPath);
    console.log('🗑️ Diagrama eliminado del repositorio.');
  }

  console.log('🏁 Compilación finalizada exitosamente.');
}

run().catch(err => {
  console.error('❌ Error en compilación:', err);
  process.exit(1);
});
