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

async function downloadAndInspectPdf() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = ['nhermoso@almarrosario.com', 'srossi@almarrosario.com', 'dsilvi@almarrosario.com'];

  for (const user of users) {
    console.log(`🔍 Buscando facturas de Maersk de C1234 en ${user}...`);
    const token = await getAccessToken(keyData, user);
    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('7554566633')}&maxResults=3`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();
    const messages = searchData.messages || [];

    for (const msg of messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData = await msgRes.json();
      
      const parts = msgData.payload?.parts || [];
      for (const p of parts) {
        if (p.filename && p.filename.endsWith('.PDF')) {
          console.log(`📥 Descargando adjunto: ${p.filename} (ID: ${p.body.attachmentId})...`);
          const attachRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${p.body.attachmentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const attachData = await attachRes.json();
          const buffer = Buffer.from(attachData.data, 'base64url');
          fs.writeFileSync(`scripts/${p.filename}`, buffer);
          console.log(`💾 Guardado scripts/${p.filename} (${buffer.length} bytes)`);

          const pdfRaw = buffer.toString('utf8');
          console.log(`📄 Longitud buffer ${p.filename}: ${pdfRaw.length}`);
        }
      }
    }
  }
}

downloadAndInspectPdf();
