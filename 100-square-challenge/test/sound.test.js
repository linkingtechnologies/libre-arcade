/* Copyright (C) 2026 Libre Arcade contributors; SPDX-License-Identifier: AGPL-3.0-or-later */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSound } from '../public/src/sound.js';

function mockAudio() {
  const starts = [];
  const values = [];
  let constructed = 0;
  class AudioContextStub {
    constructor() { constructed++; this.currentTime = 7; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createOscillator() { return { type: '', frequency: { setValueAtTime(v,t) { values.push([v,t]); } }, connect() {}, disconnect() {}, start(t) { starts.push(t); }, stop() {} }; }
    createGain() { return { gain: {setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}},connect() {}, disconnect() {} }; }
  }
  return { AudioContextStub, starts, values, get constructed() { return constructed; } };
}

test('sound is muted at startup and AudioContext is not created before opt-in', () => {
  const m = mockAudio();
  const sound = createSound({ AudioContextClass: m.AudioContextStub });
  assert.equal(sound.available, true);
  assert.equal(sound.enabled, false);
  assert.equal(sound.play('move'), false);
  assert.equal(m.constructed, 0);
  assert.deepEqual(m.starts, []);
});

test('opt-in plays only declared events, with distinct move, victory and blocked phrases', () => {
  const m = mockAudio();
  const sound = createSound({ AudioContextClass: m.AudioContextStub });
  assert.equal(sound.toggle(), true);
  assert.equal(sound.enabled, true);
  assert.equal(m.constructed, 1);
  assert.equal(sound.play('move'), true);
  assert.equal(m.starts.length, 1);
  assert.equal(sound.play('complete'), true);
  assert.equal(m.starts.length, 4);
  assert.equal(sound.play('blocked'), true);
  assert.equal(m.starts.length, 6);
  assert.equal(sound.play('not-a-sound'), false);
  assert.equal(m.starts.length, 6);
  assert.equal(sound.toggle(), false);
  assert.equal(sound.enabled, false);
  assert.equal(sound.play('move'), false);
  assert.equal(m.starts.length, 6);
  assert.equal(sound.toggle(), true);
  assert.equal(m.constructed, 1);
});

test('unavailable or failing audio does not prevent gameplay', () => {
  const unavailable = createSound({AudioContextClass:null});
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.toggle(), false);
  assert.equal(unavailable.play('complete'), false);
  const failing = createSound({AudioContextClass:class { constructor() { throw Error('not allowed'); } }});
  assert.equal(failing.toggle(), false);
  assert.equal(failing.play('move'), false);
});
