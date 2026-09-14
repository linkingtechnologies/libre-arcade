import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../public/src/audio/AudioEngine.js';

test('dice sound is a multi-hit clatter with a final settling tone', () => {
  const audio = new AudioEngine();
  const tones = [];
  audio.tone = (options) => tones.push(options);
  audio.dice();
  assert.ok(tones.length >= 17, `expected a rich clatter, got ${tones.length} tones`);
  const offsets = tones.map((tone) => tone.offset ?? 0);
  assert.ok(Math.max(...offsets) >= 0.38, 'dice clatter should span most of the visual roll');
  assert.ok(tones.some((tone) => tone.frequency <= 110), 'dice sound should finish with a low settling thud');
});

test('pawn step sound alternates pitch without using gameplay randomness', () => {
  const audio = new AudioEngine();
  const tones = [];
  audio.tone = (options) => tones.push(options);
  audio.step();
  audio.step();
  audio.step();
  audio.step();
  assert.equal(tones.length, 8);
  const fundamentals = tones.filter((_, index) => index % 2 === 0).map((tone) => tone.frequency);
  assert.deepEqual(fundamentals, [315, 348, 326, 366]);
  assert.equal(audio.stepPhase, 0);
});

test('unlock resumes a non-running Web Audio context and creates a master output', async () => {
  const previous = globalThis.AudioContext;
  class FakeParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class FakeNode {
    constructor() { this.gain = new FakeParam(); this.frequency = new FakeParam(); }
    connect(target) { this.connectedTo = target; return target; }
    start() {}
    stop() {}
  }
  class FakeAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 0;
      this.destination = new FakeNode();
      this.resumeCalls = 0;
    }
    createGain() { return new FakeNode(); }
    createOscillator() { return new FakeNode(); }
    async resume() { this.resumeCalls += 1; this.state = 'running'; }
  }
  globalThis.AudioContext = FakeAudioContext;
  try {
    const audio = new AudioEngine();
    assert.equal(await audio.unlock(), true);
    assert.equal(audio.context.resumeCalls, 1);
    assert.equal(audio.isReady(), true);
    assert.ok(audio.master, 'master gain should be created');
    assert.equal(audio.master.connectedTo, audio.context.destination);
  } finally {
    if (previous === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = previous;
  }
});


test('browser media fallback uses local WAV assets for dice and pawn steps', async () => {
  const previousAudio = globalThis.Audio;
  const plays = [];
  class FakeAudio {
    constructor(src) { this.src = src; this.volume = 1; this.currentTime = 0; this.playbackRate = 1; }
    play() { plays.push({ src: this.src, volume: this.volume, playbackRate: this.playbackRate }); return Promise.resolve(); }
    cloneNode() { return new FakeAudio(this.src); }
  }
  globalThis.Audio = FakeAudio;
  try {
    const audio = new AudioEngine();
    assert.equal(await audio.primeMedia(), true);
    audio.dice();
    audio.step();
    audio.win();
    assert.ok(plays.some((item) => item.src.endsWith('/assets/audio/unlock.wav') || item.src === './assets/audio/unlock.wav'));
    assert.ok(plays.some((item) => item.src.endsWith('/assets/audio/dice.wav') || item.src === './assets/audio/dice.wav'));
    assert.ok(plays.some((item) => /step1\.wav$/.test(item.src)));
    assert.ok(plays.some((item) => /win\.wav$/.test(item.src)));
  } finally {
    if (previousAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = previousAudio;
  }
});
