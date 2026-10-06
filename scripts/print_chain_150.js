const fs = require('fs');
const d = JSON.parse(fs.readFileSync('scripts/cuello_strict_details.json', 'utf8'));

// MSG #150 has the chain
const m = d[149]; // 0-indexed 149 is MSG #150
console.log('=== FULL BODY MSG #150 ===');
console.log(m.body);
