import test from 'node:test';
import assert from 'node:assert/strict';
import { storageGet, storageSet, storageGetNumber } from '../public/src/storage.js';

test('storage wrapper survives blocked browser storage', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('SecurityError'); },
  });
  try {
    assert.equal(storageGet('x', 'fallback'), 'fallback');
    assert.equal(storageGetNumber('x', 7), 7);
    assert.equal(storageSet('x', 1), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('numeric storage falls back on corrupted values', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => 'not-a-number', setItem() {} };
  try {
    assert.equal(storageGetNumber('score', 0), 0);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});
