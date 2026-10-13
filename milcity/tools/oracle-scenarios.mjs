// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The scenarios of the oracle, and the players that write them. A scenario is a game (the options, the seed from which every random
// number in it comes) and what the person does in it, slot by slot (a slot is a tenth of a second of virtual time): the actions, and
// the key state, which here only changes the view. The players look at the port's game to decide what to do, so that a game goes
// somewhere (a city is built, ammunition is made, shots are fired, a game is won or lost); the Java original is then given the same
// actions and must arrive at the same state. If the port is wrong, the actions are still the ones the port's game asked for, and the
// original shows where it parts from the port.
import { CONFIG } from '../public/src/core/config.js';
import { runPort, KEY_GAME_D } from './oracle-port.mjs';

// A small, fast random generator for the players' own choices (not the game's: those come from the seed, in the game itself).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILD_PLAN = ['powerPlant', 'commercial', 'commercial', 'missileSilo', 'powerPlant', 'house', 'factory', 'commercial', 'airField', 'laboratory', 'shieldGenerator', 'nukeSilo', 'commercial', 'missileSilo'];
const WEAPONS = ['nuke', 'aircraft', 'mortar', 'missile', 'spy'];

function findSpot(grid, def, rnd) {
  const startX = Math.floor(rnd() * grid.w), startY = Math.floor(rnd() * grid.h);
  for (let n = 0; n < grid.w * grid.h; n++) {
    const index = (startY * grid.w + startX + n) % (grid.w * grid.h);
    const x = index % grid.w, y = Math.floor(index / grid.w);
    if (grid.freeGrass(x, y, def.w, def.h)) return [x, y];
  }
  return null;
}

// Where a weapon of size w by h should go to hit something: on a building of the opponent, if there is one (otherwise anywhere).
function aimAt(game, def, rnd, bestEffort = 0.7) {
  const target = game.players[1];
  const buildings = target ? target.grid.buildings.filter((b) => !b.destroyed) : [];
  let x, y;
  if (buildings.length && rnd() < bestEffort) {
    const cell = buildings[Math.floor(rnd() * buildings.length)].cells[0];
    x = cell.x - Math.floor(rnd() * def.w);
    y = cell.y - Math.floor(rnd() * def.h);
  } else {
    x = Math.floor(rnd() * 30);
    y = Math.floor(rnd() * 30);
  }
  return [Math.max(0, Math.min(30 - def.w, x)), Math.max(0, Math.min(30 - def.h, y))];
}

const POLICIES = {
  // does nothing: the computer plays on its own against an empty city
  idle() {},

  // builds the city in a fixed order whenever the money allows, and uses what it makes
  builder(game, slot, scenario, rnd, memo) {
    const human = game.players[0];
    if (slot % 10 === 3) {
      const key = BUILD_PLAN[memo.next % BUILD_PLAN.length];
      const def = CONFIG.buildings[key];
      if (human.money >= def.cost) {
        const spot = findSpot(human.grid, def, rnd);
        if (spot) {
          scenario.acts.push([slot, 'build', def.id, spot[0], spot[1]]);
          memo.next++;
        }
      }
    }
    if (slot % 10 === 7) POLICIES.shoot(game, slot, scenario, rnd, memo);
  },

  // shoots with whatever it has, the opponent's buildings when it knows where they are, and places a shield now and then
  shoot(game, slot, scenario, rnd) {
    const human = game.players[0];
    if (game.players.length > 1) {
      for (const key of WEAPONS) {
        if (human.ammo[key] > 0 && game.time >= human.cannotFireBefore && rnd() < 0.8) {
          const def = CONFIG.weapons[key];
          const [x, y] = aimAt(game, def, rnd);
          scenario.acts.push([slot, 'fire', def.id, x, y, 1]);
          break;
        }
      }
    }
    if (human.ammo.shield > 0 && rnd() < 0.5) {
      const def = CONFIG.weapons.shield;
      const buildings = human.grid.buildings.filter((b) => !b.destroyed);
      const base = buildings.length ? buildings[Math.floor(rnd() * buildings.length)].cells[0] : { x: 14, y: 14 };
      scenario.acts.push([slot, 'shield', Math.max(0, Math.min(30 - def.w, base.x - Math.floor(rnd() * 2))), Math.max(0, Math.min(30 - def.h, base.y - Math.floor(rnd() * 2)))]);
    }
  },

  // builder and shooter, looking at the opponent's radar for a few seconds now and then (the radar fades as it is looked at)
  warrior(game, slot, scenario, rnd, memo) {
    POLICIES.builder(game, slot, scenario, rnd, memo);
    if (game.players.length > 1) {
      if (slot % 230 === 100) scenario.keys[slot] = KEY_GAME_D; // to the radar
      if (slot % 230 === 190) scenario.keys[slot] = KEY_GAME_D; // and back
    }
  },

  // anything at any time, valid or not
  chaos(game, slot, scenario, rnd) {
    if (rnd() < 0.12) {
      const kind = rnd();
      if (kind < 0.5) {
        const keys = Object.keys(CONFIG.buildings);
        const def = CONFIG.buildings[keys[Math.floor(rnd() * keys.length)]];
        const spot = rnd() < 0.7 ? findSpot(game.players[0].grid, def, rnd) : [Math.floor(rnd() * 32) - 1, Math.floor(rnd() * 32) - 1];
        if (spot) scenario.acts.push([slot, 'build', def.id, spot[0], spot[1]]);
      } else if (kind < 0.85 && game.players.length > 1) {
        const keys = Object.keys(CONFIG.weapons).filter((k) => k !== 'shield');
        const def = CONFIG.weapons[keys[Math.floor(rnd() * keys.length)]];
        const [x, y] = rnd() < 0.9 ? aimAt(game, def, rnd, 0.5) : [Math.floor(rnd() * 34) - 2, Math.floor(rnd() * 34) - 2];
        scenario.acts.push([slot, 'fire', def.id, x, y, 1]);
      } else {
        scenario.acts.push([slot, 'shield', Math.floor(rnd() * 30), Math.floor(rnd() * 30)]);
      }
    }
    if (game.players.length > 1 && rnd() < 0.01) scenario.keys[slot] = KEY_GAME_D;
  },

  // one commercial building and nothing else: it uses energy that is not there, and the person loses, soon if the purse cannot pay
  // for a power plant and after the two minutes allowed if it can
  blackout(game, slot, scenario, rnd, memo) {
    if (slot === 20 && !memo.done) {
      const def = CONFIG.buildings.commercial;
      const spot = findSpot(game.players[0].grid, def, rnd);
      scenario.acts.push([slot, 'build', def.id, spot[0], spot[1]]);
      memo.done = true;
    }
  },
};

