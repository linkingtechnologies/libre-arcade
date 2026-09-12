// SPDX-License-Identifier: GPL-3.0-or-later
//
// Faithful port of the single-player core of Netris 0.52 (board.c, shapes.c,
// game.c, util.c) by Mark H. Weaver <mhw@netris.org>, 1994-1999.
// See ../../../reference/netris/ for the untouched original C source and
// ../../../specs/port-map.md for the function-by-function mapping.
//
// Deliberately NOT ported: inet.c (network two-player play) and robot.c (a
// pipe protocol for an external bot process — it contains no playing
// algorithm of its own to preserve). curses.c is replaced by ui.js/canvas.
// Preserved as-is, including quirks a modern implementation would "fix":
// no score, no automatic speed-up (the original's own README calls this
// "very boring" and says so), uniform random piece choice with replacement
// (no seven-bag), and rotation that simply fails if it would collide (no
// wall kicks).

export const BOARD_WIDTH = 10;
export const BOARD_VISIBLE = 20;
// netris.h: MAX_BOARD_HEIGHT 64. The extra rows above the visible board
// give a falling piece room to spawn before it scrolls into view.
export const BOARD_HEIGHT = 64;

// board.c: BlockTypeA enum. BT_none is 0; a block's sign (negative) marks it
// as still falling versus frozen, exactly as the original overloads the
// same array for both facts.
export const BT_NONE = 0;
export const BT_WHITE = 1;
export const BT_BLUE = 2;
export const BT_MAGENTA = 3;
export const BT_CYAN = 4;
export const BT_YELLOW = 5;
export const BT_GREEN = 6;
export const BT_RED = 7;

// util.c: "My really crappy random number generator" — Mark Weaver's own
// comment. A linear congruential generator, preserved with its exact
// constants so a given seed reproduces the exact same piece sequence the
// original would have dealt.
export class NetrisRandom {
  constructor(seed) {
    this.seed = ((seed % 31751) + 31751) % 31751 + 1;
  }

  // util.c Random(min, max1): returns an integer in [min, max1).
  next(min, max1) {
    this.seed = (this.seed * 31751 + 15437) % 32767;
    return (this.seed % (max1 - min)) + min;
  }
}

// Dir enum (netris.h): D_down, D_right, D_up, D_left. Rotation is
// "3 & (dir + delta)", i.e. addition mod 4 — RotateDir in shapes.c.
const D_DOWN = 0;
const D_RIGHT = 1;
const D_UP = 2;
const D_LEFT = 3;

function moveInDir(dir, dist, pos) {
  // shapes.c MoveInDir. Note the original's own axis convention: "up"
  // increases y and "down" decreases it, the reverse of a screen's pixel
  // rows — preserved here so the geometry below reads the same as the C.
  switch (dir) {
    case D_DOWN: pos.y -= dist; break;
    case D_RIGHT: pos.x += dist; break;
    case D_UP: pos.y += dist; break;
    case D_LEFT: pos.x -= dist; break;
  }
}

function rotateDir(dir, delta) {
  return (dir + delta) & 3;
}

// C_forw/C_back/C_left/C_right/C_plot/C_end from netris.h's Cmd enum.
const F = "forw", B = "back", L = "left", R = "right", P = "plot";

// shapes.c: each shape is a turtle-graphics program relative to its spawn
// point, not a coordinate table. Preserved verbatim (including the initial
// direction and mirroring flag) because that's how the original represents
// a piece; four/two rotation states link back to each other exactly as the
// FourWayDecl/TwoWayDecl macros build the circular rotateTo chain in C.
function shape(cmds, { mirrored = false, initDir = D_DOWN, type }) {
  return { cmds, mirrored, initDir, type, rotateTo: null };
}

function fourWay(cmds, mirrored, type) {
  const down = shape(cmds, { mirrored, initDir: D_DOWN, type });
  const right = shape(cmds, { mirrored, initDir: D_RIGHT, type });
  const up = shape(cmds, { mirrored, initDir: D_UP, type });
  const left = shape(cmds, { mirrored, initDir: D_LEFT, type });
  // FourWayDecl chains right->up->left->down->right (see StdShape nextDir
  // arguments in shapes.c): left's next is down, up's is left, right's is
  // up, down's is right.
  left.rotateTo = down;
  up.rotateTo = left;
  right.rotateTo = up;
  down.rotateTo = right;
  return { down, right, up, left };
}

function twoWay(cmds, mirrored, type) {
  const horiz = shape(cmds, { mirrored, initDir: D_RIGHT, type });
  const vert = shape(cmds, { mirrored, initDir: D_DOWN, type });
  horiz.rotateTo = vert;
  vert.rotateTo = horiz;
  return { horiz, vert };
}

