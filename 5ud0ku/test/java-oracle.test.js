// Replays, against the JavaScript port, a recording of the preserved original 5ud0ku 1.8 classes
// (reference/5ud0ku-1.8/source, compiled unmodified and driven by test/java-oracle/). No Java is
// needed here. To run the original again and compare line by line, see: npm run test:live.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE, ORIGINAL_FILES, ROOT, replay, sha256 } from '../tools/java-oracle.mjs';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const fileSha = (relative) => sha256(readFileSync(join(ROOT, relative)));

// The recording answers exactly these files; if one changed, it must be redone.
for (const [relative, hash] of Object.entries(fixture.sources)) {
  assert.equal(fileSha(relative), hash, `${relative} changed since the oracle was recorded: run node tools/java-oracle.mjs record`);
}
const checksums = readFileSync(join(ROOT, 'reference/5ud0ku-1.8/CHECKSUMS.txt'), 'utf8');
for (const path of ORIGINAL_FILES) {
  const name = path.slice(ROOT.length + 1).split('\\').join('/').replace('reference/5ud0ku-1.8/', '');
  assert(checksums.includes(`${sha256(readFileSync(path))}  ${name}`) || checksums.includes(`${sha256(readFileSync(path))} *${name}`), `${name} is not the preserved original listed in CHECKSUMS.txt`);
}
assert.equal(Object.keys(fixture.sources).filter((name) => name.startsWith('reference/')).length, 10, 'ten original classes are driven');

// The recording must be a meaningful sample of the original's behaviour.
const family = (name) => fixture.families.find((entry) => entry.name === name);
assert(family('gen-easy').commands >= 500 && family('gen-normal').commands >= 500 && family('gen-hard').commands >= 300, 'too few recorded games');
const { solve, state } = fixture.stats;
assert(solve.rulesBroken > 50 && solve.none > 0 && solve.one > 100 && solve.two > 100, 'every kind of solver outcome must be represented');
for (const op of ['SHOW', 'PENCIL', 'MASK', 'SETUP', 'INITPM', 'PROMOTE', 'HIDE', 'CONF', 'SINGLE', 'HSINGLE', 'HSINGLE2', 'SOLVEDDIGIT', 'DUMP', 'ROUNDTRIP', 'CLONE', 'MSADD', 'MSBACK', 'MSFWD', 'MSNEXT', 'MSRESET']) {
  assert((state.ops[op] ?? 0) > 100, `${op} must be well represented in the recorded sequences`);
}
assert(state.scripts >= 600);
assert(fixture.stats.saveBytes > 500, 'saves with many candidate marks must be recorded');

const { delivered } = replay(fixture);
const gens = fixture.stats.gen;
console.log(`JAVA ORACLE REPLAY PASS: ${fixture.stats.commands} command lines agree with what the original answered (${gens.easy} easy, ${gens.normal} normal and ${gens.hard} hard games, ${solve.puzzles} solver puzzles, ${state.scripts} move sequences, 10 java.util.Random streams); the ${delivered.generated} generated and ${delivered.solver} solver fixtures of test/oracles.json are the original's own output; recorded on ${fixture.recordedWith.java}.`);
