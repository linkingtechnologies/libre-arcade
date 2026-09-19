import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/config/how-to-play/manifest.json'), 'utf8'));
const board = JSON.parse(fs.readFileSync(path.join(root, 'public/boards/grugnetto-32-v1.4/board.json'), 'utf8'));
const locales = Object.fromEntries(manifest.locales.map(code => [code, JSON.parse(fs.readFileSync(path.join(root, 'public/config/how-to-play/i18n', `${code}.json`), 'utf8'))]));

test('how-to-play configuration mirrors the frozen v1.4 ruleset values', () => {
  assert.equal(manifest.sourceBoardId, board.id);
  assert.equal(manifest.sourceBoardContentVersion, board.contentVersion);
  assert.equal(manifest.variables.startingCash, board.startingCash);
  assert.equal(manifest.variables.passStartSalary, board.passStartSalary);
  assert.equal(manifest.variables.detentionTurns, board.detentionTurns);
  assert.equal(manifest.variables.detentionFee, board.detentionFee);
  assert.equal(manifest.variables.maxEmbellishments, board.development.maxEmbellishments);
  assert.equal(manifest.variables.sellEmbellishmentPercent, board.development.sellPercent);
  assert.equal(manifest.variables.worldCount, board.worlds.length);
  assert.equal(manifest.variables.portalCount, board.spaces.filter(s => s.type === 'hub').length);
  assert.equal(manifest.variables.specialPlaceCount, board.spaces.filter(s => s.type === 'service').length);
});

test('how-to-play is complete in IT EN FR DE with identical section coverage', () => {
  assert.deepEqual(manifest.locales, ['it','en','fr','de']);
  for (const code of manifest.locales) {
    const content = locales[code];
    assert.ok(content.title);
    assert.ok(content.subtitle);
    assert.deepEqual(Object.keys(content.sections), manifest.sections);
    for (const id of manifest.sections) {
      assert.ok(content.sections[id].title, `${code}:${id} missing title`);
      assert.ok(Array.isArray(content.sections[id].paragraphs) && content.sections[id].paragraphs.length > 0, `${code}:${id} missing paragraphs`);
    }
  }
});

test('how-to-play localized copy contains only declared placeholders', () => {
  const declared = new Set(Object.keys(manifest.variables));
  for (const [code, content] of Object.entries(locales)) {
    const text = JSON.stringify(content);
    const keys = [...text.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)].map(m => m[1]);
    for (const key of keys) assert.ok(declared.has(key), `${code} uses undeclared placeholder ${key}`);
  }
});

test('player manual uses the current Grugnetto game vocabulary', () => {
  const all = JSON.stringify(locales);
  assert.match(all, /Luoghi|Places|Lieux|Orte/);
  assert.match(all, /Portali|Portals|Portails|Portale/);
});
