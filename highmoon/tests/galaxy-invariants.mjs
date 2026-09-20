// SPDX-License-Identifier: GPL-3.0-or-later
import assert from "node:assert/strict";
import { GlibcRand } from "../public/src/rng.js";
import { createGalaxy, bodyCollision } from "../public/src/galaxy.js";

for (let seed = 1; seed <= 100; seed += 1) {
  const rng = new GlibcRand(seed);
  const g = createGalaxy({ max: 6, seed, rng, collapsed: false });
  assert.equal(g.bodies.length, 6);
  for (let i = 0; i < g.bodies.length; i += 1) {
    const b = g.bodies[i];
    assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
    for (let j = 0; j < i; j += 1) {
      const prev = g.bodies[j];
      assert.equal(bodyCollision(prev, b.x, b.y, b.width + b.spacing, true), false, `seed ${seed}: placement ${i} must not overlap ${j}`);
    }
  }
}
console.log("ok galaxy-invariants: 100 deterministic seeds, placement constraints preserved");
