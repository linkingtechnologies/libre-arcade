#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Dev tooling. Synthesizes public/assets/sounds/jump.wav: a short rising
// square-wave chirp. It REPLACES upstream's jump.wav, whose licence is not
// documented anywhere (see LICENSE-AUDIT.md). Output is deterministic.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const rate = 22050, dur = 0.18, n = Math.floor(rate * dur);
const pcm = Buffer.alloc(n * 2);
let phase = 0;
for (let i = 0; i < n; i++) {
  const t = i / n;
  const f = 280 + 520 * t;
  phase += (2 * Math.PI * f) / rate;
  const env = Math.min(1, i / 120) * Math.pow(1 - t, 1.5);
  const v = Math.sign(Math.sin(phase)) * 0.35 * env;
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}
const h = Buffer.alloc(44);
h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
writeFileSync(fileURLToPath(new URL("../public/assets/sounds/jump.wav", import.meta.url)), Buffer.concat([h, pcm]));
console.log("wrote jump.wav", 44 + pcm.length, "bytes");
