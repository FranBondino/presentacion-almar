const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '..', 'presentacion-react', 'src', 'data', 'speakerNotes.ts');
let content = fs.readFileSync(targetFile, 'utf8');

console.log('Original content length:', content.length);

// 1. In Slide 5
content = content.replace(
  /'Mirar directamente a Vanesa Meggiolaro al iniciar el slide'/,
  "'Enfocar el control de costos y la protección del margen bruto'"
);

content = content.replace(
  /'Vanesa, esta diapositiva responde con precisión quirúrgica a tu planteo en el relevamiento\. Vos nos marcaste con total claridad el peligro de que un comercial cotice con un tarifario que guardó hace un mes y que, cuando el cliente confirma el embarque, el armador haya subido el flete 300 o 400 dólares, comiéndose la ganancia de ALMAR\..*?Veamos la siguiente pantalla\.'/,
  `'Un punto crítico detectado en el relevamiento fue el peligro de que el equipo comercial cotice con tarifarios desactualizados y que, al momento de confirmar el embarque, el armador haya subido el flete 300 o 400 dólares, comiéndose el margen de ALMAR. Miren la captura de la derecha: implementamos el Semáforo de Vigencia de Tarifas Navieras. Cada tarifa tiene una ventana estricta de validez de 15 o 30 días, según la naviera. Mientras está dentro del plazo, el sistema muestra el badge verde. Cuando faltan 3 días para expirar, se enciende la alerta amarilla preventiva. Y si la tarifa venció, el sistema bloquea automáticamente la emisión de la propuesta. El comercial ya no puede emitir una cotización con costos viejos sin antes revalidar la tarifa actualizada del armador. Cero quebranto por fletes caducados. Ahora bien, surge una pregunta fundamental: ¿cómo evitamos que estos controles frenen la agilidad comercial? Veamos la siguiente pantalla.'`
);

content = content.replace(
  /normativa: 'Directiva Financiera Vanesa Meggiolaro · Gestión del Margen Bruto'/,
  "normativa: 'Directiva de Gestión Financiera · Control del Margen Bruto'"
);

// 2. In Slide 6
content = content.replace(
  /'Mirar a Alejandro Noacco y validar su preocupación sobre la flexibilidad spot'/,
  "'Enfocar la necesidad de agilidad spot y flexibilidad comercial'"
);

content = content.replace(
  /'Alejandro, esta es la respuesta directa a tu preocupación sobre la flexibilidad comercial y al feedback clave que nos transmitió Gisel Cabana Diaz\..*?Y veamos cómo resolvemos el seguimiento de esas cotizaciones\.'/,
  `'Para dar respuesta a la necesidad de máxima flexibilidad comercial y al criterio operativo de Pricing donde cada cliente tiene un perfil de rentabilidad diferente, descartamos imponer un markup rígido del 15% que dejaría a ALMAR fuera de mercado en negocios spot donde el margen es fino pero sirve el volumen. Por eso creamos la Calculadora Paramétrica con Perfiles Dinámicos de Margen: Fíjense en la pantalla: el comercial puede elegir Cuenta Estratégica para grandes cuentas corporativas, Estándar para rentabilidad equilibrada, Spot Alto Riesgo para cargas con riesgo de almacenaje, o Personalizado. ¿Y cómo cuidamos a la empresa? Con dos compuertas inteligentes: Si el margen proyectado baja de 200 dólares, el sistema enciende una alerta amarilla preventiva para advertir que las variaciones del dólar o gastos locales pueden comer la ganancia. Y únicamente si la operación arroja un margen menor a 3 dólares —pérdida neta segura—, el botón se bloquea. Se puede cotizar en 45 segundos con total agilidad, sabiendo que el sistema cuida la rentabilidad de ALMAR. Y veamos cómo resolvemos el seguimiento de esas cotizaciones.'`
);

content = content.replace(
  /normativa: 'Directiva Comercial Alejandro Noacco & Gisel Cabana Diaz \(Pricing\)'/,
  "normativa: 'Directiva de Pricing y Rentabilidad Comercial'"
);

// 3. In Slide 10
content = content.replace(
  /'Mirar a Vanesa y citar el riesgo de tocar valores en un Permiso de Embarque'/,
  "'Destacar el riesgo aduanero de alterar valores en un Permiso de Embarque'"
);

