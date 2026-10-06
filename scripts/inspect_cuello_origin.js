const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = ['raw_threads_mfusco.json', 'raw_threads_llaje.json', 'raw_threads_nguida.json', 'raw_threads_cdellamea.json'];

for (const f of files) {
  const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8'));
  for (const t of threads) {
    for (const m of (t.messages || [])) {
      if (m.messageId === '<01a201dd08d0$b5c18000$21448000$@almarrosario.com>' || (m.subject && m.subject.includes('302566'))) {
        console.log(`=== FOUND IN ${f} (${t.mailbox}) ===`);
        console.log(`Date: ${m.date}`);
        console.log(`Subj: ${m.subject}`);
        console.log(`From: ${m.from}`);
        console.log(`To:   ${m.to}`);
        console.log(`Body:\n${m.body || m.snippet}\n`);
      }
    }
  }
}
