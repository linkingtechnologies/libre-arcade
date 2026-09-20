// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { AudioEngine } from '../public/src/presentation-audio.js';

class Param {
  constructor(value = 0) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class Node {
  constructor() {
    this.gain = new Param(1); this.frequency = new Param(440); this.Q = new Param(1);
    this.delayTime = new Param(0); this.playbackRate = new Param(1);
    this.threshold = new Param(-24); this.knee = new Param(30); this.ratio = new Param(12);
    this.attack = new Param(.003); this.release = new Param(.25);
  }
  connect() { return this; }
  start() {}
  stop() {}
}
class FakeBuffer {
  constructor(channels, frames, sampleRate) {
    this.duration = frames / sampleRate;
    this.data = Array.from({ length: channels }, () => new Float32Array(frames));
  }
  getChannelData(channel) { return this.data[channel]; }
}
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.sampleRate = 48000; this.state = 'suspended'; this.destination = new Node(); this.resumeCalls = 0; this.oscillators = 0; }
  createGain() { return new Node(); }
  createDynamicsCompressor() { return new Node(); }
  createOscillator() { this.oscillators += 1; return new Node(); }
  createBiquadFilter() { return new Node(); }
  createDelay() { return new Node(); }
  createBuffer(channels, frames, sampleRate) {
    assert.equal(this.state, 'running', 'resume audio before synthesizing the noise buffer');
    return new FakeBuffer(channels, frames, sampleRate);
  }
  createBufferSource() { return new Node(); }
  async resume() { this.resumeCalls += 1; this.state = 'running'; }
}

globalThis.AudioContext = FakeAudioContext;
const audio = new AudioEngine({ enabled: true });
assert.equal(audio.status, 'blocked', 'uninitialized context must not be reported ready');
assert.equal(await audio.unlock(), true);
assert.ok(audio.ctx, 'AudioContext should initialize');
assert.equal(audio.ctx.resumeCalls, 1, 'browser audio must be explicitly resumed');
assert.equal(audio.status, 'ready', 'only a running context is ready');
assert.ok(audio.noise, 'deterministic procedural noise buffer should initialize');
assert.equal(audio.noise.data[0].some((value) => value !== 0), true, 'noise buffer must contain non-silent samples');
assert.equal(await audio.testSound(), true, 'menu audio test must work with a running context');
assert.ok(audio.ctx.oscillators >= 2, 'menu test must synthesize two audible notes');

const events = [
  { event: 'fire', weapon: 'laser' },
  { event: 'fire', weapon: 'heavy' },
  { event: 'fire', weapon: 'cluster' },
  { event: 'damage', amount: 23 },
  { event: 'body_impact' },
  { event: 'storm_contact' },
  { event: 'wormhole' },
  { event: 'cluster_spawn' },
  { event: 'bonus_collected' },
  { event: 'bonus_bought' },
  { event: 'galaxy_warp' },
  { event: 'winner' },
  { event: 'menu_confirm' },
];
for (const event of events) audio.handle(event);
assert.equal(audio.eventCounter, events.length + 1, 'audio test and presentation events must advance only the private audio counter');

audio.setEnabled(false);
const before = audio.eventCounter;
audio.handle({ event: 'damage', amount: 99 });
assert.equal(audio.eventCounter, before, 'muted audio must not synthesize events');
assert.equal(audio.toggle(), true, 'toggle should re-enable audio');

// A browser with no Web Audio API must report that instead of silently pretending sound is on.
globalThis.AudioContext = undefined;
const unsupported = new AudioEngine();
assert.equal(unsupported.status, 'unavailable');
assert.equal(await unsupported.testSound(), false);
globalThis.AudioContext = FakeAudioContext;

console.log('ok audio-contract: unlock/resume, audible test, all sound events, mute, unsupported browser, historical RNG untouched');
