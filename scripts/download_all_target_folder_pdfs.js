const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(keyData, impersonateEmail) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: keyData.private_key_id };
  const payload = {
    iss: keyData.client_email,
    sub: impersonateEmail,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    aud: keyData.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = base64url(signer.sign(keyData.private_key));

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signatureInput}.${signature}`
    }).toString()
  });

  const tokenData = await response.json();
  return tokenData.access_token;
}

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

function extractTextFromPdf(pdfBuffer) {
  const str = pdfBuffer.toString('latin1');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  const extractedTokens = [];

  while ((match = streamRegex.exec(str)) !== null) {
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

    // TJ array
    const tjRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const inner = tjMatch[1];
      const strMatches = inner.match(/\(([^()]*)\)/g);
      if (strMatches) {
        const textChunk = strMatches.map(s => unescapePdfString(s.slice(1, -1))).join('');
        if (textChunk.trim().length > 0) extractedTokens.push(textChunk.trim());
      }
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
        if (hexDecoded.trim().length > 0) extractedTokens.push(hexDecoded.trim());
      }
    }

    // single Tj
    const singleTjRegex = /\(([^()]*)\)\s*Tj/g;
    let sMatch;
    while ((sMatch = singleTjRegex.exec(decompressed)) !== null) {
      const clean = unescapePdfString(sMatch[1]).trim();
      if (clean.length > 0) extractedTokens.push(clean);
    }

    // single hex Tj
    const hexTjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let hMatch;
    while ((hMatch = hexTjRegex.exec(decompressed)) !== null) {
      const rawHex = hMatch[1];
      let decoded = '';
      for (let i = 0; i < rawHex.length; i += 2) {
        const code = parseInt(rawHex.substr(i, 2), 16);
        if (code >= 32 && code <= 255) decoded += String.fromCharCode(code);
      }
      if (decoded.trim().length > 0) extractedTokens.push(decoded.trim());
    }
  }

  return {
    tokenCount: extractedTokens.length,
    fullText: extractedTokens.join('\n'),
    sample: extractedTokens.slice(0, 20)
  };
}

async function runDownload() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const mailboxes = [
    'vmeggiolaro@almarrosario.com',
    'nhermoso@almarrosario.com',
    'astampfli@almarrosario.com',
    'srossi@almarrosario.com',
    'agomez@almarrosario.com',
    'llaje@almarrosario.com'
  ];

  const folders = ['C1289', 'IT1486', 'EA1561', 'C1471', 'C1234', 'C1449', 'C1482', 'C1024', 'C1434'];
  const resultsDir = 'data/real_attachments';
  fs.mkdirSync(resultsDir, { recursive: true });

  const tokens = {};
  for (const m of mailboxes) {
    tokens[m] = await getAccessToken(keyData, m);
  }

  const allDownloaded = [];
  const processedHashes = new Set();

  for (const folder of folders) {
    console.log(`\n======================================================`);
    console.log(`📂 DESCARGANDO ADJUNTOS PARA CARPETA: ${folder}`);
    console.log(`======================================================`);

    let folderPdfCount = 0;

    for (const mailbox of mailboxes) {
      if (folderPdfCount >= 3) break;
      const token = tokens[mailbox];

      const q = encodeURIComponent(`"${folder}" has:attachment filename:pdf`);
      try {
        const searchRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const searchData = await searchRes.json();
        const messages = searchData.messages || [];

        for (const m of messages) {
          if (folderPdfCount >= 3) break;

          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          const getH = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';
          const subject = getH('Subject');
          const date = getH('Date');
          const from = getH('From');

          const parts = [];
          function findPdfParts(pList) {
            if (!pList) return;
            for (const p of pList) {
              if (p.filename && p.filename.toLowerCase().endsWith('.pdf') && p.body?.attachmentId) {
                parts.push(p);
              }
              if (p.parts) findPdfParts(p.parts);
            }
          }
          findPdfParts(msgData.payload?.parts);

          for (const p of parts) {
            if (folderPdfCount >= 3) break;
            const uniqueKey = `${p.filename}_${p.body.size}`;
            if (processedHashes.has(uniqueKey)) continue;
            processedHashes.add(uniqueKey);

            try {
              const attRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}/attachments/${p.body.attachmentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const attData = await attRes.json();
              if (attData.data) {
                const pdfBuffer = Buffer.from(attData.data, 'base64url');
                const cleanFilename = p.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
                const targetName = `${folder}_${mailbox.split('@')[0]}_${cleanFilename}`;
                const savePath = path.join(resultsDir, targetName);

                fs.writeFileSync(savePath, pdfBuffer);
                const textInfo = extractTextFromPdf(pdfBuffer);

                console.log(`  💾 [${folder}] Descargado: ${targetName} (${pdfBuffer.length} bytes, ${textInfo.tokenCount} tokens texto)`);
                console.log(`     Asunto: ${subject}`);
                console.log(`     De: ${from}`);

                allDownloaded.push({
                  folder,
                  mailbox,
                  filename: p.filename,
                  savedFile: targetName,
                  sizeBytes: pdfBuffer.length,
                  tokenCount: textInfo.tokenCount,
                  subject,
                  date,
                  from,
                  sampleText: textInfo.sample.slice(0, 8),
                  fullTextLength: textInfo.fullText.length
                });

                folderPdfCount++;
              }
            } catch (err) {
              console.log(`  ⚠️ Error en adjunto ${p.filename}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.log(`  ⚠️ Error buscando en ${mailbox}: ${err.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`🎉 DESCARGA MULTICARPETAS FINALIZADA: ${allDownloaded.length} PDFs descargados`);
  console.log('='.repeat(80));

  fs.writeFileSync('data/real_pdf_extraction_detailed.json', JSON.stringify(allDownloaded, null, 2));
}

runDownload().catch(console.error);
