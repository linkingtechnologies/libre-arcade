import assert from 'node:assert/strict';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, VIEWPORT_HEIGHT } from '../public/src/config.js';
import { VerticalFollowCamera } from '../public/src/camera.js';

assert.equal(LOGICAL_WIDTH,428);
assert.equal(LOGICAL_HEIGHT,822);
assert.equal(VIEWPORT_HEIGHT,600);
assert.equal(LOGICAL_HEIGHT-VIEWPORT_HEIGHT,222);

const camera=new VerticalFollowCamera();
assert.equal(camera.y,222,'camera starts at bottom');

const snap=(y,vy=0,active=true,tunnel=null)=>({ball:{y,vy,active},tunnel});
for(let i=0;i<120;i++)camera.update(snap(90,-500),1/60);
assert(camera.y<5,'camera reaches top for a high ball');
assert(camera.targetY>=0 && camera.targetY<=222);

for(let i=0;i<120;i++)camera.update(snap(720,0),1/60);
assert(Math.abs(camera.y-222)<0.1,'camera returns to launcher area');

camera.reset();
for(let i=0;i<60;i++)camera.update(snap(700,0,false,{exit:'right'}),1/60);
assert(camera.y<222,'camera anticipates a high tunnel exit');

console.log('Vertical follow-camera: PASS');
