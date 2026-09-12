export class Cube {
  static SIDE_LENGTH = 4;
  static DIMENSIONS = 4;
  static ARRAY_LEN = 4 ** 4;
  static ARRAY_LENGTHS = [1, 4, 16, 64, 256];

  constructor() {
    this.cells = new Uint32Array(Cube.ARRAY_LEN);
  }

  fill(value = 0) {
    this.cells.fill(value);
  }

  get(index) {
    if (!Number.isInteger(index) || index < 0 || index >= Cube.ARRAY_LEN) {
      throw new RangeError(`Invalid cube index: ${index}`);
    }
    return this.cells[index];
  }

  set(index, value) {
    if (!Number.isInteger(index) || index < 0 || index >= Cube.ARRAY_LEN) {
      throw new RangeError(`Invalid cube index: ${index}`);
    }
    this.cells[index] = value;
  }

  toggle(index) {
    this.set(index, this.get(index) ^ 1);
    return this.get(index);
  }

  static indexToVector(index) {
    if (!Number.isInteger(index) || index < 0 || index >= Cube.ARRAY_LEN) {
      throw new RangeError(`Invalid cube index: ${index}`);
    }
    const vec = new Array(Cube.DIMENSIONS).fill(0);
    for (let i = 0; i < Cube.DIMENSIONS; i += 1) {
      vec[i] = index % Cube.SIDE_LENGTH;
      index = Math.floor(index / Cube.SIDE_LENGTH);
    }
    return vec;
  }

  static vectorToIndex(vec) {
    if (!Array.isArray(vec) || vec.length !== Cube.DIMENSIONS) {
      throw new TypeError('Cube vectors must contain exactly four coordinates.');
    }
    for (const coord of vec) {
      if (!Number.isInteger(coord) || coord < 0 || coord >= Cube.SIDE_LENGTH) {
        throw new RangeError(`Invalid cube coordinate: ${coord}`);
      }
    }
    let index = 0;
    for (let i = 0; i < Cube.DIMENSIONS; i += 1) {
      index *= Cube.SIDE_LENGTH;
      index += vec[Cube.DIMENSIONS - 1 - i];
    }
    return index;
  }

  static describeNeighbor(fromIndex, toIndex, dimensions, wrap = true) {
    if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > Cube.DIMENSIONS) {
      throw new RangeError(`Invalid dimension count: ${dimensions}`);
    }
    const from = Cube.indexToVector(fromIndex);

    for (let axis = 0; axis < dimensions; axis += 1) {
      const coord = from[axis];
      if (wrap || coord + 1 < Cube.SIDE_LENGTH) {
        const vec = [...from];
        vec[axis] = (coord + 1) % Cube.SIDE_LENGTH;
        if (Cube.vectorToIndex(vec) === toIndex) {
          return { axis, positive: true, dimensional: axis >= 2, wrapped: wrap && coord === Cube.SIDE_LENGTH - 1 };
        }
      }
      if (wrap || coord > 0) {
        const vec = [...from];
        vec[axis] = (coord + Cube.SIDE_LENGTH - 1) % Cube.SIDE_LENGTH;
        if (Cube.vectorToIndex(vec) === toIndex) {
          return { axis, positive: false, dimensional: axis >= 2, wrapped: wrap && coord === 0 };
        }
      }
    }
    return null;
  }

  static getNeighbors(index, dimensions, wrap = true) {
    if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > Cube.DIMENSIONS) {
      throw new RangeError(`Invalid dimension count: ${dimensions}`);
    }
    const vec = Cube.indexToVector(index);
    const neighbors = [];

    for (let axis = 0; axis < dimensions; axis += 1) {
      const coord = vec[axis];
      if (wrap) {
        vec[axis] = (coord + 1) % Cube.SIDE_LENGTH;
        neighbors.push(Cube.vectorToIndex(vec));
        vec[axis] = (coord + Cube.SIDE_LENGTH - 1) % Cube.SIDE_LENGTH;
        neighbors.push(Cube.vectorToIndex(vec));
      } else {
        if (coord + 1 < Cube.SIDE_LENGTH) {
          vec[axis] = coord + 1;
          neighbors.push(Cube.vectorToIndex(vec));
        }
        if (coord >= 1) {
          vec[axis] = coord - 1;
          neighbors.push(Cube.vectorToIndex(vec));
        }
      }
      vec[axis] = coord;
    }
    return neighbors;
  }
}
