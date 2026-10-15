// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs the Zooming Secretary v1.02 ROM on tools/nes-machine.mjs, to the start of a chosen stage with a chosen random seed, and then one
// iteration of the game's main loop at a time with the buttons the caller says, and reads the game's variables out of RAM
// (tools/ram-map.mjs) as the normalised state that tools/js-run.mjs gives for the port.
//
// How a stage is reached. The title screen is left with START as a player does. `main` then writes `level = 0`, `calls_missed_max = 3`
// and `calls_missed_level`; the program is made to write the level asked for (and the allowance of missed calls asked for) in the same
// place, which is a poke into RAM and nothing else. `game_loop` starts by writing `calls_level`; at that moment the random generator's
// byte is set to the seed asked for, because on a console it comes from how long the player stayed on the title screen. Everything
// from there on, the stage's set-up included, is the program's own code. The first state the oracle compares is the one at the first
// pass through the top of the loop (`frame_cnt` has just become 1).
//
// One iteration of the loop. `ppu_waitnmi()` returns after the NMI at the start of a frame; the iteration's logic then reads the
// controller and runs, and the loop goes round to its top (the `if(pause==25)` that begins `game_loop`'s `while(1)`), where the next
// iteration starts. The buttons for iteration k are the ones held when the frame that releases its wait begins, and the state that is
// read is the one the program has at the top of the loop, before the next iteration has done anything: the machine copies the RAM at
// every execution of that instruction (found in the ROM by its bytes, `findLoopTop`). A paused game goes round the same loop without
// counting frames, so the iteration is the pass through the loop and not the frame counter. A frame is one NMI; the program's library
// skips one in six on the console that is modelled, so an iteration takes one frame or two, and a pass that takes more than six means
// the program overran a frame (the port has no such thing as a slow frame), and the run stops with an error.
//
// The front end (the title screen, the sound test and the screen with the number of the level) is read the same way, one pass at a time,
// with `front: true`: the passes end where the program calls `ppu_waitnmi()` (`findWaitNmi`).

import { createHash } from 'node:crypto';
import { NesMachine } from './nes-machine.mjs';
import { RAND_SEED, ROM_SHA256, address, reader } from './ram-map.mjs';

export const PAD = Object.freeze({ A: 1, B: 2, SELECT: 4, START: 8, UP: 16, DOWN: 32, LEFT: 64, RIGHT: 128 });

// The machine shifts the controller byte out from its top bit, A first; the game's own constants have A at bit 0.
export const machinePad = (buttons) => { let r = 0; for (let i = 0; i < 8; i++) if (buttons & (1 << i)) r |= 1 << (7 - i); return r; };

const NPC_TYPES = { 0x11: 'chief', 0x12: 'bouncer', 0x13: 'chatter', 0x14: 'geek', 0x15: 'manbox', 0x16: 'dibrov', 0x17: 'ghost' };

// The two places of the program that mark a pass of a loop, found by their bytes so that no address of the ROM is written down here.
// `lda pause; cmp #25; bne ...; jsr pad_trigger; sta state; and #8` is the top of game_loop's loop; the library's ppu_waitnmi is
// `lda #1; sta zp; lda zp; cmp zp; beq *-2; lda zp; beq ...; lda zp; cmp #5; beq *-4; lda #0; sta zp; rts`.
function findCode(rom, pattern, what) {
  const prg = rom.subarray(16, 16 + 32768);
  const hits = [];
  for (let i = 0; i + pattern.length <= prg.length; i++) if (pattern.every((b, k) => b === null || prg[i + k] === b)) hits.push(0x8000 + i);
  if (hits.length !== 1) throw new Error(`expected one ${what} in the ROM, found ${hits.length}`);
  return hits[0];
}
export function findLoopTop(rom) {
  const [pause, state] = [address('pause'), address('state')];
  return findCode(rom, [0xad, pause & 0xff, pause >> 8, 0xc9, 25, 0xd0, null, 0x20, null, null, 0x8d, state & 0xff, state >> 8, 0x29, 0x08], 'top of the main loop');
}
export function findWaitNmi(rom) {
  return findCode(rom, [0xa9, 0x01, 0x85, null, 0xa5, null, 0xc5, null, 0xf0, 0xfc, 0xa5, null, 0xf0, 0x06, 0xa5, null, 0xc9, 0x05, 0xf0, 0xfa, 0xa9, 0x00, 0x85, null, 0x60], 'ppu_waitnmi');
}

export function checkRom(rom) {
  const hash = createHash('sha256').update(rom).digest('hex');
  if (hash !== ROM_SHA256) throw new Error(`this is not Zooming Secretary v1.02: SHA-256 ${hash}, expected ${ROM_SHA256}`);
}

