// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Clean-room procedural audio for HighMoon.
 *
 * Important: this layer never reads or mutates the historical game RNG.
 * Any variation is derived from a private presentation-only counter.
 */
export class AudioEngine {
  constructor({ enabled = true, volume = 0.5 } = {}) {
    this.enabled = Boolean(enabled);
    this.volume = volume;
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.noise = null;
    this.eventCounter = 0;
    this.lastError = null;
  }

  async unlock() {
    if (!this.enabled) return false;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return false;
    try {
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.compressor = this.ctx.createDynamicsCompressor();
        this.master.gain.value = this.volume;
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.004;
        this.compressor.release.value = 0.22;
        this.master.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }
      // Invoke resume while still inside the trusted click/pointer/key handler.
      // Building the noise buffer first could delay the gesture-sensitive call.
      if (this.ctx.state !== 'running') await this.ctx.resume();
      if (this.ctx.state !== 'running') return false;
      if (!this.noise) this.noise = this.#makeNoiseBuffer(1.25);
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error;
      return false;
    }
  }

  get status() {
    if (!this.enabled) return 'off';
    if (this.lastError) return 'unavailable';
    if (!(globalThis.AudioContext || globalThis.webkitAudioContext)) return 'unavailable';
    return this.ctx?.state === 'running' ? 'ready' : 'blocked';
  }

  async testSound() {
    if (!await this.unlock()) return false;
    this.handle({ event: 'audio_test' });
    return true;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues?.(now);
      this.master.gain.setTargetAtTime?.(this.enabled ? this.volume : 0, now, 0.012);
      if (!this.master.gain.setTargetAtTime) this.master.gain.value = this.enabled ? this.volume : 0;
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.unlock();
    return this.enabled;
  }

  #makeNoiseBuffer(seconds) {
    const frames = Math.max(1, Math.ceil(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Local xorshift32: deterministic, presentation-only, independent from HighMoon rand().
    let state = 0x51f15e1d;
    for (let i = 0; i < frames; i += 1) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      data[i] = ((state >>> 0) / 0x80000000) - 1;
    }
    return buffer;
  }

  #destination({ filterType = null, filterFreq = 1200, q = 0.8, delay = 0, feedback = 0, wet = 0 } = {}) {
    if (!filterType && !(delay > 0 && wet > 0)) return this.master;
    let input = null;
    let tail = null;
    if (filterType) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      filter.Q.value = q;
      input = tail = filter;
    }
    if (delay > 0 && wet > 0) {
      const dry = this.ctx.createGain();
      const send = this.ctx.createGain();
      const delayNode = this.ctx.createDelay(1);
      const fb = this.ctx.createGain();
      const wetGain = this.ctx.createGain();
      dry.gain.value = 1;
      send.gain.value = wet;
      delayNode.delayTime.value = delay;
      fb.gain.value = Math.min(0.72, Math.max(0, feedback));
      wetGain.gain.value = wet;

      const splitter = this.ctx.createGain();
      splitter.connect(dry); dry.connect(this.master);
      splitter.connect(send); send.connect(delayNode); delayNode.connect(wetGain); wetGain.connect(this.master);
      delayNode.connect(fb); fb.connect(delayNode);
      if (tail) tail.connect(splitter); else input = splitter;
      return input ?? splitter;
    }
    if (tail) tail.connect(this.master);
    return input ?? this.master;
  }

  #tone({
    freq = 440, endFreq = freq, duration = 0.12, gain = 0.1, type = 'sine', delay = 0,
    attack = 0.008, filterType = null, filterFreq = 1800, q = 0.8,
    echoDelay = 0, echoFeedback = 0, echoWet = 0,
  }) {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const dest = this.#destination({ filterType, filterFreq, q, delay: echoDelay, feedback: echoFeedback, wet: echoWet });
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), now);
    if (Math.abs(endFreq - freq) > 0.001) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + Math.min(attack, duration / 3));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp); amp.connect(dest);
    osc.start(now); osc.stop(now + duration + 0.04);
  }

  #noiseBurst({
    duration = 0.16, gain = 0.08, delay = 0, filterType = 'lowpass',
    filterFreq = 900, endFilterFreq = filterFreq, q = 0.8, playbackRate = 1,
  } = {}) {
    if (!this.enabled || !this.ctx || !this.master || !this.noise) return;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    src.buffer = this.noise;
    src.playbackRate.value = playbackRate;
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(30, filterFreq), now);
    if (Math.abs(endFilterFreq - filterFreq) > 0.001) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(30, endFilterFreq), now + duration);
    }
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + Math.min(0.008, duration / 4));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter); filter.connect(amp); amp.connect(this.master);

    const maxOffset = Math.max(0, this.noise.duration - duration - 0.02);
    const offset = maxOffset ? ((this.eventCounter * 0.173) % maxOffset) : 0;
    src.start(now, offset, Math.min(duration + 0.03, this.noise.duration - offset));
    src.stop(now + duration + 0.05);
  }

  #noteSequence(notes, { step = 0.085, duration = 0.22, gain = 0.035, type = 'triangle' } = {}) {
    notes.forEach((freq, i) => this.#tone({ freq, endFreq: freq * 1.008, duration, gain, type, delay: i * step, attack: 0.012 }));
  }

  #laser() {
    this.#noiseBurst({ duration: 0.035, gain: 0.022, filterType: 'highpass', filterFreq: 4300, endFilterFreq: 1700 });
    this.#tone({ freq: 1280, endFreq: 330, duration: 0.115, gain: 0.07, type: 'square', filterType: 'lowpass', filterFreq: 3200, q: 0.7 });
    this.#tone({ freq: 920, endFreq: 250, duration: 0.14, gain: 0.035, type: 'sine', delay: 0.008 });
  }

  #heavy() {
    this.#noiseBurst({ duration: 0.18, gain: 0.09, filterType: 'lowpass', filterFreq: 520, endFilterFreq: 105, q: 1.1, playbackRate: 0.72 });
    this.#tone({ freq: 118, endFreq: 38, duration: 0.28, gain: 0.16, type: 'sine', attack: 0.004 });
    this.#tone({ freq: 190, endFreq: 54, duration: 0.19, gain: 0.055, type: 'sawtooth', filterType: 'lowpass', filterFreq: 620 });
  }

  #clusterFire() {
    this.#tone({ freq: 720, endFreq: 170, duration: 0.19, gain: 0.075, type: 'triangle' });
    [0, 0.026, 0.052].forEach((delay, i) => this.#tone({ freq: 980 + i * 130, endFreq: 380 + i * 35, duration: 0.08, gain: 0.026, type: 'square', delay }));
  }

  #explosion(strength = 1) {
    const s = Math.max(0.45, Math.min(1.4, strength));
    this.#noiseBurst({ duration: 0.34 * s, gain: 0.13 * s, filterType: 'lowpass', filterFreq: 1450, endFilterFreq: 120, q: 0.6, playbackRate: 0.82 });
    this.#tone({ freq: 92, endFreq: 34, duration: 0.31 * s, gain: 0.12 * s, type: 'sine', attack: 0.003 });
    this.#noiseBurst({ duration: 0.075, gain: 0.035, delay: 0.012, filterType: 'highpass', filterFreq: 1900, endFilterFreq: 650 });
  }

  #wormhole() {
    this.#noiseBurst({ duration: 0.36, gain: 0.038, filterType: 'bandpass', filterFreq: 520, endFilterFreq: 4100, q: 2.2, playbackRate: 1.35 });
    this.#tone({ freq: 185, endFreq: 1180, duration: 0.34, gain: 0.052, type: 'sine', echoDelay: 0.082, echoFeedback: 0.35, echoWet: 0.22 });
    this.#tone({ freq: 370, endFreq: 2360, duration: 0.24, gain: 0.018, type: 'triangle', delay: 0.04, echoDelay: 0.067, echoFeedback: 0.26, echoWet: 0.18 });
  }

  #clusterSpawn() {
    this.#noiseBurst({ duration: 0.09, gain: 0.035, filterType: 'highpass', filterFreq: 1450, endFilterFreq: 3900 });
    [0, 0.022, 0.044, 0.066, 0.088].forEach((delay, i) => {
      this.#tone({ freq: 510 + i * 105, endFreq: 250 + i * 45, duration: 0.11, gain: 0.026, type: 'triangle', delay });
    });
  }

  #storm() {
    this.#noiseBurst({ duration: 0.18, gain: 0.045, filterType: 'bandpass', filterFreq: 520, endFilterFreq: 980, q: 4.2 });
    this.#tone({ freq: 245, endFreq: 430, duration: 0.17, gain: 0.032, type: 'sawtooth', filterType: 'bandpass', filterFreq: 670, q: 2.5 });
  }

  #bonusCollected() {
    this.#noteSequence([659.25, 830.61, 987.77], { step: 0.055, duration: 0.15, gain: 0.026, type: 'sine' });
  }

  #bonusBought() {
    this.#noteSequence([392, 523.25, 659.25, 783.99], { step: 0.045, duration: 0.17, gain: 0.026, type: 'triangle' });
  }

  #galaxyWarp() {
    this.#noiseBurst({ duration: 0.55, gain: 0.035, filterType: 'bandpass', filterFreq: 260, endFilterFreq: 5200, q: 1.4, playbackRate: 1.1 });
    this.#tone({ freq: 105, endFreq: 880, duration: 0.52, gain: 0.05, type: 'sine', echoDelay: 0.09, echoFeedback: 0.24, echoWet: 0.17 });
    this.#tone({ freq: 210, endFreq: 1320, duration: 0.44, gain: 0.018, type: 'triangle', delay: 0.045 });
  }

  #winner() {
    // Short clean-room fanfare: ascending fifth/triad, then a soft held resolve.
    this.#noteSequence([392, 523.25, 659.25, 783.99, 1046.5], { step: 0.085, duration: 0.24, gain: 0.035, type: 'triangle' });
    [523.25, 659.25, 783.99].forEach((freq, i) => this.#tone({ freq, endFreq: freq * 1.004, duration: 0.5, gain: 0.018, type: i === 1 ? 'sine' : 'triangle', delay: 0.48 }));
  }

  handle(event) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    this.eventCounter += 1;
    switch (event.event) {
      case 'audio_test':
        // A distinct, immediately audible confirmation. No music or external samples.
        this.#tone({ freq: 523.25, endFreq: 523.25, duration: 0.22, gain: 0.22, type: 'sine', attack: 0.009 });
        this.#tone({ freq: 783.99, endFreq: 783.99, duration: 0.24, gain: 0.14, type: 'triangle', delay: 0.1 });
        break;
      case 'menu_confirm':
        this.#tone({ freq: 740, endFreq: 1020, duration: 0.12, gain: 0.09, type: 'sine' });
        break;
      case 'fire':
        if (event.weapon === 'heavy') this.#heavy();
        else if (event.weapon === 'cluster') this.#clusterFire();
        else this.#laser();
        break;
      case 'damage': this.#explosion(Math.min(1.25, 0.7 + (event.amount ?? 10) / 70)); break;
      case 'body_impact':
        this.#noiseBurst({ duration: 0.18, gain: 0.07, filterType: 'lowpass', filterFreq: 780, endFilterFreq: 130, playbackRate: 0.88 });
        this.#tone({ freq: 135, endFreq: 62, duration: 0.2, gain: 0.07, type: 'sine' });
        break;
      case 'storm_contact': this.#storm(); break;
      case 'wormhole': this.#wormhole(); break;
      case 'cluster_spawn': this.#clusterSpawn(); break;
      case 'bonus_collected': this.#bonusCollected(); break;
      case 'bonus_bought': this.#bonusBought(); break;
      case 'galaxy_warp': this.#galaxyWarp(); break;
      case 'winner': this.#winner(); break;
      default: break;
    }
  }
}
