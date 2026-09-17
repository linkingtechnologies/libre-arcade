import assert from 'node:assert/strict';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';
import { createGameState, increaseMultiplier, addBall, loseBall } from '../public/src/state.js';
import { FIXED_DT, PARITY } from '../public/src/config.js';

function fixture(){
  const physics=new DocDonkeysParityPhysics({flipperProfile:'flash-enhanced'});
  const state=createGameState();
  const trace=[];
  const hooks={
    onScore:(base,source)=>trace.push(['score',base,source]),
    onMultiplier:()=>{increaseMultiplier(state);trace.push(['mult',state.multiplier]);},
    onAddBall:()=>{addBall(state);trace.push(['ball',state.balls]);},
    onLoseBall:()=>{loseBall(state);trace.push(['drain',state.balls]);},
    onSfx:()=>{}, onEvent:(name)=>trace.push(['event',name]), onLaunch:()=>trace.push(['launch'])
  };
  return {physics,state,trace,hooks};
}

// 1) MULTIPLIER: collect 4 -> increment -> reset -> can repeat.
{
  const {physics,state,hooks}=fixture();
  for(let i=0;i<3;i++) physics.debugInject(`top${i}`,hooks);
  assert.deepEqual(physics.flags.lightsTop,[true,true,true,false]);
  assert.equal(state.multiplier,1);
  physics.debugInject('top3',hooks);
  assert.equal(state.multiplier,2);
  assert.deepEqual(physics.flags.lightsTop,[false,false,false,false]);
  for(let i=0;i<4;i++) physics.debugInject(`top${i}`,hooks);
  assert.equal(state.multiplier,3);
}

// 2) RAMP KEY / THIRD RAMP: first completion arms, second completion while armed increases multiplier.
{
  const {physics,state,hooks}=fixture();
  for(let i=0;i<4;i++) physics.debugInject(`topLeft${i}`,hooks);
  assert.equal(physics.flags.thirdRamp,true);
  assert.equal(physics.flags.arrows[2],true);
  assert.equal(physics.topRightBumperActive,false);
  assert.deepEqual(physics.flags.lightsTopLeft,[false,false,false,false]);
  for(let i=0;i<4;i++) physics.debugInject(`topLeft${i}`,hooks);
  assert.equal(state.multiplier,2);
  assert.equal(physics.flags.thirdRamp,true,'second key bank must not disarm third ramp');
  assert.equal(physics.topRightBumperActive,false);
}

// 3) THIRD RAMP: active -> hit -> reward state resets and top-right bumper returns.
{
  const {physics,trace,hooks}=fixture();
  for(let i=0;i<4;i++) physics.debugInject(`topLeft${i}`,hooks);
  physics.debugInject('thirdRamp',hooks);
  assert.equal(physics.flags.thirdRamp,false);
  assert.equal(physics.flags.arrows[2],false);
  assert.equal(physics.topRightBumperActive,true);
  assert(trace.some(e=>e[0]==='score'&&e[1]===PARITY.scores.thirdRamp));
}

// 4) TWO-RAMP EVENT: middle pair -> two arrows -> either finish order -> one extra ball and complete reset.
for(const order of [['rampFinishLeft','rampFinishRight'],['rampFinishRight','rampFinishLeft']]){
  const {physics,state,hooks}=fixture();
  physics.debugInject('middle0',hooks);physics.debugInject('middle1',hooks);
  assert.deepEqual(physics.flags.arrows.slice(0,2),[true,true]);
  const balls=state.balls;
  physics.debugInject(order[0],hooks);
  assert.equal(state.balls,balls);
  physics.debugInject(order[1],hooks);
  assert.equal(state.balls,balls+1);
  assert.deepEqual(physics.flags.lightsMiddle,[false,false]);
  assert.deepEqual(physics.flags.rampEventDone,[false,false]);
  assert.deepEqual(physics.flags.arrows.slice(0,2),[false,false]);
}

