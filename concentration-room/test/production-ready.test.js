import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadPreferences, savePreferences, resetPreferences, DEFAULT_PREFERENCES, STORAGE_KEY } from '../public/src/preferences.js';
import { computeCanvasCssSize } from '../public/src/viewport.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

const storage = new MemoryStorage();
assert.deepEqual(loadPreferences(storage), DEFAULT_PREFERENCES);
assert.deepEqual(savePreferences({ language: 'it', difficulty: 4 }, storage), { language: 'it', difficulty: 4 });
assert.deepEqual(loadPreferences(storage), { language: 'it', difficulty: 4 });
assert.deepEqual(savePreferences({ language: 'xx', difficulty: 99 }, storage), { language: 'en', difficulty: 4 });
storage.setItem(STORAGE_KEY, '{not-json');
assert.deepEqual(loadPreferences(storage), DEFAULT_PREFERENCES);
savePreferences({ language: 'it', difficulty: 2 }, storage);
assert.deepEqual(resetPreferences(storage), DEFAULT_PREFERENCES);
assert.equal(storage.getItem(STORAGE_KEY), null);

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/src/app.js', import.meta.url), 'utf8');
const notices = fs.readFileSync(new URL('../THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');

for (const id of ['help', 'credits', 'audio', 'language', 'infoPanel', 'panelReset', 'panelClose']) {
  assert.match(html, new RegExp(`id=["']${id}["']`));
}
assert.match(html, /overflow:\s*hidden/);
assert.match(html, /max-height:\s*100%/);
assert.match(html, /@media \(max-width: 420px\)/);
assert.match(html, /@media \(max-height: 560px\)/);
assert.deepEqual(computeCanvasCssSize(900, 510), { width: 512, height: 480, scale: 2 });
assert.deepEqual(computeCanvasCssSize(384, 600), { width: 384, height: 360, scale: 1.5 });
assert.match(app, /ResizeObserver\(fitGameCanvases\)/);
assert.doesNotMatch(html, /SHA-256|oracle|PRNG|Terriblegate|\bM[1-9]\b/i);
assert.match(app, /showInfo\('help'\)/);
assert.match(app, /showInfo\('credits'\)/);
assert.match(app, /resetPreferences\(\)/);
assert.match(app, /saveUiPreferences\(\)/);
assert.match(app, /panelVisible\(\)/);
assert.match(app, /No AI-generated artwork is used/);
assert.match(notices, /Damian Yerrick/);
assert.match(notices, /Sara Crickard/);
assert.match(notices, /No AI-generated replacement art is used/);

console.log('All Concentration Room production-ready tests passed.');
