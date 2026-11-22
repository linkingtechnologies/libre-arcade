#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Generates public/story/trapped.en.html and trapped.it.html from the unmodified
// source/Trapped.original.html. English = original + theme link + accessibility
// script. Italian = same, plus translations/it.json applied on top (kept separate).
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildStory } from './story-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_SHA256 = 'dbb8f4bf5344a995116b94ddfe0ef01a3788825379620fe0b990f19f30de72ca';

const html = await readFile(`${root}source/Trapped.original.html`, 'utf8');
const sha = createHash('sha256').update(await readFile(`${root}source/Trapped.original.html`)).digest('hex');
if (sha !== SOURCE_SHA256) throw new Error(`source/Trapped.original.html was modified (sha256 ${sha})`);

const layer = JSON.parse(await readFile(`${root}translations/it.json`, 'utf8'));
const injectHead = '<link rel="stylesheet" href="theme.css">';
const injectBody = '<script src="enhance.js"></script>';

await writeFile(`${root}public/story/trapped.en.html`, buildStory(html, { injectHead, injectBody }));
await writeFile(`${root}public/story/trapped.it.html`, buildStory(html, { layer, injectHead, injectBody }));
console.log('built public/story/trapped.en.html and trapped.it.html');
