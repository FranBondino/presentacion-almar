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

function parseMessage(msgData) {
  const headers = msgData.payload?.headers || [];
  const getH = (name) => {
    const h = headers.find(x => x.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  let textBody = '';
  let attachments = [];

  function walk(part) {
    if (!part) return;
    if (part.filename && part.filename.length > 0) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body ? part.body.size : null,
        attachmentId: part.body ? part.body.attachmentId : null
      });
    }
    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
      try {
        const decoded = Buffer.from(part.body.data, 'base64').toString('utf8');
        textBody += '\n' + decoded;
      } catch (e) {}
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(walk);
    }
  }

  walk(msgData.payload);

  return {
    id: msgData.id,
    threadId: msgData.threadId,
    messageId: getH('Message-ID'),
    date: getH('Date'),
    from: getH('From'),
    to: getH('To'),
    cc: getH('Cc'),
    subject: getH('Subject'),
    snippet: msgData.snippet,
    attachments,
    textBody: textBody.trim()
  };
}

async function fetchMessageById(mailbox, messageId, keyData) {
  const token = await getAccessToken(keyData, mailbox);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Fetch error ${res.status} for ${messageId} in ${mailbox}`);
  }
  const data = await res.json();
  return parseMessage(data);
}

async function searchMessage(mailbox, q, keyData) {
  const token = await getAccessToken(keyData, mailbox);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  const msgs = data.messages || [];
  const results = [];
  for (const m of msgs) {
    const full = await fetchMessageById(mailbox, m.id, keyData);
    results.push(full);
  }
  return results;
}

async function main() {
  const credentialsPath = path.join(process.cwd(), 'credentials/credentials.json');
  if (!fs.existsSync(credentialsPath)) {
    console.error('Credentials not found!');
    process.exit(1);
  }
  const keyData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  console.log('=== STARTING INDEPENDENT FORENSIC VERIFICATION ===\n');

  const testCases = [
    {
      case: 'Case 1: Carpeta 900 (Decaroli / Agroleite / Quantum)',
      mailbox: 'vmoyano@almarrosario.com',
      query: 'rfc822msgid:05b701dcb195$04ab4950$0e01dbf0$@almarrosario.com',
      expectedMsgId: '<05b701dcb195$04ab4950$0e01dbf0$@almarrosario.com>',
      expectedSubject: 'ROS GRU - Air / Consol // Decaroli - Agroleite // EA900'
    },
    {
      case: 'Case 1: Correo 1.3 Multa R$ 5.000 Quantum',
      mailbox: 'vmoyano@almarrosario.com',
      query: 'rfc822msgid:RO2PR80MB7780A746AB542DBCFB04B793BB4BA@RO2PR80MB7780.lamprd80.prod.outlook.com',
      expectedMsgId: '<RO2PR80MB7780A746AB542DBCFB04B793BB4BA@RO2PR80MB7780.lamprd80.prod.outlook.com>',
      expectedSubject: 'RE: ROS GRU - Air / Consol // Decaroli - Agroleite // EA900 - IA Agroleite - 8'
    },
    {
      case: 'Case 1: Correo 1.7 SOA EA-00000900 Standby',
      mailbox: 'vmoyano@almarrosario.com',
      query: 'rfc822msgid:06a301dd109e$4f184250$ed48c6f0$@almarrosario.com',
      expectedMsgId: '<06a301dd109e$4f184250$ed48c6f0$@almarrosario.com>',
      expectedSubject: 'RE: ROS GRU - Air / Consol // Decaroli - Agroleite // EA900 - IA Agroleite - 8'
    },
    {
      case: 'Case 2: Carpeta 1056 (Saprograf / Net LLC / Gamalog) - Desvío Hapag',
      mailbox: 'llaje@almarrosario.com',
      query: 'rfc822msgid:01cb01dbff01$79044950$6b0cdbf0$@almarrosario.com',
      expectedMsgId: '<01cb01dbff01$79044950$6b0cdbf0$@almarrosario.com>',
      expectedSubject: 'IM26046408 // IMPFCL26-265 || EM1056 || ||GLYT-14726 // SHP: SAPROGRAF SA - INDIGO 6K // CNE: SAPROGRAF SAS // FCL 1X40HC // BUE-CTG'
    },
    {
      case: 'Case 2: Correo 2.4 Emisión Factura Net EM-00001056',
      mailbox: 'srossi@almarrosario.com',
      query: 'rfc822msgid:025a01dcab24$a554a930$effdfbb0$@almarrosario.com',
      expectedMsgId: '<025a01dcab24$a554a930$effdfbb0$@almarrosario.com>',
      expectedSubject: 'RE: ** NET** Prefactura - FCE 0002-00001552 - CARPETA 1056 - GAMA'
    },
    {
      case: 'Case 3: Carpeta 590 (Mastergom / COMITRAL) - Unidad Liberada',
      mailbox: 'jarloro@almarrosario.com',
      query: 'rfc822msgid:CAE80ZBRyGDEHapp4Hy-o5i3G7GJq4_j=y0FJYgpq-3Jr36LxdQ@mail.gmail.com',
      expectedMsgId: '<CAE80ZBRyGDEHapp4Hy-o5i3G7GJq4_j=y0FJYgpq-3Jr36LxdQ@mail.gmail.com>',
      expectedSubject: 'IT590 MASTERGOM CARGA LIBERADA'
    },
    {
      case: 'Case 3: Correo 3.3 Liquidación y reclamo USD 628,59 a Sergio',
      mailbox: 'csexp@almarrosario.com',
      query: 'rfc822msgid:00d901dc69f4$0a42a9f0$1ec7fdd0$@almarrosario.com',
      expectedMsgId: '<00d901dc69f4$0a42a9f0$1ec7fdd0$@almarrosario.com>',
      expectedSubject: 'RE: DOCUMENTACION CRT 052AR373609477 // IT590'
    },
    {
      case: 'Case 4: Carpeta 1134 (Mastergom / ET1134) - Cobro en destino USD 986,55',
      mailbox: 'vmoyano@almarrosario.com',
      query: 'rfc822msgid:00d501dce922$c9302dd0$5b908970$@almarrosario.com',
      expectedMsgId: '<00d501dce922$c9302dd0$5b908970$@almarrosario.com>',
      expectedSubject: 'RE: DOCUMENTACION CRT 052AR373609571 // ET1134'
    },
    {
      case: 'Case 4: Correo 4.3 Factura Prontolog traslado Binder',
      mailbox: 'srossi@almarrosario.com',
      query: 'rfc822msgid:004101dcea0a$ebb1c1a0$c31544e0$@prontologsrl.com',
      expectedMsgId: '<004101dcea0a$ebb1c1a0$c31544e0$@prontologsrl.com>',
      expectedSubject: 'FACTURA PRONTOLOG SRL - TRASLADO BINDER MASTERGOM ET1134'
    },
    {
      case: 'Case 4: Correo 4.4 Factura FCA Mastergom Stefania',
      mailbox: 'srossi@almarrosario.com',
      query: 'rfc822msgid:019401dcea1d$3ebd8070$bc388150$@almarrosario.com',
      expectedMsgId: '<019401dcea1d$3ebd8070$bc388150$@almarrosario.com>',
      expectedSubject: 'ALMAR ROSARIO SRL // FACTURA FCA A 0002-00011832 // CARPETA ET1134'
    },
    {
      case: 'Case 4: Correo 4.5 Honorarios Hernán Russo FC 229',
      mailbox: 'jarloro@almarrosario.com',
      query: 'rfc822msgid:CAE80ZBRzPxxAetVaCdb0V00jCOAwEvLJaNkeQOCiUC13rSPXVg@mail.gmail.com',
      expectedMsgId: '<CAE80ZBRzPxxAetVaCdb0V00jCOAwEvLJaNkeQOCiUC13rSPXVg@mail.gmail.com>',
      expectedSubject: 'FC 229 - HONORARIOS DESPACHO FRONTERA ET1134 MASTERGOM'
    },
    {
      case: 'SWIFT Deducción USD 2.836,27 - Instrucción Juan Arloro',
      mailbox: 'vmeggiolaro@almarrosario.com',
      query: 'rfc822msgid:0bed01dce92a$642c37f0$2c84a7d0$@almarrosario.com',
      expectedMsgId: '<0bed01dce92a$642c37f0$2c84a7d0$@almarrosario.com>',
      expectedSubject: 'DEDUCCIONES COMITRAL // SERGIO VILLARREAL'
    },
    {
      case: 'SWIFT Deducción USD 2.836,27 - Transferencia y Deducción a Sergio',
      mailbox: 'dsilvi@almarrosario.com',
      query: 'rfc822msgid:00c901dd49c3$8e6c3750$ab44a5f0$@almarrosario.com',
      expectedMsgId: '<00c901dd49c3$8e6c3750$ab44a5f0$@almarrosario.com>',
      expectedSubject: 'PAYMENT SWIFT - INVOICE 0063/2026 COMITRAL'
    },
    {
      case: 'Case 5: Carpeta 367 (Juan Cuello) - Cotización inicial MSL',
      mailbox: 'nguida@almarrosario.com',
      query: 'rfc822msgid:DM3PPF954CD43878F0CC90B80EB76F5A8F5F2C72@DM3PPF954CD4387.namprd19.prod.outlook.com',
      expectedMsgId: '<DM3PPF954CD43878F0CC90B80EB76F5A8F5F2C72@DM3PPF954CD4387.namprd19.prod.outlook.com>',
      expectedSubject: 'RE: JUAN CUELLO -EXW GUANGZHOU / ROSARIO 6.75 M3 NUEVA CARGA (2DA)'
    },
    {
      case: 'Case 5: Carpeta 367 - Reclamo BUFF vs FCA Cecilia',
      mailbox: 'cdellamea@almarrosario.com',
      query: 'rfc822msgid:034301dd49e0$71214290$5363c7b0$@almarrosario.com',
      expectedMsgId: '<034301dd49e0$71214290$5363c7b0$@almarrosario.com>',
      expectedSubject: 'RE: JUAN CUELLO -EXW GUANGZHOU / ROSARIO 6.75 M3 NUEVA CARGA (2DA) // C1367 / ROI 318920'
    },
    {
      case: 'Case 5: Carpeta 367 - Nota de Crédito 46188 MSL',
      mailbox: 'cdellamea@almarrosario.com',
      query: 'rfc822msgid:BLAPR19MB4450C51605EBBDAE159D01E393842@BLAPR19MB4450.namprd19.prod.outlook.com',
      expectedMsgId: '<BLAPR19MB4450C51605EBBDAE159D01E393842@BLAPR19MB4450.namprd19.prod.outlook.com>',
      expectedSubject: 'RE: JUAN CUELLO -EXW GUANGZHOU / ROSARIO 6.75 M3 NUEVA CARGA (2DA) // C1367 / ROI 318920'
    },
    {
      case: 'Case 6: Razón Social (RosCyTec -> IQUIR) - Solicitud Sergio CONICET',
      mailbox: 'srossi@almarrosario.com',
      query: 'rfc822msgid:5abe0f4d310c917fc5832189ba916071@rosario-conicet.gov.ar',
      expectedMsgId: '<5abe0f4d310c917fc5832189ba916071@rosario-conicet.gov.ar>',
      expectedSubject: 'Re: FACT B 2 - 28 // Fundación para la Promoción Científico Tecnológica de Rosario y su Región'
    },
    {
      case: 'Case 6: Razón Social - Prefactura NCB 797 en Kipin',
      mailbox: 'srossi@almarrosario.com',
      query: 'rfc822msgid:6eebe6b04c8d284a655e99d6f339663a@api.almarrosar.kipincargo.com',
      expectedMsgId: '<6eebe6b04c8d284a655e99d6f339663a@api.almarrosar.kipincargo.com>',
      expectedSubject: 'Prefactura - NCB 0002-00000797 - FUNDACION - EUR'
    },
    {
      case: 'Case 6: Razón Social - Acuse Dra. Gabriela Ledesma (IQUIR)',
      mailbox: 'srossi@almarrosario.com',
      query: 'rfc822msgid:7dd76138a0532581ee062a1b6dba03eb@iquir-conicet.gov.ar',
      expectedMsgId: '<7dd76138a0532581ee062a1b6dba03eb@iquir-conicet.gov.ar>',
      expectedSubject: 'FACTURA PENDIENTE DE CANCELACION'
    },
    {
      case: 'Case 7: GBP (Carpeta C620 CONICET) - Flete 506 GBP SAA UK',
      mailbox: 'agomez@almarrosario.com',
      query: 'rfc822msgid:02f701dc7bef$98bb3c80$ca31b580$@almarrosario.com',
      expectedMsgId: '<02f701dc7bef$98bb3c80$ca31b580$@almarrosario.com>',
      expectedSubject: 'RE: URGENT AIR FREIGHT EXW UK TO ROS // CONICET C 266 16/10/25 // C620 // SALJ054596'
    },
    {
      case: 'Case 7: GBP - Smoking Gun Vanesa Meggiolaro Hardcodeo PE',
      mailbox: 'vmeggiolaro@almarrosario.com',
      query: 'rfc822msgid:02d101dca691$299c7360$7cd55a20$@almarrosario.com',
      expectedMsgId: '<02d101dca691$299c7360$7cd55a20$@almarrosario.com>',
      expectedSubject: 'RE: PE SAA'
    }
  ];

  let verifiedCount = 0;
  let failCount = 0;
  const verificationReport = [];

  for (const tc of testCases) {
    try {
      console.log(`Verifying: ${tc.case} in ${tc.mailbox}...`);
      const results = await searchMessage(tc.mailbox, tc.query, keyData);
      if (results.length === 0) {
        console.error(`  FAIL: No message found for query: ${tc.query}`);
        failCount++;
        verificationReport.push({ testCase: tc.case, status: 'FAIL', reason: 'Not found in mailbox' });
        continue;
      }
      const match = results[0];
      const idMatch = match.messageId.trim().toLowerCase() === tc.expectedMsgId.trim().toLowerCase();
      const subjectMatch = match.subject.includes(tc.expectedSubject.trim()) || tc.expectedSubject.includes(match.subject.trim());
      
      console.log(`  Message-ID: ${match.messageId} (match: ${idMatch})`);
      console.log(`  Subject: ${match.subject}`);
      console.log(`  Date: ${match.date}`);
      console.log(`  Snippet: ${match.snippet.slice(0, 80)}...`);
      console.log(`  Attachments: ${match.attachments.map(a => a.filename + ' (' + a.size + 'b)').join(', ') || 'None'}`);

      if (idMatch) {
        verifiedCount++;
        verificationReport.push({
          testCase: tc.case,
          status: 'PASS',
          messageId: match.messageId,
          date: match.date,
          from: match.from,
          to: match.to,
          subject: match.subject,
          snippet: match.snippet,
          attachments: match.attachments
        });
      } else {
        failCount++;
        verificationReport.push({
          testCase: tc.case,
          status: 'FAIL',
          reason: `ID mismatch: expected ${tc.expectedMsgId}, got ${match.messageId}`
        });
      }
      console.log('---');
    } catch (err) {
      console.error(`  ERROR checking ${tc.case}:`, err.message);
      failCount++;
      verificationReport.push({ testCase: tc.case, status: 'ERROR', error: err.message });
    }
  }

  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`Total checks: ${testCases.length}`);
  console.log(`Verified authentic: ${verifiedCount}`);
  console.log(`Failed / Not matched: ${failCount}`);

  fs.writeFileSync('scripts/forensic_reviewer_1_verification_results.json', JSON.stringify(verificationReport, null, 2));
  console.log('Results written to scripts/forensic_reviewer_1_verification_results.json');
}

main().catch(console.error);
