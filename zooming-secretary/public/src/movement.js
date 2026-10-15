/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const FP_BITS = 4;
export const FP_ONE = 1 << FP_BITS;

export function wrapPlayerX(xFp) {
  if (xFp < 0) return 240 << FP_BITS;
  if (xFp > (240 << FP_BITS)) return 0;
  return xFp;
}

export function wrapLadderY(yFp, direction) {
  if (direction === "UP" && yFp < (32 << FP_BITS)) {
    return yFp + (160 << FP_BITS);
  }
  if (direction === "DOWN" && yFp > (192 << FP_BITS)) {
    return yFp - (160 << FP_BITS);
  }
  return yFp;
}
