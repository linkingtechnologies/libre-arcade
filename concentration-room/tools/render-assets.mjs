#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Makes the pictures of public/assets/derived/ (the title screen, the five opponents of the story and the Hombon logo) from the preserved ROM itself.
//
//   node tools/render-assets.mjs [--check]
//
// The ROM is run from reset to its title menu, then its routine doOpponentScene is called (with the scene number in A, found by its code)
// for the first scene of each opponent, and after 260 frames, when the picture is complete, the frame it would show is composed
// (tools/nes-frame.mjs). The text is not part of the picture: the page types it over the image, as the original does, so the rows
// from y = 136 down, where the text goes, are made the black of the screen. The pictures of the package, made by a Python script from
// the atlases and the opponent shape tables, put the character one line too high. The title picture is the frame of the title menu with
// the menu's four lines of text (rows 128 to 159) made white: the page writes the menu itself.
//
// With --check nothing is written: the files must already be exactly what the ROM gives.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRom } from './rom-oracle.mjs';
import { NesMachine } from './nes-machine.mjs';
import { encodePng, renderFrame } from './nes-frame.mjs';

const DERIVED = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'public', 'assets', 'derived');
export const TEXT_FROM_ROW = 136;
export const SCENE_FRAMES = 260;

// doOpponentScene begins PHA / LDX #$20 / LDA #0 / STA PPUMASK
export function findDoOpponentScene(machine) {
  const signature = [0x48, 0xA2, 0x20, 0xA9, 0x00, 0x8D, 0x01, 0x20], prg = machine.prg;
  const base = prg.length === 0x4000 ? 0xC000 : 0x8000;
  const at = [];
  for (let i = 0; i + signature.length <= prg.length; i++) if (signature.every((byte, k) => prg[i + k] === byte)) at.push(base + i);
  if (at.length !== 1) throw new Error(`found ${at.length} copies of doOpponentScene`);
  return at[0];
}

// The ROM booted to its title menu, as a machine restored from a snapshot taken once per ROM.
const boots = new WeakMap();
export function booted(rom) {
  let boot = boots.get(rom);
  if (!boot) { const machine = new NesMachine(rom); for (let i = 0; i < 400; i++) machine.frame(); boot = { machine, snapshot: machine.snapshot() }; boots.set(rom, boot); }
  return boot.machine.restore(boot.snapshot);
}

// What the ROM draws for scene number `scene` (0 to 14) when its text has been typed, as an RGBA frame.
export function opponentScene(rom, scene, frames = SCENE_FRAMES) {
  const machine = booted(rom);
  const entry = findDoOpponentScene(machine);
  machine.cpu.a = scene; machine.cpu.sp = 0xFD; machine.cpu.pc = entry;
  for (let i = 0; i < frames; i++) machine.frame();
  return renderFrame(machine);
}

// The Hombon logo of the opening screens is made of sprites; its picture is the white pixels of the ROM's frame once the logo is up
// and before any text has scrolled in (frame 8 after scrollOpeningText is called), on a transparent ground.
export function logoPicture(rom) {
  const machine = booted(rom);
  machine.cpu.a = 0; machine.cpu.sp = 0xFD; machine.cpu.pc = findScrollOpeningText(machine);
  for (let i = 0; i < 8; i++) machine.frame();
  const frame = renderFrame(machine);
  for (let i = 0; i < frame.width * frame.height; i++) {
    const o = i * 4, white = frame.rgba[o] === 255 && frame.rgba[o + 1] === 255 && frame.rgba[o + 2] === 255;
    frame.rgba[o] = frame.rgba[o + 1] = frame.rgba[o + 2] = 255; frame.rgba[o + 3] = white ? 255 : 0;
  }
  return encodePng(frame);
}

// scrollOpeningText begins ASL A / TAX / LDA #$10 / STA fadeValue: the first two instructions are followed by the fade value
// because the build ran the blocks of its first statements in reverse (see specs/port-map.md)
export function findScrollOpeningText(machine) {
  const signature = [0x0A, 0xAA, 0xA9, 0x10, 0x85, 0x0C], prg = machine.prg;
  const base = prg.length === 0x4000 ? 0xC000 : 0x8000;
  const at = [];
  for (let i = 0; i + signature.length <= prg.length; i++) if (signature.every((byte, k) => prg[i + k] === byte)) at.push(base + i);
  if (at.length !== 1) throw new Error(`found ${at.length} copies of scrollOpeningText`);
  return at[0];
}

export function titlePicture(rom) {
  const frame = renderFrame(booted(rom));
  for (let y = 128; y < 160; y++) for (let x = 0; x < frame.width; x++) { const o = (y * frame.width + x) * 4; frame.rgba[o] = frame.rgba[o + 1] = frame.rgba[o + 2] = 255; frame.rgba[o + 3] = 255; }
  return encodePng(frame);
}

export function opponentPicture(rom, opponent) {
  const frame = opponentScene(rom, opponent * 3);
  const black = [frame.rgba[(239 * 256) * 4], frame.rgba[(239 * 256) * 4 + 1], frame.rgba[(239 * 256) * 4 + 2]];
  for (let y = TEXT_FROM_ROW; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) { const o = (y * frame.width + x) * 4; frame.rgba[o] = black[0]; frame.rgba[o + 1] = black[1]; frame.rgba[o + 2] = black[2]; frame.rgba[o + 3] = 255; }
  }
  return encodePng(frame);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const rom = loadRom();
  let bad = 0;
  const pictures = [['title/title-screen-historical.png', () => titlePicture(rom)], ['story/hombon-sprites.png', () => logoPicture(rom)], ...[0, 1, 2, 3, 4].map((i) => [`story/opponent-${i}.png`, () => opponentPicture(rom, i)])];
  for (const [name, make] of pictures) {
    const file = join(DERIVED, name), png = make();
    if (check) { const same = Buffer.compare(readFileSync(file), png) === 0; if (!same) bad++; console.log(`${same ? 'same   ' : 'DIFFERS'} ${name}`); }
    else { writeFileSync(file, png); console.log(`wrote ${name} (${png.length} bytes)`); }
  }
  process.exitCode = bad ? 1 : 0;
}
