/* Copyright (C) 2026 Libre Arcade contributors; SPDX-License-Identifier: AGPL-3.0-or-later */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initialGame, clickCell, restart, undo, progress, candidates,
  indexOf, coordinates, inspect, CELL_COUNT,
} from '../public/src/game.js';

const at = (x, y) => indexOf(x, y);
const proposed = state => state.proposed.slice().sort((a,b) => a-b);
function expectProposed(state, coords) {
  assert.deepEqual(proposed(state), coords.map(([x,y]) => at(x,y)).sort((a,b) => a-b));
}
function pathFromCsv(name, variant = null) {
  const lines = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8').trim().split(/\r?\n/).slice(1);
  return lines.map(line => line.split(',').map(Number)).filter(cols => variant === null || (cols[0] === variant[0] && cols[1] === variant[1]))
    .map(cols => name.startsWith('blocked') ? at(cols[1], cols[2]) : at(cols[3], cols[4]));
}
function play(path) {
  let state = initialGame();
  for (let i = 0; i < path.length; i++) {
    const after = clickCell(state, path[i]);
    assert.notStrictEqual(after, state, `move ${i + 1} accepted`);
    assert.equal(after.board[path[i]], i + 1, `value at move ${i + 1}`);
    assert.equal(progress(after), i + 1);
    state = after;
  }
  return state;
}

test('T01 startup: 100 blank squares, top-left offered, Undo disabled as a UX repair', () => {
  const state = initialGame();
  assert.equal(state.board.length, CELL_COUNT);
  assert.equal(progress(state), 0);
  assert.equal(state.last, at(0, 0));
  expectProposed(state, [[0,0]]);
  assert.equal(state.undoEnabled, false);
  assert.strictEqual(undo(state), state);
  assert.equal(state.ended, false);
});

test('T02 first move: (0,0) fills 1; two knight destinations', () => {
  const s = clickCell(initialGame(), at(0,0));
  assert.equal(s.board[0], 1);
  expectProposed(s, [[2,1],[1,2]]);
  assert.equal(s.undoEnabled, true);
});

test('T03-06: rejected nearby, occupied, and far clicks; second accepted knight move', () => {
  let s = clickCell(initialGame(), at(0,0));
  assert.strictEqual(clickCell(s, at(0,1)), s);
  s = clickCell(s, at(1,2));
  assert.equal(s.board[at(1,2)], 2);
  expectProposed(s, [[2,0],[3,1],[3,3],[0,4],[2,4]]);
  assert.strictEqual(clickCell(s, at(0,0)), s);
  assert.strictEqual(clickCell(s, at(9,9)), s);
  assert.strictEqual(clickCell(s, -1), s);
  assert.strictEqual(clickCell(s, 100), s);
  assert.strictEqual(clickCell(s, 1.5), s);
});

test('T07-10: single-step undo and explicit restart, with first-move undo repaired', () => {
  let s = clickCell(clickCell(initialGame(), at(0,0)), at(1,2));
  s = undo(s);
  assert.equal(progress(s), 1);
  assert.equal(s.last, at(0,0));
  expectProposed(s, [[2,1],[1,2]]);
  assert.equal(s.undoEnabled, false);
  assert.strictEqual(undo(s), s);
  s = restart(s);
  assert.equal(progress(s), 0);
  expectProposed(s, [[0,0]]);
  assert.equal(s.undoEnabled, false);
  s = undo(clickCell(s, at(0,0)));
  assert.equal(progress(s), 0);
  assert.equal(s.board[0], 0);
  assert.equal(s.ended, false);
  expectProposed(s, [[0,0]]); // Original Java instead proposed (2,1),(1,2).
  assert.strictEqual(clickCell(s, at(1,2)), s);
  s = clickCell(s, at(0,0));
  assert.equal(s.board[0], 1);
  s = restart(s);
  expectProposed(s, [[0,0]]);
  assert.equal(s.ended, false);
});

