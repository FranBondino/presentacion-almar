let google;
try {
    google = require('googleapis').google;
} catch (e) {
    try {
        google = require('../portal/node_modules/googleapis').google;
    } catch (e2) {
        console.error('❌ ERROR: No se encontró la librería "googleapis". Ejecutá: npm i googleapis');
        process.exit(1);
    }
}
const fs = require('fs');

/**
 * Script de prueba de lectura de Gmail API para múltiples casillas de ALMAR
 */
async function testGmailAccessMulti(credentialsPath, emailList) {
    console.log('=' .repeat(70));
    console.log('🚀 ALMAR - Escáner Multicasilla de Gmail API (Cuenta de Servicio)');
    console.log('=' .repeat(70));
    console.log(`📄 Archivo de credenciales: ${credentialsPath}`);
    console.log(`📧 Casillas a escanear (${emailList.length}): ${emailList.join(', ')}`);
    console.log('-'.repeat(70));

    if (!fs.existsSync(credentialsPath)) {
        console.error(`❌ ERROR: El archivo '${credentialsPath}' no existe.`);
        process.exit(1);
    }

    const keyData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    for (const impersonateEmail of emailList) {
        console.log(`\n📬 Escaneando casilla: ${impersonateEmail} ...`);

        try {
            const auth = new google.auth.JWT({
                email: keyData.client_email,
                key: keyData.private_key,
                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                subject: impersonateEmail.trim()
            });

            const gmail = google.gmail({ version: 'v1', auth });

            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 3
            });

            const messages = res.data.messages || [];
            console.log(`  ✅ Conexión OK | Mensajes encontrados: ${messages.length}`);

            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                const msgDetail = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date']
                });

                const headers = msgDetail.data.payload.headers || [];
                const getHeader = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '(desconocido)';

                console.log(`     └─ [${i + 1}] De: ${getHeader('From')} | Asunto: ${getHeader('Subject')}`);
            }
        } catch (error) {
            console.error(`  ❌ ERROR en ${impersonateEmail}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 Simulación multicasilla finalizada.');
}

const credentialsPath = process.argv[2] || 'credentials/credentials.json';
const emailsInput = process.argv.slice(3).join(',');

if (!emailsInput) {
    console.log('Uso: node test_gmail_connection.js <ruta_credentials.json> <email1@almar.com.ar> <email2@almar.com.ar> ...');
    console.log('O bien lista separada por comas: node test_gmail_connection.js credentials/credentials.json juan@almar.com.ar,maria@almar.com.ar');
    process.exit(1);
}

const emailList = emailsInput.split(',').map(e => e.trim()).filter(Boolean);
testGmailAccessMulti(credentialsPath, emailList);
