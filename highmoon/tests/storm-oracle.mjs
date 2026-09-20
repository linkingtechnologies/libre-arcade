// SPDX-License-Identifier: GPL-3.0-or-later
import assert from "node:assert/strict";
import { HistoricalProjectile } from "../public/src/simulation.js";

const storm = { name: "storm", x: 512, y: 384, weight: -100 };
const shot = new HistoricalProjectile({ x: 320, y: 384, speed: 120, direction: 0, weight: 1 });
const expectedX = [
  323.58437500000002,
  327.15282775363642,
  330.70505088383015,
  334.24072639361515,
  337.75952514676663,
];
const expectedSpeed = [
  119.47916666666667,
  118.94842512121363,
  118.40743767312479,
  117.85585032616609,
  117.2932917717166,
];
for (let i = 0; i < expectedX.length; i += 1) {
  shot.tick([storm]);
  assert.ok(Math.abs(shot.x - expectedX[i]) <= 6e-14, `storm x step ${i}`);
  assert.ok(Math.abs(shot.speed - expectedSpeed[i]) <= 6e-14, `storm speed step ${i}`);
}
assert.ok(shot.speed < 120, "negative weight must repel/decelerate an incoming shot");
console.log("ok storm-oracle: negative-weight 1/r repulsion matches Phase 3 reference");
