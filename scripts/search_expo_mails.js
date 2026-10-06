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
  return tokenData.access_token;
}

function decodeBody(part) {
  if (part.body && part.body.data) {
    return Buffer.from(part.body.data, 'base64url').toString('utf8');
  }
  if (part.parts) {
    return part.parts.map(decodeBody).join('\n');
  }
  return '';
}

async function searchExpoMails() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'jarloro@almarrosario.com',
    'astampfli@almarrosario.com',
    'atalaban@almarrosario.com',
    'nhermoso@almarrosario.com'
  ];

  console.log('Buscando correos para expo@almarrosario.com...');

  for (const user of users) {
    try {
      const token = await getAccessToken(keyData, user);
      // Query for messages to expo or containing maersk developer
      const q = 'to:expo@almarrosario.com (maersk OR developer OR integration OR "Multicotizador")';
      const searchRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      const messages = searchData.messages || [];
      console.log(`[${user}] Encontrados ${messages.length} mensajes.`);

      for (const msg of messages) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value;
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value;
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value;
        console.log(`\n------------------------------------------------------`);
        console.log(`Casilla: ${user} | Fecha: ${date}`);
        console.log(`De: ${from}`);
        console.log(`Asunto: ${subject}`);
        const body = decodeBody(msgData.payload);
        const clean = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        console.log(`Contenido:`, clean.slice(0, 500));
      }
    } catch(e) {
      console.log(`Error en ${user}:`, e.message);
    }
  }
}

searchExpoMails();
