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

async function inspectNataliInbox() {
  console.log('=' .repeat(70));
  console.log('👑 ALMAR - Inspección de Casilla de Natali Hermoso (nhermoso@almarrosario.com)');
  console.log('=' .repeat(70));

  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));

  try {
    const token = await getAccessToken(keyData, 'nhermoso@almarrosario.com');
    console.log('✅ Conexión exitosa a la casilla de Natali Hermoso!');

    const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    const messages = listData.messages || [];

    console.log(`📬 Se obtuvieron los últimos ${messages.length} correos de Natali:\n`);

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '(sin dato)';

      const parts = msgData.payload?.parts || [];
      const attachments = parts
        .filter(p => p.filename && p.filename.length > 0)
        .map(p => p.filename);

      console.log(`📌 MENSAJE #${i + 1}:`);
      console.log(`   De:       ${getHeader('From')}`);
      console.log(`   Para:     ${getHeader('To')}`);
      console.log(`   Asunto:   ${getHeader('Subject')}`);
      console.log(`   Fecha:    ${getHeader('Date')}`);
      console.log(`   Resumen:  ${(msgData.snippet || '').substring(0, 140)}...`);
      if (attachments.length > 0) {
        console.log(`   📎 Adjuntos: ${attachments.join(', ')}`);
      }
      console.log('-'.repeat(70));
    }
  } catch (err) {
    console.error('❌ Error en casilla de Natali:', err.message);
  }
}

inspectNataliInbox();
