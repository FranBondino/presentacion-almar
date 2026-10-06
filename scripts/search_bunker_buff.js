const fs = require('fs');
const path = require('path');
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

async function queryGmail(user, query) {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  try {
    const token = await getAccessToken(keyData, user);
    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();
    return searchData.messages || [];
  } catch (e) {
    console.error(`Error querying ${user}:`, e.message);
    return [];
  }
}

async function searchLive() {
  const users = [
    'nhermoso@almarrosario.com',
    'vmeggiolaro@almarrosario.com',
    'srossi@almarrosario.com',
    'mfusco@almarrosario.com',
    'cdellamea@almarrosario.com',
    'llaje@almarrosario.com',
    'agomez@almarrosario.com'
  ];

  console.log('=== BUSCANDO EN GMAIL LIVE: "Cuello" "367" ===');
  for (const u of users) {
    const msgs = await queryGmail(u, 'Cuello 367');
    if (msgs.length > 0) {
      console.log(`[${u}] encontró ${msgs.length} mensajes para "Cuello 367"`);
    }
  }

  console.log('\n=== BUSCANDO EN GMAIL LIVE: "BUFF" OR "BUNKER" ===');
  for (const u of users) {
    const msgs = await queryGmail(u, 'BUFF OR BUNKER Cuello');
    if (msgs.length > 0) {
      console.log(`[${u}] encontró ${msgs.length} mensajes para "BUFF OR BUNKER Cuello"`);
    }
  }

  console.log('\n=== BUSCANDO EN GMAIL LIVE: "C1367" OR "367" en srossi / nhermoso / mfusco ===');
  for (const u of ['srossi@almarrosario.com', 'nhermoso@almarrosario.com', 'mfusco@almarrosario.com']) {
    const msgs = await queryGmail(u, '1367');
    console.log(`[${u}] encontró ${msgs.length} mensajes para "1367"`);
  }
}

searchLive().catch(console.error);
