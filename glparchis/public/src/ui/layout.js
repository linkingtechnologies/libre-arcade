// SPDX-License-Identifier: GPL-3.0-only

/**
 * Return a square board size that fits the available desktop viewport.
 * A small usability floor is kept only when the viewport is too short to
 * display a playable board; in that exceptional case normal page scrolling
 * is preferable to shrinking the game to an unusable size.
 */
export function fittedBoardSize({ availableWidth, wrapTop, viewportHeight, bottomGap = 16, minUsable = 260 }) {
  const width = Math.max(0, Number(availableWidth) || 0);
  const height = Math.max(0, (Number(viewportHeight) || 0) - (Number(wrapTop) || 0) - (Number(bottomGap) || 0));
  if (!width) return 0;
  const fitting = Math.min(width, height);
  if (fitting >= minUsable) return Math.floor(fitting);
  return Math.floor(Math.min(width, minUsable));
}
