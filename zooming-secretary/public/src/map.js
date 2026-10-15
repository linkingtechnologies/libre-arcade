/*
 * Zooming Secretary M10 headless simulation core
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const TILE = Object.freeze({ EMPTY: 0, WALL: 1, LADDER: 2 });
export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 22;
export const MAP_ORIGIN_Y = 48;
export const TILE_SIZE = 8;

export class StageMap {
  constructor(cells, width = MAP_WIDTH, height = MAP_HEIGHT) {
    if (!Array.isArray(cells) && !(cells instanceof Uint8Array)) {
      throw new TypeError('cells must be an array');
    }
    if (cells.length !== width * height) {
      throw new RangeError(`expected ${width * height} cells, got ${cells.length}`);
    }
    this.width = width;
    this.height = height;
    this.cells = Uint8Array.from(cells);
  }

  static empty() {
    return new StageMap(new Uint8Array(MAP_WIDTH * MAP_HEIGHT));
  }

  static fromAscii(lines, legend = { '.': TILE.EMPTY, '#': TILE.WALL, 'H': TILE.LADDER }) {
    if (lines.length !== MAP_HEIGHT) throw new RangeError(`expected ${MAP_HEIGHT} rows`);
    const cells = [];
    for (const row of lines) {
      if (row.length !== MAP_WIDTH) throw new RangeError(`expected row width ${MAP_WIDTH}`);
      for (const ch of row) {
        if (!(ch in legend)) throw new Error(`unknown map char ${JSON.stringify(ch)}`);
        cells.push(legend[ch]);
      }
    }
    return new StageMap(cells);
  }

  clone() {
    return new StageMap(this.cells, this.width, this.height);
  }

  index(col, row) {
    return row * this.width + col;
  }

  get(col, row) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return TILE.EMPTY;
    return this.cells[this.index(col, row)];
  }

  set(col, row, value) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      throw new RangeError('map coordinate out of range');
    }
    this.cells[this.index(col, row)] = value & 0xff;
  }

  // Mirrors check_map(): x/y are screen pixels; gameplay map begins at row 6 (48 px).
  // The original passes unsigned chars. M10 explicitly wraps X to 8-bit and maps a
  // negative gameplay row to row 0, matching the source's unsigned-underflow guard.
  atPixel(x, y) {
    const ux = x & 0xff;
    let row = (y >> 3) - 6;
    if (row < 0) row = 0;
    const col = ux >> 3;
    return this.get(col, row);
  }

  isSupportAt(x, y) {
    return this.atPixel(x, y) !== TILE.EMPTY;
  }

  isLadderAt(x, y) {
    return (this.atPixel(x, y) & TILE.LADDER) !== 0;
  }

  discoverSideFloors(limit = 4) {
    const left = [];
    const right = [];
    for (let row = 1; row < this.height; row++) {
      // Source records NPC Y as platform-top minus 24 pixels.
      const runtimeY = 24 + row * TILE_SIZE;
      if (this.get(0,row) && !this.get(0,row-1) && left.length < limit) left.push(runtimeY);
      if (this.get(this.width-1,row) && !this.get(this.width-1,row-1) && right.length < limit) right.push(runtimeY);
    }
    return { left, right };
  }

  snapshot() {
    return Array.from(this.cells);
  }
}

export function makeSyntheticOfficeMap() {
  const map = StageMap.empty();
  // Three platforms at screen Y 104, 168, 232.
  for (const row of [7, 15, 21]) {
    for (let x = 0; x < MAP_WIDTH; x++) map.set(x, row, TILE.WALL);
  }
  // Two ladders, connecting all synthetic floors.
  for (const col of [7, 24]) {
    for (let row = 0; row <= 21; row++) {
      if (row === 7 || row === 15 || row === 21) continue;
      map.set(col, row, TILE.LADDER);
    }
  }
  return map;
}
