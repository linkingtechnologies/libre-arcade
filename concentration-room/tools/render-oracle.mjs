#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// What the game screen looks like, compared with the original's.
//
//   node tools/render-oracle.mjs [--ids 2,34 | --quick | --all] [--max 1500] [--out DIR] [--jobs J]
//
// The ROM oracle (tools/rom-oracle.mjs) shows that the port's state is the ROM's at every iteration of the main loop. This tool takes
// the same scenarios and, at the same moments, composes the picture the ROM would put on the screen (tools/nes-frame.mjs) and has the
// browser game's own renderer (public/src/renderer.js, run in Node over tools/canvas-shim.mjs) draw the port's state, then compares the two
// pixel by pixel. It covers the game screen only (the cards, the emblems, the arrow, the score boxes, the game-over wipe, the message that
// asks for the controller); the title screen has its own check (test/render-title.test.js), and the instruction text and the story scenes
// are not compared. The first three iterations of each game (the original's fade in) are left out: the page fades in on its own.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { FIXTURE, analyseRom, loadRom, planScenarios, runScenario } from './rom-oracle.mjs';
import { SoftCanvas, installBrowserShims } from './canvas-shim.mjs';
import { HEIGHT, WIDTH, encodePng, renderFrame } from './nes-frame.mjs';

installBrowserShims();
const { NesRenderer } = await import('../public/src/renderer.js');

export const FADE_IN_ITERATIONS = 3;

function clusters(mask) {
  const seen = new Uint8Array(WIDTH * HEIGHT), found = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const stack = [start]; seen[start] = 1;
    let count = 0, x0 = WIDTH, y0 = HEIGHT, x1 = -1, y1 = -1;
    while (stack.length) {
      const i = stack.pop(), x = i % WIDTH, y = (i / WIDTH) | 0;
      count++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
        const j = ny * WIDTH + nx;
        if (mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    found.push({ count, box: [x0, y0, x1, y1] });
  }
  return found.sort((a, b) => b.count - a.count);
}

export function compareFrames(romRgba, portRgba) {
  const mask = new Uint8Array(WIDTH * HEIGHT);
  const diff = new Uint8Array(WIDTH * HEIGHT * 4);
  let count = 0;
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    const o = i * 4;
    if (romRgba[o] === portRgba[o] && romRgba[o + 1] === portRgba[o + 1] && romRgba[o + 2] === portRgba[o + 2]) { diff[o] = diff[o + 1] = diff[o + 2] = romRgba[o] >> 2; diff[o + 3] = 255; continue; }
    count++; mask[i] = 1; diff[o] = 255; diff[o + 1] = 0; diff[o + 2] = 255; diff[o + 3] = 255;
  }
  return { count, diff, mask };
}

const sideBySide = (a, b, c) => {
  const rgba = new Uint8Array(WIDTH * 3 * HEIGHT * 4);
  [a, b, c].forEach((img, k) => { for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) { const s = (y * WIDTH + x) * 4, d = (y * WIDTH * 3 + k * WIDTH + x) * 4; for (let j = 0; j < 4; j++) rgba[d + j] = img[s + j]; } });
  return { width: WIDTH * 3, height: HEIGHT, rgba };
};

// the region of three pictures, cut out
function crop(images, [x0, y0, x1, y1]) {
  const w = x1 - x0 + 1, h = y1 - y0 + 1, gap = 2;
  const rgba = new Uint8Array((w * 3 + gap * 2) * h * 4);
  images.forEach((img, k) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((y0 + y) * WIDTH + x0 + x) * 4, d = (y * (w * 3 + gap * 2) + k * (w + gap) + x) * 4; for (let j = 0; j < 4; j++) rgba[d + j] = img[s + j]; } });
  return { width: w * 3 + gap * 2, height: h, rgba };
}

