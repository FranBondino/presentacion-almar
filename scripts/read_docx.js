const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function readDocxText(docxPath) {
  const buffer = fs.readFileSync(docxPath);
  
  // Buscar inicio del header zip de word/document.xml
  const docXmlIndex = buffer.indexOf('word/document.xml');
  if (docXmlIndex === -1) {
    throw new Error('word/document.xml no encontrado en el archivo docx');
  }

  // Extraer texto plano mediante expresiones regulares sobre el buffer
  const rawText = buffer.toString('binary');
  const xmlMatches = rawText.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
  
  const extractedText = xmlMatches
    .map(val => val.replace(/<[^>]+>/g, ''))
    .join(' ');

  return extractedText;
}

const docxPath = process.argv[2] || 'C:\\Users\\franc\\Downloads\\ALMAR-PO.01.Gestion Comercial y Atencion al Cliente.00.docx';

try {
  console.log('======================================================================');
  console.log(`📄 LEYENDO DOCUMENTO: ${docxPath}`);
  console.log('======================================================================\n');
  const text = readDocxText(docxPath);
  console.log(text);
  console.log('\n======================================================================');
} catch (e) {
  console.error('Error al leer docx:', e.message);
}
