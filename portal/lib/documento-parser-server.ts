import zlib from 'node:zlib';
import {
  extraerTextoYMedidasDesdeDocumento,
} from '@/lib/calculadora-cubicaje';
import {
  DocumentoCubicajeAdjunto,
  ResumenCubicaje,
} from '@/types/cotizaciones';

/**
 * Extrae entradas de un archivo ZIP en memoria (como .xlsx o .docx) usando Central Directory
 * o Local File Headers, sin dependencias externas.
 */
function extractZipEntries(buf: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();

  // 1. Intentar por Central Directory (EOCD 0x06054b50 al final del archivo)
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minEocdSearch; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const totalEntries = buf.readUInt16LE(eocdOffset + 10);
    const cdOffset = buf.readUInt32LE(eocdOffset + 16);
    let ptr = cdOffset;

    for (let idx = 0; idx < totalEntries && ptr + 46 <= buf.length; idx++) {
      if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
      const compressionMethod = buf.readUInt16LE(ptr + 10);
      const compressedSize = buf.readUInt32LE(ptr + 20);
      const fileNameLen = buf.readUInt16LE(ptr + 28);
      const extraLen = buf.readUInt16LE(ptr + 30);
      const commentLen = buf.readUInt16LE(ptr + 32);
      const localHeaderOffset = buf.readUInt32LE(ptr + 42);

      const fileName = buf.subarray(ptr + 46, ptr + 46 + fileNameLen).toString('utf8');
      ptr += 46 + fileNameLen + extraLen + commentLen;

      if (localHeaderOffset + 30 <= buf.length && buf.readUInt32LE(localHeaderOffset) === 0x04034b50) {
        const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
        const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const dataEnd = dataStart + compressedSize;
        if (dataEnd <= buf.length) {
          const rawSlice = buf.subarray(dataStart, dataEnd);
          try {
            if (compressionMethod === 0) {
              entries.set(fileName, rawSlice);
            } else if (compressionMethod === 8) {
              entries.set(fileName, zlib.inflateRawSync(rawSlice));
            }
          } catch {
            // ignore corrupted entry
          }
        }
      }
    }
  }

  // 2. Fallback por Local File Headers (0x04034b50) si no se encontró EOCD
  if (entries.size === 0) {
    let offset = 0;
    while (offset + 30 <= buf.length) {
      if (buf.readUInt32LE(offset) !== 0x04034b50) {
        offset++;
        continue;
      }
      const compressionMethod = buf.readUInt16LE(offset + 8);
      const compressedSize = buf.readUInt32LE(offset + 18);
      const fileNameLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const fileName = buf.subarray(offset + 30, offset + 30 + fileNameLen).toString('utf8');
      const dataStart = offset + 30 + fileNameLen + extraLen;
      const dataEnd = dataStart + compressedSize;

      if (compressedSize > 0 && dataEnd <= buf.length) {
        const rawSlice = buf.subarray(dataStart, dataEnd);
        try {
          if (compressionMethod === 0) {
            entries.set(fileName, rawSlice);
          } else if (compressionMethod === 8) {
            entries.set(fileName, zlib.inflateRawSync(rawSlice));
          }
        } catch {
          // ignore
        }
        offset = dataEnd;
      } else {
        offset = dataStart + 1;
      }
    }
  }

  return entries;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Extrae las filas de todas las hojas de un libro Excel (.xlsx) descomprimiendo
 * xl/sharedStrings.xml y xl/worksheets/sheet*.xml.
 */
