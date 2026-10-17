// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Just enough of the browser's canvas and image for the page's own renderer (public/src/renderer.mjs) to draw in Node, into a pixel buffer, so that
// tools/js-run.mjs can compare what it draws with the picture of the original. It supports what the renderer uses and nothing else: fillRect with a
// colour ("#rgb", "#rrggbb", "rgb(...)" or "rgba(...)"), drawImage at integer positions (no scaling), save and restore, and the text calls (which are
// recorded in `context.texts` and not drawn: the original has no text of this kind). Images are composited over an opaque canvas with the usual
// source-over rule, in 8-bit arithmetic: a browser rounds slightly differently, so a comparison with the original allows a small difference per channel.
// PNGs of any bit depth and colour type that the page's files use are decoded (the files are not interlaced).

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

export const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

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
      else if (type === 4) { data[o] = data[o + 1] = data[o + 2] = line[x * 2]; data[o + 3] = line[x * 2 + 1]; }
      else if (type === 6) { data[o] = line[x * 4]; data[o + 1] = line[x * 4 + 1]; data[o + 2] = line[x * 4 + 2]; data[o + 3] = line[x * 4 + 3]; }
      else throw new Error(`PNG colour type ${type} is not supported`);
    }
  }
  return { width, height, data };
}

function parseColor(style) {
  let m = /^#([0-9a-f]{3})$/i.exec(style);
  if (m) { const n = parseInt(m[1].split('').map((c) => c + c).join(''), 16); return [n >> 16, (n >> 8) & 255, n & 255, 255]; }
  m = /^#([0-9a-f]{6})$/i.exec(style);
  if (m) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, 255]; }
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(style);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), Math.round((m[4] === undefined ? 1 : Number(m[4])) * 255)];
  throw new Error(`fill colour ${style}`);
}

// source over an opaque pixel
const over = (s, d, a) => ((s * a + d * (255 - a) + 127) / 255) | 0;

class SoftContext {
  constructor(canvas) {
    this.canvas = canvas; this.stack = []; this.texts = [];
    this.fillStyle = '#000000'; this.imageSmoothingEnabled = true; this.textAlign = 'start'; this.textBaseline = 'alphabetic'; this.font = '10px sans-serif'; this.globalAlpha = 1;
  }
  save() { this.stack.push([this.fillStyle, this.textAlign, this.textBaseline, this.font, this.globalAlpha]); }
  restore() { [this.fillStyle, this.textAlign, this.textBaseline, this.font, this.globalAlpha] = this.stack.pop(); }
  fillRect(x, y, w, h) {
    const c = this.canvas, [r, g, b, a0] = parseColor(this.fillStyle), a = Math.round(a0 * this.globalAlpha);
    for (let j = Math.max(0, Math.trunc(y)); j < Math.min(c.height, Math.trunc(y + h)); j++) {
      for (let i = Math.max(0, Math.trunc(x)); i < Math.min(c.width, Math.trunc(x + w)); i++) {
        const o = (j * c.width + i) * 4;
        c.data[o] = over(r, c.data[o], a); c.data[o + 1] = over(g, c.data[o + 1], a); c.data[o + 2] = over(b, c.data[o + 2], a); c.data[o + 3] = 255;
      }
    }
  }
  fillText(text, x, y) { this.texts.push({ text: String(text), x, y, font: this.font }); }
  drawImage(image, x, y) {
    if (arguments.length !== 3) throw new Error('drawImage with scaling or a source rectangle is not supported');
    const c = this.canvas;
    for (let j = 0; j < image.height; j++) {
      const dy = y + j;
      if (dy < 0 || dy >= c.height) continue;
      for (let i = 0; i < image.width; i++) {
        const dx = x + i;
        if (dx < 0 || dx >= c.width) continue;
        const s = (j * image.width + i) * 4, d = (dy * c.width + dx) * 4, a = Math.round(image.data[s + 3] * this.globalAlpha);
        if (a === 0) continue;
        c.data[d] = over(image.data[s], c.data[d], a); c.data[d + 1] = over(image.data[s + 1], c.data[d + 1], a); c.data[d + 2] = over(image.data[s + 2], c.data[d + 2], a); c.data[d + 3] = 255;
      }
    }
  }
}

export class SoftCanvas {
  #w = 300; #h = 150;
  constructor() { this.data = new Uint8ClampedArray(this.#w * this.#h * 4); this.context = null; this.id = 'game'; this.listeners = {}; }
  get width() { return this.#w; }
  get height() { return this.#h; }
  set width(value) { this.#w = value; this.data = new Uint8ClampedArray(this.#w * this.#h * 4); }
  set height(value) { this.#h = value; this.data = new Uint8ClampedArray(this.#w * this.#h * 4); }
  getContext() { return (this.context ??= new SoftContext(this)); }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.#w, height: this.#h }; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  focus() {}
  setAttribute() {}
}

// A canvas that draws nothing, for runs that only look at the game's state: the page still calls its renderer after every frame.
export class NullContext {
  constructor() { this.texts = []; }
  save() {}
  restore() {}
  fillRect() {}
  fillText() {}
  drawImage() {}
}
export class NullCanvas extends SoftCanvas {
  getContext() { return (this.context ??= new NullContext()); }
}

// Images: the size is read from the file at once, the pixels are decoded when they are first wanted, and every file is decoded once (the page makes thousands).
const decoded = new Map();
export class SoftImage {
  constructor() { this.width = 0; this.height = 0; this.complete = false; this._src = ''; this._path = ''; }
  get src() { return this._src; }
  set src(path) {
    this._src = path;
    this._path = resolve(PUBLIC, path.replace(/^\.\//, ''));
    const head = readFileSync(this._path).subarray(0, 24);
    this.width = head.readUInt32BE(16);
    this.height = head.readUInt32BE(20);
    this.complete = true;
  }
  get data() {
    let png = decoded.get(this._path);
    if (!png) { png = decodePng(readFileSync(this._path)); decoded.set(this._path, png); }
    return png.data;
  }
  async decode() {}
}
