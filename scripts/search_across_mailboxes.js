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

const mailboxes = [
  'administracion@almarrosario.com',
  'vmeggiolaro@almarrosario.com',
  'srossi@almarrosario.com',
  'jarloro@almarrosario.com',
  'vmoyano@almarrosario.com',
  'llaje@almarrosario.com',
  'csexp@almarrosario.com',
  'dsilvi@almarrosario.com',
  'astampfli@almarrosario.com',
  'nguida@almarrosario.com',
  'cdellamea@almarrosario.com',
  'agomez@almarrosario.com'
];

const targets = [
  { name: '1056 Desvío Hapag', id: '01cb01dbff01$79044950$6b0cdbf0$@almarrosario.com' },
  { name: '1056 Factura Net', id: '025a01dcab24$a554a930$effdfbb0$@almarrosario.com' },
  { name: '1134 Prontolog FC 6628', id: '004101dcea0a$ebb1c1a0$c31544e0$@prontologsrl.com' },
  { name: '1134 Russo FC 229', id: 'CAE80ZBRzPxxAetVaCdb0V00jCOAwEvLJaNkeQOCiUC13rSPXVg@mail.gmail.com' }
];

async function main() {
  const credentialsPath = path.join(process.cwd(), 'credentials/credentials.json');
  const keyData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  for (const t of targets) {
    console.log(`\nSearching for ${t.name} (${t.id})...`);
    let found = false;
    for (const mb of mailboxes) {
      try {
        const token = await getAccessToken(keyData, mb);
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=rfc822msgid:${encodeURIComponent(t.id)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          console.log(`  -> FOUND in mailbox: ${mb} (Gmail msg ID: ${data.messages[0].id})`);
          found = true;
          // Fetch full message
          const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.messages[0].id}?format=full`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const msgData = await msgRes.json();
          const headers = msgData.payload.headers || [];
          const getH = (n) => (headers.find(x => x.name.toLowerCase() === n.toLowerCase()) || {}).value;
          console.log(`     Subject: ${getH('Subject')}`);
          console.log(`     From: ${getH('From')}`);
          console.log(`     To: ${getH('To')}`);
          console.log(`     Date: ${getH('Date')}`);
          console.log(`     Snippet: ${msgData.snippet.slice(0, 100)}...`);
          break;
        }
      } catch (e) {
        // ignore
      }
    }
    if (!found) {
      console.log(`  -> NOT FOUND via rfc822msgid in any mailbox. Trying text query...`);
      // Try searching by subject or text keywords
      for (const mb of mailboxes) {
        try {
          const token = await getAccessToken(keyData, mb);
          let q = '';
          if (t.name.includes('1056')) q = '1056 SAPROGRAF';
          else if (t.name.includes('Prontolog')) q = 'PRONTOLOG 6628 OR "TRASLADO BINDER"';
          else if (t.name.includes('Russo')) q = 'RUSSO "229" OR "ET1134"';
          const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=3`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            console.log(`     Text search hit in ${mb}: found ${data.messages.length} msgs`);
            for (const m of data.messages) {
              const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const msgData = await msgRes.json();
              const headers = msgData.payload.headers || [];
              const getH = (n) => (headers.find(x => x.name.toLowerCase() === n.toLowerCase()) || {}).value;
              console.log(`       Msg-ID: ${getH('Message-ID')} | Subj: ${getH('Subject')} | Date: ${getH('Date')}`);
            }
            break;
          }
        } catch (e) {}
      }
    }
  }
}

main().catch(console.error);
