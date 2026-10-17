// Faithful port of upstream's generator (carvePath recursion + 5 extra
// carves + random open-cell finish), parametrised by size n, plus three
// player models, to find sensible timer settings.
let seed = 12345;
function rnd() { // mulberry32
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function generate(n) {
  const maze = Array.from({ length: n }, () => Array(n).fill(1));
  function carve(x, y) {
    maze[x][y] = 0;
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]].sort(() => rnd() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2, ny = y + dy * 2;
      if (nx > 0 && ny > 0 && nx < n - 1 && ny < n - 1 && maze[nx][ny] === 1) {
        maze[x + dx][y + dy] = 0;
        carve(nx, ny);
      }
    }
  }
  carve(1, 1);
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rnd() * (n - 2)) + 1, y = Math.floor(rnd() * (n - 2)) + 1;
    if (maze[x][y] === 0) carve(x, y); else i--;
  }
  const open = [];
  for (let r = n - 2; r > 0; r--) for (let c = n - 2; c > 0; c--) if (maze[r][c] === 0) open.push([r, c]);
  const finish = open[Math.floor(rnd() * open.length)];
  return { maze, finish, n };
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function bfs(maze, n, from) {
  const d = Array.from({ length: n }, () => Array(n).fill(-1));
  d[from[0]][from[1]] = 0;
  const q = [from];
  for (let i = 0; i < q.length; i++) {
    const [r, c] = q[i];
    for (const [dr, dc] of N4) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && maze[nr][nc] === 0 && d[nr][nc] < 0) {
        d[nr][nc] = d[r][c] + 1; q.push([nr, nc]);
      }
    }
  }
  return d;
}

// Walking: 3 tiles/s in a straight line; a human loses a bit at corners.
const STEP = 0.42; // seconds per tile
const DECIDE = 0.35; // seconds of hesitation at each junction with a choice

function explore(g, { torch, beaconX, beaconY, R }) {
  const { maze, n, finish } = g;
  const visited = new Set();
  const key = (r, c) => r * n + c;
  const stack = [[1, 1]];
  visited.add(key(1, 1));
  let steps = 0, decisions = 0;
  const seenFinish = (r, c) => Math.abs(r - finish[0]) <= beaconY && Math.abs(c - finish[1]) <= beaconX;
  // Is the branch entered at `nb` (coming from `cur`) a dead end fully inside the torch?
  function visibleDeadEnd(cur, nb) {
    const seen = new Set([key(cur[0], cur[1])]);
    const q = [nb];
    seen.add(key(nb[0], nb[1]));
    for (let i = 0; i < q.length; i++) {
      const [r, c] = q[i];
      if (Math.hypot(r - cur[0], c - cur[1]) > R) return false; // leaves the lit area
      if (r === finish[0] && c === finish[1]) return false;
      for (const [dr, dc] of N4) {
        const nr = r + dr, nc = c + dc;
        if (maze[nr]?.[nc] === 0 && !seen.has(key(nr, nc))) { seen.add(key(nr, nc)); q.push([nr, nc]); }
      }
    }
    return true;
  }
  let guard = 0;
  while (guard++ < 200000) {
    const cur = stack[stack.length - 1];
    if (cur[0] === finish[0] && cur[1] === finish[1]) return { steps, decisions };
    let opts = N4.map(([dr, dc]) => [cur[0] + dr, cur[1] + dc])
      .filter(([r, c]) => maze[r]?.[c] === 0 && !visited.has(key(r, c)));
    if (torch) {
      const filtered = opts.filter((o) => !visibleDeadEnd(cur, o));
      if (filtered.length) opts = filtered;
    }
    if (!opts.length) { stack.pop(); steps++; continue; }
    if (opts.length > 1) decisions++;
    let pick;
    if (torch && seenFinish(cur[0], cur[1])) {
      pick = opts.reduce((a, b) => (Math.hypot(a[0] - finish[0], a[1] - finish[1]) <= Math.hypot(b[0] - finish[0], b[1] - finish[1]) ? a : b));
    } else pick = opts[Math.floor(rnd() * opts.length)];
    visited.add(key(pick[0], pick[1]));
    stack.push(pick);
    steps++;
  }
  throw new Error("no path");
}

const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const fmt = (x) => x.toFixed(0).padStart(4);

