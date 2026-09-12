import test from 'node:test';
import assert from 'node:assert/strict';
import { GameController } from '../public/src/core/game-controller.js';
import { RandomSource } from '../public/src/core/random.js';

function controller() {
  const renderer = { showMessage() {} };
  const audio = { play() {}, startMusic() {} };
  return new GameController({ renderer, audio, rng: RandomSource.fromSeed(1) });
}

test('turn timeout follows the original 101 discrete >0.2s ticks', () => {
  const game = controller();
  game.phase = 'human';
  game.timerRunning = true;
  game.turnTime = 100;
  game.turnRemaining = 1;
  game.timerElapsed = 0;
  game.lastUpdateAt = 0;

  let timeouts = 0;
  game.onTurnTimeout = () => { timeouts += 1; game.timerRunning = false; };

  for (let tick = 1; tick <= 100; tick += 1) game.update(tick * 201);
  assert.equal(timeouts, 0);
  assert.equal(game.turnTime, 0);
  assert.equal(game.turnRemaining, 0.01);

  game.update(101 * 201);
  assert.equal(timeouts, 1);
  assert.equal(game.turnTime, -1);
  assert.equal(game.turnRemaining, 0);
});
