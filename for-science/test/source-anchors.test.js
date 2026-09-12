import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenesPath = path.join(root, 'reference', 'postcompo-1.0.1', 'game', 'scenes.py');
const menuPath = path.join(root, 'reference', 'postcompo-1.0.1', 'game', 'menu.py');
const transitionsPath = path.join(root, 'reference', 'postcompo-1.0.1', 'cocos', 'scenes', 'transitions.py');

test('visual/input parity fixes remain anchored to preserved 1.0.1 source', async () => {
  const scenes = await readFile(scenesPath, 'utf8');
  assert.match(scenes, /bx = \(x-self\.board_ox\)\/\/\(self\.tile_size\+self\.tile_pad\)/);
  assert.match(scenes, /if self\.clicked:\s*\n\s*return False/);
  assert.match(scenes, /meteorite\.png', flip_x=True/);
  assert.match(scenes, /action = Delay\(1\.0\) \+ FadeOut\(2\.0\) \| ScaleBy\(1\.2, 2\.0\) \+ CallFunc\(sprite\.kill\)/);
});

test('one-second menu fade is anchored to menu.py and vendored Cocos FadeTransition', async () => {
  const [menu, transitions] = await Promise.all([
    readFile(menuPath, 'utf8'),
    readFile(transitionsPath, 'utf8'),
  ]);
  assert.match(menu, /FadeTransition\(GameScene\(\), 1\.0\)/);
  assert.match(menu, /FadeTransition\(GameScene\(demo=True\), 1\.0\)/);
  assert.match(transitions, /FadeIn\( duration=self\.duration\/2\.0\)/);
  assert.match(transitions, /FadeOut\( duration=self\.duration \/2\.0 \)/);
});
