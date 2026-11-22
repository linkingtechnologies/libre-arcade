// SPDX-License-Identifier: MIT
// Dev tooling. Builds the per-level input scripts used by the parity oracle.
// A script is a list of [frame, "down"|"up", key] key presses and
// [frame, "tp", x, y] teleports of the player (used only to skip long walks
// between gems, blocks and the exit; every press that matters is a real key
// event). `checks` are assertions about the digest after a given frame.

const LEVELS = {
  level1: {
    next: "level2",
    goal: [1961, 490],
    steps: [
      { gem: ["water", 1085, 580] },
      { fire: ["water", [[1715, 450], [1715, 350]]] },
    ],
  },
  level2: {
    next: "level3",
    goal: [1961, 700],
    steps: [
      { gem: ["water", 485, 920] },
      { fire: ["earth", [[1415, 650], [1415, 550]]], negative: true },
      { fire: ["water", [[815, 850], [815, 750]]] },
      { drop: true },
      { gem: ["earth", 450, 300] },
      { fire: ["earth", [[1415, 650], [1415, 550]]] },
    ],
  },
  level3: {
    next: "level4",
    goal: [1890, 420],
    steps: [
      { gem: ["water", 705, 1980] },
      { fire: ["water", [[2615, 1930], [2615, 1830]]] },
      { drop: true },
      { gem: ["earth", 3780, 1840] },
      { fire: ["earth", [[1475, 1700], [1475, 1600]]], dx: 95 }, // the blocks stand on a ledge that starts about 140 px to their left
      { drop: true },
      { gem: ["fire", 3745, 610] },
      { fire: ["fire", [[1800, 1400], [1800, 1300]]] },
    ],
  },
  level4: {
    next: null,
    goal: [1955, 490],
    steps: [
      { gem: ["water", 400, 480] },
      { fire: ["water", [[1610, 930], [1610, 830]]] },
      { drop: true },
      { gem: ["earth", 2315, 2420] },
      { fire: ["earth", [[2170, 930], [2170, 830]]] },
      { drop: true },
      { gem: ["fire", 2480, 1020] },
      { fire: ["fire", [[70, 1980], [70, 1880], [0, 1980], [0, 1880]]], facing: "left" },
      { drop: true },
      { gem: ["air", 30, 1980] },
      { fire: ["air", [[1200, 450], [1200, 350], [1270, 450], [1270, 350]]] },
    ],
  },
};

export const LEVEL_NAMES = Object.keys(LEVELS);
export const FUZZ_NAMES = LEVEL_NAMES.map((l) => "fuzz-" + l);

/** Movement scenario: seeded random walking, jumping and ducking from the spawn (no teleports). */
function buildFuzz(level) {
  let seed = 7 + Number(level.slice(-1));
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const script = [];
  const held = new Set();
  const set = (t, key, down) => { if (down === held.has(key)) return; down ? held.add(key) : held.delete(key); script.push([t, down ? "down" : "up", key]); };
  const FRAMES = 1500;
  for (let t = 2; t < FRAMES; t += 6 + Math.floor(rnd() * 55)) {
    const r = rnd();
    set(t, "left", r < 0.3); set(t, "right", r >= 0.3 && r < 0.75); set(t, "down", r >= 0.95);
    set(t, "up", rnd() < 0.35 && r < 0.75);
    if (rnd() < 0.1) { set(t + 2, "z", true); set(t + 8, "z", false); }
    if (rnd() < 0.1) { set(t + 2, "space", true); set(t + 10, "space", false); }
  }
  for (const k of [...held]) script.push([FRAMES, "up", k]);
  return { level, frames: FRAMES + 2, script, checks: [] };
}

const alive = (d, kind, el, xs) => d.objs.filter((o) => o[0] === kind && o[8] === el && o[3] === 1 && (!xs || xs.includes(o[1]))).length;

export function build(name) {
  if (name.startsWith("fuzz-")) return buildFuzz(name.slice(5));
  const level = name;
  const L = LEVELS[level];
  const script = [], checks = [];
  let t = 2;
  const press = (key, hold) => { script.push([t, "down", key]); script.push([t + hold, "up", key]); t += hold + 1; };
  const tp = (x, y) => { script.push([t, "tp", x, y]); t += 45; };
  for (const s of L.steps) {
    if (s.gem) {
      const [el, x, y] = s.gem;
      tp(x + 35, y);
      press("z", 20);
      t += 75;
      const at = t;
      checks.push({ frame: at, desc: `${level}: ${el} powergem acquired with Z`, test: (d) => alive(d, "items", el) === 0 });
    } else if (s.fire) {
      const [el, blocks] = s.fire;
      const left = s.facing === "left";
      const bx = Math.min(...blocks.map((b) => b[0])), by = Math.max(...blocks.map((b) => b[1]));
      const maxx = Math.max(...blocks.map((b) => b[0]));
      tp(left ? maxx + 240 : bx - (s.dx ?? 170), by);
      press(left ? "left" : "right", 2);
      t += 12;
      const before = t;
      script.push([t, "down", "space"]);
      script.push([t + 170, "up", "space"]);
      t += 171 + 130;
      const total = blocks.length;
      const xsOf = [...new Set(blocks.map((b) => b[0]))];
      if (s.negative) {
        checks.push({ frame: t, desc: `${level}: wrong element does not remove ${el} blocks`, test: (d) => alive(d, "blocks", el, xsOf) === total });
      } else {
        checks.push({ frame: t, desc: `${level}: ${el} blocks removed by ${el} element`, test: (d) => alive(d, "blocks", el, xsOf) === 0 });
      }
      void before;
    } else if (s.drop) {
      press("x", 3);
      t += 200;
    }
  }
  tp(L.goal[0] + 30, L.goal[1]);
  t += 60;
  const goalFrame = t;
  if (L.next) checks.push({ frame: goalFrame + 100, desc: `${level}: exit star leads to ${L.next}`, test: (d) => d.state === L.next });
  else {
    t += 400;
    checks.push({ frame: t, desc: `${level}: exit star shows the YOU WIN! end screen`, test: (d) => d.objs.some((o) => String(o[0]).startsWith("text:YOU WIN")) });
  }
  return { level, frames: t + 5, script, checks };
}
