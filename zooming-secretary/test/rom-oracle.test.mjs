// The port against what the ROM did, without the ROM: test/fixtures/rom-oracle.json holds, for each scenario, each front end and each
// campaign, the buttons that were pressed and the checksum (the low 16 bits of a CRC-32) of the game's state after every iteration of the
// program's main loop (or every pass of its title screen and its other screens), as the ROM had it (recorded by
// `node tools/rom-oracle.mjs record` from a run in which the port and the ROM agreed everywhere). The port must reproduce every checksum
// from the same buttons.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { FIXTURE, toolsHash, unpack, unpackWords } from '../tools/rom-oracle.mjs';
import { play } from '../tools/oracle-scenarios.mjs';
import { chainsFor, playChain } from '../tools/oracle-chain.mjs';
import { playFront } from '../tools/oracle-front.mjs';
import { BUTTON } from '../public/src/input.js';
import { Frontend } from '../public/src/frontend.js';
import { Simulation } from '../public/src/simulation.js';
import { PhoneSystem } from '../public/src/phone.js';
import { Hearts } from '../public/src/hearts.js';
import { Rng8 } from '../public/src/rng.js';
import { StageMap } from '../public/src/map.js';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));

test('the recording is of the tools that are in the repository', () => {
  assert.equal(fixture.tools, toolsHash(), 'the way the ROM is run or read changed: run `npm run test:live`, read the result, and record again');
});

test('the recording covers the program\'s pause in every stage, and its front end: the code, the sound test and every level', () => {
  const stages = new Set(fixture.scenarios.filter((s) => s.name.includes('-pause-')).map((s) => s.stage));
  for (const stage of ['day1', 'day2', 'day3', 'day4', 'dream', 'day5', 'day6', 'day7']) assert.ok(stages.has(stage), `no pause in ${stage}`);
  assert.ok(fixture.front.length >= 40, 'front ends');
  assert.deepEqual([...new Set(fixture.front.map((e) => e.level))].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8], 'every level is chosen in some front end');
  assert.ok(fixture.front.some((e) => e.testMode) && fixture.front.some((e) => !e.testMode));
  const seen = { phases: new Set(), events: new Set() };
  for (const entry of fixture.front) {
    const r = playFront({ name: entry.name }, { recorded: { passes: unpack(entry.passes), stage: entry.stage && { buttons: unpack(entry.stage.buttons) } } });
    for (const p of r.phases) seen.phases.add(p);
    for (const e of r.events) seen.events.add(e);
  }
  for (const phase of ['title', 'transition', 'sound', 'change', 'level', 'shown', 'change2', 'done']) assert.ok(seen.phases.has(phase), `no front end passes through "${phase}"`);
  for (const event of ['CODE', 'START', 'EFFECT', 'TUNE', 'TUNE_STOP', 'LEAVE']) assert.ok(seen.events.has(event), `no front end has ${event}`);
});

test('the recording covers every stage, three kinds of player, and campaigns from the title screen to the ending', () => {
  const stages = new Set(fixture.scenarios.map((s) => s.stage));
  for (const stage of ['day1', 'day2', 'day3', 'day4', 'dream', 'day5', 'day6', 'day7']) assert.ok(stages.has(stage), stage);
  for (const bot of ['idle', 'wander', 'answer']) assert.ok(fixture.scenarios.some((s) => s.bot === bot), bot);
  const statuses = new Set(fixture.scenarios.map((s) => s.status));
  for (const status of ['WON', 'LOST', 'DREAM_CAUGHT']) assert.ok(statuses.has(status), status);
  assert.ok(fixture.chains.length >= 5);
  const levelsSeen = new Set(fixture.chains.flatMap((c) => c.stages.map((s) => s.level)));
  for (let level = 0; level < 8; level++) assert.ok(levelsSeen.has(level), `no campaign passes through level ${level}`);
  assert.ok(fixture.chains.some((c) => c.stages.some((s) => s.level === 4 && s.status === 'WON')), 'the Dream is won in a campaign');
  assert.ok(fixture.chains.some((c) => c.stages.some((s) => s.level === 4 && s.status === 'DREAM_CAUGHT')), 'the Dream is lost in a campaign');
  assert.ok(fixture.chains.some((c) => c.stages.some((s) => s.level === 7 && s.status === 'WON')), 'Day 7 is won, which is the ending');
});

