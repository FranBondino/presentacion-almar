const fs = require('fs');
const crypto = require('crypto');

/**
 * Autenticación nativa JWT RS256 para Google Cloud Service Account con Delegación Domain-Wide
 * (Sin dependencias externas, funciona nativo en Node 18+)
 */

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(keyData, impersonateEmail, scope) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyData.private_key_id
  };

  const payload = {
    iss: keyData.client_email,
    sub: impersonateEmail,
    scope: scope,
    aud: keyData.token_uri || 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = base64url(signer.sign(keyData.private_key));

  const jwt = `${signatureInput}.${signature}`;

  // Intercambiar JWT por Access Token en Google OAuth Token Endpoint
  const tokenParams = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt
  });

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  });

  const tokenData = await response.json();

  if (!response.ok) {
    throw new Error(`Google Auth Error (${response.status}): ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

async function testGmailNative(credentialsPath, impersonateEmail) {
  console.log('=' .repeat(70));
  console.log('🚀 ALMAR - Prueba Nativa Gmail API (Sin Librerías Externas)');
  console.log('=' .repeat(70));
  console.log(`📄 Archivo de credenciales: ${credentialsPath}`);
  console.log(`📧 Casilla a probar:      ${impersonateEmail}`);
  console.log('-'.repeat(70));

  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ ERROR: El archivo '${credentialsPath}' no existe.`);
    process.exit(1);
  }

  const keyData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  try {
    console.log('🔑 Generando JWT RS256 y solicitando Access Token a Google OAuth2...');
    const accessToken = await getAccessToken(
      keyData,
      impersonateEmail,
      'https://www.googleapis.com/auth/gmail.readonly'
    );
    console.log('✅ Access Token obtenido con éxito de Google Security Services.');

    console.log(`🔍 Consultando bandeja de entrada de '${impersonateEmail}'...`);
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      throw new Error(`Gmail API Error (${listRes.status}): ${JSON.stringify(listData)}`);
    }

    const messages = listData.messages || [];
    console.log(`\n🎉 ¡CONEXIÓN EXITOSA CON GOOGLE WORKSPACE!`);
    console.log(`📬 Se leyeron correctamente ${messages.length} mensajes recientes en '${impersonateEmail}'.\n`);

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '(desconocido)';

      console.log(`  [${i + 1}] ID: ${msg.id}`);
      console.log(`      De:     ${getHeader('From')}`);
      console.log(`      Asunto: ${getHeader('Subject')}`);
      console.log(`      Fecha:  ${getHeader('Date')}\n`);
    }

    console.log('=' .repeat(70));
    console.log('✅ La FASE 1 y FASE 2 están 100% validadas y operativas para el dominio de ALMAR.');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA PRUEBA DE CONEXIÓN:');
    console.error(error.message);
  }
}

const credentialsPath = process.argv[2] || 'credentials/credentials.json';
const impersonateEmail = process.argv[3] || 'vmeggiolaro@almarrosario.com';

testGmailNative(credentialsPath, impersonateEmail);
