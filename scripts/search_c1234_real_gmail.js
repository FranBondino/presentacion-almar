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

async function searchMails() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const mailboxes = [
    'llaje@almarrosario.com',
    'jarloro@almarrosario.com',
    'nhermoso@almarrosario.com',
    'agomez@almarrosario.com',
    'vmoyano@almarrosario.com',
    'anoacco@almarrosario.com'
  ];

  console.log('=== 1. Searching for C1234 across real mailboxes ===');
  for (const mb of mailboxes) {
    try {
      const token = await getAccessToken(keyData, mb);
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent('C1234') + '&maxResults=10',
        { headers: { Authorization: 'Bearer ' + token } }
      );
      const data = await res.json();
      console.log(`Mailbox ${mb}: found ${(data.messages || []).length} messages for 'C1234'`);
      if (data.messages && data.messages.length > 0) {
        for (const m of data.messages.slice(0, 3)) {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`,
            { headers: { Authorization: 'Bearer ' + token } }
          );
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getH = name => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';
          console.log(`  - Date: ${getH('date')} | From: ${getH('from')} | Subject: ${getH('subject')}`);
        }
      }
    } catch (e) {
      console.error(`Error in ${mb}:`, e.message);
    }
  }

  console.log('\n=== 2. Searching for Acindar across real mailboxes ===');
  for (const mb of mailboxes) {
    try {
      const token = await getAccessToken(keyData, mb);
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent('Acindar') + '&maxResults=5',
        { headers: { Authorization: 'Bearer ' + token } }
      );
      const data = await res.json();
      console.log(`Mailbox ${mb}: found ${(data.messages || []).length} messages for 'Acindar'`);
      if (data.messages && data.messages.length > 0) {
        for (const m of data.messages.slice(0, 2)) {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: 'Bearer ' + token } }
          );
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getH = name => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';
          console.log(`  - Date: ${getH('date')} | From: ${getH('from')} | Subject: ${getH('subject')}`);
        }
      }
    } catch (e) {
      console.error(`Error in ${mb}:`, e.message);
    }
  }
}

searchMails().catch(console.error);