// The first iteration at which the port's state differs from the recording (-1 if it never does); a stage that ends earlier or later, or in
// another way, than it did on the ROM differs at the iteration where it ended.
function replayScenario(entry) {
  const inputs = unpack(entry.buttons), want = unpackWords(entry.crcs);
  const r = play({ name: entry.name, level: entry.level, seed: entry.seed, missMax: entry.missMax }, { inputs });
  for (let i = 0; i < want.length; i++) if ((r.crcs[i] & 0xffff) !== want[i]) return i;
  if (r.iterations !== entry.iterations || r.status !== entry.status) return Math.min(r.iterations, entry.iterations);
  return -1;
}

for (const entry of fixture.scenarios) {
  test(`the port plays "${entry.name}" as the ROM did, iteration by iteration`, () => {
    const at = replayScenario(entry);
    if (at >= 0) assert.fail(`the state differs from the ROM's at iteration ${at}`);
  });
}

// The first pass (and then the first iteration of the stage that follows) at which the model of the front end differs from the recording; -1 if
// it never does.
function replayFront(entry) {
  const recorded = { passes: unpack(entry.passes), stage: entry.stage && { buttons: unpack(entry.stage.buttons) } };
  let r;
  // a model that has been broken can end in a front end that the recording has no stage for: that is a difference too
  try { r = playFront({ name: entry.name }, { recorded }); } catch { return 0; }
  const want = unpackWords(entry.crcs);
  if (r.difference) return r.crcs.length;
  for (let i = 0; i < want.length; i++) if ((r.crcs[i] & 0xffff) !== want[i]) return i;
  if (r.crcs.length !== want.length || r.level !== entry.level) return Math.min(r.crcs.length, want.length);
  if (!entry.stage) return r.stage ? want.length : -1;
  const stage = unpackWords(entry.stage.crcs);
  for (let i = 0; i < stage.length; i++) if (((r.stage?.crcs[i]) & 0xffff) !== stage[i]) return want.length + i;
  return r.stage.crcs.length === stage.length ? -1 : want.length + Math.min(r.stage.crcs.length, stage.length);
}

for (const entry of fixture.front) {
  test(`the port's front end goes through "${entry.name}" as the ROM did, pass by pass, and the stage that follows`, () => {
    const at = replayFront(entry);
    if (at >= 0) assert.fail(`the state differs from the ROM's at pass ${at}`);
  });
}

for (const entry of fixture.chains) {
  test(`the port goes through the campaign "${entry.name}" as the ROM did: the stages, the allowances, the seeds, and every iteration`, () => {
    const chain = chainsFor({ chains: 99 }).find((c) => c.name === entry.name);
    assert.ok(chain, `no campaign called ${entry.name}`);
    const recorded = { titleIterations: entry.titleIterations, stages: entry.stages.map((s) => ({ ...s, buttons: unpack(s.buttons) })) };
    const r = playChain(chain, { recorded });
    assert.equal(r.difference, null, r.difference ? `${r.difference.at}: ${r.difference.text}` : '');
    assert.equal(r.stages.length, entry.stages.length);
    r.stages.forEach((s, n) => {
      const want = unpackWords(entry.stages[n].crcs);
      assert.equal(s.status, entry.stages[n].status);
      for (let i = 0; i < want.length; i++) if ((s.crcs[i] & 0xffff) !== want[i]) assert.fail(`stage ${n + 1}: the state differs from the ROM's at iteration ${i}`);
    });
  });
}

// An oracle that never fails proves nothing. Here the port is broken on purpose, one thing at a time, and the replay of the recording
// must see each break, in the scenarios named for it. Each is a difference of the kind that the comparison with the ROM actually found
// in the package's port (see specs/port-map.md), or one like it.
function patch(object, name, replacement) {
  const original = object[name];
  object[name] = replacement(original);
  return () => { object[name] = original; };
}

