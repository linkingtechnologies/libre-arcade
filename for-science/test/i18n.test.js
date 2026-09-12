import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_LANGUAGE,
  I18n,
  normalizeLanguage,
  readLanguagePreference,
  translate,
  writeLanguagePreference,
} from '../public/src/ui/i18n.js';

const html = readFileSync('public/index.html', 'utf8');
const controller = readFileSync('public/src/core/game-controller.js', 'utf8');
const renderer = readFileSync('public/src/render/canvas-renderer.js', 'utf8');

function fakeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test('English is the historical fallback and Italian browser language is detected', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(normalizeLanguage('en-US'), 'en');
  assert.equal(normalizeLanguage('it-IT'), 'it');
  assert.equal(normalizeLanguage('fr-FR'), 'en');
  assert.equal(readLanguagePreference(fakeStorage(), 'it-IT'), 'it');
  assert.equal(readLanguagePreference(fakeStorage(), 'de-DE'), 'en');
});

test('saved language preference wins and can be persisted safely', () => {
  const storage = fakeStorage({ 'forscience.language': 'en' });
  assert.equal(readLanguagePreference(storage, 'it-IT'), 'en');
  assert.equal(writeLanguagePreference('it', storage), 'it');
  assert.equal(readLanguagePreference(storage, 'en-US'), 'it');
});

test('core player-facing strings exist in both English and Italian', () => {
  const keys = [
    'game.ready', 'game.tipHuman', 'game.tipDemo', 'game.newBoard', 'game.timeout',
    'game.drXWon', 'game.drZWon', 'game.youWon', 'game.gameOver', 'game.thanks',
    'game.youLose', 'game.move', 'asset.shield', 'asset.cow', 'asset.meteorite',
    'asset.rocket', 'asset.laser',
  ];
  for (const key of keys) {
    assert.notEqual(translate('en', key), key, `missing English ${key}`);
    assert.notEqual(translate('it', key), key, `missing Italian ${key}`);
    assert.notEqual(translate('en', key), translate('it', key), `untranslated ${key}`);
  }
});

test('menus expose an English/Italian selector and translatable content', () => {
  assert.match(html, /id="language"/);
  assert.match(html, /<option value="en">English<\/option>/);
  assert.match(html, /<option value="it">Italiano<\/option>/);
  assert.match(html, /data-i18n="menu\.start"/);
  assert.match(html, /data-i18n="help\.match"/);
  assert.match(html, /data-i18n-html="help\.controls"/);
});

test('gameplay text is routed through i18n without changing historical PlayerState names', () => {
  assert.match(controller, /this\.t\('game\.ready'\)/);
  assert.match(controller, /this\.t\(`asset\.\$\{ASSETS\[asset\]\.id\}`\)/);
  assert.match(controller, /this\.t\('game\.timeout'\)/);
  assert.match(renderer, /this\.t\('game\.move'\)/);
});

test('I18n instance switches language deterministically without persistence when requested', () => {
  const i18n = new I18n('en');
  assert.equal(i18n.t('menu.start'), 'Start Game');
  i18n.setLanguage('it', { persist: false });
  assert.equal(i18n.t('menu.start'), 'Inizia partita');
});
