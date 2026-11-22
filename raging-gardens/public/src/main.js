// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// The page: menus, pause, game over, keyboard and touch input, language, the 50 frames per second
// loop. All game rules live in sim.js; this file only feeds it keys and draws what it reports.

import { Game, KEYS, CONFIG } from "./sim.js";
import { mulberry32 } from "./rng.js";
import { buildArt } from "./art.js";
import { Renderer } from "./render.js";
import { Sound } from "./audio.js";
import { detectLang, t, TEXT } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable: nothing is lost but the preference */ } },
};
const LANG_KEY = "libre-arcade-lang"; // shared with the arcade's landing page
const BEST_KEY = "raging-gardens-best";

const params = new URLSearchParams(location.search);
const fixedSeed = params.has("seed") ? Number(params.get("seed")) >>> 0 : null; // test mode: a reproducible game

const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const art = buildArt();
const renderer = new Renderer(art);
const sound = new Sound();

let lang = detectLang(navigator, store.get(LANG_KEY));
let state = "menu"; // menu | howto | credits | playing | paused | over
let returnTo = "menu";
let game = null;
let acc = 0;
let last = 0;
let best = Number(store.get(BEST_KEY)) || 0;

function newSeed() {
  if (fixedSeed !== null) return fixedSeed;
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

// ------------------------------------------------------------------ text

function applyLang() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(lang, el.dataset.i18n);
  for (const b of document.querySelectorAll("[data-lang]")) b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  $("btn-music").title = t(lang, "music");
  $("btn-sfx").title = t(lang, "sound");
  $("btn-pause").title = t(lang, "pause");
  $("btn-restart").title = t(lang, "restart");
  $("best-menu").textContent = best ? `${t(lang, "best")}: ${best}` : "";
  document.title = t(lang, "title");
  if (state === "over") fillOver();
}

// ------------------------------------------------------------------ screens

const SCREENS = { menu: "screen-menu", howto: "screen-howto", credits: "screen-credits", paused: "screen-pause", over: "screen-over" };

function show(next) {
  state = next;
  for (const [name, id] of Object.entries(SCREENS)) $(id).hidden = name !== next;
  $("hud").hidden = !(next === "playing" || next === "paused" || next === "over");
  document.body.classList.toggle("playing", next === "playing" || next === "paused");
  $("touch").hidden = false;
  if (next === "menu" || next === "howto" || next === "credits") { const b = document.querySelector(`#${SCREENS[next]} button`); if (b && next === "menu") $("menu-play").focus(); }
  if (next === "paused") $("pause-resume").focus();
  if (next === "over") $("over-again").focus();
}

function startGame() {
  sound.unlock();
  game = new Game({ random: mulberry32(newSeed()) });
  renderer.reset();
  acc = 0;
  last = 0;
  $("message").classList.remove("show");
  updateHud();
  show("playing");
  sound.startMusic();
}

function pause() {
  if (state !== "playing") return;
  game.releaseAll();
  releaseTouch();
  show("paused");
  sound.stopMusic();
}
function resume() {
  if (state !== "paused") return;
  show("playing");
  last = 0;
  sound.startMusic();
}

function fillOver() {
  const score = game ? game.score : 0;
  $("over-score").textContent = String(score);
  $("over-text").textContent = t(lang, "gameOverText", { n: score });
  $("over-best").textContent = score > 0 && score >= best && game && game.newBest ? t(lang, "newBest") : (best ? `${t(lang, "best")}: ${best}` : "");
}

function endGame() {
  game.releaseAll();
  releaseTouch();
  game.newBest = game.score > best;
  if (game.newBest) { best = game.score; store.set(BEST_KEY, String(best)); }
  sound.stopMusic();
  show("over");
  fillOver();
  applyLang();
}

// ------------------------------------------------------------------ events from the game

let messageTimer = 0;
function handle(events) {
  if (!events.length) return;
  renderer.notify(events);
  for (const ev of events) {
    if (ev.type === "sound") sound.play(ev.name);
    else if (ev.type === "message") {
      const el = $("message");
      if (ev.id === "clear") { el.classList.remove("show"); continue; }
      el.textContent = t(lang, ev.id);
      el.classList.add("show");
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => el.classList.remove("show"), 60);
    } else if (ev.type === "gameOver") endGame();
  }
}

function updateHud() {
  const s = Math.ceil(game.timeLeftMs / 1000);
  $("timer").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  $("carrots").textContent = String(game.score);
}

// ------------------------------------------------------------------ loop

