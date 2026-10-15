#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The executable oracle of Zooming Secretary: the ROM of v1.02 (30.12.11) is run on a small NES (tools/nes-machine.mjs) next to the port
// (public/src and public/web), the same buttons go to both, and after every iteration of the game's main loop the game's variables are
// compared (tools/rom-run.mjs, tools/js-run.mjs, tools/oracle-state.mjs). It also compares the program's front end (the title screen, the
// sound test, the choice of the level: tools/oracle-front.mjs), one pass of its loops at a time.
//
//   node tools/rom-oracle.mjs check    [--rounds N] [--bots idle,wander,answer] [--stages day1,dream,...] [--no-pauses] [--no-front]
//                                      [--no-chains] [--no-scenarios] [--front-seeds N] [scenario ...]
//   node tools/rom-oracle.mjs record   the same, and write what the ROM did to test/fixtures/rom-oracle.json
//   node tools/rom-oracle.mjs coverage what the scenarios do on the port (no ROM needed)
//   node tools/rom-oracle.mjs list
//
// The ROM is not in this repository (see reference/README.md). Its path is ZS_ROM, or --rom; its SHA-256 is checked.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenariosFor, pauseScenarios, play } from './oracle-scenarios.mjs';
import { chainsFor, playChain } from './oracle-chain.mjs';
import { frontScenarios, playFront } from './oracle-front.mjs';
import { checkRom } from './rom-run.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURE = join(ROOT, 'test', 'fixtures', 'rom-oracle.json');

const TOOL_FILES = ['tools/ram-map.mjs', 'tools/rom-run.mjs', 'tools/oracle-state.mjs', 'tools/oracle-front.mjs', 'tools/nes-machine.mjs', 'tools/mos6502.mjs'];
// What the recording depends on: how the ROM is run and how its state is read. If one of these changes the recording is stale.
export function toolsHash() {
  const hash = createHash('sha256');
  for (const f of TOOL_FILES) hash.update(f).update('\0').update(readFileSync(join(ROOT, f)).toString('utf8').replace(/\r\n/g, '\n'));
  return hash.digest('hex');
}

// Buttons as a string of bytes in base64, and the checksums as little-endian 32-bit words in base64: what the fixture holds.
// The checksums are the low 16 bits of each iteration's CRC-32.
export const pack = (bytes) => Buffer.from(bytes).toString('base64');
export const packWords = (words) => Buffer.from(new Uint8Array(new Uint16Array(words.map((w) => w & 0xffff)).buffer)).toString('base64');
export const unpack = (text) => new Uint8Array(Buffer.from(text, 'base64'));
export const unpackWords = (text) => { const b = Buffer.from(text, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };

function loadRom(argv) {
  const at = argv.indexOf('--rom');
  const path = at >= 0 ? argv[at + 1] : process.env.ZS_ROM;
  if (!path) { console.error('The ROM is needed: give its path in ZS_ROM or with --rom (reference/README.md says where it comes from).'); process.exit(2); }
  if (!existsSync(path)) { console.error(`no file at ${path}`); process.exit(2); }
  const rom = new Uint8Array(readFileSync(path));
  checkRom(rom);
  return rom;
}

const option = (argv, name, fallback) => { const at = argv.indexOf(name); return at >= 0 ? argv[at + 1] : fallback; };
const namesOf = (argv) => argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] ?? '').startsWith('--'));

function chosen(argv) {
  const rounds = Number(option(argv, '--rounds', '1'));
  const bots = option(argv, '--bots', 'idle,wander,answer').split(',');
  const stages = option(argv, '--stages', 'day1,day2,day3,day4,dream,day5,day6,day7').split(',');
  const names = namesOf(argv);
  let list = scenariosFor({ rounds, bots, stages });
  if (!argv.includes('--no-pauses')) list = [...list, ...pauseScenarios({ rounds, stages, bots: bots.filter((b) => b !== 'idle') })];
  if (names.length) list = list.filter((s) => names.includes(s.name));
  return list;
}

