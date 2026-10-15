// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Where the static variables of Zooming Secretary v1.02 (30.12.11) live in the NES's RAM. The author's source (game.c and npc.h) declares
// them one after the other as `static` variables with no initialiser, and cc65 puts such variables in the BSS segment in the order they
// are declared; the linker configuration (nes.cfg) starts RAM at $0300. The table below is that order, with the size of each type
// (`unsigned char` 1, `int` and `unsigned int` and pointers 2) and the length of each array, anchored on the one array whose place can be
// found in the running program without the source: `map`, 704 bytes (32 by 22) that the program fills from the nametable, which sits at
// $0347 (tools/rom-oracle.mjs `verify` finds it again, from the nametable and the source's tileAttr table, and checks a dozen values that
// the program sets at the start of Day 1). Everything else follows from the declaration order, and every variable the oracle compares was
// seen to behave as the source says it does. A variable the source does not declare (the compiler's temporaries) is not in the table.
//
// Each entry: [name, address, bytes per element, number of elements].
export const ROM_SHA256 = '315adee10052367298959d55256e9f2621381da9f7c839f50832e13516b61770';
export const RAND_SEED = 0x12;            // neslib.s: the zero-page byte that rand8() shifts

export const RAM_MAP = [
  ['player_x', 0x325, 2, 1], ['player_y', 0x327, 2, 1], ['player_px', 0x329, 1, 1], ['player_py', 0x32a, 1, 1],
  ['player_spr', 0x32b, 2, 1], ['player_spr_prev', 0x32d, 2, 1], ['player_ladder', 0x32f, 1, 1], ['player_dir', 0x330, 1, 1],
  ['player_dir_prev', 0x331, 1, 1], ['player_dir_cnt', 0x332, 2, 1], ['player_floor', 0x334, 1, 1], ['player_topic', 0x335, 1, 1],
  ['player_speed', 0x336, 2, 1], ['player_speed_to', 0x338, 2, 1], ['player_coffee', 0x33a, 1, 1], ['player_step_cnt', 0x33b, 2, 1],
  ['player_step_type', 0x33d, 1, 1], ['player_slowdown', 0x33e, 1, 1], ['player_step_anim', 0x33f, 1, 1], ['player_knocked', 0x340, 1, 1],
  ['player_knocked_anim', 0x341, 1, 1], ['player_wisdom', 0x342, 2, 1], ['player_catch', 0x344, 1, 1], ['player_answer', 0x345, 1, 1],
  ['topics_active', 0x346, 1, 1], ['map', 0x347, 1, 704],
  ['npc_all', 0x607, 1, 1], ['npc_type', 0x608, 1, 1], ['npc_x', 0x609, 2, 1], ['npc_y', 0x60b, 2, 1], ['npc_dir', 0x60d, 1, 1],
  ['npc_cnt', 0x60e, 2, 1], ['npc_spr', 0x610, 2, 1], ['npc_tx', 0x612, 1, 1], ['npc_ty', 0x613, 1, 1], ['npc_wait', 0x614, 1, 1],
  ['npc_speed', 0x615, 1, 1], ['npc_dx', 0x616, 2, 1], ['npc_dy', 0x618, 2, 1],
  ['phone_all', 0x61a, 1, 1], ['phone_x', 0x61b, 1, 4], ['phone_y', 0x61f, 1, 4], ['phone_cnt', 0x623, 2, 4], ['phone_level', 0x62b, 1, 4],
  ['phone_topic', 0x62f, 1, 4], ['phone_runaway', 0x633, 1, 1], ['phone_runaway_max', 0x634, 1, 1],
  ['table_all', 0x635, 1, 1], ['table_off', 0x636, 2, 6], ['table_cur', 0x642, 1, 1],
  ['topic_all', 0x643, 1, 1], ['topic_x', 0x644, 1, 4], ['topic_y', 0x648, 1, 4], ['topic_id', 0x64c, 1, 4], ['topic_flash_x', 0x650, 1, 1],
  ['topic_flash_y', 0x651, 1, 1], ['topic_flash_spr', 0x652, 1, 1], ['topic_flash_cnt', 0x653, 1, 1], ['topic_msg', 0x654, 1, 4],
  ['heart_ptr', 0x658, 1, 1], ['heart_x', 0x659, 1, 8], ['heart_y', 0x661, 1, 8], ['heart_cnt', 0x669, 1, 8],
  ['update_list_len', 0x671, 1, 1], ['update_list', 0x672, 1, 96],
  ['i', 0x6d2, 1, 1], ['j', 0x6d3, 1, 1], ['px', 0x6d4, 1, 1], ['py', 0x6d5, 1, 1], ['spr', 0x6d6, 1, 1], ['spr1', 0x6d7, 1, 1],
  ['i16', 0x6d8, 2, 1], ['j16', 0x6da, 2, 1], ['state', 0x6dc, 1, 1], ['frame_cnt', 0x6dd, 1, 1],
  ['calls_count', 0x6de, 1, 1], ['calls_missed', 0x6df, 1, 1], ['calls_missed_max', 0x6e0, 1, 1], ['calls_missed_level', 0x6e1, 1, 1],
  ['calls_level', 0x6e2, 1, 1], ['call_delay', 0x6e3, 2, 1], ['coffee_x', 0x6e5, 1, 1], ['coffee_y', 0x6e6, 1, 1],
  ['coffee_wait', 0x6e7, 2, 1], ['level', 0x6e9, 1, 1], ['pause', 0x6ea, 1, 1], ['bonus', 0x6eb, 1, 1], ['ring_cnt', 0x6ec, 2, 1],
  ['msg_cnt', 0x6ee, 1, 1], ['msg_ptr', 0x6ef, 2, 1], ['msg_wait', 0x6f1, 1, 1], ['msg_off', 0x6f2, 1, 1], ['test_mode', 0x6f3, 1, 1],
  ['floor_left_cnt', 0x6f4, 1, 1], ['floor_right_cnt', 0x6f5, 1, 1], ['floor_left', 0x6f6, 1, 4], ['floor_right', 0x6fa, 1, 4],
];

const BY_NAME = new Map(RAM_MAP.map(([name, address, size, count]) => [name, { name, address, size, count }]));

// Reads variables out of a 2 KiB RAM image: `get('player_x')` is one value (little endian), `get('phone_cnt', 1)` one element of an array.
export function reader(ram) {
  const read = (v, i = 0) => (v.size === 1 ? ram[v.address + i] : ram[v.address + 2 * i] | (ram[v.address + 2 * i + 1] << 8));
  return {
    get(name, index = 0) { const v = BY_NAME.get(name); if (!v) throw new Error(`unknown variable ${name}`); return read(v, index); },
    all(name) { const v = BY_NAME.get(name); return Array.from({ length: v.count }, (_, i) => read(v, i)); },
    signed(name) { const x = this.get(name); return x > 0x7fff ? x - 0x10000 : x; },
  };
}

export const address = (name) => BY_NAME.get(name).address;
