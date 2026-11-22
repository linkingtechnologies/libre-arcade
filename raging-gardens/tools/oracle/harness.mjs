// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the ORIGINAL game (Crafty 0.6.3 + the author's sources, byte for byte,
// from reference/.fetched/orig) for one scenario and records, after every
// frame, the state both implementations are compared on. Nothing of the
// original is modified; the only things replaced are the sources of
// non-determinism (clock, Math.random, requestAnimationFrame) and the audio
// calls, which are recorded instead of played.

import { mulberry32 } from "/public/src/rng.js";
import { createBot } from "/shared/bot.mjs";
import { canonical } from "/shared/canon.mjs";

const q = new URLSearchParams(location.search);
const mode = q.get("mode") || "greedy";
const seed = Number(q.get("seed") || 1);
const frames = Number(q.get("frames") || 9001);
const name = q.get("name") || `${mode}-${seed}`;
const startCarrots = Number(q.get("carrots") || 0); // scenarios may start with a stock of carrots, to exercise Q and W
const full = q.get("full") === "1"; // keep the readable states too, not only the canonical text
const status = (t) => { document.getElementById("status").textContent = t; };

const FRAME_MS = 20; // Crafty's fixed step: 50 frames per second

// ---- load the original's own sources, in the order its bootstrap used
window._Globals = { env: "dev", version: 0, scene: "main" };
const FAMILY = { fart1: "fart", fart2: "fart", scream1: "scream", scream2: "scream", laughter1: "laughter", laughter2: "laughter" };
let sounds = [];

await window.__loadOriginal("src/config.js");
_Globals.conf = new Config({});
await window.__loadOriginal("src/actor_object.js");
for (const f of ["tilemap", "player", "enemy", "gfx", "scene.game"]) await window.__loadOriginal(`src/${f}.js`);

// Capture the Backbone models: they hold the carrot count and the carrot limit.
let playerModel, tilemapModel;
const P0 = window.Player, T0 = window.Tilemap;
window.Player = P0.extend({ initialize() { P0.prototype.initialize.apply(this, arguments); playerModel = this; } });
window.Tilemap = T0.extend({ initialize() { T0.prototype.initialize.apply(this, arguments); tilemapModel = this; } });

Crafty.init(_Globals.conf.get("screen-width"), _Globals.conf.get("screen-height"), document.getElementById("stage"));
Crafty.paths({ images: "/orig/art/" });
Crafty.audio.play = (n) => { sounds.push(FAMILY[n] || n); };
Crafty.audio.toggleMute = () => {};
Crafty.audio.stop = () => {};

await new Promise((ok, fail) => {
  Crafty.load({
    sprites: {
      "stuz_tiles.png": { tile: 64, tileh: 64, map: { grass: [0, 0], stone_small: [1, 0], stone_big: [2, 0], heysack: [3, 0], tree: [0, 1], bush: [1, 1], barrel: [2, 1] } },
      "stuz_rabbit.png": { tile: 32, tileh: 48, map: { player: [0, 0] } },
      "stuz_enemy.png": { tile: 32, tileh: 48, map: { enemy: [0, 0] } },
      "stuz_fart_moving.png": { tile: 64, tileh: 64, map: { explosion1: [0, 0] } },
      "stuz_carrots.png": { tile: 32, tileh: 32, map: { carrot: [0, 0] } },
      "stuz_forkit.png": { tile: 48, tileh: 48, map: { fork: [0, 0] } },
    },
  }, ok, () => {}, (e) => fail(new Error("asset " + (e && e.src))));
});

// ---- start the game scene exactly as the original does
let gameOver = null;
Crafty.bind("ShowSaveHiscore", (score) => { gameOver = { score }; });
Math.random = mulberry32(seed); // the scene's first act (the map) consumes randomness
const startFrame = Crafty.frame();
Crafty.scene("main");
if (startCarrots) playerModel.set("carrotsCount", startCarrots);
sounds = []; // the music starting is not a gameplay sound

// ---- reading the original's state
const serials = { carrot: new Map(), enemy: new Map() };
function serial(kind, id) {
  const m = serials[kind];
  if (!m.has(id)) m.set(id, m.size + 1);
  return m.get(id);
}
function entities(component) {
  const sel = Crafty(component);
  const out = [];
  for (let i = 0; i < sel.length; i++) out.push(Crafty(sel[i]));
  return out;
}

function snapshot(frameNo) {
  const player = Crafty("player");
  const carrots = entities("carrot").map((c) => ({ s: serial("carrot", c[0]), x: c.x, y: c.y, h: c.health, o: c.occupied, u: c.pulled }));
  const enemies = entities("Enemy").map((e) => ({
    s: serial("enemy", e[0]), x: e.x, y: e.y, tx: e.target.x, ty: e.target.y,
    os: e.target.obj ? serial("carrot", e.target.obj[0]) : 0, pp: e.target.pathpos, pl: e.target.path ? e.target.path.length : 0,
    cp: e.digCarrot.canPull, ds: e.digCarrot.obj ? serial("carrot", e.digCarrot.obj[0]) : 0,
    pu: e.pushedProps.pushed, pf: e.pushedProps.atFrame ? e.pushedProps.atFrame - startFrame : 0,
  }));
  const pid = playerModel.get("pullID");
  return {
    f: frameNo, score: playerModel.get("carrotsCount"),
    pullID: pid ? serial("carrot", pid) : 0,
    px: player.x, py: player.y, canPull: player.digCarrot.canPull,
    digObj: player.digCarrot.obj ? serial("carrot", player.digCarrot.obj[0]) : 0,
    action1: player.actions.action1,
    maxCarrots: tilemapModel.get("maxCarrots"), fork: Crafty("MagicFork").length > 0,
    carrots, enemies, sounds: sounds.slice().sort(),
  };
}

function layout() {
  const types = ["stone_small", "stone_big", "tree", "barrel", "bush", "heysack"];
  return entities("Layer2Tile").map((t) => [t.x / 64, t.y / 64, types.findIndex((n) => t.__c[n]) + 1]);
}

// ---- run
const bot = createBot(mode, seed);
const inputs = [];
const trace = [];
const texts = [];
const initial = { layout: layout(), player: { x: Crafty("player").x, y: Crafty("player").y } };
let overAt = -1;

for (let frame = 0; frame < frames; frame++) {
  const view = {
    px: Crafty("player").x, py: Crafty("player").y, carrotsHeld: playerModel.get("carrotsCount"),
    carrots: entities("carrot").map((c) => ({ x: c.x, y: c.y })),
    enemies: entities("Enemy").map((e) => ({ x: e.x, y: e.y })),
  };
  for (const [type, key] of bot(view)) {
    inputs.push([frame, type, key]);
    Crafty.trigger(type === "d" ? "KeyDown" : "KeyUp", { keyCode: key, key });
  }
  window.__clock += FRAME_MS;
  Crafty.timer.simulateFrames(1);
  if (gameOver) { overAt = frame; break; }
  const snap = snapshot(frame + 1);
  texts.push(canonical(snap));
  sounds = [];
  if (full) trace.push(snap);
  if (frame % 500 === 0) status(`${name}: frame ${frame}`);
}

const result = {
  name, mode, seed, startCarrots, frames: texts.length, overAt,
  finalScore: gameOver ? gameOver.score : playerModel.get("carrotsCount"),
  initial, inputs, frameTexts: texts, trace: full ? trace : undefined,
};
status(`${name}: done, ${texts.length} frames, score ${result.finalScore}`);
await fetch(`/result/${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(result) });
document.title = "DONE";
