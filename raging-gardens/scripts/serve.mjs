#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Minimal static file server, dependency-free. Any real web server (nginx,
// Apache, `python3 -m http.server`, `npx serve`, GitHub Pages, ...) works
// just as well; this exists only so `npm run dev` / `npm start` need nothing
// beyond Node itself.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? "public");
const port = Number(process.argv[3] ?? process.env.PORT ?? 8080);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ogg": "audio/ogg",
  ".webmanifest": "application/manifest+json",
};

async function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname.split("?")[0]);
  const safePath = resolve(root, `.${join(sep, decoded)}`);
  if (safePath !== root && !safePath.startsWith(root + sep)) {
    return null;
  }
  const candidates = safePath.endsWith(sep) || decoded.endsWith("/")
    ? [join(safePath, "index.html")]
    : [safePath, join(safePath, "index.html")];
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

const server = createServer(async (request, response) => {
  const file = await resolveFile(request.url ?? "/");
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  const body = await readFile(file);
  response.writeHead(200, {
    "content-type": MIME_TYPES[extname(file)] ?? "application/octet-stream",
  });
  response.end(body);
});

server.listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}/`);
});
