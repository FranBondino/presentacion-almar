const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

// Base64URL helper
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Native JWT Google OAuth2 Access Token
async function getAccessToken(keyData, impersonateEmail, scope = 'https://www.googleapis.com/auth/gmail.readonly') {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyData.private_key_id
  };

  const payload = {
    iss: keyData.client_email,
    sub: impersonateEmail,
    scope: scope,
    aud: keyData.token_uri || 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = base64url(signer.sign(keyData.private_key));

  const jwt = `${signatureInput}.${signature}`;

  const tokenParams = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt
  });

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  });

  const tokenData = await response.json();
  if (!response.ok) {
    throw new Error(`Google Auth Error for ${impersonateEmail} (${response.status}): ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// PDF Text Extractor using Node.js zlib & stream parsing
function extractTextFromPdf(pdfBuffer) {
  const str = pdfBuffer.toString('latin1');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  const extractedLines = [];

  while ((match = streamRegex.exec(str)) !== null) {
    const rawStream = Buffer.from(match[1], 'latin1');
    let decompressed = null;

    // Try standard inflate
    try {
      decompressed = zlib.inflateSync(rawStream).toString('latin1');
    } catch (e1) {
      try {
        decompressed = zlib.inflateRawSync(rawStream).toString('latin1');
      } catch (e2) {
        // Not compressed or unsupported compression
        decompressed = match[1];
      }
    }

    if (!decompressed) continue;

    // Extract text from TJ arrays: [(text) 120 (more text)] TJ
    const tjRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const inner = tjMatch[1];
      const stringMatches = inner.match(/\(([^()]*)\)/g);
      if (stringMatches) {
        const line = stringMatches
          .map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
          .join('');
        if (line.trim().length > 0) {
          extractedLines.push(line.trim());
        }
      }
    }

    // Extract text from single Tj: (text) Tj
    const singleTjRegex = /\(([^()]*)\)\s*Tj/g;
    let singleMatch;
    while ((singleMatch = singleTjRegex.exec(decompressed)) !== null) {
      const line = singleMatch[1].replace(/\\([()\\])/g, '$1').trim();
      if (line.length > 0) {
        extractedLines.push(line);
      }
    }

    // Extract hex strings in Tj or TJ: <48656c6c6f> Tj
    const hexTjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let hexMatch;
    while ((hexMatch = hexTjRegex.exec(decompressed)) !== null) {
      const hex = hexMatch[1];
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (code >= 32 && code <= 126) decoded += String.fromCharCode(code);
      }
      if (decoded.trim().length > 0) {
        extractedLines.push(decoded.trim());
      }
    }
  }

  // Deduplicate consecutive lines and join
  const cleanLines = extractedLines.filter((l, idx) => l !== extractedLines[idx - 1]);
  return {
    rawLineCount: extractedLines.length,
    fullText: cleanLines.join('\n'),
    sampleLines: cleanLines.slice(0, 30)
  };
}

// Deterministic regexes from portal/lib/gmail/parser.ts
const FOLDER_CODE_REGEX = /(?:^|[^a-zA-Z0-9])((?:C|IT|TL|EA|EM|ET|EXP|IMP|L)\d{3,5})(?=[^a-zA-Z0-9]|$)/gi;
const CONTAINER_NUMBER_REGEX = /\b([A-Z]{4}\d{7})\b/g;
const BL_NUMBER_PREFIXED_REGEX = /(?:MBL|HBL|BL|HAWB|MAWB|B\/L|BILL OF LADING)[:\s/#-]*([A-Z0-9]{6,20})/gi;

function parseLogisticsMetadata(text) {
  if (!text) return { folderCodes: [], containerNumbers: [], blNumbers: [] };

  const folderCodes = new Set();
  let fMatch;
  const fRegex = new RegExp(FOLDER_CODE_REGEX.source, 'gi');
  while ((fMatch = fRegex.exec(text)) !== null) {
    if (fMatch[1]) folderCodes.add(fMatch[1].toUpperCase());
  }

  const containerNumbers = new Set();
  const cMatches = text.match(CONTAINER_NUMBER_REGEX);
  if (cMatches) {
    cMatches.forEach(c => containerNumbers.add(c.trim().toUpperCase()));
  }

  const blNumbers = new Set();
  let blMatch;
  const blRegex = new RegExp(BL_NUMBER_PREFIXED_REGEX.source, 'gi');
  while ((blMatch = blRegex.exec(text)) !== null) {
    if (blMatch[1] && blMatch[1].length >= 6) blNumbers.add(blMatch[1].toUpperCase());
  }

  return {
    folderCodes: Array.from(folderCodes),
    containerNumbers: Array.from(containerNumbers),
    blNumbers: Array.from(blNumbers)
  };
}

async function main() {
  const credentialsPath = 'credentials/credentials.json';
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found at ${credentialsPath}`);
  }

  const keyData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  const mailboxes = [
    'vmeggiolaro@almarrosario.com',
    'nhermoso@almarrosario.com',
    'astampfli@almarrosario.com',
    'srossi@almarrosario.com',
    'agomez@almarrosario.com',
    'llaje@almarrosario.com'
  ];

  const targetFolders = ['C1289', 'IT1486', 'EA1561', 'C1471', 'C1234', 'C1449', 'C1482', 'C1024', 'C1434'];

  const resultsDir = 'data/real_attachments';
  fs.mkdirSync(resultsDir, { recursive: true });

  const mailboxStatus = [];
  const folderFindings = {};
  const downloadedPdfs = [];
  const allMessageRecords = [];

  console.log('='.repeat(80));
  console.log('🚀 INICIANDO PRUEBA INTEGRAL LIVE GMAIL & PIPELINE ALMAR ROSARIO');
  console.log('='.repeat(80));

  // STEP 1: Test connection on all 6 mailboxes
  console.log('\n--- FASE 1: Verificación de acceso y autenticación en las 6 casillas ---');
  const tokens = {};
  for (const email of mailboxes) {
    process.stdout.write(`Testing ${email.padEnd(32)} ... `);
    try {
      const token = await getAccessToken(keyData, email);
      tokens[email] = token;

      const profileRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(`Profile query failed: ${JSON.stringify(profileData)}`);
      }

      console.log(`✅ OK | Messages: ${profileData.messagesTotal}, Threads: ${profileData.threadsTotal}, HistoryId: ${profileData.historyId}`);
      mailboxStatus.push({
        email,
        status: 'SUCCESS',
        messagesTotal: profileData.messagesTotal,
        threadsTotal: profileData.threadsTotal,
        historyId: profileData.historyId
      });
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      mailboxStatus.push({
        email,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  // STEP 2: Query for folder codes across all active mailboxes
  console.log('\n--- FASE 2: Búsqueda de Carpetas Objetivo en las Casillas ---');
  for (const folder of targetFolders) {
    folderFindings[folder] = {
      folder,
      messagesFound: 0,
      mailboxesWithHits: [],
      threads: []
    };

    console.log(`\n🔍 Buscando carpeta [${folder}]...`);

    for (const email of mailboxes) {
      if (!tokens[email]) continue;
      const token = tokens[email];

      try {
        const q = encodeURIComponent(`"${folder}" OR ${folder}`);
        const searchRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const searchData = await searchRes.json();
        const messages = searchData.messages || [];

        if (messages.length > 0) {
          folderFindings[folder].messagesFound += messages.length;
          folderFindings[folder].mailboxesWithHits.push(email);
          console.log(`  📬 ${email}: ${messages.length} mensaje(s)`);

          for (const m of messages) {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            const getH = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

            const subject = getH('Subject');
            const from = getH('From');
            const to = getH('To');
            const date = getH('Date');
            const snippet = detail.snippet || '';

            // Extract attachments
            const attachments = [];
            function traverseParts(parts) {
              if (!parts) return;
              for (const p of parts) {
                if (p.filename && p.filename.length > 0) {
                  attachments.push({
                    filename: p.filename,
                    mimeType: p.mimeType,
                    size: p.body?.size || 0,
                    attachmentId: p.body?.attachmentId
                  });
                }
                if (p.parts) traverseParts(p.parts);
              }
            }
            traverseParts(detail.payload?.parts);

            // Parse logistics codes
            const detectedLogistics = parseLogisticsMetadata(`${subject} ${snippet} ${attachments.map(a => a.filename).join(' ')}`);

            const msgRecord = {
              folder,
              mailbox: email,
              messageId: m.id,
              threadId: m.threadId,
              subject,
              from,
              to,
              date,
              snippet,
              attachments,
              detectedLogistics
            };

            folderFindings[folder].threads.push(msgRecord);
            allMessageRecords.push(msgRecord);

            // Download PDF attachments if present and we haven't reached limit
            for (const att of attachments) {
              if (att.filename.toLowerCase().endsWith('.pdf') && att.attachmentId && downloadedPdfs.length < 15) {
                try {
                  const attRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}/attachments/${att.attachmentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  const attData = await attRes.json();
                  if (attData.data) {
                    const pdfBuffer = Buffer.from(attData.data, 'base64url');
                    const safeName = `${folder}_${email.split('@')[0]}_${att.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                    const targetFilePath = path.join(resultsDir, safeName);
                    fs.writeFileSync(targetFilePath, pdfBuffer);

                    console.log(`    💾 Guardado PDF: ${safeName} (${pdfBuffer.length} bytes)`);

                    // Extract PDF Text
                    const textExtract = extractTextFromPdf(pdfBuffer);
                    const logisticsInPdf = parseLogisticsMetadata(textExtract.fullText);

                    downloadedPdfs.push({
                      folder,
                      mailbox: email,
                      originalFilename: att.filename,
                      savedPath: targetFilePath,
                      sizeBytes: pdfBuffer.length,
                      messageId: m.id,
                      subject: subject,
                      date: date,
                      rawLineCount: textExtract.rawLineCount,
                      sampleLines: textExtract.sampleLines.slice(0, 15),
                      fullTextPreview: textExtract.fullText.substring(0, 400),
                      logisticsInPdf
                    });
                  }
                } catch (attErr) {
                  console.log(`    ⚠️ Error descargando adjunto ${att.filename}: ${attErr.message}`);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`  ⚠️ Error consultando ${email} para ${folder}: ${err.message}`);
      }
    }
  }

  // STEP 3: Summary and export
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN FINAL DE EJECUCIÓN');
  console.log('='.repeat(80));
  console.log(`- Total Casillas Auditadas: ${mailboxStatus.length} (${mailboxStatus.filter(m => m.status === 'SUCCESS').length} activas)`);
  console.log(`- Total Mensajes Extraídos: ${allMessageRecords.length}`);
  console.log(`- Total PDFs Descargados y Analizados: ${downloadedPdfs.length}`);

  const summaryData = {
    executionTimestamp: new Date().toISOString(),
    mailboxStatus,
    targetFolderSummary: Object.keys(folderFindings).map(f => ({
      folder: f,
      messagesFound: folderFindings[f].messagesFound,
      mailboxes: folderFindings[f].mailboxesWithHits,
      threadCount: folderFindings[f].threads.length
    })),
    downloadedPdfs,
    folderFindings
  };

  fs.writeFileSync('data/live_gmail_extraction_results.json', JSON.stringify(summaryData, null, 2));
  console.log('💾 Resultados guardados en data/live_gmail_extraction_results.json');
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
