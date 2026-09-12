import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_DEFS } from '../public/src/ui/assets.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pngDimensions(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.toString('ascii',1,4), 'PNG');
  return { width:b.readUInt32BE(16), height:b.readUInt32BE(20) };
}

test('gaucho sheet metadata is copied from historical libgrafico.cc', () => {
  const source = fs.readFileSync(path.join(root,'reference/ceferino-0.97.8/src/libgrafico.cc'),'latin1');
  assert.ok(source.includes('ima_gaucho->iniciar("gaucho.png", 3, 8, 43, 105, modo_video);'));
  assert.deepEqual(ASSET_DEFS.player, {
    file:'gaucho.png', rows:3, cols:8, px:43, py:105
  });
});

test('gaucho.png resolves to 24 integral historical frames of 110x110 pixels', () => {
  const {width,height} = pngDimensions(path.join(root,'public/assets/graphics/gaucho.png'));
  assert.equal(width,880);
  assert.equal(height,330);
  assert.equal(width / ASSET_DEFS.player.cols,110);
  assert.equal(height / ASSET_DEFS.player.rows,110);
});

test('every PNG sprite sheet declared by the loader has integral cells', () => {
  for (const [key,def] of Object.entries(ASSET_DEFS)) {
    if (!def.file.endsWith('.png')) continue;
    const {width,height} = pngDimensions(path.join(root,'public/assets/graphics',def.file));
    assert.equal(width % def.cols,0,`${key}/${def.file} width`);
    assert.equal(height % def.rows,0,`${key}/${def.file} height`);
  }
});
