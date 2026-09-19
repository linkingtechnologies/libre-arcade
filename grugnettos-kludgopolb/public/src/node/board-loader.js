import fs from 'node:fs';
import { validateBoard } from '../core/board.js';

export function loadBoard(path) {
  const board = JSON.parse(fs.readFileSync(path, 'utf8'));
  validateBoard(board);
  return board;
}
