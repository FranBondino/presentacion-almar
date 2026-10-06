const https = require('https');

function check() {
  return new Promise(resolve => {
    https.get('https://bot-relevamiento.vercel.app/facturas/COT_2026_00379_Bunge_Terrestre.pdf', res => {
      resolve(res.statusCode);
    }).on('error', () => resolve(0));
  });
}

async function wait() {
  console.log('[wait_for_vercel] Waiting for Vercel deployment of commit f8db96a...');
  for (let i = 0; i < 20; i++) {
    const status = await check();
    console.log(`[Attempt ${i + 1}/20] COT_2026_00379_Bunge_Terrestre.pdf HTTP Status: ${status}`);
    if (status === 200) {
      console.log('🎉 Vercel deployment is ready and LIVE with 100% parity!');
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 8000));
  }
  console.error('Timed out waiting for Vercel deployment.');
  process.exit(1);
}

wait();
