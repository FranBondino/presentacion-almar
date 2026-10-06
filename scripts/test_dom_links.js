const puppeteer = require('puppeteer');
const path = require('path');

async function test() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Logging in...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('button[type="submit"]')]);

  // Dismiss onboarding tour
  await page.evaluate(() => {
    localStorage.setItem('almar_tour_dismissed', 'true');
    localStorage.setItem('almar_interactive_tour_completed', 'true');
    localStorage.setItem('almar_tour_step', '999');
  });

  console.log('2. Navigating to folder C1234...');
  await page.goto('https://bot-relevamiento.vercel.app/carpetas/c1234000-0000-0000-0000-000000000001', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const omitirBtn = btns.find(b => b.textContent && b.textContent.includes('Omitir'));
    if (omitirBtn) omitirBtn.click();
  });

  console.log('Current URL:', page.url());

  // Save screenshot of C1234
  const shotPath = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478', 'prod_c1234_detail_live.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Saved screenshot to:', shotPath);

  // Check if we are on C1234 page
  const title = await page.title();
  console.log('Page Title:', title);

  // Find all links to PDFs
  const pdfLinks = await page.$$eval('a[href*=".pdf"], a[href*=".PDF"]', els => els.map(e => ({
    text: e.innerText.trim(),
    href: e.href
  })));

  console.log('\nPDF Links found in C1234 DOM:', pdfLinks);

  for (const l of pdfLinks) {
    const res = await page.evaluate(async (url) => {
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        return { status: resp.status, contentType: resp.headers.get('content-type'), contentLength: resp.headers.get('content-length') };
      } catch (err) {
        return { error: err.message };
      }
    }, l.href);
    console.log(`[VERIFY] Link: "${l.text}" -> URL: ${l.href} -> Status: ${res.status}, Type: ${res.contentType}, Bytes: ${res.contentLength}`);
  }

  await browser.close();
  console.log('\nDone!');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