function extractTextFromXlsxBuffer(buf: Buffer): string {
  const entries = extractZipEntries(buf);
  if (entries.size === 0) return '';

  const sharedStrings: string[] = [];
  const sharedStringsBuf = entries.get('xl/sharedStrings.xml');
  if (sharedStringsBuf) {
    const ssXml = sharedStringsBuf.toString('utf8');
    const siMatches = ssXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi);
    for (const m of siMatches) {
      const inner = m[1] || '';
      const texts = Array.from(inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)).map((tm) =>
        decodeXmlEntities(tm[1] || '')
      );
      sharedStrings.push(texts.join(''));
    }
  }

  const lines: string[] = [];
  const sheetNames = Array.from(entries.keys())
    .filter((k) => /^xl\/worksheets\/sheet\d*\.xml$/i.test(k))
    .sort();

  for (const sheetName of sheetNames) {
    const sheetBuf = entries.get(sheetName);
    if (!sheetBuf) continue;
    const sheetXml = sheetBuf.toString('utf8');
    const rowMatches = sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi);

    for (const rm of rowMatches) {
      const rowXml = rm[1] || '';
      const cells: string[] = [];
      const cellMatches = rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi);

      for (const cm of cellMatches) {
        const attrs = cm[1] || '';
        const cellInner = cm[2] || '';
        const typeMatch = attrs.match(/\bt=["']([^"']+)["']/i);
        const cellType = typeMatch ? typeMatch[1] : '';

        let val = '';
        if (cellType === 'inlineStr') {
          const tMatches = Array.from(cellInner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)).map((tm) =>
            decodeXmlEntities(tm[1] || '')
          );
          val = tMatches.join('');
        } else {
          const vMatch = cellInner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);
          const rawV = vMatch ? decodeXmlEntities((vMatch[1] || '').trim()) : '';
          if (cellType === 's') {
            const idx = parseInt(rawV, 10);
            val = !Number.isNaN(idx) && sharedStrings[idx] !== undefined ? sharedStrings[idx] : rawV;
          } else {
            val = rawV;
          }
        }

        if (val.trim() !== '') {
          cells.push(val.trim());
        }
      }

      if (cells.length > 0) {
        lines.push(cells.join(';'));
      }
    }
  }

  // También revisar word/document.xml si es un .docx
  const docxBuf = entries.get('word/document.xml');
  if (docxBuf) {
    const docXml = docxBuf
      .toString('utf8')
      .replace(/<\/w:tc>/gi, ';')
      .replace(/<\/w:(?:p|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    lines.push(decodeXmlEntities(docXml));
  }

  return lines.join('\n');
}

/**
 * Extrae texto de un PDF tanto de bloques planos como de streams comprimidos FlateDecode.
 */
function extractTextFromPdfBuffer(buf: Buffer): string {
  const chunks: string[] = [];
  const rawLatin1 = buf.toString('latin1');
  chunks.push(rawLatin1);

  // Buscar bloques stream ... endstream y descomprimir con zlib si están comprimidos
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin1)) !== null) {
    const bodyLatin1 = match[1] || '';
    if (!bodyLatin1) continue;
    const streamBuf = Buffer.from(bodyLatin1, 'latin1');

    let decompressed: Buffer | null = null;
    try {
      decompressed = zlib.inflateSync(streamBuf);
    } catch {
      try {
        decompressed = zlib.inflateRawSync(streamBuf);
      } catch {
        decompressed = null;
      }
    }

    if (decompressed) {
      const decStr = decompressed.toString('latin1');
      // Extraer textos dentro de paréntesis (...) en operadores PDF Tj / TJ
      const parenParts = Array.from(decStr.matchAll(/\(([^()]{1,200})\)/g)).map((m) => m[1] || '');
      if (parenParts.length > 0) {
        chunks.push(parenParts.join('\n'));
      }
      chunks.push(decStr);
    }
  }

  return chunks.join('\n');
}

/**
 * Decodifica cuerpos de correo .eml (incluyendo quoted-printable y limpieza de HTML).
 */
function decodeEmlText(rawText: string): string {
  const decodedQp = rawText
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? '' : String.fromCharCode(code);
    });

  return decodedQp
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li)>/gi, '\n')
    .replace(/<\/(?:td|th)>/gi, ';')
    .replace(/<[^>]+>/g, ' ');
}

/**
 * Parsea cualquier archivo logístico (Buffer binario de .xlsx, .pdf, .docx, .csv, .txt, .eml)
 * y devuelve el texto extraído, el ResumenCubicaje completo (con aptitud Copa Airlines) y los metadatos.
 */
export function parsearBufferDocumentoLogistico(params: {
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
  defaultPalletHeightM?: number;
}): {
  textoExtraido: string;
  resumen: ResumenCubicaje;
  documento: DocumentoCubicajeAdjunto;
} {
  const { fileName, buffer, mimeType = 'application/octet-stream', defaultPalletHeightM = 1.2 } = params;
  const lowerName = fileName.toLowerCase();

  let extractedRawContent = '';

  const isZipMagic =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;
  const isPdfMagic = buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';

  if (isZipMagic || lowerName.endsWith('.xlsx') || lowerName.endsWith('.docx')) {
    const zipText = extractTextFromXlsxBuffer(buffer);
    extractedRawContent = zipText || buffer.toString('utf8');
  } else if (isPdfMagic || lowerName.endsWith('.pdf')) {
    extractedRawContent = extractTextFromPdfBuffer(buffer);
  } else if (lowerName.endsWith('.eml') || mimeType.includes('message/rfc822')) {
    extractedRawContent = decodeEmlText(buffer.toString('utf8'));
  } else {
    extractedRawContent = buffer.toString('utf8');
  }

  return extraerTextoYMedidasDesdeDocumento({
    fileName,
    rawContent: extractedRawContent,
    fileSize: buffer.length,
    mimeType,
    defaultPalletHeightM,
  });
}
