import assert from 'node:assert/strict';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';
import { PARITY, FIXED_DT } from '../public/src/config.js';

const p=new DocDonkeysParityPhysics();
const events={scores:[],mult:0,balls:0,sfx:[],ux:[]};
const hooks={
  onScore:(base,source)=>events.scores.push({base,source}),
  onMultiplier:()=>events.mult++,
  onAddBall:()=>events.balls++,
  onSfx:(name)=>events.sfx.push(name),
  onEvent:(name)=>events.ux.push(name),
  onLoseBall:()=>{}
};

// Four upper lights: 4x11, then one multiplier step, and the bank resets.
for(let i=0;i<4;i++)p.onSensorEnter(`top${i}`,hooks);
assert.deepEqual(events.scores.slice(-4).map(x=>x.base),[11,11,11,11]);
assert.equal(events.mult,1);
assert.deepEqual(p.flags.lightsTop,[false,false,false,false]);

// Four top-left lights arm the third ramp, remove top-right bumper and reset the bank.
for(let i=0;i<4;i++)p.onSensorEnter(`topLeft${i}`,hooks);
assert.equal(p.flags.thirdRamp,true);
assert.equal(p.flags.arrows[2],true);
assert.equal(p.topRightBumperActive,false);
assert.deepEqual(p.flags.lightsTopLeft,[false,false,false,false]);
assert(events.ux.includes('thirdRampReady'));

// Third-ramp hit restores the bumper and awards the DocDonkeys 100000 base score.
p.onSensorEnter('thirdRamp',hooks);
assert.equal(events.scores.at(-1).base,PARITY.scores.thirdRamp);
assert.equal(p.flags.thirdRamp,false);
assert.equal(p.topRightBumperActive,true);

// Middle-light pair arms the two-ramp extra-ball challenge; both finishes add exactly one ball.
p.onSensorEnter('middle0',hooks);p.onSensorEnter('middle1',hooks);
assert.deepEqual(p.flags.arrows.slice(0,2),[true,true]);
p.flags.rampsActive=true;p.onSensorEnter('rampFinishLeft',hooks);
p.flags.rampsActive=true;p.onSensorEnter('rampFinishRight',hooks);
assert.equal(events.balls,1);
assert.deepEqual(p.flags.lightsMiddle,[false,false]);
assert.deepEqual(p.flags.rampEventDone,[false,false]);

// Peg consumption itself scores nothing in the C++ clone; restoration awards 9 per missing peg.
p.reset();events.scores.length=0;
p.pegsActive=[false,true,false];p.flags.pegs=[true,false,true];p.flags.rampDone[0]=true;
p.onSensorEnter('down0',hooks); // 9 points and lights the lower insert
assert.equal(events.scores.reduce((a,x)=>a+x.base,0),9);
assert.equal(p.flags.lightsDown[0],true);
p.flags.rampDone[0]=true;
p.onSensorEnter('down0',hooks); // 9 sensor + 2 missing pegs x 9
assert.equal(events.scores.reduce((a,x)=>a+x.base,0),36);
assert.deepEqual(p.pegsActive,[true,true,true]);

// Tunnel preserves the 2s delay and documented opposite-side exit.
p.reset();events.scores.length=0;p.onSensorEnter('tunnelLeft',hooks);
assert.equal(events.scores.at(-1).base,33);assert(p.tunnel);
const state={gameOver:false},input={down:{left:false,right:false,launch:false,restart:false}};
for(let i=0;i<121;i++)p.update(FIXED_DT,input,state,hooks);
assert.equal(p.tunnel,null);assert.equal(p.ball.x,408);assert.equal(p.ball.y,303);assert.equal(p.ball.vx,-250);assert.equal(p.ball.vy,-200);

console.log('Gameplay parity: PASS');
