# 🚢 GUÍA TÁCTICA DEL ORADOR & MANUAL DE DEMOSTRACIÓN EJECUTIVA
## REUNIÓN DE DIRECTORIO — ALMAR ROSARIO S.R.L.
### Presentación de la Solución Tecnológica Integral: Automatización Inteligente de Facturación, Módulo Comercial Flexible, Escudo Financiero y Arquitectura Productiva
**Autoría:** Ing. Francisco Bondino — Clave Consultora  
**Fecha de Sesión:** Septiembre 2026  
**Destinatarios:** Directorio de ALMAR Rosario S.R.L. (Alejandro Noacco, Vanesa Meggiolaro, Juan Andrés Arloro)  
**Mazo de Diapositivas:** `presentacion-ejecutiva-almar.html` (18 diapositivas interactivas en tema claro institucional)  
**Entorno de Demostración en Vivo:** `http://localhost:3000` (Respaldo Cloud: `https://bot-relevamiento.vercel.app`)  
**Duración Total Estructurada:** 25 minutos de presentación y demo en vivo + Coloquio Directivo  

---

# 1. ENCUADRE ESTRATÉGICO Y CLARIDAD DE ROLES

### 1.1 Enfoque de la Sesión: La Solución Tecnológica Principal
Esta presentación está concebida con un propósito claro y unívoco: **demostrar la solución tecnológica integral que automatiza el procesamiento de facturas de proveedores, agiliza y ordena la fuerza de ventas comercial, blinda el margen financiero de las operaciones y establece la arquitectura productiva definitiva para ALMAR Rosario**.

No se debe mezclar este encuentro con el documento de relevamiento administrativo preliminar ni con debates operativos secundarios. La audiencia directiva necesita ver con hechos y pantallas reales:
1. **El Problema Operativo y Comercial Concreto:** El cuello de botella en la carga manual de más de 350 facturas mensuales (8 a 12 minutos por comprobante), el desborde comercial de 1.080 cotizaciones auditadas (54,1% concentradas en Lucía Laje) y la fuga silenciosa de margen por recargos navieros imprevistos.
2. **El Módulo Comercial Flexible:** Cómo la calculadora paramétrica con perfiles dinámicos permite cotizar en 45 segundos sin atar las manos del vendedor, controlando la vigencia de tarifas navieras (15/30 días) y recuperando cotizaciones dormidas con el Smart Follow-Up a 48 hs.
3. **El Escudo Financiero y los Casos Reales Auditados:** Cómo el sistema resuelve los casos de fricción histórica identificados en las carpetas de ALMAR:
   - **Caso C367:** Normalización semántica de recargos de combustible (BAF, BRC, EBS) al código fiscal canónico `BUFF` de AFIP, evitando quebrantos de USD 80 + recargos.
   - **Caso C620:** Módulo multimoneda con conversión automática al tipo de cambio oficial vendedor del Banco Nación (BNA) a fecha de embarque para Libras Esterlinas (GBP), adjuntando constancia digital oficial y protegiendo el Permiso de Embarque ante la DGA.
   - **Caso Sancor Seguros:** Provisión automática diferida del 0,55% sobre el valor FOB devengada a 150 días, con holdback de comisiones comerciales para evitar pagar sobre utilidades no devengadas.
   - **Caso C1234:** Alerta preventiva de margen crítico (< USD 200) ante descalces cambiarios y autorización gerencial con firma biométrica WebAuthn (Touch ID / Windows Hello) y sello SHA-256.
   - **Casos Net Trade Miami & Banco Macro:** Trazabilidad de prefacturas offshore vinculadas a expedientes locales (Precios de Transferencia y BCRA) y subproceso de conciliación en extracto de cuenta corriente de Banco Macro antes del recibo oficial.
4. **La Demostración en Vivo en Tiempo Real:** Carga de un comprobante marítimo real en el portal web (`http://localhost:3000`), extracción en 5 segundos, activación de compuertas y copiado en 1-clic a Kipintoch.
5. **El Acelerador del Piloto:** El widget flotante de triage en vivo (`#TKT-XXX`) embebido en la aplicación para que Stefania, Vanesa, Lucía y el equipo reporten casos borde en 5 segundos, resolviéndolos en horas sin fricción.
6. **La Soberanía y Seguridad Productiva:** Contratación directa de OpenAI por parte de ALMAR con política contractual Zero Data Retention (ZDR § 3.2, `store: false`), hosting Cloud de alta velocidad en Vercel y base de datos relacional PostgreSQL en Supabase (São Paulo, latencia < 35ms).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MAPA COGNITIVO DEL DIRECTORIO DE ALMAR                          │
├─────────────────────────┬───────────────────────────┬──────────────────────────────────┤
│ ALEJANDRO NOACCO        │ VANESA MEGGIOLARO         │ JUAN ANDRÉS ARLORO               │
│ Director Comercial      │ Directora Finanzas & Ops  │ Director Legal y TI / Apoderado  │
├─────────────────────────┼───────────────────────────┼──────────────────────────────────┤
│ • Enfoque: Velocidad de │ • Enfoque: Cero desvíos de│ • Enfoque: Privacidad de datos,  │
│   cierre, no entorpecer │   costos de armadores,    │   validez jurídica pericial de   │
│   la venta spot y tener │   freno a tarifas viejas, │   las firmas biométricas, custodia│
│   feedback de pérdidas. │   provisión de seguros y  │   de claves de OpenAI y          │
│                         │   conciliación bancaria.  │   cumplimiento cambiario BCRA.   │
│ • Qué busca ver: Que la │ • Qué busca ver: Que el   │ • Qué busca ver: Que los datos de│
│   calculadora sea ágil, │   sistema bloquee fletes  │   clientes y fletes no se usen   │
│   con perfiles dinámicos│   vencidos, provisione el │   para entrenar modelos públicos │
│   y seguimiento en 1    │   seguro Sancor a 150 días│   (cuenta propia con ZDR) y que  │
│   clic para Lucía Laje. │   y exija extracto Macro. │   las firmas tengan no repudio.  │
└─────────────────────────┴───────────────────────────┴──────────────────────────────────┘
```

---

# 2. GUION MINUTO A MINUTO SINCRONIZADO CON LAS 18 DIAPOSITIVAS (25 MINUTOS TOTALES)

A continuación se detalla la hoja de ruta minuto a minuto estructurada en los 4 Momentos Estratégicos de la presentación ejecutiva (`presentacion-ejecutiva-almar.html`).

---

## MOMENTO 1: EL DIAGNÓSTICO REAL & PIPELINE (MINUTOS 00:00 - 05:15)

---

### DIAPOSITIVA 01: PORTADA EJECUTIVA
- **Título en Pantalla:** *AUTOMATIZACIÓN INTELIGENTE DE FACTURACIÓN Y PROCESAMIENTO DE COMPROBANTES*
- **Subtítulo:** *Plataforma de Extracción con IA, Escudo Financiero y Arquitectura Productiva para ALMAR Rosario S.R.L.*
- **Momento Estratégico:** Apertura y Encuadre Directivo.
- **Tiempo Asignado:** Minuto 00:00 - 01:15 (01:15 min).
- **Lo que ve la Audiencia:** Portada corporativa en tema claro institucional de Clave Consultora (fondo blanco puro `#ffffff` sobre escenario gris ejecutivo `#f1f5f9`, acentos verde bosque `#1e3d2f`, dorado `#c29320`, vectores SVG canónicos, logotipo oficial y píldora destacada `DEMO OFICIAL DE LA SOLUCIÓN TECNOLÓGICA · 2026`).
- **Qué señalar en la pantalla:**
  * Apuntar al logotipo conjunto de Clave Consultora y ALMAR Rosario.
  * Señalar la píldora superior de demo tecnológica oficial.
  * Indicar los destinatarios formales: Alejandro Noacco, Vanesa Meggiolaro y Juan Andrés Arloro.
- **Lo que Fran enfatiza:** Postura erguida, contacto visual directo y seguro. Establecer desde el segundo cero que no venimos a debatir diagnósticos teóricos en papel, sino a mostrar una plataforma tecnológica ya construida, funcional y lista para operar.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Buenos días Alejandro, Vanesa, Juan. Les agradezco enormemente este espacio de trabajo directivo.*
> 
> *El motivo de esta convocatoria es presentarles la solución tecnológica definitiva desarrollada para ALMAR Rosario: una plataforma de inteligencia operativa que automatiza la ingesta de facturas de proveedores, agiliza de forma dramática la gestión comercial de cotizaciones, audita los costos en tiempo real contra Kipintoch y blinda la rentabilidad de la empresa.*
> 
> *Hoy no les vengo a mostrar diapositivas teóricas con promesas a futuro. Vamos a recorrer en 15 minutos la arquitectura del sistema, las soluciones concretas a los reclamos comerciales de Alejandro, los blindajes financieros pedidos por Vanesa y la seguridad jurídica que exige Juan Andrés. E inmediatamente después, nos pasamos a la pantalla en vivo del portal para procesar facturas reales frente a ustedes. Comencemos con los números reales de la operación."*

---

### DIAPOSITIVA 02: DIAGNÓSTICO OPERATIVO & COMERCIAL: FACTURACIÓN Y PROCESOS
- **Título en Pantalla:** *DIAGNÓSTICO OPERATIVO & COMERCIAL: FACTURACIÓN Y PROCESOS*
- **Subtítulo:** *Relevamiento integral de flujos de trabajo, dispersión de comprobantes y cuellos de botella en el circuito actual.*
- **Momento Estratégico:** Momento 1: El Diagnóstico Real.
- **Badges:** `AUDITORÍA OPERATIVA & FUERZA COMERCIAL`.
- **Tiempo Asignado:** Minuto 01:15 - 02:45 (01:30 min).
- **Lo que ve la Audiencia:** 
  * 3 Tarjetas de Estado Operativo:
    - **Flujo de Comprobantes (FRAGMENTADO):** Dispersión de facturas y notas de débito de armadores (Maersk, MSC), terminales y transportistas en casillas individuales sin repositorio central.
    - **Carga en Sistema de Gestión (MANUAL):** Digitación manual de comprobantes, CUITs, alícuotas y conceptos en Kipintoch con demoras operativas y riesgo de error humano.
    - **Seguimiento Comercial (DISCONTINUO):** Emisión de cotizaciones centralizada en el equipo comercial, con presupuestos que quedan sin seguimiento estructurado ni registro de motivos de no concreción.
  * Grilla de 3 Ejes Operativos con pastillas de fuga (Despacho, Administración y Fuerza Comercial).
  * Callout inferior dorado: Erradicar el re-tipeo manual a Kipintoch, frenar sobrecostos y dotar a comercial de control de vigencias y seguimiento proactivo.
- **Qué señalar en la pantalla:**
  * Apuntar a la tarjeta de *Carga en Sistema de Gestión (MANUAL)*, validando el cuello de botella diario en la carga campo por campo en Kipintoch.
  * Señalar la tarjeta de *Seguimiento Comercial (DISCONTINUO)*, destacando la necesidad de seguimiento sistemático para evitar que los presupuestos se enfríen.
  * Señalar el callout inferior con los objetivos de la solución integral.
