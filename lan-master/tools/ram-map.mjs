// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Where the variables of Lan Master (the author's v1.09 of 14.06.11) live in the NES's RAM. The author's source gives them as
// `equ` lines (game.asm, tracemap.asm, welldone.asm); test/reference.test.mjs reads the source in reference/source/ and checks that this
// table says what the source says. FamiTone's variables start at FT_BASE_ADR ($0200).
//
// Each entry: [name, address, bytes].

export const ROM_SHA256 = 'becfeafb80479c330333c9e9385417f68f3c88e85443dfb37b05ae9283f3ea45';

export const RAM_MAP = [
  ['PAD_STATE', 0xf9, 1], ['PAD_STATEP', 0xf8, 1], ['PAD_STATET', 0xf7, 1],
  ['FRAME_CNT', 0xff, 1], ['FRAME_CNT2', 0xfe, 1], ['RAND_SEED', 0xfd, 1],
  ['MENU_BASE', 0xef, 1], ['MENU_CUR', 0xee, 1], ['MENU_CNT', 0xed, 1], ['MENU_CURADRL', 0xec, 1], ['MENU_CURADRH', 0xeb, 1],
  ['MENU_CODECUR', 0xea, 1], ['MENU_ANIM', 0xe9, 1], ['MENU_SET', 0xe8, 1],
  ['GAME_BASE', 0xe7, 1], ['GAME_CUR_SX', 0xe6, 1], ['GAME_CUR_SY', 0xe5, 1], ['GAME_CUR_DX', 0xe4, 1], ['GAME_CUR_DY', 0xe3, 1],
  ['GAME_CUR_OFF', 0xe2, 1], ['GAME_CUR_COL', 0xe1, 1], ['GAME_ROTATE_X', 0xe0, 1], ['GAME_ROTATE_Y', 0xdf, 1],
  ['GAME_SFX', 0xde, 1], ['GAME_BGM', 0xdd, 1], ['GAME_CODE', 0xd9, 4], ['GAME_NTSC', 0xd8, 1], ['GAME_LEVEL', 0xd7, 1],
  ['GAME_ONLINE', 0xd5, 2], ['GAME_TIME', 0xd4, 1], ['GAME_ROTATE', 0xd3, 1], ['GAME_TIME_DIV', 0xd2, 1],
  ['GAME_RROT_CNT', 0xcf, 2], ['GAME_RROT_TIME', 0xcd, 2], ['GAME_TERM_CNT', 0xcc, 1], ['GAME_TERM_OFF', 0xcb, 1],
  ['GAME_CALL_MENU', 0xca, 1], ['GAME_TERM_TRACE', 0xc9, 1], ['GAME_TRACE_CNT', 0xc8, 1], ['GAME_ONLINE_SCR', 0xc7, 1],
  ['GAME_TERM_FP', 0xc5, 2], ['GAME_DELAY', 0xc4, 1], ['GAME_TABLE_VRAM', 0xc2, 2], ['GAME_TABLE_WDT', 0xc1, 1],
  ['GAME_TABLE_HGT', 0xc0, 1], ['GAME_TABLE_SRC', 0xbe, 2], ['GAME_TABLE_CODE', 0xbd, 1], ['GAME_TERM_ONGFX', 0xbc, 1],
  ['GAME_TRACE_SKIP', 0xbb, 1], ['GAME_TIME_OUT', 0xba, 1], ['GAME_ROTATE_SFX', 0xb9, 1], ['GAME_START_POS', 0xb8, 1],
  ['GAME_LOOP_ON', 0xb7, 1],
  ['GAME_MAP', 0x300, 256], ['GAME_CHECK', 0x400, 256], ['GAME_TERM_LIST', 0x500, 196],
  ['OAM_PAGE', 0x700, 256],
  ['FT_OUT_BUF', 0x270, 11],
  // the ending screen's variables share the zero page with the tracer's
  ['T_ONLINE', 0x87, 2], ['T_ONLINE_CNT', 0x89, 1],
  ['GAME_BG_OFF', 0x80, 2], ['GAME_CUR_DELAY', 0x82, 1], ['GAME_CUR_TEXT', 0x83, 1], ['GAME_CUR_FADE', 0x84, 1],
  ['GAME_BG_PTR', 0x85, 1], ['GAME_BG_PAGE', 0x86, 1], ['GAME_SKIP', 0x87, 1], ['GAME_CHANGE_CNT', 0x88, 2],
];

const BY_NAME = new Map(RAM_MAP.map(([name, address, size]) => [name, { name, address, size }]));

// Reads variables out of a 2 KiB RAM image: `get('GAME_TIME')` is one byte, a two-byte variable is little endian, and
// `bytes('GAME_MAP')` is a copy of all of it.
export function reader(ram) {
  return {
    get(name) {
      const v = BY_NAME.get(name);
      if (!v) throw new Error(`unknown variable ${name}`);
      return v.size === 2 ? ram[v.address] | (ram[v.address + 1] << 8) : ram[v.address];
    },
    bytes(name) {
      const v = BY_NAME.get(name);
      if (!v) throw new Error(`unknown variable ${name}`);
      return ram.slice(v.address, v.address + v.size);
    },
  };
}

export const address = (name) => BY_NAME.get(name).address;
