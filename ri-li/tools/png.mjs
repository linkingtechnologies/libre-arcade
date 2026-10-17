// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// A PNG writer (8-bit RGBA) for the pictures the oracle compares and for the label pictures that tools/extract-languages.mjs writes: `encodePng(width, height, rgba)` returns the file's bytes.
// Each row takes the filter (none, sub, up, average or Paeth) whose output has the smallest sum of absolute values, which keeps the files of the labels small; the pixels are the same.
import { deflateSync } from 'node:zlib';

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

export function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  const candidate = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = (i) => rgba[y * stride + i], up = (i) => (y ? rgba[(y - 1) * stride + i] : 0);
    let best = 0, bestScore = Infinity;
    for (let f = 0; f < 5; f++) {
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= 4 ? row(i - 4) : 0, b = up(i), c = i >= 4 && y ? rgba[(y - 1) * stride + i - 4] : 0;
        const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c);
        const v = (row(i) - pred) & 255;
        candidate[i] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) { bestScore = score; best = f; candidate.copy(raw, y * (stride + 1) + 1); }
    }
    raw[y * (stride + 1)] = best;
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// original, page and the difference side by side below each other would be too tall: the page's picture, the original's, and a map of where they differ, in one row
export function sideBySide(original, page, tolerance = 2) {
  const w = 800, h = 600, out = new Uint8ClampedArray(w * 3 * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    for (let c = 0; c < 4; c++) { out[(y * w * 3 + x) * 4 + c] = original[i + c]; out[(y * w * 3 + w + x) * 4 + c] = page[i + c]; }
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(original[i + c] - page[i + c]));
    const o = (y * w * 3 + 2 * w + x) * 4;
    out[o] = d > tolerance ? 255 : original[i] >> 2; out[o + 1] = d > tolerance ? 0 : original[i + 1] >> 2; out[o + 2] = d > tolerance ? 0 : original[i + 2] >> 2; out[o + 3] = 255;
  }
  return encodePng(w * 3, h, out);
}
