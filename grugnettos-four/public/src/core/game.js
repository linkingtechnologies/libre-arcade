export const WIDTH = 7;
export const HEIGHT = 6;
export const EMPTY = 0;
export const P1 = 1;
export const P2 = 2;

export function createGame(startingPlayer = P1) {
  if (![P1, P2].includes(startingPlayer)) throw new RangeError('Invalid starting player');
  return {
    board: Array.from({ length: WIDTH }, () => Array(HEIGHT).fill(EMPTY)),
    player: startingPlayer,
    startingPlayer,
    winner: EMPTY,
    draw: false,
    over: false,
    moves: [],
  };
}

export function legalMoves(state) {
  if (state.over) return [];
  return Array.from({ length: WIDTH }, (_, column) => column)
    .filter((column) => state.board[column][0] === EMPTY);
}

export function findWinningLine(board, player) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let x = 0; x < WIDTH; x += 1) {
    for (let y = 0; y < HEIGHT; y += 1) {
      if (board[x][y] !== player) continue;
      for (const [dx, dy] of directions) {
        const line = [{ column: x, row: y }];
        for (let step = 1; step < 4; step += 1) {
          const xx = x + dx * step;
          const yy = y + dy * step;
          if (xx < 0 || xx >= WIDTH || yy < 0 || yy >= HEIGHT || board[xx][yy] !== player) break;
          line.push({ column: xx, row: yy });
        }
        if (line.length === 4) return line;
      }
    }
  }
  return [];
}

export function isWinningBoard(board, player) { return findWinningLine(board, player).length === 4; }

export function playMove(state, column) {
  if (state.over) throw new Error('Game is already over');
  if (!Number.isInteger(column) || column < 0 || column >= WIDTH) throw new RangeError('Illegal column');
  let row = -1;
  for (let y = HEIGHT - 1; y >= 0; y -= 1) {
    if (state.board[column][y] === EMPTY) { row = y; break; }
  }
  if (row < 0) throw new Error('Column is full');
  const player = state.player;
  state.board[column][row] = player;
  state.moves.push(column);
  if (isWinningBoard(state.board, player)) {
    state.winner = player;
    state.over = true;
  } else if (state.moves.length === WIDTH * HEIGHT) {
    state.draw = true;
    state.over = true;
  } else {
    state.player = player === P1 ? P2 : P1;
  }
  return { column, row, player };
}

export function snapshot(state) {
  return Object.freeze({
    board: state.board.map((column) => Object.freeze([...column])),
    player: state.player,
    moves: Object.freeze([...state.moves]),
    over: state.over,
  });
}
