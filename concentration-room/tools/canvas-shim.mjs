// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Just enough of the browser's canvas, image and document for the game's own renderers (public/src/renderer.js and friends) to
// draw in Node, into a pixel buffer, so that `tools/render-oracle.mjs` can compare what they draw with the picture of the ROM.
// It supports what those renderers use and nothing else: fillRect and clearRect with a fill colour, drawImage at integer positions
// under translate and a flip (scale of -1), the image data calls, save and restore, and 2-bit, 8-bit indexed or truecolour PNGs.
// It is not a general canvas: pixel-exact only for the whole-number, unscaled drawing that the game does into its 256 by 240 canvas.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function decodePng(buffer) {
  let pos = 8, width = 0, height = 0, depth = 8, type = 0, palette = null, trns = null;
  const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos), kind = buffer.toString('latin1', pos + 4, pos + 8), data = buffer.subarray(pos + 8, pos + 8 + length);
    if (kind === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; type = data[9]; if (data[12] !== 0) throw new Error('interlaced PNG'); }
    else if (kind === 'PLTE') palette = data;
    else if (kind === 'tRNS') trns = data;
    else if (kind === 'IDAT') idat.push(data);
    pos += 12 + length;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const rowBytes = Math.ceil(width * channels * depth / 8), bpp = Math.max(1, channels * depth / 8);
  const raw = inflateSync(Buffer.concat(idat));
  const rows = [];
  let prev = Buffer.alloc(rowBytes);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (rowBytes + 1)], line = Buffer.from(raw.subarray(y * (rowBytes + 1) + 1, (y + 1) * (rowBytes + 1)));
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let add = 0;
      if (filter === 1) add = a; else if (filter === 2) add = b; else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[i] = (line[i] + add) & 0xFF;
    }
    rows.push(line); prev = line;
  }
  const data = new Uint8ClampedArray(width * height * 4);
  const sample = (line, index) => {
    if (depth === 8) return line[index];
    const perByte = 8 / depth, byte = line[Math.floor(index / perByte)], shift = 8 - depth * (1 + (index % perByte));
    return (byte >> shift) & ((1 << depth) - 1);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4, line = rows[y];
      if (type === 3) { const i = sample(line, x); data[o] = palette[i * 3]; data[o + 1] = palette[i * 3 + 1]; data[o + 2] = palette[i * 3 + 2]; data[o + 3] = trns && i < trns.length ? trns[i] : 255; }
      else if (type === 0) { const v = depth === 8 ? line[x] : sample(line, x) * 255 / ((1 << depth) - 1); data[o] = data[o + 1] = data[o + 2] = v; data[o + 3] = 255; }
      else if (type === 2) { data[o] = line[x * 3]; data[o + 1] = line[x * 3 + 1]; data[o + 2] = line[x * 3 + 2]; data[o + 3] = 255; }
      else if (type === 6) { data[o] = line[x * 4]; data[o + 1] = line[x * 4 + 1]; data[o + 2] = line[x * 4 + 2]; data[o + 3] = line[x * 4 + 3]; }
      else throw new Error(`PNG colour type ${type} is not supported`);
    }
  }
  return { width, height, data };
}

