// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The executable oracle: the preserved Lawn Mower ROM is run on the minimal NES (tools/nes-machine.mjs, tools/mos6502.mjs) next to
// the port's game logic (public/src/session.js), frame by frame, and the game's variables in the ROM's memory are compared with
// the port's at the end of every NMI. The variables are at fixed addresses (the zero page map at the top of game.asm), so nothing
// has to be found in the ROM's code.
//
// Two ROMs can be run:
//   * the competition ROM v1.1 (reference/competition/Lawn_Mower.nes), the author's own executable and the strongest evidence;
//   * the v1.12 source assembled here (tools/assemble.mjs), which is what the port was written from. It is NOT the author's binary
//     (the exact output of his assembler has not been reproduced); it is used because the port follows this source, and the two
//     differ in one place that is known (see ROM_FLAVOURS).
//
// Inputs are scenarios: a function that gives the pad for every frame. The ROM sees the pad through $4016 as a console would; the
// port is given the same pad the way the page gives it (held directions, and a START press that waits for a processed NMI).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NesMachine } from './nes-machine.mjs';
import { assembleSource } from './assemble.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
export const ROM_V11 = here('../reference/competition/Lawn_Mower.nes');
export const SOURCE_V112 = here('../reference/source-v1.12');
export const ROM_V112_RELEASE = here('../reference/release-v1.12/Lawn_Mower.nes');

export const PAD = Object.freeze({ A: 1, B: 2, SELECT: 4, START: 8, UP: 0x10, DOWN: 0x20, LEFT: 0x40, RIGHT: 0x80 });
// The game's pad bits have A at the bottom and RIGHT at the top; the machine shifts the byte out from its top bit, A first.
export function machinePad(game) {
  let out = 0;
  for (let i = 0; i < 8; i++) if (game & (1 << i)) out |= 0x80 >> i;
  return out;
}

// The three programs, and what the port is told to do to follow each. 'v1.12-release' is the author's own build of v1.12 (the Internet
// Archive's zip); 'v1.12' is the same source assembled here, which behaves the same but is laid out differently. `checkPadClearsDirection` is the one place where v1.1 and v1.12 differ
// in what the game does (M2 report, confirmed here): in its no-control path (level cleared or tank empty) v1.1 clears GAME_DIR_NEW.
export const ROM_FLAVOURS = Object.freeze({
  'v1.1': { checkPadClearsDirection: true },
  'v1.12': { checkPadClearsDirection: false },
  'v1.12-release': { checkPadClearsDirection: false },
});

export function loadRom(flavour = 'v1.1') {
  if (flavour === 'v1.1') return new Uint8Array(readFileSync(ROM_V11));
  if (flavour === 'v1.12') return new Uint8Array(assembleSource(SOURCE_V112).rom);
  if (flavour === 'v1.12-release') return new Uint8Array(readFileSync(ROM_V112_RELEASE));
  throw new Error(`unknown ROM flavour ${flavour}`);
}

// Zero page map of game.asm: name -> [address, size]. Sizes are bytes, little endian.
export const VARS = Object.freeze({
  frameCount: [0xff, 1], frameCount2: [0xfe, 1], seed: [0xfd, 1],
  ntsc: [0xeb, 1],
  playerX: [0xe9, 2], playerY: [0xe7, 2], dir: [0xe6, 1], dirNew: [0xe5, 1], dirPrev: [0xc5, 1],
  speed: [0xd4, 1], speedP: [0xe1, 2], speedM: [0xdf, 2], offset: [0xd9, 2],
  tileX: [0xd8, 1], tileY: [0xd7, 1], updateX: [0xd3, 1], updateY: [0xd2, 1],
  done: [0xd0, 2], doneInc: [0xce, 2], doneCount: [0xcc, 2], doneScr: [0xb2, 1],
  fuel: [0xcb, 1], level: [0xca, 1], mapWidth: [0xc9, 1], camMax: [0xc7, 2], camX: [0xd5, 2],
  paused: [0xc6, 1], chrAnim: [0xc4, 1], delay: [0xc3, 1], flashCnt: [0xc2, 1],
  fuelX: [0xc1, 1], fuelY: [0xc0, 1], fuelTime: [0xbc, 2], fuelNX: [0xb8, 1], fuelNY: [0xb7, 1],
  camShake: [0xba, 1], boost: [0xb9, 1], lskip: [0xb4, 1], grassType: [0xb3, 1], checkExit: [0xb1, 1],
  palBright: [0xef, 1], palMode: [0xee, 1],
  padState: [0xf9, 1], padStateP: [0xf8, 1], padStateT: [0xf7, 1],
  titleX0: [0x80, 2], titleX1: [0x82, 2], titleStart: [0x84, 1], titleOff: [0x85, 1], titlePalAnim: [0x91, 1],
});
export const MAP_ADDRESS = 0x300, MAP_SIZE = 512;