const configs = {
  n13: { n: 13, R: 4.5 },
  n21: { n: 21, R: 3.5 },
  n31: { n: 31, R: 2.5 },
};
const RUNS = 3000;
const out = {};
for (const [name, cfg] of Object.entries(configs)) {
  const L = [], opt = [], blind = [], torchT = [];
  for (let i = 0; i < RUNS; i++) {
    const g = generate(cfg.n);
    const d = bfs(g.maze, cfg.n, [1, 1]);
    const len = d[g.finish[0]][g.finish[1]];
    L.push(len);
    opt.push(len * STEP + DECIDE);
    const b = explore(g, { torch: false, beaconX: 0, beaconY: 0, R: 0 });
    blind.push(b.steps * STEP + b.decisions * DECIDE);
    const t = explore(g, { torch: true, beaconX: 13, beaconY: 6, R: cfg.R });
    torchT.push(t.steps * STEP + t.decisions * DECIDE);
  }
  for (const a of [L, opt, blind, torchT]) a.sort((x, y) => x - y);
  out[name] = { cfg, L, opt, blind, torchT };
  console.log(`\n== ${name} (${cfg.n}x${cfg.n}, torch R=${cfg.R}) ==`);
  console.log(`shortest path L : p10 ${fmt(q(L, .1))}  p50 ${fmt(q(L, .5))}  p90 ${fmt(q(L, .9))}  max ${fmt(L[L.length - 1])}  (L<=5: ${(100 * L.filter((x) => x <= 5).length / RUNS).toFixed(1)}%)`);
  console.log(`optimal  seconds: p10 ${fmt(q(opt, .1))}  p50 ${fmt(q(opt, .5))}  p90 ${fmt(q(opt, .9))}`);
  console.log(`torch DFS secs  : p10 ${fmt(q(torchT, .1))}  p50 ${fmt(q(torchT, .5))}  p90 ${fmt(q(torchT, .9))}`);
  console.log(`blind DFS secs  : p10 ${fmt(q(blind, .1))}  p50 ${fmt(q(blind, .5))}  p90 ${fmt(q(blind, .9))}`);
}

// Success rate of each player model for time = max(floor, k * L).
console.log("\nSuccess rate (%) by seconds-per-tile k, time = max(floor, k*L)");
for (const [name, o] of Object.entries(out)) {
  const floor = 5;
  console.log(`-- ${name}`);
  console.log("   k    optimal  torchDFS  blindDFS");
  // Re-run to pair L with each outcome (arrays above were sorted).
  seed = 777;
  const rows = [];
  for (let i = 0; i < 2000; i++) {
    const g = generate(o.cfg.n);
    const d = bfs(g.maze, o.cfg.n, [1, 1]);
    const len = d[g.finish[0]][g.finish[1]];
    const b = explore(g, { torch: false, beaconX: 0, beaconY: 0, R: 0 });
    const t = explore(g, { torch: true, beaconX: 13, beaconY: 6, R: o.cfg.R });
    rows.push({ len, opt: len * STEP + DECIDE, blind: b.steps * STEP + b.decisions * DECIDE, torch: t.steps * STEP + t.decisions * DECIDE });
  }
  for (const k of [0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 8]) {
    const ok = (f) => (100 * rows.filter((r) => r[f] <= Math.max(floor, k * r.len)).length / rows.length).toFixed(0).padStart(6);
    console.log(`  ${String(k).padStart(4)}  ${ok("opt")}   ${ok("torch")}   ${ok("blind")}`);
  }
}

// The settings the game ships (public/src/difficulty.js): time = base + perTile * L.
console.log("\nShipped settings (time = base + perTile * L), win % of each player model");
const shipped = {
  easy: { n: 13, R: 4.5, base: 20, perTile: 2 },
  normal: { n: 21, R: 4, base: 15, perTile: 2, hide: true },
  hard: { n: 31, R: 2.5, base: 10, perTile: 1.25, hide: true },
};
seed = 4242;
for (const [name, s] of Object.entries(shipped)) {
  const rows = [];
  for (let i = 0; i < 2500; i++) {
    const g = generate(s.n);
    const len = bfs(g.maze, s.n, [1, 1])[g.finish[0]][g.finish[1]];
    const b = explore(g, { torch: false, beaconX: 0, beaconY: 0, R: 0 });
    // With hideFinish the finish only counts as seen inside the torch radius.
    const t = explore(g, { torch: true, beaconX: s.hide ? s.R : 13, beaconY: s.hide ? s.R : 6, R: s.R });
    rows.push({ len, torch: t.steps * STEP + t.decisions * DECIDE, blind: b.steps * STEP + b.decisions * DECIDE });
  }
  const given = rows.map((r) => s.base + s.perTile * r.len).sort((a, b) => a - b);
  const win = (f) => (100 * rows.filter((r) => r[f] <= s.base + s.perTile * r.len).length / rows.length).toFixed(0);
  console.log(`${name.padEnd(7)} ${s.n}x${s.n}  torch player ${win("torch")}%  blind player ${win("blind")}%  time given p10/p50/p90 = ${given[250].toFixed(0)}/${given[1250].toFixed(0)}/${given[2250].toFixed(0)} s`);
}
