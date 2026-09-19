import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { cueForEvent, createSoundPlayer, EVENT_CUE_NAMES, NEUTRAL_GAIN } from '../public/src/ui/sound.js';
import { UI_TEXT } from '../public/src/ui/i18n.js';
import { renderCashRegisterWav, renderCashRegisterSamples, SAMPLE_RATE } from '../scripts/cash-register.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicFile = rel => path.join(root, 'public', rel);
const sounds = JSON.parse(fs.readFileSync(publicFile('config/sounds.json'), 'utf8'));
const HUMAN = 0;
const CPU_A = 1;
const CPU_B = 2;

// Events the core emits that are deliberately silent: bookkeeping, or already covered by a louder event.
const SILENT_EVENT_TYPES = new Set([
  'CASH_CHANGED', 'TURN_ENDED', 'SPACE_LANDED', 'PLAYER_MOVED', 'PROPERTY_TRANSFERRED',
  'AUCTION_LIMIT_SET', 'DETENTION_DECISION', 'DETENTION_CARD_USED'
]);

const SAMPLE_EVENTS = {
  TURN_STARTED: { type: 'TURN_STARTED', playerId: HUMAN },
  DICE_ROLLED: { type: 'DICE_ROLLED', playerId: CPU_A, a: 3, b: 4, total: 7 },
  START_PASSED: { type: 'START_PASSED', playerId: CPU_A },
  PROPERTY_ACQUIRED: { type: 'PROPERTY_ACQUIRED', playerId: CPU_A },
  AUCTION_ENDED: { type: 'AUCTION_ENDED', winnerId: CPU_A },
  RENT_DUE: { type: 'RENT_DUE', playerId: CPU_A, ownerId: CPU_B },
  PAYMENT: { type: 'PAYMENT', payerId: CPU_A, recipientId: null, reason: 'tax' },
  CARD_DRAWN: { type: 'CARD_DRAWN', playerId: CPU_A, deck: 'avventure' },
  EMBELLISHMENT_BUILT: { type: 'EMBELLISHMENT_BUILT', playerId: CPU_A },
  EMBELLISHMENT_GRANTED: { type: 'EMBELLISHMENT_GRANTED', playerId: CPU_A },
  EMBELLISHMENT_SOLD: { type: 'EMBELLISHMENT_SOLD', playerId: CPU_A },
  EMBELLISHMENT_LOST: { type: 'EMBELLISHMENT_LOST', playerId: CPU_A },
  PROPERTY_PLEDGED: { type: 'PROPERTY_PLEDGED', playerId: CPU_A },
  PROPERTY_REDEEMED: { type: 'PROPERTY_REDEEMED', playerId: CPU_A },
  TRADE_PROPOSED: { type: 'TRADE_PROPOSED', traderId: CPU_A, targetId: CPU_B },
  TRADE_ACCEPTED: { type: 'TRADE_ACCEPTED', traderId: CPU_A, targetId: CPU_B },
  TRADE_DECLINED: { type: 'TRADE_DECLINED', traderId: CPU_A, targetId: CPU_B },
  SENT_TO_BASE: { type: 'SENT_TO_BASE', playerId: CPU_A },
  PLAYER_BANKRUPT: { type: 'PLAYER_BANKRUPT', playerId: CPU_A },
  GAME_ENDED: { type: 'GAME_ENDED', winnerId: CPU_A }
};

function emittedEventTypes() {
  const types = new Set();
  const dir = path.join(root, 'public', 'src', 'core');
  for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.js'))) {
    for (const match of fs.readFileSync(path.join(dir, file), 'utf8').matchAll(/emit\('([A-Z_]+)'/g)) types.add(match[1]);
  }
  return types;
}

test('every event the core emits is either given a sound or explicitly declared silent', () => {
  const emitted = emittedEventTypes();
  assert.ok(emitted.size > 20);
  for (const type of emitted) {
    const covered = SAMPLE_EVENTS[type] ? cueForEvent(SAMPLE_EVENTS[type], HUMAN) : null;
    if (SILENT_EVENT_TYPES.has(type)) {
      assert.equal(SAMPLE_EVENTS[type], undefined, `${type} is both silent and sounded`);
    } else {
      assert.ok(covered, `${type} has neither a sound nor a place in SILENT_EVENT_TYPES`);
    }
  }
  for (const type of SILENT_EVENT_TYPES) assert.ok(emitted.has(type), `${type} is no longer emitted: drop it from the silent list`);
});