test('T11-12: complete historical 100-cell witness, then fully reset flags with New game', () => {
  const path = pathFromCsv('hamiltonian_witnesses.csv', [0,0]);
  assert.equal(path.length, 100);
  let s = play(path);
  assert.equal(progress(s), 100);
  assert.equal(s.board[s.last], 100);
  assert.deepEqual(s.proposed, []);
  assert.equal(s.ended, true);
  assert.equal(s.undoEnabled, true);
  assert.strictEqual(clickCell(s, at(0,0)), s); // No silent reset on game-board click.
  s = restart(s);
  assert.equal(progress(s), 0);
  expectProposed(s, [[0,0]]);
  assert.equal(s.ended, false); // Original Java retained ended=true.
  assert.equal(s.undoEnabled, false);
  assert.equal(clickCell(s, at(0,0)).board[0], 1);
});

test('T13-15: historical 24-cell dead end; preserve board until Undo or New game', () => {
  const path = pathFromCsv('blocked_path.csv');
  assert.equal(path.length, 24);
  let s = play(path);
  assert.equal(s.ended, true);
  assert.deepEqual(s.proposed, []);
  assert.strictEqual(clickCell(s, at(9,9)), s); // No silent reset.
  assert.equal(progress(s), 24);
  const rescued = undo(s);
  assert.equal(progress(rescued), 23);
  assert.equal(rescued.ended, false);
  assert.ok(rescued.proposed.includes(s.last));
  s = restart(s);
  assert.equal(progress(s), 0);
  assert.equal(s.ended, false);
  expectProposed(s, [[0,0]]);
  s = clickCell(s, at(0,0));
  assert.equal(progress(s), 1);
  assert.equal(s.ended, false);
});

test('restart is idempotent and never leaves stale game-end/undo flags', () => {
  let s = clickCell(initialGame(), at(0,0));
  s = restart(restart(s));
  assert.deepEqual(s, initialGame());
  assert.equal(s.undoEnabled, false);
  assert.strictEqual(undo(s), s);
});

test('knight moves only; 8 targets at a central cell, independent of occupied intermediate cells', () => {
  const board = Array(CELL_COUNT).fill(0);
  const moves = candidates(board, at(4,4));
  assert.equal(moves.length, 8);
  for (const target of moves) {
    const a = coordinates(at(4,4)), b = coordinates(target);
    assert.deepEqual([Math.abs(b.x-a.x),Math.abs(b.y-a.y)].sort(), [1,2]);
  }
  board[at(4,3)] = 9;
  board[at(5,6)] = 7;
  const after = candidates(board, at(4,4));
  assert.equal(after.length, 7);
  assert.ok(!after.includes(at(5,6)));
});

test('15 archived mathematical witnesses all remain valid 100-cell paths, not used as solver by game', () => {
  const witnessLines = readFileSync(new URL('./fixtures/hamiltonian_witnesses.csv', import.meta.url),'utf8').trim().split(/\r?\n/).slice(1);
  const byStart = new Map();
  for (const line of witnessLines) {
    const [sx, sy, ordinal, x, y] = line.split(',').map(Number);
    const key = `${sx},${sy}`;
    if (!byStart.has(key)) byStart.set(key, []);
    assert.equal(byStart.get(key).length + 1, ordinal);
    byStart.get(key).push(at(x,y));
  }
  assert.equal(byStart.size, 15);
  for (const path of byStart.values()) {
    assert.equal(path.length, 100);
    assert.equal(new Set(path).size, 100);
    let board = Array(100).fill(0);
    for (let i=1; i<path.length; i++) {
      board[path[i-1]] = i;
      assert.ok(candidates(board,path[i-1]).includes(path[i]));
    }
  }
});

test('main menu state continuity can be modeled without reset', () => {
  const state = clickCell(initialGame(), 0);
  assert.equal(inspect(state).used, 1);
  assert.equal(inspect(state).last.x, 0);
});
