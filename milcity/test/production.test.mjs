// What ships: the licence (GPL-3.0-only, as the original's files say, never "or later"), the tree that is deployed, and what the page
// loads. The oracle and the reference are not part of it.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const text = (path) => readFileSync(here(path), 'utf8');
const walk = (dir, prefix = '') => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`, `${prefix}${e.name}/`) : [prefix + e.name]));

test('the licence is GPL-3.0-only everywhere it is declared, because the original\'s files grant version 3 and nothing about a later one', () => {
  const pkg = JSON.parse(text('../package.json'));
  assert.equal(pkg.license, 'GPL-3.0-only');
  assert.match(text('../LICENSE'), /GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/);
  assert.ok(text('../LICENSE').split('\n').length > 600, 'the full text of the licence');
  for (const file of walk(here('../public')).filter((f) => f.endsWith('.js'))) {
    const source = text(`../public/${file}`);
    assert.match(source, /^\/\/ SPDX-License-Identifier: GPL-3\.0-only$/m, `${file} has no SPDX line`);
    assert.doesNotMatch(source, /or-later|or later|any later version/i, `${file} must not say "or later"`);
  }
  for (const file of ['../README.md', '../THIRD_PARTY_NOTICES.md']) assert.doesNotMatch(text(file).replace(/never\s+"or later"[^.]*\./gi, ''), /GPL-3\.0-or-later/, `${file} declares the port "or later"`);
});

test('the deployed tree is the page and its modules: no ROM-like binary, jar, class, zip or picture, and nothing of the oracle or the reference', () => {
  const files = walk(here('../public'));
  assert.ok(files.includes('index.html'));
  for (const file of files) {
    assert.doesNotMatch(file, /\.(png|jpe?g|gif|bmp|jar|jad|class|zip|java|nes|exe|wav|mp3|ogg)$/i, `${file} must not be deployed`);
    assert.doesNotMatch(file, /(^|\/)(reference|test|tests|tools|java-oracle|docs|specs|scripts)(\/|$)/i, `${file} is not part of the page`);
  }
  assert.deepEqual(files.filter((f) => !f.endsWith('.js') && f !== 'index.html'), []);
});

test('the page loads nothing from outside but the counter that the whole collection uses, and uses no eval', () => {
  const html = text('../public/index.html');
  const remote = [...html.matchAll(/(?:src|href)="((?:https?:)?\/\/[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(remote, ['//gc.zgo.at/count.js']);
  assert.match(html, /<script data-goatcounter="https:\/\/grugnetto\.goatcounter\.com\/count" async src="\/\/gc\.zgo\.at\/count\.js"><\/script>\s*<\/body>/);
  for (const file of walk(here('../public')).filter((f) => f.endsWith('.js'))) {
    const source = text(`../public/${file}`);
    assert.doesNotMatch(source, /\beval\s*\(|new Function\(|document\.write/, file);
    assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|WebSocket/, `${file} must not call the network`);
    assert.doesNotMatch(source, /https?:\/\/(?!linkingtechnologies\.github\.io)/, `${file} has a remote address`);
  }
});

test('every import of the page exists', () => {
  for (const file of walk(here('../public/src')).filter((f) => f.endsWith('.js'))) {
    for (const m of text(`../public/src/${file}`).matchAll(/from\s*['"](\.[^'"]+)['"]/g)) {
      const target = new URL(m[1], new URL(`../public/src/${file}`, import.meta.url));
      assert.doesNotThrow(() => readFileSync(target), `${file} imports ${m[1]}`);
    }
  }
  assert.match(text('../public/index.html'), /src="src\/ui\/app\.js"/);
});

test('what a player reads has no development vocabulary', () => {
  const app = text('../public/src/ui/app.js');
  const strings = app.slice(app.indexOf('const T={'), app.indexOf('const ACTION_TEXT='));
  assert.ok(strings.length > 2000, 'the menu and help texts were found');
  assert.doesNotMatch(strings, /oracle|prng|sha-?256|provenance|archaeolog|debug|checksum|audit|milestone|\bM\d+\b/i);
});

test('the hidden key combination of the original is in the page and is not in its instructions', () => {
  const app = text('../public/src/ui/app.js');
  assert.match(app, /heldKeys\.has\('q'\)&&heldKeys\.has\('z'\)&&heldKeys\.has\('x'\)/);
  const strings = app.slice(app.indexOf('const T={'), app.indexOf('const ACTION_TEXT='));
  assert.doesNotMatch(strings, /free building|cheat|hidden|gratis/i);
});
