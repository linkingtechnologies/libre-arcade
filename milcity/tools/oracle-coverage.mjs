#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// What the oracle's scenarios reach. A comparison proves something only where the games do something: this plays the scenarios on
// the port and counts the situations that were visited, so that a scenario that never fires a nuke, never loses, or never has a
// building destroyed shows up as such.
//   node tools/oracle-coverage.mjs
import { Game } from '../public/src/core/game.js';
import { CONFIG } from '../public/src/core/config.js';
import { runPort } from './oracle-port.mjs';
import { SCENARIOS, writeScenario } from './oracle-scenarios.mjs';

const WEAPON_NAMES = Object.keys(CONFIG.weapons);
const BUILDING_NAMES = Object.keys(CONFIG.buildings);

export function visit(scenario) {
  const seen = {
    built: Object.fromEntries(BUILDING_NAMES.map((k) => [k, { person: 0, computer: 0 }])),
    fired: Object.fromEntries(WEAPON_NAMES.map((k) => [k, { person: 0, computer: 0 }])),
    shieldCells: 0, shieldExpired: 0, hitsOnBuildings: 0, destroyedBuildings: 0, personScore: 0, crater: 0,
    ended: null, radarSlots: 0, rejectedBuilds: 0, rejectedShots: 0,
  };
  let previous = null;
  const result = runPort(scenario, {
    onSlot(game) {
      const people = game.players;
      const snapshotNow = people.map((p) => ({ ammo: { ...p.ammo }, built: p.grid.buildings.length, shields: p.grid.shields.length, cannot: p.cannotFireBefore }));
      if (previous) {
        people.forEach((p, i) => {
          const before = previous[i], who = i === 0 ? 'person' : 'computer';
          for (const k of WEAPON_NAMES) if (p.ammo[k] < before.ammo[k]) seen.fired[k][who] += before.ammo[k] - p.ammo[k];
          if (p.grid.shields.length < before.shields) seen.shieldExpired += before.shields - p.grid.shields.length;
        });
      }
      previous = snapshotNow;
    },
  });
  const game = result.game;
  game.players.forEach((p, i) => {
    for (const b of p.grid.buildings) {
      const name = BUILDING_NAMES.find((k) => CONFIG.buildings[k].id === b.def.id);
      seen.built[name][i === 0 ? 'person' : 'computer']++;
      if (b.cells.some((c) => c.hit)) seen.hitsOnBuildings++;
      if (b.destroyed) seen.destroyedBuildings++;
    }
    for (const row of p.grid.cells) for (const v of row) if (v === 28) seen.crater++;
    seen.shieldCells += p.grid.shields.length;
  });
  seen.personScore = game.players[0].score;
  seen.ended = game.ended ? (game.players.findIndex((p) => p.won) >= 0 ? `won by player ${game.players.findIndex((p) => p.won)}` : 'ended, no winner') : 'running';
  seen.radarSlots = scenario.keys.filter((k) => k).length;
  return seen;
}

const total = { built: {}, fired: {}, ended: new Set(), shieldCells: 0, shieldExpired: 0, hits: 0, destroyed: 0, crater: 0, scoreMax: 0 };
for (const spec of SCENARIOS) {
  const scenario = writeScenario(spec);
  const seen = visit(scenario);
  const fired = Object.entries(seen.fired).filter(([, v]) => v.person + v.computer).map(([k, v]) => `${k} ${v.person}+${v.computer}`).join(', ');
  const built = Object.entries(seen.built).filter(([, v]) => v.person + v.computer).map(([k, v]) => `${k} ${v.person}+${v.computer}`).join(', ');
  console.log(`${spec.name.padEnd(17)} ${seen.ended.padEnd(18)} score ${String(seen.personScore).padStart(4)}  hit buildings ${seen.hitsOnBuildings}, destroyed ${seen.destroyedBuildings}, craters ${seen.crater}, shields listed at the end ${seen.shieldCells}, expired ${seen.shieldExpired}`);
  console.log(`  built (person+computer): ${built || 'nothing'}`);
  console.log(`  fired (person+computer): ${fired || 'nothing'}`);
  for (const [k, v] of Object.entries(seen.built)) total.built[k] = (total.built[k] ?? 0) + v.person + v.computer;
  for (const [k, v] of Object.entries(seen.fired)) total.fired[k] = (total.fired[k] ?? 0) + v.person + v.computer;
  total.ended.add(seen.ended.replace(/player \d/, 'player'));
  total.shieldCells += seen.shieldCells; total.shieldExpired += seen.shieldExpired; total.hits += seen.hitsOnBuildings; total.destroyed += seen.destroyedBuildings; total.crater += seen.crater;
}
console.log('\nin all scenarios');
console.log('  buildings made:', Object.entries(total.built).map(([k, v]) => `${k} ${v}`).join(', '));
console.log('  weapons used:  ', Object.entries(total.fired).map(([k, v]) => `${k} ${v}`).join(', '));
console.log('  endings:       ', [...total.ended].join('; '));
console.log(`  shields that expired ${total.shieldExpired}, buildings hit ${total.hits}, destroyed ${total.destroyed}, craters ${total.crater}`);
export { Game };
