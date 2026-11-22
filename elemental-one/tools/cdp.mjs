// SPDX-License-Identifier: MIT
// Dev tooling only. Minimal Chrome DevTools Protocol driver (no dependencies):
// launches headless Chrome, opens one page, and exposes send/eval helpers.

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

import { existsSync } from "node:fs";

export function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome not found (set CHROME=path)");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 1280, height = 800, mobile = false, port = 9300 + Math.floor(Math.random() * 600) } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "e1-chrome-"));
  const proc = spawn(findChrome(), [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    `--window-size=${width},${height}`, "about:blank",
  ], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (list.length) break;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  const target = list.find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      for (const h of handlers) h(msg);
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const page = {
    send,
    on: (h) => handlers.push(h),
    async eval(expression) {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async goto(url) {
      await send("Page.navigate", { url });
      await sleep(300);
    },
    async screenshot(file) {
      const { writeFile } = await import("node:fs/promises");
      const r = await send("Page.captureScreenshot", { format: "png" });
      await writeFile(file, Buffer.from(r.data, "base64"));
    },
    async key(type, code, keyCode) {
      await send("Input.dispatchKeyEvent", { type, code, key: code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
    },
    async touch(type, x, y) {
      await send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
    },
    sleep,
    async close() {
      try { ws.close(); } catch { /* ignore */ }
      if (process.platform === "win32") { spawn("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } else { proc.kill(); }
      await sleep(300);
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    },
  };
  return page;
}
