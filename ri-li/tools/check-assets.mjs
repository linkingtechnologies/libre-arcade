#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Checks the page's pictures against the original's data files, pixel for pixel: the 2,506 frames of public/assets against sprites.dat (their size and pivot against
// public/data/sprites.json too), the 79 label images of each of the 19 languages (public/ui/<code>) against its language.XX file, and the labels of the languages
// (public/ui/lang) against language.dat; and that the list of languages of public/src/languages.mjs is the order of language.dat.
// Reads the original's data folder (the `data` of the source archive, unpacked, all of it) from the first argument or RILI_DATA, and checks its files' SHA-256 first.
//   node tools/check-assets.mjs /path/to/Ri-li-2.0.1/data

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodePng, PUBLIC } from './canvas-shim.mjs';
import { LABEL_NAMES, LANGUAGES, languageFile } from '../public/src/languages.mjs';

export const DATA_SHA256 = {
  'sprites.dat': '65cb3c87b097bbbf8c5fb29bee343ce5f3b44a337b650887f32ed4d613288696',
  'language.dat': '9839ae255af926f9cc8c986a0614a2a889479ce276b26af3011cfb1d3057afcb',
  'language.Ar': 'd669d5bfaf31fc9e42d414c7abce44b42a3f18cb49784f40b13e132de98e3a4d',
  'language.Br': '16219e2d9b1ba7b2a2adfa79f121b88374bcea673a57ccd2ae5349b98dc1639d',
  'language.Cn': '0b5f26681e2d6ef453ae00a00fc5cc217207fa8f8a8683757e299ae258b7a04a',
  'language.De': '06cfa5410e7484867008668c94198c8f6976c23e00d76e38600e69ca03c6f6c4',
  'language.Du': '5c5e3aa39d6d7f08d968b05943cfe3b918e8e3f0de92a5edf4fbed1f1d3e1376',
  'language.En': 'aa9df1016228e95f3a1ef5d03170ddc5314644c19715ab5e1b09c0e9e4d9a681',
  'language.Eo': 'ef54a7075a606e09746a121c14a62634eeacb936cf204c409f3c3c8468cd396a',
  'language.Es': 'b165422a2b27ba7a40c5932fe9f4772dce885730f1a7751118d8aa65b253d6fc',
  'language.Fr': '5b239c02e9353ec8e40f1718d91de04128300c7433f070ed0d9f9bd8598b4769',
  'language.Hu': '93f9834406940968175f2410ef9b7acdc292d20ae0e41c719f05a043589398b6',
  'language.It': 'b1bf3cfa5785842d2c3bb75842fd61d4119fabb5fd25ff9522f8b9b9ab924fff',
  'language.Jp': '37aa21f6b1dae36900b8381844b2fe3d02cf92d55505f32538c803b4207d2ebd',
  'language.Ko': '344f0cc2d22e1833f6240e7accab04daefb628711b53d5dbe2f11e0f387e8c97',
  'language.Pl': 'f3b89e842e9a2110588a4e98c9ca993a03e2b0b9737feb9c714bc3f8f947c338',
  'language.Po': '2927fa72b4d74315096a70a3993fb059e557f7ca18650c089f9ebb8910490188',
  'language.Ru': '3a3a1afaef8f682f908cd3538c4c481fe9fa7ff9f9ffbc61a6537e577b974bc9',
  'language.Se': '4abedd194714bd19d431c0a3bdffeb336d6eb594190fc124cbdf31a741de67e5',
  'language.Sl': '715f088e48ce339758ad8d78b8553149be3acc2d4b5e6b531f3c2a12bb536d4d',
  'language.Tu': '5ae192a2866c43754644daaa24871caadca4d0f5bac193fdf337d0b704e21753',
  'levels.dat': 'd88a4a1c3f8bb7eab580cb4a0225602b2f96b71fd34404ad230d37f0c6ee774f',
};

const be = (b, p) => (b[p] << 8) | b[p + 1];

// Sprite::Load: a count, then for each sprite its width, height, pivot x, pivot y and bytes per pixel (16 bits each, big endian) and its pixels (R, G, B, and A if 4 bytes)
export function* sprites(bytes, from = 0) {
  let p = from;
  const n = be(bytes, p); p += 2;
  for (let k = 0; k < n; k++) {
    const width = be(bytes, p), height = be(bytes, p + 2), cx = be(bytes, p + 4), cy = be(bytes, p + 6), bpp = be(bytes, p + 8); p += 10;
    yield { width, height, cx, cy, bpp, pixels: bytes.subarray(p, p + width * height * bpp), end: (p += width * height * bpp) };
  }
}

