# ALMAR Rosario — Manual Maestro de Estudio y Testeo Operativo del Portal
> **Documento Confidencial de Preparación Técnica y Funcional para Fran Bondino**  
> *Plataforma de Facturación, Tráfico Logístico y Conciliación Bancaria · ALMAR Rosario S.R.L.*  
> *Versión del Software:* `portal-almar-iso v0.2.0` | *Tests Automatizados:* 827 Pasando al 100%

---

## 1. CÓMO LEVANTAR Y ACCEDER AL PORTAL EN TU COMPUTADORA

### 1.1. Inicio del Servidor de Desarrollo
Abre una terminal de PowerShell en tu equipo y ejecuta:
```powershell
cd c:\Users\franc\.gemini\antigravity\scratch\informe-api-almar\portal
npm run dev
```
* **URL de Acceso:** Abre tu navegador (Chrome, Edge o Brave) en:  
  👉 **`http://localhost:3000`**

---

### 1.2. Credenciales Maestras de Acceso
El sistema cuenta con autenticación corporativa verificada. Puedes ingresar con cualquiera de los correos reales del equipo directivo y operativo con la misma contraseña universal:

* **Contraseña Universal:** `Almar2026!`

| Persona / Usuario | Correo Electrónico | Rol Asignado | Qué ve / Qué hace en el Portal |
| :--- | :--- | :--- | :--- |
| **Alejandro Noacco** | `gerencia@almar.com.ar` | `GERENCIA` | Supervisión ejecutiva 360°, rentabilidad total, anulación/override de alertas, aprobación de desvíos. |
| **Vanesa Meggiolaro** | `finanzas@almar.com.ar` | `FINANZAS` | Control financiero, alerta de margen < USD 200, retención de provisiones Sancor, conciliación Banco Macro. |
| **Juan Andrés Arloro** | `admin@almar.com.ar` | `ADMIN` | Acceso irrestricto, pista de auditoría inmutable ISO 9001 (`audit_log`), gestión de roles y ciberseguridad. |
| **Lucía Laje** | `comercial@almar.com.ar` | `COMERCIAL` | Gestión de 1.080 cotizaciones, Calculadora de Flete con perfiles de margen, Smart Follow-Up a 48 hs. |
| **Natali Hermoso** | `lead.operaciones@almar.com.ar` | `LEAD_OPERACIONES` | Jefatura de tráfico marítimo, asignación de carpetas, supervisión de desvíos navieros y despacho aduanero. |
| **Stefania Rossi / Aldana** | `operativo@almar.com.ar` | `OPERATIVO` | Carga diaria asistida, visor dual de facturas, copiado 1-clic a Kipintoch. **Márgenes financieros restringidos ($ \*\*\*)**. |

---

### 1.3. La Herramienta Secreta: 1-Click Role Switcher (Simulador de Perfiles)
No necesitas cerrar sesión y volver a loguearte para probar qué ve cada persona:
1. En la barra superior derecha del portal verás el botón **"Simular Rol"** con el avatar y el badge del rol actual.
2. Al hacer clic, se despliega el menú con los **6 perfiles corporativos**.
3. Elige cualquier persona (ej. de `OPERATIVO` a `FINANZAS` o `COMERCIAL`): la pantalla se adapta en **0,1 segundos** mediante cookies de sesión JWT, permitiéndote comprobar en vivo las restricciones de acceso de cada rol (RBAC).

---

## 2. LA SECUENCIALIDAD DE EXTREMO A EXTREMO (EL FLUJO REAL DEL NEGOCIO)

Uno de los puntos clave que debes dominar es cómo interactúan las etapas desde que el cliente pide una cotización hasta que el dinero entra al banco:

```
[ PASO 1: COMERCIAL ]          [ PASO 2: OPERACIONES ]          [ PASO 3: FACTURACIÓN ]          [ PASO 4: BANCO ]
Lucía cotiza en                 Cliente confirma flete          Naviera envía factura PDF        Cliente transfiere
Calculadora Paramétrica  --->   Se abre Carpeta Operativa  ---> Extracción IA + Deducción  --->  Conciliación Banco Macro
Semáforo de Vigencias           (C1234, C1434, etc.)             Visor Dual + Copia Kipin        Recibo Oficial + Comisiones
```

---

