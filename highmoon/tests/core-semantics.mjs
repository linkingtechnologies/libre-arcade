// SPDX-License-Identifier: GPL-3.0-or-later
import assert from "node:assert/strict";
import { Vector2, VectorType } from "../public/src/vector2.js";
import { sphereCollision, highMoonDamage } from "../public/src/simulation.js";

const p = new Vector2(10, 0, VectorType.P);
assert.equal(p.x, 10);
assert.equal(p.y, 0);
assert.equal(p.length, 10);
assert.equal(p.angle, 0);

assert.equal(sphereCollision(0, 0, 10, 10, 0, 10), true, "touching circles collide");
assert.equal(sphereCollision(0, 0, 10, 10.0000001, 0, 10), false);
assert.equal(highMoonDamage(238.2414207041286, 1), 23);
assert.equal(highMoonDamage(238.2414207041286, 2), 47);

console.log("core-semantics ok");
