const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

const argonMsgs = [];

for (const f of files) {
  const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8'));
  for (const t of threads) {
    for (const m of (t.messages || [])) {
      const text = `${m.to || ''} ${m.from || ''} ${m.cc || ''}`.toLowerCase();
      if (text.includes('argoncomex@gmail.com')) {
        argonMsgs.push({ mailbox: t.mailbox, msg: m });
      }
    }
  }
}

// Deduplicate
const seen = new Set();
const unique = argonMsgs.filter(x => {
  const id = x.msg.messageId || x.msg.id;
  if (seen.has(id)) return false;
  seen.add(id);
  return true;
});

console.log(`Encontrados ${unique.length} mensajes con argoncomex@gmail.com:`);
unique.forEach((u, i) => {
  const m = u.msg;
  console.log(`\n[${i+1}] Date: ${m.date} | Subj: ${m.subject}`);
  console.log(`  From: ${m.from} | To: ${m.to}`);
  console.log(`  MsgId: ${m.messageId}`);
  console.log(`  Snippet: ${m.snippet}`);
});
