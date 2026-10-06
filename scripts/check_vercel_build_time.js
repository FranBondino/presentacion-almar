const https = require('https');

https.get('https://bot-relevamiento.vercel.app/login', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const scripts = html.match(/src="\/_next\/static\/[^"]+"/g);
    console.log('Scripts encontrados en login:', scripts ? scripts.slice(0, 3) : 'ninguno');
    const buildIdMatch = html.match(/"buildId":"([^"]+)"/);
    console.log('BuildId en login:', buildIdMatch ? buildIdMatch[1] : 'no encontrado');
  });
});
