// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Plays the oracle's scenarios from the command line and prints what each found.
//   node tools/oracle.mjs                 the scenarios of tools/scenarios.mjs
//   node tools/oracle.mjs levels [a b]    every level (or levels a to b) started by its passcode
//   node tools/oracle.mjs campaign [n]    the bot plays on from the first level for n ticks (20,000 takes about as many levels as are exact)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS, campaign, levelScenario, run } from './scenarios.mjs';

const ROM = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference', 'release', 'Lan_Master.nes');
const rom = new Uint8Array(readFileSync(ROM));
const [, , mode, a, b] = process.argv;
const list = mode === 'campaign' ? [campaign(Number(a ?? 20000))] : mode === 'levels' ? Array.from({ length: (Number(b ?? 50)) - Number(a ?? 1) + 1 }, (_, i) => levelScenario(Number(a ?? 1) + i)) : SCENARIOS;
let bad = 0;
for (const scenario of list) {
  const t = Date.now();
  const r = run(scenario, rom);
  const ok = !r.pictures && !r.states && !r.audioProblems.length;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.name}: ${r.ticks} ticks, ${r.compared.picture} pictures, ${r.compared.state} states; differences: pictures ${r.pictures}, states ${r.states}, sounds ${r.audioProblems.length} (${Date.now() - t} ms)`);
  if (!ok) for (const m of r.mismatches) console.log(`      ${m.kind} at tick ${m.tick}: ${m.text}`);
  if (!ok) for (const p of r.audioProblems.slice(0, 4)) console.log(`      sound: ${p}`);
}
process.exitCode = bad ? 1 : 0;
