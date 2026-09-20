// SPDX-License-Identifier: GPL-3.0-or-later
import assert from "node:assert/strict";
import { GlibcRand } from "../public/src/rng.js";
import { createGalaxy, settleGalaxy, BodyKind } from "../public/src/galaxy.js";

const r = new GlibcRand(12345);
const expected = [383100999,858300821,357768173,455528251,133005921,116285904,591987137,102557902,689413528,585691128];
assert.deepEqual(expected.map(() => r.rand()), expected, "glibc rand() sequence must match native oracle");

const rng = new GlibcRand(1);
const galaxy = createGalaxy({ max: 6, seed: 54321, rng, collapsed: true });
assert.equal(rng.index, 408, "Galaxy::create(seed 54321, 6 bodies) must consume exactly 408 rand() calls");
assert.equal(rng.rand(), 65782240, "first post-create rand() must match native trace index 1712");
assert.equal(settleGalaxy(galaxy), 48, "native --settle takes 48 Galaxy::draw frames");

const expectedBodies = [
  [BodyKind.PLANET, 350, 418.59730875492096, 54.738983631134033],
  [BodyKind.WORMHOLE, 50, 768.14242963865399, 88.798478722572327],
  [BodyKind.PLANET, 300, 768.27729373797774, 279.48814058303833],
  [BodyKind.PLANET, 250, 488.08641652017832, 715.87579751014709],
  [BodyKind.PLANET, 180, 454.98812480643392, 555.54049372673035],
  [BodyKind.STORM, -100, 584.01647695526481, 254.98464453220367],
];
for (let i = 0; i < expectedBodies.length; i += 1) {
  const b = galaxy.bodies[i];
  const [kind, weight, x, y] = expectedBodies[i];
  assert.equal(b.kind, kind, `body ${i} kind`);
  assert.equal(b.weight, weight, `body ${i} weight`);
  assert.equal(b.x, x, `body ${i} x must be bit-identical`);
  assert.equal(b.y, y, `body ${i} y must be bit-identical`);
}
const wormhole = galaxy.bodies[1];
assert.equal(wormhole.exitX, 349.1742874495685);
assert.equal(wormhole.exitY, -332.1765512228012);

console.log("ok rng-galaxy: glibc rand exact; seed54321 body generation exact; 408 RNG calls; settle=48");
