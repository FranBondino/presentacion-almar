const fs = require('fs');
const html = fs.readFileSync('scripts/msc_form_raw.html', 'utf8');

// Find script tags with data
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log('Total scripts:', scripts.length);

for (const s of scripts) {
  if (s.includes('form') && s.includes('title')) {
    console.log('Script with form & title found! Length:', s.length);
    const titles = s.match(/"title":"([^"]+)"/g);
    if (titles) {
      console.log('Titles:', titles);
    }
  }
}
