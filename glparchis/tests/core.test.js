import test from 'node:test';
import assert from 'node:assert/strict';
import { GlParchisGame } from '../public/src/core/game.js';
import { SeededRng } from '../public/src/core/rng.js';

function gameWithDice(dice, opts = {}) {
  return new GlParchisGame({
    maxPlayers: 4,
    seed: 1234,
    scriptedDice: dice,
    skipStart: true,
    starterIndex: 0,
    players: [
      { name: 'A', ai: false },
      { name: 'B', ai: false },
      { name: 'C', ai: false },
      { name: 'D', ai: false },
    ],
    ...opts,
  });
}

function setPawnOnSquare(game, pawn, squareId) {
  const idx = game.routeFor(pawn.playerId).indexOf(squareId);
  assert.ok(idx >= 0, `square ${squareId} must be in player ${pawn.playerId} route`);
  pawn.pos = idx;
  pawn.arrival = game.arrivalCounter++;
}

test('seeded RNG is deterministic', () => {
  const a = new SeededRng(42);
  const b = new SeededRng(42);
  assert.deepEqual(Array.from({length: 12}, () => a.d6()), Array.from({length: 12}, () => b.d6()));
});

test('starter contest rerolls tied highest players', () => {
  const g = new GlParchisGame({
    maxPlayers: 4,
    scriptedDice: [6,6,3,2],
    players: [
      {plays:true, ai:false}, {plays:true, ai:false},
      {plays:false}, {plays:false},
    ],
  });
  assert.equal(g.currentPlayerId, 0);
  const starter = g.events.find(e => e.type === 'starter');
  assert.equal(starter.rounds.length, 2);
});

test('a pawn leaves home only with 5 and advances to route position 1', () => {
  const g = gameWithDice([5]);
  assert.equal(g.roll().value, 5);
  const legal = g.legalMoves();
  assert.equal(legal.length, 4);
  g.movePawn(legal[0].pawn.id);
  assert.equal(legal[0].pawn.pos, 1);
});

test('rolling 6 counts as 7 when all four pawns are outside home', () => {
  const g = gameWithDice([6]);
  const pawns = g.pawnsOf(0);
  pawns.forEach((p, i) => p.pos = i + 1);
  g.roll();
  const info = g.moveInfo(pawns[3].id);
  assert.equal(info.ok, true);
  assert.equal(info.movement, 7);
});

test('barriers block passage', () => {
  const g = gameWithDice([]);
  const [p0,p1,p2] = g.pawnsOf(0);
  p0.pos = 1;
  p1.pos = 3;
  p2.pos = 3;
  g.player(0).turnRolls = [4];
  g.state = 'await-move';
  const info = g.canMovePawn(p0);
  assert.equal(info.ok, false);
  assert.equal(info.reason, 'barrier');
});

test('rolling 6 obliges the player to open an own barrier', () => {
  const g = gameWithDice([6]);
  const [p0,p1,p2,p3] = g.pawnsOf(0);
  p0.pos = 5;
  p1.pos = 5;
  p2.pos = 2;
  p3.pos = 0;
  g.roll();
  assert.deepEqual(g.legalMoves().map(m => m.pawn.id).sort((a,b)=>a-b), [p0.id,p1.id]);
});

test('capture on an unsafe square returns victim home and grants +20', () => {
  const g = gameWithDice([1]);
  const yellow = g.pawnsOf(0)[0];
  const blue = g.pawnsOf(1)[0];
  setPawnOnSquare(g, yellow, 5);
  setPawnOnSquare(g, blue, 6);
  g.roll();
  const info = g.moveInfo(yellow.id);
  assert.equal(info.capturePawnId, blue.id);
  g.movePawn(yellow.id);
  assert.equal(g.squareIdAt(yellow), 6);
  assert.equal(blue.pos, 0);
  assert.equal(g.player(0).accumulated, 20);
  assert.equal(g.state, 'await-move');
});

test('ordinary safe squares prevent capture', () => {
  const g = gameWithDice([1]);
  const yellow = g.pawnsOf(0)[0];
  const blue = g.pawnsOf(1)[0];
  setPawnOnSquare(g, yellow, 11);
  setPawnOnSquare(g, blue, 12);
  g.roll();
  assert.equal(g.moveInfo(yellow.id).capturePawnId, null);
  g.movePawn(yellow.id);
  assert.equal(g.squareIdAt(yellow), 12);
  assert.equal(g.squareIdAt(blue), 12);
});

test('goal requires an exact throw and grants +10 when another pawn can use it', () => {
  const g = gameWithDice([5]);
  const [p0,p1,p2,p3] = g.pawnsOf(0);
  p0.pos = g.routeFor(0).length - 6;
  p1.pos = 2;
  p2.pos = 3;
  p3.pos = 4;
  g.roll();
  const info = g.moveInfo(p0.id);
  assert.equal(info.reachesGoal, true);
  g.movePawn(p0.id);
  assert.equal(g.isGoal(p0), true);
  assert.equal(g.player(0).accumulated, 10);
  assert.equal(g.state, 'await-move');
});

