import assert from 'node:assert/strict';
import { CALIBRATION, FIXED_DT } from '../public/src/config.js';
import { DocDonkeysParityPhysics, applyStaticContactResponse, collideCircleChain } from '../public/src/physics/docdonkeys-parity.js';
import { GEOMETRY } from '../public/src/physics/docdonkeys-geometry.js';

const state={gameOver:false};
const idle={down:{left:false,right:false,launch:false,restart:false}};

// Box2D b2_velocityThreshold = 1 m/s = 50 px/s. Slow contacts must not bounce.
let b={vx:0,vy:20,omega:0,r:9};
applyStaticContactResponse(b,{x:0,y:-1},0,.2);
assert(Math.abs(b.vy)<1e-9,'slow contact should be inelastic');

// Above the threshold the historical 0.3 ball restitution remains active.
b={vx:0,vy:200,omega:0,r:9};
applyStaticContactResponse(b,{x:0,y:-1},0,.2);
assert(Math.abs(b.vy+60)<1e-6,'fast contact should retain restitution');

// b2ChainShape::CreateChain is OPEN. The old JS solver incorrectly added last->first.
b={x:84.8,y:614.6,vx:0,vy:0,omega:0,r:9};
assert.equal(collideCircleChain(b,GEOMETRY.leftBumperHugger,0,.2),false,'left bumper hugger must not contain phantom closing segment');
b={x:312.65,y:617.55,vx:0,vy:0,omega:0,r:9};
assert.equal(collideCircleChain(b,GEOMETRY.rightBumperHugger,0,.2),false,'right bumper hugger must not contain phantom closing segment');

// Sleep/wake uses the exact Box2D 2.3.2 tolerances recorded in config.
let p=new DocDonkeysParityPhysics();
p.ball.active=false;for(let i=0;i<120;i++)p.update(FIXED_DT,idle,state,{});
p.ball.active=true;p.ball.vx=0;p.ball.vy=0;p.ball.omega=0;p.ball.asleep=false;p.ball.sleepTime=0;
for(let i=0;i<Math.ceil(CALIBRATION.box2d.timeToSleepSeconds/FIXED_DT)+1;i++)p.updateSleepState(FIXED_DT,true);
assert.equal(p.ball.asleep,true,'resting ball should sleep');
for(let i=0;i<10;i++)p.update(FIXED_DT,idle,state,{});
assert.equal(p.ball.asleep,true,'sleeping ball should remain asleep while the table is still');
p.update(FIXED_DT,{down:{left:true,right:false,launch:false,restart:false}},state,{});
assert.equal(p.ball.asleep,false,'flipper input should wake sleeping ball');

// A BeginContact-like callback must fire once even when the same contact persists across substeps.
p=new DocDonkeysParityPhysics();
let hitCount=0;const frameContacts=new Set();
p.hit('synthetic',frameContacts,()=>hitCount++);p.hit('synthetic',frameContacts,()=>hitCount++);
assert.equal(hitCount,1,'solid contact callback must be debounced within the frame');
let sensorScores=0;const frameSensors=new Set();p.ball.x=190;p.ball.y=228;p.ball.vx=0;p.ball.vy=0;
p.solveSensors(frameSensors,{onScore:()=>sensorScores++});p.solveSensors(frameSensors,{onScore:()=>sensorScores++});
assert.equal(sensorScores,1,'sensor enter must be debounced within the frame');

// ModuleSceneIntro applies ramp body mutations after Box2D::Step, not inside it.
p=new DocDonkeysParityPhysics();
p.onSensorEnter('rampActivate0',{});
assert.equal(p.flags.rampsActive,true,'logical ramp state should update on sensor enter');
assert.equal(p.collisionRampsActive,false,'physical ramp geometry must remain old until frame end');
p.ball.active=false;
p.update(FIXED_DT,idle,state,{});
assert.equal(p.collisionRampsActive,true,'physical ramp geometry should update after the frame');

// Adaptive substeps prevent a high-speed ball from skipping the 3px top post.
p=new DocDonkeysParityPhysics();
p.ball={...p.ball,x:35,y:165,vx:5000,vy:0,omega:0,active:true,asleep:false,sleepTime:0};
p.update(FIXED_DT,idle,state,{onLoseBall:()=>{}});
assert(p.lastSubsteps>4,'high-speed motion should increase substeps');
assert(p.ball.x<55,'high-speed ball should not tunnel through the top post');

console.log('Physics hardening regressions: PASS');