const FAULTS = [
  {
    about: 'the program\'s pause is held 49 iterations at the start, not 50',
    scenarios: ['day1-wander-pause-0', 'day3-answer-pause-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.pause === 50) this.pause = 49;
      return out;
    }),
  },
  {
    about: 'START does nothing for 23 iterations after the pause, not 24',
    scenarios: ['day1-wander-pause-0', 'day3-answer-pause-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.pause === 24) this.pause = 23;
      return out;
    }),
  },
  {
    about: 'the game counts frames while it is paused',
    scenarios: ['day1-wander-pause-0', 'day3-answer-pause-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.pause >= 25) this.frameCnt = (this.frameCnt + 1) & 0xff;
      return out;
    }),
  },
  {
    about: 'a START that is still down when the pause waits for it ends the pause',
    scenarios: ['day1-wander-pause-0', 'day3-answer-pause-0', 'dream-answer-pause-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      if (this.pause === 25) this.pad.state = 0;
      return original.call(this, input);
    }),
  },
  {
    about: 'a heart takes two numbers from the generator even when no slot is free',
    scenarios: ['day7-answer-0', 'day7-answer-1', 'day7-answer-2'],
    apply: () => patch(Hearts.prototype, 'add', () => function add(rng) { rng.rand8(); rng.rand8(); return true; }),
  },
  {
    about: 'the call delay does not shrink after a call is missed or rung',
    scenarios: ['day1-idle-0'],
    apply: () => patch(PhoneSystem.prototype, 'resetPhone', (original) => function resetPhone(id, delay = 0, answer = false) {
      const before = this.callDelay;
      const p = original.call(this, id, delay, answer);
      if (!answer) this.callDelay = before;
      return p;
    }),
  },
  {
    about: 'a ladder is taken one pixel to the left of where the source samples it',
    scenarios: ['day1-answer-0', 'day2-answer-0'],
    apply: () => patch(StageMap.prototype, 'isLadderAt', (original) => function isLadderAt(x, y) { return original.call(this, x - 1, y); }),
  },
  {
    about: 'the random generator uses another feedback byte',
    scenarios: ['day1-idle-0'],
    apply: () => patch(Rng8.prototype, 'rand8', () => function rand8() {
      const old = this.state;
      let next = (old << 1) & 0xff;
      if (old & 0x80) next ^= 0xc3;
      this.state = next;
      return next;
    }),
  },
  {
    about: 'a knocked player is held for 47 iterations, not 48',
    scenarios: ['day6-answer-0', 'day6-answer-1', 'day6-wander-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.player.knocked === 48) this.player.knocked = 47;
      return out;
    }),
  },
  {
    about: 'the wisdom that Dibrov gives lasts 499 iterations, not 500',
    scenarios: ['day7-answer-0', 'day7-answer-1'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.player.wisdom === 500) this.player.wisdom = 499;
      return out;
    }),
  },
  {
    about: 'a coffee gives 19 and not 20',
    scenarios: ['day2-answer-0', 'day3-answer-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.player.coffee === 20) this.player.coffee = 19;
      return out;
    }),
  },
  {
    about: 'the Dream\'s phone waits one iteration less before it runs away again',
    scenarios: ['dream-answer-0', 'dream-answer-1'],
    apply: () => patch(Simulation.prototype, 'processDreamRunaway', (original) => function processDreamRunaway(events) {
      const before = this.phoneRunawayMax;
      original.call(this, events);
      if (this.phoneRunawayMax !== before) this.phoneRunaway = Math.max(0, this.phoneRunaway - 1);
    }),
  },
  {
    about: 'the Chief, left of x = 32, slows a player who is within 48 pixels of him (a signed comparison, as the source reads)',
    scenarios: ['day2-answer-0', 'day2-answer-1', 'day2-answer-2', 'day2-wander-0'],
    apply: () => patch(Simulation.prototype, 'tick', (original) => function tick(input) {
      const out = original.call(this, input);
      if (this.npc?.type === 'chief' && this.npc.x < 32) {
        const px = this.player.xFp >> 4, py = this.player.yFp >> 4;
        const sameFloor = !(this.npc.y >= py + 16 || this.npc.y + 24 < py + 8);
        if (sameFloor && px <= this.npc.x + 48) this.player.slowdown = true;
      }
      return out;
    }),
  },
];

