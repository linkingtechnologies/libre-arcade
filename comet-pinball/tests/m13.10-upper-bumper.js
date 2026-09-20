'use strict';
/** Regressions from native libGDX/Box2D 2013, not a full-game parity claim. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),P=require('../public/js/physics.js'),sb={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/playfield.js'),'utf8'),sb);
const playfield=sb.window.COMET_PLAYFIELD,dt=1/60,input={left:false,right:false,plunge:false};
const seeds=fs.readFileSync(path.join(root,'reports/M13.10-native-upper-postbumper.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(s=>s.split(','));
function oneStep(x,y,vx,vy){const e=new P.Engine(playfield);Object.assign(e.ball,{x,y,vx,vy,omega:0});e.step(dt,1000,input);return e;}
function findNative(x,y,vx,vy){return seeds.find(s=>s.slice(0,4).map(Number).every((n,i)=>n===[x,y,vx,vy][i]));}
const cases=[
  {p:[.1,1.28,-4,6],curve:'top-left',positionTolerance:.0005,velocityTolerance:.02},
  {p:[.65,1.28,4,6],curve:'top-right',positionTolerance:.0005,velocityTolerance:.02},
  {p:[.25,1.23,-2,10],curve:'top-left',positionTolerance:.004,velocityTolerance:.02},
  {p:[.35,1.35,0,6],ceiling:true,positionTolerance:.0005,velocityTolerance:.02},
  {p:[.42,1.37,4,10],ceiling:true,positionTolerance:.0005,velocityTolerance:.02},
];
for(const {p,curve,ceiling,positionTolerance,velocityTolerance} of cases){
  const row=findNative(...p);assert(row,'native seed must be preserved');
  const [nx,ny,nvx,nvy]=row.slice(4,8).map(Number),e=oneStep(...p),b=e.ball;
  assert(Math.hypot(b.x-nx,b.y-ny)<positionTolerance,`${p}: position mismatch from native`);
  assert(Math.hypot(b.vx-nvx,b.vy-nvy)<velocityTolerance,`${p}: velocity mismatch from native`);
  if(curve)assert(e.lastTopCurveTOI?.seed.startsWith(curve),`${p}: no ${curve} swept impact`);
  if(ceiling)assert(e.lastCeilingTOI,`${p}: earlier ceiling impact must take precedence`);
}
function grossUpperEscape(ball){
  const {x,y}=ball,margin=.004,r=P.constants.BALL_R;
  return y>1.40+r+margin ||
    (x<.30&&y>1.10&&Math.hypot(x-.30,y-1.10)>.295+r+margin) ||
    (x>.46&&y>1.10&&Math.hypot(x-.46,y-1.10)>.295+r+margin);
}
const oracle=fs.readFileSync(path.join(root,'reports/M13.10-native-bumper-sequences.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(s=>s.split(',').map(Number));
let sequences=0,frames=0,curveEvents=0,bumperHitScenarios=0;
for(const bumper of playfield.bumpers)for(const vx of [-1,0,1]){
  const e=new P.Engine(playfield);Object.assign(e.ball,{x:bumper.x,y:bumper.y+bumper.r+P.constants.BALL_R-.0002,vx,vy:3,omega:0});
  const native=oracle.filter(row=>row[0]===bumper.id&&row[1]===vx);assert.equal(native.length,45);
  let hits=0;
  for(const [id,initialVX,frame,nx,ny] of native){
    e.step(dt,(frame-1)*1000/60,input,{onHit:()=>hits++});frames++;
    assert(!grossUpperEscape({x:nx,y:ny}),`native unexpectedly leaves upper field: ${id}/${initialVX}/${frame}`);
    assert(!grossUpperEscape(e.ball),`ported ball escaped upper field: ${id}/${initialVX}/${frame}`);
    if(e.lastTopCurveTOI)curveEvents++;
  }
  if(hits)bumperHitScenarios++;sequences++;
}
assert.equal(sequences,9);assert.equal(frames,405);
assert(curveEvents>=4,'the upper-curve CCD must actually be exercised by bumper sequences');
assert(bumperHitScenarios>=7,'native-inspired sequences must exercise real bumper hit/release logic');
console.log(`PASS M13.10: five native single-impact comparisons; ${sequences} post-bumper sequences / ${frames} frames, no gross upper escapes; ${curveEvents} curved-wall TOIs; bumper hit in ${bumperHitScenarios} sequences`);
