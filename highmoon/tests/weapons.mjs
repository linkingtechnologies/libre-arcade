// SPDX-License-Identifier: GPL-3.0-or-later
import assert from "node:assert/strict";
import { PI } from "../public/src/constants.js";
import { HistoricalProjectile, highMoonDamage, sphereCollision } from "../public/src/simulation.js";
import { spawnClusterFragments } from "../public/src/weapons.js";
import { oracleScenario54321 as scenario } from "../public/src/scenario-seed54321.js";

const laser = new HistoricalProjectile({ x: scenario.start.x, y: scenario.start.y, speed: 210, direction: 0, weight: 1 });
const heavy = new HistoricalProjectile({ x: scenario.start.x, y: scenario.start.y, speed: 210, direction: 0, weight: 2 });
for (let i = 0; i < 102; i += 1) {
  laser.tick(scenario.bodies);
  heavy.tick(scenario.bodies);
  assert.equal(laser.x, heavy.x);
  assert.equal(laser.y, heavy.y);
  assert.equal(laser.speed, heavy.speed);
  assert.equal(laser.direction, heavy.direction);
}
assert.equal(sphereCollision(laser.x, laser.y, scenario.shotWidth, scenario.targetUfo.x, scenario.targetUfo.y, scenario.targetUfo.width), true);
assert.equal(highMoonDamage(laser.speed, 1), 23);
assert.equal(highMoonDamage(heavy.speed, 2), 47);

const hit = { x: 500, y: 400, speed: 100 };
const collider = { x: 400, y: 400 };
const fragments = spawnClusterFragments(hit, collider);
assert.equal(fragments.length, 5);
const degrees = fragments.map((f) => f.direction * 180 / PI);
for (let i = 0; i < degrees.length; i += 1) {
  const expected = -75 + i * 30;
  assert(Math.abs(degrees[i] - expected) < 1e-10, `fragment ${i}: ${degrees[i]} != ${expected}`);
  assert.equal(fragments[i].speed, 60);
}
console.log("weapons ok");
