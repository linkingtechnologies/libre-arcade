// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * glibc rand()/srand() compatibility layer used by the Linux HighMoon oracle.
 *
 * HighMoon 1.2.4 uses the C library global rand() through:
 *   #define RANDOM(max,min) ((max-min)*(rand()/(RAND_MAX+1.0))+min)
 *
 * The preserved native oracle was built on glibc, where rand() uses the
 * additive-feedback random() sequence (TYPE_3, degree 31, separation 3).
 * This implementation reproduces that sequence exactly for ordinary positive
 * seeds used by HighMoon/oracle. It deliberately exposes raw rand() values so
 * RNG consumption can be audited rather than hidden behind gameplay helpers.
 */
export const GLIBC_RAND_MAX = 0x7fffffff;

export class GlibcRand {
  constructor(seed = 1) {
    this.srand(seed);
  }

  srand(seed) {
    // The archaeological scenarios use positive 31-bit seeds. Preserve the
    // same seed=0 convention as glibc random(): zero is treated as one.
    let s = Number(seed) >>> 0;
    if (s === 0) s = 1;
    this.seed = s;
    this.index = 0;

    const r = new Array(344);
    r[0] = s;
    for (let i = 1; i < 31; i += 1) {
      // Park-Miller initialization. Values remain exactly representable as JS
      // integers here; modulo is therefore deterministic.
      r[i] = (16807 * r[i - 1]) % 2147483647;
    }
    for (let i = 31; i < 34; i += 1) r[i] = r[i - 31];
    for (let i = 34; i < 344; i += 1) {
      r[i] = (r[i - 31] + r[i - 3]) >>> 0;
    }
    this.state = r;
    this.stateIndex = 344;
    return this;
  }

  rand(trace = null, site = null) {
    const i = this.stateIndex;
    const next = (this.state[i - 31] + this.state[i - 3]) >>> 0;
    this.state.push(next);
    this.stateIndex += 1;
    const raw = next >>> 1;
    trace?.({ event: "rng", index: this.index, raw, rand_max: GLIBC_RAND_MAX, site });
    this.index += 1;
    return raw;
  }

  random(max, min, trace = null, site = null) {
    const raw = this.rand(trace, site);
    return (max - min) * (raw / (GLIBC_RAND_MAX + 1.0)) + min;
  }
}