export class RomGame {
  constructor(rom) {
    this.machine = new NesMachine(rom);
    this.ram = this.machine.ram;
  }

  read(name) {
    const [address, size] = VARS[name];
    return size === 2 ? this.ram[address] | (this.ram[address + 1] << 8) : this.ram[address];
  }

  get map() { return this.ram.subarray(MAP_ADDRESS, MAP_ADDRESS + MAP_SIZE); }

  // Runs to the first frame of the title screen: the display has been switched on and the game waits for START.
  boot(limit = 600) {
    for (let i = 0; i < limit && this.machine.ppuMask !== 0x1e; i++) this.machine.frame();
    if (this.machine.ppuMask !== 0x1e) throw new Error('the ROM did not reach its title screen');
    return this;
  }

  frame(game = 0) {
    this.machine.pad[0] = machinePad(game);
    this.machine.frame();
  }

  get screenOn() { return (this.machine.ppuMask & 0x18) !== 0; }
}

// The port's state, in the ROM's terms, for the fields that exist in both.
export function portState(session) {
  const g = session.game;
  const has = g.mode !== 'title';
  const out = {
    frameCount: g.frameCount, frameCount2: g.frameCount2, seed: g.rng.state,
    padState: g.padState, padStateP: g.padStateP, padStateT: g.padStateT,
  };
  if (g.mode === 'title') {
    out.titleX0 = g.titleX0; out.titleX1 = g.titleX1; out.titleStart = g.titleStartCounter; out.titlePalAnim = g.titlePalAnim;
    out.titleOff = g.titleOff; out.lskip = g.levelSkip ? 1 : 0;
    return out;
  }
  if (!has || g.fuel === undefined) return out;
  // The original keeps the countdowns of its level-clear, out-of-fuel and final-screen loops in GAME_DELAY; the port keeps them apart.
  let delay = g.delay;
  const flow = g.mode === 'level-clear' || g.mode === 'out-of-fuel';
  if (flow) delay = g.flowPhase === 'delay' ? g.sequenceDelay : g.flowPhase === 'message-fade' ? g.messageFade : 0;
  else if (g.mode === 'complete') delay = g.flowPhase === 'fade' ? g.messageFade : g.sequenceDelay;
  if (flow && (g.flowPhase === 'message-wait' || g.flowPhase === 'message-fade')) out.flashCnt = g.messageFlash;
  if (flow && g.flowPhase === 'message-reveal') { out.updateY = g.messageReveal; out.updateX = g.updateX; }
  return Object.assign(out, {
    chrAnim: session.chrAnim, level: g.levelIndex, mapWidth: g.width, playerX: g.playerXRaw, playerY: g.playerYRaw, dir: g.direction, dirNew: g.newDirection,
    dirPrev: g.prevDirection, speed: g.speed, offset: g.offsetRaw, fuel: g.fuel, delay, fuelTime: g.fuelTime,
    fuelX: g.fuelX, fuelY: g.fuelY, fuelNX: g.pendingFuelX, fuelNY: g.pendingFuelY, doneCount: g.doneCount, done: g.doneRaw,
    paused: g.paused ? 1 : 0, boost: g.boost ? 1 : 0, checkExit: g.checkExit ? 1 : 0, grassType: g.grassType,
    camShake: g.cameraShake ? 1 : 0, camX: g.cameraX,
  });
}

export function romState(rom, names) {
  const out = {};
  for (const name of names) out[name] = rom.read(name);
  return out;
}

export function mapDifferences(rom, session) {
  const a = rom.map, b = session.game.map, out = [];
  for (let i = 0; i < MAP_SIZE; i++) if (a[i] !== b[i]) out.push({ index: i, rom: a[i], port: b[i] });
  return out;
}

export const OAM_ADDRESS = 0x200;
export function oamDifferences(rom, session) {
  const a = rom.ram.subarray(OAM_ADDRESS, OAM_ADDRESS + 256), b = session.game.oam, out = [];
  for (let i = 0; i < 256; i++) if (a[i] !== b[i]) out.push({ index: i, rom: a[i], port: b[i] });
  return out;
}

// The two packed nametables the page loads (public/assets/*.rle), as the kernel takes them.
export function loadScreens() {
  const read = (name) => new Uint8Array(readFileSync(fileURLToPath(new URL(`../public/assets/${name}.rle`, import.meta.url))));
  return { title: read('title'), done: read('done') };
}
