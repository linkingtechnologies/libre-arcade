// Replays, against the JavaScript port, a recording of the preserved original game loop
// (reference/bomber-1.0/src/GameCanvasBomber.java, run as it is). No Java is needed here.
// To run the original again, see: npm run test:live.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE, ROOT, ORACLE_DIR, ORIGINAL_SOURCE, replay, sha256 } from '../tools/java-oracle.mjs';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const fileSha = (path) => sha256(readFileSync(path));

// The recording answers exactly these sources; if either changed, it must be redone.
assert.equal(fileSha(ORIGINAL_SOURCE), fixture.sources['reference/bomber-1.0/src/GameCanvasBomber.java'], 'the preserved original changed since the oracle was recorded');
assert.equal(fileSha(join(ORACLE_DIR, 'BomberOracle.java')), fixture.sources['test/java-oracle/BomberOracle.java'], 'the harness changed since the oracle was recorded: run node tools/java-oracle.mjs record');
assert.match(readFileSync(join(ROOT, 'reference/bomber-1.0/CHECKSUMS.txt'), 'utf8'), new RegExp(`^${fixture.sources['reference/bomber-1.0/src/GameCanvasBomber.java']}  src/GameCanvasBomber.java$`, 'm'), 'the oracle was not recorded against the preserved original');

// The recording must be a meaningful sample of the original's behaviour.
assert(fixture.runs.length >= 200, 'too few recorded runs');
assert(fixture.totals.landings > 50 && fixture.totals.crashes > 500, 'both landings and crashes must be well represented');
assert(fixture.totals.maxLandings >= 2, 'a game must reach more than one landing');
assert(fixture.totals.impacts > 10000, 'too few bomb impacts recorded');
assert.equal(fixture.random.length, 7);

const totals = replay(fixture);
assert.equal(totals.runs, fixture.runs.length);
console.log(`JAVA ORACLE REPLAY PASS: ${totals.runs} runs, ${totals.iterations} iterations of the original loop (${totals.games} games, ${totals.crashes} crashes, ${totals.landings} landings, ${totals.impacts} impacts) and ${fixture.random.length} java.util.Random streams agree with the port; recorded on ${fixture.recordedWith.java}.`);
