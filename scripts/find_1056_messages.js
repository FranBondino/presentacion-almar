const fs = require('fs');
const crypto = require('crypto');

function base64url(s) {
  return Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getT(key, user) {
  const now = Math.floor(Date.now() / 1000);
  const h = { alg: 'RS256', typ: 'JWT', kid: key.private_key_id };
  const p = {
    iss: key.client_email,
    sub: user,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const inp = base64url(JSON.stringify(h)) + '.' + base64url(JSON.stringify(p));
  const s = crypto.createSign('RSA-SHA256');
  s.update(inp);
  const sig = base64url(s.sign(key.private_key));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: inp + '.' + sig }).toString()
  });
  return (await res.json()).access_token;
}

async function search() {
  const key = JSON.parse(fs.readFileSync('credentials/credentials.json'));
  const mailboxes = ['llaje@almarrosario.com', 'vmoyano@almarrosario.com', 'astampfli@almarrosario.com', 'srossi@almarrosario.com'];
  
  for (const mb of mailboxes) {
    const token = await getT(key, mb);
    const queries = ['INDIGO', 'BUEG04585900', 'HLCUBU3260505928', 'maltuna@logexpor.com.ar', 'ops1@gamalog.com'];
    for (const q of queries) {
      const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent(q) + '&maxResults=5', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (r.ok) {
        const d = await r.json();
        if (d.messages && d.messages.length > 0) {
          console.log(`Query: "${q}" in ${mb} found: ${d.messages.length}`);
          for (const m of d.messages) {
            const mr = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + m.id + '?format=full', {
              headers: { Authorization: 'Bearer ' + token }
            });
            const md = await mr.json();
            const hdrs = md.payload.headers;
            const getH = (n) => (hdrs.find(x => x.name.toLowerCase() === n.toLowerCase()) || {}).value;
            console.log(`  ID: ${m.id} | Msg-ID: ${getH('Message-ID')} | Subj: ${getH('Subject')} | Date: ${getH('Date')}`);
            console.log(`  From: ${getH('From')} | To: ${getH('To')}`);
            console.log(`  Snippet: ${md.snippet.slice(0, 120)}...`);
            console.log('---');
          }
        }
      }
    }
  }
}

search().catch(console.error);
