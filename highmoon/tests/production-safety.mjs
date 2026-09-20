// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const runtimeFiles = [
  path.join(root, 'index.html'),
  path.join(root, 'styles.css'),
  ...fs.readdirSync(path.join(root, 'src')).filter((f) => f.endsWith('.js')).map((f) => path.join(root, 'src', f)),
];

for (const file of runtimeFiles) {
  const text = fs.readFileSync(file, 'utf8');
  // Credits may link out to the original game and Libre Arcade; no remote runtime dependency.
  // The same goes for the collection's GoatCounter beacon (grugnetto.goatcounter.com, gc.zgo.at).
  const withoutCreditsLinks = file.endsWith('index.html')
    ? text
      .replace(/<a\b[^>]*\bhref="https?:\/\/[^"]+"[^>]*>/gi, '<a>')
      .replace(/<script\b[^>]*\bdata-goatcounter="https:\/\/grugnetto\.goatcounter\.com\/count"[^>]*src="\/\/gc\.zgo\.at\/count\.js"[^>]*><\/script>/i, '')
    : text;
  assert.equal(/https?:\/\//i.test(withoutCreditsLinks), false, `${path.basename(file)} must not require external resources`);
  assert.equal(/\.(?:gif|wav|mp3|ogg|flac|jpg|jpeg|png)\b/i.test(text), false, `${path.basename(file)} must not reference historical/media assets`);
  assert.equal(/\bMath\.random\s*\(/.test(text), false, `${path.basename(file)} must not use Math.random()`);
}

const forbidden = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(gif|wav|mp3|ogg|flac|jpg|jpeg)$/i.test(entry.name)) forbidden.push(path.relative(root, full));
  }
}
walk(root);
assert.deepEqual(forbidden, [], `release contains forbidden historical/media assets: ${forbidden.join(', ')}`);
console.log('ok production-safety: self-contained runtime; no historical media; no external runtime dependencies; no Math.random');
