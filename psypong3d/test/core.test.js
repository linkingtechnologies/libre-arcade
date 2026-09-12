import test from 'node:test';
import assert from 'node:assert/strict';
import { PsyPongGame, MODES } from '../public/src/core/game.js';

function game(seed=123){const g=new PsyPongGame({seed,cameraRotate:false,swap:false});g.start(MODES.SINGLE);return g;}

test('level reproduces original odd-second increment cadence',()=>{const g=game();for(let i=0;i<199;i++)g.step(5);assert.equal(g.level,1);g.step(5);assert.equal(g.elapsedMs,1000);assert.equal(g.level,2);for(let i=0;i<400;i++)g.step(5);assert.equal(g.elapsedMs,3000);assert.equal(g.level,3);});

test('top/bottom wall collision reverses Z direction',()=>{const g=game();g.ball.z=-31;g.ball.front=false;g.step(5);assert.equal(g.ball.front,true);});

test('paddle collision reverses X direction',()=>{const g=game();g.ball.right=false;g.ball.front=true;g.ball.x=-63.99;g.ball.z=0;g.step(5);assert.equal(g.ball.right,true);});

test('missing a paddle awards point to farthest player and recenters ball',()=>{const g=game();g.ball.x=77;g.ball.right=true;g.step(5);assert.equal(g.players[0].score,1);assert.equal(g.ball.x,0);assert.equal(g.ball.z,0);});

test('same seed yields deterministic simulation',()=>{const a=new PsyPongGame({seed:42}),b=new PsyPongGame({seed:42});a.start(MODES.DEMO);b.start(MODES.DEMO);for(let i=0;i<5000;i++){a.step(5);b.step(5);}assert.deepEqual(a.snapshot(),b.snapshot());});

test('warp carries paddle across the opposite boundary',()=>{const g=game();g.players[0].z=-51;g.step(5);assert.ok(g.players[0].z>30);});

test('level-1 ball advances by the original 0.016 units per gameplay step',()=>{const g=game();const x=g.ball.x,z=g.ball.z;g.step(5);assert.ok(Math.abs(Math.abs(g.ball.x-x)-0.016)<1e-12);assert.ok(Math.abs(Math.abs(g.ball.z-z)-0.016)<1e-12);});

test('camera rotation is accumulated on the original 25 ms timer cadence',()=>{const g=new PsyPongGame({seed:7,cameraRotate:true,swap:false});g.start(MODES.SINGLE);for(let i=0;i<4;i++)g.step(5);assert.equal(g.cameraAccumMs,20);g.step(5);assert.equal(g.cameraAccumMs,0);});
