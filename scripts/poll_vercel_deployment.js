const https = require('https');

async function getPageChunk() {
  return new Promise((resolve) => {
    https.get('https://bot-relevamiento.vercel.app/login', (res) => {
      let html = '';
      res.on('data', d => html += d);
      res.on('end', () => {
        // find main script
        const match = html.match(/\/static\/chunks\/main-app-([a-zA-Z0-9]+)\.js/);
        resolve(match ? match[1] : null);
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  console.log('Polling Vercel deployment...');
  const oldMain = 'b6e77932355a1a37';
  for (let i = 0; i < 20; i++) {
    const mainHash = await getPageChunk();
    console.log(`[Attempt ${i + 1}] Current main-app hash:`, mainHash);
    if (mainHash && mainHash !== oldMain) {
      console.log('NEW DEPLOYMENT DETECTED! Hash changed to:', mainHash);
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('Finished polling without main-app hash change, will test directly.');
})();
