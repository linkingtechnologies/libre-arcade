import { Cube } from '../core/cube.js';
import { mulberry32, normalizeSeed } from '../core/prng.js';

export const BOMB_CELL = {
  COUNT_MASK: 0x0fff,
  UNCOVERED: 0x1000,
  BOMB: 0x2000,
  FLAG: 0x4000,
};

const BOMB_TABLE = [
  [0, 0, 0],
  [1, 2, 3],
  [2, 4, 8],
  [4, 8, 16],
  [16, 32, 64],
];

export class BombSquad {
  constructor({ dimensions = 2, skillLevel = 0, wrap = true, seed = Date.now() } = {}) {
    if (dimensions < 2 || dimensions > Cube.DIMENSIONS) {
      throw new RangeError('Bomb Squad supports 2D, 3D and 4D only.');
    }
    this.cube = new Cube();
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.seed = normalizeSeed(seed);
    this.bombCount = 0;
    this.flagCount = 0;
    this.coveredCount = 0;
    this.gameOver = false;
    this.hasWon = false;
    this.hasLost = false;
    this.reset(this.seed);
  }

  reset(seed = Date.now()) {
    this.seed = normalizeSeed(seed);
    const random = mulberry32(this.seed);
    this.cube.fill(0);

    const bombs = BOMB_TABLE[this.dimensions][this.skillLevel];
    let len = Cube.ARRAY_LENGTHS[this.dimensions];
    const used = [];

    // Faithful to bomb.cpp: select a compact index, expand it around the
    // sorted lookup table of already-used indices, then update neighbours.
    for (let i = 0; i < bombs; i += 1) {
      let index = Math.floor(random() * len);
      len -= 1;
      for (const occupied of used) {
        if (index >= occupied) index += 1;
      }

      this.cube.set(index, this.cube.get(index) | BOMB_CELL.BOMB);
      for (const neighbor of Cube.getNeighbors(index, this.dimensions, this.wrap)) {
        this.cube.set(neighbor, this.cube.get(neighbor) + 1);
      }

      let spot = used.length;
      while (spot > 0 && used[spot - 1] > index) spot -= 1;
      used.splice(spot, 0, index);
    }

    this.bombCount = bombs;
    this.flagCount = 0;
    this.coveredCount = Cube.ARRAY_LENGTHS[this.dimensions];
    this.gameOver = false;
    this.hasWon = false;
    this.hasLost = false;
  }

  configure({ dimensions = this.dimensions, skillLevel = this.skillLevel, wrap = this.wrap } = {}) {
    if (dimensions < 2 || dimensions > Cube.DIMENSIONS) {
      throw new RangeError('Bomb Squad supports 2D, 3D and 4D only.');
    }
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.reset(Date.now());
  }

  neighborsOf(index) {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!Number.isInteger(index) || index < 0 || index >= len) return [];
    return Cube.getNeighbors(index, this.dimensions, this.wrap).map((neighbor) => ({
      index: neighbor,
      ...Cube.describeNeighbor(index, neighbor, this.dimensions, this.wrap),
    }));
  }

  uncover(index, { click = true } = {}) {
    const cell = this.cube.get(index);
    if ((cell & (BOMB_CELL.UNCOVERED | BOMB_CELL.FLAG)) !== 0) {
      return this.state();
    }

    this.coveredCount -= 1;
    this.cube.set(index, cell | BOMB_CELL.UNCOVERED);

    if ((cell & BOMB_CELL.BOMB) !== 0) {
      if (!this.gameOver) {
        this.gameOver = true;
        this.hasLost = true;
      }
    } else if ((cell & BOMB_CELL.COUNT_MASK) === 0) {
      for (const neighbor of Cube.getNeighbors(index, this.dimensions, this.wrap)) {
        this.uncover(neighbor, { click: false });
      }
    }

    if (click) this.#checkWinningCondition();
    return this.state();
  }

  toggleFlag(index) {
    const cell = this.cube.get(index);
    if ((cell & BOMB_CELL.UNCOVERED) !== 0) return this.state();

    const flagged = (cell & BOMB_CELL.FLAG) !== 0;
    this.cube.set(index, cell ^ BOMB_CELL.FLAG);
    this.flagCount += flagged ? -1 : 1;
    this.#checkWinningCondition();
    return this.state();
  }

  state() {
    return {
      bombCount: this.bombCount,
      flagCount: this.flagCount,
      coveredCount: this.coveredCount,
      gameOver: this.gameOver,
      hasWon: this.hasWon,
      hasLost: this.hasLost,
    };
  }

  #checkWinningCondition() {
    if (!this.gameOver && this.flagCount === this.bombCount && this.coveredCount === this.bombCount) {
      this.gameOver = true;
      this.hasWon = true;
    }
  }
}
