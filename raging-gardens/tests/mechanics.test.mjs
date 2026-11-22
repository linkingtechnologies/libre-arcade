// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Mechanics checked against values worked out by hand from the original's source
// (the numbers in the comments), independent of the oracle recordings.

import test from "node:test";
import assert from "node:assert/strict";
import { Game, KEYS, CONFIG } from "../public/src/sim.js";
import { Graph } from "../public/src/astar.js";
import { mulberry32 } from "../public/src/rng.js";

function bare(seed = 1) {
  const g = new Game({ random: mulberry32(seed) });
  g.obstacles = [];
  g.carrots = [];
  g.enemies = [];
  g.gameTick = Infinity; // no automatic spawning unless a test wants it
  return g;
}
function carrotAt(g, x, y) {
  const c = { serial: ++g.carrotSerial, x, y, health: 100, pulled: false, occupied: false, dead: false };
  g.carrots.push(c);
  return c;
}
function enemyAt(g, x, y) {
  const e = g.spawnEnemy();
  e.x = x; e.y = y;
  return e;
}
function frames(g, n) { for (let i = 0; i < n; i++) g.step(); }
const sounds = (g) => g.takeEvents().filter((e) => e.type === "sound").map((e) => e.name);

test("constants of the original: three minutes, 50 frames per second, 1024 x 768, 27 obstacles", () => {
  assert.equal(CONFIG.gameTimeLimit, 180000);
  assert.equal(CONFIG.frameMs, 20);
  assert.equal(CONFIG.screenWidth * CONFIG.screenHeight, 1024 * 768);
  const g = new Game({ random: mulberry32(7) });
  assert.equal(g.obstacles.length, 27);
  assert.equal(new Set(g.obstacles.map((o) => `${o.tx},${o.ty}`)).size, 27);
});

test("the player starts at the centre tile (8, 6) unless a scenery piece is there", () => {
  const g = bare();
  assert.deepEqual(g.spawnAtCentre(), { x: 512, y: 384 });
  g.obstacles = [{ tx: 8, ty: 6, kind: 1 }];
  assert.deepEqual(g.spawnAtCentre(), { x: 9 * 64, y: 6 * 64 }); // first step of the spiral: one tile east
});

test("pulling a carrot takes 50 frames (health 100, 2 per frame) and gives 2 carrots", () => {
  const g = bare();
  carrotAt(g, g.player.x - 8, g.player.y + 40); // overlaps the player's feet box
  g.keyDown(KEYS.Z);
  frames(g, 1); // the first frame notices the carrot
  assert.equal(g.player.digCarrot.canPull, true);
  frames(g, 48); // 48 frames of pulling: health 100 - 96
  assert.equal(g.player.carrotsCount, 0);
  frames(g, 1); // health 2
  assert.equal(g.player.carrotsCount, 0);
  frames(g, 1); // health 0: pulled
  assert.equal(g.player.carrotsCount, 2);
  assert.equal(g.carrots.length, 0);
  assert.deepEqual(sounds(g), ["pull"]);
});

test("an enemy pulls with 2.25 per frame: 45 frames", () => {
  const g = bare();
  const c = carrotAt(g, 640, 64);
  const e = enemyAt(g, 640, 64);
  e.digCarrot.canPull = true; e.digCarrot.obj = c;
  frames(g, 44); // 100 - 44 * 2.25 = 1
  assert.equal(g.carrots.length, 1);
  frames(g, 1); // -1.25
  assert.equal(g.carrots.length, 0);
  assert.equal(c.pulled, true);
});

test("Z must be held: releasing it stops the pull", () => {
  const g = bare();
  const c = carrotAt(g, g.player.x - 8, g.player.y + 40);
  g.keyDown(KEYS.Z);
  frames(g, 11); // notice + 10 pulls
  g.keyUp(KEYS.Z);
  frames(g, 30);
  assert.equal(c.health, 80);
});

