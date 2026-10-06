const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') searchDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/['"][^'"]*?\.(pdf|PDF)['"]/g);
      if (matches) {
        console.log(fullPath + ':');
        const unique = Array.from(new Set(matches));
        unique.forEach(m => console.log('  ' + m));
      }
    }
  }
}
searchDir('portal');
