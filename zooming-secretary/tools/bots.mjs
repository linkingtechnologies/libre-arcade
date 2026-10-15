// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The players that give the oracle its buttons. A bot looks at the port's state (never at the ROM's) and returns the buttons for the next
// iteration; the same buttons go to the ROM and to the port, and the comparison between them is what the oracle is for. A bot that
// could not be followed by the ROM would not matter: what a bot does is only a way of making the game do things.
//
//   idle     presses nothing.
//   wander   holds a random direction for a few iterations, and so on.
//   answer   answers the calls: it plans a path with the port's own movement code (a breadth-first search over the player's state on
//            the stage's map) to the filing cabinet of the topic of the ringing phone, and then to the phone; it fetches the coffee when
//            no call is waiting, and it makes a random move now and then, so that the paths are not always the shortest ones.

import { tickPlayerMotion } from '../public/src/player.js';
import { overlaps } from '../public/src/interactions.js';
import { PAD } from './rom-run.mjs';

export function makeRandom(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const ACTIONS = [0, PAD.LEFT, PAD.RIGHT, PAD.UP, PAD.DOWN];
const inputFor = (mask) => ({ down: (b) => (mask & b) !== 0 });

// A breadth-first search for the shortest string of buttons that puts the player on top of `rect` (x, y, width, height).
function plan(sim, rect, { limit = 30000, avoid = [] } = {}) {
  const start = { ...sim.player };
  const map = sim.stage.map;
  const hits = (p) => overlaps(p.xFp >> 4, p.yFp >> 4, 16, 24, rect.x, rect.y, rect.w, rect.h);
  // whole pixels are enough for planning: a path that drifts is corrected by the next plan
  const key = (p) => `${p.xFp >> 4},${p.yFp >> 4},${p.dirCountFp >> 4},${p.ladder ? 1 : 0},${p.onFloor ? 1 : 0},${p.dir}`;
  const touches = (p) => avoid.some((r) => overlaps(p.xFp >> 4, p.yFp >> 4, 16, 24, r.x, r.y, r.w, r.h));
  if (hits(start)) return [];
  const seen = new Map([[key(start), null]]);
  let frontier = [start];
  const parent = new Map();
  let expanded = 0;
  while (frontier.length && expanded < limit) {
    const next = [];
    for (const p of frontier) {
      for (const a of ACTIONS) {
        const q = { ...p };
        tickPlayerMotion(q, map, inputFor(a), []);
        // the player's speed is taken as constant for the search
        q.speedFp = start.speedFp;
        const k = key(q);
        if (seen.has(k)) continue;
        seen.set(k, null);
        if (touches(q)) continue;
        parent.set(k, [key(p), a]);
        expanded++;
        if (hits(q)) {
          const path = [];
          let cur = k;
          while (parent.has(cur)) { const [pk, act] = parent.get(cur); path.push(act); cur = pk; }
          return path.reverse();
        }
        next.push(q);
      }
    }
    frontier = next;
  }
  return null;
}

// Any bot can also press START now and then, which is what the program's pause is: `rate` is the chance in each iteration that a press
// begins. A press is held for one, two or three iterations (a tap), or for a good while (a hold that goes on through the pause and its
// end), and a new one can begin soon after the last, which is how START meets the 25 iterations during which the pause cannot be ended and
// the 24 after it in which it cannot begin. The movement the wrapped bot asks for goes on being pressed: the program ignores it while paused.
export function withPauses(bot, seed, rate) {
  const rnd = makeRandom(seed * 7919 + 13);
  const LENGTHS = [1, 1, 1, 2, 3, 12, 30, 55, 90];
  let hold = 0, gap = 0;
  return (game) => {
    const buttons = bot(game);
    if (hold > 0) { hold--; return buttons | PAD.START; }
    if (gap > 0) { gap--; return buttons; }
    if (rnd() < rate) { hold = LENGTHS[Math.floor(rnd() * LENGTHS.length)] - 1; gap = Math.floor(rnd() * 70); return buttons | PAD.START; }
    return buttons;
  };
}

export function makeBot(kind, seed, { pauses = null } = {}) {
  const bot = makePlainBot(kind, seed);
  return pauses ? withPauses(bot, seed, pauses) : bot;
}

function makePlainBot(kind, seed) {
  const rnd = makeRandom(seed);
  if (kind === 'idle') return () => 0;

  if (kind === 'wander') {
    let hold = 0, buttons = 0;
    return () => {
      if (hold-- > 0) return buttons;
      hold = 6 + Math.floor(rnd() * 50);
      const r = rnd();
      buttons = r < 0.26 ? PAD.LEFT : r < 0.52 ? PAD.RIGHT : r < 0.62 ? PAD.UP : r < 0.72 ? PAD.DOWN : r < 0.78 ? PAD.LEFT | PAD.UP : r < 0.84 ? PAD.RIGHT | PAD.DOWN
        : r < 0.88 ? PAD.LEFT | PAD.RIGHT : r < 0.92 ? PAD.UP | PAD.DOWN : r < 0.94 ? PAD.LEFT | PAD.RIGHT | PAD.UP | PAD.DOWN : 0;
      return buttons;
    };
  }

  if (kind === 'answer') {
    let path = [], noise = 0, noiseButtons = 0, chosen = null, targetKey = '', lastPlanned = -100;
    // The phone the bot has set out to answer: the one that will be missed first, and it keeps to it until that phone is answered or has
    // been missed (so it does not go back and forth between two phones whose urgency changes).
    const pickPhone = (sim) => {
      const time = (p) => p.counter + (3 - p.level) * 200;
      if (chosen !== null) {
        const p = sim.phones.phones[chosen.id];
        if (p && p.level >= 1 && p.level <= 3 && p.counter <= chosen.counter + 1) { chosen.counter = p.counter; return p; }
        chosen = null;
      }
      const ringing = sim.phones.phones.map((p, id) => ({ p, id })).filter(({ p }) => p.level >= 1 && p.level <= 3).sort((x, y) => time(x.p) - time(y.p));
      if (!ringing.length) return null;
      chosen = { id: ringing[0].id, counter: ringing[0].p.counter };
      return ringing[0].p;
    };
    const targetOf = (sim) => {
      const p = pickPhone(sim);
      if (p) {
        const player = sim.player;
        const canAnswer = sim.stage.bonus || player.wisdom > 0 || player.topic === p.topic;
        // A cabinet gives the player its topic whenever it is touched, so the way to a phone, or to the cabinet that is wanted, goes round
        // the other cabinets.
        const around = (keep) => sim.topics.filter((t) => t.id !== keep).map((t) => ({ x: t.x, y: t.y, w: 12, h: 8 }));
        if (canAnswer) return { x: p.x, y: p.y, w: 8, h: 8, avoid: sim.stage.bonus || player.wisdom > 0 ? [] : around(player.topic) };
        const cabinet = sim.topics.find((t) => t.id === p.topic);
        if (cabinet) return { x: cabinet.x, y: cabinet.y, w: 12, h: 8, avoid: around(p.topic) };
      }
      const c = sim.coffee;
      if (c && c.wait === 0) return { x: c.x, y: c.y, w: 8, h: 8 };
      return null;
    };
    return (game) => {
      const sim = game.sim;
      if (noise > 0) { noise--; return noiseButtons; }
      if (rnd() < 0.006) { noise = 3 + Math.floor(rnd() * 12); noiseButtons = ACTIONS[Math.floor(rnd() * ACTIONS.length)]; return noiseButtons; }
      const target = targetOf(sim);
      const key = target ? `${target.x},${target.y},${target.w}` : '';
      if (!path || path.length === 0 || key !== targetKey || game.frames - lastPlanned >= 10) {
        targetKey = key;
        lastPlanned = game.frames;
        path = target ? plan(sim, target, { avoid: target.avoid ?? [] }) ?? plan(sim, target) : [];
        if (path === null) path = [];
      }
      return path.shift() ?? 0;
    };
  }
  throw new Error(`no bot called ${kind}`);
}
