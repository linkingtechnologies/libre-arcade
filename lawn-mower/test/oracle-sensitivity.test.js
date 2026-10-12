// An oracle that never fails proves nothing. Here the port is broken on purpose, one thing at a time (a number in the random
// generator, the pacing, a table of the palette, a rule of the pad, the way the message is blanked, a line of the screen split...),
// and each break must be seen by the comparison with the ROM, with the frame it was seen at.
import assert from 'node:assert/strict';
import test from 'node:test';
import { runScenario, failures, SCENARIOS } from '../tools/oracle.mjs';
import { mower, chaos, withDwell } from '../tools/bots.mjs';
import { LawnMowerKernel } from '../public/src/kernel.js';
import { LawnRng } from '../public/src/rng.js';
import { Ppu, PAL_BRIGHT_TABLE } from '../public/src/ppu.js';
import { NOTE_TABLE } from '../public/src/famitone-player.js';
import { MESSAGE_BAND, TITLE_SPLITS } from '../public/src/display.js';

// Breaks `object[name]` for the duration of `run`.
function broken(object, name, replacement, run) {
  const original = object[name];
  object[name] = replacement(original);
  try { return run(); } finally { object[name] = original; }
}
const scenario = (id) => SCENARIOS.find((s) => s.id === id);
const detect = (flavour, frames, pad, options = {}) => runScenario({ flavour, frames, pad, pictureEvery: 1, ...options });

const FAULTS = [
  {
    about: 'the random generator\'s polynomial', frames: 3000, pad: () => mower({ seed: 1 }),
    apply: (run) => broken(LawnRng.prototype, 'next', () => function next() { const carry = (this.state >>> 7) & 1; let v = (this.state << 1) & 0xff; if (carry) v ^= 0xce; this.state = v; return v; }, run),
  },
  {
    about: 'the skipped NMI that runs the game anyway (the X register left by fuelUpdateTime)', frames: 3000, pad: () => mower({ seed: 1 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'fuelUpdateTime', (original) => function fuelUpdateTime() { original.call(this); return false; }, run),
  },
  {
    about: 'the pacing: every sixth NMI skipped instead of every fifth', frames: 3000, pad: () => mower({ seed: 1 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'shouldProcessThisNmi', () => function shouldProcessThisNmi() { this.frameCount2 = (this.frameCount2 + 1) & 0xff; if (this.frameCount2 === 6) { this.frameCount2 = 0; return false; } return true; }, run),
  },
  {
    about: 'the pad: START counted as pressed while it is held, not when it goes down', frames: 3000, pad: () => chaos({ seed: 3 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'padPoll', () => function padPoll(pad) { this.padState = pad & 0xff; this.padStateT = this.padState; this.padStateP = this.padState; return this.padState; }, run),
  },
  {
    about: 'the fuel bar: one segment too many', frames: 1500, pad: () => mower({ seed: 1 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'updateFuelBar', (original) => function updateFuelBar() { original.call(this); this.oam[224 + 3] += 1; }, run),
  },
  {
    about: 'a tile of the map drawn with the wrong small tile (the picture unit\'s memory)', frames: 1500, pad: () => mower({ seed: 1 }),
    apply: (run) => broken(Ppu.prototype, 'updateTile', (original) => function updateTile(map, x, y) { original.call(this, map, x, y); if (map[y * 32 + x] === 0x0e) this.write(0x2000 + (x & 15) * 2 + y * 64, 0); }, run),
  },
  {
    about: 'the brightness table of the fade', frames: 1500, pad: () => mower({ seed: 1 }),
    apply: (run) => { const was = PAL_BRIGHT_TABLE[64 + 0x21]; PAL_BRIGHT_TABLE[64 + 0x21] = 0x25; try { return run(); } finally { PAL_BRIGHT_TABLE[64 + 0x21] = was; } },
  },
  {
    about: 'a note of the music', frames: 1500, pad: () => () => 0,
    apply: (run) => { const was = NOTE_TABLE[20]; NOTE_TABLE[20] = was + 1; try { return run(); } finally { NOTE_TABLE[20] = was; } },
  },
  {
    about: 'the animation of the mower\'s sprites', frames: 2000, pad: () => mower({ seed: 1 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'chrAnimation', () => function chrAnimation(delay) { let v = this.chrAnim; if (delay >= 30) { const mask = delay >= 60 ? 2 : 16; if ((mask & this.frameCount) === 0) v ^= 0x08; } if ((this.frameCount & 15) === 0) v ^= 0x10; this.chrAnim = v; }, run),
  },
  {
    about: 'the message: the blank tile of the second half', frames: 2200, pad: () => mower({ seed: 1, greedy: false, wander: 0.05 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'showMessageFill', (original) => function showMessageFill(message) { original.call(this, message); this.map[7 * 32 + 3] ^= 1; }, run),
  },
  {
    about: 'the flashing band of the message, one line off', frames: 1500, pad: () => withDwell(mower({ seed: 1, greedy: false, wander: 0.05 }), { message: 300 }),
    apply: (run) => { MESSAGE_BAND[0] += 3; try { return run(); } finally { MESSAGE_BAND[0] -= 3; } },
  },
  {
    about: 'the title\'s second band, forty lines off', frames: 300, pad: () => () => 0,
    apply: (run) => { TITLE_SPLITS[1] += 40; try { return run(); } finally { TITLE_SPLITS[1] -= 40; } },
  },
  {
    about: 'the cheat code', frames: 400, pad: () => mower({ seed: 1, cheat: true, selectEvery: 100 }),
    apply: (run) => broken(LawnMowerKernel.prototype, 'padPoll', (original) => function padPoll(pad) { return original.call(this, pad & ~0x40); }, run),   // LEFT never seen
  },
];

for (const fault of FAULTS) {
  test(`the comparison with the ROM sees: ${fault.about}`, () => {
    for (const flavour of ['v1.12']) {
      const result = fault.apply(() => detect(flavour, fault.frames, fault.pad()));
      const found = failures(result);
      assert.ok(found.length > 0, `nothing differed in ${fault.frames} frames`);
    }
  });
}

test('the same scenarios pass without a fault (so the faults above are what was seen)', () => {
  const s = scenario('mow');
  assert.deepEqual(failures(runScenario({ flavour: 'v1.12', frames: 1500, pad: s.make(1), pictureEvery: 1 })), []);
});
