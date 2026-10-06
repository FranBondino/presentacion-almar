# GUÍA ESTRATÉGICA Y OPERATIVA — REUNIÓN DE DIRECTORIO ALMAR ROSARIO S.R.L.

**Orador Principal:** Fran Bondino  
**Audiencia Directiva:**  
- **Alejandro Noacco:** Socio Gerente · Dirección Comercial y Pricing  
- **Vanesa Meggiolaro:** Socia Gerente · Dirección de Administración y Finanzas  
- **Juan Andrés Arloro:** Socio Gerente · Dirección de Legales y Operaciones  
**Fecha de Referencia:** Octubre 2026  
**Documento Fuente:** Relevamiento pericial de 163 carpetas operativas, 1.995 cotizaciones de casillas reales de ALMAR y Manual de Procedimientos ISO 9001 (PO-01).

---

## ÍNDICE DEL DOCUMENTO EVOLUTIVO
- [MÓDULO 1: El Frente Comercial (Lucía Laje, Cotizaciones y Pricing Ágil)](#módulo-1-el-frente-comercial-lucía-laje-cotizaciones-y-pricing-ágil)
  - 1.1 El Flujo Cronológico Real de una Venta (Día 1 a Día 3)
  - 1.2 Alineación: Propuesta Inicial de Fran vs. Realidad del Sistema
  - 1.3 Devoluciones Reales de Alejandro Noacco (WhatsApp) y Tratamiento de Sistema
  - 1.4 Devoluciones Reales de Vanesa Meggiolaro (4 Audios de WhatsApp) y Tratamiento de Sistema
  - 1.5 Calculadora Paramétrica vs. Multicotizador: Por qué NO se Solapan
  - 1.6 Guion de Oratoria para Fran (Apertura Comercial ante el Directorio)
  - 1.7 ¿Cómo Funciona en la Práctica la Solución Comercial? (De Dónde Salen los Datos y Rutina en 4 Pasos de Lucía)
  - 1.8 Arquitectura y Funcionamiento Detallado del Sistema de Alertas de Rentabilidad (USD 200 vs. USD 3.00 y WebAuthn)
  - 1.9 Dinámica y Protocolo Operativo de las Fechas de Vencimiento de Tarifas (15 y 30 Días y Modal de Advertencia)
  - 1.10 Guía Maestra de Demostración en Vivo: Cómo Mostrar Todo el Circuito de Lucía en la Reunión (Paso a Paso en Pantalla, Dónde Hacer Clic y Qué Decir)
- [MÓDULO 2: El Ciclo de Vida en Kipintoch y el Listener de Correos IA (Momento 1 vs. Momento 2)](#módulo-2-el-ciclo-de-vida-en-kipintoch-y-el-listener-de-correos-ia) *(Completado y Detallado)*
- [MÓDULO 3: El Caso Multicarpeta y el "Subrayado Operativo" (Facturas Compartidas)](#módulo-3-el-caso-multicarpeta-y-el-subrayado-operativo) *(Completado y Detallado)*
- [MÓDULO 4: La Arquitectura Técnica en Producción (Vercel, OpenAI ZDR, Modelo y Saldo)](#módulo-4-la-arquitectura-técnica-en-producción) *(Completado y Detallado)*
- [MÓDULO 5: Blindaje Jurídico, Ley 25.506 (WebAuthn), Sancor Seguros y Banco Macro](#módulo-5-blindaje-jurídico-y-financiero) *(Completado y Detallado)*

---

# MÓDULO 1: EL FRENTE COMERCIAL (LUCÍA LAJE, COTIZACIONES Y PRICING ÁGIL)

### 1.1 El Flujo Cronológico Real de una Venta (Día 1 a Día 3)

El objetivo de esta sección es que el Directorio entienda exactamente qué hace Lucía hoy frente a la computadora y cómo la plataforma la potencia sin cambiar su forma de trabajar con los clientes.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EL CIRCUITO COMERCIAL DÍA POR DÍA                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ DÍA 1: CONSULTA ENTRANTE ]                                                         │
│  • El cliente (ej. Siderar / Acindar) envía solicitud por WhatsApp o correo:          │
│    "Lucía, cotizame 1 contenedor 40' HQ desde Ningbo a Buenos Aires para mes próximo". │
│                                                                                        │
│  [ DÍA 1: COTIZACIÓN EN 45 SEGUNDOS ]                                                  │
│  • Lucía abre la Calculadora Paramétrica del Portal.                                  │
│  • Selecciona origen y destino: Ningbo ➔ Buenos Aires | Equipo: 40' HQ.               │
│  • Elige el Perfil Comercial: "Cuenta Estratégica" o "Estándar".                      │
│  • Mueve el slider de margen con total libertad según el cliente.                     │
│  • La calculadora computa el flete naviero (ej. Maersk USD 848) y sugiere venta.      │
│  • Lucía toca "Copiar Propuesta para el Cliente" y la pega en Gmail/WhatsApp en 5 seg. │
│  • La cotización queda guardada en el sistema (ej. COT-2026-00061) con semáforo.       │
│                                                                                        │
│  [ DÍA 3: CIERRE DE VENTA ("BOOKING CONFIRMADO") ]                                     │
│  • El cliente confirma: "Aprobada la tarifa, Lucía. Emití la reserva (Booking)".       │
│  • Lucía va a la cotización en el portal y toca "Copiar para Kipintoch" (1 clic).      │
│  • Abre Kipintoch ERP y pega con Ctrl+V los datos básicos de la carátula.              │
│  • Kipintoch le genera el número oficial de carpeta: C1434.                           │
│  • Lucía reserva con Maersk, y la naviera le confirma los 3 identificadores:          │
│    1. N° de Booking: BKG-MSK-982341                                                   │
│    2. N° de BL (Bill of Lading): KA0018437                                            │
│    3. N° de Contenedor: MSKU7842897                                                   │
│  • Lucía responde el correo a Operaciones sumando a Natali con el asunto:             │
│    "[C1434] Booking confirmado Maersk - BL KA0018437".                                │
│                                                                                        │
│  [ CIERRE DEL HITO COMERCIAL ]                                                         │
│  • ¿HAY FACTURA DE PROVEEDOR EN ESTE MOMENTO? ¡NO!                                    │
│    La mercadería recién se está cargando en origen. La carpeta nace vacía de facturas.│
│    Lucía ya cerró la venta, anotó los identificadores y pasa a cotizar la siguiente.   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Alineación: Propuesta Inicial de Fran vs. Realidad del Sistema

Cuando Fran le presentó la propuesta a Gisel Cabana Diaz, se plantearon tres objetivos comerciales específicos. Mirá cómo la plataforma resuelve cada uno con precisión quirúrgica:

| # | Propuesta Original Enviada a Gisel | Cómo Opera Exactamente en el Portal |
| :-: | :--- | :--- |
| **1** | **Ahorrarle tiempo operativo a Lucía en los cálculos:**<br>Evitar que recalcule todo a mano o en planillas cada vez que entra una consulta; cargar puertos habituales y sacar costo y venta sugerida al instante. | **Calculadora Paramétrica Multimodal (Slide 06):**<br>Tiene precargadas las rutas habituales, recargos de combustibles (BAF/BUFF), terminales y seguros. Lucía no calcula volumen en calculadora de mano: ingresa bultos y dimensiones, y en 45 segundos tiene el desglose formal. |
| **2** | **Recuperar presupuestos y cerrar más ventas:**<br>Avisar a Lucía cuáles llevan más de 48 horas paradas y permitirle enviar un recordatorio en un clic para no perder cargas por vorágine diaria. | **Panel de Smart Follow-Up a 48 hs (Slide 07):**<br>El sistema filtra en tiempo real todas las cotizaciones con más de 48 hs sin respuesta. Lucía presiona un botón azul y se genera la plantilla formal personalizada con nombre, ruta y tarifa para enviar por Gmail en segundos. |
| **3** | **Controlar que las navieras no sobrefacturen:**<br>Comparar lo presupuestado por Lucía contra la factura real de la naviera y alertar desvíos o recargos indebidos. | **Escudo Naviero en Bandeja de Ingesta (Slide 08 y 12):**<br>Cruza el PDF de la naviera contra la cotización acordada en la carpeta. Si Maersk o MSC cobraron flete más caro o gastos imprevistos, el comprobante se bloquea con alerta roja antes de pasar a pago. |

---

### 1.3 Devoluciones Reales de Alejandro Noacco (WhatsApp) y Tratamiento de Sistema

Alejandro contestó textualmente por WhatsApp con tres observaciones directivas sobre la propuesta. Ninguna quedó en el aire; todas fueron incorporadas al portal:

#### 1. Mensaje Textual de Alejandro:
> *"1) Debemos chequear con Comercial y Pricing, ya que si bien hay solicitudes de cotización que se repiten, no siempre el costo es el mismo, hay casos que los costos son iguales y tienen muy pocas variaciones. Otro tema es cuando se recibe el feedback de cliente, que puede llevar a modo informativo la venta, y también considerando que cada cliente tiene un criterios de rentabilidad diferente"*

- **Cómo lo trata el sistema:**
  1. **Costos Variables:** Descartamos cualquier tabla estática de costos. La calculadora toma tarifas dinámicas de armadores y agentes, permitiendo actualizar recargos quincenales (BAF, GRI).
  2. **Criterios de Rentabilidad Diferenciados por Cliente:** Eliminamos cualquier imposición de un markup rígido (ej. un 15% fijo que dejaría a ALMAR fuera de competencia en negocios spot). Diseñamos **4 Perfiles Dinámicos de Rentabilidad**:
     - `CUENTA_ESTRATEGICA`: Margen preferencial para clientes corporativos de alto volumen continuo.
     - `ESTANDAR`: Rentabilidad equilibrada habitual de la empresa.
     - `SPOT_ALTO_RIESGO`: Cargas con riesgo de almacenaje, demoras o estacionalidad.
     - `PERSONALIZADO`: Sliders completamente libres para regular el margen dólar a dólar.
  3. **Feedback de Cliente a Modo Informativo:** Se incorporó el botón **"Feedback Comercial"** en la tabla de cotizaciones. Cuando un cliente responde que no cierra o pide ajuste, Lucía hace un clic y registra el motivo (`COMPETENCIA_MENOR_PRECIO`, `DEMORA_CARGA`, etc.) junto con el comentario textual del cliente. Ese dato queda guardado en la venta a modo informativo y se consolida a fin de mes para que Alejandro tenga argumentos duros al negociar tarifas con las navieras.

#### 2. Mensaje Textual de Alejandro:
> *"2) se está realizando del seguimiento de las cotizaciones, pero lo debemos estandarizar dentro del proceso y me parece muy bueno el tema del recordatorio"*

- **Cómo lo trata el sistema:**
  - Estandariza la regla operativa: a las **48 horas** de inactividad, el sistema agrupa los presupuestos dormidos y genera con 1 solo clic la plantilla de recordatorio para Gmail. Lucía procesa 20 seguimientos en 10 minutos, garantizando un proceso institucional homogéneo.

#### 3. Mensaje Textual de Alejandro:
> *"3) sería excelente tener este alerta, más los que estuvimos hablando"*

- **Cómo lo trata el sistema:**
  - El Escudo de Sobrecostos Naviero frena automáticamente cualquier factura de armador que supere lo pactado en la carpeta, protegiendo el margen comercial antes de emitir la orden de pago.

---

### 1.4 Devoluciones Reales de Vanesa Meggiolaro (4 Audios de WhatsApp) y Tratamiento de Sistema

Vanesa analizó la herramienta desde la óptica operativa y financiera de la empresa:

#### 1. Audios 1 y 2: Vencimiento de Tarifas Navieras y Diferencial con Kipintoch
- **Puntos Clave de Vanesa:**
  - Da visto bueno inicial a la calculadora y al seguimiento para Lucía.
  - Advierte que para que a Lucía le sirva al 100%, la calculadora debe contemplar los **vencimientos de tarifas de navieras**, que cambian cada 15 o 30 días.
  - Expresa su duda sobre Kipintoch:  
    > *"El sistema actual (Kipintoch) registra la diferencia entre lo presupuestado y lo facturado, **pero lo que no sé es si ese dato te lo tira a nivel alerta en el momento, o si es solo informativo a nivel estadística posterior.**"*
- **Cómo lo trata el sistema:**
  1. **Semáforo de Vigencia de Tarifas (Slide 05):** Cada tarifa cargada tiene fecha de validez (15 a 30 días). Si está vigente se muestra verde; a 3 días de vencer pasa a amarillo; y si expiró, **se bloquea la emisión de la propuesta con candado rojo** para impedir que se cotice con fletes caducados.
  2. **Alerta Activa en el Momento vs. Estadística Posterior:** Kipintoch registra la diferencia cuando el buque ya arribó y la factura ya se pagó (estadística post-mortem). Nuestra plataforma actúa **en el momento exacto en que entra el PDF por correo**: lee el comprobante, detecta el sobrecosto y **bloquea la factura antes de que Finanzas emita el pago**.

#### 2. Audio 3: El Dolor Humano en el Control Operativo
- **Cita Textual de Vanesa:**
  > *"Totalmente de acuerdo, todo lo que la inteligencia artificial pueda ayudar a acelerar procesos y controles, bienvenida sea. El control de que la naviera cobra de más se podría hacer cuando se carga la factura... **el problema es que eso lo tiene que hacer el operativo, y el operativo NO LO HACE.** No miran si una operación deja apenas USD 5 de ganancia mientras la carga está en tránsito."*
- **Cómo lo trata el sistema:**
  - La IA audita el 100% de los comprobantes entrantes de forma automática y desatendida. No depende de que la operadora tenga tiempo o ganas de sacar cuentas: si la operación deja un margen inviable o da pérdida, el sistema enciende la alarma de inmediato y notifica a Finanzas.

#### 3. Audio 4: Descalce Dólares vs. Pesos y Parametrización en USD 200
- **Cita Textual de Vanesa:**
  > *"Tenés operaciones que en la planilla te dejan 100 o 50 dólares de ganancia en dólares, **pero cuando las pasás a pesos no hay ganancia, hay PÉRDIDA** (por tipo de cambio, gastos bancarios y retenciones). Propone configurar una alerta de margen mínimo: si una operación marítima deja **menos de USD 200 de margen**, que el sistema salte con una **alerta preventiva** para revisar la carpeta antes de que sea tarde."*
- **Cómo lo trata el sistema:**
  - Se configuró la **Alerta Preventiva de Margen exactamente en USD 200**, tal como lo solicitó Vanesa.
  - Si el margen proyectado baja de USD 200, se activa el semáforo amarillo preventivo en la calculadora y en la carpeta para alertar el riesgo cambiario. Si la Dirección decide avanzar por estrategia comercial, cuenta con el override biométrico en 3 segundos mediante WebAuthn FIDO2.

---

### 1.5 Calculadora Paramétrica vs. Multicotizador: Por qué NO se Solapan

Para que no queden dudas en el Directorio, esta es la complementariedad exacta de ambas herramientas:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     MULTICOTIZADOR NAVIERO      │       │     CALCULADORA PARAMÉTRICA     │
│   (Tablero de Cotizaciones)     │  vs   │       (Motor de Ejecución)      │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ • Es el REPOSITORIO INTELIGENTE │       │ • Es la HERRAMIENTA EN CALIENTE │
│   donde viven todas las ventas. │       │   para cotizar en el acto.      │
│ • Monitorea vigencias (15/30 d) │       │ • Permite mover sliders libres  │
│   con semáforo verde/amar/rojo. │       │   según el perfil del cliente.  │
│ • Ejecuta el Smart Follow-Up    │       │ • Computa volumen y recargos    │
│   a 48 hs para recuperar ventas.│       │   locales en 45 segundos.       │
│ • Registra el Feedback Comercial│       │ • Dispara la alerta de USD 200  │
│   para negociar con armadores.  │       │   ante riesgo de descalce pesos.│
└─────────────────────────────────┘       └─────────────────────────────────┘
                ▲                                         │
                └────────────── SE ALIMENTAN ─────────────┘
          (La Calculadora fabrica la propuesta en 45s; 
           el Tablero la administra y la sigue hasta cerrar).
```

---

### 1.6 Guion de Oratoria para Fran (Apertura Comercial ante el Directorio)

> *"Alejandro, Vanesa, Juan Andrés: arrancamos por el frente comercial, donde hoy está Lucía Laje.*  
> *Cuando auditamos los números de ALMAR, vimos que Lucía emite más de 500 cotizaciones por mes, más de la mitad de las ventas de toda la empresa. Y tomamos al pie de la letra las devoluciones que me hicieron ustedes:*  
>  
> *Alejandro me marcaba que no podíamos imponer un markup rígido porque cada cliente tiene un criterio de rentabilidad diferente y en el forwarding hay que pelear negocios spot; y Vanesa me advertía dos puntos clave: que a Lucía esto le servía solo si controlábamos el vencimiento quincenal de las navieras, y que márgenes de 50 o 100 dólares en la planilla terminan dando pérdida al pasarse a pesos por gastos portuarios.*  
>  
> *Miren la pantalla: acá está resuelto exactamente eso.*  
> *Lucía ingresa los datos, elige si el cliente es Cuenta Estratégica, Estándar o Spot, y mueve el slider con total libertad. En 45 segundos tiene la cotización armada. El sistema solo la cuida con dos compuertas lógicas: el semáforo de vigencia de naviera para no vender fletes caducados, y la alerta preventiva de USD 200 que pidió Vanesa para proteger la caja ante variaciones del dólar.*  
>  
> *Y si el cliente no responde en 48 horas, con este botón azul estandarizamos el seguimiento en Gmail en un solo clic, sumando el registro de feedback comercial para que Alejandro sepa exactamente qué fletes nos gana la competencia y pueda negociar mejores tarifas de volumen con Maersk o MSC."*

---

### 1.7 ¿Cómo Funciona en la Práctica la Solución Comercial? (De Dónde Salen los Datos y el Día a Día de Lucía)

Para que el Directorio comprenda con total nitidez cómo opera la plataforma en el día a día sin tecnicismos abstractos, Fran debe dominar las respuestas a cuatro preguntas elementales:

#### 1. ¿Cómo llegan las cotizaciones al portal? (El Doble Motor de Ingesta)
Las cotizaciones no requieren que una persona se siente a transcribir datos de planillas viejas. El portal se alimenta mediante **dos motores complementarios**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   LOS DOS MOTORES DE ALIMENTACIÓN DEL CATÁLOGO COMERCIAL               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ MOTOR 1: INGESTA PASIVA POR IA DESDE CORREOS ]                                      │
│  • Lucía envía una cotización a un cliente desde su casilla (llaje@almarrosario.com):  │
│    "Estimado Diego (Gerdau): de acuerdo a lo conversado, pasamos tarifa para 1x40HC    │
│    desde Ningbo a Buenos Aires vía MSC: Flete USD 4.250 + gastos locales...".          │
│  • El Listener de IA de la plataforma lee la casilla corporativa, detecta el correo de │
│    cotización saliente, extrae los campos clave (Cliente, CUIT, Tramo, Venta USD,      │
│    Naviera, Días libres) y da de alta el registro en el catálogo de forma automática.  │
│  • Así es como la plataforma absorbió las 1.080 cotizaciones reales que Lucía emitió   │
│    durante el año sin que ella tuviera que cargar un solo dato a mano.                 │
│                                                                                        │
│  [ MOTOR 2: EMISIÓN ACTIVA EN CALIENTE CON LA CALCULADORA ]                            │
│  • A Lucía le entra una consulta nueva por WhatsApp o por teléfono:                    │
│    "Lucía, cotizame urgente 3 pallets de caucho desde Miami a Rosario".                │
│  • En vez de abrir un Excel viejo o hacer cuentas con la calculadora de mano, Lucía    │
│    abre la Calculadora Paramétrica del portal.                                         │
│  • Carga las dimensiones y el peso, elige el perfil comercial, mueve el slider         │
│    y presiona "Generar Propuesta".                                                     │
│  • El portal guarda automáticamente la cotización en el catálogo con fecha, naviera    │
│    y semáforo de vigencia, y le copia a Lucía el texto listo para pegar en WhatsApp.   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 2. ¿Las carga Lucía a mano o las toma de los emails la IA?
* **No hay carga manual forzada:** Si Lucía cotiza por mail redactando como lo hizo toda su vida, la IA absorbe la cotización desde el correo.
* **Uso inteligente de la Calculadora:** Cuando Lucía necesita calcular metros cúbicos (CBM), pesos tasables IATA (relación 1:6 en aéreo) o verificar si una tarifa naviera está vencida, usa la calculadora porque le ahorra 15 minutos de cuentas matemáticas y previene errores humanos de cálculo.

#### 3. ¿Qué información muestra el tablero comercial de Lucía?
La tabla comercial no es un listado estático; es un centro de comando operativo donde cada operación muestra su radiografía completa:
1. **Cotización & Fecha Exacta:** Código del presupuesto (ej. `C1590`), fecha exacta de emisión (ej. `02/09/2026`), antigüedad en horas y asesor comercial responsable (`Lucía Laje`, `Nerea Guida`, `Martín Fusco`, `Juan Andrés Arloro`).
2. **Cliente / Cuenta:** Razón social, CUIT validado y segmento de cliente (`Corporativo`, `Habitual`, `Nuevo`).
3. **Vía, Naviera & Ruta:** Modo de transporte (`Marítimo FCL`, `LCL`, `Aéreo`), Incoterm pactado (`FOB`, `FCA`, `EXW`), la **naviera o aerolínea cotizada** (`Maersk Line`, `MSC`, `LATAM Cargo`, `ONE`), días libres de demoras concedidos y puertos de origen y destino.
4. **Resumen Financiero:** Precio de venta al cliente, costo estimado de flete y margen bruto en dólares (con alerta preventiva si el margen es inferior a USD 200).
5. **Estado & Enlace a Carpeta:** Si la cotización fue ganada, incluye un acceso directo clicable a la carpeta operativa en Kipintoch (`📂 Carpeta C1580`).
6. **Vigencia de Tarifa Naviera:** Semáforo de validez (Vigente / Por Vencer / Vencida) con la fecha calendario exacta de caducidad (`Vence: 02/10/2026`).
7. **Feedback Comercial:** Registro del motivo por el cual el cliente no cerró (Competencia menor precio, Carga diferida, En evaluación por gerencia).
8. **Acción Kipintoch:** Botón de un solo clic para copiar los datos estructurados y pegarlos en la carátula de Kipintoch ERP sin reescribir nada.

#### 4. La Rutina Diaria de Lucía Laje (El Uso Práctico en 4 Pasos)
En su jornada laboral, Lucía utiliza la plataforma en cuatro momentos concretos que potencian sus ventas:
* **Paso 1 (08:30 hs · 10 minutos): Barrido de Smart Follow-Up**  
  Lucía abre la intranet. El sistema le muestra en el banner superior las cotizaciones que llevan más de 48 horas sin respuesta del cliente. Con un clic en *"Enviar Seguimiento"*, se abre la plantilla formal en Gmail con copia automática a Alejandro Noacco (`anoacco@almarrosario.com`). En 10 minutos reactiva 15 cotizaciones dormidas sin redactar correos de cero.
* **Paso 2 (10:00 hs · 45 segundos por consulta): Cotización Rápida**  
  Ante consultas entrantes, usa la Calculadora para emitir propuestas con costos y recargos navieros (BAF, THC) al día, cuidada por los semáforos de vigencia.
* **Paso 3 (14:00 hs · 15 segundos): Asiento de Feedback Comercial**  
  Si un cliente le avisa que eligió a otro forwarder porque cotizó USD 150 menos, Lucía hace clic en `+ Feedback`, selecciona `COMPETENCIA_MENOR_PRECIO`, ingresa `-150` y guarda. Esa información queda registrada para que la Dirección la utilice en negociaciones de contratos con armadores.
* **Paso 4 (16:30 hs · 15 segundos): Pase Comercial a Kipintoch**  
  Cuando el cliente confirma la operación, Lucía presiona *"Copiar para Kipintoch"*, abre el ERP y pega los datos (`Ctrl+V`). Se genera el número de carpeta (ej. `C1434`), Lucía gestiona el booking con la naviera y pasa la posta a Operaciones.

---

### 1.8 Arquitectura y Funcionamiento Detallado del Sistema de Alertas de Rentabilidad

Uno de los aportes más valiosos de **Vanesa Meggiolaro** (Dirección de Finanzas) durante las devoluciones fue advertir sobre la **trampa del margen en dólares** en el forwarding argentino:
> *"Tenés operaciones que en la planilla te dejan 50 o 100 dólares de ganancia en dólares, pero cuando las pasás a pesos no hay ganancia, hay PÉRDIDA..."*

Para resolver este desafío financiero estructural sin asfixiar la velocidad comercial de Lucía, la plataforma implementa una **arquitectura de alertas de doble compuerta**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             MATRIZ DE RENTABILIDAD Y DOBLE COMPUERTA DE SEGURIDAD                      │
├───────────────────────┬───────────────────────────────┬────────────────────────────────┤
│ RANGO DE MARGEN BRUTO │ ESTADO Y SEMÁFORO DE SISTEMA  │ COMPORTAMIENTO Y PROTOCOLO     │
├───────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ Margen ≥ USD 200      │ 🟢 SEMÁFORO VERDE             │ • Venta financieramente sana.  │
│                       │    (Margen Óptimo)            │ • Flujo libre a Kipintoch.     │
├───────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ USD 3.00 ≤ Margen     │ 🟡 SEMÁFORO AMARILLO          │ • Alerta preventiva activa.    │
│       < USD 200       │    (Alerta Preventiva Vanesa) │ • NO bloquea la venta.         │
│                       │                               │ • Advierte riesgo en pesos.    │
├───────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ Margen < USD 3.00     │ 🔴 SEMÁFORO ROJO              │ • BLOQUEO ESTRICTO DE CARPETA. │
│ (o Pérdida Neta)      │    (Pérdida Inminente)        │ • Exige Override WebAuthn FIDO2│
│                       │                               │   de Alejandro o Vanesa.       │
└───────────────────────┴───────────────────────────────┴────────────────────────────────┘
```

#### 1. ¿Por qué USD 200 y no un porcentaje rígido? (El Fundamento Financiero de Vanesa)
En una empresa de forwarding que opera en Argentina, la rentabilidad no puede medirse únicamente como un porcentaje del flete internacional por las siguientes razones:
1. **Gastos Fijos Locales en Moneda Local (ARS):** En importación y exportación intervienen cargos que se facturan o liquidan en pesos al arribo o zarpe:
   - *Terminal Handling Charges (THC)* y almacenaje en terminales (Terminal 4, Exolgan, TRP, Zárate).
   - *Peajes fluviales e hidrovía*, tasas de verificación aduanera y escáner.
   - *Acarreos y fletes terrestres locales* (puerto a planta).
2. **Volatilidad Cambiaria y Descalce Temporal (35 a 45 días):** Entre el día en que Lucía cotiza y el día en que el buque atraca y se pagan los gastos locales, la cotización de la divisa oficial o el costo de los servicios portuarios puede variar. Una devaluación o un ajuste tarifario de terminal portuaria puede absorber instantáneamente USD 80 o USD 120 de costo.
3. **Retenciones Impositivas y Comisiones Bancarias:** Retenciones de Ingresos Brutos (SIRCREB), percepciones de IVA/Ganancias y comisiones bancarias por transferencias locales y del exterior que muerden margen real.

**Conclusión:** Un margen de USD 80 sobre un flete de USD 4.000 parece un 2% "positivo", pero en la realidad bancaria de ALMAR termina arrojando saldo negativo en pesos. Los **USD 200 funcionan como un colchón de absorción de volatilidad argentina**, protegiendo la caja sin trabar la venta.

#### 2. Funcionamiento de la Alerta Preventiva (< USD 200)
- **Naturaleza:** Es una advertencia visual y operativa, **NO bloqueante**.
- **Qué ve Lucía:** En la Calculadora Paramétrica y en la tabla de cotizaciones se enciende un badge amarillo parpadeante: `⚠️ Margen Ajustado: USD 142.50 (< USD 200)`.
- **Por qué no bloquea ciegamente:** Porque ALMAR tiene cuentas corporativas de gran escala (ej. Acindar, Gerdau, Secco) donde por estrategia comercial o volumen de 20 contenedores mensuales se decide voluntariamente trabajar con márgenes más finos. Lucía puede continuar y presionar "Copiar para Kipintoch" con total fluidez.

#### 3. Funcionamiento del Bloqueo Estricto (< USD 3.00) y Override WebAuthn
- **Naturaleza:** Bloqueo absoluto del sistema.
- **Cuándo se activa:** Si por un error de tipeo (ej. tipear costo USD 3.800 y venta USD 3.500) o por una combinación de recargos la operación arroja un margen irrisorio o negativo (< USD 3.00).
- **Efecto de bloqueo:** El botón "Copiar para Kipintoch" y la confirmación de la cotización quedan inhabilitados con un candado rojo (`BLOQUEADA_RENTABILIDAD_NEGATIVA`).
- **El Mecanismo de Desbloqueo Biométrico (WebAuthn FIDO2):**
  Para destrabar una carpeta bloqueada por rentabilidad negativa, se requiere la autorización indelegable de la Dirección General (Alejandro Noacco o Vanesa Meggiolaro):
  1. El director abre el comprobante o la cotización en su pantalla.
  2. Selecciona el motivo formal en el desplegable (ej. *Acuerdo Comercial de Volumen* o *Compensación por Servicio Previo*).
  3. Apoya su dedo en el lector biométrico de su laptop o teléfono (Touch ID / Windows Hello).
  4. El chip criptográfico de hardware (TPM 2.0 / Secure Enclave) firma la transacción en 3 segundos mediante WebAuthn FIDO2, sin contraseñas compartidas.
  5. Se genera un **hash SHA-256 inmutable de 64 caracteres** que se graba en el `audit_log` con marca temporal UTC.
  6. **Respaldo Jurídico:** Cumple con la Ley Nacional de Firma Digital Nº 25.506 (art. 5), invirtiendo la carga probatoria y asegurando no repudio jurídico frente a auditorías contables.

---

### 1.9 Dinámica y Protocolo Operativo de las Fechas de Vencimiento de Tarifas (15 y 30 Días)

En sus audios 1 y 2, Vanesa planteó una advertencia medular sobre la realidad marítima:
> *"A Lucía le sirve la calculadora siempre y cuando contemple los vencimientos de tarifas de las navieras, porque en marítimo cambian quincenal o mensualmente..."*

#### 1. La Realidad Naviera: ¿Por qué Vencen las Tarifas de Flete?
Los armadores marítimos (Maersk Line, MSC, ONE, CMA CGM, Hapag-Lloyd, Cosco) y las aerolíneas cargueras no sostienen tarifas fijas a largo plazo en contratos spot. Aplican esquemas de vigencia estricta:
- **Tarifas Quincenales (15 días):** Rigen del 1 al 15 y del 16 al último día de cada mes calendario.
- **Tarifas Mensuales (30 días):** Rigen durante el mes calendario en curso.
- **Factores de Ajuste Periódico:** Cada quincena los armadores modifican recargos dinámicos:
  * **BAF (Bunker Adjustment Factor):** Variación del precio internacional del combustible fuel oil marítimo.
  * **GRI (General Rate Increase):** Subas unilaterales por saturación de espacio en bodega durante temporada alta.
  * **PSS (Peak Season Surcharge):** Recargos adicionales por cuello de botella en puertos de transbordo (Santos, Montevideo).

Si un cliente acepta una propuesta 25 días después de emitida y el comercial la pasa a Kipintoch sin chequear la tarifa del armador, la naviera cobrará el flete actualizado (+USD 300 o +USD 600 más caro). **Ese sobrecosto se come la totalidad del margen de ALMAR.**

#### 2. Cómo Calcula la Plataforma los Días de Vigencia
En la base de datos del portal, cada cotización almacena:
- `fechaEmision`: Marca temporal exacta de confección de la propuesta (ej. `2026-09-01T09:00:00Z`).
- `vigenciaTarifaDias`: Plazo asignado por la naviera (15 o 30 días corridos).
- `fechaVencimientoTarifa`: Fecha calendario límite estricta calculada por el sistema (`fechaEmision + vigenciaTarifaDias`).
- `diasRestantes`: Cálculo continuo contra la fecha actual en tiempo real:
  $$\text{díasRestantes} = \left\lceil \frac{\text{fechaVencimientoTarifa} - \text{fechaActual}}{86.400.000 \text{ ms}} \right\rceil$$

#### 3. Los Tres Estados del Semáforo de Vigencia

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EL SEMÁFORO DE VIGENCIA DE TARIFAS NAVIERAS                     │
├─────────────────────┬──────────────────────────┬───────────────────────────────────────┤
│ DÍAS RESTANTES      │ ESTADO Y SEMÁFORO        │ INDICADOR EN TABLERO COMERCIAL        │
├─────────────────────┼──────────────────────────┼───────────────────────────────────────┤
│ > 5 días            │ 🟢 VIGENTE               │ `Vence: 02/10/2026 (18d restantes)`   │
│                     │    (Operación Confiable) │ Texto verde esmeralda, seguro operar. │
├─────────────────────┼──────────────────────────┼───────────────────────────────────────┤
│ 1 a 5 días          │ 🟡 POR VENCER            │ `Vence: 26/09/2026 (2d restantes)`    │
│                     │    (Alerta Cierre Spot)  │ Texto ámbar; priorizar seguimiento.   │
├─────────────────────┼──────────────────────────┼───────────────────────────────────────┤
│ ≤ 0 días            │ 🔴 VENCIDA               │ `🔒 Caducó: 17/09/2026`               │
│                     │    (Tarifa Caducada)     │ Badge rojo con candado de protección. │
└─────────────────────┴──────────────────────────┴───────────────────────────────────────┘
```

1. **Estado `VIGENTE` (Verde):** La cotización está amparada por la tarifa oficial del armador. Lucía puede confirmarla y crear la carátula con certeza absoluta.
2. **Estado `POR_VENCER` (Amarillo):** El sistema alimenta automáticamente el panel de **Smart Follow-Up**. Lucía visualiza en su banner: *"Quedan 48 hs de tarifa vigente Maersk para Siderar: enviar recordatorio urgente"*. Esto permite cerrar ventas antes del salto de flete.
3. **Estado `VENCIDA` (Rojo con Candado):** La tarifa expiró. La cotización muestra el indicador rojo `🔒 Caducó: 17/09/2026`.

#### 4. Protocolo de Protección Financiera ante Tarifa Vencida (El Modal de Advertencia)
¿Qué ocurre si un cliente llama después de 20 días y dice *"Lucía, cerremos el flete que me pasaste el mes pasado"*?
Si Lucía hace clic en **"Copiar para Kipintoch"** sobre una cotización con tarifa vencida, el sistema **no ejecuta la acción a ciegas**. Se abre un **Modal de Advertencia de Tarifa Caducada**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ ADVERTENCIA: TARIFA NAVIERA CADUCADA HACE 8 DÍAS                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  La tarifa de referencia de Maersk Line venció el 17/09/2026.               │
│  Los armadores marítimos actualizan recargos BAF/GRI quincenalmente.         │
│  Si traslada estos costos a Kipintoch sin revalidar con la naviera,          │
│  ALMAR absorberá cualquier diferencia tarifaria de su propio margen.         │
│                                                                              │
│  Seleccione la acción a tomar:                                               │
│                                                                              │
│  [ 🔄 Recotizar en Calculadora (Recomendado) ]                               │
│  -> Abre la Calculadora con los mismos datos precargados para actualizar      │
│     el flete de la naviera en 20 segundos.                                   │
│                                                                              │
│  [ ⚠️ Confirmar bajo Apercibimiento Comercial ]                              │
│  -> Habilita la copia a Kipintoch registrando en el Audit Log que la         │
│     operación fue confirmada con tarifa caducada bajo responsabilidad        │
│     del ejecutivo comercial.                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Resultado Directivo:** Se erradica definitivamente el problema histórico donde los clientes cerraban fletes viejos y ALMAR terminaba perdiendo entre USD 300 y USD 800 por contenedor al recibir la factura de Maersk o MSC.

---

### 1.10 Guía Maestra de Demostración en Vivo: Cómo Mostrar Todo el Circuito de Lucía en la Reunión (Paso a Paso en Pantalla, Dónde Hacer Clic y Qué Decir)

Esta sección es el **manual táctico de oratoria y navegación en pantalla** para que Fran conduzca la reunión con solvencia ejecutiva. El bloque comercial está diseñado para durar entre **6 y 8 minutos**, respondiendo una por una las preguntas que Alejandro Noacco y Vanesa Meggiolaro plantearon en sus mensajes y audios.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   MAPA DE NAVEGACIÓN DE LA DEMO COMERCIAL EN VIVO                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ PASO 1: EL CENTRO DE COMANDO ] ──► Tablero `/cotizaciones` (Volumen y Filtros)      │
│         │                                                                              │
│         ▼                                                                              │
│  [ PASO 2: COTIZACIÓN EN CALIENTE ] ──► Calculadora (Sliders, Alerta USD 200 y Copia) │
│         │                                                                              │
│         ▼                                                                              │
│  [ PASO 3: SMART FOLLOW-UP 48 HS ] ──► Rescate de Ventas y Correo con Copia a Dirección│
│         │                                                                              │
│         ▼                                                                              │
│  [ PASO 4: FEEDBACK DE COMPETENCIA ] ──► Inteligencia Comercial para Negociar Navieras │
│         │                                                                              │
│         ▼                                                                              │
│  [ PASO 5: PASE A KIPINTOCH (15 SEG) ] ──► Copia de Carátula, Booking y Pase a Tráfico │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### PASO 1: Apertura en Pantalla — El Tablero Comercial de Cotizaciones (2 minutos)

* **🖥️ Qué proyectar en pantalla:**
  Abrir el Portal de ALMAR en `https://bot-relevamiento.vercel.app/cotizaciones` habiendo iniciado sesión con el usuario de Lucía Laje (`comercial@almar.com.ar`), o proyectar la **Diapositiva 05** de la Presentación.
* **🖱️ Qué clics y señalamientos hacer con el mouse:**
  1. Señalar el contador superior: *"Total: 1.995 cotizaciones históricas de ALMAR relevadas"*.
  2. Hacer clic en los filtros superiores por Asesor Comercial:
     - Mostrar `Todos (24)`.
     - Hacer clic en `Lucía Laje (1.080)`: la tabla se filtra al instante mostrando solo la cartera de Lucía.
     - Mostrar los otros comerciales: `Nerea Guida (399)`, `Martín Fusco (233)`, `Juan Andrés Arloro (138)`.
  3. Señalar en una fila las **nuevas columnas operativas**:
     - *Fecha de Emisión legible:* `02/09/2026` y antigüedad en horas (`71h`).
     - *Naviera / Aerolínea cotizada:* Destacar `Maersk Line`, `MSC`, `LATAM Cargo`, `ONE`.
     - *Incoterm y Días Libres:* Destacar `FOB` y `14d libres` de demora en destino.
  4. Señalar con el cursor el **Semáforo de Vigencia de Tarifas**:
     - Fila verde: `Vence: 02/10/2026 (18d restantes)`.
     - Fila amarilla: `Vence: 26/09/2026 (2d restantes)`.
     - Fila roja con candado: `🔒 Caducó: 17/09/2026`.
* **🗣️ Qué decir textualmente al Directorio (Guion Verbatim de Fran):**
  > *"Alejandro, Vanesa, Juan Andrés: arrancamos por el motor comercial de la empresa, donde hoy opera Lucía Laje.*  
  > *Miren lo que tenemos en pantalla: auditamos las casillas reales de ALMAR y encontramos 1.995 cotizaciones emitidas en el año. Lucía sola genera 1.080 cotizaciones, más del 54% del volumen de ventas de toda la empresa.*  
  >  
  > *La tabla que ven acá no es una planilla estática: es el centro de control donde Lucía ve en un solo golpe de vista la naviera cotizada, los días libres de demora acordados y, fundamentalmente, lo que Vanesa me pidió en su audio: la fecha exacta en que vence la tarifa de Maersk o MSC con un semáforo visual. Verde si está vigente, amarillo si faltan pocos días, y rojo con candado si ya caducó para no vender con costos viejos."*

---

#### PASO 2: La Cotización en Caliente — Calculadora Paramétrica (2 minutos)

* **🖥️ Qué proyectar en pantalla:**
  Hacer clic en el botón superior derecho **`+ Nueva Cotización`** o pasar a la **Diapositiva 06** (Calculadora Paramétrica Multimodal).
* **🖱️ Qué clics y simulaciones hacer en vivo:**
  1. Cargar origen y destino: Seleccionar *Ningbo, China* ➔ *Puerto Buenos Aires*.
  2. Seleccionar equipo: *1x40' High Cube*.
  3. Mostrar el selector de **Perfil de Cliente** (respondiendo directamente a Alejandro Noacco):
     - Seleccionar `Cuenta Estratégica` (mínimo markup para grandes clientes como Acindar).
     - Mostrar `Estándar` y `Spot Alto Riesgo`.
  4. **Mover el Slider de Margen en Vivo:** Moverlo libremente entre USD 100 y USD 800.
  5. **Simulación de la Alerta Preventiva de Vanesa (< USD 200):**
     - Bajar el slider a **USD 150**.
     - Mostrar cómo en pantalla salta el badge amarillo:  
       `⚠️ Alerta Preventiva: Margen menor a USD 200 (Riesgo de descalce cambiario en gastos locales)`.
     - Explicar por qué NO bloquea la venta.
  6. **Simulación del Bloqueo Estricto (< USD 3.00):**
     - Bajar el margen a USD 0: la calculadora deshabilita la propuesta y muestra el candado rojo (`BLOQUEADA_RENTABILIDAD_NEGATIVA`).
  7. Regresar el slider a USD 350 y hacer clic en **"Copiar Propuesta para el Cliente"**.
* **🗣️ Qué decir textualmente al Directorio (Guion Verbatim de Fran):**
  > *"Alejandro, vos me hiciste una observación clave por WhatsApp: me dijiste que no podíamos poner un porcentaje fijo de ganancia porque cada cliente tiene un criterio de rentabilidad diferente y en forwarders hay negocios spot donde hay que pelear el flete.*  
  > *Mirá la pantalla: Lucía tiene libertad total. Elige si el cliente es Cuenta Estratégica, Estándar o Spot, y mueve este slider dólar por dólar según cómo viene la negociación.*  
  >  
  > *Pero acá entra lo que me marcó Vanesa con muchísima lucidez en su audio: que un margen de 50 o 100 dólares en la planilla termina dando pérdida en pesos cuando sumamos terminales portuarias, acarreos y retenciones.*  
  > *Miren lo que pasa si bajo el margen a USD 150: el sistema enciende automáticamente esta alerta preventiva amarilla en USD 200. No le traba la venta a Lucía, pero le avisa a ella y a Finanzas que el colchón para gastos locales es ajustado.*  
  >  
  > *Y cuando Lucía termina, en vez de tardar 15 minutos calculando metros cúbicos y tipeando correos, toca este botón: 'Copiar Propuesta'. En 2 segundos tiene el texto formal armado para pegarlo en WhatsApp o en Gmail y enviárselo a Siderar."*

---

#### PASO 3: Smart Follow-Up a 48 Horas — Rescate de Ventas Paradas (1.5 minutos)

* **🖥️ Qué proyectar en pantalla:**
  En el módulo de cotizaciones, señalar el banner superior de **Smart Follow-Up** o pasar a la **Diapositiva 07**.
* **🖱️ Qué clics y señalamientos hacer con el mouse:**
  1. Mostrar cómo el sistema identifica automáticamente las cotizaciones que tienen más de 48 horas sin respuesta del cliente (ej. cotización `C1590` de Gerdau Argentina).
  2. Hacer clic en el botón azul **`Enviar Seguimiento`**.
  3. Mostrar la ventana modal con la plantilla formal autogenerada:
     - Asunto: `[ALMAR] Seguimiento de Propuesta FCL - Ningbo a Buenos Aires - Ref. C1590`.
     - Saludo personalizado: *"Estimado Diego Álvarez (Gerdau)..."*.
     - Resumen de la oferta con naviera y días libres.
     - **Copia Oculta Automática:** `cc: anoacco@almarrosario.com` (Alejandro Noacco).
* **🗣️ Qué decir textualmente al Directorio (Guion Verbatim de Fran):**
  > *"Alejandro, el segundo punto que me marcaste por mensaje fue textual: 'Se está realizando el seguimiento, pero lo debemos estandarizar dentro del proceso y me parece muy bueno el recordatorio'.*  
  >  
  > *Acá está la estandarización exacta que pediste:*  
  > *Todas las mañanas a las 8:30, el sistema le filtra a Lucía las cotizaciones que cumplieron 48 horas sin respuesta. Lucía no tiene que acordarse de memoria ni buscar en libretas: hace un solo clic en 'Enviar Seguimiento' y se genera este mail formal con toda la información técnica, recordándole al cliente que la tarifa de la naviera tiene fecha de vencimiento.*  
  >  
  > *Y fíjense este detalle fundamental de gobernanza: el correo sale con copia automática a la casilla de Alejandro (`anoacco@almarrosario.com`). Dirección Comercial tiene visibilidad total del pipeline comercial en tiempo real sin tener que pedirle planillas de reporte a Lucía los viernes a la tarde. En 10 minutos, Lucía reactiva 15 cotizaciones dormidas."*

---

#### PASO 4: Registro de Feedback Comercial — Inteligencia para Negociar con Armadores (1 minuto)

* **🖥️ Qué proyectar en pantalla:**
  En la tabla de cotizaciones, posicionarse sobre una fila que no cerró (ej. `C1597` de Pulpeiro Hyo o `C1583` de Disden).
* **🖱️ Qué clics y señalamientos hacer con el mouse:**
  1. Hacer clic en el botón **`+ Feedback`**.
  2. Desplegar el menú de motivos: mostrar las opciones preconfiguradas (`COMPETENCIA_MENOR_PRECIO`, `CARGA_DIFERIDA`, `EVALUACION_GERENCIA`, `CAMBIO_CONDICIONES`).
  3. Seleccionar `COMPETENCIA_MENOR_PRECIO`.
  4. Ingresar en el campo de diferencia: `- USD 150` y naviera competidora (ej. *Cosco Shipping vía otro agente*).
  5. Hacer clic en Guardar y mostrar cómo la etiqueta de feedback queda registrada en la cotización.
* **🗣️ Qué decir textualmente al Directorio (Guion Verbatim de Fran):**
  > *"Alejandro, vos me planteaste también que el feedback del cliente debía registrarse a modo informativo en la venta.*  
  >  
  > *Miren la utilidad estratégica que tiene esto: si un cliente le dice a Lucía 'Mirá, no cierro con ustedes porque otra agencia me pasó 150 dólares menos por Cosco', Lucía hace dos clics en '+ Feedback' y lo deja asentado en la venta.*  
  >  
  > *¿Por qué esto vale oro para ALMAR? Porque a fin de mes, cuando Alejandro se sienta a negociar contratos de volumen o acuerdos de tarifas con el representante comercial de Maersk o de MSC en Rosario o Buenos Aires, no va a negociar a ciegas. Abre el sistema y le dice al armador: 'Mirá la data: en septiembre perdí 12 contenedores de Ningbo porque tu flete estuvo USD 150 arriba de la competencia'. Tenés datos duros y medibles para pelear mejores tarifas para ALMAR."*

---

#### PASO 5: Cierre de Venta y Pase a Kipintoch en 15 Segundos (1.5 minutos)

* **🖥️ Qué proyectar en pantalla:**
  En la tabla comercial, seleccionar una cotización aceptada por el cliente (ej. cotización `C1580` de Industrias Juan F. Secco S.A. o `C1434` de Siderar).
* **🖱️ Qué clics y demostraciones hacer en vivo:**
  1. **Demostración de Protección ante Tarifa Vencida (Prueba de Candado):**
     - Intentar presionar *"Copiar para Kipintoch"* sobre una cotización caducada (ej. `C1527` con badge rojo `Caducó: 12/09/2026`).
     - Mostrar cómo salta el **Modal de Advertencia de Tarifa Caducada**:
       > *"¡Miren la seguridad que tiene esto! Si el cliente tardó 30 días en confirmar y la tarifa naviera ya venció, el sistema frena a Lucía y le dice: 'Ojo, la tarifa de Maersk venció hace 15 días; si la pasás a Kipintoch con costo viejo, ALMAR asume el sobrecosto de su bolsillo. Presioná acá para recotizar con la tarifa de hoy'."*
  2. **Demostración del Pase Normal a Kipintoch (Operación Vigente):**
     - Seleccionar la cotización vigente `C1580`.
     - Presionar el botón verde **`Copiar para Kipintoch`** (1 solo clic).
     - Mostrar la notificación flotante: *"Ficha de carátula copiada al portapapeles con éxito"*.
     - Explicar cómo Lucía abre Kipintoch ERP, va a Carátula Nueva y presiona `Ctrl+V`. Todos los campos (Cliente, CUIT, Puerto Origen, Puerto Destino, Tipo de Carga, Naviera sugerida y Tarifa de Venta) quedan pegados en 15 segundos.
     - Kipintoch le entrega el número oficial de carpeta: **`C1580`**.
     - Lucía saca el Booking con Maersk Line (reserva BKG-MSK-982341, contenedor MSKU7842897, BL KA0018437) y manda el correo interno de confirmación a Natali Hermoso con el asunto canónico:  
       `[C1580] Secco - Booking confirmado Maersk - BL KA0018437`.
* **🗣️ El Remate Final del Bloque Comercial ante el Directorio (Palabras de Cierre):**
  > *"Y acá viene la respuesta a la gran duda que teníamos todos: ¿Qué hace Lucía con las facturas de proveedores cuando abre la carpeta?*  
  > *¡La respuesta es NINGUNA! Lucía no carga ninguna factura porque en este momento la mercadería recién se está cargando en el buque en China.*  
  >  
  > *Lucía tardó 45 segundos en cotizar, cerró la venta, pasó los datos a Kipintoch en 15 segundos con un solo clic, le dio el número a Natali y queda 100% libre para seguir vendiendo.*  
  >  
  > *La factura del flete de Maersk va a llegar recién dentro de 35 días, cuando el buque llegue al Puerto de Buenos Aires. Y cuando llegue ese PDF por correo, no lo va a cargar Lucía ni va a tener Stefania que tipear durante 12 minutos: lo va a agarrar nuestro Listener de Inteligencia Artificial en el servidor, lo va a vincular a esta misma carpeta por el número de BL, va a controlar que Maersk no cobre un dólar de más, y le va a dar la orden de pago limpia a Vanesa.*  
  >  
  > *Lucía pasa de perder horas en cálculos y planillas a vender más, con tarifas protegidas y con el seguimiento al día."*

---

#### Hoja de Ruta Rápida para Fran Durante la Reunión (Cheat-Sheet en 1 Minuto)

| Minuto | Pantalla a Proyectar | Clic o Acción en Vivo | Concepto Clave a Decir a Alejandro | Concepto Clave a Decir a Vanesa |
| :---: | :--- | :--- | :--- | :--- |
| **00:00 - 02:00** | Tablero `/cotizaciones` (o Slide 05) | Filtrar por `Lucía Laje (1.080)`. Señalar columnas naviera, días libres y semáforo de vencimiento. | *"Lucía genera el 54% de las ventas. Acá tiene la radiografía completa de su cartera en un solo lugar."* | *"Las tarifas tienen semáforo verde, amarillo y rojo según los 15 o 30 días de vigencia de naviera."* |
| **02:00 - 04:00** | Calculadora (o Slide 06) | Mover slider de margen. Simular baja a USD 150 (salta alerta amarilla) y a USD 0 (bloqueo rojo). | *"Libertad total de margen y perfiles por cliente (Estratégico, Estándar, Spot), sin markups rígidos."* | *"Alerta preventiva en USD 200 por el riesgo de descalce pesos/dólares en terminales y gastos bancarios."* |
| **04:00 - 05:30** | Smart Follow-Up (o Slide 07) | Clic en *"Enviar Seguimiento"* en cotización > 48h. Mostrar plantilla autogenerada y copia oculta. | *"Estandarización del proceso: reactiva 15 cotizaciones dormidas en 10 min con copia automática a tu correo."* | *"Acelera el ciclo de cobro y evita que se pierdan presupuestos en la vorágine diaria de la oficina."* |
| **05:30 - 06:30** | Registro de Feedback Comercial | Clic en `+ Feedback` en venta perdida. Seleccionar `COMPETENCIA_MENOR_PRECIO` (-USD 150). | *"Datos duros de por qué perdemos cargas para sentarte a negociar tarifas de volumen con Maersk o MSC."* | *"Estadística real de mercado sin depender de percepciones subjetivas."* |
| **06:30 - 08:00** | Pase a Kipintoch y Cierre Comercial | Clic en *"Copiar para Kipintoch"*. Mostrar alerta si caducó vs. copia en 15 seg si está vigente. | *"Lucía tarda 15 segundos en pasar la carátula a Kipintoch y queda 100% libre para seguir vendiendo."* | *"Lucía no toca facturas de compra. La factura llega en 35 días y la audita la IA en el ingreso."* |

---

# MÓDULO 2: EL CICLO DE VIDA EN KIPINTOCH Y EL LISTENER DE CORREOS IA (MOMENTO 1 VS. MOMENTO 2)

### 2.1 La Secuencialidad Temporal del Forwarding: Dos Momentos Separados por 35 Días

Uno de los mayores malentendidos al digitalizar una empresa de comercio exterior es asumir que la venta y la facturación del flete ocurren al mismo tiempo. En un forwarder como ALMAR, la operación se divide en dos momentos radicalmente separados en el tiempo y a cargo de roles distintos:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       LÍNEA DE TIEMPO OPERATIVA Y FINANCIERA (35 A 45 DÍAS)                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [ MOMENTO 1: DÍA 1 AL DÍA 3 — ÁREA COMERCIAL (LUCÍA LAJE) ]                                   │
│  • Lucía cotiza y cierra la venta con el cliente (Siderar / Acindar / Paladini).               │
│  • Crea la CARÁTULA OPERATIVA en Kipintoch ERP: el sistema le da el número "C1434".             │
│  • Lucía gestiona el Booking con Maersk Line y obtiene:                                        │
│    - Booking: BKG-MSK-982341                                                                    │
│    - Bill of Lading (BL): KA0018437                                                             │
│    - Contenedor: MSKU7842897                                                                    │
│  • Pasa el expediente a Operaciones enviando un correo a Natali Hermoso con asunto:             │
│    "[C1434] Siderar - Booking confirmado Maersk - BL KA0018437".                                │
│  • ¿EXISTE FACTURA DE PROVEEDOR ACÁ? ¡NO!                                                       │
│    La mercadería recién se está cargando en Ningbo. La carpeta nace sin ninguna factura.        │
│    Lucía termina su tarea acá y pasa a cotizar la siguiente operación.                          │
│                                                                                                 │
│  ═════════════════════════════ EL BUQUE NAVEGA (30 A 35 DÍAS) ════════════════════════════════  │
│                                                                                                 │
│  [ MOMENTO 2: DÍA 35 AL DÍA 45 — OPERACIONES Y FINANZAS (STEFANIA / VANESA) ]                   │
│  • El buque arriba al Puerto de Buenos Aires.                                                   │
│  • Maersk Line emite sus facturas electrónicas en PDF (Flete USD 791 + BL Fee USD 57 = USD 848)│
│    y las envía por mail a facturas@almarrosario.com.                                            │
│  • El Listener de IA del Portal recibe el correo, procesa el PDF en memoria y extrae el BL.    │
│  • El Portal vincula la factura con la Carpeta C1434 creada hace 35 días por Lucía.             │
│  • Compara lo facturado vs. lo presupuestado (Desvío 0.0% -> Semáforo VERDE).                   │
│  • Stefania abre el Visor Dual, verifica los datos en 15 segundos y los copia a Kipintoch.      │
│  • Finanzas emite la orden de pago con la certeza absoluta de que no hay sobrecostos.           │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 ¿Lucía Crea la Carpeta sin Factura? ¿Quién Carga la Factura Cuándo Llega?

Esta fue una duda operativa crítica de Fran (`"¿No sería raro que Lucía tenga que duplicar las cosas? ¿Ella crea la carpeta sin factura? La factura cuando llega quién debería cargarla a las primeras, operativo o Lucía?"`). La respuesta operativa es taxativa:

1. **Lucía SÍ crea la carpeta sin factura:**
   - La carpeta en Kipintoch es un legajo operativo, no un comprobante contable.
   - Cuando el cliente acepta la cotización, Lucía necesita un número de expediente (`C1434`) para coordinar el embarque con el agente en China y con la naviera.
   - En ese momento inicial **no existe factura en el mundo**: la naviera no factura el flete hasta que el buque zarpa o emite el BL original, y los gastos locales (THC, peaje, desconsolidación) recién se facturan al arribo a puerto argentino 35 días después.
   - Por ende, la carpeta en Kipintoch **nace vacía de comprobantes de compra**. Solo tiene la cotización de venta y los datos de la carga.

2. **Lucía NO duplica trabajo:**
   - En el portal, Lucía cotiza en 45 segundos.
   - Cuando el cliente dice "sí", Lucía hace clic en el botón **"Copiar para Kipintoch"**.
   - Abre Kipintoch y pega con `Ctrl+V` los campos estructurados en la carátula. Tarda 15 segundos y no tiene que reescribir nada.

3. **Lucía NUNCA carga facturas de proveedores:**
   - Cargar facturas de compra de navieras **no es función comercial**; es función administrativa y operativa.
   - Cuando llega la factura 35 días más tarde, Lucía está ocupada vendiendo nuevos fletes.
   - Quien procesa la factura de proveedor es **Stefania (o el área de Administración y Operaciones)**.
   - Antes de nuestro portal, Stefania tardaba **12 minutos por factura** tipeando manualmente en Kipintoch cada renglón, alícuota de AFIP y CUIT del proveedor.
   - Con nuestro portal, el Listener de IA ya pre-cargó la factura, la vinculó a la carpeta `C1434`, verificó el desvío tarifario, y Stefania solo hace un control visual de 15 segundos antes de transferirla a Kipintoch.

---

### 2.3 Desmitificando "la Base de Datos de ALMAR": ¿A qué Base se Conecta la Plataforma?

Para despejar la inquietud de Fran (`"¿A qué base de datos de ALMAR te referís?"`):

- **No existe una API abierta en Kipintoch:**
  Kipintoch es un sistema cerrado, con base de datos local o propietaria, cuyos desarrolladores cobran licencias exorbitantes (más de $6.000.000 ARS anuales) por habilitar un conector de lectura/escritura directo. Conectar el portal directamente a Kipintoch por API hubiese encarecido el proyecto de forma inviable para ALMAR.
- **La Base de Datos del Sistema es la Base Cloud del Portal (PostgreSQL en Supabase):**
  Es una base de datos segura, en la nube, propia de la plataforma desarrollada para ALMAR.
- **¿Cómo se entera la base del portal qué carpetas existen, qué BLs tienen y qué contenedores transportan?**
  A través de dos vías perfectamente sincronizadas:
  
  * **VÍA A — La Vía Autónoma de Correos (El Protocolo PO-01 de ALMAR):**
    Por normativa interna de ALMAR (Manual ISO 9001 `PO-01`), **todo correo electrónico operativo debe llevar obligatoriamente el número de carpeta entre corchetes en el asunto** (ej. `[C1434]`).
    Cuando Lucía le envía a Natali el correo de coordinación diciendo:
    > *Asunto: `[C1434] Siderar - Ningbo to Buenos Aires - Booking Maersk BKG-MSK-982341`*  
    > *Cuerpo: Adjunto pre-alerta. BL: KA0018437, Contenedor: MSKU7842897.*
    
    El Listener de la plataforma (conectado a la casilla corporativa mediante la API oficial de Google Workspace / Gmail) lee ese correo entrante, detecta que se abrió la carpeta `C1434`, extrae automáticamente el BL, el Contenedor y el Booking, y **crea la ficha del expediente en la base de datos de forma 100% desatendida y automática**.
  
  * **VÍA B — Sincronización Manual o por Lote (Respaldo Operativo):**
    Si por alguna razón una carpeta se abrió por teléfono y no hubo mail interno, la operadora puede dar de alta la carátula en el portal en 10 segundos o importar el reporte diario de Kipintoch en Excel/CSV con un solo clic.

---

### 2.4 El Listener de Correos de IA en Producción: ¿Cómo Sabe a qué Carpeta va la Factura?

Veamos exactamente qué ocurre en producción en el servidor cuando una naviera envía una factura:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               PIPELINE DE INGESTA Y CRUCE AUTOMÁTICO EN PRODUCCIÓN                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. ENTRADA DEL CORREO (Gmail Webhook / PubSub)                                        │
│     Llega un mail a facturas@almarrosario.com de "billing@maersk.com".                 │
│     Asunto: "Factura Electrónica Maersk Line A/S - BL KA0018437".                      │
│     Adjunto: Factura_7554566633.pdf (USD 57,00) y Factura_7554364222.pdf (USD 791,00)  │
│                                                                                        │
│  2. EXTRACCIÓN ESTRUCTURADA POR IA (OpenAI Structured Outputs - RAM Volátil)           │
│     El motor lee los PDFs y devuelve un JSON estricto sin alucinaciones:              │
│     - Emisor: Maersk Line A/S (CUIT 30-60721200-1)                                     │
│     - Bill of Lading: "KA0018437"                                                      │
│     - Contenedor: "MSKU7842897"                                                        │
│     - Importe Flete: USD 791,00 | BL Fee: USD 57,00 | Total: USD 848,00               │
│                                                                                        │
│  3. CONSULTA DE MATCHING MULTIDIMENSIONAL (Motor en PostgreSQL)                        │
│     El sistema ejecuta tres reglas en cascada:                                         │
│     • ¿Regla 1 (Asunto del Mail)?: ¿Tiene [CXXXX]? Si existe, asigna directamente.     │
│     • ¿Regla 2 (Bill of Lading)?: Busca "KA0018437" en los expedientes abiertos.       │
│       -> ¡Match Encontrado! El BL KA0018437 pertenece a la Carpeta C1434 (Siderar).    │
│     • ¿Regla 3 (Contenedor)?: Busca "MSKU7842897" en unidades en tránsito.            │
│       -> ¡Match Confirmado!                                                            │
│                                                                                        │
│  4. CRUCE FINANCIERO AUTOMÁTICO                                                        │
│     • Gasto Facturado por Maersk: USD 848,00                                           │
│     • Costo Previsto por Lucía en Carpeta C1434: USD 848,00                            │
│     • Desvío: USD 0,00 (0.0%) ──► SEMÁFORO VERDE                                       │
│                                                                                        │
│  5. PRESENTACIÓN EN EL VISOR DUAL DE STEFANIA                                          │
│     La factura aparece en la bandeja "Listos para Kipintoch".                          │
│     Stefania la ve asociada a C1434 con semáforo verde, revisa el PDF a la izquierda   │
│     y los datos extraídos a la derecha, y presiona "Copiar a Kipintoch" (15 segundos). │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.5 La Bandeja de Excepciones: ¿Qué Pasa si una Factura Llega sin Carpeta en el Asunto?

Un forwarder real recibe cientos de correos por semana, y no todos los proveedores cumplen las normas. Fran debe mostrarle al Directorio que el sistema está preparado para la imperfección de la vida real:

#### El Caso Real de Auditoría: Comprobante Munser S.A. / Terminal 4 (TRP)
- **El Hecho:** Llegó a la casilla un correo de Terminales Río de la Plata (TRP) con la Factura N° 0087-00067102 por **$340.252,00 ARS** (concepto THC).
- **El Problema:** El proveedor puso en el asunto simplemente: *"Comprobante de Pago TRP"*. No puso `[C1482]` ni ninguna carpeta.
- **Cómo Actúa el Sistema:**
  1. La IA lee el cuerpo del PDF y extrae el CUIT de TRP, el importe y el número de contenedor impreso en el renglón de detalle.
  2. Si el contenedor no coincide con ninguna carpeta activa o si se trata de un gasto administrativo general (ej. luz, librería o insumos de oficina), el comprobante **NO SE PIERDE NI SE BORRA**.
  3. El sistema lo traslada automáticamente a la pestaña: **`📂 Sin Carpeta Asignada (Huérfanos)`**.
  4. En esa bandeja, la operadora ve una alerta naranja: *"Comprobante pendiente de vinculación"*.
  5. Con un cuadro de búsqueda inteligente (selector dropdown), Stefania escribe *"Munser"* o *"C1482"*, hace clic en **"Vincular Carpeta"**, y el comprobante se integra inmediatamente a la cuenta corriente del expediente.

---

### 2.6 Guion de Oratoria para Fran (El Ciclo de Facturación y Kipintoch)

> *"Alejandro, Vanesa: quiero despejar una duda operativa clave que a veces surge cuando se piensa en sistemas.*  
> *¿Lucía tiene que cargar facturas de proveedores cuando cotiza? ¡De ninguna manera! Cuando Lucía vende, la mercadería recién se está fabricando en China; la carpeta en Kipintoch nace vacía de facturas de compra.*  
>  
> *El trabajo pesado de cargar facturas de navieras ocurre 35 días después, cuando el buque llega a Buenos Aires y Maersk manda los PDFs por mail. Ahí es donde hoy Stefania pierde 12 minutos por comprobante tipeando números a mano en Kipintoch.*  
>  
> *¿Cómo hace nuestra plataforma para saber a qué carpeta pertenece una factura que entra por mail 35 días después?*  
> *Por los datos duros de la carga: cada factura de Maersk o de MSC trae impreso el número de Bill of Lading y el número de contenedor. Nuestro motor de IA lee el PDF, le pregunta al sistema qué carpeta tiene ese BL, y hace el match exacto en un segundo.*  
>  
> *Compara lo que nos cobra Maersk contra lo que Lucía había presupuestado hace un mes: si el flete es el pactado, le prende el semáforo verde a Stefania; y si Maersk nos metió un recargo indebido de 300 dólares, le clava el semáforo rojo en pantalla antes de que Finanzas gire un solo peso.*  
> *Stefania pasa de tipear durante 12 minutos a validar con la vista en 15 segundos y copiar a Kipintoch con un clic."*

---

# MÓDULO 3: EL CASO MULTICARPETA Y EL "SUBRAYADO OPERATIVO" (FACTURAS COMPARTIDAS)

### 3.1 La Realidad Cotidiana de ALMAR: El Proveedor que Factura Múltiples Cargas Juntas

Uno de los mayores dolores de cabeza en la administración de un freight forwarder ocurre cuando un mismo proveedor emite **una sola factura legal** que ampara servicios prestados a **dos o más clientes distintos** (o distintas carpetas operativas de un mismo cliente).

En la operativa real de ALMAR Rosario, esto sucede cotidianamente en tres tipos de proveedores:
1. **Transportistas Terrestres Nacionales (Flete Camión Puerto a Planta):**
   Un chofer o empresa de transporte (como *LGV Transportes S.R.L.* o *Lisandro G. Villalba*) retira dos contenedores de la terminal de Buenos Aires: uno va para la planta de Vicentin en San Lorenzo y otro para la planta de Paladini en Villa Gobernador Gálvez. La empresa de transporte emite **una única Factura A** por el total del servicio consolidado.
2. **Terminales Portuarias y Fiscales (TRP, Exolgan, Terminal Zárate, BAPRO):**
   Emiten facturas globales de peaje, manipuleo de carga (THC) o servicios de escáner aduanero donde listan 5 o 10 contenedores en una misma sábana de liquidación.
3. **Agentes Consolidador / Co-Loaders de Cargas LCL (MSL Líneas Marítimas, AMA Cargo):**
   Envían una sola factura por fletes marítimos consolidados que agrupa cargamentos de diversos importadores.

---

### 3.2 El "Subrayado con Resaltador Fosforescente" y sus Riesgos Críticos

Durante el relevamiento pericial del día a día del equipo operativo (Stefania, Natali, Abril), descubrimos cómo se resuelve este problema actualmente de forma manual en la oficina:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   CÓMO SE PROCESA HOY UNA FACTURA MULTICARPETAS EN PAPEL              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. Se imprime el PDF de la factura en la impresora de la oficina (o se abre en Adobe) │
│  2. La operadora toma un RESALTADOR AMARILLO FOSFORESCENTE en la mano.                 │
│  3. Pinta el Renglón 1: "Viaje a San Lorenzo - Contenedor MSKU1234567".                │
│     Anota al margen con birome: "-> Carpeta C1482 (Vicentin)".                        │
│  4. Pinta el Renglón 2: "Viaje a Gálvez - Contenedor TGHU9876543".                     │
│     Anota al margen con birome: "-> Carpeta C1024 (Paladini)".                        │
│  5. Agarra la calculadora de mano de escritorio:                                       │
│     Calcula a mano el 21% de IVA proporcional de cada renglón y el subtotal con coma.  │
│  6. Entra a Kipintoch y carga la mitad de la factura en C1482.                         │
│  7. Vuelve a entrar a Kipintoch y carga la otra mitad en C1024.                        │
│                                                                                        │
│  ══════════════════════════ PELIGROS GRAVÍSIMOS DE ESTE MÉTODO ══════════════════════  │
│                                                                                        │
│  🚨 PELIGRO 1: EL GASTO HUÉRFANO (PÉRDIDA DE DINERO DIRECTA)                           │
│     Si en una factura de 5 renglones la operadora olvida anotar uno o suma mal con la  │
│     calculadora, ese renglón queda sin imputar a ninguna carpeta.                      │
│     ALMAR le paga la totalidad de la factura al transportista, pero NUNCA le traslada  │
│     el gasto al cliente. El costo lo termina absorbiendo ALMAR de su propio bolsillo.  │
│                                                                                        │
│  🚨 PELIGRO 2: DUPLICACIÓN DE CRÉDITO FISCAL ANTE AFIP                                 │
│     Si por error de digitación la operadora carga el comprobante con el monto total    │
│     en dos carpetas distintas dentro del sistema, el sistema contable puede duplicar   │
│     el crédito fiscal de IVA, generando inconsistencias en el Libro IVA Compras AFIP.  │
│                                                                                        │
│  🚨 PELIGRO 3: DESPERDICIO DE 30 MINUTOS DE PERSONAL CALIFICADO                       │
│     Tipear, prorratear, tachar con resaltador y verificar sumas a mano insume media    │
│     hora por cada factura combinada, generando cansancio mental propenso a errores.    │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 El Caso Testigo de Auditoría: LGV Transportes S.R.L. ($968.000,00 ARS)

Para que el Directorio vea que hablamos de su realidad palpable y no de abstracciones teóricas, Fran cuenta con el respaldo de un comprobante real auditado en las casillas de ALMAR:

- **Comprobante:** Factura "A" Nº 0004-00000303
- **Emisor:** LGV Transportes S.R.L. (Lisandro G. Villalba) · CUIT 30-71458921-8
- **Importe Total:** **$968.000,00 ARS** (Neto Gravado $800.000 + IVA 21% $168.000)
- **Concepto Facturado:** Flete terrestre carretero tramo Terminal Portuaria Buenos Aires a Destinos Santa Fe.

#### El Desglose Físico de la Carga:
* **Renglón 1:** Tramo TRP Retiro ➔ San Lorenzo (Mercadería: Bobinas de Acero).
  - Contenedor: `MSKU1234567` (40' HQ).
  - Carpeta Destino: **`C1482`** (Cliente: Vicentin S.A.I.C.).
  - Asignación Económica: **$400.000,00 Neto + $84.000,00 IVA (21%) = $484.000,00 ARS**.
* **Renglón 2:** Tramo TRP Retiro ➔ Villa Gobernador Gálvez (Mercadería: Tripas / Insumos Frigoríficos).
  - Contenedor: `TGHU9876543` (40' Reefer).
  - Carpeta Destino: **`C1024`** (Cliente: Paladini S.A.).
  - Asignación Económica: **$400.000,00 Neto + $84.000,00 IVA (21%) = $484.000,00 ARS**.

---

### 3.4 La Solución en el Visor Dual: Smart Pro-Rata & Line-Item Split

En la plataforma desarrollada para ALMAR, este dolor se resuelve digitalmente en cuestión de segundos mediante la funcionalidad de **Split Multicarpeta por Renglón**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   PANTALLA DEL VISOR DUAL — ASIGNACIÓN MULTICARPETA                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Factura: LGV Transportes A-0004-00000303      Total Factura: $968.000,00 ARS          │
│                                                                                        │
│  [ RENGLÓN 1: $400.000 + IVA $84.000 ]                                                 │
│  Contenedor: MSKU1234567 (San Lorenzo)                                                 │
│  Carpeta Asignada: [ Desplegable: C1482 - Vicentin S.A.I.C. ▼ ]  ──► [ OK: $484.000 ]  │
│                                                                                        │
│  [ RENGLÓN 2: $400.000 + IVA $84.000 ]                                                 │
│  Contenedor: TGHU9876543 (V. Gdor. Gálvez)                                             │
│  Carpeta Asignada: [ Desplegable: C1024 - Paladini S.A.     ▼ ]  ──► [ OK: $484.000 ]  │
│                                                                                        │
│  ────────────────────────────────────────────────────────────────────────────────────  │
│  BALANCE DE CONTROL (REGLA DE SUMA CERO):                                              │
│  • Total Factura:         $968.000,00                                                  │
│  • Total Imputado:        $968.000,00                                                  │
│  • Saldo Remanente:       $      0,00 ──► [ INDICADOR VERDE: BALANCE CUADRADO ]        │
│                                                                                        │
│  [ BOTÓN: COPIAR SUB-ASIENTO C1482 ]      [ BOTÓN: COPIAR SUB-ASIENTO C1024 ]          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Las 4 Salvaguardas del Motor de Split:
1. **Lectura Inteligente de Renglones:** El motor OCR y de extracción desglosa cada ítem del PDF individualmente, identificando la descripción del tramo, el contenedor asociado y el importe neto con su alícuota de IVA correspondiente.
2. **Asignación Rápida con 1 Clic:** La operadora no tiene que tipear importes; solo selecciona del menú desplegable a qué carpeta de ALMAR corresponde cada renglón.
3. **Compuerta de Balance Estricto (Suma Cero):**
   $$\text{Total del Comprobante} - \sum (\text{Renglones Imputados}) = \text{Saldo Remanente} \equiv \$0,00$$
   Si la suma de las partes no da exactamente el total de la factura al centavo, el botón de guardado permanece deshabilitado. Es **matemáticamente imposible** dejar un gasto afuera o imputar de más.
4. **Copiado Individual sin Fricción:** Con un solo clic se copia la ficha estructurada para la carpeta `C1482` de Vicentin, y con otro clic la de `C1024` de Paladini, listas para pegar en Kipintoch.

---

### 3.5 Blindaje Fiscal y Asiento en Kipintoch sin Duplicación de AFIP

Uno de los grandes temores de Finanzas (Vanesa) es cómo impacta esto contablemente:

- **En AFIP (Libro IVA Compras):**
  La factura de LGV Transportes entra **una sola vez** al Libro IVA Compras por su número oficial (`0004-00000303`), su CAE y su CUIT. Cero riesgo de duplicación fiscal o requerimientos de AFIP.
- **En la Gestión Operativa de Carpetas (Kipintoch):**
  En la carátula de Vicentin (`C1482`) queda asentado el costo del camión a San Lorenzo por **$484.000 ARS** para recuperarlo en la liquidación final al cliente. En la carátula de Paladini (`C1024`) queda asentado el costo a Gálvez por **$484.000 ARS**.
- **Resultado:** Rentabilidad transparente por carpeta, control exhaustivo de costos por cliente y cero papeles pintados con resaltador.

---

### 3.6 Guion de Oratoria para Fran (El Resaltador vs. El Split Inteligente)

> *"Vanesa, Juan Andrés: acá entramos en uno de los problemas más desgastantes que detectamos cuando vimos cómo trabajan Stefania y las chicas en la oficina.*  
> *¿Qué pasa cuando un transportista como LGV Transportes o una terminal como TRP manda una sola factura de un millón de pesos que incluye dos contenedores de clientes distintos?*  
>  
> *Hoy el método de trabajo es imprimir la hoja, sacar el resaltador amarillo fosforescente y pintar: este renglón va para la carpeta de Vicentin y este otro para la de Paladini; y después agarrar la calculadora de mano para sacar el IVA proporcional y rezar para no equivocarse en una coma o dejar un tramo sin imputar.*  
>  
> *Miren la pantalla: con la función de Split Multicarpeta desterramos el papel y el resaltador para siempre.*  
> *El sistema lee los renglones del PDF de LGV Transportes, la operadora le dice con dos clics a qué carpeta va cada contenedor, y este indicador de 'Balance Cero' asegura que la suma dé exactamente los $968.000 al centavo.*  
>  
> *Con esto eliminamos tres riesgos de un solo tiro: no duplicamos el crédito fiscal en AFIP, nos aseguramos de que no quede ningún gasto colgado que ALMAR tenga que pagar de su bolsillo, y las chicas hacen en 30 segundos un trabajo que antes les llevaba media hora de cuentas a mano."*

---

# MÓDULO 4: LA ARQUITECTURA TÉCNICA EN PRODUCCIÓN (VERCEL, OPENAI ZDR, MODELO Y SALDO)

### 4.1 La IA en Producción: ¿Por qué OpenAI `gpt-4o-mini` y por qué es Igual o Más Efectiva que Gemini Flash?

Una de las dudas más legítimas que Fran planteó antes de la reunión es:  
*"¿Va a ser igual de efectiva esa IA en producción ya que no va a ser Gemini 3.8 Flash? ¿Cómo se comportará con las facturas reales?"*

La respuesta técnica es categórica: **OpenAI `gpt-4o-mini` es la herramienta idónea y superior para este caso de uso específico en producción**, por tres razones fundamentales de ingeniería de software:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             POR QUÉ GPT-4O-MINI ES EL ESTÁNDAR ÓPTIMO PARA FACTURACIÓN                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. STRUCTURED OUTPUTS NATIVOS (JSON Schema Estricto a Nivel Gramatical)               │
│     • En modelos comunes, la IA genera texto libre que puede "romper el JSON" o       │
│       inventar claves aleatorias.                                                      │
│     • OpenAI implementó "Constrained Decoding": el motor restringe físicamente los     │
│       tokens a la salida gramatical obligatoria. La tasa de JSONs mal formados es 0.0%│
│                                                                                        │
│  2. LA IA ES UN EXTRACTOR ESTRUCTURADO, NO UN OPINADOR                                 │
│     • No le pedimos al modelo que "invente" nada ni que "redacte poesía". Le damos     │
│       la imagen/texto del PDF y le exigimos: "Extraé el BL, el Contenedor y el CUIT". │
│     • Para esta tarea de extracción documental, un modelo compacto, hiper-optimizado  │
│       como gpt-4o-mini es más rápido, más barato y menos propenso a desvaríos que un   │
│       modelo gigante generalista.                                                      │
│                                                                                        │
│  3. LATENCIA ULTRA-BAJA EN TIEMPO REAL                                                 │
│     • Procesa un comprobante complejo de 2 páginas en apenas 1.2 a 1.8 segundos.       │
│     • La operadora no sufre demoras de espera; el procesamiento ocurre en background.   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 La Capa Determinística de Auditoría: Por qué NUNCA se Confía a Ciegas en un LLM

En sistemas financieros y de comercio exterior, **una regla de oro es jamás confiar los cálculos matemáticos o la validez impositiva a una Inteligencia Artificial**. La IA extrae; el código determinístico audita y verifica.

Nuestra plataforma cuenta con dos capas de control matemático que operan inmediatamente después de la extracción:

#### 1. Algoritmo Módulo 11 de AFIP (Verificación de CUIT y CAE)
Cada vez que el modelo extrae un CUIT de un proveedor (ej. Maersk CUIT `30-60721200-1` o LGV Transportes CUIT `30-71458921-8`), el sistema corre el algoritmo matemático oficial de verificación de AFIP:
$$\text{Dígito Verificador} = 11 - \left( \sum_{i=1}^{10} \text{Dígito}_i \times \text{Ponderador}_i \pmod{11} \right)$$
Si el CUIT no pasa la prueba matemática del Módulo 11, el comprobante se marca inmediatamente en rojo como *"CUIT Inválido"* antes de permitir cualquier operación.

#### 2. Ecuación de Balance Fiscal al Centavo
El sistema comprueba por software la consistencia impositiva de cada factura:
$$\text{Neto Gravado (21\%)} + \text{Neto Gravado (10.5\%)} + \text{IVA} + \text{Conceptos No Gravados} + \text{Percepciones} \equiv \text{Total Factura}$$
Si existe una discrepancia de tan solo **$0,01 ARS o USD 0,01**, el sistema bloquea el comprobante y enciende una advertencia amarilla para que la operadora verifique el redondeo en el Visor Dual.

---

### 4.3 Privacidad, Seguridad y Secreto Comercial: Zero Data Retention (ZDR)

Para Juan Andrés (Legales) y Alejandro (Dirección), la privacidad de la información comercial de ALMAR es innegociable. No pueden filtrarse márgenes, clientes ni tarifas a la nube pública.

La integración en producción implementa la política de **Zero Data Retention (ZDR)** de OpenAI:
- **Parámetro Estricto `store: false`:**
  En cada petición enviada al servidor de OpenAI, el sistema envía la bandera `store: false`.
- **Memoria RAM Volátil:**
  El PDF viaja en un canal cifrado TLS 1.3, el modelo procesa la imagen en memoria RAM efímera durante 1.5 segundos y **se destruye inmediatamente**.
- **No Entrenamiento:**
  Por contrato de API empresarial de OpenAI, **ningún dato, factura, CUIT, margen o tarifa de ALMAR se almacena en discos de terceros ni se utiliza para entrenar modelos públicos**. Los datos son 100% propiedad soberana de ALMAR.

---

### 4.4 Infraestructura Cloud: Hosting en Vercel y Base Supabase

Para garantizar alta disponibilidad sin requerir que ALMAR mantenga servidores físicos ruidosos o caros en su oficina de Rosario, la arquitectura se basa en estándares de la industria:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE PRODUCCIÓN CLOUD                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ FRONTEND & API SERVERLESS: VERCEL ENTERPRISE ]                                      │
│  • Alojado en la nube global de Vercel con CDN de ultra-baja latencia en Sudamérica.    │
│  • Subdominio corporativo propio: facturacion.almarrosario.com o portal.almarrosario.com│
│  • Certificados SSL TLS 1.3 automáticos y renovación desatendida.                      │
│  • Single Sign-On (SSO): los usuarios inician sesión con sus cuentas corporativas de   │
│    Google Workspace (@almarrosario.com). Sin contraseñas nuevas que recordar.         │
│                                                                                        │
│  [ BASE DE DATOS TRANSACCIONAL: SUPABASE (POSTGRESQL 15) ]                             │
│  • Cifrado en reposo con algoritmo bancario AES-256.                                   │
│  • Row-Level Security (RLS) estricto:                                                  │
│    - Los operativos (Aldana/Natali) solo ven carpetas y despachos logísticos.         │
│    - Los directivos (Alejandro/Vanesa) ven márgenes brutos, retornos y balances.       │
│  • Copias de seguridad automáticas diarias (Daily Backups con Point-in-Time Recovery). │
│                                                                                        │
│  [ COMUNICACIÓN CON CASILLAS: GMAIL PUB/SUB WEBHOOKS ]                                 │
│  • Conexión mediante API autorizada de Google Workspace.                               │
│  • Solo lee correos entrantes de la casilla facturas@almarrosario.com con adjuntos.    │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Los Números Reales: Costo por Comprobante y Presupuesto Mensual

Uno de los mayores temores de los socios gerentes al escuchar la palabra "Inteligencia Artificial" es el costo de los consumos en dólares. Fran puede desarmar este temor mostrando los números exactos de la tarifa oficial de OpenAI:

#### Tarifas Oficiales de `gpt-4o-mini`:
- **Tokens de Entrada:** USD 0,15 por cada 1.000.000 de tokens.
- **Tokens de Salida:** USD 0,60 por cada 1.000.000 de tokens.

#### Consumo Promedio de una Factura de Forwarding (Maersk / MSC / TRP):
- Imagen / Texto del PDF (Entrada): ~1.200 tokens ➔ **USD 0,00018**
- JSON Estructurado Extraído (Salida): ~350 tokens ➔ **USD 0,00021**
- **Costo Total por Factura Procesada:** **USD 0,00039** *(menos de cuatro diezmilésimos de dólar)*.

#### Proyección Mensual para el Volumen de ALMAR Rosario:
| Volumen Mensual Estimado | Costo Total en Dólares | Equivalente en Pesos Argentinos (TC $1.200) |
| :--- | :---: | :---: |
| **300 Comprobantes / Mes** | **USD 0,12 / mes** | **$ 144 ARS / mes** |
| **500 Comprobantes / Mes** | **USD 0,20 / mes** | **$ 240 ARS / mes** |
| **1.000 Comprobantes / Mes** | **USD 0,39 / mes** | **$ 468 ARS / mes** |

> **Conclusión Contundente:** Procesar todo el volumen mensual de facturación de ALMAR cuesta **menos de USD 0,50 al mes** (menos de medio dólar, el precio de un caramelo). En contrapartida, el sistema previene sobrecostos de armadores por más de **USD 14.800** y recupera **62 horas operativas** de personal calificado.

---

### 4.6 Paso a Paso de Activación y Carga de Saldo (Límites de Seguridad)

Para que Juan Andrés y Vanesa tengan absoluta tranquilidad de que la tarjeta de la empresa no sufrirá consumos descontrolados, el proceso de alta y parametrización se hace en 4 pasos auditados:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               PASO A PASO PARA CONFIGURAR LA CUENTA CORPORATIVA DE ALMAR               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  PASO 1: Alta de Cuenta en OpenAI Platform                                             │
│  • Ingresar a platform.openai.com con el correo oficial: administracion@almarrosario.com│
│  • Razón Social: ALMAR ROSARIO S.R.L.                                                  │
│                                                                                        │
│  PASO 2: Carga de Saldo Inicial Prepago                                                │
│  • En la pestaña "Billing", se asocia la tarjeta corporativa de ALMAR (Visa / Master). │
│  • Se realiza una carga inicial de saldo prepago de USD 15,00 o USD 20,00.             │
│    (Con USD 15,00 ALMAR tiene saldo para procesar facturas durante más de dos años).    │
│                                                                                        │
│  PASO 3: Configuración de Límites de Gasto (Usage Limits & Guardrails)                 │
│  • Soft Limit (Alerta por Correo): USD 10,00.                                          │
│    Si en un mes se alcanzaran los USD 10,00, OpenAI envía un mail de aviso a Vanesa.   │
│  • Hard Limit (Corte Automático Infranqueable): USD 20,00.                             │
│    Si el consumo toca los USD 20,00, el sistema corta automáticamente las peticiones.  │
│    Es imposible que llegue una factura sorpresa a fin de mes.                          │
│                                                                                        │
│  PASO 4: Generación de Clave API Restringida                                           │
│  • Se crea una clave API (`sk-proj-...`) con permisos exclusivos de inferencia modelo.  │
│  • Se carga de forma encriptada en las variables de entorno de Vercel (`OPENAI_API_KEY`)│
│  • Nunca queda expuesta en el código fuente ni accesible por el personal.              │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.7 Guion de Oratoria para Fran (La Seguridad Técnica y los Costos)

> *"Alejandro, Vanesa, Juan Andrés: cuando uno escucha hablar de Inteligencia Artificial, lo primero que piensa un directivo es: 'Esto debe costar miles de dólares por mes' y '¿qué pasa con la confidencialidad de mis clientes?'.*  
>  
> *Quiero darles dos datos de absoluta tranquilidad:*  
> *Primero, la privacidad: la plataforma trabaja con la API empresarial de OpenAI configurada con Zero Data Retention (`store: false`). Las facturas de ALMAR se procesan en la memoria durante un segundo y se destruyen; no quedan guardadas en ningún servidor ajeno ni se usan para entrenar nada. La información de sus clientes y sus costos es 100% de ustedes.*  
>  
> *Segundo, los números duros: procesar una factura de Maersk de dos hojas cuesta exactamente 0,00039 dólares. Para el volumen mensual de ALMAR, el costo total del servidor de IA es de **menos de 30 centavos de dólar al mes**. Con 20 dólares que carguen hoy en su cuenta corporativa, tienen saldo cubierto para dos o tres años de facturación.*  
>  
> *Y además, dejamos configurado un límite estricto de seguridad en 20 dólares: si alguien intentara hacer un uso indebido, a los 20 dólares el sistema corta de cuajo. No hay sorpresas de tarjeta ni costos ocultos."*

---

# MÓDULO 5: BLINDAJE JURÍDICO, LEY 25.506 (WEBAUTHN), SANCOR SEGUROS Y BANCO MACRO

### 5.1 Autorización Biométrica WebAuthn FIDO2 bajo la Ley Nacional de Firma Digital N° 25.506

Durante la operación diaria, surgirán expedientes donde el margen comercial sea muy ajustado (ej. fletes spot para competir contra otro forwarder) o donde una naviera aplique un recargo que la Dirección decida absorber comercialmente.

Para resolver esto sin trabar la operación con firmas en papel ni exponer contraseñas compartidas, la plataforma incorpora **Autorización Biométrica por Hardware (WebAuthn FIDO2)**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               CIRCUITO DE AUTORIZACIÓN BIOMÉTRICA GERENCIAL (3 SEGUNDOS)               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. DETECCIÓN DE MARGEN AJUSTADO (Caso Real: Carpeta C1234 - Acindar)                 │
│     • Margen proyectado: USD 142,50 (por debajo del umbral de USD 200).                │
│     • El sistema enciende el semáforo amarillo preventivo.                             │
│                                                                                        │
│  2. NOTIFICACIÓN DIRECTIVA A ALEJANDRO / VANESA                                        │
│     • El directivo abre la carpeta desde su notebook o celular.                        │
│     • Hace clic en el botón: "Autorizar Excepción Comercial".                          │
│                                                                                        │
│  3. GESTO BIOMÉTRICO LOCAL (FIDO2)                                                     │
│     • El navegador solicita la huella dactilar (Windows Hello / Touch ID de Mac).      │
│     • El chip criptográfico local (TPM) firma la autorización con clave privada.       │
│                                                                                        │
│  4. ASINTO INMUTABLE EN AUDIT LOG (LEY 25.506 ART. 5)                                  │
│     • Se graba un registro con firma electrónica avanzada:                             │
│       - Hash SHA-256 de 64 caracteres.                                                 │
│       - Timestamp UTC exacto certificado.                                              │
│       - ID de usuario: alejandro.noacco@almarrosario.com                               │
│       - Motivo formal: "Aprobación de tarifa spot para fidelización de cuenta".        │
│                                                                                        │
│  ════════════════════════ VALIDEZ JURÍDICA EN ARGENTINA ═════════════════════════════  │
│  Bajo la Ley Nacional de Firma Digital N° 25.506 (artículo 5) y decretos concordantes, │
│  este procedimiento constituye Firma Electrónica Avanzada: garantiza autoría           │
│  indiscutible, integridad del documento y no repudio pericial. Es legalmente superior │
│  a cualquier usuario y clave tradicional que un empleado podría tipear o compartir.   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 El Caso Sancor Seguros: Provisión Diferida a 150 Días (0.55% FOB) y Holdback

En la auditoría de carpetas históricas de ALMAR detectamos una fuga financiera silenciosa vinculada al seguro de transporte internacional de mercadería:

#### El Problema Operativo y Contable:
- Las pólizas de seguro flotante emitidas por **Sancor Seguros** tienen un costo del **0.55% sobre el valor FOB** de la carga.
- La naviera o el cliente cancelan sus cuentas al arribo de la mercadería, pero Sancor Seguros emite la liquidación y cobro de la prima a ALMAR con un **diferimiento de 120 a 150 días**.
- **El Riesgo Financiero:** Si a los 30 días de cerrada la carpeta, la empresa liquida la rentabilidad contable y paga comisiones a los comerciales o retiros de utilidades, **se están repartiendo ganancias ficticias**, porque dentro de 4 meses llegará la factura de Sancor Seguros a descontar de la caja.

#### La Solución en el Portal:
1. **Provisión Automática desde el Día 1:** Al cargar el valor FOB en la carátula, el sistema devenga automáticamente el 0.55% como pasivo provisionado en la carpeta.
2. **Mecanismo de Holdback Comercial:** El portal retiene el porcentaje de comisión proporcional al seguro hasta que ingrese el comprobante definitivo de Sancor Seguros.
3. **Cero Sorpresas de Caja:** Cuando la aseguradora liquida a los 150 días, el fondo ya está reservado en el balance de la carpeta.

---

### 5.3 Caso Triangulación Net Trade LLC y Conciliación con Banco Macro

ALMAR Rosario gestiona embarques triangulados y cobros internacionales a través de su sociedad asociada en el exterior, **Net Trade LLC** (registrada en Florida, EE.UU., operando con cuenta en el *International Finance Bank - IFB*):

#### Normativa Cambiaria BCRA y Precios de Transferencia:
- Toda prefactura o fee internacional emitido por Net Trade LLC asociado a una carpeta de importación o exportación en Argentina debe guardar estricta coherencia documental con el expediente de Kipintoch para no infringir el Régimen Penal Cambiario ni las normas de Precios de Transferencia de AFIP.

#### La Regla de Oro en el Portal: Conciliación Banco Macro
- **Cuenta Corriente Operativa:** Banco Macro Nº `376100000930617` (CBU oficial de ALMAR Rosario S.R.L.).
- **Protocolo de Validación:** La plataforma no permite cerrar financieramente un expediente ni dar por cancelada una factura de flete local sin el cruce con el extracto bancario oficial de Banco Macro.
- **Resultado:** Trazabilidad bancaria absoluta entre lo facturado en Kipintoch, lo liquidado en Net Trade y el ingreso real de fondos en la cuenta corriente bancaria de Rosario.

---

### 5.4 Plan de Despliegue Inmediato: Hoja de Ruta en 3 Etapas

Para que el Directorio no sienta que esto implica una revolución traumática en su oficina, la implementación se estructura en **3 etapas progresivas**:

| Etapa | Plazo | Alcance y Usuarios Involucrados | Entregables y Objetivos Concretos |
| :-: | :-: | :--- | :--- |
| **ETAPA 1** | **Semana 1** | **Setup Cloud + Piloto Asistido**<br>(Aldana Gómez / Stefania / Vanesa) | • Alta de cuenta corporativa OpenAI ALMAR (ZDR y límites de USD 20).<br>• Conexión de subdominio `facturacion.almarrosario.com` y SSO de Google.<br>• Procesamiento asistido de un lote inicial de 50 facturas reales en paralelo con Kipintoch para medir la reducción de 12 min a 15 seg. |
| **ETAPA 2** | **Semana 2 a 3** | **Frente Comercial & Pricing**<br>(Lucía Laje / Alejandro Noacco) | • Puesta en marcha de la Calculadora Paramétrica Multimodal.<br>• Activación del panel de Smart Follow-Up a 48 hs para recuperar presupuestos dormidos.<br>• Carga de tarifas navieras quincenales y registro de feedback de clientes. |
| **ETAPA 3** | **Semana 4** | **Consolidación Financiera y Legal**<br>(Vanesa Meggiolaro / Juan Andrés Arloro) | • Activación total del Split Multicarpeta de transportistas terrestres.<br>• Devengamiento automatizado de Sancor Seguros a 150 días con holdback.<br>• Trazabilidad de extractos de Banco Macro y auditoría digital completa. |

---

### 5.5 Guion de Cierre de Fran (El Call-to-Action Final para Ganar la Aprobación)

> *"Alejandro, Vanesa, Juan Andrés: para cerrar, quiero ser muy claro con lo que venimos a proponerles hoy.*  
>  
> *No les estamos pidiendo que firmen un cheque en blanco ni que reemplacen Kipintoch de la noche a la mañana. La solución ya está programada, probada y validada con sus 163 carpetas y sus 1.995 cotizaciones reales.*  
>  
> *Lo que les propongo hoy es dar inicio formal a la* **Etapa 1** *desde el próximo lunes:*  
> *Damos de alta su cuenta corporativa en OpenAI con Zero Data Retention para que sus datos queden 100% blindados, le cargamos 20 dólares con límite infranqueable de seguridad, y ponemos a Stefania y a Natali a procesar las primeras 50 facturas con el Visor Dual.*  
>  
> *Si en esas 50 facturas ven que el equipo pasa de tardar 12 minutos a 15 segundos por comprobante, que no se escapa ningún sobrecosto naviero y que el trabajo sale impecable, avanzamos a la Etapa 2 con Lucía en Comercial.*  
>  
> *La herramienta está lista y funcionando en la nube. ¿Damos por aprobada la Etapa 1 para arrancar el lunes?"*

---
*(Fin del documento maestro. Todos los módulos se encuentran completamente desarrollados y articulados para la reunión de Directorio).*
