// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// What is compared besides the pictures: the variables of the ROM (tools/ram-map.mjs) against the page's state (public/src/app.js), screen by
// screen. Each function returns the lines for what differs, in the form "name: ROM a, page b".

import { reader } from './ram-map.mjs';

const check = (lines, name, rom, page) => { if (rom !== page) lines.push(`${name}: ROM ${rom}, page ${page}`); };

// The main menu and the code entry (both are loops of mainmenu.asm). What a press changes is changed in the ROM in the frame it reads the pad
// and in the page one tick later (the keys are delivered before the next tick), so those variables are read from the previous frame.
export function menuLines({ rom, port, prev, screenBefore }) {
  const r = reader(rom.ram), s = port.state, lines = [];
  if (s.screen !== 'menu') return lines;
  // (the first frame of the menu: the ROM sets its variables up at the end of the fade, and the previous frame still has the flash's)
  if (screenBefore === 'menu') check(lines, 'MENU_CUR', prev.get('MENU_CUR'), s.menuSelection);
  check(lines, 'sound effects', prev.get('GAME_SFX') & 1, s.sfx ? 1 : 0);
  check(lines, 'music', prev.get('GAME_BGM') & 1, s.bgm ? 1 : 0);
  if ((prev.get('GAME_BGM') & 1) === (r.get('GAME_BGM') & 1)) check(lines, 'MENU_ANIM', r.get('MENU_ANIM'), s.menuAnim);
  check(lines, 'logo phase (MENU_SET bit 4)', (r.get('MENU_SET') >> 4) & 1, s.menuPhase);
  check(lines, 'RAND_SEED', r.get('RAND_SEED'), s.seed);
  // the page counts one for every tick; the ROM does not in the frames where it does something else (and a press resets or keeps the count in the frame it reads it)
  if (s.menuCount !== undefined && s.menuCount !== r.get('MENU_CNT') && s.menuCount !== ((prev.get('MENU_CNT') + 1) & 255)) lines.push(`MENU_CNT: ROM ${r.get('MENU_CNT')} (was ${prev.get('MENU_CNT')}), page ${s.menuCount}`);
  if (s.menuMode === 'code') {
    check(lines, 'code', [...prev.bytes('GAME_CODE')].join(''), s.code.join(''));
    check(lines, 'MENU_CODECUR', prev.get('MENU_CODECUR'), s.codeCursor);
  }
  return lines;
}

const signed = (v) => (v > 127 ? v - 256 : v);

// The game (gameplay, pause): the map, the clocks, the trace, the online count, the random rotation, the seed, the cursor and the rotation it is going to make.
export function gameLines({ rom, port }) {
  const r = reader(rom.ram), s = port.state, lines = [];
  if (s.screen !== 'playing' && s.screen !== 'pause') return lines;
  check(lines, 'level', r.get('GAME_LEVEL'), s.levelIndex);
  const mapRom = r.bytes('GAME_MAP');
  const diff = [];
  for (let i = 0; i < 256; i++) if (mapRom[i] !== s.map[i]) diff.push(`${i}:${mapRom[i]}/${s.map[i]}`);
  if (diff.length) lines.push(`map (offset:ROM/page): ${diff.slice(0, 8).join(' ')}${diff.length > 8 ? ` +${diff.length - 8}` : ''}`);
  check(lines, 'GAME_TIME', r.get('GAME_TIME'), s.gameTime);
  check(lines, 'GAME_TIME_DIV', r.get('GAME_TIME_DIV'), s.timeDiv);
  check(lines, 'GAME_TRACE_CNT', r.get('GAME_TRACE_CNT'), s.traceCountdown);
  check(lines, 'GAME_TERM_TRACE', r.get('GAME_TERM_TRACE'), s.traceOrdinal);
  check(lines, 'GAME_ONLINE', r.get('GAME_ONLINE'), s.onlineWord);
  check(lines, 'GAME_ONLINE (percent)', r.get('GAME_ONLINE') >> 8, s.onlineTarget);
  check(lines, 'GAME_ONLINE_SCR', r.get('GAME_ONLINE_SCR'), s.onlineDisplay);
  check(lines, 'GAME_RROT_CNT', r.get('GAME_RROT_CNT'), s.rrotCounter);
  check(lines, 'RAND_SEED', r.get('RAND_SEED'), s.seed);
  if (s.screen === 'playing') {
    check(lines, 'cursor SX', r.get('GAME_CUR_SX'), s.cur.sx);
    check(lines, 'cursor SY', r.get('GAME_CUR_SY'), s.cur.sy);
    check(lines, 'cursor DX', signed(r.get('GAME_CUR_DX')), s.cur.dx);
    check(lines, 'cursor DY', signed(r.get('GAME_CUR_DY')), s.cur.dy);
    check(lines, 'GAME_CUR_OFF', r.get('GAME_CUR_OFF'), s.cur.off);
    check(lines, 'GAME_CUR_COL', r.get('GAME_CUR_COL'), s.cursorColor);
    check(lines, 'GAME_ROTATE (turns)', r.get('GAME_ROTATE'), s.pending ? s.pending.turns : 0);
    if (s.pending) check(lines, 'rotation target', (r.get('GAME_ROTATE_Y') + 1) * 16 + r.get('GAME_ROTATE_X') + 1, s.pending.off);
    check(lines, 'GAME_CALL_MENU', r.get('GAME_CALL_MENU'), s.callMenu ? 1 : 0);
  }
  return lines;
}

// The ending screen (welldone.asm): the scroll, the text engine, the columns of the band and the counter that changes the line.
export function endingLines({ rom, port }) {
  const r = reader(rom.ram), s = port.state, lines = [];
  if (s.screen !== 'ending' || !s.ending) return lines;
  const e = s.ending;
  check(lines, 'GAME_BG_OFF (low)', r.get('GAME_BG_OFF') & 255, e.bgOff);
  check(lines, 'GAME_BG_OFF (high)', rom.ram[0x81], e.bgHigh);
  check(lines, 'GAME_CUR_DELAY', r.get('GAME_CUR_DELAY'), e.delay);
  check(lines, 'text offset (GAME_CUR_OFF)', r.get('GAME_CUR_OFF'), e.curOff);
  check(lines, 'GAME_CUR_TEXT', r.get('GAME_CUR_TEXT'), e.curText);
  check(lines, 'GAME_CUR_FADE', r.get('GAME_CUR_FADE'), e.fade);
  check(lines, 'GAME_BG_PTR', r.get('GAME_BG_PTR'), e.bgPtr);
  check(lines, 'band page', (r.get('GAME_BG_PAGE') >> 2) & 1, e.bgPage);
  check(lines, 'GAME_CHANGE_CNT', r.get('GAME_CHANGE_CNT'), e.change);
  return lines;
}
