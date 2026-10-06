const fs = require('fs');

const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));

d.forEach((m, i) => {
  const txt = (m.subject + ' ' + (m.body || '')).toLowerCase();
  if (txt.includes('eurflg2670458ros') && (txt.includes('factura') || txt.includes('fc') || txt.includes('nc') || txt.includes('msl') || txt.includes('comprobante'))) {
    console.log(`\n[${i+1}] Date: ${m.date} | Mailbox: ${m.mailbox}`);
    console.log(`  Subj:   ${m.subject}`);
    console.log(`  From:   ${m.from}`);
    console.log(`  MsgId:  ${m.messageId}`);
    console.log(`  Attach: ${m.attachments.map(a => a.filename).join(', ')}`);
    console.log(`  Snippet/Body: ${m.body ? m.body.substring(0, 500).replace(/\r?\n/g, ' ') : m.snippet}`);
  }
});
