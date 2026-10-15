// What ships: the page and its modules in public/. These tests look at the tree as it is deployed (npm run build copies public/ to game/).
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
}
const files = walk(PUBLIC);
const text = (f) => readFileSync(f, 'utf8');
const rel = (f) => relative(PUBLIC, f).replaceAll('\\', '/');

test('the deployed tree is the page, its modules and the notes on the data: no ROM, no picture, no sound, no archive', () => {
  const allowed = new Set(['.html', '.js', '.css', '.md', '.txt']);
  for (const f of files) assert.ok(allowed.has(extname(f)), `${rel(f)} is not a page, a module or a text`);
  assert.ok(files.some((f) => rel(f) === 'index.html'), 'the page is public/index.html, with no stub in front of it');
  // a ROM, a CHR sheet or a ZIP would begin with its own signature whatever it is called
  for (const f of files) {
    const head = readFileSync(f).subarray(0, 4);
    assert.notDeepEqual([...head], [0x4e, 0x45, 0x53, 0x1a], `${rel(f)} looks like an NES ROM`);
    assert.notDeepEqual([...head], [0x50, 0x4b, 0x03, 0x04], `${rel(f)} looks like a ZIP`);
  }
});

test('every JavaScript file says under which licence it is: GPL-3.0-or-later for the code, the data licence for public/data', () => {
  for (const f of files.filter((f) => extname(f) === '.js')) {
    const head = text(f).slice(0, 400);
    if (rel(f).startsWith('data/')) assert.match(head, /SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified/, rel(f));
    else assert.match(head, /SPDX-License-Identifier: GPL-3\.0-or-later/, rel(f));
  }
  for (const f of ['data/LICENSE.txt', 'data/README.md']) assert.ok(existsSync(join(PUBLIC, f)), `${f} is missing`);
  assert.match(text(join(PUBLIC, 'data/LICENSE.txt')), /version was not specified/i);
  assert.match(text(join(ROOT, 'LICENSE')), /GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/);
  assert.equal(JSON.parse(text(join(ROOT, 'package.json'))).license, 'GPL-3.0-or-later');
});

test('the page loads nothing from outside but the counter that the whole collection uses, and uses no eval', () => {
  const remote = [];
  for (const f of files.filter((f) => ['.html', '.js', '.css'].includes(extname(f)))) {
    for (const m of text(f).matchAll(/(?:src|href)\s*=\s*["']((?:https?:)?\/\/[^"']+)["']|url\(\s*["']?((?:https?:)?\/\/[^)"']+)|@import\s+["']((?:https?:)?\/\/[^"']+)/g)) remote.push(`${rel(f)}: ${m[1] ?? m[2] ?? m[3]}`);
    assert.doesNotMatch(text(f), /\beval\s*\(|new Function\s*\(/, `${rel(f)} uses eval`);
  }
  const unexpected = remote.filter((r) => !/gc\.zgo\.at\/count\.js|linkingtechnologies\.github\.io\/libre-arcade/.test(r));
  assert.deepEqual(unexpected, []);
  assert.match(text(join(PUBLIC, 'index.html')), /<script data-goatcounter="https:\/\/grugnetto\.goatcounter\.com\/count" async src="\/\/gc\.zgo\.at\/count\.js"><\/script>\s*<\/body>/);
});

test('every relative import of the page and the modules exists', () => {
  for (const f of files.filter((f) => extname(f) === '.js')) {
    for (const m of text(f).matchAll(/(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*['"](\.[^'"]+)['"]/g)) {
      const target = resolve(dirname(f), m[1] ?? m[2]);
      assert.ok(existsSync(target), `${rel(f)} imports ${m[1] ?? m[2]}, which is not there`);
    }
  }
  for (const m of text(join(PUBLIC, 'index.html')).matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) assert.ok(existsSync(join(PUBLIC, m[1])), `index.html uses ${m[1]}`);
});

test('what a player reads has no development vocabulary', () => {
  const strings = text(join(PUBLIC, 'web/app.js')) + text(join(PUBLIC, 'index.html'));
  const words = /\b(milestones?|oracle|parity|certif\w+|archaeolog\w+|clean-room|placeholder|semantic|source-order|RNG|M\d\d)\b/i;
  // the code's own comments and identifiers are not what a player reads: look at the quoted strings of the page's text table and the page's markup
  const quoted = [...strings.matchAll(/'((?:[^'\\\n]|\\.)*[A-Za-z]{4,}(?:[^'\\\n]|\\.)*)'/g)].map((m) => m[1]).filter((s) => s.includes(' '));
  const markup = [...text(join(PUBLIC, 'index.html')).matchAll(/>([^<>]*[A-Za-z]{4,}[^<>]*)</g)].map((m) => m[1]);
  for (const s of [...quoted, ...markup]) assert.doesNotMatch(s, words, s);
});

test('the credits say who made the game, that this version is unofficial and not endorsed, and the licences, in both languages', () => {
  const app = text(join(PUBLIC, 'web/app.js'));
  for (const needle of ['Shiru', 'PinWizz', 'Gibson', 'Unofficial Libre Arcade version', 'have not endorsed it', 'GPL-3.0-or-later', 'Creative Commons Attribution (CC BY)', 'version not stated',
    'Versione non ufficiale', 'non l’hanno approvata', 'Creative Commons Attribuzione (CC BY)', 'versione non indicata']) assert.ok(app.includes(needle), needle);
});

test('the stages begin with the byte the stage before ended with, as the original does, and not with 1', () => {
  const app = text(join(PUBLIC, 'web/app.js'));
  assert.match(app, /new Simulation\(stage,\{seed:carriedSeed,padPolled:padMask\(\)\}\)/);
  assert.doesNotMatch(app, /seed:day===1\?runSeed:1/);
  assert.match(app, /function showEnd\(won\)\{\s*if\(sim\) carriedSeed=sim\.rng\.state;/);
  assert.match(app, /function showDreamResult\(won\)\{\s*if\(sim\) carriedSeed=sim\.rng\.state;/);
  assert.match(app, /runSeed=titleRng\.state \|\| 1; carriedSeed=runSeed;/);
});

test('the sound test lists the sounds that the audio engine makes, all of them and only them', async () => {
  const { SOUND_NAMES } = await import(`file:///${join(PUBLIC, 'web/sounds.js').replaceAll('\\', '/')}`);
  const audio = text(join(PUBLIC, 'web/audio.js'));
  const made = [...audio.matchAll(/case '([a-z-]+)':/g)].map((m) => m[1]).sort();
  assert.deepEqual([...SOUND_NAMES].sort(), made);
});

test('the page reads the pad the way the program does: Z and X are A and B, Shift and Backspace SELECT, Enter and Space START', () => {
  const app = text(join(PUBLIC, 'web/app.js'));
  assert.match(app, /KEY_BUTTON=\{KeyZ:'A',KeyX:'B',ShiftLeft:'SELECT',ShiftRight:'SELECT',Backspace:'SELECT',Enter:'START',Space:'START'\}/);
  // the hidden code, the sound test and the choice of the level are in the page, and not mentioned to the player
  for (const needle of ['frontend.tick(mask)', 'stepLevelSelect', 'showSoundTest']) assert.ok(app.includes(needle), needle);
  assert.doesNotMatch(app.match(/I18N=\{[\s\S]*?\n\};/)[0], /B A B A|hidden code|\bcheat/i);
});
