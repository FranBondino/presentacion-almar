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

function decodeBody(part) {
  if (!part) return '';
  if (part.body && part.body.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf8');
  }
  if (part.parts) {
    return part.parts.map(decodeBody).join('\n');
  }
  return '';
}

async function dumpEmails() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const token = await getAccessToken(keyData, 'jarloro@almarrosario.com');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent('SOLICITUD DE PRESUPUESTO DE FLETE MARÍTIMO - PROVEEDOR GUILIN WOODPECKER'),
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const data = await res.json();
  console.log(`Found ${(data.messages || []).length} messages in jarloro mailbox:`);

  for (const m of (data.messages || [])) {
    const detailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
      { headers: { Authorization: 'Bearer ' + token } }
    );
    const detail = await detailRes.json();
    const headers = detail.payload?.headers || [];
    const getH = name => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';
    
    console.log('\n======================================================');
    console.log('ID:', m.id);
    console.log('Date:', getH('date'));
    console.log('From:', getH('from'));
    console.log('To:', getH('to'));
    console.log('Cc:', getH('cc'));
    console.log('Subject:', getH('subject'));
    console.log('--- Body ---');
    const body = decodeBody(detail.payload);
    // Strip HTML tags for clean reading
    const cleanBody = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(cleanBody.slice(0, 1500));
  }
}

dumpEmails().catch(console.error);
