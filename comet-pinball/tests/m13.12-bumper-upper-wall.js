'use strict';
/** Real bumper impulses -> upper curve -> lateral wall. Deterministic escape repros. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const P=require('../public/js/physics.js'),root=path.join(__dirname,'..');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/playfield.js'),'utf8'),sandbox);
const pf=sandbox.window.COMET_PLAYFIELD,dt=1/60,r=P.constants.BALL_R;
const input={left:false,right:false,plunge:false};
// This is the same conservative *geometrical alarm* from the M13.11 diagnosis;
// it does not substitute for the actual 30-segment original wall geometry.
function outsideUpper(b,margin=.004){
  return b.y>1.40+r+margin||
    (b.x<.30&&b.y>1.10&&Math.hypot(b.x-.30,b.y-1.10)>.295+r+margin)||
    (b.x>.46&&b.y>1.10&&Math.hypot(b.x-.46,b.y-1.10)>.295+r+margin);
}
function run(seed,frames=85){
  const engine=new P.Engine(pf);Object.assign(engine.ball,{...seed,omega:0});
  let hits=0,curves=0,escaped=null,contactSideAfterCurve=0;
  for(let frame=0;frame<frames;frame++){
    engine.step(dt,1000+frame*1000/60,input,{onHit:()=>hits++});
    if(engine.lastTopCurveTOI){
      curves++;
      if(engine.lastLeftWallTOI||engine.lastRightWallTOI)contactSideAfterCurve++;
    }
    if(outsideUpper(engine.ball)){
      escaped={frame,x:engine.ball.x,y:engine.ball.y};break;
    }
    if(engine.drainLatched)break;
  }
  return {hits,curves,escaped,contactSideAfterCurve};
}
const repros=[
  {name:'left upper curve',x:.265,y:1.1425,vx:3,vy:10,originalEscapeFrame:11},
  {name:'right upper curve',x:.465,y:1.1425,vx:1,vy:4,originalEscapeFrame:19}
];
for(const {name,originalEscapeFrame,...seed} of repros){
  const result=run(seed);
  assert(result.hits>=1,`${name}: must involve real bumper reactive impulse`);
  assert(result.curves>=1,`${name}: must involve upper polygonal wall collision`);
  assert.equal(result.escaped,null,`${name}: M13.11 escaped at frame ${originalEscapeFrame}; ${JSON.stringify(result)}`);
}
let trials=0,bumperHits=0,curveContacts=0;
for(const bumper of pf.bumpers){
  for(const vx of [-7,-5,-3,-1,0,1,3,5,7])for(const vy of [2,4,6,8,10,12,16])for(const dx of [-.015,0,.015]){
    const seed={x:bumper.x+dx,y:bumper.y+bumper.r+r-.001,vx,vy};
    if(outsideUpper(seed))continue;
    const result=run(seed);trials++;
    bumperHits+=+(result.hits>0);curveContacts+=+(result.curves>0);
    assert.equal(result.escaped,null,`bumper ${bumper.id}, vx=${vx} vy=${vy} dx=${dx}: ${JSON.stringify(result.escaped)}`);
  }
}
assert.equal(trials,567);
assert(bumperHits>450&&curveContacts>100,'stress must exercise actual bumper hits and upper-curve collisions');
console.log(`PASS M13.12: two real bumper escape regressions (formerly frames 11/19), ${trials} initial states, ${bumperHits} bumper-hit scenarios, ${curveContacts} curved-wall scenarios: zero gross upper escapes`);
