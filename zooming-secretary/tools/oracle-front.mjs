// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The front end of the program, from reset to the first iteration of a stage: the title screen (the random generator it advances, the hidden
// code), the sound test, and the screen with the number of the level (where the code lets the player choose the level). The ROM is run one
// pass of its loops at a time (tools/rom-run.mjs, `front: true`) next to the port's model of them (public/src/frontend.js), with the same
// buttons, and the variables that the front end's rules decide are compared after every pass. When the screens have ended and the ROM has begun
// a stage, the stage that the player chose is compared as well: its level, the allowance of missed calls, the random generator's byte, and
// then iterations of the game itself, with the pad as the program last read it.

import { Frontend, LEVELS_ALL } from '../public/src/frontend.js';
import { PortGame } from './js-run.mjs';
import { PAD, RomGame } from './rom-run.mjs';
import { makeBot, makeRandom } from './bots.mjs';
import { canonical, crc32, firstDifference } from './oracle-state.mjs';

const B = PAD;

// What is compared in each phase of the front end (the program's variables mean different things in different screens).
const COMPARED = {
  title: ['rng', 'testMode', 'i'], transition: ['rng', 'testMode'], sound: ['rng', 'testMode', 'column', 'effect', 'tune'],
  change: ['rng', 'testMode'], level: ['rng', 'testMode', 'level'], shown: ['rng', 'testMode', 'level'], change2: ['rng', 'testMode', 'level'],
  done: ['testMode', 'level'],            // not the generator: the stage the ROM has begun has already taken its random numbers
};

export function modelState(model) {
  return {
    rng: model.rng.state, testMode: model.testMode ? 1 : 0, i: model.codeIndex, level: model.level,
    column: model.sound?.column ?? 0, effect: model.sound?.effect ?? 0, tune: model.sound?.tune ?? 0,
  };
}

export const frontText = (phase, s) => `${phase} ${COMPARED[phase].map((k) => `${k} ${s[k]}`).join(' ')}`;

// ---- the players ---------------------------------------------------------------------------------------------------------------------

// A plan says what the player does in each screen. `makeFrontBot` turns it into the buttons for each pass, asking the model which screen the
// program is in.
export function planFor(seed) {
  const rnd = makeRandom(seed * 31 + 7);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const code = pick(['good', 'good', 'good', 'wrong', 'combo', 'repeat', 'partial', 'twice', 'none']);
  const sound = rnd() < 0.3;
  return {
    seed, code, sound,
    lead: Math.floor(rnd() * 40),
    startWith: pick([0, 0, 0, B.LEFT, B.A | B.B, B.UP | B.RIGHT]),          // buttons pressed in the same pass as START, when there is no sound test
    soundHold: pick(['before', 'before', 'together', 'missing']),            // how the four buttons are pressed: A, B, SELECT and then START; all at once; or one short
    noiseInTransition: rnd() < 0.5,
    soundActions: 4 + Math.floor(rnd() * 20),
    levelTaps: Math.floor(rnd() * 14), rightBias: pick([0.5, 0.7, 0.9, 1]), bothDirs: rnd() < 0.3,
    leave: pick([B.START, B.START, B.A, B.B, B.START | B.RIGHT, B.A | B.LEFT]),
    iterations: 80 + Math.floor(rnd() * 120), stageBot: pick(['answer', 'wander', 'idle']), stagePauses: rnd() < 0.4 ? 0.03 : null,
  };
}

