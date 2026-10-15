/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export class Rng8 {
  constructor(seed = 1) {
    this.state = seed & 0xff;
  }

  clone() {
    return new Rng8(this.state);
  }

  rand8() {
    const old = this.state;
    let next = (old << 1) & 0xff;
    if (old & 0x80) next ^= 0xcf;
    this.state = next;
    return next;
  }

  // The original result is irrelevant on the title screen; the important
  // parity property is that two consecutive rand8() calls are consumed.
  rand16() {
    const hi = this.rand8();
    const lo = this.rand8();
    return ((hi << 8) | lo) & 0xffff;
  }

  advanceTitleTicks(ticks) {
    for (let i = 0; i < ticks; i++) this.rand16();
    return this.state;
  }

  snapshot() {
    return this.state;
  }
}
