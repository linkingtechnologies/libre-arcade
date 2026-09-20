const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const P=require('../public/js/physics.js');

global.window={};
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../public/data/playfield.js'),'utf8'));
const pf=window.COMET_PLAYFIELD;
const DT=1/60,MAX_FRAMES=3600,SIGNIFICANT_VELOCITY_ERROR=.05;

function readState(){return fs.readFileSync(path.join(__dirname,'../reference/oracle/fullgame-state.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(line=>{const a=line.split(',').map(Number);return {frame:a[0],t:a[1],ball:a[2],x:a[3],y:a[4],vx:a[5],vy:a[6],leftAngle:a[7],leftOmega:a[8],rightAngle:a[9],rightOmega:a[10],score:a[11],plunged:a[12],down:a[13]};});}
function readEvents(){return fs.readFileSync(path.join(__dirname,'../reference/oracle/fullgame-events.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(line=>{const a=line.split(',');return {frame:+a[0],seq:+a[1],event:a[2],label:a[3],id:+a[4],value:+a[5],score:+a[6]};});}
function leftPressed(age){const p=age%96;return (p>=42&&p<49)||(p>=72&&p<78);}
function rightPressed(age){const p=age%96;return (p>=54&&p<61)||(p>=78&&p<84);}
function replay(){
  const e=new P.Engine(pf),states=[],events=[],contactEvents=[];
  let score=0,ballsPlayed=0,ballNumber=1,plunged=false,down=false,resetFrame=0,plungeFrame=-1,drainFrame=-1;
  for(let frame=0;frame<MAX_FRAMES;frame++){
    if(down){
      if(ballsPlayed>=3&&frame-drainFrame>=12)break;
      if(ballsPlayed<3&&frame-drainFrame===12){e.reset();down=false;ballNumber=ballsPlayed+1;resetFrame=frame;events.push({frame,event:'RESET',id:0,value:ballNumber,score});}
    }
    const age=plunged?frame-plungeFrame:-1;
    const input={left:age>=0&&leftPressed(age),right:age>=0&&rightPressed(age),plunge:!down&&!plunged&&frame-resetFrame>=12};
    e.step(DT,(frame+1)*1000/60,input,{
      onPlunge(){plunged=true;down=false;plungeFrame=frame;events.push({frame,event:'PLUNGE',id:0,value:ballNumber,score});},
      onDrain(){if(down)return;down=true;drainFrame=frame;if(plunged)ballsPlayed++;events.push({frame,event:'DRAIN',id:0,value:ballNumber,score});plunged=false;},
      onHit(id){const value=pf.scores[id]||0;score+=value;events.push({frame,event:'HIT',id,value,score});},
      onContactEvent(ev){contactEvents.push({frame,event:ev.event,label:ev.label});}
    });
    states.push({frame,ball:ballNumber,x:e.ball.x,y:e.ball.y,vx:e.ball.vx,vy:e.ball.vy,leftAngle:e.flippers.left.bodyAngle,leftOmega:e.flippers.left.omega,rightAngle:e.flippers.right.bodyAngle,rightOmega:e.flippers.right.omega,score,plunged:+plunged,down:+down});
  }
  return {states,events,contactEvents,score,ballsPlayed};
}
function stateMetric(actual,ref,count){
  let maxPosition=0,maxVelocity=0,maxLeftAngle=0,maxLeftOmega=0,first1mm=-1,first5mm=-1,first10mm=-1,firstVelocitySignificant=-1;
  for(let i=0;i<count;i++){
    const pe=Math.hypot(actual[i].x-ref[i].x,actual[i].y-ref[i].y),ve=Math.hypot(actual[i].vx-ref[i].vx,actual[i].vy-ref[i].vy);
    maxPosition=Math.max(maxPosition,pe);maxVelocity=Math.max(maxVelocity,ve);maxLeftAngle=Math.max(maxLeftAngle,Math.abs(actual[i].leftAngle-ref[i].leftAngle));maxLeftOmega=Math.max(maxLeftOmega,Math.abs(actual[i].leftOmega-ref[i].leftOmega));
    if(first1mm<0&&pe>.001)first1mm=i;if(first5mm<0&&pe>.005)first5mm=i;if(first10mm<0&&pe>.010)first10mm=i;if(firstVelocitySignificant<0&&ve>SIGNIFICANT_VELOCITY_ERROR)firstVelocitySignificant=i;
  }
  return {frames:count,maxPosition,maxVelocity,maxLeftAngle,maxLeftOmega,first1mm,first5mm,first10mm,firstVelocitySignificant,significantVelocityThreshold:SIGNIFICANT_VELOCITY_ERROR};
}
function stateErrorAt(actual,ref,frame){if(frame>=actual.length||frame>=ref.length)return null;return {frame,position:Math.hypot(actual[frame].x-ref[frame].x,actual[frame].y-ref[frame].y),velocity:Math.hypot(actual[frame].vx-ref[frame].vx,actual[frame].vy-ref[frame].vy),leftAngle:Math.abs(actual[frame].leftAngle-ref[frame].leftAngle),leftOmega:Math.abs(actual[frame].leftOmega-ref[frame].leftOmega)};}
function highLevel(events){return events.filter(e=>['PLUNGE','RESET','DRAIN','HIT'].includes(e.event));}
function firstEventMismatch(a,b){const n=Math.min(a.length,b.length);for(let i=0;i<n;i++){if(a[i].event!==b[i].event||a[i].id!==b[i].id||a[i].value!==b[i].value)return {index:i,oracle:a[i],js:b[i]};}return a.length===b.length?null:{index:n,oracle:a[n]||null,js:b[n]||null};}
function firstScoringMismatch(a,b){const aa=a.filter(e=>e.event==='HIT'),bb=b.filter(e=>e.event==='HIT'),n=Math.min(aa.length,bb.length);for(let i=0;i<n;i++){if(aa[i].frame!==bb[i].frame||aa[i].id!==bb[i].id||aa[i].value!==bb[i].value)return {index:i,oracle:aa[i],js:bb[i]};}return aa.length===bb.length?null:{index:n,oracle:aa[n]||null,js:bb[n]||null};}
function ballContacts(events){return events.filter(e=>e.event==='CONTACT_BEGIN'||e.event==='CONTACT_END').map(e=>({frame:e.frame,event:e.event,label:e.label}));}
function frameContactMismatch(oracle,js,startFrame=0){
  const last=Math.max(oracle.at(-1)?.frame||0,js.at(-1)?.frame||0);
  for(let frame=startFrame;frame<=last;frame++){
    const a=oracle.filter(e=>e.frame===frame).map(e=>`${e.event}|${e.label}`).sort();
    const b=js.filter(e=>e.frame===frame).map(e=>`${e.event}|${e.label}`).sort();
    if(JSON.stringify(a)!==JSON.stringify(b))return {frame,oracle:a,js:b};
  }
  return null;
}

const oracleState=readState(),oracleEvents=readEvents(),oracleHigh=highLevel(oracleEvents),oracleContacts=ballContacts(oracleEvents),js=replay(),jsHigh=highLevel(js.events);
const oracleDrains=oracleHigh.filter(e=>e.event==='DRAIN'),oraclePlunges=oracleHigh.filter(e=>e.event==='PLUNGE'),jsDrains=jsHigh.filter(e=>e.event==='DRAIN');
assert.strictEqual(oracleDrains.length,3,'oracle must contain three drains');
assert.strictEqual(oraclePlunges.length,3,'oracle must contain three plunges');
assert.strictEqual(oracleState.at(-1).score,45,'oracle final score changed');
assert.strictEqual(oracleState.length,1842,'oracle replay length changed');
const m90=stateMetric(js.states,oracleState,90),m150=stateMetric(js.states,oracleState,150),mOverlap=stateMetric(js.states,oracleState,Math.min(js.states.length,oracleState.length));
assert(m90.maxPosition<.003,'fullgame first 90 frames regressed beyond known M7 envelope');
assert(m90.maxVelocity<.03,'fullgame first 90-frame velocity regressed beyond known M7 envelope');
assert(mOverlap.first1mm===407,`M9 1 mm boundary moved unexpectedly: ${mOverlap.first1mm}`);
assert(mOverlap.first5mm===433,`M9 5 mm boundary moved unexpectedly: ${mOverlap.first5mm}`);
assert(mOverlap.first10mm===437,`M9 1 cm boundary moved unexpectedly: ${mOverlap.first10mm}`);
assert(mOverlap.firstVelocitySignificant===434,`M9 significant velocity boundary moved unexpectedly: ${mOverlap.firstVelocitySignificant}`);
const postM9Mismatch=frameContactMismatch(oracleContacts,js.contactEvents,403);
assert(postM9Mismatch&&postM9Mismatch.frame===434,'existing pre-434 world-state drift still creates a native/JS callback divergence at 434');
// M10's additional right-wall CCD must not make the ball tunnel out of the playable table.
const bounds={minX:Math.min(...js.states.map(s=>s.x)),maxX:Math.max(...js.states.map(s=>s.x))};
assert(bounds.minX>-.02&&bounds.maxX<P.constants.W+P.constants.BALL_R,`ball escaped horizontally: ${JSON.stringify(bounds)}`);
// After the non-parity branch the fixed script never sends a second plunge;
// player-initiated relaunch from the original launch lane must remain functional.
const returnToLane=js.states.find(s=>s.frame>800&&s.x>.70&&s.y<P.constants.BALL_R*2);
assert(returnToLane,'M10 replay did not reach its expected manual-relaunch state');
const rescue=new P.Engine(pf);Object.assign(rescue.ball,{x:returnToLane.x,y:returnToLane.y,vx:returnToLane.vx,vy:returnToLane.vy});
const velocityBefore=rescue.ball.vy;
assert(rescue.plunge(2000),'player plunge must work after the ball returns to launch lane');
assert(Math.abs((rescue.ball.vy-velocityBefore)-P.constants.PLUNGE_DV)<1e-9,'relaunch impulse changed');
const report={
  generatedBy:'tests/fullgame.js',
  oracle:{frames:oracleState.length,seconds:oracleState.length/60,events:oracleEvents.length,highLevelEvents:oracleHigh.length,finalScore:oracleState.at(-1).score,drainFrames:oracleDrains.map(e=>e.frame)},
  js:{frames:js.states.length,seconds:js.states.length/60,highLevelEvents:jsHigh.length,finalScore:js.score,ballsPlayed:js.ballsPlayed,drainFrames:jsDrains.map(e=>e.frame),horizontalBounds:bounds,manualRelaunchAvailableAtFrame:returnToLane.frame},
  metrics:{first90:m90,first150:m150,overlap:mOverlap,frame133:stateErrorAt(js.states,oracleState,133),frame182:stateErrorAt(js.states,oracleState,182),frame305:stateErrorAt(js.states,oracleState,305),frame380:stateErrorAt(js.states,oracleState,380),frame402:stateErrorAt(js.states,oracleState,402),frame434:stateErrorAt(js.states,oracleState,434)},
  firstHighLevelEventMismatch:firstEventMismatch(oracleHigh,jsHigh),
  firstScoringEventMismatch:firstScoringMismatch(oracleHigh,jsHigh),
  contacts:{rawFirstFrameMismatch:frameContactMismatch(oracleContacts,js.contactEvents,0),firstFrameMismatchAfterM9Targets:postM9Mismatch,jsDiagnosticEvents:js.contactEvents.length},
  m7Baseline:{first1mm:87,first5mm:118,first10mm:153,firstVelocitySignificant:133,significantVelocityThreshold:SIGNIFICANT_VELOCITY_ERROR,jsDrainFrames:[889,1790,2691],jsFinalScore:60},
  m8Baseline:{first1mm:87,first5mm:118,first10mm:169,firstVelocitySignificant:182,firstScoringMismatch:183,significantVelocityThreshold:SIGNIFICANT_VELOCITY_ERROR},
  boundaries:{flipperCorner:{frame:57,status:'isolated parity achieved'},obstacle7:{frame:133,status:'full-world TOI regression protected'},sling5:{frame:182,status:'multi-contact TOI island reconstructed'},sling9:{frame:305,status:'reactive-seeded multi-contact TOI reconstructed'},leftWall:{frame:317,status:'sweep-born TOI path reconstructed'},obstacle8:{frame:380,status:'float32 x10 TOI position branch reconstructed'},rightFlipperTOI:{frame:402,status:'dynamic ball/flipper TOI island reconstructed'},nextMaterialBoundary:{frame:434,label:'flipper-right:poly',note:'M10 matches isolated native pre-impact state, but upstream full-world drift prevents the JS replay from reaching the same collision in this frame; complete game-level parity is not claimed'},rightWall:{status:'swept CCD restored and independently checked against native JAR; maintains ball within horizontal board bounds'}}
};
console.log('M10 full-table differential gates passed (no claim of full-game parity)');
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write')){
  const dir=path.join(__dirname,'../reports');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'fullgame-differential.json'),JSON.stringify(report,null,2)+'\n');
  const csv=['frame,event,label',...js.contactEvents.map(e=>`${e.frame},${e.event},${e.label}`)].join('\n')+'\n';fs.writeFileSync(path.join(dir,'fullgame-js-contact-events.csv'),csv);
}
