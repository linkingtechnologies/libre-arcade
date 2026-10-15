/*
 * Zooming Secretary: the decorative hearts, as far as they matter to the game
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// The source keeps eight hearts (heart_x, heart_y, heart_cnt). A heart is drawn, and nothing else, but hearts_add() takes two numbers
// from the shared random generator only when it finds a free slot, so whether a slot is free decides what every later call to
// rand8() returns. A slot is free when its heart_y is 240 or more; a heart is given a life of 24 to 31 updates and, because only half
// of the hearts are updated in each iteration (the first four in the odd iterations, the last four in the even ones), it lives twice
// that many iterations. Its position never reaches the edge of the screen in the game, so a heart is alive exactly while its life is
// not used up, and the position is not needed.
export const HEARTS_MAX = 8;

export class Hearts {
  constructor() {
    this.ptr = 0;
    this.life = new Array(HEARTS_MAX).fill(0);
  }

  // hearts_add(): looks for a free slot from the one after the last used, wrapping, at most once round. Returns whether a heart was added.
  add(rng) {
    for (let j = 0; j < HEARTS_MAX; j++) {
      this.ptr++;
      if (this.ptr >= HEARTS_MAX) this.ptr = 0;
      if (this.life[this.ptr] === 0) {
        rng.rand8();                                   // the heart's x
        this.life[this.ptr] = 24 + (rng.rand8() & 7);  // its life
        return true;
      }
    }
    return false;
  }

  // The part of the main loop that moves the hearts: half of them, chosen by the parity of the iteration.
  update(frameCnt) {
    let slot = (frameCnt & 1) ? 0 : HEARTS_MAX / 2;
    for (let i = 0; i < HEARTS_MAX / 2; i++, slot++) {
      if (this.life[slot]) this.life[slot]--;
    }
  }

  snapshot() { return { ptr: this.ptr, life: [...this.life] }; }
}
