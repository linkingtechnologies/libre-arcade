// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Runs the page's own code (public/src/app.mjs and the modules it imports) in Node, on a virtual clock, with scripted keys, a software canvas and
// the smallest stand-in for a browser that the page needs, and reports after every frame what the page's game has become: the same record that
// tools/oracle/harness.cc prints for the original, so that tools/oracle.mjs can compare them.
//
// The page is not changed. The modules are copied to a temporary folder and a read-only hook is appended to the copy of app.mjs (globalThis.__rili), because the page
// keeps its game in module variables. The page reads the seed of its random generator from globalThis.__RILI_SEED__ when that is set (otherwise from the clock, as
// main() does), so that the original and the page can be given the same seed: srand(seed) and GlibcRand(seed) make the same sequence.
// The page's frame loop is a requestAnimationFrame callback: the driver calls it with a timestamp that grows by the frame's length, which is how a
// browser drives it, and delivers a frame's keys before it, as the browser delivers events between two frames.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NullCanvas, PUBLIC, SoftCanvas, SoftImage } from './canvas-shim.mjs';

const SDL_KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', escape: 'Escape', return: 'Enter', space: ' ' };
const SOUND_NAMES = { click: 0, speed: 1, crash: 2, end: 3, lose: 4, stretch: 5, wagon: 6, shrink: 7, life: 8 };   // the original's eSon
const WAGON_ENUM = { locomotive: 0, charbon: 1, buches: 2, balles: 3, moteur: 4, citerne: 5 };

// the FNV-1a that harness.cc uses
function fnv(bytes) {
  let h = 0xcbf29ce484222325n;
  for (const b of bytes) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, '0');
}
const fbits = (v) => { const b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, v); return b.getUint32(0); };

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.get(k) ?? null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }

function makeElement(id, extra = {}) {
  return {
    id, textContent: '', innerHTML: '', onclick: null, hidden: false, dataset: {}, style: {}, children: [], disabled: false,
    focus() {}, setAttribute() {}, addEventListener() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
    requestFullscreen: async () => {}, ...extra,
  };
}

export class PageRun {
  // options: { language: 'it'|'en', seed, render, maxUnlocked } (render: draw into the software canvas; without it the page's drawing calls do nothing; maxUnlocked: the highest level the saved preferences hold)
  static async create(options = {}) {
    const run = new PageRun();
    await run.#init(options);
    return run;
  }

  async #init({ language = 'en', seed = 1, render = false, maxUnlocked = 50 } = {}) {
    this.dir = mkdtempSync(join(tmpdir(), 'rili-page-'));
    cpSync(join(PUBLIC, 'src'), join(this.dir, 'src'), { recursive: true });
    const appFile = join(this.dir, 'src', 'app.mjs');
    let code = readFileSync(appFile, 'utf8');
    code += '\nglobalThis.__rili={get session(){return session},get paused(){return paused},get screen(){return screen},get snap(){return snap},get pendingDirection(){return pendingDirection},renderer,audio,prefs:()=>prefs,levels:()=>levels,loop,tick};\n';
    writeFileSync(appFile, code);

