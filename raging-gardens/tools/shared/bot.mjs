// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// A deterministic scripted player used to exercise the game in the oracle
// runs. It looks only at a plain snapshot, so the very same bot can drive the
// original (through Crafty) and the port. The inputs it produces are recorded
// by the oracle and replayed against the port, so the port is never driven by
// the bot directly in the comparison tests.

import { mulberry32 } from "../../public/src/rng.js";

export const KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, Z: 90, Q: 81, W: 87 };
const ALL = [KEY.LEFT, KEY.UP, KEY.RIGHT, KEY.DOWN, KEY.Z, KEY.Q, KEY.W];

// snapshot: { px, py, carrotsHeld, carrots: [{x, y}], enemies: [{x, y}] }
// returns a list of ["d" | "u", keyCode] to inject before the next frame.
export function createBot(mode, seed) {
  const random = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const held = new Set();
  const pendingRelease = [];

  function diff(desired) {
    const events = [];
    for (const k of pendingRelease.splice(0)) { events.push(["u", k]); held.delete(k); }
    for (const k of ALL) {
      if (desired.has(k) && !held.has(k)) { events.push(["d", k]); held.add(k); }
      else if (!desired.has(k) && held.has(k) && k !== KEY.Q && k !== KEY.W) { events.push(["u", k]); held.delete(k); }
    }
    return events;
  }

  const hunt = mode === "hunter" ? createHunter(random) : null;
  return function next(s) {
    if (hunt) return hunt(s);
    if (mode === "idle") return [];
    const desired = new Set([...held].filter((k) => k === KEY.Q || k === KEY.W));
    if (mode === "mash") {
      for (const k of ALL) {
        if (random() < 0.03) { if (held.has(k)) { if (k === KEY.Q || k === KEY.W) continue; held.delete(k); desired.delete(k); pendingRelease.push(k); } else desired.add(k); }
        else if (held.has(k) && k !== KEY.Q && k !== KEY.W) desired.add(k);
      }
      const events = [];
      for (const k of pendingRelease.splice(0)) events.push(["u", k]);
      for (const k of ALL) if (desired.has(k) && !held.has(k)) { events.push(["d", k]); held.add(k); if (k === KEY.Q || k === KEY.W) pendingRelease.push(k); }
      return events;
    }
    // "greedy" / "brawl": walk to the nearest carrot, hold Z there, now and then repel or plant a totem.
    const fx = s.px + 16, fy = s.py + 44;
    let best = null, bestD = Infinity;
    for (const c of s.carrots) {
      const d = (c.x + 16 - fx) ** 2 + (c.y + 16 - fy) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best) {
      const dx = best.x + 16 - fx, dy = best.y + 16 - fy;
      if (dx < -3) desired.add(KEY.LEFT); else if (dx > 3) desired.add(KEY.RIGHT);
      if (dy < -3) desired.add(KEY.UP); else if (dy > 3) desired.add(KEY.DOWN);
      if (bestD < 48 * 48) desired.add(KEY.Z);
    }
    const near = s.enemies.some((e) => (e.x + 16 - fx) ** 2 + (e.y + 24 - fy) ** 2 < 90 * 90);
    const r = random();
    const brawl = mode === "brawl";
    if (near && s.carrotsHeld >= 1 && r < (brawl ? 0.4 : 0.05) && !held.has(KEY.Q)) { desired.add(KEY.Q); pendingRelease.push(KEY.Q); }
    else if (s.enemies.length >= 1 && s.carrotsHeld >= 2 && r > (brawl ? 0.97 : 0.995) && !held.has(KEY.W)) { desired.add(KEY.W); pendingRelease.push(KEY.W); }
    else if (r > 0.9985 && !held.has(KEY.Q)) { desired.add(KEY.Q); pendingRelease.push(KEY.Q); } // sometimes with nothing to eat
    return diff(desired);
  };
}

// "hunter": walks towards the nearest rival, shaking itself loose from scenery now and then, and taps
// Q (released the frame after) whenever one is within reach and there is a carrot to spend. W is
// tapped now and then too, so that rivals are redirected while close by.
function createHunter(random) {
  const held = new Set();
  let wander = 0, wanderKeys = [], releaseAt = null;
  return function next(s) {
    const events = [];
    if (releaseAt !== null) { events.push(["u", releaseAt]); releaseAt = null; }
    const desired = new Set();
    const fx = s.px + 16, fy = s.py + 24;
    let best = null, bestD = Infinity;
    for (const e of s.enemies) {
      const d = (e.x + 16 - fx) ** 2 + (e.y + 24 - fy) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    if (wander > 0) wander--;
    else if (random() < 0.012) { wander = 25; wanderKeys = [ALL[Math.floor(random() * 4)], ALL[Math.floor(random() * 4)]]; }
    if (wander > 0) for (const k of wanderKeys) desired.add(k);
    else if (best) {
      const dx = best.x + 16 - fx, dy = best.y + 24 - fy;
      if (dx < -3) desired.add(KEY.LEFT); else if (dx > 3) desired.add(KEY.RIGHT);
      if (dy < -3) desired.add(KEY.UP); else if (dy > 3) desired.add(KEY.DOWN);
    }
    for (const k of [KEY.LEFT, KEY.UP, KEY.RIGHT, KEY.DOWN]) {
      if (desired.has(k) && !held.has(k)) { events.push(["d", k]); held.add(k); }
      else if (!desired.has(k) && held.has(k)) { events.push(["u", k]); held.delete(k); }
    }
    const r = random();
    if (releaseAt === null && events.every((e) => e[1] !== KEY.Q && e[1] !== KEY.W)) {
      if (best && bestD < 70 * 70 && s.carrotsHeld >= 1 && r < 0.5) { events.push(["d", KEY.Q]); releaseAt = KEY.Q; }
      else if (best && s.carrotsHeld >= 2 && r > 0.99) { events.push(["d", KEY.W]); releaseAt = KEY.W; }
    }
    return events;
  };
}
