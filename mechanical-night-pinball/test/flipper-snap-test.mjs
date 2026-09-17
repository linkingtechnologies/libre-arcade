import assert from 'node:assert/strict';
import { InputController } from '../public/src/input.js';
import { FIXED_DT, CALIBRATION } from '../public/src/config.js';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';

const near=(a,b,t,msg)=>assert(Math.abs(a-b)<=t,`${msg}: ${a} vs ${b}`);
const state={gameOver:false};

// Browser-level regression: a press+release delivered before the next fixed tick
// must survive as one KEY_DOWN tick and one KEY_UP tick, not collapse to idle.
{
  const input=new InputController();
  input.set('left',true);
  input.set('left',false);
  assert.equal(input.down.left,false,'real-time browser state is already released');
  const t1=input.beginPhysicsTick();
  assert.equal(t1.down.left,true,'first fixed tick must preserve KEY_DOWN');
  assert.equal(t1.pressed.left,true);
  assert.equal(t1.released.left,false);
  const t2=input.beginPhysicsTick();
  assert.equal(t2.down.left,false,'second fixed tick must preserve KEY_UP');
  assert.equal(t2.pressed.left,false);
  assert.equal(t2.released.left,true);
  const t3=input.beginPhysicsTick();
  assert.equal(t3.down.left,false,'subsequent ticks remain idle');
}

function quickTap(side){
  const input=new InputController();
  const p=new DocDonkeysParityPhysics();
  p.ball.active=false;
  input.set(side,true);
  input.set(side,false);
  // Tick 1: Scene logic sees KEY_DOWN after physics, exactly like the C++ module order.
  p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  // Tick 2: the active motor drives for one complete Box2D-style step, then KEY_UP is applied.
  p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  return p;
}

// One-tick snap must reproduce the already calibrated first powered step rather than vanish.
{
  const p=quickTap('left');
  near(p.flippers.left.angle*180/Math.PI,CALIBRATION.referenceHarness.leftFlipperPressFrame1.angleDeg,0.45,'left quick-tap first powered angle');
  near(p.flippers.left.omega,CALIBRATION.referenceHarness.leftFlipperPressFrame1.omega,0.8,'left quick-tap first powered omega');
  assert(p.flippers.left.omega<-8,'left quick tap must have substantial strike speed');
}
{
  const p=quickTap('right');
  near(p.flippers.right.angle*180/Math.PI,CALIBRATION.referenceHarness.rightFlipperPressFrame1.angleDeg,0.55,'right quick-tap first powered angle');
  near(p.flippers.right.omega,CALIBRATION.referenceHarness.rightFlipperPressFrame1.omega,0.9,'right quick-tap first powered omega');
  assert(p.flippers.right.omega>8,'right quick tap must have substantial strike speed');
}


function strikeBall(side,x,y,tap){
  const input=new InputController();
  const p=new DocDonkeysParityPhysics();
  p.ball={...p.ball,x,y,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0};
  p.restTracker={x,y,time:0};
  let minVy=Infinity,maxSpeed=0,lost=false;
  for(let i=0;i<18;i++){
    if(i===3&&tap){input.set(side,true);input.set(side,false);}
    p.update(FIXED_DT,input.beginPhysicsTick(),state,{onLoseBall:()=>{lost=true;}});
    minVy=Math.min(minVy,p.ball.vy);
    maxSpeed=Math.max(maxSpeed,Math.hypot(p.ball.vx,p.ball.vy));
  }
  return {minVy,maxSpeed,lost};
}

// End-to-end strike regression: with identical ball placement, a one-tick snap
// must impart a clear upward velocity that does not exist without the tap.
{
  const hit=strikeBall('left',170,724,true),idle=strikeBall('left',170,724,false);
  assert.equal(hit.lost,false);
  assert(hit.minVy < -80,`left snap must launch upward, got vy=${hit.minVy}`);
  assert(hit.minVy < idle.minVy-80,`left snap must add substantial speed: hit=${hit.minVy}, idle=${idle.minVy}`);
}
{
  const hit=strikeBall('right',230,724,true),idle=strikeBall('right',230,724,false);
  assert.equal(hit.lost,false);
  assert(hit.minVy < -80,`right snap must launch upward, got vy=${hit.minVy}`);
  assert(hit.minVy < idle.minVy-80,`right snap must add substantial speed: hit=${hit.minVy}, idle=${idle.minVy}`);
}

// A sleeping resting ball must wake on the latched KEY_DOWN tick even if the
// physical key has already been released before that tick arrives.
{
  const input=new InputController();
  const p=new DocDonkeysParityPhysics();
  p.ball.asleep=true;p.ball.sleepTime=.5;
  input.set('left',true);input.set('left',false);
  p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  assert.equal(p.ball.asleep,false,'latched snap press must wake a sleeping ball');
}

console.log('Fixed-tick flipper input edges: PASS');
