import test from 'node:test';
import assert from 'node:assert/strict';

function installBrowserStubs() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => store.has(k) ? store.get(k) : null,
    setItem: (k,v) => store.set(k,String(v)),
  };
  globalThis.Image = class { constructor(){ this.complete=false; this.naturalWidth=0; this.src=''; } };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  const ctx = {
    imageSmoothingEnabled: true,
    clearRect(){}, fillRect(){}, drawImage(){}, save(){}, restore(){}, fillText(){},
    set fillStyle(v){}, set font(v){}, set textAlign(v){}, set textBaseline(v){},
  };
  return { canvas: { getContext: () => ctx }, audio: new Proxy({}, { get: () => () => {} }) };
}

async function makeGame(callbacks = {}) {
  const { canvas, audio } = installBrowserStubs();
  const { YanoidGame } = await import('../public/src/game.js');
  return new YanoidGame(canvas, audio, callbacks);
}

test('game engine creates and advances the contest first stage without a browser DOM', async () => {
  const game = await makeGame();
  game.newGame();
  assert.equal(game.mapId, 'map1');
  assert.equal(game.lives, 5);
  assert.equal(game.breakableCount, 70);
  assert.equal(game.balls.length, 1);
  const x = game.balls[0].x;
  game.pauseUntil = 0;
  game.update(16);
  assert.notEqual(game.balls[0].x, x);
  assert.equal(game.levelElapsedMs, 16);
  game.shotMode = 'normal';
  game.shotUntil = game.levelElapsedMs + 20_000;
  game.fire();
  assert.equal(game.shots.length, 1);
});

test('new map preserves the historical SetPaddle launch quirk', async () => {
  const game = await makeGame();
  game.newGame();
  assert.equal(game.paddle.currentVelocity, 2.0);
  assert.equal(game.paddle.targetVelocity, 0);
  assert.equal(game.paddle.acceleration, -0.03);
  const x = game.paddle.x;
  game.pauseUntil = 0;
  game.update(10);
  assert.equal(game.paddle.currentVelocity, 1.7);
  assert.ok(game.paddle.x > x);
});

test('ball-loss reset keeps paddle current velocity like 0.3.0 CUT', async () => {
  const game = await makeGame();
  game.newGame();
  game.pauseUntil = 0;
  game.paddle.currentVelocity = -0.25;
  game.paddle.targetVelocity = -0.4;
  game.paddle.acceleration = -0.002;
  game.balls[0].removable = true;
  game.cleanupEntities();
  game.loseBall(game.levelElapsedMs);
  assert.equal(game.paddle.x, 380);
  assert.equal(game.paddle.currentVelocity, -0.25);
  assert.equal(game.paddle.targetVelocity, 0);
  assert.equal(game.paddle.acceleration, 0);
});

test('REMOVEALL respects TBrick::MarkDying and cannot remove brick-stay entities', async () => {
  const game = await makeGame();
  game.newGame();
  const stay = game.entities.find(e => e.type === 'brick-stay');
  // map1 has no brick-stay; add one exactly as the map API would.
  const b = stay || game.addBrick({type:'brick-stay', x:100, y:100, sprite:'gray_stay_75.png', hit:'stay'});
  const before = game.breakableCount;
  game.forceRemoveBrick(b);
  assert.equal(b.removable, false);
  assert.equal(game.breakableCount, before); // indestructible bricks never count toward map completion
});

test('MAPDONE transition preserves the two 1500 ms native text phases', async () => {
  const seen = [];
  const game = await makeGame({ text: (key, data) => { seen.push([key,data]); return key; } });
  game.newGame();
  game.pauseUntil = 0;
  game.completeStage(60_000);
  assert.equal(game.transition.kind, 'stage-complete');
  assert.ok(Math.abs((game.transition.dueAt - game.transition.bonusAt) - 1500) < 1e-6);
  assert.ok(Math.abs((game.transition.bonusAt + 1500) - game.transition.dueAt) < 1e-6);
  assert.equal(game.transition.bonus, 600);
});

