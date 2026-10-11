// The Story's screens, as the port draws them and as the original ROM does: the ROM is called to draw them (doOpponentScene and
// scrollOpeningText, found by their code) and the picture it would show is composed (tools/nes-frame.mjs), then compared with the port's story
// renderer (run in Node over tools/canvas-shim.mjs), pixel by pixel with a tolerance of 6 per channel (the port draws the text in pure black
// where the console shows $0F, which is 5, 5, 5).
//
//   * the six pictures of public/assets/derived/story/ are exactly what the ROM draws (tools/render-assets.mjs);
//   * the opponent scenes, all but the last one's lost text, whose missing terminator makes the original type into the attribute
//     table and spoil the colours of the picture after a few seconds (the port keeps the text and not the spoiled colours);
//   * the opening text and the instruction text, at several moments of their scroll, and the steps of the fade out.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadRom } from '../tools/rom-oracle.mjs';
import { renderFrame } from '../tools/nes-frame.mjs';
import { SoftCanvas, installBrowserShims } from '../tools/canvas-shim.mjs';
import { booted, findScrollOpeningText, logoPicture, opponentPicture, opponentScene } from '../tools/render-assets.mjs';

installBrowserShims();
const { StoryRenderer } = await import('../public/src/story-renderer.js');
const { storyScene, STORY_OPENING_LINES, SOLO_INSTRUCTION_LINES, TWO_PLAYER_INSTRUCTION_LINES } = await import('../public/src/story.js');

const rom = loadRom();
const differing = (a, b) => { let n = 0; for (let i = 0; i < 256 * 240; i++) { const o = i * 4; if ([0, 1, 2].some((k) => Math.abs(a[o + k] - b[o + k]) > 6)) n++; } return n; };

// the pictures
for (const [name, picture] of [['hombon-sprites.png', logoPicture(rom)], ...[0, 1, 2, 3, 4].map((i) => [`opponent-${i}.png`, opponentPicture(rom, i)])]) {
  assert.equal(Buffer.compare(readFileSync(new URL(`../public/assets/derived/story/${name}`, import.meta.url)), picture), 0, `${name} is not what the ROM draws`);
}

// the opponent scenes: portrait, the character, the typed text, with the original's double spacing
for (let scene = 0; scene < 15; scene++) {
  if (scene === 13) continue;
  const canvas = new SoftCanvas(), renderer = new StoryRenderer(canvas);
  renderer.showOpponent(storyScene(64 + scene, 'en'));
  for (let t = 0; t < 200; t++) renderer.tick();
  renderer.render();
  assert.equal(differing(opponentScene(rom, scene, 170).rgba, canvas.data), 0, `opponent scene ${scene} differs from the ROM`);
}

// the opening text (id 0) and the instruction text (id 1): the picture at some moments of the scroll, whichever tick of the port matches
// (the ROM's loop sometimes takes more than a frame, so its frames and the port's ticks drift apart by a few over a long scroll)
const entry = findScrollOpeningText(booted(rom));
function opening(id, lines, moments) {
  const machine = booted(rom);
  machine.cpu.a = id; machine.cpu.sp = 0xFD; machine.cpu.pc = entry;
  const canvas = new SoftCanvas(), renderer = new StoryRenderer(canvas);
  renderer.showOpening(lines);
  const ticks = [];
  for (let t = 0; t <= Math.max(...moments); t++) { renderer.render(); ticks.push(Uint8Array.from(canvas.data)); renderer.tick(); }
  let frame = 0;
  for (const moment of moments) {
    while (frame < moment) { machine.frame(); frame++; }
    const picture = renderFrame(machine).rgba;
    const window = [];
    for (let t = Math.max(0, moment - 24); t <= Math.min(ticks.length - 1, moment - 6); t++) window.push(t);
    assert.ok(window.some((t) => differing(picture, ticks[t]) === 0), `the opening text ${id} at frame ${moment} matches no tick of the port`);
  }
}
opening(0, STORY_OPENING_LINES.en, [20, 60, 240, 400]);
opening(1, SOLO_INSTRUCTION_LINES.en, [20, 120, 600, 1000, 1454, 1458, 1462]);   // the last three: the three steps of the fade
opening(4, TWO_PLAYER_INSTRUCTION_LINES.en, [20, 120, 600]);                      // the text of 2 Players and Vs. CPU

console.log('All Concentration Room story-screen render checks passed (6 pictures, 14 opponent scenes, 3 texts at 14 moments, against the ROM).');
