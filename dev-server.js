#!/usr/bin/env node
/* Tiny static server for testing PetsDB locally.
   Usage:  node dev-server.js            -> http://localhost:8642
           node dev-server.js --lan      -> also reachable from iPhone/iPad on the same Wi-Fi */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, 'app');
const PORT = Number(process.env.PORT) || 8642;
const LAN = process.argv.includes('--lan');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`PetsDB running at http://localhost:${PORT}`);
  if (LAN) {
    Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal)
      .forEach((i) => console.log(`  On your iPhone/iPad (same Wi-Fi): http://${i.address}:${PORT}`));
  }
});
