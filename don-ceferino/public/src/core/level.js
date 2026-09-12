import { BREAKABLE_MARKER, EMPTY, GRID_H, GRID_W, LEVEL_BYTES, PLAYER_MARKER, TILE } from './constants.js';

const trunc = Math.trunc;

export class LevelSet {
  constructor(bytes) {
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (this.bytes.length % LEVEL_BYTES !== 0) {
      throw new Error(`Invalid base.map size: ${this.bytes.length}`);
    }
    this.count = this.bytes.length / LEVEL_BYTES;
  }

  load(number) {
    if (!Number.isInteger(number) || number < 1 || number > this.count) return null;
    const offset = (number - 1) * LEVEL_BYTES;
    return new LevelMap(this.bytes.slice(offset, offset + LEVEL_BYTES), number);
  }
}

export class LevelMap {
  constructor(bytes, number = 1) {
    this.number = number;
    this.grid = Uint8Array.from(bytes);
    this.visualGrid = Uint8Array.from(bytes, v => (v < PLAYER_MARKER && v !== EMPTY) ? v : EMPTY);
    this.playerSpawn = null;
    this.ballSpawns = [];
    this.breakables = [];
    this.#extractActors();
  }

  #extractActors() {
    for (let row = 0; row < GRID_H; row++) {
      for (let col = 0; col < GRID_W; col++) {
        const idx = row * GRID_W + col;
        const v = this.grid[idx];
        if (v < PLAYER_MARKER || v === EMPTY) continue;

        if (v === PLAYER_MARKER) {
          this.playerSpawn = { x: col * TILE, y: row * TILE + 38 };
          this.grid[idx] = EMPTY;
        } else if (v >= 98 && v <= 105) { // b..i
          const zero = v - 98;
          const size = (zero % 4) + 1;
          const flip = zero < 4 ? 1 : -1;
          this.ballSpawns.push({ x: col * TILE, y: row * TILE, size, flip });
          this.grid[idx] = EMPTY;
        } else if (v === BREAKABLE_MARKER) {
          this.breakables.push({ x: col * TILE + 16, y: row * TILE + 28, row, col });
          // Historical code replaces 'j' with tile 0 so it is solid until broken.
          this.grid[idx] = 0;
        }
      }
    }
  }

  visualTile(row, col) {
    if (row < 0 || row >= GRID_H || col < 0 || col >= GRID_W) return EMPTY;
    return this.visualGrid[row * GRID_W + col];
  }

  tile(row, col) {
    if (row < 0 || row >= GRID_H || col < 0 || col >= GRID_W) return EMPTY;
    return this.grid[row * GRID_W + col];
  }

  setTile(row, col, value) {
    if (row >= 0 && row < GRID_H && col >= 0 && col < GRID_W) {
      this.grid[row * GRID_W + col] = value;
    }
  }

  isFloor(value) {
    return value < 15;
  }

  distanceToFloor(x, y, max) {
    const col = trunc(x / TILE);
    if (max > 0) {
      for (let i = 0; i < max; i++) {
        const yy = y + i;
        const row = trunc(yy / TILE);
        if (row >= 13) return i;
        if ((yy % TILE) < 10 && this.isFloor(this.tile(row, col))) return i;
      }
    } else {
      for (let i = 0; i > max; i--) {
        const yy = y + i;
        if (yy < 1) return i;
        if (this.isFloor(this.tile(trunc(yy / TILE), col))) return i;
      }
    }
    return max;
  }

  distanceToWall(x, y, max) {
    const row = trunc(y / TILE);
    if (max > 0) {
      for (let i = 0; i < max; i++) {
        const xx = x + i;
        if (xx > 630) return i;
        if (this.isFloor(this.tile(row, trunc(xx / TILE)))) return i;
      }
    } else {
      for (let i = 0; i > max; i--) {
        const xx = x + i;
        if (xx < 5) return i;
        if (this.isFloor(this.tile(row, trunc(xx / TILE)))) return i;
      }
    }
    return max;
  }

  distanceToCeiling(x, y, max) {
    const col = trunc(x / TILE);
    for (let i = 0; i > max; i--) {
      const yy = y + i;
      if (yy < 1) return i;
      const v = this.tile(trunc((y + 20 + i) / TILE), col);
      if (v < 15 && v > 0) return i;
    }
    return max;
  }

  isLadder(x, y) {
    const v = this.tile(trunc(y / TILE), trunc(x / TILE));
    return v === 13 || v === 15;
  }
}
