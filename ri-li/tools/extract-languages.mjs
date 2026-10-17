#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Writes the label pictures of the original's languages as PNG files, from the original's own data: the 79 pictures of each language file (language.De, language.Ar, ...) into
// public/ui/<code>/<name>.png, and the label of each language's name (from language.dat) into public/ui/lang/<code>.png. The files that exist are left as they are
// (English and Italian came from the restoration package, and tools/check-assets.mjs says that they are the same pixels), unless --force is given. The pictures are
// the original's, without loss: sprite.cc's Sprite::Load reads a width, a height, a pivot and the pixels (R, G, B and A if there are 4 bytes), and so does this.
//   node tools/extract-languages.mjs <the original's data folder> [--force]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sprites } from './check-assets.mjs';
import { PUBLIC } from './canvas-shim.mjs';
import { encodePng } from './png.mjs';
import { LABEL_NAMES, LANGUAGES, languageFile } from '../public/src/languages.mjs';

const dir = process.argv[2] ?? process.env.RILI_DATA;
const force = process.argv.includes('--force');
if (!dir) { console.error('usage: node tools/extract-languages.mjs <the original\'s data folder> [--force]'); process.exit(2); }

const rgbaOf = (s) => {
  const out = new Uint8Array(s.width * s.height * 4);
  for (let i = 0; i < s.width * s.height; i++) {
    out[i * 4] = s.pixels[i * s.bpp]; out[i * 4 + 1] = s.pixels[i * s.bpp + 1]; out[i * 4 + 2] = s.pixels[i * s.bpp + 2];
    out[i * 4 + 3] = s.bpp === 4 ? s.pixels[i * 4 + 3] : 255;
  }
  return out;
};
const write = (file, s) => { mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, encodePng(s.width, s.height, rgbaOf(s))); };

let written = 0, kept = 0;
for (const code of LANGUAGES) {
  const bytes = readFileSync(join(dir, languageFile(code)));
  let q = 0, i = 0;
  while (q < bytes.length) for (const s of sprites(bytes, q)) {
    const file = join(PUBLIC, 'ui', code, `${LABEL_NAMES[i++]}.png`);
    if (existsSync(file) && !force) kept++; else { write(file, s); written++; }
    q = s.end;
  }
  if (i !== LABEL_NAMES.length) throw new Error(`${languageFile(code)} has ${i} pictures, expected ${LABEL_NAMES.length}`);
}
// the labels of the languages: language.dat has 6 bytes of header, the file names, then one sprite for each language
const dat = readFileSync(join(dir, 'language.dat'));
let r = 6;
for (let k = 0; k < ((dat[4] << 8) | dat[5]); k++) { while (dat[r]) r++; r++; }
for (const code of LANGUAGES) {
  const [s] = [...sprites(dat, r)];
  r = s.end;
  const file = join(PUBLIC, 'ui', 'lang', `${code}.png`);
  if (existsSync(file) && !force) kept++; else { write(file, s); written++; }
}
console.log(`${written} pictures written, ${kept} already there`);
