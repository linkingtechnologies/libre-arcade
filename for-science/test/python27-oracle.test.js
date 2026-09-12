import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BoardModel } from '../public/src/core/board.js';
import { RandomSource } from '../public/src/core/random.js';
import { findOriginalMove, chooseOriginalAsset } from '../public/src/ai/original-ai.js';
import { PlayerState, attackRoll } from '../public/src/core/player.js';

const fixture = JSON.parse(fs.readFileSync('test/fixtures/python27-oracle.json', 'utf8'));
const toPairArrays = (move) => move.map(({ x, y }) => [x, y]);

for (const [seedText, expected] of Object.entries(fixture.initial_and_ai)) {
  test(`Python 2.7 oracle: initial board and AI move seed ${seedText}`, () => {
    const rng = RandomSource.fromSeed(Number(seedText));
    const board = new BoardModel(rng);
    assert.deepEqual(board.grid, expected.board);
    assert.deepEqual(toPairArrays(findOriginalMove(board, rng)), expected.move);
  });
}

for (const [seedText, expected] of Object.entries(fixture.gravity)) {
  test(`Python 2.7 oracle: gravity/refill seed ${seedText}`, () => {
    const rng = RandomSource.fromSeed(Number(seedText));
    const board = new BoardModel(rng);
    for (const [x, y] of [[0,9],[0,7],[4,4],[9,0],[9,1]]) board.set(x,y,null);
    board.gravityAndFill();
    assert.deepEqual(board.grid, expected);
  });
}

function makePlayer(spec, who) {
  const p = new PlayerState(who);
  p.shield = spec.shield;
  p.score = [...spec.score];
  return p;
}
const scenarios = {
  repair: [{shield:44,score:[10,1,0,0,0,0]},{shield:100,score:[0,0,0,0,0,0]}],
  normal: [{shield:80,score:[40,0,0,0,1,2]},{shield:80,score:[0,0,0,0,0,0]}],
  aggressive: [{shield:80,score:[100,1,1,1,1,1]},{shield:20,score:[0,0,0,0,0,0]}],
};
for (const item of fixture.asset_choice) {
  test(`Python 2.7 oracle: asset choice ${item.scenario} seed ${item.seed}`, () => {
    const [cur, enemy] = scenarios[item.scenario];
    const actual = chooseOriginalAsset(makePlayer(cur,0), makePlayer(enemy,1), RandomSource.fromSeed(item.seed));
    assert.equal(actual, item.asset);
  });
}

for (const [seedText, expected] of Object.entries(fixture.attack_rolls)) {
  test(`Python 2.7 oracle: attack roll stream seed ${seedText}`, () => {
    const rng = RandomSource.fromSeed(Number(seedText));
    const actual = [1,2,3,4].map((asset) => {
      const r = attackRoll(asset, rng);
      return { asset, damage: r.damage, jitter: r.targetJitter };
    });
    assert.deepEqual(actual, expected);
  });
}