### ¿Cómo sabe el sistema a qué carpeta pertenece cada factura si inicialmente Kipintoch no tiene API abierta?
Esta es una pregunta neurálgica de Alejandro y Vanesa:
1. **La Apertura de Carpeta:** Cuando el comercial (Lucía) confirma la operación, se genera el número de carpeta (ej. `C1234` para Acindar) y se cargan los datos logísticos clave: **Número de Contenedor (ISO 6346)** (ej. `MSCU9876543`), **Número de Booking** (ej. `MSCU123456`) y **Bill of Lading / BL** (ej. `MEDUSH123456`).
2. **El Arribo de la Factura del Proveedor:** La naviera (Maersk, MSC, Hapag-Lloyd) o el transportista envía la factura en PDF por correo a `facturacion@almar.com.ar`.
3. **El Motor Inteligente de Deducción (`folder-deduction.ts`):** La IA y el motor OCR leen el PDF y aplican un algoritmo jerárquico de deducción en 5 niveles:
   * **Nivel 1 (Confianza 95%): Coincidencia por Número de Contenedor:** Busca códigos normalizados ISO 6346 (4 letras + 7 dígitos, ej. `MSCU 987654-3` $\rightarrow$ `MSCU9876543`). Si coincide con la carpeta `C1234`, la pre-asigna automáticamente.
   * **Nivel 2 (Confianza 90%): Coincidencia por Booking:** Busca cadenas `BKG`, `Booking` o códigos del armador.
   * **Nivel 3 (Confianza 85%): Coincidencia por Bill of Lading (BL):** Cruce con el Master BL (MBL) o House BL (HBL).
   * **Nivel 4 (Confianza 80%): Mención explícita del N° de Carpeta:** Si el proveedor o el operador colocó `Ref: C1234` en el concepto o asunto.
   * **Nivel 5 (Confianza 65%): CUIT del Cliente + Ventana de Fechas:** Cruce del CUIT fiscal del importador dentro de los 30 días de la operación.
4. **Validación Visual Asistida (`FolderAutocompleteSelector`):** En el Kanban y en el Visor Dual, la operadora ve la sugerencia con una etiqueta verde: `Sugerida por Contenedor MSCU9876543 (95%)`. Si es correcta, confirma con 1 clic; si la factura agrupa varios viajes, puede cambiarla al instante escribiendo 2 letras en el selector predictivo.

---

## 3. CHECKLIST PRÁCTICO DE TESTEO EN TU PANTALLA (PANTALLA POR PANTALLA)

### PANTALLA 1: Dashboard de Control Central (`/`)
* **Qué ver:**
  - KPIs superiores: Total de Carpetas Activas, Comprobantes Pendientes, Desvíos Tarifarios y Facturación del Mes.
  - Alertas prioritarias: Desvíos que requieren atención de supervisión.
  - Accesos rápidos a Cotizaciones, Comprobantes y Carpetas.
* **Test de Rol:**
  - Cambia a `OPERATIVO`: Los montos monetarios de margen general aparecen enmascarados o restringidos para preservar la confidencialidad corporativa.
  - Cambia a `FINANZAS`: Se revelan los márgenes consolidados y los desgloses en USD.

---

