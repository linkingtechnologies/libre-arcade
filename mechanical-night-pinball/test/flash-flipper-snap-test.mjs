import assert from 'node:assert/strict';
import { InputController } from '../public/src/input.js';
import { FIXED_DT, CALIBRATION, RESTORATION } from '../public/src/config.js';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';

const state={gameOver:false};

function oneTickStrike(profile,side,x,y){
  const input=new InputController(),p=new DocDonkeysParityPhysics({flipperProfile:profile});
  p.ball={...p.ball,x,y,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0};
  p.restTracker={x,y,time:0};
  let minVy=Infinity;
  for(let frame=0;frame<18;frame++){
    if(frame===3){input.set(side,true);input.set(side,false);}
    p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
    minVy=Math.min(minVy,p.ball.vy);
  }
  return minVy;
}

// Keep the archaeological 2018 profile unchanged as the numerical reference.
{
  const ref=oneTickStrike('docdonkeys','left',170,724);
  assert(Math.abs(ref-CALIBRATION.referenceHarness.representativeFlipperStrikes.left165x724.minVy)>0,
    'sanity: this placement is intentionally not the 165/724 harness point');
  assert(ref < -90 && ref > -150,`DocDonkeys baseline unexpectedly changed: ${ref}`);
}

// The restored Flash KEY_DOWN snap must clearly strengthen a one-tick strike.
{
  const base=oneTickStrike('docdonkeys','left',170,724);
  const flash=oneTickStrike('flash-enhanced','left',170,724);
  assert(flash < -180,`Flash-enhanced left strike should be forceful: ${flash}`);
  assert(Math.abs(flash) > Math.abs(base)*1.6,`Flash-enhanced left strike should materially exceed DocDonkeys: ${flash} vs ${base}`);
}
{
  const base=oneTickStrike('docdonkeys','right',230,724);
  const flash=oneTickStrike('flash-enhanced','right',230,724);
  assert(flash < -170,`Flash-enhanced right strike should be forceful: ${flash}`);
  assert(Math.abs(flash) > Math.abs(base)*1.6,`Flash-enhanced right strike should materially exceed DocDonkeys: ${flash} vs ${base}`);
}

// Snap is an edge impulse: holding the key must not re-apply +6 rad/s each tick.
{
  const input=new InputController(),p=new DocDonkeysParityPhysics({flipperProfile:'flash-enhanced'});
  p.ball.active=false;
  input.set('left',true);
  p.update(FIXED_DT,input.beginPhysicsTick(),state,{}); // command edge installed at end
  const omegaAfterEdge=p.flippers.left.omega;
  p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  const omegaAfterPoweredStep=p.flippers.left.omega;
  p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  const omegaAfterHeldStep=p.flippers.left.omega;
  assert(omegaAfterEdge<=-RESTORATION.flashFlipperSnap.angularVelocityAssistRadiansPerSecond+0.1,
    `snap assist should be installed once on KEY_DOWN: ${omegaAfterEdge}`);
  assert(omegaAfterPoweredStep>=-CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond);
  assert(omegaAfterHeldStep>=-CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond);
}

// Enhanced mode must still allow a held flipper + supported ball to settle.
{
  const input=new InputController(),p=new DocDonkeysParityPhysics({flipperProfile:'flash-enhanced'});
  p.ball.active=false;
  input.set('left',true);
  for(let i=0;i<90;i++)p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  p.ball={...p.ball,x:150.6577,y:724.9322,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0};
  p.restTracker={x:p.ball.x,y:p.ball.y,time:0};
  for(let i=0;i<240&&!p.ball.asleep;i++)p.update(FIXED_DT,input.beginPhysicsTick(),state,{});
  assert.equal(p.ball.asleep,true,'Flash-enhanced held flipper must retain resting-contact sleep');
  assert.equal(p.ball.vx,0);assert.equal(p.ball.vy,0);assert.equal(p.ball.omega,0);
}

console.log('Flash-enhanced flipper snap: PASS');
