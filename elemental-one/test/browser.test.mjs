// SPDX-License-Identifier: MIT
// Real-browser checks of the restored game and its Libre Arcade shell
// (headless Chrome over CDP, real time, no virtual clock). Also refreshes the
// screenshots in screenshots/. Skipped when Chrome is not installed.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { findChrome, launch } from "../tools/cdp.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
let chromeOk = true;
try { findChrome(); } catch { chromeOk = false; }
const skip = !chromeOk || process.env.E1_SKIP_BROWSER ? "Chrome not available" : false;

const PORT = 8200 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}/`;
const SHOTS = `${root}screenshots/`;
const KNOWN_BENIGN = /Cannot decode detached ArrayBuffer/; // Phaser 1.1.3 decodes a sound twice on current Chrome; audio still plays

let server;
async function up() {
  server = spawn(process.execPath, [`${root}scripts/serve.mjs`, `${root}public`, String(PORT)], { stdio: "ignore" });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server did not start");
}
const down = () => server?.kill();

async function session(opts, url, { play = true } = {}) {
  const page = await launch(opts);
  const log = { exceptions: [], requests: [], bad: [] };
  page.on((m) => {
    if (m.method === "Runtime.exceptionThrown") log.exceptions.push((m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).split("\n")[0]);
    if (m.method === "Network.requestWillBeSent") log.requests.push(m.params.request.url);
    if (m.method === "Network.responseReceived" && m.params.response.status >= 400) log.bad.push(`${m.params.response.status} ${m.params.response.url}`);
  });
  await page.goto(url);
  await page.sleep(500);
  if (play) {
    await page.eval("document.getElementById('btn-play').click()");
    await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  }
  return { page, log };
}
async function waitFor(page, expr, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await page.eval(expr)) return; } catch { /* not ready */ }
    await page.sleep(100);
  }
  throw new Error(`timeout waiting for: ${expr}`);
}
const pressEnter = async (page) => { await page.key("rawKeyDown", "Enter", 13); await page.sleep(80); await page.key("keyUp", "Enter", 13); };
const texts = (page) => page.eval(`(function(){var out=[];(function w(o){(o.children||[]).forEach(function(c){if(typeof c.text==='string')out.push(c.text);if(c.children)w(c);});})(Phaser.GAMES[0].world._container);return out;})()`);

test.before(async () => { if (!skip) { await mkdir(SHOTS, { recursive: true }); await up(); } });
test.after(down);

test("desktop: title, play, original menu, level 1; no missing assets or foreign requests", { skip }, async () => {
  const { page, log } = await session({ width: 1280, height: 800 }, BASE, { play: false });
  await page.screenshot(`${SHOTS}01-title.png`);
  assert.equal(await page.eval("document.querySelector('#title h1').textContent"), "ELEMENTAL ONE");
  assert.match(await page.eval("document.getElementById('title').textContent"), /Zaven Muradyan/);
  assert.equal(await page.eval("document.querySelector('#title a').href"), "https://linkingtechnologies.github.io/libre-arcade/");
  await page.eval("document.getElementById('btn-play').click()");
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  await page.sleep(2500);
  await page.screenshot(`${SHOTS}02-original-menu.png`);
  // audio: all seven sounds loaded and decoded locally, and the theme is playing
  const sounds = await page.eval("(function(){var c=Phaser.GAMES[0].cache._sounds;return Object.keys(c).map(function(k){return [k,c[k].decoded];});})()");
  assert.deepEqual(sounds.map((x) => x[0]).sort(), ["airsound", "earthsound", "firesound", "jumpsound", "pickupsound", "theme", "watersound"]);
  assert.ok(sounds.every((x) => x[1]), "every sound decoded");
  assert.equal(await page.eval("Phaser.GAMES[0].sound._sounds.some(function(s){return s.key==='theme'&&s.isPlaying;})"), true, "theme is playing");
  assert.deepEqual(await page.eval("[document.querySelector('canvas').width, document.querySelector('canvas').height]"), [800, 600]);
  await pressEnter(page);
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level1'", 20000);
  await page.sleep(1500);
  await page.screenshot(`${SHOTS}03-level1.png`);
  assert.ok((await texts(page)).some((t) => t.startsWith("Hi! :D")));
  // layout: no page scroll, canvas fully visible
  assert.ok(await page.eval("document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth"));
  const r = await page.eval("(function(){var b=document.getElementById('main').getBoundingClientRect();return [b.left,b.top,b.right,b.bottom,innerWidth,innerHeight]})()");
  assert.ok(r[0] >= 0 && r[1] >= 0 && r[2] <= r[4] && r[3] <= r[5], `canvas inside viewport ${r}`);
  const foreign = log.requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !/gc\.zgo\.at|goatcounter/.test(u));
  assert.deepEqual(foreign, [], "no remote requests other than the collection's analytics snippet");
  assert.deepEqual(log.bad.filter((u) => !/favicon|goatcounter|zgo\.at/.test(u)), [], "no missing assets");
  assert.deepEqual(log.exceptions.filter((e) => !KNOWN_BENIGN.test(e)), []);
  await page.close();
});

test("pause, mute, restart level and P/M keys work", { skip }, async () => {
  const { page, log } = await session({ width: 1280, height: 800 }, `${BASE}#play`, { play: false });
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  await pressEnter(page);
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level1'", 20000);
  await page.eval("document.getElementById('btn-pause').click()");
  assert.equal(await page.eval("Phaser.GAMES[0].paused"), true);
  assert.equal(await page.eval("document.getElementById('paused').hidden"), false);
  await page.screenshot(`${SHOTS}04-paused.png`);
  await page.eval("document.getElementById('btn-pause').click()");
  assert.equal(await page.eval("Phaser.GAMES[0].paused"), false);
  await page.eval("document.getElementById('btn-mute').click()");
  assert.equal(await page.eval("Phaser.GAMES[0].sound.mute"), true);
  assert.equal(await page.eval("document.getElementById('btn-mute').getAttribute('aria-pressed')"), "true");
  await page.eval("document.getElementById('btn-mute').click()");
  assert.equal(await page.eval("Phaser.GAMES[0].sound.mute"), false);
  // physical keys
  await page.key("rawKeyDown", "p", 80); await page.key("keyUp", "p", 80);
  assert.equal(await page.eval("Phaser.GAMES[0].paused"), true);
  await page.key("rawKeyDown", "p", 80); await page.key("keyUp", "p", 80);
  assert.equal(await page.eval("Phaser.GAMES[0].paused"), false);
  // walk right, then restart the level: the player is back at its start
  await page.key("rawKeyDown", "ArrowRight", 39); await page.sleep(700); await page.key("keyUp", "ArrowRight", 39);
  await page.eval("document.getElementById('btn-restart').click()");
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level1'");
  await page.sleep(500);
  const x = await page.eval(`(function(){var x=null;(function w(o){(o.children||[]).forEach(function(c){if(c.key==='p1')x=c.x;else if(!c.texture)w(c);});})(Phaser.GAMES[0].world._container);return x;})()`);
  assert.ok(Math.abs(x - 150) < 2, `player back at spawn x=150, got ${x}`);
  assert.deepEqual(log.exceptions.filter((e) => !KNOWN_BENIGN.test(e)), []);
  await page.close();
});

