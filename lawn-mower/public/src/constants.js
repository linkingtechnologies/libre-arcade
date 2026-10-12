// SPDX-License-Identifier: GPL-3.0-or-later
// Lawn Mower preservation kernel constants, traced from Shiru's v1.12 source.

export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 16;
export const PLAYFIELD_TOP = 3;
export const PLAYFIELD_HEIGHT = 11;
export const FUEL_MAX = 232;
export const FUEL_LOW = 58;
export const FLOWER_PENALTY = Math.floor(FUEL_MAX / 6); // 38
export const STONE_PENALTY = Math.floor(FUEL_MAX / 3);  // 77
export const INTRO_GATE_TICKS = 80;
export const INTRO_FILL_PER_TICK = 4;
export const START_SPEED = 20;
export const BOOST_THRESHOLD = 48;
export const FUEL_TIMER_BASES = Object.freeze([250,235,220,200,185,170,150,150,150,150]);

export const DIR = Object.freeze({ NONE:0, LEFT:1, RIGHT:2, UP:3, DOWN:4 });

export const TILE = Object.freeze({
  CUT_MIN: 0x0a,
  CUT_MAX: 0x0d,
  GRASS_MIN: 0x0e,
  GRASS_MAX: 0x11,
  FLOWERS: 0x12,
  FLOWERS_CUT: 0x13,
  STONE: 0x14,
  FUEL_A: 0x2e,
  FUEL_B: 0x2f,
});

export const RAW_TO_RUNTIME = Object.freeze([
  Object.freeze([0x0a,0x0b,0x0c,0x0d]),
  Object.freeze([0x0e,0x0f,0x10,0x11]),
  Object.freeze([0x12,0x12,0x12,0x12]),
  Object.freeze([0x14,0x14,0x14,0x14]),
]);

// The pad as the original reads it ($4016 shifted into a byte, A first): PAD_A is bit 0 and PAD_RIGHT bit 7.
export const PAD = Object.freeze({ A: 0x01, B: 0x02, SELECT: 0x04, START: 0x08, UP: 0x10, DOWN: 0x20, LEFT: 0x40, RIGHT: 0x80 });

// What the original's boot leaves behind when its title screen first shows (measured on the preserved ROM): FRAME_CNT counts every NMI,
// including those of the start-up, and FRAME_CNT2 (the 1-in-5 pacing counter) has not started.
export const BOOT_FRAME_COUNT = 5;

// NMIs the original spends with the display off between the end of the previous screen and the first frame of a level, by level
// (measured on the ROM: its set-up code takes 9.2 to 9.3 frames' worth of cycles for the three lawns that are 14 tiles wide, whose empty
// ground to the right it has most to clear, and 8.3 for the others, and it starts about two thirds into an NMI).
export const LEVEL_SETUP_FRAMES = Object.freeze([10, 10, 10, 9, 9, 9, 9, 9, 9, 9]);
export const GAME_CLEAR_SETUP_FRAMES = 1;
export const TITLE_SETUP_FRAMES = 2;

// Where the mower's 11 sprites and the fuel bar's 8 start in OAM_PAGE (in bytes).
export const OAM_PLAYER = 4;
export const OAM_FUEL_BAR = 56 * 4;
