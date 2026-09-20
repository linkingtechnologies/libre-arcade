'use strict';
/** Coupled launch-lane CCD: real original two-wall geometry, native isolated oracle. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const P=require('../public/js/physics.js'),root=path.join(__dirname,'..');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/playfield.js'),'utf8'),sandbox);
const pf=sandbox.window.COMET_PLAYFIELD,dt=1/60,input={left:false,right:false,plunge:false};
const native=fs.readFileSync(path.join(root,'reports/M13.9-native-boundaries.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(l=>l.split(','));
function engine(x,y,vx,vy){const e=new P.Engine(pf);Object.assign(e.ball,{x,y,vx,vy,omega:0});return e;}
let compared=0,events=0,maxPositionError=0,maxVelocityError=0;
for(const [kind,xs,ys,vxs,vys,nxs,nys,nvxs,nvys] of native){
  const x=+xs,y=+ys,vx=+vxs,vy=+vys;
  // x=.740/.745 start within an original polygon (invalid initial physics
  // states); do not pretend those are uncontaminated full-lane trajectories.
  if(!((kind==='divider-right'&&x===.735)||(kind==='right-wall'&&x<=.736)))continue;
  const e=engine(x,y,vx,vy);e.step(dt,1000,input);compared++;
  const b=e.ball,ep=Math.hypot(b.x-(+nxs),b.y-(+nys)),ev=Math.hypot(b.vx-(+nvxs),b.vy-(+nvys));
  maxPositionError=Math.max(maxPositionError,ep);maxVelocityError=Math.max(maxVelocityError,ev);
  assert(ep<.0003,`${kind} ${x} ${vx}: ${ep}m from native`);
  assert(ev<.012,`${kind} ${x} ${vx}: ${ev}m/s from native`);
  assert(b.x>.732&&b.x<.738,`${kind} ${x} ${vx}: ball crossed the outer wall or divider`);
  assert(e.lastLaneCoupledTOI&&!e.lastLaneCoupledTOI.exhausted,`${kind} ${x} ${vx}: coupled TOI not exercised or exhausted`);
  assert(e.lastLaneCoupledTOI.events.length>=1,'expected real physical polygon TOI events');
  events+=e.lastLaneCoupledTOI.events.length;
}
assert.equal(compared,20);
let longRuns=0,frames=0,maxEvents=0;
for(const speed of [1,2,4,6,10,20,40])for(const dir of [-1,1]){
  const e=engine(.735,.8,dir*speed,0);
  for(let frame=0;frame<120;frame++){
    e.step(dt,1000+frame*1000/60,input);frames++;
    if(e.lastLaneCoupledTOI){
      assert(!e.lastLaneCoupledTOI.exhausted,`lane TOI budget exhausted at ${speed}/${dir}/${frame}`);
      maxEvents=Math.max(maxEvents,e.lastLaneCoupledTOI.events.length);
    }
    if(e.ball.y>.12&&e.ball.y<1.03){
      assert(e.ball.x>.7315&&e.ball.x<.7385,`escaped launcher at ${speed}/${dir}/${frame}: ${e.ball.x}`);
    }
  }
  longRuns++;
}
assert(maxEvents>=4,'test must exercise multiple impacts within a single frame');
console.log(`PASS M13.11: ${compared} native isolated lane seeds, ${events} polygon TOIs, max position ${maxPositionError.toFixed(7)}m / velocity ${maxVelocityError.toFixed(7)}m/s; ${longRuns} long runs / ${frames} frames no corridor escape, up to ${maxEvents} impacts per frame`);
