/* Copyright (C) 2026 Libre Arcade contributors; SPDX-License-Identifier: AGPL-3.0-or-later */
/* Optional user-triggered Web Audio tones. No third-party audio assets or storage. */
export function createSound({ AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext } = {}) {
  let enabled = false;
  let context = null;
  const available = typeof AudioContextClass === 'function';
  const notes = Object.freeze({
    move: [[660, 0, 0.065]],
    complete: [[523.25, 0, 0.13], [659.25, 0.12, 0.13], [783.99, 0.24, 0.20]],
    blocked: [[392, 0, 0.105], [293.66, 0.105, 0.16]],
  });

  function toggle() {
    if (!available) return false;
    if (enabled) { enabled = false; return false; }
    try {
      context ||= new AudioContextClass(); // Create audio only after an explicit user gesture.
      const result = context.resume?.();
      result?.catch?.(() => { enabled = false; });
      enabled = true;
      return true;
    } catch {
      enabled = false;
      return false;
    }
  }

  function play(event) {
    if (!enabled || !context || !Object.hasOwn(notes, event)) return false;
    try {
      const t = context.currentTime;
      for (const [frequency, offset, duration] of notes[event]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, t + offset);
        gain.gain.setValueAtTime(0.0001, t + offset);
        gain.gain.linearRampToValueAtTime(0.055, t + offset + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(t + offset);
        oscillator.stop(t + offset + duration + 0.01);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
      return true;
    } catch {
      // Audio must never interrupt the historical game, including on restricted devices.
      return false;
    }
  }
  return { available, get enabled() { return enabled; }, toggle, play };
}
