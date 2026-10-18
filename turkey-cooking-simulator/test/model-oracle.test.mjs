// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Level 1 (an executable oracle): the original's own js/model.js, unmodified, is run next to the port's public/js/thermal-model.js, tick for
// tick, on the same oven schedules, and everything the original lets one read is compared exactly (no tolerance): the temperature, the highest
// temperature and the cook condition (name, fraction and key, which carry the water lost) of the three layers, the oven's raw temperature and
// the cook time.
//
// The original is reference/original/js/model.js, byte for byte the file of commit 13afa12 (git blob 26705859...), the last commit of
// 1 December 2013. It needs only a `DEBUG` global, a `console` and a gameState with a pubsub (the oven light), which are stubs here.
//
// The schedules also drive the oven's air temperature from outside, as the original's ui.js does when the door is opened (3 C off at once, then
// 1 C a second while it stays open, never below 20 C): both models get the same setRawTemp calls.
//
// What this does not cover: ui.js (the one-second scheduler, the skip, the door), screens.js (the score) and main.js (the market) are not
// executable without CreateJS and a browser; they are read against the port's modules (specs/port-map.md), which is Level 3.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PreservationOvenModel, fToC } from '../public/js/thermal-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = join(ROOT, 'reference', 'original', 'js', 'model.js');

// What the oracle needs the file to be. A test that ran some other file would prove nothing.
const MODEL_GIT_BLOB = '267058590ab103deb91be4d1ff4c57a5ca6a961d';
function gitBlobSha1(bytes) {
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
}

// The file is run as it is, as the body of a sloppy-mode function with DEBUG and console as its parameters. It assigns UtilityFunctions
// and a few working variables without declaring them, as a 2013 browser script does, so they land on this process's global object:
// harmless in a test file that has a process of its own. It is not run in a vm context on purpose: global lookups there are much slower.
function loadOriginal() {
  const source = readFileSync(MODEL, 'utf8');
  return new Function('DEBUG', 'console', `${source}\n;return { OvenModel, UtilityFunctions };`)(false, { log() {} });
}

const gameState = { pubsub: { publish() {} } };

// A deterministic pseudo-random generator, so that the schedules are the same on every run.
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

// A plan is a list of events at a second: [second, 'set', degrees Fahrenheit], [second, 'open'] (the door is opened fully: 3 C off) or
// [second, 'close'] (the door is no longer open). While the door is open each second takes 1 C off before the tick.
function randomPlan(seed, events, horizon) {
  const next = lcg(seed);
  const list = [[0, 'set', 125 + Math.floor(next() * 12) * 25]];
  for (let i = 0; i < events; i++) {
    const at = Math.floor(next() * horizon);
    const r = next();
    if (r < 0.5) list.push([at, 'set', 125 + Math.floor(next() * 13) * 25]);
    else if (r < 0.8) list.push([at, 'open']);
    else list.push([at, 'close']);
  }
  return list.sort((a, b) => a[0] - b[0]);
}

const SCHEDULES = {
  'steady 350': { seconds: 7200, plan: [[0, 'set', 350]] },
  'steady 425': { seconds: 5400, plan: [[0, 'set', 425]] },
  'steady 150 (a low oven that never reaches the tolerance)': { seconds: 3600, plan: [[0, 'set', 150]] },
  'three set points: 325, 425, OFF (125)': { seconds: 6000, plan: [[0, 'set', 325], [1800, 'set', 425], [4000, 'set', 125]] },
  'changes a few seconds apart': { seconds: 3000, plan: [[0, 'set', 350], [20, 'set', 400], [60, 'set', 300], [100, 'set', 450], [181, 'set', 200], [1500, 'set', 350]] },
  'hot oven switched off': { seconds: 4000, plan: [[0, 'set', 475], [2400, 'set', 125]] },
  'the door opened and left open for 5 minutes': { seconds: 3000, plan: [[0, 'set', 350], [1200, 'open'], [1500, 'close']] },
  'a door that is opened and closed again and again': { seconds: 3000, plan: [[0, 'set', 400], ...Array.from({ length: 30 }, (_, i) => [600 + i * 60, i % 2 ? 'close' : 'open'])] },
  'random A': { seconds: 9000, plan: randomPlan(12345, 14, 9000) },
  'random B': { seconds: 9000, plan: randomPlan(987654321, 20, 9000) },
  'random C': { seconds: 9000, plan: randomPlan(424242, 30, 9000) },
};

// The weights: the market's five, 8 lb (the default of a game started without a purchase), and 10, 15, 20 and 22.99 lb (the top of what the original can draw).
const WEIGHTS = [8, 10, 10.1, 12.2, 14.3, 15, 16.4, 18.5, 20, 22.99];

test('the oracle is the original file, byte for byte', () => {
  assert.equal(gitBlobSha1(readFileSync(MODEL)), MODEL_GIT_BLOB);
});

const same = (a, b) => Object.is(a, b);

for (const weight of WEIGHTS) {
  test(`${weight} lb: the port equals the original's model.js at every tick of ${Object.keys(SCHEDULES).length} oven schedules`, () => {
    const original = loadOriginal();
    for (const [name, { seconds, plan }] of Object.entries(SCHEDULES)) {
      const orig = new original.OvenModel(weight, gameState);
      const port = new PreservationOvenModel(weight);
      let next = 0;
      let doorOpen = false;
      for (let t = 0; t < seconds; t++) {
        while (next < plan.length && plan[next][0] <= t) {
          const [, kind, value] = plan[next];
          if (kind === 'set') {
            orig.changeTemp(original.UtilityFunctions.F2C(value));
            port.changeTemp(fToC(value));
          } else if (kind === 'open') {
            if (!doorOpen) {
              doorOpen = true;
              orig.setRawTemp(Math.max(20, orig.getRawTemp() - 3));
              port.setRawTemp(Math.max(20, port.getRawTemp() - 3));
            }
          } else {
            doorOpen = false;
          }
          next++;
        }
        if (doorOpen) {
          orig.setRawTemp(Math.max(20, orig.getRawTemp() - 1));
          port.setRawTemp(Math.max(20, port.getRawTemp() - 1));
        }
        orig.secondTick();
        port.secondTick();
        const o = orig.getTurkeyState();
        const p = port.getTurkeyState();
        for (const layer of ['skin', 'body', 'core']) {
          const where = `${weight} lb, ${name}, second ${t + 1}, ${layer}`;
          assert.ok(same(o[layer].temp, p[layer].tempC), `${where} temperature: ${p[layer].tempC} != ${o[layer].temp}`);
          assert.ok(same(o[layer].highest, p[layer].highestC), `${where} highest temperature`);
          const [oName, oFraction, oKey] = o[layer].cond;
          const [pName, pFraction, pKey] = p[layer].condition;
          assert.ok(oName === pName && oKey === pKey && same(oFraction, pFraction), `${where} condition: ${p[layer].condition} != ${o[layer].cond}`);
        }
        assert.ok(same(orig.getRawTemp(), port.getRawTemp()), `${weight} lb, ${name}, second ${t + 1}, oven raw temperature`);
        assert.equal(orig.getCookTime(), port.getCookTime(), `${weight} lb, ${name}, second ${t + 1}, cook time`);
      }
    }
  });
}
