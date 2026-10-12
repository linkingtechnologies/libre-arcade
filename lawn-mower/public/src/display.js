// SPDX-License-Identifier: GPL-3.0-or-later
// The picture of one NMI: what the original's picture unit would draw from the memories the kernel keeps (`game.ppu`: nametables,
// palette, sprites), the pattern tables of the cartridge, and the way the game changes the scroll and the pattern tables down the
// screen (`game.regs`, captured by the kernel at the start of the NMI). The screen is split into bands of lines, each drawn with
// its own scroll and pattern tables, exactly where the original's code changes them:
//   * the playing screens split at line 33 (the sprite that waits for the "sprite 0 hit" sits there): above it the status bar, fixed;
//     below it the lawn at the camera's scroll;
//   * the message's wait and fade screens show, for a short band in the middle, the other half of the lawn's two screens (the one
//     that showMessage filled with blanks) every so often, which makes the message flicker; its lines were measured on the ROM;
//   * the title splits into five bands at lines 27, 94, 161 and 185.
// A line on which the original changes a register in the middle of the line (33, 27, 94, 161, 185, 116, 154 and 155) is drawn with
// the band it starts in; where exactly the change falls in such a line depends on the alignment of the CPU and the picture unit.

import { NES_RGB, SCREEN_W, SCREEN_H } from './nes-assets.js';

const RGB = NES_RGB.map((v) => [(v >> 16) & 255, (v >> 8) & 255, v & 255]);

export const FIELD_SPLIT = 33;                        // the last line of the status bar
export const MESSAGE_BAND = [118, 155];               // first and last line of the band that shows the other page
export const TITLE_SPLITS = [27, 94, 161, 185];       // the last line of each of the first four bands (not frozen: test/oracle-sensitivity.test.js moves them on purpose)

// The bands of a frame: [first line, last line, scroll X (0 to 511), background pattern table, sprite pattern table].
export function bandsFor(regs) {
  const camera = regs.camX ?? 0;
  const scrollX = (camera & 0xff) + (((camera >> 8) & 1) ? 256 : 0);
  const chr = regs.chrAnim ?? 0x80;
  const bg = (chr & 0x10) ? 0x1000 : 0, sprites = (chr & 0x08) ? 0x1000 : 0;
  switch (regs.kind) {
    case 'title': {
      const [s1, s2, s3, s4] = TITLE_SPLITS;
      const blink = ((regs.frameCount >> (regs.start ? 2 : 5)) & 1) ? 256 : 0;
      return [[0, s1, 0, 0, 0], [s1 + 1, s2, scrollX0(regs.x0), 0, 0], [s2 + 1, s3 - 1, scrollX0(regs.x1), 0, 0], [s3, s4, blink, 0, 0], [s4 + 1, SCREEN_H - 1, 0, 0, 0]];
    }
    case 'message': {
      const flash = ((regs.flash >> 4) & 1) ? 256 : 0;
      return [[0, FIELD_SPLIT, 0, 0, 0], [FIELD_SPLIT + 1, MESSAGE_BAND[0] - 1, scrollX, bg, sprites], [MESSAGE_BAND[0], MESSAGE_BAND[1], (scrollX & 0xff) + flash, 0, 0], [MESSAGE_BAND[1] + 1, SCREEN_H - 1, scrollX, bg, sprites]];
    }
    case 'done':
      return [[0, SCREEN_H - 1, 0, bg, sprites]];
    default:                                          // 'field'
      return [[0, FIELD_SPLIT, 0, 0, 0], [FIELD_SPLIT + 1, SCREEN_H - 1, scrollX, bg, sprites]];
  }
}
const scrollX0 = (word) => (word & 0xff) + ((word & 0x100) ? 256 : 0);

/** The picture as RGBA, 256 by 240. `chr` is the cartridge's 8 KiB of pattern tables. */
export function composeDisplay(game, chr) {
  const out = new Uint8ClampedArray(SCREEN_W * SCREEN_H * 4);
  const { vram, palette, oam } = game.ppu;
  const put = (o, colour) => { const c = RGB[colour & 0x3f]; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255; };
  const regs = game.regs ?? { kind: 'title', x0: game.titleX0, x1: game.titleX1, start: 0, frameCount: game.frameCount };
  if (game.mode === 'setup') {                       // the display is off: the backdrop colour
    for (let o = 0; o < out.length; o += 4) put(o, palette[0]);
    return out;
  }
  const spritesOn = regs.kind !== 'done';
  const bgIndex = new Uint8Array(SCREEN_W);
  const taken = new Uint8Array(SCREEN_W);
  for (const [from, to, scrollX, bgTable, spriteTable] of bandsFor(regs)) {
    for (let y = from; y <= to; y++) {
      const ty = y >> 3, fy = y & 7;
      for (let x = 0; x < SCREEN_W; x++) {
        const sx = (scrollX + x) & 511;
        const page = (sx >> 8) << 10;                // the second nametable follows the first
        const tx = (sx & 255) >> 3;
        const tile = vram[page + ty * 32 + tx];
        const attribute = vram[page + 0x3c0 + (ty >> 2) * 8 + (tx >> 2)];
        const group = (attribute >> (((ty & 2) ? 4 : 0) + ((tx & 2) ? 2 : 0))) & 3;
        const lo = chr[bgTable + tile * 16 + fy], hi = chr[bgTable + tile * 16 + 8 + fy];
        const bit = 7 - (sx & 7);
        const v = ((lo >> bit) & 1) | (((hi >> bit) & 1) << 1);
        bgIndex[x] = v;
        put((y * SCREEN_W + x) * 4, v === 0 ? palette[0] : palette[group * 4 + v]);
      }
      if (!spritesOn) continue;
      taken.fill(0);
      let count = 0;
      for (let i = 0; i < 64 && count < 8; i++) {
        const sy = oam[i * 4], tile = oam[i * 4 + 1], attr = oam[i * 4 + 2], sxo = oam[i * 4 + 3];
        const row = y - (sy + 1);
        if (row < 0 || row > 7 || sy >= 0xef) continue;
        count++;
        const r = (attr & 0x80) ? 7 - row : row;
        const lo = chr[spriteTable + tile * 16 + r], hi = chr[spriteTable + tile * 16 + 8 + r];
        for (let c = 0; c < 8; c++) {
          const x = sxo + c;
          if (x >= SCREEN_W) break;
          const bit = (attr & 0x40) ? c : 7 - c;
          const v = ((lo >> bit) & 1) | (((hi >> bit) & 1) << 1);
          if (v === 0 || taken[x]) continue;
          taken[x] = 1;
          if ((attr & 0x20) && bgIndex[x] !== 0) continue;
          put((y * SCREEN_W + x) * 4, palette[0x10 + (attr & 3) * 4 + v]);
        }
      }
    }
  }
  return out;
}
