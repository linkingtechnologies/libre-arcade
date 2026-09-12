// SPDX-License-Identifier: GPL-3.0-only
/**
 * Clean-room Web Audio effects for the browser port.
 * No historical glParchis WAV data is reused.
 */
export function eventSoundKind(event) {
  if (!event) return null;
  if (event.type === 'roll') return 'roll';
  if (event.type === 'move') return 'move';
  if (event.type === 'capture') return 'capture';
  if (event.type === 'goal') return 'goal';
  if (event.type === 'win') return 'win';
  if (event.type.startsWith('three-sixes')) return 'penalty';
  return null;
}

export class GameAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled && this.ctx?.state === 'running') this.ctx.suspend().catch(() => {});
  }

  async unlock() {
    if (!this.enabled || typeof globalThis.AudioContext === 'undefined' && typeof globalThis.webkitAudioContext === 'undefined') return;
    if (!this.ctx) {
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
  }

  tone(freq, duration = 0.07, delay = 0, gain = 0.035, type = 'sine') {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  play(kind) {
    if (!this.enabled || !kind) return;
    this.unlock().then(() => this.playUnlocked(kind)).catch(() => {});
  }

  playUnlocked(kind) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    if (kind === 'roll') {
      this.tone(180, .035, 0, .025, 'square');
      this.tone(240, .035, .045, .02, 'square');
    } else if (kind === 'move') {
      this.tone(360, .04, 0, .018, 'sine');
    } else if (kind === 'capture') {
      this.tone(520, .08, 0, .035, 'triangle');
      this.tone(260, .12, .07, .035, 'triangle');
    } else if (kind === 'goal') {
      this.tone(440, .08, 0, .035, 'sine');
      this.tone(660, .10, .07, .035, 'sine');
    } else if (kind === 'penalty') {
      this.tone(180, .15, 0, .04, 'sawtooth');
      this.tone(130, .16, .12, .035, 'sawtooth');
    } else if (kind === 'win') {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .16, i * .09, .04, 'triangle'));
    }
  }
}
