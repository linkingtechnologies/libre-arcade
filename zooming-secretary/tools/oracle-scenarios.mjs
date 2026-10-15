// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The scenarios of the oracle: a stage, the random generator's seed, the allowance of missed calls, and a bot; and `play`, which runs one
// on the port (and, when it is given a ROM, on the ROM at the same time), iteration by iteration, with the same buttons.

import { PortGame, STAGE_NAMES } from './js-run.mjs';
import { PAD, RomGame } from './rom-run.mjs';
import { makeBot } from './bots.mjs';
import { canonical, crc32, firstDifference } from './oracle-state.mjs';

export const MAX_ITERATIONS = 9000;
const DREAM_WON_SEEDS = [6, 11, 12, 23, 24, 39, 45];

// What each stage is run with. The seeds are bytes: on the console the generator's byte comes from how long the player stays on the
// title screen, and any value can come up.
export function scenariosFor({ rounds = 1, bots = ['idle', 'wander', 'answer'], stages = STAGE_NAMES } = {}) {
  const out = [];
  for (let round = 0; round < rounds; round++) {
    for (const stage of stages) {
      const level = STAGE_NAMES.indexOf(stage);
      for (const bot of bots) {
        if (bot === 'idle' && round > 0) continue;
        let seed = bot === 'idle' ? 1 + level * 31 : ((round * 97 + level * 53 + bots.indexOf(bot) * 29 + 7) & 0xff) || 1;
        // seeds with which the answer bot wins the Dream (found by trying them all, on the port): the other end of the Dream is covered by the rest
        if (stage === 'dream' && bot === 'answer') seed = DREAM_WON_SEEDS[round % DREAM_WON_SEEDS.length];
        // the Dream is entered from Day 4; the allowance of missed calls is 3, or 5 after the Dream's bonus (Days 5 to 7 only)
        const missMax = level >= 5 && (round + bots.indexOf(bot)) % 2 === 1 ? 5 : 3;
        out.push({ name: `${stage}-${bot}-${round}`, stage, level, bot, seed, missMax, botSeed: round * 1009 + level * 17 + bots.indexOf(bot) + 1 });
      }
    }
  }
  return out;
}

// The same stages and bots with START pressed now and then (tools/bots.mjs, withPauses): the program's pause, in every stage, with the player
// moving or answering calls through it.
export const PAUSE_RATE = 0.012;
export function pauseScenarios({ rounds = 1, bots = ['wander', 'answer'], stages = STAGE_NAMES } = {}) {
  const out = [];
  for (let round = 0; round < rounds; round++) {
    for (const stage of stages) {
      const level = STAGE_NAMES.indexOf(stage);
      bots.forEach((bot, index) => {
        const seed = ((round * 61 + level * 37 + index * 17 + 3) & 0xff) || 1;
        const missMax = level >= 5 && (round + index) % 2 === 1 ? 5 : 3;
        out.push({ name: `${stage}-${bot}-pause-${round}`, stage, level, bot, seed, missMax, botSeed: round * 2003 + level * 19 + index + 5000, pauses: PAUSE_RATE });
      });
    }
  }
  return out;
}

// Runs a scenario. With `rom` (the bytes of the ROM) the ROM is run next to the port and compared after every iteration; without it only
// the port is run. With `inputs` (a recorded string of buttons) the bot is not used. Returns what happened.
export function play(scenario, { rom = null, inputs = null, onIteration = null } = {}) {
  // the player reached the stage by pressing START on the title screen, so that is what the program's last read of the pad saw
  const port = new PortGame({ level: scenario.level, seed: scenario.seed, missMax: scenario.missMax, polled: PAD.START });
  const real = rom ? new RomGame(rom, { level: scenario.level, seed: scenario.seed, missMax: scenario.missMax }) : null;
  const bot = inputs ? null : makeBot(scenario.bot, scenario.botSeed, { pauses: scenario.pauses });
  const buttons = [], crcs = [], events = {};
  const result = { name: scenario.name, iterations: 0, difference: null, status: 'PLAYING', buttons, crcs, events, lagged: 0 };

  const check = (at) => {
    const a = real.state(), b = port.state();
    const diff = firstDifference(a, b) ?? (real.ended !== port.finished ? `the stage ${real.ended ? 'ended on the ROM and not on the port' : 'ended on the port and not on the ROM'}` : null);
    if (diff) { result.difference = { at, text: diff }; return false; }
    return true;
  };

  if (real && !check('the start')) return result;
  crcs.push(crc32(canonical(port.state())));
  for (let k = 0; k < MAX_ITERATIONS && !port.finished; k++) {
    const b = inputs ? inputs[k] : bot(port);
    if (b === undefined) break;
    buttons.push(b);
    const emitted = port.step(b);
    for (const e of emitted) events[e.type] = (events[e.type] ?? 0) + 1;
    result.iterations = k + 1;
    crcs.push(crc32(canonical(port.state())));
    if (real) {
      real.step(b);
      if (!check(`iteration ${k + 1} (buttons ${b})`)) break;
      result.lagged = real.laggedFrames;
    }
    if (onIteration) onIteration(k, port);
  }
  result.status = port.sim.status;
  return result;
}
