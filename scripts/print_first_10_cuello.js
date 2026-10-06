const fs = require('fs');
const msgs = JSON.parse(fs.readFileSync('scripts/cuello_deep_messages.json', 'utf8'));

for (let i = 0; i < Math.min(10, msgs.length); i++) {
  const m = msgs[i];
  console.log(`\n================== [MSG ${i + 1}] ==================`);
  console.log(`Subject: ${m.subject}`);
  console.log(`From:    ${m.from}`);
  console.log(`To:      ${m.to}`);
  console.log(`Date:    ${m.date}`);
  console.log(`MsgId:   ${m.messageId}`);
  console.log(`Snippet: ${m.snippet}`);
  console.log(`Body (first 1000 chars):`);
  console.log(m.body ? m.body.substring(0, 1000) : '');
}
