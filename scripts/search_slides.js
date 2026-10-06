const fs = require('fs');
const html = fs.readFileSync('presentacion-ejecutiva-almar.html', 'utf8');
const slides = html.split('<section class="slide-item');
slides.forEach((s, idx) => {
  if (idx === 0) return;
  const numMatch = s.match(/data-slide="(\d+)"/);
  const slideNum = numMatch ? numMatch[1] : idx;
  const title = (s.match(/<h2[^>]*>(.*?)<\/h2>/is) || [])[1] || (s.match(/<h1[^>]*>(.*?)<\/h1>/is) || [])[1] || 'Sin título';
  const subtitle = (s.match(/<div class="slide-subtitle"[^>]*>(.*?)<\/div>/is) || [])[1] || '';
  console.log(`Slide ${slideNum}: ${title.replace(/<[^>]+>/g, '').trim()} | ${subtitle.replace(/<[^>]+>/g, '').trim()}`);
  if (/triage|feedback|widget|incidencia|bug|soporte|ticket|borde|asistencia/i.test(s)) {
    console.log(`  -> Match found in Slide ${slideNum}`);
  }
});
