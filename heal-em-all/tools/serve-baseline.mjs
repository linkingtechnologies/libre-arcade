#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// M1 baseline server: serves the UNMODIFIED upstream master tree (reference/upstream-master/app)
// as-is. The only overlay is /styles/main.css, which upstream master does not contain (it was
// generated from styles/main.scss by Compass at build time); we map it to the CSS that upstream
// itself deployed on gh-pages (reference/upstream-gh-pages/styles/ae2f2a90.main.css).
// Every request is appended to evidence/baseline-requests.log. Nothing under reference/ is written.
import { createServer } from "node:http";
import { readFile, appendFile, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../reference/upstream-master/app");
const overlay = new Map([
  ["/styles/main.css", resolve(here, "../reference/upstream-gh-pages/styles/ae2f2a90.main.css")],
  ["/__tools/probe-original.js", resolve(here, "probe-original.js")],
]);
const port = Number(process.argv[2] ?? 8765);
const replAudio = process.argv.includes("--replacement-audio"); // experiment: serve replacement-audio/<name>.wav (WAV bytes) at /audio/<name>.ogg
const noAudio = process.argv.includes("--no-audio"); // experiment: answer 404 for /audio/* to test a muted build
const logFile = resolve(here, "../evidence/baseline-requests.log");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon",
  ".ogg": "audio/ogg", ".mp3": "audio/mpeg", ".tmx": "text/xml; charset=utf-8", ".txt": "text/plain" };

createServer(async (req, res) => {
  // evidence sink: POST /__save/<name.json> writes ../evidence/<name.json> (the only thing this server writes)
  if (req.method === "POST" && /^\/__save\/[\w.-]+$/.test(req.url)) {
    const chunks = []; for await (const c of req) chunks.push(c);
    await writeFile(resolve(here, "../evidence", req.url.slice(8)), Buffer.concat(chunks));
    res.writeHead(204).end(); return;
  }
  const path = decodeURIComponent(req.url.split("?")[0]);
  if (noAudio && path.startsWith("/audio/")) { res.writeHead(404).end("quarantined"); appendFile(logFile, `404 ${req.method} ${req.url} (--no-audio)
`).catch(() => {}); return; }
  const rm = replAudio && path.match(/^\/audio\/(\w+)\.ogg$/);
  if (rm) { try { const body = await readFile(resolve(here, "../replacement-audio", rm[1] + ".wav")); res.writeHead(200, { "Content-Type": "audio/wav" }).end(body); } catch { res.writeHead(404).end(); } return; }
  let file = overlay.get(path);
  if (!file) {
    const p = resolve(root, "." + join(sep, path.endsWith("/") ? path + "index.html" : path));
    if (p !== root && !p.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    file = p;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" }).end(body);
    appendFile(logFile, `200 ${req.method} ${req.url}\n`).catch(() => {});
  } catch {
    res.writeHead(404).end("not found");
    appendFile(logFile, `404 ${req.method} ${req.url}\n`).catch(() => {});
  }
}).listen(port, "127.0.0.1", () => console.log(`baseline on http://127.0.0.1:${port}/`));
