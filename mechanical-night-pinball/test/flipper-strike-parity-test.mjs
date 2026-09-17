import assert from 'node:assert/strict';
import { InputController } from '../public/src/input.js';
import { FIXED_DT, CALIBRATION } from '../public/src/config.js';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';
const state={gameOver:false};
const near=(a,b,t,msg)=>assert(Math.abs(a-b)<=t,`${msg}: ${a} vs ${b}`);
function quickTapSeries(side){const input=new InputController(),p=new DocDonkeysParityPhysics();p.ball.active=false;const out=[];for(let frame=0;frame<12;frame++){if(frame===3){input.set(side,true);input.set(side,false);}p.update(FIXED_DT,input.beginPhysicsTick(),state,{});const f=p.flippers[side];out.push({angle:f.angle*180/Math.PI,omega:f.omega});}return out;}
{
  const s=quickTapSeries('left'),r=CALIBRATION.referenceHarness;
  near(s[9].angle,r.leftQuickTapFrame9.angleDeg,1.8,'left quick-tap late-tip angle');
  near(s[9].omega,r.leftQuickTapFrame9.omega,0.8,'left quick-tap late-tip omega');
  near(s[10].angle,r.leftQuickTapFrame10.angleDeg,0.8,'left quick-tap correction');
  near(s[10].omega,r.leftQuickTapFrame10.omega,0.15,'left quick-tap constraint stop');
}
function strike(side,x,y){const input=new InputController(),p=new DocDonkeysParityPhysics();p.ball={...p.ball,x,y,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0};p.restTracker={x,y,time:0};let minVy=Infinity;for(let frame=0;frame<18;frame++){if(frame===3){input.set(side,true);input.set(side,false);}p.update(FIXED_DT,input.beginPhysicsTick(),state,{});minVy=Math.min(minVy,p.ball.vy);}return minVy;}
const r=CALIBRATION.referenceHarness.representativeFlipperStrikes;
near(strike('left',165,724),r.left165x724.minVy,16,'left strike 165/724');
near(strike('left',175,720),r.left175x720.minVy,16,'left strike 175/720');
near(strike('right',233,720),r.right233x720.minVy,16,'right strike 233/720');
near(strike('right',223,724),r.right223x724.minVy,16,'right strike 223/724');
assert(strike('left',175,714)<-40,'left late-tip strike at 175/714 must not be missed');
console.log('DocDonkeys flipper strike reference: PASS');
