// SPDX-License-Identifier: GPL-3.0-only
// Headless tests for Trapped. The ORIGINAL Twine 1.4.2 engine is executed in jsdom
// (Math.random seeded or pinned), so these tests exercise the historical runtime,
// not a re-implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadStory } from './harness.mjs';
import { parsePassages, encode, buildStory } from '../scripts/story-lib.mjs';
import { mulberry32 } from '../public/shared/arcade.js';
import { dicts } from '../public/i18n.js';

const p = (f) => fileURLToPath(new URL(f, import.meta.url));
const SRC = p('../source/Trapped.original.html');
const EN = p('../public/story/trapped.en.html');
const IT = p('../public/story/trapped.it.html');
const src = readFileSync(SRC, 'utf8');
const layer = JSON.parse(readFileSync(p('../translations/it.json'), 'utf8'));

// Pin the antagonist: Math.random() = (idx + .5)/n picks index idx of an n-room list.
const at = (idx, n) => (idx + 0.5) / n;
const F1 = (idx) => at(idx, 4); // floor 1: living room, bathroom, garage, kitchen
const F2 = (idx) => at(idx, 6); // floor 2: hallway, bathroom, master bedroom, 1st bedroom, 2nd bedroom, storage room

const META = ['StoryTitle', 'StoryAuthor', 'Open House', 'cyclinglink'];

test('source file is the untouched original (sha-256 pinned)', () => {
  assert.equal(createHash('sha256').update(readFileSync(SRC)).digest('hex'), 'dbb8f4bf5344a995116b94ddfe0ef01a3788825379620fe0b990f19f30de72ca');
});

test('passage codec round-trips all 36 passages', () => {
  const ps = parsePassages(src);
  assert.equal(ps.length, 36);
  for (const x of ps) assert.equal(encode(x.text), x.raw, x.title);
});

test('English build differs from the original only by the two injected tags', () => {
  const en = readFileSync(EN, 'utf8');
  assert.equal(en.replace('<link rel="stylesheet" href="theme.css">\n', '').replace('<script src="enhance.js"></script>\n', ''), src);
});

