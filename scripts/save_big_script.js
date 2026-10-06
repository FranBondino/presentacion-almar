const fs = require('fs');
const html = fs.readFileSync('scripts/msc_form_raw.html', 'utf8');
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];

for (const s of scripts) {
  if (s.length > 10000) {
    fs.writeFileSync('scripts/big_script.js', s);
    console.log('Saved big script');
    break;
  }
}
