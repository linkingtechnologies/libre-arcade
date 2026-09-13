// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = [
  new URL('../public/index.html', import.meta.url),
  new URL('../public/main.js', import.meta.url),
  new URL('../public/src/ui/i18n.js', import.meta.url)
];

test('player-facing UI contains no archaeology/development jargon', async () => {
  const text = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n').toLowerCase();
  const banned = [
    'faithful historical restoration',
    'restauro storico fedele',
    'clean-room graphics',
    'grafica clean-room',
    'historical audiovisual assets',
    'asset audiovisivi storici',
    'original bubble train level data',
    'livelli originali di bubble train'
  ];
  for (const phrase of banned) assert.equal(text.includes(phrase), false, `player UI leaked: ${phrase}`);
});

test('player help explains goal, controls, specials and audio toggle in both languages', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const main = await readFile(new URL('../public/main.js', import.meta.url), 'utf8');
  const i18n = await readFile(new URL('../public/src/ui/i18n.js', import.meta.url), 'utf8');
  assert.match(html, /id="helpDialog"/);
  assert.match(main, /t\('howToPlay'\)/);
  for (const phrase of [
    'make groups of at least 3',
    'crea gruppi di almeno 3',
    'Options → Audio',
    'Opzioni → Audio',
    'Colour bomb',
    'Bomba colore'
  ]) assert.ok(i18n.includes(phrase), `missing help copy: ${phrase}`);
});
