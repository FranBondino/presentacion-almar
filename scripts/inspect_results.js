const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/live_gmail_extraction_results.json', 'utf8'));

console.log('=== MAILBOX STATUS ===');
console.log(JSON.stringify(data.mailboxStatus, null, 2));

console.log('\n=== TARGET FOLDER SUMMARY ===');
console.log(JSON.stringify(data.targetFolderSummary, null, 2));

console.log('\n=== DOWNLOADED PDF ATTACHMENTS ANALYSIS ===');
data.downloadedPdfs.forEach((p, idx) => {
  console.log(`\n------------------------------------------------------------`);
  console.log(`[PDF #${idx + 1}] Carpeta: ${p.folder} | Casilla: ${p.mailbox}`);
  console.log(`Original: ${p.originalFilename}`);
  console.log(`Guardado: ${p.savedPath}`);
  console.log(`Bytes: ${p.sizeBytes} | Líneas de texto extraídas: ${p.rawLineCount}`);
  console.log(`Logística detectada en PDF:`, JSON.stringify(p.logisticsInPdf));
  console.log(`Sample lines:`);
  console.log(p.sampleLines.join(' | '));
  console.log(`Text Preview: ${p.fullTextPreview}`);
});

console.log('\n=== FOLDER THREAD HIGHLIGHTS (First 2 msgs per folder) ===');
Object.keys(data.folderFindings).forEach(f => {
  const item = data.folderFindings[f];
  console.log(`\n📂 Carpeta ${f} (Total: ${item.messagesFound} msgs en ${item.mailboxesWithHits.join(', ')})`);
  item.threads.slice(0, 3).forEach((t, i) => {
    console.log(`  [Msg ${i+1}] Fecha: ${t.date} | De: ${t.from} | Casilla: ${t.mailbox}`);
    console.log(`    Asunto: ${t.subject}`);
    console.log(`    Adjuntos: ${t.attachments.map(a => a.filename).join(', ') || 'Ninguno'}`);
    console.log(`    Logística detectada:`, JSON.stringify(t.detectedLogistics));
  });
});
