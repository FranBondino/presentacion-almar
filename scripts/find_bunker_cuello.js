const fs = require('fs');

const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));

console.log('=== BUSCANDO BUFF / BUNKER / BAF EN CUELLO ===');
d.forEach((m, i) => {
  const txt = (m.subject + ' ' + (m.body || '')).toLowerCase();
  if (txt.includes('buff') || txt.includes('bunker') || txt.includes('baf')) {
    console.log(`\n[MSG #${i+1}] Date: ${m.date} | Subj: ${m.subject}`);
    console.log(`  From: ${m.from} | To: ${m.to}`);
    console.log(`  MsgId: ${m.messageId}`);
    // extract surrounding text
    for (const kw of ['buff', 'bunker', 'baf']) {
      let pos = txt.indexOf(kw);
      if (pos !== -1) {
        console.log(`  KW [${kw}]: "...${m.body.substring(Math.max(0, pos-50), Math.min(m.body.length, pos+120)).replace(/\r?\n/g, ' ')}..."`);
      }
    }
  }
});
