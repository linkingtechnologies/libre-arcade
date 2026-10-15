// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The campaign: the title screen, and then stage after stage as the program goes through them (a stage won leads to the next, a stage
// lost to the same stage again, the Dream always to Day 5 with a longer allowance of missed calls if it was won), against the port with
// the rules the page uses: the first stage starts from the byte the time on the title screen made (the generator's byte, advanced by
// rand16() once for each iteration of the title loop), every other stage from the byte the stage before it ended with, and the stage
// and the allowance come from Campaign. What the ROM does between two stages is the program's own: it is run without a button.

import { Campaign } from '../public/src/campaign.js';
import { Rng8 } from '../public/src/rng.js';
import { PortGame } from './js-run.mjs';
import { PAD, RomGame } from './rom-run.mjs';
import { makeBot } from './bots.mjs';
import { canonical, crc32, firstDifference } from './oracle-state.mjs';

export const CHAIN_LIMIT = 9000;       // iterations of one stage

export function titleSeed(iterations) {
  const rng = new Rng8(1);
  for (let i = 0; i < iterations; i++) rng.rand16();
  return rng.state;
}

// Two campaigns from the title screen, which show the title's seed and the stages as the program goes through them, and three that
// are started in a stage by poking its number and the seed in (so that the Dream can be won or lost on purpose, and Day 7 can be won to
// reach the ending).
export function chainsFor({ chains = 5 } = {}) {
  const all = [
    { name: 'campaign-title-a', titleFrames: 40, bot: 'answer', botSeed: 100, stages: 14 },
    { name: 'campaign-title-b', titleFrames: 87, bot: 'answer', botSeed: 113, stages: 14 },
    { name: 'campaign-dream-won', startLevel: 4, startSeed: 6, titleFrames: 60, bot: 'answer', botSeed: 126, stages: 8 },
    { name: 'campaign-dream-caught', startLevel: 4, startSeed: 1, titleFrames: 60, bot: 'answer', botSeed: 139, stages: 6 },
    { name: 'campaign-ending', startLevel: 7, startSeed: 87, titleFrames: 60, bot: 'answer', botSeed: 152, stages: 4 },
  ];
  return all.slice(0, chains);
}

// Runs the campaign `chain` describes with the ROM next to the port (`rom` given), or on the port alone with the buttons that were
// recorded (`recorded` given). Returns what happened, stage by stage, and the first difference if there is one.
export function playChain(chain, { rom = null, recorded = null } = {}) {
  const poked = chain.startLevel !== undefined;
  const real = rom ? new RomGame(rom, poked ? { level: chain.startLevel, seed: chain.startSeed, titleFrames: chain.titleFrames } : { titleFrames: chain.titleFrames }) : null;
  const titleIterations = poked ? null : real ? real.titleIterations : recorded.titleIterations;
  const out = { name: chain.name, titleFrames: chain.titleFrames, titleIterations, stages: [], difference: null };
  let seed = poked ? chain.startSeed : titleSeed(titleIterations);
  if (real && !poked && real.startSeeds[0] !== seed) { out.difference = { at: 'the title screen', text: `the ROM starts Day 1 from ${real.startSeeds[0]}, the title rule gives ${seed} (${titleIterations} iterations)` }; return out; }
  const campaign = new Campaign();
  if (poked) campaign.stage = chain.startLevel;
  const total = recorded ? recorded.stages.length : chain.stages;
  let polled = PAD.START;               // the pad as the program last read it before the stage: START, from the title screen

  for (let n = 0; n < total && campaign.stage < 8; n++) {
    const want = recorded?.stages[n];
    const level = campaign.stage, missMax = campaign.missLimit;
    if (real) {
      const there = { level: real.read.get('level'), missMax: real.read.get('calls_missed_max'), seed: real.startSeeds.at(-1) };
      if (there.level !== level || there.missMax !== missMax || there.seed !== seed) {
        out.difference = { at: `the start of stage ${n + 1}`, text: `ROM: level ${there.level}, allowance ${there.missMax}, seed ${there.seed}; campaign rules: level ${level}, allowance ${missMax}, seed ${seed}` };
        return out;
      }
    } else if (want.level !== level || want.missMax !== missMax || want.seed !== seed) {
      out.difference = { at: `the start of stage ${n + 1}`, text: `recorded: level ${want.level}, allowance ${want.missMax}, seed ${want.seed}; campaign rules: level ${level}, allowance ${missMax}, seed ${seed}` };
      return out;
    }

    const port = new PortGame({ level, seed, missMax, polled });
    const bot = recorded ? null : makeBot(chain.bot, chain.botSeed + n);
    const buttons = [], crcs = [crc32(canonical(port.state()))];
    const check = (at) => {
      const diff = firstDifference(real.state(), port.state()) ?? (real.ended !== port.finished ? 'the stage ended on one and not on the other' : null);
      if (diff) out.difference = { at: `stage ${n + 1} (level ${level}), ${at}`, text: diff };
      return !diff;
    };
    if (real && !check('the start')) return out;
    for (let k = 0; k < CHAIN_LIMIT && !port.finished; k++) {
      const b = recorded ? want.buttons[k] : bot(port);
      if (b === undefined) break;
      buttons.push(b);
      port.step(b);
      crcs.push(crc32(canonical(port.state())));
      if (real) { real.step(b); if (!check(`iteration ${k + 1} (buttons ${b})`)) return out; }
    }
    const status = port.sim.status;
    out.stages.push({ level, missMax, seed, iterations: buttons.length, status, buttons, crcs });
    campaign.resolve({ won: status === 'WON', caught: status === 'DREAM_CAUGHT' });
    seed = port.sim.rng.state;
    // a stage that was lost goes through the game over screen, which reads the pad (with nothing held, here); the others do not
    polled = status === 'LOST' ? 0 : port.sim.pad.state;
    if (campaign.stage >= 8) break;
    if (real) real.nextStage();
  }
  return out;
}
