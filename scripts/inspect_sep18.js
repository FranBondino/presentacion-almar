const fs = require('fs');

const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));

// Look for msg around Sep 18, 2026 in Cuello
d.forEach((m, i) => {
  if (m.date && m.date.includes('18 Sep 2026') && m.subject && m.subject.includes('C1367')) {
    console.log(`\n=== MSG #${i+1} === Date: ${m.date}`);
    console.log(`From: ${m.from}`);
    console.log(`Subj: ${m.subject}`);
    console.log(`MsgId: ${m.messageId}`);
    console.log(`Body:\n${m.body}`);
  }
});
