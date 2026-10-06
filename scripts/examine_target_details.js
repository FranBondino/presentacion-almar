const fs = require('fs');
const path = require('path');

const ev900 = JSON.parse(fs.readFileSync('.agents/teamwork/explorer_forensic_a/evidence_900.json', 'utf8'));
const ev1056 = JSON.parse(fs.readFileSync('.agents/teamwork/explorer_forensic_a/evidence_1056.json', 'utf8'));

let out = '';
out += '================================================================\n';
out += '=== DETAILED FORENSIC REPORT: CARPETA 900 (EXPO AEREA / QUANTUM) ===\n';
out += '================================================================\n\n';

const seenThreads900 = new Set();
const threads900 = ev900.filter(t => {
  const s = JSON.stringify(t);
  return (s.includes('EA900') || (s.includes('Agroleite') && s.includes('Decaroli'))) && !seenThreads900.has(t.threadId);
});

threads900.forEach(t => {
  seenThreads900.add(t.threadId);
  out += `\n>>> THREAD ID: ${t.threadId} (Source: ${t.sourceFile}) - Messages: ${t.messages.length} <<<\n`;
  t.messages.forEach((m, idx) => {
    out += `----------------------------------------------------------------\n`;
    out += `Msg #${idx+1} | Message ID: ${m.id}\n`;
    out += `Date: ${m.date}\n`;
    out += `From: ${m.from}\n`;
    out += `To: ${m.to}\n`;
    out += `Cc: ${m.cc}\n`;
    out += `Subject: ${m.subject}\n`;
    out += `Attachments: ${JSON.stringify(m.attachments)}\n`;
    out += `Body:\n${m.bodyText.trim()}\n\n`;
  });
});

out += '\n================================================================\n';
out += '=== DETAILED FORENSIC REPORT: CARPETA 1056 (EXPO MARITIMA / SAPROGRAF / NET) ===\n';
out += '================================================================\n\n';

const seenThreads1056 = new Set();
const threads1056 = ev1056.filter(t => {
  const s = JSON.stringify(t);
  return (s.includes('EM1056') || s.includes('BUEG04585900') || s.includes('SAPROGRAF')) && !seenThreads1056.has(t.threadId);
});

threads1056.forEach(t => {
  seenThreads1056.add(t.threadId);
  out += `\n>>> THREAD ID: ${t.threadId} (Source: ${t.sourceFile}) - Messages: ${t.messages.length} <<<\n`;
  t.messages.forEach((m, idx) => {
    out += `----------------------------------------------------------------\n`;
    out += `Msg #${idx+1} | Message ID: ${m.id}\n`;
    out += `Date: ${m.date}\n`;
    out += `From: ${m.from}\n`;
    out += `To: ${m.to}\n`;
    out += `Cc: ${m.cc}\n`;
    out += `Subject: ${m.subject}\n`;
    out += `Attachments: ${JSON.stringify(m.attachments)}\n`;
    out += `Body:\n${m.bodyText.trim()}\n\n`;
  });
});

fs.writeFileSync('.agents/teamwork/explorer_forensic_a/detailed_forensic_dump.txt', out, 'utf8');
console.log('Successfully written detailed_forensic_dump.txt as UTF-8. Total length:', out.length);