test('map8 chain bricks preserve the two Python basic_brick_hit callbacks per impact', async () => {
  const game = await makeGame();
  game.newGame();
  game.stageIndex = 4; // map8 in contest sequence
  game.loadStage();
  const chain = game.entities.find(e => e.hit === 'magic-right-chain');
  assert.ok(chain);
  const oldRandom = Math.random;
  Math.random = () => 0; // no random power-up spawn
  try {
    const before = game.score;
    game.runBrickCallback(chain, 0);
    assert.equal(game.score - before, 20);
    assert.equal(game.pending.length, 2);
  } finally {
    Math.random = oldRandom;
  }
});

test('paddle/static wall contact stops current velocity but keeps target velocity', async () => {
  const game = await makeGame();
  game.newGame();
  game.pauseUntil = 0;
  game.paddle.x = 720;
  game.paddle.currentVelocity = 0.4;
  game.paddle.targetVelocity = 0.4;
  game.paddle.acceleration = 0.002;
  game.updatePaddle(20, 20);
  assert.equal(game.paddle.x, 799 - game.paddle.w);
  assert.equal(game.paddle.currentVelocity, 0);
  assert.equal(game.paddle.acceleration, 0);
  assert.equal(game.paddle.targetVelocity, 0.4);
  // The native min/max tracker saw the overshoot before collision correction.
  assert.ok(game.paddle.maxx > 799);
});

test('brick removal and map completion are deferred to the next physics update', async () => {
  const game = await makeGame();
  game.newGame();
  const b = game.entities.find(e => e.countsForCompletion);
  game.breakableCount = 1;
  // Isolate one counted brick for this lifecycle test.
  for (const other of game.entities) if (other !== b && other.countsForCompletion) other.countsForCompletion = false;
  game.hitBrick(b, {}, 0);
  assert.equal(b.removable, true);
  assert.equal(game.breakableCount, 1);
  game.cleanupEntities();
  assert.equal(game.breakableCount, 0);
});

test('simultaneous last-ball/last-brick follows native MAPDONE overwrite semantics', async () => {
  const game = await makeGame();
  game.newGame();
  game.pauseUntil = 0;
  game.lives = 1;
  game.balls.length = 0;
  game.entities = game.entities.filter(e => e.type !== 'ball');
  game.breakableCount = 0;
  game.updateStep(1, 1000);
  assert.equal(game.lives, 1); // DEAD would not decrement, then MAPDONE wins
  assert.equal(game.state, 'playing');
  assert.equal(game.transition?.kind, 'stage-complete');

  const game2 = await makeGame();
  game2.newGame();
  game2.pauseUntil = 0;
  game2.lives = 3;
  game2.balls.length = 0;
  game2.entities = game2.entities.filter(e => e.type !== 'ball');
  game2.breakableCount = 0;
  game2.updateStep(1, 1000);
  assert.equal(game2.lives, 2); // CUT decrements before MAPDONE overwrites status
  assert.equal(game2.transition?.kind, 'stage-complete');
});

test('manual pause freezes presentation deadlines as well as gameplay time', async () => {
  const game = await makeGame();
  game.newGame();
  const base = performance.now();
  game.pauseUntil = base + 1000;
  game.messageUntil = base + 1000;
  game.transition = { kind: 'stage-complete', bonus: 100, bonusShown: false, bonusAt: base + 500, dueAt: base + 1000 };
  game.pause();
  // Simulate one second spent paused without sleeping the test.
  game.pausedAt -= 1000;
  const oldPauseUntil = game.pauseUntil;
  const oldMessageUntil = game.messageUntil;
  const oldBonusAt = game.transition.bonusAt;
  const oldDueAt = game.transition.dueAt;
  game.resume();
  assert.ok(game.pauseUntil >= oldPauseUntil + 990);
  assert.ok(game.messageUntil >= oldMessageUntil + 990);
  assert.ok(game.transition.bonusAt >= oldBonusAt + 990);
  assert.ok(game.transition.dueAt >= oldDueAt + 990);
});
