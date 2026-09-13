// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { CleanAudio } from '../public/src/index.js';

class FakeParam {
  constructor(value = 0) { this.value = value; this.targets = []; }
  setValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
  setTargetAtTime(value) { this.value = value; this.targets.push(value); }
}
class FakeNode {
  constructor() { this.gain = new FakeParam(1); }
  connect(destination) { return destination; }
}
class FakeOscillator extends FakeNode {
  constructor(context) { super(); this.context = context; this.frequency = new FakeParam(440); this.type = 'sine'; }
  start() { this.context.starts += 1; }
  stop() {}
}
class FakeAudioContext {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = new FakeNode(); this.starts = 0; }
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeOscillator(this); }
  async resume() { this.state = 'running'; }
}

async function withFakeAudio(run) {
  const old = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext;
  try { await run(); }
  finally {
    if (old === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = old;
  }
}

test('queued effects survive a suspended AudioContext and play after unlock', async () => {
  await withFakeAudio(async () => {
    const audio = new CleanAudio({ enabled: true });
    audio.cue('fire');
    const unlocked = await audio.unlock();
    assert.equal(unlocked, true);
    assert.equal(audio.context.state, 'running');
    assert.ok(audio.context.starts >= 2, 'fire cue should schedule both oscillator voices');
  });
});

test('procedural music is mixed at an audible bus level after unlock', async () => {
  await withFakeAudio(async () => {
    const audio = new CleanAudio({ enabled: true });
    await audio.unlock();
    audio.setTheme('sea');
    audio.playMusic('game');
    assert.ok(audio.musicGain.gain.value >= 0.25, 'music bus must not be effectively muted');
    assert.ok(audio.context.starts >= 6, 'a music cycle should schedule melody and bass voices');
    audio.stopMusic();
  });
});
