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

  // 1. Download FCA 0002-00001553
  const msg1553 = '19e51651332bead1';
  const att1553 = 'ANGjdJ_lXp1FUAFwrH8SHBHEOQ4TIKXMKbHJ_uH-YeAU_UL7lSl6IuVgjguSPFUdoIrAZM_gmckSceI6wGNumGrkJJoMVQn7QcCXjLFJOzt_GZs-J09bWcw2AeEk1kFU1DXylSOj7QGJrqmOb6iFugMD6GJh-DvrNXqbsl7UWXzUtNQgmUtaFWFkDX6uGpu4sgUlTmKPA63eI_bCTd_zxCjL3Cw6UDsw9awqN6ZQXm4Eo_TB3JYkdzuA3wLhEdbhCXwmou3USS4KxR4GltRDOr6yj3JXqodrmaEMiKqn9eew1jQzQYDAoLc2VuEAHHuJzYLIsiOR1fHldtcXxNeQysJ5ZMFt61HYjIwsOYqeU7z0fBFts9rZB61TpZcoo4EG6SRlWmc31fZ_mYi9lbJu';

  console.log('Downloading Pre Factura FCA 0002-00001553.pdf...');
  const res1 = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg1553}/attachments/${att1553}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data1 = await res1.json();
  if (data1.data) {
    const pdfBuf = Buffer.from(data1.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const outPath = path.join('.agents', 'teamwork', 'explorer_forensic_a', 'Pre_Factura_FCA_0002-00001553.pdf');
    fs.writeFileSync(outPath, pdfBuf);
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(pdfBuf);
    console.log('=== FCA 1553 PARSED TEXT ===\n', parsed.text);
    fs.writeFileSync(path.join('.agents', 'teamwork', 'explorer_forensic_a', 'Pre_Factura_FCA_0002-00001553_text.txt'), parsed.text, 'utf8');
  }

  // 2. Download Logexpor invoice from 19e4bc16d63047fb
  const msgLogexpor = '19e4bc16d63047fb';
  const attLogexpor = 'ANGjdJ_na42vrGZPr4B5hpeOnA-C8WrmOEqNx3Fd_vF7-66Rgug4pJQN8cNFkVSJuVow6bYo1wgcXxVpwgtqy6k4p0HcbO9ioFB5TCJu4gOzZJAhLm9sOwp-li2WEnrMmaL_UvcRYASIScQKxYX1c2_M8K6JrZzP98rg-Ew6uyFuwS_09VKVUdkb0Tsv4FzspSdsecGuFbKnkw3pjj0JOqA7jtwTC4gHJmF4JkZcSXjuyGPhR6pNLxOKQVEetrXdAC_mWRtebzafQd7LB-7F_jkMeqJKck1CSQRkVmsHF6EOAOozKP7HOtUh8J2Gb69ozCO1mtm0tTf8MlMcYG4egxhmh8Q7c3vtvz6x9lw-nFSWIfPcCiMp3EJEalhLERWX33uD9w-c8nr9KrlUtRIy';

  console.log('Downloading Logexpor invoice...');
  const res2 = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgLogexpor}/attachments/${attLogexpor}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data2 = await res2.json();
  if (data2.data) {
    const pdfBuf = Buffer.from(data2.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const outPath = path.join('.agents', 'teamwork', 'explorer_forensic_a', 'Factura_LOGEXPOR_35248.pdf');
    fs.writeFileSync(outPath, pdfBuf);
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(pdfBuf);
    console.log('=== LOGEXPOR INVOICE PARSED TEXT ===\n', parsed.text);
    fs.writeFileSync(path.join('.agents', 'teamwork', 'explorer_forensic_a', 'Factura_LOGEXPOR_35248_text.txt'), parsed.text, 'utf8');
  }
}

run().catch(console.error);
