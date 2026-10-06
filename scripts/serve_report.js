const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HTML_PATH = path.resolve(__dirname, '../INFORME_COTIZACIONES_ALMAR_2026.html');

const server = http.createServer((req, res) => {
  if (fs.existsSync(HTML_PATH)) {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Report file not found.');
  }
});

server.listen(PORT, () => {
  console.log(`Report server listening at http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
});
