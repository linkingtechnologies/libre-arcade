export const FIELD_WIDTH = 9;
export const FIELD_HEIGHT = 8;
export const FIELD_SIZE = FIELD_WIDTH * FIELD_HEIGHT;

// One byte per column; bit 0 is row 0 and bit 7 is row 7.
export const DEAL_PATTERNS = Object.freeze([
  Object.freeze([0x00, 0x00, 0x18, 0x24, 0x24, 0x24, 0x18, 0x00, 0x00]), // 10
  Object.freeze([0x00, 0x00, 0x3c, 0x3c, 0x3c, 0x3c, 0x3c, 0x00, 0x00]), // 20
  Object.freeze([0x00, 0x7e, 0x7e, 0x7e, 0x00, 0x7e, 0x7e, 0x7e, 0x00]), // 36
  Object.freeze([0x00, 0x7e, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7e, 0x00]), // 52
  Object.freeze([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]), // 72
]);

const FIRST_TEN = [
  0x1c, 0x1d, 0x1e, 0x1f, 0x20,
  0x21, 0x22, 0x23, 0x24, 0x25,
];
const NEXT_EIGHTEEN = [
  0x26, 0x27, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32,
  0x33, 0x34, 0x35, 0x36, 0x37, 0x3c, 0x3d, 0x3e, 0x3f,
];
const LAST_EIGHT = [0x28, 0x29, 0x2a, 0x2b, 0x38, 0x39, 0x3a, 0x3b];

// These pointer aliases reproduce level1cards/level2cards/level5cards and
// level3cards/level4cards in the original assembly exactly.
export const CARD_SETS = Object.freeze([
  Object.freeze(FIRST_TEN.slice(0, 5)),
  Object.freeze(FIRST_TEN.slice()),
  Object.freeze(NEXT_EIGHTEEN.slice()),
  Object.freeze([...NEXT_EIGHTEEN, ...LAST_EIGHT]),
  Object.freeze([...FIRST_TEN, ...NEXT_EIGHTEEN, ...LAST_EIGHT]),
]);

export const EXPECTED_CARD_COUNTS = Object.freeze([10, 20, 36, 52, 72]);

export function activePositions(difficulty) {
  const pattern = DEAL_PATTERNS[difficulty];
  if (!pattern) throw new RangeError(`Invalid difficulty ${difficulty}`);
  const out = [];
  for (let column = 0; column < FIELD_WIDTH; column += 1) {
    const bits = pattern[column];
    for (let row = 0; row < FIELD_HEIGHT; row += 1) {
      if ((bits >>> row) & 1) out.push(column * FIELD_HEIGHT + row);
    }
  }
  return out;
}

export function cardIdentity(value) {
  return value & 0x3f;
}

export function faceDownValue(identity) {
  return (identity & 0x3f) | 0x80;
}
