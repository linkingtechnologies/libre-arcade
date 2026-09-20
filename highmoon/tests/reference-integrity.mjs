// SPDX-License-Identifier: GPL-3.0-or-later
// Node port of the source-preservation and media checks of the delivered
// scripts/verify_commit.py: the preserved upstream files must still match their
// recorded SHA-256, the files withheld on purpose must stay absent, and no
// historical graphics or sounds may appear anywhere in this folder.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = path.join(root, 'reference');
const upstream = path.join(bundle, 'reference', 'HighMoon');

for (const rel of [
  'specs/audit-phase4/audit/asset_decision.csv',
  'reference/oracle/native_headless/src/native_runner.cpp',
  'reference/oracle/native_headless/samples/native-ai-seed54321.jsonl.gz',
]) assert.ok(fs.existsSync(path.join(root, rel)), `${rel} is missing`);

const manifest = JSON.parse(fs.readFileSync(path.join(bundle, 'ORIGINAL_FILE_MANIFEST.json'), 'utf8'));
let verified = 0;
for (const entry of manifest) {
  const file = path.join(upstream, entry.path.replace(/^HighMoon\//, ''));
  if (entry.in_public_source_only) {
    assert.ok(fs.existsSync(file), `preserved upstream file is missing: ${entry.path}`);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.equal(digest, entry.sha256, `preserved upstream file changed: ${entry.path}`);
    verified++;
  } else {
    assert.equal(fs.existsSync(file), false, `withheld upstream file must stay absent: ${entry.path}`);
  }
}
assert.ok(verified >= 20, `expected at least 20 preserved upstream files, verified ${verified}`);

const media = /\.(tar|tar\.gz|wav|gif|mp3|ogg|flac|jpg|jpeg)$/;
const offenders = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'game' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const rel = path.relative(root, full).split(path.sep).join('/').toLowerCase();
    if (media.test(rel) || /(^|\/)(gfx|snd)\//.test(rel) || /(^|\/)icon\.png$/.test(rel)) offenders.push(rel);
  }
})(root);
assert.deepEqual(offenders, [], `historical media found: ${offenders.join(', ')}`);

console.log(`ok reference-integrity: ${verified} preserved upstream files match their SHA-256; withheld files absent; no historical media`);