test('event routing is directional for the human and quieter between CPU players', () => {
  assert.deepEqual(cueForEvent({ type: 'RENT_DUE', playerId: HUMAN, ownerId: CPU_A }, HUMAN), { cue: 'pay', gain: 1 });
  assert.deepEqual(cueForEvent({ type: 'RENT_DUE', playerId: CPU_A, ownerId: HUMAN }, HUMAN), { cue: 'receive', gain: 1 });
  assert.deepEqual(cueForEvent({ type: 'RENT_DUE', playerId: CPU_A, ownerId: CPU_B }, HUMAN), { cue: 'pay', gain: NEUTRAL_GAIN });
  assert.equal(cueForEvent({ type: 'PROPERTY_ACQUIRED', playerId: HUMAN }, HUMAN).gain, 1);
  assert.equal(cueForEvent({ type: 'PROPERTY_ACQUIRED', playerId: CPU_A }, HUMAN).gain, NEUTRAL_GAIN);
  assert.ok(NEUTRAL_GAIN >= 0.6 && NEUTRAL_GAIN < 1, 'between CPU players: clearly audible, a little quieter');
  assert.equal(cueForEvent({ type: 'TRADE_ACCEPTED', traderId: CPU_A, targetId: HUMAN }, HUMAN).gain, 1);
  assert.equal(cueForEvent({ type: 'DICE_ROLLED', playerId: CPU_A, doubles: true }, HUMAN).rate, 1.15);
  assert.equal(cueForEvent({ type: 'DICE_ROLLED', playerId: CPU_A, doubles: false }, HUMAN).rate, 1);
  assert.equal(cueForEvent({ type: 'CARD_DRAWN', playerId: CPU_A, deck: 'avventure' }, HUMAN).cue, 'adventure');
  assert.equal(cueForEvent({ type: 'CARD_DRAWN', playerId: CPU_A, deck: 'contrattempi' }, HUMAN).cue, 'setback');
  assert.equal(cueForEvent({ type: 'GAME_ENDED', winnerId: CPU_A }, HUMAN).gain, 1);
});

test('events already covered by another sound stay silent, and only the human hears their own turn cue', () => {
  assert.equal(cueForEvent({ type: 'PAYMENT', payerId: CPU_A, reason: 'rent' }, HUMAN), null);
  assert.equal(cueForEvent({ type: 'PAYMENT', payerId: CPU_A, reason: 'acquisition' }, HUMAN), null);
  assert.equal(cueForEvent({ type: 'PAYMENT', payerId: HUMAN, reason: 'tax' }, HUMAN).cue, 'pay');
  assert.equal(cueForEvent({ type: 'AUCTION_ENDED', winnerId: null }, HUMAN), null);
  assert.equal(cueForEvent({ type: 'TURN_STARTED', playerId: CPU_A }, HUMAN), null);
  assert.equal(cueForEvent({ type: 'TURN_STARTED', playerId: HUMAN }, HUMAN).cue, 'yourTurn');
  assert.equal(cueForEvent({ type: 'CASH_CHANGED', playerId: HUMAN }, HUMAN), null);
  assert.equal(cueForEvent(undefined, HUMAN), null);
});

test('sound config covers every routed cue, ships every file and starts at a low, audible level', () => {
  assert.equal(sounds.schemaVersion, 1);
  assert.deepEqual(Object.keys(sounds.cues).sort(), [...EVENT_CUE_NAMES].sort());
  for (const sample of Object.values(SAMPLE_EVENTS)) {
    const routed = cueForEvent(sample, HUMAN);
    if (routed) assert.ok(EVENT_CUE_NAMES.includes(routed.cue), routed.cue);
  }
  for (const [name, layers] of Object.entries(sounds.cues)) {
    assert.ok(layers.length >= 1, name);
    for (const layer of layers) {
      assert.match(layer.file, /\.(ogg|wav)$/, name);
      assert.equal(fs.existsSync(publicFile(layer.file)), true, `${name}: missing ${layer.file}`);
      assert.ok((layer.delay ?? 0) >= 0 && (layer.delay ?? 0) <= 600, `${name}: delay`);
      assert.ok((layer.rate ?? 1) > 0.5 && (layer.rate ?? 1) < 2, `${name}: rate`);
      assert.ok((layer.gain ?? 1) > 0 && (layer.gain ?? 1) <= 1, `${name}: gain`);
    }
  }
  assert.equal(sounds.levels.off, 0);
  assert.equal(sounds.defaultLevel, 'low');
  assert.ok(sounds.levels.low > 0 && sounds.levels.low <= 0.5, 'the default is audible but low');
  assert.ok(sounds.levels.low < sounds.levels.medium && sounds.levels.medium < sounds.levels.high && sounds.levels.high <= 1);
});

