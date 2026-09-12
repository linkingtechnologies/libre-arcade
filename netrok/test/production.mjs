// SPDX-License-Identifier: GPL-3.0-or-later
//
// This package shipped without an automated test suite. This check follows
// the same pattern used elsewhere in the collection (see njam/test/production.mjs):
// verify the files the game and editor actually need are present, and that
// every asset path referenced from HTML/CSS/JS resolves to a real file —
// catching a broken deploy or a missing asset before it reaches a player.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const required = [
  'index.html', 'favicon.svg', 'LICENSE', 'README.md', 'THIRD_PARTY_NOTICES.md',
  'src/game.js', 'src/i18n.js', 'src/levels.js', 'src/netrok-core.js',
  'src/sfont.js', 'src/sfont-data.js', 'src/ui.js', 'src/style.css',
  'editor/index.html', 'editor/editor.js', 'editor/editor.css',
  'assets/png/0.png', 'assets/presentation/logo.png',
  'assets/music/musik1.ogg', 'assets/midi/musik1.mid',
];
for (const f of required) assert.ok(exists(f), `missing required file: ${f}`);

for (const f of fs.readdirSync(path.join(root, 'assets/audio'))) {
  assert.ok(fs.statSync(path.join(root, 'assets/audio', f)).size > 0, `empty audio asset: ${f}`);
}

// Every asset path referenced from a shipped HTML/CSS/JS file must resolve
// to a real file (skip template-literal interpolations, which are dynamic).
const scanFiles = [
  'index.html', 'editor/index.html', 'src/style.css', 'editor/editor.css',
  ...fs.readdirSync(path.join(root, 'src')).filter((f) => f.endsWith('.js')).map((f) => `src/${f}`),
  'editor/editor.js',
];
for (const file of scanFiles) {
  const text = read(file);
  for (const m of text.matchAll(/["']((?:assets|src|editor)\/[^"']+\.(?:png|jpg|jpeg|svg|wav|ogg|mid|xm|s3m|js|css))["']/gi)) {
    if (!m[1].includes('${')) assert.ok(exists(m[1]), `missing runtime asset referenced by ${file}: ${m[1]}`);
  }
}

console.log('Netrok production packaging tests: OK');