export class RomGame {
  // `level`, `seed` and `missMax` are poked in as the header of this file says; null leaves what the program itself does (the stage that
  // comes after the title, the seed that the time on the title screen made, an allowance of 3). `titleFrames` is how many frames the
  // title screen is shown before START is pressed.
  // `front` leaves the ROM at the first pass of the title screen's loop, to be driven with passStep() (see the header).
  constructor(rom, { level = null, seed = null, missMax = null, titleFrames = 60, front = false } = {}) {
    checkRom(rom);
    this.m = new NesMachine(rom);
    this.read = reader(this.m.ram);
    this.loopTop = findLoopTop(rom);
    this.waitNmi = findWaitNmi(rom);
    this.snapRam = new Uint8Array(this.m.ram.length);       // the RAM at the last execution of the top of the loop
    this.snapRead = reader(this.snapRam);
    this.topHits = 0;                                       // how many times the top of the loop has run
    this.initHits = 0;                                      // ... when the last stage began
    this.waitHits = 0;                                      // how many times ppu_waitnmi has been called
    this.titleBegun = false;
    this.pokes = [];
    this.stageInits = 0;                       // how many times game_loop has started a stage
    this.startSeeds = [];                      // the random generator's byte at the start of each stage, before the stage's own set-up
    this.titleIterations = null;               // how many times the title screen's loop ran before START (rand16() once each)
    const started = { yes: front };
    let lastFrameWrite = 0;
    const [LEVEL, MISS_MAX, CALLS_LEVEL, FRAME] = [address('level'), address('calls_missed_max'), address('calls_level'), address('frame_cnt')];
    this.m.writeHook = (a, v) => {
      if (!started.yes) return;
      if (a === FRAME) {
        if (front && !this.titleBegun && this.waitHits >= 1 && v === 0) { this.titleBegun = true; this.titleBegunAt = this.waitHits; }   // title_screen's `frame_cnt=0`, after the program's first wait
        if (v === 4 && this.titleIterations === null) this.titleIterations = lastFrameWrite;   // the title's loop ended: frame_cnt is set to 4
        lastFrameWrite = v;
      } else if (a === LEVEL && v === 0 && level !== null && this.stageInits === 0) this.pokes.push([LEVEL, level]);
      else if (a === MISS_MAX && v === 3 && missMax !== null && this.stageInits === 0) this.pokes.push([MISS_MAX, missMax]);
      else if (a === CALLS_LEVEL) {
        if (seed !== null && this.stageInits === 0) this.pokes.push([RAND_SEED, seed & 0xff]);
        this.startSeeds.push(seed !== null && this.stageInits === 0 ? seed & 0xff : this.m.ram[RAND_SEED]);
        this.stageInits++;
        this.initHits = this.topHits;
      }
    };
    this.m.beforeStep = (cpu) => {
      while (this.pokes.length) { const [a, v] = this.pokes.shift(); this.m.ram[a] = v; }
      if (cpu.pc === this.loopTop) { this.snapRam.set(this.m.ram); this.topHits++; } else if (cpu.pc === this.waitNmi) this.waitHits++;
    };
    if (front) {
      for (let f = 0; f < 600 && !(this.titleBegun && this.waitHits > this.titleBegunAt); f++) this.m.frame();
      if (!this.titleBegun) throw new Error('the ROM did not reach its title screen');
      this.frames = 0;
      return;
    }
    for (let f = 0; f < titleFrames; f++) this.m.frame();                          // the title screen
    started.yes = true;
    lastFrameWrite = this.read.get('frame_cnt');
    this.m.pad[0] = machinePad(PAD.START);
    for (let f = 0; f < 3; f++) this.m.frame();
    this.m.pad[0] = 0;
    this.runToStageStart(900);
    if (level !== null && this.read.get('level') !== level) throw new Error('the ROM did not reach the stage asked for');
  }

  // Runs until game_loop has started another stage and has come to the top of its loop for the first time.
  // With `already`, the stage has begun (the front end ran into it) and only its first top of the loop is waited for.
  runToStageStart(maxFrames, { already = false } = {}) {
    const wanted = already ? this.stageInits : this.stageInits + 1;
    for (let f = 0; f < maxFrames; f++) {
      this.m.frame();
      if (this.stageInits >= wanted && this.topHits > this.initHits && this.read.get('calls_level') > 0) {
        this.frames = 0;
        this.laggedFrames = 0;                  // frames beyond the first that an iteration needed (the program overran a frame)
        this.ended = false;                     // the iteration just run was the last one: the loop was left
        return;
      }
    }
    throw new Error('the ROM did not reach a stage');
  }

  // After a stage has ended: lets the program go through the screens that follow (the level number, the game over screen, the ending)
  // without any button, to the start of the stage it goes on to. The random generator is not touched.
  nextStage() { this.m.pad[0] = 0; this.runToStageStart(3000); }

