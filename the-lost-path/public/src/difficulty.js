// Difficulty levels for The Lost Path. Not part of upstream, which has one
// fixed setting (a 20x20 maze and five seconds per tile of the shortest
// route). `size` is the maze side in tiles; the time allowed is
// `base + perTile * shortestRoute` seconds; `torch` is the radius of the
// light in tiles; `hideFinish` hides the blue finish dot until it is inside
// the torch's reach. The numbers come from tools/simulate-timing.mjs, see
// specs/design.md.
globalThis.LPDifficulty = {
  easy: { size: 13, base: 20, perTile: 2, torch: 4.5, hideFinish: false },
  normal: { size: 21, base: 15, perTile: 2, torch: 4, hideFinish: true },
  hard: { size: 31, base: 10, perTile: 1.25, torch: 2.5, hideFinish: true },
};
globalThis.LPCurrent = globalThis.LPDifficulty.normal;
