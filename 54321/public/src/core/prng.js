export function normalizeSeed(value) {
  let x = Number(value);
  if (!Number.isFinite(x)) x = Date.now();
  return (Math.trunc(x) >>> 0) || 0x54321;
}

// Small deterministic generator for reproducible preservation tests.
export function mulberry32(seed) {
  let state = normalizeSeed(seed);
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
