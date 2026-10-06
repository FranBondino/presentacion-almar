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
  'dsilvi@almarrosario.com',
  'jarloro@almarrosario.com',
  'anoacco@almarrosario.com',
  'srossi@almarrosario.com',
  'agomez@almarrosario.com',
  'astampfli@almarrosario.com',
  'atalaban@almarrosario.com',
  'cdellamea@almarrosario.com',
  'mfusco@almarrosario.com',
  'llaje@almarrosario.com',
  'vmoyano@almarrosario.com'
];

async function verifyMsgId(rawMsgId, tokens) {
  const cleanId = rawMsgId.replace(/[<>]/g, '');
  const q = `rfc822msgid:${cleanId}`;

  for (const mbox of mailboxes) {
    try {
      const token = tokens[mbox];
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        const fullRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.messages[0].id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fullData = await fullRes.json();
        const headers = fullData.payload?.headers || [];
        const subj = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
        return { found: true, mailbox: mbox, id: data.messages[0].id, subject: subj, from, date };
      }
    } catch (e) {
      // ignore individual mbox error
    }
  }
  return { found: false };
}

async function main() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  console.log('Authenticating across mailboxes...');
  const tokens = {};
  for (const mbox of mailboxes) {
    try {
      tokens[mbox] = await getAccessToken(keyData, mbox);
    } catch (e) {
      console.log(`Failed auth for ${mbox}:`, e.message);
    }
  }

  const targetMsgIds = [
    '<05b701dcb195$04ab4950$0e01dbf0$@almarrosario.com>',
    '<CPTPR80MB6165551D151872C2820C1C2A9644A@CPTPR80MB6165.lamprd80.prod.outlook.com>',
    '<RO2PR80MB7780A746AB542DBCFB04B793BB4BA@RO2PR80MB7780.lamprd80.prod.outlook.com>',
    '<019801dcc11d$2a78bb80$7f6a3280$@almarrosario.com>',
    '<06a301dd109e$4f184250$ed48c6f0$@almarrosario.com>',
    '<01cb01dbff01$79044950$6b0cdbf0$@almarrosario.com>',
    '<53d541013cf3c8a82b37789038cdf63e@api.almarrosar.kipincargo.com>',
    '<01c201dcea2b$e2764f90$a762eeb0$@almarrosario.com>',
    '<00c201dc69ed$c95aa9c0$5c0ffd40$@almarrosario.com>',
    '<00d901dc69f4$0a42a9f0$1ec7fdd0$@almarrosario.com>',
    '<00d501dce922$c9302dd0$5b908970$@almarrosario.com>',
    '<004101dcea0a$ebb1c1a0$c31544e0$@prontologsrl.com>',
    '<019401dcea1d$3ebd8070$bc388150$@almarrosario.com>',
    '<0bed01dce92a$642c37f0$2c84a7d0$@almarrosario.com>',
    '<-1547909163.19912.1789763405894.JavaMail.SYSTEM@SRVECMXAP-PROD>',
    '<00c901dd49c3$8e6c3750$ab44a5f0$@almarrosario.com>',
    '<034301dd49e0$71214290$5363c7b0$@almarrosario.com>',
    '<BLAPR19MB4450C51605EBBDAE159D01E393842@BLAPR19MB4450.namprd19.prod.outlook.com>',
    '<-z6xbUM4StebreX97ROmtg@geopod-ismtpd-74>',
    '<5abe0f4d310c917fc5832189ba916071@rosario-conicet.gov.ar>',
    '<02d101dca691$299c7360$7cd55a20$@almarrosario.com>',
    '<CYXPR20MB6950D13D85436B2EA28AB11FA4802@CYXPR20MB6950.namprd20.prod.outlook.com>',
    '<025b01dd4d21$a389f5d0$ea9de170$@almarrosario.com>',
    '<107201dd4d26$bc9106e0$35b314a0$@almarrosario.com>',
    '<002601dd0afb$806c8e90$8145abb0$@almarrosario.com>',
    '<01f101dcff36$b0035ec0$100a1c40$@almarrosario.com>',
    '<03f201dc8985$4065eeb0$c131cc10$@almarrosario.com>',
    '<059101dd4d28$885c64d0$99152e70$@almarrosario.com>',
    '<0e4801dd4b7c$c68b78c0$53a26a40$@almarrosario.com>',
    '<123801dd4d2c$62ab34b0$28019e10$@almarrosario.com>',
    '<17cc01dd4d2e$6ea69c30$4bf3d490$@almarrosario.com>',
    '<097c01dd4d10$c5f24f70$51d6ee50$@almarrosario.com>',
    '<2026092420363327566324@timefreight.cn>',
    '<017e01dd4c2d$3da07c70$b8e17550$@almarrosario.com>',
    '<DS0PR19MB3924482A3CEFFD426A912E5906E2802@DS0PR19MB392448.namprd19.prod.outlook.com>',
    '<029101dd4c2b$7872ff50$6958fdf0$@almarrosario.com>',
    '<046b01dd4d1b$f2143810$d63ca830$@almarrosario.com>',
    '<042d01dd4d01$cfcf2c70$6f6d8550$@almarrosario.com>',
    '<046101dd4d1a$45709f00$d051dd00$@almarrosario.com>',
    '<07e501dd422b$6e3f92f0$4abeb8d0$@almarrosario.com>',
    '<PH7PR14MB58470BCDEED5DFDAFBF91AA9A9002@PH7PR14MB5847.namprd14.prod.outlook.com>',
    '<00c201dd1a0b$62bdc7f0$283957d0$@almarrosario.com>',
    '<057d01dd0e3d$d1928fa0$74b7aee0$@almarrosario.com>',
    '<059101dd0e3d$f8dd75c0$ea986140$@almarrosario.com>'
  ];

  console.log(`Verifying ${targetMsgIds.length} key Message-IDs...`);
  let passed = 0;
  let failed = 0;

  for (const mid of targetMsgIds) {
    const res = await verifyMsgId(mid, tokens);
    if (res.found) {
      console.log(`[PASS] ${mid} -> (${res.mailbox}) "${res.subject}" by ${res.from}`);
      passed++;
    } else {
      console.log(`[FAIL] ${mid} NOT FOUND in checked mailboxes!`);
      failed++;
    }
  }

  console.log(`\nSUMMARY: Passed ${passed} / ${targetMsgIds.length} | Failed: ${failed}`);
}

main().catch(console.error);
