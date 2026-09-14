export function movementPath({ from, to, distance, direction, finish = 63, start = 0 }) {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return [];
  const steps = [];
  const safeDistance = Math.max(0, Number(distance) || Math.abs(to - from));

  if (direction === -1 && from + safeDistance > finish) {
    for (let pos = from + 1; pos <= finish; pos += 1) steps.push(pos);
    for (let pos = finish - 1; pos >= to; pos -= 1) steps.push(pos);
    return steps;
  }

  const step = to >= from ? 1 : -1;
  for (let pos = from + step; step > 0 ? pos <= to : pos >= to; pos += step) {
    if (pos >= start && pos <= finish) steps.push(pos);
  }
  return steps;
}
