#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Converts the chosen Kenney CC0 .ogg files to 16-bit mono WAV by decoding them in Chrome (no encoder is installed here).
//   PLAYWRIGHT_CORE=<node_modules/playwright-core> node tools/ogg-to-wav.mjs <kenneyExtractRoot> <outDir>
// <kenneyExtractRoot> holds the unzipped packs: impact-sounds/, interface-sounds/, sci-fi-sounds/ (each with Audio/*.ogg).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const [root, outDir] = [resolve(process.argv[2]), resolve(process.argv[3] ?? "replacement-audio")];
const MAP = { // game sound name -> source file inside the Kenney packs
  gun_shot: "sci-fi-sounds/Audio/laserSmall_000.ogg",
  collected: "interface-sounds/Audio/confirmation_001.ogg",
  player_hit: "impact-sounds/Audio/impactPunch_medium_000.ogg",
  human_created: "interface-sounds/Audio/confirmation_003.ogg",
};
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true }); const page = await browser.newPage();
for (const [name, rel] of Object.entries(MAP)) {
  const bytes = [...readFileSync(resolve(root, rel))];
  const pcm = await page.evaluate(async b => {
    const ctx = new OfflineAudioContext(1, 1, 44100); const a = await ctx.decodeAudioData(new Uint8Array(b).buffer);
    const n = a.length, ch = a.numberOfChannels, out = new Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let c = 0; c < ch; c++) s += a.getChannelData(c)[i]; out[i] = s / ch; }
    return { rate: a.sampleRate, data: out };
  }, bytes);
  const n = pcm.data.length, d = Buffer.alloc(44 + n * 2);
  d.write("RIFF", 0); d.writeUInt32LE(36 + n * 2, 4); d.write("WAVEfmt ", 8); d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(1, 22);
  d.writeUInt32LE(pcm.rate, 24); d.writeUInt32LE(pcm.rate * 2, 28); d.writeUInt16LE(2, 32); d.writeUInt16LE(16, 34); d.write("data", 36); d.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) d.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcm.data[i])) * 32767), 44 + i * 2);
  writeFileSync(resolve(outDir, name + ".wav"), d); console.log(name, "<-", rel, `${(n / pcm.rate).toFixed(2)} s @ ${pcm.rate} Hz`);
}
await browser.close();
