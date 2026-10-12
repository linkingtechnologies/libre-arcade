// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Players for the executable oracle: functions that give the pad for the next frame. They read the ROM's own memory to decide, so they
// reach what a person would (all ten levels cleared, the tank run dry, pauses) without a recorded game. They are deterministic for a
// seed: the same seed gives the same game on any machine.

import { PAD } from './rom-oracle.mjs';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRASS_MIN = 0x0e, GRASS_MAX = 0x11, FLOWERS = 0x12, STONE = 0x14;
const STEPS = [[1, 0, PAD.RIGHT], [-1, 0, PAD.LEFT], [0, 1, PAD.DOWN], [0, -1, PAD.UP]];

// The first step of a cheapest path from the mower's tile to the nearest target tile (stones and flowers cost fuel, so they are dear), or 0.
export function stepToward(map, width, x0, y0, isTarget, grassCost = 1) {
  const key = (x, y) => y * 32 + x;
  const cost = new Map([[key(x0, y0), 0]]);
  const first = new Map([[key(x0, y0), 0]]);
  const open = [[0, x0, y0]];
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [c, x, y] = open.shift();
    if (c > cost.get(key(x, y))) continue;
    for (const [dx, dy, pad] of STEPS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || nx > width || ny < 3 || ny > 13) continue;
      const tile = map[key(nx, ny)];
      const step = tile === STONE ? 60 : tile === FLOWERS ? 30 : (tile >= GRASS_MIN && tile <= GRASS_MAX) ? grassCost : 1;
      const nc = c + step;
      if (nc >= (cost.get(key(nx, ny)) ?? Infinity)) continue;
      cost.set(key(nx, ny), nc);
      first.set(key(nx, ny), first.get(key(x, y)) || pad);
      if (isTarget(tile, nx, ny)) return first.get(key(nx, ny));
      open.push([nc, nx, ny]);
    }
  }
  return 0;
}

/**
 * A mower that goes for fuel cans when the tank is low and otherwise for the nearest uncut grass, with a seeded amount of wandering,
 * boost and START presses.
 *  startAt        the frame on the title at which START is pressed
 *  wander         chance per frame of starting a random direction for a few frames
 *  boost          chance per frame of starting to hold boost for a while
 *  pauseEvery     a START press (pause, resume, message acknowledgements) about this often
 *  greedy         false: only wander (burns the tank)
 *  thirst         go for a fuel can when the tank is below this
 *  cheat          key the title's code (RIGHT, UP, LEFT, LEFT) and press SELECT now and then (about every selectEvery frames)
 *  survive        stay on the cut ground, fetching fuel cans, so that a level can be played for as long as one likes
 *  skipTo         with cheat: press SELECT only while the level is below this (1 to 10), to get to a big lawn and stay on it
 */
export function mower({ seed = 1, startAt = 40, wander = 0.004, boost = 0.03, pauseEvery = 900, greedy = true, boostButton = null, thirst = 150, cheat = false, selectEvery = 500, skipTo = 0, survive = false } = {}) {
  const rnd = mulberry32(seed);
  let hold = 0, holdPad = 0, boostFor = 0, boostPad = PAD.A, startDown = 0, nextStart = pauseEvery * (0.5 + rnd());
  let selectDown = 0, nextSelect = selectEvery * (0.5 + rnd()), lazy = null;
  const code = [PAD.RIGHT, PAD.UP, PAD.LEFT, PAD.LEFT];
  let titleSince = 0, wasTitle = false, startThisTime = startAt;
  const codeEnd = 5 + code.length * 12 + 10;
  return ({ frame, rom, session }) => {
    const mode = session.game.mode;
    let pad = 0;
    if (mode === 'setup') return 0;
    if (mode === 'title') {
      if (!wasTitle) { wasTitle = true; titleSince = frame; startThisTime = startAt + (frame === 0 ? 0 : Math.floor(rnd() * 90)); if (cheat) startThisTime = Math.max(startThisTime, codeEnd); }
      const t = frame - titleSince;
      if (cheat && t >= 5 && t < 5 + code.length * 12 && (t - 5) % 12 < 6) pad |= code[Math.floor((t - 5) / 12)];
      if (t >= startThisTime && t < startThisTime + 10) pad |= PAD.START;
      return pad;
    }
    wasTitle = false;
    if (cheat && (!skipTo || session.game.levelIndex + 1 < skipTo)) {
      if (selectDown > 0) { selectDown--; pad |= PAD.SELECT; }
      else if (--nextSelect <= 0) { selectDown = 4 + Math.floor(rnd() * 6); nextSelect = selectEvery * (0.5 + rnd()); }
    }
    if (startDown > 0) { startDown--; pad |= PAD.START; }
    else if (--nextStart <= 0) { startDown = 4 + Math.floor(rnd() * 8); nextStart = pauseEvery * (0.5 + rnd()); }
    if (mode === 'level-clear' || mode === 'out-of-fuel' || mode === 'complete') {
      // the message waits for START; press it soon after it appears
      // (a press is a release followed by a press, so it is tapped, not held)
      if ((session.game.flowPhase === 'message-wait' || session.game.flowPhase === 'wait') && ((frame >> 3) & 1)) pad |= PAD.START;
      return pad;
    }
    const g = session.game;
    if (hold > 0) { hold--; pad |= holdPad; }
    else if (rnd() < wander) { hold = 5 + Math.floor(rnd() * 25); holdPad = STEPS[Math.floor(rnd() * 4)][2]; pad |= holdPad; }
    else if (greedy && g.fuel !== undefined) {
      const x = (rom.read('playerX') >> 8) & 255, y = (rom.read('playerY') >> 8) & 255;
      const width = rom.read('mapWidth'), map = rom.map;
      const canX = rom.read('fuelX'), canY = rom.read('fuelY');
      let step = 0;
      if (canX && rom.read('fuel') < thirst) step = stepToward(map, width, x, y, (tile, tx, ty) => tx === canX && ty === canY);
      if (!step && survive) {
        if (!lazy || (frame % 90) === 0 || (x === lazy[0] && y === lazy[1])) {
          const cut = [];
          for (let ty = 3; ty <= 13; ty++) for (let tx = 1; tx <= width; tx++) { const tile = map[ty * 32 + tx]; if (tile >= 0x0a && tile <= 0x0d && (Math.abs(tx - x) + Math.abs(ty - y)) > 2) cut.push([tx, ty]); }
          lazy = cut.length ? cut[Math.floor(rnd() * cut.length)] : [x, y];
        }
        step = stepToward(map, width, x, y, (tile, tx, ty) => tx === lazy[0] && ty === lazy[1], 400);
      }
      if (!step && !survive) step = stepToward(map, width, x, y, (tile) => tile >= GRASS_MIN && tile <= GRASS_MAX);
      pad |= step;
    }
    if (boostFor > 0) { boostFor--; pad |= boostPad; }
    else if (rnd() < boost) { boostFor = 10 + Math.floor(rnd() * 60); boostPad = boostButton ?? (rnd() < 0.5 ? PAD.A : PAD.B); }
    return pad;
  };
}

