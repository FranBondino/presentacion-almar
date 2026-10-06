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
    throw new Error(`Google Auth Error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

function getHeader(headers, name) {
  const h = (headers || []).find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

function extractBody(payload) {
  let bodyText = '';
  if (payload.body && payload.body.data) {
    bodyText += Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        bodyText += '\n' + Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts) {
        bodyText += '\n' + extractBody(part);
      }
    }
  }
  return bodyText;
}

async function findBuff() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'nhermoso@almarrosario.com',
    'vmeggiolaro@almarrosario.com',
    'srossi@almarrosario.com',
    'mfusco@almarrosario.com',
    'cdellamea@almarrosario.com',
    'llaje@almarrosario.com',
    'agomez@almarrosario.com',
    'nguida@almarrosario.com'
  ];

  console.log('=== BUSCANDO "BUFF" EN TODAS LAS CASILLAS ===');
  for (const u of users) {
    const token = await getAccessToken(keyData, u);
    // Note: search for exact word "BUFF"
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=BUFF&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const msgs = data.messages || [];
    console.log(`[${u}]: ${msgs.length} mensajes con "BUFF"`);
    for (const m of msgs) {
      const dRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await dRes.json();
      const headers = d.payload?.headers || [];
      const subj = getHeader(headers, 'Subject');
      const body = extractBody(d.payload || {});
      console.log(`  -> ID: ${m.id} | Date: ${getHeader(headers, 'Date')} | Subj: ${subj}`);
      // Find where BUFF appears in body
      const idx = body.toLowerCase().indexOf('buff');
      if (idx !== -1) {
        console.log(`     Snippet: ...${body.substring(Math.max(0, idx - 50), Math.min(body.length, idx + 150)).replace(/\r?\n/g, ' ')}...`);
      }
    }
  }
}

findBuff().catch(console.error);
