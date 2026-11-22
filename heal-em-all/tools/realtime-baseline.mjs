#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// M1 real-time baseline of the UNMODIFIED original in desktop Chrome via playwright-core (NOT a repo dependency).
//   PLAYWRIGHT_CORE=<path to a node_modules/playwright-core> node tools/realtime-baseline.mjs [baseUrl]
// Start `node tools/serve-baseline.mjs 8765` first. Writes evidence/realtime-baseline.json + evidence/screenshots/*.png
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const base = process.argv[2] ?? "http://127.0.0.1:8765/index.html";
const shots = resolve(here, "../evidence/screenshots"); mkdirSync(shots, { recursive: true });
const result = { base, runs: {} };

async function session(name, ctxOpts, fn) {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext(ctxOpts); const page = await ctx.newPage();
  const rec = { browser: browser.version(), console: [], pageErrors: [], failedRequests: [], external: [] };
  page.on("console", m => rec.console.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", e => rec.pageErrors.push(String(e)));
  page.on("requestfailed", r => rec.failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", r => { const u = r.url(); if (!u.startsWith("http://127.0.0.1")) rec.external.push(`${r.status()} ${u}`); });
  await page.goto(base); await page.waitForFunction(() => window.Game && Game.currentScreen === "start", null, { timeout: 30000 });
  await page.waitForTimeout(800);
  try { await fn(page, rec); } catch (e) { rec.ERROR = String(e.stack || e); }
  result.runs[name] = rec; await browser.close();
}
const shot = (page, n) => page.screenshot({ path: `${shots}/${n}.png` });

await session("desktop-1024x768", { viewport: { width: 1024, height: 768 } }, async (page, rec) => {
  rec.raf = await page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : res(n); }; requestAnimationFrame(f); }));
  rec.canvas = await page.evaluate(() => { const c = document.querySelector("canvas"); return { w: c.width, h: c.height, qw: Game.Q.width, qh: Game.Q.height, audio: Game.Q.audio.type, touchDevice: Game.Q.touchDevice, fonts: [...document.fonts].filter(f => f.status === "loaded").map(f => f.family) }; });
  await shot(page, "01-title");
  await page.keyboard.press("Enter"); await page.waitForTimeout(400); rec.afterEnter = await page.evaluate(() => Game.currentScreen); await shot(page, "02-level-select");
  await page.evaluate(() => Game.stageControlsScreen()); await page.waitForTimeout(300); await shot(page, "03-controls");
  await page.keyboard.press("Enter"); await page.waitForTimeout(600); rec.afterControls = await page.evaluate(() => Game.currentScreen);
  const st = () => page.evaluate(() => ({ x: Game.player.p.x, y: Game.player.p.y, vx: Game.player.p.vx, vy: Game.player.p.vy, lives: Game.Q.state.get("lives") }));
  await page.waitForTimeout(1200); rec.start = await st();
  await page.keyboard.down("ArrowRight"); await page.waitForTimeout(1000); rec.after1sRight = await st(); await page.keyboard.up("ArrowRight");
  rec.realtimePxPerSec = rec.after1sRight.x - rec.start.x;
  await page.keyboard.down("ArrowUp"); await page.waitForTimeout(120); rec.jump = await st(); await page.keyboard.up("ArrowUp");
  await page.waitForTimeout(1500); await shot(page, "04-level1-gameplay");
  // gun pick-up and fire with the real Space key
  await page.evaluate(() => { const p = Game.player; p.p.x = Game.Q.stage().lists.Gun[0].p.x; p.p.y = Game.Q.stage().lists.Gun[0].p.y; });
  await page.waitForTimeout(500);
  rec.gun = await page.evaluate(() => ({ hasGun: Game.Q.state.get("hasGun"), bullets: Game.Q.state.get("bullets") }));
  await page.keyboard.press("Space"); await page.waitForTimeout(400);
  rec.afterSpace = await page.evaluate(() => ({ bullets: Game.Q.state.get("bullets"), bulletSprites: (Game.Q.stage().lists.Bullet || []).length }));
  await shot(page, "05-gun-fired");
  await page.keyboard.press("p"); await page.waitForTimeout(300); rec.paused = await page.evaluate(() => !!Game.Q.stage().paused); await shot(page, "06-paused"); await page.keyboard.press("p");
  await page.evaluate(() => Game.stageLevel(6)); await page.waitForTimeout(1500); await shot(page, "07-level6");
  await page.evaluate(() => { Game.currentLevelData.zombies.healed = 3; Game.currentLevelData.zombies.available = 4; Game.stageEndLevelScreen(); }); await page.waitForTimeout(500); await shot(page, "08-level-summary");
  await page.evaluate(() => { Game.stageEndScreen(); }); await page.waitForTimeout(300); await shot(page, "09-end");
});

await session("mobile-touch-812x375", { viewport: { width: 812, height: 375 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, async (page, rec) => {
  rec.touch = await page.evaluate(() => ({ touchDevice: Game.Q.touchDevice, qw: Game.Q.width, qh: Game.Q.height }));
  await shot(page, "10-mobile-title");
  await page.touchscreen.tap(406, 200); await page.waitForTimeout(500); rec.afterTap = await page.evaluate(() => Game.currentScreen); await shot(page, "11-mobile-level-select");
  await page.evaluate(() => Game.stageLevel(1)); await page.waitForTimeout(1500); await shot(page, "12-mobile-gameplay");
  rec.touchControls = await page.evaluate(() => ({ joypad: !!Game.Q.input.touchControls, touchEnabled: !!(Game.Q.input.touchEnabled || Game.Q.input.joypadEnabled), keys: Object.keys(Game.Q.inputs) }));
});
writeFileSync(resolve(here, "../evidence/realtime-baseline.json"), JSON.stringify(result, null, 1));
console.log(JSON.stringify(result, null, 1).slice(0, 6000));
