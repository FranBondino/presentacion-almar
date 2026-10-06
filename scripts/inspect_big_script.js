const fs = require('fs');
const s = fs.readFileSync('scripts/big_script.js', 'utf8');

// Find all occurrences of "title"
let pos = 0;
while (true) {
  const idx = s.indexOf('"title":', pos);
  if (idx === -1) break;
  console.log(s.slice(idx, idx + 100));
  pos = idx + 8;
  if (pos > 50000) break;
}
