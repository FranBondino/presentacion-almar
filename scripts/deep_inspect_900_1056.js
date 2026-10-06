const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = [
  'raw_threads_vmoyano.json',
  'raw_threads_srossi.json',
  'raw_threads_vmeggiolaro.json',
  'raw_threads_nhermoso.json',
  'raw_threads_llaje.json',
  'raw_threads_agomez.json',
  'raw_threads_atalaban.json'
];

function extractBodyAndAttachments(msg) {
  let text = '';
  let attachments = [];

  function walkParts(part) {
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
        text += '\n' + decoded;
      } catch (e) {}
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(walkParts);
    }
  }

  if (msg.payload) {
    walkParts(msg.payload);
  }
  return { text, attachments };
}

console.log('=== DEEP INSPECTION FOR 900 AND 1056 ===\n');

for (const file of files) {
  const filePath = path.join(cacheDir, file);
  if (!fs.existsSync(filePath)) continue;
  const raw = fs.readFileSync(filePath, 'utf8');
  const threads = JSON.parse(raw);

  for (const t of threads) {
    const tStr = JSON.stringify(t);

    // Target 900: Quantum, Agroleite, Decaroli, EA900, stand by, triangulacion, prefactura Net
    const isTarget900 = tStr.includes('EA900') || 
                        (tStr.includes('900') && (tStr.includes('Agroleite') || tStr.includes('Decaroli') || (tStr.includes('Quantum') && tStr.includes('Aéreo'))));

    // Target 1056: EM1056, BUEG04585900, Saprograf, Dodero, prefactura exterior
    const isTarget1056 = tStr.includes('EM1056') || tStr.includes('BUEG04585900') || (tStr.includes('1056') && tStr.includes('Saprograf'));

    if (isTarget900) {
      console.log(`\n======================================================`);
      console.log(`[TARGET 900] File: ${file} | Thread ID: ${t.id}`);
      console.log(`======================================================`);
      t.messages?.forEach((m, idx) => {
        const headers = m.payload?.headers || [];
        const getH = (name) => {
          const h = headers.find(x => x.name.toLowerCase() === name.toLowerCase());
          return h ? h.value : '';
        };
        const subj = getH('subject') || m.subject;
        const from = getH('from') || m.from;
        const to = getH('to') || m.to;
        const date = getH('date') || m.date;
        const { text, attachments } = extractBodyAndAttachments(m);
        console.log(`\n--- Msg #${idx + 1} [ID: ${m.id}] ---`);
        console.log(`Date: ${date}`);
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subj}`);
        console.log(`Snippet: ${m.snippet}`);
        if (attachments.length > 0) {
          console.log(`Attachments:`, JSON.stringify(attachments, null, 2));
        }
        if (text) {
          // print snippet of text
          console.log(`Body excerpt: ${text.substring(0, 500).replace(/\s+/g, ' ')}...`);
        }
      });
    }

    if (isTarget1056) {
      console.log(`\n======================================================`);
      console.log(`[TARGET 1056] File: ${file} | Thread ID: ${t.id}`);
      console.log(`======================================================`);
      t.messages?.forEach((m, idx) => {
        const headers = m.payload?.headers || [];
        const getH = (name) => {
          const h = headers.find(x => x.name.toLowerCase() === name.toLowerCase());
          return h ? h.value : '';
        };
        const subj = getH('subject') || m.subject;
        const from = getH('from') || m.from;
        const to = getH('to') || m.to;
        const date = getH('date') || m.date;
        const { text, attachments } = extractBodyAndAttachments(m);
        console.log(`\n--- Msg #${idx + 1} [ID: ${m.id}] ---`);
        console.log(`Date: ${date}`);
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subj}`);
        console.log(`Snippet: ${m.snippet}`);
        if (attachments.length > 0) {
          console.log(`Attachments:`, JSON.stringify(attachments, null, 2));
        }
        if (text) {
          console.log(`Body excerpt: ${text.substring(0, 500).replace(/\s+/g, ' ')}...`);
        }
      });
    }
  }
}
