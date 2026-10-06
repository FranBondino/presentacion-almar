const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * ==============================================================================
 * ALMAR ROSARIO FREIGHT FORWARDING — MULTI-MAILBOX LIVE EXTRACTION PIPELINE
 * Period: 2026-01-01 to 2026-09-03
 * Mailboxes: vmeggiolaro, nhermoso, astampfli, srossi, agomez, llaje @almarrosario.com
 * Authentication: Native JWT RS256 with Google Cloud Service Account
 * ==============================================================================
 */

// Configuration
const CONFIG = {
  credentialsPath: path.resolve(__dirname, '../credentials/credentials.json'),
  cacheDir: path.resolve(__dirname, '../data/extraction_cache'),
  outputRawFile: path.resolve(__dirname, '../data/raw_quotation_threads_2026.json'),
  mailboxes: [
    { email: 'vmeggiolaro@almarrosario.com', name: 'Vanesa Meggiolaro', role: 'Finanzas & Control de Rentabilidad' },
    { email: 'nhermoso@almarrosario.com', name: 'Natali Hermoso', role: 'Operaciones Marítimas & Coordinación Navieras' },
    { email: 'astampfli@almarrosario.com', name: 'Abril Stampfli', role: 'Comercial Terrestres & Facturación' },
    { email: 'srossi@almarrosario.com', name: 'Stefania Rossi', role: 'Administración, Facturación & Cobranzas' },
    { email: 'agomez@almarrosario.com', name: 'Aldana Gomez', role: 'Jefa de Operaciones & Customer Service' },
    { email: 'llaje@almarrosario.com', name: 'Lucía Laje', role: 'Comercial Lead & Grandes Cuentas' },
    { email: 'jarloro@almarrosario.com', name: 'Juan Andrés Arloro', role: 'Dirección General / Comercial Senior' },
    { email: 'vmoyano@almarrosario.com', name: 'Victoria Moyano', role: 'Customer Service Exportaciones & Agentes' },
    { email: 'anoacco@almarrosario.com', name: 'Alejandro Noacco', role: 'Pricing Técnico & Recargos Especiales' },
    { email: 'cdellamea@almarrosario.com', name: 'Cecilia Dellamea', role: 'Operaciones / Documentación HBL & MBL' },
    { email: 'mfusco@almarrosario.com', name: 'Martín Fusco', role: 'Pricing & Emisión de Cotizaciones' },
    { email: 'atalaban@almarrosario.com', name: 'Ana Laura Talaban', role: 'Operaciones de Importación / Aéreo & Marítimo' },
    { email: 'dsilvi@almarrosario.com', name: 'Dalia Silvi', role: 'Administración & Pagos Exterior' },
    { email: 'nguida@almarrosario.com', name: 'Nerea Guida', role: 'Ejecutiva Comercial / Cotizaciones Directas' }
  ],
  query: 'after:2025/12/31 before:2026/09/04 (cotiz* OR tarifa* OR flete* OR quote* OR quotation* OR rfq) -from:uber.com -from:cabify.com',
  headersToExtract: ['Subject', 'From', 'To', 'Cc', 'Date', 'Message-ID', 'References', 'In-Reply-To'],
  concurrencyPerMailbox: 15,
  batchSize: 50,
  delayBetweenBatchesMs: 100,
  maxRetries: 3
};

// Base64URL helper
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Token cache
const tokenCache = new Map();

// Native JWT RS256 Token Exchange
async function getAccessToken(keyData, email) {
  const cached = tokenCache.get(email);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > now + 120) {
    return cached.token;
  }

  const expiry = now + 3600;
  const header = { alg: 'RS256', typ: 'JWT', kid: keyData.private_key_id };
  const payload = {
    iss: keyData.client_email,
    sub: email,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
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

  const tokenParams = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt
  });

  let tokenData = null;
  let attempt = 0;
  while (attempt < 5) {
    try {
      const response = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });
      tokenData = await response.json();
      if (!response.ok) {
        throw new Error(`Google Auth Error for ${email} (${response.status}): ${JSON.stringify(tokenData)}`);
      }
      break;
    } catch (err) {
      attempt++;
      if (attempt >= 5) throw err;
      console.warn(`   [${email}] Auth token exchange attempt ${attempt} failed (${err.message}). Retrying in ${attempt * 1000}ms...`);
      await sleep(attempt * 1000);
    }
  }

  tokenCache.set(email, {
    token: tokenData.access_token,
    expiresAt: expiry
  });

  return tokenData.access_token;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch with retry
