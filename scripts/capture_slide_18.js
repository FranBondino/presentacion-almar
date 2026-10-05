const path = require('path');
const http = require('http');
const fs = require('fs');
const puppeteer = require('puppeteer');

const DIST_DIR = path.join(__dirname, '..', 'presentacion-react', 'dist');
const TARGET_INDEX = path.join(DIST_DIR, 'index.html');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';
    const filePath = path.join(DIST_DIR, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(TARGET_INDEX).pipe(res);
    }
  });
}

async function capture() {
  const server = createStaticServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(`http://127.0.0.1:${port}`);
  await new Promise(r => setTimeout(r, 1000));

  // Jump to slide 18 by pressing End
  await page.keyboard.press('End');
  await new Promise(r => setTimeout(r, 800));

  const outPath1 = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478', 'slide_18_etapas_roadmap.png');
  await page.screenshot({ path: outPath1 });
  console.log('Saved screenshot 1:', outPath1);

  // Open speaker notes (N)
  await page.keyboard.press('KeyN');
  await new Promise(r => setTimeout(r, 600));

  const outPath2 = path.join('C:', 'Users', 'franc', '.gemini', 'antigravity', 'brain', '824dd515-e69f-412e-9fea-10f4a690b478', 'slide_18_speaker_notes_etapas.png');
  await page.screenshot({ path: outPath2 });
  console.log('Saved screenshot 2:', outPath2);

  await browser.close();
  server.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