export function makeFrontBot(plan) {
  const rnd = makeRandom(plan.seed * 97 + 11);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const len = () => 1 + Math.floor(rnd() * 3);
  const tap = (mask) => [...Array(len()).fill(mask), ...Array(len()).fill(0)];
  const zeros = (n) => Array(n).fill(0);

  const codeSteps = () => {
    const good = [B.B, B.A, B.B, B.A, B.LEFT, B.UP, B.B, B.A];
    const steps = good.map((m) => tap(m));
    switch (plan.code) {
      case 'good': return steps.flat();
      case 'wrong': { const at = 1 + Math.floor(rnd() * 6); steps.splice(at, 0, tap(pick([B.SELECT, B.DOWN, B.RIGHT, B.B]))); return steps.flat(); }
      case 'combo': { const at = Math.floor(rnd() * 8); steps[at] = tap(good[at] | pick([B.SELECT, B.DOWN])); return steps.flat(); }
      case 'repeat': { const at = Math.floor(rnd() * 8); steps.splice(at, 0, tap(good[at])); return steps.flat(); }
      case 'partial': return steps.slice(0, 3 + Math.floor(rnd() * 4)).flat();
      case 'twice': return [...steps.slice(0, 5).flat(), ...steps.flat()];
      default: return [];
    }
  };

  const build = {
    title() {
      const q = [...zeros(plan.lead), ...codeSteps(), ...zeros(len())];
      const start = (extra) => [...Array(len()).fill(B.START | extra), 0];
      if (plan.sound) {
        const three = B.A | B.B | B.SELECT, four = three | B.START;
        if (plan.soundHold === 'before') q.push(...Array(3 + Math.floor(rnd() * 6)).fill(three), ...Array(len()).fill(four));
        else if (plan.soundHold === 'together') q.push(...Array(len()).fill(four));
        else q.push(...Array(3 + Math.floor(rnd() * 6)).fill(B.A | B.B), ...Array(len()).fill(B.A | B.B | B.START));
      } else q.push(...start(plan.startWith));
      return q;
    },
    // the program does not read the pad while the title screen's wait goes on: whatever is pressed then must not count
    transition() { return plan.noiseInTransition ? [...zeros(30), ...Array(40).fill(B.A | B.B | B.SELECT | B.START), 0, 0] : []; },
    sound() {
      const q = [];
      for (const m of plan.soundScript ?? []) q.push(...tap(m));
      for (let n = 0; n < plan.soundActions; n++) q.push(...tap(pick([B.LEFT, B.RIGHT, B.UP, B.UP, B.UP, B.DOWN, B.A, B.B, B.B, B.UP | B.DOWN, B.LEFT | B.B])));
      q.push(...Array(len()).fill(B.START | pick([0, B.UP])), 0);
      return q;
    },
    level() {
      const q = [];
      for (const m of plan.levelScript ?? []) q.push(...tap(m));
      for (let n = 0; n < plan.levelTaps; n++) q.push(...tap(plan.bothDirs && rnd() < 0.15 ? B.LEFT | B.RIGHT : rnd() < plan.rightBias ? B.RIGHT : B.LEFT));
      q.push(...Array(len()).fill(plan.leave), 0);
      return q;
    },
  };

  let phase = null, queue = [];
  return (model) => {
    if (model.phase !== phase) { phase = model.phase; queue = build[phase]?.() ?? []; }
    return queue.length ? queue.shift() : 0;
  };
}

// Plans that are written down because they are the ones to be sure of; the rest come from the seeds.
const R = B.RIGHT, L = B.LEFT;
const BASE = { code: 'good', sound: false, lead: 6, startWith: 0, soundHold: 'before', noiseInTransition: false, soundActions: 0, levelTaps: 0, rightBias: 1, bothDirs: false, leave: B.START, iterations: 90, stageBot: 'answer', stagePauses: null };
export const FRONT_FIXED = [
  { name: 'front-code-to-day4', plan: { ...BASE, seed: 5, levelScript: [R, R, R] } },
  { name: 'front-code-to-day5', plan: { ...BASE, seed: 6, levelScript: [R, R, R, R, R], iterations: 120 } },
  { name: 'front-limits', plan: { ...BASE, seed: 7, levelScript: [L, L, R, R, R, R, R, R, R, R, R, R, R, L, L, L], leave: B.B } },
  { name: 'front-both-directions', plan: { ...BASE, seed: 8, levelScript: [L | R, R, R, L | R, L, L | R], leave: B.A } },
  { name: 'front-sound-test-tunes', plan: { ...BASE, seed: 9, code: 'none', sound: true, soundHold: 'together', soundScript: [B.UP, B.UP, B.B, R, B.UP, B.UP, B.UP, B.B, B.DOWN, B.B, B.A, L, B.DOWN, B.B, R, B.DOWN, B.DOWN, B.DOWN, B.B], soundActions: 3 } },
  { name: 'front-plain', plan: { seed: 1, code: 'none', sound: false, lead: 12, startWith: 0, soundHold: 'before', noiseInTransition: false, soundActions: 0, levelTaps: 0, rightBias: 1, bothDirs: false, leave: B.START, iterations: 100, stageBot: 'answer', stagePauses: null } },
  { name: 'front-code-to-day7', plan: { seed: 2, code: 'good', sound: false, lead: 5, startWith: 0, soundHold: 'before', noiseInTransition: false, soundActions: 0, levelTaps: 7, rightBias: 1, bothDirs: false, leave: B.START, iterations: 150, stageBot: 'answer', stagePauses: 0.03 } },
  { name: 'front-code-to-ending', plan: { seed: 3, code: 'good', sound: false, lead: 20, startWith: 0, soundHold: 'before', noiseInTransition: true, soundActions: 0, levelTaps: 12, rightBias: 1, bothDirs: false, leave: B.A, iterations: 10, stageBot: 'idle', stagePauses: null } },
  { name: 'front-sound-test', plan: { seed: 4, code: 'good', sound: true, lead: 8, startWith: 0, soundHold: 'before', noiseInTransition: false, soundActions: 24, levelTaps: 3, rightBias: 0.5, bothDirs: false, leave: B.B, iterations: 100, stageBot: 'wander', stagePauses: null } },
];