const cmdsLong = [B, P, F, P, F, P, F, P];
const long_ = twoWay(cmdsLong, false, BT_BLUE);

const cmdsSquare = [P, F, L, P, F, L, P, F, L, P];
const square = shape(cmdsSquare, { initDir: D_UP, type: BT_MAGENTA });
square.rotateTo = square;

const cmdsL = [R, B, P, F, P, F, P, L, F, P];
const l_ = fourWay(cmdsL, false, BT_CYAN);
const l1 = fourWay(cmdsL, true, BT_YELLOW);

const cmdsT = [P, F, P, B, R, F, P, B, B, P];
const t_ = fourWay(cmdsT, false, BT_WHITE);

const cmdsS = [B, P, F, P, L, F, P, R, F, P];
const s_ = twoWay(cmdsS, false, BT_GREEN);
const s1 = twoWay(cmdsS, true, BT_RED);

// stdOptions in shapes.c: the seven standard pieces, equal weight, chosen
// WITH replacement — no seven-bag fairness, faithfully preserved.
const STANDARD_PIECES = [
  long_.horiz, square, l_.down, l1.down, t_.down, s_.horiz, s1.horiz,
];

// shapes.c ChooseOption: weighted random choice; every weight here is 1, so
// this reduces to uniform random, but ported in the original's own general
// form rather than simplified to Math.floor(random() * 7).
export function chooseShape(rng, options = STANDARD_PIECES) {
  const total = options.length;
  const val = (rng.next(0, 32767) / 32768) * total;
  return options[Math.min(options.length - 1, Math.floor(val))];
}

// shapes.c ShapeIterate: interpret a shape's turtle program, calling func
// at each C_plot. Returns func's result at the first non-zero return
// (matching the original's early-exit collision check), or 0.
function shapeIterate(s, originY, originX, falling, func) {
  let y = originY + 0; // shapes' initY/initX are always 0 in stdOptions
  let x = originX + 0;
  let dir = s.initDir;
  const mirror = s.mirrored ? -1 : 1;
  const type = falling ? -s.type : s.type;
  const pos = { y, x };
  for (const cmd of s.cmds) {
    if (cmd === F) moveInDir(dir, 1, pos);
    else if (cmd === B) moveInDir(dir, -1, pos);
    else if (cmd === L) dir = rotateDir(dir, mirror);
    else if (cmd === R) dir = rotateDir(dir, -mirror);
    else if (cmd === P) {
      const result = func(pos.y, pos.x, type);
      if (result) return result;
    }
  }
  return 0;
}

// board.c: the board doubles as its own falling/frozen marker (negative
// values are the falling piece) exactly as the original does.
export class NetrisBoard {
  constructor(width = BOARD_WIDTH, height = BOARD_HEIGHT, visible = BOARD_VISIBLE) {
    this.width = width;
    this.height = height;
    this.visible = visible;
    this.cells = new Array(height * width).fill(BT_NONE);
  }

  index(y, x) {
    return y * this.width + x;
  }

  // board.c GetBlock: off-board to the side or below reads as a wall
  // (collides); above the top reads as empty (a piece can spawn there).
  getBlock(y, x) {
    if (y < 0 || x < 0 || x >= this.width) return "wall";
    if (y >= this.height) return BT_NONE;
    return Math.abs(this.cells[this.index(y, x)]);
  }

  // Unlike getBlock (board.c GetBlock), this returns the raw signed value
  // — negative means "still falling" — the same convention RowUpdate sent
  // over the wire to an external robot in the original. Off-board reads as
  // 0 (out of bounds cells are never part of a legal placement anyway).
  getRaw(y, x) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return 0;
    return this.cells[this.index(y, x)];
  }

  setBlock(y, x, type) {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      this.cells[this.index(y, x)] = type;
    }
  }

  plotShape(s, y, x, falling) {
    shapeIterate(s, y, x, falling, (py, px, type) => {
      this.setBlock(py, px, type);
      return 0;
    });
  }

  eraseShape(s, y, x) {
    shapeIterate(s, y, x, false, (py, px) => {
      this.setBlock(py, px, BT_NONE);
      return 0;
    });
  }

  shapeFits(s, y, x) {
    return !shapeIterate(s, y, x, false, (py, px) => {
      const block = this.getBlock(py, px);
      return block === "wall" || block !== BT_NONE ? 1 : 0;
    });
  }

  // board.c ShapeVisible: true once any part of the shape is within the
  // visible board — used only to find the initial on-screen spawn row.
  shapeVisible(s, y, x) {
    return !!shapeIterate(s, y, x, false, (py, px) =>
      (py >= 0 && py < this.visible && px >= 0 && px < this.width) ? 1 : 0);
  }

  lineIsFull(y) {
    for (let x = 0; x < this.width; ++x) {
      if (this.getBlock(y, x) === BT_NONE) return false;
    }
    return true;
  }

  copyLine(from, to) {
    if (from === to) return;
    for (let x = 0; x < this.width; ++x) {
      this.setBlock(to, x, this.getBlock(from, x));
    }
  }

  // board.c ClearFullLines: compacts by scanning up from the bottom,
  // skipping full rows and copying the rest down — rather than the more
  // common "shift everything above a cleared row down by one" approach.
  clearFullLines() {
    let from = 0;
    let to = 0;
    while (to < this.height) {
      while (this.lineIsFull(from)) ++from;
      this.copyLine(from, to);
      ++from;
      ++to;
    }
    return from - to;
  }

  // board.c FreezePiece: turns every still-falling (negative) block solid.
  freezePiece() {
    for (let i = 0; i < this.cells.length; ++i) {
      if (this.cells[i] < 0) this.cells[i] = -this.cells[i];
    }
  }
}

