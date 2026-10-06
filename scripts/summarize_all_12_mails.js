const fs = require('fs');
const content = fs.readFileSync('portal/components/carpetas/CarpetaMailTimeline.tsx', 'utf8');

const carpetas = ['C1234', 'C1434', 'IT1486', 'C1482', 'C1024', 'TL1436', 'C1289', 'EA1561', 'C1471', 'C1056', 'C367', 'C620'];

carpetas.forEach(id => {
  const startIdx = content.indexOf(id + ': [');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('],', startIdx);
    const block = content.substring(startIdx, endIdx !== -1 ? endIdx + 2 : startIdx + 4000);
    const subjects = Array.from(block.matchAll(/subject:\s*['"]([^'"]+)['"]/g), m => m[1]);
    const senders = Array.from(block.matchAll(/from:\s*['"]([^'"]+)['"]/g), m => m[1]);
    const dates = Array.from(block.matchAll(/date:\s*['"]([^'"]+)['"]/g), m => m[1]);
    console.log(`=== ${id} (${subjects.length} emails) ===`);
    subjects.forEach((subj, i) => {
      console.log(`  [${i+1}] ${dates[i] || ''} | ${senders[i] || 'N/A'} | ${subj}`);
    });
  } else {
    console.log(`=== ${id} NOT FOUND ===`);
  }
});
