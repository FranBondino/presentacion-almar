const fs = require('fs');
const crypto = require('crypto');

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(keyData, impersonateEmail) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: keyData.private_key_id };
  const payload = {
    iss: keyData.client_email,
    sub: impersonateEmail,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    aud: keyData.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = base64url(signer.sign(keyData.private_key));

  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  });

  const tokenData = await response.json();
  if (!response.ok) {
    throw new Error(`Google Auth Error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function inspectImpoEmails() {
  console.log('=' .repeat(70));
  console.log('📦 ALMAR - Inspección de Correos dirigidos a impo@almarrosario.com');
  console.log('=' .repeat(70));

  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));

  // Probar suplantar directamente a impo@almarrosario.com
  let impoDirectSuccess = false;
  try {
    const token = await getAccessToken(keyData, 'impo@almarrosario.com');
    const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    if (listRes.ok && listData.messages) {
      impoDirectSuccess = true;
      console.log('✅ Lectura directa de impo@almarrosario.com exitosa!');
      await processMessages(token, listData.messages);
    }
  } catch (e) {
    console.log('ℹ️ impo@almarrosario.com funciona como Grupo / Lista de Distribución. Inspeccionando los correos recibidos por el equipo con copia a impo@...\n');
  }

  if (!impoDirectSuccess) {
    // Buscar en casillas del equipo los correos recibidos o enviados a impo@almarrosario.com
    const teamUsers = ['vmeggiolaro@almarrosario.com', 'srossi@almarrosario.com', 'dsilvi@almarrosario.com'];

    for (const u of teamUsers) {
      try {
        console.log(`🔍 Buscando correos de impo@almarrosario.com en la casilla de ${u}...`);
        const token = await getAccessToken(keyData, u);
        const searchRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('impo@almarrosario.com OR "importaciones" OR "FCL" OR "LCL"')}&maxResults=8`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const searchData = await searchRes.json();
        const messages = searchData.messages || [];
        if (messages.length > 0) {
          console.log(`📬 Encontrados ${messages.length} correos operativos de importación en ${u}:\n`);
          await processMessages(token, messages);
          break;
        }
      } catch (err) {
        console.error(`Error en ${u}:`, err.message);
      }
    }
  }
}

async function processMessages(token, messages) {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const msgData = await msgRes.json();
    const headers = msgData.payload?.headers || [];
    const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '(sin dato)';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To');
    const date = getHeader('Date');
    const snippet = msgData.snippet || '';

    // Extraer adjuntos
    const parts = msgData.payload?.parts || [];
    const attachments = parts
      .filter(p => p.filename && p.filename.length > 0)
      .map(p => p.filename);

    console.log(`📌 EJEMPLO #${i + 1}:`);
    console.log(`   De:       ${from}`);
    console.log(`   Para:     ${to}`);
    console.log(`   Asunto:   ${subject}`);
    console.log(`   Fecha:    ${date}`);
    console.log(`   Resumen:  ${snippet.substring(0, 120)}...`);
    if (attachments.length > 0) {
      console.log(`   📎 Adjuntos (${attachments.length}): ${attachments.join(', ')}`);
    } else {
      console.log(`   📎 Adjuntos: (sin archivos adjuntos)`);
    }
    console.log('-'.repeat(70));
  }
}

inspectImpoEmails();
