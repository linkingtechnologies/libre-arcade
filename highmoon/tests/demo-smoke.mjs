// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { HighMoonGame, GameMode } from '../public/src/game-controller.js';

const game = new HighMoonGame({ mode: GameMode.DEMO, difficulty: 2, startupSeed: 24680, galaxySeed: 13579, objects: 6 });
for (let i = 0; i < 3000; i += 1) game.step({});
for (const p of game.players) {
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  assert.ok(Number.isFinite(p.shootAngle) && Number.isFinite(p.shootPower));
  assert.ok(Number.isInteger(p.shield) && p.shield >= 0);
}
for (const b of game.runtime.galaxy.bodies) assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
assert.ok(game.rng.index > 0);
console.log(`ok demo-smoke: 3000 frames; shields ${game.players.map(p=>p.shield).join('/')}; rng=${game.rng.index}`);
