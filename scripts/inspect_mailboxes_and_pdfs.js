const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/live_gmail_extraction_results.json', 'utf8'));

console.log('=== CASILLAS AUDITADAS (6 de 6) ===');
data.mailboxStatus.forEach(m => {
  console.log(`- ${m.email.padEnd(32)}: ${m.status} | Total Mensajes: ${m.messagesTotal.toLocaleString()} | Threads: ${m.threadsTotal.toLocaleString()} | HistoryId: ${m.historyId}`);
});

console.log('\n=== CARPETAS AUDITADAS ===');
data.targetFolderSummary.forEach(f => {
  console.log(`- Carpeta [${f.folder.padEnd(7)}]: ${f.messagesFound} mensajes encontrados en casillas: [${f.mailboxes.join(', ')}]`);
});

console.log(`\n=== TOTAL PDFS DESCARGADOS: ${data.downloadedPdfs.length} ===`);
data.downloadedPdfs.forEach((p, idx) => {
  console.log(`\n[PDF ${idx + 1}] Carpeta: ${p.folder} | Casilla: ${p.mailbox}`);
  console.log(`  Archivo original: ${p.originalFilename}`);
  console.log(`  Ruta guardada:    ${p.savedPath}`);
  console.log(`  Tamaño:           ${p.sizeBytes} bytes | Líneas extraídas: ${p.rawLineCount}`);
  console.log(`  Asunto Email:     ${p.subject}`);
  console.log(`  Fecha Email:      ${p.date}`);
  console.log(`  Muestra de texto:`);
  console.log(`  > ${p.sampleLines.slice(0, 8).join('\n  > ')}`);
});
