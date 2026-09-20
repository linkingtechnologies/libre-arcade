// SPDX-License-Identifier: GPL-3.0-or-later
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HistoricalProjectile } from "../public/src/simulation.js";
import { float64Hex, ulpDistance } from "../public/src/ieee754.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(fs.readFileSync(path.join(here, "../oracle/laser-seed54321.json"), "utf8"));
const bodies = fixture.bodies.map((b) => ({ x: b.body_x, y: b.body_y, weight: b.weight }));
const shot = new HistoricalProjectile({
  x: fixture.shot.x,
  y: fixture.shot.y,
  speed: fixture.shot.speed,
  direction: fixture.shot.direction,
  weight: fixture.shot.weight,
});

let maxUlp = 0n;
let maxAbsError = 0;
let maxAbsLabel = null;
let exactScalars = 0;
let totalScalars = 0;
let firstMismatch = null;

function check(label, actual, expected, expectedBits) {
  totalScalars += 1;
  const bits = float64Hex(actual);
  const ulp = ulpDistance(actual, expected);
  if (ulp > maxUlp) maxUlp = ulp;
  const absError = Math.abs(actual - expected);
  if (absError > maxAbsError) { maxAbsError = absError; maxAbsLabel = label; }
  if (bits === expectedBits) exactScalars += 1;
  else if (!firstMismatch) firstMismatch = { label, actual, expected, actualBits: bits, expectedBits, ulp: ulp.toString() };
}

for (const expectedStep of fixture.steps) {
  const events = [];
  shot.tick(bodies, (e) => events.push(e));
  const begin = events.find((e) => e.event === "step_begin");
  const end = events.find((e) => e.event === "step_end");
  assert(begin && end, `missing events at step ${expectedStep.step}`);

  check(`${expectedStep.step}.begin.x`, begin.position.x, expectedStep.begin.position.x, expectedStep.begin.position.x_bits);
  check(`${expectedStep.step}.begin.y`, begin.position.y, expectedStep.begin.position.y, expectedStep.begin.position.y_bits);
  check(`${expectedStep.step}.begin.vx`, begin.velocity.x, expectedStep.begin.velocity.x, expectedStep.begin.velocity.x_bits);
  check(`${expectedStep.step}.begin.vy`, begin.velocity.y, expectedStep.begin.velocity.y, expectedStep.begin.velocity.y_bits);
  check(`${expectedStep.step}.end.x`, end.position.x, expectedStep.end.position.x, expectedStep.end.position.x_bits);
  check(`${expectedStep.step}.end.y`, end.position.y, expectedStep.end.position.y, expectedStep.end.position.y_bits);
  check(`${expectedStep.step}.end.vx`, end.velocity.x, expectedStep.end.velocity.x, expectedStep.end.velocity.x_bits);
  check(`${expectedStep.step}.end.vy`, end.velocity.y, expectedStep.end.velocity.y, expectedStep.end.velocity.y_bits);
}

assert.equal(shot.step, fixture.steps.length);
const summary = {
  steps: fixture.steps.length,
  comparedScalars: totalScalars,
  exactBitMatches: exactScalars,
  exactPercent: Number((100 * exactScalars / totalScalars).toFixed(3)),
  maxUlp: maxUlp.toString(),
  maxAbsError,
  maxAbsLabel,
  firstMismatch,
};

console.log("oracle-regression", JSON.stringify(summary));

// Cross-runtime libm is allowed a tiny last-bit difference in M1. The port must
// never drift materially; a separate exactness report records bit matches.
assert(maxUlp <= 64n, `oracle drift exceeds 64 ULP: ${JSON.stringify(firstMismatch)}`);
assert(maxAbsError <= 1e-10, `oracle absolute drift exceeds 1e-10 at ${maxAbsLabel}: ${maxAbsError}`);
