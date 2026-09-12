// SPDX-License-Identifier: GPL-3.0-or-later
//
// Faithful port of sr.c ("a sample robot for Netris"), Mark H. Weaver,
// 1994-1996 — a heuristic that scores every rotation/column placement of
// the falling piece and plays the lowest-scoring one. In the original this
// ran as a separate process talking to robot.c over a text pipe; here it
// reads the same board.c-style signed board array directly and drives
// engine.js's NetrisGame instead of writing "Rotate"/"Left"/"Right"/"Drop"
// lines to stdout. The decision algorithm itself (findPiece, rotatePiece1,
// pieceFits, simPlacement, boardScore, makeDecision) is transcribed
// function-for-function from sr.c, not redesigned — see
// ../../../specs/port-map.md.
//
// sr.c only ever saw the visible board (game.c sends RowUpdate for rows
// 0..boardVisible-1 only), so — faithfully — this robot cannot "see" a
// piece until it has fallen far enough to be fully within the visible
// rows, exactly matching the original's own "if (pieceVisible < 4) return"
// gate.

const MAX_BOARD_HEIGHT = 64; // sr.c's own array bound, unrelated to engine.js's

// sr.c FindPiece: scan the visible board for the falling (negative) piece
// and extract it as a 4x4 grid anchored at its bottom-left corner.
export function findPiece(board, boardHeight) {
  let pieceVisible = 0;
  let pieceBottom = MAX_BOARD_HEIGHT;
  let pieceLeft = board.width;
  for (let row = boardHeight - 1; row >= 0; --row) {
    for (let col = board.width - 1; col >= 0; --col) {
      if (board.getRaw(row, col) < 0) {
        pieceBottom = row;
        if (pieceLeft > col) pieceLeft = col;
        pieceVisible++;
      }
    }
  }
  const piece = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  if (pieceVisible > 0) {
    for (let row = 0; row < 4; ++row) {
      for (let col = 0; col < 4; ++col) {
        piece[row][col] = board.getRaw(pieceBottom + row, pieceLeft + col) < 0 ? 1 : 0;
      }
    }
  }
  return { piece, pieceBottom, pieceLeft, pieceVisible };
}

// sr.c RotatePiece1: rotate a 4x4 grid 90°, keeping it anchored to row 0
// and packed to the piece's actual height rather than the full 4 rows.
export function rotatePiece1(piece1) {
  let height = 0;
  const piece2 = piece1.map((row) => row.slice());
  for (let row = 0; row < 4; ++row) {
    for (let col = 0; col < 4; ++col) {
      piece1[row][col] = 0;
      if (piece2[row][col]) height = row + 1;
    }
  }
  for (let row = 0; row < 4; ++row) {
    for (let col = 0; col < height; ++col) {
      piece1[row][col] = piece2[height - col - 1][row];
    }
  }
  return height;
}

// sr.c PieceFits: does piece1 fit at (row, col) against the raw board
// (only frozen/positive cells collide — the piece's own prior position,
// still negative, is ignored, exactly as the original does).
function pieceFits(board, piece1, row, col, boardWidth) {
  if (row < 0) return false;
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      if (piece1[i][j]) {
        if (col + j >= boardWidth) return false;
        const cell = board.getRaw(row + i, col + j);
        if (cell !== undefined && cell > 0) return false;
      }
    }
  }
  return true;
}

// sr.c SimPlacement: overlay piece1 at (row, col) onto a boolean copy of
// the board, then compact full rows away with the same from/to scan as
// board.c ClearFullLines. Returns { board1, linesCleared }.
function simPlacement(board, piece1, row, col, boardWidth, boardHeight) {
  const board1 = [];
  for (let i = 0; i < boardHeight; ++i) {
    const r = new Array(boardWidth);
    for (let j = 0; j < boardWidth; ++j) {
      let cell = (board.getRaw(i, j) ?? 0) > 0 ? 1 : 0;
      if (i >= row && i < row + 4 && j >= col && j < col + 4 && piece1[i - row][j - col]) {
        cell = 1;
      }
      r[j] = cell;
    }
    board1.push(r);
  }
  let from = 0;
  let to = 0;
  while (to < boardHeight) {
    let count = boardWidth;
    const src = board1[from] ?? new Array(boardWidth).fill(0);
    for (let j = 0; j < boardWidth; ++j) {
      board1[to][j] = src[j];
      count -= src[j];
    }
    if (count > 0) ++to;
    ++from;
  }
  return { board1, linesCleared: from - to };
}

