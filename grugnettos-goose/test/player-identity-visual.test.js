import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/src/ui/styles.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');

test('player identity uses large symbols in setup/status badges and on board pawns', () => {
  assert.match(app, /symbol: '●'/);
  assert.match(app, /symbol: '▲'/);
  assert.match(app, /symbol: '■'/);
  assert.match(app, /symbol: '◆'/);
  assert.match(css, /player-symbol \.token-mark[\s\S]*font-size:\s*1\.08rem/);
  assert.match(css, /setup-player-symbol \.token-mark[\s\S]*font-size:\s*1\.02rem/);
  assert.match(css, /\.token \.token-mark[\s\S]*background:\s*rgba\(255, 253, 247, \.94\)/);
  assert.match(css, /\.token \.token-mark[\s\S]*top:\s*67%/);
});
