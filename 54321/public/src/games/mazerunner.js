import { Cube } from '../core/cube.js';
import { mulberry32, normalizeSeed } from '../core/prng.js';

export const MAZE_CELL = {
  BEEN_HERE: 0x00000200,
  AM_HERE: 0x00000400,
  FINISH_HERE: 0x00000800,
  LEFT: 0x00010000,
  RIGHT: 0x00020000,
  UP: 0x00040000,
  DOWN: 0x00080000,
  FORE: 0x00100000,
  AFT: 0x00200000,
  ANA: 0x00400000,
  KATA: 0x00800000,
  ALL_WALLS: 0x00ff0000,
};

const EXTRA_PASSAGE_PERCENT = [20, 10, 0];

function determineAxis(from, to, wrapping) {
  let axis = -1;
  let positive = true;
  let diffCount = 0;

  for (let i = 0; i < Cube.DIMENSIONS; i += 1) {
    const diff = to[i] - from[i];
    if (diff === 0) continue;

    if (wrapping) {
      const unsignedDiff = (Cube.SIDE_LENGTH + diff) % Cube.SIDE_LENGTH;
      positive = unsignedDiff < Cube.SIDE_LENGTH / 2;
    } else {
      positive = diff >= 0;
    }
    axis = i;
    diffCount += 1;
  }

  return diffCount === 1 ? { axis, positive } : null;
}

function find(parent, index) {
  if (parent[index] !== index) parent[index] = find(parent, parent[index]);
  return parent[index];
}

function join(parent, a, b) {
  const rootA = find(parent, a);
  const rootB = find(parent, b);
  if (rootA !== rootB) parent[rootB] = rootA;
}

export class MazeRunner {
  constructor({ dimensions = 2, skillLevel = 0, wrap = true, seed = Date.now() } = {}) {
    if (dimensions < 2 || dimensions > Cube.DIMENSIONS) {
      throw new RangeError('Maze Runner supports 2D, 3D and 4D only.');
    }
    this.cube = new Cube();
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.seed = normalizeSeed(seed);
    this.curIndex = 0;
    this.finishIndex = 0;
    this.stepsTaken = 0;
    this.repeatsTaken = 0;
    this.hasWon = false;
    this.reset(this.seed);
  }

  reset(seed = Date.now()) {
    this.seed = normalizeSeed(seed);
    const random = mulberry32(this.seed);
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    const extraPassagePercent = EXTRA_PASSAGE_PERCENT[this.skillLevel];

    this.cube.fill(MAZE_CELL.ALL_WALLS);

    // The original maze.cpp uses the low bits of Cube cells as a disjoint-set
    // structure while carving. The browser port keeps that temporary structure
    // separate so only gameplay bits remain in the rendered cube.
    const parent = Array.from({ length: len }, (_, i) => i);
    const walls = [];

    // Preserve the original edge enumeration: collect each undirected
    // orthogonal wall exactly once by accepting neighbours with a lower index.
    for (let index = 0; index < len; index += 1) {
      for (const neighbor of Cube.getNeighbors(index, this.dimensions, this.wrap)) {
        if (neighbor < index) walls.push({ from: index, to: neighbor });
      }
    }

    let wallCount = walls.length;
    while (wallCount > 0) {
      const pick = Math.floor(random() * wallCount);
      const { from, to } = walls[pick];
      const setFrom = find(parent, from);
      const setTo = find(parent, to);

      // Randomized Kruskal: always connect different sets; for Easy/Medium,
      // also remove a percentage of redundant walls to introduce loops.
      const remove = setFrom !== setTo || Math.floor(random() * 100) < extraPassagePercent;
      if (remove) {
        this.#removeWall(from, to);
        join(parent, setFrom, setTo);
      }

      walls[pick] = walls[wallCount - 1];
      wallCount -= 1;
    }

    this.stepsTaken = 0;
    this.repeatsTaken = 0;
    this.hasWon = false;
    this.curIndex = 0;
    this.cube.set(this.curIndex, this.cube.get(this.curIndex) | MAZE_CELL.AM_HERE);

    const finish = [0, 0, 0, 0];
    const finishCoordinate = this.wrap ? Cube.SIDE_LENGTH / 2 : Cube.SIDE_LENGTH - 1;
    for (let axis = 0; axis < this.dimensions; axis += 1) finish[axis] = finishCoordinate;
    this.finishIndex = Cube.vectorToIndex(finish);
    this.cube.set(this.finishIndex, this.cube.get(this.finishIndex) | MAZE_CELL.FINISH_HERE);
  }

  configure({ dimensions = this.dimensions, skillLevel = this.skillLevel, wrap = this.wrap } = {}) {
    if (dimensions < 2 || dimensions > Cube.DIMENSIONS) {
      throw new RangeError('Maze Runner supports 2D, 3D and 4D only.');
    }
    this.dimensions = dimensions;
    this.skillLevel = skillLevel;
    this.wrap = wrap;
    this.reset(Date.now());
  }

