import { Cube } from '../core/cube.js';
import { PEG_BOARDS } from './pegboards.js';

export const PEG_CELL = {
  EMPTY: 0,
  HOLE: 1,
  PEG: 2,
  SELECTED: 4,
};

export class PegJumper {
  constructor({ dimensions = 2, skillLevel = 0, wrap = true } = {}) {
    this.cube = new Cube();
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.selectedSpot = Cube.ARRAY_LENGTHS[dimensions];
    this.pegsRemaining = 0;
    this.stepsTaken = 0;
    this.firstMove = true;
    this.hasWon = false;
    this.#validateConfiguration();
    this.reset();
  }

  #validateConfiguration() {
    if (!Number.isInteger(this.dimensions) || this.dimensions < 2 || this.dimensions > Cube.DIMENSIONS) {
      throw new RangeError('Peg Jumper supports 2D, 3D and 4D only.');
    }
    if (!Number.isInteger(this.skillLevel) || this.skillLevel < 0 || this.skillLevel > 2) {
      throw new RangeError('Peg Jumper skill level must be 0, 1 or 2.');
    }
  }

  #boardKey() {
    return `${this.dimensions}-${this.skillLevel}${this.wrap ? 'w' : 'n'}`;
  }

  reset() {
    this.#validateConfiguration();
    const layout = PEG_BOARDS[this.#boardKey()];
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!layout || layout.length !== len) {
      throw new Error(`Missing or invalid original Peg Jumper board: ${this.#boardKey()}`);
    }

    this.cube.fill(PEG_CELL.EMPTY);
    this.pegsRemaining = 0;
    for (let index = 0; index < len; index += 1) {
      const symbol = layout[index];
      const value = symbol === 'x' ? PEG_CELL.PEG : symbol === 'o' ? PEG_CELL.HOLE : PEG_CELL.EMPTY;
      this.cube.set(index, value);
      if (value === PEG_CELL.PEG) this.pegsRemaining += 1;
    }

    this.hasWon = false;
    this.firstMove = true;
    this.selectedSpot = len;

    // The 2001 C++ reset() omits this initialization even though the Noweb
    // prose says game statistics are reset. Reproducing an uninitialized C++
    // integer is neither deterministic nor meaningful in JavaScript, so the
    // preservation port records this as a deliberate bugfix.
    this.stepsTaken = 0;
  }

  configure({ dimensions = this.dimensions, skillLevel = this.skillLevel, wrap = this.wrap } = {}) {
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.#validateConfiguration();
    this.reset();
  }

  isSelected() {
    return this.selectedSpot < Cube.ARRAY_LENGTHS[this.dimensions];
  }

  select(cell) {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!Number.isInteger(cell) || cell < 0 || cell >= len) return { changed: false, ...this.state() };
    if ((this.cube.get(cell) & PEG_CELL.PEG) === 0) return { changed: false, ...this.state() };

    if (this.firstMove) {
      this.cube.set(cell, PEG_CELL.HOLE);
      this.firstMove = false;
      this.pegsRemaining -= 1;
      return { changed: true, removedFirstPeg: true, ...this.state() };
    }

    if (this.isSelected()) {
      this.cube.set(this.selectedSpot, this.cube.get(this.selectedSpot) & ~PEG_CELL.SELECTED);
    }

    this.cube.set(cell, this.cube.get(cell) | PEG_CELL.SELECTED);
    this.selectedSpot = cell;
    return { changed: true, selected: true, ...this.state() };
  }

  legalJumps(source = null) {
    if (this.firstMove) return [];
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    const sources = source === null
      ? Array.from({ length: len }, (_, index) => index).filter((index) => (this.cube.get(index) & PEG_CELL.PEG) !== 0)
      : [source];
    const jumps = [];

    for (const srcSpot of sources) {
      if (!Number.isInteger(srcSpot) || srcSpot < 0 || srcSpot >= len) continue;
      if ((this.cube.get(srcSpot) & PEG_CELL.PEG) === 0) continue;
      for (const jumped of Cube.getNeighbors(srcSpot, this.dimensions, this.wrap)) {
        if ((this.cube.get(jumped) & PEG_CELL.PEG) === 0) continue;
        const src = Cube.indexToVector(srcSpot);
        const cur = Cube.indexToVector(jumped);
        const dst = new Array(Cube.DIMENSIONS);
        for (let axis = 0; axis < Cube.DIMENSIONS; axis += 1) {
          dst[axis] = (cur[axis] + (Cube.SIDE_LENGTH + cur[axis] - src[axis])) % Cube.SIDE_LENGTH;
        }
        const destination = Cube.vectorToIndex(dst);
        if ((this.cube.get(destination) & PEG_CELL.HOLE) === 0) continue;
        if (!Cube.getNeighbors(jumped, this.dimensions, this.wrap).includes(destination)) continue;
        const relation = Cube.describeNeighbor(srcSpot, jumped, this.dimensions, this.wrap);
        const landingRelation = Cube.describeNeighbor(jumped, destination, this.dimensions, this.wrap);
        if (!relation || !landingRelation || relation.axis !== landingRelation.axis || relation.positive !== landingRelation.positive) continue;
        jumps.push({
          source: srcSpot, jumped, destination, axis: relation.axis,
          positive: relation.positive, dimensional: relation.dimensional,
          wrapped: relation.wrapped || landingRelation.wrapped,
        });
      }
    }
    return jumps;
  }

  jump(cell) {
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    if (!this.isSelected()) return { changed: false, jumped: false, ...this.state() };
    if (!Number.isInteger(cell) || cell < 0 || cell >= len) return { changed: false, jumped: false, ...this.state() };

    const srcSpot = this.selectedSpot;

    // The original clears selection before validating the attempted jump, so
    // even an illegal second click cancels the current selection.
    this.cube.set(srcSpot, this.cube.get(srcSpot) & ~PEG_CELL.SELECTED);
    this.selectedSpot = len;

    if (cell === srcSpot) return { changed: true, jumped: false, ...this.state() };
    if ((this.cube.get(cell) & PEG_CELL.PEG) === 0) return { changed: true, jumped: false, ...this.state() };

    const neighbors = Cube.getNeighbors(cell, this.dimensions, this.wrap);
    if (!neighbors.includes(srcSpot)) return { changed: true, jumped: false, ...this.state() };

    const src = Cube.indexToVector(srcSpot);
    const cur = Cube.indexToVector(cell);
    const dst = new Array(Cube.DIMENSIONS);
    for (let axis = 0; axis < Cube.DIMENSIONS; axis += 1) {
      dst[axis] = (cur[axis] + (Cube.SIDE_LENGTH + cur[axis] - src[axis])) % Cube.SIDE_LENGTH;
    }
    const destination = Cube.vectorToIndex(dst);

    if ((this.cube.get(destination) & PEG_CELL.HOLE) === 0) {
      return { changed: true, jumped: false, ...this.state() };
    }
    if (!neighbors.includes(destination)) {
      return { changed: true, jumped: false, ...this.state() };
    }

    this.cube.set(srcSpot, PEG_CELL.HOLE);
    this.cube.set(cell, PEG_CELL.HOLE);
    this.cube.set(destination, PEG_CELL.PEG);
    this.pegsRemaining -= 1;
    this.stepsTaken += 1;
    if (!this.hasWon) this.hasWon = this.pegsRemaining === 1;

    return { changed: true, jumped: true, destination, ...this.state() };
  }

  click(cell, { selectOnly = false } = {}) {
    if (selectOnly || !this.isSelected()) return this.select(cell);
    return this.jump(cell);
  }

  state() {
    return {
      selectedSpot: this.selectedSpot,
      pegsRemaining: this.pegsRemaining,
      stepsTaken: this.stepsTaken,
      firstMove: this.firstMove,
      hasWon: this.hasWon,
      isSelected: this.isSelected(),
    };
  }
}
