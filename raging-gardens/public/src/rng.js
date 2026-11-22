// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Seedable pseudo-random generator (mulberry32). The original game called
// Math.random() directly and so could not be replayed; every random choice
// in this port goes through one of these instead, which is what makes the
// deterministic simulation tests (and the comparison with the original,
// which is run with Math.random replaced by this very generator) possible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Crafty.math.randomInt(a, b): inclusive on both ends, as in Crafty 0.6.3.
export function randomInt(random, a, b) {
  return a + Math.floor((1 + b - a) * random());
}
