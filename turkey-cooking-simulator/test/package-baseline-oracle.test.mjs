// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The same kind of oracle as test/model-oracle.test.mjs, for the package as it arrived: the model.js of the commit the package follows
// (56bcde6, 06:50 on 1 December 2013; reference/package-baseline/js/model.js, git blob a31dd8d0...) next to the package's own thermal-model.js
// (docs/development/package/game/src/js/thermal-model.js), tick for tick, exactly. It is what shows that the package's port was exact for the
// commit it named; the game itself follows the later commit 13afa12 (public/js/thermal-model.js, test/model-oracle.test.mjs).
//
// The original's analytic model is slow (about 2 ms a tick, plus half a second for its roots), so one turkey (12.2 lb) and four schedules of
// 600 to 1,500 seconds are run: 4,100 ticks.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = join(ROOT, 'reference', 'package-baseline', 'js', 'model.js');
const { PreservationOvenModel, fToC } = await import(pathToFileURL(join(ROOT, 'docs', 'development', 'package', 'game', 'src', 'js', 'thermal-model.js')).href);

const MODEL_GIT_BLOB = 'a31dd8d05f5ae3f3e28f685acc71c84257701a78';
const gitBlobSha1 = (bytes) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');

// Run as it is, as a sloppy-mode function body (not in a vm context: global lookups there are some 40 times slower).
const loadOriginal = () => new Function('DEBUG', `${readFileSync(MODEL, 'utf8')}\n;return { OvenModel, UtilityFunctions };`)(false);
const gameState = { pubsub: { publish() {} } };

const SCHEDULES = {
  'steady 350': { seconds: 1200, plan: [[0, 350]] },
  'steady 150 (never leaves the tolerance)': { seconds: 600, plan: [[0, 150]] },
  'across the 80 s timer: 325, 425, OFF': { seconds: 1500, plan: [[0, 325], [500, 425], [1100, 125]] },
  'changes closer than the timer': { seconds: 800, plan: [[0, 350], [20, 400], [60, 300], [100, 450], [181, 200], [700, 350]] },
};

test('the oracle is the original file of the package baseline, byte for byte', () => {
  assert.equal(gitBlobSha1(readFileSync(MODEL)), MODEL_GIT_BLOB);
});

test("the package's port equals the baseline's model.js at every tick (12.2 lb, 4 oven schedules)", () => {
  const original = loadOriginal();
  for (const [name, { seconds, plan }] of Object.entries(SCHEDULES)) {
    const orig = new original.OvenModel(12.2, gameState);
    const port = new PreservationOvenModel(12.2);
    let next = 0;
    for (let t = 0; t < seconds; t++) {
      while (next < plan.length && plan[next][0] <= t) {
        orig.changeTemp(original.UtilityFunctions.F2C(plan[next][1]));
        port.changeTemp(fToC(plan[next][1]));
        next++;
      }
      orig.secondTick();
      port.secondTick();
      const o = orig.getTurkeyState();
      const p = port.getTurkeyState();
      for (const layer of ['skin', 'body', 'core']) {
        const where = `${name}, second ${t + 1}, ${layer}`;
        assert.ok(Object.is(o[layer].temp, p[layer].tempC), `${where} temperature`);
        const [oName, oFraction, oKey] = o[layer].cond;
        const [pName, pFraction, pKey] = p[layer].condition;
        assert.ok(oName === pName && oKey === pKey && Object.is(oFraction, pFraction), `${where} condition`);
      }
      assert.ok(Object.is(orig.getRawTemp(), port.getRawTemp()), `${name}, second ${t + 1}, oven raw temperature`);
      assert.equal(orig.getCookTime(), port.getCookTime());
    }
  }
});