// ---------------------------------------------------------------- graph
function links(text) {
  const out = [];
  for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const body = m[1];
    out.push((body.includes('|') ? body.split('|').pop() : body).replace(/\]\[.*$/, '').trim());
  }
  return out;
}
function displays(text) { return [...text.matchAll(/<<display\s+"?([^">\s]+)"?\s*>>/g)].map((m) => m[1]); }

test('passage graph: no dangling link or display target; reachable set computed from Start', () => {
  const ps = new Map(parsePassages(src).map((x) => [x.title, x.text]));
  const edges = new Map();
  for (const [t, text] of ps) {
    const out = [...links(text), ...displays(text)];
    for (const o of out) assert.ok(ps.has(o), `"${t}" points at missing passage "${o}"`);
    edges.set(t, out);
  }
  const seen = new Set(['Start']); const q = ['Start'];
  while (q.length) for (const o of edges.get(q.pop())) if (!seen.has(o)) { seen.add(o); q.push(o); }
  const unreachable = [...ps.keys()].filter((t) => !seen.has(t)).sort();
  assert.deepEqual(unreachable, [...META].sort(), 'only metadata/annotation/script passages are unreachable by links');
  assert.equal(seen.size, 32);
});

// ---------------------------------------------------------------- engine
test('original engine loads in a current DOM without errors; Start shows the opening text', async () => {
  const s = await loadStory(SRC, 1);
  assert.deepEqual(s.errors, []);
  assert.equal(s.title, 'Start');
  assert.match(s.text, /It’s so dark and cold out here/);
  assert.deepEqual(s.vars, { myFloor: 1, myRoom: 1, killerRoom: 0, roomList: '', key1: false, key2: false, loopz: 1 });
});

async function enterHouse(file, seed = 1) {
  const s = await loadStory(file, seed);
  s.setRandom(F2(0));
  for (const l of ['Look around and stand up', 'Walk', 'Walk towards the light', 'Check out the right side', 'Go to the back of the house', 'Climb up the barrels', 'Move towards the collapsed section']) s.clickLabel(l);
  s.setRandom(F2(0)); // killer in the hallway: storage room is safe
  s.clickLabel('I should gather my surroundings.');
  return s;
}

test('roof route: loopz counter increments and plural text appears on the second visit', async () => {
  const s = await loadStory(SRC, 1);
  for (const l of ['Look around and stand up', 'Walk', 'Walk towards the light', 'Check out the right side', 'Go to the back of the house', 'Climb up the barrels']) s.clickLabel(l);
  assert.match(s.text, /1 collapsed section over there/);
  s.clickLabel('Move towards the collapsed section');
  assert.equal(s.vars.loopz, 2);
  s.setRandom(F2(0)); s.clickLabel('I should gather my surroundings.');
  assert.equal(s.title, 'storage_room'); assert.equal(s.vars.myFloor, 2);
});

test('ending 1: welded main door ("RIP") restarts at Start', async () => {
  const s = await enterHouse(SRC);
  s.setRandom(F2(1)); s.clickLabel('Exit the storage room');
  s.setRandom(F2(1)); s.clickLabel('Go down to the first floor');
  assert.equal(s.title, 'first floor'); assert.equal(s.vars.myFloor, 1);
  s.setRandom(F1(3));
  s.clickLabel('Walk to the table'); s.clickLabel('Read newspaper'); s.clickLabel('Put newspaper down');
  assert.match(s.text, /heavy footsteps thundering/);
  s.clickLabel('Run to the main door');
  assert.match(s.text, /its welded/);
  s.clickLabel('RIP'); assert.equal(s.title, 'Start');
});

test('ending 2: toast in the kitchen restarts at Start', async () => {
  const s = await enterHouse(SRC);
  s.setRandom(F2(1)); s.clickLabel('Exit the storage room');
  s.setRandom(F2(1)); s.clickLabel('Go down to the first floor');
  s.setRandom(F1(3)); s.clickLabel('Walk to the table'); s.clickLabel('Read newspaper'); s.clickLabel('Put newspaper down');
  s.clickLabel('Run to the kitchen'); assert.match(s.text, /fresh toast/);
  s.clickLabel('You grab a bite right before your imminent death.'); assert.equal(s.title, 'Start');
});

test('ending 3: both keys unlock the front door; variables key1/key2 update on the way', async () => {
  const s = await enterHouse(SRC);
  assert.equal(s.vars.key1, false);
  s.setRandom(F2(1)); s.clickLabel('Exit the storage room');
  s.setRandom(F2(1)); s.clickLabel('Enter the first bedroom');
  s.clickLabel('Look among the dolls'); assert.equal(s.vars.key1, true);
  s.clickLabel('I grip the key.');
  s.clickLabel('Go back into the hallway');
  assert.equal(s.vars.key2, false);
  s.clickLabel('Move towards the Master Bedroom');
  assert.equal(s.vars.key2, 1, 'second key is granted by entering the master bedroom with key1');
  s.clickLabel('Go back into the hallway');
  s.clickLabel('Go down to the first floor');
  s.setRandom(F1(3)); s.clickLabel('Try the front door');
  s.clickLabel('I jam the key and turn it.');
  assert.match(s.text, /The lock clicks/);
  s.clickLabel('Everything goes black.'); assert.equal(s.title, 'Start');
});

test('front door stays locked without the second key', async () => {
  const s = await enterHouse(SRC);
  s.setRandom(F2(1)); s.clickLabel('Exit the storage room');
  s.clickLabel('Go down to the first floor');
  s.setRandom(F1(3)); s.clickLabel('Try the front door');
  assert.match(s.text, /The front door is locked/);
  assert.ok(!s.links.some((l) => l.label === 'I jam the key and turn it.'));
});

test('antagonist: in the same room as the player on floor 1 kills; loops back to the house', async () => {
  const s = await enterHouse(SRC);
  s.setRandom(F2(1)); s.clickLabel('Exit the storage room');
  s.setRandom(F1(0)); // killer = living room
  s.clickLabel('Go down to the first floor');
  assert.equal(s.vars.killerRoom, 'living room');
  assert.match(s.text, /cold metal/);
  s.clickLabel('Is it really the end? I find myself in the middle of nowhere standing before a house.');
  assert.equal(s.title, 'Walk towards the light');
});

test('antagonist: in the storage room the player hides instead of dying', async () => {
  const s = await loadStory(SRC, 1);
  for (const l of ['Look around and stand up', 'Walk', 'Walk towards the light', 'Check out the right side', 'Go to the back of the house', 'Climb up the barrels', 'Move towards the collapsed section']) s.clickLabel(l);
  s.setRandom(F2(5)); // storage room
  s.clickLabel('I should gather my surroundings.');
  assert.match(s.text, /I dive into the pile of junk/);
  assert.match(s.text, /the footsteps move on elsewhere/);
  assert.doesNotMatch(s.text, /cold metal/);
});

test('antagonist moves on every passage: killerRoom is re-rolled within the current floor list', async () => {
  const s = await enterHouse(SRC, 11);
  const rooms1 = ['living room', 'bathroom', 'garage', 'kitchen'];
  s.setRandom(mulberry32(5));
  s.setRandom(F2(1)); s.clickLabel('Exit the storage room');
  s.setRandom(F2(1)); s.clickLabel('Go down to the first floor');
  const seen = new Set();
  const rnd = mulberry32(77);
  for (let i = 0; i < 40 && !s.text.includes('cold metal'); i++) {
    s.setRandom(rnd);
    const nav = s.links.filter((l) => l.kind === 'passage' && /^(Return to the living room|Move towards the kitchen|Enter the garage|Go back to the living room)$/.test(l.label));
    if (!nav.length) break;
    nav[0].el.click();
    seen.add(s.vars.killerRoom);
    assert.ok(rooms1.includes(s.vars.killerRoom), s.vars.killerRoom);
  }
  assert.ok(seen.size >= 2, `killer should move between rooms (saw ${[...seen]})`);
});

test('exploration: seeded random walks reach every story passage, hit no engine error, and restart through Start', async () => {
  const visited = new Set(); const endings = { rip: 0, toast: 0, escape: 0, death: 0, hide: 0 };
  const ps = parsePassages(src).map((x) => x.title);
  for (let seed = 1; seed <= 25; seed++) {
    const s = await loadStory(SRC, seed);
    const rnd = mulberry32(seed * 31);
    for (let step = 0; step < 400; step++) {
      visited.add(s.title);
      assert.deepEqual(s.domErrors, [], `${s.title} rendered an error`);
      const nav = s.links.filter((l) => l.kind === 'passage');
      if (!nav.length) break;
      const pick = nav[Math.floor(rnd() * nav.length)];
      if (pick.label === 'RIP') endings.rip++;
      if (/grab a bite/.test(pick.label)) endings.toast++;
      if (pick.label === 'Everything goes black.') endings.escape++;
      if (/Is it really the end/.test(pick.label)) endings.death++;
      pick.el.click();
      if (/dive into|run into the closet/.test(s.text)) endings.hide++;
    }
    assert.deepEqual(s.errors, []);
  }
  // hide / wheresKiller are only ever <<display>>ed inside other passages, never the current one.
  const story = ps.filter((t) => !META.includes(t) && !['hide', 'wheresKiller'].includes(t));
  assert.deepEqual(story.filter((t) => !visited.has(t)), [], 'unvisited story passages');
  assert.ok(endings.death > 0 && endings.hide > 0, JSON.stringify(endings));
});

// ---------------------------------------------------------------- Italian
test('Italian layer: every entry matches exactly, targets and macros are untouched', () => {
  const it = buildStory(src, { layer });
  const a = new Map(parsePassages(src).map((x) => [x.title, x.text]));
  const b = new Map(parsePassages(it).map((x) => [x.title, x.text]));
  assert.deepEqual([...b.keys()], [...a.keys()], 'same passages, same order');
  for (const [t, text] of a) {
    assert.deepEqual(links(b.get(t)), links(text), `${t}: link targets`);
    assert.deepEqual(displays(b.get(t)), displays(text), `${t}: display targets`);
    const macros = (x) => (x.match(/<<(?!cyclinglink|print)[^>]*>>/g) || []).map((m) => m.replace(/"[^"]*"/g, '""'));
    assert.deepEqual(macros(b.get(t)), macros(text), `${t}: macros`);
  }
});

test('Italian layer leaves the English source passages unmodified', () => {
  assert.equal(readFileSync(EN, 'utf8').includes('Look around and stand up'), true);
  assert.equal(readFileSync(IT, 'utf8').includes('Mi guardo intorno e mi alzo'), true);
});

test('IT build plays identically to EN: same choices give the same passages and variables', async () => {
  for (let seed = 1; seed <= 15; seed++) {
    const en = await loadStory(EN, seed), it = await loadStory(IT, seed);
    const rnd = mulberry32(seed * 13);
    for (let step = 0; step < 150; step++) {
      assert.equal(it.title, en.title);
      assert.equal(it.links.length, en.links.length);
      if (!en.links.length) break;
      const k = Math.floor(rnd() * en.links.length);
      const sameVars = JSON.stringify(Object.keys(en.vars)) === JSON.stringify(Object.keys(it.vars));
      assert.ok(sameVars);
      en.click(k); it.click(k);
    }
    assert.deepEqual(it.errors, []); assert.deepEqual(it.domErrors, []);
  }
});

test('IT build shows Italian prose and Italian room names for the antagonist', async () => {
  const s = await loadStory(IT, 1);
  assert.match(s.text, /Qui fuori è così buio/);
  s.clickLabel('Mi guardo intorno e mi alzo');
  assert.match(s.text, /Per quanto tempo ho dormito/);
  assert.ok(Object.values(layer.rooms).every((r) => r.length > 3));
});

test('UI dictionaries: IT and EN define the same keys', () => {
  assert.deepEqual(Object.keys(dicts.it).sort(), Object.keys(dicts.en).sort());
});
