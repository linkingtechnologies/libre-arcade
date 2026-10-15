/* SPDX-License-Identifier: GPL-3.0-or-later */

export const DIRECTION_NAMES = Object.freeze(['UP','DOWN','LEFT','RIGHT']);

export function createHeldDirections() {
  return { UP:false, DOWN:false, LEFT:false, RIGHT:false };
}

export function pressDirection(held, dir) {
  if (!held || !DIRECTION_NAMES.includes(dir)) return held;
  // A keyboard/touch surface can report opposite vertical directions at once,
  // unlike the intended NES D-pad interaction. The core deliberately preserves
  // the original UP+DOWN cancellation rule, so normalize only the browser input
  // adapter: the most recently pressed vertical direction wins.
  if (dir === 'UP') held.DOWN = false;
  if (dir === 'DOWN') held.UP = false;
  held[dir] = true;
  return held;
}

export function releaseDirection(held, dir) {
  if (held && DIRECTION_NAMES.includes(dir)) held[dir] = false;
  return held;
}

export function clearDirections(held) {
  if (!held) return held;
  for (const dir of DIRECTION_NAMES) held[dir] = false;
  return held;
}
