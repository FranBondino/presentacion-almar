const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testPdfButtons() {
  console.log('Testing authentic PDF downloads in production...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // Login
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Dismiss onboarding
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
  });

  // Navigate to C1234
  console.log('\n--- 1. Testing C1234 (Acindar) ---');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Find all PDF attachment links on C1234
  const c1234Links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[title="Ver archivo PDF original"]'));
    return anchors.map(a => ({
      href: a.href,
      text: a.innerText.trim(),
      cardText: a.closest('div.border')?.innerText || ''
    }));
  });

  console.log(`Found ${c1234Links.length} PDF attachment buttons on C1234:`);
  for (const item of c1234Links) {
    console.log(`- Card: "${item.cardText.replace(/\n/g, ' ')}" -> Link: ${item.href}`);
    const check = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      return {
        status: resp.status,
        contentType: resp.headers.get('content-type'),
        bytes: buf.byteLength
      };
    }, item.href);
    console.log(`  -> HTTP Result: Status ${check.status} | Type: ${check.contentType} | Size: ${check.bytes} bytes`);
    if (check.status !== 200 || !check.contentType.includes('application/pdf')) {
      throw new Error(`FAILURE on ${item.href}: Status ${check.status}, Type: ${check.contentType}`);
    }
  }

  // Take targeted screenshot of attachments section
  const artifactDir = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478');
  const shotPath = path.join(artifactDir, 'prod_c1234_attachments_verified.png');
  await page.screenshot({ path: shotPath });
  console.log(`Screenshot saved to: ${shotPath}`);

  // Navigate to C1434 (Siderar)
  console.log('\n--- 2. Testing C1434 (Siderar) ---');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1434000-0000-0000-0000-000000000002', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const c1434Links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[title="Ver archivo PDF original"]'));
    return anchors.map(a => ({
      href: a.href,
      text: a.innerText.trim(),
      cardText: a.closest('div.border')?.innerText || ''
    }));
  });

  console.log(`Found ${c1434Links.length} PDF attachment buttons on C1434:`);
  for (const item of c1434Links) {
    console.log(`- Card: "${item.cardText.replace(/\n/g, ' ')}" -> Link: ${item.href}`);
    const check = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      return {
        status: resp.status,
        contentType: resp.headers.get('content-type'),
        bytes: buf.byteLength
      };
    }, item.href);
    console.log(`  -> HTTP Result: Status ${check.status} | Type: ${check.contentType} | Size: ${check.bytes} bytes`);
    if (check.status !== 200 || !check.contentType.includes('application/pdf')) {
      throw new Error(`FAILURE on ${item.href}: Status ${check.status}, Type: ${check.contentType}`);
    }
  }

  await browser.close();
  console.log('\n=== ALL PDF ATTACHMENT TESTS PASSED 100% IN PRODUCTION ===');
}

testPdfButtons().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
