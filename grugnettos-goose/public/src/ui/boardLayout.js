export function spiralCoordinates(size) {
  if (!Number.isInteger(size) || size < 1) throw new TypeError('size must be a positive integer');

  const coords = [];
  let top = 0;
  let left = 0;
  let bottom = size - 1;
  let right = size - 1;

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col += 1) coords.push([bottom, col]);
    bottom -= 1;

    for (let row = bottom; row >= top; row -= 1) coords.push([row, right]);
    right -= 1;

    if (top <= bottom) {
      for (let col = right; col >= left; col -= 1) coords.push([top, col]);
      top += 1;
    }

    if (left <= right) {
      for (let row = top; row <= bottom; row += 1) coords.push([row, left]);
      left += 1;
    }
  }

  return coords;
}
