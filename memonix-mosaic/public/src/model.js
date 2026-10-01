export const SIZE_OPTIONS = [2, 4, 6, 8];
export const DIFFICULTY_OPTIONS = [0, 1, 2, 3, 4];

export const MOSAIC_FAMILY_NAMES = ['red', 'cyan', 'green', 'lilac', 'blue'];
// Historical load order in game_start.cpp: 1_1..1_9,1_0, then family 2, etc.
export const MOSAIC_SLOT_SUFFIXES = [1,2,3,4,5,6,7,8,9,0];

export function tileFamily(tile) {
  if (!Number.isInteger(tile) || tile < 0 || tile >= 50) throw new Error('Unsupported Mosaic tile');
  return Math.floor(tile / 10);
}

export function tileSlot(tile) {
  if (!Number.isInteger(tile) || tile < 0 || tile >= 50) throw new Error('Unsupported Mosaic tile');
  return tile % 10;
}

export function tileFromFamilySlot(family, slot) {
  if (!Number.isInteger(family) || family < 0 || family >= 5) throw new Error('Unsupported Mosaic family');
  if (!Number.isInteger(slot) || slot < 0 || slot >= 10) throw new Error('Unsupported Mosaic slot');
  return family * 10 + slot;
}

export function tileArchiveId(tile) {
  const family = tileFamily(tile) + 1;
  const suffix = MOSAIC_SLOT_SUFFIXES[tileSlot(tile)];
  return `${family}_${suffix}`;
}

export function tileArchivePath(tile) {
  return `DATA\\MOSAIC\\${tileArchiveId(tile)}.bmp`;
}

// Indexed exactly as the C++ source uses MosaicMask[test][i][j]:
// first coordinate = x, second = y.
export const MOSAIC_MASKS = [
  [
    [1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1]
  ],
  [
    [0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0],[0,0,0,1,1,0,0,0]
  ],
  [
    [0,0,1,1,1,1,0,0],[0,0,1,1,1,1,0,0],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[0,0,1,1,1,1,0,0],[0,0,1,1,1,1,0,0]
  ],
  [
    [1,1,1,0,0,1,1,1],[1,1,1,0,0,1,1,1],[1,1,1,1,1,1,1,1],[0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],[1,1,1,1,1,1,1,1],[1,1,1,0,0,1,1,1],[1,1,1,0,0,1,1,1]
  ]
];

export function createRng(seed = 0x6d2b79f5) {
  let s = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17; s >>>= 0;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 0x100000000;
  };
}

export function activeBounds(size) {
  return { start: 4 - size / 2, end: 4 + size / 2 };
}

export function emptyBoard() {
  return Array.from({length:8}, () => Array(8).fill(null));
}

export function generateMosaic({ size, difficulty, random = Math.random, family = 0 }) {
  if (!SIZE_OPTIONS.includes(size)) throw new Error('Unsupported size');
  if (!DIFFICULTY_OPTIONS.includes(difficulty)) throw new Error('Unsupported difficulty');
  const target = emptyBoard();
  const { start, end } = activeBounds(size);

  for (let x = start; x < end; x++) {
    for (let y = start; y < end; y++) {
      let tile = Math.floor(random() * 50);
      if (difficulty < 2) tile = (family % 5) * 10 + (tile % 10);
      target[x][y] = tile;
    }
  }

  // Original D0 symmetry: FieldData[i][j] = FieldData[7-i][j] for i=0..3.
  if (difficulty === 0) {
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 8; y++) target[x][y] = target[7 - x][y];
    }
  }

  let maskIndex = null;
  if (size >= 6) {
    maskIndex = Math.floor(random() * 4);
    const mask = MOSAIC_MASKS[maskIndex];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) if (mask[x][y] === 0) target[x][y] = null;
    }
  }

  return { target, maskIndex };
}

export function isSolved(player, target) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) if (player[x][y] !== target[x][y]) return false;
  }
  return true;
}

export function wrongCells(player, target) {
  const wrong = [];
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (target[x][y] !== null && player[x][y] !== null && player[x][y] !== target[x][y]) wrong.push([x,y]);
    }
  }
  return wrong;
}

export function secondsFromMs(ms) {
  return Math.max(0, Math.floor(ms / 1000));
}