test('every shipped sound file has its licence alongside and no unused file is left behind', () => {
  const used = new Set(Object.values(sounds.cues).flat().map(layer => layer.file));
  const shipped = [];
  for (const dir of ['assets/audio', 'assets/third_party/kenney/audio/platformer', 'assets/third_party/kenney/audio/digital', 'assets/third_party/kenney/audio/impact']) {
    for (const name of fs.readdirSync(publicFile(dir))) if (/\.(ogg|wav)$/.test(name)) shipped.push(`${dir}/${name}`);
  }
  assert.deepEqual(shipped.sort(), [...used].sort());
  for (const pack of ['platformer', 'digital', 'impact']) {
    assert.match(fs.readFileSync(publicFile(`assets/third_party/kenney/audio/${pack}/License.txt`), 'utf8'), /Creative Commons Zero, CC0/);
  }
  assert.match(fs.readFileSync(publicFile('assets/audio/NOTICE.md'), 'utf8'), /GPL-3\.0-only/);
});

class FakeContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 10;
    this.destination = {};
    this.started = [];
    this.master = null;
  }
  createGain() {
    const node = { gain: { value: 1 }, connect() {} };
    if (!this.master) this.master = node;
    return node;
  }
  createBufferSource() {
    const context = this;
    const source = { buffer: null, playbackRate: { value: 1 }, gainNode: null, connect(node) { source.gainNode = node; }, start(when) { context.started.push({ when, rate: source.playbackRate.value, gain: source.gainNode.gain.value, buffer: source.buffer }); } };
    return source;
  }
  decodeAudioData(data) { return Promise.resolve({ decoded: data }); }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

function makePlayer(overrides = {}) {
  let context = null;
  const audioContextClass = class extends FakeContext { constructor() { super(); context = this; } };
  let clock = 1000;
  const player = createSoundPlayer({
    cues: sounds.cues,
    levels: sounds.levels,
    level: 'low',
    audioContextClass,
    fetchFn: async file => ({ ok: true, arrayBuffer: async () => file }),
    now: () => (clock += 500),
    ...overrides
  });
  return { player, context: () => context };
}
const settle = () => delay(5);

test('nothing plays before the first user gesture unlocks audio', async () => {
  const { player, context } = makePlayer();
  assert.equal(player.play('purchase'), false);
  assert.equal(context(), null);
  assert.equal(await player.unlock(), true);
  assert.equal(context().state, 'running');
});

test('a cue starts each of its layers with the configured delay, pitch and volume', async () => {
  const { player, context } = makePlayer();
  await player.unlock();
  assert.equal(player.play('startPassed', { gain: 0.5, rate: 1 }), true);
  await settle();
  const started = context().started;
  assert.equal(started.length, sounds.cues.startPassed.length);
  started.forEach((entry, index) => {
    const layer = sounds.cues.startPassed[index];
    assert.equal(entry.when, 10 + (layer.delay ?? 0) / 1000);
    assert.equal(entry.rate, layer.rate ?? 1);
    assert.equal(entry.gain, 0.5 * (layer.gain ?? 1));
  });
});

test('the volume level scales the master gain and off is silent', async () => {
  const { player, context } = makePlayer();
  await player.unlock();
  assert.equal(context().master.gain.value, sounds.levels.low);
  player.setLevel('high');
  assert.equal(context().master.gain.value, sounds.levels.high);
  player.setLevel('nonsense');
  assert.equal(player.level, 'high');
  player.setLevel('off');
  assert.equal(player.play('purchase'), false);
  await settle();
  assert.equal(context().started.length, 0);
});

