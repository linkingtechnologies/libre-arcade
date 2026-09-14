import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RNG } from '../public/src/core/RNG.js';
import { Dice } from '../public/src/core/Dice.js';
import { GameState } from '../public/src/core/GameState.js';
import { RuleEngine } from '../public/src/core/RuleEngine.js';
import { TurnManager } from '../public/src/core/TurnManager.js';
import { Game } from '../public/src/core/Game.js';

const board = JSON.parse(fs.readFileSync(new URL('../public/data/boards/classic-63.json', import.meta.url), 'utf8'));

function makeState(position = 0, secondPosition = 0) {
  return new GameState({
    boardId: board.id,
    gameSeed: 'test',
    players: [
      { id: 'p1', name: 'A', position },
      { id: 'p2', name: 'B', position: secondPosition }
    ]
  });
}

function markFirstRollDone(state) {
  state.players.forEach((player) => { player.firstRollDone = true; });
  return state;
}

test('RNG is deterministic for the same seed', () => {
  const a = new RNG('goose');
  const b = new RNG('goose');
  const seqA = Array.from({ length: 20 }, () => a.nextUint32());
  const seqB = Array.from({ length: 20 }, () => b.nextUint32());
  assert.deepEqual(seqA, seqB);
});

test('RNG state can be exported and restored', () => {
  const a = new RNG(1234);
  a.nextUint32();
  const snapshot = a.exportState();
  const expected = a.nextUint32();
  const b = new RNG(1);
  b.importState(snapshot);
  assert.equal(b.nextUint32(), expected);
});

test('Dice returns two values in range', () => {
  const dice = new Dice({ count: 2, sides: 6 });
  const rng = new RNG(99);
  for (let i = 0; i < 100; i += 1) {
    const roll = dice.roll(rng);
    assert.equal(roll.values.length, 2);
    assert.ok(roll.values.every((v) => v >= 1 && v <= 6));
    assert.equal(roll.total, roll.values[0] + roll.values[1]);
  }
});

test('Bridge moves 6 -> 12', () => {
  const state = markFirstRollDone(makeState(0));
  const events = new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 5], total: 6 });
  assert.equal(state.players[0].position, 12);
  assert.ok(events.some((e) => e.type === 'BRIDGE_TRIGGERED'));
});

test('Goose repeats the same movement and chains', () => {
  const state = markFirstRollDone(makeState(1));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 3], total: 4 });
  assert.equal(state.players[0].position, 13);
});

test('Inn applies two skipped turns', () => {
  const state = markFirstRollDone(makeState(17));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 1], total: 2 });
  assert.equal(state.players[0].position, 19);
  assert.equal(state.players[0].skipTurns, 2);
});

test('Maze moves 42 -> 39', () => {
  const state = markFirstRollDone(makeState(40));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 1], total: 2 });
  assert.equal(state.players[0].position, 39);
});

test('Death returns player to start', () => {
  const state = markFirstRollDone(makeState(56));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 1], total: 2 });
  assert.equal(state.players[0].position, 0);
});

test('Exact finish wins', () => {
  const state = markFirstRollDone(makeState(61));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 1], total: 2 });
  assert.equal(state.status, 'finished');
  assert.equal(state.winnerId, 'p1');
});

test('Overshoot bounces, then backwards Goose reaches prison', () => {
  const state = markFirstRollDone(makeState(60));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [3, 4], total: 7 });
  assert.equal(state.players[0].position, 52);
  assert.equal(state.players[0].blockedBy, 'prison');
});

test('First roll 3+6 jumps to 26', () => {
  const state = makeState(0);
  new RuleEngine(board).applyRoll(state, 'p1', { values: [6, 3], total: 9 });
  assert.equal(state.players[0].position, 26);
  assert.equal(state.players[0].firstRollDone, true);
});

test('First roll 4+5 jumps to 53', () => {
  const state = makeState(0);
  new RuleEngine(board).applyRoll(state, 'p1', { values: [4, 5], total: 9 });
  assert.equal(state.players[0].position, 53);
});