const parseColor = (style) => {
  const short = /^#([0-9a-f]{3})$/i.exec(style);
  const m = short ? [null, short[1].split('').map((c) => c + c).join('')] : /^#([0-9a-f]{6})$/i.exec(style);
  if (!m) throw new Error(`fill colour ${style}`);
  const n = parseInt(m[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255, 255];
};

class SoftContext {
  constructor(canvas) { this.canvas = canvas; this.stack = []; this.tx = 0; this.ty = 0; this.sx = 1; this.sy = 1; this.fillStyle = '#000000'; this.imageSmoothingEnabled = true; }
  save() { this.stack.push([this.tx, this.ty, this.sx, this.sy]); }
  restore() { [this.tx, this.ty, this.sx, this.sy] = this.stack.pop(); }
  translate(x, y) { this.tx += this.sx * x; this.ty += this.sy * y; }
  scale(x, y) { this.sx *= x; this.sy *= y; }
  #fill(x, y, w, h, color) {
    if (this.sx !== 1 || this.sy !== 1) throw new Error('fillRect under a scale is not supported');
    const c = this.canvas;
    for (let j = Math.max(0, this.ty + y); j < Math.min(c.height, this.ty + y + h); j++) {
      for (let i = Math.max(0, this.tx + x); i < Math.min(c.width, this.tx + x + w); i++) { const o = (j * c.width + i) * 4; c.data[o] = color[0]; c.data[o + 1] = color[1]; c.data[o + 2] = color[2]; c.data[o + 3] = color[3]; }
    }
  }
  fillRect(x, y, w, h) { this.#fill(x, y, w, h, parseColor(this.fillStyle)); }
  clearRect(x, y, w, h) { this.#fill(x, y, w, h, [0, 0, 0, 0]); }
  // drawImage(image, x, y) or drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) with dw = sw and dh = sh (no scaling)
  drawImage(image, ...a) {
    let sx0 = 0, sy0 = 0, sw = image.width, sh = image.height, x = a[0], y = a[1];
    if (a.length === 8) { [sx0, sy0, sw, sh, x, y] = a; if (a[6] !== sw || a[7] !== sh) throw new Error('drawImage with scaling is not supported'); }
    const c = this.canvas;
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const s = ((sy0 + j) * image.width + sx0 + i) * 4;
        if (image.data[s + 3] === 0) continue;
        const dx = this.sx < 0 ? this.tx - (x + i) - 1 : this.tx + x + i, dy = this.sy < 0 ? this.ty - (y + j) - 1 : this.ty + y + j;
        if (dx < 0 || dy < 0 || dx >= c.width || dy >= c.height) continue;
        const d = (dy * c.width + dx) * 4;
        c.data[d] = image.data[s]; c.data[d + 1] = image.data[s + 1]; c.data[d + 2] = image.data[s + 2]; c.data[d + 3] = image.data[s + 3];
      }
    }
  }
  getImageData(x, y, w, h) { const data = new Uint8ClampedArray(w * h * 4); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const s = ((y + j) * this.canvas.width + x + i) * 4, d = (j * w + i) * 4; for (let k = 0; k < 4; k++) data[d + k] = this.canvas.data[s + k]; } return { width: w, height: h, data }; }
  createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
  putImageData(image, x, y) { for (let j = 0; j < image.height; j++) for (let i = 0; i < image.width; i++) { const s = (j * image.width + i) * 4, d = ((y + j) * this.canvas.width + x + i) * 4; for (let k = 0; k < 4; k++) this.canvas.data[d + k] = image.data[s + k]; } }
}

export class SoftCanvas {
  #w = 300; #h = 150;
  constructor() { this.data = new Uint8ClampedArray(this.#w * this.#h * 4); this.context = null; }
  get width() { return this.#w; }
  get height() { return this.#h; }
  set width(value) { this.#w = value; this.data = new Uint8ClampedArray(this.#w * this.#h * 4); }
  set height(value) { this.#h = value; this.data = new Uint8ClampedArray(this.#w * this.#h * 4); }
  getContext() { return (this.context ??= new SoftContext(this)); }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.#w, height: this.#h }; }
}

export class SoftImage {
  #onload = null;
  constructor() { this.width = 0; this.height = 0; this.data = null; this.complete = false; }
  get onload() { return this.#onload; }
  set onload(fn) { this.#onload = fn; if (this.complete && fn) fn.call(this); }   // the file is read at once, so a handler set after src is called now
  set src(path) {
    const file = resolve(PUBLIC, path.replace(/^\.\//, ''));
    const png = decodePng(readFileSync(file));
    this.width = png.width; this.height = png.height; this.data = png.data; this.complete = true;
    if (this.#onload) this.#onload.call(this);
  }
}

// What the renderers look for in the global scope.
export function installBrowserShims() {
  globalThis.document = { createElement: () => new SoftCanvas() };
  globalThis.Image = SoftImage;
}
