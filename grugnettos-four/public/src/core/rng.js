export function createRng(seed = 1) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return function rng() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
