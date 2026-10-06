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

function extractAttachments(payload) {
  const attachments = [];
  function rec(p) {
    if (p.filename && p.filename.length > 0) {
      attachments.push({
        filename: p.filename,
        mimeType: p.mimeType,
        size: p.body?.size
      });
    }
    if (p.parts) {
      for (const sp of p.parts) rec(sp);
    }
  }
  rec(payload);
  return attachments;
}

async function searchCuelloStrict() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const users = [
    'cdellamea@almarrosario.com',
    'agomez@almarrosario.com',
    'mfusco@almarrosario.com',
    'llaje@almarrosario.com',
    'srossi@almarrosario.com',
    'nhermoso@almarrosario.com'
  ];

  const allCuello = [];

  for (const u of users) {
    const token = await getAccessToken(keyData, u);
    // Buscamos "Cuello" y términos relacionados
    const queries = ['"Cuello"', '"1367"', '"367"'];
    for (const q of queries) {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      for (const m of (data.messages || [])) {
        allCuello.push({ user: u, id: m.id });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  const unique = allCuello.filter(x => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });

  console.log(`Mensajes únicos encontrados: ${unique.length}`);
  const details = [];

  for (const item of unique) {
    const token = await getAccessToken(keyData, item.user);
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const headers = data.payload?.headers || [];
    const subj = getHeader(headers, 'Subject');
    const body = extractBody(data.payload || {});

    // Filter to those that mention Cuello or 367 or 1367
    const txt = `${subj} ${body}`.toLowerCase();
    if (txt.includes('cuello') || txt.includes('367') || txt.includes('1367')) {
      details.push({
        id: data.id,
        mailbox: item.user,
        date: getHeader(headers, 'Date'),
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        subject: subj,
        messageId: getHeader(headers, 'Message-ID'),
        body: body,
        attachments: extractAttachments(data.payload || {})
      });
    }
  }

  console.log(`Detalles relevantes filtrados: ${details.length}`);
  fs.writeFileSync('scripts/cuello_strict_details.json', JSON.stringify(details, null, 2), 'utf8');
  console.log('✅ Guardado scripts/cuello_strict_details.json');
}

searchCuelloStrict().catch(console.error);
