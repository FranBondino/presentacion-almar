const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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

  const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signatureInput}.${signature}`
    }).toString()
  });

  const tokenData = await response.json();
  return tokenData.access_token;
}

async function downloadTruckingPdf() {
  const keyData = JSON.parse(fs.readFileSync('credentials/credentials.json', 'utf8'));
  const found = JSON.parse(fs.readFileSync('scripts/trucking_invoices_found.json', 'utf8'));
  
  // Buscar mensajes con facturas de transportes
  const targetItems = found.filter(f => 
    f.pdfAttachments.some(p => p.filename.includes('LGV') || p.filename.includes('0069') || p.filename.includes('Transportes') || p.filename.includes('CRT'))
  );

  console.log(`Encontrados ${targetItems.length} comprobantes de transporte para descargar...`);

  for (const item of targetItems.slice(0, 3)) {
    const token = await getAccessToken(keyData, item.user);
    for (const p of item.pdfAttachments) {
      if (!p.attachmentId) continue;
      console.log(`📥 Descargando ${p.filename} de ${item.user}...`);
      const attachRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}/attachments/${p.attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const attachData = await attachRes.json();
      const buffer = Buffer.from(attachData.data, 'base64url');
      fs.writeFileSync(`scripts/${p.filename}`, buffer);
      console.log(`💾 Guardado scripts/${p.filename} (${buffer.length} bytes)`);

      // Intentar extraer texto
      const str = buffer.toString('latin1');
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let match;
      let texts = [];
      while ((match = streamRegex.exec(str)) !== null) {
        try {
          const decomp = zlib.inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1');
          const tMatches = decomp.match(/\(([^()]+)\)/g);
          if (tMatches) texts.push(tMatches.map(m => m.slice(1, -1)).join(' '));
        } catch (e) {}
      }
      console.log(`📄 Texto extraído de ${p.filename}:\n`, texts.join('\n').substring(0, 700));
      console.log('------------------------------------------------------------');
    }
  }
}

downloadTruckingPdf();
