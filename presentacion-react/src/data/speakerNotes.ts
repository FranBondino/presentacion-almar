import { SpeakerNotesData } from '../types/presentation';

export const SPEAKER_NOTES: Record<number, SpeakerNotesData> = {
  1: {
    slideId: 1,
    title: 'Portada Ejecutiva: Apertura y Encuadre Directivo',
    timeAllocation: '00:00 - 01:15 (01:15 min)',
    keyStakeholders: ['Alejandro Noacco', 'Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Portada editorial limpia de Clave Consultora (fondo platino, acentos verde bosque y dorado, isotipos oficiales, metadatos ejecutivos: Ing. Fran Bondino, Directorio ALMAR).',
    demoCues: [
      'Señalar el logotipo conjunto Clave-ALMAR',
      'Destacar la píldora de demo tecnológica oficial 2026',
      'Remarcar que no es teoría: se mostrarán casos reales y demo en vivo',
    ],
    verbatimSpeech:
      'Buenos días Alejandro, Vanesa, Juan. Les agradezco enormemente este espacio de trabajo directivo. El motivo de esta convocatoria es presentarles la solución tecnológica definitiva desarrollada para ALMAR Rosario: una plataforma de inteligencia operativa que automatiza la ingesta de facturas de proveedores, agiliza la gestión comercial de cotizaciones, audita los costos en tiempo real contra Kipintoch y blinda la rentabilidad de la empresa. Hoy no les vengo a mostrar diapositivas teóricas con promesas a futuro. Vamos a recorrer en 15 minutos la arquitectura del sistema, las soluciones concretas a los reclamos comerciales de Alejandro, los blindajes financieros pedidos por Vanesa y la seguridad jurídica que exige Juan Andrés. E inmediatamente después, nos pasamos a la pantalla en vivo del portal para procesar facturas reales frente a ustedes. Comencemos con los números reales de la operación.',
  },
  2: {
    slideId: 2,
    title: 'Diagnóstico Operativo & Comercial: Facturación y Procesos',
    timeAllocation: '01:15 - 02:45 (01:30 min)',
    keyStakeholders: ['Vanesa Meggiolaro', 'Alejandro Noacco'],
    whatAudienceSees: '3 tarjetas KPI de diagnóstico (Flujo Fragmentado, Carga Manual, Seguimiento Discontinuo), grilla de 3 ejes operativos con cajas de fuga y callout inferior dorado.',
    demoCues: [
      'Apuntar a la dispersión de comprobantes en casillas de correo',
      'Resaltar el cuello de botella en Kipintoch (8 a 12 min por comprobante manual)',
      'Subrayar la pérdida de cotizaciones dormidas sin seguimiento estructurado',
    ],
    verbatimSpeech:
      'En el circuito administrativo y operativo, la recepción de comprobantes está completamente fragmentada: llegan facturas y notas de débito de armadores como Maersk o MSC, terminales y transportistas a través de múltiples casillas de correo sin un repositorio unificado. Luego, la carga en Kipintoch es 100% artesanal: descargar cada archivo, tipear CUITs, alícuotas y conceptos campo por campo. Esto consume valiosas horas del equipo en tareas mecánicas y abre una ventana constante a inconsistencias impositivas y fugas de rentabilidad por recargos no cotejados. En el circuito comercial ocurre algo análogo: la emisión de presupuestos está fuertemente concentrada en el equipo operativo, cotizando en planillas mientras las tarifas de las navieras cambian constantemente. Al no contar con un sistema ágil con alertas de vencimiento, muchas cotizaciones quedan sin un seguimiento proactivo y sin registro de los motivos por los cuales el cliente no cerró. Nuestra solución aborda ambos desafíos en simultáneo: automatiza la extracción y validación de comprobantes en segundos, y le brinda al equipo comercial un entorno ágil con control de vigencias de tarifas y seguimiento estructurado.',
  },
  3: {
    slideId: 3,
    title: 'Portal Centralizado de Facturación Asistido por IA',
    timeAllocation: '02:45 - 04:00 (01:15 min)',
    keyStakeholders: ['Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Split 1:1.25. Izquierda: 3 pilares KPI (Extracción IA en 5s, Escudo Financiero en tiempo real, Copiado 1-Clic con ahorro de $6M ARS/año). Derecha: Captura UHD del Dashboard en vivo.',
    demoCues: [
      'Indicar el banner superior con rol ADMINISTRACIÓN en tema claro',
      'Destacar la métrica de extracción en menos de 5 segundos',
      'Remarcar el ahorro de $6.000.000 ARS anuales al evitar conectores cerrados de Kipintoch',
    ],
    verbatimSpeech:
      'Esta es la plataforma central que desarrollamos para ALMAR. Fíjense en la captura de la derecha, tomada directamente del portal en ejecución: acá arriba ven el entorno seguro de Administración. Y en el panel central, tres pilares arquitectónicos resuelven el problema: Primero: Extracción con Inteligencia Artificial. El portal recibe el comprobante por correo o arrastre y, en menos de 5 segundos, desglosa el emisor, CUIT, importes, recargos navieros y alícuotas impositivas. Segundo: Escudo Financiero. El sistema cruza en tiempo real la factura contra lo presupuestado en Kipintoch. Si el costo excede lo cotizado, enciende la alarma al instante. Tercero: Copiado Asistido en 1-Clic. En vez de pagar más de 6 millones de pesos al año por licencias y conectores cerrados de Kipintoch, el portal formatea los datos en 5 campos canónicos que Stefania pega en el ERP en apenas 15 segundos. Veamos cómo viaja un dato desde el PDF hasta el banco.',
  },
  4: {
    slideId: 4,
    title: 'Arquitectura del Pipeline: De la Factura a la Carpeta y Banco',
    timeAllocation: '04:00 - 05:15 (01:15 min)',
    keyStakeholders: ['Juan Andrés Arloro', 'Vanesa Meggiolaro'],
    whatAudienceSees: 'Grilla panorámica de las 5 etapas del circuito de facturación (Recepción -> Lectura IA -> Control de Margen -> Kipintoch -> Banco Macro), ficha interactiva de detalle y métricas operativas.',
    demoCues: [
      'Mostrar las 5 etapas visibles en paralelo en la pantalla',
      'Hacer clic en las etapas o tocar "Simular Recorrido" para ver qué entra y qué resuelve cada paso',
      'Destacar la verificación en extracto real de Banco Macro antes de cerrar cobranzas',
    ],
    verbatimSpeech:
      'El circuito funciona como una línea de trabajo en 5 pasos bien definidos: 1. La naviera o transportista envía la factura y entra al sistema. 2. La IA lee el CUIT, los montos y separa el flete exento del recargo de combustible BUFF para AFIP. 3. El sistema compara el gasto contra lo presupuestado en la carpeta: si la naviera cobró de más o el margen cae de USD 200, avisa de inmediato. 4. Stefania copia los 5 datos clave a Kipintoch en 15 segundos con un clic, sin tipear nada a mano. 5. Y en cobranzas, se verifica el ingreso real en el extracto de Banco Macro antes del recibo oficial y las comisiones. Todo el proceso queda registrado y vinculado a la carpeta. Pasemos ahora a ver las respuestas a los pedidos comerciales de Vanesa y Alejandro.',
  },
  5: {
    slideId: 5,
    title: 'Tablero Comercial y Control de Vigencia de Tarifas Navieras',
    timeAllocation: '05:15 - 06:45 (01:30 min)',
    keyStakeholders: ['Vanesa Meggiolaro'],
    whatAudienceSees: 'Tabla de cotizaciones con semáforo de vigencia (Vigente 12d verde, Por Vencer 2d amarillo, Vencida rojo con candado), callout de respuesta directa a Vanesa.',
    demoCues: [
      'Mirar directamente a Vanesa Meggiolaro al iniciar el slide',
      'Señalar la fila roja de tarifa vencida y el botón con candado',
      'Resaltar que el vendedor no puede emitir una cotización con costos desactualizados',
    ],
    verbatimSpeech:
      'Vanesa, esta diapositiva responde con precisión quirúrgica a tu planteo en el relevamiento. Vos nos marcaste con total claridad el peligro de que un comercial cotice con un tarifario que guardó hace un mes y que, cuando el cliente confirma el embarque, el armador haya subido el flete 300 o 400 dólares, comiéndose la ganancia de ALMAR. Miren la captura de la derecha: implementamos el Semáforo de Vigencia de Tarifas Navieras. Cada tarifa tiene una ventana estricta de validez de 15 o 30 días, según la naviera. Mientras está dentro del plazo, el sistema muestra el badge verde. Cuando faltan 3 días para expirar, se enciende la alerta amarilla preventiva. Y si la tarifa venció, el sistema bloquea automáticamente la emisión de la propuesta. El vendedor ya no puede emitir una cotización con costos viejos sin antes revalidar la tarifa actualizada del armador. Cero quebranto por fletes caducados. Pero Alejandro nos hizo una pregunta fundamental: ¿cómo evitamos que estos controles frenen la agilidad comercial? Veamos la siguiente pantalla.',
    objections: [
      {
        stakeholder: 'Vanesa Meggiolaro',
        objection: '¿Qué pasa si una naviera extiende verbalmente la vigencia por teléfono?',
        response: 'El comercial puede solicitar la revalidación adjuntando el correo formal de la naviera en el sistema, lo cual audita la extensión sin depender de memoria verbal.',
      },
    ],
  },
  6: {
    slideId: 6,
    title: 'Calculadora Paramétrica con Perfiles Dinámicos de Margen',
    timeAllocation: '06:45 - 08:15 (01:30 min)',
    keyStakeholders: ['Alejandro Noacco'],
    whatAudienceSees: 'Selector de 4 perfiles de margen, sliders de costo naviero y margen comercial, semáforo preventivo (< USD 200 amarillo, < USD 3.00 candado rojo).',
    demoCues: [
      'Mirar a Alejandro Noacco y validar su preocupación sobre la flexibilidad spot',
      'Mover los sliders de la calculadora paramétrica interactiva',
      'Disparar visualmente la alerta de < USD 200 y mostrar el modal WebAuthn',
    ],
    verbatimSpeech:
      'Alejandro, esta es la respuesta directa a tu preocupación sobre la flexibilidad comercial. Vos nos dijiste con total razón: "Si me ponen un markup rígido del 15% para todos los clientes por igual, quedamos fuera de mercado en los negocios spot donde el margen es finito pero nos sirve el volumen". Tenías absoluta razón. Por eso eliminamos cualquier porcentaje fijo y creamos la Calculadora Paramétrica con Perfiles Dinámicos de Margen: Fíjense en el mockup: el comercial puede elegir Cuenta Estratégica para grandes cuentas corporativas, Estándar para rentabilidad equilibrada, Spot Alto Riesgo para cargas con riesgo de almacenaje, o Personalizado. ¿Y cómo cuidamos a la empresa? Con dos compuertas inteligentes: Si el margen proyectado baja de 200 dólares, el sistema enciende una alerta amarilla preventiva para que el comercial sepa que los gastos locales en pesos pueden comerle el margen si el dólar se mueve. Y únicamente si la operación arroja un margen menor a 3 dólares —es decir, pérdida neta asegurada—, el botón se bloquea. Podés cotizar en 45 segundos con total libertad, sabiendo que el sistema cuida la espalda de ALMAR. Y veamos cómo resolvemos el seguimiento de esas cotizaciones.',
    objections: [
      {
        stakeholder: 'Alejandro Noacco',
        objection: 'Si tengo 10 contenedores y peleo flete spot con margen de USD 50 por contenedor, ¿me frena?',
        response: 'No te frena. La alerta de USD 200 es amarilla preventiva. Solo se bloquea si el margen total es menor a USD 3.00.',
      },
    ],
  },
  7: {
    slideId: 7,
    title: 'Registro de Feedback Cualitativo & Smart Follow-Up a 48 hs',
    timeAllocation: '08:15 - 09:45 (01:30 min)',
    keyStakeholders: ['Alejandro Noacco', 'Lucía Laje'],
    whatAudienceSees: 'Modal de Smart Follow-Up con cotizaciones > 48hs sin respuesta, botón para generar correo formal en 1 clic y campo de feedback cualitativo.',
    demoCues: [
      'Mencionar el dato de Lucía Laje (54,1% del volumen de cotizaciones)',
      'Mostrar el botón para copiar plantilla de seguimiento directamente a Gmail',
      'Enfatizar cómo el feedback cualitativo le da poder de negociación a Alejandro con las navieras',
    ],
    verbatimSpeech:
      'Miremos ahora cómo resolvemos el día a día de Lucía Laje y la inteligencia de mercado de ALMAR: Hoy Lucía emite más de 500 cotizaciones por mes (54,1% del total). Si el cliente no responde en 48 horas, hacer el seguimiento manual insume redactar decenas de correos uno por uno. En la práctica, muchas cotizaciones se enfrían y se pierden por falta de tiempo. Con el Smart Follow-Up: el sistema filtra automáticamente todas las cotizaciones con más de 48 horas de silencio. Lucía entra a esta pantalla, presiona este botón azul, y el portal redacta un correo formal impecable, personalizado con el nombre del cliente, el puerto y la tarifa. Lucía hace 20 seguimientos en 10 minutos desde Gmail sin escribir una sola palabra. Y lo más valioso para vos, Alejandro: el Registro de Feedback Comercial. Si el cliente nos dice "No cierro con ALMAR porque otro forwarder me pasó 150 dólares menos", Lucía lo registra en este campo. A fin de mes abrís el reporte y ves: "En la ruta Shanghai-Buenos Aires perdimos 12 operaciones por 150 dólares frente a tal competidor". Con esa métrica te sentás con el line manager de Maersk o MSC a exigir mejores tarifas de volumen. Pasemos ahora al Escudo Financiero y a los casos reales auditados.',
  },
  8: {
    slideId: 8,
    title: 'Control Operativo: Flujo Diario & Métricas de Productividad',
    timeAllocation: '09:45 - 11:00 (01:15 min)',
    keyStakeholders: ['Vanesa Meggiolaro', 'Alejandro Noacco', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Selector de dos vistas: 1) Tablero Kanban y Visor Dual con datos clave extraídos; 2) Tablero de Métricas & Scorecard de Productividad por operador.',
    demoCues: [
      'Mostrar las 4 columnas del Kanban y la columna roja de Desvío',
      'Destacar el Visor Dual: 15 segundos y 5 campos canónicos en 1 clic',
      'Hacer clic en la pestaña "Métricas de Productividad" para mostrar el Scorecard del equipo',
      'Mencionar los números de Natali Hermoso (110 facturas, USD 5.400 ahorrados) y el total de USD 14.890 prevenidos',
    ],
    verbatimSpeech:
      'Acá tienen dos componentes centrales que responden a lo que nos pidieron: el control del flujo diario y la visibilidad de productividad del equipo. En la primera vista ven las dos pantallas operativas: el Tablero Kanban, donde todo comprobante se clasifica solo, y la columna "Con Desvío", que retiene automáticamente cualquier sobrecosto de naviera antes de pagarse; y a la derecha el Visor Dual, donde Stefania comprueba el PDF y en 15 segundos copia los 5 campos limpios a Kipintoch. Pero además, respondiendo a la necesidad explícita del Directorio de medir el rendimiento del personal: si tocan esta pestaña de "Métricas de Productividad", el sistema les muestra el tablero de control de gestión. Fíjense: pasamos de 12 minutos manuales a 15 segundos por factura; frenamos 14.890 dólares en sobrecostos de Maersk, MSC y TRP; y tenemos una tasa de cumplimiento SLA del 98.2%. Y acá abajo tienen el rendimiento individual: Natali Hermoso con 110 comprobantes y 5.400 dólares de sobrecostos frenados, Victoria Moyano con 68, Ana Laura con 62 y Abril con 54. Cada minuto y cada dólar quedan medidos con total transparencia. Pasemos ahora a ver los casos reales auditados en las casillas.',
  },
  9: {
    slideId: 9,
    title: 'Caso C367: Normalización Semántica de Combustible Naviero (BUFF)',
    timeAllocation: '11:00 - 12:15 (01:15 min)',
    keyStakeholders: ['Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Stepper con etapas 2 y 3 activas. Captura UHD de C367 con mapeo semántico BAF/EBS a código fiscal AFIP BUFF y detección de desvío USD 80.',
    demoCues: [
      'Mencionar el co-loader MSL y la cotización FCA Guangzhou pactada por Juan Cuello',
      'Señalar el recuadro de normalización semántica a BUFF',
      'Destacar el quebranto evitado: USD 80 retenidos antes de facturar',
    ],
    verbatimSpeech:
      'Veamos el primer caso real auditado en los correos de ALMAR: la Carpeta C367 de importación LCL. ¿Qué ocurrió en esa operación? El co-loader MSL facturó conceptos de combustible bajo siglas como BAF, BRC y EBS. En el circuito manual, la operadora dudó sobre cómo imputarlo en Kipintoch, la carpeta se demoró y casi se emite la prefactura sin trasladar un recargo de 80 dólares más combustible al cliente final. Miren cómo lo resuelve el portal: El motor de IA reconoce cualquiera de las 15 variantes de recargos de combustible naviero y las normaliza automáticamente al código canónico BUFF que exige la normativa fiscal de AFIP. Y al auditar la carpeta contra la cotización pactada por Juan Cuello, detecta al instante que no contemplaba ese sobrecosto de 80 dólares. El comprobante se bloquea preventivamente, protegiendo el margen neto de ALMAR. Pasemos al segundo caso crítico: las operaciones en Libras Esterlinas de la Carpeta C620.',
  },
  10: {
    slideId: 10,
    title: 'Caso C620: Módulo Multimoneda BNA Oficial para Divisas Complejas (GBP)',
    timeAllocation: '12:15 - 13:30 (01:15 min)',
    keyStakeholders: ['Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Modal multimoneda con conversión oficial BNA: £543 a 1.3628 = USD 740, enlace a constancia PDF oficial de cotización BNA.',
    demoCues: [
      'Mirar a Vanesa y citar el riesgo de tocar valores en un Permiso de Embarque',
      'Mostrar la constancia PDF oficial adjunta del Banco Nación',
      'Resaltar que AFIP y Aduana reciben exactamente el tipo de cambio oficial vendedor a la fecha de embarque',
    ],
    verbatimSpeech:
      'Este caso es emblemático: la Carpeta C620 con costos facturados en Libras Esterlinas. Como Kipintoch no maneja conversiones dinámicas automáticas para monedas no habituales, la tentación histórica era hacer el cálculo a mano en una calculadora y tipear dólares directamente en el sistema. Vanesa nos decía con toda la razón del mundo: "Si tocamos a mano los valores de un Permiso de Embarque, la Aduana nos aplica una infracción cambiaria gravísima". Fíjense en la solución en pantalla: cuando ingresa una factura en Libras, Euros o Reales, el portal toma automáticamente la cotización oficial vendedor del Banco de la Nación Argentina a la fecha exacta del embarque. En este caso: 543 Libras a 1.3628 arrojan exactamente 740,00 dólares. Y lo más importante: el sistema descarga y adjunta automáticamente el certificado oficial del BNA como constancia documental inmutable. Nadie modifica números a mano, AFIP y la DGA reciben el dato exacto y Vanesa duerme con tranquilidad absoluta. Veamos ahora el caso de los seguros diferidos de Sancor.',
  },
  11: {
    slideId: 11,
    title: 'Caso Sancor Seguros: Provisión Diferida Automática a 150 Días',
    timeAllocation: '13:30 - 14:45 (01:15 min)',
    keyStakeholders: ['Vanesa Meggiolaro', 'Alejandro Noacco'],
    whatAudienceSees: 'Ledger de costos con provisión diferida del 0,55% FOB (USD 220) y comisión comercial retenida con badge ámbar hasta recepción de póliza.',
    demoCues: [
      'Explicar el desfasaje de 120-150 días de Sancor Seguros',
      'Señalar la provisión automática del 0,55% sobre FOB en el ledger',
      'Remarcar la regla: cero anticipo de comisiones sobre utilidades ficticias no devengadas',
    ],
    verbatimSpeech:
      'Llegamos a uno de los dolores financieros más profundos identificados en la auditoría: el caso de Sancor Seguros. Sancor demora habitualmente entre 120 y 150 días —hasta 5 meses— en emitir las pólizas definitivas de transporte. Históricamente, ¿qué pasaba? Como la factura de Sancor no había llegado, la carpeta se cerraba a fin de mes mostrando una ganancia inflada, y ALMAR liquidaba comisiones a los vendedores sobre esa utilidad ficticia. Cuando a los 4 meses llegaba la factura del seguro, la ganancia real se desplomaba, pero la comisión ya se había pagado. Miren cómo lo resuelve el portal: apenas se carga el embarque, el sistema devenga automáticamente una provisión del 0,55% sobre el valor FOB en el ledger de costos de la carpeta. Y en el módulo comercial, la comisión del vendedor pasa al estado RETENIDA_COSTOS_PENDIENTES. Kipintoch bloquea el cierre definitivo hasta que arribe la póliza real de Sancor o se cumplan los 150 días. Cero anticipo de fondos sobre utilidades no devengadas. El margen real de ALMAR queda 100% protegido. Veamos ahora cómo resolvemos las autorizaciones gerenciales cuando un margen es fino: la Carpeta C1234.',
  },
  12: {
    slideId: 12,
    title: 'Caso C1234: Alerta Preventiva & Autorización Biométrica WebAuthn',
    timeAllocation: '14:45 - 16:00 (01:15 min)',
    keyStakeholders: ['Alejandro Noacco', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Carpeta C1234 con margen proyectado de USD 142.50 (< USD 200), diálogo WebAuthn con huella digital y hash SHA-256 de 64 caracteres.',
    demoCues: [
      'Conectar la velocidad que pide Alejandro (3 segundos) con la validez legal que exige Juan',
      'Mostrar el sensor animado de huella digital Touch ID / Windows Hello',
      'Señalar la cadena hash SHA-256 inmutable generada conforme a la Ley de Firma Digital 25.506',
    ],
    verbatimSpeech:
      'En la Carpeta C1234 nos encontramos con un descalce típico: el margen proyectado era de 142,50 dólares, por debajo del umbral de seguridad de USD 200 debido a un aumento imprevisto en acarreos portuarios locales en pesos. El sistema encendió el semáforo amarillo preventivo y bloqueó la emisión de la prefactura. Pero acá viene la innovación que une los intereses de Alejandro y de Juan Andrés: Alejandro necesita no trabar la operación con papeles ni llamados. Y Juan necesita que si se autoriza un desvío, quede un respaldo legal inatacable. Miren cómo funciona: Gerencia abre el comprobante, selecciona el motivo formal y simplemente apoya su huella dactilar en la laptop con WebAuthn (Windows Hello o Touch ID). Cero contraseñas que se puedan filtrar o compartir. El chip de seguridad genera un par de claves y un hash SHA-256 inmutable de 64 caracteres que se estampa en el log inmutable. Tiene plena validez legal bajo la Ley Nacional de Firma Digital Nº 25.506. Alejandro autoriza en 3 segundos y Juan tiene respaldo pericial total. Y finalmente, veamos el circuito de triangulación con Miami y la conciliación con Banco Macro.',
    objections: [
      {
        stakeholder: 'Juan Andrés Arloro',
        objection: '¿Qué valor probatorio tiene WebAuthn frente a una auditoría contable o fiscal?',
        response: 'Cumple como firma electrónica avanzada bajo Ley 25.506 (art. 5). La vinculación criptográfica con chip de hardware y el hash SHA-256 en audit_log garantizan no repudio absoluto.',
      },
    ],
  },
  13: {
    slideId: 13,
    title: 'Caso Triangulación (Net Trade Miami) & Conciliación Banco Macro',
    timeAllocation: '16:00 - 17:15 (01:15 min)',
    keyStakeholders: ['Juan Andrés Arloro', 'Vanesa Meggiolaro'],
    whatAudienceSees: 'Trazabilidad de prefacturas Net Trade LLC (IFB Miami) y tabla de conciliación bancaria con cuenta corriente Banco Macro Nº 376100000930617.',
    demoCues: [
      'Explicar el vínculo directo entre el expediente en Kipin y Net Trade LLC',
      'Recorrer los 3 estados de cobranza: EMITIDA_PENDIENTE_COBRO -> EN_VERIFICACION -> COBRADA_CONCILIADA',
      'Remarcar: cero recibos por WhatsApp sin dinero real acreditado en extracto',
    ],
    verbatimSpeech:
      'Cerramos los casos auditados con dos pilares de alta sensibilidad financiera y fiscal: Primero, las Operaciones Triangulares con Net Trade LLC en Miami. Cuando se emiten prefacturas al exterior a través de Net Trade y su cuenta en International Finance Bank (IFB), el sistema vincula automáticamente ese comprobante offshore con la carpeta operativa local en Rosario. Y antes de permitir el cierre, audita que los costos locales abonados por ALMAR hayan sido reembolsados formalmente, cumpliendo con la normativa cambiaria del BCRA y Precios de Transferencia. Segundo, la Conciliación Obligatoria en Banco Macro. Establecimos un flujo de cobranzas en tres pasos: EMITIDA_PENDIENTE_COBRO → EN_VERIFICACION_BANCARIA → COBRADA_CONCILIADA. Si un cliente manda un volante de transferencia por WhatsApp, pasa a verificación. Pero el sistema prohíbe emitir el recibo oficial o liberar comisiones hasta que Finanzas no concilia ese importe contra el movimiento real del extracto bancario de la cuenta corriente de Banco Macro (cuenta Nº 376100000930617). Si la plata no impactó en el banco, el recibo no se emite. Tesorería blindada al 100%. Y ahora, pasemos a lo que todos quieren ver: la demostración en vivo de la plataforma en funcionamiento.',
  },
  14: {
    slideId: 14,
    title: 'Demostración en Vivo de la Solución en Funcionamiento',
    timeAllocation: '17:15 - 21:00 (03:45 min)',
    keyStakeholders: ['Alejandro Noacco', 'Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Puente a la demo real: 4 estaciones (Ingesta en 5s, Detección de desvío, Copiado en 1-clic a Kipintoch y Tablero de Métricas de Productividad) con badge EN VIVO.',
    demoCues: [
      'Arrastrar una factura PDF real de Maersk a la bandeja',
      'Mostrar la detección automática del sobrecosto de USD 180',
      'Ejecutar la autorización y el copiado en 1-clic a Kipintoch en 15 segundos',
      'Abrir el Tablero de Rendimiento & Productividad con las métricas del equipo',
    ],
    verbatimSpeech:
      'Voy a conmutar en este instante al navegador para que vean el sistema operando en tiempo real con datos y comprobantes reales. Miren la pantalla: acá tenemos el portal en vivo. Voy a tomar una factura marítima real en PDF de Maersk y la voy a soltar en la bandeja de entrada de Comprobantes. Fíjense: uno, dos, tres... cuatro segundos. El documento ya fue procesado. Hago clic y abro el Visor Dual: a la izquierda tienen el PDF original tal cual llegó del armador. A la derecha, el motor ya desglosó el CUIT de Maersk, discriminó el flete marítimo internacional, reconoció el recargo BAF y lo mapeó automáticamente a BUFF, y calculó el IVA. Pero observen lo que ocurre con el margen: el sistema cruzó la factura contra la carpeta de Kipintoch y detectó que el armador facturó 180 dólares más de lo cotizado. La tarjeta se fue automáticamente a la columna "Con Desvío de Tarifa" y el botón de facturación está deshabilitado. Si inicio sesión como Stefania en rol Operativo, no puedo destrabarlo. Pero si inicio sesión como Gerencia, se activa este botón: "Autorizar Desvío Gerencial". Hago clic, selecciono el motivo, pongo la huella digital en la laptop y el sistema estampa la firma digital con respaldo probatorio en el log de auditoría. La carpeta queda autorizada. Y ahora miren esto: presiono "Copiar Ficha a Kipintoch". Los 5 campos canónicos están en mi portapapeles. Stefania abre Kipintoch, pega los datos, y en 15 segundos la factura está cargada sin tipear un solo número a mano. Y acá está el cuarto módulo en vivo: el Tablero de Métricas de Rendimiento. Al hacer clic, el Directorio ve exactamente el volumen por operador, tiempos reales de resolución y los sobrecostos retenidos a cada naviera. Cero opacidad operativa.',
  },
  15: {
    slideId: 15,
    title: 'Circuito de Reporte de Incidencias & Triage Operativo en Vivo',
    timeAllocation: '21:00 - 22:15 (01:15 min)',
    keyStakeholders: ['Juan Andrés Arloro', 'Vanesa Meggiolaro'],
    whatAudienceSees: 'Widget flotante de triage in situ, tipificación en 10s, ticket formal #TKT-8421 en audit_log y asistente conversacional Copilot IA.',
    demoCues: [
      'Apuntar al botón flotante en la esquina inferior del portal',
      'Mostrar la auto-captura de contexto sin tipear datos repetidos',
      'Explicar cómo el caso borde no frena la operación y calibra las reglas en < 24hs',
    ],
    verbatimSpeech:
      'Hay un elemento clave que diseñamos para garantizar que la transición durante el piloto sea impecable y que ningún caso quede en el aire: En los primeros días de cualquier sistema nuevo, lo normal es que aparezcan comprobantes atípicos, gastos portuarios no presupuestados o dudas de los operadores. Si el proceso de soporte es burocrático, el usuario se frustra y el sistema pierde tracción. Por eso incorporamos este Circuito de Reporte de Incidencias & Triage Operativo in situ: El operador está trabajando en la carpeta C1234 y detecta un gasto no cotizado de Maersk, como este "Cleaning Fee" de 45 dólares que redujo el margen. No tiene que abrir un correo ni redactar un formulario largo: simplemente toca el botón flotante disponible 24/7 en la esquina inferior. El sistema auto-captura todo el contexto en tiempo real: sabe que está en C1234, qué usuario está operando y qué rol tiene. El operador solo hace dos clics: elige el tipo —"Caso Borde"—, la severidad —"Bloqueante"— y escribe una línea. Al presionar Enviar, el sistema estampa de inmediato un ticket formal #TKT-8421 en el libro de auditoría, deriva el caso a la columna de Desvíos del Kanban para no frenar la facturación general, y nos llega la alerta a nosotros para calibrar la regla de extracción en menos de 24 horas. Y si el personal tiene una duda operativa, hace clic en Copilot IA y un asistente inteligente le responde al instante según los criterios de ALMAR. Bajo norma ISO 9001, cada incidente queda medido y versionado. Mejora continua en tiempo real. Veamos ahora cómo sintetizamos todas las decisiones en la matriz de resolución.',
  },
  16: {
    slideId: 16,
    title: 'Matriz de Resolución de Desafíos Operativos y Estratégicos',
    timeAllocation: '22:15 - 23:15 (01:00 min)',
    keyStakeholders: ['Alejandro Noacco', 'Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Grilla de 3 columnas con respuestas estructuradas por directivo: Gestión Comercial (Alejandro), Control Financiero (Vanesa) y Gobernanza / Legal (Juan Andrés).',
    demoCues: [
      'Hacer contacto visual triangular rotando entre Alejandro, Vanesa y Juan',
      'Cerrar el ciclo de cada objeción planteada en la entrevista de relevamiento',
      'Destacar la armonía entre velocidad comercial y blindaje fiscal',
    ],
    verbatimSpeech:
      'Esta matriz sintetiza el compromiso de diseño que asumimos con cada uno de ustedes: Para Alejandro: velocidad comercial absoluta con perfiles dinámicos y captura sistemática de pérdidas para negociar con navieras. Para Vanesa: freno taxativo a tarifas caducadas, provisión diferida de seguros para no regalar comisiones y conciliación bancaria estricta. Y para Juan Andrés: firmas biométricas inatacables bajo la Ley de Firma Digital y custodia absoluta de los secretos comerciales de ALMAR. Revisemos ahora el diagrama de arquitectura y cómo se integra con la Intranet existente de ALMAR.',
  },
  17: {
    slideId: 17,
    title: 'Arquitectura de Producción, Diagrama e Integración en Intranet Firebase',
    timeAllocation: '23:15 - 24:15 (01:00 min)',
    keyStakeholders: ['Juan Andrés Arloro'],
    whatAudienceSees: 'Diagrama de 4 capas: Intranet Firebase (Iframe CSP, SSO JWT) -> Vercel Edge Serverless -> OpenAI ZDR soberano (store: false) -> Supabase PostgreSQL São Paulo.',
    demoCues: [
      'Destacar el SSO transparente con Firebase: cero contraseñas nuevas para el personal',
      'Explicar el parámetro contractual store: false de OpenAI (cero entrenamiento con datos de ALMAR)',
      'Mostrar la baja latencia de Supabase en São Paulo (< 35ms)',
    ],
    verbatimSpeech:
      'Analicemos la arquitectura técnica y cómo se ensambla con los sistemas que ALMAR ya utiliza hoy: Punto 1: Embebido Directo en la Intranet Firebase de ALMAR. Estudiamos la intranet corporativa que ustedes tienen montada sobre Firebase y les confirmo que la integración es 100% directa y transparente: podemos embeber este portal como una solapa interna dentro de su intranet mediante un contenedor seguro con Content-Security-Policy. Y lo mejor: Single Sign-On (SSO). Reutilizamos la sesión activa de Firebase Authentication mediante tokens JWT. Stefania o Lucía no tienen que aprenderse otro usuario ni otra contraseña: entran a su intranet habitual y el sistema ya sabe quiénes son y qué rol tienen. Punto 2: Procesamiento Serverless en Vercel Edge con 99,99% de uptime. Punto 3: Soberanía Absoluta en OpenAI con Zero Data Retention. ALMAR contrata directamente su cuenta empresarial. Con el parámetro store: false, OpenAI procesa la factura en memoria volátil y la destruye en el acto. Cero persistencia y cero entrenamiento con sus datos. Punto 4: Base de datos en Supabase São Paulo con latencia menor a 35 milisegundos y respaldo pericial pleno. Cero servidores en la oficina. Veamos el cronograma para poner esto en marcha en 4 semanas.',
  },
  18: {
    slideId: 18,
    title: 'Hoja de Ruta de Puesta en Marcha (4 Semanas) y Decisión Directiva',
    timeAllocation: '24:15 - 25:00 (00:45 min)',
    keyStakeholders: ['Alejandro Noacco', 'Vanesa Meggiolaro', 'Juan Andrés Arloro'],
    whatAudienceSees: 'Cronograma de 4 semanas (S1 Set-up, S2 Inicio Piloto 50 facturas, S3 Calibración Fina, S4 Régimen Definitivo) y callout verde bosque de decisión directiva.',
    demoCues: [
      'Apuntar con convicción a la Semana 1 de inicio inmediato',
      'Enfatizar que la plataforma ya está construida, testeada y operativa',
      'Hacer el cierre formal pidiendo la aprobación para arrancar la Semana 1',
    ],
    verbatimSpeech:
      'Para cerrar, este es el plan de puesta en marcha propuesto para los próximos 30 días: En la Semana 1, asistimos a Juan en dar de alta la cuenta corporativa de OpenAI de ALMAR y conectamos las claves al entorno productivo de Vercel y Supabase. En la Semana 2, hacemos una sesión de capacitación de 45 minutos con Stefania y habilitamos el piloto de carga real con el Widget de Triage activo. En la Semana 3, calibramos las reglas finas de desvíos y los conceptos atípicos que hayan surgido. Y en la Semana 4, hacemos el pase a régimen definitivo, logrando que ALMAR procese el 100% de sus facturas de proveedores con asistencia de IA y control total de rentabilidad. La plataforma está lista, testeada y funcionando. Les propongo que demos por aprobada la Semana 1 para iniciar el despliegue. Quedo a disposición de Alejandro, Vanesa y Juan para responder sus consultas. Muchas gracias.',
  },
};
