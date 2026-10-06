import {
  SpeakerNotesData,
  OperatorScorecardItem,
} from '../types/presentation';

const OPERATOR_SCORECARD: OperatorScorecardItem[] = [
  {
    operador: 'Natali Hermoso',
    area: 'Coordinación Marítimo Impo',
    facturas: 110,
    tiempoMin: 10.5,
    desvios: 3,
    ahorroUsd: 5400,
    slaScore: 98.8,
  },
  {
    operador: 'Victoria Moyano',
    area: 'Customer Service Exportaciones',
    facturas: 68,
    tiempoMin: 11.2,
    desvios: 2,
    ahorroUsd: 3500,
    slaScore: 97.4,
  },
  {
    operador: 'Ana Laura Talaban',
    area: 'Operaciones Impo & Cuentas Corp',
    facturas: 62,
    tiempoMin: 11.8,
    desvios: 1,
    ahorroUsd: 2400,
    slaScore: 98.1,
  },
  {
    operador: 'Abril Stampfli',
    area: 'Aéreo & Terrestre Nacional',
    facturas: 54,
    tiempoMin: 13.0,
    desvios: 1,
    ahorroUsd: 2150,
    slaScore: 96.5,
  },
  {
    operador: 'Aldana Gómez',
    area: 'Operaciones Impo & Back-up',
    facturas: 30,
    tiempoMin: 11.0,
    desvios: 1,
    ahorroUsd: 1400,
    slaScore: 98.0,
  },
];

