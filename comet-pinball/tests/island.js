const assert=require('assert');
const fs=require('fs');
const path=require('path');
const P=require('../public/js/physics.js');
const DT=1/60;
function rows(name){return fs.readFileSync(path.join(__dirname,'../reference/oracle',name),'utf8').trim().split(/\r?\n/);}
function goldenFlipper(){return rows('flipper.csv').filter(x=>/^\d/.test(x)).map(x=>{const a=x.split(',').map(Number);return {x:a[2],y:a[3],vx:a[4],vy:a[5],angle:a[6],omega:a[7]};});}
const ref=goldenFlipper();
const e=new P.Engine({bumpers:[],slingshots:[],obstacles:[],scores:{}});
e.geometry={polygons:[],circles:[],reactiveSlings:[]};
e.ball.x=.307;e.ball.y=.115;e.ball.vx=0;e.ball.vy=-.10;
let maxPos=0,maxVel=0,maxAngle=0,maxOmega=0;
for(let i=0;i<45;i++){
  e.step(DT,(i+1)*1000/60,{left:i>=3,right:false,plunge:false},{});
  const f=e.flippers.left,r=ref[i];
  maxPos=Math.max(maxPos,Math.hypot(e.ball.x-r.x,e.ball.y-r.y));
  maxVel=Math.max(maxVel,Math.hypot(e.ball.vx-r.vx,e.ball.vy-r.vy));
  maxAngle=Math.max(maxAngle,Math.abs(f.bodyAngle-r.angle));
  maxOmega=Math.max(maxOmega,Math.abs(f.omega-r.omega));
}
assert(maxPos<0.0006,`coupled island position error ${maxPos}`);
assert(maxVel<0.001,`coupled island velocity error ${maxVel}`);
assert(maxAngle<0.003,`coupled island angle error ${maxAngle}`);
assert(maxOmega<0.005,`coupled island omega error ${maxOmega}`);
assert.strictEqual(P.constants.TOI_POSITION_ITERATIONS,20,'historical TOI position iterations');
assert(Math.abs(P.constants.TOI_BAUMGARTE-.75)<1e-12,'historical TOI Baumgarte');

const detail=rows('flipper-detail.csv');
const head=detail.shift().split(',');
const parsed=detail.map(line=>{const a=line.split(',');const o={};head.forEach((h,i)=>o[h]=a[i]);return o;});
const f0=parsed.filter(r=>+r.frame===0);
assert.strictEqual(f0.length,2,'native frame 0 has discrete + TOI postSolve callbacks');
assert(f0.every(r=>r.fixtureType==='Polygon' && +r.flipperFixture===2),'both frame-0 solves use tapered polygon fixture');
assert(+f0[0].normalImpulseScaled>0.04,'discrete frame-0 contact carries impulse');
assert(Math.abs(+f0[1].normalImpulseScaled)<1e-9,'TOI follow-up is position-dominated with zero reported normal impulse');
console.log('coupled island + narrow TOI parity passed');
console.log(JSON.stringify({maxPos,maxVel,maxAngle,maxOmega,frame0NativePostSolves:f0.length,toiPositionIterations:P.constants.TOI_POSITION_ITERATIONS,toiBaumgarte:P.constants.TOI_BAUMGARTE},null,2));
