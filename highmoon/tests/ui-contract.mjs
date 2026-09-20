// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'game-app.js'), 'utf8');

for (const forbidden of ['Seed galassia', 'Galaxy seed', 'RC1', 'Libre Arcade ·', '2006 →']) {
  assert.equal(html.includes(forbidden), false, `consumer UI must not expose ${forbidden}`);
}
assert.equal(/id=["']seed["']/.test(html), false, 'seed input must not exist in consumer UI');
assert.equal(/id=["']seedLabel["']/.test(html), false, 'seed HUD label must not exist');
assert.match(html, /id="menuBackdrop"[^>]*hidden/);
assert.match(html, /id="gameMenu"[^>]*role="dialog"[^>]*aria-modal="true"/);
for (const id of ['menuOpen','menuClose','menuPlay','pause','difficulty','warp','audioToggle','audioHint','lang','fullscreen','restart','howToPlay','creditsPanel']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing UI control ${id}`);
}
const topActions = html.match(/<div class="top-actions"[\s\S]*?<\/div>/)?.[0] ?? '';
assert.equal((topActions.match(/<button\b/g) ?? []).length, 2, 'top bar should expose only Pause and Menu');
assert.match(css, /100dvh/);
assert.match(css, /@media \(pointer: coarse\)/);
assert.match(css, /orientation: landscape/);
assert.match(css, /max-height: 700px/);
assert.match(app, /function openMenu\(/);
assert.match(app, /let paused = true;/, 'simulation must be paused on first load');
assert.match(app, /let hasStarted = false;/, 'first visit must wait for Play');
assert.match(app, /openMenu\(\); \/\/ First visit/, 'welcome menu must open at boot');
assert.match(app, /function playFromMenu\(/);
assert.match(app, /audio\.unlock\(\)\.then\(ready/, 'Play must unlock audio with a user gesture');
assert.doesNotMatch(html, /id="audioTest"/, 'the sound-test button must not appear in the menu');
assert.match(app, /if \(!isMenuOpen\(\) \|\| !hasStarted\) return;/, 'first menu cannot dismiss before Play');
assert.match(html, /id="menuClose"[^>]*hidden/, 'close hidden on welcome');
assert.match(html, /id="pause"[^>]*disabled/, 'pause disabled until game begins');
for (const key of ['instructions','howGoal','howAim','howWorld','howWeapons','howKeyboard','credits','originalGame','originalSite','restoration','licenses','viewLicense']) {
  assert.match(html, new RegExp('data-i18n="'+key+'"'), 'missing translatable menu section '+key);
  assert.match(app, new RegExp('\\b'+key+':'), 'missing translated key '+key);
}
assert.match(html, /Patrick Gerdsmeier/);
assert.match(html, /linkingtechnologies\.github\.io\/libre-arcade/);
assert.match(html, /href="LICENSE"/, 'credits must link port license');
assert.match(app, /navigator\.language/, 'initial language follows browser locale unless saved');
assert.match(app, /function closeMenu\(/);
assert.equal(app.includes('seedLabel'), false, 'runtime must not expose seedLabel');
assert.equal(app.includes('seedInput'), false, 'runtime must not expose seed input');

console.log('ok ui-contract: welcome menu gated; IT/EN instructions and credits; clean HUD and responsive rules');
