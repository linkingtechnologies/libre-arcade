/* SPDX-License-Identifier: GPL-3.0-or-later */

export const BUTTON = Object.freeze({
  A: 1 << 0,
  B: 1 << 1,
  SELECT: 1 << 2,
  START: 1 << 3,
  UP: 1 << 4,
  DOWN: 1 << 5,
  LEFT: 1 << 6,
  RIGHT: 1 << 7
});

export function maskFrom(input = {}) {
  if (typeof input === 'number') return input & 0xff;
  let mask = 0;
  for (const [name, bit] of Object.entries(BUTTON)) if (input[name]) mask |= bit;
  return mask;
}

// The program's pad_poll(): each read gives the state of the pad and the buttons that are down now and were not at the previous read.
// What counts as the previous read is the previous call, so a loop that reads the pad only in some of its passes (the paused game reads
// it only when it is waiting for START) sees a press once, whenever the reads are.
export class PadPoll {
  constructor(previous = 0) {
    this.state = previous & 0xff;
    this.trigger = 0;
  }

  poll(input) {
    const now = maskFrom(input);
    this.trigger = now & (~this.state & 0xff);
    this.state = now;
    return this.trigger;
  }
}

export class InputState {
  constructor() {
    this.held = 0;
    this.previous = 0;
    this.trigger = 0;
  }

  sample(input) {
    this.previous = this.held;
    this.held = maskFrom(input);
    this.trigger = this.held & (~this.previous & 0xff);
    return this;
  }

  down(button) { return (this.held & button) !== 0; }
  pressed(button) { return (this.trigger & button) !== 0; }
}
