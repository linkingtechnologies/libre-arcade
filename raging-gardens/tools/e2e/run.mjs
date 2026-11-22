#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Browser end-to-end smoke test: serves public/ plus the test page, opens it in a headless
// Chromium-family browser (Edge or Chrome; CHROME=... to force), and prints the results.
//
//   node tools/e2e/run.mjs [dir]      dir defaults to public (use game to test the built copy)

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const siteDir = join(root, process.argv[2] || "public");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".ogg": "audio/ogg", ".json": "application/json" };

const candidates = [
  process.env.CHROME,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) { console.error("no Chromium-family browser found; set CHROME"); process.exit(2); }

let result = null;
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "POST" && url.pathname === "/result/smoke") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => { result = JSON.parse(Buffer.concat(chunks).toString()); res.writeHead(204).end(); });
    return;
  }
  const path = decodeURIComponent(url.pathname);
  const [base, rel] = path.startsWith("/e2e/") ? [join(root, "tools/e2e"), path.slice(5)] : [siteDir, path === "/" ? "index.html" : path.slice(1)];
  const file = join(base, normalize(rel));
  if (!file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const profile = mkdtempSync(join(tmpdir(), "rg-e2e-"));
const child = spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/e2e/smoke.html`], { stdio: "ignore" });
const t0 = Date.now();
while (!result && Date.now() - t0 < 90000) await new Promise((r) => setTimeout(r, 300));
child.kill();
await new Promise((r) => setTimeout(r, 400));
try { rmSync(profile, { recursive: true, force: true }); } catch { /* profile still in use */ }
server.close();

if (!result) { console.error("no result (timeout)"); process.exit(1); }
let failed = 0;
for (const [name, ok, detail] of result) { console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `\n       ${detail}`}`); if (!ok) failed++; }
console.log(`${result.length - failed}/${result.length} passed (${browser.split(/[\\/]/).slice(-3, -2)[0]})`);
process.exit(failed ? 1 : 0);