// game.c OneGame's single-player state machine (GT_onePlayer), stripped of
// networking, the robot pipe, and curses redraw bookkeeping, which have no
// meaning for a solo browser game. Speed, spawning, locking, and line
// clearing follow game.c exactly.
export class NetrisGame {
  constructor({ seed = Date.now(), stepDownInterval = 300000 } = {}) {
    this.board = new NetrisBoard();
    this.rng = new NetrisRandom(seed);
    // game.c DEFAULT_INTERVAL is in microseconds; kept in the same unit so
    // the "faster" key's 0.8 multiplier matches the original exactly.
    this.speed = stepDownInterval;
    this.curShape = null;
    this.curY = 0;
    this.curX = 0;
    this.linesCleared = 0;
    this.gameOver = false;
    // game.c increments its own pieceCount on every new piece (used to tag
    // robot commands with which piece they apply to) — a serial number is
    // the faithful way to tell two spawns of the same piece type apart,
    // since the shape objects themselves are shared singletons.
    this.pieceSerial = 0;
    this.startNewPiece(chooseShape(this.rng));
  }

  // game.c StartNewPiece.
  startNewPiece(s) {
    this.curShape = s;
    this.curY = this.board.visible + 4;
    this.curX = Math.floor(this.board.width / 2);
    while (!this.board.shapeVisible(s, this.curY, this.curX)) --this.curY;
    if (!this.board.shapeFits(s, this.curY, this.curX)) {
      this.gameOver = true;
      return false;
    }
    this.board.plotShape(s, this.curY, this.curX, true);
    ++this.pieceSerial;
    return true;
  }

  // board.c MovePiece.
  movePiece(deltaY, deltaX) {
    this.board.eraseShape(this.curShape, this.curY, this.curX);
    const fits = this.board.shapeFits(this.curShape, this.curY + deltaY, this.curX + deltaX);
    if (fits) {
      this.curY += deltaY;
      this.curX += deltaX;
    }
    this.board.plotShape(this.curShape, this.curY, this.curX, true);
    return fits;
  }

  // board.c RotatePiece: no wall kicks — if the rotated shape doesn't fit
  // exactly where the piece already is, rotation simply fails.
  rotatePiece() {
    this.board.eraseShape(this.curShape, this.curY, this.curX);
    const next = this.curShape.rotateTo;
    const fits = this.board.shapeFits(next, this.curY, this.curX);
    if (fits) this.curShape = next;
    this.board.plotShape(this.curShape, this.curY, this.curX, true);
    return fits;
  }

  // board.c DropPiece: hard drop moves the piece down instantly but, as in
  // the original, does NOT lock it — the next tick does that, same as any
  // other piece that can no longer fall.
  dropPiece() {
    this.board.eraseShape(this.curShape, this.curY, this.curX);
    let count = 0;
    while (this.board.shapeFits(this.curShape, this.curY - 1, this.curX)) {
      --this.curY;
      ++count;
    }
    this.board.plotShape(this.curShape, this.curY, this.curX, true);
    return count;
  }

  // game.c's E_alarm case: called once per tick. Returns true while play
  // continues, false once a piece can't be placed (game over).
  tick() {
    if (this.gameOver) return false;
    if (!this.movePiece(-1, 0)) {
      this.board.freezePiece();
      this.linesCleared += this.board.clearFullLines();
      return this.startNewPiece(chooseShape(this.rng));
    }
    return true;
  }

  // game.c KT_faster: manual, one-way — "Speedups cannot be reversed for
  // the remainder of the game," per the original README.
  goFaster() {
    this.speed *= 0.8;
  }
}