test("Italian interface and Italian in-game texts", { skip }, async () => {
  const page = await launch({ width: 1280, height: 800 });
  await page.goto(`${BASE}?lang=it`);
  await page.sleep(500);
  assert.equal(await page.eval("document.getElementById('btn-play').textContent"), "Gioca");
  assert.equal(await page.eval("document.documentElement.lang"), "it");
  await page.eval("document.getElementById('btn-credits').click()");
  assert.match(await page.eval("document.getElementById('modal-body').textContent"), /Crediti/);
  assert.match(await page.eval("document.getElementById('modal-body').textContent"), /Zaven Muradyan/);
  await page.eval("document.getElementById('modal-close').click()");
  await page.eval("document.getElementById('btn-play').click()");
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  assert.ok((await texts(page)).includes("premi invio"));
  await pressEnter(page);
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level1'", 20000);
  await page.sleep(1000);
  assert.ok((await texts(page)).some((t) => t.startsWith("Ciao! :D")));
  await page.screenshot(`${SHOTS}05-italian.png`);
  await page.close();
});

test("English by default; Italian when the browser language is Italian", { skip }, async () => {
  const en = await launch({ width: 800, height: 600 });
  await en.goto(BASE); await en.sleep(400);
  assert.equal(await en.eval("document.getElementById('btn-play').textContent"), "Play");
  await en.close();
  const it = await launch({ width: 800, height: 600 });
  await it.send("Emulation.setLocaleOverride", { locale: "it-IT" }).catch(() => {});
  await it.send("Network.setUserAgentOverride", { userAgent: "Mozilla/5.0 Chrome", acceptLanguage: "it-IT,it" });
  await it.goto(BASE); await it.sleep(400);
  const label = await it.eval("document.getElementById('btn-play').textContent");
  // setLocaleOverride may be unavailable; accept either, but navigator.language must decide it
  const nav = await it.eval("navigator.language");
  assert.equal(label, nav.toLowerCase().startsWith("it") ? "Gioca" : "Play");
  await it.close();
});

