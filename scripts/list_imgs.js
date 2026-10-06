const fs = require('fs');
const content = fs.readFileSync('presentacion-ejecutiva-almar.html', 'utf8');
const regex = /<img[^>]+src=["']([^"']+)["']/gi;
let match;
const set = new Set();
while ((match = regex.exec(content)) !== null) {
  set.add(match[1]);
}
console.log('Images found:');
for (const item of set) {
  console.log(item, '--> Exists:', fs.existsSync(item));
}
