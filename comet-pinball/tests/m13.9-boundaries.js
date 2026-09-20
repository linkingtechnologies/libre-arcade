'use strict';
/** M13.9 native libGDX 0.9.9 boundary fixtures, not a full-game parity assertion. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const P=require('../public/js/physics.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/data/playfield.js'),'utf8'),sandbox);
const pf=sandbox.window.COMET_PLAYFIELD, dt=1/60, input={left:false,right:false,plunge:false};
const native=fs.readFileSync(path.join(__dirname,'../reports/M13.9-native-boundaries.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(s=>s.split(','));
const counts={"divider-left":0,"above-tip":0,"ceiling":0,"divider-right":0,"right-wall":0};
for(const row of native){
 const [kind,xs,ys,vxs,vys,nxs,nys,nvxs,nvys]=row,[x,y,vx,vy,nx,ny,nvx,nvy]=[xs,ys,vxs,vys,nxs,nys,nvxs,nvys].map(Number);
 const e=new P.Engine(pf);Object.assign(e.ball,{x,y,vx,vy,omega:0});
 e.step(dt,1000,input);const b=e.ball;counts[kind]++;
 if(kind==='divider-left'||kind==='ceiling'){
   const errP=Math.hypot(b.x-nx,b.y-ny),errV=Math.hypot(b.vx-nvx,b.vy-nvy);
   assert(errP<.0005,`${kind} ${x},${y},${vx},${vy}: position ${errP} vs native`);
   assert(errV<.0001,`${kind} ${x},${y},${vx},${vy}: velocity ${errV} vs native`);
   if(kind==='divider-left' && nx<=.6965 && vx>=2 && x>=.67)assert(b.x<=.6965,`ball crossed the divider from the playfield: ${b.x}`);
   if(kind==='ceiling' && nvy<0)assert(b.y<1.3865,`ball passed outside ceiling: ${b.y}`);
 }
 if(kind==='above-tip'&&vx===1){assert.equal(e.lastPlungerDividerTOI,null,'passage around the divider tip must remain allowed');assert(b.x>.6965,'ball must pass the divider top through the legal opening');}
 if(kind==='divider-right'&&x===.735&&vx===-2){
   // Known-open coupled divider / right-wall issue. Do not introduce a new
   // outward kick that makes the baseline’s narrow-lane collision worse.
   assert(e.lastPlungerDividerTOI===null,'one-wall CCD must not inject a one-sided bounce in the 3-mm lane');
 }
}
assert.deepEqual(counts,{'divider-left':35,'above-tip':15,'ceiling':15,'divider-right':15,'right-wall':15});
console.log('PASS M13.9 native oracle: 35 playfield-side divider + 15 central ceiling seeds match; legal above-tip passage remains open; narrow-lane limitations documented');
