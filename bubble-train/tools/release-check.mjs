// SPDX-License-Identifier: GPL-3.0-or-later
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const p = join(dir, entry);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

async function verifyManifest(manifestPath, baseDir) {
  const lines = (await readFile(manifestPath, 'utf8')).split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^([0-9a-f]{64})\s{2}(.+)$/i);
    if (!m) throw new Error(`Malformed manifest line in ${manifestPath}: ${line}`);
    const p = resolve(baseDir, m[2]);
    const digest = createHash('sha256').update(await readFile(p)).digest('hex');
    if (digest !== m[1].toLowerCase()) throw new Error(`SHA mismatch: ${relative(root,p)}`);
  }
  return lines.length;
}

const publicRoot = join(root, 'public');
const refs = await verifyManifest(join(root, 'reference/MANIFEST.sha256'), root);
const historical = await verifyManifest(join(publicRoot, 'data/original-levels/MANIFEST.sha256'), join(publicRoot, 'data/original-levels/files'));
const clean = await verifyManifest(join(publicRoot, 'assets-clean/MANIFEST.sha256'), publicRoot);

const runnableFiles = [join(publicRoot, 'index.html'), join(publicRoot, 'main.js'), ...await walk(join(publicRoot, 'src'))].filter(p => /\.(?:js|html|css|gms|lvl|xml)$/i.test(p));
const forbidden = [];
for (const p of runnableFiles) {
  const text = await readFile(p, 'utf8');
  for (const pattern of [/\/reference\//ig, /\.(?:wav|ogg|mp3|flac)\b/ig, /(?:original|historical).+\.(?:png|jpe?g|gif)\b/ig]) {
    if (pattern.test(text)) forbidden.push(relative(root,p));
  }
}
if (forbidden.length) throw new Error(`Runnable references quarantined media: ${[...new Set(forbidden)].join(', ')}`);

const themes = ['default','arctic','beach','mexico','mountains','sea','sky','space'];
for (const theme of themes) await stat(join(publicRoot, `assets-clean/themes/${theme}/background.svg`));

console.log(JSON.stringify({ referenceHashes: refs, historicalDataHashes: historical, cleanAssetHashes: clean, runnableFilesScanned: runnableFiles.length, themes: themes.length, quarantineReferences: 0 }, null, 2));
