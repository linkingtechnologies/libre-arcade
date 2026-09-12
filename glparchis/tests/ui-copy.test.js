import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');

test('normal UI does not expose the deterministic seed control', () => {
  assert.doesNotMatch(html, /id=["']seed["']/i);
  assert.doesNotMatch(html, /seed partita|game seed/i);
});

test('normal UI copy contains no restoration or asset-quarantine jargon', () => {
  const playerFacing = html + '\n' + ui;
  assert.doesNotMatch(playerFacing, /preservazione web|web preservation|asset(?:s)? in quarantena|quarantined assets|difficoltà cpu|cpu difficulty/i);
});

test('historical AI thresholds remain unchanged behind friendly labels', () => {
  for (const value of ['40','55','70','85','100']) {
    assert.match(html, new RegExp(`value=["']${value}["']`));
  }
  assert.match(ui, /Molto facile/);
  assert.match(ui, /Very hard/);
});

test('sound control is friendly and clean-room audio is wired into the UI', () => {
  assert.match(html, /id=["']sound["']/i);
  assert.match(ui, /GameAudio/);
  assert.doesNotMatch(html, /wav|web audio|oscillator|audio context/i);
});
