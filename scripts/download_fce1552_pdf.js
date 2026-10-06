const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

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

  const msgId = '19e5162cd2c4ad4a';
  const attId = 'ANGjdJ83My2xUw_-y1iDknUkmJ6WoQxizeoJTxfUpBNiSRdAtFfh0LP7rN8ioUDWxlsgrEYxyMGewl9qMF0WV4V-EM_qWnncjTALk129HoypXglekw2khoO_Ft0AFvbWXXiMSpS3OQ5A-4ikEmvumuYoLU3X7wChOznT9bo1bVOyQtUdoTfpG3O2xG1ryBkMFdi2PnyO6wiPA6tNrbLp_2wB93yjfYkc9Zt3GmYtOKlHLC6Vyd0L4DQiAAxz5tq3neLXjbuVe0_wbbA_W-iDUZo6aapuTcMW5yZ23pJfAFVVn4LZI73v8leEBxRYUaNKwBqh5sYduIQKnt2WwOOcY91p4MHSSbLRElIH0-SAT_u3-BY1QBCfQDp1Db9oAp1vwma3i7AaXk2AEODmgMI8';

  console.log('Downloading Pre Factura FCE 0002-00001552.pdf...');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/attachments/${attId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data.data) {
    const pdfBuf = Buffer.from(data.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const outPath = path.join('.agents', 'teamwork', 'explorer_forensic_a', 'Pre_Factura_FCE_0002-00001552.pdf');
    fs.writeFileSync(outPath, pdfBuf);
    console.log(`Saved ${outPath} (${pdfBuf.length} bytes)`);

    try {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(pdfBuf);
      console.log('=== PDF PARSED TEXT ===\n', parsed.text);
      fs.writeFileSync(path.join('.agents', 'teamwork', 'explorer_forensic_a', 'Pre_Factura_FCE_0002-00001552_text.txt'), parsed.text, 'utf8');
    } catch (e) {
      console.log('pdf-parse error:', e.message);
    }
  } else {
    console.error('Failed to get attachment data:', data);
  }
}

run().catch(console.error);