    this.handlers = { keydown: [], keyup: [], blur: [] };
    this.audioLog = [];
    this.clock = 1000;   // the original's virtual clock starts at 1000 (harness.cc), and the menus' animations read the clock itself
    this.raf = null;
    const elements = new Map();
    const ids = ['game', 'status', 'pause', 'help', 'lang', 'restart', 'instructions', 'credits', 'info-panel', 'info-title', 'info-body', 'reset-area', 'reset-data', 'reset-note', 'info-close', 'touchpad', 'keys-help'];
    for (const id of ids) elements.set(id, id === 'game' ? Object.assign(render ? new SoftCanvas() : new NullCanvas(), { dataset: {}, style: {} }) : makeElement(id, { hidden: id === 'info-panel' || id === 'reset-area' }));
    const canvas = elements.get('game');
    canvas.width = 800; canvas.height = 600;
    this.canvas = canvas;
    const touchButtons = ['up', 'down', 'left', 'right'].map((dir) => makeElement('touch-' + dir, { dataset: { dir } }));
    const audioLog = this.audioLog;
    const musicLog = this.musicLog = [];
    class FakeAudio {
      constructor(src = '') { this.src = src; this.loop = false; this.volume = 1; this.currentTime = 0; this.paused = true; this.dataset = {}; if (/audio[/](jeu|menu)/.test(src)) musicLog.push(src); }   // a new tune is a new Audio; play() on it again is only a resume
      play() { this.paused = false; if (!/audio[/](jeu|menu)/.test(this.src)) audioLog.push(this.src); return Promise.resolve(); }
      pause() { this.paused = true; }
      cloneNode() { return new FakeAudio(this.src); }
    }
    const g = globalThis;
    g.window = g;
    g.__RILI_ENABLE_TEST_HOOKS__ = true;
    g.__RILI_SEED__ = seed;
    g.localStorage = new Mem();
    g.Image = SoftImage;
    g.Audio = FakeAudio;
    g.requestAnimationFrame = (fn) => { this.raf = fn; return 1; };
    g.cancelAnimationFrame = () => {};
    g.addEventListener = (type, fn) => { (this.handlers[type] ??= []).push(fn); };
    g.performance = { now: () => this.clock };
    g.location = { search: '' };
    g.document = {
      hidden: false, fullscreenElement: null, documentElement: { lang: language }, body: { dataset: {} },
      getElementById: (id) => elements.get(id),
      addEventListener() {},
      querySelector: (q) => (q === '.shell' ? makeElement('shell') : q === '.touchpad' ? elements.get('touchpad') : null),
      querySelectorAll: (q) => (q === '#touchpad [data-dir]' ? touchButtons : []),
      exitFullscreen: async () => {},
    };
    g.fetch = async (url) => {
      url = String(url);
      if (url === 'data/sprites.json') return { ok: true, json: async () => JSON.parse(readFileSync(resolve(PUBLIC, url), 'utf8')) };
      if (url === 'reference/levels.dat' || url === 'data/levels.dat') {
        const b = readFileSync(resolve(PUBLIC, 'data/levels.dat'));
        return { ok: true, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
      }
      throw new Error(`unexpected fetch ${url}`);
    };
    g.localStorage.setItem('rili-2.0.1', JSON.stringify({ version: 1, language, maxUnlocked }));

    delete g.__RILI_READY__;
    delete g.__RILI_STATE__;
    await import(pathToFileURL(appFile).href);
    for (let i = 0; i < 6000 && !g.__RILI_READY__; i++) await new Promise((r) => setTimeout(r, 5));
    if (!g.__RILI_READY__) throw new Error('the page did not become ready');
    this.hook = g.__rili;
    this.test = g.__RILI_TEST__;
    this.randSeen = 0;
    this.#watchDrawing();
  }

