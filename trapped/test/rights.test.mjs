// SPDX-License-Identifier: GPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/rights.mjs', import.meta.url));

test('every file under public/ has a cleared rights rule and the register is current', () => {
  const out = execFileSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.match(out, /Rights check passed/);
});

test('no restricted asset is declared as distributed', () => {
  const m = JSON.parse(readFileSync(new URL('../specs/asset-manifest.json', import.meta.url), 'utf8'));
  for (const f of m.files) assert.ok(['ok', 'ok-with-note'].includes(f.status), `${f.path}: ${f.status}`);
  assert.ok(!m.files.some((f) => /\.(gif|png|jpg|mp3|ogg|wav)$/i.test(f.path)), 'no binary media is shipped');
});
