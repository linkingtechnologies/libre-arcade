'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

class FakeContext {
  setTransform() {}
  drawImage() {}
  fillRect() {}
  save() {}
  restore() {}
}

class FakeElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.hidden = false;
    this.children = [];
    this.listeners = new Map();
    this.style = {};
    this.dataset = {};
    this.className = '';
    this.textContent = '';
    this.type = '';
    this.width = 0;
    this.height = 0;
    this._ctx = new FakeContext();
  }
  getContext() { return this._ctx; }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type, extra = {}) {
    const event = {preventDefault() {}, pointerId: 1, ...extra};
    for (const fn of this.listeners.get(type) || []) fn(event);
  }
  click() { this.dispatch('click'); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = [...children]; }
  querySelectorAll(selector) {
    if (selector === '[data-dir]') return this.children.filter(c => c.dataset.dir);
    return [];
  }
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() { return false; }
}

function buildPad(id) {
  const pad = new FakeElement('div', id);
  for (const dir of ['up', 'left', 'down', 'right']) {
    const button = new FakeElement('button');
    button.dataset.dir = dir;
    pad.appendChild(button);
  }
  return pad;
}

function installFakeBrowser() {
  const ids = {
    game: new FakeElement('canvas', 'game'),
    overlay: new FakeElement('section', 'overlay'),
    panel: new FakeElement('div', 'panel'),
    'touch-controls': new FakeElement('section', 'touch-controls'),
    'pad-p1': buildPad('pad-p1'),
    'pad-p2': buildPad('pad-p2'),
    status: new FakeElement('div', 'status'),
    'game-menu-button': new FakeElement('button', 'game-menu-button')
  };
  ids['touch-controls'].hidden = true;
  ids['pad-p2'].hidden = true;
  ids['game-menu-button'].hidden = true;

  const documentListeners = new Map();
  const windowListeners = new Map();
  const document = {
    hidden: false,
    documentElement: {lang: 'en', clientWidth: 800, clientHeight: 600},
    getElementById(id) { return ids[id]; },
    createElement(tag) { return new FakeElement(tag); },
    addEventListener(type, fn) { documentListeners.set(type, fn); }
  };
  const window = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    close() {},
    addEventListener(type, fn) { windowListeners.set(type, fn); }
  };
  const storage = new Map();
  const localStorage = {
    getItem(k) { return storage.has(k) ? storage.get(k) : null; },
    setItem(k, v) { storage.set(k, String(v)); }
  };

  class FakeImage {
    set src(value) {
      this._src = value;
      queueMicrotask(() => { if (this.onload) this.onload(); });
    }
    get src() { return this._src; }
  }

  Object.assign(globalThis, {
    document,
    window,
    localStorage,
    Image: FakeImage,
    requestAnimationFrame: () => 1
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: {language: 'en-US'}, configurable: true, writable: true
  });
  return {ids, windowListeners, documentListeners};
}

function clearModule(relativePath) {
  const resolved = require.resolve(relativePath);
  delete require.cache[resolved];
  return resolved;
}

test('browser shell initializes, exposes bilingual menu flow, and hides P2 touch pad in single player', async () => {
  const env = installFakeBrowser();
  globalThis.TerramancersCore = require('../public/src/core.js');
  globalThis.TerramancersBrowserUtils = require('../public/src/browser-utils.js');
  clearModule('../public/src/tiledefs.js');
  require('../public/src/tiledefs.js');
  clearModule('../public/src/app.js');
  require('../public/src/app.js');

  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  const panel = env.ids.panel;
  assert.equal(panel.children.length, 6);
  assert.equal(panel.children[0].textContent, 'Single Player');
  assert.equal(panel.children[1].textContent, 'Multiplayer');
  assert.equal(panel.children[2].textContent, 'Instructions');

  panel.children[0].click();
  assert.equal(panel.children[0].textContent, 'Easy');
  assert.equal(panel.children.length, 4);
  panel.children[0].click();
  assert.equal(env.ids.overlay.hidden, true);
  assert.equal(env.ids['game-menu-button'].hidden, false);
  assert.equal(env.ids['pad-p1'].hidden, false);
  assert.equal(env.ids['pad-p2'].hidden, true);

  env.ids['game-menu-button'].click();
  assert.equal(env.ids.overlay.hidden, false);
  assert.equal(panel.children[1].textContent, 'Multiplayer');

  panel.children[1].click();
  assert.equal(env.ids.overlay.hidden, true);
  assert.equal(env.ids['pad-p2'].hidden, false);

  env.ids['game-menu-button'].click();
  panel.children[5].click();
  assert.equal(panel.children[0].textContent, 'Giocatore singolo');
  assert.equal(panel.children[2].textContent, 'Istruzioni');
});
