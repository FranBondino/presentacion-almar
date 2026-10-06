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

async function searchMaersk() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'impo@almarrosario.com',
    'srossi@almarrosario.com',
    'dsilvi@almarrosario.com',
    'administracion@almarrosario.com',
    'vmeggiolaro@almarrosario.com'
  ];

  for (const user of users) {
    try {
      console.log(`\n=== Buscando en ${user} ===`);
      const token = await getAccessToken(keyData, user);
      
      const q = 'from:maersk.com OR "Price Owner" OR "Customer Code" OR "Código de Cliente" OR "10203482"';
      const searchRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      const messages = searchData.messages || [];
      console.log(`Encontrados ${messages.length} mensajes en ${user}`);

      for (const msg of messages.slice(0, 5)) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(sin asunto)';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '(sin remitente)';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
        console.log(`- [${date}] De: ${from} | Asunto: ${subject}`);
        console.log(`  Snippet: ${msgData.snippet?.slice(0, 150)}`);
      }
    } catch (err) {
      console.log(`Error buscando en ${user}:`, err.message);
    }
  }
}

searchMaersk();
