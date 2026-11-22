// SPDX-License-Identifier: GPL-3.0-only
// Executable oracle (level 1 of the verification hierarchy): the untouched 2011
// game.js and the restored game.js are driven through the same scripted games
// on a virtual clock; every renderer call, every game event and the grid after
// every frame must be identical.
import test from "node:test";
import assert from "node:assert/strict";
import { ORIGINAL, RESTORED, playScenario, createEnv, mulberry32 } from "./helpers/harness.mjs";

// objects from two vm realms: compare their JSON, not their prototypes
const j = (x) => JSON.parse(JSON.stringify(x));

for (const difficulty of [0, 1, 2]) {
  for (const seed of [1, 2, 3, 12345]) {
    test(`oracle: difficulty ${difficulty}, seed ${seed}, rotations and clicks`, () => {
      const steps = { frames: 4000, clickEvery: 40, rotateEvery: 400 };
      const a = playScenario(ORIGINAL, { seed, difficulty, steps });
      const b = playScenario(RESTORED, { seed, difficulty, steps });
      assert.ok(a.log.length > 500, "scenario must exercise the engine");
      assert.ok(a.destroys > 3, "scenario must remove groups");
      assert.equal(b.log.length, a.log.length);
      for (let i = 0; i < a.log.length; i++) assert.equal(b.log[i], a.log[i], `trace line ${i}`);
      assert.deepEqual(b.columns, a.columns);
      assert.equal(b.finished, a.finished);
    });
  }
}

test("oracle: Grid operations on 300 random grids, all four gravities", () => {
  const rnd = mulberry32(99);
  const o = createEnv(ORIGINAL).samegame, r = createEnv(RESTORED).samegame;
  for (let n = 0; n < 300; n++) {
    const w = 3 + Math.floor(rnd() * 8), h = 3 + Math.floor(rnd() * 8), nc = 2 + Math.floor(rnd() * 4);
    const cols = [];
    for (let x = 0; x < w; x++) { cols[x] = []; for (let y = 0; y < h; y++) cols[x][y] = rnd() < 0.15 ? null : Math.floor(rnd() * nc); }
    const go = new o.Grid(w, h, nc, JSON.parse(JSON.stringify(cols))); go.size = { x: w, y: h };
    const gr = new r.Grid(w, h, nc, JSON.parse(JSON.stringify(cols))); gr.size = { x: w, y: h };
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      assert.equal(gr.isDestroyable(x, y), go.isDestroyable(x, y));
      assert.deepEqual(j(gr.computeDestroy(x, y)), j(go.computeDestroy(x, y)));
    }
    assert.equal(gr.noMoreDestroyable(), go.noMoreDestroyable());
    assert.equal(gr.countBlocks(), go.countBlocks());
    for (const grav of ["y", "-y", "x", "-x"]) {
      assert.deepEqual(j(gr.computeGravity(grav)), j(go.computeGravity(grav)));
      gr.applyGravity(grav); go.applyGravity(grav);
      assert.deepEqual(j(gr.columns), j(go.columns));
    }
  }
});

test("oracle: colour lightness maths and level curve", () => {
  const o = createEnv(ORIGINAL).samegame, r = createEnv(RESTORED).samegame;
  for (const hex of ["#D34040", "#82D340", "#40C2D3", "#8B40D3", "#D3C840"])
    for (const l of [0.5, 0.8, 0.85])
      assert.equal(new r.Color(hex).getHexWithLightness(l), new o.Color(hex).getHexWithLightness(l));
  for (const s of [1, 500, 1000, 5000, 123456])
    assert.deepEqual(j(new r.LevelProgressBar(s).get()), j(new o.LevelProgressBar(s).get()));
});
