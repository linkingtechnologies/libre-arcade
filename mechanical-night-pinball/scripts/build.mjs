#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// `npm run build` packages public/ into game/ verbatim (see AGENTS.md's
// public/ -> game/ contract), then generates a SHA256SUMS manifest and runs
// this project's own quarantine/leak guardrails on top of the copy.

import { cp, mkdir, readdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const root = process.cwd();
const game = path.join(root, 'game');
const publicEntries = ['index.html', 'styles.css', 'src', 'assets'];
const rootEntries = ['LICENSE', 'ASSETS_LICENSE', 'LICENSING.md', 'THIRD_PARTY_NOTICES.md'];
const forbiddenExtensions = new Set(['.swf','.zip','.psd','.wav','.mp3','.exe','.dll','.lib','.lha','.rar']);
const forbiddenSegments = new Set(['reference']);

await rm(game, { recursive:true, force:true });
await mkdir(game, { recursive:true });
for (const entry of publicEntries) {
  await cp(path.join(root, 'public', entry), path.join(game, entry), { recursive:true });
}
for (const entry of rootEntries) {
  await cp(path.join(root, entry), path.join(game, entry), { recursive:true });
}
await writeFile(path.join(game, '.nojekyll'), '', 'utf8');

const files = [];
async function scan(dir) {
  for (const ent of await readdir(dir, { withFileTypes:true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(game, full);
    const segments = rel.split(path.sep).map(s => s.toLowerCase());
    if (segments.some(s => forbiddenSegments.has(s))) throw new Error(`Forbidden path in game/: ${rel}`);
    if (ent.isDirectory()) await scan(full);
    else {
      if (forbiddenExtensions.has(path.extname(ent.name).toLowerCase())) throw new Error(`Forbidden file in game/: ${rel}`);
      if (ent.name !== 'SHA256SUMS') files.push({ full, rel: rel.split(path.sep).join('/') });
    }
  }
}
await scan(game);
const publicPlayfield = await readFile(path.join(game, 'assets/graphics/playfield.svg'), 'utf8');
if (/clean-room artwork|preserved geometry|historical art reused/i.test(publicPlayfield)) {
  throw new Error('Technical archaeology text leaked into player-facing playfield artwork');
}
files.sort((a,b) => a.rel.localeCompare(b.rel));
const sums = [];
for (const file of files) {
  const data = await readFile(file.full);
  sums.push(`${crypto.createHash('sha256').update(data).digest('hex')}  ${file.rel}`);
}
await writeFile(path.join(game, 'SHA256SUMS'), sums.join('\n') + '\n', 'utf8');
console.log(`Packaged ${root}\\public -> ${game}`);
