import test from 'node:test';
import assert from 'node:assert/strict';
import { GameController } from '../public/src/core/game-controller.js';
import { RandomSource } from '../public/src/core/random.js';

const renderer = {
  canvasToVirtual(x, y) { return { x, y }; },
  virtualToBoard(x, y) { return x === 1 && y === 1 ? { x: 0, y: 0 } : null; },
  virtualToHumanAsset() { return null; },
  showMessage() {},
};
const audio = {
  play() {},
  startMusic() {},
};

test('only one board pointer event is accepted per rendered frame, as upstream clicked flag', async () => {
  const game = new GameController({ renderer, audio, rng: RandomSource.fromSeed(123) });
  game.phase = 'human';

  await game.handlePointer(1, 1);
  assert.deepEqual(game.selected, [{ x: 0, y: 0 }]);

  // The same second click would deselect if processed, but upstream ignores it
  // until GameControl.draw() resets `clicked`.
  await game.handlePointer(1, 1);
  assert.deepEqual(game.selected, [{ x: 0, y: 0 }]);

  game.endFrame();
  await game.handlePointer(1, 1);
  assert.deepEqual(game.selected, []);
});
