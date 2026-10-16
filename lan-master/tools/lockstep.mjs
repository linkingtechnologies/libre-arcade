// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the ROM and the page's own scripts side by side, and compares them.
//
// One step of the loop is one frame of the ROM (one NMI). On the PAL console (the default) every frame is one tick of the game's clock, the page's
// clock ticks once for each, and the page's picture, its variables and its calls to the sound player are compared with the ROM's after each. On
// the NTSC console the game's clock is the frames in which the game's logic runs (tools/rom-run.mjs, `logic`: four in five) and the page ticks
// once for each of those. The page is written for 50 ticks a second, which is the PAL console, so that is the run that is compared tick for tick.
//
// The page's clock starts when the ROM first turns its display on (plus `skew` frames, 1 by default: the ROM's first frame with the display on
// shows the picture before its first fade step, which the page does not have a tick for): the ROM spends its first frames finding out which
// console it is on and clearing memory, which the page has no counterpart of. On the PAL console the page's frame counter (globalFrame, which
// its animations use for their phase as the ROM uses FRAME_CNT) is set to the ROM's when the clock starts; the phase of a counter that nothing
// resets is arbitrary, and the two have to agree for the pictures to.
//
// The pad. The ROM reads the pad in its own frame; the page is told about it by the keys it understands. A press that the ROM sees in
// frame f is delivered to the page just before its tick f+1, because the ROM's effect of a press shows in its picture one frame after it reads
// the pad (the loops draw first and read the pad last), as the page's does when the key comes before the tick.
//
// The sound. The page's player is replaced, for the run, by one that records the calls the page makes (what to play and when) and whose
// output is the ROM's own (the page's menu animation reads it) as it was when the ROM's main loop read it: the loops read the output buffer
// before they call FamiToneUpdate, so what they see is the buffer as the previous frame left it. The ROM's calls are recorded at the points where the program calls FamiTone
// (tools/rom-audio.mjs). On the NTSC console the page's player is also driven by the ROM's calls and its output compared with the ROM's, frame by frame.

import { RomGame, PAD } from './rom-run.mjs';
import { PortGame } from './port-run.mjs';
import { composeFrame } from './nes-frame.mjs';
import { reader } from './ram-map.mjs';
import { watchAudio } from './rom-audio.mjs';
import { loadSymbols } from './symbols.mjs';

const FT_OUT_BUF = 0x270;

// ---- pad to keys -----------------------------------------------------------------------------------------------------------------------

// The page polls the pad once a frame while the game runs (as the ROM does), so in the game the keys go down and up in the tick of the frame they
// do in the ROM. (Everywhere else a press is an event the page answers at once, and comes one tick after the ROM reads it: see the header.)
const GAME_KEYS = [[PAD.UP, 'ArrowUp'], [PAD.DOWN, 'ArrowDown'], [PAD.LEFT, 'ArrowLeft'], [PAD.RIGHT, 'ArrowRight'], [PAD.A, 'z'], [PAD.B, 'x'], [PAD.SELECT, 'Shift'], [PAD.START, 'Enter']];

// The keys that the page takes for the presses `trig` (new presses) in the screen it is in. The ROM reacts to one thing in each of its
// loops (the first that applies, in the order of its code), and so does this.
export function keysFor(trig, portState) {
  const keys = [];
  const s = portState;
  const confirm = PAD.A | PAD.B | PAD.START;
  const enter = trig & PAD.A ? 'z' : trig & PAD.B ? 'x' : 'Enter';     // the page takes Z, X and Enter for A, B and Start
  switch (s.screen) {
    case 'menu':
      if (s.menuMode === 'menu') {
        if (trig & PAD.UP) keys.push('ArrowUp'); else if (trig & PAD.DOWN) keys.push('ArrowDown'); else if (trig & PAD.SELECT) keys.push('Shift'); else if (trig & confirm) keys.push(enter);
      } else if (trig & PAD.UP) keys.push('ArrowUp');
      else if (trig & PAD.DOWN) keys.push('ArrowDown');
      else if (trig & PAD.LEFT) keys.push('ArrowLeft');
      else if (trig & PAD.RIGHT) keys.push('ArrowRight');
      else if (trig & confirm) keys.push(enter);
      else if (trig & PAD.SELECT) keys.push('Shift');
      break;
    case 'pause':
      if (trig & PAD.UP) keys.push('ArrowUp'); else if (trig & PAD.DOWN) keys.push('ArrowDown'); else if (trig & confirm) keys.push(enter);
      break;
    case 'clear': case 'timeout':
      if (trig & confirm) keys.push(enter);
      break;
    default: break;
  }
  return keys;
}

