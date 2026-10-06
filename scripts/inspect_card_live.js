const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://bot-relevamiento.vercel.app';

function createCorporateToken(id, email, role, nombre) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = Buffer.from(
    JSON.stringify({
      sub: id,
      id,
      email,
      role,
      app_metadata: { role, provider: 'corporate_auth' },
      user_metadata: { name: nombre, role },
      exp,
    })
  ).toString('base64url');
  const secret = 'almar-secure-corporate-signature';
  const signature = Buffer.from(secret).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

async function createAuthenticatedPage(browser, role = 'OPERATIVO') {
  const page = await browser.newPage();
  const token = createCorporateToken('usr_' + role, `${role.toLowerCase()}@almar.com.ar`, role, `Test ${role}`);
  await page.setCookie(
    { url: BASE_URL, name: 'almar_auth', value: token, httpOnly: true, secure: true },
    { url: BASE_URL, name: 'sb-access-token', value: token, httpOnly: true, secure: true }
  );

  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().includes('/api/auth/me')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'usr_' + role,
            email: `${role.toLowerCase()}@almar.com.ar`,
            nombre: `Test ${role}`,
            role: role,
            permissions: {
              canAccessFinancials: role === 'GERENCIA' || role === 'ADMIN',
              canEditComprobantes: true,
              canViewAuditLog: true,
              canResolveAlertas: true,
              isAdmin: role === 'ADMIN',
            },
          },
        }),
      });
    } else {
      req.continue();
    }
  });

  return page;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  for (const role of ['OPERATIVO', 'LEAD_OPERACIONES']) {
    console.log(`\nTesting role: ${role}`);
    const page = await createAuthenticatedPage(browser, role);
    await page.goto(`${BASE_URL}/comprobantes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid*="kanban-card"]', { timeout: 10000 });
    
    const info = await page.evaluate(() => {
      const card = document.querySelector('[data-testid*="f0000007"]');
      if (!card) return { found: false, allCardIds: Array.from(document.querySelectorAll('[data-testid*="kanban-card"]')).map(c => c.getAttribute('data-testid')) };
      
      const colEl = card.closest('[data-testid*="column"]') || card.closest('.flex-col') || card.parentElement;
      const colTitle = colEl?.innerText?.slice(0, 100);
      
      const buttons = Array.from(card.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        disabled: b.disabled,
        className: b.className
      }));

      const text = card.innerText;
      return {
        found: true,
        testId: card.getAttribute('data-testid'),
        colTitle,
        buttons,
        textSnippet: text
      };
    });
    console.log(JSON.stringify(info, null, 2));
    await page.close();
  }

  await browser.close();
})();