test('overshooting the goal is illegal; there is no bounce', () => {
  const g = gameWithDice([]);
  const p = g.pawnsOf(0)[0];
  p.pos = g.routeFor(0).length - 2;
  g.player(0).turnRolls = [3];
  g.state = 'await-move';
  const info = g.canMovePawn(p);
  assert.equal(info.ok, false);
  assert.equal(info.reason, 'past-goal');
});

test('third consecutive six sends last moved pawn home outside final ramp', () => {
  const g = gameWithDice([6,6,6]);
  const p = g.pawnsOf(0)[0];
  p.pos = 2;
  g.roll();
  g.movePawn(p.id);
  assert.equal(g.state, 'await-roll');
  g.roll();
  g.movePawn(p.id);
  assert.equal(g.state, 'await-roll');
  g.roll();
  assert.equal(p.pos, 0);
  assert.equal(g.currentPlayerId, 1);
});

test('third-six penalty does not send a pawn home from the final ramp', () => {
  const g = gameWithDice([6]);
  const p = g.pawnsOf(0)[0];
  p.pos = g.routeFor(0).length - 4;
  g.player(0).turnRolls = [6,6];
  g.player(0).lastMovedPawnId = p.id;
  g.state = 'await-roll';
  g.roll();
  assert.notEqual(p.pos, 0);
  assert.equal(g.currentPlayerId, 1);
});

test('AI at 100% priority chooses an available capture', () => {
  const g = gameWithDice([1], { players: [{ai:true},{ai:false},{ai:false},{ai:false}], difficulty: 100 });
  const yellow0 = g.pawnsOf(0)[0];
  const yellow1 = g.pawnsOf(0)[1];
  const blue = g.pawnsOf(1)[0];
  setPawnOnSquare(g, yellow0, 5);
  setPawnOnSquare(g, yellow1, 8);
  setPawnOnSquare(g, blue, 6);
  g.roll();
  assert.equal(g.aiSelectPawn().id, yellow0.id);
});

test('all four historical board sizes have valid equal-length routes', () => {
  const expected = new Map([[3,56],[4,73],[6,107],[8,141]]);
  for (const n of [3,4,6,8]) {
    const g = new GlParchisGame({ maxPlayers:n, seed:n, skipStart:true, starterIndex:0, players:Array.from({length:n},(_,i)=>({ai:i>0})) });
    for (const route of g.board.routes) {
      assert.equal(route.length, expected.get(n));
      for (const id of route) assert.ok(g.board.squares[id], `${n}-player route references missing square ${id}`);
    }
  }
});

test('deterministic all-CPU smoke games finish on 3, 4, 6 and 8 player boards', () => {
  for (const n of [3,4,6,8]) {
    const g = new GlParchisGame({ maxPlayers:n, seed:100+n, players:Array.from({length:n},()=>({ai:true})) });
    let steps=0;
    while (g.state !== 'finished' && steps < 10000) { g.aiStep(); steps++; }
    assert.equal(g.state, 'finished', `${n}-player simulation did not finish`);
    assert.ok(g.winnerId != null);
  }
});

test('historical AI threat analyser preserves the opponent-current-player bug', () => {
  const g = gameWithDice([], { players: [{ai:true},{ai:false},{ai:false},{ai:false}], difficulty: 100 });
  const yellow = g.pawnsOf(0)[0];
  const blue = g.pawnsOf(1)[0];
  setPawnOnSquare(g, yellow, 6);
  setPawnOnSquare(g, blue, 5);
  // Blue is physically one square behind yellow, but SetAmenazas calls
  // estaAutorizadaAMover() while Yellow is current, so the original counts 0.
  assert.equal(g.historicalThreatCount(yellow), 0);
});

test('historical AI keeps the narrow foreign-start-square threat special case', () => {
  const g = gameWithDice([], { players: [{ai:true},{ai:false},{ai:false},{ai:false}], difficulty: 100 });
  const yellow = g.pawnsOf(0)[0];
  const red = g.pawnsOf(2)[0];
  setPawnOnSquare(g, yellow, 22); // Blue start square, not Yellow route position 1.
  setPawnOnSquare(g, red, 22);
  assert.equal(g.square(22).owner, 1);
  assert.equal(g.hasHome(1), true);
  assert.equal(g.historicalThreatCount(yellow), 1);
});

test('AI priority 2 faithfully moves a pawn out of the historical special threat', () => {
  const g = gameWithDice([], { players: [{ai:true},{ai:false},{ai:false},{ai:false}], difficulty: 70 });
  const [yellow0, yellow1] = g.pawnsOf(0);
  const red = g.pawnsOf(2)[0];
  setPawnOnSquare(g, yellow0, 22);
  setPawnOnSquare(g, red, 22);
  setPawnOnSquare(g, yellow1, 30);
  g.player(0).turnRolls = [1];
  g.state = 'await-move';
  const chances = [false, true]; // Skip capture priority, enter threat priority.
  g.rng.chancePercent = () => chances.shift() ?? false;
  assert.equal(g.aiSelectPawn().id, yellow0.id);
});
