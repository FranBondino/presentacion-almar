const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(keyData, impersonateEmail, scope) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyData.private_key_id
  };

  const payload = {
    iss: keyData.client_email,
    sub: impersonateEmail,
    scope: scope,
    aud: keyData.token_uri || 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = base64url(signer.sign(keyData.private_key));

  const jwt = `${signatureInput}.${signature}`;

  const tokenParams = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt
  });

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  });

  const tokenData = await response.json();
  if (!response.ok) {
    throw new Error(`Google Auth Error (${response.status}): ${JSON.stringify(tokenData)}`);
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
  let htmlBody = '';
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
    if (part.mimeType === 'text/html' && part.body && part.body.data) {
      try {
        const decoded = Buffer.from(part.body.data, 'base64').toString('utf8');
        htmlBody += '\n' + decoded;
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
    textBody: textBody.trim() || msgData.snippet
  };
}

async function fetchThread(mailbox, threadId, keyData) {
  console.log(`Fetching thread ${threadId} from mailbox ${mailbox}...`);
  const token = await getAccessToken(keyData, mailbox, 'https://www.googleapis.com/auth/gmail.readonly');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error(`Failed to fetch thread ${threadId}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const parsedMessages = (data.messages || []).map(parseMessage);
  return {
    mailbox,
    threadId,
    messages: parsedMessages
  };
}

async function searchMailbox(mailbox, query, keyData) {
  console.log(`Searching mailbox ${mailbox} with query: "${query}"...`);
  const token = await getAccessToken(keyData, mailbox, 'https://www.googleapis.com/auth/gmail.readonly');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error(`Search error in ${mailbox}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  const msgs = data.messages || [];
  console.log(`Found ${msgs.length} messages in ${mailbox} for query: ${query}`);
  const details = [];
  for (const m of msgs.slice(0, 10)) {
    const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (mRes.ok) {
      const mData = await mRes.json();
      details.push(parseMessage(mData));
    }
  }
  return details;
}

async function main() {
  const credentialsPath = 'credentials/credentials.json';
  if (!fs.existsSync(credentialsPath)) {
    console.error('Credentials not found');
    return;
  }
  const keyData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  // 1. Fetch live thread for Carpeta 900
  // Thread: 19d1a998f531c886 from vmoyano@almarrosario.com
  const thread900 = await fetchThread('vmoyano@almarrosario.com', '19d1a998f531c886', keyData);
  fs.writeFileSync('.agents/teamwork/explorer_forensic_a/live_thread_900.json', JSON.stringify(thread900, null, 2));
  console.log('Saved live_thread_900.json');

  // Search in srossi and vmeggiolaro for EA-00000900 or Agroleite or Quantum
  const search900_srossi = await searchMailbox('srossi@almarrosario.com', 'EA900 OR EA-00000900 OR Agroleite OR "Quantum Logistics"', keyData);
  fs.writeFileSync('.agents/teamwork/explorer_forensic_a/live_search_900_srossi.json', JSON.stringify(search900_srossi, null, 2));

  // 2. Fetch live threads for Carpeta 1056
  // Thread: 19dfebfb1c1bc443 from vmoyano@almarrosario.com or llaje@almarrosario.com
  const thread1056_bkg = await fetchThread('vmoyano@almarrosario.com', '19dfebfb1c1bc443', keyData);
  fs.writeFileSync('.agents/teamwork/explorer_forensic_a/live_thread_1056_bkg.json', JSON.stringify(thread1056_bkg, null, 2));

  // Thread with Net pre-invoice: EM-00001056 from srossi or vmoyano
  const search1056_net = await searchMailbox('vmoyano@almarrosario.com', 'EM1056 OR EM-00001056 OR "SAPROGRAF" OR "BUEG04585900"', keyData);
  fs.writeFileSync('.agents/teamwork/explorer_forensic_a/live_search_1056_vmoyano.json', JSON.stringify(search1056_net, null, 2));

  const search1056_srossi = await searchMailbox('srossi@almarrosario.com', 'EM1056 OR EM-00001056 OR "SAPROGRAF" OR "NET TRADE"', keyData);
  fs.writeFileSync('.agents/teamwork/explorer_forensic_a/live_search_1056_srossi.json', JSON.stringify(search1056_srossi, null, 2));

  console.log('Live queries finished successfully!');
}

main().catch(console.error);