// The front-end scenarios, unless they are left out or the named scenarios are not among them.
function chosenFront(argv) {
  if (argv.includes('--no-front')) return [];
  const names = namesOf(argv);
  const list = frontScenarios({ seeds: Number(option(argv, '--front-seeds', '38')) });
  return names.length ? list.filter((s) => names.includes(s.name)) : list;
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (command === 'list') {
    for (const s of chosen(argv)) console.log(s.name.padEnd(24), `seed ${s.seed} missMax ${s.missMax} bot ${s.bot}${s.pauses ? ' with pauses' : ''}`);
    for (const s of chosenFront(argv)) console.log(s.name.padEnd(24), `front end: code ${s.plan.code}, sound test ${s.plan.sound ? 'tried' : 'not tried'}`);
    return;
  }

  if (command === 'coverage') {
    const total = {};
    const add = (key, n = 1) => { total[key] = (total[key] ?? 0) + n; };
    for (const s of chosen(argv)) {
      const r = play(s);
      for (const [k, v] of Object.entries(r.events)) add(k, v);
      add(`ended ${r.status}`);
      add('iterations', r.iterations);
    }
    for (const s of chosenFront(argv)) {
      const r = playFront(s);
      for (const p of r.phases) add(`front phase ${p}`);
      for (const e of new Set(r.events)) add(`front ${e}`);
      add(`front level ${r.level}`);
      add('front passes', r.passes.length);
    }
    console.log(JSON.stringify(total, null, 1));
    return;
  }

  if (command !== 'check' && command !== 'record') { console.error('usage: rom-oracle.mjs check|record|coverage|list'); process.exit(2); }
  const rom = loadRom(argv);
  const list = argv.includes('--no-scenarios') ? [] : chosen(argv);
  const fronts = chosenFront(argv);
  if (!list.length && !fronts.length && argv.includes('--no-chains')) { console.error('no scenario chosen'); process.exit(2); }
  let bad = 0, iterations = 0, passes = 0;
  const recorded = [], recordedChains = [], recordedFront = [];
  for (const s of list) {
    const t0 = Date.now();
    const r = play(s, { rom });
    iterations += r.iterations;
    if (r.difference) {
      bad++;
      console.log(`DIFFERENT ${s.name}: at ${r.difference.at}\n${r.difference.text}`);
    } else {
      console.log(`ok   ${s.name}: ${r.iterations} iterations, ${r.status}, ${Object.entries(r.events).filter(([k]) => k !== 'FALL_START' && k !== 'LAND').map(([k, v]) => `${k} ${v}`).join(', ') || 'no events'}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      recorded.push({ name: s.name, stage: s.stage, level: s.level, seed: s.seed, missMax: s.missMax, bot: s.bot, iterations: r.iterations, status: r.status, buttons: pack(r.buttons), crcs: packWords(r.crcs) });
    }
  }

  for (const s of fronts) {
    const t0 = Date.now();
    const r = playFront(s, { rom });
    passes += r.passes.length;
    iterations += r.stage?.buttons.length ?? 0;
    if (r.difference) { bad++; console.log(`DIFFERENT ${s.name}: at ${r.difference.at}\n${r.difference.text}`); continue; }
    console.log(`ok   ${s.name}: ${r.passes.length} passes (${[...r.phases].join(', ')}), ${[...new Set(r.events)].join(' ') || 'no events'}, level ${r.level}${r.stage ? `, ${r.stage.buttons.length} iterations of the stage` : ''}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    recordedFront.push({
      name: s.name, level: r.level, testMode: r.testMode, passes: pack(r.passes), crcs: packWords(r.crcs),
      stage: r.stage && { level: r.stage.level, seed: r.stage.seed, buttons: pack(r.stage.buttons), crcs: packWords(r.stage.crcs) },
    });
  }

  const chains = argv.includes('--no-chains') ? [] : chainsFor({ chains: Number(option(argv, '--chains', '5')) });
  for (const c of chains) {
    const t0 = Date.now();
    const r = playChain(c, { rom });
    const played = r.stages.reduce((n, s) => n + s.iterations, 0);
    iterations += played;
    if (r.difference) { bad++; console.log(`DIFFERENT ${c.name}: at ${r.difference.at}\n${r.difference.text}`); continue; }
    console.log(`ok   ${c.name}: title ${r.titleIterations} iterations, ${r.stages.length} stages (${r.stages.map((s) => `${s.level}:${s.status[0]}`).join(' ')}), ${played} iterations, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    recordedChains.push({
      name: c.name, titleFrames: c.titleFrames, titleIterations: r.titleIterations,
      stages: r.stages.map((s) => ({ level: s.level, missMax: s.missMax, seed: s.seed, iterations: s.iterations, status: s.status, buttons: pack(s.buttons), crcs: packWords(s.crcs) })),
    });
  }
  console.log(bad
    ? `${bad} of ${list.length + fronts.length + chains.length} runs differ from the ROM`
    : `everything agrees with the ROM (${list.length} scenarios, ${fronts.length} front ends of ${passes} passes, and ${chains.length} campaigns, ${iterations} iterations)`);
  if (command === 'record') {
    if (bad) { console.error('not recording: the port and the ROM differ'); process.exit(1); }
    mkdirSync(dirname(FIXTURE), { recursive: true });
    writeFileSync(FIXTURE, JSON.stringify({ rom: 'v1.02 30.12.11', tools: toolsHash(), scenarios: recorded, front: recordedFront, chains: recordedChains }) + '\n');
    console.log(`recorded ${recorded.length} scenarios, ${recordedFront.length} front ends and ${recordedChains.length} campaigns in ${FIXTURE}`);
  }
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
