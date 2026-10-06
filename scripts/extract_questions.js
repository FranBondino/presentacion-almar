const fs = require('fs');
const html = fs.readFileSync('scripts/msc_form_raw.html', 'utf8');
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];

for (const s of scripts) {
  if (s.includes('form') && s.length > 10000) {
    // extract questions
    const qMatches = s.match(/\{"id":"r[a-z0-9]+".*?\}/g) || [];
    console.log('qMatches count:', qMatches.length);
    if (qMatches.length > 0) {
      console.log(qMatches.slice(0, 5));
    }
    // look for form title
    const titleMatch = s.match(/"title":"([^"]+)"/);
    if (titleMatch) console.log('Form Title:', titleMatch[1]);
  }
}
