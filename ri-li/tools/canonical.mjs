// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// What is kept of a run of the original, so that `npm test` can replay it against the page without the original (which needs WSL or Linux, a compiler and SDL):
//   * for every frame, the values that the oracle compares (state, random numbers, sounds, the list of what was drawn), reduced to one digest per block of 25 frames;
//   * for some frames, the picture as a thumbnail: the mean colour of every 25 by 25 block of the 800 by 600 picture (32 by 24 blocks), which tolerates the rounding of a
//     browser's drawing and not a sprite that is a pixel off (the oracle itself compares every pixel; see tools/oracle.mjs).
// `canonicalOriginal` and `canonicalPage` give the same list for a frame of the original and for the same frame of the page when they agree.

import { createHash } from 'node:crypto';

export const BLOCK = 25;

const nonClick = (snd) => snd.filter((s) => s !== 'p0');

export function canonicalOriginal(o) {
  if (o.k === 'q') return ['q', o.score, o.lives, o.pye, o.rand, nonClick(o.snd), quizDraws(o.draws)];
  if (o.k === 'g') return gameFrame(o, o.mort === -1 ? null : o.mort - o.hor, nonClick(o.snd));
  return [o.k, o.pye, o.draws, nonClick(o.snd)];
}

export function canonicalPage(p) {
  if (p.k === 'q') return ['q', p.score, p.lives, p.pye, p.rand, p.snd, p.draws];
  if (p.k === 'g') return gameFrame(p, p.mortLeft, p.snd);
  return [p.k, p.pye, p.draws, p.snd];
}

function quizDraws(list) {
  return list.map((d) => (d[0] === 21 || d[0] === 22 ? [d[0], 0, d[2], d[3]] : d)).filter((d) => d[0] === 33 || d[0] === 21 || d[0] === 22);
}

function gameFrame(r, mort, snd) {
  return ['g', r.dg, r.D, r.cell, r.exit, r.ploco, r.nw, r.rem, r.score, r.lives, r.spacing, r.speed, r.vit, r.won, r.pause, r.help, r.alonge, r.reduit, r.vitesse, r.memo, r.board,
    r.pinter, r.pinter === -1 ? 0 : r.pentree, r.keys, r.types, r.pw, r.rand, snd, mort, r.draws];
}

// one short digest for each block of frames
export function digests(frames) {
  const out = [];
  for (let i = 0; i < frames.length; i += BLOCK) out.push(createHash('sha256').update(JSON.stringify(frames.slice(i, i + BLOCK))).digest('hex').slice(0, 12));
  return out;
}

// where two lists of digests first differ: the first frame of the block, or null
export function firstDifference(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return i * BLOCK;
  return null;
}

// ---- thumbnails -----------------------------------------------------------------------------------------------------------------------

export const THUMB = { width: 32, height: 24, block: 25 };

export function thumbnail(rgba) {
  const { width, height, block } = THUMB, out = new Uint8Array(width * height * 3);
  for (let by = 0; by < height; by++) for (let bx = 0; bx < width; bx++) {
    const sum = [0, 0, 0];
    for (let y = 0; y < block; y++) for (let x = 0; x < block; x++) { const i = ((by * block + y) * 800 + bx * block + x) * 4; sum[0] += rgba[i]; sum[1] += rgba[i + 1]; sum[2] += rgba[i + 2]; }
    for (let c = 0; c < 3; c++) out[(by * width + bx) * 3 + c] = Math.round(sum[c] / (block * block));
  }
  return out;
}

export const thumbnailToText = (t) => Buffer.from(t).toString('base64');
export const thumbnailFromText = (s) => new Uint8Array(Buffer.from(s, 'base64'));

// the largest difference of a block's mean colour, and where
export function compareThumbnails(a, b) {
  let max = 0, at = -1;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > max) { max = d; at = Math.floor(i / 3); } }
  return { max, block: at < 0 ? null : [at % THUMB.width, Math.floor(at / THUMB.width)] };
}
