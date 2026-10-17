// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The scenarios the oracle plays: a level, a difficulty, a seed for the random numbers, a number of frames and the keys, frame by frame. The same scenario goes to the
// original (as a text file, see tools/oracle/harness.cc) and to the page (tools/js-run.mjs). A key is down from the frame of its "down" to the frame of its "up"; the
// original's loop looks at the keys once a frame, before it moves the train, so a press in frame f acts in frame f.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// a small deterministic generator for the scenarios' own choices (not the game's)
export function prng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

export function makeScenario({ name, level = 1, difficulty = 'normal', seed = 1, frames = 600, language = 'en', events = [], dt = 16 }) {
  return { name, level, difficulty, seed, frames, language, events: events.slice().sort((a, b) => a.frame - b.frame), dt };
}

export function toText(sc) {
  const lines = [`mode ${sc.mode ?? 'game'}`, `level ${sc.level}`, `difficulty ${sc.difficulty}`, `seed ${sc.seed}`, `language ${sc.language}`, `frames ${sc.frames}`, `dt ${sc.dt}`];
  if (sc.niveauMax) lines.push(`niveaumax ${sc.niveauMax}`);
  if (sc.until) lines.push(`until ${sc.until}`);
  for (const e of sc.events) {
    if (sc.timed) lines.push(e.type === 'click' ? `tclick ${e.time}` : `t${e.type} ${e.time} ${e.key}`);
    else if (e.type === 'click') lines.push(`click ${e.frame}`);
    else lines.push(`key${e.type} ${e.frame} ${e.key}`);
  }
  return lines.join('\n') + '\n';
}

const ARROWS = ['up', 'down', 'left', 'right'];
export const press = (frame, key, hold = 1) => [{ frame, type: 'down', key }, { frame: frame + hold, type: 'up', key }];

// Nothing is pressed except space, to start and to go on after a crash (the original waits for a key after every reload). The train runs where the track leads it.
export function idle({ level, difficulty = 'normal', seed = 1, frames = 1500 }) {
  const events = [...press(1, 'space')];
  for (let f = 200; f < frames; f += 100) events.push(...press(f, 'space'));
  return makeScenario({ name: `idle-L${level}-${difficulty}-s${seed}`, level, difficulty, seed, frames, events });
}

// Random play: taps and held arrows (several at once, held across junctions, released in any order), the help key, the pause key; space to go on after a crash.
export function random({ level, difficulty = 'normal', seed = 1, frames = 1500, rate = 40, language = 'en', clicks = false, name = null }) {
  const rnd = prng(seed * 7919 + level * 104729);
  const events = [...press(1, 'space')];
  let f = 3;
  while (f < frames - 5) {
    f += 3 + Math.floor(rnd() * rate);
    const r = rnd();
    if (r < 0.45) events.push(...press(f, ARROWS[Math.floor(rnd() * 4)], 1 + Math.floor(rnd() * 3)));
    else if (r < 0.75) events.push(...press(f, ARROWS[Math.floor(rnd() * 4)], 5 + Math.floor(rnd() * 60)));
    else if (r < 0.85) { const a = ARROWS[Math.floor(rnd() * 4)], b = ARROWS[Math.floor(rnd() * 4)]; events.push({ frame: f, type: 'down', key: a }, { frame: f + 1 + Math.floor(rnd() * 3), type: 'down', key: b }, { frame: f + 8 + Math.floor(rnd() * 30), type: 'up', key: a }, { frame: f + 12 + Math.floor(rnd() * 40), type: 'up', key: b }); }
    else if (r < 0.9) events.push(...press(f, 'h'));
    else if (r < 0.94) { events.push(...press(f, 'p')); events.push(...press(f + 5 + Math.floor(rnd() * 20), 'space')); }
    else if (clicks && r < 0.97) events.push({ frame: f, type: 'click' });
    else events.push(...press(f, 'space'));
  }
  return makeScenario({ name: name ?? `random-L${level}-${difficulty}-s${seed}`, level, difficulty, seed, frames, language, events });
}

// The routes that the package found for the 50 levels (test/playthrough_solutions.json: the direction taken at each junction) played as taps, one frame after the
// head has come into the junction. `plan` is a list of frames at which a direction was pressed, found by tools/oracle.mjs by playing the page's own game.
export function route({ level, difficulty = 'normal', seed = 1, plan, frames, extra = [], name = null, language = 'en' }) {
  const events = [...press(1, 'space')];
  // the original does not take a direction pressed in the frame that starts the game (any key only starts it): the first press waits one frame
  for (const { frame, dir } of plan) events.push(...press(Math.max(frame, 2), dir));
  return makeScenario({ name: name ?? `route-L${level}-${difficulty}-s${seed}`, level, difficulty, seed, frames, language, events: [...events, ...extra] });
}

