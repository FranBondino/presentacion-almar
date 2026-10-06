const fs = require('fs');
const path = require('path');

// Read logo from INFORME_COTIZACIONES_ALMAR_2026.html if available
let logoBase64 = '';
try {
  const origHtml = fs.readFileSync('INFORME_COTIZACIONES_ALMAR_2026.html', 'utf8');
  const m = origHtml.match(/<img[^>]+class="cover-logo"[^>]+src="(data:image\/png;base64,[^"]+)"/);
  if (m) logoBase64 = m[1];
} catch(e) {}

// Read diagram image
let diagramBase64 = '';
try {
  if (fs.existsSync('diagrama_actores_facturacion.png')) {
    const dBuf = fs.readFileSync('diagrama_actores_facturacion.png');
    diagramBase64 = 'data:image/png;base64,' + dBuf.toString('base64');
  }
} catch(e) {}

const ALL_QUESTIONS = [
  // BLOQUE 1
  {
    block: "Bloque 1: Disparador e Inicio de Facturación (Hand-off Operaciones -> Stefania)",
    num: "1",
    tag: "Canales y Latencia",
    q: "¿Cuál es el hecho exacto y el canal por el que te enterás de que una carpeta está lista para ser facturada?",
    obj: "Identificar el gatillador real y el tiempo de latencia entre arribo de carga y facturación.",
    probe: "¿Te llega un correo del operativo, te salta una notificación en Kipintoch, te avisan por WhatsApp o vos tenés que entrar a revisar buques arribados a mano?"
  },
  {
    block: "Bloque 1: Disparador e Inicio de Facturación (Hand-off Operaciones -> Stefania)",
    num: "2",
    tag: "Requisitos de Entrada",
    q: "¿Qué documentación mínima y qué datos en la carpeta necesitás tener sí o sí antes de empezar a confeccionar la factura?",
    obj: "Definir los campos de validación obligatoria en el software antes de habilitar la acción de facturar.",
    probe: "¿Qué pasa si falta algún dato o comprobante? ¿Facturás igual o la carpeta queda frenada?"
  },
  {
    block: "Bloque 1: Disparador e Inicio de Facturación (Hand-off Operaciones -> Stefania)",
    num: "3",
    tag: "Facturación Parcial",
    q: "Si falta algún comprobante local menor (ej. peaje o seguro), ¿frenás la emisión completa o facturás una parte (flete internacional) y después los gastos locales?",
    obj: "Determinar si el sistema debe soportar facturación parcial o por tramos en una misma carpeta.",
    probe: "¿El cliente acepta dos facturas separadas o exige un único comprobante consolidado con todos los conceptos?"
  },

  // BLOQUE 2
  {
    block: "Bloque 2: Desarmando el Caso Ideal y Gestión de Riesgos (ISO 6.1)",
    num: "4",
    tag: "Riesgo Operativo",
    q: "¿Qué hacés cuando la carga ya llegó al puerto, el cliente necesita urgente el canje para despachar, pero la naviera NO mandó la factura todavía?",
    obj: "Mapear la gestión de la urgencia vs el riesgo de facturar a ciegas sin costos reales.",
    probe: "¿Facturás con el costo estimado que cotizó Pricing, o frenás la entrega del HBL hasta tener la factura real?"
  },
  {
    block: "Bloque 2: Desarmando el Caso Ideal y Gestión de Riesgos (ISO 6.1)",
    num: "5",
    tag: "Calidad y No Conformidades",
    q: "¿Cuál fue la última factura que tuviste que anular o hacerle Nota de Crédito en el último mes y cuál fue la causa raíz?",
    obj: "Detectar los errores sistemáticos de carga o discrepancias comerciales.",
    probe: "¿Ocurrió por error de tipeo de datos fiscales, por reclamo de tarifa del cliente, o por diferencia en el tipo de cambio?"
  },
  {
    block: "Bloque 2: Desarmando el Caso Ideal y Gestión de Riesgos (ISO 6.1)",
    num: "6",
    tag: "Costos Extemporáneos",
    q: "¿Ocurre que una carpeta ya esté cerrada y cobrada, y un mes o dos después cae una factura de un fletero, depósito o peaje no previsto?",
    obj: "Detectar costos extemporáneos y cómo impactan en la rentabilidad real.",
    probe: "¿A quién se le imputa esa pérdida? ¿Se le puede refacturar al cliente o la absorbe ALMAR?"
  },

  // BLOQUE 3
  {
    block: "Bloque 3: Ingesta de Facturas de Proveedores, Formatos y OCR",
    num: "7",
    tag: "OCR / Ingesta",
    q: "¿Por qué vía recibís las facturas de proveedores y qué 4 o 5 empresas concentran el 80% de tus comprobantes?",
    obj: "Calibrar el motor de lectura OCR y los conectores automáticos de correo.",
    probe: "¿Entran a tu casilla personal, a una general, o tenés que entrar con usuario y clave a las webs de Maersk/MSC a bajarlas?"
  },
  {
    block: "Bloque 3: Ingesta de Facturas de Proveedores, Formatos y OCR",
    num: "8",
    tag: "Concentración Proveedores",
    q: "¿Cuáles son las 4 o 5 navieras o proveedores que representan el 80% de tus comprobantes de costos?",
    obj: "Garantizar compatibilidad de parsers para MSC, Maersk, Hapag, Cosco y depósitos.",
    probe: "¿Tienen formatos estables en PDF o cambian según la agencia marítima que intervenga?"
  },
  {
    block: "Bloque 3: Ingesta de Facturas de Proveedores, Formatos y OCR",
    num: "9",
    tag: "Multimoneda y ARS",
    q: "¿Cómo vienen expresadas las monedas en esos comprobantes de proveedores?",
    obj: "Manejo de facturación multimoneda (USD / ARS) y liquidaciones mixtas en el motor contable.",
    probe: "¿Vienen en USD puro, en ARS, o facturas en USD liquidadas en pesos al BNA con conceptos gravados y no gravados?"
  },

  // BLOQUE 4
  {
    block: "Bloque 4: Matching Predictivo (Comprobante -> Carpeta KipinCARGO)",
    num: "10",
    tag: "Matching de Carpetas",
    q: "Cuando abrís el PDF de una factura de naviera, ¿qué dato mirás primero para saber a qué carpeta de ALMAR pertenece?",
    obj: "Definir los algoritmos de búsqueda y coincidencia automática en el software.",
    probe: "¿Viene el Booking, el HBL, el número de contenedor o el nombre del cliente? ¿Qué campo tiene mayor efectividad?"
  },
  {
    block: "Bloque 4: Matching Predictivo (Comprobante -> Carpeta KipinCARGO)",
    num: "11",
    tag: "Facturas Multicarpeta",
    q: "¿Existen facturas multicarpeta (por ejemplo, una naviera o camión que factura 3 contenedores de distintos clientes en un solo PDF)?",
    obj: "Definir si el sistema debe permitir prorrateo y asociación 1 a N de comprobantes contra carpetas.",
    probe: "¿Cómo prorrateás los costos compartidos como el handling o peajes entre los clientes afectados?"
  },

  // BLOQUE 5
  {
    block: "Bloque 5: Detección de Desvíos, Sobrecostos y Tolerancia (Semáforo de Alertas)",
    num: "12",
    tag: "Fuente de la Verdad",
    q: "¿Dónde comparás lo que cobró la naviera contra lo presupuestado para esa operación?",
    obj: "Identificar la fuente de la verdad para el algoritmo de comparación de costos.",
    probe: "¿Entrás a la pantalla de costos de la carpeta en Kipintoch, o te fijás en una planilla Excel o mail de cotizaciones?"
  },
  {
    block: "Bloque 5: Detección de Desvíos, Sobrecostos y Tolerancia (Semáforo de Alertas)",
    num: "13",
    tag: "Umbral de Tolerancia",
    q: "¿Cuál es la tolerancia aceptable antes de considerar que un costo tiene un desvío y frenar la operación?",
    obj: "Configurar los umbrales de alerta del semáforo preventivo en el Kanban.",
    probe: "Si la naviera factura USD 5 o USD 10 más por redondeo, ¿se aprueba sola o requiere aviso formal?"
  },
  {
    block: "Bloque 5: Detección de Desvíos, Sobrecostos y Tolerancia (Semáforo de Alertas)",
    num: "14",
    tag: "Recargos no Cotizados",
    q: "¿Cuáles son los recargos sorpresa no previstos que más cobran las navieras y terceros que nunca están en la cotización?",
    obj: "Clasificar automáticamente los conceptos de desvío en el modal de autorización ISO.",
    probe: "¿Demurrage/estadías, lavado de contenedor, peajes de hidrovía, seguro local, handling, diferencias de BAF?"
  },

  // BLOQUE 6
  {
    block: "Bloque 6: Protocolo y Gobernanza de Aprobación de Desvíos (Modal ISO 9001)",
    num: "15",
    tag: "Autorizaciones ISO",
    q: "Si una factura viene con USD 300 de sobrecosto: ¿quién tiene la autoridad formal para autorizar que se pague igual?",
    obj: "Mapear los niveles de autorización en el modal de desvíos de la aplicación.",
    probe: "¿Lo autoriza Natali Hermoso (Ops), Vanesa Meggiolaro (Finanzas) o Juan Arloro? ¿Depende del monto del desvío?"
  },
  {
    block: "Bloque 6: Protocolo y Gobernanza de Aprobación de Desvíos (Modal ISO 9001)",
    num: "16",
    tag: "Tratamiento Económico",
    q: "¿Qué se hace formalmente con ese sobrecosto aprobado?",
    obj: "Definir si el sobrecosto se traslada a la factura de venta o se absorbe contra el margen.",
    probe: "¿Se le traslada al cliente en una prefactura / nota de débito, o ALMAR absorbe la pérdida comiéndose el margen?"
  },
  {
    block: "Bloque 6: Protocolo y Gobernanza de Aprobación de Desvíos (Modal ISO 9001)",
    num: "17",
    tag: "Bloqueo Preventivo",
    q: "¿Te serviría que el sistema bloquee preventivamente el comprobante y no lo deje pasar a pago hasta que el responsable ponga la justificación y le dé 'Autorizar'?",
    obj: "Validar directamente el feature de Kanban Deviation Lock.",
    probe: "¿Cómo evitarías que el bloqueo frene una urgencia operativa en el puerto?"
  },

  // BLOQUE 7
  {
    block: "Bloque 7: Carga Asistida en Kipintoch (Ergonomía 1-Click Copy)",
    num: "18",
    tag: "Observación en Vivo",
    q: "Observación en Vivo: ¿Nos mostrás 3 minutos cómo cargás una factura de proveedor en la pantalla de Kipintoch?",
    obj: "Mapear el orden exacto de campos para configurar la secuencia de teclas / 1-Click Copy.",
    probe: "¿Cuáles son los pasos obligatorios desde que abrís la pantalla de compras hasta que el comprobante queda guardado?"
  },
  {
    block: "Bloque 7: Carga Asistida en Kipintoch (Ergonomía 1-Click Copy)",
    num: "19",
    tag: "Campos Fiscales",
    q: "¿Cuál es la secuencia exacta de campos y cuáles son los más engorrosos de tipear a mano?",
    obj: "Calibrar la botonera y los atajos de teclado del panel de carga asistida.",
    probe: "¿Punto de venta (5 dígitos), Nro comprobante (8 dígitos), CUIT, CAE, Fecha emisión, Gravado 21%, No gravado, Percepciones?"
  },
  {
    block: "Bloque 7: Carga Asistida en Kipintoch (Ergonomía 1-Click Copy)",
    num: "20",
    tag: "Tipo de Cambio en Kipin",
    q: "Al cargar una factura en dólares en Kipintoch, ¿el sistema calcula el tipo de cambio oficial BNA solo o lo tipeás a mano?",
    obj: "Sincronización cambiaria y prevención de errores manuales.",
    probe: "¿Qué cotización BNA se toma? ¿Comprador o vendedor? ¿Del día de la factura o del día en que se carga en el sistema?"
  },

  // BLOQUE 8
  {
    block: "Bloque 8: Clientes Especiales ('Alfombra Roja', Cuentas Corrientes y Riesgo)",
    num: "21",
    tag: "Entrega sin Pago",
    q: "Con clientes de 'alfombra roja' (ej. Acindar, Secco): ¿se les entrega el HBL / canje antes de que paguen?",
    obj: "Riesgo crediticio y trazabilidad de excepciones.",
    probe: "¿Quién autoriza por escrito o de palabra esa excepción de entrega sin pago previo?"
  },
  {
    block: "Bloque 8: Clientes Especiales ('Alfombra Roja', Cuentas Corrientes y Riesgo)",
    num: "22",
    tag: "Facturación Consolidada",
    q: "¿Hay clientes a los que no se les factura por carpeta individual sino con factura mensual consolidada por 10 o 15 embarques juntos?",
    obj: "Mapear la funcionalidad de facturación agrupada o consolidada.",
    probe: "¿Cómo controlás que no se te escape ningún costo de esas 15 carpetas al momento de liquidar a fin de mes?"
  },
  {
    block: "Bloque 8: Clientes Especiales ('Alfombra Roja', Cuentas Corrientes y Riesgo)",
    num: "23",
    tag: "Plazos y Crédito",
    q: "¿Tienen clientes con plazos de pago a 30, 60 o 90 días?",
    obj: "Gestión del riesgo por devaluación y descalce financiero.",
    probe: "¿Cómo se fija el tipo de cambio al cobrar? ¿Se emite en pesos con pagaré o en dólares con Nota de Débito por diferencia de cambio?"
  },

  // BLOQUE 9
  {
    block: "Bloque 9: El Circuito Informal (WhatsApp, Teléfono y Acuerdos de Palabra)",
    num: "24",
    tag: "Descuentos por WhatsApp",
    q: "Cuando un comercial (Lucía, Martín, Ale) o un socio (Juan) negocia un descuento verbal de último momento: ¿dónde queda registrado?",
    obj: "Eliminar la pérdida de información en WhatsApp y chats personales.",
    probe: "¿Te mandan un WhatsApp diciendo 'Cobrale USD 50 menos que se lo prometí'? ¿Dónde guardás esa constancia para no tener problemas después?"
  },
  {
    block: "Bloque 9: El Circuito Informal (WhatsApp, Teléfono y Acuerdos de Palabra)",
    num: "25",
    tag: "Sobrecostos de Palabra",
    q: "Si el camión o la naviera cobró una estadía o peaje extra y el cliente aceptó pagarlo por teléfono: ¿cómo te enterás vos para sumarlo a la factura?",
    obj: "Garantizar que todo gasto recuperable se facture efectivamente al cliente.",
    probe: "¿Qué pasa si el operativo se olvida de avisarte y la factura de venta ya se emitió?"
  },
  {
    block: "Bloque 9: El Circuito Informal (WhatsApp, Teléfono y Acuerdos de Palabra)",
    num: "26",
    tag: "Comprobantes Informales",
    q: "¿Te llegan comprobantes como fotos de WhatsApp enviadas por fleteros o papeles que trae el cadete?",
    obj: "Canalizar comprobantes físicos y móviles hacia la bandeja centralizada.",
    probe: "¿Cómo se archivan hoy esos comprobantes para que queden vinculados a la carpeta contable?"
  },

  // BLOQUE 10
  {
    block: "Bloque 10: Finanzas, Descalce Cambiario y Margen Crítico (< USD 200)",
    num: "27",
    tag: "Descalce USD / ARS",
    q: "¿Cómo vivís la trampa del margen en dólares al pasarse a pesos con las retenciones de AFIP, Sircreb e impuestos bancarios?",
    obj: "Validar el dolor financiero planteado por Vanesa Meggiolaro.",
    probe: "¿Te pasó que una operación que dejaba USD 80 de ganancia terminó en pérdida neta en pesos al liquidar impuestos y comisiones?"
  },
  {
    block: "Bloque 10: Finanzas, Descalce Cambiario y Margen Crítico (< USD 200)",
    num: "28",
    tag: "Alerta Margen < $200",
    q: "¿Te serviría que el sistema tenga un semáforo rojo que alerte preventivamente si el margen proyectado es menor a USD 200 en marítimo antes de facturar?",
    obj: "Validar el umbral paramétrico de alerta temprana en la aplicación.",
    probe: "¿Qué harías cuando salta esa alerta? ¿Revisar costos con Vanesa o renegociar con el cliente?"
  },
  {
    block: "Bloque 10: Finanzas, Descalce Cambiario y Margen Crítico (< USD 200)",
    num: "29",
    tag: "Momento de Facturar",
    q: "¿En qué momento exacto emitís la factura de venta al cliente?",
    obj: "Equilibrio entre cobrar rápido y tener certeza de costos.",
    probe: "¿Apenas sale el buque / aviso de arribo (para cobrar antes), o esperás a tener todas las facturas de proveedores para no errarle al costo real?"
  },

  // BLOQUE 11
  {
    block: "Bloque 11: Emisión Fiscal AFIP, Cobranzas y Cierre Definitivo",
    num: "30",
    tag: "Moneda y Aviso de Pago",
    q: "¿Cómo se emite la factura al cliente (USD con leyenda BNA o pesos directos) y quién le comunica el importe exacto a transferir?",
    obj: "Trazabilidad en la comunicación de cobranza.",
    probe: "¿Se le manda un correo con la liquidación y la cuenta bancaria, o se coordina por WhatsApp?"
  },
  {
    block: "Bloque 11: Emisión Fiscal AFIP, Cobranzas y Cierre Definitivo",
    num: "31",
    tag: "Gestión de Mora",
    q: "¿Qué reporte o pantalla de Kipintoch usás para hacer el seguimiento de cobranzas de clientes morosos?",
    obj: "Diseñar el módulo de cuentas corrientes en la solución.",
    probe: "¿Quién llama al cliente que no paga? ¿A partir de cuántos días de atraso se bloquean nuevos embarques en Operaciones?"
  },
  {
    block: "Bloque 11: Emisión Fiscal AFIP, Cobranzas y Cierre Definitivo",
    num: "32",
    tag: "Cierre Contable Definitivo",
    q: "¿Cuándo considerás que una carpeta está 100% CERRADA a nivel administrativo y contable?",
    obj: "Definir el evento de cierre definitivo de ciclo de vida de la entidad Carpeta.",
    probe: "¿Cuando el saldo del cliente está en cero y todos los proveedores cobraron, o hay un cierre contable mensual posterior?"
  }
];

