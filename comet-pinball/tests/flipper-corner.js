const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const P=require('../public/js/physics.js');

global.window={};
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../public/data/playfield.js'),'utf8'));
const pf=window.COMET_PLAYFIELD, DT=1/60;

function csvRows(name){
  return fs.readFileSync(path.join(__dirname,'../reference/oracle',name),'utf8').trim().split(/\r?\n/).slice(1).map(x=>x.split(','));
}
function leftPressed(age){const p=age%96;return (p>=42&&p<49)||(p>=72&&p<78);}

// Freeze the immutable native trace first.
const state=csvRows('flipper-corner.csv');
const contacts=csvRows('flipper-corner-contact.csv');
const first=contacts.find(r=>Math.abs(+r[6])>1e-4);
assert(first,'missing non-zero native flipper/corner contact');
assert.strictEqual(+first[0],57,'historical first flipper/corner impulse frame changed');
assert.strictEqual(first[1],'flipper-left:poly','historical contacting flipper fixture changed');
assert(Math.abs(+first[6]-3.575747013)<1e-5,'historical normal impulse changed');
assert(Math.abs(+first[7]+0.715149283)<1e-5,'historical tangent impulse changed');

const refState=new Map(state.map(r=>[+r[0],r.map(Number)]));
const refCounts=new Map();
for(const r of contacts)refCounts.set(+r[0],(refCounts.get(+r[0])||0)+1);

// Run the actual JS engine against the same 60 Hz left-flipper command sequence.
const e=new P.Engine(pf), callbacks=new Map(), measurements=[];
for(let frame=0;frame<=63;frame++){
  const age=frame-12, stepCallbacks=[];
  e.step(DT,(frame+1)*1000/60,{left:age>=0&&leftPressed(age),right:false,plunge:false},{
    onFlipperCornerPostSolve(name,d){
      if(name!=='left')return;
      const cp=d.contact?.points?.[0];
      stepCallbacks.push({
        kind:d.kind,
        normalImpulse:cp?.normalImpulse??d.normalImpulse??0,
        tangentImpulse:cp?.tangentImpulse??d.tangentImpulse??0,
        normal:(d.post||d.pre)?.normal,
        point:(d.post||d.pre)?.points?.[0]
      });
    }
  });
  if(stepCallbacks.length)callbacks.set(frame,stepCallbacks);
  if(frame>=54){
    const f=e.flippers.left,o=P.flipperOrigin(f),r=refState.get(frame);
    const posError=Math.hypot(o.x-r[2],o.y-r[3]);
    const velocityError=Math.hypot(f.comVx-r[4],f.comVy-r[5]);
    const angleError=Math.abs(f.bodyAngle-r[6]),omegaError=Math.abs(f.omega-r[7]);
    measurements.push({frame,posError,velocityError,angleError,omegaError});
  }
}

const f57=measurements.find(x=>x.frame===57),cb57=callbacks.get(57);
assert(cb57&&cb57.length===1,'frame 57 must have exactly one JS TOI PostSolve');
assert.strictEqual(cb57[0].kind,'toi','frame 57 contact must be born in the TOI phase');
assert(Math.abs(cb57[0].normalImpulse-3.575747013)<2e-5,'JS frame 57 normal impulse lost native parity');
assert(Math.abs(cb57[0].tangentImpulse+0.715149283)<5e-6,'JS frame 57 tangent impulse lost native parity');
assert(Math.hypot(cb57[0].normal.x-0.999871254,cb57[0].normal.y-0.016047880)<2e-6,'JS frame 57 post normal diverged');
assert(Math.hypot(cb57[0].point.x-0.223671481,cb57[0].point.y-0.185058922)<2e-6,'JS frame 57 post point diverged');
assert(f57.posError<1e-6,'frame 57 flipper origin parity regressed');
assert(f57.velocityError<5e-6,'frame 57 flipper velocity parity regressed');
assert(f57.angleError<5e-6,'frame 57 flipper angle parity regressed');
assert(f57.omegaError<2e-5,'frame 57 flipper omega parity regressed');

// The native engine reports regular + TOI callbacks in the same world.step at 59 and 61.
for(const frame of [57,58,59,60,61]){
  assert.strictEqual((callbacks.get(frame)||[]).length,refCounts.get(frame)||0,`PostSolve count mismatch at frame ${frame}`);
}
assert.deepStrictEqual(callbacks.get(59).map(x=>x.kind),['regular','toi'],'frame 59 callback ordering changed');
assert.deepStrictEqual(callbacks.get(61).map(x=>x.kind),['regular','toi'],'frame 61 callback ordering changed');

const maxima=measurements.reduce((m,x)=>({
  pos:Math.max(m.pos,x.posError),vel:Math.max(m.vel,x.velocityError),
  angle:Math.max(m.angle,x.angleError),omega:Math.max(m.omega,x.omegaError)
}),{pos:0,vel:0,angle:0,omega:0});
assert(maxima.pos<1e-6,'flipper/corner origin window regressed');
assert(maxima.vel<5e-6,'flipper/corner velocity window regressed');
assert(maxima.angle<5e-6,'flipper/corner angle window regressed');
assert(maxima.omega<2e-5,'flipper/corner omega window regressed');

console.log('M8 flipper-corner JS/native parity passed');
console.log(JSON.stringify({frame57:{normalImpulse:cb57[0].normalImpulse,tangentImpulse:cb57[0].tangentImpulse,...f57},maxima,postSolveCounts:Object.fromEntries([57,58,59,60,61].map(f=>[f,(callbacks.get(f)||[]).length]))},null,2));
