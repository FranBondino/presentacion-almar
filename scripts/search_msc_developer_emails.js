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

async function searchMscEmails() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'jarloro@almarrosario.com',
    'astampfli@almarrosario.com',
    'atalaban@almarrosario.com',
    'nhermoso@almarrosario.com',
    'dsilvi@almarrosario.com',
    'srossi@almarrosario.com',
    'vmeggiolaro@almarrosario.com'
  ];

  console.log('Buscando correos de MSC Developer / Azure APIM...');
  for (const user of users) {
    try {
      const token = await getAccessToken(keyData, user);
      const q = 'azure-api.net OR "developerportal.msc.com" OR "MSC Developer"';
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const messages = data.messages || [];
      for (const m of messages) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const md = await msgRes.json();
        const sub = md.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || '';
        const dt = md.payload?.headers?.find(h => h.name.toLowerCase() === 'date')?.value || '';
        const from = md.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || '';
        console.log(`[${user}] [${dt}] De: ${from} | Asunto: ${sub}`);
      }
    } catch(e) {
      // ignore
    }
  }
}

searchMscEmails();
