// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Runs a scenario on the port, the way test/java-oracle/oracle/Harness.java runs it on the original: the same slots of a tenth of a
// second of virtual time, the same order within a slot (the person acts first, at that exact time; then what is due at that time;
// then the picture), the same actions. The port is the package's: its Game, its Player, its combat rules and its renderer (whose
// drawing changes the game, as the original's does; here it draws on a context that ignores everything).
import { Game } from '../public/src/core/game.js';
import { CONFIG } from '../public/src/core/config.js';
import { splitMix64 } from '../public/src/core/rng.js';
import { fireWeapon } from '../public/src/core/combat.js';
import { drawCity, drawRadar, resetVisualTimers, getVisualState } from '../public/src/ui/m6-renderer.js';
import { snapshot, crc32 } from './oracle-state.mjs';

export const KEY_GAME_C = 0x0800;
export const KEY_GAME_D = 0x1000;

const BUILDING_KEY = new Map(Object.entries(CONFIG.buildings).map(([key, def]) => [def.id, key]));
const WEAPON_KEY = new Map(Object.entries(CONFIG.weapons).map(([key, def]) => [def.id, key]));
export const buildingKey = (id) => BUILDING_KEY.get(id);
export const weaponKey = (id) => WEAPON_KEY.get(id);

// A context that takes any drawing call and any property and does nothing.
const BLANK_CONTEXT = new Proxy({}, { get: () => () => {}, set: () => true });

export function newGame(scenario) {
  return new Game({
    seeds: splitMix64(scenario.seed),
    levels: scenario.mode === 4 ? [null] : [null, scenario.mode],
    moneyAtStart: scenario.money,
    scoreToWin: scenario.maxScore,
    waterPercent: scenario.water,
  });
}

/**
 * The person's actions of one slot, in the original's terms (what MilCityModel.performSelectedAction() calls). They are applied
 * without checking anything, because the original's methods check for themselves, and the port's must too.
 */
export function applyAct(game, act) {
  const human = game.players[0];
  const [kind, ...args] = act;
  if (kind === 'build') human.build(buildingKey(args[0]), args[1], args[2], game.time);
  else if (kind === 'fire') fireWeapon(human, game.players[args[3]], weaponKey(args[0]), args[1], args[2], game.time);
  else if (kind === 'shield') fireWeapon(human, human, 'shield', args[0], args[1], game.time);
  else if (kind === 'end') game.ended = true;
}

/**
 * Plays the scenario and returns the checksum of the state after each slot. `onSlot(game, slot)` is called before the person acts in
 * each slot (a player bot uses it to decide, and may add to scenario.acts and scenario.keys); `textAt` asks for the whole state text
 * of one slot besides.
 */
export function runPort(scenario, { onSlot = null, textAt = new Set() } = {}) {
  resetVisualTimers();
  const game = newGame(scenario);
  const crcs = [];
  const texts = new Map();
  let view = -1; // the mode of the view that is drawn: -1 the city, 1 the radar of the opponent
  for (let slot = 0; slot < scenario.slots; slot++) {
    const time = 100 * slot;
    if (slot > 0) game.advance(time - 1 - game.time); // everything due before this tenth of a second
    game.time = time; // the person acts at this moment, before what is due at the same time
    if (onSlot) onSlot(game, slot);
    for (const act of scenario.acts) if (act[0] === slot) applyAct(game, act.slice(1));
    game.advance(0);
    // the engine's paint: the keys change the view, then the view is drawn (and drawing changes the game)
    // (the engine's thread ends when the game does, and an engine that has stopped paints nothing)
    if (!game.ended) {
      const keys = scenario.keys[slot] ?? 0;
      if ((keys & (KEY_GAME_C | KEY_GAME_D)) !== 0 && game.players.length > 1) view = view < 0 ? 1 : -1;
      if (view < 0) drawCity(BLANK_CONTEXT, game.players[0], game.time, 8);
      else drawRadar(BLANK_CONTEXT, game.players[0], 8);
    }
    const text = snapshot(game, { mode: view < 0 ? 0 : 1, timer: getVisualState().radarTimer });
    crcs.push(crc32(text));
    if (textAt.has(slot)) texts.set(slot, text);
  }
  return { crcs, texts, game };
}