// sr.c BoardScore: lower is better. Rewards a flat, hole-free surface with
// nothing hard to reach, penalized further up the board it sits, minus a
// bonus for lines the placement would clear.
function boardScore(board1, linesCleared, pRow, boardWidth, boardHeight) {
  const height = new Array(boardWidth).fill(0);
  const holes = new Array(boardWidth).fill(0);
  const holesTimesDepth = new Array(boardWidth).fill(0);
  const cover = new Array(boardWidth).fill(0);
  const hardFit = new Array(boardHeight).fill(0);
  const depend = new Array(boardHeight).fill(0);
  let maxHeight = 0;
  let space = 0;
  let topShape = 0;
  let fitProbs = 0;

  for (let col = 0; col < boardWidth; ++col) {
    for (let row = 0; row < boardHeight; ++row) {
      if (board1[row][col]) height[col] = row + 1;
    }
    if (maxHeight < height[col]) maxHeight = height[col];
    for (let row = 0; row < height[col]; ++row) {
      if (board1[row][col]) holesTimesDepth[col] += holes[col];
      else holes[col]++;
    }
  }

  for (let row = maxHeight - 1; row >= 0; --row) {
    depend[row] = 0;
    for (let col = 0; col < boardWidth; ++col) {
      if (board1[row][col]) cover[col] |= 1 << row;
      else depend[row] |= cover[col];
    }
    for (let i = row + 1; i < maxHeight; ++i) {
      if (depend[row] & (1 << i)) depend[row] |= depend[i];
    }
  }

  for (let row = maxHeight - 1; row >= 0; --row) {
    hardFit[row] = 5;
    let count = 0;
    for (let col = 0; col < boardWidth; ++col) {
      if (board1[row][col]) {
        space += 0.5;
      } else {
        count++;
        space += 1;
        hardFit[row]++;
        if (height[col] < row) hardFit[row] += row - height[col];
        const deltaLeft = col > 0 ? height[col - 1] - row : MAX_BOARD_HEIGHT;
        const deltaRight = col < boardWidth - 1 ? height[col + 1] - row : MAX_BOARD_HEIGHT;
        if (deltaLeft > 2 && deltaRight > 2) hardFit[row] += 7;
        else if (deltaLeft > 2 || deltaRight > 2) hardFit[row] += 2;
        else if (Math.abs(deltaLeft) === 2 && Math.abs(deltaRight) === 2) hardFit[row] += 2;
        else if (Math.abs(deltaLeft) === 2 || Math.abs(deltaRight) === 2) hardFit[row] += 3;
      }
    }
    let maxHard = 0;
    for (let i = row + 1; i < row + 5 && i < maxHeight; ++i) {
      if (depend[row] & (1 << i)) {
        if (maxHard < hardFit[i]) maxHard = hardFit[i];
      }
    }
    fitProbs += maxHard * count;
  }

  for (let col = 0; col < boardWidth; ++col) {
    const deltaLeft = col > 0 ? height[col - 1] - height[col] : MAX_BOARD_HEIGHT;
    const deltaRight = col < boardWidth - 1 ? height[col + 1] - height[col] : MAX_BOARD_HEIGHT;
    if (deltaLeft > 2 && deltaRight > 2) {
      topShape += 15 + 15 * Math.trunc(Math.min(deltaLeft, deltaRight) / 4);
    } else if (deltaLeft > 2 || deltaRight > 2) topShape += 2;
    else if (Math.abs(deltaLeft) === 2 && Math.abs(deltaRight) === 2) topShape += 2;
    else if (Math.abs(deltaLeft) === 2 || Math.abs(deltaRight) === 2) topShape += 3;
  }

  let closeToTop = pRow / boardHeight;
  closeToTop = closeToTop * closeToTop * 200;
  space /= 2;
  return space + closeToTop + topShape + fitProbs - linesCleared * 10;
}

// sr.c MakeDecision: try all 4 rotations in every column, keep the
// lowest-scoring legal placement. `pieceBottom` is the piece's current row
// (from findPiece) — the original starts its drop simulation from where
// the piece already is, not from the top of the board.
export function makeDecision(board, piece, pieceBottom, boardWidth, boardHeight) {
  let piece1 = piece.map((row) => row.slice());
  let first = true;
  let minScore = 0;
  let pieceDest = piece1;
  let leftDest = 0;
  for (let rot = 0; rot < 4; ++rot) {
    rotatePiece1(piece1);
    for (let col = 0; col < boardWidth; ++col) {
      if (!pieceFits(board, piece1, pieceBottom, col, boardWidth)) continue;
      let row = pieceBottom;
      while (pieceFits(board, piece1, row - 1, col, boardWidth)) --row;
      const { board1, linesCleared } = simPlacement(board, piece1, row, col, boardWidth, boardHeight);
      const score = boardScore(board1, linesCleared, row, boardWidth, boardHeight);
      if (first || minScore > score) {
        first = false;
        minScore = score;
        pieceDest = piece1.map((r) => r.slice());
        leftDest = col;
      }
    }
  }
  return { pieceDest, leftDest };
}

function sameGrid(a, b) {
  for (let i = 0; i < 4; ++i) for (let j = 0; j < 4; ++j) if (a[i][j] !== b[i][j]) return false;
  return true;
}

// Driver loop, replacing sr.c's own TimeStamp-driven state machine
// (pieceState 0=undecided, 1=decided, 2=move in progress). Call step()
// on a fixed interval (sr.c re-evaluated on the game's own tick and moved
// at most once per 0.5s of simulated time); it issues at most one
// rotate/move/drop per call, exactly as the original moved one step at a
// time rather than teleporting the piece into place.
export class NetrisRobot {
  constructor(game, { boardHeight = 20 } = {}) {
    this.game = game;
    this.boardHeight = boardHeight;
    this.pieceDest = null;
    this.leftDest = null;
    // game.c's own pieceCount, not the shape object's identity: two spawns
    // of the same piece type (e.g. two squares in a row) are the same
    // singleton object but must not be treated as "already decided".
    this.decidedForSerial = -1;
  }

  step() {
    const { game } = this;
    if (game.gameOver) return;
    const { piece, pieceBottom, pieceLeft, pieceVisible } = findPiece(game.board, this.boardHeight);
    if (pieceVisible < 4) return; // sr.c: not fully visible yet, wait
    if (this.decidedForSerial !== game.pieceSerial) {
      const { pieceDest, leftDest } = makeDecision(
        game.board, piece, pieceBottom, game.board.width, this.boardHeight);
      this.pieceDest = pieceDest;
      this.leftDest = leftDest;
      this.decidedForSerial = game.pieceSerial;
      return;
    }
    if (!sameGrid(piece, this.pieceDest)) {
      game.rotatePiece();
    } else if (pieceLeft !== this.leftDest) {
      game.movePiece(0, pieceLeft < this.leftDest ? 1 : -1);
    } else {
      game.dropPiece();
    }
  }
}
