const fs = require('fs');

const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));
console.log('Total messages in cuello_strict_details.json:', d.length);

const terms = ['buff', 'bunker', 'baf', 'combustible', 'recargo', 'fca', 'exw', '367', '1367'];

d.forEach((m, i) => {
  const txt = (m.subject + ' ' + (m.body || '')).toLowerCase();
  const found = terms.filter(t => txt.includes(t));
  if (found.length > 0) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[MSG #${i+1}] Date: ${m.date} | Mailbox: ${m.mailbox}`);
    console.log(`  Subject:   ${m.subject}`);
    console.log(`  From:      ${m.from}`);
    console.log(`  To:        ${m.to}`);
    console.log(`  MsgId:     ${m.messageId}`);
    console.log(`  Keywords:  ${found.join(', ')}`);
    console.log(`  Attachments: ${m.attachments.map(a => a.filename).join(', ')}`);
    
    // Snippets for each keyword
    const bodyLower = (m.body || '').toLowerCase();
    for (const kw of ['buff', 'bunker', 'baf', 'fca', 'exw']) {
      let pos = bodyLower.indexOf(kw);
      while (pos !== -1) {
        console.log(`    [${kw}]: "...${m.body.substring(Math.max(0, pos - 40), Math.min(m.body.length, pos + 80)).replace(/\r?\n/g, ' ')}..."`);
        pos = bodyLower.indexOf(kw, pos + kw.length + 100);
      }
    }
  }
});
