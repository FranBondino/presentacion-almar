const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

const targetThreads = [
  '19cdd1056becde6c', // EA900 Agroleite
  '19dfebfb1c1bc443', // EM1056 bkg BUEG04585900
  '19aa68ae9a90612d', // Quantum Nidec
];

// Also let's search across all threads for any thread with 'EA900', 'EM1056', '900', '1056', 'Decaroli', 'Saprograf'
let found900 = [];
let found1056 = [];

function extractBodyAndAttachments(msg) {
  let text = '';
  let html = '';
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
    if (part.mimeType === 'text/html' && part.body && part.body.data) {
      try {
        const decoded = Buffer.from(part.body.data, 'base64').toString('utf8');
        html += '\n' + decoded;
      } catch (e) {}
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(walkParts);
    }
  }

  if (msg.payload) {
    walkParts(msg.payload);
  }
  return { text, html, attachments };
}

for (const file of files) {
  const filePath = path.join(cacheDir, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const threads = JSON.parse(raw);
    for (const t of threads) {
      const tStr = JSON.stringify(t);
      const is900 = tStr.includes('EA900') || (tStr.includes('900') && (tStr.includes('Decaroli') || tStr.includes('Agroleite') || tStr.includes('Quantum')));
      const is1056 = tStr.includes('EM1056') || (tStr.includes('1056') && (tStr.includes('Saprograf') || tStr.includes('BUEG04585900') || tStr.includes('Dodero')));

      if (is900) {
        found900.push({ file, thread: t });
      }
      if (is1056) {
        found1056.push({ file, thread: t });
      }
    }
  } catch (e) {
    console.error(`Error with ${file}:`, e.message);
  }
}

console.log(`Found 900 candidates: ${found900.length}`);
console.log(`Found 1056 candidates: ${found1056.length}`);

function simplifyThread(item) {
  const t = item.thread;
  const messages = (t.messages || []).map(m => {
    const headers = m.payload?.headers || [];
    const getH = (n) => {
      const h = headers.find(x => x.name.toLowerCase() === n.toLowerCase());
      return h ? h.value : '';
    };
    const { text, attachments } = extractBodyAndAttachments(m);
    return {
      id: m.id,
      threadId: m.threadId,
      date: getH('date') || m.date,
      from: getH('from') || m.from,
      to: getH('to') || m.to,
      cc: getH('cc') || m.cc,
      subject: getH('subject') || m.subject,
      snippet: m.snippet,
      attachments,
      bodyText: text
    };
  });
  return {
    sourceFile: item.file,
    threadId: t.id,
    messages
  };
}

const detailed900 = found900.map(simplifyThread);
const detailed1056 = found1056.map(simplifyThread);

fs.writeFileSync(path.join(__dirname, '..', '.agents', 'teamwork', 'explorer_forensic_a', 'evidence_900.json'), JSON.stringify(detailed900, null, 2));
fs.writeFileSync(path.join(__dirname, '..', '.agents', 'teamwork', 'explorer_forensic_a', 'evidence_1056.json'), JSON.stringify(detailed1056, null, 2));
console.log('Saved evidence_900.json and evidence_1056.json');
