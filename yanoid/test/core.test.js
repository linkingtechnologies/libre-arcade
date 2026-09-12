import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateAcceleratedVelocity, paddleBounceDirection,
  historicalPowerupShouldSpawn, historicalWeightedPowerup,
  POWERUP_TOTAL_WEIGHT, contestTimeBonus,
  MIN_PADDLE_BOUNCE_ANGLE, MAX_PADDLE_BOUNCE_ANGLE,
  contestBoundingBoxInfo, resolveContestBallCollision,
} from '../public/src/core.js';
import { CONTEST_SEQUENCE, createContestMap } from '../public/src/maps.js';

test('contest sequence is exactly the 0.3.0 maplist.py sequence', () => {
  assert.deepEqual(CONTEST_SEQUENCE, ['map1','map7','map2','map4','map8','map5','map3','map6','map0','map2','map3']);
});

test('paddle acceleration reaches and clamps to original target velocity', () => {
  let v = 0;
  for (let i = 0; i < 20; i++) v = updateAcceleratedVelocity(v, 0.4, 0.002, 16);
  assert.equal(v, 0.4);
  for (let i = 0; i < 50; i++) v = updateAcceleratedVelocity(v, 0, -0.001, 16);
  assert.equal(v, 0);
});

test('center paddle hit keeps pure vertical reflection', () => {
  const incoming = 5 * Math.PI / 3;
  const out = paddleBounceDirection(incoming, 100 + 75/2, 100, 75, 0);
  assert.ok(Math.abs(out - Math.PI/3) < 1e-12);
});

test('paddle bounce is clamped away from horizontal', () => {
  const outLeft = paddleBounceDirection(5 * Math.PI / 3, 100, 100, 75, 0.4);
  const outRight = paddleBounceDirection(5 * Math.PI / 3, 175, 100, 75, -0.4);
  assert.ok(outLeft >= MIN_PADDLE_BOUNCE_ANGLE && outLeft <= MAX_PADDLE_BOUNCE_ANGLE);
  assert.ok(outRight >= MIN_PADDLE_BOUNCE_ANGLE && outRight <= MAX_PADDLE_BOUNCE_ANGLE);
});

test('historical spawn test is 19 values out of 100 at nominal 20%', () => {
  const hits = Array.from({length:100}, (_, i) => historicalPowerupShouldSpawn(i, 20)).filter(Boolean).length;
  assert.equal(hits, 19);
});

test('historical weighted lookup preserves <= boundary behavior', () => {
  assert.equal(POWERUP_TOTAL_WEIGHT, 43);
  assert.equal(historicalWeightedPowerup(0).id, 'ball');
  assert.equal(historicalWeightedPowerup(9).id, 'ball'); // 10 values for declared weight 9
  assert.equal(historicalWeightedPowerup(10).id, 'life');
});

test('contest time bonus uses the 0.3.0 per-level active-play clock', () => {
  assert.equal(contestTimeBonus(0), 900);
  assert.equal(contestTimeBonus(60_000), 600);
  assert.equal(contestTimeBonus(180_000), 0);
});

test('all nine contest maps build with one paddle start and breakable content', () => {
  for (let i = 0; i <= 8; i++) {
    const m = createContestMap(`map${i}`);
    assert.ok(m.name.length > 0);
    assert.ok(Number.isFinite(m.paddle.x));
    assert.ok(m.entities.some(e => e.type === 'brick' || e.type === 'brick-stay-3'));
  }
});

test('map8 retains dynamic callback bricks', () => {
  const m = createContestMap('map8');
  const hits = m.entities.filter(e => String(e.hit).startsWith('magic')).map(e => e.hit).sort();
  assert.deepEqual(hits, ['magic-left-chain','magic-right-chain','magic-row']);
});


test('contest bounding-box metadata matches the original corner convention', () => {
  const ball = {x:50,y:50,w:16,h:16};
  const brick = {x:60,y:60,w:75,h:25};
  assert.deepEqual(contestBoundingBoxInfo(ball, brick), {
    aPoint:{x:66,y:66}, bPoint:{x:60,y:60}, aCorner:3, bCorner:1
  });
});

test('ball already below paddle top follows the historical drain path', () => {
  const ball = {x:100,y:526,prevX:99,prevY:520,w:16,h:16,direction:5*Math.PI/3,dying:false,targetSpeed:.19};
  const paddle = {type:'paddle',x:80,y:530,w:75,h:17};
  const info = contestBoundingBoxInfo(ball,paddle);
  assert.ok(info);
  const r = resolveContestBallCollision(ball,paddle,info,0);
  assert.equal(r.dying,true);
  assert.equal(r.targetSpeed,.5);
});


test('weighted selector preserves the unreachable final +1000 quirk', () => {
  const seen = new Set();
  for (let i = 0; i < POWERUP_TOTAL_WEIGHT; i++) seen.add(historicalWeightedPowerup(i).id);
  assert.equal(seen.has('score-1000'), false);
});

test('translated maps retain audited brick counts and Python-2 integer coordinates', () => {
  const expected = [70,70,44,46,95,90,41,25,52];
  for (let i=0;i<9;i++) {
    const m=createContestMap(`map${i}`);
    assert.equal(m.entities.filter(e => e.type.startsWith('brick')).length, expected[i]);
  }
  const umbrella=createContestMap('map7');
  assert.equal(umbrella.entities.find(e => e.type.startsWith('brick')).x, 2);
});
