'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Game, STATUS, constants } = require('../public/src/core.js');

function game() { return new Game({ randomFn: () => 0, hiScore: 1000000 }); }
function initPanGeometry(g) { g.setPointer(80, 60, false); g.movePan(); g.movePan(); }

{
  const g = game();
  g.status = STATUS.IN_GAME;
  g.initBalls();
  const b = { size: 0, pos: { x: 600, y: 100 } };
  const seq = [];
  for (let i = 0; i < 10; i++) {
    seq.push(g.scoreMulti);
    g.addBallScore(b);
  }
  assert.deepEqual(seq, [1, 2, 3, 5, 7, 10, 14, 20, 28, 39]);
}

{
  const g = game();
  g.status = STATUS.IN_GAME;
  g.initBalls();
  initPanGeometry(g);
  const b = g.addBall(0, 0, 577, 100, 0, 0);
  g.moveBalls();
  assert.equal(b.color, -1, 'ball should score past x=576');
  assert.equal(g.aimScore, 3);
}

{
  const g = game();
  g.status = STATUS.IN_GAME;
  g.initBalls();
  initPanGeometry(g);
  const b = g.addBall(0, 0, 576, 100, 0, 0);
  g.moveBalls();
  assert.notEqual(b.color, -1, 'x=576 is not beyond the strict 90% threshold');
  assert.equal(g.aimScore, 0);
}

{
  const g = game();
  g.status = STATUS.TITLE;
  g.initBalls();
  const b = g.addBall(0, 0, 100, 100, 0, 0);
  g.rank = constants.RANK_BASE;
  g.moveBalls();
  assert.ok(Math.abs(b.vel.y - 0.004) < 1e-12);
}

{
  const g = game();
  g.status = STATUS.IN_GAME;
  g.initBalls();
  initPanGeometry(g);
  g.addBall(0, 0, 100, 481, 0, 0);
  g.moveBalls();
  assert.equal(g.status, STATUS.MISS);
  const active = g.balls.filter(b => b.color !== -1).length;
  assert.ok(active >= 32, 'miss explosion should create the historical 32 red particles');
}

{
  const g = game();
  g.status = STATUS.IN_GAME;
  g.initBalls();
  g.addBallScore({ size: 0, pos: { x: 600, y: 100 } });
  assert.equal(g.smTime, 20);
  for (let i = 0; i < 19; i++) g.moveBalls();
  assert.equal(g.smTime, 1);
  g.moveBalls();
  assert.equal(g.scoreMulti, 1);
  assert.equal(g.smFib, 1);
}

{
  const g = game();
  g.setPointer(100, 60, false);
  g.movePan();
  assert.ok(Math.abs(g.pan.deg - 0.092) < 1e-9, 'pan tilt coefficient/damping should match pan.c');
}


{
  const runtimeAudio = ['wok1.wav', 'wok2.wav', 'gen.wav', 'score.wav', 'miss.wav'];
  for (const name of runtimeAudio) {
    const file = path.join(__dirname, '..', 'public', 'assets', 'runtime', 'sounds', name);
    assert.ok(fs.existsSync(file), `runtime audio missing: ${name}`);
    assert.ok(fs.statSync(file).size > 44, `runtime audio empty: ${name}`);
  }
}

console.log('Wok parity tests: OK');
