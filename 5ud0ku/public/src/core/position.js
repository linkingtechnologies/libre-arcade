export class Position {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }
  equals(other) {
    return other instanceof Position && this.row === other.row && this.col === other.col;
  }
  getBlockNumber() {
    return Position.getBlockNumber(this.row, this.col);
  }
  static getBlockNumber(row, col) {
    return Math.trunc(row / 3) * 3 + Math.trunc(col / 3);
  }
  static allPositions() {
    const result = [];
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) result.push(new Position(row, col));
    return result;
  }
}

export function removePosition(vector, pos) {
  const i = vector.findIndex((p) => p.equals(pos));
  if (i >= 0) vector.splice(i, 1);
  return i >= 0;
}
