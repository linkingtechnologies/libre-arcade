import test from 'node:test';
import assert from 'node:assert/strict';
import { BoardModel } from '../public/src/core/board.js';
import { PlayerState, attackDamage, attackRoll } from '../public/src/core/player.js';
import { RandomSource } from '../public/src/core/random.js';
import { chooseOriginalAsset } from '../public/src/ai/original-ai.js';

function constantRng(value = 0) {
  return new RandomSource(() => value);
}

function patternedBoard() {
  const board = new BoardModel(constantRng(0));
  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) board.set(x, y, (x + y) % 6);
  }
  return board;
}

test('money match of 3 is worth $15', () => {
  const board = patternedBoard();
  board.set(0, 4, 0); board.set(1, 4, 0); board.set(2, 4, 0);
  const { positions, scores } = board.validMove([{ x: 1, y: 4 }]);
  const finalScores = board.consumeMatch(positions, scores);
  const player = new PlayerState(0);
  player.addScore(finalScores);
  assert.equal(player.score[0], 15);
});

test('duplicate score records from an edge match are preserved', () => {
  const board = patternedBoard();
  for (let x = 0; x < 4; x += 1) board.set(x, 5, 1); // four shields
  const { positions, scores } = board.validMove([{ x: 0, y: 5 }]);
  assert.deepEqual(scores.map((s) => [s.tile, s.amount]), [[1, 4], [1, 4]]);

  const finalScores = board.consumeMatch(positions, scores);
  const player = new PlayerState(0);
  player.addScore(finalScores);
  assert.equal(player.score[1], 1, 'resource increments once per tile type');
  assert.equal(player.score[0], 50, 'two bonus records of amount 5 are each multiplied by 5');
});

test('shield repair can exceed 100 internally, matching upstream', () => {
  const player = new PlayerState(0);
  player.shield = 95;
  const visible = player.applyShieldDelta(-15);
  assert.equal(player.shield, 110);
  assert.equal(visible, 100);
});

test('asset costs match v1.0.1', () => {
  const player = new PlayerState(0);
  player.score = [30, 1, 1, 1, 1, 1];
  assert.equal(player.use(0), 'Shield UP!');
  assert.equal(player.score[0], 20);
  assert.equal(player.use(4), 'Laser Beam!');
  assert.equal(player.score[0], 15);
});

test('damage lower bounds match the Python randint calls', () => {
  const rng = constantRng(0);
  assert.equal(attackDamage(1, rng), 15);
  assert.equal(attackDamage(2, rng), 10);
  assert.equal(attackDamage(3, rng), 10);
  assert.equal(attackDamage(4, rng), 5);
});

test('AI always repairs below 45 shield when it can', () => {
  const me = new PlayerState(1);
  const enemy = new PlayerState(0);
  me.shield = 44;
  me.score = [10, 1, 0, 0, 0, 0];
  assert.equal(chooseOriginalAsset(me, enemy, constantRng(0.5)), 0);
});

test('gravity fills every hole without automatic scoring', () => {
  const board = patternedBoard();
  board.set(0, 9, null);
  board.set(0, 7, null);
  board.gravityAndFill();
  for (let y = 0; y < board.height; y += 1) assert.notEqual(board.get(0, y), null);
});

test('Python 2.7 MT19937 random() stream matches seed 123', () => {
  const rng = RandomSource.fromSeed(123);
  const expected = [
    0.052363598850944326,
    0.08718667752263232,
    0.4072417636703983,
    0.10770023493843905,
    0.9011988779516946,
  ];
  assert.deepEqual(expected.map(() => rng.random()), expected);
});

test('Python 2.7 randint semantics reproduce the first seeded board values', () => {
  const board = new BoardModel(RandomSource.fromSeed(123));
  assert.deepEqual(board.grid[0], [0, 0, 2, 0, 5, 0, 3, 1, 5, 0]);
  assert.deepEqual(board.grid[1], [2, 2, 1, 0, 2, 0, 3, 0, 1, 2]);
});

test('Python 2.7 shuffle algorithm matches seed 123 fixture', () => {
  const rng = RandomSource.fromSeed(123);
  const values = Array.from({ length: 10 }, (_, i) => i);
  rng.shuffle(values);
  assert.deepEqual(values, [7, 1, 4, 2, 6, 5, 8, 3, 9, 0]);
});

test('attack roll consumes target jitter after damage, preserving upstream RNG order', () => {
  const rng = RandomSource.fromSeed(123);
  assert.deepEqual(attackRoll(1, rng), { damage: 15, targetJitter: -9 });
  assert.deepEqual(attackRoll(2, rng), { damage: 16, targetJitter: -8 });
  assert.deepEqual(attackRoll(3, rng), { damage: 15, targetJitter: -10 });
  assert.deepEqual(attackRoll(4, rng), { damage: 8, targetJitter: -4 });
});

test('v1.0.1 AI selects the same seeded money move as the Python oracle', async () => {
  const { findOriginalMove } = await import('../public/src/ai/original-ai.js');
  const rng = RandomSource.fromSeed(123);
  const board = new BoardModel(rng);
  assert.deepEqual(findOriginalMove(board, rng), [{ x: 2, y: 0 }, { x: 3, y: 0 }]);
});
