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

  const queries = [
    '0002-00001552',
    'HLCUBU3260505928',
    'EM1056',
    'UACU5962030'
  ];

  for (const q of queries) {
    console.log('\n====================================================');
    console.log('Querying srossi for: ' + q);
    console.log('====================================================');
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent(q), {
      headers: { Authorization: 'Bearer ' + token }
    });
    const d = await res.json();
    console.log('Results count:', d.messages?.length);
    if (d.messages) {
      for (const m of d.messages) {
        const mRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + m.id + '?format=full', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const md = await mRes.json();
        const headers = md.payload?.headers || [];
        const getH = (n) => (headers.find(h => h.name.toLowerCase() === n.toLowerCase()) || {}).value;
        console.log('---');
        console.log('ID: ' + md.id + ' | Date: ' + getH('Date'));
        console.log('From: ' + getH('From'));
        console.log('To: ' + getH('To'));
        console.log('Subj: ' + getH('Subject'));
        console.log('Snippet: ' + md.snippet);

        // check attachments
        function getAtts(p) {
          let a = [];
          if (p.filename && p.filename.length > 0) a.push({ name: p.filename, size: p.body?.size, attachmentId: p.body?.attachmentId });
          if (p.parts) p.parts.forEach(cp => { a = a.concat(getAtts(cp)); });
          return a;
        }
        const atts = getAtts(md.payload);
        if (atts.length > 0) console.log('Attachments:', atts);

        function getText(p) {
          let t = '';
          if (p.mimeType === 'text/plain' && p.body && p.body.data) {
            t += Buffer.from(p.body.data, 'base64').toString('utf8');
          }
          if (p.parts) p.parts.forEach(cp => { t += getText(cp); });
          return t;
        }
        const text = getText(md.payload);
        if (text && text.length > 0) {
          console.log('Text preview: ' + text.substring(0, 400).replace(/\s+/g, ' '));
        }
      }
    }
  }
}

run().catch(console.error);
