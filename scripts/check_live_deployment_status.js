const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on('error', (err) => resolve({ status: 500, error: err }));
  });
}

(async () => {
  console.log('Checking Vercel deployment status...');
  const oldCotChunk = 'https://bot-relevamiento.vercel.app/_next/static/chunks/app/(protected)/cotizaciones/page-201509bd0a71918f.js';
  
  for (let i = 0; i < 20; i++) {
    // Check old chunk
    const resOld = await fetchUrl(oldCotChunk);
    
    // Check login page for chunk changes
    const resLogin = await fetchUrl('https://bot-relevamiento.vercel.app/login');
    const chunks = resLogin.data ? (resLogin.data.match(/\/static\/chunks\/[a-zA-Z0-9_\-\.]+\.js/g) || []) : [];
    
    console.log(`[Attempt ${i + 1} | ${new Date().toLocaleTimeString()}] Old chunk status: ${resOld.status}`);
    
    // If old chunk is gone or replaced, or let's check if new chunk appeared
    if (resOld.status === 404) {
      console.log('OLD CHUNK DELETED (404)! Deployment in progress / updated!');
      break;
    }

    // Also let's check GitHub workflow or check after waiting
    await new Promise(r => setTimeout(r, 6000));
  }
})();
