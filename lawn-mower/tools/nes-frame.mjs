// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The picture the preserved ROM puts on the screen in one frame, composed from what the minimal NES (tools/nes-machine.mjs) kept of
// that frame when `machine.capture` was on: the nametables, the palettes and the sprite memory as they were when the picture started
// (the end of vblank), the pattern tables of the cartridge, and a log of every write to a PPU register during the picture, with the
// CPU cycle it happened at.
//
// It is a scanline compositor, not a PPU. Each of the 240 lines is drawn with the registers as the real PPU would have them at the
// start of the line:
//   * the horizontal scroll (coarse X and the horizontal nametable bit) comes from t as it was at dot 257 of the line before, the
//     vertical scroll from t at the end of vblank (a mid-frame write to PPUSCROLL or PPUCTRL does not move the picture vertically);
//   * the fine X scroll, the pattern table bits and the mask act from the start of the line;
//   * a write that falls inside a line changes the rest of that line on the real PPU, at a dot that depends on how the CPU and the PPU
//     are aligned. That is not modelled: the line is drawn with the registers it started with and reported in `split`, so that a
//     comparison can leave exactly those lines out.
// 8 by 8 sprites with flips and the priority bit, at most eight to a line, the left 8 pixels as the mask says.

import { deflateSync } from 'node:zlib';
import { NES_RGB } from '../public/src/nes-assets.js';
import { CYCLES_PER_SCANLINE } from './nes-machine.mjs';

export const WIDTH = 256;
export const HEIGHT = 240;
const RGB = NES_RGB.map((v) => [(v >> 16) & 255, (v >> 8) & 255, v & 255]);

export function composeFrame(machine) {
  const v = machine.visible;
  if (!v) throw new Error('the machine was not capturing: set machine.capture before running the frame');
  const chr = machine.chr, pal = v.palette;
  const rgba = new Uint8Array(WIDTH * HEIGHT * 4);
  const split = new Uint8Array(HEIGHT);
  const anomalies = [];
  const nametable = (address) => v.vram[machine.nametableIndex(address)];
  const put = (o, color) => { const c = RGB[color & 0x3F]; rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; rgba[o + 3] = 255; };

  // The log, as register states in time order. A line is "split" when something that changes how it is drawn is written during it.
  const log = v.log;
  const lineOf = (c) => Math.floor(c / CYCLES_PER_SCANLINE) - 1;
  for (const e of log) {
    if (e.register === 0 || e.register === 1 || e.register === 5 || e.register === 6) {
      const line = lineOf(e.c);
      if (line >= 0 && line < HEIGHT) split[line] = 1;
    } else if (e.register === 7 || e.register === 'dma' || e.register === 3 || e.register === 4) {
      anomalies.push({ line: lineOf(e.c), register: e.register, value: e.value });
    }
  }
  // t at dot 257 of line y-1 (and for line 0 at the end of the pre-render line's dot 257), ctrl/mask/fine X at the start of line y.
  const at = (cycle) => {
    let state = { t: v.t, x: v.x, ctrl: v.ctrl, mask: v.mask };
    for (const e of log) { if (e.c > cycle) break; state = e; }
    return state;
  };
  const verticalState = at(101);                       // dots 280 to 304 of the pre-render line copy the vertical bits of t into v
  const vt = verticalState.t;
  const scrollY0 = ((((vt >> 5) & 0x1F) << 3) | ((vt >> 12) & 7)) + ((vt & 0x800) ? 240 : 0);

  const bgIndex = new Uint8Array(WIDTH);
  for (let y = 0; y < HEIGHT; y++) {
    const lineStart = (y + 1) * CYCLES_PER_SCANLINE;
    const horizontal = at(y * CYCLES_PER_SCANLINE + 257 / 3);
    const now = at(lineStart - 0.001);
    const bgTable = (now.ctrl & 0x10) ? 0x1000 : 0, spriteTable = (now.ctrl & 0x08) ? 0x1000 : 0;
    if (now.ctrl & 0x20) throw new Error('8 by 16 sprites are not modelled');
    const bgOn = (now.mask & 0x08) !== 0, spritesOn = (now.mask & 0x10) !== 0;
    const scrollX = (((horizontal.t & 0x1F) << 3) | now.x) + ((horizontal.t & 0x400) ? 256 : 0);
    const sy = (scrollY0 + y) % 480;
    bgIndex.fill(0);
    for (let x = 0; x < WIDTH; x++) {
      const o = (y * WIDTH + x) * 4;
      if (!bgOn || (x < 8 && !(now.mask & 2))) { put(o, pal[0]); continue; }
      const sx = (scrollX + x) & 511;
      const table = 0x2000 + (sx >> 8) * 0x400 + (sy >= 240 ? 0x800 : 0);
      const wx = sx & 255, wy = sy >= 240 ? sy - 240 : sy;
      const tx = wx >> 3, ty = wy >> 3;
      const tile = nametable(table + ty * 32 + tx);
      const attribute = nametable(table + 0x3C0 + (ty >> 2) * 8 + (tx >> 2));
      const palette = (attribute >> (((ty & 2) ? 4 : 0) + ((tx & 2) ? 2 : 0))) & 3;
      const lo = chr[bgTable + tile * 16 + (wy & 7)], hi = chr[bgTable + tile * 16 + 8 + (wy & 7)];
      const p = ((lo >> (7 - (wx & 7))) & 1) | (((hi >> (7 - (wx & 7))) & 1) << 1);
      bgIndex[x] = p;
      put(o, p === 0 ? pal[0] : pal[palette * 4 + p]);
    }
    if (!spritesOn) continue;
    const taken = new Uint8Array(WIDTH);
    let count = 0;
    for (let i = 0; i < 64 && count < 8; i++) {
      const oy = v.oam[i * 4], tile = v.oam[i * 4 + 1], attr = v.oam[i * 4 + 2], ox = v.oam[i * 4 + 3];
      const row = y - (oy + 1);
      if (row < 0 || row > 7 || oy >= 0xEF) continue;
      count++;
      const fy = (attr & 0x80) ? 7 - row : row;
      const lo = chr[spriteTable + tile * 16 + fy], hi = chr[spriteTable + tile * 16 + 8 + fy];
      for (let c = 0; c < 8; c++) {
        const x = ox + c;
        if (x >= WIDTH || (x < 8 && !(now.mask & 4))) continue;
        const fx = (attr & 0x40) ? 7 - c : c;
        const p = ((lo >> (7 - fx)) & 1) | (((hi >> (7 - fx)) & 1) << 1);
        if (p === 0 || taken[x]) continue;
        taken[x] = 1;
        if ((attr & 0x20) && bgIndex[x] !== 0) continue;
        put((y * WIDTH + x) * 4, pal[0x10 + (attr & 3) * 4 + p]);
      }
    }
  }
  return { width: WIDTH, height: HEIGHT, rgba, split, anomalies };
}

// ---- a minimal PNG writer, for looking at frames and at differences ----
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'latin1'); Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
export function encodePng({ width, height, rgba }, scale = 1) {
  const w = width * scale, h = height * scale;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const s = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4, d = y * (w * 4 + 1) + 1 + x * 4;
      raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2]; raw[d + 3] = rgba[s + 3];
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(w, 0); header.writeUInt32BE(h, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
