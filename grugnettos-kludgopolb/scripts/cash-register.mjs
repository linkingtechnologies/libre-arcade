#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// Generates public/assets/audio/cash-register.wav, the "ka-ching" heard when money moves: a mechanical clack
// (a low thump, a burst of filtered noise and a tiny damped bell) followed by a bright double-struck bell.
// Everything is synthesised here from a seeded noise source, so the file is project-authored, reproducible
// byte for byte (a test checks it) and carries no third-party recording.
//
//   node scripts/cash-register.mjs        rewrite the file

import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SAMPLE_RATE = 44100;
const DURATION_S = 0.95;
const PEAK = 0.89; // about -1 dBFS

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// RBJ band-pass biquad, applied to a Float32Array in place.
function bandPass(samples, centreHz, q) {
  const w0 = (2 * Math.PI * centreHz) / SAMPLE_RATE;
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(w0)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const x0 = samples[i];
    const y0 = b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    samples[i] = y0;
  }
}

// One struck bell: inharmonic partials, each decaying at its own rate (the high ones die first).
const BELL_PARTIALS = [
  { ratio: 1, amp: 1, tau: 0.5 },
  { ratio: 2, amp: 0.55, tau: 0.34 },
  { ratio: 2.76, amp: 0.5, tau: 0.28 },
  { ratio: 4.07, amp: 0.32, tau: 0.17 },
  { ratio: 5.4, amp: 0.2, tau: 0.11 },
  { ratio: 6.6, amp: 0.12, tau: 0.075 }
];

function addBell(out, startS, hz, gain, partialScale = 1) {
  const start = Math.round(startS * SAMPLE_RATE);
  for (const { ratio, amp, tau } of BELL_PARTIALS) {
    const freq = hz * ratio;
    if (freq > 16000) continue;
    const decay = tau * partialScale;
    const weight = gain * amp;
    for (let i = start; i < out.length; i += 1) {
      const t = (i - start) / SAMPLE_RATE;
      const ring = Math.exp(-t / decay);
      if (ring < 0.0005) break;
      out[i] += weight * ring * Math.min(1, t / 0.0012) * Math.sin(2 * Math.PI * freq * t);
    }
  }
}

/** The whole effect as 16-bit mono PCM samples. */
export function renderCashRegisterSamples() {
  const length = Math.round(DURATION_S * SAMPLE_RATE);
  const mix = new Float32Array(length);
  const random = mulberry32(2026);

  // "ka": the drawer's clack. A low thump that drops in pitch...
  for (let i = 0; i < 0.09 * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const pitch = 70 + 130 * Math.exp(-t / 0.018);
    mix[i] += 0.55 * Math.exp(-t / 0.022) * Math.sin(2 * Math.PI * pitch * t);
  }
  // ...a burst of mid-range noise...
  const clack = new Float32Array(Math.round(0.11 * SAMPLE_RATE));
  for (let i = 0; i < clack.length; i += 1) clack[i] = (random() * 2 - 1) * Math.exp(-i / SAMPLE_RATE / 0.016);
  bandPass(clack, 1900, 1.3);
  for (let i = 0; i < clack.length; i += 1) mix[i] += 1.6 * clack[i];
  // ...and a very short damped bell so the clack has a pitch.
  addBell(mix, 0, 1400, 0.22, 0.09);

  // "ching": the register's bell, struck twice a few milliseconds apart and slightly detuned, so it shimmers.
  addBell(mix, 0.075, 2350, 0.5);
  addBell(mix, 0.098, 2350 * 1.004, 0.32);

  let peak = 0;
  for (let i = 0; i < length; i += 1) peak = Math.max(peak, Math.abs(mix[i]));
  const fade = Math.round(0.05 * SAMPLE_RATE);
  const pcm = new Int16Array(length);
  for (let i = 0; i < length; i += 1) {
    const taper = i >= length - fade ? (length - 1 - i) / fade : 1;
    pcm[i] = Math.round((mix[i] / peak) * PEAK * taper * 32767);
  }
  return pcm;
}

/** The effect as a complete WAV file. */
export function renderCashRegisterWav() {
  const pcm = renderCashRegisterSamples();
  const data = Buffer.alloc(pcm.length * 2);
  pcm.forEach((sample, i) => data.writeInt16LE(sample, i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = fileURLToPath(new URL('../public/assets/audio/cash-register.wav', import.meta.url));
  const wav = renderCashRegisterWav();
  writeFileSync(target, wav);
  console.log(`Wrote ${target} (${wav.length} bytes)`);
}
