const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Octal / escape unescape
function unescapePdfString(str) {
  return str
    .replace(/\\([0-7]{1,3})/g, (match, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\([()\\])/g, '$1');
}

function parsePdfDeep(filePath) {
  const buf = fs.readFileSync(filePath);
  const raw = buf.toString('latin1');
  const results = {
    filePath,
    size: buf.length,
    streamsFound: 0,
    extractedTokens: [],
    plainText: ''
  };

  // Find all stream / endstream blocks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(raw)) !== null) {
    results.streamsFound++;
    const rawStream = Buffer.from(match[1], 'latin1');
    let decompressed = '';

    try {
      decompressed = zlib.inflateSync(rawStream).toString('latin1');
    } catch (e1) {
      try {
        decompressed = zlib.inflateRawSync(rawStream).toString('latin1');
      } catch (e2) {
        decompressed = match[1];
      }
    }

    if (!decompressed) continue;

    // 1. Check for TJ arrays
    const tjRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const inner = tjMatch[1];
      const strMatches = inner.match(/\(([^()]*)\)/g);
      if (strMatches) {
        const textChunk = strMatches
          .map(s => unescapePdfString(s.slice(1, -1)))
          .join('');
        if (textChunk.trim().length > 0) {
          results.extractedTokens.push(textChunk.trim());
        }
      }
      // Check hex in TJ: [<0041> -10 <0042>] TJ
      const hexMatches = inner.match(/<([0-9A-Fa-f]+)>/g);
      if (hexMatches) {
        let hexDecoded = '';
        for (const h of hexMatches) {
          const rawHex = h.slice(1, -1);
          for (let i = 0; i < rawHex.length; i += 2) {
            const code = parseInt(rawHex.substr(i, 2), 16);
            if (code >= 32 && code <= 255) hexDecoded += String.fromCharCode(code);
          }
        }
        if (hexDecoded.trim().length > 0) {
          results.extractedTokens.push(hexDecoded.trim());
        }
      }
    }

    // 2. Check for single Tj strings
    const singleTjRegex = /\(([^()]*)\)\s*Tj/g;
    let sMatch;
    while ((sMatch = singleTjRegex.exec(decompressed)) !== null) {
      const clean = unescapePdfString(sMatch[1]).trim();
      if (clean.length > 0) {
        results.extractedTokens.push(clean);
      }
    }

    // 3. Check for single hex Tj
    const hexTjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let hMatch;
    while ((hMatch = hexTjRegex.exec(decompressed)) !== null) {
      const rawHex = hMatch[1];
      let decoded = '';
      for (let i = 0; i < rawHex.length; i += 2) {
        const code = parseInt(rawHex.substr(i, 2), 16);
        if (code >= 32 && code <= 255) decoded += String.fromCharCode(code);
      }
      if (decoded.trim().length > 0) {
        results.extractedTokens.push(decoded.trim());
      }
    }

    // 4. Check for ' and " operators
    const quoteRegex = /\(([^()]*)\)\s*['"]/g;
    let qMatch;
    while ((qMatch = quoteRegex.exec(decompressed)) !== null) {
      const clean = unescapePdfString(qMatch[1]).trim();
      if (clean.length > 0) {
        results.extractedTokens.push(clean);
      }
    }
  }

  results.plainText = results.extractedTokens.join('\n');
  return results;
}

// Test against all PDF files in data/real_attachments and scripts/
const files = [
  ...fs.readdirSync('data/real_attachments').map(f => path.join('data/real_attachments', f)),
  ...fs.readdirSync('scripts').filter(f => f.toLowerCase().endsWith('.pdf')).map(f => path.join('scripts', f))
];

console.log(`Auditing ${files.length} PDF files...\n`);
files.forEach(f => {
  const parsed = parsePdfDeep(f);
  console.log(`📄 Archivo: ${path.basename(f)}`);
  console.log(`   Tamaño: ${parsed.size} bytes | Streams: ${parsed.streamsFound} | Tokens de texto: ${parsed.extractedTokens.length}`);
  if (parsed.extractedTokens.length > 0) {
    console.log(`   Muestra: [${parsed.extractedTokens.slice(0, 8).join(' | ')}]`);
  } else {
    console.log(`   (Sin texto de stream o fuente incrustada en mapa ToUnicode)`);
  }
  console.log('');
});
