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

async function checkDeployment() {
  console.log('Verificando despliegue de Vercel para cambios de Kanban...');
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const html = await fetchUrl('https://bot-relevamiento.vercel.app/comprobantes?_t=' + Date.now());
      const chunkMatches = html.match(/\/static\/chunks\/[^"]+\.js/g) || [];
      
      let foundNewData = false;
      for (const c of chunkMatches) {
        const js = await fetchUrl('https://bot-relevamiento.vercel.app/_next' + c);
        if (js.includes('HL-BUE-260912') || js.includes('Registrado para Control Contable')) {
          console.log(`[Attempt ${attempt}] ¡NUEVO DEPLOY DETECTADO! Chunk ${c} contiene los cambios de Kanban.`);
          foundNewData = true;
          break;
        }
      }

      if (foundNewData) {
        console.log('✅ Despliegue verificado en producción con éxito.');
        process.exit(0);
      } else {
        console.log(`[Attempt ${attempt}] Esperando compilación de Vercel... (10s)`);
      }
    } catch (err) {
      console.log(`[Attempt ${attempt}] Error de conexión: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log('Timeout esperando despliegue');
  process.exit(1);
}

checkDeployment();
