#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The long runs of the executable oracle (npm run test:live): every scenario against both ROMs for several seeds, with the game's
// variables, the picture unit's memories, the sound buffer and the pictures all compared, and then the sound sweep that plays every
// tune past its loop and starts every effect. It takes about an hour for the default seeds (230,000 frames of scenarios per seed and
// ROM, each with its picture compared); run one ROM in each of two terminals to halve that. Options:
//   --seeds 1,2,3   the seeds of the scenarios (default 1,2)
//   --short         the lengths that `npm test` uses (they were chosen for seeds 1 and 2: with another seed a short run may stop before
//                   it has reached every milestone it is meant to cover, which is reported as "short" and is not a difference from the ROM)
//   --flavour v1.1  one program only (v1.1: the competition ROM; v1.12: the source assembled here; v1.12-release: the author's own v1.12 ROM)
// Exit code 1 if anything differs from the ROM.

import { SCENARIOS, SOUND_SWEEP, TUNE_LOOPS, runScenario, failures } from './oracle.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const seeds = option('--seeds', '1,2').split(',').map(Number);
const flavours = option('--flavour', null) ? [option('--flavour')] : ['v1.1', 'v1.12', 'v1.12-release'];
const short = args.includes('--short');
let failed = 0, thin = 0;

for (const flavour of flavours) {
  const lengths = new Map();                                      // set-ups that took a different number of NMIs from the port's table
  for (const scenario of SCENARIOS) {
    for (const seed of seeds) {
      const frames = short ? scenario.short : scenario.long;
      const t0 = Date.now();
      const r = runScenario({ flavour, frames, pad: scenario.make(seed), pictureEvery: short ? 4 : 1 });
      const problems = failures(r);
      for (const u of r.setups) {
        if (u.nmis === u.expected) continue;
        const key = `${u.from} -> ${u.next}: the ROM took ${u.nmis}, the port's table says ${u.expected}`;
        lengths.set(key, (lengths.get(key) ?? 0) + 1);
      }
      const missed = short ? scenario.expect.filter((name) => !r.events.get(name)) : [];
      const ok = problems.length === 0;
      if (!ok) failed++;
      else if (missed.length) thin++;
      console.log(`${!ok ? 'FAIL' : missed.length ? 'short' : 'ok  '} ${flavour} ${scenario.id} seed ${seed}: ${r.compared} frames, ${r.pictures.frames} pictures, ${r.setups.length} screens set up, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      for (const line of problems) console.log(`     ${line}`);
      if (missed.length) console.log(`     did not reach: ${missed.join(', ')}`);
    }
  }
  if (lengths.size) console.log(`note ${flavour}: set-ups of another length than the port's table (the port followed the ROM):\n${[...lengths].map(([k, n]) => `     ${k} (${n} times)`).join('\n')}`);
  // the sound sweep
  const tracks = new Map(), effects = new Set();
  for (const sweep of SOUND_SWEEP) {
    const r = runScenario({ flavour, frames: sweep.frames, pad: sweep.make(), pictures: false });
    for (const [k, v] of r.sound.longest) tracks.set(k, Math.max(tracks.get(k) ?? 0, v));
    for (const id of r.sound.effects.keys()) effects.add(id);
    if (r.mismatches.length) { failed++; console.log(`FAIL ${flavour} sound sweep ${sweep.id}: frame ${r.mismatches[0].frame}: ${r.mismatches[0].fields.join(' | ')}`); }
  }
  const short_ = Object.entries(TUNE_LOOPS).filter(([tune, loop]) => (tracks.get(tune) ?? 0) <= loop).map(([tune]) => tune);
  const missing = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13].filter((id) => !effects.has(id));
  if (short_.length || missing.length) { failed++; console.log(`FAIL ${flavour} sound sweep: tunes not heard past their loop: ${short_.join(' ') || 'none'}; effects never started: ${missing.join(' ') || 'none'}`); }
  else console.log(`ok   ${flavour} sound sweep: ${Object.keys(TUNE_LOOPS).length} tunes heard past their loops, all effects started`);
}
console.log(failed ? `${failed} run(s) differ from the ROM` : 'everything agrees with the ROM');
if (thin) console.log(`${thin} short run(s) stopped before every milestone was reached (the comparison itself found no difference)`);
process.exit(failed ? 1 : 0);
