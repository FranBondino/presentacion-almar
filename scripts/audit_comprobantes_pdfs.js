const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function extractPdfText(pdfPath) {
  if (!fs.existsSync(pdfPath)) return 'FILE_NOT_FOUND';
  const buf = fs.readFileSync(pdfPath);
  const rawString = buf.toString('latin1');
  const textChunks = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(rawString)) !== null) {
    const streamContent = match[1];
    if (!streamContent) continue;
    try {
      const decompressed = zlib.inflateSync(Buffer.from(streamContent, 'latin1')).toString('latin1');
      const textMatches = decompressed.match(/\(([^()]*)\)/g);
      if (textMatches) textChunks.push(textMatches.map(m => m.slice(1, -1)).join(' '));
    } catch (e) {
      const plainMatches = streamContent.match(/\(([^()]*)\)/g);
      if (plainMatches) textChunks.push(plainMatches.map(m => m.slice(1, -1)).join(' '));
    }
  }
  const uncompressed = rawString.match(/\(([^()]{3,})\)/g);
  if (uncompressed) textChunks.push(uncompressed.map(m => m.slice(1, -1)).join(' '));
  return textChunks.join('\n').replace(/\s+/g, ' ').trim();
}

// Read kanban-utils getComprobantePdfUrl logic
const kanbanUtilsPath = path.resolve('portal/lib/kanban-utils.ts');

// Read all 16 PDFs
const facturasDir = path.resolve('portal/public/facturas');
const pdfFiles = fs.readdirSync(facturasDir);
console.log('--- ALL 16 PDF FILES IN portal/public/facturas ---');
const pdfTexts = {};
for (const f of pdfFiles) {
  const fullPath = path.join(facturasDir, f);
  const txt = extractPdfText(fullPath);
  pdfTexts[f] = txt;
  console.log(`[${f}] (${fs.statSync(fullPath).size} bytes):`);
  console.log('  Snippet: ' + txt.slice(0, 200));
}

// Read mockData.ts
const mockContent = fs.readFileSync('portal/lib/mockData.ts', 'utf8');