test('Normal occupied tile swaps occupant back to turn origin', () => {
  const state = markFirstRollDone(makeState(10, 14));
  new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 3], total: 4 });
  // 14 is a Goose, so p1 moves again to 18 and then 22. Put B on 22 instead.
  assert.notEqual(state.players[0].position, 14);

  const swapState = markFirstRollDone(makeState(10, 13));
  const events = new RuleEngine(board).applyRoll(swapState, 'p1', { values: [1, 2], total: 3 });
  assert.equal(swapState.players[0].position, 13);
  assert.equal(swapState.players[1].position, 10);
  assert.ok(events.some((event) => event.type === 'PLAYERS_SWAPPED'));
});

test('Landing on an occupied Well releases old prisoner and replaces them', () => {
  const state = markFirstRollDone(makeState(29, 31));
  state.players[1].blockedBy = 'well';
  state.players[1].blockedSince = 2;
  state.turnNumber = 5;
  const events = new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 1], total: 2 });
  assert.equal(state.players[0].position, 31);
  assert.equal(state.players[0].blockedBy, 'well');
  assert.equal(state.players[1].blockedBy, null);
  assert.ok(events.some((event) => event.type === 'PLAYER_RELEASED' && event.playerId === 'p2'));
});

test('Landing on an occupied Prison releases old prisoner and replaces them', () => {
  const state = markFirstRollDone(makeState(50, 52));
  state.players[1].blockedBy = 'prison';
  state.players[1].blockedSince = 3;
  const events = new RuleEngine(board).applyRoll(state, 'p1', { values: [1, 1], total: 2 });
  assert.equal(state.players[0].blockedBy, 'prison');
  assert.equal(state.players[1].blockedBy, null);
  assert.ok(events.some((event) => event.type === 'BLOCKER_REPLACED'));
});

test('TurnManager consumes delayed turns and returns next playable player', () => {
  const state = markFirstRollDone(makeState());
  state.players[1].skipTurns = 2;
  const turns = new TurnManager(state);
  const first = turns.advance();
  assert.equal(first.player.id, 'p1');
  assert.equal(state.players[1].skipTurns, 1);
  const second = turns.advance();
  assert.equal(second.player.id, 'p1');
  assert.equal(state.players[1].skipTurns, 0);
  const third = turns.advance();
  assert.equal(third.player.id, 'p2');
});

test('TurnManager skips blocked players', () => {
  const state = markFirstRollDone(makeState());
  state.players[1].blockedBy = 'well';
  state.players[1].blockedSince = 1;
  const result = new TurnManager(state).advance();
  assert.equal(result.player.id, 'p1');
  assert.ok(result.events.some((event) => event.type === 'BLOCKED_TURN_SKIPPED'));
});

test('Safety rule releases oldest prisoner if every player is blocked', () => {
  const state = markFirstRollDone(makeState(31, 52));
  state.players[0].blockedBy = 'well';
  state.players[0].blockedSince = 2;
  state.players[1].blockedBy = 'prison';
  state.players[1].blockedSince = 4;
  const result = new TurnManager(state).advance();
  assert.equal(result.player.id, 'p1');
  assert.equal(state.players[0].blockedBy, null);
  assert.ok(result.events.some((event) => event.type === 'SAFETY_RELEASE' && event.playerId === 'p1'));
});

test('Game save/restore preserves the exact next dice sequence', () => {
  const players = [
    { id: 'p1', name: 'A', type: 'human' },
    { id: 'p2', name: 'B', type: 'human' }
  ];
  const original = new Game({ board, seed: 'replay-seed', players });
  original.rollCurrent();
  original.rollCurrent();
  const snapshot = original.save();

  const restored = Game.restore({ board, snapshot });
  const originalEvents = original.rollCurrent();
  const restoredEvents = restored.rollCurrent();
  const originalRoll = originalEvents.find((event) => event.type === 'DICE_ROLLED');
  const restoredRoll = restoredEvents.find((event) => event.type === 'DICE_ROLLED');

  assert.deepEqual(restoredRoll.values, originalRoll.values);
  assert.deepEqual(restored.save(), original.save());
});

test('Same seed and players produce deterministic full event sequences', () => {
  const players = [
    { id: 'p1', name: 'A', type: 'human' },
    { id: 'p2', name: 'B', type: 'human' }
  ];
  const a = new Game({ board, seed: 'same-seed', players });
  const b = new Game({ board, seed: 'same-seed', players });

  for (let i = 0; i < 12 && a.state.status === 'playing' && b.state.status === 'playing'; i += 1) {
    assert.deepEqual(a.rollCurrent(), b.rollCurrent());
  }
  assert.deepEqual(a.save(), b.save());
});
