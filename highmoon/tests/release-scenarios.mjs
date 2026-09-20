// SPDX-License-Identifier: GPL-3.0-or-later
// Final release scenarios supplementing the historical trace/oracle tests.
import assert from 'node:assert/strict';
import { HighMoonGame, GameMode, DIFFICULTY_FACTORS, DIFFICULTY_NAMES, WINNING_WAIT_FRAMES } from '../public/src/game-controller.js';

const game = new HighMoonGame({ mode: GameMode.TWO_PLAYER, startupSeed: 12345, galaxySeed: 54321, objects: 6 });
assert.equal(game.snapshot().mode, GameMode.TWO_PLAYER);
assert.equal(game.players[0].human, true);
assert.equal(game.players[1].human, true);

// Real game-over branch and its victory event, not just the shot damage math.
game.players[0].shield = 0;
let snap = game.step({});
assert.equal(snap.winner, 1);
assert.equal(game.drainEvents().filter((e) => e.event === 'winner').length, 1);
for (let i = 1; i < WINNING_WAIT_FRAMES; i += 1) {
  game.step({});
  assert.equal(game.winner, 1, `winner cleared prematurely at game-over frame ${i}`);
}
game.step({});
assert.equal(game.winner, -1);
assert.deepEqual(game.players.map((p) => p.shield), [100, 100]);
assert.equal(game.activePlayer, 0);
assert.equal(game.mode, GameMode.TWO_PLAYER);

// Confirm that switching among all modes reconstructs human/CPU roles.
for (const [mode, humanRoles] of [
  [GameMode.ONE_PLAYER, [true, false]],
  [GameMode.TWO_PLAYER, [true, true]],
  [GameMode.DEMO, [false, false]],
]) {
  game.step({ newMode: mode });
  assert.equal(game.mode, mode);
  assert.deepEqual(game.players.map((p) => p.human), humanRoles);
  assert.deepEqual(game.players.map((p) => p.shield), [100, 100]);
}

// Actual AI turns at each historic difficulty. The canonical Officer
// oracle remains separately checked by ai-turn.mjs; these are smoke tests.
assert.deepEqual(DIFFICULTY_FACTORS, [10, 8, 6, 3, 1]);
assert.equal(DIFFICULTY_NAMES.length, 5);
const difficultyResults = [];
for (let level = 0; level < DIFFICULTY_NAMES.length; level += 1) {
  const cpu = new HighMoonGame({ mode: GameMode.DEMO, difficulty: level, startupSeed: 12345, galaxySeed: 54321, objects: 6 });
  let fires = 0;
  for (let frame = 0; frame < 2200; frame += 1) {
    const state = cpu.step({});
    fires += cpu.drainEvents().filter((e) => e.event === 'fire').length;
    assert.ok(Number.isFinite(state.players[0].x) && Number.isFinite(state.players[1].x));
    assert.ok(Number.isFinite(state.players[0].shield) && Number.isFinite(state.players[1].shield));
    if (state.shot) for (const p of state.shot.projectiles) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  }
  assert.ok(fires >= 1, `${DIFFICULTY_NAMES[level]} never fired`);
  difficultyResults.push({ difficulty: DIFFICULTY_NAMES[level], fires, shield: cpu.players.map((p) => p.shield) });
}
console.log('ok release-scenarios: winner + 400-frame reset; all modes; 5 CPU difficulties', JSON.stringify(difficultyResults));
