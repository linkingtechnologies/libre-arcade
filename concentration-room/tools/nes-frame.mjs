// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The picture the preserved ROM puts on the screen, composed from what the minimal NES (tools/nes-machine.mjs) holds at one moment:
// the nametable, the attribute table, the palettes, the pattern tables of the cartridge's CHR-ROM, the scroll registers and the sprite
// memory. It is a still-frame compositor, not a PPU: it draws the frame that the state at that moment would show (background with
// scrolling, 8 by 8 sprites with flips and the priority bit, at most eight sprites per scanline, the colours of 8name.py's table) and
// nothing about timing inside a frame. `tools/render-oracle.mjs` compares it with the browser game's renderer.

import { deflateSync } from 'node:zlib';
import { NES_CLUT } from '../public/src/nes-visual.js';

export const WIDTH = 256;
export const HEIGHT = 240;
const RGB = NES_CLUT.map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);

export function renderFrame(machine) {
  const m = machine;
  const chr = m.chr, pal = m.palette;
  const bgTable = (m.ppuCtrl & 0x10) ? 0x1000 : 0;
  const spriteTable = (m.ppuCtrl & 0x08) ? 0x1000 : 0;
  if (m.ppuCtrl & 0x20) throw new Error('8 by 16 sprites are not modelled');
  const ntBase = 0x2000 + (m.ppuCtrl & 3) * 0x400;
  const bgOn = (m.ppuMask & 0x08) !== 0, spritesOn = (m.ppuMask & 0x10) !== 0;
  const rgba = new Uint8Array(WIDTH * HEIGHT * 4);
  const bgIndex = new Uint8Array(WIDTH * HEIGHT);
  const put = (x, y, color) => { const o = (y * WIDTH + x) * 4; const c = RGB[color & 0x3F]; rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; rgba[o + 3] = 255; };

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (!bgOn) { put(x, y, pal[0]); continue; }
      let wx = x + m.scrollX, wy = y + m.scrollY, nt = ntBase;
      if (wx >= 256) { nt ^= 0x400; wx -= 256; }
      if (wy >= 240) { nt ^= 0x800; wy -= 240; }
      const tx = wx >> 3, ty = wy >> 3;
      const tile = m.ppuRead(nt + ty * 32 + tx);
      const attribute = m.ppuRead(nt + 0x3C0 + (ty >> 2) * 8 + (tx >> 2));
      const palette = (attribute >> (((ty & 2) ? 4 : 0) + ((tx & 2) ? 2 : 0))) & 3;
      const fx = wx & 7, fy = wy & 7;
      const lo = chr[bgTable + tile * 16 + fy], hi = chr[bgTable + tile * 16 + 8 + fy];
      const v = ((lo >> (7 - fx)) & 1) | (((hi >> (7 - fx)) & 1) << 1);
      bgIndex[y * WIDTH + x] = v;
      put(x, y, v === 0 ? pal[0] : pal[palette * 4 + v]);
    }
  }

  if (spritesOn) {
    const taken = new Uint8Array(WIDTH * HEIGHT);
    const perLine = new Uint8Array(HEIGHT);
    for (let i = 0; i < 64; i++) {
      const oy = m.oam[i * 4], tile = m.oam[i * 4 + 1], attr = m.oam[i * 4 + 2], ox = m.oam[i * 4 + 3];
      if (oy >= 0xEF) continue;
      for (let r = 0; r < 8; r++) {
        const sy = oy + 1 + r;
        if (sy >= HEIGHT) break;
        if (perLine[sy] >= 8) continue;
        perLine[sy]++;
        const fy = (attr & 0x80) ? 7 - r : r;
        const lo = chr[spriteTable + tile * 16 + fy], hi = chr[spriteTable + tile * 16 + 8 + fy];
        for (let c = 0; c < 8; c++) {
          const sx = ox + c;
          if (sx >= WIDTH) break;
          const fx = (attr & 0x40) ? 7 - c : c;
          const v = ((lo >> (7 - fx)) & 1) | (((hi >> (7 - fx)) & 1) << 1);
          if (v === 0 || taken[sy * WIDTH + sx]) continue;
          taken[sy * WIDTH + sx] = 1;
          if ((attr & 0x20) && bgIndex[sy * WIDTH + sx] !== 0) continue;
          put(sx, sy, pal[0x10 + (attr & 3) * 4 + v]);
        }
      }
    }
  }
  return { width: WIDTH, height: HEIGHT, rgba };
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
