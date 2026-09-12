'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../public/src/core.js');
const U = require('../public/src/browser-utils.js');

function countOwned(map, id) {
  let total = 0;
  for (let x = 0; x < map.rowSize; x++) {
    for (let y = 0; y < map.columnSize; y++) {
      if (map.getTilesetAt(x, y) === id) total++;
    }
  }
  return total;
}

test('walking animation advances on the historical 60 Hz repaint cadence', () => {
  const engine = new C.Engine({rng: () => 0.5});
  engine.currentLevel = new C.Tilemap(10, 10);
  const p = new C.Terramancer(1, engine);
  p.moveRight();

  assert.equal(p.animationFrame, 0);
  assert.equal(p.animationFrameCounter, 0);
  p.advanceAnimationFrame();
  assert.equal(p.animationFrame, 1);
  assert.equal(p.animationFrameCounter, 5);
  for (let i = 0; i < 5; i++) p.advanceAnimationFrame();
  assert.equal(p.animationFrame, 1);
  assert.equal(p.animationFrameCounter, 0);
  p.advanceAnimationFrame();
  assert.equal(p.animationFrame, 2);
  assert.equal(p.animationFrameCounter, 5);
});

test('tree paint cadence preserves reloadTime 50 behavior', () => {
  const engine = new C.Engine({rng: () => 0.55});
  engine.currentLevel = new C.Tilemap(10, 10);
  const tree = new C.Tree(4, 4, engine, () => 0.55); // direction 5: right

  tree.tick();
  assert.equal(countOwned(engine.currentLevel, 2), 1);
  for (let i = 0; i < 50; i++) tree.tick();
  assert.equal(countOwned(engine.currentLevel, 2), 1);
  tree.tick();
  assert.equal(countOwned(engine.currentLevel, 2), 2);
});

test('difficulty levels preserve 6/8/10 tree counts', () => {
  const expected = new Map([[1, 6], [2, 8], [3, 10]]);
  for (const [difficulty, trees] of expected) {
    const engine = new C.Engine({rng: () => 0.5});
    engine.setScreenSize(640, 480);
    engine.startSinglePlayerGame(difficulty);
    assert.equal(engine.objects.length, trees);
    assert.equal(engine.players.length, 1);
    assert.equal(engine.previousDifficulty, difficulty);
  }
});

test('single-player spawn matches the Java screen-center formula', () => {
  const engine = new C.Engine({rng: () => 0.5});
  engine.setScreenSize(640, 480);
  engine.startSinglePlayerGame(1);
  assert.equal(engine.players[0].x, 288);
  assert.equal(engine.players[0].y, 208);
});

test('multiplayer spawn positions and no-tree rule match the Java source', () => {
  const engine = new C.Engine({rng: () => 0.5});
  engine.setScreenSize(640, 480);
  engine.startMultiplayerGame();
  assert.equal(engine.players.length, 2);
  assert.equal(engine.objects.length, 0);
  assert.deepEqual([engine.players[0].x, engine.players[0].y], [64, 64]);
  assert.deepEqual([engine.players[1].x, engine.players[1].y], [608, 448]);
});

test('map dimensions are derived from logical screen size exactly as Java', () => {
  const engine = new C.Engine({rng: () => 0.5});
  engine.setScreenSize(800, 600);
  assert.deepEqual(engine.mapDimensions(), {rows: 26, cols: 19});
});

test('three chosen terrain families are always distinct', () => {
  for (let i = 0; i < 20; i++) {
    const values = [0.01, 0.99, 0.33, 0.75, 0.5];
    let n = i;
    const rng = () => values[(n++) % values.length];
    const selected = C.chooseDistinctTerrainTypes(rng);
    assert.equal(selected.length, 3);
    assert.equal(new Set(selected).size, 3);
  }
});

test('generated levels trigger end game when all non-obstacle neutral tiles are claimed', () => {
  let ended = 0;
  const map = C.generateLevel(9, 9, 0, false, () => 0.5, () => ended++);
  for (let x = 0; x < map.rowSize; x++) {
    for (let y = 0; y < map.columnSize; y++) {
      if (!map.isObstacle(x, y) && map.getTilesetAt(x, y) === 0) map.setTileset(x, y, 1, false);
    }
  }
  assert.equal(map.getTilesetCount(0), 0);
  assert.equal(ended, 1);
});

test('player-control percentages ignore neutral territory, matching original score logic', () => {
  const engine = new C.Engine({rng: () => 0.5});
  const map = new C.Tilemap(8, 8);
  map.setTileset(3, 3, 1, false);
  map.setTileset(4, 4, 2, false);
  engine.currentLevel = map;
  assert.equal(engine.getPlayerControl(1), 50);
  assert.equal(engine.getPlayerControl(2), 50);
});

test('responsive scene fitting never crops the frozen logical arena', () => {
  const portrait = U.fitScene(800, 600, 360, 640);
  assert.ok(portrait.drawWidth <= 360 + 1e-9);
  assert.ok(portrait.drawHeight <= 640 + 1e-9);
  assert.equal(portrait.left, 0);
  assert.ok(portrait.top > 0);

  const landscape = U.fitScene(360, 640, 640, 360);
  assert.ok(landscape.drawWidth <= 640 + 1e-9);
  assert.ok(landscape.drawHeight <= 360 + 1e-9);
  assert.ok(landscape.left > 0);
  assert.equal(landscape.top, 0);
});

test('the preserved LPC ZIP remains byte-identical', () => {
  const file = path.join(__dirname, '..', 'reference', 'originals', 'Terramancers-LPC-2012.zip');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(digest, '100a77340a9004a271ccd8a00e2387a368ade52e7a96882da0feaa01147f081a');
});
