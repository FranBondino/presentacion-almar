const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

const matches = [];

for (const f of files) {
  const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8'));
  for (const t of threads) {
    for (const m of (t.messages || [])) {
      const text = `${m.subject || ''} ${m.snippet || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
      if ((text.includes('cuello') || text.includes('arambarri') || text.includes('argon')) && (text.includes('cot') || text.includes('cotizacion') || text.includes('buff') || text.includes('bunker') || text.includes('flete') || text.includes('cafeteras') || text.includes('1367') || text.includes('367'))) {
        matches.push({ file: f, mailbox: t.mailbox, msg: m });
      }
    }
  }
}

// Deduplicate by messageId
const seen = new Set();
const unique = matches.filter(x => {
  const mid = x.msg.messageId || x.msg.id;
  if (seen.has(mid)) return false;
  seen.add(mid);
  return true;
});

console.log(`Encontrados ${unique.length} mensajes sobre cotización Cuello:`);
unique.forEach((u, i) => {
  const m = u.msg;
  console.log(`\n[${i+1}] Date: ${m.date} | Mailbox: ${u.mailbox}`);
  console.log(`  Subject:   ${m.subject}`);
  console.log(`  From:      ${m.from}`);
  console.log(`  To:        ${m.to}`);
  console.log(`  MessageId: ${m.messageId}`);
  console.log(`  Snippet:   ${m.snippet}`);
});
