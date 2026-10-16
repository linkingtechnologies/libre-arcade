// The page's music player against the ROM's, frame by frame. The ROM runs on the NTSC console (the page's player makes 60 updates a second, as that console does);
// every call the ROM makes to FamiTone (start a song, stop it, start an effect) is made on the page's player at the same point, and after every frame the 11 bytes the
// player would send to the sound chip are compared with the ROM's output buffer. The samples (the drum hits of the game's music) are compared too: which one, and in which frame.
// Between them the scenarios play the four songs of the game and its twelve sound effects.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockstep } from '../tools/lockstep.mjs';
import { romSamples } from '../tools/rom-audio.mjs';
import { PAD } from '../tools/rom-run.mjs';
import { padScript } from '../tools/pad-script.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rom = new Uint8Array(readFileSync(join(ROOT, 'reference', 'release', 'Lan_Master.nes')));
const { A, UP, DOWN, RIGHT, START } = PAD;

const typed = (buttons, from, gap) => buttons.map((b, i) => ({ at: from + i * gap, buttons: b, hold: 6 }));

// the sound test: the code 68 00, then a press of START for each effect (its number goes up by one: UP on the last digit)
const soundTest = [DOWN, A, ...Array(6).fill(UP), RIGHT, ...Array(8).fill(UP), RIGHT, RIGHT];
const soundTestPresses = () => { const list = typed(soundTest, 80, 26); let t = 80 + soundTest.length * 26; for (let k = 0; k < 12; k++) { list.push({ at: t, buttons: START, hold: 6 }); t += 26; list.push({ at: t, buttons: UP, hold: 6 }); t += 26; } return { presses: list, ticks: t + 100 }; };
const endingCode = [DOWN, A, ...Array(6).fill(UP), RIGHT, ...Array(5).fill(UP), RIGHT, RIGHT, UP, UP, START];

const SCENARIOS = [
  { name: 'the title song, and the twelve sound effects of the sound test', build: soundTestPresses },
  { name: 'the title song, the start jingle, the game song (with its drum samples) to the time out, the time-out effect and the time-out song', build: () => ({ presses: [{ at: 80, buttons: A, hold: 6 }], ticks: 3300 }) },
  { name: 'the ending song (by the code 6502)', build: () => ({ presses: typed(endingCode, 80, 16), ticks: 2600 }) },
];

for (const scenario of SCENARIOS) {
  test(scenario.name, () => {
    const { presses, ticks } = scenario.build();
    const result = lockstep({ rom, region: 'ntsc', pad: padScript(presses), ticks, compare: { picture: false, state: false, engine: true }, stopAtMismatch: false, maxMismatches: 20 });
    const wrong = result.mismatches.filter((m) => m.kind === 'engine');
    assert.deepEqual(wrong.slice(0, 3), [], `${wrong.length} frames differ`);
    assert.ok(result.compared.engine > 1500, `${result.compared.engine} frames compared`);
    const mine = romSamples(result.watch.log), theirs = result.watch.log.engineSamples;
    assert.equal(theirs.length, mine.length, 'the number of samples started');
    mine.forEach((s, i) => {
      assert.equal(theirs[i].frame, s.frame, `sample ${i}: the frame`);
      assert.equal(theirs[i].start, s.start, `sample ${i}: where it starts`);
      assert.equal(theirs[i].length, s.length, `sample ${i}: how long`);
      assert.equal(theirs[i].pitch & 0x4f, s.pitch & 0x4f, `sample ${i}: the pitch and the loop`);
    });
  });
}
