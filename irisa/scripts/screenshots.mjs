#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Dev tooling: takes the screenshots in screenshots/ with headless Chrome
// (set CHROME to its path). Usage: node scripts/screenshots.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const chrome = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && existsSync(p));
if (!chrome) throw new Error("Chrome not found; set CHROME");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".mp3": "audio/mpeg" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = http.createServer((req, res) => {
  const p = join(root, "public", req.url.split("?")[0].replace(/\/$/, "/index.html"));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const debug = 9800 + Math.floor(Math.random() * 100);
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${debug}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "irisa-shot-"))}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 80 && !target; i += 1) {
  try { target = (await (await fetch(`http://127.0.0.1:${debug}/json`)).json()).find((t) => t.type === "page"); } catch { /* not yet */ }
  if (!target) await sleep(150);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, (d) => resolve(d.result)); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = (expression) => send("Runtime.evaluate", { expression, returnByValue: true });
async function shot(name, w, h, mobile, steps) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/?irisa-test` });
  await sleep(900);
  await ev("localStorage.setItem('libre-arcade-lang','en')");
  await steps();
  await sleep(500);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  mkdirSync(join(root, "screenshots"), { recursive: true });
  writeFileSync(join(root, "screenshots", name), Buffer.from(data, "base64"));
  console.log("wrote", name);
}
const play = () => ev("document.getElementById('playBtn').click()");
await send("Page.enable");
await shot("01-title.png", 1280, 800, false, async () => {});
await shot("02-in-play.png", 1280, 800, false, async () => { await play(); await ev("window.__irisa.store.loadLevel(8)"); });
await shot("03-level-with-teleporters.png", 1280, 800, false, async () => { await play(); await ev("window.__irisa.store.loadLevel(11)"); });
await shot("04-paused.png", 1280, 800, false, async () => { await play(); await ev("document.getElementById('pauseBtn').click()"); });
await shot("05-mobile.png", 390, 844, true, async () => { await play(); await ev("window.__irisa.store.loadLevel(13)"); });
await shot("06-mobile-landscape.png", 844, 390, true, async () => { await play(); await ev("window.__irisa.store.loadLevel(5)"); });
ws.close();
proc.kill();
server.close();