// The named scenarios are the ones in which the fault is expected to show; the others are tried after them, so that a fault that the recording
// cannot see at all is found out, and one that shows early costs little.
for (const fault of FAULTS) {
  test(`the replay sees it when ${fault.about}`, () => {
    const named = fault.scenarios.map((name) => fixture.scenarios.find((s) => s.name === name)).filter(Boolean);
    const entries = [...named, ...fixture.scenarios.filter((s) => !named.includes(s))];
    const undo = fault.apply();
    try {
      const seen = entries.find((entry) => replayScenario(entry) >= 0);
      assert.ok(seen, 'no scenario of the recording saw the break');
      if (process.env.ORACLE_VERBOSE) console.log(`  seen first in ${seen.name}`);
    } finally { undo(); }
  });
}

// The same for the front end: the model of the title screen, the sound test and the choice of the level is broken one rule at a time.
const FRONT_FAULTS = [
  {
    about: 'a wrong button does not start the title screen\'s code again',
    entries: ['front-10', 'front-11', 'front-12', 'front-13', 'front-14', 'front-15', 'front-16', 'front-17', 'front-18'],
    apply: () => patch(Frontend.prototype, 'tick', (original) => function tick(buttons) {
      const before = this.codeIndex;
      const out = original.call(this, buttons);
      if (this.phase === 'title' && before > 0 && before < 255 && this.codeIndex === 0 && !out.some((e) => e.type === 'CODE')) this.codeIndex = before;
      return out;
    }),
  },
  {
    about: 'the sound test looks at the pad at the end of the wait, not at the read in which START was pressed',
    entries: ['front-code-to-ending', 'front-sound-test', 'front-14'],
    apply: () => patch(Frontend.prototype, 'tick', (original) => function tick(buttons) {
      if (this.phase === 'transition' && this.wait === 1) this.pad.state = buttons;
      return original.call(this, buttons);
    }),
  },
  {
    about: 'the choice of the level stops at 7, and the final screen cannot be chosen',
    entries: ['front-code-to-ending', 'front-limits'],
    apply: () => patch(Frontend.prototype, 'tick', (original) => function tick(buttons) {
      const out = original.call(this, buttons);
      if (this.level > 7) this.level = 7;
      return out;
    }),
  },
  {
    about: 'LEFT and RIGHT pressed in the same pass count as LEFT only',
    entries: ['front-both-directions'],
    apply: () => patch(Frontend.prototype, 'tick', (original) => function tick(buttons) {
      if (this.phase === 'level' && (buttons & (BUTTON.LEFT | BUTTON.RIGHT)) === (BUTTON.LEFT | BUTTON.RIGHT)) buttons &= ~BUTTON.RIGHT;
      return original.call(this, buttons);
    }),
  },
  {
    about: 'the title screen\'s wait after START is one pass short',
    entries: ['front-plain', 'front-code-to-day7'],
    apply: () => patch(Frontend.prototype, 'tick', (original) => function tick(buttons) {
      const out = original.call(this, buttons);
      if (this.phase === 'transition' && this.wait === 72) this.wait = 71;
      return out;
    }),
  },
  {
    about: 'the pass of START takes the title screen\'s two random numbers too',
    entries: ['front-plain', 'front-code-to-day7'],
    apply: () => patch(Frontend.prototype, 'tick', (original) => function tick(buttons) {
      const out = original.call(this, buttons);
      if (out.some((e) => e.type === 'START')) this.rng.rand16();
      return out;
    }),
  },
];

for (const fault of FRONT_FAULTS) {
  test(`the replay sees it when ${fault.about}`, () => {
    const named = fault.entries.map((name) => fixture.front.find((e) => e.name === name)).filter(Boolean);
    const entries = [...named, ...fixture.front.filter((e) => !named.includes(e))];
    const undo = fault.apply();
    try {
      const seen = entries.find((entry) => replayFront(entry) >= 0);
      assert.ok(seen, 'no front end of the recording saw the break');
      if (process.env.ORACLE_VERBOSE) console.log(`  seen first in ${seen.name}`);
    } finally { undo(); }
  });
}

test('and without a fault the same runs match the recording', () => {
  for (const fault of FRONT_FAULTS) for (const name of fault.entries) {
    const entry = fixture.front.find((e) => e.name === name);
    if (entry) assert.equal(replayFront(entry), -1, name);
  }
  for (const fault of FAULTS) for (const name of fault.scenarios) {
    const entry = fixture.scenarios.find((s) => s.name === name);
    if (entry) assert.equal(replayScenario(entry), -1, name);
  }
});
