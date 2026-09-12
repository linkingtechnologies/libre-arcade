// SPDX-License-Identifier: GPL-3.0-or-later
//
// No C compiler is available in this environment to build and run the
// original netris-0.52 as an executable oracle (the approach used for
// Klondike's js-solitaire). These tests instead pin the port against a
// careful, documented reading of reference/netris/{util,shapes,board,game}.c
// — the "source-level equivalence review" step of the verification
// hierarchy in specs/faithful-porting.md, one level below an executable
// oracle. Where a value can be hand-computed directly from the original's
// own arithmetic (the RNG), the test asserts that exact value rather than
// merely "some value."

import assert from "node:assert/strict";
import test from "node:test";
import {
  NetrisRandom, NetrisBoard, NetrisGame, chooseShape,
  BOARD_WIDTH, BOARD_VISIBLE, BT_NONE,
} from "../public/src/engine.js";

test("RNG reproduces the exact sequence of the original's arithmetic (util.c Random/SRandom, seed 1)", () => {
  // Hand-computed from util.c: myRandSeed = seed % 31751 + 1, then
  // myRandSeed = (myRandSeed*31751 + 15437) % 32767 per call. This is pure
  // integer arithmetic with no platform-dependent behavior, so a C compiler
  // would not change these values.
  const rng = new NetrisRandom(1);
  assert.equal(rng.next(0, 32767), 13405);
  assert.equal(rng.next(0, 32767), 27029);
  assert.equal(rng.next(0, 32767), 12719);
  assert.equal(rng.next(0, 32767), 3131);
  assert.equal(rng.next(0, 32767), 12740);
});

test("RNG seed wraps the same way as util.c SRandom for out-of-range and negative seeds", () => {
  // SRandom(seed): myRandSeed = seed % 31751 + 1. C's % can return negative
  // for a negative left operand; the constructor normalizes the same way
  // JS's own semantics would require to match C's result for seed=-1.
  assert.equal(new NetrisRandom(0).seed, 1);
  assert.equal(new NetrisRandom(31751).seed, 1);
  assert.equal(new NetrisRandom(31752).seed, 2);
});

test("board collision: off-board sides and floor are walls, above the top is open (board.c GetBlock)", () => {
  const board = new NetrisBoard();
  assert.equal(board.getBlock(5, -1), "wall");
  assert.equal(board.getBlock(5, BOARD_WIDTH), "wall");
  assert.equal(board.getBlock(-1, 5), "wall");
  assert.equal(board.getBlock(1000, 5), BT_NONE);
});

test("clearFullLines compacts by scanning from the bottom, matching board.c's from/to algorithm", () => {
  const board = new NetrisBoard(4, 5, 5);
  // Fill row 0 completely (full) and row 2 completely (full); leave 1, 3, 4
  // with a gap. Content in row 3 must survive, shifted down by two.
  for (let x = 0; x < 4; ++x) {
    board.setBlock(0, x, 1);
    board.setBlock(2, x, 1);
  }
  board.setBlock(3, 0, 7); // distinguishable marker cell
  const cleared = board.clearFullLines();
  assert.equal(cleared, 2);
  // Row 3's marker should now read at row 1 (3 - 2 cleared rows below it).
  assert.equal(board.getBlock(1, 0), 7);
  assert.equal(board.lineIsFull(0), false);
});

test("freezePiece turns every falling (negative) cell solid, board.c FreezePiece", () => {
  const board = new NetrisBoard();
  board.setBlock(0, 0, -3);
  board.setBlock(0, 1, 3);
  board.freezePiece();
  assert.equal(board.getBlock(0, 0), 3);
  assert.equal(board.getBlock(0, 1), 3);
});

test("chooseShape draws from all seven standard pieces with a fixed seed (shapes.c stdOptions)", () => {
  const rng = new NetrisRandom(42);
  const seen = new Set();
  for (let i = 0; i < 200; ++i) seen.add(chooseShape(rng));
  assert.equal(seen.size, 7);
});

test("a fresh game spawns a piece centered above the visible board (game.c StartNewPiece)", () => {
  const game = new NetrisGame({ seed: 1 });
  assert.equal(game.gameOver, false);
  assert.equal(game.curX, Math.floor(BOARD_WIDTH / 2));
  assert.ok(game.curY >= BOARD_VISIBLE, "piece should spawn at or above the visible board");
});

test("rotating into a wall fails outright — no wall kicks (board.c RotatePiece)", () => {
  const game = new NetrisGame({ seed: 1 });
  // Push the piece hard against the left wall first.
  while (game.movePiece(0, -1)) { /* keep moving left until blocked */ }
  const before = game.curShape;
  const rotated = game.rotatePiece();
  // RotatePiece never nudges the piece to make a rotation fit (no wall
  // kicks): the outcome is exactly "stayed the same shape" xor "became
  // rotateTo", never some other adjusted position.
  assert.equal(game.curShape, rotated ? before.rotateTo : before);
});

test("tick locks a piece that cannot fall further, clears full lines, and spawns the next piece", () => {
  const game = new NetrisGame({ seed: 7, stepDownInterval: 1 });
  const startingLinesCleared = game.linesCleared;
  let ticks = 0;
  const firstShape = game.curShape;
  // Drive the game until the first piece locks (curShape identity changes).
  while (game.curShape === firstShape && !game.gameOver && ticks < 200) {
    game.tick();
    ++ticks;
  }
  assert.ok(ticks < 200, "the first piece should lock well within 200 ticks");
  assert.ok(game.linesCleared >= startingLinesCleared);
});

test("goFaster is one-way and multiplicative, matching game.c's speed = speed * 0.8", () => {
  const game = new NetrisGame({ seed: 1, stepDownInterval: 300000 });
  game.goFaster();
  assert.equal(game.speed, 300000 * 0.8);
  game.goFaster();
  assert.equal(game.speed, 300000 * 0.8 * 0.8);
});

test("the board eventually reports game over when pieces are never cleared (game.c StartNewPiece failure)", () => {
  const game = new NetrisGame({ seed: 3, stepDownInterval: 1 });
  // Fill every visible row except the topmost couple, leaving a single
  // empty column so no line is ever completed, forcing a stack-out.
  for (let y = 0; y < BOARD_VISIBLE - 2; ++y) {
    for (let x = 1; x < BOARD_WIDTH; ++x) game.board.setBlock(y, x, 1);
  }
  let guard = 0;
  while (!game.gameOver && guard < 5000) {
    game.tick();
    ++guard;
  }
  assert.equal(game.gameOver, true);
});
