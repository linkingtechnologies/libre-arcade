// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The recording of the original (test/fixtures/original-trace.json, made by `node tools/oracle.mjs record`) replayed against the page: the same scenario, played by the page's own
// code in Node on a virtual clock, must give the same values in every block of 25 frames as the original gave (state, random numbers, sounds, what was drawn), and the
// pictures that were kept (as thumbnails, see tools/canonical.mjs) must come out the same. A few scenarios run by default; RILI_FULL=1 runs all of them (several minutes).
// If one fails, `npm run test:live` plays it on the original again and says which frame and which value differ.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { FIXTURE, replayScenario } from '../tools/oracle.mjs';
import { compareThumbnails, firstDifference, thumbnailFromText } from '../tools/canonical.mjs';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const FULL = process.env.RILI_FULL === '1';
const SAMPLE = ['idle-L1-normal-s4', 'idle-L26-hard-s29', 'random-L1-hard-s2', 'random-L33-normal-s1', 'route-L1-normal-s1', 'route-L5-normal-s1', 'quiz-left-L1', 'quiz-escape-L1',
  'menu-main-down2', 'menu-scores', 'menu-options', 'menu-play-levels', 'menu-ingame-options', 'menu-ingame-score', 'menu-language', 'menu-language-choose', 'menu-tour-jp', 'menu-tour-ar'];
const names = Object.keys(fixture.scenarios).filter((name) => FULL || SAMPLE.includes(name));

test('the recording names the scenarios that this test expects', () => {
  for (const name of SAMPLE) assert.ok(fixture.scenarios[name], `${name} is not in the recording`);
});

for (const name of names) {
  test(`${name}: the page does what the original did`, async () => {
    const entry = fixture.scenarios[name];
    const page = await replayScenario(entry);
    if (entry.digests) {
      const at = firstDifference(entry.digests, page.digests);
      assert.equal(at, null, `the page differs from the original from frame ${at} on (run \`npm run test:live\` for the values)`);
    }
    for (const [key, text] of Object.entries(entry.pictures)) {
      const ignored = new Set((entry.ignore?.[key] ?? []).map(([bx, by]) => by * 32 + bx));
      const a = thumbnailFromText(text), b = page.thumbnails[key].slice();
      const c = a.slice();
      for (const block of ignored) for (let k = 0; k < 3; k++) { b[block * 3 + k] = 0; c[block * 3 + k] = 0; }
      const result = compareThumbnails(c, b);
      assert.ok(result.max <= 3, `the picture at ${key} differs from the original's: a block of the picture is ${result.max} levels off, at block ${result.block}`);
    }
  });
}
