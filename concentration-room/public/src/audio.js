import {
  AUDIO_NTSC, SOUND_ID, MUSIC_ID, MUSIC_DURATIONS, MUSIC_INSTRUMENTS,
  MUSIC_PATTERNS, MUSIC_SONGS, expandSfx, pitchHz,
} from './audio-data.js';

function decodeToken(byte) {
  return { pitch: byte >>> 3, durationIndex: byte & 7 };
}

export class CroomMusicModel {
  constructor() { this.stop(); }

  start(songId) {
    if (!MUSIC_SONGS[songId]) throw new RangeError(`Unknown song ${songId}`);
    this.songId = songId;
    this.song = MUSIC_SONGS[songId];
    this.playing = true;
    this.tempo = 300;
    this.tempoCounter = 0xffff;
    this.conductorPc = 0;
    this.segno = 0;
    this.waitRows = 0;
    this.row = 0;
    this.channels = Array.from({length:4}, (_, index) => ({
      index, pattern:-1, pos:0, transpose:0, instrument:0,
      rowsLeft:0, pitch:null, lastPitch:null, kind:'rest',
    }));
    this.events = [];
  }

  stop() {
    this.songId = -1;
    this.song = null;
    this.playing = false;
    this.tempo = 0;
    this.tempoCounter = 0xffff;
    this.conductorPc = 0;
    this.segno = 0;
    this.waitRows = 0;
    this.row = 0;
    this.channels = [];
    this.events = [];
  }

  drainEvents() { const out = this.events; this.events = []; return out; }

  #startPattern(ch) { ch.pos = 0; }

  #runConductor() {
    if (this.waitRows > 0) { this.waitRows -= 1; return; }
    let guard = 32;
    while (this.playing && guard-- > 0) {
      const cmd = this.song[this.conductorPc++];
      if (!cmd) { this.playing = false; break; }
      if (cmd.op === 'tempo') this.tempo = cmd.value;
      else if (cmd.op === 'segno') this.segno = this.conductorPc;
      else if (cmd.op === 'dalsegno') this.conductorPc = this.segno;
      else if (cmd.op === 'wait') { this.waitRows = cmd.rows; break; }
      else if (cmd.op === 'fine') { this.playing = false; break; }
      else if (cmd.op === 'play') {
        const ch = this.channels[cmd.channel];
        ch.pattern = cmd.pattern; ch.transpose = cmd.transpose; ch.instrument = cmd.instrument;
        ch.rowsLeft = 0; this.#startPattern(ch);
      }
    }
  }

  #loadNote(ch) {
    if (ch.pattern < 0) return;
    const pattern = MUSIC_PATTERNS[ch.pattern];
    if (pattern[ch.pos] === 255) this.#startPattern(ch);
    const byte = pattern[ch.pos++];
    const {pitch, durationIndex} = decodeToken(byte);
    const rows = MUSIC_DURATIONS[durationIndex];
    ch.rowsLeft = rows;
    if (pitch < 25) {
      ch.pitch = pitch + ch.transpose;
      ch.lastPitch = ch.pitch;
      ch.kind = 'note';
      // Pently's N_TIE does not retrigger the envelope. Tell the Web Audio
      // renderer how long the uninterrupted tone lasts while still keeping
      // the row-by-row model faithful for the oracle.
      let playRows = rows;
      let peek = ch.pos;
      while (pattern[peek] !== 255) {
        const next = decodeToken(pattern[peek]);
        if (next.pitch !== 25) break;
        playRows += MUSIC_DURATIONS[next.durationIndex];
        peek += 1;
      }
      this.events.push({type:'music-note', song:this.songId, row:this.row, channel:ch.index, pitch:ch.pitch, rows, playRows, instrument:ch.instrument, tempo:this.tempo});
    } else if (pitch === 25) {
      ch.kind = 'tie';
      this.events.push({type:'music-tie', song:this.songId, row:this.row, channel:ch.index, pitch:ch.lastPitch, rows, instrument:ch.instrument, tempo:this.tempo});
    } else {
      ch.pitch = null; ch.kind = 'rest';
      this.events.push({type:'music-rest', song:this.songId, row:this.row, channel:ch.index, rows, tempo:this.tempo});
    }
  }

  #rowTick() {
    this.#runConductor();
    if (!this.playing) return;
    for (const ch of this.channels) {
      if (ch.rowsLeft === 0) this.#loadNote(ch);
      if (ch.rowsLeft > 0) ch.rowsLeft -= 1;
    }
    this.row += 1;
  }

  tick(frames=1) {
    for (let i=0;i<frames;i+=1) {
      if (!this.playing) continue;
      const sum = this.tempoCounter + this.tempo;
      if (sum >= 0x10000) {
        this.tempoCounter = (sum - AUDIO_NTSC.framesPerMinute) & 0xffff;
        this.#rowTick();
      } else this.tempoCounter = sum;
    }
    return this;
  }
}

function dutyRatio(control) {
  return [0.125, 0.25, 0.5, 0.75][(control >>> 6) & 3];
}

class WebAudioAPU {
  constructor(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.42;
    this.master.connect(ctx.destination);
    this.waves = new Map();
    this.noiseBuffer = this.#makeNoiseBuffer();
  }

