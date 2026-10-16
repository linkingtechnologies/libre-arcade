// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the page's own scripts (public/src, in the order of index.html) in Node, with the smallest stand-in for a browser that they need,
// one tick of the page's 50 a second clock at a time, so that the oracle can compare what they do with what the ROM does.
//
// The page is not changed. The scripts are put in a `vm` context with a `document`, a `window`, a `localStorage` and canvases that
// keep the picture the page draws (the canvases keep their pixels as a real one does: putImageData copies the pixels it is given,
// transparent ones included). The one thing that is added is a read-only hook at the end of app.js (the page keeps everything in a
// closure): `globalThis.__lm` gives the oracle the page's state object and the functions it calls on a tick or a key. The hook is
// appended to the text that is run here and is not in public/.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public', 'src');
const SCRIPTS = ['levels.js', 'core.js', 'nes-assets.js', 'nes-gfx.js', 'transitions.js', 'audio-data.js', 'famitone.js', 'nes-audio.js', 'app.js'];

class FakeElement {}

class Canvas2D {
  constructor() { this.width = 256; this.height = 240; this.pixels = new Uint8ClampedArray(256 * 240 * 4); this.writes = 0; }
  createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
  // the pixels of a region, as a real canvas gives them (what lies outside the canvas is transparent black)
  getImageData(x, y, w, h) {
    const img = this.createImageData(w, h);
    for (let row = 0; row < h; row++) {
      const py = y + row;
      if (py < 0 || py >= this.height) continue;
      for (let col = 0; col < w; col++) {
        const px = x + col;
        if (px < 0 || px >= this.width) continue;
        const s = (py * this.width + px) * 4, d = (row * w + col) * 4;
        img.data[d] = this.pixels[s]; img.data[d + 1] = this.pixels[s + 1]; img.data[d + 2] = this.pixels[s + 2]; img.data[d + 3] = this.pixels[s + 3];
      }
    }
    return img;
  }
  putImageData(img, x, y) {
    this.writes++;
    for (let row = 0; row < img.height; row++) {
      const py = y + row;
      if (py < 0 || py >= this.height) continue;
      for (let col = 0; col < img.width; col++) {
        const px = x + col;
        if (px < 0 || px >= this.width) continue;
        const s = (row * img.width + col) * 4, d = (py * this.width + px) * 4;
        this.pixels[d] = img.data[s]; this.pixels[d + 1] = img.data[s + 1]; this.pixels[d + 2] = img.data[s + 2]; this.pixels[d + 3] = img.data[s + 3];
      }
    }
  }
}

class Storage {
  getItem(k) { return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null; }
  setItem(k, v) { this[k] = String(v); }
  removeItem(k) { delete this[k]; }
}

function makeElement(id) {
  const el = new FakeElement();
  const classes = new Set(['hidden']);
  Object.assign(el, {
    id, dataset: {}, style: {}, textContent: '', innerHTML: '', value: '', hidden: false, onclick: null, listeners: {}, attributes: {},
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c),
      toggle: (c, force) => { const on = force === undefined ? !classes.has(c) : !!force; if (on) classes.add(c); else classes.delete(c); return on; },
    },
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); },
    removeEventListener() {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] ?? null; },
    focus() {}, select() {}, blur() {},
    closest() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 256, height: 240 }; },
  });
  el.ctx = new Canvas2D();
  el.getContext = () => el.ctx;
  return el;
}

export class PortGame {
  // `now` is the page's clock: the oracle moves it 20 ms at a time.
  constructor({ lang = null } = {}) {
    this.elements = new Map();
    this.windowListeners = {};
    this.documentListeners = {};
    this.now = 1000;
    this.raf = null;
    const element = (id) => { if (!this.elements.has(id)) this.elements.set(id, makeElement(id)); return this.elements.get(id); };
    this.element = element;
    const document = {
      querySelector: (sel) => element(sel),
      querySelectorAll: () => [],
      documentElement: element('html'),
      addEventListener: (type, fn) => { (this.documentListeners[type] ??= []).push(fn); },
    };
    const storage = new Storage();
    if (lang) storage.setItem('lanmaster.lang', lang);
    const context = {
      console, atob: (s) => Buffer.from(s, 'base64').toString('binary'), queueMicrotask, Element: FakeElement,
      document, localStorage: storage,
      performance: { now: () => this.now },
      requestAnimationFrame: (fn) => { this.raf = fn; return 1; },
      setTimeout: () => 0, clearTimeout: () => {},
    };
    context.window = context;
    context.globalThis = context;
    context.addEventListener = (type, fn) => { (this.windowListeners[type] ??= []).push(fn); };
    vm.createContext(context);
    this.context = context;
    for (const file of SCRIPTS) {
      let code = readFileSync(join(SRC, file), 'utf8');
      if (file === 'app.js') {
        // the page's state and the functions it runs on a tick, for the oracle to read and call; nothing else is touched
        const hook = `globalThis.__lm={state,fixedTick,AUDIO,control,gameNametable,drawGame,renderTitle,renderEnding,drawCursor,cursorShouldDraw,tickTransitions,get lang(){return lang}};`;
        const end = code.lastIndexOf('})();');
        if (end < 0) throw new Error('the end of app.js was not found');
        code = code.slice(0, end) + hook + '\n' + code.slice(end);
      }
      vm.runInContext(code, context, { filename: file });
    }
    this.lm = context.__lm;
    this.state = this.lm.state;
    this.canvases = { title: element('#titleCanvas'), game: element('#game'), ending: element('#endingCanvas') };
  }

  // One tick of the page's clock (20 ms): what the page does in 1/50 s.
  tick() { this.lm.fixedTick(); }

  // A key as the page's listeners get it. `target` is nothing special (the page's text inputs and buttons are not involved).
  key(key, { repeat = false, up = false } = {}) {
    const event = { key, repeat, target: null, preventDefault() {}, stopPropagation() {} };
    for (const fn of (up ? this.windowListeners.keyup : this.windowListeners.keydown) ?? []) fn(event);
  }

  // The state the oracle compares, in the ROM's units where the page has the same thing.
  snapshot() {
    const s = this.state;
    return {
      screen: s.screen, level: s.levelIndex, seed: s.seed,
      map: s.map ? Uint8Array.from(s.map) : null, displayMap: s.displayMap ? Uint8Array.from(s.displayMap) : null,
      cursor: { ...s.cursor }, gameTime: s.gameTime, timeDiv: s.timeDiv, rrotCounter: s.rrotCounter,
      traceOrdinal: s.traceOrdinal, traceCountdown: s.traceCountdown, onlineTarget: s.onlineTarget, onlineDisplay: s.onlineDisplay,
      pending: s.pending ? { ...s.pending } : null, engineOut: Uint8Array.from(this.lm.AUDIO.regs),
    };
  }
}