test("a key held down does not repeat: after a carrot is pulled a fresh press is needed", () => {
  const g = bare();
  carrotAt(g, g.player.x - 8, g.player.y + 40);
  carrotAt(g, g.player.x - 8, g.player.y + 40);
  g.keyDown(KEYS.Z);
  g.keyDown(KEYS.Z); // auto-repeat of the browser: ignored
  frames(g, 51);
  assert.equal(g.player.carrotsCount, 2);
  const second = g.carrots[0];
  frames(g, 60);
  assert.equal(second.health, 100, "still held, but pulling does not resume by itself");
  g.keyUp(KEYS.Z); g.keyDown(KEYS.Z);
  frames(g, 5);
  assert.ok(second.health < 100);
});

test("Q (on release) costs one carrot and repels enemies closer than 64 px by 25 px", () => {
  const g = bare();
  g.player.carrotsCount = 3;
  const cx = g.player.x + 16, cy = g.player.y + 24;
  const near = enemyAt(g, cx - 40, cy); // distance 40: inside
  const far = enemyAt(g, cx + 70, cy); // outside
  near.move.right = true; // it was walking towards the player
  far.move.left = true;
  g.takeEvents();
  g.keyDown(KEYS.Q);
  assert.equal(g.player.carrotsCount, 3, "nothing happens on key down");
  g.keyUp(KEYS.Q);
  assert.equal(g.player.carrotsCount, 2);
  assert.equal(near.x, cx - 40 - 25);
  assert.equal(near.pushedProps.pushed, true);
  assert.equal(far.pushedProps.pushed, false);
  assert.deepEqual(sounds(g), ["fart", "scream"]);
});

test("a pushed enemy rests 30 frames before choosing a new target", () => {
  const g = bare();
  g.player.carrotsCount = 1;
  const e = enemyAt(g, g.player.x, g.player.y);
  g.keyDown(KEYS.Q); g.keyUp(KEYS.Q);
  const at = g.frame;
  frames(g, 1);
  assert.equal(e.pushedProps.atFrame, at + 30);
  frames(g, 29);
  assert.equal(e.pushedProps.pushed, true);
  frames(g, 1);
  assert.equal(e.pushedProps.pushed, false);
});

test("Q with no carrot: a burp and no effect", () => {
  const g = bare();
  const e = enemyAt(g, g.player.x, g.player.y);
  g.takeEvents();
  g.keyDown(KEYS.Q); g.keyUp(KEYS.Q);
  assert.equal(g.player.carrotsCount, 0);
  assert.equal(e.pushedProps.pushed, false);
  assert.deepEqual(sounds(g), ["burp"]);
});

test("W costs two carrots, plants one totem at the player, redirects every enemy, lasts 300 frames (until the frame after 300 more)", () => {
  const g = bare();
  g.player.carrotsCount = 5;
  const e = enemyAt(g, 100, 100);
  g.keyDown(KEYS.W); g.keyUp(KEYS.W);
  assert.equal(g.player.carrotsCount, 3);
  assert.deepEqual({ x: g.fork.x, y: g.fork.y }, { x: g.player.x + 16, y: g.player.y + 24 });
  assert.equal(e.target.x, g.player.x + 16);
  g.keyDown(KEYS.W); g.keyUp(KEYS.W);
  assert.equal(g.player.carrotsCount, 3, "a second totem is refused while one stands, and costs nothing");
  frames(g, 301); // it is still there on the 301st frame, gone on the next
  assert.ok(g.fork);
  frames(g, 1);
  assert.equal(g.fork, null);
});

test("W with fewer than two carrots: burp", () => {
  const g = bare();
  g.player.carrotsCount = 1;
  g.takeEvents();
  g.keyDown(KEYS.W); g.keyUp(KEYS.W);
  assert.equal(g.player.carrotsCount, 1);
  assert.equal(g.fork, null);
  assert.deepEqual(sounds(g), ["burp"]);
});

