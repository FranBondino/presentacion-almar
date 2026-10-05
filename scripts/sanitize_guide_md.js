const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '..', 'GUIA_PRESENTACION_ORADOR_FRAN.md');
let content = fs.readFileSync(targetFile, 'utf8');

console.log('Original guide length:', content.length);

// 1. Badges
content = content.replace(
  /`RESPUESTA DIRECTA A VANESA MEGGIOLARO` \| `CONTROL DE TARIFAS VENCIDAS`/g,
  "`PROTECCIÓN FINANCIERA & CONTROL DE TARIFAS` | `CONTROL DE TARIFAS VENCIDAS`"
);

content = content.replace(
  /`RESPUESTA DIRECTA A ALEJANDRO NOACCO` \| `FLEXIBILIDAD COMERCIAL`/g,
  "`POLÍTICA DE RENTABILIDAD & COTIZACIÓN SPOT` | `FLEXIBILIDAD COMERCIAL`"
);

content = content.replace(
  /`RESPUESTA A ALEJANDRO & JUAN ANDRÉS`/g,
  "`AUTORIZACIÓN DIRECTIVA & GOBERNANZA`"
);

// 2. Slide 5 cues
content = content.replace(
  /Contacto visual directo con Vanesa Meggiolaro al comenzar\./g,
  "Enfocar el control de costos y la protección del margen bruto."
);

// 3. Slide 6 cues
content = content.replace(
  /Mirar directamente a Alejandro Noacco, validando su reclamo de que un markup rígido deja a ALMAR fuera del mercado spot\./g,
  "Enfocar la necesidad de agilidad spot y flexibilidad comercial sin rigideces."
);

// 4. Slide 16 axes
content = content.replace(
  /1\. \*\*Gestión Comercial \(Alejandro Noacco\):\*\*/g,
  "1. **Gestión Comercial:**"
);
content = content.replace(
  /2\. \*\*Control Financiero \(Vanesa Meggiolaro\):\*\*/g,
  "2. **Control Financiero:**"
);
content = content.replace(
  /3\. \*\*Gobernanza y Legal \(Juan Andrés Arloro\):\*\*/g,
  "3. **Gobernanza y Legal:**"
);

// 5. Section 3 Headings
content = content.replace(
  /### 3\.1 OBJECIONES DE ALEJANDRO NOACCO \(DIRECTOR COMERCIAL\)/g,
  "### 3.1 OBJECIONES DEL FRENTE COMERCIAL (DIRECCIÓN COMERCIAL)"
);

content = content.replace(
  /### 3\.2 OBJECIONES DE VANESA MEGGIOLARO \(DIRECTORA DE ADMINISTRACION Y FINANZAS\)/g,
  "### 3.2 OBJECIONES DEL ÁREA FINANCIERA Y ADMINISTRATIVA"
);

content = content.replace(
  /### 3\.3 OBJECIONES DE JUAN ANDRÉS ARLORO \(DIRECTOR LEGAL Y RESPONSABLE TI \/ APODERADO\)/g,
  "### 3.3 OBJECIONES DE GOBERNANZA, LEGAL Y TI"
);

// 6. Time distribution
content = content.replace(
  /\* \*\*40% del tiempo a Alejandro Noacco:\*\*/g,
  "* **40% del tiempo al Frente Comercial:**"
);
content = content.replace(
  /\* \*\*40% del tiempo a Vanesa Meggiolaro:\*\*/g,
  "* **40% del tiempo al Control Financiero:**"
);
content = content.replace(
  /\* \*\*20% del tiempo a Juan Andrés Arloro:\*\*/g,
  "* **20% del tiempo a Gobernanza, Legal y TI:**"
);

// 7. General repetitive stakeholders across slides in guide
content = content.replace(/- \*\*Stakeholders Clave:\*\* Alejandro Noacco, Vanesa Meggiolaro, Juan Andrés Arloro\./g, "- **Stakeholders Clave:** Directorio Ejecutivo.");
content = content.replace(/- \*\*Stakeholders Clave:\*\* Vanesa Meggiolaro, Alejandro Noacco, Juan Andrés Arloro\./g, "- **Stakeholders Clave:** Directorio Ejecutivo.");
content = content.replace(/- \*\*Stakeholders Clave:\*\* Vanesa Meggiolaro, Alejandro Noacco\./g, "- **Stakeholders Clave:** Dirección Financiera, Dirección Comercial.");
content = content.replace(/- \*\*Stakeholders Clave:\*\* Alejandro Noacco, Vanesa Meggiolaro\./g, "- **Stakeholders Clave:** Dirección Comercial, Dirección Financiera.");
content = content.replace(/- \*\*Stakeholders Clave:\*\* Vanesa Meggiolaro, Juan Andrés Arloro\./g, "- **Stakeholders Clave:** Dirección Financiera, Gobernanza & TI.");
content = content.replace(/- \*\*Stakeholders Clave:\*\* Juan Andrés Arloro, Vanesa Meggiolaro\./g, "- **Stakeholders Clave:** Gobernanza & TI, Dirección Financiera.");
content = content.replace(/- \*\*Stakeholders Clave:\*\* Alejandro Noacco, Juan Andrés Arloro\./g, "- **Stakeholders Clave:** Dirección Comercial, Gobernanza & TI.");

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Sanitized GUIA_PRESENTACION_ORADOR_FRAN.md successfully.');
