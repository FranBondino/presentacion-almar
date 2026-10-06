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

async function fetchMessage(keyData, user, msgId) {
  const token = await getAccessToken(keyData, user);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const headers = data.payload?.headers || [];
  return {
    id: data.id,
    threadId: data.threadId,
    mailbox: user,
    subject: getHeader(headers, 'Subject'),
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    cc: getHeader(headers, 'Cc'),
    date: getHeader(headers, 'Date'),
    messageId: getHeader(headers, 'Message-ID'),
    snippet: data.snippet,
    body: extractBody(data.payload || {}),
    attachments: extractAttachments(data.payload || {})
  };
}

async function run() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));

  // 1. Fetch llaje messages for BUFF OR BUNKER Cuello
  const tokenLlaje = await getAccessToken(keyData, 'llaje@almarrosario.com');
  const res1 = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('BUFF OR BUNKER Cuello')}&maxResults=10`,
    { headers: { Authorization: `Bearer ${tokenLlaje}` } }
  );
  const d1 = await res1.json();

  console.log(`Descargando ${d1.messages?.length || 0} mensajes de llaje...`);
  const details = [];
  for (const m of (d1.messages || [])) {
    const full = await fetchMessage(keyData, 'llaje@almarrosario.com', m.id);
    details.push(full);
  }

  // 2. Fetch Cuello 367 in mfusco / vmeggiolaro
  for (const u of ['mfusco@almarrosario.com', 'vmeggiolaro@almarrosario.com']) {
    const token = await getAccessToken(keyData, u);
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('Cuello 367')}&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await res.json();
    for (const m of (d.messages || [])) {
      const full = await fetchMessage(keyData, u, m.id);
      details.push(full);
    }
  }

  fs.writeFileSync('scripts/cuello_deep_messages.json', JSON.stringify(details, null, 2), 'utf8');
  console.log('✅ Guardado scripts/cuello_deep_messages.json');
}

run().catch(console.error);