function pixelsDiffer(s, png) {
  if (png.width !== s.width || png.height !== s.height) return s.width * s.height;
  let diff = 0;
  for (let i = 0; i < s.width * s.height; i++) {
    const a = s.bpp === 4 ? s.pixels[i * 4 + 3] : 255;
    if (png.data[i * 4] !== s.pixels[i * s.bpp] || png.data[i * 4 + 1] !== s.pixels[i * s.bpp + 1] || png.data[i * 4 + 2] !== s.pixels[i * s.bpp + 2] || png.data[i * 4 + 3] !== a) diff++;
  }
  return diff;
}

export function checkAssets(dataDir) {
  const problems = [];
  const read = (name) => {
    const bytes = readFileSync(join(dataDir, name));
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (sha !== DATA_SHA256[name]) problems.push(`${name}: SHA-256 ${sha} is not the original's`);
    return bytes;
  };
  const summary = {};

  // the sprites of the game
  const sprites_dat = read('sprites.dat');
  const manifest = JSON.parse(readFileSync(join(PUBLIC, 'data', 'sprites.json'), 'utf8'));
  const byKey = new Map(manifest.map((m) => [`${m.group_index}:${m.frame}`, m]));
  let p = 0, frames = 0;
  for (let group = 0; group < 36; group++) {
    let k = 0;
    for (const s of sprites(sprites_dat, p)) {
      const m = byKey.get(`${group}:${k}`);
      if (!m) problems.push(`sprite ${group}:${k} is not in the manifest`);
      else {
        if (+m.width !== s.width || +m.height !== s.height || +m.cx !== s.cx || +m.cy !== s.cy || +m.bpp !== s.bpp) problems.push(`sprite ${group}:${k}: size or pivot differs from the manifest`);
        const diff = pixelsDiffer(s, decodePng(readFileSync(join(PUBLIC, m.png))));
        if (diff) problems.push(`sprite ${group}:${k} (${m.group_name}): ${diff} pixels differ`);
      }
      frames++; k++; p = s.end;
    }
  }
  summary.frames = frames;
  if (frames !== manifest.length) problems.push(`the manifest has ${manifest.length} frames, the file ${frames}`);

  // the languages: language.dat has 6 bytes of header, the 19 file names, then one sprite for each language (the label of its name), then the loader's
  const dat = read('language.dat');
  const nLanguages = be(dat, 4);
  let r = 6;
  const files = [];
  for (let k = 0; k < nLanguages; k++) { let e = r; while (dat[e]) e++; files.push(dat.toString('latin1', r, e)); r = e + 1; }
  summary.languages = nLanguages;
  if (JSON.stringify(files) !== JSON.stringify(LANGUAGES.map(languageFile))) problems.push('public/src/languages.mjs is not the list of languages of language.dat, in its order');
  for (let k = 0; k < nLanguages; k++) {
    const [s] = [...sprites(dat, r)];
    r = s.end;
    const code = LANGUAGES[k];
    const diff = pixelsDiffer(s, decodePng(readFileSync(join(PUBLIC, 'ui', 'lang', `${code}.png`))));
    if (diff) problems.push(`the label of ${files[k]}: ${diff} pixels differ`);
  }

  // the label images of each language
  summary.labels = 0;
  for (const code of LANGUAGES) {
    const file = languageFile(code), bytes = read(file);
    let q = 0, i = 0;
    while (q < bytes.length) {
      for (const s of sprites(bytes, q)) {
        const name = LABEL_NAMES[i++];
        if (s.cx !== (s.width >> 1) || s.cy !== (s.height >> 1)) problems.push(`${file} ${name}: the pivot is not the middle of the sprite`);
        const diff = pixelsDiffer(s, decodePng(readFileSync(join(PUBLIC, 'ui', code, `${name}.png`))));
        if (diff) problems.push(`${file} ${name}: ${diff} pixels differ`);
        summary.labels++; q = s.end;
      }
    }
    if (i !== LABEL_NAMES.length) problems.push(`${file} has ${i} label sprites, expected ${LABEL_NAMES.length}`);
  }
  read('levels.dat');
  if (!existsSync(join(PUBLIC, 'data', 'levels.dat'))) problems.push('public/data/levels.dat is missing');
  else if (createHash('sha256').update(readFileSync(join(PUBLIC, 'data', 'levels.dat'))).digest('hex') !== DATA_SHA256['levels.dat']) problems.push('public/data/levels.dat is not the original levels.dat');
  return { problems, summary };
}

if (process.argv[1] && process.argv[1].replaceAll('\\', '/').endsWith('tools/check-assets.mjs')) {
  const dir = process.argv[2] ?? process.env.RILI_DATA;
  if (!dir) { console.error('usage: node tools/check-assets.mjs <the original\'s data folder>'); process.exit(2); }
  const { problems, summary } = checkAssets(dir);
  console.log(`${summary.frames} sprite frames, ${summary.labels} label images in ${summary.languages} languages: ${problems.length ? problems.length + ' problems' : 'every picture is the original\'s, pixel for pixel'}`);
  for (const line of problems.slice(0, 20)) console.log(' ', line);
  process.exitCode = problems.length ? 1 : 0;
}
