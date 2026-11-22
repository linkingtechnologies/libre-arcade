#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Original synthesised replacement sounds for Heal'em All (our own work, no third-party samples).
// Deterministic (seeded noise). Writes mono 16-bit 22.05 kHz WAV files:
//   zombie_notice.wav  short growl
//   player_bg.wav      calm spooky loop (32 s), seamless: drones use whole cycles, bells wrap around the buffer end
//   zombie_mode.wav    menacing loop (24 s, 80 bpm), seamless in the same way
// Usage: node tools/synth-audio.mjs <outDir>
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SR = 22050, TAU = Math.PI * 2;
let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const buf = s => new Float32Array(Math.round(s * SR));
const add = (b, i, v) => { b[((i % b.length) + b.length) % b.length] += v; };       // circular add => seamless loops
const lowpass = (b, k) => { let y = 0; for (let i = 0; i < b.length; i++) { y += k * (b[i] - y); b[i] = y; } return b; };
const wholeCycles = (f, len) => Math.max(1, Math.round(f * len / SR)) * SR / len;      // frequency with integer cycles per loop
function wav(b, peak = 0.7) {
  let m = 0; for (const v of b) m = Math.max(m, Math.abs(v)); const g = m ? peak / m : 1;
  const d = Buffer.alloc(44 + b.length * 2);
  d.write("RIFF", 0); d.writeUInt32LE(36 + b.length * 2, 4); d.write("WAVEfmt ", 8); d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(1, 22);
  d.writeUInt32LE(SR, 24); d.writeUInt32LE(SR * 2, 28); d.writeUInt16LE(2, 32); d.writeUInt16LE(16, 34); d.write("data", 36); d.writeUInt32LE(b.length * 2, 40);
  for (let i = 0; i < b.length; i++) d.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[i] * g)) * 32767), 44 + i * 2);
  return d;
}
function bell(b, start, f, len, amp) {                                                 // inharmonic decaying partials
  const n = Math.round(len * SR);
  for (let i = 0; i < n; i++) { const t = i / SR, e = Math.exp(-t * 2.2) * Math.min(1, i / (0.01 * SR));
    add(b, start + i, amp * e * (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.76 * t) + 0.2 * Math.sin(TAU * f * 5.4 * t))); }
}

function growl() {
  const b = buf(0.9); let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR, f = 78 - 22 * (t / 0.9), env = Math.min(1, t / 0.04) * Math.exp(-Math.max(0, t - 0.15) * 2.8);
    ph += f / SR; const saw = 2 * (ph - Math.floor(ph)) - 1, am = 0.55 + 0.45 * Math.sin(TAU * 26 * t);
    b[i] = env * am * (saw * 0.8 + rnd() * 0.25);
  }
  return lowpass(b, 0.22);
}
function calm() {                                                                       // 32 s
  const L = 32, b = buf(L), n = b.length;
  const d1 = wholeCycles(110, n), d2 = wholeCycles(164.9, n), d3 = wholeCycles(220.4, n);
  for (let i = 0; i < n; i++) { const t = i / SR, lfo = 0.6 + 0.4 * Math.sin(TAU * t / 16);
    b[i] += 0.5 * Math.sin(TAU * d1 * t) + 0.3 * lfo * Math.sin(TAU * d2 * t) + 0.15 * (0.5 + 0.5 * Math.sin(TAU * 2 * t / L)) * Math.sin(TAU * d3 * t); }
  const wind = buf(L); for (let i = 0; i < n; i++) wind[i] = rnd(); lowpass(wind, 0.03);
  for (let i = 0; i < n; i++) b[i] += 3.2 * wind[i] * (0.5 + 0.5 * Math.sin(TAU * i / n * 2 - 1));
  const notes = [[2, 440], [6.5, 329.6], [10, 392], [15, 293.7], [19.5, 440], [23, 329.6], [26.5, 261.6], [29, 392]]; // A minor pentatonic, sparse
  for (const [t, f] of notes) bell(b, Math.round(t * SR), f, 5, 0.22);
  return b;
}
function menace() {                                                                     // 24 s at 80 bpm = 32 beats
  const L = 24, b = buf(L), n = b.length, beat = SR * 60 / 80;
  const a = wholeCycles(55, n), tri = wholeCycles(77.8, n), up = wholeCycles(116.5, n);
  for (let i = 0; i < n; i++) { const t = i / SR, s = Math.sin(TAU * t / 12);
    b[i] += 0.55 * Math.sin(TAU * a * t) + 0.35 * Math.sin(TAU * tri * t + 0.8 * Math.sin(TAU * 0.25 * t)) + 0.12 * (0.5 + 0.5 * s) * Math.sin(TAU * up * t); }
  const rum = buf(L); for (let i = 0; i < n; i++) rum[i] = rnd(); lowpass(rum, 0.02); for (let i = 0; i < n; i++) b[i] += 2.2 * rum[i];
  for (let k = 0; k < 32; k++) {                                                        // heartbeat thumps, double hit on the beat
    for (const [off, amp] of [[0, 0.9], [0.5 * beat / 2, 0.55]]) { const s0 = Math.round(k * beat + off), len = Math.round(0.28 * SR);
      for (let i = 0; i < len; i++) { const t = i / SR; add(b, s0 + i, amp * Math.exp(-t * 14) * Math.sin(TAU * (62 - 90 * t) * t)); } }
    if (k % 8 === 4) bell(b, Math.round(k * beat), 207.7, 3, 0.18);                    // dissonant stab (G#3 against the A drone)
  }
  return b;
}

const out = resolve(process.argv[2] ?? "replacement-audio"); mkdirSync(out, { recursive: true });
for (const [name, gen] of [["zombie_notice", growl], ["player_bg", calm], ["zombie_mode", menace]]) { writeFileSync(resolve(out, name + ".wav"), wav(gen())); console.log("wrote", name + ".wav"); }
