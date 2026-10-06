const https = require('https');

https.get('https://bot-relevamiento.vercel.app/login', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const scripts = body.match(/_next\/static\/[^"]+/g) || [];
    console.log('Unique static script paths on production:');
    console.log([...new Set(scripts)]);
    const buildIdMatch = body.match(/"buildId":"([^"]+)"/);
    if (buildIdMatch) {
      console.log('Build ID:', buildIdMatch[1]);
    }
  });
});
