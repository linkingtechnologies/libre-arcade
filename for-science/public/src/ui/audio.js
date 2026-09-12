const AUDIO_FILES = {
  select: 'select.wav', score: 'score.wav', error: 'error.wav', endturn: 'endturn.wav',
  shield: 'shield.wav', cow: 'cow.wav', meteorite: 'meteorite.wav', rocket: 'rocket.wav',
  laser: 'laser.wav', explosion: 'explosion.wav', music: 'menu.ogg',
};

function getStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function readMusicPreference(defaultValue = true) {
  const storage = getStorage();
  if (!storage) return defaultValue;
  try {
    const value = storage.getItem('forscience.music');
    return value === null ? defaultValue : value !== 'false';
  } catch {
    return defaultValue;
  }
}

function writeMusicPreference(enabled) {
  const storage = getStorage();
  if (!storage) return;
  try { storage.setItem('forscience.music', String(enabled)); } catch { /* optional preference only */ }
}

export class AudioEngine {
  constructor(base = './assets/original/') {
    this.base = base;
    this.context = null;
    this.buffers = new Map();
    this.rawAudio = new Map();
    this.musicSource = null;
    this.musicEnabled = readMusicPreference(true);
    this.volume = 0.8;
    this.preloadPromise = null;
    this.decodePromise = null;
  }

  preload() {
    if (this.preloadPromise) return this.preloadPromise;
    this.preloadPromise = Promise.all(Object.entries(AUDIO_FILES).map(async ([key, file]) => {
      try {
        const response = await fetch(`${this.base}${file}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.rawAudio.set(key, await response.arrayBuffer());
      } catch (error) {
        console.warn(`Audio unavailable: ${file}`, error);
      }
    }));
    return this.preloadPromise;
  }

  async unlock() {
    const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!this.context) this.context = new AudioContextCtor();
    await this.#decodeAll();
    if (this.context.state === 'suspended') await this.context.resume();
  }

  async #decodeAll() {
    if (this.decodePromise) return this.decodePromise;
    this.decodePromise = (async () => {
      await this.preload();
      await Promise.all([...this.rawAudio.entries()].map(async ([key, data]) => {
        try {
          // Some browsers detach the supplied buffer while decoding.
          const buffer = await this.context.decodeAudioData(data.slice(0));
          this.buffers.set(key, buffer);
        } catch (error) {
          console.warn(`Audio decode failed: ${AUDIO_FILES[key]}`, error);
        }
      }));
    })();
    return this.decodePromise;
  }

  play(name) {
    if (!this.context || !this.buffers.has(name)) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.buffers.get(name);
    gain.gain.value = this.volume;
    source.connect(gain).connect(this.context.destination);
    source.start();
  }

  startMusic() {
    if (!this.musicEnabled || !this.context || !this.buffers.has('music') || this.musicSource) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.buffers.get('music');
    source.loop = true;
    gain.gain.value = this.volume;
    source.connect(gain).connect(this.context.destination);
    source.start();
    source.onended = () => { if (this.musicSource === source) this.musicSource = null; };
    this.musicSource = source;
  }

  stopMusic() {
    if (!this.musicSource) return;
    try { this.musicSource.stop(); } catch { /* already stopped */ }
    this.musicSource = null;
  }

  setMusic(enabled) {
    this.musicEnabled = Boolean(enabled);
    writeMusicPreference(this.musicEnabled);
    if (this.musicEnabled) this.startMusic(); else this.stopMusic();
  }
}
