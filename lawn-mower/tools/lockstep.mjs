// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the ROM and the port side by side, one NMI at a time, and compares their variables (see tools/rom-oracle.mjs).
//
// While the ROM sets a screen up (a level, the final screen, the title again) it keeps the display off for several NMIs. The port
// has a 'setup' mode for these; the two must agree on when the display is on again, and nothing is compared while it is off.

import { RomGame, loadRom, ROM_FLAVOURS, portState, romState, mapDifferences, oamDifferences } from './rom-oracle.mjs';
import { LawnSession } from '../public/src/session.js';
import { loadScreens } from './rom-oracle.mjs';
import { LawnAudioEngine } from '../public/src/audio-engine.js';

const FT_OUT_BUF = 0x770;                // FT_BASE_ADR ($0700) + 112: the 11 bytes FamiToneUpdate sends to the sound chip

/**
 * @param {object} options
 * @param {'v1.1'|'v1.12'|'v1.12-release'} options.flavour which ROM to run
 * @param {(ctx) => number} options.pad the pad (PAD bits) for the next frame, from ctx = { frame, rom, session }
 * @param {number} options.frames how many NMIs to run
 * @param {boolean} [options.stopAtMismatch=true]
 * @param {Function} [options.before] called before every frame is run (the port still shows the previous frame's state)
 * @param {boolean} [options.capture=false] keep what each ROM frame's picture is made of (tools/nes-frame.mjs)
 * @param {Function} [options.after] called after every compared frame with ctx
 * @param {boolean} [options.audio=false] also run the port's FamiTone player on the kernel's events and compare its 11 output bytes with FT_OUT_BUF
 * @param {boolean} [options.follow] the port's set-ups last as long as the ROM's (the lengths are reported in `setups`); on by default for
 *   'v1.12-release', whose loading of the fifth lawn takes a frame longer than the port's table says on some entries (see reference/release-v1.12/SOURCE.md)
 */
