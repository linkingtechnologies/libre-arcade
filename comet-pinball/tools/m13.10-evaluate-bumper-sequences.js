'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),P=require('../public/js/physics.js');
const root=path.resolve(__dirname,'..'),sb={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/playfield.js'),'utf8'),sb);
const native=fs.readFileSync(path.join(root,'reports/M13.10-native-bumper-sequences.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(s=>s.split(',').map(Number));
function grossEscape(ball){const {x,y}=ball,margin=.004;if(y>1.40+P.constants.BALL_R+margin)return true;
  if(x<.30&&y>1.10&&Math.hypot(x-.30,y-1.10)>.295+P.constants.BALL_R+margin)return true;
  if(x>.46&&y>1.10&&Math.hypot(x-.46,y-1.10)>.295+P.constants.BALL_R+margin)return true;
  return false;
}
let nativeEscapeScenarios=0,jsEscapeScenarios=0,nativeEscapeFrames=0,jsEscapeFrames=0,jsCurveEvents=0,jsBumperHitScenarios=0;
const details=[];
for(const bumper of sb.window.COMET_PLAYFIELD.bumpers){for(const initialVX of [-1,0,1]){
  const oracle=native.filter(r=>r[0]===bumper.id&&r[1]===initialVX),e=new P.Engine(sb.window.COMET_PLAYFIELD);
  Object.assign(e.ball,{x:bumper.x,y:bumper.y+bumper.r+P.constants.BALL_R-.0002,vx:initialVX,vy:3,omega:0});
  let nhits=0,jhits=0,nEsc=0,jEsc=0,curves=0,maxPosErr=0;
  for(const [,,frame,nx,ny,,,hits] of oracle){
    e.step(1/60,(frame-1)*1000/60,{left:false,right:false,plunge:false},{onHit:()=>jhits++});
    const b=e.ball; if(grossEscape({x:nx,y:ny}))nEsc++;if(grossEscape(b))jEsc++;
    if(e.lastTopCurveTOI)curves++;
    maxPosErr=Math.max(maxPosErr,Math.hypot(b.x-nx,b.y-ny));nhits=hits;
  }
  nativeEscapeFrames+=nEsc;jsEscapeFrames+=jEsc;nativeEscapeScenarios+=+(nEsc>0);jsEscapeScenarios+=+(jEsc>0);jsCurveEvents+=curves;jsBumperHitScenarios+=+(jhits>0);
  details.push({bumperId:bumper.id,initialVX,nativeHitCount:nhits,jsHitCount:jhits,nativeEscapeFrames:nEsc,jsEscapeFrames:jEsc,jsCurveEvents:curves,maxPositionDifference:maxPosErr});
}}
const result={total:details.length,frames:details.length*45,nativeEscapeScenarios,jsEscapeScenarios,nativeEscapeFrames,jsEscapeFrames,jsCurveEvents,jsBumperHitScenarios,details};
fs.writeFileSync(path.join(root,'reports/M13.10-bumper-sequence-summary.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
