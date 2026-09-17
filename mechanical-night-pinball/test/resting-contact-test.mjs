import assert from 'node:assert/strict';
import { CALIBRATION, FIXED_DT } from '../public/src/config.js';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';

const state={gameOver:false};
const held={down:{left:true,right:true,launch:false,restart:false}};
const near=(a,b,t,msg)=>assert(Math.abs(a-b)<=t,`${msg}: ${a} vs ${b}`);

function heldTable(){
  const p=new DocDonkeysParityPhysics();
  p.ball.active=false;
  for(let i=0;i<180;i++)p.update(FIXED_DT,held,state,{});
  near(p.flippers.right.angle*180/Math.PI,CALIBRATION.referenceHarness.rightFlipperFullTableHeldStopDeg,.03,'full-table right flipper hard stop');
  return p;
}

function verifyEquilibrium(side){
  const p=heldTable();
  const eq=CALIBRATION.referenceHarness.heldRestingEquilibria[side];
  p.ball={...p.ball,x:eq.x,y:eq.y,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0};
  p.restTracker={x:p.ball.x,y:p.ball.y,time:0};
  let sleptAt=-1,maxLateDrift=0,prev={x:p.ball.x,y:p.ball.y};
  for(let i=0;i<240;i++){
    p.update(FIXED_DT,held,state,{onLoseBall:()=>{}});
    if(i>120)maxLateDrift=Math.max(maxLateDrift,Math.hypot(p.ball.x-prev.x,p.ball.y-prev.y));
    prev={x:p.ball.x,y:p.ball.y};
    if(p.ball.asleep&&sleptAt<0)sleptAt=i;
  }
  assert.equal(p.ball.asleep,true,`${side} full-table resting equilibrium must sleep`);
  assert(sleptAt>=0&&sleptAt<150,`${side} equilibrium should settle in bounded time, got ${sleptAt}`);
  near(p.ball.vx,0,1e-9,`${side} sleeping vx`); near(p.ball.vy,0,1e-9,`${side} sleeping vy`); near(p.ball.omega,0,1e-9,`${side} sleeping omega`);
  assert(maxLateDrift<0.02,`${side} resting equilibrium must not visibly creep`);
  const resting={x:p.ball.x,y:p.ball.y};
  for(let i=0;i<60;i++)p.update(FIXED_DT,held,state,{});
  assert.equal(p.ball.asleep,true,`${side} equilibrium must remain asleep`);
  assert(Math.hypot(p.ball.x-resting.x,p.ball.y-resting.y)<1e-8,`${side} sleeping position must remain fixed`);
  return sleptAt;
}

const leftSleep=verifyEquilibrium('left');
const rightSleep=verifyEquilibrium('right');

// A moving ball that only brushes a held flipper must not be frozen by the resting-manifold logic.
{
  const p=heldTable();
  p.ball={...p.ball,x:280,y:690,vx:-45,vy:40,omega:0,active:true,asleep:false,sleepTime:0};
  p.restTracker={x:p.ball.x,y:p.ball.y,time:0};
  for(let i=0;i<20;i++)p.update(FIXED_DT,held,state,{onLoseBall:()=>{}});
  assert.equal(p.ball.asleep,false,'moving single-contact/approach must not be force-slept');
}

// Any flipper input transition must wake a sleeping resting island.
{
  const p=heldTable(),eq=CALIBRATION.referenceHarness.heldRestingEquilibria.right;
  p.ball={...p.ball,x:eq.x,y:eq.y,vx:0,vy:0,omega:0,active:true,asleep:true,sleepTime:.5};
  p.restTracker={x:p.ball.x,y:p.ball.y,time:.5};
  p.update(FIXED_DT,{down:{left:true,right:false,launch:false,restart:false}},state,{});
  assert.equal(p.ball.asleep,false,'releasing a supporting flipper must wake the ball');
}


// Live-pipeline regression: representative drops that settle on each held-flipper support basin.
for (const [name,x] of [['left-drop',170],['right-drop',230]]) {
  const p=heldTable();
  p.ball={...p.ball,x,y:690,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0};
  p.restTracker={x:p.ball.x,y:p.ball.y,time:0};
  let slept=-1,lost=false;
  for(let i=0;i<360;i++){
    p.update(FIXED_DT,held,state,{onLoseBall:()=>{lost=true;}});
    if(p.ball.asleep&&slept<0)slept=i;
    if(!p.ball.active)break;
  }
  assert.equal(lost,false,`${name} should settle rather than drain in the reference support basin`);
  assert.equal(p.ball.asleep,true,`${name} should enter sleep through the normal update pipeline`);
  assert(slept>=0&&slept<300,`${name} should settle in bounded time`);
}

console.log(`Bilateral full-table resting contact: PASS (left ${leftSleep}, right ${rightSleep})`);
