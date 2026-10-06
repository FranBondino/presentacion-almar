const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkChunk() {
  console.log('Descargando HTML de login...');
  const html = await fetchUrl('https://bot-relevamiento.vercel.app/login');
  const chunkMatches = html.match(/\/static\/chunks\/[^"]+\.js/g) || [];
  console.log('Chunks encontrados:', chunkMatches.length);

  for (const c of chunkMatches) {
    const js = await fetchUrl('https://bot-relevamiento.vercel.app/_next' + c);
    if (js.includes('COT-2026-00113')) {
      console.log('Encontrado COT-2026-00113 en chunk:', c);
      const idx = js.indexOf('COT-2026-00113');
      console.log(js.slice(idx - 50, idx + 250));
    }
    if (js.includes('MSL-IMPO-260714')) {
      console.log('Encontrado MSL-IMPO-260714 en chunk:', c);
    }
  }
}

checkChunk().catch(console.error);
