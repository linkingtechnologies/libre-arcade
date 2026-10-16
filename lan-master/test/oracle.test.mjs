// The page against the ROM, frame by frame: the author's ROM and the page's own scripts are given the same pad, and after every frame of the game the
// picture (every pixel outside the lines where the ROM changes a register mid-line), the variables of the ROM against the page's state, and the
// sound the two ask for, are compared (tools/lockstep.mjs; the scenarios are in tools/scenarios.mjs).
// By default the scenarios and five levels run (about a minute). LAN_MASTER_FULL=1 runs every level from its passcode too (about six minutes more).
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS, levelScenario, run } from '../tools/scenarios.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rom = new Uint8Array(readFileSync(join(ROOT, 'reference', 'release', 'Lan_Master.nes')));
const FULL = process.env.LAN_MASTER_FULL === '1';

function expectNoDifference(scenario) {
  const result = run(scenario, rom);
  const where = JSON.stringify(result.mismatches);
  assert.equal(result.pictures, 0, `${scenario.name}: pictures differ ${where}`);
  assert.equal(result.states, 0, `${scenario.name}: variables differ ${where}`);
  assert.deepEqual(result.audioProblems, [], `${scenario.name}: the sound differs`);
  assert.ok(result.compared.picture > scenario.ticks / 2 || scenario.pictureEvery > 1, `${scenario.name}: ${result.compared.picture} pictures compared`);
  // the page's calls to the sound player come in the frame of the ROM's, or the one after (a press is answered by the page in the frame after the pad is read)
  for (const lag of Object.keys(result.audioLags)) assert.ok(Number(lag) === 0 || Number(lag) === 1, `${scenario.name}: a sound ${lag} frames from the ROM's`);
}

for (const scenario of SCENARIOS) test(`${scenario.name}: ${scenario.about}`, () => expectNoDifference(scenario));

const LEVELS = FULL ? Array.from({ length: 50 }, (_, i) => i + 1) : [2, 11, 26, 39, 50];
for (const level of LEVELS) test(`level ${level} from its passcode`, () => expectNoDifference(levelScenario(level, FULL ? 1500 : 700)));
