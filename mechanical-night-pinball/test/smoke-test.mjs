import assert from 'node:assert/strict';
import { createGameState, addScore, increaseMultiplier, addBall, loseBall, restartGame } from '../public/src/state.js';
import { FIXED_DT, PARITY } from '../public/src/config.js';
import { GEOMETRY } from '../public/src/physics/docdonkeys-geometry.js';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';

const state=createGameState();assert.equal(state.balls,3);assert.equal(state.multiplier,1);assert.equal(addScore(state,44),44);increaseMultiplier(state);assert.equal(state.multiplier,2);addBall(state);assert.equal(state.balls,4);loseBall(state);assert.equal(state.balls,3);restartGame(state);assert.equal(state.balls,3);assert.equal(state.score,0);
assert.equal(PARITY.gravityPixelsPerSecond2,350);assert.equal(PARITY.pixelsPerMeter,50);assert.equal(PARITY.flippers.left.activeSpeed,-25);assert.equal(PARITY.kicker.returnMotorSpeedMetersPerSecond,-15);
assert.equal(GEOMETRY.outsideWalls.length,115);assert.equal(GEOMETRY.leftRampWalls.length,26);assert.equal(GEOMETRY.rightRampWalls.length,13);

const input={down:{left:false,right:false,launch:false,restart:false}};const p=new DocDonkeysParityPhysics();
// Gravity is live immediately; there is no artificial awaiting-launch freeze.
const y0=p.ball.y;p.update(FIXED_DT,input,state,{});assert(p.ball.y>y0);
// calibrated joint respects the Box2D slop boundary (~47 degrees, not a hard 45 clamp)
input.down.left=true;for(let i=0;i<12;i++)p.update(FIXED_DT,input,state,{});assert(Math.abs(p.flippers.left.angle*180/Math.PI+47)<0.2);input.down.left=false;for(let i=0;i<14;i++)p.update(FIXED_DT,input,state,{});assert(Math.abs(p.flippers.left.angle*180/Math.PI-2)<0.2);
// launcher/plunger yields downward while held and returns upward after release
const ky=p.kicker.y;input.down.launch=true;for(let i=0;i<20;i++)p.update(FIXED_DT,input,state,{});assert(p.kicker.y>ky);input.down.launch=false;for(let i=0;i<6;i++)p.update(FIXED_DT,input,state,{});assert(p.kicker.vy<=0);
// sensor rule: four top lights increase multiplier and reset
p.reset();state.multiplier=1;let mult=0;const hooks={onScore:()=>{},onMultiplier:()=>{mult++;}};for(let i=0;i<4;i++){p.onSensorEnter(`top${i}`,hooks);}assert.equal(mult,1);assert.deepEqual(p.flags.lightsTop,[false,false,false,false]);
// top-left quartet unlocks third ramp and removes top-right bumper
for(let i=0;i<4;i++)p.onSensorEnter(`topLeft${i}`,hooks);assert.equal(p.flags.thirdRamp,true);assert.equal(p.topRightBumperActive,false);
// tunnel exit values are preserved in pixel/s conversion
p.onSensorEnter('tunnelLeft',{onScore:()=>{}});assert(p.tunnel);for(let i=0;i<121;i++)p.update(FIXED_DT,input,state,{});assert.equal(p.tunnel,null);assert.equal(p.ball.x,408);assert.equal(p.ball.vx,-250);
console.log('Core physics smoke: PASS');
