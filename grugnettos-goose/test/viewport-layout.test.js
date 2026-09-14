import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/src/ui/styles.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');

test('desktop play surface is constrained to the visible viewport', () => {
  assert.match(css, /@media \(min-width: 861px\)[\s\S]*?body\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /\.app-shell\s*\{[\s\S]*?height:\s*100svh/);
  assert.match(css, /\.game-layout\s*\{[\s\S]*?min-height:\s*0[\s\S]*?height:\s*100%/);
});

test('short desktop mode prioritizes gameplay and removes secondary vertical content', () => {
  assert.match(css, /@media \(min-width: 861px\) and \(max-height: 760px\)/);
  assert.match(css, /\.board-info-strip,[\s\S]*?\.special-legend\s*\{\s*display:\s*none/);
  assert.match(css, /\.log-card,[\s\S]*?\.danger-link\s*\{\s*display:\s*none/);
});

test('active mobile games switch to a no-page-scroll play mode', () => {
  assert.match(app, /classList\.toggle\('game-active', Boolean\(game\)\)/);
  assert.match(css, /html\.game-active body[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /html\.game-active \.players-list[\s\S]*?grid-template-columns:\s*repeat\(2/);
});

test('game setup keeps actions visible while only player rows scroll', () => {
  assert.match(css, /\.setup-card\[open\][\s\S]*?max-height:[^;]+;[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\)/);
  assert.match(css, /\.setup-card\[open\] \.setup-content[\s\S]*?overflow:\s*hidden[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\) auto auto/);
  assert.match(css, /\.setup-card\[open\] \.player-setup[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /\.setup-card\[open\] \.setup-actions[\s\S]*?position:\s*static/);
});

 test('short desktop setup uses two option columns to preserve the start button', () => {
  assert.match(css, /@media \(min-width: 861px\) and \(max-height: 760px\)[\s\S]*?\.setup-card\[open\] \.game-options[\s\S]*?grid-template-columns:\s*repeat\(2/);
});

test('setup actions get their own full-width row so Continue cannot be clipped', () => {
  assert.match(css, /\.setup-primary-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.setup-primary-row \.setup-actions:has\(#continueButton:not\(\[hidden\]\)\)\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.setup-primary-row \.setup-actions button\s*\{[\s\S]*?width:\s*100%[\s\S]*?min-width:\s*0/);
});


test('narrow-screen setup opens as a viewport overlay with an independently scrollable roster', () => {
  assert.match(css, /@media \(max-width: 610px\)[\s\S]*?html:not\(\.game-active\) \.setup-card\[open\][\s\S]*?position:\s*fixed[\s\S]*?top:[^;]+[\s\S]*?bottom:[^;]+/);
  assert.match(css, /html:not\(\.game-active\) \.setup-card\[open\] \.setup-content[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
  assert.match(css, /html:not\(\.game-active\) \.setup-card\[open\] \.player-setup[\s\S]*?overflow-y:\s*auto/);
  assert.match(app, /classList\.toggle\('setup-overlay-open'/);
});

test('short desktop setup keeps natural height and compact player rows', () => {
  assert.match(css, /v0\.31[\s\S]*?\.setup-card\[open\]\s*\{[\s\S]*?height:\s*auto[\s\S]*?max-height:/);
  assert.match(css, /v0\.31[\s\S]*?\.setup-card\[open\] \.setup-content\s*\{[\s\S]*?height:\s*auto[\s\S]*?align-content:\s*start/);
  assert.match(css, /v0\.31[\s\S]*?\.setup-card\[open\] \.player-row\s*\{[\s\S]*?min-height:\s*38px/);
  assert.doesNotMatch(css.slice(css.indexOf('/* v0.31')), /\.setup-card\[open\][^{]*\{[^}]*height:\s*100%/);
});
