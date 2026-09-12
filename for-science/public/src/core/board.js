export const TILE_NAMES = Object.freeze([
  'money', 'shield', 'cow', 'meteorite', 'rocket', 'laser',
]);

export class BoardModel {
  constructor(rng, width = 10, height = 10) {
    this.rng = rng;
    this.width = width;
    this.height = height;
    this.grid = [];
    this.newBoard();
  }

  newBoard() {
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => this.rng.randint(0, TILE_NAMES.length - 1))
    );
  }

  get(x, y) {
    return this.grid[y]?.[x];
  }

  set(x, y, value) {
    this.grid[y][x] = value;
  }

  swap(a, b) {
    const av = this.get(a.x, a.y);
    this.set(a.x, a.y, this.get(b.x, b.y));
    this.set(b.x, b.y, av);
  }

  isSameTile(a, b) {
    const av = this.get(a.x, a.y);
    const bv = this.get(b.x, b.y);
    return av !== null && av !== undefined && bv !== null && bv !== undefined && av === bv;
  }

  /**
   * Literal behavioral port of GameLayer.valid_move(). It intentionally keeps
   * duplicate score records produced by the original directional scan. Those
   * duplicates can affect bonus-money accounting and are therefore parity,
   * not cleanup candidates.
   */
  validMove(selected) {
    const positions = [];
    const scores = [];

    for (const point of selected) {
      const bx = point.x;
      const by = point.y;
      const tile = this.get(bx, by);
      if (tile === null || tile === undefined) continue;

      let partial = [];
      // top in the Python coordinate system: increasing y
      for (let y = by; y < this.height; y += 1) {
        if (this.get(bx, y) === tile) partial.push({ x: bx, y });
        else break;
      }
      if (partial.length >= 3) {
        positions.push(...partial);
        scores.push({ tile, amount: uniquePositionCount(partial), origin: { x: bx, y: by } });
      }

      // bottom extends the same partial list
      for (let y = by - 1; y >= 0; y -= 1) {
        if (this.get(bx, y) === tile) partial.push({ x: bx, y });
        else break;
      }
      if (partial.length >= 3) {
        positions.push(...partial);
        scores.push({ tile, amount: uniquePositionCount(partial), origin: { x: bx, y: by } });
      }

      partial = [];
      // right
      for (let x = bx; x < this.width; x += 1) {
        if (this.get(x, by) === tile) partial.push({ x, y: by });
        else break;
      }
      if (partial.length >= 3) {
        positions.push(...partial);
        scores.push({ tile, amount: uniquePositionCount(partial), origin: { x: bx, y: by } });
      }

      // left extends the same partial list
      for (let x = bx - 1; x >= 0; x -= 1) {
        if (this.get(x, by) === tile) partial.push({ x, y: by });
        else break;
      }
      if (partial.length >= 3) {
        positions.push(...partial);
        scores.push({ tile, amount: uniquePositionCount(partial), origin: { x: bx, y: by } });
      }
    }

    return { positions, scores };
  }

  /** Port of apply_score's logical side: remove unique matched cells and add
   * the original extra-money score records for non-money matches longer than 3.
   */
  consumeMatch(positions, scores) {
    const unique = uniquePositions(positions);
    for (const { x, y } of unique) this.set(x, y, null);

    const finalScores = scores.map((r) => ({ ...r }));
    for (const { tile, amount } of scores) {
      if (tile !== 0 && amount > 3) {
        // Original code labels this as +$5 per extra tile, but then add_score
        // multiplies money records by 5 once more. Preserve that behavior.
        const extra = (amount - 3) * 5;
        finalScores.push({ tile: 0, amount: extra, bonus: true });
      }
    }
    return finalScores;
  }

  /**
   * Collapse cells downward (toward larger y), then fill every gap with a new
   * random tile. No automatic cascade scoring follows, matching the original.
   */
  gravityAndFill() {
    for (let x = 0; x < this.width; x += 1) {
      const kept = [];
      for (let y = this.height - 1; y >= 0; y -= 1) {
        const tile = this.get(x, y);
        if (tile !== null && tile !== undefined) kept.push(tile);
      }
      let y = this.height - 1;
      for (const tile of kept) {
        this.set(x, y, tile);
        y -= 1;
      }
      while (y >= 0) {
        this.set(x, y, null);
        y -= 1;
      }
    }

    // Match original refill call order: row-major y then x.
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.get(x, y) === null) {
          this.set(x, y, this.rng.randint(0, TILE_NAMES.length - 1));
        }
      }
    }
  }

  cloneGrid() {
    return this.grid.map((row) => [...row]);
  }
}

function posKey({ x, y }) {
  return `${x},${y}`;
}

export function uniquePositions(points) {
  const map = new Map();
  for (const point of points) map.set(posKey(point), point);
  return [...map.values()];
}

function uniquePositionCount(points) {
  return uniquePositions(points).length;
}
