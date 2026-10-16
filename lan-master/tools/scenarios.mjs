// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The scenarios the oracle plays: the same pad given to the ROM and to the page (tools/lockstep.mjs), and what is compared in each. A scenario is a list of
// presses or a function of the state (a bot). `run(scenario, rom)` returns what the comparison found; test/oracle.test.mjs asserts that it found nothing.

import { lockstep } from './lockstep.mjs';
import { PAD } from './rom-run.mjs';
import { padScript } from './pad-script.mjs';
import { menuLines, gameLines, endingLines } from './states.mjs';
import { makeBot } from './solver.mjs';
import { packageModules } from './package-modules.mjs';

const GAP = 14;      // ticks between two presses of a menu sequence
const START = 60;    // the tick of the first press

// the presses that start a level from the title: the first level with A on START, the others by typing the passcode
export function startPresses(level) {
  const script = [];
  if (level === 1) script.push(PAD.A);
  else {
    const code = packageModules().LAN_MASTER_PASSWORDS[level - 2];
    script.push(PAD.DOWN, PAD.A);
    for (const digit of code) { for (let i = 0; i < Number(digit); i++) script.push(PAD.UP); script.push(PAD.RIGHT); }
    script.push(PAD.START);
  }
  return script;
}

const sequence = (buttons, from = START, gap = GAP) => buttons.map((b, i) => ({ at: from + i * gap, buttons: b, hold: 6 }));

// a pad that plays the first presses (a menu sequence), then leaves the rest to `after`
function menuThen(buttons, after) {
  const end = START + buttons.length * GAP;
  const first = padScript(sequence(buttons));
  return (ctx) => (ctx.tick < end ? first(ctx) : after ? after(ctx) : 0);
}

// a pad for the game after the start: the bot plays the level, and the press that goes on at the clear table comes `wait` frames after the table appears
function botPlays({ levelAlias } = {}) {
  const bot = makeBot({ levelAlias: levelAlias ?? {} });
  let waiting = 0;
  return (ctx) => {
    if (ctx.port.state.screen === 'clear') { waiting++; return waiting >= 30 && waiting < 36 ? PAD.A : 0; }
    waiting = 0;
    return bot(ctx);
  };
}

const { A, B, SELECT, START: PSTART, UP, DOWN, LEFT, RIGHT } = PAD;

