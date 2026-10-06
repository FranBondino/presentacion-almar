const fs = require('fs');
const crypto = require('crypto');

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

async function searchTruckingInvoices() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'srossi@almarrosario.com',
    'dsilvi@almarrosario.com',
    'nhermoso@almarrosario.com',
    'astampfli@almarrosario.com',
    'atalaban@almarrosario.com'
  ];

  const queries = [
    'transporte OR camion OR "flete terrestre" OR chofer filename:pdf',
    'factura transporte filename:pdf',
    'terrestre filename:pdf'
  ];

  console.log('🚛 Buscando facturas de transporte terrestre / camión en las casillas...');
  const found = [];

  for (const user of users) {
    console.log(`\n🔍 Escaneando casilla: ${user}`);
    try {
      const token = await getAccessToken(keyData, user);
      for (const q of queries) {
        const searchRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=8`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const searchData = await searchRes.json();
        const messages = searchData.messages || [];

        for (const msg of messages) {
          if (found.some(f => f.id === msg.id)) continue;
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

          const parts = msgData.payload?.parts || [];
          const pdfAttachments = [];
          
          function findPdfs(partList) {
            for (const p of partList) {
              if (p.filename && p.filename.toLowerCase().endsWith('.pdf')) {
                pdfAttachments.push({ filename: p.filename, attachmentId: p.body?.attachmentId, size: p.body?.size });
              }
              if (p.parts) findPdfs(p.parts);
            }
          }
          findPdfs(parts);

          const item = {
            user,
            id: msg.id,
            from: getHeader('From'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            snippet: msgData.snippet,
            pdfAttachments
          };
          found.push(item);
          console.log(`  ✉️ [${item.date}] De: ${item.from}`);
          console.log(`     Asunto: ${item.subject}`);
          console.log(`     Adjuntos PDF: ${pdfAttachments.map(p => p.filename).join(', ')}`);
        }
      }
    } catch (e) {
      console.error(`Error en ${user}:`, e.message);
    }
  }

  fs.writeFileSync('scripts/trucking_invoices_found.json', JSON.stringify(found, null, 2));
  console.log(`\n✅ Total de mensajes con posibles facturas de transporte terrestre encontrados: ${found.length}`);
}

searchTruckingInvoices();