// 5) PEG RECOVERY: peg hits -> ramp completion -> down light -> repeat -> restore all pegs.
{
  const {physics,trace,hooks}=fixture();
  physics.debugInject('peg0',hooks);physics.debugInject('peg2',hooks);
  assert.deepEqual(physics.pegsActive,[false,true,false]);
  physics.debugInject('rampFinishLeft',hooks);
  physics.debugInject('down0',hooks);
  assert.equal(physics.flags.lightsDown[0],true);
  assert.deepEqual(physics.pegsActive,[false,true,false]);
  physics.debugInject('rampFinishLeft',hooks);
  physics.debugInject('down0',hooks);
  assert.equal(physics.flags.lightsDown[0],false);
  assert.deepEqual(physics.pegsActive,[true,true,true]);
  const recoveryScores=trace.filter(e=>e[0]==='score'&&e[1]===PARITY.scores.pegRecovery);
  assert.equal(recoveryScores.length,4,'two down sensors + two restored pegs');
}

// 6) RAMP GEOMETRY STATE: activation and deactivation are reversible.
{
  const {physics,hooks}=fixture();
  physics.debugInject('rampActivate0',hooks);assert.equal(physics.flags.rampsActive,true);
  physics.debugInject('rampDeactivate0',hooks);assert.equal(physics.flags.rampsActive,false);
}

// 7) TUNNEL both directions: enter -> hidden -> timeout -> documented opposite exit.
for(const [entry,exit] of [['tunnelLeft',PARITY.tunnelExits.right],['tunnelRight',PARITY.tunnelExits.left]]){
  const {physics,hooks}=fixture();
  physics.debugInject(entry,hooks);
  assert(physics.tunnel);assert.equal(physics.ball.active,false);
  physics.debugInject('tunnelTimeout',hooks);
  assert.equal(physics.tunnel,null);assert.equal(physics.ball.active,true);
  assert.equal(physics.ball.x,exit.x);assert.equal(physics.ball.y,exit.y);
  assert.equal(physics.ball.vx,exit.vx);assert.equal(physics.ball.vy,exit.vy);
}

// 8) BALL / LIFE: 3 drains -> game over, no negative balls.
{
  const state=createGameState();
  loseBall(state);assert.equal(state.balls,2);assert.equal(state.gameOver,false);
  loseBall(state);assert.equal(state.balls,1);assert.equal(state.gameOver,false);
  loseBall(state);assert.equal(state.balls,0);assert.equal(state.gameOver,true);
  loseBall(state);assert.equal(state.balls,0);
}

// 9) FLIPPER state: key-down starts powered motion, release commands return.
{
  const {physics,state,hooks}=fixture();
  physics.update(FIXED_DT,{down:{left:true,right:false,launch:false,restart:false},pressed:{left:true,right:false,launch:false,restart:false},released:{left:false,right:false,launch:false,restart:false}},state,hooks);
  assert(physics.flippers.left.motorSpeed<0);assert(physics.flippers.left.maxTorque>0);
  physics.update(FIXED_DT,{down:{left:false,right:false,launch:false,restart:false},pressed:{left:false,right:false,launch:false,restart:false},released:{left:true,right:false,launch:false,restart:false}},state,hooks);
  assert(physics.flippers.left.motorSpeed>0,'released left flipper must return');
}

// 10) LAUNCHER state: hold changes motor/force state, release returns to launch state.
{
  const {physics,state,hooks}=fixture();
  physics.update(FIXED_DT,{down:{left:false,right:false,launch:true,restart:false},pressed:{left:false,right:false,launch:true,restart:false},released:{left:false,right:false,launch:false,restart:false}},state,hooks);
  const held={speed:physics.kicker.motorSpeed,force:physics.kicker.maxForce};
  physics.update(FIXED_DT,{down:{left:false,right:false,launch:false,restart:false},pressed:{left:false,right:false,launch:false,restart:false},released:{left:false,right:false,launch:true,restart:false}},state,hooks);
  // C++ KEY_UP itself only releases the input state; the return motor command is
  // established on the following idle sample.
  physics.update(FIXED_DT,{down:{left:false,right:false,launch:false,restart:false},pressed:{left:false,right:false,launch:false,restart:false},released:{left:false,right:false,launch:false,restart:false}},state,hooks);
  assert.notEqual(physics.kicker.motorSpeed,held.speed);
  assert.notEqual(physics.kicker.maxForce,held.force);
}

console.log('Gameplay state-machine transitions: PASS');
