// The page around the game: what is deployed, that it is what the page needs and nothing else, the preferences, the sound's
// suspension, and the structure of the shell that the tests cannot run in a browser (the browser itself was driven by hand, see
// PROVENANCE.md).
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir, stat } from 'node:fs/promises';
import { DEFAULT_UI_PREFS, normalizeUiPrefs, loadUiPrefs, saveUiPrefs, resetUiPrefs, UI_PREFS_KEY } from '../public/src/ui-preferences.js';
import { LawnAudioEngine, MASTER_GAIN } from '../public/src/audio-engine.js';

const here = (path) => new URL(path, import.meta.url);
const text = (path) => readFile(here(path), 'utf8');
class MemoryStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
async function walk(url, prefix = '') {
  const out = [];
  for (const entry of await readdir(url, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...await walk(new URL(`${entry.name}/`, url), `${prefix}${entry.name}/`));
    else out.push(prefix + entry.name);
  }
  return out;
}

test('preferences: English and sound on by default, bad values are replaced, a round trip and a reset', () => {
  assert.deepEqual(normalizeUiPrefs(), DEFAULT_UI_PREFS);
  assert.deepEqual(normalizeUiPrefs({ language: 'it', audio: false }), { language: 'it', audio: false });
  assert.deepEqual(normalizeUiPrefs({ language: 'xx', audio: 'no' }), { language: 'en', audio: true });
  const storage = new MemoryStorage();
  saveUiPrefs({ language: 'it', audio: false }, storage);
  assert.deepEqual(loadUiPrefs(storage), { language: 'it', audio: false });
  assert.deepEqual(resetUiPrefs(storage), DEFAULT_UI_PREFS);
  assert.equal(storage.getItem(UI_PREFS_KEY), null);
  storage.setItem(UI_PREFS_KEY, '{');
  assert.deepEqual(loadUiPrefs(storage), DEFAULT_UI_PREFS, 'unreadable storage falls back');
});

test('the shell has the touch pad, the two action buttons and START, the toolbar and a link back to the arcade', async () => {
  const html = await text('../public/index.html');
  for (const control of ['up', 'down', 'left', 'right', 'a', 'b', 'start']) assert.match(html, new RegExp(`data-control="${control}"`));
  for (const id of ['audioToggle', 'languageToggle', 'infoButton', 'panelBackdrop', 'infoPanel']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(await text('../public/app.js'), /linkingtechnologies\.github\.io\/libre-arcade/);
});

test('the information panel stops the game and the sound while it is open, and gives the focus back', async () => {
  const app = await text('../public/app.js');
  assert.match(app, /!panelBackdrop\.classList\.contains\('open'\)/);
  assert.match(app, /suspendForUi\(true\)/);
  assert.match(app, /appRoot\.setAttribute\('inert', ''\)/);
  assert.match(app, /appRoot\.removeAttribute\('inert'\)/);
  assert.match(app, /panelReturnFocus/);
  assert.match(app, /suspendForVisibility\(document\.hidden\)/);
});

test('the sound is suspended for the panel and for a hidden page independently', async () => {
  const audio = new LawnAudioEngine();
  assert.equal(audio.uiSuspended, false);
  await audio.suspendForUi(true); assert.equal(audio.uiSuspended, true);
  await audio.suspendForVisibility(true); assert.equal(audio.visibilitySuspended, true);
  await audio.suspendForUi(false); assert.equal(audio.uiSuspended, false); assert.equal(audio.visibilitySuspended, true);
  await audio.suspendForVisibility(false); assert.equal(audio.visibilitySuspended, false);
  assert.equal(MASTER_GAIN, 1.5);
});

test('the deployed tree is the page, its modules and its three data files, and no ROM, source, test or tool', async () => {
  const files = await walk(here('../public/'));
  assert.deepEqual(files.filter((f) => !f.startsWith('src/')).sort(), ['app.js', 'assets/done.rle', 'assets/patterns.chr', 'assets/title.rle', 'index.html']);
  for (const f of files) assert.doesNotMatch(f, /(^|\/)(reference|audit|tests?|tools|scripts)(\/|$)|\.nes$|\.asm$|\.exe$/i);
});

test('every JavaScript file of the page carries the licence identifier, and every import and fetched file exists', async () => {
  const names = ['app.js', ...(await readdir(here('../public/src/'))).filter((n) => n.endsWith('.js')).map((n) => `src/${n}`)];
  for (const name of names) {
    const url = here(`../public/${name}`);
    const source = await readFile(url, 'utf8');
    assert.match(source, /^\/\/ SPDX-License-Identifier: GPL-3\.0-or-later/m, `${name} has no SPDX line`);
    for (const m of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) assert.ok((await stat(new URL(m[1], url))).isFile(), `${name} imports ${m[1]}`);
  }
  const app = await text('../public/app.js');
  for (const m of app.matchAll(/bytes\('(\.\/assets\/[^']+)'\)/g)) assert.ok((await stat(here(`../public/${m[1].slice(2)}`))).isFile(), `missing ${m[1]}`);
});

test('the page loads nothing from outside but the counter that the whole collection uses, and uses no eval', async () => {
  const html = await text('../public/index.html');
  const remote = [...html.matchAll(/(?:src|href)="((?:https?:)?\/\/[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(remote, ['//gc.zgo.at/count.js']);
  assert.match(html, /<script data-goatcounter="https:\/\/grugnetto\.goatcounter\.com\/count" async src="\/\/gc\.zgo\.at\/count\.js"><\/script>\s*<\/body>/);
  for (const name of ['app.js', ...(await readdir(here('../public/src/'))).filter((n) => n.endsWith('.js')).map((n) => `src/${n}`)]) {
    const source = await text(`../public/${name}`);
    assert.doesNotMatch(source, /\beval\s*\(|new Function\(|document\.write/, name);
    assert.doesNotMatch(source, /https?:\/\/(?!linkingtechnologies\.github\.io)/, `${name} has a remote address`);
  }
});

test('the controls the panel announces are the ones the page handles', async () => {
  const app = await text('../public/app.js');
  for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyZ', 'KeyX', 'Enter']) assert.match(app, new RegExp(code));
  assert.match(app, /Arrow keys|frecce/i);
});

test('what a player reads (the page and the panel\'s text, English and Italian) has no development vocabulary', async () => {
  const html = await text('../public/index.html');
  const app = await text('../public/app.js');
  const strings = app.slice(app.indexOf('const STRINGS = {'), app.indexOf('const audioToggle'));
  assert.ok(strings.length > 500, 'the panel text was found');
  const visible = `${html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script[\s\S]*?<\/script>/g, '')}\n${strings}`;
  assert.doesNotMatch(visible, /oracle|prng|sha-?256|kernel|\bNMI\b|\bROM\b|provenance|archaeolog|debug|checksum/i);
});
