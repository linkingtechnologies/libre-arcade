import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { STORY_OPENING_LINES, storyScene } from '../public/src/story.js';
import { OpeningScroller, OpponentTypewriter, STORY_PRESENTATION } from '../public/src/story-presentation.js';

// openingText deliberately falls through into instructionsText, so Story mode
// displays 47 story rows plus 4 instruction rows before the first $00.
assert.equal(STORY_OPENING_LINES.en.length, 51);
assert.equal(STORY_OPENING_LINES.en[0], 'Once upon a time in the');
assert.equal(STORY_OPENING_LINES.en[17], 'to this "bad batch"');
assert.equal(STORY_OPENING_LINES.en[45], 'in the brain.');
assert.equal(STORY_OPENING_LINES.en[46], '');
assert.equal(STORY_OPENING_LINES.en[47], 'Flip two cards, and if they');
assert.equal(STORY_OPENING_LINES.en[50], "Good luck; you'll need it!");

// Scene order and literal speaker markers match opponentScenes/liteopponents.s.
assert.equal(storyScene(64, 'en').rawText, '<Lillie>\nHey, you look fun.\nWanna play?');
assert.equal(storyScene(67, 'en').rawText, "<Ethan>\nHow dare you make my\nsister cry? You'll pay!");
assert.equal(storyScene(70, 'en').speaker, 'Venny');
assert.equal(storyScene(73, 'en').speaker, 'Snowy');
assert.equal(storyScene(76, 'en').speaker, 'Susan');
assert.equal(storyScene(78, 'en').portraitIndex, 4);
assert.match(storyScene(77, 'en').rawText, /Well done\.\n\n<Susan>\nHmmm/);

// doOpponentScene writes one character per frame.
{
  const t = new OpponentTypewriter('ABC\nD');
  assert.equal(t.text, '');
  t.tick(1); assert.equal(t.text, 'A');
  t.tick(2); assert.equal(t.text, 'ABC');
  t.tick(99); assert.equal(t.text, 'ABC\nD');
  assert.equal(t.complete, true);
}

// scrollOpeningText advances one pixel every six frames. Holding Down forces
// a scroll step each frame; holding Up pauses it.
{
  const s = new OpeningScroller(['A']);
  for (let i = 0; i < 5; i += 1) s.tick();
  assert.equal(s.scrollPx, 0);
  s.tick(); assert.equal(s.scrollPx, 1);
  s.tick({ down: true }); assert.equal(s.scrollPx, 2);
  for (let i = 0; i < 10; i += 1) s.tick({ up: true });
  assert.equal(s.scrollPx, 2);
  s.startFade();
  for (let i = 0; i < STORY_PRESENTATION.fadeFrames; i += 1) s.tick();
  assert.equal(s.finished, true);
}

// The scene pictures are what the ROM itself draws (tools/render-assets.mjs makes them from it; `node tools/render-assets.mjs --check`
// runs the ROM again and compares, and test/render-story.test.js compares the scenes with the ROM frame by frame). Their digests are pinned here.
const expected = {
  'hombon-sprites.png': '77ebd361962b570a280933aa1537ed4e93f5746f7dc812b524cffb332e1382eb',
  'opponent-0.png': 'f4f33fb0de6a3e902031eba9891b9841ed382e0f7a810046c33583b022849da8',
  'opponent-1.png': 'ff05662c34078a88e764514a1abc70e8b0edcfcece7fa93dc1127d1d7ade59b0',
  'opponent-2.png': 'a29982109601f25d5a7e79d6509b63cba6dbe97d8c636b682d3c27f7d07d8496',
  'opponent-3.png': 'a9776aeedd7694193d402522fafe3f7a84bd972ade05d6009db6fd0472b58157',
  'opponent-4.png': '0f2434dd2ed23807f52f992e89e96369db07adfc32b61b5ad507784c877b5ee2',
};
for (const [name, digest] of Object.entries(expected)) {
  const path = new URL(`../public/assets/derived/story/${name}`, import.meta.url);
  assert.equal(existsSync(path), true, `${name} missing`);
  const got = createHash('sha256').update(readFileSync(path)).digest('hex');
  assert.equal(got, digest, `${name} digest`);
}

console.log('All Concentration Room story-presentation tests passed.');
