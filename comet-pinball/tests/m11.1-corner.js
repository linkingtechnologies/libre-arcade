'use strict';
// This is a diagnostic snapshot, not a gameplay teleport or automatic recovery.
const assert=require('node:assert/strict'),P=require('../public/js/physics.js');
global.window={};require('../public/data/playfield.js');
const e=new P.Engine(window.COMET_PLAYFIELD);
Object.assign(e.ball,{x:.024,y:1.251117,vx:0,vy:0});
for(let frame=0;frame<600;frame++){
 e.step(1/60,(frame+1)*1000/60,{left:false,right:false,plunge:false});
 assert(!e.drainLatched,'upper-corner ball must NOT be counted as a drain');
 assert(Number.isFinite(e.ball.x)&&Number.isFinite(e.ball.y),'finite ball position');
}
const b=e.ball;
// Independent native output: NativeUpperCornerProbe uses immutable 2013 JAR plus
// its actual FieldBoundsElement geometry, without touching reference/.
const native={x:.023999663,y:1.251115561,vx:0,vy:0};
assert(Math.hypot(b.x-native.x,b.y-native.y)<4e-6,'JS and native upper corner equilibria differ');
assert(Math.hypot(b.vx,b.vy)<1e-5,'corner equilibrium has nonzero JS velocity');
assert(b.y>1.20&&b.x<.04,'regression corner moved');
console.log('PASS M11.1 native/JS upper-left corner: physical resting equilibrium reproduced, no drain, no movement after 600 frames');
console.log(JSON.stringify({native,js:{x:b.x,y:b.y,vx:b.vx,vy:b.vy},difference:Math.hypot(b.x-native.x,b.y-native.y)}));
