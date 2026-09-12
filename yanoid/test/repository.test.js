import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { MAP_FACTORIES } from '../public/src/maps.js';
import { POWERUP_DEFS } from '../public/src/core.js';

const root = resolve(import.meta.dirname, '..');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

test('public reference manifest records the audited upstream SHA-256 values', () => {
  const sums = readFileSync(resolve(root, 'reference/UPSTREAM_SHA256SUMS'), 'utf8');
  assert.match(sums, /dc9c71d0f507aa8cdc86e9d830e656d78aab952bff772ff2487409487e49f5d1\s+yanoid-0\.3\.0\.tar\.gz/);
  assert.match(sums, /afa44924d13b10b9e20cd418cdd4d6f8101fb1448808144e514b0c5d5c787a90\s+yanoid-0\.3\.5\.tar\.gz/);
});

test('repository contains no raw upstream archives, the 0.3.5 tree, or the ten specifically ambiguous-provenance files', () => {
  const files = walk(root).map(path => relative(root, path).replaceAll('\\\\', '/'));
  const forbidden = files.filter(rel =>
    rel.endsWith('.tar.gz') ||
    rel.startsWith('reference/yanoid-0.3.5/') ||
    /(^|\/)yanoid\.xm$/i.test(rel) ||
    /(^|\/)(fire|menu_choose|menu_move|peep|pop|powerup_bad|powerup_collect)\.wav$/i.test(rel) ||
    /(^|\/)ConsoleFont\.png$/i.test(rel) ||
    /(^|\/)LargeFont\.png$/i.test(rel)
  );
  assert.deepEqual(forbidden, []);
});

test('the rest of the verified 0.3.0 source tree, including reused-code areas, is preserved for archaeology', () => {
  for (const rel of [
    'reference/yanoid-0.3.0/COPYING', 'reference/yanoid-0.3.0/README', 'reference/yanoid-0.3.0/CREDITS',
    'reference/yanoid-0.3.0/src/ConsoleSource/CON_console.c', 'reference/yanoid-0.3.0/src/entity.cc',
    'reference/yanoid-0.3.0/data/sounds/bang_on_metal.wav', 'reference/yanoid-0.3.0.SHA256SUMS'
  ]) assert.ok(existsSync(resolve(root, rel)), rel);
});

test('every contest sprite referenced by the JS map rewrite exists', () => {
  for (const make of Object.values(MAP_FACTORIES)) {
    const map = make();
    for (const e of map.entities) {
      if (!e.sprite) continue;
      const path = e.sprite.startsWith('../powerups/')
        ? resolve(root, 'public/assets/powerups', e.sprite.split('/').at(-1))
        : resolve(root, 'public/assets/bricks', e.sprite);
      assert.ok(existsSync(path), `missing ${path}`);
    }
  }
});

test('all gameplay sprites and entrypoint files required by the static build exist', () => {
  for (const p of POWERUP_DEFS) assert.ok(existsSync(resolve(root, 'public/assets/powerups', p.sprite)), p.sprite);
  for (const rel of [
    'public/assets/fonts/yanoid-web-5x7.png', 'public/assets/balls/red.png', 'public/assets/paddles/square2_50.png', 'public/assets/paddles/square2_75.png',
    'public/assets/paddles/square2_100.png', 'public/assets/shots/greenball.png', 'public/assets/shots/penetrating.png',
    'public/index.html', 'public/style.css', 'public/src/app.js', 'public/src/game.js', 'public/src/core.js', 'public/src/maps.js', 'public/src/audio.js', 'public/src/bitmap-font.js', 'public/src/storage.js',
    'LICENSE', 'THIRD_PARTY_NOTICES.md', 'reference/README.md', 'reference/UPSTREAM_SHA256SUMS',
    'specs/ARCHAEOLOGY.md', 'specs/PARITY.md', 'specs/PRESENTATION_ASSETS.md'
  ]) assert.ok(existsSync(resolve(root, rel)), rel);
});
