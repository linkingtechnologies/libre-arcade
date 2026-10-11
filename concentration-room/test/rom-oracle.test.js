// Executable oracle: the port is compared with the preserved release ROM running on a minimal NES (tools/rom-oracle.mjs).
//
//   npm test           replays the scenarios chosen for speed (test/fixtures/rom-oracle.json, "quick"): the ROM is run again, from reset,
//                      and the port must agree with it at every iteration of the original's main loop
//   npm run test:live  replays every recorded scenario (`node tools/rom-oracle.mjs replay`, several minutes)
//
// The fixture is not a transcript of the ROM: it holds the scenario plan (seeds), the RAM address the ROM keeps each compared field at,
// and the totals of the recording. It is tied to the ROM by SHA-256. Never edit it by hand and never record it again to make a failing
// test pass: run `npm run test:live`, read the first difference, and only if the port is right and the ROM agrees, run
// `node tools/rom-oracle.mjs record --games 64 --seed 20100718`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE, ROOT, SCALAR_FIELDS, analyseRom, loadRom, planScenarios, runAll, sha256, summarise } from '../tools/rom-oracle.mjs';
import { PLAY_STATE } from '../public/src/state-machine.js';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const rom = loadRom();

// the ROM under test is the archive's release ROM
assert.equal(rom.length, fixture.rom.bytes);
assert.equal(sha256(rom), fixture.rom.sha256);
assert.match(readFileSync(join(ROOT, 'reference', 'ConcentrationRoom-0.02', 'CHECKSUMS.txt'), 'utf8'), new RegExp(`${fixture.rom.sha256}  release/croom.nes`));

// what the harness finds in the ROM by its code has not moved
const info = analyseRom(rom);
assert.equal(info.nmis, fixture.foundByItsCode.frameCounter);
assert.deepEqual(info.rand, fixture.foundByItsCode.generator);
assert.equal(info.curKeys, fixture.foundByItsCode.curKeys);
assert.equal(info.boardState, fixture.foundByItsCode.board);
assert.equal(info.pcReadPads, fixture.foundByItsCode.pcReadPads);

// every field the port is compared on has exactly one home in the ROM's RAM, and no two fields share one
const fields = [...SCALAR_FIELDS.map(([name]) => name), 'rand0', 'rand1', 'rand2', 'rand3'];
for (let i = 0; i < 72; i++) fields.push(`board${i}`, `remember${i}`);
assert.deepEqual(fields.filter((name) => fixture.map[name] === undefined), [], 'fields without an address');
assert.deepEqual(Object.keys(fixture.map).filter((name) => !fields.includes(name)), [], 'addresses for unknown fields');
const homes = Object.values(fixture.map);
assert.ok(homes.every((a) => Number.isInteger(a) && a >= 0 && a < 0x800));
assert.equal(new Set(homes).size, homes.length, 'two fields share an address');

// what the recording covered
const t = fixture.totals;
assert.equal(t.scenarios, fixture.generator.games);
assert.equal(t.differing, 0, 'the recording was made with a difference');
assert.ok(t.iterations >= 300000, `only ${t.iterations} iterations were compared`);
assert.ok(t.games >= 120, `only ${t.games} games were played`);
// a few games of the hardest levels were still going at the iteration limit; they agree up to that point and are not counted as finished
assert.ok(t.unfinished <= 6, `${t.unfinished} games were left unfinished`);
// (the last state, DONE, is where a game ends: play_memory returns, so no iteration starts in it, and it is compared at the end of each game)
const LIVE_STATES = Object.values(PLAY_STATE).filter((state) => state !== PLAY_STATE.DONE);
for (const state of LIVE_STATES) assert.ok(t.states[state] > 0, `state ${state} was never visited`);
for (const ending of ['solitaire:done', 'two-player:done', 'vs-cpu:done:won', 'vs-cpu:done:lost', 'solitaire:done:won']) assert.ok(t.endings[ending] > 0, `no game ended as ${ending}`);
for (const event of ['flip-start', 'pair-match', 'pair-mismatch', 'solitaire-miss', 'cleared', 'game-over', 'turn-pass', 'pass-acknowledged', 'pass-to-ai', 'ai-forget', 'random-cursor', 'ai-select:known-pair-first', 'ai-select:remembered-second']) assert.ok(t.events[event] > 0, `no ${event} event`);
// array entries placed by the layout of their array, not by the data, are few and are named
assert.ok(fixture.placedByLayout.length <= 2 && fixture.placedByLayout.every((name) => /^(board|remember)[0-9]+$/.test(name)), 'too many fields placed by layout');

// the ROM is run again (on worker threads), and the port must still agree with it
const specs = planScenarios(fixture.generator).filter((spec) => fixture.quick.includes(spec.id));
assert.equal(specs.length, fixture.quick.length);
const result = summarise(specs, await runAll(specs, { map: fixture.map }));
assert.equal(result.difference, null, `the port differs from the ROM: ${JSON.stringify(result.difference)}`);
assert.equal(result.totals.differing, 0);
assert.equal(result.totals.unfinished, 0, 'a quick scenario was left unfinished');
assert.ok(result.totals.games >= specs.length);
for (const state of LIVE_STATES) assert.ok(result.totals.states[state] > 0, `the replayed scenarios never reached ${state}`);

console.log(`All Concentration Room ROM-oracle checks passed (${result.totals.scenarios} scenarios, ${result.totals.games} games, ${result.totals.iterations} iterations compared with the ROM).`);
