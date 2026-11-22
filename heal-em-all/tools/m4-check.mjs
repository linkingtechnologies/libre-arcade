#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// M4 browser checks of the restored page (Chrome via playwright-core, not a repo dependency):
//   - finger input: real touch events through the on-screen pad (move, jump), in a touch/mobile context
//   - resize and rotation: the canvas follows the window, the current screen is rebuilt, no errors
//   - Italian: no English label is left on any screen when the browser language is Italian; English stays the default
//   - screenshots (EN and IT) in screenshots/
//   PLAYWRIGHT_CORE=<node_modules/playwright-core> node tools/m4-check.mjs [restoredUrl]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const url = process.argv[2] ?? "http://127.0.0.1:8768/";
const shots = resolve(here, "../screenshots"); mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const report = {};
const problems = [];

async function open(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts), page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(String(e))); page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(url); await page.waitForFunction(() => window.Game && Game.currentScreen === "start", null, { timeout: 30000 });
  await page.waitForTimeout(500);
  return { ctx, page, errs };
}
const labels = page => page.evaluate(() => {
  const out = []; for (const st of Game.Q.stages) { if (!st) continue; for (const it of st.items) { if (typeof it.p.label === "string" && it.p.label && it.p.label !== it.p.label * 1 + "") out.push(it.p.label); } } return out;
});
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---- 1. touch ------------------------------------------------------------------------------------------------------
{
  const { ctx, page, errs } = await open({ viewport: { width: 812, height: 375 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: "en-US" });
  const cdp = await ctx.newCDPSession(page); const t = { touchDevice: await page.evaluate(() => Game.Q.touchDevice) };
  await page.evaluate(() => Game.stageLevel(1)); await page.waitForTimeout(1500);
  const touch = async (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
  const st = () => page.evaluate(() => ({ x: Game.player.p.x, vy: Game.player.p.vy, y: Game.player.p.y }));
  const pad = await page.evaluate(() => { return { stages: Game.Q.stages.length, w: Game.Q.cssWidth, h: Game.Q.cssHeight }; });
  t.pad = pad; const y = 310;                                  // pad row: "<" x=101, ">" x=152, "b" x=659, "a" x=760 (css px at 812x375)
  // jump first, from standing on the ground: sample the vertical speed for 400 ms and keep the most negative (upward) value
  await touch("touchStart", 659, y); let minVy = 0; for (let i = 0; i < 14; i++) { await wait(30); minVy = Math.min(minVy, (await st()).vy); } await touch("touchEnd"); t.jumpMinVy = minVy;
  await page.waitForTimeout(1500);
  const s0 = await st(); await touch("touchStart", 152, y); await wait(900); const s1 = await st(); await touch("touchEnd");
  t.rightButtonDx = s1.x - s0.x;
  await page.screenshot({ path: `${shots}/07-mobile-touch.png` });
  t.errors = errs; report.touch = t;
  if (!(t.rightButtonDx > 100)) problems.push("touch: right button did not move the player");
  if (!(t.jumpMinVy < -300)) problems.push("touch: b button did not jump");
  await ctx.close();
}

// ---- 2. resize and rotation ----------------------------------------------------------------------------------------
{
  const { ctx, page, errs } = await open({ viewport: { width: 1024, height: 768 }, locale: "en-US" }); const r = {};
  const size = () => page.evaluate(() => ({ q: [Game.Q.width, Game.Q.height], css: [Game.Q.cssWidth, Game.Q.cssHeight], canvas: [document.querySelector("canvas").width, document.querySelector("canvas").height], screen: Game.currentScreen, win: [innerWidth, innerHeight] }));
  r.start = await size(); await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(700); r.afterGrow = await size();
  await page.setViewportSize({ width: 600, height: 400 }); await page.waitForTimeout(700); r.afterSmall = await size();      // below the 640x320 upsample threshold
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await page.keyboard.press("Enter"); await page.waitForTimeout(400); await page.evaluate(() => Game.stageLevel(1)); await page.waitForTimeout(800);
  const before = await page.evaluate(() => ({ x: Game.player.p.x, lives: Game.Q.state.get("lives") }));
  await page.setViewportSize({ width: 900, height: 600 }); await page.waitForTimeout(800);
  r.inLevel = { before, after: await page.evaluate(() => ({ x: Game.player.p.x, lives: Game.Q.state.get("lives"), screen: Game.currentScreen, hudStages: Game.Q.stages.length, size: [Game.Q.width, Game.Q.height] })) };
  await page.screenshot({ path: `${shots}/08-resized-in-level.png` });
  r.errors = errs; report.resize = r;
  if (r.afterGrow.q[0] !== 1280 || r.afterSmall.css[0] !== 600 || r.afterSmall.canvas[0] !== 1200) problems.push("resize: canvas did not follow the window");
  if (r.inLevel.after.screen !== "level1" || r.inLevel.after.size[0] !== 900) problems.push("resize: level not kept or not resized");
  if (errs.length) problems.push("resize: errors " + errs.join("|"));
  await ctx.close();
}

// ---- 3. languages --------------------------------------------------------------------------------------------------
const SCREENS = [
  ["start", () => Game.stageStartScreen()], ["levelSelect", () => Game.stageLevelSelectScreen()], ["controls", () => Game.stageControlsScreen()],
  ["level1", () => Game.stageLevel(1)], ["summary", () => { Game.Q.state.set("currentLevel", 2); Game.currentLevelData = { zombies: { healed: 3, available: 4 }, health: { collected: 1, available: 2 }, bullets: { waisted: 2, available: 3 }, zombieModeFound: true }; Game.stageEndLevelScreen(); }],
  ["gameOver", () => Game.stageGameOverScreen()], ["end", () => Game.stageEndScreen()],
];
async function languageRun(locale, tag) {
  const { ctx, page, errs } = await open({ viewport: { width: 1024, height: 768 }, locale }); const seen = {};
  seen.lang = await page.evaluate(() => [window.HealI18n.lang, document.documentElement.lang, document.title]);
  let i = 0;
  for (const [name, fn] of SCREENS) {
    await page.evaluate(fn); await page.waitForTimeout(700);
    if (name === "level1") await page.evaluate(() => { Game.player.updateLifePoints(); });   // one hit: shows the "That hurts!" line
    await page.waitForTimeout(300);
    seen[name] = await labels(page);
    if (name === "level1" || name === "summary" || name === "start" || name === "controls") await page.screenshot({ path: `${shots}/${tag}-${String(++i).padStart(2, "0")}-${name}.png` });
  }
  seen.errors = errs; await ctx.close(); return seen;
}
report.en = await languageRun("en-US", "en"); report.it = await languageRun("it-IT", "it");
const enAll = new Set(Object.values(report.en).flat().filter(x => typeof x === "string"));
const itLabels = Object.entries(report.it).filter(([k]) => k !== "lang" && k !== "errors").flatMap(([, v]) => v);
report.untranslated = itLabels.filter(l => enAll.has(l) && !/^\d+$/.test(l) && !["Heal'em All"].includes(l));
if (report.it.lang[0] !== "it" || report.en.lang[0] !== "en") problems.push("language selection");
if (report.untranslated.length) problems.push("untranslated Italian labels: " + report.untranslated.join(" | "));
if (report.en.errors.length || report.it.errors.length) problems.push("errors in language runs");
await browser.close();
writeFileSync(resolve(here, "../evidence/m4-check.json"), JSON.stringify({ ok: problems.length === 0, problems, report }, null, 1));
console.log(JSON.stringify({ ok: problems.length === 0, problems, touch: report.touch, resize: report.resize, untranslated: report.untranslated, itSample: report.it.summary }, null, 1));
process.exit(problems.length ? 1 : 0);
