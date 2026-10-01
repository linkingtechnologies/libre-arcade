import test from 'node:test';
import assert from 'node:assert/strict';

class Gradient { addColorStop(){} }
const noop = () => {};
const ctx = new Proxy({
  createLinearGradient: () => new Gradient(),
  createRadialGradient: () => new Gradient(),
  measureText: text => ({width:String(text).length*9}),
  roundRect: noop,
}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (typeof prop === 'symbol') return target[prop];
    return noop;
  },
  set(target, prop, value) { target[prop]=value; return true; }
});

const handlers = new Map();
const canvas = {
  getContext: () => ctx,
  addEventListener: (name, fn) => handlers.set(name, fn),
  getBoundingClientRect: () => ({left:0, top:0, width:800, height:600}),
  setPointerCapture: noop,
  releasePointerCapture: noop,
};
const store = new Map();
globalThis.document = {documentElement:{lang:'en'}, getElementById: id => id === 'game' ? canvas : null};
globalThis.window = {open: (...args) => { globalThis.__opened = args; }};
globalThis.localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k,v) => store.set(k,String(v)),
  removeItem: k => store.delete(k),
};
globalThis.requestAnimationFrame = fn => { globalThis.__render = fn; return 1; };

await import(`../public/src/app.js?smoke=${Date.now()}`);

test('first render completes with tile images still unavailable', () => {
  assert.doesNotThrow(() => globalThis.__render(performance.now()));
});

test('app module initializes against browser API surface', () => {
  assert.equal(typeof globalThis.__render, 'function');
  assert.ok(handlers.has('pointermove'));
  assert.ok(handlers.has('pointerdown'));
  assert.ok(handlers.has('pointerup'));
  assert.ok(handlers.has('contextmenu'));
});

test('Credits Libre Arcade link opens the project site', () => {
  const pointerUp=handlers.get('pointerup');
  // Open Credits from its historical right-hand mode slot.
  pointerUp({clientX:650,clientY:285,pointerId:1});
  // Click the visible underlined Libre Arcade link.
  pointerUp({clientX:400,clientY:490,pointerId:1});
  assert.deepEqual(globalThis.__opened,[
    'https://linkingtechnologies.github.io/libre-arcade/',
    '_blank',
    'noopener,noreferrer'
  ]);
});