- **Lo que Fran enfatiza:** Mostrar empatía con el equipo: el problema no radica en la capacidad del personal de ALMAR, sino en la falta de herramientas automatizadas que hoy los obligan a realizar tareas mecánicas y dispersas.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Para entender el valor de esta propuesta, comencemos por la radiografía de los procesos cotidianos de ALMAR:*
> 
> *En el circuito administrativo y operativo, la recepción de comprobantes está completamente fragmentada: llegan facturas y notas de débito de armadores como Maersk o MSC, terminales y transportistas a través de múltiples casillas de correo sin un repositorio unificado. Luego, la carga en Kipintoch es 100% artesanal: descargar cada archivo, tipear CUITs, alícuotas y conceptos campo por campo. Esto consume valiosas horas del equipo en tareas mecánicas y abre una ventana constante a inconsistencias impositivas y fugas de rentabilidad por recargos no cotejados.*
> 
> *En el circuito comercial ocurre algo análogo: la emisión de presupuestos está fuertemente concentrada en el equipo operativo, cotizando en planillas mientras las tarifas de las navieras cambian constantemente. Al no contar con un sistema ágil con alertas de vencimiento, muchas cotizaciones quedan sin un seguimiento proactivo y sin registro de los motivos por los cuales el cliente no cerró.*
> 
> *Nuestra solución aborda ambos desafíos en simultáneo: automatiza la extracción y validación de comprobantes en segundos, y le brinda al equipo comercial un entorno ágil con control de vigencias de tarifas y seguimiento estructurado. Veamos cómo funciona la plataforma."*

---

### DIAPOSITIVA 03: PORTAL CENTRALIZADO DE FACTURACIÓN ASISTIDO POR IA
- **Título en Pantalla:** *PORTAL CENTRALIZADO DE FACTURACIÓN ASISTIDO POR IA*
- **Subtítulo:** *Plataforma integral para recepción, extracción asistida, validación de reglas de negocio y control contable.*
- **Momento Estratégico:** Momento 1: Solución Integral.
- **Badges:** `PORTAL DE FACTURACIÓN INTELIGENTE`.
- **Mockup URL:** `http://localhost:3000/ · Dashboard Operativo ALMAR [SISTEMA EN VIVO]`.
- **Captura:** `screenshots/dashboard_corporate_light.png`.
- **Tiempo Asignado:** Minuto 02:45 - 04:00 (01:15 min).
- **Lo que ve la Audiencia:** Layout en cuadrícula 1:1.25. A la izquierda, 3 tarjetas KPI con los pilares del sistema (Extracción IA, Escudo Financiero, Copiado en 1-Clic con ahorro de $6.000.000 ARS/año). A la derecha, marco de navegador corporativo con la captura real del Dashboard del portal en tema claro.
- **Qué señalar en la captura de pantalla:**
  * **Banner superior del mockup:** Señalar el rol activo autenticado ("ADMINISTRACIÓN") y el avatar del usuario.
  * **Los 4 KPIs superiores del dashboard:** Apuntar a los contadores de comprobantes del mes, ahorro acumulado, carpetas operativas auditadas y alertas activas.
  * **Caja de ahorro de costos:** Señalar la cifra destacada de *$6.000.000 ARS anuales ahorrados*, explicando que se logra mediante el copiado asistido en 1-clic sin contratar las costosísimas licencias de conectores API propietarios de Kipintoch.
- **Lo que Fran enfatiza:** El portal no es un proyecto en boceto: es una aplicación web productiva, limpia y rápida, diseñada para integrarse sin fricción a la rutina de ALMAR.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Esta es la plataforma central que desarrollamos para ALMAR.*
> 
> *Fíjense en la captura de la derecha, tomada directamente del portal en ejecución:*
> 
> *Acá arriba [señalando la cabecera del mockup] ven el entorno seguro de Administración. Y en el panel central, tres pilares arquitectónicos resuelven el problema:*
> 
> *Primero:* **Extracción con Inteligencia Artificial**. *El portal recibe el comprobante por correo o arrastre y, en menos de 5 segundos, desglosa el emisor, CUIT, importes, recargos navieros y alícuotas impositivas.*
> 
> *Segundo:* **Escudo Financiero**. *El sistema cruza en tiempo real la factura contra lo presupuestado en Kipintoch. Si el costo excede lo cotizado, enciende la alarma al instante.*
> 
> *Tercero:* **Copiado Asistido en 1-Clic**. *En vez de pagar más de 6 millones de pesos al año por licencias y conectores cerrados de Kipintoch, el portal formatea los datos en 5 campos canónicos que Stefania pega en el ERP en apenas 15 segundos.*
> 
> *Veamos cómo viaja un dato desde el PDF hasta el banco."*

---

### DIAPOSITIVA 04: ARQUITECTURA DEL PIPELINE: DE LA FACTURA A LA CARPETA Y BANCO
- **Título en Pantalla:** *ARQUITECTURA DEL PIPELINE: DE LA FACTURA A LA CARPETA Y BANCO*
- **Subtítulo:** *Flujo continuo de cinco etapas automatizadas para garantizar consistencia contable, fiscal y bancaria.*
- **Momento Estratégico:** Momento 1: Arquitectura Técnica.
- **Badges:** `TRAZABILIDAD DE EXTREMO A EXTREMO · AUDITORÍA DE CALIDAD`.
- **Componente Visual:** Stepper horizontal de 5 etapas (`.traceability-stepper`) + Cuadrícula de 5 fases.
- **Tiempo Asignado:** Minuto 04:00 - 05:15 (01:15 min).
- **Lo que ve la Audiencia:** 
  * Stepper superior: `1. ORIGEN (Email/PDF)` → `2. EXTRACCIÓN IA (Parsing Semántico)` → `3. REGLAS & ESCUDO (Auditoría de Margen)` → `4. KIPINTOCH (Copiado 1-Clic)` → `5. BANCO MACRO (Conciliación Extracto)`.
  * 5 Tarjetas detallando cada fase del pipeline.
  * Callout inferior azul noche: Cada dato cargado en Kipintoch mantiene un vínculo inmutable con el comprobante PDF original y su verificación en extracto bancario.
- **Qué señalar en la pantalla:**
  * **Stepper horizontal:** Recorrer con el dedo o puntero las 5 estaciones, marcando cómo la información fluye sin baches manuales.
  * **Fase 3 (Reglas & Escudo):** Señalar la compuerta de margen preventivo (< USD 200) y de bloqueo estricto (< USD 3.00).
  * **Fase 5 (Banco Macro):** Señalar que el ciclo no se corta en la factura fiscal, sino que llega hasta la conciliación real de caja en la cuenta bancaria.
- **Lo que Fran enfatiza:** Trazabilidad inquebrantable. Cada peso asentado en Kipintoch tiene su respaldo documental original a un clic de distancia.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Para garantizar que nada quede al azar, el pipeline opera en una línea de montaje digital de 5 fases continuas:*
> 
> *1. El proveedor o naviera envía el correo y el PDF entra al portal.*
> *2. El motor de IA analiza la semántica del documento, extrayendo CUIT, fecha, alícuotas y desglosando conceptos.*
> *3. El* **Escudo Financiero** *audita el margen: verifica que el costo no supere lo cotizado y aplica los semáforos de rentabilidad.*
> *4. Se genera la prefactura y el operador copia los datos a Kipintoch con un solo clic.*
> *5. Y finalmente, el módulo de cobranzas enlaza la acreditación real en el extracto del Banco Macro antes de autorizar el recibo oficial y las comisiones.*
> 
> *Todo el ciclo queda auditado con respaldo pericial inmutable. Pero ahora entremos en las respuestas concretas a los pedidos directivos: vayamos al Módulo Comercial."*

---

## MOMENTO 2: EL MÓDULO COMERCIAL FLEXIBLE (MINUTOS 05:15 - 09:45)

---

### DIAPOSITIVA 05: TABLERO COMERCIAL Y CONTROL DE VIGENCIA DE TARIFAS NAVIERAS
- **Título en Pantalla:** *TABLERO COMERCIAL Y CONTROL DE VIGENCIA DE TARIFAS NAVIERAS*
- **Subtítulo:** *Semáforo de vigencias (15/30 días) para impedir cotizaciones desactualizadas que generen quebranto económico.*
- **Momento Estratégico:** Momento 2: Módulo Comercial Flexible.
- **Badges:** `RESPUESTA DIRECTA A VANESA MEGGIOLARO` | `CONTROL DE TARIFAS VENCIDAS`.
- **Mockup URL:** `/cotizaciones · Tablero Comercial y Semáforo de Vigencias [TARIFAS VÁLIDAS]`.
- **Captura:** `screenshots/cotizaciones_vigencia_tarifas_light.png`.
- **Tiempo Asignado:** Minuto 05:15 - 06:45 (01:30 min).
- **Lo que ve la Audiencia:** Layout en cuadrícula 1:1.25. A la izquierda, especificación del semáforo de vigencia (15/30 días) y callout destacado con la respuesta textual a Vanesa Meggiolaro. A la derecha, captura real de la tabla de cotizaciones del portal mostrando los badges de vigencia por armador.
- **Qué señalar en la captura de pantalla:**
  * **Columna "Vigencia Naviera" en la tabla:** Señalar la fila superior con el badge verde `Vigente (12d)` en Maersk.
  * **Badge amarillo de advertencia:** Apuntar a una cotización próxima a expirar con el badge `Por Vencer (2d)`.
  * **Badge rojo de bloqueo:** Señalar una fila con `Vencida` y mostrar cómo el botón de emisión queda deshabilitado con candado.
  * **Callout izquierdo:** Leer la frase de respuesta directa a Vanesa.
- **Lo que Fran enfatiza:** [Mirar a Vanesa]. Este desarrollo nació directamente de su advertencia en el relevamiento: los comerciales a veces cotizaban con fletes antiguos y cuando el cliente aceptaba, la naviera ya había subido la tarifa, obligando a ALMAR a absorber la pérdida.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Vanesa, esta diapositiva responde con precisión quirúrgica a tu planteo en el relevamiento.*
> 
> *Vos nos marcaste con total claridad el peligro de que un comercial cotice con un tarifario que guardó hace un mes y que, cuando el cliente confirma el embarque, el armador haya subido el flete 300 o 400 dólares, comiéndose la ganancia de ALMAR.*
> 
> *Miren la captura de la derecha:* **implementamos el Semáforo de Vigencia de Tarifas Navieras**.
> 
> *Cada tarifa tiene una ventana estricta de validez de 15 o 30 días, según la naviera. Mientras está dentro del plazo, el sistema muestra el badge verde [señalando la primera fila]. Cuando faltan 3 días para expirar, se enciende la alerta amarilla preventiva. Y si la tarifa venció [señalando la fila roja], el sistema bloquea automáticamente la emisión de la propuesta.*
> 
> *El vendedor ya no puede emitir una cotización con costos viejos sin antes revalidar la tarifa actualizada del armador. Cero quebranto por fletes caducados.*
> 
> *Pero Alejandro nos hizo una pregunta fundamental: ¿cómo evitamos que estos controles frenen la agilidad comercial? Veamos la siguiente pantalla."*

---