content = content.replace(
  /La prueba forense quedó en el correo de Vanesa a Dalia: "Modificá el PE, sacale los asteriscos y ponele aprox USD 740\.\.\. prometo visitarte en la cárcel"\. Vanesa nos decía con toda la razón del mundo: "Si tocamos a mano los valores de un Permiso de Embarque, la Aduana nos aplica una infracción cambiaria gravísima bajo la Ley 22\.415 y el Régimen Penal Cambiario"\. Fíjense en la solución en pantalla: cuando ingresa una factura en Libras, el portal toma automáticamente la cotización oficial vendedor del Banco de la Nación Argentina \(BNA\) a la fecha exacta del embarque \(1\.3628\)\. Las 543 Libras arrojan exactamente 740,00 dólares \(USD 739,84\)\. Y lo más importante: el sistema descarga y adjunta automáticamente el certificado oficial Boletin_Oficial_BNA_20260225\.pdf como constancia documental inmutable\. Nadie modifica números a mano, AFIP y la DGA reciben el dato exacto y Vanesa duerme con tranquilidad absoluta\./,
  `La prueba forense quedó en el correo operativo donde se advertía: "Modificá el PE, sacale los asteriscos y ponele aprox USD 740...". En la administración se planteaba con toda la razón del mundo el riesgo de tocar valores en un Permiso de Embarque ante la Ley 22.415 y el Régimen Penal Cambiario. Fíjense en la solución en pantalla: cuando ingresa una factura en Libras, el portal toma automáticamente la cotización oficial vendedor del Banco de la Nación Argentina (BNA) a la fecha exacta del embarque (1.3628). Las 543 Libras arrojan exactamente 740,00 dólares (USD 739,84). Y lo más importante: el sistema descarga y adjunta automáticamente el certificado oficial Boletin_Oficial_BNA_20260225.pdf como constancia documental inmutable. Nadie modifica números a mano, AFIP y la DGA reciben el dato exacto y la empresa opera con tranquilidad jurídica absoluta.`
);

content = content.replace(
  /\{ label: 'Smoking Gun Forense', value: 'Email Vanesa a Dalia: "Sacale los asteriscos\.\.\. prometo visitarte en la carcel"' \}/,
  "{ label: 'Evidencia Operativa', value: 'Falla ERP Kipintoch en divisas no estándar (GBP) y riesgo en PE' }"
);

// 4. In Slide 12
content = content.replace(
  /'Conectar la velocidad que pide Alejandro \(3 segundos\) con la validez legal que exige Juan'/,
  "'Conectar la agilidad comercial con el respaldo legal que exige la dirección'"
);

content = content.replace(
  /Esto redujo el margen proyectado a USD 142\.50, por debajo del umbral preventivo de USD 200 fijado por Vanesa\..*?Alejandro autoriza en 3 segundos y Juan tiene respaldo pericial total\./,
  `Esto redujo el margen proyectado a USD 142.50, por debajo del umbral preventivo de USD 200 fijado por finanzas. El sistema encendió el semáforo amarillo preventivo y retuvo la emisión de la prefactura. Pero acá viene la innovación que une las dos prioridades directivas: comercialmente se necesita no trabar la operación con burocracia ni demoras; y a nivel institucional se necesita que si se autoriza un desvío, quede un respaldo legal inatacable. Miren cómo funciona: la Dirección o Finanzas abren el comprobante, seleccionan el motivo formal y simplemente apoyan su huella dactilar en la laptop con WebAuthn FIDO2 (Touch ID o Windows Hello) en 3 segundos. Cero contraseñas que se puedan filtrar o compartir. El chip criptográfico de hardware genera una firma con hash SHA-256 inmutable de 64 caracteres que se estampa en el registro digital. Tiene plena validez legal bajo la Ley Nacional de Firma Digital Nº 25.506 (art. 5). La Dirección autoriza en 3 segundos y la empresa cuenta con respaldo probatorio total.`
);

content = content.replace(
  /\{ label: 'Autorizante', value: 'Alejandro Noacco \/ Vanesa Meggiolaro \(TPM 2\.0 Hardware\)' \}/,
  "{ label: 'Autorizante', value: 'Dirección General / Finanzas (TPM 2.0 Hardware)' }"
);

// 5. In Slide 14
content = content.replace(
  /Vanesa o Alejandro tocan "✏️ Corregir OCR"/,
  'desde la supervisión tocan "✏️ Corregir OCR"'
);

// 6. In Slide 16
content = content.replace(
  /'Hacer contacto visual triangular rotando entre Alejandro, Vanesa y Juan'/,
  "'Recorrer los tres ejes estratégicos de la matriz directiva'"
);

