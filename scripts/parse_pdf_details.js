const fs = require('fs');
const zlib = require('zlib');

function extractPdfText(filePath) {
  console.log(`\n======================================================`);
  console.log(`📄 ARCHIVO: ${filePath}`);
  console.log(`======================================================`);
  const buf = fs.readFileSync(filePath);
  
  // Buscar streams comprimidos en FlateDecode
  const str = buf.toString('latin1');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  let streamCount = 0;
  
  while ((match = streamRegex.exec(str)) !== null) {
    streamCount++;
    try {
      const streamBuf = Buffer.from(match[1], 'latin1');
      const decompressed = zlib.inflateSync(streamBuf).toString('latin1');
      
      // Buscar texto entre paréntesis dentro de TJ o Tj
      const textMatches = decompressed.match(/\(([^()]+)\)/g);
      if (textMatches) {
        console.log(`--- Stream ${streamCount} Texto Extraído ---`);
        const cleanText = textMatches.map(m => m.slice(1, -1)).join(' ');
        console.log(cleanText);
      }
    } catch (e) {
      // Stream no comprimido con zlib estándar o formato directo
    }
  }
}

extractPdfText('scripts/7554566633.PDF');
extractPdfText('scripts/7554364222.PDF');
