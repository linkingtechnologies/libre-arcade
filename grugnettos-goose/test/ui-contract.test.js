import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { STRINGS } from '../public/src/i18n/strings.js';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../public/src/ui/styles.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');

test('all visible UI translation keys exist in both Italian and English', () => {
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]);
  for (const key of new Set(keys)) {
    assert.ok(Object.hasOwn(STRINGS.it, key), `Missing Italian key: ${key}`);
    assert.ok(Object.hasOwn(STRINGS.en, key), `Missing English key: ${key}`);
  }
});

test('all translated ARIA label keys exist in both Italian and English', () => {
  const keys = [...html.matchAll(/data-i18n-aria-label="([^"]+)"/g)].map((match) => match[1]);
  for (const key of new Set(keys)) {
    assert.ok(Object.hasOwn(STRINGS.it, key), `Missing Italian ARIA key: ${key}`);
    assert.ok(Object.hasOwn(STRINGS.en, key), `Missing English ARIA key: ${key}`);
  }
  assert.match(app, /data-i18n-aria-label/);
});

test('release-candidate UI exposes audio, board-theme, calibration and reduced-motion controls', () => {
  assert.match(html, /id="audioToggle"/);
  assert.match(html, /id="boardThemeSelect"/);
  assert.match(html, /id="calibrationPanel"/);
  assert.match(html, /id="calibrationSaveButton"/);
  assert.match(html, /id="calibrationExportButton"/);
  assert.match(html, /id="motionToggle"/);
});

test('release-candidate UI exposes keyboard and mobile affordances', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /id="mobileRollButton"/);
  assert.match(html, /role="log"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(app, /mobileRollButton\.addEventListener\('click', roll\)/);
});


test('normal game UI uses clean board names and exposes live turn narration', () => {
  assert.match(html, /id="turnNotice"/);
  assert.match(app, /noticeCpuTurn/);
  assert.match(app, /announceCpu:\s*true/);
  assert.doesNotMatch(STRINGS.it.boardThemePd, /schema/i);
  assert.doesNotMatch(STRINGS.en.boardThemePd, /schematic/i);
});

test('animator supports pre-event narration hooks so notices precede movement', () => {
  const animator = fs.readFileSync(new URL('../public/src/ui/Animator.js', import.meta.url), 'utf8');
  assert.match(animator, /onEventStart/);
  assert.match(animator, /await onEventStart\?\.\(event\)/);
  assert.match(animator, /await onEvent\?\.\(event\)/);
});

test('header has no standalone brand emblem', () => {
  assert.doesNotMatch(html, /class="brand-mark"/);
});

test('visible branding uses pig title with no subtitle', () => {
  assert.match(html, /<title>🐽’s Goose<\/title>/);
  assert.match(html, /<h1[^>]*>🐽’s Goose<\/h1>/);
  assert.doesNotMatch(html, /data-i18n="subtitle"/);
});


test('player identity follows the Grugnetto/Kludgopol naming convention', () => {
  assert.match(app, /KLUDGOPOL_FRIENDS = Object\.freeze\(\['Zilla', 'Queen', 'Wallace', 'Hans', 'Mimrock', 'Lost Soul', 'Pazifik', 'Lemming'\]\)/);
  assert.match(app, /humanIndex === 0 \? 'Grugnetto'/);
  assert.match(app, /input\.readOnly = true/);
});

test('debug calibration renders labels on the true anchor and fits the artwork box', () => {
  assert.match(app, /fitDebugBoardToStage/);
  assert.match(app, /requestAnimationFrame\(fitDebugBoardToStage\)/);
  assert.match(css, /\.debug-label[\s\S]*transform:\s*translate\(-50%, -50%\)/);
});


test('victory presentation includes deterministic confetti, finish glow and winner pawn jumps', () => {
  const animator = fs.readFileSync(new URL('../public/src/ui/Animator.js', import.meta.url), 'utf8');
  assert.match(animator, /makeConfettiLayer\(\)/);
  assert.match(animator, /makeWinnerGhost\(playerId\)/);
  assert.match(animator, /await this\.celebrate\(event\.playerId\)/);
  assert.match(css, /\.victory-confetti/);
  assert.match(css, /@keyframes victoryPawnJump/);
  assert.match(css, /@keyframes victoryFinishGlow/);
});

test('winner notice is shown for human wins as well as CPU wins', () => {
  assert.match(app, /if \(event\.type === 'PLAYER_WON'\)[\s\S]*showTurnNotice\(notice\)/);
});

test('reduced motion suppresses moving victory decoration', () => {
  assert.match(css, /html\.reduced-motion \.victory-confetti/);
  assert.match(css, /html\.reduced-motion \.victory-pawn/);
  const animator = fs.readFileSync(new URL('../public/src/ui/Animator.js', import.meta.url), 'utf8');
  assert.match(animator, /victory-finish-static/);
});


test('setup always exposes explicit start and continue actions outside the scrolling player list', () => {
  assert.match(html, /<div class="setup-actions">[\s\S]*?id="startButton"[\s\S]*?id="continueButton"/);
  assert.match(css, /\.setup-card\[open\] \.player-setup[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /\.setup-card\[open\] \.setup-actions[\s\S]*?position:\s*static/);
});

test('new game action is placed before the scrollable player roster', () => {
  const primary = html.indexOf('class="setup-primary-row"');
  const start = html.indexOf('id="startButton"');
  const roster = html.indexOf('id="playerSetup"');
  assert.ok(primary >= 0 && start > primary && roster > start, 'start action must precede player roster');
});

test('continue action is hidden until a saved game exists', () => {
  assert.match(html, /id="continueButton"[^>]*hidden/);
  assert.match(app, /continueButton\.hidden = continueButton\.disabled/);
});

test('player-piece identity is repeated in setup, status and live notices with accessible labels', () => {
  assert.match(app, /playerPieceLabel/);
  assert.match(app, /setup-player-symbol/);
  assert.match(app, /symbol\.setAttribute\('aria-label', playerPieceLabel\(player\)\)/);
  assert.match(app, /turnNoticeAvatar\.setAttribute\('aria-label', playerPieceLabel\(player\)\)/);
  for (const lang of ['it', 'en']) {
    assert.ok(STRINGS[lang].playerPieceAria);
    for (const key of ['shapeCircle', 'shapeTriangle', 'shapeSquare', 'shapeDiamond', 'patternSolid', 'patternStripes', 'patternDots', 'patternCrosshatch']) {
      assert.ok(STRINGS[lang][key], `Missing ${lang} player identity key: ${key}`);
    }
  }
});
