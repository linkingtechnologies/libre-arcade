// SPDX-License-Identifier: GPL-3.0-or-later
// What the original keeps in the NES picture unit and how it writes to it: the two nametables (a lawn 32 large tiles wide fills both),
// the palette memory with the fade the game puts it through, and the sprite memory the DMA fills. The routines here are transcriptions
// of Shiru's updateTile, putNum1/2/3, drawField, unrle, palReset, palSetup*, palSetFade* and palUpdate; they do exactly what the
// original's PPU writes do and nothing about drawing (see display.js for that).

import { TILES_TABLE, GAME_STAT_NAMETABLE } from './nes-assets.js';
import { decodeShiruRle } from './rle.js';

export const PAL_FADE_NONE = 0, PAL_FADE_IN = 1, PAL_FADE_OUT = 2;
const ATTRIBUTE_MASKS = [0x03, 0x0c, 0x30, 0xc0];

// palBrightTable: 4 blocks of 64 colours, one per brightness (0, 64, 128, 192 = full, one, two and three steps down). A colour keeps its
// hue and loses 16 per step (0x30 -> 0x20 -> 0x10 -> 0x00 -> black); the forbidden $0d of the two darkest rows is replaced by $0f.
export const PAL_BRIGHT_TABLE = (() => {
  const table = new Uint8Array(256);
  for (let step = 0; step < 4; step++) {
    for (let colour = 0; colour < 64; colour++) {
      const level = (colour >> 4) - step;
      let low = colour & 15;
      if (level < 0) { table[step * 64 + colour] = 0x0f; continue; }
      if (level <= 1 && low === 0x0d) low = 0x0f;
      table[step * 64 + colour] = (level << 4) | low;
    }
  }
  return table;
})();

export class Ppu {
  constructor() {
    this.vram = new Uint8Array(2048);        // NT0 at 0, NT1 at 1024 (vertical mirroring: $2000 and $2800 are one, $2400 and $2c00 are one)
    this.palette = new Uint8Array(32);       // the palette memory ($3F00)
    this.oam = new Uint8Array(256);          // the sprite memory, as the last OAM DMA left it
    this.palData = new Uint8Array(32);       // PAL_DATA: the palette the game wants, before the fade
    this.palMode = PAL_FADE_NONE;            // PAL_MODE
    this.palBright = 192;                    // PAL_BRIGHT
  }

  index(address) { return ((address >> 10) & 1) << 10 | (address & 0x3ff); }
  write(address, value) { this.vram[this.index(address)] = value & 0xff; }
  read(address) { return this.vram[this.index(address)]; }

  writePalette(index, value) {
    index &= 0x1f;
    if ((index & 0x13) === 0x10) index &= ~0x10;
    this.palette[index] = value & 0x3f;
  }

  /** updateTile: a large tile (16 by 16) of the map into the four small tiles of the nametable and its quarter of an attribute byte. */
  updateTile(map, x, y) {
    const entry = TILES_TABLE[map[y * 32 + x]];
    const base = 0x2000 | (((x >> 2) & 4) << 8);                 // $2000 for the first 16 columns, $2400 for the rest
    const address = base + y * 64 + (x & 15) * 2;
    this.write(address, entry[0]); this.write(address + 1, entry[1]);
    this.write(address + 32, entry[2]); this.write(address + 33, entry[3]);
    const attribute = (base | 0x3c0) + ((y & 0x0e) << 2) + ((x >> 1) & 7);
    const mask = ATTRIBUTE_MASKS[(x & 1) | ((y << 1) & 2)];
    this.write(attribute, (this.read(attribute) & ~mask) | (entry[4] & mask));
  }

  /** drawField: every large tile of the map, rows 0 to 14. */
  drawField(map) {
    for (let y = 0; y < 15; y++) for (let x = 0; x < 32; x++) this.updateTile(map, x, y);
  }

  /** The status bar's two rows of tiles ($2040). */
  drawStatusBar() {
    GAME_STAT_NAMETABLE.forEach((tile, i) => this.write(0x2040 + i, tile));
  }

  /** putNum1/2/3: `digits` numbers of two rows of tiles ($d0+digit over $e0+digit) from nametable address `address`. */
  putNumber(address, value, digits) {
    const places = digits === 3 ? [Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10] : [Math.floor(value / 10) % 10, value % 10];
    places.forEach((digit, i) => { this.write(address + i, 0xd0 + digit); this.write(address + 32 + i, 0xe0 + digit); });
  }

  /** unrle into the nametable from $2000 on; returns the address after the last byte. */
  unrle(bytes, address = 0x2000) {
    const data = decodeShiruRle(bytes);
    data.forEach((b, i) => this.write(address + i, b));
    return address + data.length;
  }

  clearNametables() { this.vram.fill(0); }

  // ---- the palette unit (palette.asm) ----

  palReset() {
    this.palette.fill(0x0f);
    this.palData.fill(0x0f);
    this.palMode = PAL_FADE_NONE;
    this.palBright = 192;
  }

  palSetup(offset, bytes) { bytes.forEach((b, i) => { this.palData[offset + i] = b; }); }
  palSetFadeIn() { this.palMode = PAL_FADE_IN; }
  palSetFadeOut() { this.palMode = PAL_FADE_OUT; }
  palSetFadeHalf() { this.palMode = PAL_FADE_NONE; this.palBright = 64; }

  /** palUpdate: one half of the palette goes through the brightness table into the PPU, the background colours on even frames and the
   *  sprite colours on odd ones (so a fade shows one frame apart in the two); every fourth frame the brightness takes a step. */
  palUpdate(frameCount) {
    const bright = (c) => PAL_BRIGHT_TABLE[this.palBright + (c & 0x3f)];
    if ((frameCount & 1) === 0) {
      for (const i of [0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15]) this.writePalette(i, bright(this.palData[i]));
      this.writePalette(0x11, bright(this.palData[1]));           // sprite 0's colour always follows the background's
    } else {
      for (const i of [0x12, 0x13, 0x15, 0x16, 0x17, 0x19, 0x1a, 0x1b, 0x1d, 0x1e, 0x1f]) this.writePalette(i, bright(this.palData[i]));
    }
    if ((frameCount & 3) !== 0) return;
    if (this.palMode === PAL_FADE_OUT) { if (this.palBright !== 192) this.palBright += 64; }
    else if (this.palMode === PAL_FADE_IN) { if (this.palBright !== 0) this.palBright -= 64; }
  }
}
