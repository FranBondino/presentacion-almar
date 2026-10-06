const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('c:/Users/franc/.gemini/antigravity/scratch/node_modules/puppeteer');

const ARTIFACT_DIR = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\824dd515-e69f-412e-9fea-10f4a690b478';
const DIST_DIR = path.resolve(__dirname, '../react');

// Simple static server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '/react/' || reqPath === '') reqPath = '/index.html';
  reqPath = reqPath.replace(/^\/react/, '');
  const filePath = path.join(DIST_DIR, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeMap = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server running on port ${port}`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

  // Navigate to slide 12
  for (let i = 1; i < 12; i++) {
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 100));
  }

  await new Promise(r => setTimeout(r, 1200));

  // Capture screenshot of Slide 12
  const screenshotPath = path.join(ARTIFACT_DIR, 'slide_12_alejandro_noacco_corrected.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`[CAPTURED] ${screenshotPath}`);

  await browser.close();
  server.close();
});
