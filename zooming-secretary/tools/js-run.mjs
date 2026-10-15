// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the port (public/src and public/web) one iteration at a time, and gives the same normalised state as tools/rom-run.mjs gives for
// the ROM: the oracle compares the two.

import { Simulation } from '../public/src/simulation.js';
import { makeDay1Stage } from '../public/web/stage-day1.js';
import { makeDay2Stage } from '../public/web/stage-day2.js';
import { makeDay3Stage } from '../public/web/stage-day3.js';
import { makeDay4Stage } from '../public/web/stage-day4.js';
import { makeDreamStage } from '../public/web/stage-dream.js';
import { makeDay5Stage } from '../public/web/stage-day5.js';
import { makeDay6Stage } from '../public/web/stage-day6.js';
import { makeDay7Stage } from '../public/web/stage-day7.js';

// The program's level numbers: 0 to 3 are Days 1 to 4, 4 is the Dream, 5 to 7 are Days 5 to 7.
export const STAGES = [makeDay1Stage, makeDay2Stage, makeDay3Stage, makeDay4Stage, makeDreamStage, makeDay5Stage, makeDay6Stage, makeDay7Stage];
export const STAGE_NAMES = ['day1', 'day2', 'day3', 'day4', 'dream', 'day5', 'day6', 'day7'];

// Buttons, as a bit mask in the game's own numbering (A 1, B 2, Select 4, Start 8, Up 16, Down 32, Left 64, Right 128).
const input = (buttons) => ({ A: buttons & 1, B: buttons & 2, SELECT: buttons & 4, START: buttons & 8, UP: buttons & 16, DOWN: buttons & 32, LEFT: buttons & 64, RIGHT: buttons & 128 });

export class PortGame {
  // `polled` is what the pad read at the program's last poll before the stage began (see Simulation).
  constructor({ level, seed, missMax = 3, polled = 0 }) {
    const stage = STAGES[level]();
    stage.missLimit = missMax;
    this.sim = new Simulation(stage, { seed, padPolled: polled });
    this.frames = 0;
  }

  step(buttons) { const events = this.sim.tick(input(buttons)); this.frames++; return events; }

  get finished() { return this.sim.status !== 'PLAYING'; }

  state() {
    const s = this.sim, p = s.player;
    const npc = s.npc && { type: s.npc.type, x: s.npc.x, y: s.npc.y, dir: s.npc.dir, cnt: s.npc.counter, wait: s.npc.wait, speed: s.npc.speed };
    if (npc) {
      if (npc.type === 'chief') { npc.tx = s.npc.tx ?? 0; npc.ty = s.npc.ty ?? 0; }
      if (npc.type === 'ghost') { npc.x = s.npc.xFp; npc.y = s.npc.yFp; npc.dx = s.npc.dx; npc.dy = s.npc.dy; }
    }
    return {
      rng: s.rng.state,
      pause: s.pause,
      frame: s.frameCnt,
      ring: s.ringCnt,
      calls: s.phones.callsCount, missed: s.phones.callsMissed, callDelay: s.phones.callDelay,
      player: {
        x: p.xFp, y: p.yFp & 0xffff, ladder: p.ladder ? 1 : 0, dir: p.dir, dirPrev: p.dirPrev, dirCnt: p.dirCountFp & 0xffff, floor: p.onFloor ? 1 : 0,
        topic: p.topic, speed: p.speedFp, speedTo: p.speedTargetFp, coffee: p.coffee, slowdown: p.slowdown ? 1 : 0, knocked: p.knocked,
        knockedAnim: p.knockedAnim, wisdom: p.wisdom & 0xffff, catch: p.caught ? 1 : 0, answer: p.answerTicks, stepAnim: p.stepAnim & 0xff,
      },
      coffee: s.coffee ? { x: s.coffee.x, y: s.coffee.y, wait: s.coffee.wait } : null,
      phones: s.phones.phones.map((ph) => ({ x: ph.x, y: ph.y, cnt: ph.counter, level: ph.level, topic: ph.topic })),
      topics: s.topics.map((t) => ({ id: t.id, x: t.x, y: t.y, msg: t.messageIndex })),
      npc,
      hearts: s.hearts.snapshot(),
      dream: s.stage.bonus ? { runaway: s.phoneRunaway, runawayMax: s.phoneRunawayMax, table: s.tableCurrent } : null,
    };
  }
}
