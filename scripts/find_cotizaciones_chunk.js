const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('hasCompletedTour', 'true');
      localStorage.setItem('almar_tour_dismissed', 'true');
    } catch(e) {}
  });

  // Login
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'comercial@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  const jsUrls = [];
  page.on('response', res => {
    const url = res.url();
    if (url.includes('/_next/static/chunks/') && url.endsWith('.js')) {
      jsUrls.push(url);
    }
  });

  await page.goto('https://bot-relevamiento.vercel.app/cotizaciones', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Intercepted JS chunks on /cotizaciones:', jsUrls);

  // Check content of page
  const pageContent = await page.evaluate(() => document.body.innerText);
  console.log('Has Acindar in page?:', pageContent.includes('Acindar'));
  console.log('Has Dis-Den in page?:', pageContent.includes('Dis-Den'));
  console.log('Has Molinos in page?:', pageContent.includes('Molinos'));

  await browser.close();
})();