  move(toIndex) {
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= Cube.ARRAY_LENGTHS[this.dimensions]) {
      return { moved: false, ...this.state() };
    }

    const fromIndex = this.curIndex;
    const from = Cube.indexToVector(fromIndex);
    const to = Cube.indexToVector(toIndex);
    const line = determineAxis(from, to, this.wrap);
    if (!line) return { moved: false, ...this.state() };

    const { axis } = line;
    let positiveDist = this.#clearDistance(from, to, axis, true);
    let negativeDist = this.#clearDistance(from, to, axis, false);

    if (positiveDist === 0 && negativeDist === 0) {
      return { moved: false, ...this.state() };
    }

    let positive;
    if (positiveDist === 0) positive = false;
    else if (negativeDist === 0) positive = true;
    else positive = positiveDist <= negativeDist; // original tie-break

    this.cube.set(this.curIndex, this.cube.get(this.curIndex) & ~MAZE_CELL.AM_HERE);
    this.curIndex = toIndex;
    this.cube.set(this.curIndex, this.cube.get(this.curIndex) | MAZE_CELL.AM_HERE);

    const cursor = [...from];
    while (cursor[axis] !== to[axis]) {
      const index = Cube.vectorToIndex(cursor);
      this.stepsTaken += 1;
      if ((this.cube.get(index) & MAZE_CELL.BEEN_HERE) !== 0) this.repeatsTaken += 1;
      this.cube.set(index, this.cube.get(index) | MAZE_CELL.BEEN_HERE);
      cursor[axis] = positive
        ? (cursor[axis] + 1) % Cube.SIDE_LENGTH
        : (cursor[axis] + Cube.SIDE_LENGTH - 1) % Cube.SIDE_LENGTH;
    }

    if (!this.hasWon) this.hasWon = this.curIndex === this.finishIndex;
    return { moved: true, ...this.state() };
  }

  legalMoves() {
    const moves = [];
    const len = Cube.ARRAY_LENGTHS[this.dimensions];
    const from = Cube.indexToVector(this.curIndex);

    for (let toIndex = 0; toIndex < len; toIndex += 1) {
      if (toIndex === this.curIndex) continue;
      const to = Cube.indexToVector(toIndex);
      const line = determineAxis(from, to, this.wrap);
      if (!line) continue;

      const { axis } = line;
      const positiveDist = this.#clearDistance(from, to, axis, true);
      const negativeDist = this.#clearDistance(from, to, axis, false);
      if (positiveDist === 0 && negativeDist === 0) continue;

      let positive;
      let distance;
      if (positiveDist === 0) {
        positive = false;
        distance = negativeDist;
      } else if (negativeDist === 0) {
        positive = true;
        distance = positiveDist;
      } else if (positiveDist <= negativeDist) {
        positive = true;
        distance = positiveDist;
      } else {
        positive = false;
        distance = negativeDist;
      }

      const wrapped = this.wrap && (positive
        ? from[axis] + distance >= Cube.SIDE_LENGTH
        : from[axis] - distance < 0);

      moves.push({
        index: toIndex,
        axis,
        positive,
        distance,
        dimensional: axis >= 2,
        wrapped,
      });
    }

    return moves;
  }

  state() {
    return {
      curIndex: this.curIndex,
      finishIndex: this.finishIndex,
      stepsTaken: this.stepsTaken,
      repeatsTaken: this.repeatsTaken,
      freshSteps: this.stepsTaken - this.repeatsTaken,
      hasWon: this.hasWon,
    };
  }

  #removeWall(fromIndex, toIndex) {
    const from = Cube.indexToVector(fromIndex);
    const to = Cube.indexToVector(toIndex);
    const line = determineAxis(from, to, this.wrap);
    if (!line) throw new Error('Maze wall does not connect collinear neighbour cells.');

    const baseWall = MAZE_CELL.LEFT << (2 * line.axis);
    let fromWall = baseWall;
    let toWall = baseWall;
    if (line.positive) fromWall <<= 1;
    else toWall <<= 1;

    this.cube.set(fromIndex, this.cube.get(fromIndex) & ~fromWall);
    this.cube.set(toIndex, this.cube.get(toIndex) & ~toWall);
  }

  #clearDistance(from, to, axis, positive) {
    const cursor = [...from];
    const wall = (positive ? MAZE_CELL.RIGHT : MAZE_CELL.LEFT) << (2 * axis);
    let distance = 0;

    while (cursor[axis] !== to[axis]) {
      if ((this.cube.get(Cube.vectorToIndex(cursor)) & wall) !== 0) return 0;
      cursor[axis] = positive
        ? (cursor[axis] + 1) % Cube.SIDE_LENGTH
        : (cursor[axis] + Cube.SIDE_LENGTH - 1) % Cube.SIDE_LENGTH;
      distance += 1;
    }
    return distance;
  }
}