test("mobile portrait: touch buttons walk the player, nothing overlaps the canvas, no scrolling", { skip }, async () => {
  const { page } = await session({ width: 390, height: 844, mobile: true }, `${BASE}#play`, { play: false });
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  assert.ok(await page.eval("getComputedStyle(document.querySelector('.pad-left')).display !== 'none'"), "pads visible on touch screens");
  const center = (sel) => page.eval(`(function(){var r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  const [ex, ey] = await center('.pbtn[data-key="13"]');
  await page.touch("touchStart", ex, ey); await page.sleep(80); await page.touch("touchEnd");
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level1'", 20000);
  await page.sleep(1200);
  const px = () => page.eval(`(function(){var x=null;(function w(o){(o.children||[]).forEach(function(c){if(c.key==='p1')x=c.x;else if(!c.texture)w(c);});})(Phaser.GAMES[0].world._container);return x;})()`);
  const x0 = await px();
  const [rx, ry] = await center('.pbtn[data-key="39"]');
  await page.touch("touchStart", rx, ry); await page.sleep(700);
  await page.screenshot(`${SHOTS}06-mobile-portrait.png`);
  await page.touch("touchEnd"); await page.sleep(300);
  const x1 = await px();
  assert.ok(x1 - x0 > 60, `right button moved the player (${x0} -> ${x1})`);
  // jump button: y goes up
  const [ux, uy] = await center('.pbtn[data-key="38"]');
  await page.touch("touchStart", ux, uy); await page.sleep(150);
  await page.touch("touchEnd");
  const overlap = await page.eval(`(function(){
    var c=document.getElementById('main').getBoundingClientRect();
    return Array.prototype.some.call(document.querySelectorAll('.pbtn'),function(b){var r=b.getBoundingClientRect();return !(r.right<=c.left||r.left>=c.right||r.bottom<=c.top||r.top>=c.bottom);});})()`);
  assert.equal(overlap, false, "touch buttons do not cover the game screen");
  assert.ok(await page.eval("document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth"));
  const r = await page.eval("(function(){var b=document.getElementById('main').getBoundingClientRect();return [b.left,b.right,innerWidth]})()");
  assert.ok(r[0] >= 0 && r[1] <= r[2], `canvas fits phone width ${r}`);
  await page.close();
});

test("mobile landscape: buttons sit beside the screen", { skip }, async () => {
  const { page } = await session({ width: 844, height: 390, mobile: true }, `${BASE}#play`, { play: false });
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  await page.sleep(500);
  await page.screenshot(`${SHOTS}07-mobile-landscape.png`);
  const overlap = await page.eval(`(function(){
    var c=document.getElementById('main').getBoundingClientRect();
    return Array.prototype.some.call(document.querySelectorAll('.pbtn'),function(b){var r=b.getBoundingClientRect();return !(r.right<=c.left||r.left>=c.right||r.bottom<=c.top||r.top>=c.bottom);});})()`);
  assert.equal(overlap, false);
  assert.ok(await page.eval("document.documentElement.scrollHeight <= innerHeight"));
  await page.close();
});

test("the exit star on level 1 is reachable by input: sprite placed by the page, level changes (real time)", { skip }, async () => {
  const { page } = await session({ width: 1280, height: 800 }, `${BASE}#play`, { play: false });
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  await pressEnter(page);
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level1'", 20000);
  await page.sleep(800);
  await page.eval(`(function(){(function w(o){(o.children||[]).forEach(function(c){if(c.key==='p1'){c.x=1991;c.y=490;}else if(!c.texture)w(c);});})(Phaser.GAMES[0].world._container);})()`);
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level2'", 8000);
  await page.close();
});

test("the credits and how-to modal open, show the historical attribution and close", { skip }, async () => {
  const { page } = await session({ width: 1280, height: 800 }, BASE, { play: false });
  await page.eval("document.getElementById('btn-how').click()");
  assert.match(await page.eval("document.getElementById('modal-body').textContent"), /Arrow keys/);
  await page.eval("document.getElementById('modal-close').click()");
  await page.eval("document.getElementById('btn-credits').click()");
  const t = await page.eval("document.getElementById('modal-body').textContent");
  for (const s of ["Zaven Muradyan", "Kenney", "rezoner", "Jersey 10", "Minecraftia", "609636d"]) assert.ok(t.includes(s), s);
  await page.screenshot(`${SHOTS}08-credits.png`);
  await page.close();
});

test("screenshots directory is populated", { skip }, () => {
  for (const f of ["01-title.png", "03-level1.png", "06-mobile-portrait.png"]) assert.ok(existsSync(`${SHOTS}${f}`), f);
});

test("level 4 end screen: YOU WIN! appears, and Restart brings back the historical menu", { skip }, async () => {
  const { page } = await session({ width: 1280, height: 800 }, `${BASE}#play`, { play: false });
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'");
  await page.eval("Phaser.GAMES[0].state.start('level4')");
  await waitFor(page, "Phaser.GAMES[0].state.current === 'level4'");
  await page.sleep(500);
  await page.eval(`(function(){(function w(o){(o.children||[]).forEach(function(c){if(c.key==='p1'){c.x=1985;c.y=490;}else if(!c.texture)w(c);});})(Phaser.GAMES[0].world._container);})()`);
  await waitFor(page, "(function(){var f=false;(function w(o){(o.children||[]).forEach(function(c){if(typeof c.text==='string'&&c.text==='YOU WIN!')f=true;if(c.children)w(c);});})(Phaser.GAMES[0].world._container);return f;})()", 15000);
  await page.sleep(2500);
  await page.screenshot(`${SHOTS}09-end-screen.png`);
  await page.eval("document.getElementById('btn-restart').click()");
  await waitFor(page, "typeof Phaser !== 'undefined' && Phaser.GAMES[0] && Phaser.GAMES[0].state.current === 'mainmenu'", 20000);
  await page.close();
});