let currentBlock = '';
let questionsHtml = '';

ALL_QUESTIONS.forEach(item => {
  if (item.block !== currentBlock) {
    currentBlock = item.block;
    questionsHtml += `<h3 class="sub-heading" style="margin-top: 30px; margin-bottom: 14px; font-size:1.05rem; border-left: 4px solid var(--clave-gold); padding-left: 10px;">${currentBlock}</h3>\n`;
  }
  questionsHtml += `
    <div class="q-card">
        <div class="q-header">
            <span class="q-number">Pregunta ${item.num}</span>
            <span class="q-tag">${item.tag}</span>
        </div>
        <div class="q-text">${item.q}</div>
        <div class="q-objective">Objetivo: <em>${item.obj}</em></div>
        <div class="q-probe">Repregunta Metodológica: ${item.probe}</div>
        <textarea class="q-notes-box" placeholder="Notas de la respuesta de Stefania (escribí aquí)..."></textarea>
    </div>
  `;
});

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ALMAR Rosario — Relevamiento Completo Administración, Facturación y Finanzas (Clave Consultora)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --clave-green: #1e3d2f;
            --clave-green-light: #2c5442;
            --clave-green-dark: #13271e;
            --clave-gold: #c29320;
            --clave-gold-light: #fefcf5;
            --clave-gold-border: #eedaa2;
            --clave-navy: #081433;
            --clave-border: #e2e8f0;
            --clave-muted: #64748b;
            --clave-bg-light: #f8fafc;
            --clave-text: #1e293b;
            --success-green: #059669;
            --danger-red: #e11d48;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: #f1f5f9;
            font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: var(--clave-text);
            font-size: 13.5px;
            line-height: 1.5;
            padding: 30px 15px;
        }

        .document-container {
            max-width: 960px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 40px 50px;
        }

        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            .document-container {
                box-shadow: none;
                padding: 20px;
                max-width: 100%;
            }
            .no-print {
                display: none !important;
            }
            .q-notes-box {
                border-color: #cbd5e1 !important;
                background: transparent !important;
                min-height: 70px !important;
            }
        }

        /* Top Bar */
        .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--clave-green);
            padding-bottom: 12px;
            margin-bottom: 25px;
        }

        .doc-header .logo-area img {
            max-height: 48px;
            width: auto;
        }

        .doc-header .doc-meta {
            text-align: right;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.75rem;
            color: var(--clave-muted);
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .doc-header .doc-meta span {
            color: var(--clave-gold);
            font-weight: 700;
        }

        /* Title Area */
        .title-block {
            text-align: center;
            margin-bottom: 30px;
        }

        .pill-badge {
            display: inline-block;
            background-color: var(--clave-gold-light);
            color: var(--clave-green);
            border: 1.5px solid var(--clave-gold);
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 0.75rem;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            padding: 4px 16px;
            border-radius: 20px;
            margin-bottom: 12px;
        }

        .main-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.65rem;
            font-weight: 800;
            color: var(--clave-green);
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            line-height: 1.25;
        }

        .sub-title {
            font-size: 0.95rem;
            color: var(--clave-muted);
            font-weight: 500;
        }

        /* Metadata Grid */
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background-color: var(--clave-gold-light);
            border: 1px solid var(--clave-gold-border);
            padding: 16px 20px;
            border-radius: 6px;
            margin-bottom: 25px;
        }

        .meta-item strong {
            display: block;
            color: var(--clave-green);
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.72rem;
            margin-bottom: 2px;
        }

        .meta-item span {
            font-size: 0.88rem;
            color: var(--clave-text);
        }

        /* Callout Box */
        .callout-box {
            background-color: #f0fdf4;
            border-left: 4px solid var(--clave-green);
            padding: 14px 18px;
            border-radius: 4px;
            margin-bottom: 30px;
            font-size: 0.88rem;
        }

        .callout-box strong {
            color: var(--clave-green);
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.75rem;
            display: block;
            margin-bottom: 4px;
        }

        /* Headings */
        h2.section-heading {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--clave-green);
            border-bottom: 2px solid var(--clave-border);
            padding-bottom: 6px;
            margin: 35px 0 16px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        h2.section-heading::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 22px;
            background-color: var(--clave-gold);
            border-radius: 2px;
        }

        h3.sub-heading {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.98rem;
            font-weight: 700;
            color: var(--clave-green-light);
            margin: 22px 0 10px 0;
        }

        /* Tables */
        table.clave-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 0.85rem;
        }

        table.clave-table th {
            background-color: var(--clave-green);
            color: #ffffff;
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 0.74rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 9px 12px;
            text-align: left;
            border-top: 1px solid var(--clave-green);
            border-bottom: 2px solid var(--clave-gold);
        }

        table.clave-table td {
            padding: 8px 12px;
            border-bottom: 1px solid var(--clave-border);
            color: var(--clave-text);
            vertical-align: top;
        }

        table.clave-table tr:nth-child(even) td {
            background-color: var(--clave-bg-light);
        }

        /* Enhanced Diagram Box */
        .diagram-container {
            background-color: #0b1329;
            border: 2px solid var(--clave-gold);
            border-radius: 8px;
            padding: 20px;
            margin: 22px 0 28px 0;
            text-align: center;
            box-shadow: 0 6px 18px rgba(0,0,0,0.18);
        }

        .diagram-container img {
            width: 100%;
            max-width: 860px;
            height: auto;
            border-radius: 4px;
            display: block;
            margin: 0 auto;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }

        .diagram-caption {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.78rem;
            color: #cbd5e1;
            margin-top: 12px;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        /* Question Cards */
        .q-card {
            background: #ffffff;
            border: 1px solid var(--clave-border);
            border-left: 4px solid var(--clave-green);
            border-radius: 6px;
            padding: 14px 18px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .q-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;
        }

        .q-number {
            font-family: 'Montserrat', sans-serif;
            font-weight: 800;
            color: var(--clave-green);
            font-size: 0.92rem;
        }

        .q-tag {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            background: var(--clave-gold-light);
            color: var(--clave-gold);
            border: 1px solid var(--clave-gold-border);
            padding: 2px 8px;
            border-radius: 12px;
            text-transform: uppercase;
        }

        .q-text {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--clave-text);
            margin-bottom: 8px;
        }

        .q-objective {
            font-size: 0.82rem;
            color: var(--clave-muted);
            margin-bottom: 4px;
        }

        .q-objective em {
            color: var(--clave-text);
        }

        .q-probe {
            font-size: 0.84rem;
            color: var(--clave-green-light);
            background: #f8fafc;
            padding: 6px 10px;
            border-radius: 4px;
            border-left: 2px solid var(--clave-gold);
            margin-bottom: 10px;
        }

        .q-notes-box {
            width: 100%;
            min-height: 52px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            background-color: #fafafa;
            padding: 8px 12px;
            font-family: inherit;
            font-size: 0.88rem;
            color: #1e293b;
            outline: none;
            resize: vertical;
        }

        .q-notes-box:focus {
            background-color: #ffffff;
            border-color: var(--clave-green);
            box-shadow: 0 0 0 2px rgba(30, 61, 47, 0.1);
        }

        /* Checklist */
        .check-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 10px;
            font-size: 0.88rem;
        }

        .check-item input[type="checkbox"] {
            margin-top: 3px;
            accent-color: var(--clave-green);
            width: 16px;
            height: 16px;
        }

        /* Signatures */
        .sig-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--clave-border);
        }

        .sig-box {
            text-align: center;
        }

        .sig-line {
            border-bottom: 1px solid var(--clave-muted);
            margin-bottom: 8px;
            height: 40px;
        }

        .sig-label {
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--clave-green);
            text-transform: uppercase;
            font-family: 'Montserrat', sans-serif;
        }

        .sig-sub {
            font-size: 0.75rem;
            color: var(--clave-muted);
        }

        /* Floating Bar */
        .floating-action-bar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }

        .btn-action {
            background: var(--clave-green);
            color: #ffffff;
            border: none;
            padding: 10px 18px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 0.82rem;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }

        .btn-action:hover {
            background: var(--clave-green-light);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>

    <div class="floating-action-bar no-print">
        <button class="btn-action" onclick="window.print()">
            🖨️ Imprimir / Guardar en PDF
        </button>
    </div>

    <div class="document-container">
        
        <!-- Header -->
        <div class="doc-header">
            <div class="logo-area">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Clave Consultora" />` : '<strong style="color:var(--clave-green); font-size:1.1rem; font-family:Montserrat;">CLAVE CONSULTORA</strong>'}
            </div>
            <div class="doc-meta">
                ALMAR ROSARIO S.R.L. &bull; SISTEMA ISO 9001:2015<br>
                <span>FICHA PA.04 / PO.03 &bull; REV. 00 BORRADOR</span>
            </div>
        </div>

        <!-- Title Block -->
        <div class="title-block">
            <span class="pill-badge">Instrumento de Relevamiento de Campo</span>
            <h1 class="main-title">Guía Integral de Relevamiento y Validación de Software</h1>
            <p class="sub-title">Proceso de Administración, Facturación y Control Financiero de Operaciones (32 Preguntas)</p>
        </div>

        <!-- Metadata Grid -->
        <div class="meta-grid">
            <div class="meta-item">
                <strong>Empresa / Unidad</strong>
                <span>ALMAR ROSARIO S.R.L.</span>
            </div>
            <div class="meta-item">
                <strong>Código de Proceso</strong>
                <span>PA.04 / PO.03 (A homologar con Clave)</span>
            </div>
            <div class="meta-item">
                <strong>Entrevistada Principal</strong>
                <span>Stefania Rossi (Administración, Facturación & Cobranzas)</span>
            </div>
            <div class="meta-item">
                <strong>Supervisión de Finanzas</strong>
                <span>Vanesa Meggiolaro (Socia / Finanzas y Rentabilidad)</span>
            </div>
            <div class="meta-item">
                <strong>Equipo de Relevamiento</strong>
                <span>Francisco Bondino + Consultores de Clave</span>
            </div>
            <div class="meta-item">
                <strong>Fecha y Estado</strong>
                <span>25 de Septiembre de 2026 &bull; Formato Editable en Sala</span>
            </div>
        </div>

        <!-- Callout Alert -->
        <div class="callout-box">
            <strong>Instrucciones Metodológicas de Trabajo</strong>
            Relevar la <strong>práctica real</strong> y no el "deber ser" de manual. Registrar estados: <code>[CONFIRMADO]</code> con evidencia, <code>[A VALIDAR]</code> si requiere chequear otra fuente, y <code>[BRECHA]</code> si el control o registro hoy no existe.
        </div>

        <!-- Section 1 -->
        <h2 class="section-heading">1. Ficha Metodológica de Proceso (ISO 9001:2015)</h2>
        <p style="margin-bottom:12px; color:var(--clave-muted);">Estructura canónica de la ficha simplificada bajo la metodología de Clave Consultores:</p>

        <table class="clave-table">
            <thead>
                <tr>
                    <th style="width:25%;">Elemento del Proceso</th>
                    <th style="width:45%;">Definición Propuesta</th>
                    <th style="width:30%;">Validación / Notas de Stefania</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Objetivo del Proceso</strong></td>
                    <td>Asegurar la facturación oportuna y correcta de los servicios, el control preventivo de costos y sobreprecios de proveedores, la gestión de cobranzas y la preservación del margen económico.</td>
                    <td contenteditable="true" style="color:var(--clave-muted);">Hacé clic para escribir...</td>
                </tr>
                <tr>
                    <td><strong>Disparador / Inicio</strong></td>
                    <td>Aviso de embarque / confirmación de arribo de carga / instrucción formal de facturar transferida desde Operaciones.</td>
                    <td contenteditable="true" style="color:var(--clave-muted);">Hacé clic para escribir...</td>
                </tr>
                <tr>
                    <td><strong>Límite Final</strong></td>
                    <td>Cobranza efectiva registrada en banco, emisión de recibo y cierre económico de la carpeta en KipinCARGO.</td>
                    <td contenteditable="true" style="color:var(--clave-muted);">Hacé clic para escribir...</td>
                </tr>
                <tr>
                    <td><strong>Actividades Incluidas</strong></td>
                    <td>Recepción de instrucción; cotejo de comprobantes navieros vs presupuesto; emisión de prefactura; facturación fiscal AFIP; seguimiento de cobranzas; registro de pagos en Kipin.</td>
                    <td contenteditable="true" style="color:var(--clave-muted);">Hacé clic para escribir...</td>
                </tr>
                <tr>
                    <td><strong>Actividades Excluidas</strong></td>
                    <td>Coordinación aduanera directa (Operaciones); reclamos por siniestros de carga; negociación de tarifas comerciales (Comercial).</td>
                    <td contenteditable="true" style="color:var(--clave-muted);">Hacé clic para escribir...</td>
                </tr>
            </tbody>
        </table>

        <h3 class="sub-heading">Esquema SIPOC (Matriz de Interacciones Críticas)</h3>
        <table class="clave-table">
            <thead>
                <tr>
                    <th>Proveedores</th>
                    <th>Entradas Críticas</th>
                    <th>Etapas Macro</th>
                    <th>Salidas Críticas</th>
                    <th>Receptores</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Operaciones</strong><br>(Natali, Aldana, Cecilia)</td>
                    <td>Carpetas cerradas, HBL, Booking, avisos de arribo.</td>
                    <td rowspan="4" style="background:#f8fafc; font-size:0.8rem; line-height:1.6;">
                        1. Recepción y control<br>
                        2. Cotejo costos vs cotizado<br>
                        3. Prefactura y validación BNA<br>
                        4. Facturación fiscal AFIP<br>
                        5. Carga comprobantes Kipin<br>
                        6. Cobranza y conciliación
                    </td>
                    <td>Facturas fiscales A, B, E.</td>
                    <td><strong>Clientes ALMAR</strong></td>
                </tr>
                <tr>
                    <td><strong>Navieras / Depósitos</strong><br>(MSC, Maersk, Exolgan)</td>
                    <td>Facturas de flete, peajes, THC, desconsolidación.</td>
                    <td>Reportes de desvíos y sobrecostos aprobados.</td>
                    <td><strong>Vanesa Meggiolaro</strong><br>(Finanzas)</td>
                </tr>
                <tr>
                    <td><strong>Comercial</strong><br>(Lucía, Martín, Nerea)</td>
                    <td>Cotizaciones confirmadas, condiciones pactadas.</td>
                    <td>Recibos oficiales de cobranza.</td>
                    <td><strong>Clientes / Bancos</strong></td>
                </tr>
                <tr>
                    <td><strong>Bancos / AFIP</strong></td>
                    <td>Extractos bancarios, tipos de cambio BNA, retenciones.</td>
                    <td>Carpetas saldadas económicamente.</td>
                    <td><strong>Dirección / Socios</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Section 2 -->
        <h2 class="section-heading">2. Matriz de Actores, Gobernanza y Flujo de Información</h2>
        
        <!-- Embedded User Diagram with High Contrast Container -->
        ${diagramBase64 ? `
        <div class="diagram-container">
            <img src="${diagramBase64}" alt="Diagrama Canónico de Actores y Flujo de Facturación ALMAR" />
            <div class="diagram-caption">Figura 1: Mapa Canónico de Actores y Flujo de Información de Facturación (ALMAR Rosario S.R.L.)</div>
        </div>
        ` : ''}

        <table class="clave-table">
            <thead>
                <tr>
                    <th>Nombre y Apellido</th>
                    <th>Casilla Corporativa</th>
                    <th>Rol Formal en el Sistema</th>
                    <th>Interacción con Facturación</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Stefania Rossi</strong></td>
                    <td><code>srossi@almarrosario.com</code></td>
                    <td>Administración, Facturación & Cobranzas</td>
                    <td>Responsable integral del proceso, emisión AFIP y carga en Kipin.</td>
                </tr>
                <tr>
                    <td><strong>Vanesa Meggiolaro</strong></td>
                    <td><code>vmeggiolaro@almarrosario.com</code></td>
                    <td>Socia Directora / Finanzas & Rentabilidad</td>
                    <td>Supervisión de descalce USD/ARS, márgenes &lt; $200 y desvíos.</td>
                </tr>
                <tr>
                    <td><strong>Dalia Silvi</strong></td>
                    <td><code>dsilvi@almarrosario.com</code></td>
                    <td>Administración & Pagos Exterior</td>
                    <td>Pagos a navieras internacionales y transferencias al exterior.</td>
                </tr>
                <tr>
                    <td><strong>Natali Hermoso</strong></td>
                    <td><code>nhermoso@almarrosario.com</code></td>
                    <td>Lead Operaciones Importación</td>
                    <td>Apertura de carpetas Canal 2 y transferencia para facturar.</td>
                </tr>
                <tr>
                    <td><strong>Aldana Gómez</strong></td>
                    <td><code>agomez@almarrosario.com</code></td>
                    <td>Jefa Customer Service & Impo</td>
                    <td>Validación de gastos locales y soporte a cuentas.</td>
                </tr>
                <tr>
                    <td><strong>Cecilia Dellamea</strong></td>
                    <td><code>cdellamea@almarrosario.com</code></td>
                    <td>Operaciones / Documentación HBL/MBL</td>
                    <td>Nodo transversal de canjes, avisos de arribo y aduana.</td>
                </tr>
                <tr>
                    <td><strong>Lucía Laje</strong></td>
                    <td><code>llaje@almarrosario.com</code></td>
                    <td>Comercial Lead & Grandes Cuentas</td>
                    <td>Definición de márgenes y condiciones especiales pactadas.</td>
                </tr>
                <tr>
                    <td><strong>Martín Fusco</strong></td>
                    <td><code>mfusco@almarrosario.com</code></td>
                    <td>Pricing & Emisión de Cotizaciones</td>
                    <td>Cotizaciones cargadas en el sistema comercial.</td>
                </tr>
                <tr>
                    <td><strong>Juan Andrés Arloro</strong></td>
                    <td><code>jarloro@almarrosario.com</code></td>
                    <td>Socio Director General / Operaciones</td>
                    <td>Aprobación final de excepciones de crédito y operaciones críticas.</td>
                </tr>
                <tr>
                    <td><strong>Alejandro Noacco</strong></td>
                    <td><code>anoacco@almarrosario.com</code></td>
                    <td>Socio Director Comercial / Pricing Ultramar</td>
                    <td>Acuerdos marco corporativos y tarifas de navieras.</td>
                </tr>
            </tbody>
        </table>

        <!-- Section 3: All 32 Questions -->
        <h2 class="section-heading">3. Batería Exhaustiva de Preguntas de Relevamiento (32 Preguntas)</h2>
        <p style="margin-bottom:18px; color:var(--clave-muted);">Estructuradas en 11 bloques temáticos para cubrir la totalidad de los requisitos normativos ISO 9001 y las especificaciones de software:</p>

        ${questionsHtml}

        <!-- Section 4 -->
        <h2 class="section-heading">4. Checklist de Evidencias de Campo</h2>
        <table class="clave-table">
            <thead>
                <tr>
                    <th style="width:35%;">Evidencia Requerida</th>
                    <th style="width:40%;">Propósito Técnico / Metodológico</th>
                    <th style="width:25%;">Estado de Recolección</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>1 Factura PDF limpia de Naviera</strong> (MSC / Maersk)</td>
                    <td>Verificar desglose de ítems, flete internacional y recargos locales en el motor OCR.</td>
                    <td><label class="check-item"><input type="checkbox"> Obtenida</label></td>
                </tr>
                <tr>
                    <td><strong>1 Factura PDF con sobrecosto real</strong></td>
                    <td>Entrenar el algoritmo de detección de discrepancias y prueba del modal de desvíos.</td>
                    <td><label class="check-item"><input type="checkbox"> Obtenida</label></td>
                </tr>
                <tr>
                    <td><strong>Foto / Captura de pantalla de Kipintoch</strong></td>
                    <td>Asegurar orden ergonómico idéntico en el botón de 1-Click Copy.</td>
                    <td><label class="check-item"><input type="checkbox"> Obtenida</label></td>
                </tr>
                <tr>
                    <td><strong>1 Prefactura vs Factura AFIP final</strong></td>
                    <td>Validar la liquidación cambiaria BNA y retenciones impositivas aplicadas.</td>
                    <td><label class="check-item"><input type="checkbox"> Obtenida</label></td>
                </tr>
                <tr>
                    <td><strong>Lista de 5 mayores proveedores recurrentes</strong></td>
                    <td>Configurar reglas predeterminadas de lectura y cuentas contables.</td>
                    <td><label class="check-item"><input type="checkbox"> Obtenida</label></td>
                </tr>
            </tbody>
        </table>

        <!-- Section 5 -->
        <h2 class="section-heading">5. Matriz Preliminar de Riesgos y Controles (ISO 9001 § 6.1)</h2>
        <table class="clave-table">
            <thead>
                <tr>
                    <th>Riesgo Identificado</th>
                    <th>Causa Raíz Operativa</th>
                    <th>Impacto en el Negocio</th>
                    <th>Mitigación en Software</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Sobrecosto de naviera no detectado</strong></td>
                    <td>El operativo no coteja la factura contra lo presupuestado al recibirla.</td>
                    <td>Pérdida directa de rentabilidad económica en la carpeta.</td>
                    <td>Bloqueo preventivo en bandeja Kanban hasta autorización formal con justificación ISO.</td>
                </tr>
                <tr>
                    <td><strong>Pérdida cambiaria en pase a pesos</strong></td>
                    <td>Márgenes pequeños (&lt; USD 200) absorbidos por retenciones y bancos.</td>
                    <td>Rentabilidad neta negativa al transformar a moneda local.</td>
                    <td>Alerta preventiva de Margen Crítico (&lt; USD 200) visible antes de confirmar prefactura.</td>
                </tr>
                <tr>
                    <td><strong>Demoras por comprobantes dispersos</strong></td>
                    <td>Facturas de proveedores dispersas en casillas personales.</td>
                    <td>Atraso en la emisión y descalce financiero en las cobranzas.</td>
                    <td>Bandeja centralizada de comprobantes con estado de carga y semáforo de antigüedad.</td>
                </tr>
                <tr>
                    <td><strong>Errores de carga manual en Kipintoch</strong></td>
                    <td>Tipeo manual de 12 campos fiscales por cada comprobante.</td>
                    <td>Inconsistencias en libros de IVA compras y demoras.</td>
                    <td>Asistente de carga rápida con 1-Click Copy adaptado a la secuencia exacta de Kipin.</td>
                </tr>
                <tr>
                    <td><strong>Excepciones de crédito no documentadas</strong></td>
                    <td>Autorizaciones verbales para entregar HBL sin pago previo.</td>
                    <td>Riesgo de incobrabilidad de fletes y falta de trazabilidad.</td>
                    <td>Registro auditable de excepciones con usuario, fecha y motivo formal.</td>
                </tr>
            </tbody>
        </table>

        <!-- Signatures -->
        <div class="sig-grid">
            <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Stefania Rossi / Vanesa Meggiolaro</div>
                <div class="sig-sub">Responsables Administración y Finanzas &bull; ALMAR Rosario</div>
            </div>
            <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Clave Consultores & Francisco Bondino</div>
                <div class="sig-sub">Equipo Implementador ISO 9001 & Solución de Software</div>
            </div>
        </div>

    </div>

</body>
</html>
`;

// Save to Downloads
const dlHtml = path.join(process.env.USERPROFILE, 'Downloads', 'ALMAR - Guia de Relevamiento Administracion y Facturacion - Clave.html');
fs.writeFileSync(dlHtml, htmlContent, 'utf8');
console.log('Updated HTML saved to Downloads:', dlHtml, `(${htmlContent.length} bytes)`);

// Save to workspace
const localHtml = path.join(__dirname, '..', 'ALMAR_Guia_Relevamiento_Administracion_Facturacion_Clave.html');
fs.writeFileSync(localHtml, htmlContent, 'utf8');
console.log('Updated HTML saved to workspace:', localHtml);