// One scenario: the port and the ROM play it together and their pictures are compared at every iteration.
export function renderScenario(spec, { rom, info, map, maxFrames = 1500, outDir = null }) {
  let renderer = null, canvas = null, lastGame = null, frames = 0, different = 0, pixels = 0, saved = 0, fade = 0;
  const first = [], byState = {};
  runScenario(spec, {
    rom, info, map,
    onIteration: ({ game, machine, iteration, gameIndex }) => {
      if (game !== lastGame) { canvas = new SoftCanvas(); renderer = new NesRenderer(canvas); lastGame = game; }
      renderer.render(game);
      if (iteration >= maxFrames) return false;
      if (iteration < FADE_IN_ITERATIONS) { fade++; return true; }
      const romFrame = renderFrame(machine);
      const result = compareFrames(romFrame.rgba, canvas.data);
      frames++;
      byState[game.state] ??= { frames: 0, different: 0 };
      byState[game.state].frames++;
      if (result.count) {
        different++; pixels += result.count; byState[game.state].different++;
        const parts = clusters(result.mask);
        if (first.length < 4) first.push({ game: gameIndex, iteration, state: game.state, pixels: result.count, parts: parts.slice(0, 6) });
        if (outDir && saved < 3) {
          saved++;
          writeFileSync(join(outDir, `scenario${spec.id}-g${gameIndex}-i${iteration}.png`), encodePng(sideBySide(romFrame.rgba, canvas.data, result.diff), 2));
          const [a, b, c, d] = parts[0].box, m = 4;
          const zoom = crop([romFrame.rgba, canvas.data, result.diff], [Math.max(0, a - m), Math.max(0, b - m), Math.min(WIDTH - 1, c + m), Math.min(HEIGHT - 1, d + m)]);
          writeFileSync(join(outDir, `scenario${spec.id}-g${gameIndex}-i${iteration}-crop.png`), encodePng(zoom, Math.max(1, Math.min(8, Math.floor(1500 / zoom.width)))));
        }
      }
      return true;
    },
  });
  return { id: spec.id, games: spec.games.map((g) => `${g.mode} d${g.difficulty}`).join(', '), frames, fade, different, pixels, byState, first };
}

// ---- worker threads: scenarios are independent ----
if (!isMainThread && workerData?.role === 'render-oracle') {
  const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const rom = loadRom(), info = analyseRom(rom);
  const specs = new Map(planScenarios(fixture.generator).map((s) => [s.id, s]));
  parentPort.on('message', ({ id, maxFrames, outDir }) => parentPort.postMessage(renderScenario(specs.get(id), { rom, info, map: fixture.map, maxFrames, outDir })));
}

export const defaultJobs = () => Math.max(1, Math.min(availableParallelism() - 1, 6));

export function renderAll(ids, { maxFrames = 1500, outDir = null, jobs = defaultJobs(), onResult = null } = {}) {
  return new Promise((resolveAll, rejectAll) => {
    const out = new Array(ids.length), workers = [];
    let next = 0, done = 0;
    const stop = (error) => { for (const w of workers) w.terminate(); rejectAll(error); };
    const feed = (worker) => {
      if (next >= ids.length) { worker.terminate(); return; }
      const index = next++;
      worker.once('message', (message) => { out[index] = message; done++; if (onResult) onResult(message); if (done === ids.length) { for (const w of workers) w.terminate(); resolveAll(out); } else feed(worker); });
      worker.postMessage({ id: ids[index], maxFrames, outDir });
    };
    if (!ids.length) { resolveAll(out); return; }
    for (let i = 0; i < Math.min(jobs, ids.length); i++) {
      const worker = new Worker(new URL(import.meta.url), { workerData: { role: 'render-oracle' } });
      worker.on('error', stop); workers.push(worker); feed(worker);
    }
  });
}

export const describe = (r) => [
  `scenario ${String(r.id).padStart(3)} ${r.games}: ${r.frames} frames compared (${r.fade} fade-in frames left out), ${r.different} differ (${r.pixels} pixels)`,
  '   by state: ' + Object.entries(r.byState).map(([state, v]) => `${state} ${v.different}/${v.frames}`).join(', '),
  ...r.first.map((f) => `   first differences: game ${f.game} iteration ${f.iteration} (${f.state}): ${f.pixels} pixels; ` + f.parts.map((c) => `${c.count} at x ${c.box[0]}..${c.box[2]}, y ${c.box[1]}..${c.box[3]}`).join(' | ')),
].join('\n');

async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
  const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const total = fixture.generator.games;
  const ids = args.includes('--all') ? [...Array(total).keys()] : args.includes('--quick') ? fixture.quick : option('ids', '2,34,48,27,29,26,33,56').split(',').map(Number);
  const maxFrames = Number(option('max', 1500));
  const outDir = option('out', join(process.env.TEMP || tmpdir(), 'render-oracle'));
  mkdirSync(outDir, { recursive: true });
  const results = await renderAll(ids, { maxFrames, outDir, jobs: Number(option('jobs', defaultJobs())), onResult: (r) => console.log(describe(r)) });
  const frames = results.reduce((n, r) => n + r.frames, 0), different = results.reduce((n, r) => n + r.different, 0), pixels = results.reduce((n, r) => n + r.pixels, 0);
  console.log(`\n${frames} frames compared in ${results.length} scenarios; ${different} frames differ (${pixels} pixels). Pictures of the first differences: ${outDir}`);
  process.exitCode = different ? 1 : 0;
}

if (isMainThread && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack ?? error.message); process.exit(1); });
}
