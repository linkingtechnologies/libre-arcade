#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The table "Where the files stand" of docs/development/CHANGES.md: the SHA-256 of each file of the package's page as the package's own checksum list gives it, and of the file in
// public/ now ("unchanged" when they are the same). Prints the table; with --write it replaces what stands between <!--HASHES--> and <!--/HASHES--> in CHANGES.md.
//   node scripts/changes-table.mjs [--write]

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGES = join(ROOT, 'docs', 'development', 'CHANGES.md');
const recorded = new Map(readFileSync(join(ROOT, 'docs', 'development', 'package', 'SHA256SUMS.txt'), 'utf8').split(/\r?\n/).filter(Boolean)
  .map((line) => { const [hash, name] = line.split(/\s+\*?/); return [name.replace(/^\.\//, ''), hash]; }));
const files = ['index.html', 'styles.css', ...[...recorded.keys()].filter((n) => /^src\/[^/]+\.mjs$/.test(n)).sort(), 'data/sprites.json'];
const rows = ['| File | The package\'s SHA-256 | Now |', '|---|---|---|'];
for (const name of files) {
  const before = recorded.get(name), now = createHash('sha256').update(readFileSync(join(ROOT, 'public', name))).digest('hex');
  rows.push(`| \`public/${name}\` | \`${before}\` | ${now === before ? 'unchanged' : `\`${now}\``} |`);
}
const table = rows.join('\n');
if (process.argv.includes('--write')) {
  const text = readFileSync(CHANGES, 'utf8');
  const start = text.indexOf('<!--HASHES-->'), end = text.indexOf('<!--/HASHES-->');
  if (start < 0) throw new Error('CHANGES.md has no <!--HASHES--> marker');
  const stop = end < 0 ? start + '<!--HASHES-->'.length : end + '<!--/HASHES-->'.length;
  writeFileSync(CHANGES, `${text.slice(0, start)}<!--HASHES-->\n${table}\n<!--/HASHES-->${text.slice(stop)}`);
  console.log(`CHANGES.md: ${files.length} rows`);
} else console.log(table);
