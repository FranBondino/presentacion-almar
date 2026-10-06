const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = fs.readdirSync(cacheDir);

console.log('Searching extraction cache for 900 (Quantum/Decaroli) and 1056 (Saprograf/Expo Maritima)...');

function searchInThread(thread, mailbox) {
  const jsonStr = JSON.stringify(thread);
  const has900 = (jsonStr.includes('EA900') || (jsonStr.includes('900') && (jsonStr.includes('Quantum') || jsonStr.includes('Agroleite') || jsonStr.includes('Decaroli'))));
  const has1056 = (jsonStr.includes('EM1056') || jsonStr.includes('BUEG04585900') || (jsonStr.includes('1056') && (jsonStr.includes('Saprograf') || jsonStr.includes('prefactura') || jsonStr.includes('Net') || jsonStr.includes('negativo'))));

  if (has900) {
    console.log(`\n=== FOUND 900 in ${mailbox} (threadId: ${thread.id || thread.threadId}) ===`);
    if (thread.messages) {
      console.log(`Message count: ${thread.messages.length}`);
      thread.messages.forEach((m, idx) => {
        const headers = m.payload?.headers || m.headers || [];
        const getH = (name) => {
          if (Array.isArray(headers)) {
            const h = headers.find(x => x.name.toLowerCase() === name.toLowerCase());
            return h ? h.value : '';
          }
          return headers[name] || '';
        };
        const subj = getH('subject') || m.subject;
        const from = getH('from') || m.from;
        const to = getH('to') || m.to;
        const date = getH('date') || m.date;
        const msgId = getH('message-id') || m.id;
        console.log(`[Msg ${idx+1}] ID: ${m.id} / MsgId: ${msgId}`);
        console.log(`  Date: ${date}`);
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        console.log(`  Subject: ${subj}`);
        console.log(`  Snippet: ${m.snippet ? m.snippet.substring(0, 150) : ''}`);
      });
    }
  }

  if (has1056) {
    console.log(`\n=== FOUND 1056 in ${mailbox} (threadId: ${thread.id || thread.threadId}) ===`);
    if (thread.messages) {
      console.log(`Message count: ${thread.messages.length}`);
      thread.messages.forEach((m, idx) => {
        const headers = m.payload?.headers || m.headers || [];
        const getH = (name) => {
          if (Array.isArray(headers)) {
            const h = headers.find(x => x.name.toLowerCase() === name.toLowerCase());
            return h ? h.value : '';
          }
          return headers[name] || '';
        };
        const subj = getH('subject') || m.subject;
        const from = getH('from') || m.from;
        const to = getH('to') || m.to;
        const date = getH('date') || m.date;
        const msgId = getH('message-id') || m.id;
        console.log(`[Msg ${idx+1}] ID: ${m.id} / MsgId: ${msgId}`);
        console.log(`  Date: ${date}`);
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        console.log(`  Subject: ${subj}`);
        console.log(`  Snippet: ${m.snippet ? m.snippet.substring(0, 150) : ''}`);
      });
    }
  }
}

for (const file of files) {
  if (!file.endsWith('.json')) continue;
  const filePath = path.join(cacheDir, file);
  console.log(`Checking ${file}...`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const threads = Array.isArray(data) ? data : (data.threads || []);
    threads.forEach(t => searchInThread(t, file));
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
}
