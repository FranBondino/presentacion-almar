const fs = require('fs');
const content = fs.readFileSync('portal/components/carpetas/CarpetaMailTimeline.tsx', 'utf8');

const mapStart = content.indexOf('export const CARPETA_MAILS_MAP: Record<string, MailMessage[]> = {');
const mapBlock = content.substring(mapStart);

const keys = ['C1234', 'C1434', 'IT1486', 'C1482', 'C1024', 'TL1436', 'C1289', 'EA1561', 'C1471', 'C1056', 'C367', 'C620'];

keys.forEach(k => {
  const kIdx = mapBlock.indexOf(`${k}: [`);
  if (kIdx !== -1) {
    // Find next key index or end of map
    let nextIdx = mapBlock.length;
    keys.forEach(otherK => {
      if (otherK !== k) {
        const oIdx = mapBlock.indexOf(`${otherK}: [`, kIdx + 5);
        if (oIdx !== -1 && oIdx < nextIdx) {
          nextIdx = oIdx;
        }
      }
    });
    const sub = mapBlock.substring(kIdx, nextIdx);
    const idMatches = Array.from(sub.matchAll(/id:\s*['"]([^'"]+)['"]/g), m => m[1]);
    const subjects = Array.from(sub.matchAll(/subject:\s*['"]([^'"]+)['"]/g), m => m[1]);
    const senders = Array.from(sub.matchAll(/fromName:\s*['"]([^'"]+)['"]/g), m => m[1]);
    const froms = Array.from(sub.matchAll(/from:\s*['"]([^'"]+)['"]/g), m => m[1]);
    
    console.log(`=== ${k} (${subjects.length} emails) ===`);
    subjects.forEach((s, i) => {
      console.log(`  [${i+1}] ${senders[i] || froms[i] || 'N/A'}: "${s}"`);
    });
  } else {
    console.log(`=== ${k} NOT FOUND ===`);
  }
});
