// The port against the author's own build of v1.12 (reference/release-v1.12/Lawn_Mower.nes, from the Internet Archive's lawn_mower.zip).
// This is the executable of the version the page follows. The game's variables at every NMI, the picture unit's memories, the sound
// chip's input and the picture are compared, for several kinds of player, exactly as for the other two programs, with one exception:
// the black screen while a lawn is loaded lasts as long as the ROM says (the port follows it), because this build takes one NMI more
// than the port's table for the fifth lawn on some entries (a work of 8.3 frames that starts at 0.7 of an NMI is on the edge of 9, and
// this build is a little slower than the other two). Nothing else may be of another length. `npm run test:live` runs the long versions.
import assert from 'node:assert/strict';
import test from 'node:test';
import { SCENARIOS, SOUND_SWEEP, TUNE_LOOPS, runScenario, failures } from '../tools/oracle.mjs';

const FLAVOUR = 'v1.12-release';

// The set-ups that may take another number of NMIs than the port's table: loading the fifth lawn (after the fourth is cut, or after
// the tank ran dry on the fifth), 10 where the table says 9.
const onTheEdge = (setup) => setup.next === 'intro' && /:L[45]$/.test(setup.from) && setup.nmis === 10 && setup.expected === 9;

for (const scenario of SCENARIOS) {
  test(`${FLAVOUR}: ${scenario.about}`, () => {
    const result = runScenario({ flavour: FLAVOUR, frames: scenario.short, pad: scenario.make(1), pictureEvery: 4 });
    assert.deepEqual(failures(result, scenario.expect), []);
    assert.ok(result.compared > scenario.short * 0.97, 'nearly every frame was compared');
    assert.deepEqual(result.setups.filter((s) => s.nmis !== s.expected && !onTheEdge(s)), [], 'only the loading of the fifth lawn may last another time');
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
