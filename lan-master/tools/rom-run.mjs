// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the preserved Lan Master ROM on tools/nes-machine.mjs, one frame (one NMI) at a time, with the pad the caller says, and reads the game's
// variables out of RAM (tools/ram-map.mjs).
//
// What a frame is here. The game is written for 50 frames a second and finds out for itself which console it is on (GAME_NTSC).
//   * On the PAL console (`region: 'pal'`) every NMI is one tick of the game's clock, and so one tick of the page's 50 a second clock.
//   * On the NTSC one the NMI comes 60 times a second and the game throws every fifth frame's work away: `ntscIsSkip` counts frames in
//     FRAME_CNT2 (1, 2, 3, 4, and 0 for the skipped one). The game's clock is then the frames in which that counter moved to something
//     that is not 0 (`logic` below), 48 a second. Music is updated in every frame, skipped or not.
// The music's output buffer is read from RAM at the end of each frame.

import { createHash } from 'node:crypto';
import { NesMachine } from './nes-machine.mjs';
import { RAM_MAP, ROM_SHA256, reader } from './ram-map.mjs';

// The game's PAD_* constants have A at bit 0; the machine shifts the byte out from its top bit, A first.
export const PAD = Object.freeze({ A: 1, B: 2, SELECT: 4, START: 8, UP: 16, DOWN: 32, LEFT: 64, RIGHT: 128 });
export const machinePad = (buttons) => { let r = 0; for (let i = 0; i < 8; i++) if (buttons & (1 << i)) r |= 1 << (7 - i); return r; };

export function checkRom(rom) {
  const hash = createHash('sha256').update(rom).digest('hex');
  if (hash !== ROM_SHA256) throw new Error(`this is not Lan Master v1.09: SHA-256 ${hash}, expected ${ROM_SHA256}`);
}

export class RomGame {
  constructor(rom, { capture = false, region = 'ntsc', check = true } = {}) {
    if (check) checkRom(rom);
    this.region = region;
    this.m = new NesMachine(rom, { region });
    this.m.capture = capture;
    this.read = reader(this.m.ram);
    this.frames = 0;                    // NMIs run
    this.logicFrames = 0;               // of those, the frames that count for the game's own clock
    this.lastCnt2 = 0;
    this.logic = false;                 // was the last frame one of those
    this.writes = [];                   // hooks: (address, value) => void
    this.m.writeHook = (a, v) => { for (const fn of this.writes) fn(a, v); };
  }

  // Runs one frame with `buttons` (a bit mask of PAD.*) held.
  frame(buttons = 0) {
    this.m.pad[0] = machinePad(buttons);
    this.m.frame();
    this.frames++;
    const cnt2 = this.m.ram[0xfe];
    this.logic = this.region === 'pal' ? true : cnt2 !== this.lastCnt2 && cnt2 !== 0;
    if (this.logic) this.logicFrames++;
    this.lastCnt2 = cnt2;
    return this.logic;
  }

  get ram() { return this.m.ram; }
}

export { RAM_MAP };