async function fetchWithRetry(url, options, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10);
        console.warn(`⚠️ Rate limit (429), backing off for ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        attempt++;
        continue;
      }
      if (!res.ok && res.status >= 500) {
        attempt++;
        await sleep(1000 * Math.pow(1.5, attempt));
        continue;
      }
      return res;
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      console.warn(`⚠️ Fetch attempt ${attempt} failed (${err.message}). Retrying in ${attempt * 1000}ms...`);
      await sleep(1000 * Math.pow(1.5, attempt));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

// Harvest all thread IDs matching query for a single mailbox
async function harvestThreadIds(keyData, mailbox) {
  console.log(`🔍 [${mailbox.email}] Harvesting candidate thread IDs with query: "${CONFIG.query}"...`);
  const token = await getAccessToken(keyData, mailbox.email);
  const threadSummaries = [];
  let pageToken = null;
  let page = 0;

  do {
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(CONFIG.query)}&maxResults=500`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    page++;

    const items = data.threads || [];
    for (const item of items) {
      threadSummaries.push({
        id: item.id,
        snippet: item.snippet || '',
        historyId: item.historyId || ''
      });
    }

    pageToken = data.nextPageToken;
    if (page % 5 === 0 || !pageToken) {
      console.log(`   [${mailbox.email}] Page ${page}: harvested ${threadSummaries.length} thread IDs so far...`);
    }
  } while (pageToken);

  console.log(`✅ [${mailbox.email}] Total candidate threads discovered: ${threadSummaries.length}`);
  return threadSummaries;
}

