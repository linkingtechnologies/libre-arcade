// SPDX-License-Identifier: GPL-3.0-only
// Loads game.js (restored) or the untouched 2011 game.js (reference oracle)
// into an isolated vm context with a virtual clock, so both can be driven
// frame by frame and compared. No browser, no jQuery: the original only needs
// a tiny `$` stub because its core classes touch jQuery just for event
// binding, which the stub reimplements.

import vm from "node:vm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
export const RESTORED = here("../../public/game.js");
export const ORIGINAL = here("../../reference/same-game-gravity/game.js");

function makeEmitter() {
  const h = {};
  return {
    bind(ev, cb) { (h[ev] = h[ev] || []).push(cb); return this; },
    unbind() { for (const k of Object.keys(h)) delete h[k]; return this; },
    trigger(ev, data) { for (const cb of (h[ev] || []).slice()) cb.call(this, { type: ev }, data); return this; },
  };
}

export function createEnv(file, { seededRandom } = {}) {
  const clock = { now: 1_000_000 };
  class FakeDate {
    constructor() { this.t = clock.now; }
    getTime() { return this.t; }
    static now() { return clock.now; }
  }
  const store = new Map();
  const noop = () => {};
  const ctx = {
    console,
    Date: FakeDate,
    setTimeout: noop, clearTimeout: noop,
    navigator: { userAgent: "node", language: "en", languages: ["en"] },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    document: {
      addEventListener: noop, removeEventListener: noop,
      querySelector: () => null, querySelectorAll: () => [],
      documentElement: {}, getElementById: () => null,
    },
    addEventListener: noop, removeEventListener: noop,
    requestAnimationFrame: noop,
  };
  ctx.window = ctx;
  // jQuery stub for the original (ignored by the restored code)
  const emitters = {};
  const $ = (arg) => {
    if (typeof arg === "string") return (emitters[arg] = emitters[arg] || makeEmitter());
    const e = makeEmitter(); e.ready = noop; return e;
  };
  $.extend = (a, b) => Object.assign(a, b);
  $.noop = noop;
  ctx.$ = $;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(file, "utf8"), ctx, { filename: file });
  if (seededRandom) vm.runInContext("Math.random = __rnd", Object.assign(ctx, { __rnd: seededRandom }));
  const orientation = { value: 0 };
  ctx.util.Orientation = { get: () => orientation.value };
  const container = ctx.document.__container = makeEmitter();
  container.addEventListener = container.bind; // restored uses the DOM API
  container.removeEventListener = noop;
  return { ctx, clock, orientation, samegame: ctx.samegame, util: ctx.util, container, $ };
}

/** Deterministic PRNG usable from the test side (same one the game ships). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r6 = (v) => (typeof v === "number" ? Math.round(v * 1e6) / 1e6 : v);

/**
 * Plays a scripted game on a recording renderer and returns the full trace:
 * every renderer call, every game-* event, the grid after each frame.
 */
export function playScenario(file, { seed, difficulty, steps }) {
  const rnd = mulberry32(seed);
  const env = createEnv(file, { seededRandom: rnd });
  const { samegame: g, clock, orientation, container } = env;
  const log = [];
  const rec = (name, ...args) => log.push(`${clock.now - 1_000_000} ${name} ${JSON.stringify(args, (k, v) => r6(v))}`);

  g.RecordingRenderer = function (o) {
    this.gridSize = o.gridSize;
    for (const m of ["clearBricks", "drawBricks", "drawColumn", "drawLine", "drawMap", "drawDestroyHighlight",
      "clearDestroyHighlight", "createDestroyNumber", "updateGameSize"])
      this[m] = (...a) => rec(m, ...a);
    this.getBrickPositionWithAbsolute = (x, y) => ({ x: Math.floor(x / 10), y: Math.floor(this.gridSize.h - y / 10) });
  };

  const size = [{ w: 8, h: 8 }, { w: 12, h: 12 }, { w: 16, h: 16 }][difficulty];
  const nColors = [3, 4, 5][difficulty];
  const colors = g.Colors.get(nColors);
  rec("colors", colors.map((c) => c.rgb));
  const game = new g.Game({
    gridSize: size, colors, container, rendererClass: "RecordingRenderer",
    difficulty, drawHover: false, keepSquare: true,
  });
  rec("grid", game.grid.columns);
  for (const ev of ["game-blockDestroy", "game-gravityChange", "game-change", "game-finish"])
    game.bind(ev, (e, d) => rec(ev, d && d.destroyed ? { nb: d.nb, color: d.color, x: d.x, y: d.y, destroyed: d.destroyed } : d || null));
  game.bindAll();

  let finished = false;
  game.bind("game-finish", () => { finished = true; });
  const gravities = [0, 90, -90, 180];
    for (let frame = 0; frame < steps.frames && !finished; frame++) {
    clock.now += 16;
    if (frame % steps.rotateEvery === steps.rotateEvery - 1) orientation.value = gravities[(frame / steps.rotateEvery | 0) % 4];
    if (frame % steps.clickEvery === 3 && !game.animationIsRunning()) {
      const cols = game.grid.columns; const cand = [];
      for (let x = 0; x < cols.length; x++) for (let y = 0; y < (cols[x] || []).length; y++) if (game.grid.isDestroyable(x, y)) cand.push([x, y]);
      if (cand.length) {
        const [x, y] = cand[Math.floor(rnd() * cand.length)];
        game.onCanvasClick({ pageX: x * 10 + 5, pageY: (size.h - y - 0.5) * 10 });
      }
    }
    game.render();
    log.push(`${clock.now - 1_000_000} state ${JSON.stringify(game.grid.columns)}`);
  }
  return { log, columns: JSON.parse(JSON.stringify(game.grid.columns)), finished, destroys: game.getAllDestroyed().length };
}
