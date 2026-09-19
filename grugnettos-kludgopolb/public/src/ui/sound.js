// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// Event sounds. The mapping from game events to named cues lives here (it depends on who the human is);
// what each cue sounds like (files, layering, pitch) lives in config/sounds.json so it can be retuned
// without touching code. Sound is only ever a second channel: every event already has its visible message.

// Events that do not involve the human play a little quieter, but still clearly audible.
export const NEUTRAL_GAIN = 0.7;
// PAYMENT events that are not already covered by a more specific event (rent, purchases).
const PAYMENT_REASONS_WITH_SOUND = new Set(['tax', 'base-camp-fee']);

function involvedGain(event, humanId) {
  const ids = [event.playerId, event.payerId, event.recipientId, event.ownerId, event.winnerId, event.traderId, event.targetId, event.fromPlayerId, event.toPlayerId];
  return humanId != null && ids.includes(humanId) ? 1 : NEUTRAL_GAIN;
}

// Money sounds are directional for the human: low when they pay, high when they are paid.
function moneyCue(payerId, recipientId, humanId) {
  if (humanId != null && payerId === humanId) return { cue: 'pay', gain: 1 };
  if (humanId != null && recipientId === humanId) return { cue: 'receive', gain: 1 };
  return { cue: 'pay', gain: NEUTRAL_GAIN };
}

/** @returns {{cue: string, gain: number, rate?: number} | null} */
export function cueForEvent(event, humanId = null) {
  if (!event) return null;
  const gain = involvedGain(event, humanId);
  switch (event.type) {
    case 'TURN_STARTED': return event.playerId === humanId ? { cue: 'yourTurn', gain: 1 } : null;
    case 'DICE_ROLLED': return { cue: 'dice', gain, rate: event.doubles ? 1.15 : 1 };
    case 'START_PASSED': return { cue: 'startPassed', gain };
    case 'PROPERTY_ACQUIRED': return { cue: 'purchase', gain };
    case 'AUCTION_ENDED': return event.winnerId == null ? null : { cue: 'auction', gain };
    case 'RENT_DUE': return moneyCue(event.playerId, event.ownerId, humanId);
    case 'PAYMENT': return PAYMENT_REASONS_WITH_SOUND.has(event.reason) ? moneyCue(event.payerId, event.recipientId, humanId) : null;
    case 'CARD_DRAWN': return { cue: event.deck === 'avventure' ? 'adventure' : 'setback', gain };
    case 'EMBELLISHMENT_BUILT':
    case 'EMBELLISHMENT_GRANTED': return { cue: 'build', gain };
    case 'EMBELLISHMENT_SOLD': return { cue: 'sellBuild', gain };
    case 'EMBELLISHMENT_LOST': return { cue: 'loseBuild', gain };
    case 'PROPERTY_PLEDGED': return { cue: 'pledge', gain };
    case 'PROPERTY_REDEEMED': return { cue: 'redeem', gain };
    case 'TRADE_PROPOSED': return { cue: 'tradeAsk', gain };
    case 'TRADE_ACCEPTED': return { cue: 'tradeYes', gain };
    case 'TRADE_DECLINED': return { cue: 'tradeNo', gain };
    case 'SENT_TO_BASE': return { cue: 'baseCamp', gain };
    case 'PLAYER_BANKRUPT': return { cue: 'bankrupt', gain };
    case 'GAME_ENDED': return { cue: 'victory', gain: 1 };
    default: return null;
  }
}

/** Every cue name cueForEvent can return, for tests and tooling. */
export const EVENT_CUE_NAMES = [
  'yourTurn', 'dice', 'startPassed', 'purchase', 'auction', 'pay', 'receive', 'adventure', 'setback', 'build', 'sellBuild',
  'loseBuild', 'pledge', 'redeem', 'tradeAsk', 'tradeYes', 'tradeNo', 'baseCamp', 'bankrupt', 'victory'
];

const SAME_CUE_MIN_GAP_MS = 40;

/**
 * Web Audio player. Nothing is created until unlock() runs from a user gesture (browser autoplay policy);
 * every failure (no Web Audio, missing file, undecodable data) degrades to silence.
 */
export function createSoundPlayer({
  cues,
  levels,
  level = 'low',
  audioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext,
  fetchFn = globalThis.fetch?.bind(globalThis),
  now = () => Date.now()
}) {
  let context = null;
  let master = null;
  const buffers = new Map();
  const lastPlayed = new Map();
  const volume = () => levels[level] ?? 0;

  function ensureContext() {
    if (context || !audioContextClass) return context;
    try {
      context = new audioContextClass();
      master = context.createGain();
      master.gain.value = volume();
      master.connect(context.destination);
    } catch {
      context = null;
    }
    return context;
  }

  function load(file) {
    if (!buffers.has(file)) {
      buffers.set(file, Promise.resolve()
        .then(() => fetchFn(file))
        .then(response => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(`HTTP ${response.status}`))))
        .then(data => context.decodeAudioData(data))
        .catch(() => null));
    }
    return buffers.get(file);
  }

  function preload() {
    const files = new Set(Object.values(cues).flat().map(layer => layer.file));
    return Promise.all([...files].map(load));
  }

  return {
    get level() { return level; },
    get unlocked() { return context !== null; },
    get running() { return context?.state === 'running'; },
    setLevel(next) {
      if (!(next in levels)) return;
      level = next;
      if (master) master.gain.value = volume();
    },
    async unlock() {
      const ctx = ensureContext();
      if (!ctx) return false;
      // Sounds are decoded once, ahead of use, so a cue never arrives late.
      preload().catch(() => {});
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { return false; }
      }
      return true;
    },
    play(cue, { gain = 1, rate = 1 } = {}) {
      // A context that is not running (audio not yet allowed by the browser) would queue sounds and burst them later.
      if (context && context.state !== 'running' && volume() > 0) context.resume().catch(() => {});
      if (!context || context.state !== 'running' || volume() <= 0) return false;
      const layers = cues[cue];
      if (!layers) return false;
      const time = now();
      if (time - (lastPlayed.get(cue) ?? -Infinity) < SAME_CUE_MIN_GAP_MS) return false;
      lastPlayed.set(cue, time);
      for (const layer of layers) {
        load(layer.file).then(buffer => {
          if (!buffer) return;
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = rate * (layer.rate ?? 1);
          const layerGain = context.createGain();
          layerGain.gain.value = gain * (layer.gain ?? 1);
          source.connect(layerGain);
          layerGain.connect(master);
          source.start(context.currentTime + (layer.delay ?? 0) / 1000);
        });
      }
      return true;
    }
  };
}
