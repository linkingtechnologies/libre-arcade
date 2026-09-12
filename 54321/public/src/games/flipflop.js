import { Cube } from '../core/cube.js';
import { mulberry32, normalizeSeed } from '../core/prng.js';

const TOGGLE_TABLE = [
  [0, 0, 0],
  [1, 2, 3],
  [3, 5, 8],
  [5, 8, 12],
  [8, 16, 32],
];

export class FlipFlop {
  constructor({ dimensions = 2, skillLevel = 0, wrap = true, seed = Date.now() } = {}) {
    this.cube = new Cube();
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.seed = normalizeSeed(seed);
    this.onCount = 0;
    this.hasWon = false;
    this.actualMoves = 0;
    this.expectedMoves = 0;
    this.scrambleMoves = [];
    this.reset(this.seed);
  }

  reset(seed = Date.now()) {
    this.seed = normalizeSeed(seed);
    const random = mulberry32(this.seed);
    this.cube.fill(0);
    this.onCount = 0;
    this.hasWon = false;
    this.actualMoves = 0;

    const toggles = TOGGLE_TABLE[this.dimensions][this.skillLevel];
    this.expectedMoves = toggles;
    this.scrambleMoves = [];
    const available = Array.from({ length: Cube.ARRAY_LENGTHS[this.dimensions] }, (_, i) => i);

    // Equivalent to the original: choose each scramble cell at most once,
    // then apply a normal Flip-Flop move to it.
    for (let i = 0; i < toggles; i += 1) {
      const pick = Math.floor(random() * available.length);
      const index = available.splice(pick, 1)[0];
      this.scrambleMoves.push(index);
      this.flip(index, { countMove: false });
    }

    this.actualMoves = 0;
    this.hasWon = false;
  }

  configure({ dimensions = this.dimensions, skillLevel = this.skillLevel, wrap = this.wrap } = {}) {
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.reset(Date.now());
  }

  affectedCells(index) {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!Number.isInteger(index) || index < 0 || index >= len) return [];
    const out = [{ index, center: true, axis: null, dimensional: false, wrapped: false }];
    for (const neighbor of Cube.getNeighbors(index, this.dimensions, this.wrap)) {
      out.push({ index: neighbor, center: false, ...Cube.describeNeighbor(index, neighbor, this.dimensions, this.wrap) });
    }
    return out;
  }

  flip(index, { countMove = true } = {}) {
    if (!this.hasWon && countMove) this.actualMoves += 1;
    this.#toggle(index);
    for (const neighbor of Cube.getNeighbors(index, this.dimensions, this.wrap)) {
      this.#toggle(neighbor);
    }
    if (countMove && !this.hasWon && this.onCount === 0) {
      this.hasWon = true;
    }
    return this.hasWon;
  }

  #toggle(index) {
    if (this.cube.toggle(index) === 0) this.onCount -= 1;
    else this.onCount += 1;
  }
}
