const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Login as operativo
  await page.goto('http://localhost:3000/login');
  await page.type('input[type="email"]', 'operativo@almar.com.ar');
  await page.type('input[type="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log('Logged in URL:', page.url());

  // Call impersonate
  const impRes = await page.evaluate(async () => {
    const res = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gerencia@almar.com.ar', role: 'GERENCIA' }),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  });
  console.log('Impersonate result:', impRes);

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  
  // Check auth/me
  const meRes = await page.evaluate(async () => {
    const res = await fetch('/api/auth/me');
    return await res.json();
  });
  console.log('Me result:', meRes);

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Has Métricas Comerciales & Financieras:', bodyText.includes('Métricas Comerciales & Financieras'));
  console.log('Has Volumen Facturado:', bodyText.includes('Volumen Facturado'));
  
  await browser.close();
})();
