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
    throw new Error(`Google Auth Error for ${impersonateEmail}: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

// 1. Search cached files first
function searchCache() {
  console.log('--- BUSCANDO EN CACHE LOCAL ---');
  const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
  if (!fs.existsSync(cacheDir)) return;
  const files = fs.readdirSync(cacheDir);

  const keywords = ['367', 'cuello', 'buff', 'bunker', 'fundacion', 'quimica de rosario', 'iquir', 'gbp', 'libras'];

  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(cacheDir, f);
    const content = fs.readFileSync(p, 'utf8');
    const lower = content.toLowerCase();

    for (const kw of keywords) {
      if (lower.includes(kw)) {
        console.log(`Cache hit: [${kw}] in ${f}`);
      }
    }
  }
}

searchCache();
