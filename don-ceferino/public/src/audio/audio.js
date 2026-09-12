const FILES = Object.freeze({
  shot: 'tiro.wav',
  ballHit: 'mata.wav',
  lose: 'pierde.wav',
  menuAlt: 'tecla1.wav',
  select: 'tecla2.wav',
  tick: 'tic.wav',
  hook: 'gancho.wav',
  ceiling: 'toc.wav',
  breakBlock: 'romper.wav',
  alarm: 'alarma.wav',
  item: 'item.wav',
  boom: 'boom.wav'
});

export const HISTORICAL_SOUND_FILES = Object.freeze(Object.values(FILES));

export class AudioSystem {
  constructor({ enabled = true } = {}) {
    this.enabled = Boolean(enabled);
    this.sounds = new Map();
    this.current = null;
    this.preloaded = false;
  }

  preload() {
    if (this.preloaded || typeof Audio === 'undefined') return;
    this.preloaded = true;
    for (const [name, file] of Object.entries(FILES)) {
      const audio = new Audio(`assets/audio/${file}`);
      audio.preload = 'auto';
      audio.load();
      this.sounds.set(name, audio);
    }
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled) this.stop();
  }

  stop() {
    if (!this.current) return;
    try {
      this.current.pause();
      this.current.currentTime = 0;
    } catch { /* ignore playback/pause errors */ }
    this.current = null;
  }

  play(name) {
    if (!this.enabled) return;
    const next = this.sounds.get(name);
    if (!next) return;

    if (this.current && this.current !== next) {
      try {
        this.current.pause();
        this.current.currentTime = 0;
      } catch { /* ignore playback/pause errors */ }
    }

    try {
      next.currentTime = 0;
      const promise = next.play();
      if (promise?.catch) promise.catch(() => {});
      this.current = next;
    } catch { /* ignore playback/pause errors */ }
  }
}