test('the same cue is not retriggered within a few milliseconds', async () => {
  let clock = 5000;
  const { player, context } = makePlayer({ now: () => clock });
  await player.unlock();
  assert.equal(player.play('receive'), true);
  clock += 10;
  assert.equal(player.play('receive'), false);
  clock += 100;
  assert.equal(player.play('receive'), true);
  await settle();
  assert.equal(context().started.length, 2 * sounds.cues.receive.length);
});

test('a missing sound file or a browser without Web Audio degrades to silence', async () => {
  const broken = makePlayer({ fetchFn: async () => ({ ok: false, status: 404 }) });
  await broken.player.unlock();
  assert.doesNotThrow(() => broken.player.play('dice'));
  await settle();
  assert.equal(broken.context().started.length, 0);

  const none = createSoundPlayer({ cues: sounds.cues, levels: sounds.levels, audioContextClass: undefined });
  assert.equal(await none.unlock(), false);
  assert.equal(none.play('dice'), false);
});

test('the toolbar sound control is fed by every event packet, persisted and localized', () => {
  const js = fs.readFileSync(publicFile('src/ui/app.js'), 'utf8');
  const html = fs.readFileSync(publicFile('index.html'), 'utf8');
  assert.match(html, /<select id="soundSelect"/);
  assert.match(js, /renderAll\(\);\s+\/\/[^\n]*\n\s+enqueuePacketFeedback\(events\);\s+requestAnimationFrame\(\(\) => animatePacketEvents\(events\)\)/);
  assert.match(js, /feedbackQueue = \[\];\s+feedbackWorkerRunning = false;/);
  assert.match(js, /SOUND_LEVEL_KEY/);
  assert.match(js, /LOCAL_STORAGE_KEYS = \[[^\]]*SOUND_LEVEL_KEY/);
  for (const lang of ['it', 'en', 'fr', 'de']) {
    for (const key of ['soundLabel', 'soundOff', 'soundLow', 'soundMedium', 'soundHigh']) assert.ok(UI_TEXT[lang][key], `${lang}.${key}`);
  }
});

test('the cash register sound is exactly what scripts/cash-register.mjs generates', () => {
  assert.deepEqual(fs.readFileSync(publicFile('assets/audio/cash-register.wav')), renderCashRegisterWav());
});

test('the cash register is a clack followed by a bell that rings out and decays', () => {
  const pcm = renderCashRegisterSamples();
  const at = seconds => Math.round(seconds * SAMPLE_RATE);
  const rms = (from, to) => Math.sqrt(pcm.slice(at(from), at(to)).reduce((sum, sample) => sum + (sample / 32768) ** 2, 0) / (at(to) - at(from)));
  // energy of one frequency (single-bin DFT) in a window
  const tone = (from, to, hz) => {
    let re = 0;
    let im = 0;
    for (let i = at(from); i < at(to); i += 1) {
      const t = i / SAMPLE_RATE;
      re += (pcm[i] / 32768) * Math.cos(2 * Math.PI * hz * t);
      im += (pcm[i] / 32768) * Math.sin(2 * Math.PI * hz * t);
    }
    return Math.hypot(re, im);
  };
  assert.ok(pcm.length / SAMPLE_RATE > 0.8 && pcm.length / SAMPLE_RATE < 1.1, 'about a second, so a cue does not pile up on the next beat');
  assert.ok(Math.max(...pcm.map(Math.abs)) / 32768 <= 0.9, 'no clipping');
  assert.ok(rms(0, 0.06) > 0.05, 'the clack is audible');
  assert.ok(tone(0, 0.07, 100) > 10 * tone(0, 0.07, 6500), 'the clack is a low thump, not a hiss');
  assert.ok(tone(0.08, 0.3, 2350) > 20 * tone(0.08, 0.3, 100), 'then the bell rings high');
  assert.ok(tone(0.08, 0.3, 4700) > 5 * tone(0.08, 0.3, 9000), 'with its overtones dying away toward the top');
  assert.ok(rms(0.08, 0.2) > rms(0.4, 0.6) && rms(0.4, 0.6) > rms(0.75, 0.9), 'the bell decays');
  assert.equal(pcm[pcm.length - 1], 0, 'and ends on silence');
});