content = content.replace(
  /'Esta matriz sintetiza el compromiso de diseño que asumimos con cada uno de ustedes: Para Alejandro: velocidad comercial absoluta con perfiles dinámicos y captura sistemática de pérdidas para negociar con navieras\. Para Vanesa: freno taxativo a tarifas caducadas, provisión diferida de seguros para no regalar comisiones y conciliación bancaria estricta en Banco Macro\. Y para Juan Andrés: firmas biométricas inatacables bajo la Ley de Firma Digital 25\.506 y custodia absoluta de los secretos comerciales de ALMAR con OpenAI Zero Data Retention\. Cero contradicción entre velocidad operativa y rigor legal\. Revisemos ahora el diagrama de arquitectura y cómo se integra con la Intranet existente de ALMAR\.'/,
  `'Esta matriz sintetiza el compromiso de diseño que asumimos con la conducción de ALMAR: Para la Gestión Comercial: velocidad comercial con perfiles dinámicos y captura sistemática de pérdidas para negociar volumen con navieras. Para el Control Financiero: freno taxativo a tarifas caducadas, provisión diferida de seguros para no liquidar comisiones prematuras y conciliación bancaria estricta en Banco Macro. Y para la Gobernanza Legal e Informática: firmas biométricas inatacables bajo la Ley de Firma Digital 25.506 y custodia absoluta de los secretos comerciales de ALMAR con OpenAI Zero Data Retention. Cero contradicción entre velocidad operativa y rigor legal. Revisemos ahora el diagrama de arquitectura y cómo se integra con la Intranet existente de ALMAR.'`
);

content = content.replace(
  /\{ label: 'Alejandro Noacco', value: 'Agilidad cotización 45s, perfiles flexibles, feedback pérdidas navieras' \}/,
  "{ label: 'Gestión Comercial', value: 'Agilidad cotización 45s, perfiles flexibles, feedback pérdidas navieras' }"
);

content = content.replace(
  /\{ label: 'Vanesa Meggiolaro', value: 'Semáforo tarifas 15\/30d, provisión Sancor 150d, conciliación Banco Macro' \}/,
  "{ label: 'Control Financiero', value: 'Semáforo tarifas 15/30d, provisión Sancor 150d, conciliación Banco Macro' }"
);

content = content.replace(
  /\{ label: 'Juan Andrés Arloro', value: 'WebAuthn Ley 25\.506, OpenAI ZDR store:false, soberanía de datos' \}/,
  "{ label: 'Gobierno IT & Legal', value: 'WebAuthn Ley 25.506, OpenAI ZDR store:false, soberanía de datos' }"
);

// 7. General cleanup of repetitive keyStakeholders and question stakeholders:
// Replace question stakeholders:
content = content.replace(/stakeholder: 'Alejandro Noacco'/g, "stakeholder: 'Dirección Comercial'");
content = content.replace(/stakeholder: 'Vanesa Meggiolaro'/g, "stakeholder: 'Dirección Financiera'");
content = content.replace(/stakeholder: 'Juan Andrés Arloro'/g, "stakeholder: 'Gobernanza / Legal'");

// Replace repetitive keyStakeholders arrays (except slide 1):
// Slide 1 has slideId: 1
const slide1Marker = 'slideId: 1,';
const idx1 = content.indexOf(slide1Marker);
const afterSlide1 = content.slice(idx1 + 100);
let sanitizedAfter1 = afterSlide1
  .replace(/keyStakeholders: \['Alejandro Noacco', 'Vanesa Meggiolaro', 'Juan Andrés Arloro'\]/g, "keyStakeholders: ['Directorio Ejecutivo']")
  .replace(/keyStakeholders: \['Vanesa Meggiolaro', 'Alejandro Noacco'\]/g, "keyStakeholders: ['Dirección Financiera', 'Dirección Comercial']")
  .replace(/keyStakeholders: \['Vanesa Meggiolaro', 'Juan Andrés Arloro'\]/g, "keyStakeholders: ['Dirección Financiera', 'Gobernanza & IT']")
  .replace(/keyStakeholders: \['Juan Andrés Arloro', 'Vanesa Meggiolaro'\]/g, "keyStakeholders: ['Gobernanza & IT', 'Dirección Financiera']")
  .replace(/keyStakeholders: \['Alejandro Noacco', 'Juan Andrés Arloro'\]/g, "keyStakeholders: ['Dirección Comercial', 'Gobernanza & IT']")
  .replace(/keyStakeholders: \['Vanesa Meggiolaro'\]/g, "keyStakeholders: ['Dirección Financiera']")
  .replace(/keyStakeholders: \['Alejandro Noacco'\]/g, "keyStakeholders: ['Dirección Comercial']")
  .replace(/keyStakeholders: \['Juan Andrés Arloro'\]/g, "keyStakeholders: ['Gobernanza & IT']")
  .replace(/keyStakeholders: \['Alejandro Noacco', 'Lucía Laje', 'Gisel Cabana Diaz'\]/g, "keyStakeholders: ['Dirección Comercial', 'Equipo de Ventas']");

content = content.slice(0, idx1 + 100) + sanitizedAfter1;

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Sanitized speakerNotes.ts successfully. New length:', content.length);
