import { Cube } from '../core/cube.js';
import { mulberry32, normalizeSeed } from '../core/prng.js';

const SWAP_COUNT = [2, 4, 8];

function determineAxis(from, to, wrapping) {
  let axis = -1;
  let positive = true;
  let diffCount = 0;

  for (let i = 0; i < Cube.DIMENSIONS; i += 1) {
    const diff = to[i] - from[i];
    if (diff === 0) continue;

    if (wrapping) {
      const unsignedDiff = (Cube.SIDE_LENGTH + diff) % Cube.SIDE_LENGTH;
      // Faithful to Cube::determineAxis(): on the four-cell axis a distance-2
      // tie chooses the negative direction because >= SIDE_LENGTH/2 is false
      // for the positive branch.
      positive = unsignedDiff < Cube.SIDE_LENGTH / 2;
    } else {
      positive = diff >= 0;
    }
    axis = i;
    diffCount += 1;
  }

  return diffCount === 1 ? { axis, positive } : null;
}

export class TileSlider {
  constructor({ dimensions = 2, skillLevel = 0, wrap = true, seed = Date.now() } = {}) {
    this.cube = new Cube();
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.seed = normalizeSeed(seed);
    this.blankSpot = 0;
    this.stepsTaken = 0;
    this.hasWon = false;
    this.#validateConfiguration();
    this.reset(this.seed);
  }

  #validateConfiguration() {
    if (!Number.isInteger(this.dimensions) || this.dimensions < 2 || this.dimensions > Cube.DIMENSIONS) {
      throw new RangeError('Tile Slider supports 2D, 3D and 4D only.');
    }
    if (!Number.isInteger(this.skillLevel) || this.skillLevel < 0 || this.skillLevel > 2) {
      throw new RangeError('Tile Slider skill level must be 0, 1 or 2.');
    }
  }

  reset(seed = Date.now()) {
    this.#validateConfiguration();
    this.seed = normalizeSeed(seed);
    const random = mulberry32(this.seed);
    const len = Cube.ARRAY_LENGTHS[this.dimensions];

    this.cube.fill(0);
    for (let index = 0; index < len; index += 1) this.cube.set(index, index);

    const swaps = SWAP_COUNT[this.skillLevel];
    for (let i = 0; i < swaps; i += 1) {
      const a = Math.floor(random() * (len - 1));
      let b = Math.floor(random() * (len - 2));
      if (b >= a) b += 1;
      const tmp = this.cube.get(a);
      this.cube.set(a, this.cube.get(b));
      this.cube.set(b, tmp);
    }

    // The original never shuffles the last tile, which doubles as the blank.
    this.blankSpot = len - 1;
    this.stepsTaken = 0;
    this.hasWon = false;
    return this.state();
  }

  configure({ dimensions = this.dimensions, skillLevel = this.skillLevel, wrap = this.wrap } = {}) {
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.#validateConfiguration();
    this.reset(Date.now());
  }

  legalMoves() {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    const from = Cube.indexToVector(this.blankSpot);
    const moves = [];
    for (let toIndex = 0; toIndex < len; toIndex += 1) {
      if (toIndex === this.blankSpot) continue;
      const to = Cube.indexToVector(toIndex);
      const line = determineAxis(from, to, this.wrap);
      if (!line) continue;
      const { axis, positive } = line;
      const distance = positive
        ? (to[axis] - from[axis] + Cube.SIDE_LENGTH) % Cube.SIDE_LENGTH
        : (from[axis] - to[axis] + Cube.SIDE_LENGTH) % Cube.SIDE_LENGTH;
      const wrapped = this.wrap && (positive
        ? from[axis] + distance >= Cube.SIDE_LENGTH
        : from[axis] - distance < 0);
      moves.push({ index: toIndex, axis, positive, distance, dimensional: axis >= 2, wrapped });
    }
    return moves;
  }

  move(toIndex) {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= len) {
      return { moved: false, shifted: 0, ...this.state() };
    }

    const target = Cube.indexToVector(toIndex);
    const cursor = Cube.indexToVector(this.blankSpot);
    const line = determineAxis(cursor, target, this.wrap);
    if (!line) return { moved: false, shifted: 0, ...this.state() };

    const { axis, positive } = line;
    let shifted = 0;
    do {
      cursor[axis] = positive
        ? (cursor[axis] + 1) % Cube.SIDE_LENGTH
        : (cursor[axis] + Cube.SIDE_LENGTH - 1) % Cube.SIDE_LENGTH;

      const newSpot = Cube.vectorToIndex(cursor);
      this.cube.set(this.blankSpot, this.cube.get(newSpot));
      this.blankSpot = newSpot;
      this.cube.set(this.blankSpot, len - 1);
      this.stepsTaken += 1;
      shifted += 1;
    } while (target[axis] !== cursor[axis]);

    if (!this.hasWon) this.hasWon = this.isSolved();
    return { moved: true, shifted, ...this.state() };
  }

  isSolved() {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (this.blankSpot !== len - 1) return false;
    for (let i = 0; i < len; i += 1) {
      if (this.cube.get(i) !== i) return false;
    }
    return true;
  }

  goalValue(index) {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!Number.isInteger(index) || index < 0 || index >= len) return null;
    return index;
  }

  state() {
    return {
      blankSpot: this.blankSpot,
      stepsTaken: this.stepsTaken,
      hasWon: this.hasWon,
      swapCount: SWAP_COUNT[this.skillLevel],
    };
  }
}
