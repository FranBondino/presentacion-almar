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

async function discoverEmails() {
  console.log('=' .repeat(70));
  console.log('🔍 ALMAR - Buscador Automático de Casillas del Dominio @almarrosario.com');
  console.log('=' .repeat(70));

  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const foundEmails = new Set();
  foundEmails.add('vmeggiolaro@almarrosario.com');

  // 1. Probar Google Admin Directory API (si Juan agregó el permiso de directorio)
  try {
    const token = await getAccessToken(keyData, 'vmeggiolaro@almarrosario.com');
    console.log('🌐 Probando Google Directory API para listar el dominio entero...');
    const dirRes = await fetch('https://admin.googleapis.com/admin/directory/v1/users?domain=almarrosario.com&maxResults=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dirData = await dirRes.json();

    if (dirRes.ok && dirData.users) {
      console.log(`✅ ¡Directory API habilitada! Encontrados ${dirData.users.length} usuarios en el dominio:`);
      for (const u of dirData.users) {
        if (u.primaryEmail && u.primaryEmail.endsWith('@almarrosario.com')) {
          foundEmails.add(u.primaryEmail);
          console.log(`  👤 ${u.name?.fullName || u.primaryEmail} -> ${u.primaryEmail}`);
        }
      }
    } else {
      console.log('ℹ️ Directory API no activada aún por el admin. Buscando emails mediante análisis de cabeceras...');
    }
  } catch (e) {
    console.log('ℹ️ Buscando emails mediante trazabilidad de correos...');
  }

  // 2. Analizar cabeceras de mensajes recientes en la casilla de Vanesa
  try {
    const token = await getAccessToken(keyData, 'vmeggiolaro@almarrosario.com');
    const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    const messages = listData.messages || [];

    for (const msg of messages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];

      for (const h of headers) {
        if (['from', 'to', 'cc', 'bcc'].includes(h.name.toLowerCase())) {
          const matches = h.value.match(/([a-zA-Z0-9._%+-]+@almarrosario\.com)/gi);
          if (matches) {
            matches.forEach(m => foundEmails.add(m.toLowerCase()));
          }
        }
      }
    }
  } catch (e) {
    console.error('Error al analizar correos:', e.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📋 LISTA DE CASILLAS DESCUBIERTAS EN @almarrosario.com (${foundEmails.size}):`);
  console.log('='.repeat(70));
  Array.from(foundEmails).forEach((email, i) => {
    console.log(`  [${i + 1}] ${email}`);
  });
  console.log('='.repeat(70));
}

discoverEmails();
