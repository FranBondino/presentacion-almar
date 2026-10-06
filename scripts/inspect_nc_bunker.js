const fs = require('fs');

const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));

d.forEach((m, i) => {
  if (m.body && (m.body.includes('650912') || m.body.includes('Jemima Bareiro') || m.body.includes('NC') || m.body.includes('generada la NC') || m.body.includes('BUFF') || m.body.includes('BUNKER') || m.body.includes('bunker'))) {
    if (m.subject && m.subject.includes('C1367')) {
      console.log(`\n=== MSG #${i+1} === Date: ${m.date}`);
      console.log(`From: ${m.from} | To: ${m.to}`);
      console.log(`Subj: ${m.subject}`);
      console.log(`MsgId: ${m.messageId}`);
      console.log(`Body snippet:\n${m.body.substring(0, 2000)}`);
    }
  }
});