// Clean concurrency pool with controlled in-flight requests
async function mapConcurrent(items, limit, fn, onProgress) {
  const results = [];
  let currentIndex = 0;
  let completed = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      const res = await fn(items[idx], idx);
      if (res) results.push(res);
      completed++;
      if (onProgress && (completed % 100 === 0 || completed === items.length)) {
        onProgress(completed, items.length, results);
      }
      // Small breathing room between requests per worker
      await sleep(50);
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

// Fetch thread metadata with concurrency control and checkpointing
async function fetchThreadMetadataBatch(keyData, mailbox, threadSummaries) {
  const cacheFile = path.join(CONFIG.cacheDir, `raw_threads_${mailbox.email.split('@')[0]}.json`);
  let existingThreads = [];

  if (fs.existsSync(cacheFile)) {
    try {
      existingThreads = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      console.log(`📂 [${mailbox.email}] Found cache with ${existingThreads.length} threads.`);
    } catch (e) {
      existingThreads = [];
    }
  }

  const existingMap = new Map(existingThreads.map(t => [t.id, t]));
  const toFetch = threadSummaries.filter(th => !existingMap.has(th.id));

  console.log(`🚀 [${mailbox.email}] Need to fetch metadata for ${toFetch.length} threads (${existingMap.size} cached)...`);

  const hdrsParam = CONFIG.headersToExtract.map(h => 'metadataHeaders=' + encodeURIComponent(h)).join('&');
  let results = [...existingThreads];

  if (toFetch.length > 0) {
    const newlyFetched = await mapConcurrent(
      toFetch,
      CONFIG.concurrencyPerMailbox,
      async (item) => {
        const token = await getAccessToken(keyData, mailbox.email);
        const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${item.id}?format=metadata&${hdrsParam}`;
        try {
          const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return null;
          const threadData = await res.json();

          const messages = (threadData.messages || []).map(m => {
            const hdrs = m.payload?.headers || [];
            const getH = (n) => (hdrs.find(h => h.name.toLowerCase() === n.toLowerCase()) || {}).value || '';
            return {
              id: m.id,
              threadId: m.threadId,
              snippet: m.snippet || '',
              date: getH('Date'),
              subject: getH('Subject'),
              from: getH('From'),
              to: getH('To'),
              cc: getH('Cc'),
              messageId: getH('Message-ID'),
              references: getH('References'),
              inReplyTo: getH('In-Reply-To'),
              internalDate: m.internalDate,
              sizeEstimate: m.sizeEstimate
            };
          });

          return {
            id: threadData.id,
            mailbox: mailbox.email,
            historyId: threadData.historyId,
            messageCount: messages.length,
            snippet: item.snippet,
            messages: messages
          };
        } catch (err) {
          console.error(`❌ Error fetching thread ${item.id} in ${mailbox.email}:`, err.message);
          return null;
        }
      },
      (completed, total, currentResults) => {
        console.log(`   [${mailbox.email}] Progress: ${completed}/${total} (${Math.round((completed / total) * 100)}%) - New: ${currentResults.length}, Total: ${results.length + currentResults.length}`);
        // Checkpoint to cache periodically using atomic write
        const currentTotal = [...results, ...currentResults];
        const tmpFile = cacheFile + '.tmp';
        try {
          fs.writeFileSync(tmpFile, JSON.stringify(currentTotal, null, 2), 'utf8');
          fs.renameSync(tmpFile, cacheFile);
        } catch (err) {
          console.warn(`   [${mailbox.email}] Warning writing checkpoint:`, err.message);
        }
      }
    );

    results = [...results, ...newlyFetched];
    const tmpFile = cacheFile + '.tmp';
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(results, null, 2), 'utf8');
      fs.renameSync(tmpFile, cacheFile);
    } catch (err) {
      console.warn(`   [${mailbox.email}] Warning writing final cache:`, err.message);
    }
  }

  console.log(`💾 [${mailbox.email}] Checkpointed ${results.length} threads to ${cacheFile}`);
  return results;
}

// Master extraction runner
async function runExtractionPipeline() {
  const startTime = Date.now();
  console.log('='.repeat(80));
  console.log('🚀 ALMAR ROSARIO — MULTI-MAILBOX LIVE EXTRACTION PIPELINE (M2)');
  console.log('   Target Period: Jan 1, 2026 to Sep 3, 2026');
  console.log(`   Corporate Accounts: ${CONFIG.mailboxes.length} @almarrosario.com mailboxes`);
  console.log('='.repeat(80));

  if (!fs.existsSync(CONFIG.credentialsPath)) {
    throw new Error(`Credentials file not found at ${CONFIG.credentialsPath}`);
  }

  const keyData = JSON.parse(fs.readFileSync(CONFIG.credentialsPath, 'utf8'));

  if (!fs.existsSync(CONFIG.cacheDir)) {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
  }

  const allHarvested = {};
  const mailboxStats = [];

  // Step 1 & 2: Process mailboxes sequentially with cached-first lookup
  console.log(`\n⚡ Launching robust extraction across all ${CONFIG.mailboxes.length} corporate mailboxes...`);
  
  for (const mailbox of CONFIG.mailboxes) {
    const mbStart = Date.now();
    const cacheFile = path.join(CONFIG.cacheDir, `raw_threads_${mailbox.email.split('@')[0]}.json`);
    let threadDetails = [];
    let candidateCount = 0;

    if (fs.existsSync(cacheFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          threadDetails = parsed;
          candidateCount = threadDetails.length;
          console.log(`\n--- Cached Account: ${mailbox.name} <${mailbox.email}> (${mailbox.role}) ---`);
          console.log(`📂 [${mailbox.email}] Found complete cache with ${threadDetails.length} threads. Skipping harvest.`);
        }
      } catch (e) {
        threadDetails = [];
      }
    }

    if (threadDetails.length === 0) {
      console.log(`\n--- Processing Live Account: ${mailbox.name} <${mailbox.email}> (${mailbox.role}) ---`);
      // Harvest candidate thread IDs
      const threadSummaries = await harvestThreadIds(keyData, mailbox);
      candidateCount = threadSummaries.length;

      // Fetch detailed metadata
      threadDetails = await fetchThreadMetadataBatch(keyData, mailbox, threadSummaries);
    }

    const durationSec = Math.round((Date.now() - mbStart) / 1000);
    console.log(`🏁 [${mailbox.email}] Extracted/Loaded: ${threadDetails.length} threads in ${durationSec}s.`);

    allHarvested[mailbox.email] = threadDetails;
    mailboxStats.push({
      email: mailbox.email,
      name: mailbox.name,
      role: mailbox.role,
      candidateThreads: candidateCount,
      extractedThreads: threadDetails.length,
      durationSec: durationSec
    });
  }

  // Step 3: Consolidate raw data file
  console.log('\n📦 Consolidating raw multi-mailbox extraction dataset...');
  const totalExtractedThreads = Object.values(allHarvested).reduce((acc, list) => acc + list.length, 0);

  const rawDataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      query: CONFIG.query,
      period: { start: '2026-01-01', end: '2026-09-03' },
      totalExtractedThreads: totalExtractedThreads,
      mailboxStats: mailboxStats,
      executionDurationSec: Math.round((Date.now() - startTime) / 1000)
    },
    threadsByMailbox: allHarvested
  };

  fs.writeFileSync(CONFIG.outputRawFile, JSON.stringify(rawDataset, null, 2), 'utf8');
  console.log(`\n✅ EXTRACTION COMPLETE!`);
  console.log(`   Total Threads Extracted: ${totalExtractedThreads}`);
  console.log(`   Output Saved To: ${CONFIG.outputRawFile}`);
  console.log(`   Total Execution Time: ${Math.round((Date.now() - startTime) / 1000)}s`);
  console.log('='.repeat(80));

  return rawDataset;
}

if (require.main === module) {
  runExtractionPipeline().catch(err => {
    console.error('FATAL ERROR in extraction pipeline:', err);
    process.exit(1);
  });
}

module.exports = {
  runExtractionPipeline,
  getAccessToken,
  CONFIG
};