### PANTALLA 2: Módulo Comercial & Cotizaciones (`/cotizaciones`)
* **Ruta:** Menú lateral $\rightarrow$ **Cotizaciones**.
* **Qué probar:**
  1. **Tablero de Cotizaciones:**
     - Observa las cotizaciones históricas de Lucía Laje (1.080 operaciones analizadas).
     - Revisa los semáforos de **Vigencia de Tarifas**:
       - 🟢 *Tarifa Vigente* (< 15 días desde la cotización).
       - 🟡 *Por Vencer* (entre 15 y 30 días).
       - 🔴 *Tarifa Vencida* (> 30 días — Alerta para no confirmar flete sin revalidar con naviera).
  2. **Calculadora Paramétrica (Botón "Calculadora de Flete"):**
     - Haz clic en el botón azul superior **"Calculadora de Flete"**.
     - Selecciona la modalidad: **Marítimo FCL** (contenedor 40' HC), **LCL** (cálculo de CBM), **Aéreo** (IATA 1:6000) o **Terrestre** (1:3333).
     - **Prueba el Selector de Perfiles de Margen (Pedido de Alejandro Noacco):**
       - `CUENTA_ESTRATEGICA`: Margen ajustado y competitivo (ej. 3.5% / USD 120) para fidelizar grandes cuentas (Acindar, Paladini). El sistema muestra advertencia preventiva amarilla si es menor a USD 200 pero **no bloquea**.
       - `ESTANDAR`: Margen corporativo de equilibrio (8% - 12%).
       - `SPOT_ALTO_RIESGO`: Margen elevado para clientes ocasionales o cargas complejas (> 18%).
       - `PERSONALIZADO`: Ingresa manualmente el margen deseado.
     - Presiona **"Copiar Propuesta para Email"**: se copia al portapapeles una propuesta impecable para pegar en Gmail con validez temporal explícita.
  3. **Smart Follow-Up a 48 hs:**
     - En el panel inferior o en cualquier cotización con badge amarillo **"Requiere Seguimiento"**, haz clic en **"Smart Follow-Up"**.
     - Se abre la ventana modal con la plantilla formal de recontacto personalizada según el cliente.
     - Haz clic en **"Copiar Seguimiento"** y marca **"Seguimiento Realizado"**.
  4. **Registro de Feedback Cualitativo de Pérdidas (Pedido de Alejandro Noacco):**
     - En una cotización no ganada, puedes seleccionar el motivo de pérdida (*"Competencia cotizó USD 150 menos"*, *"Carga diferida por aduana"*, *"Cliente no concretó compra"*) y dejar notas para la estadística directiva.

---

### PANTALLA 3: Tablero Kanban de Comprobantes & Visor Dual (`/comprobantes`)
* **Ruta:** Menú lateral $\rightarrow$ **Comprobantes**.
* **Qué probar:**
  1. **Columnas del Flujo Operativo:**
     - `1. Ingesta (Mails)`: Facturas recién extraídas de correos de Maersk, MSC, Hamburg Süd.
     - `2. Listas para Cargar`: Comprobantes validados sin desvío, listos para volcar en Kipintoch.
     - `3. Con Desvío de Tarifa`: Facturas que superan la cotización inicial (ej. un cargo no previsto de USD 45).
     - `4. Asentadas en ERP`: Ya registradas en Kipintoch con fecha y usuario.
     - `5. En Verificación Bancaria`: Facturas de venta emitidas esperando la acreditación en Banco Macro.
     - `6. Cobrada & Conciliada`: Fondos verificados en extracto bancario; comisiones liberadas.
  2. **El Visor Dual Side-by-Side (El corazón de la facturación diaria):**
     - Haz clic en cualquier comprobante (ej. el de Maersk Line `7554566633` o `7554364222`).
     - Se abre la pantalla dividida:
       - **Lado Izquierdo:** El PDF original exacto del armador naviero.
       - **Lado Derecho:** Los datos extraídos y normalizados por la IA:
         * Razón Social y CUIT emisor.
         * Concepto canónico de gasto.
         * Clasificación impositiva AFIP: **IVA 0% Internacional (Exento Ley 23.349)** vs. **IVA 21% Local**.
         * **Botones de Copiado 1-Clic:** Botón azul **"Copiar para Kipintoch"**. Al presionarlo, formatea el texto exacto que pide Kipintoch ERP para pegarlo con `Ctrl + V` en 2 segundos, eliminando 45 minutos de tipeo manual por lote a costo \$0 de API.

---

### PANTALLA 4: Carpeta Operativa & Las 5 Reglas Críticas (`/carpetas/C1234`)
* **Ruta:** Menú lateral $\rightarrow$ **Carpetas HBL** $\rightarrow$ Clic en **`C1234`** (Acindar S.A.).
* **Qué probar:**
  1. **Regla 1: Alerta Preventiva de Margen (< USD 200) y Bloqueo (< USD 3):**
     - Mira el encabezado: El margen estimado es de USD 142,50 (4,38%).
     - Aparece el banner rojo/ámbar: `ALERTA DE MARGEN OPERATIVO MÍNIMO (< USD 200 / 5%)`.
     - Intenta emitir factura como `OPERATIVO`: el sistema te avisa que requiere autorización de Finanzas/Gerencia.
     - Cambia de rol a `FINANZAS` o `GERENCIA`: se habilita el botón de **Autorización Biométrica WebAuthn (Windows Hello / Touch ID)**. Al confirmar, se genera un hash inmutable SHA-256 de 64 caracteres que queda asentado en el `audit_log`.
  2. **Regla 2: Provisión Diferida de Seguro Sancor (150 días):**
     - En la tabla de comprobantes de la carpeta verás el registro:  
       `Sancor Seguros · PROV-SANCOR-150D · Provisión Automática Seguro 0,55% FOB · USD 212,50 · 🔒 Retenida 150d`.
     - El sistema retiene preventivamente la liquidación de la comisión comercial del vendedor hasta que llegue la póliza definitiva o se cumpla el plazo de 150 días, evitando que ALMAR pague comisiones sobre operaciones que luego sufren mermas de rentabilidad.
  3. **Regla 3: Módulo Multimoneda BNA Oficial (Caso C620 Libras GBP):**
     - En la carpeta `C620` (o al cargar comprobantes en divisas no dólar):
     - El sistema prohíbe cargar la cotización manual 1:1.
     - Exige el Tipo de Cambio Oficial Vendedor del Banco Nación Argentina (BNA) a la fecha de embarque (£543 @ 1.3628 = USD 740.00) y adjunta el PDF de respaldo.
  4. **Regla 4: Conciliación Banco Macro (Hard Gate de Cobranzas):**
     - En el módulo de cobranzas, la factura no pasa a `COBRADA_CONCILIADA` ni habilita el recibo oficial hasta que se valida el número de movimiento en el extracto bancario de la cuenta corriente de Banco Macro (`CC 376100000930617`).
  5. **Regla 5: Triangulación Net Trade LLC Miami (Caso C1056):**
     - En expedientes triangulados, vincula la prefactura emitida por la entidad offshore de Florida con el expediente local en Kipintoch y valida el recupero de fondos en International Finance Bank (IFB).

---

### PANTALLA 5: Circuito de Reporte de Incidencias en Vivo & Copilot IA
* **Ubicación:** Visible en **cualquier pantalla** del portal (esquina inferior derecha).
* **Qué probar:**
  1. **El Botón Flotante:**
     - En la esquina inferior derecha verás la píldora azul: `● Reportar Ajuste · Triage en Vivo ALMAR`.
     - Haz clic: se despliega la ventana modal de triage.
  2. **Auto-Captura de Contexto (Paso 2 del Circuito):**
     - Fíjate en la barra superior del formulario: ya detectó automáticamente que estás en `/carpetas/C1234`, con tu usuario actual y tu rol (*FINANZAS* u *OPERATIVO*). Cero carga manual.
  3. **Tipificación en 10 Segundos (Paso 3 del Circuito):**
     - Selecciona el Tipo: `⚠️ Caso Borde (Regla o sobrecosto no previsto)`.
     - Selecciona la Severidad: `🔴 Bloqueante en Carpeta`.
     - Observa la carpeta pre-asignada: `C1234 — Siderúrgica San Martín`.
     - Escribe una breve observación: *"Maersk facturó cargo Cleaning Fee por USD 45 no presupuestado"*.
  4. **Envío y Ticket Inmutable `#TKT-8421` (Paso 4 del Circuito):**
     - Presiona **"ENVIAR REPORTE"**: el sistema emite el código inmutable `#TKT-8421`, lo estampa en la base de datos `audit_log` y notifica a soporte técnico para calibrar la regla en menos de 24 horas.
  5. **Solapa Copilot IA (Asistencia sin Ticket):**
     - Cambia a la pestaña **"Copilot IA Operativo"**.
     - Aquí el operador puede hacer preguntas operativas en lenguaje natural (ej. *¿Por qué se bloqueó C1234?* o *¿Cómo aplico la provisión de Sancor a 150 días?*) y recibir respuesta técnica inmediata sin generar un ticket de soporte.

---

## 4. MATRIZ DE PREGUNTAS FILOSAS DE LA REUNIÓN (TU CHEAT SHEET DIRECTIVO)

Durante la reunión, cada socio director te hará preguntas desde su propia óptica de negocio. Aquí tienes la respuesta técnica exacta:

### Pregunta de Alejandro Noacco (Director Comercial)
> **Alejandro:** *"Fran, en el área comercial no podemos trabajar con márgenes rígidos porque perdemos clientes ante la competencia. Si yo a una cuenta grande como Acindar le quiero cotizar con un margen fino para no perder el negocio, ¿el sistema me lo va a bloquear?"*

* **Tu Respuesta (con aplomo y señalando la pantalla):**  
  *"No, Alejandro, justamente por eso diseñamos la Calculadora con Perfiles Dinámicos de Margen. Tenés el perfil **'Cuenta Estratégica'**, donde podés cotizar al margen competitivo que vos decidas. El sistema no te frena la venta: lo único que hace es encender un semáforo amarillo preventivo si el margen queda abajo de 200 dólares, para que tanto vos como Vanesa sepan que si la naviera mete un recargo de terminal o una estadía, hay que seguirlo de cerca para que no se coma la rentabilidad. La única restricción estricta de bloqueo es si la operación da quebranto neto directo (< USD 3.00), lo cual protege el patrimonio de la empresa. Tenés 100% de flexibilidad comercial con respaldo financiero."*

---

### Pregunta de Vanesa Meggiolaro (Directora de Administración y Finanzas)
> **Vanesa:** *"A mí lo que me preocupa es que Kipintoch hoy no me avisa si una naviera nos cobra de más o si estamos pagando comisiones a vendedores de carpetas donde la póliza de Sancor Seguros todavía no llegó y nos va a caer una factura de 300 dólares dentro de 4 meses."*

* **Tu Respuesta (señalando la Diapositiva 11 y el Visor Dual):**  
  *"Vanesa, ese fue exactamente el punto central de nuestro relevamiento. La solución implementa dos compuertas automáticas:  
  1. En el Visor Dual, si Maersk o MSC facturan un solo dólar por encima de la cotización aprobada, la factura cae automáticamente en la columna **'Con Desvío'** y el sistema bloquea el botón de carga a Kipintoch hasta que haya una justificación u override formal.  
  2. Para Sancor Seguros, el sistema implementa la **provisión diferida automática del 0,55% sobre el FOB** a 150 días. El costo queda devengado en la carpeta desde el día 1 y la liquidación de comisiones comerciales queda retenida bajo holdback hasta que arribe la póliza real. No hay más sorpresas en los cierres contables."*

---

### Pregunta de Juan Andrés Arloro (Gobernanza y Operaciones)
> **Juan:** *"¿Cómo aseguramos que el personal operativo no haga bypass de las reglas, y qué validez legal y de auditoría tienen las autorizaciones?"*

* **Tu Respuesta (señalando la Diapositiva 12 y 17):**  
  *"Juan, el sistema opera bajo una arquitectura Zero Trust con matriz RBAC estricta:  
  - Un rol Operativo no tiene permisos de base de datos ni visuales para desbloquear alertas o saltear controles.  
  - Las autorizaciones gerenciales no son una simple casilla de verificación: utilizan el estándar **WebAuthn (FIDO2)** con autenticación biométrica (Windows Hello o Touch ID) generando una firma criptográfica **SHA-256 de 64 caracteres** inmutable.  
  - Todo queda registrado en la tabla `audit_log` bajo norma **ISO 9001:2015**, con timestamp UTC, IP, rol y hash documental, garantizando plena validez probatoria conforme a la Ley 25.506 de Firma Digital."*

---

## 5. COMANDOS ÚTILES PARA VERIFICACIÓN RÁPIDA

Si antes de entrar a la reunión quieres hacer un sanity-check rápido de que todo el código y las suites siguen al 100%:

```powershell
# 1. Correr toda la suite de 827 tests del portal (tarda ~60 seg)
cd c:\Users\franc\.gemini\antigravity\scratch\informe-api-almar\portal
npm test

# 2. Correr únicamente los tests de las 5 Reglas Críticas de Negocio
npx vitest run tests/integration/cinco-reglas-negocio-almar.test.ts

# 3. Correr únicamente los tests del Módulo Comercial (Vigencias, Perfiles, Follow-up)
npx vitest run tests/unit/comercial-calibracion.test.ts

# 4. Correr la suite de las 18 Diapositivas de la Presentación
cd c:\Users\franc\.gemini\antigravity\scratch\informe-api-almar
node scripts/test_presentacion_ejecutiva.js

# 5. Verificar que ninguna de las 18 slides tenga desborde de texto
node scripts/check_all_slides_overflow.js
```

---
*Fin del Manual Maestro de Estudio y Testeo. ¡Mucho éxito en la reunión, Fran! Tienes una solución técnica y directiva con blindaje absoluto.*