export function frontScenarios({ seeds = 38 } = {}) {
  const out = FRONT_FIXED.map(({ name, plan }) => ({ name, plan }));
  for (let seed = 10; seed < 10 + seeds; seed++) out.push({ name: `front-${seed}`, plan: { ...planFor(seed), seed } });
  return out;
}

// ---- running one --------------------------------------------------------------------------------------------------------------------

const MAX_PASSES = 4000;

// Runs a front-end scenario on the port's model, and on the ROM when `rom` is given. With `recorded` ({passes: [...], stage: {...}}) the buttons
// come from the recording and the ROM is not used. Returns what happened, and the first difference if there is one.
export function playFront(scenario, { rom = null, recorded = null } = {}) {
  const real = rom ? new RomGame(rom, { front: true }) : null;
  const model = new Frontend();
  const bot = recorded ? null : makeFrontBot(scenario.plan);
  const passes = [], crcs = [], phases = new Set();
  const result = { name: scenario.name, passes, crcs, phases, difference: null, level: null, stage: null, testMode: false, events: [] };

  const check = (at) => {
    const m = modelState(model), a = frontText(model.phase, m);
    crcs.push(crc32(a));
    if (!real) return true;
    const b = frontText(model.phase, real.frontState());
    if (a === b) return true;
    result.difference = { at, text: `ROM:  ${b}\n  port: ${a}` };
    return false;
  };

  if (!check('the first pass of the title screen')) return result;
  for (let k = 0; k < MAX_PASSES && !model.done; k++) {
    const buttons = recorded ? recorded.passes[k] : bot(model);
    if (buttons === undefined) break;
    passes.push(buttons);
    const events = model.tick(buttons);
    for (const e of events) result.events.push(e.type);
    phases.add(model.phase);
    if (real) real.passStep(buttons);
    if (!check(`pass ${k + 1} (buttons ${buttons}, now in "${model.phase}")`)) return result;
  }
  if (!model.done) { result.difference = { at: 'the end', text: `the front end did not finish in ${MAX_PASSES} passes` }; return result; }
  result.level = model.level;
  result.testMode = model.testMode;
  if (model.level >= LEVELS_ALL) return result;                  // the final screen: no stage follows

  // the stage that the player chose, from the pad as the program last read it
  const level = model.level, seed = model.rng.state, polled = model.pad.state;
  if (real) {
    real.runToStageStart(900, { already: true });
    const there = { level: real.read.get('level'), missMax: real.read.get('calls_missed_max'), seed: real.startSeeds.at(-1) };
    if (there.level !== level || there.missMax !== 3 || there.seed !== seed) {
      result.difference = { at: 'the start of the stage', text: `ROM: level ${there.level}, allowance ${there.missMax}, seed ${there.seed}; port: level ${level}, allowance 3, seed ${seed}` };
      return result;
    }
  }
  const port = new PortGame({ level, seed, missMax: 3, polled });
  const stageBot = recorded ? null : makeBot(scenario.plan.stageBot, scenario.plan.seed * 13 + 1, { pauses: scenario.plan.stagePauses });
  const stage = { level, seed, buttons: [], crcs: [crc32(canonical(port.state()))] };
  result.stage = stage;
  const same = (at) => {
    const diff = firstDifference(real.state(), port.state()) ?? (real.ended !== port.finished ? 'the stage ended on one and not on the other' : null);
    if (diff) result.difference = { at, text: diff };
    return !diff;
  };
  if (real && !same('the start of the stage')) return result;
  const total = recorded ? recorded.stage.buttons.length : scenario.plan.iterations;
  for (let k = 0; k < total && !port.finished; k++) {
    const b = recorded ? recorded.stage.buttons[k] : stageBot(port);
    stage.buttons.push(b);
    port.step(b);
    stage.crcs.push(crc32(canonical(port.state())));
    if (real) { real.step(b); if (!same(`stage iteration ${k + 1} (buttons ${b})`)) return result; }
  }
  return result;
}
