// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The scenarios of the executable oracle and the one function that runs a scenario with everything compared: the game's variables
// (tools/lockstep.mjs), the picture unit's memories, the sound chip's input buffer, and the picture itself, pixel by pixel, outside the
// lines where the original changes a register in the middle of the line (tools/nes-frame.mjs composes the ROM's picture).
//
//   node tools/live.mjs            the long runs (npm run test:live)
//   npm test                       short versions of the same scenarios

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lockstep } from './lockstep.mjs';
import { mower, chaos, withDwell } from './bots.mjs';
import { composeFrame } from './nes-frame.mjs';
import { composeDisplay } from '../public/src/display.js';

const CHR = new Uint8Array(readFileSync(fileURLToPath(new URL('../public/assets/patterns.chr', import.meta.url))));

// Lines where a register is changed in the middle of the line, by kind of screen: the picture is not compared on them.
export const SPLIT_LINES = Object.freeze({ field: [33], message: [33, 116, 154, 155], title: [27, 94, 160, 161, 185], done: [] });

// Each scenario: how long (frames) in a short and a long run, and the player. `seed` varies the games within a scenario.
export const SCENARIOS = Object.freeze([
  { id: 'mow', about: 'a player that mows the lawns, fetches fuel and pauses (levels 1 and 2 and the out-of-fuel ends)', short: 5000, long: 40000, make: (seed) => mower({ seed }),
    expect: ['level-clear', 'out-of-fuel', 'pause-on', 'fuel-collected', 'flowers-hit', 'boost-start', 'fuel-low', 'engine-stall'] },
  { id: 'cheat', about: 'the title cheat and SELECT: all ten levels, the final screen, the title again, a second game', short: 20000, long: 90000, make: (seed) => mower({ seed, cheat: true, selectEvery: 250 }),
    expect: ['cheat-on', 'level-clear', 'out-of-fuel', 'stone-hit', 'game-complete', 'final-exit', 'title-return', 'pause-on'] },
  { id: 'chaos', about: 'random buttons, START and SELECT together with anything', short: 5000, long: 40000, make: (seed) => chaos({ seed }),
    expect: ['pause-on', 'pause-off', 'out-of-fuel', 'boost-start'] },
  { id: 'chaos-cheat', about: 'random buttons after the cheat code', short: 5000, long: 40000, make: (seed) => chaos({ seed, cheat: true }),
    expect: ['cheat-on', 'level-clear', 'out-of-fuel', 'pause-on'] },
  { id: 'wander', about: 'a player that never mows and runs out of fuel', short: 3000, long: 20000, make: (seed) => mower({ seed, greedy: false, wander: 0.05 }),
    expect: ['out-of-fuel', 'engine-stall', 'fuel-low'] },
]);

// Scenarios that exist to cover the sound: every tune is played past its loop and every effect is started.
export const SOUND_SWEEP = Object.freeze([
  { id: 'title-tune', frames: 4300, make: () => () => 0 },
  { id: 'game-tune', frames: 9500, make: () => mower({ seed: 1, cheat: true, selectEvery: 100, skipTo: 10, boost: 0, wander: 0.001, thirst: 200, survive: true }) },
  { id: 'clear-and-final-tunes', frames: 13500, make: () => withDwell(mower({ seed: 2, cheat: true, selectEvery: 150 }), { message: 1300, complete: 2900 }) },
  { id: 'out-of-fuel-tune', frames: 3500, make: () => withDwell(mower({ seed: 4, greedy: false, wander: 0.05 }), { message: 1300 }) },
]);
// Frames each tune takes to come round to its start (measured on the port's player, which the sound comparison shows to be the ROM's).
export const TUNE_LOOPS = Object.freeze({ title: 3800, game: 3860, levelclear: 544, outoffuel: 544, welldone: 2560 });

/**
 * Runs `pad` against a ROM, comparing as described above.
 * @returns the lockstep result plus `pictures`: { frames, differing: [{ frame, kind, pixels, lines }], splits: Map(kind -> Set of lines) }
 */
export function runScenario({ flavour, frames, pad, sound = true, pictures = true, pictureEvery = 1, stopAtMismatch = true, rom = null, follow }) {
  const stats = { frames: 0, differing: [], splits: new Map() };
  const after = !pictures ? null : ({ frame, rom: game, session }) => {
    const visible = game.machine.visible;
    if (!visible || !(visible.mask & 0x18)) return;                 // a frame that began with the display off has no picture to compare
    if (frame % pictureEvery) return;                               // (the variables, memories and sound are compared at every frame)
    const g = session.game;
    const kind = g.regs?.kind ?? 'field';
    const reference = composeFrame(game.machine);
    const mine = composeDisplay(g, CHR);
    const lines = new Set();
    let pixels = 0;
    for (let y = 0; y < 240; y++) {
      if (reference.split[y]) { if (!stats.splits.has(kind)) stats.splits.set(kind, new Set()); stats.splits.get(kind).add(y); continue; }
      for (let x = 0; x < 256; x++) {
        const o = (y * 256 + x) * 4;
        if (reference.rgba[o] !== mine[o] || reference.rgba[o + 1] !== mine[o + 1] || reference.rgba[o + 2] !== mine[o + 2]) { pixels++; lines.add(y); }
      }
    }
    stats.frames++;
    if (pixels && stats.differing.length < 20) stats.differing.push({ frame, kind, pixels, lines: [...lines].slice(0, 12) });
  };
  const result = lockstep({ flavour, frames, pad, audio: sound, capture: pictures, stopAtMismatch, after, rom, follow });
  result.pictures = stats;
  return result;
}

/** What differed in a run, as a list of lines (empty when the port agrees with the ROM everywhere that was compared). */
export function failures(result, expected = []) {
  const out = [];
  for (const m of result.mismatches) out.push(`${result.flavour}, frame ${m.frame} (${m.mode}): ${m.fields.join(' | ')}`);
  for (const d of result.pictures?.differing ?? []) out.push(`picture, frame ${d.frame} (${d.kind}): ${d.pixels} pixels on lines ${d.lines.join(',')}`);
  for (const [kind, lines] of result.pictures?.splits ?? []) {
    const stray = [...lines].filter((l) => !SPLIT_LINES[kind].includes(l));
    if (stray.length) out.push(`the ROM split the ${kind} screen on lines nobody expected: ${stray.join(' ')}`);
  }
  for (const name of expected) if (!result.events.get(name)) out.push(`the scenario never reached "${name}"`);
  return out;
}