function frame(now) {
  requestAnimationFrame(frame);
  if (state === "playing" && game) {
    if (last) acc += Math.min(now - last, 250);
    last = now;
    let steps = 0;
    while (acc >= CONFIG.frameMs && steps < 5 && state === "playing") { // at most 5 catch-up steps, as Crafty's fixed timer
      game.step();
      renderer.advance(game);
      handle(game.takeEvents());
      acc -= CONFIG.frameMs;
      steps++;
    }
    if (steps === 5) acc = 0;
    if (game) updateHud();
  }
  if (game) renderer.draw(ctx, game);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ------------------------------------------------------------------ input

const CODE_FOR = { ArrowLeft: KEYS.LEFT, ArrowUp: KEYS.UP, ArrowRight: KEYS.RIGHT, ArrowDown: KEYS.DOWN, KeyZ: KEYS.Z, KeyY: KEYS.Y, KeyQ: KEYS.Q, KeyW: KEYS.W };
const CHAR_FOR = { z: KEYS.Z, y: KEYS.Y, q: KEYS.Q, w: KEYS.W }; // layouts where the physical key differs (AZERTY...)

function keyOf(e) {
  return CODE_FOR[e.code] || CHAR_FOR[(e.key || "").toLowerCase()] || (e.key && e.key.startsWith("Arrow") ? CODE_FOR[e.key] : undefined);
}

addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === "KeyP" || e.key === "Escape") {
    if (state === "playing") { pause(); e.preventDefault(); }
    else if (state === "paused") { resume(); e.preventDefault(); }
    else if (state === "howto" || state === "credits") { show(returnTo); e.preventDefault(); }
    return;
  }
  if (state !== "playing") return;
  const code = keyOf(e);
  if (code === undefined) return;
  e.preventDefault();
  if (e.repeat) return;
  game.keyDown(code);
  handle(game.takeEvents());
});

addEventListener("keyup", (e) => {
  if (state !== "playing") return;
  const code = keyOf(e);
  if (code === undefined) return;
  e.preventDefault();
  game.keyUp(code);
  handle(game.takeEvents());
});

// Touch controls: every button is its own pointer, so several can be held at once.
const heldPointers = new Map(); // pointerId -> {button, code}
function releaseTouch() {
  for (const { button, code } of heldPointers.values()) { button.classList.remove("held"); if (game) game.keyUp(code); }
  heldPointers.clear();
  if (game) handle(game.takeEvents());
}
for (const button of document.querySelectorAll("#touch button[data-key]")) {
  const code = Number(button.dataset.key);
  button.addEventListener("pointerdown", (e) => {
    if (state !== "playing") return;
    e.preventDefault();
    sound.unlock();
    try { button.setPointerCapture(e.pointerId); } catch { /* not capturable: the up event may be missed, blur releases */ }
    heldPointers.set(e.pointerId, { button, code });
    button.classList.add("held");
    game.keyDown(code);
    handle(game.takeEvents());
  });
  const up = (e) => {
    const h = heldPointers.get(e.pointerId);
    if (!h || h.button !== button) return;
    heldPointers.delete(e.pointerId);
    button.classList.remove("held");
    if (game) { game.keyUp(code); handle(game.takeEvents()); }
  };
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("contextmenu", (e) => e.preventDefault());
}

// ------------------------------------------------------------------ wiring

$("menu-play").addEventListener("click", startGame);
$("menu-howto").addEventListener("click", () => { returnTo = "menu"; show("howto"); });
$("menu-credits").addEventListener("click", () => { returnTo = "menu"; show("credits"); });
for (const b of document.querySelectorAll("[data-back]")) b.addEventListener("click", () => show(returnTo));
for (const b of document.querySelectorAll("[data-lang]")) b.addEventListener("click", () => { lang = b.dataset.lang; store.set(LANG_KEY, lang); applyLang(); });
$("btn-pause").addEventListener("click", () => (state === "paused" ? resume() : pause()));
$("btn-restart").addEventListener("click", () => { if (state === "playing" || state === "paused" || state === "over") startGame(); });
$("pause-resume").addEventListener("click", resume);
$("pause-restart").addEventListener("click", startGame);
$("pause-menu").addEventListener("click", () => { sound.stopMusic(); game = null; show("menu"); });
$("over-again").addEventListener("click", startGame);
$("over-menu").addEventListener("click", () => { game = null; show("menu"); });
$("btn-music").addEventListener("click", () => { const on = $("btn-music").getAttribute("aria-pressed") !== "true"; $("btn-music").setAttribute("aria-pressed", String(on)); sound.setMusic(on); });
$("btn-sfx").addEventListener("click", () => { const on = $("btn-sfx").getAttribute("aria-pressed") !== "true"; $("btn-sfx").setAttribute("aria-pressed", String(on)); sound.setSfx(on); });

// The original paused when the window lost focus (Crafty's autoPause); so does this.
addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) document.body.classList.add("touch");
if (!TEXT[lang]) lang = "en";
applyLang();
show("menu");
requestAnimationFrame(frame);

// Handle for the browser smoke tests (tools/e2e); it only reads.
window.__rg = { get state() { return state; }, get game() { return game; }, get lang() { return lang; } };
