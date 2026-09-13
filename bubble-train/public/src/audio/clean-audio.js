// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Clean-room synthesized audio and lightweight procedural music.
 * No historical audio samples or melodies are used.
 */
const CUE_TABLE = {
  fire: [
    { type: 'triangle', frequency: 720, duration: 0.025, gain: 0.07 },
    { type: 'sine', frequency: 420, duration: 0.05, gain: 0.045, offset: 0.018 }
  ],
  match: [
    { type: 'triangle', frequency: 660, duration: 0.05, gain: 0.075 },
    { type: 'triangle', frequency: 880, duration: 0.05, gain: 0.05, offset: 0.055 }
  ],
  bomb: [
    { type: 'sawtooth', frequency: 180, duration: 0.07, gain: 0.055 },
    { type: 'triangle', frequency: 96, duration: 0.16, gain: 0.075, offset: 0.03 }
  ],
  win: [
    { type: 'triangle', frequency: 523.25, duration: 0.08, gain: 0.07 },
    { type: 'triangle', frequency: 659.25, duration: 0.08, gain: 0.07, offset: 0.08 },
    { type: 'triangle', frequency: 783.99, duration: 0.12, gain: 0.08, offset: 0.16 }
  ],
  lose: [
    { type: 'sawtooth', frequency: 220, duration: 0.08, gain: 0.06 },
    { type: 'sawtooth', frequency: 174.61, duration: 0.09, gain: 0.06, offset: 0.085 },
    { type: 'triangle', frequency: 130.81, duration: 0.18, gain: 0.07, offset: 0.17 }
  ],
  level: [
    { type: 'triangle', frequency: 523.25, duration: 0.05, gain: 0.055 },
    { type: 'triangle', frequency: 659.25, duration: 0.05, gain: 0.055, offset: 0.06 }
  ],
  click: [
    { type: 'sine', frequency: 360, duration: 0.025, gain: 0.045 }
  ]
};

const MUSIC_THEMES = {
  default: { notes: [196.00, 246.94, 293.66, 246.94], bass: [98.00, 110.00], wave: 'triangle' },
  arctic: { notes: [220.00, 293.66, 329.63, 293.66], bass: [110.00, 146.83], wave: 'sine' },
  beach: { notes: [261.63, 329.63, 392.00, 329.63], bass: [130.81, 174.61], wave: 'triangle' },
  mexico: { notes: [220.00, 261.63, 329.63, 392.00], bass: [110.00, 130.81], wave: 'square' },
  mountains: { notes: [174.61, 220.00, 261.63, 293.66], bass: [87.31, 98.00], wave: 'triangle' },
  sea: { notes: [196.00, 261.63, 293.66, 261.63], bass: [98.00, 130.81], wave: 'sine' },
  sky: { notes: [293.66, 369.99, 440.00, 369.99], bass: [146.83, 164.81], wave: 'triangle' },
  space: { notes: [164.81, 246.94, 311.13, 233.08], bass: [82.41, 92.50], wave: 'sine' },
  menu: { notes: [261.63, 329.63, 392.00, 329.63], bass: [130.81, 98.00], wave: 'triangle' }
};

