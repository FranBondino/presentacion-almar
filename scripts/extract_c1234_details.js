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

async function extractFullHistory(folderRef) {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'nhermoso@almarrosario.com',
    'srossi@almarrosario.com',
    'dsilvi@almarrosario.com',
    'vmeggiolaro@almarrosario.com',
    'llaje@almarrosario.com',
    'atalaban@almarrosario.com'
  ];

  const results = [];

  for (const user of users) {
    try {
      const token = await getAccessToken(keyData, user);
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(folderRef)}&maxResults=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      for (const m of (data.messages || [])) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

        const attachments = [];
        function parseParts(parts) {
          for (const p of parts) {
            if (p.filename && p.filename.length > 0) {
              attachments.push({ filename: p.filename, mimeType: p.mimeType, size: p.body?.size });
            }
            if (p.parts) parseParts(p.parts);
          }
        }
        if (detail.payload?.parts) parseParts(detail.payload.parts);

        results.push({
          mailbox: user,
          id: m.id,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: detail.snippet,
          attachments
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Deduplicar por Subject + Date
  const unique = [];
  const seen = new Set();
  for (const r of results) {
    const key = `${r.subject}_${r.date}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  unique.sort((a, b) => new Date(a.date) - new Date(b.date));

  fs.writeFileSync('scripts/c1234_audit_data.json', JSON.stringify(unique, null, 2));
  console.log(`✅ Guardados ${unique.length} eventos únicos para ${folderRef}`);
}

extractFullHistory('C1234');
