// Minimal static file server for exported Next.js site.
// No dependencies. Suitable as a "start file" on shared hosting.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
// Default to serving from ./local/out (sibling of this file)
const ROOT = process.env.ROOT || path.join(__dirname, 'out');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function safeJoin(base, target) {
  const targetPath = path.posix.normalize(target);
  // Disallow path traversal
  const resolved = path.join(base, targetPath);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Cache-Control': 'no-cache', ...headers });
  if (body && (body.pipe || typeof body === 'string' || Buffer.isBuffer(body))) {
    return body.pipe ? body.pipe(res) : res.end(body);
  }
  res.end();
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  try {
    const stream = fs.createReadStream(filePath);
    send(res, 200, stream, { 'Content-Type': type });
  } catch (e) {
    send(res, 404, 'Not Found\n', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';

    let filePath = safeJoin(ROOT, pathname.replace(/^\/+/, ''));
    if (!filePath) return send(res, 400, 'Bad Request\n', { 'Content-Type': 'text/plain; charset=utf-8' });

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveFile(res, filePath);
    }

    // SPA fallback to index.html for unknown routes
    const fallback = path.join(ROOT, 'index.html');
    if (fs.existsSync(fallback)) return serveFile(res, fallback);

    return send(res, 404, 'Not Found\n', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (e) {
    return send(res, 500, 'Internal Server Error\n', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(PORT, () => {
  console.log(`Static server listening on http://localhost:${PORT}`);
  console.log(`Serving from: ${ROOT}`);
});

