// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// A bot for the oracle's scenarios. The package came with a board in which the whole network is connected for each of the fifty levels (its own
// "witnesses", kept in docs/development/package/tests/witnesses); test/rom-routines.test.mjs checks each of them with the ROM's own trace. The bot plays
// the presses that take the board the ROM has to that arrangement, reading the ROM's memory to know where the cursor is and what each tile is. Nothing
// here decides what the game does: the ROM and the page both get the same pad.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageModules } from './package-modules.mjs';
import { PAD } from './rom-run.mjs';
import { reader } from './ram-map.mjs';

const C = packageModules().LanMasterCore;
const LEVELS = packageModules().LAN_MASTER_LEVELS;

// The cells (offsets in the 16 by 16 map) in the board's reading order.
const CELLS = [];
for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) CELLS.push((y + 1) * 16 + x + 1);

export function baseMap(levelIndex) {
  const level = LEVELS[levelIndex];
  const map = new Array(256).fill(0);
  CELLS.forEach((off, i) => { map[off] = C.MAP_CODES[level.tile_classes[i]]; });
  return map;
}

const WITNESSES = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'development', 'package', 'tests', 'witnesses');

// The arrangement with the whole network connected that the package kept for a level (a 16 by 16 map like the ROM's GAME_MAP).
export function solveLevel(levelIndex) {
  const board = JSON.parse(readFileSync(join(WITNESSES, `level${String(levelIndex + 1).padStart(2, '0')}.json`), 'utf8'));
  const map = new Array(256).fill(0);
  CELLS.forEach((off, i) => { map[off] = board[i]; });
  return map;
}

// How many turns (1 to 3, to the left as the game counts them) bring `tile` to `want`; 0 if it is there already.
export function turnsToReach(tile, want) {
  for (let k = 0; k < 4; k++) if (C.rotate(tile, k) === want) return k;
  return -1;
}

// A bot: returns a function for lockstep's `pad` that plays the level the ROM is in until the network is complete. It holds a direction until the cursor
// is on the tile it wants, then presses A, SELECT or B (1, 2 or 3 turns) and waits for the turn to be done.
export function makeBot({ press = 3, rest = 5, levelAlias = {} } = {}) {
  let target = null, targetLevel = -1;
  let busy = 0;     // frames of the current press or rest left
  let button = 0;
  return ({ rom, port }) => {
    if (port.state.screen !== 'playing') { busy = 0; return 0; }
    const r = reader(rom.ram);
    const level = r.get('GAME_LEVEL');
    if (level !== targetLevel) { target = solveLevel(levelAlias[level] ?? level); targetLevel = level; }
    if (busy > 0) { busy--; return busy >= rest ? button : 0; }
    if (!target) return 0;     // a level the solver does not solve: the bot leaves it alone
    const map = r.bytes('GAME_MAP');
    const sx = r.get('GAME_CUR_SX'), sy = r.get('GAME_CUR_SY'), off = r.get('GAME_CUR_OFF');
    // the tile the cursor is on, or going to
    const dx = r.get('GAME_CUR_DX'), dy = r.get('GAME_CUR_DY');
    const cx = ((sx - 32) >> 4) + (dx === 2 ? 1 : 0), cy = ((sy - 31) >> 4) + (dy === 2 ? 1 : 0);
    const here = (cy + 1) * 16 + cx + 1;
    // the nearest tile that is not as it should be
    let best = null, bestDistance = 1e9;
    for (const cell of CELLS) {
      if (map[cell] === target[cell] || map[cell] === 0) continue;
      const x = (cell & 15) - 1, y = (cell >> 4) - 1, d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d < bestDistance) { bestDistance = d; best = { cell, x, y }; }
    }
    if (!best) return 0;
    if (best.cell === here) {
      if (off !== 0) return 0;     // let it arrive
      const turns = turnsToReach(map[here], target[here]);
      button = turns === 1 ? PAD.A : turns === 2 ? PAD.SELECT : PAD.B;
      busy = press + rest;
      return button;
    }
    if (best.x > cx) return PAD.RIGHT;
    if (best.x < cx) return PAD.LEFT;
    return best.y > cy ? PAD.DOWN : PAD.UP;
  };
}
