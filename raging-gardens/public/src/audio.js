// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Sound. The original's ten sound effects are edited Freesound clips whose individual licences
// cannot be established (two are NonCommercial, one has been deleted), so none of them is used:
// the effects are synthesised here with the Web Audio API, at the same moments the original
// played its own. The music is the CC0 track the original used, shipped as assets/music/.

const SFX_VOLUME = 0.4; // the original's sfx_vol
const MUSIC_VOLUME = 0.3; // the original's music_vol

export class Sound {
  constructor() {
    this.sfxOn = true;
    this.musicOn = true;
    this.ctx = null;
    this.music = null;
    this.playing = false;
    this.rand = Math.random; // cosmetic choices only, never the game's own random numbers
  }

  // Must be called from a user gesture.
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AC) { try { this.ctx = new AC(); } catch { this.ctx = null; } }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    if (!this.music && typeof Audio !== "undefined") {
      this.music = new Audio("assets/music/trouble-in-the-garden.ogg");
      this.music.loop = true;
      this.music.volume = MUSIC_VOLUME;
    }
  }

  startMusic() {
    this.playing = true;
    this.applyMusic();
  }
  stopMusic() {
    this.playing = false;
    this.applyMusic();
  }
  setMusic(on) { this.musicOn = on; this.applyMusic(); }
  setSfx(on) { this.sfxOn = on; }
  applyMusic() {
    if (!this.music) return;
    if (this.playing && this.musicOn) { const p = this.music.play(); if (p && p.catch) p.catch(() => {}); }
    else this.music.pause();
  }

  tone({ type = "sine", from, to = from, dur, gain = 1, at = 0, vibrato = 0 }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 9;
      lg.gain.value = vibrato;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain * SFX_VOLUME, t0 + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  play(name) {
    if (!this.sfxOn || !this.ctx) return;
    const r = this.rand();
    switch (name) {
      case "pull": // a pop
        this.tone({ type: "sine", from: 260, to: 700, dur: 0.09 });
        this.tone({ type: "triangle", from: 90, to: 60, dur: 0.12, gain: 0.7 });
        break;
      case "fart": // a low rasp with a wobble, two variants
        this.tone({ type: "sawtooth", from: r < 0.5 ? 110 : 85, to: r < 0.5 ? 55 : 40, dur: 0.38, vibrato: 25 });
        this.tone({ type: "square", from: 70, to: 38, dur: 0.3, gain: 0.5, vibrato: 18 });
        break;
      case "scream": // a short falling shriek
        this.tone({ type: "sawtooth", from: r < 0.5 ? 1000 : 820, to: 320, dur: 0.38, vibrato: 60, gain: 0.55 });
        break;
      case "aaaah": // the totem rises: a long rising "aah"
        this.tone({ type: "triangle", from: 260, to: 420, dur: 0.7, vibrato: 8 });
        this.tone({ type: "sine", from: 520, to: 840, dur: 0.7, gain: 0.5 });
        break;
      case "laughter": // ha ha ha
        for (let i = 0; i < 4; i++) this.tone({ type: "square", from: 330 - i * 20 + (r < 0.5 ? 0 : 40), to: 200 - i * 10, dur: 0.1, at: i * 0.16, gain: 0.45 });
        break;
      case "burp": // a grunt
        this.tone({ type: "sawtooth", from: 95, to: 55, dur: 0.28, vibrato: 14 });
        break;
      default:
        break;
    }
  }
}
