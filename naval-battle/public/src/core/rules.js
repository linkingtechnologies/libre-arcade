export const BOARD_SIZE = 10;

// Classic Battleship fleet used by Warboats 0.51 and the OS4 2009 specimen.
export const WARBOATS_FLEET = Object.freeze([5, 4, 3, 3, 2]);
export const CLASSIC_FLEET = WARBOATS_FLEET;


export const coordKey = ({ x, y }) => `${x},${y}`;
export const inBounds = ({ x, y }, size = BOARD_SIZE) => x >= 0 && y >= 0 && x < size && y < size;
