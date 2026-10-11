import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { TitleFlow, TITLE_SCREEN, TITLE_MAIN_ITEMS } from '../public/src/title-flow.js';
import { MODE } from '../public/src/rules.js';
import { SOLO_INSTRUCTION_LINES, TWO_PLAYER_INSTRUCTION_LINES, CREDITS_LINES } from '../public/src/story.js';

const flow = new TitleFlow();
assert.equal(flow.screen, TITLE_SCREEN.MAIN);
assert.equal(flow.selected, 0);
assert.deepEqual(TITLE_MAIN_ITEMS, [MODE.STORY, MODE.SOLITAIRE, MODE.TWO_PLAYER, MODE.VS_CPU]);

flow.move(-1); assert.equal(flow.selected, 0); // historical menu clamps, does not wrap
flow.move(1); assert.equal(flow.selected, 1);
let event = flow.activate();
assert.equal(event.type, 'submenu');
assert.equal(event.mode, MODE.SOLITAIRE);
assert.equal(flow.screen, TITLE_SCREEN.DIFFICULTY);
assert.equal(flow.itemCount, 5);
assert.equal(flow.selected, 0);

flow.select(4);
event = flow.activate();
assert.deepEqual(event, { type: 'start', mode: MODE.SOLITAIRE, difficulty: 4 });
assert.equal(flow.difficulty, 4);

flow.reset();
flow.select(2);
flow.activate();
assert.equal(flow.selected, 4); // remembers last difficulty exactly like 0.02 global difficulty
assert.equal(flow.back(), true);
assert.equal(flow.screen, TITLE_SCREEN.MAIN);
assert.equal(flow.selected, 2);

flow.reset();
event = flow.activate();
assert.deepEqual(event, { type: 'start', mode: MODE.STORY, difficulty: 4 });

assert.deepEqual(SOLO_INSTRUCTION_LINES.en, [
  'Flip two cards, and if they',
  'match, you keep them. If',
  "they don't, flip them back.",
  "Good luck; you'll need it!",
]);
assert.equal(TWO_PLAYER_INSTRUCTION_LINES.en.length, 8);
assert.equal(TWO_PLAYER_INSTRUCTION_LINES.en[0], 'Press the A and B Buttons');
assert.equal(TWO_PLAYER_INSTRUCTION_LINES.en.at(-1), 'other player to win.');
assert.ok(CREDITS_LINES.en.includes('Program by Damian Yerrick'));
assert.ok(CREDITS_LINES.en.includes('and Sara Crickard'));
assert.ok(CREDITS_LINES.en.includes('Libre Arcade'));

const titlePng = new URL('../public/assets/derived/title/title-screen-historical.png', import.meta.url);
const png = fs.readFileSync(titlePng);
assert.equal(png.subarray(1,4).toString('ascii'), 'PNG');
const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
assert.deepEqual([width,height], [256,240]);
const sha = crypto.createHash('sha256').update(png).digest('hex');
// what the ROM draws for the title (tools/render-assets.mjs makes it; test/render-title.test.js compares the title screen with the ROM)
assert.equal(sha, '593100da6022aae3eac4ac35dcd9c66d0343ca460f2c32bb0f3fa4d1f1739e19');

console.log('All Concentration Room title/menu tests passed.');