export class CleanAudio {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled;
    this.context = null;
    this.master = null;
    this.fxGain = null;
    this.musicGain = null;
    this.theme = 'menu';
    this.musicMode = 'stopped';
    this.currentMusicToken = 0;
    this.musicTimer = null;
    this.pendingCues = [];
  }

  static themeNames() { return Object.keys(MUSIC_THEMES).filter(n => n !== 'menu'); }

  static planTheme(theme = 'default', mode = 'game') {
    const key = mode === 'menu' ? 'menu' : (MUSIC_THEMES[String(theme).toLowerCase()] ? String(theme).toLowerCase() : 'default');
    return MUSIC_THEMES[key];
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.#clearMusicTimer();
      this.pendingCues.length = 0;
      if (this.master) this.master.gain.value = 0;
      return;
    }
    if (this.master) this.master.gain.value = 0.82;
    void this.unlock();
  }

  async unlock() {
    if (!this.enabled) return false;
    const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Ctx) return false;
    if (!this.context) {
      this.context = new Ctx();
      this.#buildGraph();
    }
    try {
      if (this.context.state !== 'running') await this.context.resume();
    } catch {
      return false;
    }
    if (this.context.state !== 'running') return false;
    this.#flushPendingCues();
    // A repeated user gesture must not restart an already-running music loop.
    // Only start music here when no loop is currently scheduled.
    if (!this.musicTimer && (this.musicMode === 'game' || this.musicMode === 'menu')) this.#startMusicLoop();
    return true;
  }

  setTheme(theme = 'default') {
    const next = String(theme || 'default').toLowerCase();
    if (next === this.theme) return;
    this.theme = next;
    if (this.musicMode === 'game' || this.musicMode === 'menu') this.#refreshMusic(true);
  }

  playMusic(mode = 'game') {
    const next = mode === 'menu' ? 'menu' : 'game';
    if (this.musicMode === next && this.musicTimer) return;
    this.musicMode = next;
    this.#refreshMusic(true);
  }

  pauseMusic() {
    this.musicMode = 'paused';
    this.#clearMusicTimer();
    if (this.musicGain && this.context) {
      const now = this.context.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(0.0001, now, 0.03);
    }
  }

  stopMusic() {
    this.musicMode = 'stopped';
    this.#clearMusicTimer();
    if (this.musicGain && this.context) {
      const now = this.context.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(0.0001, now, 0.03);
    }
  }

  cue(name) {
    if (!this.enabled) return;
    if (!this.context || this.context.state !== 'running' || !this.fxGain) {
      this.pendingCues.push(name);
      if (this.pendingCues.length > 8) this.pendingCues.shift();
      void this.unlock();
      return;
    }
    this.#playCue(name);
  }

  #playCue(name) {
    const events = CUE_TABLE[name] ?? CUE_TABLE.click;
    const base = this.context.currentTime;
    for (const event of events) this.#playTone({ ...event, at: base + (event.offset ?? 0), out: this.fxGain });
  }

  #flushPendingCues() {
    if (!this.context || this.context.state !== 'running' || !this.fxGain || !this.pendingCues.length) return;
    const queued = this.pendingCues.splice(0);
    for (const name of queued) this.#playCue(name);
  }

  #buildGraph() {
    this.master = this.context.createGain();
    this.master.gain.value = 0.82;
    this.fxGain = this.context.createGain();
    this.fxGain.gain.value = 0.9;
    this.musicGain = this.context.createGain();
    // Music gets one mix-stage only; per-note envelopes control articulation.
    // Keep this high enough to remain audible beside the short FX cues.
    this.musicGain.gain.value = 1.0;
    this.fxGain.connect(this.master);
    this.musicGain.connect(this.master);
    this.master.connect(this.context.destination);
  }

  #refreshMusic(force = false) {
    if (!this.enabled || !this.context || this.context.state !== 'running' || !this.musicGain) return;
    if (this.musicMode === 'stopped') {
      this.stopMusic();
      return;
    }
    if (this.musicMode === 'paused') {
      this.pauseMusic();
      return;
    }
    if (!force && this.musicTimer) return;
    this.#startMusicLoop();
  }

  #startMusicLoop() {
    this.#clearMusicTimer();
    const token = ++this.currentMusicToken;
    const plan = CleanAudio.planTheme(this.theme, this.musicMode);
    const noteSpacing = this.musicMode === 'menu' ? 0.34 : 0.28;
    const cycleLength = noteSpacing * plan.notes.length;
    const bassSpacing = cycleLength / plan.bass.length;
    const scheduleCycle = () => {
      if (token !== this.currentMusicToken || !this.enabled || !this.context || this.context.state !== 'running' || !this.musicGain || (this.musicMode !== 'game' && this.musicMode !== 'menu')) return;
      const now = this.context.currentTime + 0.02;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(this.musicMode === 'menu' ? 0.92 : 1.0, now, 0.04);
      plan.notes.forEach((frequency, i) => {
        this.#playTone({ type: plan.wave, frequency, duration: noteSpacing * 0.88, gain: this.musicMode === 'menu' ? 0.16 : 0.19, at: now + i * noteSpacing, out: this.musicGain });
      });
      plan.bass.forEach((frequency, i) => {
        this.#playTone({ type: 'sine', frequency, duration: bassSpacing * 0.92, gain: this.musicMode === 'menu' ? 0.075 : 0.095, at: now + i * bassSpacing, out: this.musicGain });
      });
      this.musicTimer = setTimeout(scheduleCycle, Math.max(100, Math.round(cycleLength * 1000)));
    };
    scheduleCycle();
  }

  #clearMusicTimer() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
    this.currentMusicToken += 1;
  }

  #playTone({ type = 'sine', frequency = 440, duration = 0.05, gain = 0.05, at = 0, out = null }) {
    const destination = out ?? this.fxGain;
    if (!this.context || !destination) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    envelope.gain.setValueAtTime(Math.max(0.0001, gain), at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope).connect(destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.01);
  }
}
