import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('browser shell exposes one generic dimensional-help toggle for all games', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.match(html, /id="dimensional-help-toggle"/);
  assert.doesNotMatch(html, /id="maze-help-toggle"/);
  for (const game of ['flipflop', 'bombsquad', 'mazerunner', 'pegjumper', 'tileslider']) {
    assert.match(html, new RegExp(`value="${game}"`));
  }
});

test('responsive shell keeps document scrolling disabled and has a mobile toolbar rule', async () => {
  const css = await readFile('public/src/ui/style.css', 'utf8');
  assert.match(css, /html, body[^}]*overflow:\s*hidden/s);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  assert.match(css, /canvas[^}]*max-width:\s*100%/s);
  assert.match(css, /canvas[^}]*max-height:\s*100%/s);
});

test('player-facing shell has EN/IT localization keys for title and accessibility labels', async () => {
  const app = await readFile('public/src/ui/app.js', 'utf8');
  for (const key of ['pageTitle', 'toolbarAria', 'stageAria', 'boardAria', 'languageAria']) {
    const matches = app.match(new RegExp(`${key}:`, 'g')) || [];
    assert.equal(matches.length, 2, `${key} should exist in both languages`);
  }
  assert.match(app, /document\.title = tr\('pageTitle'\)/);
});

test('Italian outcome overlays are localized without modifying historical sprites', async () => {
  const app = await readFile('public/src/ui/app.js', 'utf8');
  assert.match(app, /victoryText: 'VITTORIA'/);
  assert.match(app, /defeatText: 'SCONFITTA'/);
  assert.match(app, /if \(language === 'en'\)/);
  assert.match(app, /drawLocalizedOutcome\(overlayKind\)/);
});

test('Italian help contains no leftover perfect-maze phrase and touch labels are localized', async () => {
  const app = await readFile('public/src/ui/app.js', 'utf8');
  assert.doesNotMatch(app, /Difficile mantiene un perfect maze/);
  assert.match(app, /Difficile mantiene un labirinto perfetto/);
  assert.match(app, /touchReveal: 'Tocco: Scopri'/);
});
