#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0
// Generates public/pop.wav and public/swosh.wav: the two replacement sound
// effects (the originals' author is unknown, see ASSETS.md). Pure synthesis,
// deterministic (seeded noise), dedicated to the public domain under CC0 1.0.
// Dev tooling only: the generated .wav files are committed, nothing runs at play time.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

// "pop": a short sine blip whose pitch falls fast, with a quick decay
function pop() {
  const n = Math.floor(RATE * 0.13);
  const out = [];
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 260 + 700 * Math.exp(-t * 40);
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.exp(-t * 32) * Math.min(1, t * 800);
    out.push(0.8 * env * Math.sin(phase));
  }
  return out;
}

// "swosh": low-passed noise whose cutoff rises then falls, soft in and out
function swosh() {
  const n = Math.floor(RATE * 0.36);
  let seed = 0x5a17;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
  const out = [];
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const cutoff = 0.04 + 0.5 * Math.sin(Math.PI * x);
    lp += cutoff * (rnd() - lp);
    const env = Math.pow(Math.sin(Math.PI * x), 1.5);
    out.push(1.6 * env * lp);
  }
  return out;
}

const dir = fileURLToPath(new URL("../public/", import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(dir + "pop.wav", wav(pop()));
await writeFile(dir + "swosh.wav", wav(swosh()));
console.log("wrote public/pop.wav, public/swosh.wav");
