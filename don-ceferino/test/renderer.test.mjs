import test from 'node:test';
import assert from 'node:assert/strict';
import { Renderer } from '../public/src/ui/renderer.js';
import { EMPTY } from '../public/src/core/constants.js';
import { ASSET_DEFS } from '../public/src/ui/assets.js';

function fakeContext() {
  const calls = [];
  return {
    calls,
    imageSmoothingEnabled: true,
    drawImage(...args) { calls.push(args); },
    save() {}, restore() {}, translate() {}, scale() {}, fillRect() {}, fillText() {},
    measureText(text) { return { width: String(text).length * 8 }; },
    set fillStyle(value) {}, set font(value) {}, set textAlign(value) {}, set textBaseline(value) {}
  };
}

function sprite(imageName, cellW = 64, cellH = 64, { cols=1, rows=1, px=0, py=0 } = {}) {
  return { image:{ name:imageName }, cols, rows, cellW, cellH, px, py };
}


test('renderer uses the loader player asset for the gaucho', () => {
  const ctx = fakeContext();
  const canvas = { getContext: () => ctx };
  const assets = {
    background: sprite('background',640,480),
    player: sprite('gaucho',64,64)
  };
  const renderer = new Renderer(canvas, assets);
  const game = {
    level: { visualTile: () => EMPTY },
    blocks: [], items: [], balls: [], shots: [], bombs: [],
    player: { frame:0, x:100, y:100, flip:1 },
    flashTicks:0, state:'playing', messages:[],
    levelNumber:1, lives:3, points:0, time:30
  };
  const labels = { level:'Level', lives:'Lives', points:'Points', time:'Time', pause:'Pause' };

  assert.doesNotThrow(() => renderer.render(game, labels));
  assert.ok(ctx.calls.some(args => args[0]?.name === 'gaucho'), 'gaucho sprite was drawn');
});


test('gaucho renderer crop and control point match the historical 3x8 sheet', () => {
  const ctx = fakeContext();
  const canvas = { getContext: () => ctx };
  const def = ASSET_DEFS.player;
  assert.deepEqual(
    {rows:def.rows, cols:def.cols, px:def.px, py:def.py},
    {rows:3, cols:8, px:43, py:105}
  );
  const assets = {
    background: sprite('background',640,480),
    player: sprite('gaucho',110,110,{cols:8,rows:3,px:43,py:105})
  };
  const renderer = new Renderer(canvas, assets);
  const game = {
    level: { visualTile: () => EMPTY },
    blocks: [], items: [], balls: [], shots: [], bombs: [],
    player: { frame:9, x:100, y:200, flip:1 },
    flashTicks:0, state:'playing', messages:[],
    levelNumber:1, lives:3, points:0, time:30
  };
  const labels = { level:'Level', lives:'Lives', points:'Points', time:'Time', pause:'Pause' };
  renderer.render(game, labels);
  const call = ctx.calls.find(args => args[0]?.name === 'gaucho');
  assert.ok(call);
  // Frame 9 = column 1, row 1 on an 8-column 110x110 sheet.
  assert.deepEqual(call.slice(1), [110,110,110,110,57,95,110,110]);
});