// ---- what is compared --------------------------------------------------------------------------------------------------------------------

const hex = (b) => Buffer.from(b).toString('hex');

// The page's picture, from the canvas of the screen it is in.
function portPixels(port) {
  const s = port.state.screen;
  const canvas = /^menu/.test(s) || s === 'help' || s === 'credits' ? port.canvases.title : /^ending/.test(s) ? port.canvases.ending : port.canvases.game;
  return canvas.ctx.pixels;
}

// Compares two pictures outside the lines where the ROM changes a register in the middle of the line. Returns null or { pixels, box }.
export function comparePictures(reference, pixels) {
  let n = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1;
  for (let y = 0; y < 240; y++) {
    if (reference.split[y]) continue;
    for (let x = 0; x < 256; x++) {
      const o = (y * 256 + x) * 4;
      if (reference.rgba[o] !== pixels[o] || reference.rgba[o + 1] !== pixels[o + 1] || reference.rgba[o + 2] !== pixels[o + 2]) {
        n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return n ? { pixels: n, box: [x0, y0, x1, y1] } : null;
}

// The calls to the sound player, in one form for both sides.
function canonical(call) {
  switch (call.name) {
    case 'musicStart': return `music ${call.addr.toString(16)}`;
    case 'musicStop': return 'stop';
    case 'musicPause': return call.paused ? 'pause' : 'resume';
    case 'sfxStart': return `sfx ${call.id} on ${call.stream}`;
    default: return null;
  }
}

// The calls that change what is heard: a stop when nothing is playing changes nothing, and the pause and sample stop that the ROM makes around the rows
// of its tables (its author's workaround for a clash between the sample channel and the picture memory) have no counterpart in the page, which plays its
// samples from the player's own events.
function audible(calls) {
  let playing = false;
  const out = [];
  for (const c of calls) {
    if (canonical(c) === null) continue;
    if (c.name === 'musicStart') playing = true;
    else if (c.name === 'musicStop') { if (!playing) continue; playing = false; }
    else if (c.name === 'musicPause') continue;
    out.push(c);
  }
  return out;
}

// Pairs the ROM's calls with the page's, in order. Returns { pairs: [{ rom, page, lag }], problems: [string], lags: Map(lag → count) }.
export function matchCalls(romCalls, pageCalls) {
  const mine = audible(romCalls), theirs = audible(pageCalls);
  const pairs = [], problems = [], lags = new Map();
  let i = 0, j = 0;
  while (i < mine.length && j < theirs.length) {
    const a = mine[i], b = theirs[j];
    if (canonical(a) === canonical(b)) {
      const lag = b.tick - a.tick;
      pairs.push({ rom: a, page: b, lag });
      lags.set(lag, (lags.get(lag) ?? 0) + 1);
      i++; j++;
    } else {
      problems.push(`ROM ${canonical(a)} at tick ${a.tick}, page ${canonical(b)} at tick ${b.tick}`);
      // resynchronise on whichever side is behind in time
      if (a.tick <= b.tick) i++; else j++;
    }
  }
  for (; i < mine.length; i++) problems.push(`ROM ${canonical(mine[i])} at tick ${mine[i].tick}, page has nothing more`);
  for (; j < theirs.length; j++) problems.push(`page ${canonical(theirs[j])} at tick ${theirs[j].tick}, ROM has nothing more`);
  return { pairs, problems, lags };
}

// ---- the lockstep itself --------------------------------------------------------------------------------------------------------------------

/**
 * @param {object} o
 * @param {Uint8Array} o.rom the ROM
 * @param {'pal'|'ntsc'} [o.region] the console the ROM runs on (the page's 50 a second is the PAL one)
 * @param {(ctx) => number} o.pad the pad (PAD bits) for the next frame of the ROM, from ctx = { frame, tick, rom, port }
 * @param {number} o.ticks how many ticks of the game's clock to run, from when the page's clock starts
 * @param {object} [o.compare] { picture, engine, state } (all on by default; engine only on the NTSC console)
 * @param {number} [o.skew] how many frames after the ROM's display comes on the page's clock starts (0: the page's first tick is that frame)
 * @param {number} [o.pictureEvery] compare the pictures of idle stretches of play only every this many ticks (1: all of them)
 * @param {boolean} [o.syncFrameCounter] set the page's frame counter to the ROM's when the page's clock starts (PAL only)
 * @param {(ctx) => string[]} [o.state] extra comparisons, given { rom, port, tick, prev }: returns lines for what differs. `prev` reads the ROM's
 *   variables as the previous frame left them: what a press changes is changed in the ROM in the frame it reads the pad, and in the page one tick later
 * @param {number} [o.maxMismatches]
 * @param {(ctx) => void} [o.after] called after each tick with { tick, rom, port, composed }
 */
export function lockstep({ rom: romBytes, region = 'pal', pad, ticks, compare = {}, skew = 1, state = null, maxMismatches = 10, after = null, stopAtMismatch = true, lang = null, syncFrameCounter = true, levelAlias = null, pictureEvery = 1 }) {
  const want = { picture: true, engine: region === 'ntsc', state: true, ...compare };
  // levelAlias ({ 49: 0 } makes level 50 the same as level 1): the level's record in the ROM and in the page are overwritten, to reach a screen (the clear of the
  // last level) that the solver cannot reach with the real data. The rest of the ROM is the ROM.
  let machineBytes = romBytes;
  if (levelAlias) {
    machineBytes = romBytes.slice();
    const symbols = loadSymbols(romBytes);
    const record = (n) => { const at = 16 + (symbols.levList - 0x8000) + 2 * n; const address = machineBytes[at] | (machineBytes[at + 1] << 8); return 16 + (address - 0x8000); };
    for (const [to, from] of Object.entries(levelAlias)) machineBytes.set(romBytes.subarray(record(from), record(from) + 60), record(Number(to)));
  }
  const rom = new RomGame(machineBytes, { capture: want.picture, region, check: !levelAlias });
  const result = { frames: 0, ticks: 0, started: null, mismatches: [], screens: new Map(), compared: { picture: 0, engine: 0, state: 0 }, calls: { rom: [], page: [] } };
  const clock = () => result.ticks + 1;
  const watch = watchAudio(rom, romBytes, { drive: want.engine, clock });
  result.calls.rom = watch.log.calls;
  result.watch = watch;
  const port = new PortGame({ lang });
  if (levelAlias) for (const [to, from] of Object.entries(levelAlias)) port.context.LAN_MASTER_LEVELS[Number(to)] = { ...port.context.LAN_MASTER_LEVELS[from] };
  let seen = new Uint8Array(11);   // the ROM's output buffer at the end of the previous frame
  const output = () => seen;
  const log = result.calls.page;
  port.lm.AUDIO.engine = {
    musicStart: (addr) => log.push({ tick: clock(), name: 'musicStart', addr }),
    musicStop: () => log.push({ tick: clock(), name: 'musicStop' }),
    musicPause: (paused) => log.push({ tick: clock(), name: 'musicPause', paused }),
    sfxStart: (id, stream) => log.push({ tick: clock(), name: 'sfxStart', id, stream }),
    update() {},
    get out() { return output(); },
  };
  const note = (kind, tick, frame, text, extra = {}) => { result.mismatches.push({ kind, tick, frame, text, ...extra }); return stopAtMismatch || result.mismatches.length >= maxMismatches; };
  let queue = [];            // key events ({ key, up }) for the page, to be delivered before its next tick
  const pressedKeys = new Map();   // button bit -> the keys the page was told went down for it outside the game (to be told they went up)
  let prevButtons = 0;
  let gamePadSent = 0;      // which game buttons the page has been told are down
  let started = false;
  let startFrame = 0;
  let screenBefore = null;   // the page's screen after the previous tick
  let lastPadFrame = -1000;  // the last frame in which a button was down
  let prevRam = rom.ram.slice();   // the ROM's RAM at the end of the previous frame

  for (let frame = 0; result.ticks < ticks; frame++) {
    const ctx = { frame, tick: result.ticks, rom, port };
    const buttons = pad(ctx) | 0;
    const logic = rom.frame(buttons);
    result.frames++;
    if (!started && (rom.m.ppuMask & 0x18)) { started = true; startFrame = frame; result.started = frame; }
    const running = started && frame >= startFrame + skew;
    let composed = null;
    if (buttons) lastPadFrame = frame;
    // in a long stretch of the game with nobody touching the pad, the pictures are compared every `pictureEvery` ticks (the variables are compared in every one)
    const sampled = pictureEvery > 1 && port.state.screen === 'playing' && frame - lastPadFrame > 16 && result.ticks % pictureEvery !== 0;
    if (want.picture && running && !sampled && rom.m.visible && (rom.m.visible.mask & 0x18)) composed = composeFrame(rom.m);

    if (want.engine && watch.log.updates > 0) {     // (before the first update the ROM's buffer is empty and the player's has its silent start)
      result.compared.engine++;
      const a = rom.ram.slice(FT_OUT_BUF, FT_OUT_BUF + 11), b = watch.engine.out;
      if (hex(a) !== hex(b)) { if (note('engine', result.ticks, frame, `ROM ${[...a].join(',')} player ${[...b].join(',')}`)) break; }
    }
    if (!running || !logic) { seen = rom.ram.slice(FT_OUT_BUF, FT_OUT_BUF + 11); prevRam = rom.ram.slice(); continue; }

    if (result.ticks === 0 && syncFrameCounter && region === 'pal') port.state.globalFrame = rom.ram[0xff] - 1;
    for (const e of queue) port.key(e.key, { up: e.up });
    queue = [];
    if (port.state.screen === 'playing') {
      const changed = buttons ^ gamePadSent;
      for (const [bit, key] of GAME_KEYS) if (changed & bit) port.key(key, { up: !(buttons & bit) });
      gamePadSent = buttons;
    } else {
      for (const [bit, key] of GAME_KEYS) if (gamePadSent & bit) port.key(key, { up: true });   // the game has stopped asking: let go of what it was holding
      gamePadSent = 0;
    }
    port.tick();
    result.ticks++;
    result.screens.set(port.state.screen, (result.screens.get(port.state.screen) ?? 0) + 1);
    // the presses of this frame are the page's keys for the next
    const trig = buttons & ~prevButtons, released = prevButtons & ~buttons;
    prevButtons = buttons;
    for (const [bit, keys] of pressedKeys) if (released & bit) { for (const key of keys) queue.push({ key, up: true }); pressedKeys.delete(bit); }
    const keys = keysFor(trig, port.state);
    for (const key of keys) queue.push({ key, up: false });
    if (keys.length) for (let bit = 1; bit < 256; bit <<= 1) if (trig & bit) pressedKeys.set(bit, keys);

    if (want.picture && composed) {
      result.compared.picture++;
      const d = comparePictures(composed, portPixels(port));
      if (d && note('picture', result.ticks, frame, `${d.pixels} pixels differ in ${d.box.join(',')} (screen ${port.state.screen})`, { box: d.box, composed })) break;
    }
    if (want.state && state) {
      result.compared.state++;
      const lines = state({ rom, port, tick: result.ticks, frame, prev: reader(prevRam), prevRam, screenBefore });
      if (lines.length && note('state', result.ticks, frame, lines.join('; '))) break;
    }
    if (after) after({ tick: result.ticks, rom, port, composed });
    seen = rom.ram.slice(FT_OUT_BUF, FT_OUT_BUF + 11);
    prevRam = rom.ram.slice();
    screenBefore = port.state.screen;
  }
  result.audio = matchCalls(result.calls.rom, result.calls.page);
  return result;
}
