/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  const W = root.Wok;
  class AudioManager {
    constructor(base = 'assets/runtime/sounds/') {
      this.base = base;
      this.context = null;
      this.raw = new Map();
      this.buffers = new Map();
      this.preloadPromise = null;
      this.decodePromise = null;
      this.musicSource = null;
      this.currentMusicIdx = 0;
      this.nextMusicIdx = -1;
      this.pendingMusicIdx = -1;
      this.stopped = true;
      this.names = ['wok1.wav', 'wok2.wav', 'gen.wav', 'score.wav', 'miss.wav'];
    }
    preload() {
      if (this.preloadPromise) return this.preloadPromise;
      this.preloadPromise = Promise.all(this.names.map(async name => {
        const res = await fetch(this.base + name);
        if (!res.ok) throw new Error(`Audio load failed: ${name}`);
        this.raw.set(name, await res.arrayBuffer());
      })).catch(err => { console.warn(err); });
      return this.preloadPromise;
    }
    async unlock() {
      if (!this.context) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.context = new AC();
      }
      if (this.context.state === 'suspended') await this.context.resume();
      if (!this.decodePromise) {
        this.decodePromise = (async () => {
          await this.preload();
          for (const name of this.names) {
            const raw = this.raw.get(name);
            if (!raw) continue;
            try { this.buffers.set(name, await this.context.decodeAudioData(raw.slice(0))); }
            catch (err) { console.warn(`Unable to decode ${name}`, err); }
          }
          if (this.pendingMusicIdx >= 0) this.startMusicSource(this.pendingMusicIdx);
        })();
      }
      return this.decodePromise;
    }
    musicName(idx) { return idx === 0 ? 'wok1.wav' : 'wok2.wav'; }
    sfxName(idx) { return ['gen.wav', 'score.wav', 'miss.wav'][idx]; }
    startMusicSource(idx) {
      if (!this.context) { this.pendingMusicIdx = idx; return; }
      const buffer = this.buffers.get(this.musicName(idx));
      if (!buffer) { this.pendingMusicIdx = idx; return; }
      if (this.musicSource) {
        try { this.musicSource.onended = null; this.musicSource.stop(); } catch { /* ignored */ }
      }
      this.pendingMusicIdx = -1;
      this.currentMusicIdx = idx;
      this.nextMusicIdx = idx;
      this.stopped = false;
      const src = this.context.createBufferSource();
      src.buffer = buffer;
      src.connect(this.context.destination);
      src.onended = () => {
        if (!this.stopped && this.nextMusicIdx >= 0) this.startMusicSource(this.nextMusicIdx);
      };
      this.musicSource = src;
      src.start();
    }
    playMusic(idx) { this.nextMusicIdx = idx; this.stopped = false; this.startMusicSource(idx); }
    nextMusic() { this.nextMusicIdx = (this.currentMusicIdx + 1) % 2; }
    stopMusic() {
      this.stopped = true;
      this.nextMusicIdx = -1;
      this.pendingMusicIdx = -1;
      if (this.musicSource) {
        try { this.musicSource.onended = null; this.musicSource.stop(); } catch { /* ignored */ }
        this.musicSource = null;
      }
    }
    playSfx(idx) {
      if (!this.context) return;
      const buffer = this.buffers.get(this.sfxName(idx));
      if (!buffer) return;
      const src = this.context.createBufferSource();
      src.buffer = buffer;
      src.connect(this.context.destination);
      src.start();
    }
    process(batch) {
      for (const evt of batch.events) {
        if (evt.type === 'playMusic') this.playMusic(evt.idx);
        else if (evt.type === 'stopMusic') this.stopMusic();
        else if (evt.type === 'nextMusic') this.nextMusic();
      }
      for (const idx of batch.sfx) this.playSfx(idx);
    }
  }
  W.Audio = { AudioManager };
})(window);