// Finds the frames at which the package's route for a level presses a direction, by playing the page's own game (GameSession) the way the package's
// test/playthrough_all_levels.mjs does: when the head has come into a cell where more than one way is open, the next step is given the route's direction.
// Step k of the game is frame k + 1 of a scenario (frame 1 starts the game). Returns { plan, frames }: the presses, and the frame in which the last wagon is taken (plus a margin).
export async function planRoute(level, { difficulty = 'normal', seed = 1, margin = 60 } = {}) {
  const { LevelSet } = await import('../public/src/levels.mjs');
  const { GameSession, STATE_PLAYING } = await import('../public/src/session.mjs');
  const levels = new LevelSet(readFileSync(join(ROOT, 'public', 'data', 'levels.dat')));
  const route = packageSolutions().get(level);
  const s = new GameSession(levels, { startLevel: level, difficulty, seed });
  s.oracle.renderFrame();
  const DIRS = [2, 1, 3, 0];
  const choices = () => DIRS.filter((d) => s.oracle.testDir(d));
  const plan = [];
  let k = 0, pi = 0, lastP = s.oracle.history.at(-1).p, lastD = s.oracle.history.at(-1).d;
  const advance = (dir) => {
    let first = true;
    for (let f = 0; f < 20000; f++) {
      if (first && dir !== null) plan.push({ frame: k + 1, dir: ['left', 'right', 'up', 'down'][dir] });
      first = false;
      s.step(16, f === 0 ? dir : null, true); k++;
      if (s.state !== STATE_PLAYING) return;
      const h = s.oracle.history.at(-1);
      if (h.p !== lastP || h.d !== lastD) { lastP = h.p; lastD = h.d; if (choices().length > 1) return; }
    }
    throw new Error('route: no decision point reached');
  };
  if (choices().length <= 1) advance(choices()[0] ?? null);
  while (s.state === STATE_PLAYING) {
    const cs = choices();
    if (cs.length > 1) { if (pi >= route.length) return { plan, frames: k + 1 + margin, state: 'exhausted' }; advance(route[pi++]); } else advance(cs[0] ?? null);
  }
  return { plan, frames: k + 1 + margin, state: s.state };
}

export function packageSolutions() {
  const doc = JSON.parse(readFileSync(join(ROOT, 'docs', 'development', 'package', 'test', 'playthrough_solutions.json'), 'utf8'));
  return new Map(Object.entries(doc.levels).map(([k, v]) => [Number(k), v.directions]));
}

// ---- the menus: scenarios in time -----------------------------------------------------------------------------------------------------------
// The menus' loops do not count frames alike (each screen has a set-up flip of its own), so a menu scenario gives its keys and its pictures by the clock: the original's
// virtual clock starts at 1000, a frame lasts 16 ms, and a key is read in the first frame that begins at or after its time (the page's clock is made to start at 1000 too).
export function timed({ name, keys = [], dumps, until, niveauMax = 0, language = 'en' }) {
  const frameTime = (t) => 1000 + 16 * Math.ceil((t - 1000) / 16);   // a frame ends at 1000 + 16 k
  dumps = dumps.map(frameTime);
  until = frameTime(until);
  const events = [];
  for (const [time, key, hold = 16] of keys) events.push({ time, type: 'down', key }, { time: time + hold, type: 'up', key });
  events.sort((a, b) => a.time - b.time);
  return { name, mode: 'menu', timed: true, level: 1, difficulty: 'normal', seed: 1, frames: 0, language, events, dt: 16, until, niveauMax, dumps };
}

