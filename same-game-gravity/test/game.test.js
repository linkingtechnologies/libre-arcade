// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ORIGINAL, RESTORED, createEnv, playScenario } from "./helpers/harness.mjs";

const pub = (p) => fileURLToPath(new URL("../public/" + p, import.meta.url));
const read = (p) => readFileSync(pub(p), "utf8");
const j = (x) => JSON.parse(JSON.stringify(x));
const nul = (cols, h = 3) => j(cols).map((c) => Array.from({ length: h }, (_, i) => c[i] ?? null));
const make = (cols) => {
  const g = createEnv(RESTORED).samegame;
  const grid = new g.Grid(cols.length, cols[0].length, 3, cols);
  grid.size = { x: cols.length, y: cols[0].length };
  return { g, grid };
};
const fakeRenderer = function () {
  this.getBrickPositionWithAbsolute = (x, y) => ({ x: Math.floor(x / 10), y: Math.floor(8 - y / 10) });
};
const newGame = (e) => {
  const g = e.samegame;
  g.RecordingRenderer = fakeRenderer;
  return new g.Game({ gridSize: { w: 8, h: 8 }, colors: g.Colors.get(3), container: e.container, rendererClass: "RecordingRenderer", difficulty: 0 });
};

test("connected groups: orthogonal only, same colour only", () => {
  // columns are x, the index inside is y (y=0 is the bottom)
  const { grid } = make([[0, 0, 1], [1, 0, 1], [2, 2, 1]]);
  assert.deepEqual(j(grid.computeDestroy(0, 0)).map((p) => `${p.x},${p.y}`).sort(), ["0,0", "0,1", "1,1"]);
  assert.equal(grid.computeDestroy(1, 0).length, 0, "a lone ball is not a group");
  assert.equal(grid.computeDestroy(2, 0).length, 2);
  assert.equal(grid.computeDestroy(0, 2).length, 3, "(0,2),(1,2),(2,2)");
});

test("invalid moves: single ball, empty cell, outside the board (upstream threw)", () => {
  const { grid } = make([[0, 1], [2, null]]);
  assert.equal(grid.isDestroyable(0, 0), false);
  assert.equal(grid.isDestroyable(1, 1), false, "empty cell");
  for (const [x, y] of [[-1, 0], [2, 0], [0, 9], [-5, -5], [99, 3]]) assert.equal(grid.isDestroyable(x, y), false);
  const o = createEnv(ORIGINAL).samegame;
  const og = new o.Grid(2, 2, 3, [[0, 1], [2, null]]);
  og.size = { x: 2, y: 2 };
  assert.throws(() => og.isDestroyable(-1, 0), { name: "TypeError" }, "documents the upstream bug");
});

test("group deletion leaves nulls and touches only the group", () => {
  const { grid } = make([[0, 0], [1, 0], [2, 2]]);
  grid.applyDestroy(grid.computeDestroy(0, 0));
  assert.deepEqual(nul(grid.columns, 2), [[null, null], [1, null], [2, 2]]);
});

test("gravity in the four directions", () => {
  let { grid } = make([[1, null, 2], [null, null, 3]]);
  grid.applyGravity("y");
  assert.deepEqual(nul(grid.columns, 2), [[1, 2], [3, null]]);
  ({ grid } = make([[1, null, 2], [null, null, 3]]));
  grid.applyGravity("-y");
  assert.deepEqual(nul(grid.columns), [[null, 1, 2], [null, null, 3]]);
  ({ grid } = make([[1, null], [null, 2], [3, null]]));
  grid.applyGravity("x");
  assert.deepEqual(nul(grid.columns, 2), [[1, 2], [3, null], [null, null]], "x");
  ({ grid } = make([[1, null], [null, 2], [3, null]]));
  grid.applyGravity("-x");
  assert.deepEqual(nul(grid.columns, 2), [[null, null], [1, null], [3, 2]]);
});

