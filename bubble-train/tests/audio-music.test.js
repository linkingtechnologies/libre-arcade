// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { CleanAudio } from '../public/src/index.js';

test('clean audio exposes the eight historical theme names for procedural music', () => {
  assert.deepEqual(CleanAudio.themeNames().sort(), [
    'arctic', 'beach', 'default', 'mexico', 'mountains', 'sea', 'sky', 'space'
  ]);
});

test('procedural music planner resolves menu and gameplay themes deterministically', () => {
  const menu = CleanAudio.planTheme('space', 'menu');
  const sea = CleanAudio.planTheme('sea', 'game');
  const fallback = CleanAudio.planTheme('unknown-theme', 'game');
  assert.equal(menu.notes.length, 4);
  assert.equal(sea.notes.length, 4);
  assert.equal(sea.bass.length, 2);
  assert.equal(fallback.notes[0], CleanAudio.planTheme('default', 'game').notes[0]);
});

test('repeated unlock gestures do not restart an active music loop', async () => {
  const previous = globalThis.AudioContext;
  let oscillatorCount = 0;
  const gainParam = () => ({
    value: 1,
    cancelScheduledValues() {},
    setTargetAtTime(value) { this.value = value; },
    setValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; }
  });
  class FakeNode { connect() { return this; } }
  class FakeGain extends FakeNode { constructor() { super(); this.gain = gainParam(); } }
  class FakeOscillator extends FakeNode {
    constructor() { super(); oscillatorCount += 1; this.frequency = gainParam(); this.type = 'sine'; }
    start() {}
    stop() {}
  }
  class FakeAudioContext {
    constructor() { this.state = 'running'; this.currentTime = 1; this.destination = new FakeNode(); }
    createGain() { return new FakeGain(); }
    createOscillator() { return new FakeOscillator(); }
    async resume() { this.state = 'running'; }
  }
  globalThis.AudioContext = FakeAudioContext;
  try {
    const audio = new CleanAudio({ enabled: true });
    audio.playMusic('game');
    await audio.unlock();
    const timer = audio.musicTimer;
    const firstCount = oscillatorCount;
    assert.ok(timer, 'music loop should have a scheduled continuation');
    assert.ok(firstCount >= 6, 'first music cycle should schedule melody + bass oscillators');
    await audio.unlock();
    assert.equal(audio.musicTimer, timer, 'a second unlock must leave the active loop intact');
    assert.equal(oscillatorCount, firstCount, 'a second unlock must not restart/schedule a duplicate cycle');
    assert.ok(audio.musicGain.gain.value >= 0.9, 'music bus should be prominent enough beside effects');
    audio.stopMusic();
  } finally {
    globalThis.AudioContext = previous;
  }
});
