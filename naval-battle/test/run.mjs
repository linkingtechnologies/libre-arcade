import assert from 'node:assert/strict';
import { SeededRng } from '../src/core/prng.js';
import { CLASSIC_FLEET } from '../src/core/rules.js';
import { createRandomBoard } from '../src/core/fleet.js';
import { Board } from '../src/core/board.js';
import { Game } from '../src/core/game.js';
import { RandomPlayer } from '../src/players/random.js';

assert.deepEqual(CLASSIC_FLEET, [5,4,3,3,2]);
assert.equal(CLASSIC_FLEET.reduce((a,b) => a+b, 0), 17);

const r1 = new SeededRng(12345);
const r2 = new SeededRng(12345);
assert.deepEqual(Array.from({length: 20}, () => r1.int(1000)), Array.from({length: 20}, () => r2.int(1000)));

for (let seed = 0; seed < 100; seed += 1) {
  const board = createRandomBoard(new SeededRng(seed));
  assert.equal(board.ships.length, 5);
  assert.equal(board.occupancy.size, 17);
}

const b = new Board();
b.placeShip([{x:0,y:0},{x:1,y:0}], 'x');
assert.equal(b.fire({x:0,y:0}).hit, true);
assert.equal(b.fire({x:0,y:0}).repeated, true);
assert.equal(b.fire({x:1,y:0}).sunk, true);
assert.equal(b.allSunk(), true);

function deterministicGame(seed) {
  return new Game({
    boardA: createRandomBoard(new SeededRng(seed ^ 1)),
    boardB: createRandomBoard(new SeededRng(seed ^ 2)),
    playerA: new RandomPlayer(new SeededRng(seed ^ 3), 'A'),
    playerB: new RandomPlayer(new SeededRng(seed ^ 4), 'B')
  }).run();
}
const g1 = deterministicGame(777);
const g2 = deterministicGame(777);
assert.equal(g1.winner, g2.winner);
assert.equal(g1.turns, g2.turns);
assert.deepEqual(g1.history, g2.history);


console.log('Naval Battle tests: OK');

// Warboats 0.51 source-port tests.
const { WARBOATS_FLEET } = await import('../src/core/rules.js');
const { Warboats2009Player } = await import('../src/players/warboats-2009.js');
assert.deepEqual(WARBOATS_FLEET, [5,4,3,3,2]);
assert.equal(WARBOATS_FLEET.reduce((a,b) => a+b, 0), 17);
assert.equal(Warboats2009Player.archaeologyStatus.upstreamLicense, 'GPL-2.0-or-later');

// Level 4 hunt mode uses exactly one checkerboard parity.
const w4 = new Warboats2009Player(new SeededRng(0x12345678), 4);
for (let n = 0; n < 30; n += 1) {
  const shot = w4.nextShot({ boardSize: 10, history: [] });
  assert.notEqual((shot.x + shot.y) & 1, w4.patternLikeParity);
}

// Skill 3+ determines orientation after a second hit on the same ship.
const w3 = new Warboats2009Player(new SeededRng(7), 3);
w3.observe({ hit: true, sunk: false, shipId: 'ship-2-L3', coord: {x: 4, y: 4} });
w3.observe({ hit: true, sunk: false, shipId: 'ship-2-L3', coord: {x: 4, y: 5} });
assert.equal(w3.memory[2].orientation, 'VERTICAL');

// Every skill terminates deterministic games without repeated shots.
for (let skill = 1; skill <= 4; skill += 1) {
  for (let seed = 0; seed < 20; seed += 1) {
    const wb = new Warboats2009Player(new SeededRng((seed + 1) * 101 + skill), skill);
    const random = new RandomPlayer(new SeededRng((seed + 1) * 211 + skill));
    const result = new Game({
      boardA: createRandomBoard(new SeededRng(seed ^ 0xabc), WARBOATS_FLEET),
      boardB: createRandomBoard(new SeededRng(seed ^ 0xdef), WARBOATS_FLEET),
      playerA: wb,
      playerB: random
    }).run();
    assert.ok(result.turns > 0 && result.turns <= 200);
  }
}

// Historical regression: skill 2 can stall when endpoint memory collapses
// around already-known cells (e.g. after cross-hitting an adjacent ship).
const { HistoricalAiStallError } = await import('../src/players/warboats-2009.js');
{
  const wb = new Warboats2009Player(new SeededRng(123), 2, 'Warboats-L2');
  wb.memory[0].state = 'HIT';
  wb.memory[0].endpoints = [{x:0,y:5},{x:0,y:6}];
  for (const c of [[0,4],[0,5],[0,6],[0,7],[1,5],[1,6]]) wb.tried.add(`${c[0]},${c[1]}`);
  assert.throws(() => wb.nextShot({boardSize:10, history:[]}), HistoricalAiStallError);
}
