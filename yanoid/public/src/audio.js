/*
 * Original Web Audio soundtrack and effects for the web port.
 * No historical third-party WAV, MOD or XM material is copied or sampled.
 */
export const MUSIC_BPM = 132;
export const MUSIC_STEPS = 64;

// Four 4/4 bars, one entry per 16th note. MIDI note numbers; null = rest.
// This melody is an original composition written for the preservation port.
export const LEAD_PATTERN = Object.freeze([
  69,null,76,null,72,null,76,79, 76,null,72,74,76,null,72,null,
  65,null,72,null,69,null,72,76, 72,null,69,67,69,null,64,null,
  67,null,72,null,76,null,72,79, 76,null,72,74,72,null,67,null,
  67,null,74,null,71,null,74,79, 74,null,71,69,71,null,67,null,
]);

const BASS_ROOTS = Object.freeze([45, 41, 36, 43]); // A2, F2, C2, G2

export function midiFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export class AudioFX {
  constructor() {
    this.ctx = null;
    this.fxBus = null;
    this.musicBus = null;
    this.fxEnabled = true;
    this.musicEnabled = true;
    this.gameActive = false;
    this.musicPlaying = false;
    this.musicStep = 0;
    this.nextMusicTime = 0;
    this.musicTimer = 0;
    this.unlocked = false;
    this.unlockPromise = null;
  }

  createContext() {
    if (this.ctx) return this.ctx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.ctx = new AudioContextClass();
    this.fxBus = this.ctx.createGain();
    this.fxBus.gain.value = 1.0;
    this.fxBus.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.48;
    this.musicBus.connect(this.ctx.destination);
    return this.ctx;
  }

  /*
   * Browser autoplay policies require AudioContext.resume() to happen from a
   * real user gesture. Call this from click/pointer/key handlers and await it
   * before starting gameplay/audio scheduling.
   */
  async unlock() {
    const ctx = this.createContext();
    if (!ctx) return false;
    if (ctx.state === 'running') {
      this.unlocked = true;
      return true;
    }
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = (async () => {
      try {
        await ctx.resume();
        this.unlocked = ctx.state === 'running';
      } catch {
        this.unlocked = false;
      } finally {
        this.unlockPromise = null;
      }
      if (this.unlocked && this.gameActive && this.musicEnabled && !this.musicPlaying) {
        this.startMusic();
      }
      return this.unlocked;
    })();
    return this.unlockPromise;
  }

  isReady() {
    return Boolean(this.ctx && this.ctx.state === 'running');
  }

  setFxEnabled(value) {
    this.fxEnabled = Boolean(value);
  }

  setMusicEnabled(value) {
    this.musicEnabled = Boolean(value);
    if (!this.musicEnabled) this.stopMusic();
    else if (this.gameActive && this.isReady()) this.startMusic();
  }

  setGameActive(value) {
    this.gameActive = Boolean(value);
    if (this.gameActive && this.musicEnabled && this.isReady()) this.startMusic();
    else this.stopMusic();
  }

  tone(freq = 440, duration = 0.05, type = 'square', gain = 0.05, endFreq = null) {
    if (!this.fxEnabled || !this.isReady()) return;
    const ctx = this.ctx;
    this.scheduleOscillator(freq, duration, type, gain, ctx.currentTime, this.fxBus, endFreq);
  }

  scheduleOscillator(freq, duration, type, gain, when, bus, endFreq = null) {
    const ctx = this.ctx;
    if (!ctx || !bus || ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freq), when);
    if (endFreq != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), when + duration);
    amp.gain.setValueAtTime(Math.max(0.0001, gain), when);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(amp).connect(bus);
    osc.start(when);
    osc.stop(when + duration + 0.01);
  }

  brick() { this.tone(520, .045, 'square', .05, 380); }
  metal() { this.tone(190, .075, 'triangle', .065, 120); }
  good() { this.tone(620, .11, 'sine', .07, 900); }
  bad() { this.tone(180, .14, 'sawtooth', .045, 90); }
  fire() { this.tone(760, .055, 'square', .045, 420); }
  lose() { this.tone(220, .2, 'triangle', .07, 90); }
  level() { this.tone(480, .16, 'sine', .065, 840); }

  startMusic() {
    if (!this.musicEnabled || this.musicPlaying || !this.isReady()) return;
    const ctx = this.ctx;
    this.musicPlaying = true;
    this.nextMusicTime = ctx.currentTime + 0.06;
    this.scheduleMusic();
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 45);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = 0;
  }

  scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.musicPlaying) return;
    const sixteenth = 60 / MUSIC_BPM / 4;
    const horizon = ctx.currentTime + 0.14;
    while (this.nextMusicTime < horizon && this.musicPlaying) {
      this.scheduleMusicStep(this.musicStep, this.nextMusicTime, sixteenth);
      this.musicStep = (this.musicStep + 1) % MUSIC_STEPS;
      this.nextMusicTime += sixteenth;
    }
  }

  scheduleMusicStep(step, when, sixteenth) {
    const lead = LEAD_PATTERN[step];
    if (lead != null) {
      this.scheduleOscillator(midiFrequency(lead), sixteenth * 1.55, 'square', 0.038, when, this.musicBus);
    }

    const withinBar = step % 16;
    const bar = Math.floor(step / 16);
    const bassRoot = BASS_ROOTS[bar];
    if (withinBar % 4 === 0) {
      const bassNote = withinBar === 12 ? bassRoot + 7 : bassRoot;
      this.scheduleOscillator(midiFrequency(bassNote), sixteenth * 3.0, 'triangle', 0.062, when, this.musicBus);
    }

    if (withinBar === 0 || withinBar === 8) this.scheduleKick(when);
    if (withinBar === 4 || withinBar === 12) this.scheduleSnare(when);
    if (step % 2 === 0) this.scheduleHat(when);
  }

  scheduleKick(when) {
    this.scheduleOscillator(118, 0.09, 'sine', 0.075, when, this.musicBus, 46);
  }

  scheduleSnare(when) {
    this.scheduleOscillator(190, 0.045, 'square', 0.024, when, this.musicBus, 115);
    this.scheduleOscillator(860, 0.025, 'square', 0.014, when + 0.006, this.musicBus, 520);
  }

  scheduleHat(when) {
    this.scheduleOscillator(2400, 0.018, 'square', 0.01, when, this.musicBus, 1800);
  }
}