export function menuScenarios() {
  const k = (t, key) => [t, key];
  return [
    timed({ name: 'menu-main', dumps: [1176, 1496], until: 1500 }),
    timed({ name: 'menu-main-down1', keys: [k(1100, 'down')], dumps: [1400], until: 1410 }),
    timed({ name: 'menu-main-down2', keys: [k(1100, 'down'), k(1200, 'down')], dumps: [1400], until: 1410 }),
    timed({ name: 'menu-main-down3', keys: [k(1100, 'down'), k(1200, 'down'), k(1300, 'down')], dumps: [1500], until: 1510 }),
    timed({ name: 'menu-main-up1', keys: [k(1100, 'up')], dumps: [1400], until: 1410 }),
    timed({ name: 'menu-scores', keys: [k(1100, 'down'), k(1200, 'return'), k(1600, 'return')], dumps: [1400, 1800], until: 1810 }),
    timed({ name: 'menu-options', keys: [k(1100, 'down'), k(1200, 'down'), k(1300, 'return'), k(1700, 'right'), k(1800, 'down'), k(1900, 'right')], dumps: [1500, 1760, 2100], until: 2110 }),
    timed({ name: 'menu-play-new', keys: [k(1100, 'return'), k(1500, 'down')], dumps: [1300, 1700], until: 1710 }),
    timed({ name: 'menu-play-levels', niveauMax: 7, keys: [k(1100, 'return'), k(1500, 'right'), k(1600, 'down'), k(1700, 'down')], dumps: [1300, 1560, 1900], until: 1910 }),
    // Escape in a game opens the menu of the game (Continue, Options, Exit game); the first two returns start a game on Normal
    timed({ name: 'menu-ingame', keys: [k(1100, 'return'), k(1500, 'return'), k(3000, 'escape')], dumps: [2800, 3300], until: 3310 }),
    timed({ name: 'menu-ingame-down', keys: [k(1100, 'return'), k(1500, 'return'), k(3000, 'escape'), k(3400, 'down'), k(3700, 'down')], dumps: [3600, 3900], until: 3910 }),
    timed({ name: 'menu-ingame-options', keys: [k(1100, 'return'), k(1500, 'return'), k(3000, 'escape'), k(3400, 'down'), k(3500, 'return'), k(4000, 'down'), k(4100, 'right'), k(4300, 'escape'), k(4800, 'escape')], dumps: [3900, 4200, 4600, 5100], until: 5110 }),
    timed({ name: 'menu-ingame-continue', keys: [k(1100, 'return'), k(1500, 'return'), k(3000, 'escape'), k(3400, 'return'), k(4000, 'left')], dumps: [3800, 4400, 4800], until: 4810 }),
    // a game that has scored (the first wagons are taken at about 3.5 s), left from its menu: the name is asked for, then the table of scores, then the main menu
    timed({ name: 'menu-ingame-score', keys: [k(1100, 'return'), k(1500, 'return'), k(2500, 'left'), k(5000, 'escape'), k(5400, 'down'), k(5500, 'down'), k(5600, 'return'), k(6200, 'a'), k(6400, 'b'), k(7000, 'return'), k(7800, 'return')], dumps: [4900, 5300, 6000, 6800, 7400, 8200], until: 8210 }),
    timed({ name: 'menu-ingame-exit', keys: [k(1100, 'return'), k(1500, 'return'), k(3000, 'escape'), k(3400, 'down'), k(3500, 'down'), k(3600, 'return')], dumps: [3550, 3900, 4400], until: 4410 }),
    // the language menu (19 languages in three columns), from the options screen: the language in use is chosen at first, down goes to the next, right to the next column
    timed({ name: 'menu-language', keys: [k(1100, 'down'), k(1200, 'down'), k(1300, 'return'), k(1700, 'up'), k(1800, 'return'), k(2400, 'down'), k(2900, 'right')], dumps: [2300, 2800, 3300], until: 3310 }),
    // Deutsch chosen (up from English, then return): the options screen is drawn again in German, and so is the main menu after Escape
    timed({ name: 'menu-language-choose', keys: [k(1100, 'down'), k(1200, 'down'), k(1300, 'return'), k(1700, 'up'), k(1800, 'return'), k(2400, 'up'), k(2500, 'return'), k(3100, 'escape')], dumps: [2300, 3000, 3500], until: 3510 }),
    ...languageTours(),
  ];
}

// A tour of the screens that have a picture of the language, for every language but English (the other scenarios are in English): the main menu, the table of scores, the
// options, the difficulty menu, the start of a game ("press any key", the dashboard) and the menu of the game. The original starts in that language (the scenario's
// `language` is the end of the name of its file) and so does the page.
export const LANGUAGE_TOURS = ['de', 'es', 'fr', 'ar', 'cn', 'jp', 'ru', 'sl', 'it', 'br', 'po', 'se', 'eo', 'hu', 'tu', 'pl', 'du', 'ko'];
export function languageTours() {
  const k = (t, key) => [t, key];
  return LANGUAGE_TOURS.map((code) => timed({
    name: `menu-tour-${code}`, language: code, dumps: [1496, 2100, 3100, 4100, 6000, 6500], until: 6510,
    // the main menu starts on Play every time (PyE=0 at the start of Menu::SDLMain)
    keys: [k(1600, 'down'), k(1700, 'return'), k(2200, 'return'), k(2500, 'down'), k(2600, 'down'), k(2700, 'return'), k(3200, 'escape'), k(3500, 'return'), k(4200, 'return'), k(6100, 'escape')],
  }));
}
