import { BOARD_SIZE, coordKey, inBounds } from './rules.js';

export class Board {
  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.ships = [];
    this.occupancy = new Map();
    this.shots = new Map();
  }

  canPlace(cells) {
    if (!cells.length) return false;
    const local = new Set();
    for (const c of cells) {
      const key = coordKey(c);
      if (!inBounds(c, this.size) || local.has(key) || this.occupancy.has(key)) return false;
      local.add(key);
    }
    return true;
  }

  placeShip(cells, id = `ship-${this.ships.length}`) {
    if (!this.canPlace(cells)) throw new Error(`Illegal placement for ${id}`);
    const ship = { id, cells: cells.map(c => ({ ...c })), hits: new Set() };
    const shipIndex = this.ships.length;
    this.ships.push(ship);
    for (const c of ship.cells) this.occupancy.set(coordKey(c), shipIndex);
    return ship;
  }

  fire(coord) {
    if (!inBounds(coord, this.size)) throw new RangeError('Shot outside board');
    const key = coordKey(coord);
    if (this.shots.has(key)) return { ...this.shots.get(key), repeated: true };

    const shipIndex = this.occupancy.get(key);
    if (shipIndex === undefined) {
      const result = { coord: { ...coord }, hit: false, sunk: false, shipId: null, repeated: false };
      this.shots.set(key, result);
      return result;
    }

    const ship = this.ships[shipIndex];
    ship.hits.add(key);
    const sunk = ship.hits.size === ship.cells.length;
    const result = { coord: { ...coord }, hit: true, sunk, shipId: ship.id, repeated: false };
    this.shots.set(key, result);
    return result;
  }

  allSunk() {
    return this.ships.length > 0 && this.ships.every(ship => ship.hits.size === ship.cells.length);
  }
}