test("score formula equals the upstream endGame() arithmetic", () => {
  // transcription of game.desktop.js lines 359-367 of upstream commit 8fc4b57
  const upstream = (d, blocksRemaining, top, ms) => {
    const gs = [{ w: 8, h: 8 }, { w: 12, h: 12 }, { w: 16, h: 16 }][d], cn = [3, 4, 5][d];
    const rem = Math.floor(2 * gs.w * gs.h * (cn - 1) / (1 + blocksRemaining));
    let dest = 0; for (const t of top) dest += t.nb; dest *= cn - 2;
    const time = Math.floor(50 * Math.exp(-ms * (Math.log(2) / (gs.w * gs.h * 800))));
    return { remainingBlocksScore: rem, destructionScore: dest, timeScore: time, score: rem + dest + time };
  };
  const g = createEnv(RESTORED).samegame;
  for (let d = 0; d < 3; d++) for (const left of [0, 1, 7, 40, 255]) for (const ms of [0, 1500, 60000, 600000]) {
    const top = [{ nb: 9 }, { nb: 6 }, { nb: 3 }, { nb: 2 }];
    assert.deepEqual(j(g.computeScore(d, left, top, ms)), upstream(d, left, top, ms));
  }
  assert.equal(g.computeScore(0, 0, [], 0).timeScore, 50, "full time bonus at t=0");
  assert.equal(g.computeScore(0, 0, [], 0).remainingBlocksScore, 2 * 64 * 2, "board cleared");
});

test("game completion: no pairs left, checkerboard rectangle, and a played game", () => {
  assert.equal(make([[0, 1, 2]]).grid.noMoreDestroyable(), true);
  assert.equal(make([[0, 1], [1, 0]]).grid.noMoreDestroyable(), true);
  assert.equal(make([[0, 0], [1, 2]]).grid.noMoreDestroyable(), false);
  const r = playScenario(RESTORED, { seed: 7, difficulty: 0, steps: { frames: 60000, clickEvery: 30, rotateEvery: 5000 } });
  assert.equal(r.finished, true, "a scripted game ends");
});

test("difficulty table and timeouts", () => {
  const g = createEnv(RESTORED).samegame;
  assert.deepEqual(j(g.Difficulty.gridSize), [{ w: 8, h: 8 }, { w: 12, h: 12 }, { w: 16, h: 16 }]);
  assert.deepEqual(j(g.Difficulty.colorNumber), [3, 4, 5]);
  assert.deepEqual(j(g.Difficulty.timeout), [20000, 20000, 20000]);
});

test("seeded mode is reproducible, default mode is not seeded", () => {
  const gen = (seed) => {
    const g = createEnv(RESTORED).samegame;
    g.setSeed(seed);
    return JSON.stringify([g.Colors.get(4).map((c) => c.rgb.join()), new g.Grid(12, 12, 4).columns]);
  };
  assert.equal(gen(42), gen(42));
  assert.notEqual(gen(42), gen(43));
  const g = createEnv(RESTORED).samegame;
  g.setSeed(5); g.setSeed(null);
  assert.notEqual(JSON.stringify(new g.Grid(12, 12, 4).columns), JSON.stringify(new g.Grid(12, 12, 4).columns));
});

test("restart gives a fresh state", () => {
  const e = createEnv(RESTORED);
  const a = newGame(e); a.allDestroys.push({ nb: 3 }); a.gameIsFinished = true;
  const b = newGame(e);
  assert.equal(b.isFinished(), false);
  assert.equal(b.getAllDestroyed().length, 0);
  assert.equal(b.grid.countBlocks(), 64);
  assert.equal(b.animationIsRunning(), false);
});

test("mouse and touch resolve to the same brick", () => {
  const game = newGame(createEnv(RESTORED));
  game.onCanvasClick({ pageX: 33, pageY: 41 });
  const mouse = j(game.brickClicked); game.brickClicked = null;
  game.onCanvasTouchStart({ touches: [{ pageX: 33, pageY: 41 }] });
  const legacy = j(game.brickClicked); game.brickClicked = null;
  game.onCanvasTouchStart({ pointerType: "touch", pageX: 33, pageY: 41 });
  assert.deepEqual(j(game.brickClicked), mouse);
  assert.deepEqual(legacy, mouse);
});

