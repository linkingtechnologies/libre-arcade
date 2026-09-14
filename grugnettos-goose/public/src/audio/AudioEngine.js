const MEDIA_SOURCES = Object.freeze({
  dice: './assets/audio/dice.wav',
  step1: './assets/audio/step1.wav',
  step2: './assets/audio/step2.wav',
  step3: './assets/audio/step3.wav',
  step4: './assets/audio/step4.wav',
  win: './assets/audio/win.wav',
  unlock: './assets/audio/unlock.wav'
});

export class AudioEngine {
  constructor({ enabled = true, masterGain = 0.9 } = {}) {
    this.enabled = Boolean(enabled);
    this.masterGain = masterGain;
    this.context = null;
    this.master = null;
    this.stepPhase = 0;
    this.media = new Map();
    this.mediaPrimed = false;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.master && this.context) {
      const now = this.context.currentTime ?? 0;
      this.master.gain?.setValueAtTime?.(this.enabled ? this.masterGain : 0.0001, now);
    }
  }

  createContext() {
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.setValueAtTime(this.enabled ? this.masterGain : 0.0001, this.context.currentTime);
    this.master.connect(this.context.destination);
    return this.context;
  }

  mediaElement(name) {
    if (typeof globalThis.Audio !== 'function') return null;
    if (!MEDIA_SOURCES[name]) return null;
    if (!this.media.has(name)) {
      const element = new globalThis.Audio(MEDIA_SOURCES[name]);
      element.preload = 'auto';
      element.playsInline = true;
      this.media.set(name, element);
    }
    return this.media.get(name);
  }

  async primeMedia() {
    if (!this.enabled || this.mediaPrimed || typeof globalThis.Audio !== 'function') return this.mediaPrimed;
    const probe = this.mediaElement('unlock');
    if (!probe) return false;
    try {
      probe.volume = 0.035;
      probe.currentTime = 0;
      const promise = probe.play();
      if (promise?.then) await promise;
      this.mediaPrimed = true;
      return true;
    } catch {
      return false;
    }
  }

  async unlock() {
    if (!this.enabled) return false;

    // Start HTMLAudio playback immediately while the browser still has the
    // direct user-activation token. This is a robust fallback for browsers
    // that keep Web Audio suspended even after resume().
    const mediaPromise = this.primeMedia();

    if (!this.context || this.context.state === 'closed') this.createContext();
    if (this.context && this.context.state !== 'running' && typeof this.context.resume === 'function') {
      try {
        await this.context.resume();
      } catch {
        // Media fallback below may still be available.
      }
    }

    const mediaReady = await mediaPromise.catch(() => false);
    if (this.context?.state === 'running' && this.master) {
      this.master.gain.setValueAtTime(this.masterGain, this.context.currentTime);
      return true;
    }
    return Boolean(mediaReady);
  }

  isReady() {
    return Boolean(this.enabled && this.context?.state === 'running' && this.master);
  }

  playMedia(name, { volume = 0.7, playbackRate = 1 } = {}) {
    if (!this.enabled || !this.mediaPrimed) return false;
    const template = this.mediaElement(name);
    if (!template) return false;
    try {
      const element = template.cloneNode ? template.cloneNode(true) : new globalThis.Audio(MEDIA_SOURCES[name]);
      element.volume = Math.max(0, Math.min(1, volume));
      element.playbackRate = playbackRate;
      element.currentTime = 0;
      const promise = element.play();
      promise?.catch?.(() => {});
      return true;
    } catch {
      return false;
    }
  }

  tone({ frequency = 440, duration = 0.07, gain = 0.055, type = 'sine', offset = 0 } = {}) {
    if (!this.isReady()) return;
    const now = this.context.currentTime + offset;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(gain, now + 0.004);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(volume).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  clack({ frequency = 190, offset = 0, gain = 0.068 } = {}) {
    this.tone({ frequency, duration: 0.034, gain, type: 'triangle', offset });
    this.tone({ frequency: frequency * 2.75, duration: 0.018, gain: gain * 0.52, type: 'square', offset: offset + 0.002 });
  }

  dice() {
    if (this.playMedia('dice', { volume: 0.82 })) return;
    const hits = [
      [178, 0.000, 0.076], [236, 0.037, 0.066], [196, 0.076, 0.071],
      [267, 0.119, 0.060], [164, 0.167, 0.069], [228, 0.221, 0.060],
      [187, 0.284, 0.057], [146, 0.350, 0.065]
    ];
    for (const [frequency, offset, gain] of hits) this.clack({ frequency, offset, gain });
    this.tone({ frequency: 104, duration: 0.09, gain: 0.060, type: 'triangle', offset: 0.385 });
  }

  step() {
    const phase = this.stepPhase % 4;
    this.stepPhase = (this.stepPhase + 1) % 4;
    if (this.playMedia(`step${phase + 1}`, { volume: 0.58 })) return;
    const pitches = [315, 348, 326, 366];
    const frequency = pitches[phase];
    this.tone({ frequency, duration: 0.042, gain: 0.058, type: 'triangle' });
    this.tone({ frequency: frequency * 2.35, duration: 0.017, gain: 0.022, type: 'square', offset: 0.002 });
  }

  enabledCue() {
    if (this.playMedia('step2', { volume: 0.48, playbackRate: 1.16 })) return;
    this.tone({ frequency: 523, duration: 0.06, gain: 0.045, type: 'triangle' });
    this.tone({ frequency: 659, duration: 0.08, gain: 0.042, type: 'triangle', offset: 0.055 });
  }

  goose() {
    this.tone({ frequency: 520, duration: 0.075, gain: 0.052, type: 'sine' });
    this.tone({ frequency: 690, duration: 0.1, gain: 0.048, type: 'sine', offset: 0.075 });
  }

  bridge() {
    this.tone({ frequency: 300, duration: 0.06, gain: 0.048, type: 'triangle' });
    this.tone({ frequency: 390, duration: 0.06, gain: 0.048, type: 'triangle', offset: 0.055 });
    this.tone({ frequency: 490, duration: 0.08, gain: 0.048, type: 'triangle', offset: 0.11 });
  }

  penalty() {
    this.tone({ frequency: 250, duration: 0.1, gain: 0.055, type: 'sawtooth' });
    this.tone({ frequency: 185, duration: 0.13, gain: 0.050, type: 'sawtooth', offset: 0.08 });
  }

  death() {
    this.tone({ frequency: 220, duration: 0.12, gain: 0.060, type: 'sawtooth' });
    this.tone({ frequency: 130, duration: 0.18, gain: 0.052, type: 'sawtooth', offset: 0.1 });
  }

  swap() {
    this.tone({ frequency: 410, duration: 0.055, gain: 0.046, type: 'triangle' });
    this.tone({ frequency: 520, duration: 0.055, gain: 0.046, type: 'triangle', offset: 0.05 });
  }

  win() {
    if (this.playMedia('win', { volume: 0.78 })) return;
    [523, 659, 784, 1047].forEach((frequency, index) => {
      this.tone({ frequency, duration: 0.18, gain: 0.060, type: 'triangle', offset: index * 0.105 });
    });
  }
}
