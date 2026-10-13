#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// For finding out what a difference is: plays a scenario on both and prints, for each slot in a range, how the state texts differ.
//   node tools/oracle-trace.mjs <scenario> <from> <to> [--lines C0,P0]     (slots)
import { runPort } from './oracle-port.mjs';
import { SCENARIOS, writeScenario } from './oracle-scenarios.mjs';
import { runOriginal } from './java-oracle.mjs';

const [name, fromText, toText, ...rest] = process.argv.slice(2);
const spec = SCENARIOS.find((s) => s.name === name);
if (!spec) { console.log('usage: oracle-trace.mjs <scenario> <from> <to> [--lines A,B]'); process.exit(1); }
const from = Number(fromText), to = Number(toText);
const lineOption = rest.indexOf('--lines');
const only = lineOption >= 0 ? rest[lineOption + 1].split(',') : null;
const scenario = writeScenario({ ...spec, slots: Math.min(spec.slots, to + 1) });
const slots = [];
for (let s = from; s <= to; s++) slots.push(s);
const port = runPort(scenario, { textAt: new Set(slots) });
const original = await runOriginal(scenario, slots);

for (const slot of slots) {
  const a = original.texts.get(slot).split('\n'), b = port.texts.get(slot).split('\n');
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    const label = (a[i] ?? b[i] ?? '').split(' ')[0];
    if (only && !only.includes(label)) continue;
    const left = (a[i] ?? '').split(/[ ,]/), right = (b[i] ?? '').split(/[ ,]/);
    const diffs = [];
    for (let k = 0; k < Math.max(left.length, right.length); k++) if (left[k] !== right[k]) diffs.push(`#${k}: ${left[k]}/${right[k]}`);
    out.push(`${label}[${diffs.length}] ${diffs.slice(0, 6).join(' ')}`);
  }
  console.log(`slot ${slot} (${(slot / 10).toFixed(1)} s): ${out.length ? out.join(' | ') : 'same'}`);
}
