const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'data', 'extraction_cache');
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

console.log('=== 1. BUSQUEDA CARPETA 367 / JUAN CUELLO / BUFF / BUNKER ===');
const cuelloMatches = [];

for (const file of files) {
  const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, file), 'utf8'));
  for (const t of threads) {
    for (const m of (t.messages || [])) {
      const text = `${m.subject || ''} ${m.snippet || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
      if ((text.includes('cuello') || text.includes('367')) && (text.includes('buff') || text.includes('bunker') || text.includes('lcl') || text.includes('incoterm') || text.includes('1367') || text.includes('cafeteras'))) {
        cuelloMatches.push({ file, mailbox: t.mailbox, msg: m });
      }
    }
  }
}

console.log(`Encontrados ${cuelloMatches.length} mensajes para Cuello / 367 / BUFF / BUNKER:`);
cuelloMatches.forEach((match, i) => {
  const m = match.msg;
  console.log(`\n[${i+1}] Mailbox: ${match.mailbox} | Date: ${m.date}`);
  console.log(`  Subject:   ${m.subject}`);
  console.log(`  From:      ${m.from}`);
  console.log(`  To:        ${m.to}`);
  console.log(`  MessageId: ${m.messageId}`);
  console.log(`  Snippet:   ${m.snippet}`);
});

console.log('\n=== 2. BUSQUEDA CAMBIO DE RAZON SOCIAL (FUNDACION / INSTITUTO DE QUIMICA / IQUIR) ===');
const razonMatches = [];

for (const file of files) {
  const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, file), 'utf8'));
  for (const t of threads) {
    for (const m of (t.messages || [])) {
      const text = `${m.subject || ''} ${m.snippet || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
      if (text.includes('fundacion') || text.includes('instituto de quimica') || text.includes('iquir') || text.includes('quimica de rosario')) {
        razonMatches.push({ file, mailbox: t.mailbox, msg: m });
      }
    }
  }
}

console.log(`Encontrados ${razonMatches.length} mensajes para Cambio de Razón Social:`);
razonMatches.forEach((match, i) => {
  const m = match.msg;
  console.log(`\n[${i+1}] Mailbox: ${match.mailbox} | Date: ${m.date}`);
  console.log(`  Subject:   ${m.subject}`);
  console.log(`  From:      ${m.from}`);
  console.log(`  To:        ${m.to}`);
  console.log(`  MessageId: ${m.messageId}`);
  console.log(`  Snippet:   ${m.snippet}`);
});

console.log('\n=== 3. BUSQUEDA OPERACIONES EN GBP (LIBRAS) ===');
const gbpMatches = [];

for (const file of files) {
  const threads = JSON.parse(fs.readFileSync(path.join(cacheDir, file), 'utf8'));
  for (const t of threads) {
    for (const m of (t.messages || [])) {
      const text = `${m.subject || ''} ${m.snippet || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
      if (text.includes('gbp') || text.includes('libras') || text.includes('pound')) {
        gbpMatches.push({ file, mailbox: t.mailbox, msg: m });
      }
    }
  }
}

console.log(`Encontrados ${gbpMatches.length} mensajes para GBP:`);
gbpMatches.slice(0, 30).forEach((match, i) => {
  const m = match.msg;
  console.log(`\n[${i+1}] Mailbox: ${match.mailbox} | Date: ${m.date}`);
  console.log(`  Subject:   ${m.subject}`);
  console.log(`  From:      ${m.from}`);
  console.log(`  To:        ${m.to}`);
  console.log(`  MessageId: ${m.messageId}`);
  console.log(`  Snippet:   ${m.snippet}`);
});
