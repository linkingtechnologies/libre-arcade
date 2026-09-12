'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/src/core.js');

function seq(values) {
  let i = 0;
  return () => values[(i++) % values.length];
}

test('timing constants preserve 60 FPS x 3 ticks per frame', () => {
  assert.equal(C.FPS, 60);
  assert.equal(C.TPF, 3);
  assert.equal(C.SIM_TPS, 180);
});

test('cardinal movement is 0.8 px per simulation tick', () => {
  const engine = new C.Engine({rng: () => 0.5});
  engine.currentLevel = new C.Tilemap(20, 20);
  const p = new C.Terramancer(1, engine);
  p.setLocation(100, 100);
  p.moveRight();
  p.tick();
  assert.equal(p.x, 100.8);
  assert.equal(p.y, 100);
});

test('diagonal movement is intentionally not normalized', () => {
  const engine = new C.Engine({rng: () => 0.5});
  engine.currentLevel = new C.Tilemap(20, 20);
  const p = new C.Terramancer(1, engine);
  p.setLocation(100, 100);
  p.moveRight();
  p.moveDown();
  p.tick();
  assert.equal(p.x, 100.8);
  assert.equal(p.y, 100.8);
});

test('Reversi connection captures neutral tiles horizontally', () => {
  const map = new C.Tilemap(8, 8);
  map.setTileset(1, 3, 1, false);
  map.setTileset(6, 3, 1, true);
  for (let x = 2; x <= 5; x++) assert.equal(map.getTilesetAt(x, 3), 1);
});

test('an obstacle blocks connection capture', () => {
  const map = new C.Tilemap(8, 8);
  map.setTileset(1, 3, 1, false);
  map.setTileset(6, 3, 1, false);
  map.setIsObstacle(4, 3, true);
  map.setTileset(1, 3, 1, true);
  assert.equal(map.getTilesetAt(2, 3), 0);
  assert.equal(map.getTilesetAt(3, 3), 0);
});

test('obstacles are removed from the neutral-tile count', () => {
  const map = new C.Tilemap(6, 6);
  assert.equal(map.getTilesetCount(0), 36);
  map.setIsObstacle(2, 2, true);
  assert.equal(map.getTilesetCount(0), 35);
  map.setIsObstacle(2, 2, false);
  assert.equal(map.getTilesetCount(0), 36);
});

test('multiplayer obstacle layout is rotationally symmetric', () => {
  const rng = seq([0.1,0.7,0.2,0.9,0.4,0.3,0.8,0.6,0.01,0.99]);
  const map = C.generateLevel(15, 13, 0.25, true, rng);
  for (let x = 0; x < map.rowSize; x++) {
    for (let y = 0; y < map.columnSize; y++) {
      assert.equal(map.isObstacle(x,y), map.isObstacle(map.rowSize-x-1,map.columnSize-y-1));
    }
  }
});

test('legacy map parser preserves byte-oriented width/height/base/addition format', () => {
  const bytes = Uint8Array.from([2,2, 10,255, 15,36, 16,255, 17,46]);
  const map = C.parseLegacyMap(bytes);
  assert.equal(map.width, 2);
  assert.equal(map.height, 2);
  assert.equal(map.base[0][0], 10);
  assert.equal(map.addition[0][1], 36);
  assert.equal(map.base[1][0], 16);
  assert.equal(map.addition[1][1], 46);
});
