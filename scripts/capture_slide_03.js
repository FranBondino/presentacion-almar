const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'presentacion-react', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function startServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      
      let filePath = path.join(DIST_DIR, reqPath);
      // Fallback for screenshots outside dist
      if (!fs.existsSync(filePath)) {
        filePath = path.join(PROJECT_ROOT, reqPath);
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function captureSlide03() {
  const server = await startServer(4178);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:4178', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Advance to slide 3 (press ArrowRight twice)
  await page.keyboard.press('ArrowRight');
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.press('ArrowRight');
  await new Promise(r => setTimeout(r, 1200));

  const outPath = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478', 'slide_03_sin_datos_clave.png');
  await page.screenshot({ path: outPath });
  console.log('Saved screenshot of slide 3 to:', outPath);

  await browser.close();
  server.close();
}

captureSlide03().catch(err => {
  console.error(err);
  process.exit(1);
});
