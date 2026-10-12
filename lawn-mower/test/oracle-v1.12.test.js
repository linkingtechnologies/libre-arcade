// The port against the v1.12 source, assembled here by tools/assemble.mjs. This is not the author's binary (his assembler is not
// available), but it is what the port was written from; it differs from the competition ROM in one place that is known (the pad in
// the no-control path, see tools/rom-oracle.mjs). The game's variables at every NMI, the picture unit's memories, the sound chip's
// input and the picture are compared, for several kinds of player. `npm run test:live` runs the long versions, for more seeds.
import assert from 'node:assert/strict';
import test from 'node:test';
import { SCENARIOS, SOUND_SWEEP, TUNE_LOOPS, runScenario, failures } from '../tools/oracle.mjs';

const FLAVOUR = 'v1.12';

for (const scenario of SCENARIOS) {
  test(`${FLAVOUR}: ${scenario.about}`, () => {
    const result = runScenario({ flavour: FLAVOUR, frames: scenario.short, pad: scenario.make(1), pictureEvery: 4 });
    assert.deepEqual(failures(result, scenario.expect), []);
    assert.ok(result.compared > scenario.short * 0.97, 'nearly every frame was compared');
  });
}

test(`${FLAVOUR}: every tune is played past its loop and every sound effect is started, and the sound matches the ROM's`, () => {
  const tunes = new Map(), effects = new Set();
  for (const sweep of SOUND_SWEEP) {
    const result = runScenario({ flavour: FLAVOUR, frames: sweep.frames, pad: sweep.make(), pictures: false });
    assert.deepEqual(failures(result), [], sweep.id);
    for (const [tune, frames] of result.sound.longest) tunes.set(tune, Math.max(tunes.get(tune) ?? 0, frames));
    for (const id of result.sound.effects.keys()) effects.add(id);
  }
  for (const [tune, loop] of Object.entries(TUNE_LOOPS)) assert.ok((tunes.get(tune) ?? 0) > loop, `${tune} was heard for ${tunes.get(tune)} frames, its loop is ${loop}`);
  for (const id of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13]) assert.ok(effects.has(id), `sound effect ${id} was started`);
});