export function lockstep({ flavour = 'v1.1', pad, frames, stopAtMismatch = true, after = null, maxMismatches = 20, rom: romImage = null, follow = flavour === 'v1.12-release', audio = false, before = null, capture = false }) {
  const rom = new RomGame(romImage ?? loadRom(flavour)).boot();
  const session = new LawnSession({ seed: 1, screens: loadScreens(), ...ROM_FLAVOURS[flavour] });
  session.coldReset(1);
  // The two builds boot differently (v1.12 inlines a loop that v1.1 calls), so their FRAME_CNT differs at the first title frame; the
  // port's constant is the competition ROM's (checked in test/rom-data.test.js) and the other build is started from its own value.
  const result = { flavour, frames: 0, compared: 0, mismatches: [], setups: [], modes: new Map(), events: new Map(), bootFrameCount: rom.read('frameCount') };
  const engine = audio ? new LawnAudioEngine() : null;
  // what the sound comparison covered: frames of each tune (and the longest unbroken stretch, to show a tune was heard to its loop) and starts of each effect
  result.sound = { tracks: new Map(), longest: new Map(), effects: new Map() };
  if (engine) {
    const startMusic = engine.startMusic.bind(engine), playSfx = engine.playSfx.bind(engine);
    let run = 0, lastTrack = null;
    engine.startMusic = (track) => { run = 0; startMusic(track); };
    engine.playSfx = (id, stream) => { result.sound.effects.set(id, (result.sound.effects.get(id) ?? 0) + 1); playSfx(id, stream); };
    result.countTune = () => {
      const track = engine.currentTrack;
      if (track !== lastTrack) { lastTrack = track; run = 0; }
      if (track) { run++; result.sound.tracks.set(track, (result.sound.tracks.get(track) ?? 0) + 1); result.sound.longest.set(track, Math.max(result.sound.longest.get(track) ?? 0, run)); }
    };
  }
  rom.machine.capture = capture;
  session.game.frameCount = result.bootFrameCount;
  session.game.frameCount2 = rom.read('frameCount2');
  const note = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
  const fail = (frame, kind, fields, extra = {}) => {
    result.mismatches.push({ frame, mode: kind, fields, ...extra });
    return stopAtMismatch || result.mismatches.length >= maxMismatches;
  };
  let setup = null;                      // { start, expected, next } while the port is in 'setup'

  for (let frame = 0; frame < frames; frame++) {
    const ctx = { frame, rom, session };
    if (before) before(ctx);
    const game = pad(ctx) | 0;
    rom.frame(game);
    result.frames++;
    const wasSetup = session.game.mode === 'setup';
    const inSetup = session.game.mode === 'setup';
    const from = `${session.game.mode}:${session.game.flowPhase ?? ''}:L${session.game.levelIndex + 1}`;
    session.tick(game);
    const drained = session.game.drainEvents();
    for (const e of drained) note(result.events, e.type);
    if (engine) { engine.step(drained, { setup: inSetup }); if (!inSetup) result.countTune(); }
    if (follow && session.game.mode === 'setup') {                 // the ROM decides when the display is on again
      if (!wasSetup) setup = { start: frame, expected: session.game.setupFrames, next: session.game.setupNext, from };
      if (!rom.screenOn) session.game.setupFrames = 2;
      else session.game.setupFrames = 1;
      if (rom.screenOn) { session.game.mode = session.game.setupNext; }
    }
    const mode = session.game.mode;

    if (mode === 'setup' && !wasSetup && !setup) setup = { start: frame, expected: session.game.setupFrames, next: session.game.setupNext, from };
    const kind = mode + (session.game.flowPhase ? ':' + session.game.flowPhase : '');
    if (mode === 'setup') {
      if (rom.screenOn) {
        if (fail(frame, kind, [`the ROM's display is on ${frame - setup.start} NMIs into a set-up that the port expects to last ${setup.expected}`], { setup })) break;
      }
      continue;
    }
    if (setup) {
      const took = frame - setup.start;
      result.setups.push({ next: setup.next, nmis: took, expected: setup.expected, from: setup.from });
      setup = null;
    }
    if (!rom.screenOn) {
      // the port thinks the screen is up; the ROM is still setting it up
      const open = result.setups.length ? result.setups[result.setups.length - 1] : null;
      if (fail(frame, kind, ['the ROM still has its display off'], { open })) break;
      continue;
    }

    const fields = portState(session);
    const names = Object.keys(fields);
    const theirs = romState(rom, names);
    const bad = names.filter((n) => fields[n] !== theirs[n]).map((n) => `${n}: rom ${theirs[n]} port ${fields[n]}`);
    note(result.modes, kind);
    result.compared++;
    let maps = [];
    if (mode !== 'title' && session.game.fuel !== undefined) {
      maps = mapDifferences(rom, session);
      if (maps.length) bad.push(`map(${maps.length}: first at ${maps[0].index} rom ${maps[0].rom} port ${maps[0].port})`);
    }
    const visible = rom.machine.visible;
    // (the frame in which the ROM switches the display on after a set-up has no picture to compare: it was off when the frame began)
    if (capture && visible && (visible.mask & 0x18)) {
      const ppu = session.game.ppu;
      const first = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i; return -1; };
      let i = first(visible.vram, ppu.vram);
      if (i >= 0) bad.push(`vram at ${i} (${(i < 1024 ? 0x2000 : 0x2400) + (i & 1023)}): rom ${visible.vram[i]} port ${ppu.vram[i]}`);
      i = first(visible.palette.map((v, k) => ((k & 0x13) === 0x10 ? 0 : v)), ppu.palette.map((v, k) => ((k & 0x13) === 0x10 ? 0 : v)));   // $3F10, 14, 18, 1C mirror $3F00, 04, 08, 0C
      if (i >= 0) bad.push(`palette at ${i}: rom ${visible.palette[i]} port ${ppu.palette[i]}`);
      i = first(visible.oam, ppu.oam);
      if (i >= 0) bad.push(`ppu oam at ${i}: rom ${visible.oam[i]} port ${ppu.oam[i]}`);
      if (visible.log.some((e) => e.register === 7 || e.register === 'dma')) bad.push('the ROM wrote to the PPU after the end of vblank');
    }
    const sprites = oamDifferences(rom, session);
    if (sprites.length) bad.push(`oam(${sprites.length}: byte ${sprites[0].index} rom ${sprites[0].rom} port ${sprites[0].port})`);
    if (engine) {
      const out = rom.ram.subarray(FT_OUT_BUF, FT_OUT_BUF + 11);
      for (let i = 0; i < 11; i++) if (out[i] !== engine.lastRegs[i]) { bad.push(`sound byte ${i}: rom ${out[i]} port ${engine.lastRegs[i]}`); break; }
    }
    if (bad.length && fail(frame, kind, bad, { maps })) break;
    if (after) after(ctx);
  }
  return result;
}
