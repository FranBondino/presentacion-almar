const fs = require('fs');
const crypto = require('crypto');

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
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

  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  });

  const tokenData = await response.json();
  if (!response.ok) {
    throw new Error(`Google Auth Error for ${impersonateEmail}: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function deepAuditFolder(folderQuery) {
  console.log(`\n🔍 ================================================================`);
  console.log(`📂 AUDITANDO CARPETA: ${folderQuery}`);
  console.log(`================================================================\n`);

  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'nhermoso@almarrosario.com',
    'vmeggiolaro@almarrosario.com',
    'srossi@almarrosario.com',
    'dsilvi@almarrosario.com',
    'llaje@almarrosario.com',
    'atalaban@almarrosario.com',
    'astampfli@almarrosario.com'
  ];

  const allMessages = [];

  for (const user of users) {
    try {
      const token = await getAccessToken(keyData, user);
      const searchRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(folderQuery)}&maxResults=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      const messages = searchData.messages || [];

      console.log(`👤 Casilla ${user}: ${messages.length} mensajes encontrados`);

      for (const m of messages) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

        const parts = detail.payload?.parts || [];
        const attachments = [];
        function extractParts(partList) {
          for (const p of partList) {
            if (p.filename && p.filename.length > 0) {
              attachments.push({ filename: p.filename, mimeType: p.mimeType, size: p.body?.size });
            }
            if (p.parts) extractParts(p.parts);
          }
        }
        extractParts(parts);

        allMessages.push({
          mailbox: user,
          id: m.id,
          threadId: m.threadId,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: detail.snippet,
          attachments: attachments
        });
      }
    } catch (err) {
      console.error(`Error buscando en ${user}:`, err.message);
    }
  }

  // Deduplicar por threadId o Subject similar
  console.log(`\n📊 Total de mensajes recopilados para ${folderQuery}: ${allMessages.length}`);
  
  // Ordenar cronológicamente
  allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));

  allMessages.forEach((m, idx) => {
    console.log(`\n--- [Paso ${idx + 1}] (${m.mailbox}) ---`);
    console.log(`📅 Fecha:   ${m.date}`);
    console.log(`✉️ De:      ${m.from}`);
    console.log(`🎯 Asunto:  ${m.subject}`);
    console.log(`📝 Snippet: ${m.snippet.substring(0, 150)}...`);
    if (m.attachments.length > 0) {
      console.log(`📎 Adjuntos: ${m.attachments.map(a => `${a.filename} (${a.mimeType})`).join(', ')}`);
    }
  });

  return allMessages;
}

async function run() {
  const foldersToTest = ['C1234', 'C1434', 'C1083', 'IT1486', 'C1506'];
  for (const f of foldersToTest) {
    await deepAuditFolder(f);
  }
}

run();
