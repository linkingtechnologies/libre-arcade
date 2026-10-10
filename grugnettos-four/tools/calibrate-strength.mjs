#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// Replays the Arena calibration behind the six difficulty levels and compares
// it with the frozen snapshot in public/src/strength/strength-snapshot.js.
// Every registered player plays every other one, twice per seed (once as each
// colour), for each snapshot seed. The snapshot's own seeds and per-player
// settings are used; entries are taken in registry order because the Arena
// derives each pairing's seed from its position in that order.
//
//   node tools/calibrate-strength.mjs            # compare with the snapshot
//   node tools/calibrate-strength.mjs --json     # also print the recomputed rows

import { players } from '../public/src/players/registry.js';
import { runStrengthLab } from '../public/arena/strength-lab.js';
import { strengthSnapshot } from '../public/src/strength/strength-snapshot.js';

const settingById = new Map(strengthSnapshot.ratings.map((row) => [row[0], row[1]]));
const entries = players.map((definition) => {
  const setting = settingById.get(definition.id);
  if (setting === undefined) throw new Error(`No snapshot setting for ${definition.id}`);
  return { id: definition.id, factory: () => definition.create({ [definition.settings.key]: Number(setting) }) };
});

const started = performance.now();
const lab = runStrengthLab(entries, strengthSnapshot.seeds);
const seconds = ((performance.now() - started) / 1000).toFixed(0);

const recomputed = new Map(lab.ratings.map((row) => [row.player, row]));
let identical = 0;
const differences = [];
for (const [id, setting, rating, low, high, wins, draws, losses] of strengthSnapshot.ratings) {
  const row = recomputed.get(id);
  const same = row && row.rating === rating && row.ratingLow === low && row.ratingHigh === high && row.wins === wins && row.draws === draws && row.losses === losses;
  if (same) identical += 1;
  else differences.push({ id, setting, snapshot: [rating, low, high, wins, draws, losses], recomputed: row ? [row.rating, row.ratingLow, row.ratingHigh, row.wins, row.draws, row.losses] : null });
}

console.log(`Replayed ${lab.games} games (${strengthSnapshot.games} in the snapshot) over ${strengthSnapshot.seeds.length} seeds in ${seconds}s.`);
console.log(`${identical} of ${strengthSnapshot.ratings.length} players reproduce the snapshot row exactly (rating, interval, W/D/L).`);
for (const difference of differences) console.log('DIFFERENT', JSON.stringify(difference));
if (process.argv.includes('--json')) console.log(JSON.stringify(lab.ratings.map((row) => [row.player, settingById.get(row.player), row.rating, row.ratingLow, row.ratingHigh, row.wins, row.draws, row.losses])));
process.exit(differences.length || lab.games !== strengthSnapshot.games ? 1 : 0);
