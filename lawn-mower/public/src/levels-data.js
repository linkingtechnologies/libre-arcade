// SPDX-License-Identifier: GPL-3.0-or-later
// The ten levels as the cartridge holds them (the 95-byte records at $1000 of the character memory, reference/source-v1.12/patterns.chr),
// written out as maps ('.' cut grass, 'S' the start, 'G' grass, 'F' flowers, 'R' a stone) with the numbers of each record.
// Not to be edited by hand: test/rom-data.test.js decodes the records from the ROM and compares every cell.

export const LEVELS = Object.freeze([
  {
    "level": 1,
    "width": 14,
    "height": 11,
    "start_editor": {
      "x": 6,
      "y": 5
    },
    "start_game": {
      "x": 7,
      "y": 8
    },
    "counts": {
      "cut": 58,
      "grass": 96,
      "flowers": 0,
      "stone": 0
    },
    "grass_required": 96,
    "done_inc_raw_8_8": 266,
    "done_inc_percent": 1.0390625,
    "final_accumulator_raw": 25536,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 250,
    "ascii": [
      "..............",
      ".GGGGGGGGGGGG.",
      ".GGGGGGGGGGGG.",
      ".GGGGGGGGGGGG.",
      ".GGGG....GGGG.",
      ".GGGG.S..GGGG.",
      ".GGGG....GGGG.",
      ".GGGGGGGGGGGG.",
      ".GGGGGGGGGGGG.",
      ".GGGGGGGGGGGG.",
      ".............."
    ]
  },
  {
    "level": 2,
    "width": 14,
    "height": 11,
    "start_editor": {
      "x": 6,
      "y": 5
    },
    "start_game": {
      "x": 7,
      "y": 8
    },
    "counts": {
      "cut": 12,
      "grass": 116,
      "flowers": 26,
      "stone": 0
    },
    "grass_required": 116,
    "done_inc_raw_8_8": 220,
    "done_inc_percent": 0.859375,
    "final_accumulator_raw": 25520,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 235,
    "ascii": [
      "GGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGG",
      "GGFFFFFFGFFFGG",
      "GGFGGGGGGGGFGG",
      "GGFGG....GGFGG",
      "GGGGG.S..GGGGG",
      "GGFGG....GGFGG",
      "GGFGGGGGGGGFGG",
      "GGFFFGFFFFFFGG",
      "GGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 3,
    "width": 14,
    "height": 11,
    "start_editor": {
      "x": 6,
      "y": 5
    },
    "start_game": {
      "x": 7,
      "y": 8
    },
    "counts": {
      "cut": 12,
      "grass": 122,
      "flowers": 12,
      "stone": 8
    },
    "grass_required": 122,
    "done_inc_raw_8_8": 209,
    "done_inc_percent": 0.81640625,
    "final_accumulator_raw": 25498,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 220,
    "ascii": [
      "GGGGGGGGGGGGGG",
      "GFFFGRGGRGFFFG",
      "GGGGGGGGGGGGGG",
      "GGRGGGGGGGGRGG",
      "GGGGG....GGGGG",
      "GGGGG.S..GGGGG",
      "GGGGG....GGGGG",
      "GGRGGGGGGGGRGG",
      "GGGGGGGGGGGGGG",
      "GFFFGRGGRGFFFG",
      "GGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 4,
    "width": 20,
    "height": 11,
    "start_editor": {
      "x": 5,
      "y": 5
    },
    "start_game": {
      "x": 6,
      "y": 8
    },
    "counts": {
      "cut": 9,
      "grass": 183,
      "flowers": 28,
      "stone": 0
    },
    "grass_required": 183,
    "done_inc_raw_8_8": 139,
    "done_inc_percent": 0.54296875,
    "final_accumulator_raw": 25437,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 200,
    "ascii": [
      "GGGGGGGGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGGGGGGGG",
      "GGFFFGGGGGGGGGGFFFGG",
      "GGFGGGGGFFFFGGGGGFGG",
      "GGFG...GGGGGGGGGGFGG",
      "GGGG.S.GGGGGGGGGGGGG",
      "GGFG...GGGGGGGGGGFGG",
      "GGFGGGGGFFFFGGGGGFGG",
      "GGFFFGGGGGGGGGGFFFGG",
      "GGGGGGGGGGGGGGGGGGGG",
      "GGGGGGGGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 5,
    "width": 20,
    "height": 11,
    "start_editor": {
      "x": 2,
      "y": 5
    },
    "start_game": {
      "x": 3,
      "y": 8
    },
    "counts": {
      "cut": 9,
      "grass": 173,
      "flowers": 26,
      "stone": 12
    },
    "grass_required": 173,
    "done_inc_raw_8_8": 147,
    "done_inc_percent": 0.57421875,
    "final_accumulator_raw": 25431,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 185,
    "ascii": [
      "GGGGGGGGGGGGGGGGGGGG",
      "GFFGGGRGGGGGGRGGGFFG",
      "GFFGGGRGGGGGGRGGGFFG",
      "GGGGGGRGGFFGGRGGGGGG",
      "G...GGGGGFFGGGGGGGGG",
      "G.S.GGGGGFFGGGGGGGGG",
      "G...GGGGGFFGGGGGGGGG",
      "GGGGGGRGGFFGGRGGGGGG",
      "GFFGGGRGGGGGGRGGGFFG",
      "GFFGGGRGGGGGGRGGGFFG",
      "GGGGGGGGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 6,
    "width": 25,
    "height": 11,
    "start_editor": {
      "x": 12,
      "y": 5
    },
    "start_game": {
      "x": 13,
      "y": 8
    },
    "counts": {
      "cut": 9,
      "grass": 247,
      "flowers": 0,
      "stone": 19
    },
    "grass_required": 247,
    "done_inc_raw_8_8": 103,
    "done_inc_percent": 0.40234375,
    "final_accumulator_raw": 25441,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 170,
    "ascii": [
      "GGGGGGGGGGGGGGGGGGGGGGGGG",
      "GGGGRGGGGGGGGGRGGGGGGGRGG",
      "GRGGGGGGRGGGGGGGGRGGGGGGG",
      "GGGGGGRGGGGGGGGGGGGGRGGGG",
      "GGGGGGGGGGG...GGGGGGGGGRG",
      "GGRGGGGGGGG.S.GGGGRGGGGGG",
      "GGGGGRGGGGG...GGGGGGGGGGG",
      "GGGGGGGGRGGGGGGGGGGGRGGGG",
      "GRGGGGGGGGGGGGGGRGGGGGGGG",
      "GGGGRGGGGGGRGGGGGGGGGGRGG",
      "GGGGGGGGGGGGGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 7,
    "width": 25,
    "height": 11,
    "start_editor": {
      "x": 2,
      "y": 5
    },
    "start_game": {
      "x": 3,
      "y": 8
    },
    "counts": {
      "cut": 9,
      "grass": 190,
      "flowers": 76,
      "stone": 0
    },
    "grass_required": 190,
    "done_inc_raw_8_8": 134,
    "done_inc_percent": 0.5234375,
    "final_accumulator_raw": 25460,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 150,
    "ascii": [
      "GGGGGGGGGGGGGGGGGGGGGGGGG",
      "GFFFFFGFFFFFGFGGGFGFFFFFG",
      "GFGGGFGFGGGFGFGGGFGFGGGFG",
      "GGGGGFGFGGGFGFGGGFGFGGGGG",
      "G...GGGFGGGFGFFFFFGGGGGGG",
      "G.S.GGGGGGGGGGGGGGGGGGGGG",
      "G...GGGFFFFFGFGGGFGGGGGGG",
      "GGGGGFGFGGGFGFGGGFGFGGGGG",
      "GFGGGFGFGGGFGFGGGFGFGGGFG",
      "GFFFFFGFGGGFGFFFFFGFFFFFG",
      "GGGGGGGGGGGGGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 8,
    "width": 25,
    "height": 11,
    "start_editor": {
      "x": 2,
      "y": 5
    },
    "start_game": {
      "x": 3,
      "y": 8
    },
    "counts": {
      "cut": 9,
      "grass": 221,
      "flowers": 24,
      "stone": 21
    },
    "grass_required": 221,
    "done_inc_raw_8_8": 115,
    "done_inc_percent": 0.44921875,
    "final_accumulator_raw": 25415,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 150,
    "ascii": [
      "GGGGGGRGGGGGGGGGGGRGGGGGG",
      "GGGGGGRGFFFGGGFFFGRGGGGGG",
      "GGGGGGRGFFFGGGFFFGRGGGGGG",
      "GGGGGGRGGGGGRGGGGGRGGGGGG",
      "G...GGGGGGGGRGGGGGGGGGGGG",
      "G.S.GGGGGGGGRGGGGGGGGGGGG",
      "G...GGGGGGGGRGGGGGGGGGGGG",
      "GGGGGGRGGGGGRGGGGGRGGGGGG",
      "GGGGGGRGFFFGGGFFFGRGGGGGG",
      "GGGGGGRGFFFGGGFFFGRGGGGGG",
      "GGGGGGRGGGGGGGGGGGRGGGGGG"
    ]
  },
  {
    "level": 9,
    "width": 30,
    "height": 11,
    "start_editor": {
      "x": 14,
      "y": 5
    },
    "start_game": {
      "x": 15,
      "y": 8
    },
    "counts": {
      "cut": 12,
      "grass": 247,
      "flowers": 60,
      "stone": 11
    },
    "grass_required": 247,
    "done_inc_raw_8_8": 103,
    "done_inc_percent": 0.40234375,
    "final_accumulator_raw": 25441,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 150,
    "ascii": [
      "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      "GFGGFGGFGGFFFGGGGFFFGGFGGFGGFG",
      "GFGGFGGFGGGGGGGGGGGGGGFGGFGGFG",
      "GFGGFGGFGGFFFGGGGFFFGGFGGFGGFG",
      "GGGGGGGGGGGGG....GGGGGGGGGGGGG",
      "GRRGRRGRGGGGG.S..GGGGGRRRRRGRG",
      "GGGGGGGGGGGGG....GGGGGGGGGGGGG",
      "GFGGFGGFGGFFFGGGGFFFGGFGGFGGFG",
      "GFGGFGGFGGGGGGGGGGGGGGFGGFGGFG",
      "GFGGFGGFGGFFFGGGGFFFGGFGGFGGFG",
      "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
    ]
  },
  {
    "level": 10,
    "width": 30,
    "height": 11,
    "start_editor": {
      "x": 14,
      "y": 5
    },
    "start_game": {
      "x": 15,
      "y": 8
    },
    "counts": {
      "cut": 12,
      "grass": 248,
      "flowers": 42,
      "stone": 28
    },
    "grass_required": 248,
    "done_inc_raw_8_8": 103,
    "done_inc_percent": 0.40234375,
    "final_accumulator_raw": 25544,
    "final_display_before_clear": 99,
    "fuel_timer_base_ticks": 150,
    "ascii": [
      "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      "GGRGRGGGGGFFFGGGGFFFGGGGGRGRGG",
      "GGGGGGGGRGFFFGGGGFFFGRGGGGGGGG",
      "GGRGGGGGRGGGGGGGGGGGGRGGGGGRGG",
      "GGGGFFFGRGGGG....GGGGRGFFFGGGG",
      "GGGGFRFGRGGGG.S..GGGGRGFRFGGGG",
      "GGGGFFFGRGGGG....GGGGRGFFFGGGG",
      "GGRGGGGGRGGGGGGGGGGGGRGGGGGRGG",
      "GGGGGGGGRGGFFFFFFFFGGRGGGGGGGG",
      "GGRGRGGGGGGGFFFFFFGGGGGGGRGRGG",
      "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
    ]
  }
]);
