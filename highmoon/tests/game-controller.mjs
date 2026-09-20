// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HighMoonGame, GameMode, buyHistoricalBonus } from '../public/src/game-controller.js';
import { settleHistoricalRuntime } from '../public/src/historical-runtime.js';

// Bonus semantics, including no cap on shield upgrades and non-consuming weapon
// bonus when a special weapon is already loaded.
const u = { bonus: 1, shield: 100, boughtWeapon: 'laser' };
assert.equal(buyHistoricalBonus(u), true);
assert.equal(u.shield, 105);
assert.equal(u.bonus, 0);
u.bonus = 2;
assert.equal(buyHistoricalBonus(u), true);
assert.equal(u.boughtWeapon, 'heavy');
u.bonus = 3;
assert.equal(buyHistoricalBonus(u), false);
assert.equal(u.bonus, 3);
assert.equal(u.boughtWeapon, 'heavy');
u.boughtWeapon = 'laser';
assert.equal(buyHistoricalBonus(u), true);
assert.equal(u.boughtWeapon, 'cluster');
u.bonus = 4;
assert.equal(buyHistoricalBonus(u), true);
assert.equal(u.shield, 130);

// Historical SDL_KEYUP bug: any release fires after Space charging has started.
const human = new HighMoonGame({ mode: GameMode.TWO_PLAYER, galaxySeed: 54321, objects: 6 });
human.step({ fire: true });
assert.equal(human.targeting, true);
assert.equal(human.players[0].shootPower, 1);
human.step({ anyKeyReleased: true });
assert.equal(human.targetLocked, true);
assert.equal(human.shot.weapon, 'laser');
assert.equal(human.shot.parent.movingTime, 699);
assert.ok(human.shot.parent.speed > 0);
const fireEvent = human.drainEvents().find((e) => e.event === 'fire');
assert.equal(fireEvent.power, 1);

// Turn changes only after the active shot ends.
human.shot.parent.movingTime = 1;
human.step({});
assert.equal(human.activePlayer, 1);
assert.equal(human.players[0].active, false);
assert.equal(human.players[1].active, true);
assert.equal(human.players[1].shootPower, 0);

// Full canonical CPU turn through the playable controller must retain the M3
// oracle's shared RNG and damage result.
const fixture = JSON.parse(fs.readFileSync(new URL('../oracle/m3-native-ai-fixture.json', import.meta.url), 'utf8'));
const cpu = new HighMoonGame({ mode: GameMode.DEMO, difficulty: 3, startupSeed: fixture.startup_seed, galaxySeed: fixture.galaxy_seed, objects: fixture.objects });
const settled = settleHistoricalRuntime(cpu.runtime);
assert.equal(settled, fixture.settle_frames);
for (let i = 0; i < fixture.total_frames_after_settle; i += 1) cpu.step({});
assert.equal(cpu.players[1].shield, fixture.actual_shot.shield_after);
assert.equal(cpu.rng.index, fixture.rng_calls_after_galaxy_seed_through_final_render);
assert.equal(cpu.activePlayer, 1);
assert.equal(cpu.aiState.attempts.length, 7);

console.log('ok game-controller: bonus rules, keyup quirk, turn switch, canonical CPU turn');