  // One iteration of the main loop with `buttons` held (a bit mask of PAD.*).
  step(buttons) {
    this.m.pad[0] = machinePad(buttons);
    const hits = this.topHits;
    let frames = 0;
    for (;;) {
      this.m.frame();
      frames++;
      if (this.finished) { this.ended = true; this.frames++; return; }          // the loop was left: there is no top of the next iteration
      if (this.topHits > hits) break;
      if (frames > 6) throw new Error(`the ROM did not finish iteration ${this.frames + 1} in 6 frames`);
    }
    if (this.topHits !== hits + 1) throw new Error(`the top of the loop ran ${this.topHits - hits} times in iteration ${this.frames + 1}`);
    this.frames++;
    if (frames > 1) this.laggedFrames += frames - 1;
  }

  // The front end, one pass at a time (`front: true`): the pad is held for one pass of the program's loop, which ends at its next
  // ppu_waitnmi(). Returns the program's variables that the front end's rules decide.
  passStep(buttons) {
    this.m.pad[0] = machinePad(buttons);
    const before = this.waitHits;
    for (let f = 0; this.waitHits === before; f++) {
      if (f > 120) throw new Error('the ROM did not wait for the next frame in 120 frames');   // a stage's set-up runs with the picture off and takes several
      this.m.frame();
    }
    this.frames++;
  }

  frontState() {
    const r = this.read;
    return { rng: this.m.ram[RAND_SEED], i: r.get('i'), testMode: r.get('test_mode'), level: r.get('level'), column: r.get('j'), effect: r.get('px'), tune: r.get('py'), missMax: r.get('calls_missed_max') };
  }

  // True once the loop has left (a stage won, lost, or the Dream caught): the next frames are the program's end-of-stage screens.
  get finished() {
    const r = this.read;
    return r.get('calls_count') === r.get('calls_level') || r.get('calls_missed') === r.get('calls_missed_level') || r.get('player_catch') !== 0;
  }

  // The state at the top of the loop (what the program had when the last iteration finished), or, if the loop was left, as it is.
  state() {
    const r = this.ended ? this.read : this.snapRead;
    const ram = this.ended ? this.m.ram : this.snapRam;
    const bonus = r.get('bonus') !== 0;
    const phones = [];
    for (let i = 0; i < r.get('phone_all'); i++) {
      phones.push({
        x: r.get('phone_x', i), y: r.get('phone_y', i), cnt: r.get('phone_cnt', i), level: r.get('phone_level', i),
        topic: bonus ? null : r.get('phone_topic', i),
      });
    }
    const topics = [];
    for (let i = 0; i < r.get('topic_all'); i++) {
      const id = r.get('topic_id', i);
      topics.push({ id, x: r.get('topic_x', i), y: r.get('topic_y', i), msg: r.get('topic_msg', id) });
    }
    let npc = null;
    if (r.get('npc_all')) {
      const type = NPC_TYPES[r.get('npc_type')];
      npc = { type, x: r.signed('npc_x'), y: r.signed('npc_y'), dir: r.get('npc_dir'), cnt: r.get('npc_cnt'), wait: r.get('npc_wait'), speed: r.get('npc_speed') };
      if (type === 'chief') { npc.tx = r.get('npc_tx'); npc.ty = r.get('npc_ty'); }
      if (type === 'ghost') { npc.dx = r.signed('npc_dx'); npc.dy = r.signed('npc_dy'); }
    }
    return {
      rng: ram[RAND_SEED],
      pause: r.get('pause'),
      frame: r.get('frame_cnt'),
      ring: r.get('ring_cnt'),
      calls: r.get('calls_count'), missed: r.get('calls_missed'), callDelay: r.get('call_delay'),
      player: {
        x: r.signed('player_x'), y: r.get('player_y'), ladder: r.get('player_ladder'), dir: r.get('player_dir'), dirPrev: r.get('player_dir_prev'),
        dirCnt: r.get('player_dir_cnt'), floor: r.get('player_floor'), topic: r.get('player_topic'), speed: r.get('player_speed'),
        speedTo: r.get('player_speed_to'), coffee: r.get('player_coffee'), slowdown: r.get('player_slowdown'), knocked: r.get('player_knocked'),
        knockedAnim: r.get('player_knocked_anim'), wisdom: r.get('player_wisdom'), catch: r.get('player_catch'), answer: r.get('player_answer'),
        stepAnim: r.get('player_step_anim'),
      },
      coffee: r.get('coffee_y') ? { x: r.get('coffee_x'), y: r.get('coffee_y'), wait: r.get('coffee_wait') } : null,
      phones, topics, npc,
      hearts: { ptr: r.get('heart_ptr'), life: Array.from({ length: 8 }, (_, i) => (r.get('heart_y', i) === 240 ? 0 : r.get('heart_cnt', i))) },
      dream: bonus ? { runaway: r.get('phone_runaway'), runawayMax: r.get('phone_runaway_max'), table: r.get('table_cur') } : null,
    };
  }
}