  // The original keeps a list of what a frame drew (Ec[NumVideo]: sprite, frame, x, y); the page's renderer has no such list, so its calls are recorded as they are made.
  // Only what the original puts in its list is kept. In the game: the train and its cables, the arrow, the objects on the board, "press any key" and the indicators of the
  // dashboard. In the quiz: the two answer plates and the arrows around the chosen one.
  #watchDrawing() {
    const r = this.hook.renderer;
    this.draws = [];
    let where = null;    // null, 'game' or 'quiz'
    const enumOf = (group) => Number(/^([0-9]+)_/.exec(group)[1]);
    const keep = { game: (e) => e <= 11 || e === 14 || e === 44 || e === 38, quiz: (e) => e === 33 || e === 21 || e === 22 };
    const note = (entry) => { if (where && keep[where](entry[0])) this.draws.push(entry); };
    const sprite = r.sprite.bind(r), uiSprite = r.uiSprite.bind(r), cable = r.cable.bind(r), draw = r.draw.bind(r), drawQuiz = r.drawQuiz.bind(r);
    r.sprite = (g, n, x, y) => { note([enumOf(g), n, x, y]); return sprite(g, n, x, y); };
    r.uiSprite = (name, x, y) => { if (name === 'T_press_any_key') note([44, 0, x, y]); return uiSprite(name, x, y); };
    r.cable = (dx, dy, fx, fy) => { note([38, 0, dx, dy, fx, fy]); return cable(dx, dy, fx, fy); };
    r.draw = (...a) => {
      if (where === 'quiz') { where = null; try { return draw(...a); } finally { where = 'quiz'; } }   // the game screen behind the quiz is not part of its list
      this.draws = []; where = 'game';
      try { return draw(...a); } finally { where = null; }
    };
    r.drawQuiz = (...a) => { this.draws = []; where = 'quiz'; try { return drawQuiz(...a); } finally { where = null; } };
  }

  // the keys: names as in the scenario (up, down, left, right, escape, return, space, a letter)
  async key(type, name) {
    const key = SDL_KEYS[name] ?? name;
    const event = { key, preventDefault() {}, stopPropagation() {} };
    await Promise.all(this.handlers[type === 'down' ? 'keydown' : 'keyup'].map((fn) => fn(event)));
  }

  // a press of the mouse button (or a touch) on the picture, at a place of the 800 by 600 canvas
  async click(x = 400, y = 300) {
    const event = { clientX: x, clientY: y, preventDefault() {}, stopPropagation() {} };
    await Promise.all((this.canvas.listeners.pointerdown ?? []).map((fn) => fn(event)));
  }

  start(level, difficulty) { this.test.start(level, difficulty); this.randSeen = 0; }

  // one frame of the browser: advance the clock and call the frame loop
  frame(ms) {
    this.clock += ms;
    const fn = this.raf;
    this.raf = null;
    fn(this.clock);
  }

  // what the game is, in the record's terms (see harness.cc)
  record(frame) {
    const h = this.hook, s = h.session, o = s.oracle;
    if (s.state === 'quiz' || s.state === 'quiz_result') return this.#recordQuiz(frame);
    const cur = o.history[o.history.length - 1];
    const rng = s.rng.calls;
    const rand = rng.slice(this.randSeen).map((c) => c.raw);
    this.randSeen = rng.length;
    const snd = [];
    for (const src of this.musicLog.splice(0)) { if (this.musicStarted) snd.push('m' + /jeu([0-9])/.exec(src)?.[1]); this.musicStarted = true; }   // the first tune is the one the game starts with
    for (const src of this.audioLog.splice(0)) {
      const name = /audio\/([a-z0-9]+)\./.exec(src)?.[1];
      const map = { clic: 'click', etire: 'stretch', live: 'life', reduit: 'shrink', crash: 'crash', end: 'end', lose: 'lose', speed: 'speed', wagon: 'wagon' };
      const n = SOUND_NAMES[map[name] ?? name];
      if (n !== undefined && n !== 0) snd.push('p' + n);
      else if (name === 'jeu1' || name === 'jeu2') snd.push('m' + name.slice(3));
    }
    return {
      k: 'g', f: frame, dg: o.gameMs, D: fbits(o.d), cell: cur.p, exit: cur.sortie, ploco: o.history.length - 1, nw: o.wagonLengths.length,
      rem: o.board.filter((v) => v === 2).length, score: o.score, lives: o.lives, spacing: fbits(o.spacing), speed: o.speed, vit: o.baseSpeed,
      mortLeft: o.mortUntil === -1 ? null : o.mortUntil - o.clockMs, won: o.won ? 1 : 0, keys: [...o.keys], pinter: o.pInter, pentree: o.pEntree,
      pause: h.paused ? 1 : 0, help: h.renderer.help ? 1 : 0, alonge: o.stretchUntil, reduit: o.shrinkUntil, vitesse: o.speedUntil, memo: fbits(o.memoDt),
      types: o.wagonTypes.map((t) => WAGON_ENUM[t]), pw: o.renderedWagonPoints.map((p) => [...p]), board: fnv(o.board), rand, snd,
      draws: this.draws.map((d) => [...d]), screen: h.screen, state: s.state,
    };
  }

  // a frame of the quiz after a won level, in the terms of harness.cc's "q" records (the arrows' animation frame depends on the absolute clock and is left out)
  #recordQuiz(frame) {
    const h = this.hook, s = h.session;
    const rand = s.rng.calls.slice(this.randSeen).map((c) => c.raw);
    this.randSeen = s.rng.calls.length;
    const snd = [];
    for (const src of this.musicLog.splice(0)) { if (this.musicStarted) snd.push('m' + /jeu([0-9])/.exec(src)?.[1]); this.musicStarted = true; }
    for (const src of this.audioLog.splice(0)) {
      const name = /audio[/]([a-z0-9]+)[.]/.exec(src)?.[1];
      const map = { clic: 0, end: 3, lose: 4 };
      if (map[name] !== undefined && map[name] !== 0) snd.push('p' + map[name]);
    }
    return { k: 'q', f: frame, score: s.score, lives: s.lives, pye: s.quiz.pyE, rand, snd, draws: this.draws.map((d) => (d[0] === 21 || d[0] === 22 ? [d[0], 0, d[2], d[3]] : [...d])), screen: h.screen, state: s.state };
  }

  pixels() { return this.canvas.data; }

  close() { rmSync(this.dir, { recursive: true, force: true }); }
}
