#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// Minimal static file server, dependency-free. Any real web server (nginx,
// Apache, `python3 -m http.server`, `npx serve`, GitHub Pages, ...) works
// just as well; this exists only so `npm run dev` / `npm start` need nothing
// beyond Node itself.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.argv[2] ?? 'public');
const port = Number(process.argv[3] ?? process.env.PORT ?? 8080);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'], ['.webp', 'image/webp'], ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'], ['.txt', 'text/plain; charset=utf-8'],
  ['.ttf', 'font/ttf'], ['.ogg', 'audio/ogg'], ['.wav', 'audio/wav']
]);

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400).end('Bad request'); return; }
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    res.writeHead(403).end('Forbidden'); return;
  }
  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types.get(path.extname(target)) || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Grugnetto's KludgopolB: http://127.0.0.1:${port}/`);
});
