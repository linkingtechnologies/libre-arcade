import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readMusicPreference } from '../public/src/ui/audio.js';

const html = readFileSync('public/index.html', 'utf8');
const app = readFileSync('public/src/ui/app.js', 'utf8');
const css = readFileSync('public/styles.css', 'utf8');

test('production shell keeps menus inert until required assets are ready', () => {
  assert.match(html, /id="main-menu"[^>]*hidden/);
  assert.match(html, /aria-busy="true"/);
  assert.match(app, /setAttribute\('aria-busy', 'false'\)/);
});

test('browser-only help is available without changing gameplay rules', () => {
  assert.match(html, /id="help"[^>]*>How to Play</);
  assert.match(html, /Match 3 or more cells/);
  assert.match(html, /Ctrl\/Cmd \+ F/);
  assert.match(css, /\.help-card/);
});

test('production page includes basic metadata and a restrictive same-origin CSP', () => {
  assert.match(html, /<title>For Science!<\/title>/);
  assert.match(html, /name="description"/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /object-src 'none'/);
});

test('fullscreen state is synchronized after browser-driven changes', () => {
  assert.match(app, /fullscreenchange/);
  assert.match(app, /#syncFullscreenToggle/);
});

test('music preference defaults safely when Web Storage is unavailable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('storage blocked'); },
  });
  try {
    assert.equal(readMusicPreference(true), true);
    assert.equal(readMusicPreference(false), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});
