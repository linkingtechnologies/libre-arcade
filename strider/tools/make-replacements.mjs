#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Generates the original replacement assets written for this collection (not
// upstream's): four sound effects (.wav) and the jump-dust sprite sheet
// (.png). They stand in for upstream assets whose licence could not be
// cleared; see specs/design.md. Deterministic: same output on every run.
//
//   node tools/make-replacements.mjs
//
// Dependency-free (node:zlib only).

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const out = (name) => fileURLToPath(new URL(`../public/assets/${name}`, import.meta.url));

// Small deterministic PRNG so the output never changes between runs.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const RATE = 22050;

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

// One-pole low-pass, cutoff in Hz.
function lowpass(x, cutoff) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE);
  const y = new Float64Array(x.length);
  let prev = 0;
  for (let i = 0; i < x.length; i++) {
    prev += a * (x[i] - prev);
    y[i] = prev;
  }
  return y;
}

function render(seconds, fn) {
  const n = Math.floor(seconds * RATE);
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = fn(i / RATE, i);
  return x;
}

// Door slam: a heavy low thump plus a short metallic noise burst.
{
  const r = rng(1);
  const x = render(0.6, (t) => {
    const thump = Math.sin(2 * Math.PI * (70 - 40 * t) * t) * Math.exp(-t * 9);
    const clang = (r() * 2 - 1) * Math.exp(-t * 45) * 0.8;
    return thump * 0.9 + clang;
  });
  writeFileSync(out("sfx/doorshut.wav"), wav(lowpass(x, 5000)));
}

// Lift off: filtered noise whose pitch and volume rise, with a low rumble.
{
  const r = rng(2);
  const raw = render(3, () => r() * 2 - 1);
  const x = new Float64Array(raw.length);
  const slices = 60;
  const part = Math.floor(raw.length / slices);
  for (let s = 0; s < slices; s++) {
    const cutoff = 300 + (s / slices) * 2600;
    const seg = lowpass(raw.slice(s * part, (s + 1) * part), cutoff);
    for (let i = 0; i < part; i++) x[s * part + i] = seg[i] * 2.2;
  }
  for (let i = 0; i < x.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.6) * Math.min(1, (3 - t) / 0.5);
    x[i] = (x[i] + 0.35 * Math.sin(2 * Math.PI * (45 + 12 * t) * t)) * env * 0.8;
  }
  writeFileSync(out("sfx/liftoff.wav"), wav(x));
}

// Death splat: a wet low-passed noise burst with a falling blip.
{
  const r = rng(3);
  const noise = render(0.35, (t) => (r() * 2 - 1) * Math.exp(-t * 14));
  const x = lowpass(noise, 1400);
  for (let i = 0; i < x.length; i++) {
    const t = i / RATE;
    x[i] = (x[i] * 2.5 + 0.5 * Math.sin(2 * Math.PI * (220 - 400 * t) * t) * Math.exp(-t * 18)) * 0.8;
  }
  writeFileSync(out("sfx/deathsplat.wav"), wav(x));
}

// Landing: a short, soft low thud.
{
  const r = rng(4);
  const x = render(0.18, (t) => {
    const thud = Math.sin(2 * Math.PI * (110 - 220 * t) * t) * Math.exp(-t * 28);
    return thud * 0.8 + (r() * 2 - 1) * Math.exp(-t * 90) * 0.15;
  });
  writeFileSync(out("sfx/landfeet.wav"), wav(lowpass(x, 3000)));
}

// Jump dust: 10 frames of 64x64 (640x64), soft grey puffs spreading sideways
// along the ground, growing and fading.
{
  const FW = 64, FH = 64, FRAMES = 10;
  const W = FW * FRAMES;
  const px = new Uint8Array(W * FH * 4);
  const r = rng(5);
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    puffs.push({
      dir,
      speed: 1.0 + r() * 2.0,
      lift: r() * 1.4,
      r0: 3 + r() * 3,
      grow: 1.2 + r() * 1.2,
      shade: 205 + Math.floor(r() * 45),
    });
  }
  for (let f = 0; f < FRAMES; f++) {
    const life = f / (FRAMES - 1);
    for (const p of puffs) {
      const cx = FW / 2 + p.dir * p.speed * f * 1.15;
      const cy = FH - 12 - p.lift * f * 1.6;
      const rad = p.r0 + p.grow * f * 0.9;
      const alpha = Math.max(0, 0.9 * (1 - life * life));
      for (let y = Math.max(0, Math.floor(cy - rad)); y < Math.min(FH, Math.ceil(cy + rad)); y++) {
        for (let x = Math.max(0, Math.floor(cx - rad)); x < Math.min(FW, Math.ceil(cx + rad)); x++) {
          const d = Math.hypot(x - cx, y - cy) / rad;
          if (d >= 1) continue;
          const a = alpha * (1 - d * d);
          const o = (y * W + f * FW + x) * 4;
          const prev = px[o + 3] / 255;
          const na = prev + a * (1 - prev);
          px[o] = px[o + 1] = px[o + 2] = p.shade;
          px[o + 3] = Math.round(na * 255);
        }
      }
    }
  }
  writeFileSync(out("images/smoke_jump.png"), png(W, FH, px));
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

console.log("Wrote doorshut/liftoff/deathsplat/landfeet .wav and images/smoke_jump.png");
