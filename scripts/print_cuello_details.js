const fs = require('fs');
const msgs = JSON.parse(fs.readFileSync('scripts/cuello_deep_messages.json', 'utf8'));

msgs.forEach((m, i) => {
  console.log(`\n================== [MSG ${i+1}] ==================`);
  console.log(`ID:        ${m.id}`);
  console.log(`MessageId: ${m.messageId}`);
  console.log(`Mailbox:   ${m.mailbox}`);
  console.log(`Date:      ${m.date}`);
  console.log(`From:      ${m.from}`);
  console.log(`To:        ${m.to}`);
  console.log(`Subject:   ${m.subject}`);
  console.log(`Attachments: ${m.attachments.map(a => a.filename).join(', ')}`);
  console.log(`Body (first 1000 chars):`);
  console.log(m.body.substring(0, 1000));
});
