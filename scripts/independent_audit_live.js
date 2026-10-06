const https = require('https');

function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verifyAuthAndFeedback() {
  console.log('1. Logging in as admin@almar.com.ar to Live Prod...');
  const loginRes = await post('https://bot-relevamiento.vercel.app/api/auth/login', {
    email: 'admin@almar.com.ar',
    password: 'Almar2026!'
  });
  console.log('Login Status:', loginRes.status);
  const setCookie = loginRes.headers['set-cookie'];
  console.log('Set-Cookie received:', !!setCookie);
  const cookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';

  console.log('2. Querying /api/auth/me with session cookie...');
  const meRes = await get('https://bot-relevamiento.vercel.app/api/auth/me', { Cookie: cookies });
  console.log('Me Status:', meRes.status);
  const meData = JSON.parse(meRes.body);
  console.log('Authenticated User:', meData.user?.email, meData.user?.role, meData.user?.nombre);

  console.log('3. Querying /api/feedback with session cookie...');
  const fbRes = await get('https://bot-relevamiento.vercel.app/api/feedback', { Cookie: cookies });
  console.log('Feedback Status:', fbRes.status);
  const fbData = JSON.parse(fbRes.body);
  console.log('Total stored tickets in prod:', fbData.total);
  fbData.data.forEach((t, i) => {
    console.log(`[${i+1}] Ticket: ${t.ticket_code} | Tipo: ${t.tipo} | Sev: ${t.severidad} | User: ${t.usuario_email} | Carpeta: ${t.carpeta_id} | Mensaje: ${t.mensaje.substring(0, 60)}`);
  });

  console.log('\n4. Submitting a new live feedback ticket as adversarial reviewer test...');
  const newTicketRes = await post('https://bot-relevamiento.vercel.app/api/feedback', {
    tipo: 'EDGE_CASE',
    severidad: 'MEDIA',
    mensaje: 'Adversarial verification ticket by reviewer_victory_r1_r4: validating live endpoint emission and persistence.',
    pantalla: '/dashboard',
    carpeta_id: 'C1234',
    usuario_nombre: meData.user?.nombre || 'Juan Andrés Arloro',
    usuario_email: 'admin@almar.com.ar',
    usuario_rol: 'ADMIN',
    contexto_adicional: { reviewer: 'reviewer_victory_r1_r4', timestamp: new Date().toISOString() }
  }, { Cookie: cookies });

  console.log('Submit Ticket Status:', newTicketRes.status);
  const newTicketData = JSON.parse(newTicketRes.body);
  console.log('Generated Ticket Code:', newTicketData.ticketCode);
  console.log('Message:', newTicketData.message);

  console.log('\n5. Re-querying /api/feedback to confirm persistence of newly minted ticket...');
  const fbRes2 = await get('https://bot-relevamiento.vercel.app/api/feedback', { Cookie: cookies });
  const fbData2 = JSON.parse(fbRes2.body);
  console.log('Updated total tickets:', fbData2.total);
  const found = fbData2.data.find(t => t.ticket_code === newTicketData.ticketCode);
  console.log('Newly generated ticket found in live database/store:', !!found);
  if (found) {
    console.log('Persisted details:', {
      ticket_code: found.ticket_code,
      tipo: found.tipo,
      severidad: found.severidad,
      carpeta_id: found.carpeta_id,
      user: found.usuario_email
    });
  }

  console.log('\n6. Testing Copilot API in production (/api/chat)...');
  const chatRes = await post('https://bot-relevamiento.vercel.app/api/chat', {
    messages: [
      {
        role: 'system',
        content: 'Sos el Asistente Copilot del Portal de Facturación y Operaciones de ALMAR Rosario.'
      },
      {
        role: 'user',
        content: 'Cuál es la provisión para Sancor Seguros y la directiva de margen para C1234?'
      }
    ]
  }, { Cookie: cookies });
  console.log('Chat Status:', chatRes.status);
  console.log('Chat Body:', chatRes.body.substring(0, 300));
}

verifyAuthAndFeedback().catch(console.error);
