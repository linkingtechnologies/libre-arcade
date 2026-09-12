import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEAD_PATTERN, MUSIC_BPM, MUSIC_STEPS, midiFrequency } from '../public/src/audio.js';

const root = resolve(import.meta.dirname, '..');

test('new chiptune sequence is a complete four-bar tracker-style loop', () => {
  assert.equal(MUSIC_BPM, 132);
  assert.equal(MUSIC_STEPS, 64);
  assert.equal(LEAD_PATTERN.length, MUSIC_STEPS);
  assert.ok(LEAD_PATTERN.filter(n => n != null).length >= 24);
  assert.equal(midiFrequency(69), 440);
});

test('new bitmap font atlas is the expected 128x48 RGBA PNG', () => {
  const png = readFileSync(resolve(root, 'public/assets/fonts/yanoid-web-5x7.png'));
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 128);
  assert.equal(png.readUInt32BE(20), 48);
});

test('historical SDL_Console font assets are documented as physically omitted, unlike the source', () => {
  const notices = readFileSync(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(notices, /ConsoleFont\.png.*LargeFont\.png/);
  assert.match(notices, /SDL_Console fonts/i);
  assert.match(notices, /not omitted/i, 'source code areas should be documented as preserved, unlike the fonts');
});

test('audio unlock waits for a suspended AudioContext to become running', async () => {
  const previousWindow = globalThis.window;
  let resumeCalls = 0;
  class FakeGain {
    constructor() { this.gain = { value: 0 }; }
    connect() { return this; }
  }
  class FakeContext {
    constructor() {
      this.state = 'suspended';
      this.destination = {};
      this.currentTime = 0;
    }
    createGain() { return new FakeGain(); }
    async resume() { resumeCalls += 1; this.state = 'running'; }
  }
  globalThis.window = { AudioContext: FakeContext };
  try {
    const audio = new (await import('../public/src/audio.js')).AudioFX();
    assert.equal(await audio.unlock(), true);
    assert.equal(audio.isReady(), true);
    assert.equal(resumeCalls, 1);
    assert.equal(await audio.unlock(), true);
    assert.equal(resumeCalls, 1);
  } finally {
    globalThis.window = previousWindow;
  }
});

test('application awaits audio unlock before starting a game', () => {
  const app = readFileSync(resolve(root, 'public/src/app.js'), 'utf8');
  assert.match(app, /startBtn[\s\S]*async[\s\S]*await audio\.unlock\(\)[\s\S]*game\.newGame\(\)/);
  assert.doesNotMatch(app, /audio\.ensure\(/);
});

test('modal dialogs do not let game hotkeys run behind them and resume on close', () => {
  const app = readFileSync(resolve(root, 'public/src/app.js'), 'utf8');
  assert.match(app, /document\.querySelector\('dialog\[open\]'\)/);
  assert.match(app, /helpDialog.*addEventListener\('close'/s);
  assert.match(app, /aboutDialog.*addEventListener\('close'/s);
  assert.match(app, /resumeAfterDialog/);
});

test('focus loss releases directional input to prevent a stuck paddle', () => {
  const app = readFileSync(resolve(root, 'public/src/app.js'), 'utf8');
  assert.match(app, /window\.addEventListener\('blur', releaseDirectionalInput\)/);
  assert.match(app, /document\.hidden[\s\S]*releaseDirectionalInput\(\)/);
});

test('keyboard game shortcuts do not steal Space/arrow keys from UI controls', () => {
  const app = readFileSync(resolve(root, 'public/src/app.js'), 'utf8');
  assert.match(app, /closest\?\.\('button,input,select,textarea,a'\)/);
  assert.match(app, /onUiControl && e\.key !== 'Escape'/);
  assert.match(app, /focusGameCanvas/);
});

test('unlocked audio actually schedules both music and effects', async () => {
  const previousWindow = globalThis.window;
  let oscillatorStarts = 0;
  let clearedTimer = null;
  class FakeParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class FakeGain {
    constructor() { this.gain = new FakeParam(); this.gain.value = 0; }
    connect() { return this; }
  }
  class FakeOscillator {
    constructor() { this.frequency = new FakeParam(); this.type = 'sine'; }
    connect() { return this; }
    start() { oscillatorStarts += 1; }
    stop() {}
  }
  class FakeContext {
    constructor() { this.state = 'suspended'; this.destination = {}; this.currentTime = 1; }
    createGain() { return new FakeGain(); }
    createOscillator() { return new FakeOscillator(); }
    async resume() { this.state = 'running'; }
  }
  globalThis.window = {
    AudioContext: FakeContext,
    setInterval: () => 77,
    clearInterval: id => { clearedTimer = id; },
  };
  try {
    const { AudioFX } = await import('../public/src/audio.js');
    const audio = new AudioFX();
    assert.equal(await audio.unlock(), true);
    const beforeMusic = oscillatorStarts;
    audio.setGameActive(true);
    assert.equal(audio.musicPlaying, true);
    assert.ok(oscillatorStarts > beforeMusic, 'music scheduler should start oscillators');
    const beforeFx = oscillatorStarts;
    audio.good();
    assert.ok(oscillatorStarts > beforeFx, 'effect should start an oscillator');
    audio.setGameActive(false);
    assert.equal(audio.musicPlaying, false);
    assert.equal(clearedTimer, 77);
  } finally {
    globalThis.window = previousWindow;
  }
});
