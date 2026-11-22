// Drives the real page in headless Chrome over the DevTools protocol: keyboard,
// touch pad, swipe, pause, mute, language, restart, end screen, resize and
// orientation. Skipped when Chrome is not installed (set CHROME to point to it).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import test from "node:test";
import { ROOT } from "./helpers/engine.mjs";

const CHROME = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".md": "text/markdown" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function serve() {
  const server = http.createServer((req, res) => {
    const path = join(ROOT, "public", decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!existsSync(path)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(readFileSync(path));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

async function launch(port, lang) {
  const profile = mkdtempSync(join(tmpdir(), "irisa-chrome-"));
  const debugPort = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--autoplay-policy=no-user-gesture-required",
    `--lang=${lang}`, "--window-size=1280,800", "about:blank",
  ], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 80 && !target; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      target = list.find((t) => t.type === "page");
    } catch { /* not up yet */ }
    if (!target) await sleep(150);
  }
  assert.ok(target, "Chrome did not start");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  const problems = [];
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method === "Runtime.exceptionThrown") problems.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") problems.push(msg.params.args.map((a) => a.value).join(" "));
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") problems.push(msg.params.entry.text + " " + (msg.params.entry.url || ""));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  await send("Emulation.setUserAgentOverride", { userAgent: (await send("Browser.getVersion")).userAgent.replace("HeadlessChrome", "Chrome"), acceptLanguage: lang });
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  const page = {
    problems,
    send,
    async goto(path) { await send("Page.navigate", { url: `http://127.0.0.1:${port}${path}` });
      for (let i = 0; i < 50; i += 1) {
        await sleep(150);
        try { if (await page.eval("Boolean(window.__irisa)")) break; } catch { /* navigating */ }
      }
    },
    async eval(expr) {
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async key(name, code) {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: name, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
      await sleep(30);
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: name, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
    },
    async click(selector) {
      const c = await page.eval(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: c[0], y: c[1], button: "left", clickCount: 1 });
      await sleep(60);
    },
    async tap(selector) {
      const c = await page.eval(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c[0], y: c[1] }] });
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(60);
    },
    async swipe(dx, dy) {
      const c = await page.eval(`(() => { const r = document.getElementById('board').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c[0], y: c[1] }] });
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c[0] + dx / 2, y: c[1] + dy / 2 }] });
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c[0] + dx, y: c[1] + dy }] });
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(60);
    },
    async viewport(width, height, mobile = false) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
      await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
      await sleep(250);
    },
    state: () => page.eval(`JSON.stringify((() => { const s = window.__irisa.store; const p = s.player; return { screen: window.__irisa.screen, level: s.state.currentLevelNumber, game: s.state.gameState, x: p && p.x, y: p && p.y, frozen: s.frozenTurnsRemaining }; })())`).then(JSON.parse),
    close() { ws.close(); proc.kill(); try { rmSync(profile, { recursive: true, force: true }); } catch { /* still locked */ } },
  };
  return page;
}


test("browser: keyboard, pause, restart, mute, language, end screen", { skip: !CHROME && "Chrome not found", timeout: 120000 }, async () => {
  const { server, port } = await serve();
  const page = await launch(port, "en-US");
  try {
    await page.goto("/?irisa-test");
    // Title screen, English, nothing audio requested yet, game not running.
    let s = await page.state();
    assert.equal(s.screen, "title");
    assert.equal(await page.eval("document.documentElement.lang"), "en");
    assert.equal(await page.eval("document.querySelector('#playBtn').textContent"), "Play");
    assert.equal(await page.eval("performance.getEntriesByType('resource').filter(r => r.name.endsWith('.mp3')).length"), 0, "no sound file before interaction");
    assert.equal(await page.eval("window.__irisa.sound.unlocked"), false);
    // Keys do nothing on the title screen.
    const x0 = s.x;
    await page.key("ArrowRight", 39);
    await sleep(250);
    assert.equal((await page.state()).x, x0);

    // Play with the mouse, then the original key map.
    await page.click("#playBtn");
    s = await page.state();
    assert.equal(s.screen, "playing");
    assert.equal(await page.eval("window.__irisa.sound.unlocked"), true);
    assert.equal(s.level, 0);
    assert.equal(await page.eval("document.querySelectorAll('.entity').length"), 3);
    await page.key("ArrowRight", 39);
    await sleep(300);
    assert.equal((await page.state()).x, s.x + 1, "arrow key moves one square");
    await page.key("d", 68);
    await sleep(300);
    assert.equal((await page.state()).x, s.x + 2, "D moves right");
    await page.key("a", 65);
    await sleep(300);
    await page.key("w", 87);
    await sleep(300);
    await page.key("s", 83);
    await sleep(300);
    s = await page.state();
    assert.deepEqual([s.x, s.y], [3, 2], "A, W, S moved as the original key map says");
    // R restarts the level.
    await page.key("r", 82);
    await sleep(100);
    s = await page.state();
    assert.deepEqual([s.x, s.y], [2, 2]);

    // Win level 1: five steps right. Then pause during the 2 s delay.
    for (let i = 0; i < 5; i += 1) { await page.key("ArrowRight", 39); await sleep(220); }
    s = await page.state();
    assert.equal(s.game, "WON");
    assert.equal(await page.eval("document.getElementById('app').className"), "won");
    await page.key("p", 80);
    s = await page.state();
    assert.equal(s.screen, "paused");
    assert.equal(await page.eval("getComputedStyle(document.getElementById('pauseScreen')).display"), "flex");
    await sleep(2600);
    assert.equal((await page.state()).level, 0, "the 2 s win timer does not run while paused");
    await page.key("ArrowRight", 39);
    await sleep(100);
    assert.equal((await page.state()).x, 7, "no moves while paused");
    await page.click("#resumeBtn");
    assert.equal((await page.state()).screen, "playing");
    await sleep(2300);
    s = await page.state();
    assert.equal(s.level, 1, "the timer resumes and the next level loads");
    assert.equal(await page.eval("document.querySelector('.entity.player') && 1"), 1);

    // Lose, then the level restarts by itself.
    await page.eval("window.__irisa.store.loadLevel(0)");
    for (let i = 0; i < 12 && (await page.state()).game === "PLAYING"; i += 1) { await page.key("ArrowDown", 40); await sleep(220); }
    s = await page.state();
    assert.equal(s.game, "LOST", "walking into the enemy ends the level");
    assert.equal(await page.eval("document.getElementById('app').className"), "lost");
    await sleep(2300);
    s = await page.state();
    assert.equal(s.game, "PLAYING");
    assert.deepEqual([s.x, s.y], [2, 2]);

    // Restart button, pause/resume with Esc.
    await page.key("ArrowRight", 39);
    await sleep(250);
    await page.click("#restartBtn");
    s = await page.state();
    assert.deepEqual([s.x, s.y], [2, 2]);
    await page.key("Escape", 27);
    assert.equal((await page.state()).screen, "paused");
    await page.key("Escape", 27);
    assert.equal((await page.state()).screen, "playing");

    // Mute: M and the button, remembered.
    assert.equal(await page.eval("window.__irisa.sound.muted"), false);
    await page.key("m", 77);
    assert.equal(await page.eval("window.__irisa.sound.muted"), true);
    assert.equal(await page.eval("localStorage.getItem('irisa-muted')"), "1");
    assert.equal(await page.eval("document.getElementById('soundBtn').getAttribute('aria-pressed')"), "false");
    await page.click("#soundBtn");
    assert.equal(await page.eval("window.__irisa.sound.muted"), false);

    // Language switch and persistence.
    await page.click("#langBtn");
    assert.equal(await page.eval("document.documentElement.lang"), "it");
    assert.equal(await page.eval("document.querySelector('#playBtn').textContent"), "Gioca");
    assert.equal(await page.eval("localStorage.getItem('libre-arcade-lang')"), "it");
    assert.match(await page.eval("document.getElementById('howList').textContent"), /Muoviti di una casella/);
    await page.click("#langBtn");
    assert.equal(await page.eval("document.documentElement.lang"), "en");

    // Level dots: only reached levels are enabled; clicking one loads it.
    assert.equal(await page.eval("document.querySelectorAll('#levels button').length"), 20);
    assert.equal(await page.eval("document.querySelectorAll('#levels button:not(:disabled)').length"), await page.eval("window.__irisa.store.state.currentLevelNumber + 1"));
    await page.eval("window.__irisa.store.loadLevel(3)");
    await sleep(100);
    await page.click("#levels button:nth-child(2)");
    assert.equal((await page.state()).level, 1);

    // End of the game shows the finish screen (the original used alert()).
    await page.eval("window.__irisa.store.loadLevel(19); window.__irisa.store.loadNextLevel();");
    await sleep(100);
    assert.equal((await page.state()).screen, "complete");
    assert.equal(await page.eval("getComputedStyle(document.getElementById('completeScreen')).display"), "flex");
    await page.click("#againBtn");
    s = await page.state();
    assert.deepEqual([s.screen, s.level, s.game], ["playing", 0, "PLAYING"]);

    // Back to the menu and out again.
    await page.key("p", 80);
    await page.click("#menuBtn");
    assert.equal((await page.state()).screen, "title");

    assert.deepEqual(page.problems, [], "no console errors");
  } finally {
    page.close();
    server.close();
  }
});

test("browser: Italian browser gets Italian", { skip: !CHROME && "Chrome not found", timeout: 60000 }, async () => {
  const { server, port } = await serve();
  const page = await launch(port, "it-IT");
  try {
    await page.goto("/?irisa-test");
    assert.equal(await page.eval("document.documentElement.lang"), "it");
    assert.equal(await page.eval("document.querySelector('#playBtn').textContent"), "Gioca");
    assert.equal(await page.eval("document.title"), "Irisa · Libre Arcade");
  } finally {
    page.close();
    server.close();
  }
});

test("browser: touch pad and swipe, layouts, resize and orientation", { skip: !CHROME && "Chrome not found", timeout: 120000 }, async () => {
  const { server, port } = await serve();
  const page = await launch(port, "en-US");
  const layout = () => page.eval(`JSON.stringify((() => {
    const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom, shown: getComputedStyle(e).display !== 'none' }; };
    return { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
      app: r('#app'), main: r('#board'), nav: r('#levels'), footer: r('footer'), fwOver: document.querySelector('footer').scrollWidth - document.querySelector('footer').clientWidth, dpad: r('#dpad'), bar: r('.topbar'), tools: r('.tools'), dots: [...document.querySelectorAll('#levels button')].map(b => b.getBoundingClientRect().right).pop() };
  })())`).then(JSON.parse);
  const overlap = (a, b) => a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
  try {
    await page.goto("/?irisa-test");
    await page.viewport(390, 844, true);
    await page.eval("location.reload()");
    await sleep(1200);
    await page.tap("#playBtn");
    assert.equal((await page.state()).screen, "playing");
    assert.equal((await layout()).dpad.shown, true, "touch pad is shown on a touch screen");

    // D-pad taps (original moves: one square per press).
    let s = await page.state();
    await page.tap(".pad.right");
    await sleep(250);
    assert.equal((await page.state()).x, s.x + 1);
    await page.tap(".pad.down");
    await sleep(250);
    assert.equal((await page.state()).y, s.y + 1);
    await page.tap(".pad.left");
    await sleep(250);
    await page.tap(".pad.up");
    await sleep(250);
    s = await page.state();
    assert.deepEqual([s.x, s.y], [2, 2]);
    // Swipes on the board (fresh level: the enemy has been chasing during the pad taps).
    await page.eval("window.__irisa.store.reloadLevel()");
    await page.swipe(80, 0);
    await sleep(250);
    assert.equal((await page.state()).x, 3, "swipe right");
    await page.swipe(0, 80);
    await sleep(250);
    assert.equal((await page.state()).y, 3, "swipe down");
    await page.swipe(-80, 0);
    await sleep(250);
    await page.swipe(0, -80);
    await sleep(250);
    s = await page.state();
    assert.deepEqual([s.x, s.y], [2, 2], "swipes left and up");
    await page.swipe(8, 5);
    await sleep(250);
    s = await page.state();
    assert.deepEqual([s.x, s.y], [2, 2], "a tiny drag is not a swipe");

    // Layouts: nothing scrolls, board stays square and inside the screen, nothing overlaps.
    const sizes = [[390, 844, true], [844, 390, true], [360, 640, true], [667, 375, true], [768, 1024, true], [1024, 768, true], [1280, 800, false], [1920, 1080, false], [600, 600, false]];
    for (const [w, h, mobile] of sizes) {
      await page.viewport(w, h, mobile);
      const l = await layout();
      const label = `${w}x${h}`;
      assert.ok(l.sw <= l.vw && l.sh <= l.vh, `${label}: page scrolls (${l.sw}x${l.sh})`);
      assert.ok(Math.abs(l.app.w - l.app.h) < 1, `${label}: board not square`);
      assert.ok(l.app.x >= 0 && l.app.r <= l.vw && l.nav.y >= l.bar.b - 1 && l.footer.b <= l.vh + 1, `${label}: board outside the screen`);
      assert.ok(Math.abs(l.main.w - l.main.h) < 1, `${label}: playfield not square`);
      assert.ok(l.footer.x >= -1 && l.footer.r <= l.vw + 1 && l.fwOver <= 1, `${label}: footer credits do not fit on one line`);
      assert.ok(l.dots <= l.app.r + 1, `${label}: level dots wrap or overflow`);
      // The pad stays once a touch has been seen in the session (hybrid devices).
      assert.equal(l.dpad.shown, true, `${label}: pad visibility`);
      if (l.dpad.shown) {
        const box = { x: Math.min(l.app.x, l.footer.x), y: l.nav.y, r: Math.max(l.app.r, l.footer.r), b: l.footer.b };
        assert.ok(!overlap(l.dpad, box), `${label}: pad overlaps the board`);
      }
      assert.ok(!overlap(l.tools, { x: l.nav.x, y: l.nav.y, r: l.nav.r, b: l.nav.b }), `${label}: toolbar overlaps the level dots`);
      assert.ok(l.main.w >= 150, `${label}: board too small`);
      // Playing still works after every resize.
      await page.eval("window.__irisa.store.reloadLevel()");
      const before = await page.state();
      await page.key("ArrowDown", 40);
      await sleep(220);
      await page.key("ArrowUp", 38);
      await sleep(220);
      const after = await page.state();
      assert.deepEqual([after.x, after.y], [before.x, before.y], `${label}: input after resize`);
    }

    // Crisp, undistorted entities: every entity box is square.
    const squares = await page.eval("[...document.querySelectorAll('.entity')].every(e => { const b = e.getBoundingClientRect(); return Math.abs(b.width - b.height) < 1; })");
    assert.equal(squares, true);
    assert.deepEqual(page.problems, [], "no console errors");
  } finally {
    page.close();
    server.close();
  }
});