test("collision: boxes that only touch do not collide; scenery and the field edge stop the player", () => {
  const g = bare();
  g.obstacles = [{ tx: 10, ty: 5, kind: 1 }]; // hit box x 656..688, y 360..368
  const feet = (x, y) => g.hitObstacle(x + 8, y + 40, x + 24, y + 48);
  assert.equal(feet(656 - 24, 320 - 40 + 0), false);
  assert.equal(feet(656 - 24, 360 - 48), false, "feet box ends exactly at the obstacle's top: touching");
  assert.equal(feet(656 - 24 + 1, 360 - 47), true, "one pixel in");
  assert.equal(feet(688 - 8, 360 - 47), false, "touching on the right");
  const h = bare();
  h.player.x = 0; h.player.y = 100;
  h.keyDown(KEYS.LEFT);
  frames(h, 5);
  assert.equal(h.player.x, 0);
  h.keyUp(KEYS.LEFT);
  h.player.y = -16;
  h.keyDown(KEYS.UP);
  frames(h, 3);
  assert.equal(h.player.y, -16);
  const k = bare();
  k.player.x = 1024 - 32; k.player.y = 768 - 32;
  k.keyDown(KEYS.RIGHT); k.keyDown(KEYS.DOWN);
  frames(k, 3);
  assert.deepEqual([k.player.x, k.player.y], [992, 736]);
});

test("pathfinding: around scenery on the tile grid, diagonals allowed, [] when already there or enclosed", () => {
  const g = bare();
  const open = Array.from({ length: g.height }, () => Array.from({ length: g.width }, () => 1));
  const walls = [[5, 4], [5, 5], [5, 6]]; // a vertical wall of three tiles at x = 5
  for (const [x, y] of walls) open[y][x] = 0;
  g.graph = new Graph(open);
  const path = g.getPathToTilePx({ x: 4 * 64, y: 5 * 64 }, { x: 6 * 64, y: 5 * 64 });
  const tiles = path.map((n) => [n.pos.y, n.pos.x]); // node (x', y') is tile (y', x')
  assert.deepEqual(tiles.at(-1), [6, 5]);
  assert.ok(tiles.every(([x, y]) => !walls.some(([wx, wy]) => wx === x && wy === y)), "never through a wall");
  assert.equal(tiles.length, 4, "four moves around the wall");
  assert.deepEqual(g.getPathToTilePx({ x: 64, y: 64 }, { x: 64, y: 64 }), []);
});

test("enemy targeting: the nearest unclaimed carrot, measured feet to carrot, and it is claimed for good", () => {
  const g = bare();
  carrotAt(g, 640, 64);
  const b = carrotAt(g, 128, 128);
  const e = g.spawnEnemy();
  e.x = 64; e.y = 64;
  for (const c of g.carrots) c.occupied = false;
  g.newTarget(e);
  assert.equal(e.target.obj, b);
  assert.equal(b.occupied, true);
  g.newTarget(e); // b is claimed: the other one is chosen next
  assert.equal(e.target.obj.x, 640);
  g.newTarget(e); // none left: a random place, no carrot
  assert.equal(e.target.obj, undefined);
});

test("the game lasts 3 minutes: over after 9001 frames, score = carrots in hand, then frozen", () => {
  const g = new Game({ random: mulberry32(3) });
  g.player.carrotsCount = 7;
  let n = 0;
  while (!g.over) { g.step(); n++; }
  assert.equal(n, 9001);
  assert.equal(g.takeEvents().at(-1).score, 7);
  const f = g.frame;
  g.step();
  assert.equal(g.frame, f);
});

test("difficulty: 4 enemies and 4 carrots at the start, +2 and +1 every 30 s, up to 16 and 11", () => {
  const g = new Game({ random: mulberry32(5) });
  frames(g, 60);
  assert.equal(g.maxEnemies, 4);
  assert.equal(g.maxCarrots, 4);
  while (g.now < 30040) g.step();
  assert.equal(g.maxEnemies, 6);
  assert.equal(g.maxCarrots, 5);
  while (!g.over) g.step();
  assert.equal(g.maxEnemies, 14);
  assert.equal(g.maxCarrots, 9, "the fifth turn is the last one before 180 s");
});

test("restart: a new game with the same seed is the same game; a different seed is not", () => {
  const run = (seed) => { const g = new Game({ random: mulberry32(seed) }); frames(g, 2000); return JSON.stringify(g.snapshot()); };
  assert.equal(run(11), run(11));
  assert.notEqual(run(11), run(12));
});
