// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The collection's conventions for a game folder (AGENTS.md at the root): the page at the root of public/, the same script names in
// package.json, the visit counter and no other remote call, the documents a ported game carries, the "Play here" line.
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((n) => (statSync(join(ROOT, dir, n)).isDirectory() ? walk(`${dir}/${n}`) : [`${dir}/${n}`]));

const COUNTER = '<script data-goatcounter="https://grugnetto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>';

test('the game is public/index.html, with no nested page and no redirect stub', () => {
  assert.ok(existsSync(join(ROOT, 'public', 'index.html')));
  for (const f of walk('public')) assert.ok(f === 'public/index.html' || !f.endsWith('index.html'), f);
});

const SOUNDS = ['buy', 'buzz', 'click', 'ding', 'double-beep', 'entrance', 'oven-door-full-close', 'oven-door-full-open', 'oven-door-peek-close', 'oven-door-peek-open', 'turkey-in-the-straw', 'waterford'];

test('public/ holds only the page, one stylesheet, the modules and the original\'s twelve sound files with their note', () => {
  assert.deepEqual(walk('public').sort(), ['public/css/app.css', 'public/index.html', 'public/js/app.js', 'public/js/game-session.js', 'public/js/gameplay-state.js',
    'public/js/runtime.js', 'public/js/thermal-model.js', 'public/js/ui-shell.js', 'public/sounds/README.txt', ...SOUNDS.map((n) => `public/sounds/${n}.mp3`)].sort());
});

test("the page carries the collection's visit counter once, before </body>", () => {
  const html = read('public/index.html');
  assert.equal(html.split(COUNTER).length - 1, 1);
  assert.ok(html.indexOf(COUNTER) < html.indexOf('</body>'));
});

test('no remote dependency but the visit counter (no CDN, no font, no framework)', () => {
  const html = read('public/index.html').replace(COUNTER, '');
  const sources = [html, read('public/css/app.css'), ...walk('public/js').map(read)];
  for (const s of sources) {
    assert.ok(!/https?:\/\//.test(s), 'a remote URL');
    assert.ok(!/(?:src|href)=["']\/\//.test(s), 'a protocol-relative URL');
  }
});

test("none of the original's artwork is referenced (CC BY-NC, kept out on purpose); its sound is, and only the files kept in public/sounds", () => {
  const code = walk('public').filter((f) => /\.(html|css|js)$/.test(f)).map(read).join('\n');
  assert.ok(!/\.(png|jpe?g|gif|svg)\b/i.test(code));
  assert.ok(!/res\/(screens|sound|items|people)/i.test(code));
  const referenced = [...code.matchAll(/sounds\/([a-z-]+\.(?:mp3|ogg|wav))/g)].map((m) => m[1]);
  assert.ok(referenced.length >= 12);
  for (const f of referenced) assert.ok(SOUNDS.includes(f.replace('.mp3', '')), f);
  for (const f of walk('public')) assert.ok(['.html', '.css', '.js', '.mp3', '.txt'].includes(extname(f)), f);
});

test('the sound files are the ones public/sounds/README.txt lists, by SHA-256 and size', async () => {
  const { createHash } = await import('node:crypto');
  const note = read('public/sounds/README.txt');
  for (const n of SOUNDS) {
    const bytes = readFileSync(join(ROOT, 'public', 'sounds', `${n}.mp3`));
    const line = note.split('\n').find((l) => l.includes(`  ${n}.mp3  `));
    assert.ok(line, n);
    const [sha, , size] = line.trim().split(/\s+/);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha, n);
    assert.equal(bytes.length, Number(size), n);
  }
  assert.match(note, /Unless Otherwise noted, all sounds and music are in the public Domain/);
});

test("package.json has the collection's script names and the licence of the code", () => {
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(Object.keys(pkg.scripts), ['dev', 'build', 'start', 'test', 'lint', 'check']);
  assert.equal(pkg.scripts.dev, 'node scripts/serve.mjs public 8080');
  assert.equal(pkg.scripts.test, 'node --test test/*.test.mjs');
  assert.equal(pkg.scripts.check, 'npm run lint && npm test');
  assert.equal(pkg.license, 'GPL-3.0-only');
  assert.ok(!pkg.dependencies);
});

test('the documents of a ported game are there', () => {
  for (const f of ['LICENSE', 'README.md', 'PROVENANCE.md', 'THIRD_PARTY_NOTICES.md', 'SOFTWARE_ARCHAEOLOGY.md', 'CHANGELOG.md', 'STORY.md', 'HOW_TO_PLAY.md',
    'specs/port-map.md', 'reference/SOURCE.md', 'reference/ORIGINAL_SHA256.txt', 'docs/development/README.md', 'docs/development/CHANGES.md', 'docs/development/MILESTONES.md', 'scripts/serve.mjs',
    'scripts/build.mjs', '.gitignore']) {
    assert.ok(existsSync(join(ROOT, f)), f);
  }
  assert.ok(read('.gitignore').split('\n').includes('.claude/'));
});

test('the README has the "Play here" line under its title', () => {
  const lines = read('README.md').split('\n');
  assert.match(lines[0], /^# /);
  assert.equal(lines[2], '**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/turkey-cooking-simulator/public/index.html)**');
});

test("STORY.md follows the collection's rules: heading on line 1, subtitle on line 2, no em dash, sentence case, a sensible length", () => {
  const story = read('STORY.md');
  const lines = story.split('\n');
  assert.equal(lines[0], '# Turkey Cooking Simulator');
  assert.ok(lines[1].trim().length > 0 && !lines[1].startsWith('#'));
  assert.ok(!story.includes('—'));
  for (const h of lines.filter((l) => /^#{2,} /.test(l))) {
    const words = h.replace(/^#+ /, '').split(' ').slice(1);
    assert.ok(words.every((w) => !/^[A-Z][a-z]+$/.test(w) || /^(Skin|Body|Core|Game|Off|Libre|Arcade|Sheen|Kao|Italian)$/.test(w)), h);
  }
  const n = story.split(/\s+/).length;
  assert.ok(n >= 500 && n <= 1800, `${n} words`);
});

test('the page keeps the persistence keys (session.v3: a save of the earlier thermal model cannot be resumed)', () => {
  const app = read('public/js/app.js');
  assert.match(app, /libreArcade\.turkeyCookingSimulator\.session\.v3/);
  assert.match(app, /libreArcade\.turkeyCookingSimulator\.preferences\.v1/);
});
