// Minimal static file server for local preview only (not deployed).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8848;
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json'
};

/*
 * Emulate Vercel's /api serverless functions locally. Vercel routes api/x.js to
 * /api/x and hands it (req, res); we do the same, and clear the require cache so
 * editing a function does not need a server restart.
 */
function runApi(urlPath, req, res) {
  const file = path.join(ROOT, 'api', urlPath.slice('/api/'.length) + '.js');
  if (!file.startsWith(path.join(ROOT, 'api')) || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end('{"error":"No such endpoint."}');
  }
  req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
  delete require.cache[require.resolve(file)];
  Promise.resolve()
    .then(() => require(file)(req, res))
    .catch((e) => {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.startsWith('/api/')) return runApi(urlPath, req, res);
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  // Emulate Vercel cleanUrls: /blog -> blog/index.html, /pages/about -> pages/about.html
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) filePath += '.html';
    else if (fs.existsSync(path.join(filePath, 'index.html'))) filePath = path.join(filePath, 'index.html');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('KoomBei preview on http://localhost:' + PORT));