/**
 * A player that presses things at random: every few frames it picks a new pad (any mix of buttons, START and SELECT included, so the
 * cases the original never expects, like START together with a direction, come up) and holds it for a random while. With `cheat` it
 * keys the title's code first, so that SELECT does something.
 */
export function chaos({ seed = 1, cheat = false, hold = 20, startAt = 30 } = {}) {
  const rnd = mulberry32(seed);
  const code = [PAD.RIGHT, PAD.UP, PAD.LEFT, PAD.LEFT];
  let left = 0, pad = 0, titleSince = 0, wasTitle = false, startThisTime = startAt;
  const buttons = [PAD.A, PAD.B, PAD.SELECT, PAD.START, PAD.UP, PAD.DOWN, PAD.LEFT, PAD.RIGHT];
  return ({ frame, session }) => {
    const mode = session.game.mode;
    if (mode === 'setup') return 0;
    if (mode === 'title') {
      if (!wasTitle) { wasTitle = true; titleSince = frame; startThisTime = startAt + Math.floor(rnd() * 120); if (cheat) startThisTime = Math.max(startThisTime, 70); }
      const t = frame - titleSince;
      let p = 0;
      if (cheat && t >= 5 && t < 5 + code.length * 12 && (t - 5) % 12 < 6) p |= code[Math.floor((t - 5) / 12)];
      if (t >= startThisTime && t < startThisTime + 6 + Math.floor(rnd() * 6)) p |= PAD.START;
      if (rnd() < 0.02) p |= buttons[Math.floor(rnd() * 8)];
      return p;
    }
    wasTitle = false;
    if (left-- <= 0) {
      left = 1 + Math.floor(rnd() * hold);
      pad = 0;
      for (const b of buttons) if (rnd() < (b === PAD.START ? 0.08 : b === PAD.SELECT ? (cheat ? 0.1 : 0.04) : 0.22)) pad |= b;
    }
    return pad;
  };
}

/** Wraps a player so that it leaves START alone for a while, the first time, in the screens that wait for it (a message, the final
 *  screen), to let their tunes play on. */
export function withDwell(bot, { message = 0, complete = 0 } = {}) {
  let phase = null, since = 0;
  const done = new Set();
  return (ctx) => {
    const g = ctx.session.game;
    const key = (g.mode === 'level-clear' || g.mode === 'out-of-fuel') && g.flowPhase === 'message-wait' ? 'message' : g.mode === 'complete' && g.flowPhase === 'wait' ? 'complete' : null;
    if (key !== phase) { phase = key; since = ctx.frame; }
    const pad = bot(ctx);
    const wait = key === 'message' ? message : key === 'complete' ? complete : 0;
    if (key && !done.has(key) && ctx.frame - since < wait) return pad & ~PAD.START;
    if (key && ctx.frame - since >= wait) done.add(key);
    return pad;
  };
}