export const SCENARIOS = [
  {
    name: 'menu tour',
    about: 'the cursor, the sound and music items, the code entry (digits, cursor, leaving, a wrong code, the sound test), and the start flash',
    ticks: 800,
    pad: () => padScript(sequence([DOWN, DOWN, A, A, DOWN, A, A, UP, UP, A, UP, UP, RIGHT, DOWN, DOWN, RIGHT, UP, LEFT, LEFT, LEFT, DOWN, SELECT, A, RIGHT, UP, UP, LEFT, UP, UP, RIGHT, RIGHT, UP, PSTART,
      DOWN, UP, A, A, UP, UP, A])),
  },
  {
    name: 'first level to the time out, and back to the menu',
    about: 'the start, the reveal, 2,688 frames of play (pictures every 8th frame once nobody touches the pad), the time out, its table, and the way back to the menu',
    ticks: 3400,
    pictureEvery: 8,
    pad: () => padScript([{ at: 60, buttons: A, hold: 6 }, { at: 3000, buttons: A, hold: 6 }]),
  },
  {
    name: 'moving and turning',
    about: 'the cursor gliding and held, a turn of 1, 2 and 3 quarters, a turn asked for while the cursor glides, START while it glides',
    ticks: 620,
    pad: () => padScript([{ at: 60, buttons: A, hold: 6 }, { at: 200, buttons: RIGHT, hold: 20 }, { at: 240, buttons: A, hold: 6 }, { at: 260, buttons: UP | LEFT, hold: 30 }, { at: 320, buttons: B, hold: 6 },
      { at: 340, buttons: SELECT, hold: 6 }, { at: 360, buttons: DOWN, hold: 40 },
      { at: 420, buttons: LEFT, hold: 3 }, { at: 422, buttons: A, hold: 4 }, { at: 440, buttons: RIGHT, hold: 2 }, { at: 441, buttons: PSTART, hold: 3 }, { at: 470, buttons: DOWN, hold: 12 }, { at: 480, buttons: B, hold: 4 }]),
  },
  {
    name: 'the pause menu',
    about: 'opening it, moving in it, resuming, restarting the level, and leaving for the menu',
    ticks: 1200,
    pad: () => padScript([{ at: 60, buttons: A, hold: 6 }, { at: 200, buttons: PSTART, hold: 6 }, { at: 240, buttons: DOWN, hold: 6 }, { at: 260, buttons: UP, hold: 6 }, { at: 280, buttons: DOWN, hold: 6 },
      { at: 300, buttons: UP, hold: 6 }, { at: 340, buttons: A, hold: 6 }, { at: 500, buttons: PSTART, hold: 6 }, { at: 540, buttons: DOWN, hold: 6 }, { at: 580, buttons: A, hold: 6 },
      { at: 800, buttons: PSTART, hold: 6 }, { at: 840, buttons: DOWN, hold: 6 }, { at: 860, buttons: DOWN, hold: 6 }, { at: 900, buttons: A, hold: 6 }]),
  },
  {
    name: 'the bot plays the first levels',
    about: 'levels 1 to 3 solved with the cursor and the turns, the clear animation, the table, the next level each time (the full run, to level 30, is tools/oracle.mjs campaign)',
    ticks: 1300,
    pad: () => menuThen(startPresses(1), botPlays()),
  },
  {
    name: 'the ending by its code',
    about: 'the code 6502, the flash, the fade and the whole ending screen (the scrolling band and the text typed line by line)',
    ticks: 1900,
    pad: () => padScript(sequence([DOWN, A, ...Array(6).fill(UP), RIGHT, ...Array(5).fill(UP), RIGHT, RIGHT, UP, UP, PSTART])),
  },
  {
    name: 'the clear of the last level and the ending',
    about: 'level 50 (with the layout of level 39, so that the bot can finish it without the trace running over a frame), its clear table, the fade to the ending and 2,000 frames of it',
    ticks: 2800,
    levelAlias: { 49: 38 },
    pad: () => menuThen(startPresses(50), botPlays({ levelAlias: { 49: 38 } })),
  },
];

// every level started by its passcode and left to run: the unpacking, the reveal, the first traces, the random rotation of the later levels
export function levelScenario(level, ticks = 700) {
  const presses = startPresses(level);
  return { name: `level ${level} from its code`, about: 'the start of the level, the reveal and the first seconds', ticks: START + presses.length * GAP + ticks, pictureEvery: 4, pad: () => menuThen(presses) };
}

// the bot plays from the first level for as many ticks as asked (levels 1 to 30 are exact; after that the ROM's own timing, which the page does not model, shows: see specs/port-map.md)
export function campaign(ticks) {
  return { name: 'the bot plays the campaign', about: 'level after level', ticks, pad: () => menuThen(startPresses(1), botPlays()) };
}

export function run(scenario, rom, { stopAtMismatch = false, pictures = true } = {}) {
  const result = lockstep({
    rom, pad: scenario.pad(), ticks: scenario.ticks, levelAlias: scenario.levelAlias ?? null, pictureEvery: scenario.pictureEvery ?? 1,
    compare: { picture: pictures, state: true }, stopAtMismatch, maxMismatches: 50,
    state: (c) => [...menuLines(c), ...gameLines(c), ...endingLines(c)],
  });
  const count = (kind) => result.mismatches.filter((m) => m.kind === kind).length;
  return {
    name: scenario.name, ticks: result.ticks, compared: result.compared, screens: Object.fromEntries(result.screens),
    pictures: count('picture'), states: count('state'), audioProblems: result.audio.problems, mismatches: result.mismatches.slice(0, 5).map((m) => ({ kind: m.kind, tick: m.tick, text: m.text })),
    audioLags: Object.fromEntries(result.audio.lags),
  };
}
