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

function getHeader(headers, name) {
  const h = (headers || []).find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

function extractBody(payload) {
  let bodyText = '';
  if (payload.body && payload.body.data) {
    bodyText += Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        bodyText += '\n' + Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts) {
        bodyText += '\n' + extractBody(part);
      }
    }
  }
  return bodyText;
}

function extractAttachments(payload) {
  const attachments = [];
  function rec(p) {
    if (p.filename && p.filename.length > 0) {
      attachments.push({
        filename: p.filename,
        mimeType: p.mimeType,
        size: p.body?.size,
        attachmentId: p.body?.attachmentId
      });
    }
    if (p.parts) {
      for (const sp of p.parts) rec(sp);
    }
  }
  rec(payload);
  return attachments;
}

async function fetchFullMessage(keyData, mailbox, msgId) {
  const token = await getAccessToken(keyData, mailbox);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Error fetching msg ${msgId} from ${mailbox}: ${res.statusText}`);
  }
  const data = await res.json();
  const headers = data.payload?.headers || [];
  return {
    id: data.id,
    threadId: data.threadId,
    mailbox,
    subject: getHeader(headers, 'Subject'),
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    cc: getHeader(headers, 'Cc'),
    date: getHeader(headers, 'Date'),
    messageId: getHeader(headers, 'Message-ID'),
    snippet: data.snippet,
    body: extractBody(data.payload || {}),
    attachments: extractAttachments(data.payload || {})
  };
}

async function searchAndDump() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));

  // 1. Investigar Cuello / BUFF / BUNKER / 367
  console.log('=== INVESTIGANDO CARPETA 367 / JUAN CUELLO / BUFF / BUNKER ===');
  // Buscar en cache local primero los IDs relevantes de Cuello / 367 / BUFF
  const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
  const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

  const cuelloMsgRefs = [];
  const razonMsgRefs = [];
  const gbpMsgRefs = [];

  for (const file of files) {
    const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, file), 'utf8'));
    for (const t of threads) {
      for (const m of (t.messages || [])) {
        const text = `${m.subject || ''} ${m.snippet || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
        
        // Cuello & BUFF/BUNKER or 367
        if ((text.includes('cuello') || text.includes('367')) && (text.includes('buff') || text.includes('bunker') || text.includes('cafeteras') || text.includes('c1200') || text.includes('1367') || text.includes('cot 1258') || text.includes('302566'))) {
          cuelloMsgRefs.push({ mailbox: t.mailbox, id: m.id, subject: m.subject, snippet: m.snippet });
        }

        // Razón social
        if ((text.includes('fundacion') || text.includes('instituto de quimica') || text.includes('iquir')) && (text.includes('factura') || text.includes('razon social') || text.includes('cambio') || text.includes('cct') || text.includes('conicet') || text.includes('ledesma'))) {
          razonMsgRefs.push({ mailbox: t.mailbox, id: m.id, subject: m.subject, snippet: m.snippet });
        }

        // GBP
        if ((text.includes('gbp') || text.includes('libras')) && (text.includes('c620') || text.includes('conicet') || text.includes('flete') || text.includes('suzie') || text.includes('secco') || text.includes('saalogistics') || text.includes('billing currency'))) {
          gbpMsgRefs.push({ mailbox: t.mailbox, id: m.id, subject: m.subject, snippet: m.snippet });
        }
      }
    }
  }

  console.log(`Encontrados en cache: Cuello (${cuelloMsgRefs.length}), Razón Social (${razonMsgRefs.length}), GBP (${gbpMsgRefs.length})`);

  // Extraer detalles completos de mensajes clave
  const results = { cuello: [], razonSocial: [], gbp: [] };

  // Helper dedupe by id
  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter(x => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  };

  const dCuello = dedupe(cuelloMsgRefs).slice(0, 15);
  const dRazon = dedupe(razonMsgRefs).slice(0, 15);
  const dGbp = dedupe(gbpMsgRefs).slice(0, 15);

  console.log('\n--- Descargando detalles Cuello ---');
  for (const ref of dCuello) {
    try {
      console.log(`Fetch Cuello msg ${ref.id} (${ref.mailbox})`);
      const msg = await fetchFullMessage(keyData, ref.mailbox, ref.id);
      results.cuello.push(msg);
    } catch (e) {
      console.error(`Error fetching Cuello ${ref.id}:`, e.message);
    }
  }

  console.log('\n--- Descargando detalles Razón Social ---');
  for (const ref of dRazon) {
    try {
      console.log(`Fetch Razón Social msg ${ref.id} (${ref.mailbox})`);
      const msg = await fetchFullMessage(keyData, ref.mailbox, ref.id);
      results.razonSocial.push(msg);
    } catch (e) {
      console.error(`Error fetching Razón Social ${ref.id}:`, e.message);
    }
  }

  console.log('\n--- Descargando detalles GBP ---');
  for (const ref of dGbp) {
    try {
      console.log(`Fetch GBP msg ${ref.id} (${ref.mailbox})`);
      const msg = await fetchFullMessage(keyData, ref.mailbox, ref.id);
      results.gbp.push(msg);
    } catch (e) {
      console.error(`Error fetching GBP ${ref.id}:`, e.message);
    }
  }

  fs.writeFileSync('scripts/track_c_forensic_evidence.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\n✅ Guardada toda la evidencia forense en scripts/track_c_forensic_evidence.json');
}

searchAndDump().catch(console.error);
