const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/track_c_forensic_evidence.json', 'utf8'));

console.log('======================================================================');
console.log('1. CARPETA 367 / JUAN CUELLO / BUFF / BUNKER / LCL');
console.log('======================================================================');
data.cuello.forEach((m, i) => {
  console.log(`\n--- [CUELLO #${i+1}] ---`);
  console.log(`ID:           ${m.id}`);
  console.log(`Message-ID:   ${m.messageId}`);
  console.log(`Mailbox:      ${m.mailbox}`);
  console.log(`Date:         ${m.date}`);
  console.log(`From:         ${m.from}`);
  console.log(`To:           ${m.to}`);
  console.log(`Subject:      ${m.subject}`);
  console.log(`Attachments:  ${m.attachments.map(a => `${a.filename} (${a.size}b)`).join('; ') || 'None'}`);
  console.log(`Body snippet: ${m.body ? m.body.substring(0, 500).replace(/\r?\n/g, ' ') : m.snippet}`);
});

console.log('\n======================================================================');
console.log('2. CAMBIO DE RAZON SOCIAL: FUNDACION -> INSTITUTO DE QUIMICA');
console.log('======================================================================');
data.razonSocial.forEach((m, i) => {
  console.log(`\n--- [RAZON SOCIAL #${i+1}] ---`);
  console.log(`ID:           ${m.id}`);
  console.log(`Message-ID:   ${m.messageId}`);
  console.log(`Mailbox:      ${m.mailbox}`);
  console.log(`Date:         ${m.date}`);
  console.log(`From:         ${m.from}`);
  console.log(`To:           ${m.to}`);
  console.log(`Subject:      ${m.subject}`);
  console.log(`Attachments:  ${m.attachments.map(a => `${a.filename} (${a.size}b)`).join('; ') || 'None'}`);
  console.log(`Body snippet: ${m.body ? m.body.substring(0, 500).replace(/\r?\n/g, ' ') : m.snippet}`);
});

console.log('\n======================================================================');
console.log('3. OPERACIONES EN GBP (LIBRAS ESTERLINAS)');
console.log('======================================================================');
data.gbp.forEach((m, i) => {
  console.log(`\n--- [GBP #${i+1}] ---`);
  console.log(`ID:           ${m.id}`);
  console.log(`Message-ID:   ${m.messageId}`);
  console.log(`Mailbox:      ${m.mailbox}`);
  console.log(`Date:         ${m.date}`);
  console.log(`From:         ${m.from}`);
  console.log(`To:           ${m.to}`);
  console.log(`Subject:      ${m.subject}`);
  console.log(`Attachments:  ${m.attachments.map(a => `${a.filename} (${a.size}b)`).join('; ') || 'None'}`);
  console.log(`Body snippet: ${m.body ? m.body.substring(0, 500).replace(/\r?\n/g, ' ') : m.snippet}`);
});
