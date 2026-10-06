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

  // Hapag Invoice 1: msg 19e42ae198805069, att ANGjdJ_WubIH436tIdT41Pi62KZgAqXH_DPkolnTduUAjUpE-G6nGNy32mrZasRpgYJLVhpXoLFuFepdG9tC6kr8C-cN0R7JehfHno_4LN0pTkQ09pUjKZgjA_r0G5HGuYTcERq3YTAkdG9rhZQH5lg3RBSnIK0XZmbjEzcjGWVTr_WC5ufi61FVDAf7DIG4J_gzc_P1Pf8nGodgphKZoqg-NvwDJMMoFDPIZb2twagdJJZYZGqPtH0nKomMiTOozB7PuZu7JPau0y6G1E4Vt6ix5Qm-fZgSSTUuTPgdQvaX61MdSaKELtsVcm-NDi1u5m5dUR6todocAZ4X7cL_HNjZ0a1Rv6DAQ6dvxK5FvM093qgcafAynimJGcPakm3yurLh0jTPv-imrKOooKKQ
  const msg1 = '19e42ae198805069';
  const att1 = 'ANGjdJ_WubIH436tIdT41Pi62KZgAqXH_DPkolnTduUAjUpE-G6nGNy32mrZasRpgYJLVhpXoLFuFepdG9tC6kr8C-cN0R7JehfHno_4LN0pTkQ09pUjKZgjA_r0G5HGuYTcERq3YTAkdG9rhZQH5lg3RBSnIK0XZmbjEzcjGWVTr_WC5ufi61FVDAf7DIG4J_gzc_P1Pf8nGodgphKZoqg-NvwDJMMoFDPIZb2twagdJJZYZGqPtH0nKomMiTOozB7PuZu7JPau0y6G1E4Vt6ix5Qm-fZgSSTUuTPgdQvaX61MdSaKELtsVcm-NDi1u5m5dUR6todocAZ4X7cL_HNjZ0a1Rv6DAQ6dvxK5FvM093qgcafAynimJGcPakm3yurLh0jTPv-imrKOooKKQ';

  const res1 = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg1}/attachments/${att1}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data1 = await res1.json();
  if (data1.data) {
    const pdfBuf = Buffer.from(data1.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    fs.writeFileSync('.agents/teamwork/explorer_forensic_a/Hapag_FC_01315779.pdf', pdfBuf);
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(pdfBuf);
    console.log('=== HAPAG FC 01315779 ===\n', parsed.text);
    fs.writeFileSync('.agents/teamwork/explorer_forensic_a/Hapag_FC_01315779_text.txt', parsed.text, 'utf8');
  }

  // Hapag Invoice 2: msg 19e42b3ddca61e09, att ANGjdJ8GeuLnejTNakxduYgEnAAG0ZbtoTPVjlXIe_qPHnTBne5507bqeYm9tfTrBk1B3CHfyrwmhG7eSVDRAnIln2CHSxbMD1GNb5dMSjoHgOq5oGgey0bM_8mlMN9TQTcw5tPCX4m6_ZHnmgb5vHd7Izd7lFhNvR_HYr096gtVsJnP9xpRUnV25VRN-yvMYXH8Ea6m-vn6cq_PZvC_ac1KaS9Deo1GfzkxTxHWatgSKMUtby4tqKtiIIAnRa_XZCBtGNN_Qt2_gmjZEZTelwwtfigbJu8FTCspsYhm8d6YOAdC5Xp0NV0YhEI1HEtkk74FQjH3-VVeIkl-oJPwTbg1LKJgJNvKufZYSrEq_kyiKxzv3Zz7EcaAE5CI4k515MsYbwsK8WaxXBWWZ7o2
  const msg2 = '19e42b3ddca61e09';
  const att2 = 'ANGjdJ8GeuLnejTNakxduYgEnAAG0ZbtoTPVjlXIe_qPHnTBne5507bqeYm9tfTrBk1B3CHfyrwmhG7eSVDRAnIln2CHSxbMD1GNb5dMSjoHgOq5oGgey0bM_8mlMN9TQTcw5tPCX4m6_ZHnmgb5vHd7Izd7lFhNvR_HYr096gtVsJnP9xpRUnV25VRN-yvMYXH8Ea6m-vn6cq_PZvC_ac1KaS9Deo1GfzkxTxHWatgSKMUtby4tqKtiIIAnRa_XZCBtGNN_Qt2_gmjZEZTelwwtfigbJu8FTCspsYhm8d6YOAdC5Xp0NV0YhEI1HEtkk74FQjH3-VVeIkl-oJPwTbg1LKJgJNvKufZYSrEq_kyiKxzv3Zz7EcaAE5CI4k515MsYbwsK8WaxXBWWZ7o2';

  const res2 = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg2}/attachments/${att2}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data2 = await res2.json();
  if (data2.data) {
    const pdfBuf = Buffer.from(data2.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    fs.writeFileSync('.agents/teamwork/explorer_forensic_a/Hapag_FC_01315780.pdf', pdfBuf);
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(pdfBuf);
    console.log('=== HAPAG FC 01315780 ===\n', parsed.text);
    fs.writeFileSync('.agents/teamwork/explorer_forensic_a/Hapag_FC_01315780_text.txt', parsed.text, 'utf8');
  }
}

run().catch(console.error);
