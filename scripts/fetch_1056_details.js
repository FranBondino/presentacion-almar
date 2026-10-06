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
  const input = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(input);
  const sig = base64url(signer.sign(keyData.private_key));
  const jwt = input + '.' + sig;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }).toString()
  });
  const data = await res.json();
  return data.access_token;
}

async function run() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const token = await getAccessToken(keyData, 'srossi@almarrosario.com');

  const searchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=EM-00001056', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const searchData = await searchRes.json();
  console.log('Search in srossi for EM-00001056 count:', searchData.messages?.length);

  if (searchData.messages && searchData.messages.length > 0) {
    for (const sm of searchData.messages) {
      const mRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + sm.id + '?format=full', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const mData = await mRes.json();
      console.log('====================================================');
      console.log('ID:', mData.id);
      console.log('Snippet:', mData.snippet);
      function getText(p) {
        let t = '';
        if (p.mimeType === 'text/plain' && p.body && p.body.data) {
          t += Buffer.from(p.body.data, 'base64').toString('utf8');
        }
        if (p.parts) p.parts.forEach(cp => { t += getText(cp); });
        return t;
      }
      function getAtts(p) {
        let a = [];
        if (p.filename && p.filename.length > 0) a.push({ name: p.filename, size: p.body?.size, attachmentId: p.body?.attachmentId });
        if (p.parts) p.parts.forEach(cp => { a = a.concat(getAtts(cp)); });
        return a;
      }
      console.log('Attachments:', getAtts(mData.payload));
      console.log('Text Body:\n', getText(mData.payload));
    }
  }
}

run().catch(console.error);
