import { Board } from './board.js';
import { BOARD_SIZE, CLASSIC_FLEET } from './rules.js';

export function cellsForShip(x, y, length, horizontal) {
  return Array.from({ length }, (_, i) => ({ x: x + (horizontal ? i : 0), y: y + (horizontal ? 0 : i) }));
}

export function createRandomBoard(rng, fleet = CLASSIC_FLEET, size = BOARD_SIZE) {
  const board = new Board(size);
  fleet.forEach((length, index) => {
    let placed = false;
    for (let attempt = 0; attempt < 10000 && !placed; attempt += 1) {
      const horizontal = rng.int(2) === 0;
      const maxX = horizontal ? size - length + 1 : size;
      const maxY = horizontal ? size : size - length + 1;
      const cells = cellsForShip(rng.int(maxX), rng.int(maxY), length, horizontal);
      if (board.canPlace(cells)) {
        board.placeShip(cells, `ship-${index}-L${length}`);
        placed = true;
      }
    }
    if (!placed) throw new Error(`Unable to place ship length ${length}`);
  });
  return board;
}
