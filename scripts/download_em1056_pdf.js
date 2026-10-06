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

  const msgId = '19e516f5ae020249';
  const attId = 'ANGjdJ9koNLSJNQ4vVC6ezo4uU_f1cvZMNEW4RSiYtUA3p-LuOfdnpOjjP0YtQV7ORWUFlmFIhCsBuEho7fvhtvcUpF-9KFvd-NA68KDleGxG9ILE8Q9r_iptVBHlI8Pbl3CTvgVjdqNu68UiRg-9SgEDVHTpwJ3hFcbyw02U2WKlN7_clk1XqbglYyhX-OubnY7d9GYad_1XhdQCO2I7EK4JibjH1ec3wDbrPl1dh1i8bb7xbNYgV9IOL6AtgZiCT8ZfJfZG100nKQFRbzd04lwvMtBhOaf6ktG_dxpNcYfsz03EqxG15Eqeepr2azRyuhZRL4XCR3OEHGk8qIL-AC75aO6KGPsq_lH79PTST9QFN0AsfI0xf5ocodbU3ptU9Wdg-9TktXWST1MhP1o';

  console.log('Downloading attachment EM-00001056.pdf...');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/attachments/${attId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data.data) {
    const pdfBuf = Buffer.from(data.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const outPath = path.join('.agents', 'teamwork', 'explorer_forensic_a', 'EM-00001056.pdf');
    fs.writeFileSync(outPath, pdfBuf);
    console.log(`Saved ${outPath} (${pdfBuf.length} bytes)`);

    // Let's inspect text inside PDF
    // Try simple regex or pdf-parse if available
    try {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(pdfBuf);
      console.log('=== PDF PARSED TEXT ===\n', parsed.text);
      fs.writeFileSync(path.join('.agents', 'teamwork', 'explorer_forensic_a', 'EM-00001056_text.txt'), parsed.text, 'utf8');
    } catch (e) {
      console.log('pdf-parse not available, extracting raw strings:');
      const str = pdfBuf.toString('binary');
      const matches = str.match(/\(([^()]+)\)/g);
      if (matches) {
        console.log(matches.slice(0, 100).join(' '));
      }
    }
  } else {
    console.error('Failed to get attachment data:', data);
  }
}

run().catch(console.error);
