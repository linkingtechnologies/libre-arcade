import { Cube } from '../core/cube.js';

export const VIEW = {
  WIDTH: 800,
  HEIGHT: 600,
  BOARD_SIZE: 600,
  SIDEBAR_X: 600,
  SQUARE: 36,
  GAP: 4,
  BLOCK: Cube.SIDE_LENGTH * 36 + 4,
};

export function startCoords(dimensions) {
  const { BOARD_SIZE, GAP, BLOCK } = VIEW;
  const coords = {
    2: [(BOARD_SIZE - (BLOCK - GAP)) / 2, (BOARD_SIZE - (BLOCK - GAP)) / 2],
    3: [(BOARD_SIZE - (Cube.SIDE_LENGTH * BLOCK - GAP)) / 2, (BOARD_SIZE - (BLOCK - GAP)) / 2],
    4: [(BOARD_SIZE - (Cube.SIDE_LENGTH * BLOCK - GAP)) / 2, (BOARD_SIZE - (Cube.SIDE_LENGTH * BLOCK - GAP)) / 2],
  };
  return coords[dimensions];
}

export function cellToScreen(index, dimensions) {
  const coords = Cube.indexToVector(index);
  const [sx, sy] = startCoords(dimensions);
  return [
    sx + coords[0] * VIEW.SQUARE + coords[2] * VIEW.BLOCK,
    sy + coords[1] * VIEW.SQUARE + coords[3] * VIEW.BLOCK,
  ];
}

export function screenToCell(x, y, dimensions) {
  const [sx, sy] = startCoords(dimensions);
  if (x < sx || y < sy) return null;
  x -= sx;
  y -= sy;

  const coords = [0, 0, 0, 0];
  coords[2] = Math.floor(x / VIEW.BLOCK);
  coords[3] = Math.floor(y / VIEW.BLOCK);
  coords[0] = Math.floor((x - coords[2] * VIEW.BLOCK) / VIEW.SQUARE);
  coords[1] = Math.floor((y - coords[3] * VIEW.BLOCK) / VIEW.SQUARE);

  for (let i = 0; i < dimensions; i += 1) {
    if (coords[i] >= Cube.SIDE_LENGTH) return null;
  }
  for (let i = dimensions; i < Cube.DIMENSIONS; i += 1) {
    if (coords[i] > 0) return null;
  }
  return Cube.vectorToIndex(coords);
}