  #makeNoiseBuffer() {
    const n = Math.max(4096, Math.floor(this.ctx.sampleRate));
    const b = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const a = b.getChannelData(0);
    let lfsr = 1;
    for (let i=0;i<n;i+=1) {
      const bit = (lfsr ^ (lfsr >>> 1)) & 1;
      lfsr = (lfsr >>> 1) | (bit << 14);
      a[i] = (lfsr & 1) ? 0.7 : -0.7;
    }
    return b;
  }

  #pulseWave(duty) {
    if (this.waves.has(duty)) return this.waves.get(duty);
    const harmonics = 48;
    const samples = 256;
    const real = new Float32Array(harmonics + 1);
    const imag = new Float32Array(harmonics + 1);
    for (let h=1; h<=harmonics; h+=1) {
      let re=0, im=0;
      for (let s=0;s<samples;s+=1) {
        const phase = s / samples;
        const y = phase < duty ? 1 : -1;
        const a = 2 * Math.PI * h * phase;
        re += y * Math.cos(a); im -= y * Math.sin(a);
      }
      real[h] = re / samples; imag[h] = im / samples;
    }
    const wave = this.ctx.createPeriodicWave(real, imag, {disableNormalization:false});
    this.waves.set(duty, wave);
    return wave;
  }

  pulse({when, duration, frequency, volume, endVolume=volume, duty=0.25}) {
    if (!(frequency > 0) || volume <= 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.setPeriodicWave(this.#pulseWave(duty));
    osc.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(Math.max(0.0001, volume * 0.11), when);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, endVolume * 0.11), when + duration);
    osc.connect(gain).connect(this.master);
    osc.start(when); osc.stop(when + duration + 0.002);
  }

  triangle({when, duration, frequency, volume}) {
    if (!(frequency > 0) || volume <= 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(volume * 0.10, when);
    osc.connect(gain).connect(this.master);
    osc.start(when); osc.stop(when + duration + 0.002);
  }

  noise({when, duration, volume, periodIndex=4}) {
    if (volume <= 0) return;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    src.buffer = this.noiseBuffer; src.loop = true;
    filter.type = 'lowpass';
    const noisePeriods = [4,8,16,32,64,96,128,160,202,254,380,508,762,1016,2034,4068];
    const period = noisePeriods[periodIndex & 15];
    filter.frequency.value = Math.min(16000, Math.max(180, AUDIO_NTSC.cpuHz / (period * 2)));
    gain.gain.setValueAtTime(volume * 0.08, when);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(when); src.stop(when + duration + 0.002);
  }

  playSfx(id) {
    const base = this.ctx.currentTime + 0.006;
    for (const step of expandSfx(id)) {
      const when = base + step.frame / AUDIO_NTSC.fps;
      const duration = step.frames / AUDIO_NTSC.fps;
      const volume = (step.control & 15) / 15;
      if (step.channel === 12) this.noise({when, duration, volume, periodIndex:step.pitch});
      else this.pulse({when, duration, frequency:pitchHz(step.pitch), volume, duty:dutyRatio(step.control)});
    }
  }

  playMusicEvent(event) {
    if (event.type === 'music-rest' || event.type === 'music-tie' || event.pitch == null) return;
    const when = this.ctx.currentTime + 0.006;
    const duration = (event.playRows ?? event.rows) * 60 / event.tempo;
    const instrument = MUSIC_INSTRUMENTS[event.instrument] ?? MUSIC_INSTRUMENTS[0];
    const volume = (instrument.initial & 15) / 15;
    const frequency = pitchHz(event.pitch);
    if (event.channel === 2) this.triangle({when, duration, frequency, volume});
    else {
      const envStart = (((instrument.initial << 4) & 0xff) | 0x0c);
      const durationFrames = duration * AUDIO_NTSC.fps;
      const envEnd = instrument.decay > 0 ? Math.max(0, envStart - instrument.decay * durationFrames) : envStart;
      const endVolume = (Math.floor(envEnd / 16) / 15);
      this.pulse({when, duration, frequency, volume, endVolume, duty:dutyRatio(instrument.initial)});
    }
  }
}

export class HistoricalAudio {
  constructor() {
    this.music = new CroomMusicModel();
    this.enabled = false;
    this.ctx = null;
    this.apu = null;
    this.sfxLog = [];
  }

  async setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      if (this.ctx?.state === 'running') await this.ctx.suspend();
      return this.enabled;
    }
    const AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!this.ctx && AudioContextCtor) {
      this.ctx = new AudioContextCtor();
      this.apu = new WebAudioAPU(this.ctx);
    }
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
    return this.enabled;
  }

  playSfx(id) {
    this.sfxLog.push(id);
    if (this.enabled && this.apu && this.ctx?.state === 'running') this.apu.playSfx(id);
  }

  startMusic(id) { this.music.start(id); }
  stopMusic() { this.music.stop(); }

  handleGameEvents(events) {
    for (const event of events) {
      if (event.type === 'flip-start') this.playSfx(SOUND_ID.FLIP);
      else if (event.type === 'pass-acknowledged' || event.type === 'random-cursor') this.playSfx(SOUND_ID.PASS);
      else if (event.type === 'pair-mismatch') this.playSfx(SOUND_ID.MISMATCH);
      else if (event.type === 'unflip-start') this.playSfx(SOUND_ID.UNFLIP);
      else if (event.type === 'pair-match') this.playSfx(event.combo ? SOUND_ID.COMBO : SOUND_ID.MATCH);
      else if (event.type === 'game-over') {
        this.playSfx(SOUND_ID.GAME_OVER_PULSE);
        this.playSfx(SOUND_ID.GAME_OVER_NOISE);
      } else if (event.type === 'cleared') this.startMusic(MUSIC_ID.CLEARED);
    }
  }

  tick(frames=1) {
    this.music.tick(frames);
    const events = this.music.drainEvents();
    if (this.enabled && this.apu && this.ctx?.state === 'running') {
      for (const event of events) this.apu.playMusicEvent(event);
    }
    return events;
  }
}