test("i18n: IT and EN are complete, and every key used by the page exists", () => {
  let dicts;
  vm.runInNewContext(read("i18n.js"), { window: { util: { i18n: { init: (d) => { dicts = d; } } } } });
  const en = Object.keys(dicts.en);
  for (const l of ["it", "fr"]) {
    assert.deepEqual(en.filter((k) => !(k in dicts[l])), [], `${l} misses keys`);
    assert.deepEqual(Object.keys(dicts[l]).filter((k) => !(k in dicts.en)), [], `${l} has extra keys`);
  }
  for (const l of Object.keys(dicts)) for (const k of en) assert.ok(String(dicts[l][k]).trim().length, `${l}.${k} empty`);
  assert.notEqual(dicts.it.new_game, dicts.en.new_game);
  const html = read("index.html");
  const used = new Set([...html.matchAll(/(?<!data-)i18n-([A-Za-z_0-9]+)/g)].map((m) => m[1])
    .concat([...html.matchAll(/data-i18n-(?:aria|title)="([^"]+)"/g)].map((m) => m[1])));
  for (const k of used) assert.ok(k in dicts.en, `page uses missing key ${k}`);
});

test("i18n.get substitutes parameters and falls back to English", () => {
  const e = createEnv(RESTORED);
  e.util.Locale = { get: () => "it" };
  e.util.i18n.init({ en: { a: "x % y" }, it: { b: "ciao" } });
  assert.equal(e.util.i18n.getLang(), "it");
  assert.equal(e.util.i18n.get("a", "2"), "x 2 y");
  assert.equal(e.util.i18n.get("b"), "ciao");
  assert.equal(e.util.i18n.setLang("zz"), false);
});

test("responsive page: viewport meta, no scroll, portrait and short-landscape rules", () => {
  const html = read("index.html"), css = read("game.css");
  assert.match(html, /name="viewport"[^>]*width=device-width/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /clamp\(/);
  assert.match(css, /orientation: portrait/);
  assert.match(css, /max-height: 520px/);
});

test("assets: every local file the page references exists and is non-empty", () => {
  const files = new Set();
  const html = read("index.html"), css = read("game.css"), js = read("game.desktop.js");
  for (const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) if (!/^(https?:|\/\/)/.test(m[1])) files.add(m[1]);
  for (const m of css.matchAll(/url\(([^)"']+)\)/g)) if (!m[1].startsWith("data:")) files.add(m[1]);
  for (const m of js.matchAll(/'([\w-]+\.(?:wav|png|jpg|ttf))'/g)) files.add(m[1]);
  assert.ok(files.size >= 8, [...files].join());
  for (const f of files) assert.ok(existsSync(pub(f)) && statSync(pub(f)).size > 0, `${f} missing`);
});

test("audio: the two sounds are valid PCM WAV files", () => {
  for (const f of ["pop.wav", "swosh.wav"]) {
    const b = readFileSync(pub(f));
    assert.equal(b.toString("ascii", 0, 4), "RIFF");
    assert.equal(b.toString("ascii", 8, 12), "WAVE");
    assert.equal(b.readUInt16LE(20), 1, "PCM");
    assert.equal(b.readUInt32LE(40), b.length - 44, "data length");
    assert.ok(b.length > 2000);
  }
});

test("no remote dependency except the arcade analytics beacon", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /jquery|modernizr|jplayer|google-analytics|twitter\.com|same\.greweb/i);
  assert.equal([...html.matchAll(/<script[^>]*src="(?:https?:)?\/\/([^"/]+)/g)].map((m) => m[1]).join(), "gc.zgo.at");
  for (const f of ["game.css", "game.js", "game.desktop.js", "i18n.js"])
    assert.doesNotMatch(read(f), /https?:\/\/(?!github\.com\/gre\/same-game-gravity|en\.wikipedia\.org|www\.w3\.org)/, f);
});

test("pause: shifting a clock keeps animations from jumping", () => {
  const e = createEnv(RESTORED);
  const p = new e.util.TimeProgression(1000);
  e.clock.now += 400;
  assert.equal(p.getProgression(), 0.4);
  e.clock.now += 5000; // paused for 5 s
  p.shift(5000);
  assert.equal(p.getProgression(), 0.4);
  e.clock.now += 600;
  assert.equal(p.getProgression(), 1);
});

test("storage and scores work without a localStorage", () => {
  const e = createEnv(RESTORED);
  e.ctx.localStorage = undefined;
  const s = e.samegame.Storage;
  assert.equal(s.getTotalScore(), 0);
  s.addToTotalScore(120);
  assert.equal(s.getTotalScore(), 120);
  assert.equal(s.setDifficultyScore(0, 300), true);
  assert.equal(s.setDifficultyScore(0, 100), false);
  s.resetScores();
  assert.equal(s.getTotalScore(), 0);
});
