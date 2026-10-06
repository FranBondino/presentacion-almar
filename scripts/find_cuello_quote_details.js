const fs = require('fs');

const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));

// Look for XY20260522B or Cuello quotation
d.forEach((m, i) => {
  const b = (m.body || '').toLowerCase();
  const s = (m.subject || '').toLowerCase();
  if (b.includes('xy20260522b') || b.includes('proforma') || s.includes('xy20260522b') || b.includes('informa al cliente') || b.includes('cotizacion n°') || b.includes('cot 1258') || b.includes('cafeteras') || b.includes('expendedoras')) {
    console.log(`\n======================================================================`);
    console.log(`[MSG #${i+1}] Date: ${m.date} | Subj: ${m.subject}`);
    console.log(`From: ${m.from} | To: ${m.to}`);
    console.log(`MsgId: ${m.messageId}`);
    console.log(`Attachments: ${m.attachments.map(a => a.filename).join(', ')}`);
    console.log(`Body:\n${m.body.substring(0, 1500)}`);
  }
});