export const SPEAKER_NOTES: Record<number, SpeakerNotesData> = {
  1: {
    slideId: 1,
    title: 'Portada Ejecutiva: Apertura y Encuadre Directivo',
    timeAllocation: '00:00 - 01:15 (01:15 min)',
    keyStakeholders: ['Directorio Ejecutivo'],
    whatAudienceSees:
      'Portada editorial limpia de Clave Consultora (fondo platino, acentos verde bosque y dorado, isotipos oficiales, metadatos ejecutivos: Ing. Fran Bondino, Directorio ALMAR).',
    demoCues: [
      'Señalar el logotipo conjunto Clave-ALMAR',
      'Destacar la píldora de demo tecnológica oficial 2026',
      'Remarcar que no es teoría: se mostrarán casos reales y demo en vivo',
    ],
    verbatimSpeech:
      'Buenos días a todo el Directorio. Les agradezco enormemente este espacio de trabajo ejecutivo. El motivo de esta convocatoria es presentarles la solución tecnológica definitiva desarrollada para ALMAR Rosario: una plataforma de inteligencia operativa que automatiza la ingesta de facturas de proveedores, agiliza la gestión comercial de cotizaciones, audita los costos en tiempo real contra Kipintoch y blinda la rentabilidad de la empresa. Hoy no les vengo a mostrar diapositivas teóricas con promesas a futuro. Vamos a recorrer en 15 minutos la arquitectura del sistema, las soluciones concretas a los desafíos del frente comercial, los blindajes de control financiero y la seguridad jurídica institucional. E inmediatamente después, nos pasamos a la pantalla en vivo del portal para procesar facturas reales frente a ustedes. Comencemos con los números reales de la operación.',
    technicalSheet: {
      expediente: 'AUDITORIA_EJECUTIVA_ALMAR_2026',
      operacion: 'Apertura Directiva: Presentación de Plataforma de Automatización e Inteligencia Operativa',
      normativa: 'ISO 9001:2015 § 6.1 · Acciones para Abordar Riesgos y Oportunidades',
      metrics: [
        { label: 'Comprobantes Auditoría', value: '350+ / mes', detail: '163 carpetas auditadas', status: 'info' },
        { label: 'Cotizaciones Históricas', value: '1.080', detail: 'Volumen comex auditado', status: 'info' },
        { label: 'Duración Exposición', value: '25 min', detail: '15 min slides + 10 min demo', status: 'success' },
        { label: 'Entorno Activo', value: 'Local & Cloud', detail: 'Localhost:3000 / Vercel Edge', status: 'success' },
      ],
      details: [
        { label: 'Directorio Asistente', value: 'Alejandro Noacco, Vanesa Meggiolaro, Juan Andrés Arloro' },
        { label: 'Presentador Principal', value: 'Ing. Fran Bondino (Clave Consultora)' },
        { label: 'Alcance del Sistema', value: 'Inteligencia Operativa + Escudo Financiero + Cotizador Ágil', badge: 'PRODUCCIÓN', badgeColor: 'green' },
        { label: 'Marco Legal y Tributario', value: 'AFIP RG 4290 / Ley 22.415 / Ley 25.506' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Gobernanza / Legal',
          question: '¿Por qué no podemos resolver esto contratando simplemente más personal administrativo o un módulo adicional de Kipintoch?',
          answer: 'Kipintoch carece de ingesta multimodal por IA y validación de reglas de negocio en tiempo real. Un conector cerrado de Kipintoch cuesta más de $6.000.000 ARS/año en licencias y no detecta desvíos de fletes ni previene pérdidas por seguros diferidos.',
          legalBasis: 'Eficacia de Costos y Soberanía Tecnológica',
        },
      ],
    },
  },

  2: {
    slideId: 2,
    title: 'Diagnóstico Operativo & Comercial: Facturación y Procesos',
    timeAllocation: '01:15 - 02:45 (01:30 min)',
    keyStakeholders: ['Dirección Financiera', 'Dirección Comercial'],
    whatAudienceSees:
      '3 tarjetas KPI de diagnóstico (Flujo Fragmentado, Carga Manual, Seguimiento Discontinuo), grilla de 3 ejes operativos con cajas de fuga y callout inferior dorado.',
    demoCues: [
      'Apuntar a la dispersión de comprobantes en casillas de correo',
      'Resaltar el cuello de botella en Kipintoch (8 a 12 min por comprobante manual)',
      'Subrayar la pérdida de cotizaciones dormidas sin seguimiento estructurado',
    ],
    verbatimSpeech:
      'En el circuito administrativo y operativo, la recepción de comprobantes está completamente fragmentada: llegan facturas y notas de débito de armadores como Maersk o MSC, terminales y transportistas a través de múltiples casillas de correo sin un repositorio unificado. Luego, la carga en Kipintoch es 100% artesanal: descargar cada archivo, tipear CUITs, alícuotas y conceptos campo por campo. Esto consume valiosas horas del equipo en tareas mecánicas (de 8 a 12 minutos por factura) y abre una ventana constante a inconsistencias impositivas y fugas de rentabilidad por recargos no cotejados. En el circuito comercial ocurre algo análogo: la emisión de presupuestos está fuertemente concentrada en el equipo operativo, cotizando en planillas mientras las tarifas de las navieras cambian constantemente. Al no contar con un sistema ágil con alertas de vencimiento, muchas cotizaciones quedan sin un seguimiento proactivo y sin registro de los motivos por los cuales el cliente no cerró. Nuestra solución aborda ambos desafíos en simultáneo: automatiza la extracción y validación de comprobantes en 15 segundos (-98% de tiempo), y le brinda al equipo comercial un entorno ágil con control de vigencias de tarifas y seguimiento estructurado.',
    technicalSheet: {
      expediente: 'DIAGNOSTICO_OPERATIVO_ALMAR',
      operacion: 'Auditoría Pericial de Ingesta de Facturas y Pipeline Comercial',
      normativa: 'ISO 9001:2015 § 8.5 · Control de la Producción y Provisión del Servicio',
      metrics: [
        { label: 'Carga Manual Kipintoch', value: '8 - 12 min', detail: 'Por comprobante artesanal', status: 'danger' },
        { label: 'Concentración Comercial', value: '54.1%', detail: 'Lucía Laje (584 cotizaciones)', status: 'warning' },
        { label: 'Dispersión de Casillas', value: '5 casillas', detail: 'Sin repositorio unificado', status: 'danger' },
        { label: 'Demora Pólizas Sancor', value: '120 - 150 días', detail: 'Riesgo comisiones anticipadas', status: 'danger' },
      ],
      details: [
        { label: 'Comprobantes Auditados', value: '324 comprobantes procesados en ledger mensual' },
        { label: 'Fuga Histórica Detectada', value: 'Recargos navieros (BAF, EBS, THC) no cotejados en origen', badge: 'CRÍTICO', badgeColor: 'rose' },
        { label: 'Riesgo Fiscal', value: 'Alícuotas AFIP (21% vs 0% BUFF) tipeadas manualmente' },
        { label: 'Impacto en Productividad', value: '11.4 min promedio histórico vs meta < 15 seg con IA', badge: '-98% TIEMPO', badgeColor: 'green' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Comercial',
          question: '¿El problema principal de ALMAR es comercial o administrativo?',
          answer: 'Ambos se retroalimentan negativamente: la carga manual consume el tiempo operativo del equipo impidiendo el seguimiento de cotizaciones, mientras que la falta de control de vigencia naviera genera pérdidas que absorbe la administración.',
          legalBasis: 'Diagnóstico Integral de Procesos',
        },
      ],
    },
  },

  3: {
    slideId: 3,
    title: 'Portal Centralizado de Facturación Asistido por IA',
    timeAllocation: '02:45 - 04:00 (01:15 min)',
    keyStakeholders: ['Dirección Financiera', 'Gobernanza & IT'],
    whatAudienceSees:
      'Split 1:1.25. Izquierda: 3 pilares KPI (Extracción IA en 5s, Escudo Financiero en tiempo real, Copiado 1-Clic con ahorro de $6M ARS/año). Derecha: Captura UHD del Dashboard en vivo.',
    demoCues: [
      'Indicar el banner superior con rol ADMINISTRACIÓN en tema claro',
      'Explicar con total claridad los 8 pasos manuales que desaparecen vs los 2 únicos pasos que quedan',
      'Destacar la métrica de extracción en menos de 5 segundos',
      'Remarcar el ahorro de $6.000.000 ARS anuales al evitar conectores cerrados de Kipintoch',
    ],
    verbatimSpeech:
      'Esta es la plataforma central que desarrollamos para ALMAR. Fíjense en la captura de la derecha, tomada directamente del portal en ejecución: acá arriba ven el entorno seguro de Administración. Y acá está la idea principal que acelera toda la operación: hoy una coordinadora realiza 10 pasos manuales por cada factura que llega a la empresa. Con esta plataforma, 8 de esos 10 pasos desaparecen por completo: desaparece el monitoreo manual de las 15 casillas de correo, desaparece la descarga física del PDF a la computadora, desaparece renombrar el archivo a mano, desaparece buscar la carpeta en Kipintoch, desaparece tipear el CUIT, CAE y fechas en el teclado, desaparece calcular el BUFF al 21% a mano, desaparece rastrear la cotización vieja de venta y desaparece usar la calculadora para ver si la naviera nos cobró de más. Todo eso lo hace el sistema solo en segundo plano. A la operadora le quedan únicamente dos pasos: validar visualmente en pantalla en el Visor Dual que los datos coincidan y presionar un botón de 1 clic para copiar los 5 campos canónicos a Kipintoch. Por eso pasamos de 12 minutos manuales a apenas 15 segundos: se eliminan 8 tareas repetitivas y todo el circuito se acelera un 98% con total precisión fiscal.',
    technicalSheet: {
      expediente: 'PORTAL_CORE_AI',
      operacion: 'Plataforma de Extracción, Auditoría y Conexión Asistida a Kipintoch',
      normativa: 'AFIP RG 4290 · Facturación Electrónica y Regímenes Especiales',
      metrics: [
        { label: 'Tiempo Extracción IA', value: '< 5 seg', detail: 'Lectura OCR multimodal', status: 'success' },
        { label: 'Copiado Asistido Kipin', value: '15 seg', detail: '5 campos canónicos en 1 clic', status: 'success' },
        { label: 'Reducción de Tiempo', value: '-98%', detail: 'De 12 min a 15 segundos', status: 'success' },
        { label: 'Ahorro Conectores ERP', value: '$6.000.000 ARS', detail: 'Ahorro anual en APIs cerradas', status: 'success' },
      ],
      details: [
        { label: '8 Pasos que Desaparecen', value: 'Monitoreo de casillas, descarga PDF, renombrado, búsqueda ERP, tipeo CUIT/CAE, desglose BUFF 21%, rastreo cotización y cálculo manual', badge: '80% PASOS MENOS', badgeColor: 'green' },
        { label: '2 Pasos que Quedan', value: '1) Validación visual en Visor Dual (semáforo de desvío) y 2) Clic en "Copiar para Kipintoch" (15 segundos)', badge: 'ASISTIDO', badgeColor: 'gold' },
        { label: 'Motor de Inteligencia', value: 'OpenAI Zero Data Retention (ZDR § 3.2)', badge: 'PRIVACIDAD', badgeColor: 'green' },
        { label: 'Validación Fiscal AFIP', value: 'Algoritmo Módulo 11 en CUIT + alícuotas 21%, 10.5%, 0% exento' },
        { label: 'Protocolo de Enlace', value: 'Copiado estructurado al portapapeles sin tocar SQL Kipintoch' },
        { label: 'Escudo Financiero', value: 'Cruza en tiempo real costo facturado vs carpeta Kipintoch', badge: 'ESCUDO ACTIVO', badgeColor: 'gold' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Operativa & Financiera',
          question: '¿Cómo garantizan que la carga se acelere un 98% sin perder control sobre los comprobantes?',
          answer: 'Eliminando los 8 pasos mecánicos de transcripción y cálculo que consumían 11.5 de los 12 minutos. El operador conserva el 100% de la supervisión en los 2 pasos finales: validar visualmente el semáforo y confirmar el pegado en Kipintoch.',
          legalBasis: 'Eficiencia Operativa ISO 9001 § 8.5',
        },
        {
          stakeholder: 'Dirección Financiera',
          question: '¿Quién se hace responsable si la Inteligencia Artificial lee mal un número de factura o un CUIT?',
          answer: 'El sistema no asienta a ciegas: el Visor Dual Side-by-Side resalta el dato extraído contra el PDF original. Stefania valida visualmente el campo antes de copiarlo a Kipintoch. La IA asiste y agiliza; el operador humano ejerce el control final.',
          legalBasis: 'Supervisión Humana en el Bucle (Human-in-the-Loop)',
        },
      ],
    },
  },

  4: {
    slideId: 4,
    title: 'Arquitectura del Pipeline: De la Factura a la Carpeta y Banco',
    timeAllocation: '04:00 - 05:15 (01:15 min)',
    keyStakeholders: ['Gobernanza & IT', 'Dirección Financiera'],
    whatAudienceSees:
      'Grilla panorámica de las 5 etapas del circuito de facturación (Recepción -> Lectura IA -> Control de Margen -> Kipintoch -> Banco Macro), ficha interactiva de detalle y métricas operativas.',
    demoCues: [
      'Mostrar las 5 etapas visibles en paralelo en la pantalla',
      'Explicar qué tareas manuales desaparecen en cada una de las 5 estaciones',
      'Hacer clic en las etapas o tocar "Simular Recorrido" para ver qué entra y qué resuelve cada paso',
      'Destacar la verificación en extracto real de Banco Macro antes de cerrar cobranzas',
    ],
    verbatimSpeech:
      'El circuito funciona como una línea de producción en 5 etapas donde cada estación elimina fricción humana: En la Estación 1 de Ingesta, desaparece el monitoreo manual de correos y la descarga de PDFs; el comprobante ingresa solo. En la Estación 2 de Lectura y Normalización, desaparece el tipeo de CUITs y el desglose en papel del flete exento vs. el combustible BUFF al 21% de IVA; la IA formatea todo según las normas de AFIP. En la Estación 3 de Control de Margen, desaparece buscar la cotización comercial vieja y hacer cuentas con la calculadora; el semáforo alerta al instante si la naviera cobró de más o si el margen cae de USD 200. En la Estación 4 de Asiento ERP, desaparece la carga campo por campo en Kipintoch; Stefania pega los 5 campos limpios en 15 segundos en un clic. Y en la Estación 5, Cobranzas verifica el extracto real de Banco Macro (cuenta Nº 376100000930617) antes de emitir recibos y liberar comisiones. El resultado neto: 8 tareas manuales menos, SLA del 98.2% en menos de 24 horas y cero errores impositivos.',
    technicalSheet: {
      expediente: 'PIPELINE_CIRCUITO_5_ETAPAS',
      operacion: 'Circuito Integral: Ingesta -> Normalización -> Control -> ERP -> Banco',
      normativa: 'ISO 9001:2015 · Trazabilidad de Procesos y Control de Entregas',
      metrics: [
        { label: 'Etapas del Circuito', value: '5 estaciones', detail: 'Trazabilidad continua', status: 'info' },
        { label: 'SLA Operativo', value: '98.2%', detail: 'Procesamiento en < 24 horas', status: 'success' },
        { label: 'Tasa Inconsistencias', value: '0.0%', detail: 'Validación fiscal matemática', status: 'success' },
        { label: 'Cta Cte Banco Macro', value: '376100000930617', detail: 'Hard gate de conciliación', status: 'success' },
      ],
      details: [
        { label: 'Etapa 1: Ingesta', value: 'Recepción automática. Desaparece: monitoreo de casillas y descarga de PDFs' },
        { label: 'Etapa 2: Normalización', value: 'Extracción IA + BUFF. Desaparece: tipeo CUIT/CAE y cálculo manual de alícuotas', badge: 'BUFF', badgeColor: 'green' },
        { label: 'Etapa 3: Control Margen', value: 'Auditoría automática. Desaparece: búsqueda de cotización y cuentas con calculadora' },
        { label: 'Etapa 4: Asiento ERP', value: 'Copiado 1-Clic a Kipintoch (15s). Desaparece: transcripción campo a campo', badge: '5 CAMPOS', badgeColor: 'green' },
        { label: 'Etapa 5: Cobranzas Macro', value: 'Conciliación con extracto Banco Macro Cta 376100000930617. Blindaje de tesorería', badge: 'MACRO', badgeColor: 'navy' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Gobernanza / Legal',
          question: '¿Se requiere modificar la base de datos SQL propietaria de Kipintoch?',
          answer: 'No. El sistema opera de manera desacoplada: formatea los 5 campos canónicos al portapapeles de Windows. Stefania solo presiona pegar en la pantalla habitual de Kipintoch. Cero riesgo de corrupción de base de datos y cero costo de integración.',
          legalBasis: 'Arquitectura Desacoplada y Segura',
        },
      ],
    },
  },

  5: {
    slideId: 5,
    title: 'Tablero Comercial y Control de Vigencia de Tarifas Navieras',
    timeAllocation: '05:15 - 06:45 (01:30 min)',
    keyStakeholders: ['Dirección Financiera'],
    whatAudienceSees:
      'Tabla de cotizaciones con semáforo de vigencia (Vigente 12d verde, Por Vencer 2d amarillo, Vencida rojo con candado), callout de control financiero.',
    demoCues: [
      'Enfocar el control de costos y la protección del margen bruto',
      'Citar la observación de Vanesa Meggiolaro en audios sobre el vencimiento de tarifas',
      'Señalar la fila roja de tarifa vencida y el botón con candado',
      'Explicar el diferencial con Kipintoch: alerta activa en el momento vs registro estadístico posterior',
    ],
    verbatimSpeech:
      'Un punto crítico que nos remarcó Vanesa Meggiolaro en sus audios para que esta herramienta le sirva realmente a Lucía fue la fecha de vigencia de las tarifas navieras: en fletes marítimos los costos cambian cada 15 o 30 días por recargos de combustible BAF o aumentos generales. Si un comercial cotiza con una tarifa vieja y el cliente confirma semanas después, nos encontramos con un flete más caro que se come la ganancia. Miren la captura de la derecha: implementamos el Semáforo de Vigencia de Tarifas Navieras. Cada tarifa tiene una ventana estricta de validez de 15 o 30 días. Mientras está dentro del plazo, el sistema muestra el badge verde. Cuando faltan 3 días para expirar, se enciende la alerta amarilla preventiva. Y si la tarifa venció, el sistema bloquea automáticamente la emisión de la propuesta. El comercial no puede emitir una cotización con costos viejos sin antes revalidar la tarifa actualizada del armador. Y respecto a lo que planteaba Vanesa sobre Kipintoch: Kipintoch registra la diferencia como estadística histórica cuando el barco ya navegó y la factura ya se pagó. Nuestra plataforma actúa en el momento exacto en que entra el PDF de la naviera, prendiendo la alerta y frenando el comprobante antes de emitir la orden de pago. Cero quebranto por fletes caducados.',
    technicalSheet: {
      expediente: 'CONTROL_VIGENCIA_TARIFAS',
      operacion: 'Módulo Comercial: Semáforo de Fletes y Validez Temporal Naviera',
      normativa: 'Directiva de Gestión Financiera · Control del Margen Bruto',
      metrics: [
        { label: 'Ventana de Validez', value: '15 / 30 días', detail: 'Según armador y tráfico', status: 'info' },
        { label: 'Alerta Preventiva', value: '3 días antes', detail: 'Aviso visual por vencer', status: 'warning' },
        { label: 'Quebranto Prevenido', value: 'USD 300 - 400', detail: 'Por cotización desactualizada', status: 'success' },
        { label: 'Bloqueo Automático', value: '100% estricto', detail: 'Si la tarifa está vencida', status: 'danger' },
      ],
      details: [
        { label: 'Semáforo Verde', value: 'Tarifa vigente con margen validado en origen', badge: 'VIGENTE', badgeColor: 'green' },
        { label: 'Semáforo Amarillo', value: 'Vence en menos de 72 horas: requiere revisión', badge: 'POR VENCER', badgeColor: 'amber' },
        { label: 'Semáforo Rojo', value: 'Vencida: emisión bloqueada sin revalidación naviera', badge: 'BLOQUEADA', badgeColor: 'rose' },
        { label: 'Observación Vanesa', value: 'Tarifas marítimas quincenales/mensuales con fecha límite estricta' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Financiera (Vanesa)',
          question: '¿Kipintoch ya no guarda la diferencia entre lo presupuestado y lo facturado?',
          answer: 'Kipintoch la guarda como registro estadístico posterior, cuando la operación cerró y la plata ya salió. Nuestra solución actúa en el momento de la ingesta del comprobante: compara el PDF contra lo cotizado y, ante un sobrecosto, bloquea el pago antes de que se liquide.',
          legalBasis: 'Prevención Activa de Sobrecostos',
        },
      ],
    },
    objections: [
      {
        stakeholder: 'Dirección Financiera (Vanesa)',
        objection: 'Kipintoch registra la diferencia entre lo presupuestado y lo facturado, ¿pero este sistema tira alerta en el momento o es solo estadística posterior?',
        response:
          'Kipintoch muestra el desvío como estadística posterior cuando el flete ya se pagó. Nuestra plataforma opera en tiempo real en la bandeja de entrada: lee el PDF de la naviera y, si hay sobrefacturación, bloquea el comprobante antes de emitir la orden de pago.',
      },
    ],
  },

  6: {
    slideId: 6,
    title: 'Calculadora Paramétrica con Perfiles Dinámicos de Margen',
    timeAllocation: '06:45 - 08:15 (01:30 min)',
    keyStakeholders: ['Dirección Comercial', 'Dirección Financiera'],
    whatAudienceSees:
      'Selector de 4 perfiles de margen, sliders de costo naviero y margen comercial, semáforo preventivo (< USD 200 amarillo, < USD 3.00 candado rojo).',
    demoCues: [
      'Citar a Alejandro Noacco: costos que varían y distintos criterios de rentabilidad por cliente',
      'Citar a Vanesa Meggiolaro: márgenes en dólares que dan pérdida en pesos y umbral preventivo en USD 200',
      'Mover los sliders de la calculadora paramétrica interactiva',
      'Disparar visualmente la alerta preventiva de USD 200 y mostrar el override WebAuthn',
    ],
    verbatimSpeech:
      'Tomando exactamente lo que nos comentó Alejandro Noacco: si bien hay consultas de cotización que se repiten, los costos no siempre son iguales y cada cliente tiene un criterio de rentabilidad diferente. Por eso descartamos imponer un markup rígido del 15% que te dejaría fuera de mercado en negocios spot. Creamos la Calculadora Paramétrica con 4 Perfiles Dinámicos de Rentabilidad: Cuenta Estratégica para grandes cuentas corporativas, Estándar para rentabilidad equilibrada, Spot Alto Riesgo para cargas con riesgo de almacenaje, o Personalizado. El comercial mueve los sliders libremente en 45 segundos. ¿Y cómo cuidamos a ALMAR? Tomando la propuesta textual de Vanesa tras analizar con Finanzas que márgenes de 50 o 100 dólares terminan dando pérdida al pasarse a pesos por gastos locales y tipo de cambio: parametrizamos la alerta preventiva exactamente en USD 200. Si el margen proyectado baja de USD 200, el sistema enciende una alerta amarilla preventiva para advertir el riesgo cambiario antes de enviar la oferta. Y únicamente si la operación arroja un margen menor a 3 dólares —pérdida neta segura—, el botón se bloquea. Se cotiza con agilidad spot y con la tranquilidad de que el sistema cuida la rentabilidad.',
    technicalSheet: {
      expediente: 'CALCULADORA_PARAMETRICA_MARGEN',
      operacion: 'Cotizador Ágil en Tiempo Real & Protección de Rentabilidad',
      normativa: 'Directiva de Pricing y Rentabilidad Comercial',
      metrics: [
        { label: 'Tiempo de Cotización', value: '45 seg', detail: 'Frente a 15 min en planillas', status: 'success' },
        { label: 'Alerta Preventiva', value: '< USD 200', detail: 'Amarillo por riesgo descalce', status: 'warning' },
        { label: 'Bloqueo Estricto', value: '< USD 3.00', detail: 'Margen negativo o inviable', status: 'danger' },
        { label: 'Perfiles Activos', value: '4 perfiles', detail: 'Estratégico, Estándar, Spot, Custom', status: 'info' },
      ],
      details: [
        { label: 'Criterio Alejandro', value: 'Costos variables y criterios de rentabilidad diferenciados por cliente' },
        { label: 'Criterio Vanesa', value: 'Alerta en USD 200 para evitar que márgenes chicos en USD den pérdida en ARS' },
        { label: 'Perfil Cuenta Estratégica', value: 'Margen preferencial para clientes corporativos de alto volumen' },
        { label: 'Perfil Spot Alto Riesgo', value: 'Protección contra demoras y estadías de contenedor' },
        { label: 'Override Gerencial', value: 'Autorización FIDO2 WebAuthn en 3 segundos', badge: 'WEBAUTHN', badgeColor: 'green' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Comercial (Alejandro)',
          question: 'Si tengo 10 contenedores y peleo flete spot con margen de USD 50 por contenedor, ¿este sistema me frena?',
          answer: 'No te frena. La alerta de USD 200 es amarilla preventiva para avisarte del riesgo cambiario al pasar a pesos. El vendedor ajusta el margen libremente con los 4 perfiles. Solo se bloquea si el margen total es menor a USD 3.00 (pérdida segura). Además, contás con el override biométrico gerencial en 3 segundos.',
          legalBasis: 'Flexibilidad Comercial y Control de Riesgo Cambiario',
        },
      ],
    },
    objections: [
      {
        stakeholder: 'Dirección Comercial (Alejandro)',
        objection: 'No siempre el costo es igual y cada cliente tiene un criterio de rentabilidad diferente. ¿El sistema se adapta?',
        response:
          'Sí, 100%. No hay un markup fijo. El comercial elige el perfil de rentabilidad del cliente y ajusta el slider libremente. La alerta de USD 200 propuesta por Vanesa es preventiva (amarilla), avisando si hay riesgo de descalce al pasar a pesos.',
      },
    ],
  },

  7: {
    slideId: 7,
    title: 'Registro de Feedback Cualitativo & Smart Follow-Up a 48 hs',
    timeAllocation: '08:15 - 09:45 (01:30 min)',
    keyStakeholders: ['Dirección Comercial', 'Equipo de Ventas'],
    whatAudienceSees:
      'Modal de Smart Follow-Up con cotizaciones > 48hs sin respuesta, botón para generar correo formal en 1 clic y campo de feedback cualitativo.',
    demoCues: [
      'Mencionar el dato de Lucía Laje (54,1% del volumen de cotizaciones)',
      'Citar a Alejandro Noacco: estandarizar el seguimiento en el proceso y valor del recordatorio',
      'Mostrar el botón para copiar plantilla de seguimiento directamente a Gmail en 1 clic',
      'Explicar el Feedback Comercial informativo que planteó Alejandro para no perder datos en WhatsApp',
    ],
    verbatimSpeech:
      'Miremos ahora cómo resolvemos el día a día de Lucía Laje y la inteligencia comercial de ALMAR: Hoy Lucía emite más de 500 cotizaciones por mes (54,1% del total). Como bien nos marcó Alejandro Noacco: el seguimiento hoy se está realizando, pero coincidimos plenamente en que debemos estandarizarlo formalmente dentro del proceso, y el recordatorio automático es clave. Si el cliente no responde en 48 horas, hacer el seguimiento manual insume redactar decenas de correos uno por uno y muchas operaciones se enfrían con la competencia por simple vorágine diaria. Con el Smart Follow-Up: el sistema filtra automáticamente todas las cotizaciones con más de 48 horas de silencio. Lucía entra a esta pantalla, presiona este botón azul, y el portal redacta un correo formal impecable, personalizado con el nombre del cliente, el puerto y la tarifa pactada. Lucía hace 20 seguimientos en 10 minutos desde Gmail sin escribir una sola palabra. Y acá entra el segundo punto que destacó Alejandro: el Feedback Comercial a modo informativo. Cuando el cliente responde que se fue con otra naviera, que el flete fue alto o cualquier devolución, Lucía lo anota en un clic en la venta. Ese dato queda registrado en el historial de la operación y en un reporte consolidado, permitiendo a la Dirección Comercial sentarse a negociar tarifas con Maersk o MSC sabiendo exactamente qué rutas y qué diferencias de precio nos dejaron afuera.',
    technicalSheet: {
      expediente: 'SMART_FOLLOWUP_COMERCIAL',
      operacion: 'Seguimiento Automatizado de Cotizaciones & Inteligencia de Pérdidas',
      normativa: 'Gestión Comercial ALMAR Rosario · Estandarización de Procesos',
      metrics: [
        { label: 'Volumen Lucía Laje', value: '54.1%', detail: '584 cotizaciones en auditoría', status: 'warning' },
        { label: 'Tiempo de Seguimiento', value: '10 min', detail: 'Para procesar 20 propuestas', status: 'success' },
        { label: 'Tasa Recupero Estimada', value: '+18%', detail: 'Por contacto antes de 48hs', status: 'success' },
        { label: 'Disparador Automático', value: '> 48 hs', detail: 'Sin respuesta del cliente', status: 'info' },
      ],
      details: [
        { label: 'Estandarización Proceso', value: 'Regla automática de seguimiento a 48 hs pedida por Alejandro' },
        { label: 'Generador 1-Clic', value: 'Plantilla formal personalizada redactada para Gmail', badge: 'GMAIL READY', badgeColor: 'green' },
        { label: 'Feedback Informativo', value: 'Registro cualitativo pedido por Alejandro para no perder datos en chats' },
        { label: 'Inteligencia de Negociación', value: 'Reporte consolidado por ruta y armador para negociar tarifas' },
        { label: 'Trazabilidad', value: 'Historial de contactos consolidado en la carpeta operativa' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Comercial (Alejandro)',
          question: '¿Cómo ayuda estandarizar el seguimiento a 48 hs y registrar el feedback del cliente a modo informativo?',
          answer: 'Estandariza una regla operativa clara sin sobrecargar a Lucía: con 1 solo clic genera la plantilla para Gmail. Y el feedback del cliente queda documentado en la venta a modo informativo para que Dirección Comercial identifique qué rutas o armadores están desfasados en precio.',
          legalBasis: 'Estandarización Comercial ISO 9001 § 8.2',
        },
      ],
    },
    objections: [
      {
        stakeholder: 'Dirección Comercial (Alejandro)',
        objection: '¿Cómo se asegura que el seguimiento se estandarice en el proceso sin sobrecargar al equipo?',
        response:
          'El panel de Smart Follow-Up detecta automáticamente las cotizaciones paradas a 48 hs. Lucía no redacta nada: revisa y copia en 1 clic a Gmail, logrando estandarización total con mínimo tiempo operativo.',
      },
    ],
  },

  8: {
    slideId: 8,
    title: 'Control Operativo: Flujo Diario & Métricas de Productividad',
    timeAllocation: '09:45 - 11:00 (01:15 min)',
    keyStakeholders: ['Directorio Ejecutivo'],
    whatAudienceSees:
      'Selector de dos vistas: 1) Tablero Kanban y Visor Dual con datos clave extraídos; 2) Tablero de Métricas & Scorecard de Productividad por operador.',
    demoCues: [
      'Mostrar las 4 columnas del Kanban y la columna roja de Desvío',
      'Destacar el Visor Dual: 15 segundos y 5 campos canónicos en 1 clic',
      'Hacer clic en la pestaña "Métricas de Productividad" para mostrar el Scorecard del equipo',
      'Mencionar los números de Natali Hermoso (110 facturas, USD 5.400 ahorrados) y el total de USD 14.890 prevenidos',
    ],
    verbatimSpeech:
      'Acá tienen dos componentes centrales que responden a lo que nos pidieron: el control del flujo diario y la visibilidad de productividad del equipo. En la primera vista ven las dos pantallas operativas: el Tablero Kanban, donde todo comprobante se clasifica solo, y la columna "Con Desvío", que retiene automáticamente cualquier sobrecosto de naviera antes de pagarse; y a la derecha el Visor Dual, donde Stefania comprueba el PDF y en 15 segundos copia los 5 campos limpios a Kipintoch. Esta aceleración extrema de 12 minutos a 15 segundos (-98% de tiempo) ocurre precisamente porque eliminamos las 8 tareas manuales repetitivas: el monitoreo de correos, la descarga de PDFs, el renombrado, la búsqueda en el ERP, el tipeo de datos AFIP, el cálculo del BUFF al 21%, el rastreo de cotizaciones y las cuentas con calculadora. En 324 facturas mensuales, esto le devuelve a ALMAR más de 62 horas operativas al mes. Además, el Visor Dual resuelve un dolor neurálgico que vimos en los correos de Stefania y Natali: cuando Maersk, MSC o TRP emiten una sola factura para varios BLs de distintas carpetas y hoy las chicas van subrayando a mano con resaltador en papel qué renglón va a qué carpeta. Con el Smart Split, asignan digitalmente cada ítem a su carpeta (C1234, C1482) con control de balance en cero en pantalla, sin papel ni errores de doble imputación. Pero además, respondiendo a la necesidad explícita del Directorio de medir el rendimiento del personal: si tocan esta pestaña de "Métricas de Productividad", el sistema les muestra el tablero de control de gestión. Fíjense: frenamos 14.890 dólares en sobrecostos de Maersk, MSC, TRP y LGV; y tenemos una tasa de cumplimiento SLA del 98.2%. Y acá abajo tienen el rendimiento individual: Natali Hermoso con 110 comprobantes y 5.400 dólares de sobrecostos frenados, Victoria Moyano con 68 y 3.500 dólares, Ana Laura con 62 y 2.400 dólares, Abril con 54 y 2.150 dólares, y Aldana con 30 comprobantes. Cada minuto y cada dólar quedan medidos con total transparencia.',
    technicalSheet: {
      expediente: 'SCORECARD_OPERATIVO_ALMAR',
      operacion: 'Control Operativo: Tablero Kanban, Visor Dual & Rendimiento del Equipo',
      normativa: 'ISO 9001:2015 § 9.1 · Seguimiento, Medición, Análisis y Evaluación',
      metrics: [
        { label: 'Reducción de Tiempo', value: '-98%', detail: 'De 12 min a 15s por factura', status: 'success' },
        { label: 'Horas Mes Recuperadas', value: '62 hs / mes', detail: '324 facturas x 11.5 min ahorrados', status: 'success' },
        { label: 'Sobrecostos Interceptados', value: 'USD 14.890', detail: '8 desvíos retenidos a navieras', status: 'success' },
        { label: 'Cumplimiento SLA', value: '98.2%', detail: 'Procesamiento en < 24hs (78% < 15m)', status: 'success' },
      ],
      details: [
        { label: 'Causa de la Aceleración', value: 'Eliminación de 8 pasos mecánicos (tipeo, descarga, cálculo BUFF y calculadora)', badge: '8 PASOS MENOS', badgeColor: 'green' },
        { label: 'Smart Split Multi-Carpeta', value: 'Fin del subrayado con resaltador: desglose de factura única a múltiples carpetas', badge: 'SMART SPLIT', badgeColor: 'green' },
        { label: 'Desvíos Maersk Line', value: 'USD 4.840 prevenidos en 4 comprobantes (BAF de emergencia)' },
        { label: 'Desvíos MSC', value: 'USD 3.900 prevenidos en 2 comprobantes (THC y recargos)' },
        { label: 'Desvíos TRP (Terminal Zárate)', value: 'USD 2.420 prevenidos en 2 comprobantes (estadía)' },
        { label: 'Desvíos LGV Transportes', value: 'USD 1.240 prevenidos en 1 comprobante (custodia extra)' },
        { label: 'Ahorro Conectores Kipin', value: '$6.000.000 ARS anuales garantizados', badge: 'AHORRO', badgeColor: 'green' },
        { label: 'Auditoría de Carpetas', value: '12 expedientes conciliados: Venta = Cotización y Costo = Facturas asociadas (Diferencia 0,00)', badge: '100% CUADRADO', badgeColor: 'green' },
      ],
      scorecard: OPERATOR_SCORECARD,
      hardQuestions: [
        {
          stakeholder: 'Dirección Financiera',
          question: '¿Cómo se desglosan exactamente los USD 14.890 de sobrecostos prevenidos que figuran en el tablero?',
          answer: 'Se desglosan en 8 comprobantes retenidos antes de su pago: Maersk Line USD 4.840 en 4 desvíos de combustible; MSC USD 3.900 en 2 desvíos de THC; Terminales Río de la Plata USD 2.420 en 2 facturas de almacenaje no presupuestado; LGV Transportes USD 1.240 y AMA Freight USD 1.250. Cada centavo fue auditado y respaldado con su comprobante correspondiente.',
          legalBasis: 'Conciliación Financiera de Desvíos Auditados',
        },
      ],
    },
  },

  9: {
    slideId: 9,
    title: 'Caso C367: Normalización Semántica de Combustible Naviero (BUFF)',
    timeAllocation: '11:00 - 12:15 (01:15 min)',
    keyStakeholders: ['Dirección Financiera', 'Gobernanza & IT'],
    whatAudienceSees:
      'Stepper con etapas 2 y 3 activas. Captura UHD de C367 con mapeo semántico BAF/EBS a código fiscal AFIP BUFF y detección de desvío USD 80.',
    demoCues: [
      'Mencionar el co-loader MSL y la cotización FCA Guangzhou pactada por Juan Cuello',
      'Señalar el recuadro de normalización semántica a BUFF',
      'Destacar el quebranto evitado: USD 80 retenidos antes de facturar',
    ],
    verbatimSpeech:
      'Veamos el primer caso real auditado en los correos de ALMAR: la Carpeta C367 de importación marítima LCL Shanghai/Guangzhou a Rosario. ¿Qué ocurrió en esa operación? El co-loader MSL (Líneas Marítimas / Maritime Services Line Argentina S.A.) facturó conceptos de combustible bajo siglas como BAF, BRC y EBS. En el circuito manual, la operadora dudó sobre cómo imputarlo en Kipintoch, la carpeta se demoró y casi se emite la prefactura sin trasladar un recargo indebido de 80 dólares más combustible al cliente final Juan Cuello (LBS INTELLIGENT, CUIT 20-20590316-0). La cotización acordada con Cuello rigió bajo término FCA Guangzhou, por lo que los gastos en origen corresponden al shipper. Miren cómo lo resuelve el portal: El motor de IA reconoce cualquiera de las 15 variantes de recargos de combustible naviero y las normaliza automáticamente al código canónico BUFF que exige la normativa fiscal de AFIP al 21% de IVA. Y al auditar la carpeta contra la cotización pactada, detecta al instante que el pick-up fee de 80 dólares en origen era improcedente. El sistema retuvo el comprobante en la columna Con Desvío, Cecilia Dellamea exigió a MSL la Nota de Crédito A-0004-00046188 (NC A 46188), logrando el rescate de USD 80 + IVA con NC. Pérdida final para ALMAR: exactamente USD 0.00.',
    technicalSheet: {
      expediente: 'C-202607IM-00001367 (C367 / IM1367)',
      operacion: 'Importación Marítima LCL Guangzhou/Shanghai -> Zárate/Rosario (FCA Guangzhou)',
      normativa: 'AFIP RG 4290 · Código AFIP BUFF (21% IVA) · Ley 22.415 (Código Aduanero)',
      metrics: [
        { label: 'Desvío en Origen', value: 'USD 80.00 + BUFF', detail: 'Cobro inland indebido en FCA', status: 'danger' },
        { label: 'Quebranto Evitado', value: 'USD 80.00 + IVA', detail: 'Rescate de USD 80 + IVA con NC', status: 'success' },
        { label: 'Nota de Crédito MSL', value: 'NC A 46188', detail: 'N° A-0004-00046188 por -USD 80', status: 'success' },
        { label: 'Pérdida Neta ALMAR', value: 'USD 0.00', detail: 'Protección patrimonial 100%', status: 'success' },
      ],
      details: [
        { label: 'Cliente', value: 'Juan Ramón Cuello / LBS INTELLIGENT (CUIT 20-20590316-0)' },
        { label: 'Proveedor / Co-loader', value: 'MSL Argentina S.A. (CUIT 30-71124567-9)' },
        { label: 'Buque / HBL', value: 'Maersk San Lazaro V. 631W · HBL EURFLG2670458ROS' },
        { label: 'Factura Naviera', value: 'Factura A FC-0001-00045210 por USD 2.048,55' },
        { label: 'Incoterm Pactado', value: 'FCA Guangzhou (gastos origen corresponden al shipper)', badge: 'FCA', badgeColor: 'amber' },
        { label: 'Normalizador BUFF', value: '15 variantes (BAF, EBS, BRC) mapeadas a BUFF al 21% de IVA', badge: 'BUFF', badgeColor: 'green' },
        { label: 'Cadena Kipintoch Copiada', value: 'FMA USD 1.420 / BUFF USD 240 / THC USD 180' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Comercial',
          question: '¿El cliente final Juan Cuello se enteró en algún momento del intento de recargo de MSL?',
          answer: 'No. El sistema retuvo el comprobante en la columna Con Desvío de forma automática. Cecilia Dellamea reclamó a MSL y obtuvo la Nota de Crédito A-0004-00046188 antes de emitir la prefactura a Juan Cuello. El cliente recibió su liquidación limpia y ALMAR no perdió un solo dólar.',
          legalBasis: 'Protección Comercial del Vínculo con el Cliente',
        },
      ],
    },
  },

  10: {
    slideId: 10,
    title: 'Caso C620: Módulo Multimoneda BNA Oficial para Divisas Complejas (GBP)',
    timeAllocation: '12:15 - 13:30 (01:15 min)',
    keyStakeholders: ['Dirección Financiera', 'Gobernanza & IT'],
    whatAudienceSees:
      'Modal multimoneda con conversión oficial BNA: £543 a 1.3628 = USD 740, enlace a constancia PDF oficial de cotización BNA.',
    demoCues: [
      'Destacar el riesgo aduanero de alterar valores en un Permiso de Embarque',
      'Mostrar la constancia PDF oficial adjunta del Banco Nación',
      'Resaltar que AFIP y Aduana reciben exactamente el tipo de cambio oficial vendedor a la fecha de embarque',
    ],
    verbatimSpeech:
      'Este caso es emblemático: la Carpeta C620 con costos facturados en Libras Esterlinas (GBP) para una importación aérea de CONICET y SAA Logistics UK Ltd desde Londres a Rosario. La factura naviera sumaba 543 Libras (£506 de flete más £37 de gastos locales en Heathrow). Como Kipintoch Cargo no procesa monedas foráneas fuera de USD, EUR y ARS, el sistema histórico colapsaba imprimiendo asteriscos (***********) en el recuadro del Flete del Permiso de Embarque. La prueba forense quedó en el correo operativo donde se advertía: "Modificá el PE, sacale los asteriscos y ponele aprox USD 740...". En la administración se planteaba con toda la razón del mundo el riesgo de tocar valores en un Permiso de Embarque ante la Ley 22.415 y el Régimen Penal Cambiario. Fíjense en la solución en pantalla: cuando ingresa una factura en Libras, el portal toma automáticamente la cotización oficial vendedor del Banco de la Nación Argentina (BNA) a la fecha exacta del embarque (1.3628). Las 543 Libras arrojan exactamente 740,00 dólares (USD 739,84). Y lo más importante: el sistema descarga y adjunta automáticamente el certificado oficial Boletin_Oficial_BNA_20260225.pdf como constancia documental inmutable. Nadie modifica números a mano, AFIP y la DGA reciben el dato exacto y la empresa opera con tranquilidad jurídica absoluta.',
    technicalSheet: {
      expediente: 'SALJ054596 (Carpeta C620)',
      operacion: 'Importación Aérea EXW Londres (Heathrow - LHR) -> Rosario (CONICET)',
      normativa: 'Ley 22.415 (Código Aduanero) · Régimen Penal Cambiario · AFIP/DGA',
      metrics: [
        { label: 'Importe en Origen', value: '£ 543,00 GBP', detail: '£506 flete + £37 gastos LHR', status: 'warning' },
        { label: 'TC Oficial BNA Vendedor', value: '1.3628', detail: 'Fecha de embarque 25/02/2026', status: 'info' },
        { label: 'Liquidación Canónica', value: 'USD 740,00', detail: 'Equivalente exacto USD 739,84', status: 'success' },
        { label: 'Infracción Aduanera Evitada', value: '100% Blindado', detail: 'Cero alteración manual en SIM/PE', status: 'success' },
      ],
      details: [
        { label: 'Cliente', value: 'CONICET / SAA Logistics UK Ltd' },
        { label: 'Falla ERP Histórico', value: 'Kipintoch colapsaba con asteriscos (***********) en PE', badge: 'ERROR ERP', badgeColor: 'rose' },
        { label: 'Evidencia Operativa', value: 'Falla ERP Kipintoch en divisas no estándar (GBP) y riesgo en PE' },
        { label: 'Constancia Digital BNA', value: 'PDF Boletin_Oficial_BNA_20260225.pdf anexado', badge: 'PDF BNA', badgeColor: 'green' },
        { label: 'Asiento Canónico Kipin', value: 'FMA 50-00000000-0 739.84 USD C620' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Gobernanza / Legal',
          question: '¿Qué validez legal y aduanera tiene la cotización del BNA tomada por el portal frente a una fiscalización?',
          answer: 'Validez plena y vinculante: la normativa aduanera (Ley 22.415 y resoluciones de AFIP) exige tomar el tipo de cambio oficial vendedor del BNA al cierre del día hábil anterior a la fecha de oficialización o embarque. El sistema descarga y vincula el boletín oficial en PDF en el legajo digital, garantizando trazabilidad probatoria inmutable.',
          legalBasis: 'Ley 22.415 Código Aduanero y Régimen Penal Cambiario',
        },
      ],
    },
  },

  11: {
    slideId: 11,
    title: 'Caso Sancor Seguros: Provisión Diferida Automática a 150 Días',
    timeAllocation: '13:30 - 14:45 (01:15 min)',
    keyStakeholders: ['Dirección Financiera', 'Dirección Comercial'],
    whatAudienceSees:
      'Ledger de costos con provisión diferida del 0,55% FOB (USD 357.50) y comisión comercial retenida con badge ámbar hasta recepción de póliza.',
    demoCues: [
      'Explicar el desfasaje de 120-150 días de Sancor Seguros',
      'Señalar la provisión automática del 0,55% sobre FOB en el ledger',
      'Remarcar la regla: cero anticipo de comisiones sobre utilidades ficticias no devengadas',
    ],
    verbatimSpeech:
      'Llegamos a uno de los dolores financieros más profundos identificados en la auditoría: el caso de Sancor Seguros en la Carpeta C1482 de importación de maquinaria agrícola (Metalfor S.A. / John Deere, FOB USD 65.000,00). Sancor demora habitualmente entre 120 y 150 días —hasta 5 meses— en emitir las pólizas definitivas de transporte bajo la Póliza Flotante N° PZA 352330 del broker Baccaro Consultores. Históricamente, ¿qué pasaba? Como la factura de Sancor no había llegado, la carpeta se cerraba a fin de mes mostrando una ganancia inflada de USD 1.250, y ALMAR liquidaba comisiones a los vendedores sobre esa utilidad ficticia (USD 187.50 pagados de más). Cuando a los 4 meses llegaba la factura de seguro de USD 357.50, la ganancia real se desplomaba a USD 892.50, pero la comisión ya se había pagado. Miren cómo lo resuelve el portal: apenas se carga el embarque, el sistema devenga automáticamente una provisión del 0,55% sobre el valor FOB (USD 357.50) en el ledger de costos de la carpeta. Y en el módulo comercial, la comisión del vendedor pasa al estado RETENIDA_COSTOS_PENDIENTES durante la ventana de 150 días. El rol Operativo tiene bloqueado el cierre definitivo hasta que arribe la póliza real de Sancor. Cero anticipo de fondos sobre utilidades no devengadas. El margen real de ALMAR queda 100% protegido.',
    technicalSheet: {
      expediente: 'C1482 (Póliza Flotante ALMAR N° PZA 352330)',
      operacion: 'Importación Marítima Maquinaria Agrícola Metalfor S.A. (FOB USD 65.000,00)',
      normativa: 'ISO 9001:2015 NC-01 · Devengamiento Contable de Costos R2',
      metrics: [
        { label: 'Demora Emisión Sancor', value: '120 - 150 días', detail: 'Desfasaje habitual 4 a 5 meses', status: 'danger' },
        { label: 'Provisión Automática FOB', value: '0.55%', detail: 'USD 357.50 devengados en carpeta', status: 'success' },
        { label: 'Póliza RC Global', value: 'USD 6.800', detail: 'Broker Baccaro Consultores', status: 'info' },
        { label: 'Estado Comisión Venta', value: 'HOLD BACK', detail: 'RETENIDA_COSTOS_PENDIENTES', status: 'warning' },
      ],
      details: [
        { label: 'Cliente / Vendedor', value: 'Metalfor S.A. / John Deere · Comercial: Lucía Laje' },
        { label: 'Mecanismo de Fuga Viejo', value: 'Cierre sin póliza = ganancia inflada y pago indebido de comisiones', badge: 'FUGA CAJA', badgeColor: 'rose' },
        { label: 'Margen Ficticio Viejo', value: 'USD 1.250 (comisión 15% pagada de más: USD 187.50)' },
        { label: 'Margen Real con Provisión', value: 'USD 892.50 (comisión real legítima USD 133.88)', badge: 'PROTEGIDO', badgeColor: 'green' },
        { label: 'Control RBAC Perfil', value: 'Operativo bloqueado de cerrar; solo Finanzas/Gerencia concilia' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Comercial',
          question: '¿Retener la comisión por 150 días no genera malestar en los comerciales que ya cerraron la venta?',
          answer: 'Al contrario, protege al comercial y a la empresa: si pagamos comisiones sobre utilidades ficticias y a los 4 meses llega la factura de USD 357 de Sancor, tendríamos que descontarle plata de su sueldo en el mes siguiente. El holdback le liquida sobre utilidad neta real y comprobada, garantizando un esquema de incentivos sano.',
          legalBasis: 'Principio de Devengamiento Contable y Equilibrio Comercial',
        },
      ],
    },
  },

  12: {
    slideId: 12,
    title: 'Caso C1234: Alerta Preventiva & Autorización Biométrica WebAuthn',
    timeAllocation: '14:45 - 16:00 (01:15 min)',
    keyStakeholders: ['Dirección Comercial', 'Dirección Financiera', 'Gobernanza & IT'],
    whatAudienceSees:
      'Carpeta C1234 con margen proyectado de USD 142.50 (< USD 200), diálogo WebAuthn con huella digital y hash SHA-256 de 64 caracteres.',
    demoCues: [
      'Citar el planteo de Vanesa: el operativo no controla márgenes chicos y en pesos dan pérdida',
      'Mostrar cómo el sistema dispara la alerta en USD 200 automáticamente',
      'Mostrar el sensor animado de huella digital Touch ID / Windows Hello',
      'Señalar la cadena hash SHA-256 generada conforme a la Ley de Firma Digital 25.506',
    ],
    verbatimSpeech:
      'En la Carpeta C1234 de Dis-Den Odontología / Calamante S.R.L. (instrumental odontológico Guilin Woodpecker, agente Eversail Shenzhen Vic Mai, Maersk KA0018437, HBL ESZFL26060067, contenedor MSKU7842897, Venta USD 1.950,00, Costo USD 1.807,50) vemos en vivo exactamente lo que advirtió Vanesa Meggiolaro en sus audios: primero, que el operativo desbordado en el día a día no suele mirar si la operación deja apenas 5 dólares de ganancia o si la naviera cobró de más; y segundo, la necesidad de fijar la alerta en USD 200 por el riesgo de descalce pesos/dólares, donde 50 o 100 dólares de margen en la planilla terminan dando pérdida neta al pasarse a pesos por gastos portuarios e impuestos. Con un margen resultante de USD 142.50 vs el umbral preventivo de USD 200, el sistema encendió inmediatamente el semáforo preventivo y la autorización biométrica WebAuthn por Alejandro Noacco en 3 segundos. Cero contraseñas que se filtren. Se genera una firma con hash SHA-256 de 64 caracteres con plena validez legal bajo la Ley Nacional de Firma Digital Nº 25.506 (art. 5). La Dirección autoriza en 3 segundos y ALMAR queda con respaldo probatorio absoluto.',
    technicalSheet: {
      expediente: 'C1234 (BL KA0018437 / HBL ESZFL26060067 / Contenedor MSKU7842897)',
      operacion: 'Importación Odontológica Dis-Den / Calamante S.R.L. (Guilin Woodpecker) · Eversail Shenzhen Vic Mai · Maersk KA0018437',
      normativa: 'Ley Nacional de Firma Digital Nº 25.506 (art. 5) · Protocolo FIDO2 / W3C WebAuthn',
      metrics: [
        { label: 'Venta / Costo Real', value: 'V: USD 1.950 / C: USD 1.807,50', detail: 'Sobrecosto naviero detectado', status: 'danger' },
        { label: 'Margen Proyectado', value: 'USD 142.50', detail: 'Umbral preventivo: USD 200.00', status: 'warning' },
        { label: 'Tiempo de Autorización', value: '3 segundos', detail: 'Sensor Touch ID / Windows Hello', status: 'success' },
        { label: 'Firma Criptográfica', value: 'SHA-256 (64 car)', detail: 'Audit log inmutable no repudiable', status: 'success' },
      ],
      details: [
        { label: 'Cliente', value: 'Dis-Den Odontología / Calamante S.R.L. (Horacio y Norberto Calamante S.H., CUIT 30-68048259-9)' },
        { label: 'Armador / Facturas', value: 'Maersk Line A/S (FC N° 7554566633 y N° 7554364222)' },
        { label: 'Planteo Vanesa Audios', value: 'Alerta preventiva en USD 200 por descalce con pesos y falta de control manual' },
        { label: 'Semáforo Activado', value: 'Alerta amarilla preventiva < USD 200 (bloqueo rojo solo < USD 3.00)', badge: 'ALERTA', badgeColor: 'amber' },
        { label: 'Hash Probatorio', value: 'd8a4f91b72e045c83210bc6a98711e4f9b8c347d0182ec35ab120984de63f512', badge: 'SHA-256', badgeColor: 'green' },
        { label: 'Autorizante', value: 'Alejandro Noacco (WebAuthn / TPM 2.0 Hardware)' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Financiera (Vanesa)',
          question: '¿Por qué la alerta salta en USD 200 y no bloquea directamente?',
          answer: 'Porque una alerta amarilla preventiva informa el descalce cambiario al pasar a pesos sin trabar la venta. Si Dirección decide asumirlo o negociarlo, se autoriza en 3 segundos con huella dactilar. Solo se bloquea de forma estricta si da pérdida neta segura (< USD 3.00).',
          legalBasis: 'Gestión Preventiva de Riesgo Financiero',
        },
      ],
    },
    objections: [
      {
        stakeholder: 'Dirección Financiera (Vanesa)',
        objection: '¿Cómo evita el sistema que una ganancia de USD 100 termine dando pérdida al pasarse a pesos?',
        response:
          'Con la alerta preventiva de USD 200 que propuso Vanesa: si el margen cae por debajo de USD 200, el sistema avisa para revisar el impacto cambiario antes de facturar al cliente.',
      },
    ],
  },

  13: {
    slideId: 13,
    title: 'Caso Triangulación (Net Trade Miami) & Conciliación Banco Macro',
    timeAllocation: '16:00 - 17:15 (01:15 min)',
    keyStakeholders: ['Gobernanza & IT', 'Dirección Financiera'],
    whatAudienceSees:
      'Trazabilidad de prefacturas Net Trade LLC (IFB Miami) y tabla de conciliación bancaria con cuenta corriente Banco Macro Nº 376100000930617.',
    demoCues: [
      'Explicar el vínculo directo entre el expediente en Kipin y Net Trade LLC',
      'Recorrer los 3 estados de cobranza: EMITIDA_PENDIENTE_COBRO -> EN_VERIFICACION -> COBRADA_CONCILIADA',
      'Remarcar: cero recibos por WhatsApp sin dinero real acreditado en extracto',
    ],
    verbatimSpeech:
      'Cerramos los casos auditados con dos pilares de alta sensibilidad financiera y fiscal: Primero, las Operaciones Triangulares con Net Trade LLC en Miami (1395 Brickell Ave, TAX ID 35-2756633), documentadas bajo el expediente canónico EM1056 (C-202604EM-00001056). Cuando se emiten prefacturas al exterior a través de Net Trade y su cuenta en International Finance Bank (IFB), el sistema vincula automáticamente ese comprobante offshore con la carpeta operativa local en Rosario. Y antes de permitir el cierre, audita que los costos locales abonados por ALMAR hayan sido reembolsados formalmente desde IFB, cumpliendo con la normativa cambiaria del BCRA y Precios de Transferencia (art. 15 de la Ley de Ganancias). Segundo, la Conciliación Obligatoria en Banco Macro. Establecimos un flujo de cobranzas en tres pasos: EMITIDA_PENDIENTE_COBRO → EN_VERIFICACION_BANCARIA → COBRADA_CONCILIADA. Si un cliente manda un volante de transferencia por WhatsApp, pasa a verificación. Pero el sistema prohíbe taxativamente emitir el recibo oficial o liberar comisiones hasta que Finanzas no concilia ese importe contra el movimiento real del extracto bancario de la cuenta corriente de Banco Macro (cuenta Nº 376100000930617, CBU 2850761530000009306179). Si la plata no impactó en el banco, el recibo no se emite. Tesorería blindada al 100%. Y ahora, pasemos a lo que todos quieren ver: la demostración en vivo de la plataforma en funcionamiento.',
    technicalSheet: {
      expediente: 'EM1056 (C-202604EM-00001056) / TRIANGULACION_NET_TRADE_MACRO',
      operacion: 'Operaciones Offshore Net Trade LLC Miami (EM1056) & Cobranzas Banco Macro',
      normativa: 'Precios de Transferencia (art. 15 LIG) · Com. "A" BCRA · Régimen Penal Cambiario',
      metrics: [
        { label: 'Entidad Offshore Miami', value: 'Net Trade LLC', detail: '1395 Brickell Ave, IFB Miami', status: 'info' },
        { label: 'Cta Cte Banco Macro', value: '376100000930617', detail: 'CBU 2850761530000009306179', status: 'success' },
        { label: 'Cobranzas Mes Conciliadas', value: 'ARS $34.85M', detail: '98.2% conciliado automático', status: 'success' },
        { label: 'Recibos por WhatsApp', value: '0 emitidos', detail: 'Retención estricta sin extracto', status: 'danger' },
      ],
      details: [
        { label: 'Carpeta Canónica', value: 'EM1056 (C-202604EM-00001056) · Expo Marítima Net Trade LLC', badge: 'EM1056', badgeColor: 'navy' },
        { label: 'Flujo de Cobranza (3 Pasos)', value: 'EMITIDA_PENDIENTE -> EN_VERIFICACION -> COBRADA_CONCILIADA' },
        { label: 'Hard Gate de Tesorería', value: 'Prohibido emitir recibo o liberar comisión sin acreditación real en CC Macro', badge: 'HARD GATE', badgeColor: 'rose' },
        { label: 'Caso Cuello (Argon Comex)', value: 'Factura A $1.617.000 acreditada TRB-0761-806121 -> Recibo REC-2026-1042', badge: 'CONCILIADO', badgeColor: 'green' },
        { label: 'Caso IQUIR / CONICET', value: 'Factura B $5.240.144, pago parcial $1.900.279 retenida en verificación', badge: 'RETENIDO', badgeColor: 'amber' },
        { label: 'Sustancia Económica', value: 'Reembolso certificado de costos locales desde cuenta IFB en Florida' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Financiera',
          question: '¿Qué pasa si un cliente exige el recibo oficial con urgencia pero el extracto bancario de Macro tarda 24 horas en reflejar el crédito?',
          answer: 'La carpeta permanece en estado EN_VERIFICACION_BANCARIA. La operadora puede enviarle una constancia provisoria de recepción de trámite, pero el Recibo Oficial AFIP y la liquidación de comisiones quedan estrictamente retenidos hasta que el dinero impacta en la cuenta 376100000930617. Cero cheques rebotados o transferencias revocadas en la contabilidad de ALMAR.',
          legalBasis: 'Control de Tesorería y Blindaje de Disponibilidades',
        },
      ],
    },
  },

  14: {
    slideId: 14,
    title: 'Demostración en Vivo de la Solución en Funcionamiento',
    timeAllocation: '17:15 - 21:00 (03:45 min)',
    keyStakeholders: ['Directorio Ejecutivo'],
    whatAudienceSees:
      'Puente a la demo real: 4 estaciones (Ingesta en 5s, Detección de desvío, Copiado en 1-clic a Kipintoch y Tablero de Métricas de Productividad) con badge EN VIVO.',
    demoCues: [
      'Arrastrar una factura PDF real de Maersk a la bandeja o usar "+ Nuevo Comprobante" para remitos manuales',
      'Mostrar la detección automática del sobrecosto de USD 180',
      'Demostrar la Corrección OCR en 3 segundos ("✏️ Corregir OCR") y el Descarte Lógico con trazabilidad AFIP / ISO 9001',
      'Explicar el desglose multi-carpeta: fin del subrayado a mano con resaltador para facturas unificadas de navieras',
      'Ejecutar la autorización y el copiado en 1-clic a Kipintoch en 15 segundos',
      'Mostrar el Bot Copilot Flotante en la esquina inferior para reporte ágil de tickets (#TKT-8421)',
      'Abrir el Tablero de Rendimiento & Productividad con las métricas del equipo',
    ],
    verbatimSpeech:
      'Voy a conmutar en este instante al navegador para que vean el sistema operando en tiempo real con datos y comprobantes reales. Miren la pantalla: acá tenemos el portal en vivo. Voy a tomar una factura marítima real en PDF de Maersk y la voy a soltar en la bandeja de entrada de Comprobantes. Fíjense: uno, dos, tres... cuatro segundos. El documento ya fue procesado. Hago clic y abro el Visor Dual: a la izquierda tienen el PDF original tal cual llegó del armador. A la derecha, el motor ya desglosó el CUIT de Maersk, discriminó el flete marítimo internacional, reconoció el recargo BAF y lo mapeó automáticamente a BUFF al 21% de IVA, y calculó los conceptos gravados. ¿Y qué pasa si una factura no vino por email, sino que es un remito en papel que trajo un chofer, un gasto pagado en ventanilla de terminal o un PDF enviado por WhatsApp? Tocan "+ Nuevo Comprobante" y la registran en 15 segundos con recálculo automático de IVA y destino a carpeta. Además, si el PDF vino borroso o con tipografía atípica, desde la supervisión tocan "✏️ Corregir OCR", ajustan el CUIT o importe en 3 segundos y el sistema guarda el diff exacto en el Registro de Auditoría; o si la naviera mandó un duplicado, se aplica "Descarte Lógico" justificado para AFIP e ISO 9001. Y si este comprobante ampara contenedores de distintas carpetas —el típico caso donde las chicas hoy van subrayando con resaltador en papel qué renglón va a cada expediente—, el visor permite asignar cada ítem a su carpeta destino (C1234 Dis-Den Odontología / Calamante S.R.L., C1482) con balance en cero automático en pantalla. Pero observen lo que ocurre con el margen: el sistema cruzó la factura contra la carpeta de Kipintoch y detectó que el armador facturó 180 dólares más de lo cotizado. La tarjeta se fue automáticamente a la columna "Con Desvío de Tarifa" y el botón de facturación está deshabilitado. Si inicio sesión como Stefania en rol Operativo, no puedo destrabarlo. Pero si inicio sesión como Gerencia, se activa este botón: "Autorizar Desvío Gerencial". Hago clic, selecciono el motivo, pongo la huella digital en la laptop y el sistema estampa la firma digital con respaldo probatorio en el log de auditoría. La carpeta queda autorizada. Y ahora miren esto: presiono "Copiar Ficha a Kipintoch". Los 5 campos canónicos están en mi portapapeles. Stefania abre Kipintoch, pega los datos, y en 15 segundos la factura está cargada sin tipear un solo número a mano. Y si cualquier operadora tiene una duda, hace clic en el Bot Copilot de la esquina inferior y genera un ticket #TKT-8421 en 5 segundos. Finalmente, el Tablero de Métricas de Rendimiento: al hacer clic, el Directorio ve exactamente el volumen por operador, tiempos reales de resolución y los USD 14.890 en sobrecostos retenidos a Maersk, MSC, TRP y LGV. Cero opacidad operativa.',
    technicalSheet: {
      expediente: 'LIVE_DEMO_VERCEL_LOCALHOST',
      operacion: 'Demostración Interactiva en Vivo: Ingesta, Visor Dual, WebAuthn y Copiado a Kipintoch',
      normativa: 'Validación en Tiempo Real de Reglas de Negocio y Control de Calidad',
      metrics: [
        { label: 'Ingesta PDF Maersk', value: '< 4 seg', detail: 'Extracción completa de campos', status: 'success' },
        { label: 'Detección Sobrecosto', value: '+USD 180', detail: 'Retención preventiva en Kanban', status: 'danger' },
        { label: 'Copiado a Kipintoch', value: '15 seg', detail: '5 campos canónicos en 1 clic', status: 'success' },
        { label: 'Sobrecostos Totales Prevenidos', value: 'USD 14.890', detail: '8 desvíos navieros bloqueados', status: 'success' },
      ],
      details: [
        { label: 'Comprobante de Prueba', value: 'Factura marítima real en PDF de Maersk Line A/S' },
        { label: 'Desglose Multi-Carpeta', value: 'Smart Split con ticker de saldo restante a cero (sustituye resaltador)', badge: 'SMART SPLIT', badgeColor: 'green' },
        { label: 'Mapeo Semántico en Vivo', value: 'Reconocimiento instantáneo de recargo BAF a código BUFF AFIP', badge: 'BUFF', badgeColor: 'green' },
        { label: 'Role-Based Access (RBAC)', value: 'Stefania (Operativo) bloqueada; Gerencia autoriza con huella biométrica' },
        { label: 'Scorecard Operadores', value: '5 operadores evaluados con métricas de productividad en vivo' },
        { label: 'Conciliación de Carpetas', value: '12 de 12 carpetas activas auditadas: Diferencia Costo vs Facturas = 0,00', badge: 'DIF 0,00', badgeColor: 'green' },
        { label: 'Trazabilidad Comercial', value: 'Cotizaciones vinculadas a sus comerciales reales (Juan Arloro, Lucía Laje, Martín Fusco, Abril Stampfli)' },
      ],
      scorecard: OPERATOR_SCORECARD,
      hardQuestions: [
        {
          stakeholder: 'Gobernanza / Legal',
          question: '¿Qué ocurre si durante la demostración en vivo se corta internet o falla el servidor?',
          answer: 'El sistema cuenta con resiliencia dual: opera en entorno local localhost:3000 con fixtures cacheados de contingencia y réplica en la nube en Vercel Edge con 99.99% de disponibilidad. Nada queda librado al azar.',
          legalBasis: 'Alta Disponibilidad y Tolerancia a Fallos',
        },
      ],
    },
  },

  15: {
    slideId: 15,
    title: 'Circuito de Reporte de Incidencias & Triage Operativo en Vivo',
    timeAllocation: '21:00 - 22:15 (01:15 min)',
    keyStakeholders: ['Gobernanza & IT', 'Dirección Financiera'],
    whatAudienceSees:
      'Widget flotante de triage in situ, tipificación en 10s, ticket formal #TKT-8421 en audit_log y asistente conversacional Copilot IA.',
    demoCues: [
      'Apuntar al botón flotante en la esquina inferior del portal',
      'Mostrar la auto-captura de contexto sin tipear datos repetidos',
      'Explicar la arquitectura de aprendizaje: cero fine-tuning costoso, RAG y reglas de negocio inmediatas',
      'Explicar cómo el caso borde no frena la operación y calibra las reglas en < 24hs',
    ],
    verbatimSpeech:
      'Hay un elemento clave que diseñamos para garantizar que la transición durante el piloto sea impecable y que ningún caso quede en el aire: En los primeros días de cualquier sistema nuevo, lo normal es que aparezcan comprobantes atípicos, gastos portuarios no presupuestados o dudas de los operadores. Si el proceso de soporte es burocrático, el usuario se frustra y el sistema pierde tracción. Por eso incorporamos este Circuito de Reporte de Incidencias & Triage Operativo in situ: El operador está trabajando en la carpeta C1234 de Dis-Den Odontología / Calamante S.R.L. y detecta un gasto no cotizado de Maersk, como este "Cleaning Fee" de 45 dólares que redujo el margen. No tiene que abrir un correo ni redactar un formulario largo: simplemente toca el botón flotante disponible 24/7 en la esquina inferior. El sistema auto-captura todo el contexto en tiempo real: sabe que está en C1234, qué usuario está operando y qué rol tiene. El operador solo hace dos clics: elige el tipo —"Caso Borde"—, la severidad —"Bloqueante"— y escribe una línea. Al presionar Enviar, el sistema estampa de inmediato un ticket formal #TKT-8421 en el libro de auditoría, deriva el caso a la columna de Desvíos del Kanban para no frenar la facturación general, y nos llega la alerta a nosotros para calibrar la regla de extracción en menos de 24 horas. Y un punto técnico central que quiero dejarles muy claro: esto desmitifica la IA. No se necesita un reentrenamiento costoso de modelos ni meses de fine-tuning. El reporte alimenta la base de conocimiento y el diccionario de excepciones de ALMAR para que la próxima vez el sistema ya sepa resolverlo automáticamente. Y si el personal tiene una duda operativa, hace clic en Copilot IA y un asistente inteligente le responde al instante según los criterios de ALMAR. Bajo norma ISO 9001, cada incidente queda medido y versionado. Mejora continua en tiempo real. Veamos ahora cómo sintetizamos todas las decisiones en la matriz de resolución.',
    technicalSheet: {
      expediente: 'TRIAGE_INCIDENCIAS_TKT',
      operacion: 'Widget Flotante In Situ & Calibración de Reglas en Piloto (#TKT-8421)',
      normativa: 'ISO 9001:2015 § 8.5 · Gestión de No Conformidades y Acciones Correctivas',
      metrics: [
        { label: 'Tipificación Reporte', value: '< 10 seg', detail: 'Auto-captura de pantalla y contexto', status: 'success' },
        { label: 'Resolución Caso Borde', value: '< 24 hs', detail: 'Calibración de regla en caliente', status: 'success' },
        { label: 'Disponibilidad Widget', value: '24 / 7', detail: 'Flotante en todas las vistas', status: 'info' },
        { label: 'Tasa Cumplimiento SLA', value: '98.2%', detail: 'Sin trabar el flujo de facturación', status: 'success' },
      ],
      details: [
        { label: 'Ticket Formal Emitido', value: '#TKT-8421 estampado en audit_log inmutable', badge: 'TICKET #TKT', badgeColor: 'green' },
        { label: 'Contexto Capturado', value: 'Carpeta, usuario activo, rol, pantalla y datos del comprobante' },
        { label: 'Aprendizaje sin Fine-Tuning', value: 'Reglas semánticas inmediatas y memoria RAG sin reentrenar redes neuronales' },
        { label: 'Canalización Kanban', value: 'Deriva a columna Desvíos; la facturación general continúa' },
        { label: 'Copilot Asistencial', value: 'Asistente IA para dudas operativas del personal' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Dirección Financiera',
          question: '¿Un comprobante con un recargo raro va a frenar toda la facturación del día durante las primeras semanas?',
          answer: 'Bajo ninguna circunstancia. El sistema aísla exclusivamente ese comprobante en la columna "Con Desvío" con su ticket de triage, mientras las restantes 30 facturas del día se copian a Kipintoch normalmente. El caso atípico se calibra en menos de 24 horas sin frenar la cobranza.',
          legalBasis: 'Continuidad Operativa y Aislamiento de Desvíos',
        },
      ],
    },
  },

  16: {
    slideId: 16,
    title: 'Matriz de Resolución de Desafíos Operativos y Estratégicos',
    timeAllocation: '22:15 - 23:15 (01:00 min)',
    keyStakeholders: ['Directorio Ejecutivo'],
    whatAudienceSees:
      'Grilla de 3 columnas con respuestas estructuradas por eje directivo: Gestión Comercial, Control Financiero y Gobernanza / Legal.',
    demoCues: [
      'Recorrer los tres ejes estratégicos de la matriz directiva',
      'Cerrar el ciclo de cada objeción planteada en la entrevista de relevamiento',
      'Destacar la armonía entre velocidad comercial y blindaje fiscal',
    ],
    verbatimSpeech:
      'Esta matriz sintetiza el compromiso de diseño que asumimos con la conducción de ALMAR: Para la Gestión Comercial: velocidad comercial con perfiles dinámicos y captura sistemática de pérdidas para negociar volumen con navieras. Para el Control Financiero: freno taxativo a tarifas caducadas, provisión diferida de seguros para no liquidar comisiones prematuras y conciliación bancaria estricta en Banco Macro. Y para la Gobernanza Legal e Informática: firmas biométricas inatacables bajo la Ley de Firma Digital 25.506 y custodia absoluta de los secretos comerciales de ALMAR con OpenAI Zero Data Retention. Cero contradicción entre velocidad operativa y rigor legal. Revisemos ahora el diagrama de arquitectura y cómo se integra con la Intranet existente de ALMAR.',
    technicalSheet: {
      expediente: 'MATRIZ_DIRECTIVA_ALMAR',
      operacion: 'Alineación Estratégica: Comercial, Finanzas y Legal/Sistemas',
      normativa: 'Gobierno Corporativo ALMAR Rosario · Consenso Directivo',
      metrics: [
        { label: 'Ejes Directivos', value: '3 directores', detail: 'Respuestas específicas integradas', status: 'info' },
        { label: 'Crecimiento Comercial', value: '+18%', detail: 'Conversión por smart follow-up', status: 'success' },
        { label: 'Blindaje Financiero', value: 'USD 14.890', detail: 'Sobrecostos anualizados prevenidos', status: 'success' },
        { label: 'Seguridad Legal', value: '100% no repudio', detail: 'Firma digital Ley 25.506', status: 'success' },
      ],
      details: [
        { label: 'Gestión Comercial', value: 'Agilidad cotización 45s, perfiles flexibles, feedback pérdidas navieras' },
        { label: 'Control Financiero', value: 'Semáforo tarifas 15/30d, provisión Sancor 150d, conciliación Banco Macro' },
        { label: 'Gobierno IT & Legal', value: 'WebAuthn Ley 25.506, OpenAI ZDR store:false, soberanía de datos' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Directorio Ejecutivo',
          question: '¿Cuál es el siguiente paso para implementar esta solución en ALMAR?',
          answer: 'Aprobar el inicio de la Etapa 1 de la Hoja de Ruta para conectar las credenciales corporativas de OpenAI y habilitar el piloto asistido de 50 facturas con el equipo operativo.',
          legalBasis: 'Decisión de Directorio y Aprobación de Proyecto',
        },
      ],
    },
  },

  17: {
    slideId: 17,
    title: 'Arquitectura de Producción, Diagrama e Integración en Intranet Firebase',
    timeAllocation: '23:15 - 24:15 (01:00 min)',
    keyStakeholders: ['Gobernanza & IT'],
    whatAudienceSees:
      'Diagrama de 4 capas: Intranet Firebase (Iframe CSP, SSO JWT) -> Vercel Edge Serverless -> OpenAI ZDR soberano (store: false) -> Supabase PostgreSQL São Paulo.',
    demoCues: [
      'Destacar el SSO transparente con Firebase: cero contraseñas nuevas para el personal',
      'Explicar el parámetro contractual store: false de OpenAI (cero entrenamiento con datos de ALMAR)',
      'Mencionar el listener de correo corporativo para ingesta desatendida de comprobantes',
      'Mostrar la baja latencia de Supabase en São Paulo (< 35ms)',
    ],
    verbatimSpeech:
      'Analicemos la arquitectura técnica y cómo se ensambla con los sistemas que ALMAR ya utiliza hoy: Punto 1: Embebido Directo en la Intranet Firebase de ALMAR. Estudiamos la intranet corporativa que ustedes tienen montada sobre Firebase y les confirmo que la integración es 100% directa y transparente: podemos embeber este portal como una solapa interna dentro de su intranet mediante un contenedor seguro con Content-Security-Policy. Y lo mejor: Single Sign-On (SSO). Reutilizamos la sesión activa de Firebase Authentication mediante tokens JWT. El personal operativo no tiene que aprenderse otro usuario ni otra contraseña: entra a su intranet habitual y el sistema ya sabe quién es y qué rol tiene. Punto 2: Procesamiento Serverless en Vercel Edge con 99,99% de uptime y listener automático para ingesta directa de correos. Punto 3: Soberanía Absoluta en OpenAI con Zero Data Retention. ALMAR contrata directamente su cuenta empresarial. Con el parámetro store: false, OpenAI procesa la factura en memoria volátil y la destruye en el acto. Cero persistencia y cero entrenamiento con sus datos. Punto 4: Base de datos en Supabase São Paulo con latencia menor a 35 milisegundos y respaldo pericial pleno. Ahorro de más de $6.000.000 ARS al año en licencias y conectores cerrados. Cero servidores en la oficina. Veamos el cronograma para poner esto en marcha en 4 etapas.',
    technicalSheet: {
      expediente: 'ARQUITECTURA_CLOUD_ZDR',
      operacion: 'Topología de Producción: Intranet Firebase, Vercel Edge, OpenAI ZDR & Supabase',
      normativa: 'OpenAI Enterprise SLA § 3.2 · SOC 2 Type II · ISO 27001',
      metrics: [
        { label: 'Disponibilidad Vercel', value: '99.99%', detail: 'Edge serverless sin servidores locales', status: 'success' },
        { label: 'Latencia Supabase', value: '< 35 ms', detail: 'PostgreSQL São Paulo con RLS', status: 'success' },
        { label: 'Retención de Datos IA', value: '0 días', detail: 'store: false volátil garantizado', status: 'success' },
        { label: 'Ahorro Conectores Kipin', value: '$6.000.000 ARS', detail: 'Anual por copiado estructurado', status: 'success' },
      ],
      details: [
        { label: 'Capa 1: Front-end Intranet', value: 'Embebido seguro Iframe CSP en Intranet Firebase de ALMAR' },
        { label: 'Autenticación', value: 'Single Sign-On (SSO) con tokens JWT existentes de Firebase', badge: 'SSO JWT', badgeColor: 'green' },
        { label: 'Capa 2: Cómputo Edge & Listener', value: 'Vercel Edge Functions y listener de correo para ingesta directa' },
        { label: 'Capa 3: Extracción IA', value: 'OpenAI API empresarial con cláusula contractual Zero Data Retention', badge: 'ZDR STORE:FALSE', badgeColor: 'green' },
        { label: 'Capa 4: Base de Datos', value: 'Supabase PostgreSQL São Paulo con encriptación en reposo' },
      ],
      hardQuestions: [
        {
          stakeholder: 'Gobernanza / Legal',
          question: '¿OpenAI puede utilizar las facturas o contratos de ALMAR para entrenar sus modelos de Inteligencia Artificial?',
          answer: 'Categóricamente no. En los contratos corporativos de la API de OpenAI rige la cláusula § 3.2 de Zero Data Retention: los datos enviados con el parámetro "store: false" se procesan en la memoria RAM del servidor y se destruyen inmediatamente tras generar la respuesta. No hay retención en disco ni aprendizaje de modelos con la información de ALMAR.',
          legalBasis: 'Cláusula § 3.2 de Zero Data Retention y SOC 2 Type II',
        },
      ],
    },
  },

  18: {
    slideId: 18,
    title: 'Hoja de Ruta de Puesta en Marcha (4 Etapas) y Decisión Directiva',
    timeAllocation: '24:15 - 25:00 (00:45 min)',
    keyStakeholders: ['Directorio Ejecutivo'],
    whatAudienceSees:
      'Cronograma de 4 etapas (E1 Set-up, E2 Inicio Piloto 50 facturas, E3 Calibración Fina, E4 Régimen Definitivo) y callout verde bosque de decisión directiva.',
    demoCues: [
      'Apuntar con convicción a la Etapa 1 de inicio inmediato',
      'Enfatizar el despliegue escalonado de accesos para evitar desorden el día 1',
      'Enfatizar que la plataforma ya está construida, testeada y operativa',
      'Hacer el cierre formal pidiendo la aprobación para arrancar la Etapa 1',
    ],
    verbatimSpeech:
      'Para cerrar, este es el plan de puesta en marcha propuesto por etapas: Y un criterio clave de gestión del cambio que les propongo: no le damos acceso a todo el personal el Día 1. Abrir el sistema de golpe generaría confusión ante los primeros comprobantes atípicos. Planteamos un despliegue quirúrgico: En la Etapa 1, se da de alta la cuenta corporativa de OpenAI de ALMAR, conectamos las claves a Vercel/Supabase y arrancamos con el equipo de operaciones en un grupo de control de 50 facturas en paralelo con su método habitual. En la Etapa 2, sumamos al área comercial para la Calculadora Paramétrica y el Smart Follow-Up a 48 hs. En la Etapa 3, integramos Tesorería y Administración para conciliar Banco Macro y Net Trade Miami. Y en la Etapa 4, abrimos la plataforma a toda la organización con el Scorecard de Productividad y las reglas 100% calibradas. La plataforma está lista, testeada y funcionando. Les propongo que demos por aprobada la Etapa 1 para iniciar el despliegue. Quedo a disposición del Directorio para responder sus consultas. Muchas gracias.',
    technicalSheet: {
      expediente: 'HOJA_DE_RUTA_PILOTO_30D',
      operacion: 'Plan de Despliegue en 4 Etapas: Setup, Piloto 50 Facturas, Calibración y Producción',
      normativa: 'ISO 9001:2015 · Planificación del Cambio § 6.3',
      metrics: [
        { label: 'Duración del Plan', value: '4 etapas', detail: 'Despliegue gradual por fases operativas', status: 'info' },
        { label: 'Capacitación Personal', value: '45 min', detail: 'Sesión focalizada por rol y área', status: 'success' },
        { label: 'Piloto Controlado', value: '50 facturas', detail: 'Lote inicial en paralelo en Etapa 1', status: 'success' },
        { label: 'Meta Eficiencia Final', value: '-98% tiempo', detail: '100% facturas en régimen definitivo', status: 'success' },
      ],
      details: [
        { label: 'Etapa 1: Configuración & Piloto 0', value: 'Alta OpenAI ALMAR (ZDR) + 50 facturas en paralelo con equipo operativo', badge: 'PILOTO INICIAL', badgeColor: 'green' },
        { label: 'Etapa 2: Módulo Comercial', value: 'Acceso Área Comercial: Calculadora y Smart Follow-Up' },
        { label: 'Etapa 3: Tesorería & Legal', value: 'Acceso Administración y Tesorería: Conciliación Banco Macro y Net Trade' },
        { label: 'Etapa 4: Régimen Definitivo', value: 'Despliegue a toda la organización con Scorecard de Productividad', badge: 'PRODUCCIÓN', badgeColor: 'green' },
      ],
      scorecard: OPERATOR_SCORECARD,
      hardQuestions: [
        {
          stakeholder: 'Directorio ALMAR',
          question: '¿Qué inversión adicional en licencias o infraestructura debe desembolsar ALMAR para arrancar la Etapa 1?',
          answer: 'Cero inversión en infraestructura: el software ya está completamente desarrollado y testeado. Solo se requiere dar de alta la cuenta corporativa de OpenAI de ALMAR (costo estimado menor a USD 15 mensuales según volumen) e iniciar de inmediato.',
          legalBasis: 'Eficiencia de Capital y Retorno Inmediato de Inversión',
        },
      ],
    },
  },
};

