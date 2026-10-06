const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/track_c_forensic_evidence.json', 'utf8'));

console.log('=== CUELLO DETAILS ===');
data.cuello.forEach((m, i) => {
  console.log(`\n--- [CUELLO #${i+1}] ---`);
  console.log(`ID: ${m.id} | Date: ${m.date}`);
  console.log(`From: ${m.from} | To: ${m.to}`);
  console.log(`Subject: ${m.subject}`);
  console.log(`MsgId: ${m.messageId}`);
  console.log(`Body: ${m.body.substring(0, 400).replace(/\r?\n/g, ' ')}`);
});

console.log('\n=== RAZON SOCIAL DETAILS ===');
data.razonSocial.forEach((m, i) => {
  console.log(`\n--- [RAZON SOCIAL #${i+1}] ---`);
  console.log(`ID: ${m.id} | Date: ${m.date}`);
  console.log(`From: ${m.from} | To: ${m.to}`);
  console.log(`Subject: ${m.subject}`);
  console.log(`MsgId: ${m.messageId}`);
  console.log(`Body: ${m.body.substring(0, 400).replace(/\r?\n/g, ' ')}`);
});
