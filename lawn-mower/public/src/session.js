// SPDX-License-Identifier: GPL-3.0-or-later
// One physical NMI of the game, as the page runs it: which of the original's loops the kernel is in (title, screen set-up, play,
// the level-clear and out-of-fuel sequences, the final screen). The page and the tests both call this, so what the tests check against
// the ROM is what the page runs.

import { LawnMowerKernel } from './kernel.js';

export class LawnSession {
  constructor({ seed = 1, checkPadClearsDirection = false, screens = null } = {}) {
    this.game = new LawnMowerKernel({ seed, checkPadClearsDirection, screens });
  }

  get chrAnim() { return this.game.chrAnim; }

  coldReset(seed = 1) {
    this.game.coldReset(seed);
  }

  /**
   * Runs one NMI. `pad` is the controller as the original reads it (the PAD bits of constants.js): the buttons held now.
   * The original polls the pad only in some of its loops and treats a button as pressed when it was not down at the previous poll,
   * so a press has to be held until a poll sees it; that is the caller's business (the page holds START for a few frames).
   */
  tick(pad = 0) {
    const game = this.game;
    if (game.mode === 'title') game.titleFlowPhysicalTick(pad);
    else if (game.mode === 'setup') game.setupTick();
    else if (game.mode === 'level-clear' || game.mode === 'out-of-fuel' || game.mode === 'complete') game.flowPhysicalTick(pad);
    else game.physicalTick(pad);
  }
}
