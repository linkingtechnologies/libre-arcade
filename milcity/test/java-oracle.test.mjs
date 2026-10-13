// The port against what the original did, without Java: test/fixtures/java-oracle.json holds the checksums of the state of the
// original's game after every tenth of a second of each scenario (recorded by `node tools/java-oracle.mjs record` from a run in which
// the port and the original agreed everywhere), and the port must reproduce every one of them from the same actions.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runPort } from '../tools/oracle-port.mjs';
import { FIXTURE, sourcesHash, unpack } from '../tools/java-oracle.mjs';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));

test('the recording is of the original sources and the harness that are in the repository', () => {
  assert.equal(fixture.sources, sourcesHash(), 'the original or the harness changed: run `npm run test:live`, read the result, and record again');
});

test('the recording covers the games that the oracle is for', () => {
  const names = fixture.scenarios.map((s) => s.name);
  for (const name of ['idle-easy', 'idle-madness', 'builder-medium', 'warrior-hard', 'warrior-win', 'chaos-madness', 'chaos-training', 'blackout-slow', 'leave']) assert.ok(names.includes(name), name);
  assert.ok(fixture.scenarios.every((s) => unpack(s).crcs.length === s.slots), 'a checksum for every tenth of a second');
});

for (const entry of fixture.scenarios) {
  test(`the port plays "${entry.name}" as the original did, tenth of a second by tenth of a second`, () => {
    const scenario = unpack(entry);
    const { crcs } = runPort(scenario);
    for (let slot = 0; slot < scenario.slots; slot++) {
      if (crcs[slot] !== scenario.crcs[slot]) assert.fail(`the state differs from the original's at slot ${slot} (${(slot / 10).toFixed(1)} s)`);
    }
  });
}
