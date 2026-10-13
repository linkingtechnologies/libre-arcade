// An oracle that never fails proves nothing. Here the port is broken on purpose, one thing at a time, and each break must be seen by the
// comparison with what the original did (the recording, test/fixtures/java-oracle.json), at some tenth of a second of the scenario that
// is named for it. Each is a difference that the comparison with the original actually found in the package's port, or one like it.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runPort } from '../tools/oracle-port.mjs';
import { FIXTURE, unpack } from '../tools/java-oracle.mjs';
import { Game } from '../public/src/core/game.js';
import { Player } from '../public/src/core/player.js';
import { CONFIG } from '../public/src/core/config.js';
import { HistoricalAI } from '../public/src/ai/historical-ai.js';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const recorded = (name) => unpack(fixture.scenarios.find((s) => s.name === name));

// The first slot (tenth of a second) at which the port, broken by `apply`, no longer matches the recording of `name`, or -1.
function firstDifference(name, apply, slots) {
  const scenario = { ...recorded(name) };
  scenario.slots = Math.min(slots, scenario.slots);
  const restore = apply();
  try {
    const { crcs } = runPort(scenario);
    for (let slot = 0; slot < scenario.slots; slot++) if (crcs[slot] !== scenario.crcs[slot]) return slot;
    return -1;
  } finally {
    restore();
  }
}

// Replaces `object[name]` for the length of the test and gives back what puts it right.
function patch(object, name, replacement) {
  const original = object[name];
  object[name] = replacement(original);
  return () => { object[name] = original; };
}

const FAULTS = [
  {
    about: 'the computer chooses its target without a generator of its own (it draws one number fewer for every shot)',
    scenario: 'idle-easy', slots: 1500,
    apply: () => patch(HistoricalAI.prototype, 'randomOpponent', () => function randomOpponent(game) { return game.players.find((p) => p !== this.player); }),
  },
  {
    about: 'a player is declared the winner the moment the other one has lost, not at its own next pass',
    scenario: 'builder-easy', slots: 2800,
    apply: () => patch(Game.prototype, 'checkWin', () => function checkWin() {
      for (const q of this.players) {
        if (q.won) continue;
        q.won = q.score >= q.scoreToWin || (this.players.length > 1 && this.players.filter((r) => r !== q && r.lost).length === this.players.length - 1);
        if (q.won) this.ended = true;
      }
    }),
  },
  {
    about: 'the players do not settle their accounts at the moment the game starts, only from the first second on',
    scenario: 'idle-easy', slots: 50,
    apply: () => patch(Game.prototype, 'advance', (original) => function advance(ms) { if (this.nextPass === 0) this.nextPass = 1000; return original.call(this, ms); }),
  },
  {
    about: 'a building under construction ignores the acceleration the houses give',
    scenario: 'builder-medium', slots: 2500,
    apply: () => patch(Player.prototype, 'constructionMs', () => function constructionMs(b) { return b.def.build * 1000; }),
  },
  {
    about: 'the two minutes allowed without energy are a second shorter',
    scenario: 'blackout-slow', slots: 1300,
    apply: () => patch(Player.prototype, 'checkLoss', (original) => function checkLoss(now) { return original.call(this, now + 1000); }),
  },
  {
    about: 'the shield covers a larger area',
    scenario: 'builder-medium', slots: 2400,
    apply: () => { const w = CONFIG.weapons.shield; const old = w.w; w.w = 3; return () => { w.w = old; }; },
  },
  {
    about: 'the handset vibrates for half as long',
    scenario: 'warrior-hard', slots: 1500,
    apply: () => patch(Game.prototype, 'vibrate', (original) => function vibrate(ms) { return original.call(this, ms / 2); }),
  },
  {
    about: 'a missile silo costs 11',
    scenario: 'builder-easy', slots: 2500,
    apply: () => { const d = CONFIG.buildings.missileSilo; const old = d.cost; d.cost = 11; return () => { d.cost = old; }; },
  },
  {
    about: 'the computer does not play in the pass in which it wins or loses',
    scenario: 'chaos-easy', slots: 400,
    apply: () => patch(HistoricalAI.prototype, 'tick', (original) => function tick(game, now) { if (this.player.won || this.player.lost) return undefined; return original.call(this, game, now); }),
  },
];

for (const fault of FAULTS) {
  test(`the comparison sees it when ${fault.about}`, () => {
    const slot = firstDifference(fault.scenario, fault.apply, fault.slots);
    assert.ok(slot >= 0, `the port with this fault played ${fault.scenario} like the original for ${fault.slots} tenths of a second`);
  });
}

test('and without a fault the same runs match the recording', () => {
  for (const fault of FAULTS) assert.equal(firstDifference(fault.scenario, () => () => {}, fault.slots), -1, fault.scenario);
});
