import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../public/src/ui/styles.css', import.meta.url), 'utf8');

const expectedAssets = [
  'goose.svg', 'bridge.svg', 'inn.svg', 'well.svg', 'maze.svg',
  'prison.svg', 'death.svg', 'finish.svg', 'pawn.svg', 'favicon.svg'
];

test('original Grugnetto SVG asset set is complete', () => {
  for (const file of expectedAssets) {
    const url = new URL(`../public/assets/icons/${file}`, import.meta.url);
    assert.ok(fs.existsSync(url), `Missing original asset: ${file}`);
    const svg = fs.readFileSync(url, 'utf8');
    assert.match(svg, /<svg[\s>]/, `${file} is not an SVG`);
  }
});

test('v0.14 bundles the historical board files and no generated substitute', () => {
  assert.equal(fs.existsSync(new URL('../public/assets/boards/local/', import.meta.url)), false);
  assert.equal(fs.existsSync(new URL('../public/assets/boards/ganzenbordspel-inspired.svg', import.meta.url)), false);
  assert.ok(fs.existsSync(new URL('../public/assets/boards/original/README.md', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../public/assets/boards/original/Ganzenbord_pd.svg', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../public/assets/boards/original/Ganzenbordspel.jpg', import.meta.url)));
});

test('special-space identity no longer depends on emoji glyphs', () => {
  for (const emoji of ['🪿', '🌉', '🏠', '🕳️', '🌀', '🔒', '☠️', '🏆']) {
    assert.ok(!app.includes(emoji), `Special-space emoji still present in app.js: ${emoji}`);
  }
  for (const slug of ['goose', 'bridge', 'inn', 'well', 'maze', 'prison', 'death', 'finish']) {
    assert.match(css, new RegExp(`icon-${slug}`));
  }
});

test('player pieces use both a pawn silhouette and a visible symbol', () => {
  assert.match(css, /assets\/icons\/pawn\.svg/);
  assert.match(app, /token-mark/);
});


test('audible gameplay cues are bundled as local PCM WAV fallbacks', () => {
  for (const file of ['dice.wav', 'step1.wav', 'step2.wav', 'step3.wav', 'step4.wav', 'win.wav', 'unlock.wav']) {
    const url = new URL(`../public/assets/audio/${file}`, import.meta.url);
    assert.ok(fs.existsSync(url), `Missing local audio fallback: ${file}`);
    const wav = fs.readFileSync(url);
    assert.equal(wav.subarray(0, 4).toString('ascii'), 'RIFF', `${file} is not RIFF`);
    assert.equal(wav.subarray(8, 12).toString('ascii'), 'WAVE', `${file} is not WAVE`);
  }
});

test('player pieces expose redundant color, symbol and pattern cues', () => {
  assert.match(css, /--piece-bg:\s*#a94432/);
  assert.match(css, /repeating-linear-gradient\(135deg/);
  assert.match(css, /radial-gradient\(circle at 2px 2px/);
  assert.match(css, /repeating-linear-gradient\(45deg/);
  assert.match(app, /PLAYER_IDENTITIES/);
  for (const symbol of ['●', '▲', '■', '◆']) assert.ok(app.includes(symbol), `Missing player symbol ${symbol}`);
});