### DIAPOSITIVA 06: CALCULADORA PARAMÉTRICA CON PERFILES DINÁMICOS DE MARGEN
- **Título en Pantalla:** *CALCULADORA PARAMÉTRICA CON PERFILES DINÁMICOS DE MARGEN*
- **Subtítulo:** *Agilidad para cotizar en segundos adaptando el margen al tipo de cliente, sin rigideces ni pérdida de control.*
- **Momento Estratégico:** Momento 2: Módulo Comercial Flexible.
- **Badges:** `RESPUESTA DIRECTA A ALEJANDRO NOACCO` | `FLEXIBILIDAD COMERCIAL`.
- **Mockup URL:** `/cotizaciones/calculadora · Selector de Perfiles de Margen [PRICING DINÁMICO]`.
- **Captura:** `screenshots/modulo_comercial_calculadora_perfiles_light.png`.
- **Tiempo Asignado:** Minuto 06:45 - 08:15 (01:30 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. A la izquierda, detalle de los 4 perfiles dinámicos (`CUENTA_ESTRATEGICA`, `ESTANDAR`, `SPOT_ALTO_RIESGO`, `PERSONALIZADO`) y límites preventivos (< USD 200 y < USD 3.00), con callout de respuesta a Alejandro. A la derecha, captura real de la Calculadora de Cotizaciones con el selector de perfiles y desglose de flete.
- **Qué señalar en la captura de pantalla:**
  * **Selector desplegable "Perfil de Rentabilidad":** Apuntar a las opciones disponibles, destacando `CUENTA_ESTRATEGICA` para clientes corporativos de volumen y `SPOT_ALTO_RIESGO` para cargas volátiles.
  * **Caja de alerta amarilla en la esquina inferior:** Señalar la advertencia preventiva de margen (< USD 200), explicando que cuida la brecha cambiaria en gastos locales sin trabar la venta.
  * **Botón "Copiar Propuesta":** Mostrar que si la rentabilidad calculada es menor a USD 3.00 (pérdida neta), el botón se bloquea con candado rojo impidiendo regalar fletes.
- **Lo que Fran enfatiza:** [Mirar a Alejandro]. La tecnología está al servicio del negocio, no para asfixiar al comercial. Le da máxima velocidad para cerrar acuerdos spot en 45 segundos, pero con un piso de seguridad infranqueable.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Alejandro, esta es la respuesta directa a tu preocupación sobre la flexibilidad comercial.*
> 
> *Vos nos dijiste con total razón: 'Si me ponen un markup rígido del 15% para todos los clientes por igual, quedamos fuera de mercado en los negocios spot donde el margen es finito pero nos sirve el volumen'.*
> 
> *Tenías absoluta razón. Por eso eliminamos cualquier porcentaje fijo y creamos la* **Calculadora Paramétrica con Perfiles Dinámicos de Margen**:
> 
> *Fíjense en el mockup [señalando el selector desplegable]: el comercial puede elegir:*
> - `CUENTA_ESTRATEGICA`: *Margen fino y competitivo para fidelizar grandes cuentas corporativas.*
> - `ESTANDAR`: *Rentabilidad corporativa equilibrada.*
> - `SPOT_ALTO_RIESGO`: *Mayor cobertura para cargas spot con riesgo de almacenaje o demoras.*
> - `PERSONALIZADO`: *Ajuste milimétrico según la coyuntura.*
> 
> *¿Y cómo cuidamos a la empresa? Con dos compuertas inteligentes:*
> *Si el margen proyectado baja de 200 dólares, el sistema enciende una alerta amarilla preventiva [señalando la caja inferior] para que el comercial sepa que los gastos locales en pesos pueden comerle el margen si el dólar se mueve.*
> *Y únicamente si la operación arroja un margen menor a 3 dólares —es decir, pérdida neta asegurada—, el botón se bloquea.*
> 
> *Podés cotizar en 45 segundos con total libertad, sabiendo que el sistema cuida la espalda de ALMAR. Y veamos cómo resolvemos el seguimiento de esas cotizaciones."*

---

### DIAPOSITIVA 07: REGISTRO DE FEEDBACK CUALITATIVO & SMART FOLLOW-UP A 48 HS
- **Título en Pantalla:** *REGISTRO DE FEEDBACK CUALITATIVO & SMART FOLLOW-UP A 48 HS*
- **Subtítulo:** *Estandarización del seguimiento comercial y captura sistemática de pérdidas para renegociar contratos de volumen.*
- **Momento Estratégico:** Momento 2: Módulo Comercial Flexible.
- **Badges:** `AUDITORÍA COMERCIAL LUCÍA LAJE (54,1%)` | `SEGUIMIENTO EN 1-CLIC`.
- **Mockup URL:** `/cotizaciones · Panel de Smart Follow-Up y Feedback Comercial [CONVERSIÓN COMERCIAL]`.
- **Captura:** `screenshots/03_smart_follow_up_modal_desktop.png`.
- **Tiempo Asignado:** Minuto 08:15 - 09:45 (01:30 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. A la izquierda, detalle del filtro automático > 48 horas y registro cualitativo de motivos de pérdida, con callout de desahogo comercial para Lucía Laje. A la derecha, captura real del modal de Smart Follow-Up con plantilla de correo y campo de feedback.
- **Qué señalar en la captura de pantalla:**
  * **Contador superior de cotizaciones pendientes:** Apuntar al indicador de presupuestos emitidos hace más de 48 horas sin respuesta.
  * **Botón azul "Generar Correo de Seguimiento":** Señalar cómo el sistema ensambla el correo institucional personalizado con el número de cotización, puerto de origen, destino y fecha límite con 1 solo clic.
  * **Selector de Feedback Comercial:** Señalar las opciones de cierre y el campo de texto donde se asienta la justificación cualitativa: *"Competencia cotizó USD 150 menos"*.
  * **Botón de copia al portapapeles:** Mostrar que el texto queda listo para pegar en Gmail en 5 segundos.
- **Lo que Fran enfatiza:** Doble impacto: alivio inmediato para Lucía Laje (54,1% del volumen de cotizaciones) y datos de inteligencia comercial para que Alejandro negocie tarifas con Maersk y MSC sabiendo exactamente dónde le gana la competencia.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Miremos ahora cómo resolvemos el día a día de Lucía Laje y la inteligencia de mercado de ALMAR:*
> 
> *Hoy Lucía emite más de 500 cotizaciones por mes. Si el cliente no responde en 48 horas, hacer el seguimiento manual insume redactar decenas de correos uno por uno. En la práctica, muchas cotizaciones se enfrían y se pierden por falta de tiempo.*
> 
> *Con el* **Smart Follow-Up**:
> *El sistema filtra automáticamente todas las cotizaciones con más de 48 horas de silencio [señalando el contador]. Lucía entra a esta pantalla, presiona este botón azul [señalando 'Generar Correo'], y el portal redacta un correo formal impecable, personalizado con el nombre del cliente, el puerto y la tarifa. Lucía hace 20 seguimientos en 10 minutos desde Gmail sin escribir una sola palabra.*
> 
> *Y lo más valioso para vos, Alejandro:* **el Registro de Feedback Comercial**.
> *Si el cliente nos dice 'No cierro con ALMAR porque otro forwarder me pasó 150 dólares menos', Lucía lo registra en este campo [señalando el feedback]. Esa información queda indexada en la base de datos.*
> 
> *A fin de mes no tenés sensaciones en el aire: abrís el reporte y ves: 'En la ruta Shanghai-Buenos Aires perdimos 12 operaciones por 150 dólares frente a tal competidor'. Con esa métrica concreta te sentás con el line manager de Maersk o MSC a renegociar contratos de volumen y exigir mejores tarifas.*
> 
> *Pasemos ahora al Escudo Financiero y a los casos reales que auditamos en los correos de ALMAR."*

---

## MOMENTO 3: EL ESCUDO FINANCIERO & CASOS FORENSES (MINUTOS 09:45 - 21:00)

---

### DIAPOSITIVA 08: CONTROL OPERATIVO: TABLERO KANBAN & VISOR SIDE-BY-SIDE
- **Título en Pantalla:** *CONTROL OPERATIVO: TABLERO KANBAN & VISOR SIDE-BY-SIDE*
- **Subtítulo:** *Captura real de las dos interfaces centrales con las que opera el equipo de Administración y Finanzas.*
- **Momento Estratégico:** Momento 3: El Escudo Financiero & Operativo.
- **Badges:** `EXPERIENCIA OPERATIVA INTEGRAL`.
- **Mockup URLs:** `/comprobantes · Tablero Kanban Operativo [KANBAN OPERATIVO]` y `/comprobantes/7554566633 · Modal Side-by-Side [VISOR DUAL]`.
- **Capturas:** `screenshots/kanban_corporate_light.png` y `screenshots/modal_comprobante_detalle_light.png`.
- **Tiempo Asignado:** Minuto 09:45 - 11:00 (01:15 min).
- **Lo que ve la Audiencia:** Layout en cuadrícula 1:1 con dos marcos de navegador en paralelo: a la izquierda, el Tablero Kanban con sus 4 columnas de flujo; a la derecha, el Visor Dual Side-by-Side con el PDF original frente a la ficha digital.
- **Qué señalar en las capturas de pantalla:**
  * **Mockup izquierdo (Tablero Kanban):** Señalar las columnas en secuencia: *1. Ingesta (Mails)* → *2. Listas Kipintoch* → *3. Con Desvío de Tarifa* (apuntar a la tarjeta roja de Maersk bloqueada) → *4. Asentadas*.
  * **Mockup derecho (Visor Side-by-Side):** Señalar la mitad izquierda con la factura original escaneada del armador; luego mover el puntero a la mitad derecha mostrando los campos extraídos automáticamente (CUIT, flete neto, alícuotas de IVA) y el botón verde "Copiar Ficha a Kipintoch".
- **Lo que Fran enfatiza:** La interfaz es intuitiva y ergonómica. Stefania no tiene que imprimir papeles ni alternar entre cinco pestañas: valida con la vista y transfiere a Kipintoch en 15 segundos.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Acá tienen las dos pantallas en las que vive la operación diaria de Administración:*
> 
> *A la izquierda ven el* **Tablero Kanban**. *Todo comprobante que ingresa por correo se ubica en su columna según su estado. Fíjense en la tercera columna [señalando 'Con Desvío de Tarifa']: si una naviera sobrefactura un concepto, la tarjeta se enciende en rojo y el comprobante queda retenido. Nadie en el equipo operativo puede forzar su facturación.*
> 
> *Y a la derecha tienen el* **Visor Dual Side-by-Side**: *al abrir cualquier comprobante, Stefania tiene a la izquierda el PDF original tal cual lo emitió el armador, y a la derecha los datos normalizados que extrajo la inteligencia artificial. No necesita imprimir papeles ni tipear a mano.*
> 
> *Comprueba visualmente, presiona este botón verde [señalando 'Copiar Ficha a Kipintoch'] y en 15 segundos los 5 campos canónicos quedan pegados en el ERP.*
> 
> *Pero veamos cómo opera este escudo frente a casos reales de carpetas auditadas: comencemos con la Carpeta 367."*

---

### DIAPOSITIVA 09: CASO C367: NORMALIZACIÓN SEMÁNTICA DE COMBUSTIBLE NAVIERO (BUFF)
- **Título en Pantalla:** *CASO C367: NORMALIZACIÓN SEMÁNTICA DE COMBUSTIBLE NAVIERO (BUFF)*
- **Subtítulo:** *Unificación de 15 variantes de Bunker bajo el código canónico BUFF y auditoría contra cotización FCA Guangzhou.*
- **Momento Estratégico:** Momento 3: Casos Críticos Auditados.
- **Badges:** `CASO C367 · LCL IMPORTACIÓN` | `BLINDAJE AFIP: BUFF CANÓNICO`.
- **Componente Visual:** Stepper horizontal con Etapas 2 y 3 activas (`.traceability-stepper`).
- **Mockup URL:** `/carpetas/C367 · Normalización BUFF & Visor Dual [CASO C367]`.
- **Captura:** `screenshots/caso_c367_dual_buff_light.png`.
- **Tiempo Asignado:** Minuto 11:00 - 12:15 (01:15 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. Arriba, el stepper de trazabilidad con Etapa 2 (Extracción IA) y Etapa 3 (Cruce Cotiz. USD 80) encendidas en dorado. A la izquierda, análisis del caso C367 (Incoterm FCA Guangzhou, Juan Cuello / MSL, dispersión BAF/BRC/EBS) y callout de quebranto evitado: USD 80 + recargo no absorbido. A la derecha, captura del visor dual mostrando el mapeo a `BUFF`.
- **Qué señalar en la captura de pantalla:**
  * **Stepper superior:** Apuntar a las fases 2 y 3 activas.
  * **Línea de concepto en el visor del mockup:** Señalar el texto original del PDF del co-loader MSL ("Emergency Bunker Surcharge / BAF") y mostrar cómo a la derecha la IA lo clasificó automáticamente bajo el código fiscal canónico `BUFF`.
  * **Alerta de desvío de USD 80.00:** Señalar la discrepancia resaltada frente a la cotización original de Juan Cuello, demostrando que el sistema impidió que ALMAR emitiera la prefactura sin trasladar ese cargo al cliente final.
- **Lo que Fran enfatiza:** [Mirar a Vanesa]. Cada naviera inventa siglas distintas para el combustible. El normalizador semántico erradica rechazos de AFIP y asegura que ningún recargo quede sin cobrar.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Veamos el primer caso real auditado en los correos de ALMAR: la Carpeta C367 de importación LCL.*
> 
> *¿Qué ocurrió en esa operación? El co-loader MSL facturó conceptos de combustible bajo siglas como BAF, BRC y EBS. En el circuito manual, la operadora dudó sobre cómo imputarlo en Kipintoch, la carpeta se demoró y casi se emite la prefactura sin trasladar un recargo de 80 dólares más combustible al cliente final.*
> 
> *Miren cómo lo resuelve el portal [señalando la captura de la derecha]:*
> *El motor de IA reconoce cualquiera de las 15 variantes de recargos de combustible naviero y las normaliza automáticamente al código canónico* **BUFF** *que exige la normativa fiscal de AFIP.*
> 
> *Y al auditar la carpeta [señalando el stepper en fase 3], detecta al instante que la cotización pactada por Juan Cuello no contemplaba ese sobrecosto de 80 dólares. El comprobante se bloquea preventivamente, protegiendo el margen neto de ALMAR.*
> 
> *Pasemos al segundo caso crítico: las operaciones en Libras Esterlinas de la Carpeta C620."*

---

### DIAPOSITIVA 10: CASO C620: MÓDULO MULTIMONEDA BNA OFICIAL PARA DIVISAS COMPLEJAS (GBP)
- **Título en Pantalla:** *CASO C620: MÓDULO MULTIMONEDA BNA OFICIAL PARA DIVISAS COMPLEJAS (GBP)*
- **Subtítulo:** *Ingesta del tipo de cambio oficial vendedor del Banco Nación (BNA) a fecha de embarque con respaldo digital.*
- **Momento Estratégico:** Momento 3: Casos Críticos Auditados.
- **Badges:** `CUMPLIMIENTO CAMBIARIO & DGA` | `DIVISA: LIBRAS ESTERLINAS (GBP)`.
- **Componente Visual:** Stepper horizontal con Etapa 3 activa (BNA Oficial: USD 740).
- **Mockup URL:** `/carpetas/C620 · Módulo Multimoneda Oficial BNA (GBP) [CASO C620]`.
- **Captura:** `screenshots/caso_c620_multimoneda_bna_light.png`.
- **Tiempo Asignado:** Minuto 12:15 - 13:30 (01:15 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. Arriba, stepper con Etapa 3 encendida. A la izquierda, análisis del riesgo cambiario y aduanero (factura en £543 GBP, falta de tipo de cambio en Kipintoch, riesgo de manipulación del Permiso de Embarque ante DGA) y callout de respuesta a Vanesa. A la derecha, captura del modal de conversión multimoneda con cotización oficial BNA y constancia digital.
- **Qué señalar en la captura de pantalla:**
  * **Stepper superior:** Señalar la etapa 3 activa.
  * **Recuadro de conversión multimoneda:** Apuntar al importe original de **£543.00 GBP**, al tipo de cambio oficial vendedor del BNA de **1.3628** a la fecha exacta de la operación, y al cálculo resultante de **USD 740.00**.
  * **Hipervínculo de la constancia digital:** Señalar el archivo adjunto `C620_Constancia_Cotizacion_BNA_GBP.pdf`, explicando que queda archivado como respaldo inmutable para la Aduana.
- **Lo que Fran enfatiza:** [Mirar a Vanesa con tono distendido pero contundente]. Recordar la frase textual del relevamiento: *"Vanesa nos dijo en el relevamiento que no quería tener que ir a visitarnos a la cárcel por tocar a mano un Permiso de Embarque"*. Esta solución digitaliza y blinda el proceso al 100%.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Este caso es emblemático: la Carpeta C620 con costos facturados en Libras Esterlinas.*
> 
> *Como Kipintoch no maneja conversiones dinámicas automáticas para monedas no habituales, la tentación histórica era hacer el cálculo a mano en una calculadora y tipear dólares directamente en el sistema. Vanesa nos decía con toda la razón del mundo: 'Si tocamos a mano los valores de un Permiso de Embarque, la Aduana nos aplica una infracción cambiaria gravísima'.*
> 
> *Fíjense en la solución en pantalla [señalando el mockup de la derecha]:*
> *Cuando ingresa una factura en Libras, Euros o Reales, el portal toma automáticamente la* **cotización oficial vendedor del Banco de la Nación Argentina (BNA)** *a la fecha exacta del embarque.*
> 
> *En este caso: 543 Libras a 1.3628 arrojan exactamente* **740,00 dólares**. *Y lo más importante [señalando el enlace inferior]: el sistema descarga y adjunta automáticamente el certificado oficial del BNA como constancia documental inmutable.*
> 
> *Nadie modifica números a mano, AFIP y la DGA reciben el dato exacto y Vanesa duerme con tranquilidad absoluta.*
> 
> *Veamos ahora el caso de los seguros diferidos de Sancor."*

---

### DIAPOSITIVA 11: CASO SANCOR SEGUROS: PROVISIÓN DIFERIDA AUTOMÁTICA A 150 DÍAS
- **Título en Pantalla:** *CASO SANCOR SEGUROS: PROVISIÓN DIFERIDA AUTOMÁTICA A 150 DÍAS*
- **Subtítulo:** *Blindaje de comisiones comerciales e imputación de costos pendientes ante demoras de pólizas de hasta 5 meses.*
- **Momento Estratégico:** Momento 3: Casos Críticos Auditados.
- **Badges:** `BLINDAJE DE COMISIONES · DIRECTIVA FINANCIERA` | `PROVISIÓN 0,55% FOB`.
- **Componente Visual:** Stepper horizontal con Etapas 3 y 4 activas (Provisión 0,55% 150d, Holdback Comisión).
- **Mockup URL:** `/carpetas/Sancor · Provisión Diferida 150 Días [SEGURO 150D]`.
- **Captura:** `screenshots/caso_sancor_seguros_provision_light.png`.
- **Tiempo Asignado:** Minuto 13:30 - 14:45 (01:15 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. Arriba, stepper con Etapas 3 y 4 encendidas. A la izquierda, diagnóstico de la demora histórica de 120-150 días de Sancor Seguros y la liquidación indebida de comisiones sobre utilidades ficticias. A la derecha, captura del ledger contable de la carpeta con la provisión del 0,55% FOB y el estado de comisión retenida.
- **Qué señalar en la captura de pantalla:**
  * **Stepper superior:** Señalar las etapas 3 (Reglas) y 4 (Kipintoch holdback) activas.
  * **Fila de provisión en el ledger del mockup:** Apuntar a la línea: *Provisión Seguro Sancor (0,55% FOB) = USD 220.00*.
  * **Badge rojo de estado de comisión:** Señalar la tarjeta de comisiones comerciales con el estado `RETENIDA_COSTOS_PENDIENTES (Faltan 118 días / Póliza Sancor)`.
  * **Callout izquierdo:** Leer la frase de blindaje: *"No se pagan comisiones sobre utilidades ficticias que omiten el seguro"*.
- **Lo que Fran enfatiza:** [Mirar a Vanesa y a Alejandro]. Se protege la caja de la empresa: los comerciales cobrarán su comisión legítima, pero solo cuando la utilidad sea real y definitiva, descontando el seguro.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Llegamos a uno de los dolores financieros más profundos identificados en la auditoría: el caso de Sancor Seguros.*
> 
> *Sancor demora habitualmente entre 120 y 150 días —hasta 5 meses— en emitir las pólizas definitivas de transporte. Históricamente, ¿qué pasaba? Como la factura de Sancor no había llegado, la carpeta se cerraba a fin de mes mostrando una ganancia inflada, y ALMAR liquidaba comisiones a los vendedores sobre esa utilidad ficticia. Cuando a los 4 meses llegaba la factura del seguro, la ganancia real se desplomaba, pero la comisión ya se había pagado.*
> 
> *Miren cómo lo resuelve el portal [señalando la captura]:*
> *Apenas se carga el embarque, el sistema devenga automáticamente una provisión del* **0,55% sobre el valor FOB** *en el ledger de costos de la carpeta.*
> 
> *Y en el módulo comercial [señalando el badge rojo], la comisión del vendedor pasa al estado* `RETENIDA_COSTOS_PENDIENTES`. *Kipintoch bloquea el cierre definitivo hasta que arribe la póliza real de Sancor o se cumplan los 150 días.*
> 
> *Cero anticipo de fondos sobre utilidades no devengadas. El margen real de ALMAR queda 100% protegido.*
> 
> *Veamos ahora cómo resolvemos las autorizaciones gerenciales cuando un margen es fino: la Carpeta C1234."*

---

### DIAPOSITIVA 12: CASO C1234: ALERTA PREVENTIVA & AUTORIZACIÓN BIOMÉTRICA WEBAUTHN
- **Título en Pantalla:** *CASO C1234: ALERTA PREVENTIVA & AUTORIZACIÓN BIOMÉTRICA WEBAUTHN*
- **Subtítulo:** *Gestión de descalces de rentabilidad (< USD 200) y aprobación gerencial con firma criptográfica SHA-256.*
- **Momento Estratégico:** Momento 3: Casos Críticos Auditados.
- **Badges:** `RESPUESTA A ALEJANDRO & JUAN ANDRÉS` | `FIDO2 / WEBAUTHN SHA-256`.
- **Componente Visual:** Stepper horizontal con Etapas 3 y 4 activas (Alerta < USD 200, WebAuthn SHA-256).
- **Mockup URL:** `/carpetas/C1234 · Autorización Biométrica WebAuthn [WEBAUTHN SHA-256]`.
- **Captura:** `screenshots/caso_c1234_webauthn_sha256_light.png`.
- **Tiempo Asignado:** Minuto 14:45 - 16:00 (01:15 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. Arriba, stepper con Etapas 3 y 4 activas. A la izquierda, análisis de la Carpeta C1234 con margen proyectado de USD 142.50 (< USD 200) por descalce cambiario en gastos locales, y el mecanismo de override biométrico. A la derecha, captura del modal de autorización WebAuthn con firma biométrica y hash SHA-256 de 64 caracteres.
- **Qué señalar en la captura de pantalla:**
  * **Stepper superior:** Señalar las etapas 3 y 4 activas.
  * **Banner amarillo preventivo:** Apuntar a la alerta de margen crítico (< USD 200, margen estimado USD 142.50) en la carpeta C1234.
  * **Selector de motivo justificado:** Señalar la justificación inmutable: *"Aumento de tarifa naviera pactado con cliente"*.
  * **Sello biométrico y Hash SHA-256:** Señalar el icono de huella digital WebAuthn (Touch ID / Windows Hello) y la cadena criptográfica de 64 caracteres en tipografía monospace, demostrando a Juan Andrés la solidez pericial.
- **Lo que Fran enfatiza:** Conciliar las necesidades opuestas de la dirección: Alejandro necesita autorizar en 3 segundos desde su laptop sin burocracia, y Juan Andrés necesita que la autorización tenga plena validez jurídica pericial sin contraseñas compartidas.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"En la Carpeta C1234 nos encontramos con un descalce típico: el margen proyectado era de 142,50 dólares, por debajo del umbral de seguridad de USD 200 debido a un aumento imprevisto en acarreos portuarios locales en pesos.*
> 
> *El sistema encendió el semáforo amarillo preventivo y bloqueó la emisión de la prefactura. Pero acá viene la innovación que une los intereses de Alejandro y de Juan Andrés:*
> 
> *Alejandro necesita no trabar la operación con papeles ni llamados [mirando a Alejandro]. Y Juan necesita que si se autoriza un desvío, quede un respaldo legal inatacable [mirando a Juan Andrés].*
> 
> *Miren cómo funciona [señalando el modal de la derecha]:*
> *Gerencia abre el comprobante, selecciona el motivo formal y simplemente apoya su huella dactilar en la laptop con* **WebAuthn (Windows Hello o Touch ID)**.
> 
> *Cero contraseñas que se puedan filtrar o compartir. El navegador genera un par de claves criptográficas y un* **hash SHA-256 inmutable de 64 caracteres** *que se estampa en el registro inmutable de auditoría. Tiene plena validez legal bajo la Ley Nacional de Firma Digital.*
> 
> *Alejandro autoriza en 3 segundos y Juan tiene respaldo pericial total.*
> 
> *Y finalmente, veamos el circuito de triangulación con Miami y la conciliación con Banco Macro."*

---

### DIAPOSITIVA 13: CASO TRIANGULACIÓN (NET TRADE MIAMI) & CONCILIACIÓN BANCO MACRO
- **Título en Pantalla:** *CASO TRIANGULACIÓN (NET TRADE MIAMI) & CONCILIACIÓN BANCO MACRO*
- **Subtítulo:** *Trazabilidad de prefacturas Net Trade LLC y validación en extracto de Banco Macro antes del recibo definitivo.*
- **Momento Estratégico:** Momento 3: Casos Críticos Auditados.
- **Badges:** `NET TRADE LLC (MIAMI)` | `BANCO MACRO · CTA CTE`.
- **Componente Visual:** Stepper horizontal con Etapas 4 y 5 activas (Enlace Net Trade, Extracto Conciliado Banco Macro).
- **Mockup URL:** `/finanzas/banco-macro · Conciliación Bancaria y Extractos [CONCILIACIÓN BANCO]`.
- **Captura:** `screenshots/banco_macro_conciliacion_extracto_light.png`.
- **Tiempo Asignado:** Minuto 16:00 - 17:15 (01:15 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1.25. Arriba, stepper con Etapas 4 y 5 encendidas. A la izquierda, detalle de las triangulaciones con Net Trade LLC en Miami (International Finance Bank) y el subproceso de cobranzas en 3 pasos con Banco Macro. A la derecha, captura de la tabla de conciliación bancaria mostrando la concordancia entre el extracto bancario y la carpeta operativa.
- **Qué señalar en la captura de pantalla:**
  * **Stepper superior:** Señalar las etapas 4 y 5 activas.
  * **Bloque Net Trade Miami:** Apuntar al número de prefactura offshore vinculada al legajo local de Rosario, verificando el reembolso de costos locales.
  * **Tabla de conciliación de Banco Macro:** Señalar la fila del extracto bancario con la cuenta corriente en pesos Nº 376100000930617, apuntando al importe acreditado exacto.
  * **Badge verde de estado:** Señalar el estado `COBRADA_CONCILIADA`, mostrando que recién ahí el sistema habilita la emisión del recibo oficial y libera la comisión del comercial.
- **Lo que Fran enfatiza:** Se erradica el riesgo de dar por cobrada una operación con un simple volante de transferencia enviado por WhatsApp que luego resulta rebotado o apócrifo. Cero salida de recibos sin respaldo en extracto bancario.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Cerramos los casos auditados con dos pilares de alta sensibilidad financiera y fiscal:*
> 
> *Primero, las* **Operaciones Triangulares con Net Trade LLC en Miami** [mirando a Juan Andrés].
> *Cuando se emiten prefacturas al exterior a través de Net Trade y su cuenta en International Finance Bank (IFB), el sistema vincula automáticamente ese comprobante offshore con la carpeta operativa local en Rosario. Y antes de permitir el cierre, audita que los costos locales abonados por ALMAR hayan sido reembolsados formalmente, cumpliendo con la normativa cambiaria del BCRA y Precios de Transferencia.*
> 
> *Segundo, la* **Conciliación Obligatoria en Banco Macro** [mirando a Vanesa].
> *Establecimos un flujo de cobranzas en tres pasos:*
> `EMITIDA_PENDIENTE_COBRO` → `EN_VERIFICACION_BANCARIA` → `COBRADA_CONCILIADA`.
> 
> *Si un cliente manda un volante de transferencia por WhatsApp, pasa a verificación. Pero fíjense en la tabla de la derecha [señalando la captura]: el sistema prohíbe emitir el recibo oficial o liberar comisiones hasta que Finanzas no concilia ese importe contra el movimiento real del extracto bancario de la cuenta corriente de Banco Macro.*
> 
> *Si la plata no impactó en el banco, el recibo no se emite. Tesorería blindada al 100%.*
> 
> *Y ahora, pasemos a lo que todos quieren ver: la demostración en vivo de la plataforma en funcionamiento."*

---

### DIAPOSITIVA 14: DEMOSTRACIÓN EN VIVO DE LA SOLUCIÓN EN FUNCIONAMIENTO (LIVE DEMO)
- **Título en Pantalla:** *DEMOSTRACIÓN EN VIVO DE LA SOLUCIÓN EN FUNCIONAMIENTO*
- **Subtítulo:** *Transición al navegador (http://localhost:3000): prueba integral del circuito de facturación, comercial y cobranzas.*
- **Momento Estratégico:** Momento 3: Demo Interactiva en Tiempo Real.
- **Badges:** `ENTORNO ACTIVO · PRUEBA EN VIVO ANTE DIRECTORIO`.
- **Mockup URL:** `http://localhost:3000/comprobantes · Tablero en Vivo [● EN VIVO]`.
- **Captura:** `screenshots/kanban_corporate_light.png`.
- **Tiempo Asignado:** Minuto 17:15 - 21:00 (03:45 min de Demo en Vivo en Navegador).
- **Lo que ve la Audiencia:** Diapositiva puente con los 3 pasos de la demo (1. Ingesta y extracción en 5s; 2. Detección de desvío y semáforos; 3. Override biométrico y copiado en 1-clic a Kipintoch).
- **Acción Táctica del Orador:** Fran minimiza la presentación (`Alt + Tab` o ventana adyacente) y proyecta el navegador web con la aplicación en vivo en `http://localhost:3000`.
- **Qué señalar en la pantalla interactiva en vivo:**
  * **Paso 1 (Ingesta):** Arrastrar un archivo PDF real de Maersk o MSC a la zona de dropzone en `/comprobantes`. Mostrar el cronómetro en pantalla procesando y renderizando el documento en menos de 5 segundos.
  * **Paso 2 (Visor Side-by-Side):** Abrir el comprobante procesado: mostrar a la izquierda el PDF original y a la derecha los campos normalizados (CUIT 30-..., concepto BUFF, alícuota 21%).
  * **Paso 3 (Desvío de Tarifa):** Mostrar cómo el sistema detecta que el flete cobrado supera la cotización, activando el semáforo preventivo y bloqueando la emisión.
  * **Paso 4 (Override WebAuthn):** Cambiar al rol de Gerencia en el selector superior, presionar "Autorizar Desvío", simular la firma biométrica y mostrar el hash SHA-256 grabado en el log.
  * **Paso 5 (Copiado a Kipintoch):** Presionar "Copiar Ficha a Kipintoch", abrir un bloc de notas o formulario y pegar los datos instantáneamente en 15 segundos.
  * **Paso 6 (Calculadora Comercial):** Navegar a `/cotizaciones`, abrir la Calculadora, cambiar el perfil a `CUENTA_ESTRATEGICA`, mostrar el recálculo dinámico de margen en vivo, y abrir el panel de Smart Follow-Up para copiar un correo formal listo en 1 clic.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Voy a conmutar en este instante al navegador para que vean el sistema operando en tiempo real con datos y comprobantes reales.*
> 
> *[Fran pasa al navegador en `http://localhost:3000`]*
> 
> *Miren la pantalla: acá tenemos el portal en vivo.*
> 
> *Voy a tomar una factura marítima real en PDF de Maersk y la voy a soltar en la bandeja de entrada de Comprobantes. Fíjense: uno, dos, tres... cuatro segundos. El documento ya fue procesado.*
> 
> *Hago clic y abro el Visor Dual: a la izquierda tienen el PDF original tal cual llegó del armador. A la derecha, el motor ya desglosó el CUIT de Maersk, discriminó el flete marítimo internacional, reconoció el recargo BAF y lo mapeó automáticamente a BUFF, y calculó el IVA.*
> 
> *Pero observen lo que ocurre con el margen [señalando la alerta en pantalla]: el sistema cruzó la factura contra la carpeta de Kipintoch y detectó que el armador facturó 180 dólares más de lo cotizado. La tarjeta se fue automáticamente a la columna 'Con Desvío de Tarifa' y el botón de facturación está deshabilitado.*
> 
> *Si inicio sesión como Stefania en rol Operativo, no puedo destrabarlo. Pero si inicio sesión como Gerencia [Fran conmuta el rol a Gerencia], se activa este botón: 'Autorizar Desvío Gerencial'. Hago clic, selecciono el motivo, pongo la huella digital en la laptop y el sistema estampa el sello biométrico con el hash SHA-256 inmutable.*
> 
> *La carpeta queda autorizada. Y ahora miren esto: presiono 'Copiar Ficha a Kipintoch'. Los 5 campos canónicos están en mi portapapeles. Stefania abre Kipintoch, pega los datos, y en 15 segundos la factura está cargada sin tipear un solo número a mano.*
> 
> *Y antes de volver a las diapositivas, miren la parte comercial [Fran navega a `/cotizaciones`]: acá está la Calculadora que le prometí a Alejandro. Cambio el perfil a 'CUENTA_ESTRATEGICA' y el margen se recalcula al instante. Abro el Smart Follow-Up, elijo la cotización que lleva 3 días sin respuesta, toco 'Copiar Seguimiento' y tengo la plantilla formal lista para pegar en Gmail.*
> 
> *[Fran regresa a la presentación interactiva y avanza a la Diapositiva 15]*"

---

## MOMENTO 4: TRIAGE EN PILOTO, ARQUITECTURA & HOJA DE RUTA (MINUTOS 21:00 - 25:00)

---

### DIAPOSITIVA 15: PILOTO ASISTIDO: CHATBOT COPILOT DE IA &amp; TRIAGE OPERATIVO (#TKT-XXX)
- **Título en Pantalla:** *PILOTO ASISTIDO: CHATBOT COPILOT DE IA & TRIAGE OPERATIVO (#TKT-XXX)*
- **Subtítulo:** *Asistente conversacional de inteligencia artificial para resolución inmediata de dudas operativas y captura ágil de feedback y mejoras.*
- **Momento Estratégico:** Momento 4: Etapa Piloto & Mejora Continua.
- **Badges:** `CHATBOT COPILOT IA ACTIVO` | `AGILIDAD & FEEDBACK EN VIVO` | `#TKT-8421`.
- **Mockup:** Mockup visual interactivo en HTML del Chatbot Copilot con historial de chat y ticket de triage (#TKT-8421).
- **Tiempo Asignado:** Minuto 21:00 - 22:15 (01:15 min).
- **Lo que ve la Audiencia:** Cuadrícula 1:1. A la izquierda, tarjetas explicando el Chatbot Copilot conversacional (auto-resolución 24/7), el widget de triage inmutable y cómo agilizan el feedback. A la derecha, mockup del Chatbot Copilot respondiendo sobre la carpeta C1234 y generando en vivo el ticket `#TKT-8421` para asentar un desvío de Maersk ("Cleaning Fee USD 45").
- **Qué señalar en la pantalla:**
  * **Pestaña 'Copilot IA Operativo':** Mostrar que el usuario tiene un asistente de inteligencia artificial conversacional integrado en todas las pantallas.
  * **Diálogo en pantalla:** Apuntar a la pregunta sobre C1234 y cómo el Copilot explica que el margen es de USD 142.50 y recomienda WebAuthn o la calculadora.
  * **Auto-generación del Ticket #TKT-8421:** Señalar cómo el Copilot genera automáticamente el ticket `#TKT-8421`, deriva el gasto a Desvíos en el Kanban y notifica a soporte técnico.
  * **Chips de sugerencia rápida inferiores:** Mostrar los atajos para consultas frecuentes (*"¿Por qué se bloqueó C1234?"*, *"Provisión Sancor 150d"*).
- **Lo que Fran enfatiza:** El personal no está solo: tiene un chatbot que responde en segundos según las normas de ALMAR, y cualquier caso atípico se convierte en una mejora técnica el mismo día sin burocracia ni reuniones eternas.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Hay una herramienta clave que desarrollamos específicamente para garantizar que la adopción sea fluida e inmediata:*
> 
> *En todo proyecto tecnológico, en las primeras semanas aparecen dudas operativas, facturas con formatos raros o conceptos portuarios nuevos. Lo típico en las empresas es que el usuario se trabe, mande un mail que nadie responde y el sistema quede en desuso.*
> 
> *Para evitar eso, integramos en la misma aplicación el* **Chatbot Copilot de Operaciones & Triage de Feedback** [señalando el mockup de la derecha]:
> 
> *Primero, funciona como un* **Asistente Conversacional con IA 24/7**. *Cualquier operador o directivo le pregunta en lenguaje natural: '¿Por qué la carpeta C1234 tiene alerta preventiva?', y el Copilot le responde al instante: 'Tiene margen de USD 142.50 (< USD 200). Podés autorizarla con WebAuthn o ajustar la tarifa spot desde la Calculadora'.*
> 
> *Segundo,* **Agiliza el feedback y las mejoras en tiempo real**. *Si el usuario le escribe: 'Maersk sumó un cargo Cleaning Fee por USD 45 no presupuestado', el Copilot genera en el acto el ticket inmutable* **#TKT-8421**, *deriva el sobrecosto a la columna de Desvíos del Kanban y nos envía la traza para que calibremos el algoritmo en pocas horas.*
> 
> *Cero fricción, cero burocracia y evolución continua a la velocidad del rayo.*
> 
> *Veamos ahora cómo sintetizamos las inquietudes de cada uno de ustedes en una matriz directiva."*

---

### DIAPOSITIVA 16: MATRIZ DE RESOLUCIÓN DE DESAFÍOS OPERATIVOS Y ESTRATÉGICOS
- **Título en Pantalla:** *MATRIZ DE RESOLUCIÓN DE DESAFÍOS OPERATIVOS Y ESTRATÉGICOS*
- **Subtítulo:** *Respuestas sistémicas y estructuradas a los principales desafíos de pricing comercial, control financiero y soberanía tecnológica.*
- **Momento Estratégico:** Momento 4: Respuestas al Directorio.
- **Badges:** `PRICING & VENTAS` | `RENTABILIDAD REAL` | `SEGURIDAD DE DATOS`.
- **Componente Visual:** Cuadrícula de 3 columnas institucionales (`.objection-card`) emparejando cada área operativa con el dilema resuelto, respuesta técnica y beneficio concreto:
  1. **GESTIÓN COMERCIAL (Pricing & Ventas):** Velocidad spot vs control de margen → Respuesta: selector `SPOT_ALTO_RIESGO` cotiza en 45s, alerta sin frenar, bloqueo solo ante pérdida neta (< USD 3) o tarifa vencida. Beneficio: Registro sistemático de feedback de pérdidas para negociar volumen con navieras.
  2. **CONTROL FINANCIERO (Rentabilidad Real):** Flete viejo y 5 meses de espera en seguros → Respuesta: semáforo de vigencias (15/30d) y provisión diferida automática 0,55% FOB por 150d. Beneficio: Comisiones comerciales blindadas y conciliación bancaria obligatoria en Banco Macro.
  3. **GOBERNANZA Y LEGAL (Seguridad de Datos):** Respaldo de autorizaciones y confidencialidad en IA → Respuesta: firma biométrica WebAuthn con hash SHA-256 inmutable (Ley 25.506) y cuenta corporativa propia de ALMAR con Zero Data Retention (`store: false`). Beneficio: Soberanía de datos y no repudio pericial pleno.
- **Tiempo Asignado:** Minuto 22:15 - 23:15 (01:00 min).
- **Lo que ve la Audiencia:** Tres tarjetas de diseño institucional impecable donde cada área clave de la empresa ve resuelta su inquietud de forma elegante, profesional y sin personalizar ni exponer a ningún director en pantalla.
- **Qué señalar en la pantalla:**
  * Recorrer de izquierda a derecha cada columna, haciendo contacto visual natural con cada directivo al abordar el dominio de su interés.
  * Señalar los badges de beneficio inferior en cada tarjeta.
- **Lo que Fran enfatiza:** Mostrar que cada requerimiento crítico de las operaciones fue comprendido al detalle, parametrizado en la arquitectura y resuelto con rigor tecnológico.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Esta matriz sintetiza el compromiso de diseño que asumimos con cada uno de ustedes:*
> 
> *Para Alejandro [mirando a Alejandro]: velocidad comercial absoluta con perfiles dinámicos y captura sistemática de pérdidas para negociar con navieras.*
> 
> *Para Vanesa [mirando a Vanesa]: freno taxativo a tarifas caducadas, provisión diferida de seguros para no regalar comisiones y conciliación bancaria estricta.*
> 
> *Y para Juan Andrés [mirando a Juan Andrés]: firmas biométricas inatacables bajo la Ley de Firma Digital y custodia absoluta de los secretos comerciales de ALMAR.*
> 
> *Revisemos ahora el diagrama de arquitectura y cómo se integra con la Intranet existente de ALMAR."*

---

### DIAPOSITIVA 17: ARQUITECTURA DE PRODUCCIÓN, DIAGRAMA E INTEGRACIÓN EN INTRANET FIREBASE
- **Título en Pantalla:** *ARQUITECTURA DE PRODUCCIÓN, DIAGRAMA E INTEGRACIÓN EN INTRANET FIREBASE*
- **Subtítulo:** *Diagrama integral de componentes, soberanía Zero Data Retention (§ 3.2) y especificación técnica para embeber la solución en la Intranet de ALMAR.*
- **Momento Estratégico:** Momento 4: Arquitectura de Producción & Integración.
- **Badges:** `EMBEBIBLE EN INTRANET FIREBASE` | `OPENAI ZDR SOBERANO` | `DIAGRAMA TÉCNICO E2E`.
- **Componente Visual:** Diagrama interactivo de flujo de 4 capas conectadas (Intranet Firebase / Acceso ➔ Next.js Vercel ➔ OpenAI ZDR ➔ Supabase Postgres / ERPs) + 3 tarjetas técnicas detallando el embebido en Firebase, la soberanía ZDR y la alta disponibilidad.
- **Tiempo Asignado:** Minuto 23:15 - 24:15 (01:00 min).
- **Lo que ve la Audiencia:** 
  * Arriba: Diagrama horizontal de arquitectura conectando las 4 capas de punta a punta.
  * Abajo: Tres tarjetas ejecutivas:
    1. **Embebido en Intranet Firebase (100% Factible):** Iframe con Content-Security-Policy (CSP) `frame-ancestors`, Single Sign-On (SSO) mediante Firebase Auth JWT (cero contraseñas extra) y opción de Firebase Hosting Rewrites.
    2. **Soberanía OpenAI ZDR (§ 3.2):** Cuenta directa de ALMAR, facturación a tarjeta corporativa (centavos/factura), parámetro `store: false` y cero entrenamiento.
    3. **Cloud Serverless & Firma Legal:** Vercel Edge + Supabase Postgres en São Paulo (`sa-east-1`, < 35ms), firma biométrica WebAuthn SHA-256 inmutable y conciliación en Banco Macro.
- **Qué señalar en la pantalla:**
  * **Diagrama superior:** Recorrer las 4 cajas con el cursor de izquierda a derecha, mostrando el flujo de datos.
  * **Caja 1 del diagrama (Azul):** Señalar la Intranet en Firebase de ALMAR y el handshake con SSO.
  * **Caja 3 del diagrama (Dorado):** Apuntar al parámetro `store: false` de OpenAI ZDR.
  * **Tarjeta inferior de Firebase:** Destacar que para el usuario final es simplemente una solapa nueva en su intranet de todos los días.
- **Lo que Fran enfatiza:** Compatibilidad total con lo que ALMAR ya tiene (su intranet en Firebase), seguridad contractual plena y cero inversión en servidores físicos.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Analicemos la arquitectura técnica y cómo se ensambla con los sistemas que ALMAR ya utiliza hoy:*
> 
> *Fíjense en el diagrama superior [recorriendo las 4 capas con la mano]:*
> 
> *Punto 1:* **Embebido Directo en la Intranet Firebase de ALMAR** [mirando a Juan Andrés y Alejandro].
> *Estudiamos la intranet corporativa que ustedes tienen montada sobre Firebase y les confirmo que* **la integración es 100% directa y transparente**:
> *Podemos embeber este portal como una solapa interna dentro de su intranet mediante un contenedor seguro con Content-Security-Policy.*
> *Y lo mejor:* **Single Sign-On (SSO)**. *Reutilizamos la sesión activa de Firebase Authentication mediante tokens JWT. ¿Qué significa esto en el día a día? Que Stefania, Lucía o ustedes no tienen que aprenderse otro usuario ni otra contraseña: entran a su intranet habitual y el sistema ya sabe quiénes son y qué rol tienen.*
> 
> *Punto 2:* **Procesamiento Serverless en Vercel Edge**.
> *Todo el motor de reglas ISO 9001, las validaciones de margen y el Copilot corren en microservicios serverless de alta disponibilidad, con 99,99% de uptime.*
> 
> *Punto 3:* **Soberanía Absoluta en OpenAI con Zero Data Retention (ZDR § 3.2)**.
> *ALMAR contrata directamente su cuenta empresarial de OpenAI. El consumo se debita directo de su tarjeta corporativa. Con el parámetro técnico* `store: false`, *OpenAI procesa la factura en memoria volátil y la destruye en el acto. Cero persistencia en disco y cero entrenamiento de modelos con su información.*
> 
> *Punto 4:* **Persistencia y Respaldo Legal**.
> *La base de datos PostgreSQL corre en Supabase en la región de São Paulo, con latencia menor a 35 milisegundos. Las autorizaciones críticas se firman con biometría WebAuthn inalterable, y los cobros se concilian contra el extracto real de Banco Macro.*
> 
> *Cero gastos en servidores en la oficina y una integración perfecta en su intranet existente.*
> 
> *Veamos el cronograma para poner esto en marcha en 4 semanas."*

---

### DIAPOSITIVA 18: HOJA DE RUTA DE PUESTA EN MARCHA (4 SEMANAS) Y DECISIÓN DIRECTIVA
- **Título en Pantalla:** *HOJA DE RUTA DE PUESTA EN MARCHA (4 SEMANAS) Y DECISIÓN DIRECTIVA*
- **Subtítulo:** *Cronograma de 4 semanas hacia la producción definitiva y llamado a la decisión directiva.*
- **Momento Estratégico:** Momento 4: Plan de Implementación y Cierre.
- **Componente Visual:** Cuadrícula de 4 columnas (Semanas 1 a 4) + Callout de Decisión Recomendada.
- **Tiempo Asignado:** Minuto 24:15 - 25:00 (00:45 min).
- **Lo que ve la Audiencia:** 
  * 4 Semanas en secuencia:
    - **Semana 1: Set-up & Cloud:** Alta de la cuenta OpenAI propia de ALMAR y despliegue del entorno productivo en Vercel y Supabase sa-east-1.
    - **Semana 2: Inicio de Piloto:** Capacitación a Stefania y equipo administrativo; carga asistida con Widget de Triage activo (`#TKT-XXX`).
    - **Semana 3: Calibración Fina:** Ajuste de reglas de desvíos, conceptos navieros específicos, vigencias y pruebas con extractos de Banco Macro.
    - **Semana 4: Producción Definitiva:** Pase a producción definitivo, corte operativo de carga manual a Kipintoch y tablero de métricas en vivo.
  * Callout inferior verde bosque: Decisión recomendada: aprobar el inicio de la Semana 1 de despliegue con acompañamiento técnico continuo de Clave Consultora.
- **Qué señalar en la pantalla:**
  * Recorrer las 4 tarjetas de semanas con ritmo ágil y decidido.
  * Señalar la tarjeta de la Semana 1 marcando que el inicio es inmediato.
  * Apuntar al callout inferior verde con la solicitud formal de decisión directiva.
- **Lo que Fran enfatiza:** Llamado directo a la acción. El desarrollo está terminado y probado; la pelota está en el campo del directorio para dar el paso hacia la eficiencia y el control definitivo.

#### 🎙️ Guion Textual Verbatim (Fran):
> *"Para cerrar, este es el plan de puesta en marcha propuesto para los próximos 30 días:*
> 
> *En la* **Semana 1**, *asistimos a Juan en dar de alta la cuenta corporativa de OpenAI de ALMAR y conectamos las claves al entorno productivo de Vercel y Supabase.*
> 
> *En la* **Semana 2**, *hacemos una sesión de capacitación de 45 minutos con Stefania y habilitamos el piloto de carga real con el Widget de Triage activo.*
> 
> *En la* **Semana 3**, *calibramos las reglas finas de desvíos y los conceptos atípicos que hayan surgido.*
> 
> *Y en la* **Semana 4**, *hacemos el pase a régimen definitivo, logrando que ALMAR procese el 100% de sus facturas de proveedores con asistencia de IA y control total de rentabilidad.*
> 
> *La plataforma está lista, testeada y funcionando. Les propongo que demos por aprobada la Semana 1 para iniciar el despliegue. Quedo a disposición de Alejandro, Vanesa y Juan para responder sus consultas. Muchas gracias."*

---

# 3. BANCO DE RESPUESTAS A OBJECIONES DIRECTIVAS AMPLIADO

A continuación se presenta el arsenal táctico de respuestas para que Fran Bondino responda con solvencia técnica, aplomo comercial y rigor jurídico ante las repreguntas de cada uno de los directores durante el coloquio final.

---

### 3.1 OBJECIONES DE ALEJANDRO NOACCO (DIRECTOR COMERCIAL)

#### 3.1.1 Flexibilidad de Pricing Spot vs Markup Rígido
- **Pregunta / Objeción de Alejandro:**  
  *"Fran, me parece bárbaro que quieran cuidar los números, pero el mercado de freight forwarding vive de los negocios spot. Si a mí me entra una carga de 10 contenedores donde el cliente me pide precio en el acto y yo tengo que pelear el flete con un margen finito de 50 dólares por contenedor, ¿este sistema no me va a atar de pies y manos o hacerme perder la operación por esperar autorizaciones?"*
- **Respuesta Táctica de Fran:**  
  *"Alejandro, esa fue exactamente la premisa que guio el diseño del Módulo Comercial: la tecnología tiene que darte velocidad de fuego, no burocracia.*
  
  *Fijate que eliminamos cualquier markup rígido. En la calculadora tenés el selector de 'Perfil de Rentabilidad'. Si estás cerrando una carga spot agresiva, elegís el perfil `SPOT_ALTO_RIESGO` o `CUENTA_ESTRATEGICA`. El sistema te calcula la propuesta en 45 segundos con el margen que vos decidís.*
  
  *¿Dónde interviene el sistema? Únicamente en dos cosas lógicas:*
  *1. Te avisa con semáforo amarillo si el margen baja de 200 dólares para que recuerdes que los gastos portuarios o acarreos en pesos pueden comerse ese margen si la brecha cambiaria se mueve. Pero la alerta te informa, no te traba la propuesta.*
  *2. La única compuerta que te bloquea el botón es si la operación da ganancia negativa o menor a 3 dólares, porque en ese caso no estás vendiendo: estás subsidiando el flete del cliente con plata de ALMAR.*
  
  *Tenés total libertad de pricing, cotizás en menos de un minuto y contás con un copiloto que te asegura que cada negocio que cierres le sume plata a la empresa."*

#### 3.1.2 Registro de Pérdidas de Cotizaciones por Precio de la Competencia
- **Pregunta / Objeción de Alejandro:**  
  *"Nosotros cotizamos cientos de fletes al mes. Muchas veces el cliente se va con la competencia porque cotizó 100 o 150 dólares menos. Hoy ese dato queda en un WhatsApp o se pierde en el aire. ¿Cómo me ayuda este portal a capturar esa información y qué hago con eso?"*
- **Respuesta Táctica de Fran:**  
  *"Ese es uno de los mayores diferenciales comerciales de la plataforma, Alejandro.*
  
  *En la tabla de cotizaciones agregamos el botón 'Feedback Comercial'. Cuando un cliente no cierra, Lucía o vos hacen un clic, seleccionan el motivo 'COMPETENCIA_MENOR_PRECIO' y escriben textual: 'Competencia cotizó USD 150 menos'.*
  
  *Ese dato no queda en una nota suelta: se indexa automáticamente asociado a la naviera, la ruta y el tipo de contenedor. A fin de mes, el portal te muestra una métrica consolidada: 'En la ruta Ningbo-Buenos Aires perdimos 14 cotizaciones porque MSC o Maersk estuvieron 150 dólares por encima de Cosco'.*
  
  *Con ese reporte en mano, vos ya no vas a negociar con los armadores pidiendo rebajas generales por simpatía: te sentás con el line manager de Maersk y le decís con números en la mesa: 'Acá tenés 14 operaciones concretas que se cayeron por 150 dólares; si me das esa tarifa de volumen, cerramos 14 contenedores juntos este mes'. Transformás una cotización perdida en poder de negociación real."*

#### 3.1.3 Automatización del Seguimiento Comercial para Lucía Laje
- **Pregunta / Objeción de Alejandro:**  
  *"Lucía Laje emite más de la mitad de las cotizaciones de la empresa y la realidad es que está tapada de laburo administrativo. Se le pasan los seguimientos y me preocupa que se nos enfríen clientes potenciales por no insistir a tiempo. ¿Cómo le saca trabajo de encima este portal?"*
- **Respuesta Táctica de Fran:**  
  *"Los números que auditamos son contundentes: Lucía emitió 584 de las 1.080 cotizaciones recientes, el 54,1%. Es humanamente imposible que una sola persona cotice, atienda el teléfono, coordine cargas y además redacte correos personalizados de seguimiento para 500 operaciones.*
  
  *Por eso creamos el panel de* **Smart Follow-Up a 48 Horas**:
  *El sistema filtra en tiempo real todas las cotizaciones que llevan más de 48 horas sin respuesta del cliente. Lucía abre el panel a la mañana y ve la lista priorizada por monto económico.*
  
  *Al hacer clic en 'Generar Correo de Seguimiento', el sistema redacta automáticamente la plantilla institucional formal: saluda al cliente por su nombre, menciona el número de cotización, el puerto de embarque, la tarifa ofrecida y le recuerda cordialmente la fecha de vigencia.*
  
  *Lucía no redacta nada: revisa el texto en 3 segundos, toca 'Copiar', lo pega en Gmail y lo envía. En 10 minutos hace el seguimiento prolijo de 20 cotizaciones. Esto le devuelve horas de tiempo productivo y reactiva ventas dormidas sin esfuerzo manual."*

---

### 3.2 OBJECIONES DE VANESA MEGGIOLARO (DIRECTORA DE ADMINISTRACIÓN Y FINANZAS)

#### 3.2.1 Freno a Cotizaciones con Tarifas Vencidas de Navieras
- **Pregunta / Objeción de Vanesa:**  
  *"A mí me pasa seguido que un comercial cotiza con un tarifario viejo que le quedó guardado en una planilla; el cliente confirma dos semanas después y cuando nos llega la factura del armador nos encontramos con que la tarifa ya había subido y nosotros nos tenemos que hacer cargo de la diferencia. ¿Cómo me garantiza el sistema que esto no vuelva a pasar?"*
- **Respuesta Táctica de Fran:**  
  *"Vanesa, ese dolor que describís fue el que motivó el desarrollo del Semáforo de Vigencia de Tarifas Navieras.*
  
  *En el sistema, cada tarifa cargada en la calculadora o en la tabla tiene asignada una fecha de expiración estricta de 15 o 30 días, que es la ventana estándar de las navieras. El semáforo monitorea esa fecha en tiempo real:*
  *Si la tarifa está dentro del plazo, se muestra verde 'Vigente'. Cuando faltan 3 días para vencer, pasa a amarillo 'Por Vencer'. Pero si la tarifa expiró, pasa automáticamente a rojo 'Vencida' y el sistema* **bloquea la emisión de la propuesta comercial**.*
  
  *El comercial físicamente no puede generar la cotización para el cliente con esa tarifa caducada. El sistema lo obliga a consultar al armador y actualizar el costo en el sistema. Cortamos de cuajo la posibilidad de que ALMAR emita propuestas con fletes viejos que luego se conviertan en quebranto para la empresa."*

#### 3.2.2 Provisión Diferida Automática a 150 Días de Sancor Seguros y Retención de Comisiones
- **Pregunta / Objeción de Vanesa:**  
  *"Con Sancor Seguros tenemos un problema crónico: tardan entre 4 y 5 meses en enviarnos las pólizas. Si cerramos las carpetas a fin de mes para liquidar comisiones a los vendedores, estamos pagando sobre una utilidad que no descontó el seguro. Cuando la factura de Sancor finalmente llega, la ganancia real baja y la comisión ya se pagó de más. ¿Cómo lo soluciona el portal?"*
- **Respuesta Táctica de Fran:**  
  *"Esa fue una de las fallas más delicadas que descubrimos en la auditoría y la resolvimos con una regla contable automática inquebrantable:*
  
  *Apenas una carpeta operativa se da de alta con seguro contratado, el sistema* **devenga automáticamente una provisión estimada del 0,55% sobre el valor FOB** *de la mercadería en el ledger de costos de esa carpeta.*
  
  *En simultáneo, el cálculo de la comisión del comercial para esa operación pasa al estado* `RETENIDA_COSTOS_PENDIENTES` *por una ventana de 150 días. Kipintoch y el portal impiden cerrar contablemente la carpeta o liberar la comisión hasta que ocurra una de dos cosas: o Finanzas carga la factura definitiva de Sancor y se ajusta la diferencia real, o expira el plazo de 150 días provisionado.*
  
  *De esta manera, los vendedores cobran sus comisiones sobre números reales y depurados. Ni un solo peso de ALMAR sale de la caja para pagar comisiones sobre ganancias ficticias."*

#### 3.2.3 Validación Obligatoria de Acreditación en Extracto de Banco Macro
- **Pregunta / Objeción de Vanesa:**  
  *"A veces los clientes mandan por WhatsApp un volante de transferencia o un comprobante bancario apócrifo, o una transferencia que después rebota, y Operaciones ya quiere dar la carpeta por cobrada y emitir el recibo. Yo necesito que hasta que la plata no esté acreditada en la cuenta del Banco Macro, no se mueva nada."*
- **Respuesta Táctica de Fran:**  
  *"Comparto al 100% tu criterio financiero, Vanesa. Por eso extendimos el ciclo de vida del sistema más allá de la factura fiscal, creando el Subproceso de Cobranzas en tres pasos obligatorios:*
  `EMITIDA_PENDIENTE_COBRO` → `EN_VERIFICACION_BANCARIA` → `COBRADA_CONCILIADA`.
  
  *Cuando el cliente manda el volante de pago, la carpeta pasa a 'En Verificación Bancaria'. Pero el sistema prohíbe taxativamente la emisión del recibo oficial de cobro y prohíbe liberar las comisiones comerciales hasta que Finanzas no realiza el cruce contra el extracto bancario de la cuenta corriente de Banco Macro (cuenta Nº 376100000930617).*
  
  *El operador debe marcar la concordancia exacta con la línea del extracto bancario donde impactaron los fondos. Recién con esa conciliación validada, la carpeta pasa a 'Cobrada y Conciliada' y se habilita el recibo. Cero riesgo de cheques rechazados, transferencias que no entraron o volantes fraudulentos."*

---

### 3.3 OBJECIONES DE JUAN ANDRÉS ARLORO (DIRECTOR LEGAL Y RESPONSABLE TI / APODERADO)

#### 3.3.1 Validez Jurídica y Probatoria de las Autorizaciones Biométricas WebAuthn
- **Pregunta / Objeción de Juan Andrés:**  
  *"Fran, desde el punto de vista legal y societario: si un directivo autoriza un desvío de costos o un margen crítico con la huella digital en su laptop en lugar de una firma física o un usuario y contraseña tradicional, ¿qué validez probatoria tiene eso ante una auditoría fiscal, una demanda judicial o un conflicto societario?"*
- **Respuesta Táctica de Juan:**  
  *"Juan Andrés, la respuesta jurídica es contundente: tiene una validez probatoria pericial infinitamente superior a una contraseña y a una firma ológrafa escaneada.*
  
  *El sistema implementa el estándar internacional* **WebAuthn (FIDO2)**, *el mismo protocolo que exige la directiva bancaria europea PSD2 y los sistemas de banca electrónica de máxima seguridad.*
  
  *¿Cómo funciona bajo la ley argentina? Al apoyar la huella en Windows Hello o Touch ID, el chip de seguridad local (TPM) genera un par de claves asimétricas: la clave privada nunca sale de la máquina del directivo y la clave pública valida la operación firmando un* **hash SHA-256 inalterable de 64 caracteres** *que se graba en la base de datos junto con el timestamp UTC exacto, el ID de carpeta y el motivo formal.*
  
  *Bajo la* **Ley Nacional de Firma Digital Nº 25.506 (artículos 5 y concordantes)** *y su decreto reglamentario, este mecanismo cumple con los requisitos de firma electrónica avanzada: garantiza la autoría indiscutible del firmante, la integridad inmutable del documento y el no repudio pericial. Una contraseña cualquiera puede ser compartida o hackeada por un empleado; una firma criptográfica atada a la biometría del hardware del directivo es pericialmente inatacable."*

#### 3.3.2 Cumplimiento de Precios de Transferencia y Régimen Cambiario BCRA en Triangulaciones Net Trade Miami
- **Pregunta / Objeción de Juan Andrés:**  
  *"Nosotros operamos triangulaciones comerciales facturando fletes al exterior con Net Trade LLC en Miami, cobrando en International Finance Bank (IFB) y pagando costos locales en Rosario. ¿Cómo asegura el sistema que no tengamos contingencias de Precios de Transferencia ante la AFIP o sanciones cambiarias del Banco Central?"*
- **Respuesta Táctica de Fran:**  
  *"Ese fue un punto central de auditoría, Juan Andrés. El módulo de operaciones triangulares fue calibrado específicamente bajo el régimen cambiario del BCRA y las normas de Precios de Transferencia (art. 15 de la Ley de Impuesto a las Ganancias):*
  
  *Primero: el portal vincula formalmente el comprobante emitido en el exterior por Net Trade LLC (con su identificación fiscal EIN y cuenta en IFB) directamente con el expediente operativo de ALMAR Rosario en Kipintoch, asegurando la consistencia documental cruzada.*
  
  *Segundo: el sistema audita y exige que todos los costos locales afrontados por ALMAR Rosario (fletes internos, gastos terminales, despachos de aduana) cuenten con una orden formal de reembolso acreditada desde el exterior antes de habilitar el cierre contable de la operación.*
  
  *Esto demuestra de manera fehaciente ante cualquier inspección de AFIP la sustancia económica real de la intermediación, acredita que no existe desvío artificial de utilidades ni subfacturación, y respalda el cumplimiento estricto del régimen cambiario de ingreso y liquidación de divisas por servicios de comercio exterior. Todo queda documentado y trazable con valor de auditoría permanente."*

#### 3.3.3 Privacidad de Datos y Garantía Contractual Zero Data Retention en OpenAI
- **Pregunta / Objeción de Juan Andrés:**  
  *"Ustedes usan inteligencia artificial de OpenAI para leer las facturas. ¿Cómo sé que los nombres de nuestros clientes, los volúmenes de carga y las tarifas que negociamos no terminan en los servidores de OpenAI para entrenar a ChatGPT o filtrarse a la competencia?"*
- **Respuesta Táctica de Fran:**  
  *"Juan Andrés, esa fue la primera restricción técnica y contractual que establecimos antes de escribir una sola línea de código:*
  
  *Primero:* **Contratación directa y soberanía total**. *ALMAR Rosario contrata directamente su propia cuenta empresarial con OpenAI. Clave Consultora no intermedia ni almacena sus credenciales. Ustedes son los únicos dueños jurídicos de las claves de API.*
  
  *Segundo:* **Garantía Contractual Zero Data Retention (ZDR)**. *Bajo los términos de servicio para empresas (Business Terms de OpenAI, cláusula § 3.2), los datos enviados por API comercial no se utilizan bajo ninguna circunstancia para entrenar modelos públicos ni privados.*
  
  *Tercero:* **Parámetro técnico de persistencia cero**. *En cada llamada de procesamiento, el portal envía el parámetro estricto* `store: false`. *Esto obliga a los servidores de OpenAI a procesar el texto de la factura en memoria volátil y destruirlo de inmediato una vez devuelta la respuesta estructurada. Cero retención en disco, cero persistencia y secreto comercial 100% blindado por contrato internacional."*

---

# 4. PAUTAS DE INTERACCIÓN, COMUNICACIÓN NO VERBAL Y PROTOCOLO DE CIERRE

### 4.1 Postura, Mirada y Clima de la Reunión
- **Contacto Visual Triangular:** Mantener un reparto equilibrado de la atención visual: 40% a Alejandro (foco comercial y agilidad), 40% a Vanesa (foco financiero, costos y control) y 20% a Juan Andrés (foco legal, seguridad y arquitectura).
- **Lenguaje Corporal Firme y Empático:** Brazos abiertos, sin cruzar de brazos ni apoyarse en la mesa con desgano. Mostrar convicción en la tecnología desarrollada pero humildad operativa: *"Este sistema lo diseñamos escuchando lo que ustedes nos marcaron en el relevamiento"*.
- **Transición Fluida a la Demo en Vivo (Minuto 17):** No pedir permiso dubitativo; decir con seguridad: *"Voy a abrir el navegador para que lo veamos operar en vivo"*. La transición rápida al sistema funcional desarma cualquier escepticismo teórico.

### 4.2 Cierre Ejecutivo y Solicitud del Aval para la Semana 1
Al llegar al final de la Diapositiva 18, Fran debe ejecutar un cierre directo, claro y con orientación a la decisión:
> *"Alejandro, Vanesa, Juan: la plataforma no es una idea en desarrollo, es una realidad productiva que ya está funcionando en este momento. Lo que les propongo hoy no es firmar un contrato a ciegas, sino dar inicio a la* **Semana 1** *de despliegue: damos de alta su cuenta corporativa de OpenAI, montamos el entorno Cloud y la semana que viene capacitamos a Stefania para iniciar el piloto asistido con el Widget de Triage activo.*
> 
> *Si están de acuerdo, comenzamos hoy mismo. ¿Tienen alguna consulta final o damos inicio a la Semana 1?"*
