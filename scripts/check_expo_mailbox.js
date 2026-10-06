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
  if (!response.ok) {
    throw new Error(`Google Auth Error for ${impersonateEmail}: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function checkExpo() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  try {
    const token = await getAccessToken(keyData, 'expo@almarrosario.com');
    console.log('Token for expo OK!');
    const q = 'maersk OR developer';
    const searchRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent(q) + '&maxResults=10',
      { headers: { Authorization: 'Bearer ' + token } }
    );
    const data = await searchRes.json();
    console.log('Found messages in expo:', data.messages?.length || 0);
    for (const m of (data.messages || [])) {
      const msgRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + m.id + '?format=metadata', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const d = await msgRes.json();
      const sub = d.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value;
      const dt = d.payload?.headers?.find(h => h.name.toLowerCase() === 'date')?.value;
      const from = d.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value;
      console.log(`[${dt}] De: ${from} | Asunto: ${sub}`);
    }
  } catch (e) {
    console.log('Error expo:', e.message);
  }
}

checkExpo();