export const SCENARIOS = [
  { name: 'idle-easy', mode: 0, seed: 11, water: 50, money: 100, maxScore: 1000, slots: 7000, policy: 'idle' },
  { name: 'idle-madness', mode: 3, seed: 12, water: 30, money: 100, maxScore: 1000, slots: 7000, policy: 'idle' },
  { name: 'builder-easy', mode: 0, seed: 21, water: 50, money: 100, maxScore: 1000, slots: 7000, policy: 'builder' },
  { name: 'builder-medium', mode: 1, seed: 22, water: 40, money: 200, maxScore: 2000, slots: 7000, policy: 'builder' },
  { name: 'warrior-hard', mode: 2, seed: 31, water: 50, money: 400, maxScore: 5000, slots: 9000, policy: 'warrior' },
  { name: 'warrior-win', mode: 0, seed: 32, water: 50, money: 600, maxScore: 500, slots: 7000, policy: 'warrior' },
  { name: 'warrior-madness', mode: 3, seed: 33, water: 60, money: 800, maxScore: 3000, slots: 9000, policy: 'warrior' },
  { name: 'chaos-madness', mode: 3, seed: 41, water: 45, money: 500, maxScore: 3000, slots: 7000, policy: 'chaos' },
  { name: 'chaos-easy', mode: 0, seed: 43, water: 55, money: 300, maxScore: 1500, slots: 7000, policy: 'chaos' },
  { name: 'chaos-training', mode: 4, seed: 42, water: 50, money: 500, maxScore: 1000, slots: 4000, policy: 'chaos' },
  { name: 'blackout-poor', mode: 4, seed: 51, water: 50, money: 60, maxScore: 1000, slots: 1500, policy: 'blackout' },
  { name: 'blackout-slow', mode: 4, seed: 52, water: 50, money: 300, maxScore: 1000, slots: 2500, policy: 'blackout' },
  { name: 'leave', mode: 1, seed: 61, water: 50, money: 100, maxScore: 1000, slots: 600, policy: 'idle', leaveAt: 300 },
];

/** Writes the person's side of the scenario by playing it on the port with its player. Returns the scenario with `acts` and `keys`. */
export function writeScenario(spec) {
  const scenario = { ...spec, acts: [], keys: new Array(spec.slots).fill(0) };
  const rnd = mulberry32(spec.seed * 7919 + 13);
  const memo = { next: 0 };
  const policy = POLICIES[spec.policy];
  runPort(scenario, {
    onSlot(game, slot) {
      if (game.ended) return;
      if (spec.leaveAt === slot) scenario.acts.push([slot, 'end']);
      else policy(game, slot, scenario, rnd, memo);
    },
  });
  return scenario;
}
