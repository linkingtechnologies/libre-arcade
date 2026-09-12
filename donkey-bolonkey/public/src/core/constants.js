// Donkey Bolonkey Web Preservation
// Derived from Donkey Bolonkey (C) 2001 David A. Capello, GPL-2.0-or-later.
// This port is distributed under GPL-3.0-or-later.

export const FPS = 60;
export const LOGICAL_WIDTH = 320;
export const LOGICAL_HEIGHT = 240;
export const BLOCK_WIDTH = 18;
export const BLOCK_HEIGHT = 18;
export const LEVEL_WIDTH = 16;
export const LEVEL_HEIGHT = 9;
export const MAX_BUBBLES = 4;

export const FLAG = Object.freeze({ LEFT:1, UP:2, RIGHT:4, DOWN:8, HOME:16, EXIT:32, STOP:64, BUBBLE:128, TRAP:256 });
export const HAND = Object.freeze({ BAD:0, GOOD:1, FULL:2 });
export const COLOR = Object.freeze({ WHITE:0, RED:1, ORANGE:2, YELLOW:3, GREEN:4, LIGHTBLUE:5, BLUE:6, MAGENTA:7, MAX:8, JOKER:0 });
