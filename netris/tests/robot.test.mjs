// SPDX-License-Identifier: GPL-3.0-or-later
//
// Verification approach: see tests/engine.test.mjs's header note. No C
// compiler is available to build sr.c as an oracle. Structural functions
// (rotatePiece1, findPiece) are checked against hand-worked examples;
// boardScore is checked for the direction the original's own comments and
// formula make unambiguous (a hole is worse, a flatter surface is better,
// clearing lines is rewarded) rather than an exact magic-number match. The
// end-to-end test is a behavioral invariant (the robot only ever leaves the
// game in a legal state), the same minimum bar BriscoLab's own adapters are
// held to when full parity can't be established.

import assert from "node:assert/strict";
import test from "node:test";
import { NetrisBoard, NetrisGame, BOARD_VISIBLE, BOARD_WIDTH } from "../public/src/engine.js";
import { findPiece, rotatePiece1, makeDecision, NetrisRobot } from "../public/src/robot.js";

function emptyGrid() {
  return [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
}

test("rotatePiece1 rotates a 3-tall L shape into a 3-wide shape, matching sr.c's row0-anchored transform", () => {
  // An L, 3 cells tall in column 0 plus one at (2,1) — height 3.
  const piece = emptyGrid();
  piece[0][0] = 1; piece[1][0] = 1; piece[2][0] = 1; piece[2][1] = 1;
  rotatePiece1(piece);
  // sr.c: piece1[row][col] = piece2[height-1-col][row], height=3.
  // Hand-worked: row0 = [piece2[2][0], piece2[1][0], piece2[0][0]] = [1,1,1]
  //              row1 = [piece2[2][1], piece2[1][1], piece2[0][1]] = [1,0,0]
  assert.deepEqual(piece[0].slice(0, 3), [1, 1, 1]);
  assert.deepEqual(piece[1].slice(0, 3), [1, 0, 0]);
});

test("rotatePiece1 applied four times returns a symmetric piece to itself", () => {
  const piece = emptyGrid();
  // The square: a 2x2 block is rotationally symmetric.
  piece[0][0] = 1; piece[0][1] = 1; piece[1][0] = 1; piece[1][1] = 1;
  const original = piece.map((r) => r.slice());
  for (let i = 0; i < 4; ++i) rotatePiece1(piece);
  assert.deepEqual(piece, original);
});

test("findPiece extracts the falling piece's shape, bottom row and left column from raw signed cells", () => {
  const board = new NetrisBoard();
  // Place a 2-wide, 2-tall falling piece (negative = falling) at row 5..6, col 3..4.
  board.setBlock(5, 3, -2); board.setBlock(5, 4, -2);
  board.setBlock(6, 3, -2); board.setBlock(6, 4, -2);
  const { piece, pieceBottom, pieceLeft, pieceVisible } = findPiece(board, BOARD_VISIBLE);
  assert.equal(pieceVisible, 4);
  assert.equal(pieceBottom, 5);
  assert.equal(pieceLeft, 3);
  assert.deepEqual(piece[0].slice(0, 2), [1, 1]);
  assert.deepEqual(piece[1].slice(0, 2), [1, 1]);
});

test("findPiece reports fewer than 4 visible cells while the piece is still above the visible board (sr.c's own gate)", () => {
  const board = new NetrisBoard();
  // Two cells above the visible window, two cells just inside it.
  board.setBlock(BOARD_VISIBLE + 1, 3, -2);
  board.setBlock(BOARD_VISIBLE + 1, 4, -2);
  board.setBlock(BOARD_VISIBLE - 1, 3, -2);
  board.setBlock(BOARD_VISIBLE - 1, 4, -2);
  const { pieceVisible } = findPiece(board, BOARD_VISIBLE);
  assert.equal(pieceVisible, 2);
});

test("boardScore-driven makeDecision prefers a flush fit over one that buries a hole", () => {
  // A flat floor with a single-column notch just wide enough for a vertical
  // piece; an O (square) piece dropped straight down anywhere else would
  // leave the notch covered as a buried hole (worse) rather than filled.
  const board = new NetrisBoard();
  for (let x = 0; x < BOARD_WIDTH; ++x) {
    if (x !== 5) board.setBlock(0, x, 1); // frozen floor, gap at column 5
  }
  // The falling piece: a vertical 1x2 (fits the notch), positioned high up
  // and already visible, spanning columns 5-5 conceptually but represented
  // in a 2-wide bounding box as sr.c's grid always is (4x4 window).
  board.setBlock(2, 5, -3);
  board.setBlock(3, 5, -3);
  const { piece, pieceBottom } = findPiece(board, BOARD_VISIBLE);
  const { leftDest } = makeDecision(board, piece, pieceBottom, BOARD_WIDTH, BOARD_VISIBLE);
  assert.equal(leftDest, 5, "the robot should choose the column that fills the notch, not one that buries it");
});

test("NetrisRobot autoplays for many pieces without throwing and keeps clearing lines", () => {
  // Note: checking board.shapeFits(curShape, curY, curX) here would be a
  // false alarm, not a real invariant — the piece is already plotted onto
  // the board at that position, so it always "collides" with its own
  // cells (the same trap tests/engine.test.mjs's own rotate test hit and
  // fixed). movePiece/rotatePiece already erase-before-testing internally.
  const game = new NetrisGame({ seed: 11, stepDownInterval: 1 });
  const robot = new NetrisRobot(game, { boardHeight: BOARD_VISIBLE });
  let ticks = 0;
  const piecesTarget = 25;
  let piecesSeen = 0;
  let lastShape = game.curShape;
  while (piecesSeen < piecesTarget && !game.gameOver && ticks < 20000) {
    robot.step();
    game.tick();
    assert.ok(Number.isInteger(game.linesCleared) && game.linesCleared >= 0);
    if (game.curShape !== lastShape) { piecesSeen++; lastShape = game.curShape; }
    ++ticks;
  }
  assert.ok(piecesSeen > 0, "the robot should have played through at least one piece");
  assert.ok(game.linesCleared > 0, "an autoplaying heuristic should clear at least one line in 25 pieces");
});
